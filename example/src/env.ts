import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

const DEFAULT = {
  PORT: '3005',
};

export const env = createEnv({
  /**
   * Specify your client-side environment variables schema here. This way you
   * can ensure the app isn't built with invalid env vars. To expose them to the
   * client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CONVEX_SITE_URL: z.string(),
    NEXT_PUBLIC_CONVEX_URL: z.string(),
    NEXT_PUBLIC_SITE_URL: z.string().optional(),
  },
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR:
   * z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge
   * runtimes (e.g. middlewares) or client-side so we need to destruct
   * manually.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || DEFAULT.PORT}`),
    NODE_ENV: process.env.NODE_ENV,
  },

  /**
   * Specify your server-side environment variables schema here. This way you
   * can ensure the app isn't built with invalid env vars.
   */
  server: {
    PORT: z.string().optional().default(DEFAULT.PORT),
  },

  shared: {
    NEXT_PUBLIC_CONVEX_URL: z.string(),
    NEXT_PUBLIC_ENVIRONMENT: z.string().default('production'),
    NEXT_PUBLIC_SITE_URL: z.string().optional().default(''),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('production'),
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
