# PR 324 326 autoclosure batch

Objective:
Merge PRs #324 and #326 in that order; done when both are merged, #326 triggers
one release, and GitHub/npm/post-release checks are green.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-15-pr-324-326-autoclosure-batch.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- [PR #324 autoclosure](docs/plans/2026-08-15-pr-324-autoclosure.md) - owns codegen fix closeout.
- [PR #326 autoclosure](docs/plans/2026-08-15-pr-326-autoclosure.md) - owns CRPC error fix and release closeout.

Completion threshold:
- PRs #324 and #326 merged from reviewed head commits with all required checks green.
- Exactly one release is triggered from final PR #326; GitHub release, npm latest
  for affected packages, and post-release CI are verified.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Each linked child plan owns targeted proof, source/generated audit, reviews,
  `bun check`, PR read-back, and merge receipt.
- Root proof is live GitHub PR/release state plus npm latest and post-release CI.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: existing PR #324 codegen import fix and PR #326 CRPC error fix
- allowed repairs: only actionable review/check/rebase findings inside either PR scope
- unrelated files: preserve; do not treat as blockers
- non-goals: new product behavior, unrelated cleanup, extra release triggers

Output budget strategy:
- Query exact PRs/files/threads; cap logs and command output; save large check
  output rather than streaming it.

Blocked condition:
- Stop only for an unresolvable protected-branch/release permission failure,
  repeated CI infrastructure failure, or a scope-changing repair.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | Live PR bodies, files, commits, checks, and prior batch receipts read. |
| Intended delta and exclusions recorded | yes | Boundaries above. |
| Closure matrix classified | yes | Matrix below; child plans own lane detail. |
| GitHub delivery expectation recorded | yes | Merge both; release only from final #326. |
| Active goal checked or created | yes | `get_goal`: no active goal; this shell is ready for creation. |
| Agent-native pack selected | yes | Materialized because autoclosure requires the pack. |
| Agent-facing action surface identified | no | N/A: neither PR changes agent behavior. |
| Source rule versus generated mirror boundary identified | no | N/A: neither PR changes agent rules/skills. |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed skill changes. |
| `agent-native-reviewer` loaded or waiver recorded | no | N/A: no agent-native delta; child plans record the same waiver. |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Child #324 and #326 focused proofs | pending |
| package/API/build | yes | Both touch `packages/kitcn`; build/check in children | pending |
| generated output | yes | #324 owns generated runtime audit; #326 N/A | pending |
| fixtures/scenarios | yes | #324 owns fixture generation/check; #326 N/A | pending |
| docs/package skill | yes | #324 docs touched; package skill N/A unless audit finds drift | pending |
| changeset | yes | Both PRs contain patch changesets | pending |
| agent workflow | no | N/A: no agent surface changes | complete |
| cleanup/review | yes | deslop + autoreview per child | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | merge #324 then #326; one release | pending |

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
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-15-pr-324-326-autoclosure-batch.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | two open PRs; order #324 then #326 | child #324 |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- Pending.

Timeline:
- 2026-08-15T19:03:53.708Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge #324 then #326 and publish one verified release. |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- #324 may need regeneration/rebase after current main; #326 release remains
  disabled until it is the final ready merge.
