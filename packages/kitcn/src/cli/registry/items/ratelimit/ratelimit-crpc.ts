const CRPC_META_RATELIMIT_RE = /ratelimit\?: string;/;
const CRPC_RATELIMIT_BUCKET_RE = /ratelimit\?: RatelimitBucket;/;
const CRPC_CREATE_LINE_RE = /const c = initCRPC\.create\(\);/;
const CRPC_META_CREATE_RE =
  /const c = initCRPC\s*\.meta<\{\s*([\s\S]*?)\s*\}>\(\)\s*\.create\(\);/;
const PUBLIC_MUTATION_LINE_RE =
  /export const publicMutation = c\.mutation(?:\.use\(ratelimit\.middleware\(\)\))?;/;

/**
 * Wire ratelimit middleware into an existing `crpc.ts` source.
 *
 * Shared so other plugins can reproduce the ratelimit-patched baseline and
 * recognize it as managed content rather than a user edit.
 */
export const patchRatelimitCrpcSource = (input: string): string => {
  let source = input;

  if (!source.includes("from './plugins/ratelimit/plugin'")) {
    if (source.includes('import type { ActionCtx, MutationCtx, QueryCtx }')) {
      source = source.replace(
        "import type { ActionCtx, MutationCtx, QueryCtx } from '../functions/generated/server';",
        `import { type RatelimitBucket, ratelimit } from './plugins/ratelimit/plugin';
import type { ActionCtx, MutationCtx, QueryCtx } from '../functions/generated/server';`
      );
    } else {
      source = `import { type RatelimitBucket, ratelimit } from './plugins/ratelimit/plugin';\n${source}`;
    }
  }

  if (CRPC_META_RATELIMIT_RE.test(source)) {
    source = source.replace(
      CRPC_META_RATELIMIT_RE,
      'ratelimit?: RatelimitBucket;'
    );
  }

  if (!CRPC_RATELIMIT_BUCKET_RE.test(source)) {
    if (CRPC_META_CREATE_RE.test(source)) {
      source = source.replace(CRPC_META_CREATE_RE, (_match, fields: string) => {
        const nextFields = [
          ...fields
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          'ratelimit?: RatelimitBucket;',
        ]
          .map((line) => `    ${line}`)
          .join('\n');

        return `const c = initCRPC\n  .meta<{\n${nextFields}\n  }>()\n  .create();`;
      });
    } else if (CRPC_CREATE_LINE_RE.test(source)) {
      source = source.replace(
        CRPC_CREATE_LINE_RE,
        `const c = initCRPC
  .meta<{
    ratelimit?: RatelimitBucket;
  }>()
  .create();`
      );
    }
  }

  if (PUBLIC_MUTATION_LINE_RE.test(source)) {
    source = source.replace(
      PUBLIC_MUTATION_LINE_RE,
      'export const publicMutation = c.mutation.use(ratelimit.middleware());'
    );
  }

  return source;
};
