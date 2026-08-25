---
"kitcn": minor
---

## Breaking changes

- Require Better Auth 1.7. Backfill every existing account with its trusted
  issuer before regenerating the auth schema; credential accounts use
  `local:credential`, while OAuth providers without an issuer use
  `local:oauth:<encoded providerId>`.

```ts
const issuerByProviderId = {
  credential: "local:credential",
  github: "local:oauth:github",
  google: "https://accounts.google.com",
} as const;

const migratedAccount = {
  ...account,
  issuer: issuerByProviderId[account.providerId],
};
```

## Features

- Support Better Auth 1.7 account identity constraints, declared table indexes,
  atomic adapter mutations, stable join configuration, session hydration, and
  organization metadata reads.
