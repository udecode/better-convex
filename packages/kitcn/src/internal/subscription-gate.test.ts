import {
  canSubscribeQuery,
  isAuthBoundQuery,
  isQueryDisabled,
  type SubscriptionGateQuery,
} from './subscription-gate';

function makeQuery(
  overrides: Partial<{
    disabled: boolean;
    meta: unknown;
    observers: number;
  }> = {}
): SubscriptionGateQuery {
  const {
    disabled = false,
    meta = { subscribe: true },
    observers = 1,
  } = overrides;

  return {
    getObserversCount: () => observers,
    isDisabled: () => disabled,
    meta,
  };
}

const allow = () => false;

describe('internal/subscription-gate', () => {
  test('isAuthBoundQuery matches required and optional auth', () => {
    expect(isAuthBoundQuery(makeQuery({ meta: { authType: 'required' } }))).toBe(
      true
    );
    expect(isAuthBoundQuery(makeQuery({ meta: { authType: 'optional' } }))).toBe(
      true
    );
    expect(isAuthBoundQuery(makeQuery({ meta: {} }))).toBe(false);
    expect(isAuthBoundQuery(makeQuery({ meta: undefined }))).toBe(false);
  });

  test('isQueryDisabled delegates to query-core', () => {
    expect(isQueryDisabled(makeQuery({ disabled: true }))).toBe(true);
    expect(isQueryDisabled(makeQuery({ disabled: false }))).toBe(false);
  });

  test('allows a subscription when every precondition passes', () => {
    expect(
      canSubscribeQuery(makeQuery(), {
        isSubscribed: false,
        shouldSkipSubscription: allow,
      })
    ).toBe(true);
  });

  test('blocks when already subscribed', () => {
    expect(
      canSubscribeQuery(makeQuery(), {
        isSubscribed: true,
        shouldSkipSubscription: allow,
      })
    ).toBe(false);
  });

  test('blocks when meta.subscribe is false', () => {
    expect(
      canSubscribeQuery(makeQuery({ meta: { subscribe: false } }), {
        isSubscribed: false,
        shouldSkipSubscription: allow,
      })
    ).toBe(false);
  });

  test('blocks when the query has no observers', () => {
    expect(
      canSubscribeQuery(makeQuery({ observers: 0 }), {
        isSubscribed: false,
        shouldSkipSubscription: allow,
      })
    ).toBe(false);
  });

  test('blocks when query-core reports the query disabled', () => {
    expect(
      canSubscribeQuery(makeQuery({ disabled: true }), {
        isSubscribed: false,
        shouldSkipSubscription: allow,
      })
    ).toBe(false);
  });

  test('blocks when auth gating says to wait', () => {
    const shouldSkipSubscription = mock(
      (authType: 'optional' | 'required' | undefined) => authType === 'required'
    );

    expect(
      canSubscribeQuery(makeQuery({ meta: { authType: 'required' } }), {
        isSubscribed: false,
        shouldSkipSubscription,
      })
    ).toBe(false);
    expect(shouldSkipSubscription).toHaveBeenCalledWith('required');
  });

  test('checks the observer count before asking query-core about enabled', () => {
    // A query with no observers reports `isDisabled() === true` while it is
    // merely unobserved; the observer guard must win so the meaning stays
    // "nothing is watching" rather than "the caller disabled it".
    const isDisabled = mock(() => true);
    const query: SubscriptionGateQuery = {
      getObserversCount: () => 0,
      isDisabled,
      meta: { subscribe: true },
    };

    expect(
      canSubscribeQuery(query, {
        isSubscribed: false,
        shouldSkipSubscription: allow,
      })
    ).toBe(false);
    expect(isDisabled).toHaveBeenCalledTimes(0);
  });
});
