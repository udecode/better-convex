# PR 330 autoclosure

Objective:
Autoclose PR #330 only if its CLI startup/codegen refactor preserves every
configured functions/lib/shared/router watch root, proves the claimed lazy
dependency boundary, and remains correct after #329 and release 0.17.2.

Goal plan:
docs/plans/2026-08-16-pr-330-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- [Batch plan](docs/plans/2026-08-16-review-and-autoclose-prs-329-through-342.md)

Completion threshold:
- The two watcher review threads are source-backed and closed; lazy imports,
  codegen parsing/content comparison, config/env behavior, package build,
  fixtures, deslop, lint, `bun check`, and autoreview pass on the current-main
  merge candidate; PR #330 is merged with exact remote receipts.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Exact 26-file diff and owners; watcher/config/codegen/lazy-deps/content tests;
  package typecheck/build; fixture parity; changeset; deslop; agent-native N/A
  audit; autoreview; lint; `bun check`; feedback resolution; PR/check/merge
  read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Preserve supported arbitrary `convex.json.functions` and `kitcn.json.paths`;
  do not encode ownership through a basename convention.
- Do not absorb later aggregate/capability work from #337/#342.

Boundaries:
- intended delta: defer heavy CLI dependencies, reduce repeated schema/config
  work, and keep watcher regeneration correct across configured project paths
- allowed repairs: watcher ownership/config plumbing, tests, review cleanup,
  changeset, and mergeability inside the 26-file CLI/package surface
- unrelated files: preserve; do not treat as blockers
- non-goals: new CLI commands, watcher redesign, aggregate behavior, capability
  injection, example/www changes

Output budget strategy:
- Read changed CLI owners and the direct config/dev callers only; run focused
  suites first; cap review/check output and poll remote checks compactly.

Blocked condition:
- Missing maintainer authority after three verified attempts, or the same
  environment failure after three materially different diagnostics.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, 26-file diff, commits, two watcher threads, and owners read |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | CLI/package/tests/fixtures/changeset/review/check/delivery apply |
| GitHub delivery expectation recorded | yes | repair, resolve threads, push, green checks, merge after 0.17.2 |
| Active goal checked or created | yes | root batch goal owns this linked child plan |
| Agent-native pack selected | yes | required by autoclosure and materialized here |
| Agent-facing action surface identified | no | N/A: CLI runtime/package behavior, not agent instructions or action tooling |
| Source rule versus generated mirror boundary identified | no | N/A: no agent mirror source changed |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed skill state changed |
| `agent-native-reviewer` loaded or waiver recorded | yes | skill loaded; PR-specific parity lane is N/A |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | focused CLI owner tests | complete |
| package/API/build | yes | package typecheck/build and packed CLI graph | complete |
| generated output | no | no committed generated owner changed | complete |
| fixtures/scenarios | yes | `fixtures:check` through repository check | complete |
| docs/package skill | no | internal performance/correctness refactor; no public contract change | complete |
| changeset | yes | `.changeset/lucky-jars-clap.md` plus status | complete |
| agent workflow | no | N/A: no agent source/action changed | complete |
| cleanup/review | yes | two feedback threads, deslop, autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | push, checks, merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.
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
| Initial custom-root repair still assumes basename `functions` | 1 | derive watch roots from configured path owners instead of names | fixed with project-relative nested ownership and regression test |
| Vitest reported no test files for `watcher.test.ts` | 1 | use the owning Bun test lane | Bun test produced the expected red assertion, then passed after repair |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | Run smallest missing owning proof | 31 focused tests pass; watcher red/green proves custom basename case |
| Source/generated audit | complete | Prove correct source and regenerated mirrors | 26-file CLI source/test/changeset surface; no generated owner touched |
| Package/docs/scenario closure | complete | Run every applicable local contract | package typecheck/build, changeset, fixture/runtime lanes pass |
| Deslop | complete | Run bounded cleanup or N/A | exit 0, no finding-count regression; only coarse CLI directory fanout moved |
| Agent-native reviewer | complete | Run for workflow changes or N/A | N/A: no agent action surface |
| Final lint | yes | Run `bun lint:fix` | 889 files checked; no fixes |
| Repository check | yes | Run `bun check` | exit 0 |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | clean, correctness 0.98, no actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-16-pr-330-autoclosure.md` | pending |
| Agent source / generated sync | complete | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | N/A: no agent/rule source changed |
| Installed lock audit | complete | Verify expected lock entries and removed skills through CLI-managed state | N/A: no installed skill state changed |
| Agent action discoverability | complete | Source-audit the skill/rule path an agent will read | N/A: no agent action changed |
| Helper and template smoke | complete | Syntax-check helpers and prove incomplete failure/completed representation when applicable | N/A: no agent helper/template changed |
| Agent-native review | complete | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | loaded; N/A for this CLI runtime PR |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | diff/owner/feedback audit | repair |
| Repair | complete | custom-name watcher root fixed with red/green test | review |
| Review/checks | complete | focused tests, build, changeset, deslop, lint, check, autoreview | delivery |
| Delivery | in_progress | current-main merge and local gates complete | commit/push, resolve threads, remote checks, merge |
| Closeout | pending | | final |

Verification evidence:
- TDD: `backend/api` initially returned only its functions directory; after
  replacing the basename rule with project-relative ownership it returns the
  functions directory plus `backend/{routers,lib,shared}`. Watcher suite: 16/16.
- Focused changed-owner suite: 31/31 across watcher, schema parse cache,
  content comparison, lazy dependency graph, and packed CLI intent.
- Package typecheck/build pass; watcher bundle is 6.99 kB and stays off the
  backend-core graph; changeset status reports the expected fixed patch bump.
- Slop delta exits 0 with 167 findings unchanged; only the broad CLI directory
  count heuristic moved. Autoreview is clean at 0.98.
- `bun lint:fix`: 889 files, no fixes. `bun check`: exit 0 with 1,112 Bun tests,
  729 Vitest tests, CLI/Concave lanes, all fixture parity, verify, and runtime.

Timeline:
- 2026-08-16T19:02:55.504Z Autoclosure plan created.
- 2026-08-16 Repaired arbitrary nested functions-root watching and completed
  focused/package/deslop/review/lint/full-check proof.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Delivery |
| Where am I going? | Push, resolve threads, wait for checks, merge, read back. |
| What is the goal? | Preserve path-correct watcher/codegen behavior while landing the proven CLI cost reductions. |
| What have I learned? | The refactor is credible, but its second custom-root repair still guesses ownership from the final directory name. |
| What have I done? | Merged 0.17.2 main, repaired the watcher defect, and passed every local gate. |

Open risks:
- Broad 26-file refactor can hide behavioral regressions; watcher roots and
  parse/content comparison need focused source proof before trusting green CI.
