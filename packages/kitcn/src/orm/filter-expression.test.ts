import { describe, expect, test } from 'vitest';
import { matchLikePattern } from './filter-expression';

describe('matchLikePattern', () => {
  test('matches wildcards at any position', () => {
    expect(matchLikePattern('Java Advanced Guide', 'Java%Guide', false)).toBe(
      true
    );
    expect(matchLikePattern('JavaGuide', 'Java%Guide', false)).toBe(true);
    expect(matchLikePattern('Python Guide', 'Java%Guide', false)).toBe(false);
    expect(matchLikePattern('cat', 'c_t', false)).toBe(true);
    expect(matchLikePattern('ct', 'c_t', false)).toBe(false);
    expect(matchLikePattern('cart', 'c_t', false)).toBe(false);
  });

  test('treats regex metacharacters as literals', () => {
    expect(matchLikePattern('a.c', 'a.c', false)).toBe(true);
    expect(matchLikePattern('abc', 'a.c', false)).toBe(false);
    expect(matchLikePattern('a+b', 'a+b', false)).toBe(true);
    expect(matchLikePattern('aab', 'a+b', false)).toBe(false);
    expect(matchLikePattern('(x)', '(x)', false)).toBe(true);
  });

  test('honours case insensitivity only when asked', () => {
    expect(matchLikePattern('Java Guide', 'java%guide', true)).toBe(true);
    expect(matchLikePattern('Java Guide', 'java%guide', false)).toBe(false);
  });

  test('treats a supplementary Unicode character as one underscore', () => {
    expect(matchLikePattern('😀', '_', false)).toBe(true);
    expect(matchLikePattern('😀', '__', false)).toBe(false);
  });

  test('handles empty patterns and trailing wildcards', () => {
    expect(matchLikePattern('', '', false)).toBe(true);
    expect(matchLikePattern('', '%', false)).toBe(true);
    expect(matchLikePattern('', '%%%', false)).toBe(true);
    expect(matchLikePattern('abc', '%', false)).toBe(true);
    expect(matchLikePattern('abc', 'abc%', false)).toBe(true);
    expect(matchLikePattern('abc', '', false)).toBe(false);
  });

  // A pattern is caller data: anything interpolated into `%${query}%` lands
  // here. Translating `%` into a regex quantifier made these backtrack
  // exponentially (minutes of CPU for a 200-character value), which would
  // exhaust a Convex function's whole budget on a single row.
  test('stays fast on patterns that make a regex backtrack exponentially', () => {
    const pathological: [string, string][] = [
      ['%%%%%z', 'a'.repeat(2000)],
      ['%%%%foo%', 'b'.repeat(5000)],
      ['%a%a%a%a%a%a%a%a%a%a%z', 'a'.repeat(2000)],
      [`${'%'.repeat(50)}z`, 'a'.repeat(5000)],
    ];

    const start = performance.now();
    for (const [pattern, value] of pathological) {
      expect(matchLikePattern(value, pattern, false)).toBe(false);
    }
    expect(performance.now() - start).toBeLessThan(2000);
  });
});
