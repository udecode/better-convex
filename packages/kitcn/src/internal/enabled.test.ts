import { resolveEnabled } from './enabled';

describe('internal/enabled', () => {
  test('preserves an explicit false when the computed gate allows the query', () => {
    expect(resolveEnabled(true, false)).toBe(false);
  });

  test('overrides a predicate when the computed gate blocks the query', () => {
    expect(resolveEnabled(false, () => true)).toBe(false);
  });

  test('preserves a predicate when the computed gate allows the query', () => {
    const predicate = mock(() => false);
    const enabled = resolveEnabled(true, predicate);

    expect(typeof enabled).toBe('function');
    expect((enabled as typeof predicate)({})).toBe(false);
    expect(predicate).toHaveBeenCalledTimes(1);
  });
});
