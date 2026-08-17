/** @jsxImportSource solid-js */
/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as metaUtilsModule from '../shared/meta-utils';
import * as authStoreModule from './auth-store';
import { createCRPCContext } from './context';
import * as httpProxyModule from './http-proxy';
import * as proxyModule from './proxy';
import * as vanillaClientModule from './vanilla-client';

describe('context (solid)', () => {
  let _buildMetaIndexSpy: ReturnType<typeof vi.spyOn>;
  let _createCRPCOptionsProxySpy: ReturnType<typeof vi.spyOn>;
  let _createVanillaCRPCProxySpy: ReturnType<typeof vi.spyOn>;

  const mockProxy = { user: { get: { queryOptions: vi.fn() } } };
  const mockVanillaClient = { user: { get: { query: vi.fn() } } };
  const mockMeta = { users: { get: { type: 'query' } } };
  const createMockConvexQueryClient = () => {
    let authGeneration = 0;
    return {
      resetAuthQueries: vi.fn(
        async (options?: { generation?: number; refetch?: boolean }) => {
          if (options?.generation !== undefined) return options.generation;
          authGeneration += 1;
          return authGeneration;
        }
      ),
      updateAuthStore: vi.fn(),
    };
  };

  beforeEach(() => {
    _buildMetaIndexSpy = vi
      .spyOn(metaUtilsModule, 'buildMetaIndex')
      .mockReturnValue(mockMeta as any);
    _createCRPCOptionsProxySpy = vi
      .spyOn(proxyModule, 'createCRPCOptionsProxy')
      .mockReturnValue(mockProxy as any);
    _createVanillaCRPCProxySpy = vi
      .spyOn(vanillaClientModule, 'createVanillaCRPCProxy')
      .mockReturnValue(mockVanillaClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('createCRPCContext returns CRPCProvider, useCRPC, useCRPCClient', () => {
    const result = createCRPCContext({ api: {} as any });
    expect(result).toHaveProperty('CRPCProvider');
    expect(result).toHaveProperty('useCRPC');
    expect(result).toHaveProperty('useCRPCClient');
    expect(typeof result.CRPCProvider).toBe('function');
    expect(typeof result.useCRPC).toBe('function');
    expect(typeof result.useCRPCClient).toBe('function');
  });

  test('useCRPC throws outside provider', () => {
    const { useCRPC } = createCRPCContext({ api: {} as any });

    expect(() => {
      renderHook(() => useCRPC());
    }).toThrow('useCRPC must be used within CRPCProvider');
  });

  test('useCRPCClient throws outside provider', () => {
    const { useCRPCClient } = createCRPCContext({ api: {} as any });

    expect(() => {
      renderHook(() => useCRPCClient());
    }).toThrow('useCRPCClient must be used within CRPCProvider');
  });

  test('useCRPC returns proxy inside provider', () => {
    const { CRPCProvider, useCRPC } = createCRPCContext({ api: {} as any });

    const mockConvexClient = {} as any;
    const mockConvexQueryClient = createMockConvexQueryClient();

    const { result } = renderHook(() => useCRPC(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={mockConvexClient}
          convexQueryClient={mockConvexQueryClient}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    expect(result).toBe(mockProxy);
    expect(mockConvexQueryClient.updateAuthStore).toHaveBeenCalledWith(
      undefined
    );
  });

  test('syncs the auth store and resets queries on an identity transition', () => {
    const [identity, setIdentity] = createSignal<unknown>('account-a');
    const authStore = { get: vi.fn(), store: {} };
    vi.spyOn(authStoreModule, 'useAuthStore').mockReturnValue(authStore as any);
    vi.spyOn(authStoreModule, 'useSafeConvexAuth').mockImplementation(
      () =>
        ({
          get identity() {
            return identity();
          },
          isAuthenticated: true,
          isLoading: false,
        }) as any
    );
    const convexQueryClient = createMockConvexQueryClient();
    const { CRPCProvider, useCRPC } = createCRPCContext({ api: {} as any });

    renderHook(() => useCRPC(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={{} as any}
          convexQueryClient={convexQueryClient as any}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    expect(convexQueryClient.updateAuthStore).toHaveBeenCalledWith(authStore);
    expect(convexQueryClient.resetAuthQueries).toHaveBeenCalledTimes(1);

    setIdentity('account-b');

    expect(convexQueryClient.resetAuthQueries).toHaveBeenCalledTimes(2);
  });

  test('clears immediately but waits for Convex settlement before refetching', async () => {
    const [bridge, setBridge] = createSignal({
      identity: 'account-a' as string | null,
      isAuthenticated: true,
      isLoading: false,
    });
    vi.spyOn(authStoreModule, 'useConvexAuthBridge').mockImplementation(
      () =>
        ({
          get identity() {
            return bridge().identity;
          },
          get isAuthenticated() {
            return bridge().isAuthenticated;
          },
          get isLoading() {
            return bridge().isLoading;
          },
        }) as any
    );
    vi.spyOn(authStoreModule, 'useSafeConvexAuth').mockReturnValue({
      identity: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);
    const convexQueryClient = createMockConvexQueryClient();
    const { CRPCProvider, useCRPC } = createCRPCContext({ api: {} as any });

    renderHook(() => useCRPC(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={{} as any}
          convexQueryClient={convexQueryClient as any}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    expect(convexQueryClient.resetAuthQueries).toHaveBeenCalledTimes(1);

    setBridge({
      identity: 'account-a',
      isAuthenticated: true,
      isLoading: true,
    });

    expect(convexQueryClient.resetAuthQueries).toHaveBeenLastCalledWith({
      refetch: false,
    });

    setBridge({ identity: null, isAuthenticated: false, isLoading: false });

    await vi.waitFor(() => {
      expect(convexQueryClient.resetAuthQueries).toHaveBeenCalledTimes(3);
    });
    expect(convexQueryClient.resetAuthQueries).toHaveBeenLastCalledWith({
      generation: 2,
    });
  });

  test('does not settle an older transition after a newer one starts', async () => {
    const [bridge, setBridge] = createSignal({
      identity: 'account-a' as string | null,
      isAuthenticated: true,
      isLoading: false,
    });
    vi.spyOn(authStoreModule, 'useConvexAuthBridge').mockImplementation(
      () =>
        ({
          get identity() {
            return bridge().identity;
          },
          get isAuthenticated() {
            return bridge().isAuthenticated;
          },
          get isLoading() {
            return bridge().isLoading;
          },
        }) as any
    );
    vi.spyOn(authStoreModule, 'useSafeConvexAuth').mockReturnValue({
      identity: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    let resolveFirstClear: (generation: number) => void = () => {};
    const firstClear = new Promise<number>((resolve) => {
      resolveFirstClear = resolve;
    });
    let clearCalls = 0;
    const resetAuthQueries = vi.fn(
      async (options?: { generation?: number; refetch?: boolean }) => {
        if (options?.generation !== undefined) return options.generation;
        if (options?.refetch === false) {
          clearCalls += 1;
          return clearCalls === 1 ? firstClear : 3;
        }
        return 1;
      }
    );
    const convexQueryClient = {
      resetAuthQueries,
      updateAuthStore: vi.fn(),
    };
    const { CRPCProvider, useCRPC } = createCRPCContext({ api: {} as any });

    renderHook(() => useCRPC(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={{} as any}
          convexQueryClient={convexQueryClient as any}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    setBridge({
      identity: 'account-a',
      isAuthenticated: true,
      isLoading: true,
    });
    setBridge({
      identity: 'account-b',
      isAuthenticated: true,
      isLoading: false,
    });
    setBridge({
      identity: 'account-b',
      isAuthenticated: true,
      isLoading: true,
    });

    resolveFirstClear(2);
    await Promise.resolve();
    await Promise.resolve();

    expect(resetAuthQueries).not.toHaveBeenCalledWith({ generation: 2 });

    setBridge({
      identity: 'account-c',
      isAuthenticated: true,
      isLoading: false,
    });

    await vi.waitFor(() => {
      expect(resetAuthQueries).toHaveBeenCalledWith({ generation: 3 });
    });
  });

  test('useCRPCClient returns vanilla client inside provider', () => {
    const { CRPCProvider, useCRPCClient } = createCRPCContext({
      api: {} as any,
    });

    const mockConvexClient = {} as any;
    const mockConvexQueryClient = createMockConvexQueryClient();

    const { result } = renderHook(() => useCRPCClient(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={mockConvexClient}
          convexQueryClient={mockConvexQueryClient}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    expect(result).toBe(mockVanillaClient);
  });

  test('injects http namespace when http proxy is configured', () => {
    const httpProxyStub = { todos: { get: { queryKey: () => ['x'] } } };

    const useAuthStoreSpy = vi
      .spyOn(authStoreModule, 'useAuthStore')
      .mockReturnValue({ get: () => null } as any);
    const useFetchAccessTokenSpy = vi
      .spyOn(authStoreModule, 'useFetchAccessToken')
      .mockReturnValue(null);
    const createHttpProxySpy = vi
      .spyOn(httpProxyModule, 'createHttpProxy')
      .mockReturnValue(httpProxyStub as any);
    _createCRPCOptionsProxySpy.mockReturnValue({ foo: 'bar' } as any);
    _createVanillaCRPCProxySpy.mockReturnValue({ foo: 'baz' } as any);

    const meta = {
      _http: { 'todos.get': { method: 'GET', path: '/todos/:id' } },
    } as any;
    _buildMetaIndexSpy.mockReturnValue(meta);

    const api = { _http: meta._http } as any;
    const convexQueryClient = createMockConvexQueryClient();
    const convexClient = {} as any;

    const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
      api,
      convexSiteUrl: 'https://example.convex.site',
    });

    const { result: crpcResult } = renderHook(
      () => {
        const crpc = useCRPC() as any;
        return { foo: crpc.foo, http: crpc.http };
      },
      {
        wrapper: (props: any) => (
          <CRPCProvider
            convexClient={convexClient}
            convexQueryClient={convexQueryClient}
          >
            {props.children}
          </CRPCProvider>
        ),
      }
    );

    expect(crpcResult.foo).toBe('bar');
    expect(crpcResult.http).toBe(httpProxyStub);

    const { result: clientResult } = renderHook(
      () => {
        const client = useCRPCClient() as any;
        return { foo: client.foo, http: client.http };
      },
      {
        wrapper: (props: any) => (
          <CRPCProvider
            convexClient={convexClient}
            convexQueryClient={convexQueryClient}
          >
            {props.children}
          </CRPCProvider>
        ),
      }
    );

    expect(clientResult.foo).toBe('baz');
    expect(clientResult.http).toBe(httpProxyStub);

    expect(createHttpProxySpy).toHaveBeenCalled();
    const args = createHttpProxySpy.mock.calls[0]?.[0];
    expect(args).toMatchObject({
      convexSiteUrl: 'https://example.convex.site',
      routes: meta._http,
    });

    useAuthStoreSpy.mockRestore();
    useFetchAccessTokenSpy.mockRestore();
    createHttpProxySpy.mockRestore();
  });

  test('forwards transformer option to CRPC proxies', () => {
    const useAuthStoreSpy = vi
      .spyOn(authStoreModule, 'useAuthStore')
      .mockReturnValue({ get: () => null } as any);
    const useFetchAccessTokenSpy = vi
      .spyOn(authStoreModule, 'useFetchAccessToken')
      .mockReturnValue(null);
    _buildMetaIndexSpy.mockReturnValue({});

    const transformer = {
      serialize: (value: unknown) => value,
      deserialize: (value: unknown) => value,
    };
    const api = {} as any;
    const convexQueryClient = createMockConvexQueryClient();
    const convexClient = {} as any;

    const { CRPCProvider, useCRPC } = createCRPCContext({
      api,
      transformer,
    });

    renderHook(() => useCRPC(), {
      wrapper: (props: any) => (
        <CRPCProvider
          convexClient={convexClient}
          convexQueryClient={convexQueryClient}
        >
          {props.children}
        </CRPCProvider>
      ),
    });

    expect(_createCRPCOptionsProxySpy).toHaveBeenCalledWith(
      api,
      {},
      transformer
    );
    expect(_createVanillaCRPCProxySpy).toHaveBeenCalledWith(
      api,
      {},
      convexClient,
      transformer
    );

    useAuthStoreSpy.mockRestore();
    useFetchAccessTokenSpy.mockRestore();
  });
});
