---
title: Aggregate isNull must probe the absent-field bucket, not just the null bucket
date: 2026-08-17
category: logic-errors
module: orm
problem_type: logic_error
component: database
symptoms:
  - count()/aggregate() with isNull true returns fewer rows than findMany() under the identical where
  - groupBy() emits a group claiming _count 0 while rows clearly exist
  - relation _count with a soft-delete isNull filter reports 0 live children
  - no COUNT_FILTER_UNSUPPORTED or AGGREGATE_FILTER_UNSUPPORTED error is raised
root_cause: logic_error
resolution_type: code_fix
severity: high
tags:
  - aggregate
  - count
  - groupby
  - orm
  - isNull
  - nullable
  - aggregate-index
---

# Aggregate isNull must probe the absent-field bucket, not just the null bucket

## Problem

A nullable column compiles to `v.optional(v.union(v.null(), T))`, so **absent is
a legal stored value**: any insert that omits the field, and every row written
before the column existed, stores it absent rather than `null`.

`computeCountKeyParts` encodes an absent field as the `__kitcnUndefined`
sentinel, which is a **different aggregate bucket** from the one an explicit
`null` lands in. Every aggregate read path that translated `isNull: true` into a
single `null` probe therefore counted only half the population, silently.

## Symptoms

- `findMany({ where: { batchId: { isNull: true } } })` returns rows while
  `count()` under the identical `where` returns a smaller number or `0`
- `groupBy({ by: ['batchId'], where: { batchId: { isNull: true } } })` emits a
  group whose `_count` is `0`
- `_count: { todos: { where: { deletionTime: { isNull: true } } } }` undercounts
- rows with an **explicit** `null` are counted correctly, which is what makes
  this so easy to miss in tests that seed `col: null`

## What Didn't Work

- Normalizing `undefined -> null` in `computeCountKeyParts` on the write side.
  It does collapse the two buckets and fixes all surfaces at once, but it
  rewrites stored bucket keys (forcing a rebuild on every existing deployment)
  and folds absent rows into the explicit-`null` bucket, which breaks `eq: null`
  parity with the row path.
- Widening only the aggregate read site. `groupBy` builds its own by-field value
  sets, so it stays wrong until its own constraint site is widened too.
- Widening the `groupBy` constraint site naively. Each constraint value becomes
  its own cartesian candidate **and** its own emitted row, so one logical group
  splits into two rows both labelled `null`.
- Merging `groupBy` rows after execution. `_avg` cannot be reconstructed from two
  emitted averages, and merging after emission lets `having`, `orderBy`,
  `cursor`, and `skip`/`take` operate on half-groups.

## Solution

Probe both buckets at the aggregate constraint site, in a **single**
`pushConstraint` call — the helper intersects, so two calls would collapse to the
empty set and make every `isNull` count `0`:

```ts
export const NULLISH_PROBE_VALUES: readonly unknown[] = [null, undefined];

// parseFieldFilter, isNull branch
pushConstraint(target, fieldName, [...NULLISH_PROBE_VALUES]);
```

Then split `groupBy` candidates so the emitted group key and the probe filter can
diverge — one group keyed `null`, filtered with `isNull` so the aggregate
compiler reads both buckets and combines their metrics:

```ts
type GroupByCandidate = {
  key: Record<string, unknown>;   // what the group reports
  where: Record<string, unknown>; // what reads it
};
```

Keep `isNull` as **two constraint atoms** (`null` and `undefined`) rather than one
opaque "nullish" token, so `AND` still narrows
`{ AND: [{ isNull: true }, { eq: null }] }` down to the explicit-`null` bucket
instead of intersecting to nothing.

## Why This Works

Every aggregate read shape resolves bucket identity through `serializeStable`,
which runs `normalizeUndefined` before `JSON.stringify`. So a raw `undefined`
probe hashes to exactly the `{"__kitcnUndefined":true}` key the write path
stored, and `deepEquals` (itself `serializeStable` equality) agrees. That makes
one edit propagate to point lookups, the OR-rewrite union, range-prefix scans,
post-filters, and relational `_count` with no further changes — and no
double-counting, because the two buckets are distinct documents with distinct
key hashes.

Because nothing stored changes, there is no rebuild, no backfill, and no
`keyDefinitionHash` bump.

## Prevention

- `isNull` means **null-or-absent** everywhere in this ORM. Any new read path
  that turns a filter into a stored-key probe must probe both forms; `eq: null`
  must stay scoped to the explicit-`null` form.
- When adding aggregate regression coverage for a nullable column, seed **three**
  states: absent, explicit `null`, and set. Seeding only `col: null` passes
  while the bug is live.
- Where the write path encodes a value, the read path must probe that same
  encoding. Confirm which sentinel the writer uses before writing the probe.
- **Same bug class still open in sibling owners:** `rank()` stores its namespace
  from raw `doc[field]`, so an absent partition field lands in the `undefined`
  namespace while `isNull` resolves to `null` — those rows are unreachable, not
  merely miscounted, and fixing it needs a namespace-encoding decision plus a
  rank rebuild. `toConvexFilter` in `orm/mutation-utils.ts` compiles `isNull` to
  `q.eq(field, null)`, so bulk `update`/`delete` skips absent-field rows, unlike
  the row query path which emits `q.or(eq(f, null), eq(f, undefined))`.

## Related Issues

- [GitHub issue #366](https://github.com/udecode/kitcn/issues/366)
- [Aggregate range filters must normalize string-mode timestamps before bucket reads](./aggregate-range-filters-must-normalize-string-mode-timestamps-20260406.md)
