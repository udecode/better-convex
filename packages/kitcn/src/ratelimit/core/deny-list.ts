import type { LimitRequest, ProtectionLists } from '../types';

const DEFAULT_BLOCK_MS = 60_000;
const THRESHOLD_BLOCK_MS = 24 * 60 * 60 * 1000;

/**
 * Only failures inside this rolling window count toward the threshold. Without
 * decay `hits` is an all-time counter, so any shared
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

/** Bound timestamp storage even when applications configure a high threshold. */
const MAX_TRACKED_HITS = 65_536;

/** Ceiling on a stored key so attacker-chosen value length cannot inflate cost. */
const MAX_MEMBER_KEY_LENGTH = 128;

/**
 * Sweeping expired entries is O(tracked members), so it runs on an interval
 * rather than per denial — the hot path under a flood is the denial path.
 * Correctness does not depend on it: an expired hit already reads as absent.
 */
const PRUNE_INTERVAL_MS = 30_000;

type ProtectionMember = {
  blockedUntil?: number;
  hits: number[];
};

type ProtectionEntry = {
  hitCount: number;
  members: Map<string, ProtectionMember>;
  nextPruneAt: number;
};

const protectionState = new Map<string, ProtectionEntry>();

function getState(prefix: string): ProtectionEntry {
  let state = protectionState.get(prefix);
  if (!state) {
    state = { hitCount: 0, members: new Map(), nextPruneAt: 0 };
    protectionState.set(prefix, state);
  }
  return state;
}

/**
 * Storage key for a member value. Overlong values are truncated and tagged with
 * their length and hash, so a long forged header cannot inflate retained state
 * or share protection state with another value that has the same prefix.
 */
function memberKey(value: string): string {
  if (value.length <= MAX_MEMBER_KEY_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_MEMBER_KEY_LENGTH)}#${value.length}:${hashMember(value)}`;
}

function hashMember(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < value.length; index++) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }

  return hash.toString(16).padStart(16, '0');
}

function pruneExpired(state: ProtectionEntry, now: number): void {
  const cutoff = now - HITS_WINDOW_MS;
  for (const [key, member] of state.members) {
    const retainedHits = member.hits.filter((hitAt) => hitAt > cutoff);
    state.hitCount -= member.hits.length - retainedHits.length;
    member.hits = retainedHits;
    if (member.blockedUntil !== undefined && member.blockedUntil <= now) {
      member.blockedUntil = undefined;
    }
    if (member.hits.length === 0 && member.blockedUntil === undefined) {
      state.members.delete(key);
    }
  }
}

function evictLeastRecentHitOnly(state: ProtectionEntry): boolean {
  for (const [key, member] of state.members) {
    if (member.blockedUntil !== undefined) {
      continue;
    }
    state.hitCount -= member.hits.length;
    member.hits = [];
    state.members.delete(key);
    return true;
  }

  return false;
}

function evictLeastRecentMember(state: ProtectionEntry): void {
  for (const [key, member] of state.members) {
    state.hitCount -= member.hits.length;
    member.hits = [];
    state.members.delete(key);
    return;
  }
}

function getMember(state: ProtectionEntry, key: string): ProtectionMember {
  const existing = state.members.get(key);
  if (existing) {
    state.members.delete(key);
    state.members.set(key, existing);
    return existing;
  }

  if (
    state.members.size >= MAX_TRACKED_MEMBERS &&
    !evictLeastRecentHitOnly(state)
  ) {
    evictLeastRecentMember(state);
  }
  const member = { hits: [] };
  state.members.set(key, member);
  return member;
}

function recordHit(
  state: ProtectionEntry,
  key: string,
  threshold: number,
  now: number
): void {
  const member = getMember(state, key);
  const cutoff = now - HITS_WINDOW_MS;
  const retainedHits = member.hits.filter((hitAt) => hitAt > cutoff);
  state.hitCount -= member.hits.length - retainedHits.length;
  member.hits = retainedHits;

  while (state.hitCount >= MAX_TRACKED_HITS && evictLeastRecentHitOnly(state)) {
    // Keep evicting the least-recent member until one timestamp fits.
  }

  if (!state.members.has(key)) {
    state.members.set(key, member);
  }
  member.hits.push(now);
  state.hitCount += 1;

  if (member.hits.length >= threshold) {
    member.blockedUntil = now + THRESHOLD_BLOCK_MS;
    state.hitCount -= member.hits.length;
    member.hits = [];
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

  if (now >= state.nextPruneAt) {
    pruneExpired(state, now);
    state.nextPruneAt = now + PRUNE_INTERVAL_MS;
  }

  for (const member of members) {
    const key = memberKey(member.value);
    const tracked = state.members.get(key);
    if (tracked?.blockedUntil && tracked.blockedUntil > now) {
      state.members.delete(key);
      state.members.set(key, tracked);
      return member.value;
    }
    if (tracked?.blockedUntil && tracked.blockedUntil <= now) {
      tracked.blockedUntil = undefined;
      if (tracked.hits.length === 0) {
        state.members.delete(key);
      }
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
      const tracked = getMember(state, memberKey(hit.value));
      tracked.blockedUntil = now + DEFAULT_BLOCK_MS;
      state.hitCount -= tracked.hits.length;
      tracked.hits = [];
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
  const member = state.members.get(key);
  state.hitCount -= member?.hits.length ?? 0;
  state.members.delete(key);
}

/** Drops all in-memory protection state. Tests share one module instance. */
export function resetProtectionState(): void {
  protectionState.clear();
}

/** Number of tracked members for a prefix. Test/diagnostic accessor. */
export function protectionStateSize(prefix: string): {
  hits: number;
  blocked: number;
  failures: number;
} {
  const state = protectionState.get(prefix);
  let blocked = 0;
  let hits = 0;
  for (const member of state?.members.values() ?? []) {
    if (member.blockedUntil !== undefined) {
      blocked += 1;
    }
    if (member.hits.length > 0) {
      hits += 1;
    }
  }
  return {
    blocked,
    failures: state?.hitCount ?? 0,
    hits,
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
