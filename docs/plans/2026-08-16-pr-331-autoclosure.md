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
| fixtures/scenarios | yes | full check owns fixture/runtime integration | complete |
| docs/package skill | no | internal behavior; no public API/docs delta | N/A |
| changeset | yes | `.changeset/*` status/content | patch status clean; RLS scope wording corrected |
| agent workflow | no | no agent action delta | N/A |
| cleanup/review | yes | deslop, feedback, autoreview | complete; both threads resolved, committed review clean |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | push existing PR, pinned checks, merge/read-back | merged `23c0c999` |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated (N/A).
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner (none).
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors (N/A).
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text (N/A).
- [x] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [x] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

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
| Targeted behavior proof | complete | Run smallest missing owning proof | 62 focused tests pass |
| Source/generated audit | complete | Prove correct source and regenerated mirrors | runtime source only; generated N/A |
| Package/docs/scenario closure | complete | Run every applicable local contract | package build and full check pass |
| Deslop | complete | Run bounded cleanup or N/A | 167 -> 167, no regression |
| Agent-native reviewer | complete | Run for workflow changes or N/A | N/A: runtime-only change |
| Final lint | complete | Run `bun lint:fix` | clean |
| Repository check | complete | Run `bun check` | pass |
| GitHub delivery | complete | Commit/push/open or update PR and read back | `66b967e9` -> merge `23c0c999` |
| Autoreview | complete | Resolve every accepted actionable finding | final committed-head review clean |
| Goal plan complete | complete | Run checker | checker run after final receipt update |
| Agent source / generated sync | complete | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | N/A: no agent source change |
| Installed lock audit | complete | Verify expected lock entries and removed skills through CLI-managed state | N/A |
| Agent action discoverability | complete | Source-audit the skill/rule path an agent will read | N/A |
| Helper and template smoke | complete | Syntax-check helpers and prove incomplete failure/completed representation when applicable | N/A |
| Agent-native review | complete | Load reviewer and close accepted findings, or record N/A | N/A: runtime-only change |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR diff, changeset, sources, and two review threads audited | repair |
| Repair | complete | same-doc lifecycle, insert RLS, delete RLS red/green fixes; RLS query fix preserved | review |
| Review/checks | complete | focused/package/full gates and final review pass | delivery |
| Delivery | complete | pinned remote head, CI/Vercel, merged `23c0c999` | final audit |
| Closeout | complete | feedback and merge read back | final |

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
- Final head `66b967e9` passed CI run `31968579515` and Vercel. Both review
  threads were resolved; admin squash merge produced `23c0c999`.

Timeline:
- 2026-08-16T19:23:53.927Z Autoclosure plan created.
- 2026-08-16 Repaired and proved same-document hook payloads, stateful
  insert/delete RLS cache lifetime, and one genuine async-noise slop hit.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closed |
| Where am I going? | Batch PR #333 |
| What is the goal? | Land only the proven ORM read reduction with hook/RLS correctness intact. |
| What have I learned? | RLS is already fixed; lifecycle after/change docs miss same-document raw before-hook writes. |
| What have I done? | Repaired three correctness gaps, proved the final branch, cleared feedback, and merged it. |

Open risks:
- None for PR #331. Later ORM PRs must rebase over its new lifecycle/RLS owners.
