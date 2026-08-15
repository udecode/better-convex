import fs from 'node:fs';
import { join } from 'node:path';
import { getConvexConfig } from './codegen.js';
import type { CliBackend } from './config.js';
import { loadDotenv } from './utils/lazy-deps.js';

/**
 * Local `.env` resolution for codegen and backend spawns.
 *
 * Lives outside `backend-core.ts` so the long-lived `kitcn dev` watcher child
 * can reach it without pulling the CLI's full command graph (execa, the prompt
 * stack, the analyzer) into a process that only runs codegen.
 */
const resolveEnvPaths = (sharedDir: string | undefined) => {
  const { functionsDir } = getConvexConfig(sharedDir);
  return {
    backendEnvPath: join(functionsDir, '..', '.env'),
    rootEnvPath: join(process.cwd(), '.env'),
  };
};

// Later files win, so path order is the precedence rule.
const mergeEnvFiles = (
  envPaths: readonly string[]
): Record<string, string> => {
  const mergedEnv: Record<string, string> = {};
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }
    Object.assign(
      mergedEnv,
      loadDotenv().parse(fs.readFileSync(envPath, 'utf8'))
    );
  }

  return mergedEnv;
};

function getLocalParseEnvVars(
  sharedDir: string | undefined,
  backend: CliBackend
): Record<string, string> {
  const { backendEnvPath, rootEnvPath } = resolveEnvPaths(sharedDir);
  return mergeEnvFiles(
    backend === 'concave'
      ? [backendEnvPath, rootEnvPath]
      : [rootEnvPath, backendEnvPath]
  );
}

export function getLocalBackendEnvVars(
  sharedDir: string | undefined,
  backend: CliBackend
): Record<string, string> {
  const { backendEnvPath, rootEnvPath } = resolveEnvPaths(sharedDir);
  return mergeEnvFiles(
    backend === 'concave' ? [backendEnvPath, rootEnvPath] : [backendEnvPath]
  );
}

export async function withLocalCodegenEnv<T>(
  sharedDir: string | undefined,
  backend: CliBackend,
  fn: () => Promise<T>
): Promise<T> {
  const envVars = getLocalParseEnvVars(sharedDir, backend);
  if (Object.keys(envVars).length === 0) {
    return fn();
  }

  const previousValues = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(envVars)) {
    previousValues.set(key, process.env[key]);
    process.env[key] = value;
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of previousValues.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
