import { describe, expect, test } from 'bun:test';
import { integer } from '../orm/builders/number';
import { text } from '../orm/builders/text';
import { rankIndex } from '../orm/indexes';
import { convexTable } from '../orm/table';
import { buildAggregateFingerprintPayload } from './backend-core';

const createRankedTable = (reverse: boolean) =>
  convexTable(
    'scores',
    {
      orgId: text().notNull(),
      points: integer().notNull(),
      region: text().notNull(),
    },
    (t) => [
      rankIndex('by_partition')
        .partitionBy(...(reverse ? [t.region, t.orgId] : [t.orgId, t.region]))
        .orderBy(t.points),
    ]
  );

describe('aggregate schema fingerprint', () => {
  test('preserves rank partition declaration order', () => {
    const original = buildAggregateFingerprintPayload([
      createRankedTable(false),
    ]);
    const reordered = buildAggregateFingerprintPayload([
      createRankedTable(true),
    ]);

    expect(original[0]?.rankIndexes[0]?.partitionFields).toEqual([
      'orgId',
      'region',
    ]);
    expect(reordered[0]?.rankIndexes[0]?.partitionFields).toEqual([
      'region',
      'orgId',
    ]);
    expect(reordered).not.toEqual(original);
  });
});
