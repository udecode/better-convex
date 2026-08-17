import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Convex bundles everything a function entry statically imports and forbids
 * dynamic `import()`. The optional ORM subsystems therefore have to stay out of
 * `kitcn/orm`'s value-level import graph, or every Convex function in every app
 * pays for the aggregate btree and the migration runtime.
 *
 * This walks the real graph instead of asserting on bundle bytes so the gate
 * runs without a build step.
 */

const SRC_DIR = path.resolve(import.meta.dirname, '..');

const IMPORT_STATEMENT =
  /(?:^|\n)\s*(?:import|export)\s+(type\s+)?([^;]*?)from\s+'([^']+)'/g;

const resolveModule = (fromFile: string, specifier: string): string | null => {
  if (!specifier.startsWith('.')) {
    return null;
  }
  const base = path.resolve(path.dirname(fromFile), specifier);
  // NodeNext specifiers carry the emitted extension (`./btree.js`), so the
  // source file is `./btree.ts`. Without stripping it the walker silently
  // resolves nothing and every assertion about that subtree passes vacuously.
  const stripped = base.replace(/\.(js|jsx|mjs|cjs)$/, '');
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    `${stripped}.ts`,
    `${stripped}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(stripped, 'index.ts'),
    path.join(stripped, 'index.tsx'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
};

/** Modules reachable through imports that survive TypeScript type erasure. */
const valueImports = (file: string): string[] => {
  const source = readFileSync(file, 'utf8');
  const resolved: string[] = [];
  IMPORT_STATEMENT.lastIndex = 0;
  let match = IMPORT_STATEMENT.exec(source);
  while (match !== null) {
    const [, typeKeyword, clause, specifier] = match;
    match = IMPORT_STATEMENT.exec(source);
    if (typeKeyword) {
      continue;
    }
    const trimmed = clause.trim();
    if (trimmed.startsWith('{')) {
      const inner = trimmed.slice(1, trimmed.lastIndexOf('}'));
      const specifiers = inner
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (
        specifiers.length > 0 &&
        specifiers.every((entry) => entry.startsWith('type '))
      ) {
        continue;
      }
    }
    const target = resolveModule(file, specifier);
    if (target) {
      resolved.push(target);
    }
  }
  return resolved;
};

const reachableFrom = (entry: string): Set<string> => {
  const seen = new Set<string>();
  const stack = [path.join(SRC_DIR, entry)];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);
    stack.push(...valueImports(current));
  }
  return new Set(
    [...seen].map((file) => path.relative(SRC_DIR, file).replaceAll('\\', '/'))
  );
};

const OPTIONAL_SUBSYSTEMS = [
  'orm/aggregate-index/runtime.ts',
  'orm/aggregate-index/rank-runtime.ts',
  'orm/aggregate-index/backfill.ts',
  'aggregate-core/runtime.ts',
  'aggregate-core/btree.ts',
  'orm/migrations/runtime.ts',
];

describe('kitcn/orm import graph', () => {
  test('does not reach the optional aggregate or migration runtimes', () => {
    const reachable = reachableFrom('orm/index.ts');
    expect(
      OPTIONAL_SUBSYSTEMS.filter((module) => reachable.has(module))
    ).toEqual([]);
  });

  test('kitcn/orm/aggregate-index owns the aggregate runtime', () => {
    const reachable = reachableFrom('orm/aggregate-index/index.ts');
    expect(reachable.has('orm/aggregate-index/runtime.ts')).toBe(true);
    expect(reachable.has('orm/aggregate-index/rank-runtime.ts')).toBe(true);
    expect(reachable.has('orm/aggregate-index/backfill.ts')).toBe(true);
    expect(reachable.has('aggregate-core/btree.ts')).toBe(true);
    expect(reachable.has('orm/migrations/runtime.ts')).toBe(false);
  });

  test('kitcn/orm/migrations owns the migration runtime', () => {
    const reachable = reachableFrom('orm/migrations/index.ts');
    expect(reachable.has('orm/migrations/runtime.ts')).toBe(true);
    expect(reachable.has('orm/aggregate-index/runtime.ts')).toBe(false);
  });
});
