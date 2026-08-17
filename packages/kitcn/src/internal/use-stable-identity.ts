/* eslint-disable react-hooks/refs -- render-phase identity cache: the write is idempotent for a given input */

import { useRef } from 'react';

import { isShallowEqual } from './shallow';

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
