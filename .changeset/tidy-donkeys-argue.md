---
"kitcn": patch
---

## Patches

- Fix organization permission checks returning a false "not a member" once an
  organization grows past ~200 members. The generated auth schema now indexes
  the composite lookups the organization plugin actually issues:
  `member` by `organizationId` + `userId` and by `organizationId` + `role`,
  `teamMember` by `teamId` + `userId`, `invitation` by
  `organizationId` + `status` and by `email` + `organizationId` + `status`, and
  `organizationRole` by `organizationId` + `role`. Every index that was emitted
  before is still emitted, so this is additive — rerun
  `npx kitcn add auth --schema --yes` to pick the new ones up.

- Fix `findOne` reporting "not found" when the scan budget ran out before
  reaching a matching row. Single-document reads now page until they match a row
  or exhaust the query, so an unindexed lookup is slow and warns rather than
  silently wrong. Watch for `Querying without an index on table "..."` in your
  logs and add the index it names.
