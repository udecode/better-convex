import { loadBabelParser } from './lazy-deps.js';

const AST_COMPARABLE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);
const JSON_EXTENSIONS = new Set(['.json']);
const METADATA_KEYS = new Set([
  'comments',
  'start',
  'end',
  'loc',
  'range',
  'extra',
  'errors',
  'tokens',
  'leadingComments',
  'trailingComments',
  'innerComments',
]);

const normalizeLineEndings = (value: string): string =>
  value.replace(/\r\n/g, '\n').trim();

const getExtension = (filePath: string): string => {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot >= 0 ? filePath.slice(lastDot).toLowerCase() : '';
};

/**
 * Own enumerable keys that would survive `JSON.stringify`, minus positional
 * metadata. Babel emits `undefined`-valued keys (`typeParameters` on a plain
 * `type A = string`), and `JSON.stringify` drops those — so must this.
 */
const comparableKeys = (value: Record<string, unknown>): string[] =>
  Object.keys(value).filter(
    (key) => !METADATA_KEYS.has(key) && value[key] !== undefined
  );

/**
 * Structural AST equality with the same semantics as comparing two
 * `JSON.stringify` outputs, but short-circuiting on the first difference and
 * without cloning either tree.
 *
 * Key order is compared positionally on purpose. This result decides whether
 * kitcn may overwrite a user file without prompting, so the comparator must
 * never be more permissive than the serialized comparison it replaces.
 */
const astEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => astEqual(item, b[index]))
    );
  }
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  const recordA = a as Record<string, unknown>;
  const recordB = b as Record<string, unknown>;
  const keysA = comparableKeys(recordA);
  const keysB = comparableKeys(recordB);
  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    (key, index) => key === keysB[index] && astEqual(recordA[key], recordB[key])
  );
};

const parseComparableAst = (content: string, filePath: string): unknown => {
  const extension = getExtension(filePath);
  const isTypeScript = ['.ts', '.tsx', '.mts', '.cts'].includes(extension);
  const isJsx = ['.jsx', '.tsx'].includes(extension);

  return loadBabelParser().parse(content, {
    sourceType: 'unambiguous',
    errorRecovery: false,
    plugins: [
      'decorators-legacy',
      'importAttributes',
      ...(isTypeScript ? (['typescript'] as const) : []),
      ...(isJsx ? (['jsx'] as const) : []),
    ],
  });
};

const normalizeJson = (content: string): string => {
  return JSON.stringify(JSON.parse(content));
};

export const isContentEquivalent = (params: {
  filePath: string;
  existingContent: string;
  nextContent: string;
}): boolean => {
  const existingContent = normalizeLineEndings(params.existingContent);
  const nextContent = normalizeLineEndings(params.nextContent);

  if (existingContent === nextContent) {
    return true;
  }

  const extension = getExtension(params.filePath);

  try {
    if (JSON_EXTENSIONS.has(extension)) {
      return normalizeJson(existingContent) === normalizeJson(nextContent);
    }

    if (AST_COMPARABLE_EXTENSIONS.has(extension)) {
      return astEqual(
        parseComparableAst(existingContent, params.filePath),
        parseComparableAst(nextContent, params.filePath)
      );
    }
  } catch {
    return false;
  }

  return false;
};
