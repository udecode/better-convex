/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/purity -- render-phase identity cache: the write is idempotent for a given input */

import { useRef } from 'react';

import { isShallowEqual } from '../internal/shallow';

/**
 * Return the previous value while the freshly computed one is equivalent.
 *
 * Convex queries are reactive, so a churning options identity does not merely
 * re-render: it re-hashes query keys, re-runs `combine`, and re-fires
 * `observerOptionsUpdated`. The React entry is built without
 * `babel-plugin-react-compiler` (see `packages/kitcn/tsdown.config.ts`, where
 * only the Solid entry gets a compiler plugin), so consumers load unmemoized
 * code and every identity that must stay stable has to be stabilized by hand.
 *
 * The stored value is an identity cache, not derived state, so a discarded
 * concurrent render costs at most one extra identity change.
 *
 * @param value - Freshly computed value for this render.
 * @param isEqual - Equivalence check. Defaults to own-key `Object.is`.
 */
export function useStableIdentity<T extends object>(
  value: T,
  isEqual: (previous: NoInfer<T>, next: NoInfer<T>) => boolean = isShallowEqual
): T {
  const previousRef = useRef<T | null>(null);
  const previous = previousRef.current;

  if (previous !== null && isEqual(previous, value)) {
    return previous;
  }

  previousRef.current = value;

  return value;
}
