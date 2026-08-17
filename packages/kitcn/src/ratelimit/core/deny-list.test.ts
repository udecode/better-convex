import {
  afterAll,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from 'bun:test';
import {
  clearProtection,
  pickDeniedValue,
  protectionStateSize,
  recordRatelimitFailure,
  resetProtectionState,
} from './deny-list';

const PREFIX = 'ratelimit:test:public';
const HITS_WINDOW_MS = 10 * 60 * 1000;
const THRESHOLD_BLOCK_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_MEMBERS = 4096;

const base = { prefix: PREFIX, threshold: 3 };

const INITIAL_NOW = 1_000_000;

beforeEach(() => {
  resetProtectionState();
  setSystemTime(INITIAL_NOW);
});

afterAll(() => {
  setSystemTime();
  resetProtectionState();
});

function advanceTime(ms: number): void {
  setSystemTime(Date.now() + ms);
}

describe('deny-list protection state', () => {
  test('blocks a value once it reaches the threshold inside the window', () => {
    for (let i = 0; i < 3; i++) {
      recordRatelimitFailure({
        ...base,
        identifier: 'user-1',
        request: { ip: '10.0.0.1' },
      });
    }

    expect(pickDeniedValue({ prefix: PREFIX, identifier: 'user-1' })).toBe(
      'user-1'
    );
    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'someone-else',
        request: { ip: '10.0.0.1' },
      })
    ).toBe('10.0.0.1');
  });

  test('hits decay, so failures paced outside the window never block', () => {
    for (let i = 0; i < 10; i++) {
      recordRatelimitFailure({ ...base, identifier: 'paced' });
      advanceTime(HITS_WINDOW_MS + 1);
    }

    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'paced' })
    ).toBeUndefined();
  });

  test('counts only failures inside the rolling window', () => {
    recordRatelimitFailure({ ...base, identifier: 'rolling' });
    advanceTime(9 * 60 * 1000);
    recordRatelimitFailure({ ...base, identifier: 'rolling' });
    advanceTime(2 * 60 * 1000);
    recordRatelimitFailure({ ...base, identifier: 'rolling' });

    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'rolling' })
    ).toBeUndefined();
  });

  test('an expired block stops denying', () => {
    for (let i = 0; i < 3; i++) {
      recordRatelimitFailure({ ...base, identifier: 'temp' });
    }
    expect(pickDeniedValue({ prefix: PREFIX, identifier: 'temp' })).toBe(
      'temp'
    );

    advanceTime(THRESHOLD_BLOCK_MS + 1);
    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'temp' })
    ).toBeUndefined();
  });

  test('tracked members stay bounded when a flood forges distinct user agents', () => {
    for (let i = 0; i < MAX_TRACKED_MEMBERS + 500; i++) {
      recordRatelimitFailure({
        prefix: PREFIX,
        threshold: Number.MAX_SAFE_INTEGER,
        identifier: 'anonymous',
        request: { ip: '10.0.0.1', userAgent: `forged-${i}` },
      });
    }

    expect(protectionStateSize(PREFIX).hits).toBeLessThanOrEqual(
      MAX_TRACKED_MEMBERS
    );
  });

  test('blocked members stay bounded under a distributed flood', () => {
    for (let i = 0; i < MAX_TRACKED_MEMBERS; i++) {
      recordRatelimitFailure({
        prefix: PREFIX,
        threshold: 1,
        identifier: `blocked-${i}`,
      });
    }

    for (let i = 0; i < 500; i++) {
      pickDeniedValue({ prefix: PREFIX, identifier: 'blocked-0' });
      recordRatelimitFailure({
        prefix: PREFIX,
        threshold: 1,
        identifier: `overflow-${i}`,
      });
    }

    expect(protectionStateSize(PREFIX).blocked).toBeLessThanOrEqual(
      MAX_TRACKED_MEMBERS
    );
    expect(pickDeniedValue({ prefix: PREFIX, identifier: 'blocked-0' })).toBe(
      'blocked-0'
    );
    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'overflow-499' })
    ).toBe('overflow-499');
  });

  test('rolling failure timestamps stay globally bounded', () => {
    const threshold = 1000;
    for (let round = 0; round < 20; round++) {
      for (let member = 0; member < MAX_TRACKED_MEMBERS; member++) {
        recordRatelimitFailure({
          prefix: PREFIX,
          threshold,
          identifier: `distributed-${member}`,
        });
      }
    }

    expect(protectionStateSize(PREFIX).failures).toBeLessThanOrEqual(65_536);
  });

  test('eviction drops cold members, not the ones under active attack', () => {
    const threshold = MAX_TRACKED_MEMBERS + 100;

    // Fill far past the cap while re-hitting one identifier every request.
    for (let i = 0; i < threshold; i++) {
      recordRatelimitFailure({
        prefix: PREFIX,
        threshold,
        identifier: 'attacker',
        request: { userAgent: `forged-${i}` },
      });
    }

    // Only reachable if `attacker` kept its count across all the evictions.
    expect(pickDeniedValue({ prefix: PREFIX, identifier: 'attacker' })).toBe(
      'attacker'
    );
    expect(protectionStateSize(PREFIX).hits).toBeLessThanOrEqual(
      MAX_TRACKED_MEMBERS
    );
  });

  test('overlong values still match on the read path after truncation', () => {
    const longAgent = `${'a'.repeat(10_000)}-one`;
    const otherAgent = `${'a'.repeat(10_000)}-two`;

    recordRatelimitFailure({
      ...base,
      threshold: 1,
      identifier: 'user-2',
      request: { userAgent: longAgent },
    });

    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'other-user',
        request: { userAgent: longAgent },
      })
    ).toBe(longAgent);
    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'other-user',
        request: { userAgent: otherAgent },
      })
    ).toBeUndefined();
  });

  test('clearProtection removes only the identifier, never forgeable members', () => {
    for (let i = 0; i < 3; i++) {
      recordRatelimitFailure({
        ...base,
        identifier: 'user-3',
        request: { ip: '10.0.0.9', userAgent: 'BadBot/1.0' },
      });
    }

    clearProtection(PREFIX, 'user-3');

    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'user-3' })
    ).toBeUndefined();
    // A success must not let an attacker clear ip/userAgent counters, or a
    // 29-denials-then-1-success loop would never reach the threshold.
    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'fresh-user',
        request: { ip: '10.0.0.9' },
      })
    ).toBe('10.0.0.9');
    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'fresh-user',
        request: { userAgent: 'BadBot/1.0' },
      })
    ).toBe('BadBot/1.0');
  });

  test('static deny lists still match and report the raw value', () => {
    expect(
      pickDeniedValue({
        prefix: PREFIX,
        identifier: 'user-4',
        request: { ip: '203.0.113.7' },
        lists: { ips: ['203.0.113.7'] },
      })
    ).toBe('203.0.113.7');
  });

  test('resetProtectionState clears every prefix', () => {
    for (let i = 0; i < 3; i++) {
      recordRatelimitFailure({ ...base, identifier: 'user-5' });
    }
    expect(protectionStateSize(PREFIX).blocked).toBeGreaterThan(0);

    resetProtectionState();

    expect(protectionStateSize(PREFIX)).toEqual({
      blocked: 0,
      failures: 0,
      hits: 0,
    });
    expect(
      pickDeniedValue({ prefix: PREFIX, identifier: 'user-5' })
    ).toBeUndefined();
  });
});
