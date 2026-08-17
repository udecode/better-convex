---
"kitcn": minor
---

- Rerun `kitcn codegen` to register aggregate, rank, and migration runtimes through the generated ORM setup.
- Register `aggregateCapability()` from `kitcn/orm/aggregate-index` and `migrationCapability()` from `kitcn/orm/migrations` when constructing a hand-written ORM that uses those subsystems.
- Import aggregate backfill argument types from `kitcn/orm/aggregate-index` and migration argument types from `kitcn/orm/migrations`.
- Keep `kitcn/orm` free of optional aggregate, rank, backfill, and migration runtime imports until the corresponding capability is registered.
- Run `kitcn aggregate prune` after removing the final aggregate or rank index; the generated maintenance entry remains available and drains large rank trees in bounded chunks.
- Read authenticated query and mutation sessions with `getSession(ctx)`, and keep authenticated action builders in a separate module that owns `getAuth(ctx)`.
