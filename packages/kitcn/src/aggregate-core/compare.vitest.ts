import { CommitTsPlaceholder } from 'convex/values';
import { expect, test } from 'vitest';
import { compareValues } from './compare';

test('rejects unresolved commit timestamp placeholders', () => {
  const placeholder = new CommitTsPlaceholder();

  expect(() => compareValues(placeholder, placeholder)).toThrow(
    'Commit timestamp placeholders cannot be compared before commit.'
  );
});
