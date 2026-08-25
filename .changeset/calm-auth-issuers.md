---
"kitcn": minor
---

## Breaking changes

- Require Better Auth 1.7. Existing account rows need a two-deployment schema
  transition. Do not refresh the required Better Auth 1.7 schema first: the old
  schema rejects issuer writes, while the required schema rejects old rows.

### Deployment 1: optional issuer and backfill

Keep the currently deployed Better Auth version. Temporarily add `issuer` and
the lookup index to the existing account schema owner:

```ts
// ORM schema
issuer: text(),
index("accountId_issuer").on(accountTable.accountId, accountTable.issuer),

// Raw Convex schema
issuer: v.optional(v.string()),
.index("accountId_issuer", ["accountId", "issuer"])
```

Create a migration with `bunx kitcn migrate create backfill_account_issuer`.
Use the issuer configured by each trusted provider. Credential accounts use
`local:credential`; OAuth providers without an issuer use
`local:oauth:${encodeURIComponent(providerId)}`.

```ts
import { defineMigration } from "kitcn/orm";

const issuerByProviderId = {
  credential: "local:credential",
  github: "local:oauth:github",
  google: "https://accounts.google.com",
} as const;

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
      if (account.issuer !== undefined) {
        if (account.issuer !== issuer) {
          throw new Error(`Issuer mismatch for account ${account._id}`);
        }
        return;
      }

      const collision = await ctx.db
        .query("account")
        .withIndex("accountId_issuer", (query) =>
          query.eq("accountId", account.accountId).eq("issuer", issuer)
        )
        .unique();

      if (collision) {
        throw new Error(
          `Duplicate account identity ${issuer}:${account.accountId}`
        );
      }

      return { issuer };
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
paginated internal mutation after deploying the optional field and index.
Finish every page before continuing.

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

## Features

- Support Better Auth 1.7 account identity constraints, declared table indexes,
  atomic adapter mutations, stable join configuration, session hydration, and
  organization metadata reads.
