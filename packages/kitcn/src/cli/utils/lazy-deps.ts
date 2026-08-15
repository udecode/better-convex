import { createRequire } from 'node:module';

/**
 * Heavy CLI-only dependencies, resolved on first use instead of at module init.
 *
 * `kitcn --version`, `kitcn --help` and every `--json` call an agent makes must
 * not pay to boot esbuild's native service, Babel's parser, jiti, dotenv or the
 * interactive prompt stack — the CLI is non-interactive by default and most
 * commands touch none of them.
 *
 * Each accessor is memoized and stays synchronous so call sites keep their
 * current signatures, and each dependency is loaded through exactly one
 * mechanism: `@clack/prompts` compares against a module-private `Symbol` in
 * `isCancel`, so a second copy of the module would silently break cancellation.
 */
const require = createRequire(import.meta.url);

let babelParser: typeof import('@babel/parser') | undefined;
let clackPrompts: typeof import('@clack/prompts') | undefined;
let dotenv: typeof import('dotenv') | undefined;
let esbuild: typeof import('esbuild') | undefined;
let jiti: typeof import('jiti') | undefined;

export const loadBabelParser = (): typeof import('@babel/parser') =>
  (babelParser ??= require('@babel/parser') as typeof import('@babel/parser'));

export const loadClackPrompts = (): typeof import('@clack/prompts') =>
  (clackPrompts ??= require(
    '@clack/prompts'
  ) as typeof import('@clack/prompts'));

export const loadDotenv = (): typeof import('dotenv') =>
  (dotenv ??= require('dotenv') as typeof import('dotenv'));

export const loadEsbuild = (): typeof import('esbuild') =>
  (esbuild ??= require('esbuild') as typeof import('esbuild'));

export const loadJiti = (): typeof import('jiti') =>
  (jiti ??= require('jiti') as typeof import('jiti'));
