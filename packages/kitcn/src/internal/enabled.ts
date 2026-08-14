/** biome-ignore-all lint/suspicious/noExplicitAny: TanStack query type compatibility */

/**
 * Shared handling for TanStack Query v5's `enabled` option, which may be a
 * boolean or a predicate evaluated against the query.
 * No React dependencies, so both the query and infinite query paths can use it.
 */

export type EnabledFn = (query: any) => boolean;
export type EnabledOption = boolean | EnabledFn | undefined;

/**
 * Combine a computed gate with the caller's `enabled` option.
 * A predicate is preserved (never collapsed to a boolean) so TanStack Query
 * keeps evaluating it; `allowed: false` always wins.
 */
export function resolveEnabled(
  allowed: boolean,
  enabled: EnabledOption
): boolean | EnabledFn {
  if (!allowed) {
    return false;
  }
  if (typeof enabled === 'function') {
    return (query) => enabled(query) !== false;
  }
  return true;
}
