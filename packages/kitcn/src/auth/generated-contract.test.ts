import { describe, expect, test } from 'bun:test';
import {
  createAuthRuntime,
  resolveGeneratedAuthDefinition,
} from './generated-contract';

describe('auth/generated-contract', () => {
  test('resolveGeneratedAuthDefinition defers a default getter that is still in TDZ', () => {
    type AuthDefinition = (ctx: { userId: string }) => { userId: string };

    let initialized = false;
    let currentDefinition: AuthDefinition | undefined;

    const moduleNamespace = {};
    Object.defineProperty(moduleNamespace, 'default', {
      enumerable: true,
      get() {
        if (!initialized) {
          throw new ReferenceError(
            "Cannot access 'default' before initialization"
          );
        }
        return currentDefinition;
      },
    });

    const resolved = resolveGeneratedAuthDefinition<AuthDefinition>(
      moduleNamespace,
      'auth unavailable'
    );

    initialized = true;
    currentDefinition = (ctx) => ({ userId: ctx.userId });

    expect(resolved({ userId: 'user_123' })).toEqual({
      userId: 'user_123',
    });
  });

  test('resolveGeneratedAuthDefinition defers a default export that is temporarily undefined', () => {
    type AuthDefinition = (ctx: { userId: string }) => { userId: string };

    let currentDefinition: AuthDefinition | undefined;

    const moduleNamespace = {};
    Object.defineProperty(moduleNamespace, 'default', {
      enumerable: true,
      get() {
        return currentDefinition;
      },
    });

    const resolved = resolveGeneratedAuthDefinition<AuthDefinition>(
      moduleNamespace,
      'auth unavailable'
    );

    currentDefinition = (ctx) => ({ userId: ctx.userId });

    expect(resolved({ userId: 'user_456' })).toEqual({
      userId: 'user_456',
    });
  });

  test('createAuthRuntime synthesizes auth function refs when generated internal api is empty', () => {
    const authRuntime = createAuthRuntime<any, any, any, any, any>({
      internal: {},
      moduleName: 'generated/auth',
      schema: { tables: {} } as any,
      auth: (() => ({
        emailAndPassword: { enabled: true },
      })) as any,
    });

    expect(
      (authRuntime.authClient.authFunctions.findOne as Record<symbol, unknown>)[
        Symbol.for('functionName')
      ]
    ).toBe('generated/auth:findOne');
    expect(
      (
        authRuntime.authClient.authFunctions.updateOne as Record<
          symbol,
          unknown
        >
      )[Symbol.for('functionName')]
    ).toBe('generated/auth:updateOne');
    expect(
      (
        authRuntime.authClient.authFunctions.consumeOne as Record<
          symbol,
          unknown
        >
      )[Symbol.for('functionName')]
    ).toBe('generated/auth:consumeOne');
    expect(
      (
        authRuntime.authClient.authFunctions.incrementOne as Record<
          symbol,
          unknown
        >
      )[Symbol.for('functionName')]
    ).toBe('generated/auth:incrementOne');
  });

  test('getAuth evaluates the auth definition once per call and memoizes the table schema', async () => {
    let evaluations = 0;
    const runtime = createAuthRuntime<any, any, any, any, any>({
      internal: {},
      moduleName: 'generated/auth',
      schema: { tables: {} } as any,
      auth: (() => {
        evaluations += 1;
        return {
          baseURL: 'http://localhost:3000',
          emailAndPassword: { enabled: true },
        };
      }) as any,
    });
    // A query ctx routes to the db adapter, which is the path that used to
    // re-derive the Better Auth table schema from a second full evaluation.
    const queryCtx = { db: {} } as any;

    const first = runtime.getAuth(queryCtx) as { $context: Promise<unknown> };
    await first.$context;

    // one request-scoped evaluation + one ctx-free evaluation for the schema
    expect(evaluations).toBe(2);

    const second = runtime.getAuth(queryCtx) as { $context: Promise<unknown> };
    await second.$context;

    // the schema is memoized for the isolate, so only the request-scoped
    // evaluation repeats
    expect(evaluations).toBe(3);
  });

  test('createAuthRuntime disables rate limiting for Convex jwks routes', async () => {
    const runtime = createAuthRuntime<any, any, any, any, any>({
      internal: {},
      moduleName: 'generated/auth',
      schema: { tables: {} } as any,
      auth: (() => ({
        baseURL: 'http://localhost:3000',
        emailAndPassword: { enabled: true },
      })) as any,
    });

    const auth = runtime.getAuth({} as any) as {
      $context: Promise<{
        rateLimit?: { customRules?: Record<string, unknown> };
      }>;
    };
    const context = await auth.$context;

    expect(context.rateLimit?.customRules).toMatchObject({
      '/convex/.well-known/openid-configuration': false,
      '/convex/jwks': false,
      '/convex/latest-jwks': false,
      '/convex/rotate-keys': false,
    });
  });

  test('createAuthRuntime preserves user rate limit overrides', async () => {
    const runtime = createAuthRuntime<any, any, any, any, any>({
      internal: {},
      moduleName: 'generated/auth',
      schema: { tables: {} } as any,
      auth: (() => ({
        baseURL: 'http://localhost:3000',
        emailAndPassword: { enabled: true },
        rateLimit: {
          customRules: {
            '/convex/jwks': { max: 9, window: 30 },
            '/sign-in/email': { max: 3, window: 10 },
          },
          enabled: true,
          max: 100,
          window: 60,
        },
      })) as any,
    });

    const auth = runtime.getAuth({} as any) as {
      $context: Promise<{
        rateLimit?: { customRules?: Record<string, unknown> };
      }>;
    };
    const context = await auth.$context;

    expect(context.rateLimit?.customRules).toMatchObject({
      '/convex/.well-known/openid-configuration': false,
      '/convex/jwks': { max: 9, window: 30 },
      '/convex/latest-jwks': false,
      '/convex/rotate-keys': false,
      '/sign-in/email': { max: 3, window: 10 },
    });
  });
});
