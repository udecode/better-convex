---
title: Convex auth pagination needs an unbounded budget and forward progress
date: 2026-07-30
category: integration-issues
module: auth-adapter
problem_type: integration_issue
component: authentication
symptoms:
  - unbounded auth count and findMany calls can loop after 200 rows
  - shared runMutation contexts expose options unavailable from actions
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags: [auth, convex, better-auth, pagination, action]
---

# Convex auth pagination needs an unbounded budget and forward progress

## Problem

The shared auth pagination helper treated a missing caller limit as a 200-row
total limit. After collecting the first page, it requested zero rows while
retaining the cursor and could loop forever.

The shared mutation runner type also used the mutation-context signature even
though its runtime union includes action contexts. Newer Convex versions allow
transaction-limit options only for nested calls inside mutations.

## Symptoms

- `count()` and unbounded `findMany()` do not terminate above 200 matching rows.
- A stalled backend page can repeat forever when it is not done, returns
  nothing, and leaves the cursor unchanged.
- TypeScript permits a transaction-options argument on a context that may be an
  action, even though action runners accept only the function reference and
  arguments.

## Solution

Keep pagination unbounded only when the caller omits `limit`, while preserving
the 200-row per-page cap. Abort when a non-final page neither advances the
cursor nor produces rows or a count.

Type the shared `runMutation` property from `GenericActionCtx`. Mutation
contexts remain assignable because their runner supports the action-safe call
shape plus mutation-only options.

## Why This Works

The page cap and total result limit are different constraints. An unbounded
query still fetches at most 200 rows per request, but every subsequent request
retains a positive budget until Convex reports completion.

The action signature is the common callable surface across both runtime
contexts. Consumers can call mutations safely without receiving options that
only one branch of the union can honor.

## Prevention

1. Test unbounded pagination with more rows than the per-page cap.
2. Require every non-final pagination step to advance its cursor or produce
   output.
3. Type union-context methods from the narrowest runtime that must support the
   call.
4. Run the type regression against a pinned Convex version that exposes
   mutation-only transaction options, while keeping the package baseline at its
   minimum supported version.
5. Re-audit copied Convex Better Auth helpers whenever upstream changes their
   termination or context contracts.

## Related

- `docs/solutions/integration-issues/convex-better-auth-upstream-sync-runtime-fixes-20260416.md`
- `docs/solutions/integration-issues/better-auth-1-6-support-needs-structural-convex-auth-wrappers-20260416.md`
