# Close ORM RLS PR

Objective:
Close PR 316 as the fail-closed ORM RLS owner and merge it before PR 317 after
focused proof, source/mirror/docs sync, review closure, and `bun check`.

Flow mode:
one-shot execution

Goal plan:
docs/plans/316-close-orm-rls-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Role, nullish, and junction RLS regressions have focused proof; package skill,
  installed mirror, docs, and changeset agree; zero accepted findings remain;
  full checks pass; PR 316 is squash-merged before PR 317.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused ORM RLS tests, package build/types, package-skill/mirror/docs audit,
  deslop, agent-native review, autoreview, lint, `bun check`, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: fail-closed role/nullish/junction RLS behavior in PR 316
- allowed repairs: touched ORM RLS owner/tests/docs/package skill/changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: query-planner fixes owned by PR 317 or broader ORM redesign

Output budget strategy:
- Exact changed files, focused ORM tests, capped review/check failures; exclude
  build outputs, fixtures, coverage, and broad generated trees.

Blocked condition:
- Repeated external/environment failure or a finding requiring a new public ORM contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 316 body, two commits, nine changed files, and prior checks read after rebase onto merge `eddfc083` |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Merge before PR 317; no auto-release |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | yes | Published ORM package skill guidance |
| Source rule versus generated mirror boundary identified | yes | `packages/kitcn/skills/kitcn/**` owns `.agents/skills/kitcn/**` mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded fully |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused ORM RLS and tri-state tests | passed: 30 Vitest RLS + 23 Bun evaluator tests |
| package/API/build | yes | Package build/types | passed |
| generated output | yes | Package skill owner to `.agents` mirror audit | passed: regenerated and byte-identical |
| fixtures/scenarios | no | N/A: no scaffold output changes | N/A |
| docs/package skill | yes | www/package skill/mirror agreement | passed: role/null/relation guidance agrees |
| changeset | yes | `.changeset/orm-rls-fail-closed.md` audit | passed: minor breaking contract and patches match |
| agent workflow | yes | Published skill discoverability and mirror parity | passed: ORM reference owns the action and constraints |
| cleanup/review | yes | Deslop, agent-native review, autoreview | passed: final autoreview clean at 0.97 confidence; GitHub thread resolution pending |
| repository check | yes | `bun check` | passed after count/variant preflight repairs |
| GitHub delivery | yes | PR 316 merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill source owner and generated mirror are identified.
- [x] Agent-native pack: ORM RLS action/constraints remain discoverable.
- [x] Agent-native pack: package skill mirror parity is proved; `.agents/rules/**` is N/A.
- [x] Agent-native pack: installed skill membership is unchanged.
- [x] Agent-native pack: package skill guidance represents required behavior and forbidden fail-open behavior.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Focused `bun test` path omitted `./` and matched no files | 1 | Pass an explicit path | Reached the file; exposed Vitest-only `import.meta.glob` setup |
| Direct Bun execution cannot provide Vitest `import.meta.glob` | 1 | Run the repository's Vitest owner | `bunx vitest run convex/orm/rls.test.ts` passed |
| Root `bunx intent validate skills` resolved the unrelated npm package with no binary | 1 | Use the package-local Intent binary | `packages/kitcn/node_modules/.bin/intent validate skills` passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused RLS tests | passed: 30 RLS + 23 evaluator tests; includes query/mutation pre-read, nested relation-where, count, withVariants, and null-list guards |
| Source/generated audit | yes | Prove package skill to `.agents` mirror parity | passed: sync command plus `cmp` |
| Package/docs/scenario closure | yes | Build package; audit docs/skill/changeset | passed; scenarios N/A because scaffold output unchanged |
| Deslop | yes | Run changed-file cleanup review | passed: zero net findings; only unrelated auth fan-out hotspot |
| Agent-native reviewer | yes | Review published skill guidance/mirror | passed: action route, owner, mirror, docs, and proof are aligned |
| Final lint | yes | Run `bun lint:fix` | passed: 876 files, no fixes |
| Repository check | yes | Run `bun check` | passed end to end after count/variant preflight repairs |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | passed: no accepted/actionable findings, correctness confidence 0.97 |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/316-close-orm-rls-pr.md` | pending |
| Agent source / generated sync | yes | Verify package skill and installed mirror | passed: byte-identical after regeneration |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Source-audit ORM package skill route | passed: ORM RLS section names required configuration and forbidden fail-open behavior |
| Helper and template smoke | no | N/A: no workflow helper/template changed | N/A |
| Agent-native review | yes | Close accepted package-skill findings | passed: no residual finding |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | completed | contract, owners, overlap, commits, files, and prior checks reconstructed after rebase | focused proof |
| Repair | completed | moved explicit RLS-plan validation before root reads and added guarded regression proof | review |
| Review/checks | completed | seven GitHub findings fixed; 30 RLS + 23 evaluator tests, build/types/lint, autoreview, and `bun check` passed | publish and resolve threads |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 316 CI and Vercel were green at goal creation; no approval yet.
- Rebased cleanly onto `kitcn/main` at PR 318 merge `eddfc083`.
- `bunx vitest run convex/orm/rls.test.ts` -> 25 tests passed; type errors clean.
- Package build and root typecheck passed.
- `bun tooling/sync-kitcn-skill.ts`, package-local `intent validate skills`,
  `bun run intent:stale`, and package/mirror `cmp` passed.
- Agent-native review -> published ORM route, source owner, generated mirror,
  docs, and proof command agree; no accepted finding remains.
- `bun lint:fix` -> 876 files, no fixes; deslop delta has zero net findings.
- Autoreview against `kitcn/main` -> no accepted/actionable findings,
  correctness confidence 0.97.
- `bun check` -> passed end to end, including all fixtures, verification, and
  runtime scenarios.
- GitHub feedback repair proof -> 26 RLS Vitest tests and 23 mutation-utils Bun
  tests passed; package build, root typecheck, and lint passed again.
- Autoreview rerun -> no accepted/actionable findings, correctness confidence
  0.94; exact `bun check` rerun passed end to end.
- Mutation preflight repair proof -> 27 RLS Vitest tests and 23 evaluator Bun
  tests passed; package build, root typecheck, and lint passed again.
- Final autoreview -> no accepted/actionable findings, correctness confidence
  0.98; exact `bun check` passed end to end after the last repair.
- Nested relation-filter repair proof -> red regression resolved to 28 passing
  RLS tests; 23 evaluator tests, package build, root typecheck, and lint pass.
- Final nested-filter autoreview -> no accepted/actionable findings,
  correctness confidence 0.98; exact `bun check` passed end to end.
- Count/variant preflight repair proof -> two red regressions resolved to 30
  passing RLS tests; 23 evaluator tests, package build, root typecheck, and lint
  pass.
- Final count/variant autoreview -> no accepted/actionable findings,
  correctness confidence 0.97; exact `bun check` passed end to end.

Timeline:
- 2026-08-14T18:17:54.580Z Autoclosure plan created.
- 2026-08-14T21:04:00Z Rebased onto current main and reconstructed the fail-closed RLS delta.
- 2026-08-14T21:07:00Z Closed the pre-read validation gap and passed focused/package/agent-native gates.
- 2026-08-14T21:16:00Z Independent autoreview and exact `bun check` passed.
- 2026-08-14T21:19:00Z Fixed `NOT IN` null-member semantics and relational-where preflight gaps from GitHub review.
- 2026-08-14T21:26:00Z Fresh autoreview and exact repository check passed after both feedback repairs.
- 2026-08-14T21:28:00Z Moved update/delete role validation ahead of every candidate-row read.
- 2026-08-14T21:34:00Z Final autoreview and exact repository check passed after all four repairs.
- 2026-08-14T21:37:00Z Added nested relation-filter preflight after a fresh GitHub review finding.
- 2026-08-14T21:43:00Z Final autoreview and repository check passed after the nested-filter repair.
- 2026-08-14T21:54:00Z Added empty-parent count and pre-read withVariants validation after two fresh GitHub findings.
- 2026-08-14T22:00:00Z Final autoreview and repository check passed after all seven review repairs.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Delivery |
| Where am I going? | Publish fixes, resolve GitHub threads, merge |
| What is the goal? | Merge fail-closed RLS owner before PR 317 |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- PR 317 overlaps `packages/kitcn/src/orm/query.ts` and `convex/orm/rls.test.ts`.

Findings:
- PR 316 is the dependency root for the two-PR ORM sequence.

Decisions and tradeoffs:
- Merge before PR 317 to resolve shared ORM ownership once.

Review fixes:
- Docs promised pre-read policy validation but root reads validated only during
  finalization -> accepted -> moved explicit plan validation before the first
  database read and added a `query`/`get` guard regression test.
- `notInArray` with a nullish list member returned true for non-matches ->
  accepted -> SQL tri-state `IN`/`NOT IN` now returns unknown unless a concrete
  match decides the result; focused evaluator and RLS tests added.
- Named-role tables referenced only through relational `where` were skipped by
  empty roots -> accepted -> preflight now walks the relation plan derived from
  `where`; empty-root regression proof added.
- Update/delete collected candidates before role validation -> accepted -> both
  builders now validate before `query` or `get`; guarded regression proof added.
- Nested relation `where` filters were absent from recursive preflight ->
  accepted -> each relation merges its derived filter plan with explicit `with`
  before recursion; empty-parent regression proof added.
- RLS relation counts skipped validation on empty parents -> accepted ->
  selected count targets and required junction tables validate before root
  reads; empty-parent regression proof added.
- `withVariants` relations were added only during finalization -> accepted ->
  execute resolves the effective polymorphic relation plan before the root
  read; guarded regression proof added.
