/**
 * Framework-free shallow comparison helpers.
 *
 * The bindings use these to keep object identity stable across renders when
 * nothing observable changed, so TanStack Query's `shallowEqualObjects` guards
 * and React dependency arrays can actually hit.
 */

/** True when `value` is a non-null object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Compare own enumerable string keys with `Object.is`.
 *
 * Deliberately shallow, never deep: option values are frequently closures
 * (`select`, `retry`, function-form `placeholderData`) that capture fresh
 * render scope, and treating a stale closure as equal would serve stale data.
 */
export function isShallowEqual(a: object, b: object): boolean {
  if (a === b) {
    return true;
  }

  const keys = Object.keys(a);

  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;

  for (const key of keys) {
    if (!Object.hasOwn(right, key)) {
      return false;
    }
    if (!Object.is(left[key], right[key])) {
      return false;
    }
  }

  return true;
}
