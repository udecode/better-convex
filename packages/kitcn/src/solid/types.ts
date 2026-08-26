import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { createAuthClient } from 'better-auth/solid';
import type { convexClient } from '../auth/internal/convex-client';

type OpaqueClientPlugin = Omit<BetterAuthClientPlugin, '$InferServerPlugin'> & {
  $InferServerPlugin?: never;
};
type ConvexClient = ReturnType<typeof convexClient>;
type CrossDomainClient = OpaqueClientPlugin & {
  id: 'cross-domain';
  getActions: (...args: never[]) => {
    crossDomain: {
      oneTimeToken: {
        verify: (args: unknown) => Promise<unknown>;
      };
    };
    getCookie: () => string;
    notifySessionSignal: () => void;
  };
};
type PluginsWithCrossDomain = (
  | CrossDomainClient
  | ConvexClient
  | OpaqueClientPlugin
)[];
type PluginsWithoutCrossDomain = (ConvexClient | OpaqueClientPlugin)[];

type SolidAuthSessionState = {
  data: unknown;
  error?: unknown;
  isPending: boolean;
  isRefetching?: boolean;
  refetch?: (...args: never[]) => unknown;
};

type SolidAuthConvexTokenArgs = {
  fetchOptions?: {
    headers?: {
      Authorization: string;
    };
    throw?: false;
  };
};

type SolidAuthConvexTokenResult =
  | {
      data?: {
        token?: string | null;
      } | null;
    }
  | null
  | undefined;

export type SolidAuthProviderClient = {
  convex: {
    token: (
      args: SolidAuthConvexTokenArgs
    ) => Promise<SolidAuthConvexTokenResult>;
  };
  crossDomain?: unknown;
  getCookie?: (...args: never[]) => unknown;
  getSession?: (...args: never[]) => unknown;
  notifySessionSignal?: (...args: never[]) => unknown;
  updateSession?: (...args: never[]) => unknown;
  useSession: () => () => SolidAuthSessionState;
} & Record<string, unknown>;

type AuthClientWithPlugins<Plugins extends BetterAuthClientPlugin[]> =
  ReturnType<typeof createAuthClient<{ plugins: Plugins }>>;

type HydratableAuthClient<Plugins extends BetterAuthClientPlugin[]> = Omit<
  AuthClientWithPlugins<Plugins>,
  'hydrateSession'
> & {
  hydrateSession(
    session: Parameters<AuthClientWithPlugins<Plugins>['hydrateSession']>[0]
  ): void;
};

export type SolidAuthClient =
  | HydratableAuthClient<PluginsWithCrossDomain>
  | HydratableAuthClient<PluginsWithoutCrossDomain>;
