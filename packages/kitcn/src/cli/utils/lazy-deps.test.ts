import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotenv } from './lazy-deps';

const CLI_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Loading any of these at module scope puts them on the CLI's startup path, so
 * `kitcn --version` pays for esbuild's native service, Babel and the prompt
 * stack. Route new usages through `utils/lazy-deps.ts` instead.
 */
const STARTUP_FORBIDDEN_PACKAGES = [
  '@babel/parser',
  '@clack/prompts',
  'dotenv',
  'esbuild',
  'jiti',
];

const listSourceFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absolute));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(absolute);
    }
  }
  return files;
};

describe('cli/utils/lazy-deps', () => {
  test('no CLI module eagerly imports a heavy startup dependency', () => {
    const offenders: string[] = [];

    for (const file of listSourceFiles(CLI_DIR)) {
      if (file.endsWith('.test.ts')) {
        continue;
      }
      const source = fs.readFileSync(file, 'utf8');
      for (const packageName of STARTUP_FORBIDDEN_PACKAGES) {
        const valueImport = new RegExp(
          `^import\\s+(?!type\\s)[^;]*from\\s+'${packageName}';`,
          'm'
        );
        if (valueImport.test(source)) {
          offenders.push(`${path.relative(CLI_DIR, file)} -> ${packageName}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  test('accessors memoize the resolved module', () => {
    expect(loadDotenv()).toBe(loadDotenv());
  });
});
