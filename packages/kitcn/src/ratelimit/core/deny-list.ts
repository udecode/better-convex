import type { LimitRequest, ProtectionLists } from '../types';

const DEFAULT_BLOCK_MS = 60_000;
const THRESHOLD_BLOCK_MS = 24 * 60 * 60 * 1000;

/**
 * Failures stop counting toward the threshold once this window elapses without
 * a new failure. Without decay `hits` is an all-time counter, so any shared
 * NAT/carrier IP eventually accumulates `denyListThreshold` lifetime failures
 * and blocks every user behind it.
 */
const HITS_WINDOW_MS = 10 * 60 * 1000;

/**
 * Hard ceiling on tracked members per prefix. `userAgent` is an
 * attacker-forgeable header, so without a cap one source can plant an unbounded
 * number of permanent entries in this module-scope map.
 */
const MAX_TRACKED_MEMBERS = 4096;

/** Ceiling on a stored key so attacker-chosen value length cannot inflate cost. */
const MAX_MEMBER_KEY_LENGTH = 128;

/**
 * Sweeping expired entries is O(tracked members), so it runs on an interval
 * rather than per denial — the hot path under a flood is the denial path.
 * Correctness does not depend on it: an expired hit already reads as absent.
 */
const PRUNE_INTERVAL_MS = 30_000;

type Hit = {
  count: number;
  windowEnd: number;
};

type ProtectionEntry = {
  hits: Map<string, Hit>;
  blockedUntil: Map<string, number>;
  nextPruneAt: number;
};

const protectionState = new Map<string, ProtectionEntry>();

function getState(prefix: string): ProtectionEntry {
  let state = protectionState.get(prefix);
  if (!state) {
    state = { hits: new Map(), blockedUntil: new Map(), nextPruneAt: 0 };
    protectionState.set(prefix, state);
  }
  return state;
}

/**
 * Storage key for a member value. Overlong values are truncated and tagged with
 * their original length, so two values only share a counter when they share
 * both a 128-character prefix and a length.
 */
function memberKey(value: string): string {
  if (value.length <= MAX_MEMBER_KEY_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_MEMBER_KEY_LENGTH)}#${value.length}`;
}

function pruneExpired(state: ProtectionEntry, now: number): void {
  for (const [key, hit] of state.hits) {
    if (hit.windowEnd <= now) {
      state.hits.delete(key);
    }
  }
  for (const [key, until] of state.blockedUntil) {
    if (until <= now) {
      state.blockedUntil.delete(key);
    }
  }
}

function evictLeastRecent(hits: Map<string, Hit>): void {
  for (const key of hits.keys()) {
    hits.delete(key);
    return;
  }
}

function recordHit(
  state: ProtectionEntry,
  key: string,
  threshold: number,
  now: number
): void {
  const previous = state.hits.get(key);
  const count =
    previous !== undefined && previous.windowEnd > now ? previous.count + 1 : 1;

  // Re-insert so Map iteration order is least-recently-hit first, making
  // eviction drop cold members instead of the ones under active attack.
  state.hits.delete(key);
  if (state.hits.size >= MAX_TRACKED_MEMBERS) {
    evictLeastRecent(state.hits);
  }
  state.hits.set(key, { count, windowEnd: now + HITS_WINDOW_MS });

  if (count >= threshold) {
    state.blockedUntil.set(key, now + THRESHOLD_BLOCK_MS);
  }
}

export function pickDeniedValue(options: {
  prefix: string;
  identifier: string;
  request?: LimitRequest;
  lists?: ProtectionLists;
}): string | undefined {
  const members = getMembers(options.identifier, options.request);
  const state = getState(options.prefix);
  const now = Date.now();

  for (const member of members) {
    const key = memberKey(member.value);
    const until = state.blockedUntil.get(key);
    if (until && until > now) {
      return member.value;
    }
    if (until && until <= now) {
      state.blockedUntil.delete(key);
    }
  }

  if (!options.lists) {
    return undefined;
  }

  const listMatchers: Array<{
    values: readonly string[] | undefined;
    kind: MemberKind;
  }> = [
    { values: options.lists.identifiers, kind: 'identifier' },
    { values: options.lists.ips, kind: 'ip' },
    { values: options.lists.userAgents, kind: 'userAgent' },
    { values: options.lists.countries, kind: 'country' },
  ];

  for (const matcher of listMatchers) {
    if (!matcher.values || matcher.values.length === 0) {
      continue;
    }
    const valueSet = new Set(matcher.values);
    const hit = members.find(
      (member) => member.kind === matcher.kind && valueSet.has(member.value)
    );
    if (hit) {
      state.blockedUntil.set(memberKey(hit.value), now + DEFAULT_BLOCK_MS);
      return hit.value;
    }
  }

  return undefined;
}

export function recordRatelimitFailure(options: {
  prefix: string;
  identifier: string;
  request?: LimitRequest;
  threshold: number;
}): void {
  const members = getMembers(options.identifier, options.request);
  const state = getState(options.prefix);
  const now = Date.now();

  if (now >= state.nextPruneAt) {
    pruneExpired(state, now);
    state.nextPruneAt = now + PRUNE_INTERVAL_MS;
  }

  for (const member of members) {
    recordHit(state, memberKey(member.value), options.threshold, now);
  }
}

/**
 * Clears the identifier only. Widening this to every request member would let
 * an attacker reset their own ip/userAgent counters with a single success, or
 * clear a victim's counter by forging their user-agent.
 */
export function clearProtection(prefix: string, identifier: string): void {
  const state = getState(prefix);
  const key = memberKey(identifier);
  state.hits.delete(key);
  state.blockedUntil.delete(key);
}

/** Drops all in-memory protection state. Tests share one module instance. */
export function resetProtectionState(): void {
  protectionState.clear();
}

/** Number of tracked members for a prefix. Test/diagnostic accessor. */
export function protectionStateSize(prefix: string): {
  hits: number;
  blocked: number;
} {
  const state = protectionState.get(prefix);
  return {
    blocked: state?.blockedUntil.size ?? 0,
    hits: state?.hits.size ?? 0,
  };
}

type MemberKind = 'identifier' | 'ip' | 'userAgent' | 'country';

function getMembers(
  identifier: string,
  request?: LimitRequest
): Array<{
  kind: MemberKind;
  value: string;
}> {
  const members: Array<{ kind: MemberKind; value: string | undefined }> = [
    { kind: 'identifier', value: identifier },
    { kind: 'ip', value: request?.ip },
    { kind: 'userAgent', value: request?.userAgent },
    { kind: 'country', value: request?.country },
  ];

  return members.filter(
    (member): member is { kind: MemberKind; value: string } =>
      Boolean(member.value)
  );
}
