# Review and autoclose PRs 329 through 342

Objective:
Audit PRs #329-#342 for generated or speculative slop, close invalid work with
source-backed evidence, and autoclose every viable PR in dependency-safe order.

Goal plan:
docs/plans/2026-08-16-review-and-autoclose-prs-329-through-342.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- [PR #329 autoclosure](docs/plans/2026-08-16-pr-329-autoclosure.md) -
  Solid infinite-query mount crash and first release root.
- [PR #330 autoclosure](docs/plans/2026-08-16-pr-330-autoclosure.md) -
  CLI lazy startup/codegen refactor and custom-root watcher repair.
- [PR #331 autoclosure](docs/plans/2026-08-16-pr-331-autoclosure.md) -
  ORM write-path read reduction with hook and RLS correctness repairs.
- [PR #333 autoclosure](docs/plans/2026-08-16-pr-333-autoclosure.md) -
  Turbo/CI input cleanup and throwable scaffold command failures.
- [PR #334 autoclosure](docs/plans/2026-08-16-pr-334-autoclosure.md) -
  Example/docs render and read-path cleanup with browser proof.
- [PR #332 autoclosure](docs/plans/2026-08-16-pr-332-autoclosure.md) -
  React identity stability and auth token rotation.
- [PR #335 autoclosure](docs/plans/2026-08-17-pr-335-autoclosure.md) -
  ORM limit/order pushdown and relation index selection.
- [PR #336 autoclosure](docs/plans/2026-08-17-pr-336-autoclosure.md) -
  ORM stream amplification and ID-list pagination.
- [PR #337 autoclosure](docs/plans/2026-08-17-pr-337-autoclosure.md) -
  Aggregate-index read bounds, maintenance, and extrema budget accounting.
- [PR #338 autoclosure](docs/plans/2026-08-17-pr-338-autoclosure.md) -
  Auth runtime hot paths and bounded persisted-session recovery.
- [PR #339 autoclosure](docs/plans/2026-08-17-pr-339-autoclosure.md) -
  Solid/React auth and query parity.
- [PR #340 autoclosure](docs/plans/2026-08-17-pr-340-autoclosure.md) -
  Single-pass cRPC validation and definition-time schema plans.
- [PR #341 autoclosure](docs/plans/2026-08-17-pr-341-autoclosure.md) -
  Request-keyed anonymous rate limits with manual cleanup only.
- [PR #342 autoclosure](docs/plans/2026-08-17-pr-342-autoclosure.md) -
  Explicit ORM capabilities and isolated optional runtime graphs.

Completion threshold:
- All 14 frozen PRs (#329-#342) have a recorded intent, overlap/dependency map,
  source-backed slop verdict, applicable closure-matrix proof, final GitHub
  disposition, and remote read-back. Viable PRs are merged; invalid or
  redundant PRs are closed with concise evidence.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Local fetched PR refs and exact diffs; owning source/tests; PR comments and
  review threads; focused proof; `deslop`; `agent-native-reviewer`;
  `autoreview`; `bun lint:fix`; `bun check`; changeset coverage; merge-base and
  branch-head GitHub checks; final open/merged/closed PR read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Green CI is necessary but not a quality verdict; reject scope without a real
  invariant, redundant edits, benchmark-free performance claims, API churn,
  test laundering, generated-file-first changes, and unrelated bundles.
- Process one frozen PR at a time in dependency-safe order. Re-evaluate later
  PRs after earlier merges change `main`.
- User authorized the autoclosure GitHub path for each viable PR and closure of
  proven slop; do not merge speculative work merely to empty the queue.

Boundaries:
- intended delta: PRs #329-#342 by `MikeyZhang75`, frozen from the open-PR
  snapshot on 2026-08-16; #343 is excluded as our existing issue #328 PR
- allowed repairs: defects required to preserve the stated PR invariant,
  source/generated ownership, proof, changeset, or mergeability
- unrelated files: preserve; do not treat as blockers
- non-goals: new product scope, opportunistic architecture changes, merging
  because CI is green, release publication beyond PR merge receipts

Output budget strategy:
- Fetch each PR head once; inventory filenames/stats/commit/body in bounded
  tables before reading diffs; inspect exact owner slices; save full noisy test
  output to `/tmp` and report exit/tails; never stream all 14 diffs or CI logs.

Blocked condition:
- Stop only if repository protection or missing maintainer authority prevents
  merge/close after three verified attempts, or the same infrastructure failure
  survives three materially different diagnostics with no safe next move.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | frozen GitHub snapshot contains PRs #329-#342 from `MikeyZhang75`; current PR #343 excluded |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | every PR gets the same matrix; applicability resolved from its exact file/behavior owners |
| GitHub delivery expectation recorded | yes | merge viable PRs; close invalid/redundant PRs with evidence; final remote read-back |
| Active goal checked or created | yes | no active goal; batch goal will use this exact plan |
| Agent-native pack selected | yes | required by `autoclosure`; materialized in this plan |
| Agent-facing action surface identified | yes | any PR touching `.agents`, `.claude`, `.codex`, prompts, skills, workflows, or user-action tooling triggers the agent-native lane |
| Source rule versus generated mirror boundary identified | yes | `.agents/AGENTS.md` and `.agents/rules/**` own generated mirrors; PR-specific audit required if touched |
| Installed-skill lock versus local-rule owner identified | yes | `skills-lock.json` is CLI-managed; repository rules/templates/helpers remain source-owned |
| `agent-native-reviewer` loaded or waiver recorded | yes | mandatory before viable PR delivery; load once before first applicable review and apply per PR |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | exact invariant plus focused tests/runtime per PR | pass |
| package/API/build | conditional | public exports/types/build per touched package | pass where applicable |
| generated output | conditional | owner plus regeneration/diff | pass where applicable |
| fixtures/scenarios | conditional | sync/check/runtime proof | pass where applicable |
| docs/package skill | conditional | paired owner audit | pass where applicable |
| changeset | conditional | package delta coverage | pass where applicable |
| agent workflow | conditional | source/mirror/lock/helper proof | pass where applicable |
| cleanup/review | yes | deslop, agent-native reviewer, autoreview | pass |
| repository check | yes | `bun check` | pass |
| GitHub delivery | yes | source-backed merge or close plus remote read-back | pass |

PR disposition ledger:
| PR | Intended invariant | Initial slop verdict | Feedback | Dependency / order | Status |
| --- | --- | --- | --- | --- | --- |
| #329 | Solid infinite query mounts against real Solid Query | not slop; real compact correctness fix | 0 threads | first; #339 depends on it | closed: merged/released 0.17.2, post-release CI green |
| #330 | lazy CLI startup and bounded codegen rework | credible but broad; not slop | repaired: 1 outdated + 1 current P2 | before #337/#342 | closed: merged `b78d94a5`, remote gates green |
| #331 | remove ORM write-path rereads without corrupting hooks/RLS | credible but oversized; not slop | 1 obsolete + 1 repaired P1; structured review found/fixed another RLS P1 | before #335/#336/#337/#342 | closed: merged `23c0c999`, remote gates green |
| #332 | preserve React queries across token rotation | credible but overstuffed; accidental public API and stale release story were slop and removed | thread resolved | before #339 | closed: merged `2609245d`, released v0.17.5 |
| #333 | correct Turbo/CI inputs and delete dead work | credible tooling cleanup | 0 threads | before #342; ride 0.18 release | closed: merged `413d4068`, remote gates green |
| #334 | reduce example/www client work and reads | mixed but mostly real; three proof/owner defects were slop and repaired | both threads resolved | codegen fix released in 0.17.4 | closed: merged `6bc8d1ca`, released 0.17.4 |
| #335 | push ORM limit/order into indexes | valuable but high-risk; advertised index preference was missing | 3 GitHub P1s plus 2 accepted local P1s repaired; 1 local P1 rejected with owner proof | before #336/#337/#342 | closed: merged `9b3494de`, released v0.18.0, post-release CI green |
| #336 | bound streams and id-list pagination | credible, not slop; release/docs claims overstated and iterator cleanup incomplete | first P2 repaired upstream; second accepted locally; four local cleanup regressions repaired | after #335 | closed: merged `aba33f55`, released v0.19.0, post-release CI green |
| #337 | bound aggregate reads and clearing | valuable but high-risk; duplicate helper, budget, discovery, and clearing-race gaps repaired | first P1 fixed upstream; five local P1 blockers repaired across two bounded review cycles | before #342 | closed: merged `5d3172b2`, released v0.20.0, post-release CI green |
| #338 | cache auth schema and repair session restore | credible, breaking; session races and paginated uniqueness repaired | 3 GitHub P1s plus 1 accepted local P1 | after released #337 | closed: merged `7163710a`, released v0.21.0, post-release CI green |
| #339 | restore Solid/React parity | credible but broad; stale changeset story was slop and removed | 4 outdated threads plus accepted local privacy findings | after #329/#332 | closed: merged `ed72944a`, corrected and released v0.22.1, post-release CI green |
| #340 | validate cRPC output once | credible; not slop, but handler/client output typing was wrong | 2 upstream repairs plus 1 accepted local P1 | after released #339 | closed: merged `13fbae32`, released v0.23.0, post-release CI green |
| #341 | key anonymous rate limits per request | mixed but substantive; deny-list safety and recurring cleanup proposal were slop | 2 upstream fixes plus 2 accepted P1s | after released #340 | closed: merged `c255ae2a`, released v0.24.0, post-release gates green; manual cleanup only |
| #342 | inject ORM capabilities to cut bundle graphs | substantive, not wholesale slop; release claims and two unbounded/cleanup edge cases required repair | 4 threads resolved plus 1 accepted local P1 | last; depends on #330/#331/#333/#335/#337/#341 | closed: merged `3aff976a`, released v0.25.0, post-release gates green |

Dependency-safe order:
- Release 0.17.2: #329.
- Released 0.17.4: #331 plus #334's package repair; #333 had no package delta.
- Released 0.17.5: #332.
- Release 0.19.x: #335 then #336.
- Released 0.20.0: #337.
- Released in order after #337: #338, #339, #340, #341, then #342 after the
  explicit high-risk proof recorded below.

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner: none.
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [x] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [x] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| overlap loop generated an invalid self/343 pair at the final bound | 1 | trust only pairs with `a < b`; use frozen 329-342 bound explicitly next time | valid overlap pairs preserved; bad tail ignored |
| feedback compactor assumed thread fields were top-level | 1 | inspect raw #330 schema and map `.review_threads[].node` | recovered; all 14 feedback ledgers fetched |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run smallest missing owning proof | pass per linked PR plans |
| Source/generated audit | yes | Prove correct source and regenerated mirrors | pass per applicable PR plans |
| Package/docs/scenario closure | yes | Run every applicable local contract | pass |
| Deslop | yes | Run bounded cleanup or N/A | pass per PR |
| Agent-native reviewer | yes | Run for workflow changes or N/A | pass for applicable CLI/workflow changes |
| Final lint | yes | Run `bun lint:fix` | pass per delivered PR |
| Repository check | yes | Run `bun check` | pass; post-release CI `32006568741` green |
| GitHub delivery | yes | Merge/release and read back every PR | pass |
| Autoreview | yes | Resolve every accepted actionable finding | pass per PR |
| Goal plan complete | yes | Run completion checker | pass after final receipt update |
| Agent source / generated sync | no | No source-rule change in final delta | N/A |
| Installed lock audit | no | No installed-skill lock change | N/A |
| Agent action discoverability | yes | Audit CLI/source/generated/skill route | pass for #342 |
| Helper and template smoke | no | No helper/template delta in closeout | N/A |
| Agent-native review | yes | Close applicable agent-native findings | pass |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | all 14 exact heads, owners, overlaps, and threads recorded | repair |
| Repair | complete | accepted correctness, ownership, and proof defects fixed | review |
| Review/checks | complete | focused/full gates and final reviews pass | delivery |
| Delivery | complete | every PR merged and applicable releases published | final audit |
| Closeout | complete | exact #342/release/npm/workflow read-back | done |

Verification evidence:
- GitHub snapshot: 14 contributor PRs #329-#342; every head had green CI and
  Vercel at inventory time, but 12 PRs have unresolved source/review owners.
- Local refs `refs/pr/329` through `refs/pr/342` fetched from the authoritative
  repository; file-overlap matrix establishes the order above.
- `get-pr-comments` fetched all 14 feedback ledgers: 30 unresolved threads total
  (P1/P2), concentrated in #330-#342; #329 and #333 have none.
- #329 source audit proves the crash owner against TanStack's real Solid Query
  implementation; focused 9-test regression, typecheck, build, changeset,
  deslop, lint, full `bun check`, and autoreview all pass after merging main.
- #329 merged at `c8531153`; release PR #344 merged at `7728ed62`; npm and
  GitHub `v0.17.2` are live; post-release CI run `31966196360` passed.
- #330's remaining current review finding is valid: `getWatchRoots` handles
  `backend/functions` but still misses siblings for `backend/api` because it
  assumes the final directory is literally named `functions`.
- #330 repair derives nested ownership from the configured path relative to
  the project, with a failing-then-passing `backend/api` regression; focused
  tests, package build, changeset, deslop, lint, full check, and autoreview pass.
- #330 pushed as `767c1b10`, cleared both review threads, passed CI run
  `31967153872` plus Vercel, and squash-merged as `b78d94a5`.
- #331's RLS execution-scope complaint is already fixed by per-execution query
  cloning and three focused tests. Its same-document `innerDb.patch` complaint
  is real: the derived after/change payload starts from a stale pre-hook doc.
- #331 now conditionally snapshots after a before-hook, preserving raw writes
  without regressing ordinary zero/one-read paths. Structured review also found
  statement-wide RLS caching crossed writes in multi-row insert/delete; two
  integration regressions now enforce per-row resolution for those loops.
- #331 passed 62 focused tests, package typecheck/build, deslop, committed-head
  autoreview, lint, full `bun check`, CI run `31968579515`, and Vercel; both
  feedback threads are resolved and the pinned head squash-merged as `23c0c999`.
- #330's patch changeset auto-published separately as `0.17.3` through release
  PR #345. #331 remains an unreleased patch and can ride #332's minor trigger.
- #333's final six-file tooling delta passed 45 focused tests, Turbo dry-run,
  zero slop delta, agent-native audit, lint, full check, committed-head review,
  CI run `31969584708`, and Vercel; it merged as `413d4068` with no release.
- #334's dropdown reuse is not a valid existence contract: it subscribes the
  app shell to up to 2,000 rows. A red/green production-owner test now drives a
  dedicated indexed `projects.hasAny` query and generated client/runtime output.
- #334 also contained copied tag tests and a no-assertion HTTP codegen test.
  Repairs route tests through real owners, preserve nested HTTP route metadata,
  regenerate 17 routes, and pass 4 focused read-count tests, 63 codegen tests,
  package build, example/Convex typechecks, five Browser routes, responsive
  walkthrough proof, zero slop delta, lint, and full `bun check`.
- #334 head `26b8f4de` passed CI `31971886260` and Vercel, then merged as
  `6bc8d1ca`; release PR #346 passed the 15-minute Convex Matrix/runtime lane,
  merged as `e79a0d8d`, and published npm/GitHub `v0.17.4`.
- #332 merged released main cleanly. Its 80 focused React tests pass. The auth
  identity comparison and referential-stability invariants are real; its stale
  claim that an additive export requires a minor is release-story slop. The
  branch itself already follows repository v0 policy with a patch changeset.
- #332 committed head `0d9f81b1` passed autoreview, CI `31973863217`, and
  Vercel; the review thread was resolved and PR #332 squash-merged as
  `2609245d`. Release PR #348 passed Convex Matrix `31974237216`, merged as
  `c38d4a7c`, published npm/GitHub `v0.17.5`, and post-release CI
  `31974926735` passed.
- #335 merged released v0.17.5 main cleanly. TDD proved its remaining P1:
  relation selection chose the first FK index and read 41 documents despite a
  later order-serving compound index. The repaired selector reads the bounded
  page. P1 review then exposed an opaque configured index masquerading as
  native creation order; its red `[90, 70]` result now returns `[70, 20]` only
  after proven pushdown. Committed-head review then caught a compatibility gap:
  fully equality-pinned configured indexes must retain creation-order cursors.
  The real range-builder operations now prove that case without blessing
  partial/range prefixes. A through-slicing claim was rejected because the final
  owner already applies offset/limit, backed by exact and bounded regressions.
  All 62 unit plus 152 integration tests, package typecheck/build, generated
  skill parity, doc-sync quality gates, agent-native map, and zero-net slop
  delta pass. Final `bun check` also passes after both configured-index repairs,
  including fresh fixtures and runtime scenarios.
- #335 exact head `88011728` passed CI `31977140952` and merged as `9b3494de`.
  Source correction #350 merged as `f5669e95`; regenerated release #349 passed
  Convex Matrix `31978121819`, merged as `07dcff62`, and published both npm
  packages plus GitHub `v0.18.0`. Post-release CI `31978889907` passed.
- #336 merged released v0.18.0 main source-first. The docs/package skill now
  scope input-order and bounded read claims to `.select()` and count missing or
  policy-filtered IDs honestly. Four red iterator-return tests proved that
  mapped, merged, distinct, and direct early exits did not propagate cleanup;
  the repaired wrappers pass 61 focused tests, package typecheck/build, skill
  mirror/intent gates, zero-net slop delta, full `bun check`, and P1 autoreview.
- #337 exact head `9054d2f3` passed CI `31981859413` and Vercel, then merged
  as `5d3172b2`. Release PR #353 passed Convex Matrix `31982252778`, merged as
  `778464fc`, and published both npm packages plus GitHub `v0.20.0` at that
  exact commit. Post-release CI `31983014399` passed.
- #340 exact head `9c5050c3` passed all remote gates and squash-merged as
  `13fbae32`. Release PR #358 merged as `d5ff987e`, published both npm packages
  plus GitHub `v0.23.0`, and post-release CI `31998182904` passed. Release
  Convex Matrix `31998177107` passed job `95293531708`, including the full
  version matrix and runtime scenarios.
- #341 is not wholesale slop, but its deny-list retained blocked members without
  a bound, counted an inactivity interval instead of a rolling window, and
  collided long values sharing prefix and length. Focused red/green tests cover
  all three repairs. Recurring cleanup is rejected; an indexed batched private
  mutation provides manual/on-demand cleanup instead.
- #341 final bounded protection is explicitly an LRU optimization over the
  database limiter: histories evict before blocks, active blocks refresh, and
  cold blocks may evict only at total saturation. The final P1 review is clean
  at 0.92 after two accepted security findings defined that honest contract.
- #341 passes 99 focused tests, package/example typechecks, package build, all
  eight fixture sync/check variants, intent gates, zero-net deslop, `bun check`,
  and an explicit all-scenario runtime rerun. Exact head `38d04cad` merged as
  `c255ae2a`; release PR #359 merged as `2f34a0e4`, published npm/GitHub
  `v0.24.0`, and passed Convex Matrix `32002013196` plus post-release CI
  `32002022128`.
- #338 is real auth-runtime work, not disposable slop. Three live P1 races were
  repaired: restore success rechecks token/session ownership, each transport
  probe shares the grace deadline, and stable session IDs distinguish a cloned
  seed from a competing sign-in. The released-main branch passes 100 focused
  auth tests, package typecheck/build, zero-net deslop, lint, full `bun check`,
  and a clean P1 repair review at 0.91 confidence.
- Whole-branch P1 review then proved transaction-local update uniqueness could
  accept one row from a nonterminal filtered page while a second match remained
  behind its continuation cursor. A red 201-row scan regression reproduced the
  arbitrary update. The mutation now continues inside the same transaction
  until terminal or two matches; 101 focused auth tests pass. Final whole-
  branch P1 review is clean at 0.87 and the exact full-gate retry passes.
- #342 exact head `cb3322c8` passed CI `32006113457`, Vercel, and the
  auto-release gate, then squash-merged as `3aff976a`. Release PR #360 merged
  as `f3a602b8` and published GitHub plus npm `v0.25.0` for `kitcn` and
  `@kitcn/resend`, both with exact `gitHead` `f3a602b8`. Post-release CI
  `32006568741`, skill audit `32006530625`, and Convex Matrix
  `32006560638` all passed; the latter includes the full version matrix and
  runtime scenarios. No cron or recurring workflow was added.

Timeline:
- 2026-08-16T18:31:28.829Z Autoclosure plan created.
- 2026-08-16 Froze #329-#342, fetched local refs, audited PR bodies/files/checks,
  mapped overlaps, and retrieved every unresolved feedback thread.
- 2026-08-17 Closed all 14 PRs in dependency-safe order and verified the final
  v0.25.0 release, npm provenance, post-release CI, and Convex matrix.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | Done; PR #352 remains outside this frozen batch |
| What is the goal? | Give every PR #329-#342 an honest slop verdict and final disposition, then autoclose each viable PR. |
| What have I learned? | The batch was mostly substantive but repeatedly mixed real work with stale claims, unsafe bounds, and incomplete ownership. |
| What have I done? | Repaired, reviewed, merged, released, and remotely verified all 14 frozen PRs without adding recurring automation. |

Open risks:
- None inside the frozen #329-#342 batch. PR #352 is explicitly outside scope.
