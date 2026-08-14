---
"kitcn": minor
---

## Breaking changes

- Require `rls.roleResolver` for policies scoped with `to`. A role-scoped policy
  previously applied to every caller when no resolver was configured; it now
  throws `RLS_ROLE_RESOLVER_REQUIRED`. Queries and mutations check this for
  every table they touch before reading rows, so the error depends only on
  configuration and not on whether the table holds rows. SQL pseudo-roles
  (`public`, `current_user`, `current_role`, `session_user`) apply to everyone
  and still need no resolver.

```ts
// Before
const ormDb = orm.db(ctx, { rls: { ctx } });

// After
const ormDb = orm.db(ctx, {
  rls: { ctx, roleResolver: (ctx) => ctx.roles ?? [] },
});
```

- Deny RLS policy comparisons against a missing value, following SQL null
  semantics. A policy written as `eq(column, null)` now denies instead of
  matching explicitly-null columns, and an unauthenticated caller no longer
  matches rows whose owner column was never set. Use `isNull` to match absent
  or null columns.

```ts
// Before
rlsPolicy('read_unassigned', {
  for: 'select',
  using: (ctx, t) => eq(t.ownerId, null),
});

// After
rlsPolicy('read_unassigned', {
  for: 'select',
  using: (ctx, t) => isNull(t.ownerId),
});
```

## Patches

- Fix many-to-many relations ignoring the junction table's RLS policies, which
  revealed which rows other users were linked to. Loading a relation with `with`
  now enforces the junction table's policies alongside the related table's.
