# PR 331 autoclosure

Objective:
Autoclose PR #331 by preserving its bounded ORM write-path read reductions,
repairing confirmed lifecycle/RLS correctness gaps, and merging only after
focused, package, repository, review, and pinned remote proof all pass.

Goal plan:
docs/plans/2026-08-16-pr-331-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Completion threshold:
- The intended read reductions remain measurable, both review threads have
  source-backed dispositions, hook documents reflect same-document raw writes,
  RLS policy state stays execution-scoped, and PR #331 is merged or closed with
  an exact receipt.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Lifecycle and RLS execution-scope regressions, changed ORM suites, package
  typecheck/build, changeset status, deslop, autoreview, `bun lint:fix`, full
  `bun check`, feedback read-back, pinned GitHub checks, and merge receipt.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: remove redundant ORM write-path reads while preserving exact
  hook documents, RLS execution isolation, counts, aggregates, and write fanout
- allowed repairs: lifecycle/query correctness and focused regression coverage
- unrelated files: preserve; do not treat as blockers
- non-goals: new ORM surface, compatibility shims, unrelated query/aggregate work

Output budget strategy:
- Use focused ORM suites first; cap full check/review output to failures and
  compact receipts.

Blocked condition:
- Required GitHub authority unavailable, pinned remote checks fail after a
  source-proven repair, or a platform behavior cannot be reproduced locally.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, diff, lifecycle/query sources, 2 review threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | existing PR #331 must be updated and merged or closed |
| Active goal checked or created | yes | root batch goal active; this child plan linked |
| Agent-native pack selected | yes | template default; N/A for runtime-only diff |
| Agent-facing action surface identified | no | no agent action changes |
| Source rule versus generated mirror boundary identified | no | no agent/rule changes |
| Installed-skill lock versus local-rule owner identified | no | no installed-skill changes |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded in batch; N/A for ORM runtime PR |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | lifecycle/RLS regressions and changed ORM suites | 62 focused tests pass after 3 red/green repairs |
| package/API/build | yes | kitcn typecheck/build | complete |
| generated output | no | no generated owner intended | N/A |
| fixtures/scenarios | yes | full check owns fixture/runtime integration | pending |
| docs/package skill | no | internal behavior; no public API/docs delta | N/A |
| changeset | yes | `.changeset/*` status/content | patch status clean; RLS scope wording corrected |
| agent workflow | no | no agent action delta | N/A |
| cleanup/review | yes | deslop, feedback, autoreview | zero finding-count delta; final committed review pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | push existing PR, pinned checks, merge/read-back | pending |

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
| First lifecycle regression counted the insert `change` event | 1 | clear setup observations before the update | produced the intended stale-document red assertion |
| `get-pr-comments` does not accept `--repo` | 1 | use its repository-owned positional form | fetched both #331 threads with `get-pr-comments 331` |
| Branch-mode autoreview excluded uncommitted repairs | 1 | commit the proven bundle, then review the final branch | pending final branch review |
| Autoreview claimed null post-image synthesis despite the explicit `if (!oldDoc)` return | 1 | verify both patch and replace source paths directly | rejected: both paths return before local synthesis |

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
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-16-pr-331-autoclosure.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR diff, changeset, sources, and two review threads audited | repair |
| Repair | complete | same-doc lifecycle, insert RLS, delete RLS red/green fixes; RLS query fix preserved | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- Lifecycle same-document before-hook regression failed on the missing raw field,
  then passed for both `update.after` and `change` after the conditional post-hook
  snapshot repair.
- Stateful multi-row insert and delete RLS regressions both failed against the
  statement-wide cache, then passed with per-row cache lifetime. Query RLS
  re-await/concurrency/one-resolution tests remain green.
- 57 changed-owner Bun tests plus 5 RLS Vitest tests pass. Package typecheck and
  build pass; changeset status is patch; lint is clean.
- Deslop returns 167 -> 167 findings. The remaining directory fanout warning is
  the one necessary dependency-free fanout owner; shifted query catches and
  wrapper signatures net out rather than add new occurrences.
- One structured P1 found the real multi-row RLS bypass and was fixed. A later
  branch-only review did not include the dirty repair and incorrectly claimed
  local synthesis runs with null despite explicit guards in patch and replace.

Timeline:
- 2026-08-16T19:23:53.927Z Autoclosure plan created.
- 2026-08-16 Repaired and proved same-document hook payloads, stateful
  insert/delete RLS cache lifetime, and one genuine async-noise slop hit.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Repair |
| Where am I going? | TDD repair, focused/full proof, review, delivery, closeout |
| What is the goal? | Land only the proven ORM read reduction with hook/RLS correctness intact. |
| What have I learned? | RLS is already fixed; lifecycle after/change docs miss same-document raw before-hook writes. |
| What have I done? | Merged current main, installed dependencies, audited sources and feedback, created this plan. |

Open risks:
- The 17-file ORM refactor is broad enough that green generic CI is insufficient;
  hook identity, RLS execution scope, count returns, and fanout need focused proof.
