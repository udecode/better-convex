---
"kitcn": minor
---

## Breaking changes

- Require Better Auth 1.7. Existing deployments need a maintenance window and
  two schema deployments. Do not refresh the required Better Auth 1.7 schema
  first: the old schema rejects new fields, while the required schema rejects
  old rows.

### Deployment 1: optional fields and backfills

Stop authentication writes, background jobs, and admin APIs that write
`account`, `team`, or `teamMember`. Keep them stopped through deployment 2.

Keep the currently deployed Better Auth version. Temporarily add `issuer` and
the lookup index to the existing account schema owner. Apps using organization
teams must also add optional `memberCount` and `membershipKey` fields plus the
`membershipKey` index:

```ts
// ORM account field/index
issuer: text(),
index("accountId_issuer").on(accountTable.accountId, accountTable.issuer),

// ORM team and teamMember fields/index
memberCount: integer(),
membershipKey: text(),
uniqueIndex("membershipKey").on(teamMemberTable.membershipKey),

// Raw Convex account field/index
issuer: v.optional(v.string()),
.index("accountId_issuer", ["accountId", "issuer"])

// Raw Convex team and teamMember fields/index
memberCount: v.optional(v.number()),
membershipKey: v.optional(v.string()),
.index("membershipKey", ["membershipKey"])
```

Create a migration with `bunx kitcn migrate create backfill_account_issuer`.
Inventory every provider and resolve both parts of its 1.7 identity from
trusted provider data. Credential accounts use `local:credential` and their
linked user ID. OAuth providers without an issuer use
`local:oauth:${encodeURIComponent(providerId)}` and keep their stable provider
subject unless the 1.7 provider contract changed it.

Microsoft is a required exception: map every `microsoft` and
`microsoft-entra-id` row from its old `sub` to the verified directory `oid`
from a verified stored ID token or trusted Entra export. Apply the same rule to
custom OAuth/OIDC providers whose 1.7 `accountSubject` differs. Never derive an
identity from email or another mutable profile field. The
[Better Auth 1.7 upgrade guide](https://www.better-auth.com/docs/guides/1-7-upgrade-guide)
owns the provider-specific mapping rules.

```ts
import { defineMigration } from "kitcn/orm";

const issuerByProviderId = {
  credential: "local:credential",
  github: "local:oauth:github",
  google: "https://accounts.google.com",
} as const;

// Add every row whose trusted 1.7 provider subject differs from accountId.
const accountIdByRowId: Record<string, string> = {
  "microsoft-account-row-id": "verified-directory-oid",
};

export const migration = defineMigration({
  id: "20260826_000000_backfill_account_issuer",
  up: {
    table: "account",
    migrateOne: async (ctx, account) => {
      const issuer =
        issuerByProviderId[
          account.providerId as keyof typeof issuerByProviderId
        ];

      if (!issuer) {
        throw new Error(`Map issuer for provider ${account.providerId}`);
      }
      const mappedAccountId = accountIdByRowId[account._id];
      if (
        (account.providerId === "microsoft" ||
          account.providerId === "microsoft-entra-id") &&
        !mappedAccountId
      ) {
        throw new Error(`Map verified Microsoft oid for ${account._id}`);
      }
      const accountId =
        mappedAccountId ??
        (account.providerId === "credential"
          ? account.userId
          : account.accountId);
      if (!accountId) {
        throw new Error(`Map account subject for ${account._id}`);
      }

      if (account.issuer !== undefined && account.issuer !== issuer) {
        throw new Error(`Issuer mismatch for account ${account._id}`);
      }
      if (account.issuer === issuer && account.accountId === accountId) {
        return;
      }

      const collision = await ctx.db
        .query("account")
        .withIndex("accountId_issuer", (query) =>
          query.eq("accountId", accountId).eq("issuer", issuer)
        )
        .unique();

      if (collision && collision._id !== account._id) {
        throw new Error(
          `Duplicate account identity ${issuer}:${accountId}`
        );
      }

      return { accountId, issuer };
    },
  },
});
```

Apps using organization teams must also create a migration that sets every
team's count from the indexed `teamMember` rows:

```ts
export const teamMemberCountMigration = defineMigration({
  id: "20260826_000001_backfill_team_member_count",
  up: {
    table: "team",
    migrateOne: async (ctx, team) => {
      const members = await ctx.db
        .query("teamMember")
        .withIndex("teamId", (query) => query.eq("teamId", team.id))
        .collect();

      return { memberCount: members.length };
    },
  },
});
```

Deploy the optional schema and migration, then require a completed status:

```bash
bunx kitcn codegen
bunx kitcn deploy --prod
bunx kitcn migrate status --prod
```

Raw Convex apps use the same resolver and indexed collision check in a
paginated internal mutation after deploying the optional fields and indexes.
Team users must also count `teamMember` rows by the `teamId` index and patch
every team. Finish every page, verify no account lacks either identity field,
verify no `(issuer, accountId)` collision exists, and verify every team count
before continuing.

### Deployment 2: required Better Auth 1.7 schema

After the backfill is complete, upgrade KitCN and Better Auth, refresh the
auth-owned schema, and deploy the required field and compound identity index:

```bash
# Default KitCN schema owner
bunx kitcn add auth --schema --yes

# Raw Convex schema owner; use this command instead of the default command
bunx kitcn add auth --preset convex --yes

bunx kitcn deploy --prod
```

Verify returning credential, OAuth, and Microsoft sign-in plus team membership
changes against the migrated data. Resume writes only after these checks pass.

## Features

- Support Better Auth 1.7 account identity constraints, declared table indexes,
  atomic adapter mutations, stable join configuration, session hydration, and
  organization metadata reads.
