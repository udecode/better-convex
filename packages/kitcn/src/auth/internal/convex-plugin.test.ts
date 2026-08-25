import { expect, test } from 'bun:test';
import type { AuthConfig } from 'convex/server';
import { convex } from './convex-plugin';

test('convex owns its OpenID configuration on Better Auth 1.7', async () => {
  const originalSiteUrl = process.env.CONVEX_SITE_URL;
  process.env.CONVEX_SITE_URL = 'https://convex.invalid';

  const authConfig = {
    providers: [{ applicationID: 'convex', issuer: 'https://issuer.invalid' }],
  } as AuthConfig;

  try {
    const plugin = convex({
      authConfig,
      options: { basePath: '/api/other' },
    });
    const config = await plugin.endpoints.getOpenIdConfig({} as never);

    expect(config.issuer).toBe('https://convex.invalid');
    expect(config.jwks_uri).toBe(
      'https://convex.invalid/api/other/convex/jwks'
    );
    expect(config.authorization_endpoint).toBe(
      'https://convex.invalid/api/other/oauth2/authorize'
    );
  } finally {
    if (originalSiteUrl === undefined) {
      delete process.env.CONVEX_SITE_URL;
    } else {
      process.env.CONVEX_SITE_URL = originalSiteUrl;
    }
  }
});

test('query context acknowledges suppressed incrementOne writes', async () => {
  const plugin = convex({
    authConfig: {
      providers: [
        { applicationID: 'convex', issuer: 'https://issuer.invalid' },
      ],
    },
  });
  const hook = plugin.hooks?.before?.at(-1);
  const incrementOne = mock(async () => ({ count: 2 }));
  const context = {
    adapter: {
      create: mock(async () => undefined),
      delete: mock(async () => undefined),
      deleteMany: mock(async () => undefined),
      incrementOne,
      options: { isRunMutationCtx: false },
      update: mock(async () => undefined),
      updateMany: mock(async () => undefined),
    },
    internalAdapter: {
      deleteSession: mock(async () => undefined),
    },
  };
  const hookContext = {
    context,
    path: '/api-key/list',
    query: {},
  } as any;

  expect(hook).toBeDefined();
  expect(hook?.matcher(hookContext)).toBe(true);
  await hook?.handler(hookContext);

  await expect(
    context.adapter.incrementOne({
      increment: { count: 1 },
      model: 'rateLimit',
      where: [{ field: 'key', value: 'sign-in' }],
    } as any)
  ).resolves.toEqual({});
  expect(incrementOne).not.toHaveBeenCalled();
});
