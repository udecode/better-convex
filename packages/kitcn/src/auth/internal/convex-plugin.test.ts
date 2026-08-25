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
