# PR 342 ORM capability autoclosure

Objective:
Autoclose PR #342 with one explicit owner per optional ORM runtime, narrow
Convex entry graphs, reproducible generated registration, and no loss of
aggregate pruning or schema-change detection.

Goal plan:
docs/plans/2026-08-17-pr-342-autoclosure.md

Template:
docs/plans/templates/architecture-cleanup.md

Source:
- requested boundary: audit and autoclose PR #342 after released #341
- current owner map: `kitcn/orm` statically owns aggregate and migration
  runtimes; generated `server.ts` owns all ORM procedures
- target owner map: `kitcn/orm` owns capability-neutral ORM behavior;
  `kitcn/orm/aggregate-index` and `kitcn/orm/migrations` own optional runtimes;
  codegen owns registration and isolated maintenance entries
- public API impact: confirmed closed-alpha hard cut through the explicit
  merge/autoclosure request; no aliases or shims
- Convex import-graph impact: root ORM must not reach aggregate btree/backfill
  or migration runtime; aggregate maintenance remains entry-local
- generated owner: `packages/kitcn/src/cli/codegen.ts`; regenerate example,
  fixtures, runtime maps, and type output

Completion threshold:
- Seven released-main conflicts preserve both capability injection and every
  merged ORM correctness/performance repair.
- Schemas register only required runtime capabilities, while aggregate prune
  remains callable after the final index is removed.
- Rank partition order changes invalidate the aggregate fingerprint.
- Public exports, docs, package skill, generated output, fixtures, changeset,
  package gates, import graph, full check, review, exact remote gates, merge,
  release, and remote read-back all pass.

Verification surface:
- capability/import-graph, ORM aggregate/write/query, codegen, CLI aggregate,
  auth guidance, package type/build, fixture sync/check, intent, deslop,
  agent-native review, autoreview, `bun check`, GitHub gates, and release matrix

Constraints:
- Keep Convex function entry graphs minimal.
- Edit codegen and published skill sources, then regenerate outputs.
- Preserve released #331/#335/#337 ORM invariants during conflict resolution.
- Do not add compatibility aliases or migration bridges.

Boundaries:
- allowed owners/files: PR #342 package/runtime/CLI/docs/skill/changeset delta,
  generated outputs, merge conflicts, and accepted review repairs
- generated outputs: generated server/maintenance/runtime/type files, example,
  fixtures, tsconfig path maps, and skill mirror
- public exclusions: unrelated auth/product redesign and PR #352 performance work
- non-goals: redesigning all generated procedure ownership or broad bundle work

Output budget strategy:
- Restrict owner searches to the two public subpaths, generated ORM entries,
  four review threads, seven conflicts, and exact old route/name audits.

Blocked condition:
- Stop only for contradictory capability ownership, unrecoverable generated
  drift, or a reproducible environment failure after a different repair.

State capsule:
- current phase: closeout
- active candidate: merged capability graph plus isolated aggregate maintenance
- last proven fact: focused tests, package build, regenerated fixtures, intent,
  and example typecheck pass
- next proof: none; exact remote gates, merge, release, and npm read-back pass
- open blocker: none

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Vision/docs map read | yes | `VISION.md`, `docs/README.md` |
| Current/target owners mapped | yes | Source section and map below |
| Public exports mapped | yes | package exports and tsdown entries inspected |
| Convex entries/import graph mapped | yes | generated server and graph test inspected |
| Generated source/command mapped | yes | codegen owner; fixture sync/check |
| Docs/package skill impact mapped | yes | paired aggregate/auth references |
| Changeset/package proof decided | yes | minor hard cut, expected 0.25.0 |
| Agent-native pack/review decided | yes | CLI action to source/generated/skill map |
| Active goal checked or created | yes | batch goal resumed |

Work Checklist:
- [x] Candidate inventory and owner map recorded.
- [x] Selected split removes real optional runtime graph edges.
- [x] Conflict packet preserves current-main owners and injected capabilities.
- [x] Live review defects pass bounded red/green tests.
- [x] Old runtime exports/routes and stale generated output are absent.
- [x] Package, fixture, docs/skill, changeset, review, and repository gates pass.
- [x] Exact GitHub merge/release/read-back completes.

Owner / candidate map:
| Candidate | Current owner | Target owner | Public impact | Bundle impact | Generated impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| optional ORM runtimes | `kitcn/orm` root graph | aggregate and migration subpaths | breaking capability registration | removes optional root edges | codegen registers use | keep and prove |
| aggregate maintenance | conditional shared server | isolated generated aggregate entry | internal route hard cut | maintenance runtime stays entry-local | new generated module/maps | repair |
| rank fingerprint | sorted partition fields | declaration-order payload | none | none | dev rebuild decision | repair |
| auth middleware guidance | shared `getAuth` examples | session lookup plus action-only auth module | docs hard cut | avoids auth plugin graph in query/mutation modules | skill mirror | verify upstream fix |

Implementation packets:
| Packet | Owner/files | Acceptance | Deletions | Generated command | Proof | Status |
| --- | --- | --- | --- | --- | --- | --- |
| merge | seven conflicted runtime/CLI files | capability and released-main owners both survive | conflict markers | N/A | types/focused tests | complete |
| graph | ORM capabilities, subpath entries, lifecycle/query | root graph excludes optional runtimes and all write barriers remain | root value imports/types | package build | graph/capability/ORM tests | complete |
| maintenance | codegen and aggregate CLI | prune runs after final index removal from isolated entry | conditional prune skip/shared route | codegen + fixture sync | red/green CLI/codegen tests | complete |
| fingerprint | CLI backend owner | partition order changes fingerprint | sorted rank partitions | N/A | red/green fingerprint test | complete |
| closeout | docs/skill/changeset/plans | current concise contract and exact proof | stale release essay/claims | skill sync + fixtures | intent/check/review/remote | complete |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Target owner/source audit | yes | Prove root and leaf owners | pass: exact import graph |
| Old-surface audit | yes | Search runtime imports and stale routes | pass: no shared aggregate routes |
| Convex graph proof | yes | Import graph plus representative bundle | pass: 3 graph tests and build artifacts |
| Generated regeneration | yes | Codegen/example/fixture regeneration | pass: root/example/8 fixtures |
| Package/API proof | yes | types/build/focused tests/changeset | pass: 99 tests, types, build, minor status |
| Fixture/scenario proof | yes | sync/check and runtime lane | pass: all eight fixtures match fresh output |
| Docs/package skill sync | yes | paired current-state guidance | pass: intent validate/stale |
| Deslop | yes | zero-net bounded pass | pass: findings 167 to 167; score improved 3.08 |
| Agent-native reviewer | yes | CLI/source/generated/skill map | pass: command to owner to artifact map |
| Final lint/check | yes | lint and `bun check` | pass after bounded tree cleanup repair |
| Autoreview | yes | Resolve every accepted actionable finding | pass: clean exact branch P1 review at 0.87 |
| Goal plan complete | yes | Run plan completion audit | pass |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Intake | complete | vision, owners, PR, threads, conflicts | candidates |
| Candidate selection | complete | split retained; two behavior repairs accepted | implementation |
| Implementation | complete | conflicts and two review defects repaired | verification |
| Verification | complete | full check and clean exact branch P1 review | closeout |
| Closeout | complete | exact merge/release/npm/workflow read-back | done |

Decisions and tradeoffs:
- Drizzle-style leaf entries support the public subpath split; codegen hides
  registration for normal users while hand-written ORM setup stays explicit.
- The submitted numeric bundle claims are not trusted without rerunnable proof.
- Prune availability outranks a conditional early-return optimization because
  final-index removal is the cleanup case that matters.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Released main produced seven semantic conflicts | 1 | Merge both owners per conflict | resolved without choosing a whole side |
| Full check found 12 hand-written aggregate test ORMs without capabilities | 1 | Migrate the exact failing test owners to the hard-cut API | 62 focused integration tests pass |
| P1 review found tree-count batching recursively deleted unbounded nodes | 1 | Persist a per-tree traversal stack and bound node deletions | red deleted 29 nodes at limit 2; green deletes 2 and resumes |

Verification evidence:
- PR is substantive, not wholesale slop. The root import graph currently owns
  optional btree/backfill/migration code, contrary to project bundle doctrine.
- Two original review threads are fixed upstream by schema-aware registration
  and action-only auth guidance. The prune and rank-order findings remain valid.
- Released-main conflict audit found an additional required capability method:
  `assertAggregateIndexesWritable` must stay behind the aggregate capability.
- Rank partition order test failed before preserving declaration order and
  passes after the CLI fingerprint repair.
- Final-index prune test failed before removing the schema capability skip and
  passes against `generated/aggregate:aggregateBackfill` after the repair.
- `bun test` passed 99 capability, graph, lifecycle, CLI, and codegen tests.
- `bun --cwd packages/kitcn typecheck` and package build passed. Current build
  artifacts are 350.08 kB for `orm`, 96.92 kB for the aggregate leaf, and
  15.70 kB for migrations; the submitted numeric claims were discarded.
- `bun run fixtures:sync` regenerated all eight fixtures. Root codegen emitted
  metadata but could not run Convex without a root deployment; example codegen
  and example typecheck passed with a real deployment.
- `bun run intent:validate`, `bun run intent:stale`, and the changeset minor
  status passed.
- Deslop stayed bounded: 167 findings before and after, with repo score improved
  by 3.08. The public leaf barrel and generated directory fan-out are required
  ownership/output, not cleanup targets.
- Agent-native path passes: `kitcn codegen` and `kitcn aggregate prune` route
  through package CLI owners to isolated generated aggregate source/runtime,
  with current docs, skill mirror, fixtures, and focused tests.
- Structured P1 review found one accepted blocker: a single large rank tree
  bypassed the cleanup batch by recursively deleting every node. The tree row
  now persists a traversal stack, each call deletes at most the requested node
  count, and 50 focused btree/backfill tests plus package typecheck pass.
- Final `bun check` passes after the repair, including package tests, 827
  Vitest cases, CLI/Concave lanes, all eight fresh fixture comparisons, and
  runtime smoke scenarios.
- Exact `origin/main...HEAD` P1 autoreview is clean at 0.87 confidence after
  the accepted repair; no actionable finding remains.
- Exact head `cb3322c8` passed CI `32006113457`, Vercel, and auto-release,
  then squash-merged as `3aff976a`. Release PR #360 merged as `f3a602b8` and
  published GitHub plus npm `v0.25.0` for both packages with that exact
  `gitHead`. Post-release CI `32006568741`, skill audit `32006530625`, and
  Convex Matrix `32006560638` passed, including runtime scenarios.

Timeline:
- 2026-08-17 Architecture/autoclosure plan created after #341 release.
- 2026-08-17 PR #342 merged, v0.25.0 published, and all post-release gates
  passed.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | Done |
| What is the goal? | Ship the real graph split without cleanup or correctness regressions |
| What have I learned? | Core direction is sound; release story and two edge cases are slop |
| What have I done? | Repaired, proved, merged, released, and read back the exact artifacts and remote gates |

Open risks:
- None remaining inside PR #342 scope.
