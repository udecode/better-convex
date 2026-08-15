# PR 326 autoclosure

Objective:
Autoclose PR #326; done when CRPC error payload preservation is reviewed,
checked, merged, and its single release is verified through npm and CI.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-15-pr-326-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- PR #326 merged from the reviewed head with V8 regression proof, package
  build, lint, `bun check`, remote checks green, then one release published and
  post-release CI green.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Node/V8 error tests, package build, deslop, autoreview, `bun check`, PR checks,
  GitHub release/npm latest/post-release CI.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: preserve Convex error payloads by not overwriting converted stacks
- allowed repairs: error conversion tests/source/changeset fixes required by review
- unrelated files: preserve; do not treat as blockers
- non-goals: unrelated error API changes or additional release triggers

Output budget strategy:
- Read exact error files and focused tests; cap full-check/release output.

Blocked condition:
- Stop only for repeated infrastructure failure, missing merge/release authority,
  or a repair that changes the accepted issue scope.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR #326 body/files/head/checks read at `43e1694d`. |
| Intended delta and exclusions recorded | yes | Boundaries above. |
| Closure matrix classified | yes | Matrix below. |
| GitHub delivery expectation recorded | yes | Final merge owns the one batch release. |
| Active goal checked or created | yes | Root batch goal owns this linked plan. |
| Agent-native pack selected | yes | Materialized by autoclosure requirement. |
| Agent-facing action surface identified | no | N/A: no agent action changes. |
| Source rule versus generated mirror boundary identified | no | N/A: no agent mirrors. |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill install changes. |
| `agent-native-reviewer` loaded or waiver recorded | no | N/A: no agent-native delta. |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | V8: 7 pass; Bun error unit: 16 pass | complete |
| package/API/build | yes | `bun --cwd packages/kitcn build`: pass | complete |
| generated output | no | N/A: no generated output | complete |
| fixtures/scenarios | no | N/A: no fixture/scenario change | complete |
| docs/package skill | no | N/A: no docs or published skill change | complete |
| changeset | yes | Patch changeset matches client payload/stack behavior | complete |
| agent workflow | no | N/A: no agent surface changes | complete |
| cleanup/review | yes | deslop + autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | update/push/read back/merge/release #326 | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is classified with concrete owner or N/A reason.
- [x] Generated output: N/A, no generated file changed.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized for current local state.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner: none.
- [x] Agent-native pack: N/A, no agent rule or generated skill mirror changed.
- [x] Agent-native pack: N/A, no changed agent action.
- [x] Agent-native pack: N/A, no `.agents/rules/**` change.
- [x] Agent-native pack: N/A, no installed skill changed; installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: N/A, no agent workflow behavior to evaluate.
- [x] Agent-native pack: N/A, no agent-native review findings.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run smallest missing owning proof | V8 7/7 and Bun error 16/16 pass |
| Source/generated audit | no | Prove correct source and regenerated mirrors | N/A: no generated output; four stack assignments removed in owner |
| Package/docs/scenario closure | yes | Run every applicable local contract | Package build pass; changeset audited; scenarios owned by final `bun check` |
| Deslop | yes | Run bounded cleanup or N/A | 0 added occurrences; fan-out heuristic ignored because V8 requires its own `.vitest.ts` lane |
| Agent-native reviewer | no | Run for workflow changes or N/A | N/A: no agent workflow change |
| Final lint | yes | Run `bun lint:fix` | 883 files checked; no fixes |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-15-pr-326-autoclosure.md` | pending |
| Agent source / generated sync | no | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | N/A: no agent rule change |
| Installed lock audit | no | Verify expected lock entries and removed skills through CLI-managed state | N/A: no installed skill change |
| Agent action discoverability | no | Source-audit the skill/rule path an agent will read | N/A: no agent action change |
| Helper and template smoke | no | Syntax-check helpers and prove incomplete failure/completed representation when applicable | N/A: no helper/template change |
| Agent-native review | no | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | N/A: no agent-native delta |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR body/files/head/checks reconstructed | checkout/rebase |
| Repair | complete | Replaced two new `any` casts with `Value`; V8 test remains 7/7 | review |
| Review/checks | in_progress | focused tests, build, deslop, lint pass | autoreview and `bun check` |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- `get-pr-comments 326`: 0 threads, 0 review bodies, only changeset bot metadata.
- `bunx vitest run packages/kitcn/src/server/error.vitest.ts`: 7 pass, 0 fail, no type errors.
- `bun test packages/kitcn/src/server/error.test.ts`: 16 pass, 0 fail.
- `bun --cwd packages/kitcn build`: pass.
- `bun run lint:slop:delta`: 0 added occurrences; one directory fan-out
  heuristic ignored because the separate V8 test lane is required.
- `bun lint:fix`: 883 files checked; no fixes.

Review fixes:
- Local standards audit found two new `any` uses in `error.vitest.ts`; accepted
  and replaced with Convex `Value`; focused V8 proof stayed 7/7.

Timeline:
- 2026-08-15T19:04:02.015Z Autoclosure plan created.
- 2026-08-15 Rebased onto #324 merge; source/issue/feedback reconstructed.
- 2026-08-15 Focused tests/build/lint passed; two test-only `any` uses removed.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Review/checks |
| Where am I going? | Autoreview, `bun check`, push, remote checks, merge, release |
| What is the goal? | Merge PR #326 and verify one release. |
| What have I learned? | V8 lazy stack materialization is the payload-loss trigger; no GitHub feedback exists. |
| What have I done? | Rebased, tightened types, and passed focused/package/deslop/lint gates. |

Open risks:
- Remote release automation must publish exactly once after the final merge.
