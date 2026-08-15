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
| source behavior | yes | V8 regression tests and error unit tests | pending |
| package/API/build | yes | `bun --cwd packages/kitcn build` | pending |
| generated output | no | N/A: no generated output | complete |
| fixtures/scenarios | no | N/A: no fixture/scenario change | complete |
| docs/package skill | no | N/A: no docs or published skill change | complete |
| changeset | yes | `.changeset/crpc-error-payload-to-client.md` | pending |
| agent workflow | no | N/A: no agent surface changes | complete |
| cleanup/review | yes | deslop + autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | update/push/read back/merge/release #326 | pending |

Work Checklist:
- [ ] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [ ] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [ ] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [ ] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [ ] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [ ] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | Run smallest missing owning proof | pending |
| Source/generated audit | pending | Prove correct source and regenerated mirrors | pending |
| Package/docs/scenario closure | pending | Run every applicable local contract | pending |
| Deslop | pending | Run bounded cleanup or N/A | pending |
| Agent-native reviewer | pending | Run for workflow changes or N/A | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-15-pr-326-autoclosure.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR body/files/head/checks reconstructed | checkout/rebase |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- Pending.

Timeline:
- 2026-08-15T19:04:02.015Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge PR #326 and verify one release. |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- V8-only regression proof must remain in the Vitest lane after rebase.
