# Close ORM planner PR

Objective:
Close PR 317 after PR 316 by rebasing onto the merged RLS owner, proving the
query-planner bug class, closing review, passing `bun check`, and merging.

Flow mode:
one-shot execution

Goal plan:
docs/plans/317-close-orm-planner-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- PR 317 is rebased after PR 316; focused ORM tests and full checks pass on the
  rebased head; zero accepted findings remain; the changeset matches; PR is merged.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused ORM planner/relations/filter tests, package build/types, deslop,
  agent-native applicability audit, autoreview, lint, `bun check`, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 317 limit/index/LIKE/relation correctness
- allowed repairs: touched ORM source/tests and living changeset, plus rebase conflicts
- unrelated files: preserve; do not treat as blockers
- non-goals: new ORM APIs or RLS policy work outside PR 316 integration

Output budget strategy:
- Exact changed ORM files and focused failures; cap review/check output and exclude artifacts.

Blocked condition:
- A non-mechanical PR 316 conflict requiring a new contract, or repeated external/environment failure.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 317 body, 11 commits, 14 files, three unresolved threads, and pre-rebase checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Rebase after PR 316, fresh check, merge |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | no | N/A: ORM runtime behavior only |
| Source rule versus generated mirror boundary identified | no | N/A: no rule/mirror change |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded; applicability N/A |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused ORM tests | passed: 180 Vitest tests + 28 Bun evaluator/filter tests after rebase |
| package/API/build | yes | Package build/types | passed after rebase and repairs |
| generated output | no | N/A: no generated output | N/A |
| fixtures/scenarios | no | N/A: no scaffold behavior | N/A |
| docs/package skill | no | N/A: no docs/skill delta | N/A |
| changeset | yes | `.changeset/orm-query-planner-limit-index.md` audit | passed: minor breaks and planner/read-bound patches match |
| agent workflow | no | N/A: no agent workflow/action | N/A |
| cleanup/review | yes | Deslop and autoreview | deslop passed with zero net findings; final autoreview pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | Rebase/push/merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: no rule/generated mirror changed.
- [x] Agent-native pack: no agent action changed; discoverability N/A.
- [x] Agent-native pack: mirror sync N/A.
- [x] Agent-native pack: installed skill state unchanged.
- [x] Agent-native pack: agent routing/eval rows N/A.
- [x] Agent-native pack: agent-native review N/A after applicability audit.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Rebase import conflict in `query.ts` | 1 | Preserve RLS preflight and planner RLS detection imports | Resolved with all three evaluator imports |
| Rebase relation-map conflict in `rls.test.ts` | 1 | Preserve PR 316 relations and add PR 317 `users.secrets` relation | Resolved with both test intents |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused ORM tests after rebase | passed: 180 Vitest + 28 Bun tests |
| Source/generated audit | no | N/A: source-only runtime change | N/A |
| Package/docs/scenario closure | yes | Build package and audit changeset | passed: package build and minor changeset audit |
| Deslop | yes | Run changed-file cleanup review | passed: 168 -> 168 findings, +0.18 score; only existing ORM/auth fan-out hotspots |
| Agent-native reviewer | no | N/A: no agent-facing change | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | passed: 877 files; one formatting fix applied, focused proof rerun |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Rebase/push/squash-merge/read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/317-close-orm-planner-pr.md` | pending |
| Agent source / generated sync | no | N/A: no agent source/mirror | N/A |
| Installed lock audit | no | N/A: no skill state change | N/A |
| Agent action discoverability | no | N/A: no agent action | N/A |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | no | N/A after applicability audit | No agent surface |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | completed | PR body/commits/files/checks/threads and overlap reconstructed | rebase |
| Repair | completed | rebased onto `59b80d0f`; preserved both conflict intents; fixed eager flatMap and relation read bounds | review |
| Review/checks | in_progress | focused proof and deslop pass | build/types/lint/autoreview/check |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- Pre-rebase PR 317 CI/Vercel green; evidence becomes stale after PR 316 and must rerun.
- Rebased all 11 commits onto PR 316 merge `59b80d0f`; conflicts preserved RLS
  preflight, planner RLS detection, PR 316 relation fixtures, and PR 317
  `users.secrets` proof.
- Focused proof -> seven ORM Vitest files passed 180 tests with one skip;
  filter-expression and mutation-utils Bun suites passed 28 tests.
- ID-only pipeline proof reads one document by key; no repair required.
- Red read-bound regressions proved eager flatMap read 31 documents and
  relation loading read 44; lazy ordinal cursors and streaming post-fetch
  relation filters reduce both to their asserted bounds.
- Deslop -> 168 to 168 findings, score +0.18; no worthwhile local cleanup
  finding beyond the existing ORM/auth directory fan-out hotspots.
- Package build, root typecheck, and lint passed; the post-format focused rerun
  passed 180 Vitest tests with one skip and 28 Bun tests.

Timeline:
- 2026-08-14T18:17:54.701Z Autoclosure plan created.
- 2026-08-14T20:09:01Z PR 316 merged as `59b80d0f`.
- 2026-08-14T22:10:00Z Rebased PR 317 and resolved both shared-file conflicts from primary sources.
- 2026-08-14T22:16:00Z Closed flatMap and relation read-bound findings with red-to-green regressions.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Review/checks |
| Where am I going? | Build/types/lint, autoreview, `bun check`, delivery |
| What is the goal? | Rebase, prove, and merge PR 317 after PR 316 |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- Fresh full repository and GitHub checks remain after the rebase.

Findings:
- PR 317 is the only dependent branch in the batch.

Decisions and tradeoffs:
- Treat all pre-rebase checks as stale after PR 316 lands.

Review fixes:
- ID-only `select()` pipeline could scan by creation time -> already fixed in
  rebased commit and proved at one document read -> accepted as closed.
- `flatMap.limit` eagerly buffered sparse children before `maxScan` -> accepted
  -> lazy limited stream carries its match ordinal in the cursor, so physical
  reads stop at the scan budget and the per-parent limit survives pagination.
- Filtered/RLS many-relations collected every child -> accepted -> unordered
  relation scans apply post-fetch visibility while streaming and stop after
  `offset + limit` visible rows; scalar-filter and active-RLS read bounds pass.
