/** @jsxImportSource solid-js */
/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import { render, renderHook } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import { describe, expect, test, vi } from 'vitest';
import {
  Authenticated,
  AuthProvider,
  ConvexAuthBridge,
  decodeJwtExp,
  MaybeAuthenticated,
  MaybeUnauthenticated,
  Unauthenticated,
  useAuth,
  useAuthGuard,
  useAuthValue,
  useSafeConvexAuth,
} from './auth-store';

const makeJwt = (payload: Record<string, unknown>) => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' })
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
};

describe('decodeJwtExp', () => {
  test('returns expiration in milliseconds when exp claim exists', () => {
    const token = makeJwt({ exp: 1_700_000_000 });
    expect(decodeJwtExp(token)).toBe(1_700_000_000_000);
  });

  test('returns null when exp claim is missing', () => {
    const token = makeJwt({ sub: 'user-1' });
    expect(decodeJwtExp(token)).toBeNull();
  });

  test('decodes base64url payloads carrying non-ASCII claims', () => {
    // Better Auth embeds user.name/user.email in the Convex JWT payload, so
    // multi-byte characters routinely push `-`/`_` into the payload segment.
    const token = makeJwt({
      email: 'zoe@example.com',
      exp: 1_786_000_900,
      name: 'Zoë 🌍 佐藤',
      sessionId: 'sess_1',
    });

    const payload = token.split('.')[1] ?? '';
    expect(payload.includes('-') || payload.includes('_')).toBe(true);
    expect(decodeJwtExp(token)).toBe(1_786_000_900_000);
  });

  test('returns null for malformed tokens', () => {
    expect(decodeJwtExp('not-a-jwt')).toBeNull();
  });
});

describe('useSafeConvexAuth / useAuth', () => {
  function makeAuthWrapper(initialValues?: Record<string, unknown>) {
    return (props: { children: JSX.Element }) => (
      <AuthProvider initialValues={initialValues as any}>
        {props.children}
      </AuthProvider>
    );
  }

  test('useSafeConvexAuth returns defaults when no auth is configured', () => {
    const { result } = renderHook(() => useSafeConvexAuth());
    expect(result).toEqual({
      identity: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  test('useSafeConvexAuth + useAuth use ConvexAuthBridge when present', () => {
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthBridge
        identity="account-a"
        isAuthenticated={true}
        isLoading={false}
      >
        {props.children}
      </ConvexAuthBridge>
    );

    const { result: safeAuth } = renderHook(() => useSafeConvexAuth(), {
      wrapper,
    });
    expect(safeAuth).toEqual({
      identity: 'account-a',
      isAuthenticated: true,
      isLoading: false,
    });

    const { result: auth } = renderHook(() => useAuth(), { wrapper });
    expect(auth).toEqual({
      hasSession: false,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  test('useSafeConvexAuth keeps Convex settlement authoritative with AuthProvider', () => {
    const wrapper = (props: { children: JSX.Element }) => (
      <AuthProvider initialValues={{ isAuthenticated: true, isLoading: false }}>
        <ConvexAuthBridge
          identity="account-a"
          isAuthenticated={false}
          isLoading={true}
        >
          {props.children}
        </ConvexAuthBridge>
      </AuthProvider>
    );

    const { result } = renderHook(() => useSafeConvexAuth(), { wrapper });

    expect(result).toEqual({
      identity: 'account-a',
      isAuthenticated: false,
      isLoading: true,
    });
  });

  test('useAuthValue reads the custom Convex auth epoch without AuthProvider', () => {
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthBridge
        authEpoch={7}
        identity="account-b"
        isAuthenticated={true}
        isLoading={false}
      >
        {props.children}
      </ConvexAuthBridge>
    );

    const { result } = renderHook(() => useAuthValue('authEpoch'), { wrapper });

    expect(result).toBe(7);
  });

  test('useAuth (AuthProvider): hasSession reflects token and reads auth state', () => {
    const wrapper = makeAuthWrapper({
      token: 'tok',
      isLoading: true,
      isAuthenticated: false,
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result).toEqual({
      hasSession: true,
      isAuthenticated: false,
      isLoading: true,
    });
  });
});

describe('useAuthGuard', () => {
  function makeAuthWrapper(initialValues?: Record<string, unknown>) {
    return (props: { children: JSX.Element }) => (
      <AuthProvider initialValues={initialValues as any}>
        {props.children}
      </AuthProvider>
    );
  }

  test('calls onMutationUnauthorized and returns true when unauthenticated', () => {
    const onMutationUnauthorized = vi.fn();
    const wrapper = makeAuthWrapper({
      token: 'tok',
      isAuthenticated: false,
      isLoading: false,
      onMutationUnauthorized,
    });

    const { result: guard } = renderHook(() => useAuthGuard(), { wrapper });

    expect(guard()).toBe(true);
    expect(onMutationUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('runs callback and returns false/undefined when authenticated', () => {
    const wrapper = makeAuthWrapper({
      token: 'tok',
      isAuthenticated: true,
      isLoading: false,
    });
    const callback = vi.fn();

    const { result: guard } = renderHook(() => useAuthGuard(), { wrapper });

    expect(guard()).toBe(false);
    expect(guard(callback as any)).toBeUndefined();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('Auth Components', () => {
  function makeAuthWrapper(initialValues?: Record<string, unknown>) {
    return (props: { children: JSX.Element }) => (
      <AuthProvider initialValues={initialValues as any}>
        {props.children}
      </AuthProvider>
    );
  }

  test('MaybeAuthenticated renders children when token exists', () => {
    const Wrapper = makeAuthWrapper({
      token: 'tok',
      isAuthenticated: false,
      isLoading: false,
    });

    const { queryByTestId } = render(() => (
      <Wrapper>
        <MaybeAuthenticated>
          <div data-testid="x">X</div>
        </MaybeAuthenticated>
      </Wrapper>
    ));

    expect(queryByTestId('x')).not.toBeNull();
  });

  test('MaybeUnauthenticated renders children when token is missing', () => {
    const Wrapper = makeAuthWrapper({
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    const { queryByTestId } = render(() => (
      <Wrapper>
        <MaybeUnauthenticated>
          <div data-testid="x">X</div>
        </MaybeUnauthenticated>
      </Wrapper>
    ));

    expect(queryByTestId('x')).not.toBeNull();
  });

  test('Authenticated renders children only when authenticated', () => {
    const Wrapper = makeAuthWrapper({
      token: 'tok',
      isAuthenticated: true,
      isLoading: false,
    });

    const { queryByTestId } = render(() => (
      <Wrapper>
        <Authenticated>
          <div data-testid="x">X</div>
        </Authenticated>
      </Wrapper>
    ));

    expect(queryByTestId('x')).not.toBeNull();
  });

  test('Unauthenticated renders children only when not loading and not authenticated', () => {
    const Wrapper = makeAuthWrapper({
      token: 'tok',
      isAuthenticated: false,
      isLoading: false,
    });

    const { queryByTestId } = render(() => (
      <Wrapper>
        <Unauthenticated>
          <div data-testid="x">X</div>
        </Unauthenticated>
      </Wrapper>
    ));

    expect(queryByTestId('x')).not.toBeNull();
  });
});
