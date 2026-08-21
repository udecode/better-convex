export const AUTH_START_SERVER_TEMPLATE = `import { api } from '@convex/api';
import { convexBetterAuthReactStart } from 'kitcn/auth/start/server';

export const {
  handler,
  getToken,
  createCaller,
  createContext,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  api,
  convexUrl: import.meta.env.VITE_CONVEX_URL!,
  convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL!,
});
`;
