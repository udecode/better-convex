import { expect, test } from 'bun:test';
import type { AuthConfig } from 'convex/server';
import { convex } from './convex-plugin';

test('convex reuses one oidc provider instance per site url and base path', () => {
  const originalSiteUrl = process.env.CONVEX_SITE_URL;
  process.env.CONVEX_SITE_URL = 'https://oidc-cache.invalid';

  const authConfig = {
    providers: [{ applicationID: 'convex', issuer: 'https://issuer.invalid' }],
  } as AuthConfig;

  try {
    const first = convex({ authConfig });
    const second = convex({ authConfig });
    const otherBasePath = convex({
      authConfig,
      options: { basePath: '/api/other' },
    });

    // normalizeAfterHooks re-wraps the matcher but keeps the handler by
    // reference, so a shared handler proves the plugin itself was reused.
    expect(second.hooks.after[0]?.handler).toBe(first.hooks.after[0]?.handler);
    expect(otherBasePath.hooks.after[0]?.handler).not.toBe(
      first.hooks.after[0]?.handler
    );
  } finally {
    if (originalSiteUrl === undefined) {
      delete process.env.CONVEX_SITE_URL;
    } else {
      process.env.CONVEX_SITE_URL = originalSiteUrl;
    }
  }
});

test('convex suppresses the internal oidc provider deprecation warning', () => {
  const originalSiteUrl = process.env.CONVEX_SITE_URL;
  const originalWarn = console.warn;
  const warnings: string[] = [];

  process.env.CONVEX_SITE_URL = 'https://convex.invalid';
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  try {
    convex({
      authConfig: {
        providers: [
          {
            applicationID: 'convex',
            issuer: 'https://issuer.invalid',
          },
        ],
      } as AuthConfig,
    });
  } finally {
    console.warn = originalWarn;
    if (originalSiteUrl === undefined) {
      delete process.env.CONVEX_SITE_URL;
    } else {
      process.env.CONVEX_SITE_URL = originalSiteUrl;
    }
  }

  expect(
    warnings.some((warning) =>
      warning.includes('"oidc-provider" plugin is deprecated')
    )
  ).toBe(false);
});
