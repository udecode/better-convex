import type * as tsType from 'typescript';
import { createTypeScriptProxy } from '../utils/typescript-runtime.js';

const ts = createTypeScriptProxy();

const PARSE_CACHE_LIMIT = 8;
const parseCache = new Map<string, tsType.SourceFile>();

/**
 * Parse schema-shaped TypeScript, memoized on the exact source text.
 *
 * Schema reconciliation reads one revision through several independent
 * helpers: the ownership read loop alone re-parses the final revision three
 * times per managed table, and the chain walker parses it again. The parse is
 * a pure function of its arguments, so a cache hit can never be stale — the
 * text is the key. Bounded, because a parent-pointer AST of a large schema is
 * not small.
 */
export const parseSchemaSource = (
  source: string,
  fileName = 'schema.ts'
): tsType.SourceFile => {
  // Length-prefixed so no file name and source pair can collide.
  const key = `${fileName.length}:${fileName}${source}`;
  const cached = parseCache.get(key);
  if (cached) {
    // Refresh recency so the revision under active edit is never evicted.
    parseCache.delete(key);
    parseCache.set(key, cached);
    return cached;
  }

  const parsed = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  parseCache.set(key, parsed);
  if (parseCache.size > PARSE_CACHE_LIMIT) {
    const oldestKey = parseCache.keys().next().value;
    if (oldestKey) {
      parseCache.delete(oldestKey);
    }
  }

  return parsed;
};
