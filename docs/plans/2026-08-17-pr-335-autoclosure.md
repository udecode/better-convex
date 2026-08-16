# PR 335 autoclosure

Objective:
Autoclose PR #335 by retaining only proven ORM index/read-bound behavior,
repairing relation index selection, and delivering its breaking release with
source-backed proof.

Goal plan:
docs/plans/2026-08-17-pr-335-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Completion threshold:
- Limits and supported ordering reach the selected Convex index without
  consuming rows later rejected by RLS/relation filters; every stated bound has
  an owning read-count regression; package/docs/skill/changeset/review/full
  gates, pinned remote checks, merge, and release all pass.

Verification surface:
- Exact 22-file branch diff, index planner and relation loader owners, three P1
  threads, focused unit/integration/read-count tests, package build/typecheck,
  docs/skill parity, changeset, deslop, lint, full check, autoreview, pinned
  CI/Vercel, merge and release read-back.

Constraints:
- No ORM feature expansion beyond the PR's limit/order/read-bound invariant.
- Do not accept prose, benchmark anecdotes, or green CI without owner tests.
- Keep the breaking changeset only if current behavior and migration advice are
  both proven after the released-main merge.

Boundaries:
- intended delta: bound eligible ORM root/relation/through reads and remove
  repeated per-request/per-row ORM work without changing unrelated APIs
- allowed repairs: correctness, selection, test, docs/skill, changeset, and
  mergeability defects required by that invariant
- non-goals: stream pagination (#336), aggregate indexes (#337), capabilities
  (#342), or new query syntax

Blocked condition:
- Stop only if owning Convex runtime proof or maintainer merge authority remains
  unavailable after the documented retry path.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, 22-file diff, three P1 threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update/merge or close #335 and settle release |
| Active goal checked or created | yes | root batch goal active |
| Agent-native pack selected | yes | required by autoclosure |
| Agent-facing action surface identified | yes | published ORM docs and package skill mirror |
| Source rule versus generated mirror boundary identified | yes | package skill owns `.agents` generated mirror |
| Installed-skill lock versus local-rule owner identified | yes | no installed lock delta |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded for batch; docs/skill parity audited |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | ORM planner/relation owners and read-count tests | 214 focused tests green |
| package/API/build | yes | package typecheck/build | complete |
| generated output | yes | package skill source and `.agents` mirror | regenerated and byte-equal |
| fixtures/scenarios | yes | full check/runtime | complete |
| docs/package skill | yes | ORM docs plus package skill mirror | parity audit complete |
| changeset | yes | `.changeset/orm-index-pushdown.md` minor | current behavior/migration match |
| agent workflow | no | no rule/helper/workflow behavior | N/A |
| cleanup/review | yes | deslop and autoreview | complete; final P1 review clean |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, pinned checks, merge/release | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each local lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated, or N/A.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text, or N/A is recorded.
- [x] Agent-native pack: generated mirrors are synced when their package source changes.
- [x] Agent-native pack: installed skills are changed only through CLI; no lock delta.
- [x] Agent-native pack: no agent routing/helper action changed; eval rows are N/A.
- [x] Agent-native pack: accepted agent-native review findings are fixed or rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Changeset promises order-aware relation selection but code picks first FK prefix | 1 | add owner regression and make selection order-aware | fixed; 41 reads became bounded page |
| Bun did not treat the integration filename as a path | 1 | add `./` prefix | exposed the Vitest owner instead of product behavior |
| Bun lacks Vitest's `import.meta.glob` transform | 1 | run the owning Vitest project | red read-count assertion reproduced: 41 > 5 |
| Configured compound index was treated as native creation order | 1 | add a real configured-index ordering regression and require proven pushdown | fixed; `[90, 70]` became `[70, 20]` |
| P1 review claimed through relations skipped offset/limit | 1 | trace the final relation assignment and add ordered/bounded offset+limit tests | rejected; `applyOffsetAndLimit` owns the final slice and both tests pass |
| First configured-index repair rejected every ranged creation-order cursor | 1 | observe the real range builder and distinguish full equality prefixes from partial/range prefixes | fixed; full `by_name` equality cursor works while compound partial pin still sorts after fetch |
| Release migration snippet tried to index system `createdAt` | 1 | replace it at the changeset source with the narrower declared index whose implicit suffix is creation time | correction PR required before release #349 |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | focused planner/relation/read-bound tests | 62 Bun + 152 Vitest pass |
| Source/generated audit | complete | audit planner, docs and generated mirror | source/mirror parity and quality gates pass |
| Package/docs/scenario closure | complete | typecheck/build/full check | all pass |
| Deslop | complete | bounded changed-file cleanup | 167 -> 167, score unchanged; only line-shifted existing hits |
| Agent-native reviewer | complete | docs/skill mirror audit | capability map passes; no workflow action delta |
| Final lint | complete | `bun lint:fix` | 904 files clean |
| Repository check | complete | `bun check` | exit 0 |
| GitHub delivery | complete | exact-head checks, merge, release, npm, post-release CI | #335 `9b3494de`; #350 `f5669e95`; #349 `07dcff62`; v0.18.0 live |
| Autoreview | complete | final committed-head review | P1 clean; patch correct (0.82) |
| Goal plan complete | yes | run checker | complete |
| Agent source / generated sync | complete | regenerate/audit `.agents` mirror | sync command and byte comparison pass |
| Installed lock audit | N/A | no skill lock delta | N/A |
| Agent action discoverability | complete | package skill contains current ORM behavior | core links `references/features/orm.md` |
| Helper and template smoke | N/A | no helper/template delta | N/A |
| Agent-native review | complete | close docs/skill ownership findings | no findings |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback, released main | repair |
| Repair | complete | all three P1 paths repaired and focused green | review/checks |
| Review/checks | complete | focused tests, package/docs/skill/deslop/lint/full check, P1 autoreview | delivery |
| Delivery | complete | exact head `88011728` merged; release correction and release merged | closeout |
| Closeout | complete | npm/GitHub v0.18.0 and post-release CI read back | final |

Verification evidence:
- The contributor branch contains substantial source-backed optimizer work and
  is not disposable slop, but its 1,800-line diff requires direct owner proof.
- Earlier repairs refill through/relation pages after RLS and relation filters;
  their P1 threads remain unresolved but current source contains the fixes.
- The third P1 is valid: `findRelationIndex` returns the first FK-prefix index,
  so a later compound `(foreignKey, orderField)` index is ignored and the
  relation loader drains/sorts the full partition despite the changeset claim.
- Released main is v0.17.5 at `c38d4a7c`; PR #335 merged that exact main cleanly.
- TDD reproduced the selector bug directly (`by_author` instead of
  `by_author_likes`) and in the real loader (41 reads, expected at most 5).
  Order-aware selection now chooses the later compound index; both tests pass.
- P1 review found a second real defect: an opaque configured compound index
  incorrectly masqueraded as native `_creationTime` order. The owner test was
  red with `[90, 70]`; pushdown now requires proof and returns `[70, 20]`.
- Committed-head P1 review correctly caught that the first repair also rejected
  fully equality-pinned configured indexes. The runtime now records the actual
  range-builder operations: full equality prefixes retain creation-order cursor
  support, while partial and range prefixes cannot claim that order.
- The other P1 review claim was false: through relations already apply
  `applyOffsetAndLimit` at the final assignment. Exact ordered offset+limit and
  bounded-read offset+limit regressions both pass without a source workaround.
- All touched owner suites pass: 62 Bun tests and 152 Vitest tests (one skipped),
  including relation/RLS/count/order/filter paths. Package typecheck/build pass.
- `bun tooling/sync-kitcn-skill.ts` regenerated `.agents`; its ORM mirror is
  byte-equal to the package source. Doc-sync legacy/setup/discoverability gates
  pass. Coverage map: migrations and relation docs map to the advanced ORM
  feature reference; the query-tip edit is a compressed kitcn/Convex delta;
  no parity-only section was added or dropped.
- Agent-native capability map passes: relation query guidance -> `kitcn` skill
  -> package ORM feature source -> generated `.agents` mirror and www docs ->
  focused tests, sync comparison, package/full gates. No action/authority route
  changed.
- Slop delta is 167 -> 167 with score unchanged. Five added occurrences exactly
  replace five resolved occurrences in the same shifted file; the wrappers and
  fallback catches predate this PR and are required interface/fallback owners.
- `bun lint:fix` checked 904 files with no fixes. Full `bun check` exits 0 after
  all workspace typechecks/tests, CLI/Concave, fresh fixture parity, verify,
  auth smokes, and runtime scenarios.
- A fresh full `bun check` also exits 0 after the equality-prefix cursor repair;
  the final runtime source, not the earlier blunt fallback removal, owns this
  receipt.
- The same final source also retains a zero-net slop delta: 167 -> 167 and
  score 495.27 -> 495.27; no changed-file regression remains.
- Final committed-head P1 autoreview is clean: no accepted/actionable finding,
  `patch is correct` at 0.82 confidence. The accepted cursor finding converged
  in the second review-triggered repair cycle.
- Release PR #349 exposed stale migration advice that indexed system
  `createdAt`, which the ORM forbids. The source changeset now recommends
  `index('by_type').on(t.type)`, whose fully pinned partition is natively ordered
  by the implicit creation-time suffix.
- PR #335 exact head `88011728` passed CI `31977140952` and Vercel, then
  squash-merged as `9b3494de`. All three GitHub P1 threads were resolved.
- Source-owned release correction PR #350 passed its full CI/Vercel gates and
  merged as `f5669e95`; changesets regenerated #349 with the valid narrower
  index migration.
- Release PR #349 passed Convex Matrix `31978121819` and Vercel, merged as
  `07dcff62`, and published `kitcn@0.18.0`, `@kitcn/resend@0.18.0`, and GitHub
  `v0.18.0`. Post-release CI `31978889907` passed on the release commit.

Timeline:
- 2026-08-17 PR #335 merged released v0.17.5 main; confirmed third P1.
- 2026-08-17 PR #335, its source release correction, and v0.18.0 closed with
  exact remote, npm, GitHub release, and post-release CI receipts.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closeout complete |
| Where am I going? | PR #336 |
| What is the goal? | Ship only proven bounded ORM reads and correct ordering. |
| What have I learned? | Real work, but two advertised planner paths were unsafe or absent. |
| What have I done? | Repaired four real P1 paths, rejected one false finding, merged #335/#350/#349, and published v0.18.0. |

Open risks:
- None inside #335; later ORM PRs still require fresh released-main proof.
