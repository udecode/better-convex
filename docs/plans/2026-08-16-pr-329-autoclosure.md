# PR 329 autoclosure

Objective:
Autoclose PR #329 only if its Solid infinite-query mount-crash fix is real,
minimal, fully proven against the real Solid Query integration, and merge-ready.

Goal plan:
docs/plans/2026-08-16-pr-329-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Exact pre-fix crash ownership and post-fix behavior are source-backed; all
  nine real-provider tests, package build, deslop, lint, `bun check`, and
  autoreview pass; no unresolved feedback remains; changeset covers affected
  packages; PR #329 is merged and exact merge/check/release receipts are read.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Diff/source audit of Solid infinite-query owner and TanStack integration;
  `packages/kitcn/src/solid/use-infinite-query.vitest.tsx`; package build;
  slop delta; lint; `bun check`; autoreview; changeset status; PR comments,
  branch-head checks, merge commit, and release read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Do not absorb the later Solid parity work from #339.
- Do not reintroduce mocked `useQueries` coverage that misses the real mount path.

Boundaries:
- intended delta: four PR files implementing and testing the real
  `QueriesObserver`-backed Solid infinite-query mount path
- allowed repairs: correctness, type, cleanup, changeset, or mergeability fixes
  inside that owner only
- unrelated files: preserve; do not treat as blockers
- non-goals: React changes, auth parity, #339 behavior, new query features

Output budget strategy:
- Read the four-file diff and adjacent Solid owner only; cap test/review output;
  save full `bun check` output under `/tmp` if needed and report exit/tail.

Blocked condition:
- Missing merge/release authority after three verified attempts, or the same
  infrastructure failure after three materially different diagnostics.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR #329 body, four-file diff inventory, zero feedback threads, and #339 dependency read |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | package behavior/build/changeset/review/check/delivery apply; generated/docs/fixtures/agent workflow do not |
| GitHub delivery expectation recorded | yes | merge #329 first and verify its isolated 0.17.2 release path |
| Active goal checked or created | yes | root batch goal owns this linked child plan |
| Agent-native pack selected | yes | required by autoclosure and materialized here |
| Agent-facing action surface identified | no | N/A: PR changes Solid runtime/test files and a changeset only |
| Source rule versus generated mirror boundary identified | no | N/A: no generated or agent files touched |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill lock/rule changes |
| `agent-native-reviewer` loaded or waiver recorded | yes | skill loaded; PR-specific parity review is N/A because no agent/user-action surface changed |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | real provider Vitest plus source audit | complete |
| package/API/build | yes | `bun --cwd packages/kitcn build` | complete |
| generated output | no | N/A: no generated owner touched | complete |
| fixtures/scenarios | no | N/A: no scaffold/template/runtime fixture touched | complete |
| docs/package skill | no | N/A: no user-facing contract/docs change | complete |
| changeset | yes | `.changeset/solid-infinite-query-mount-crash.md` plus status | complete |
| agent workflow | no | N/A: no agent surface | complete |
| cleanup/review | yes | slop delta and autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | merge/release/read-back | pending |

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
| package typecheck failed in Convex 1.44 owners outside the PR after branch checkout reused #343 dependencies | 1 | run branch-owned `bun install`, then rerun the exact command | fresh install restored Convex 1.42.3; typecheck and build passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | Run smallest missing owning proof | real-provider Vitest: 9 passed, no type errors |
| Source/generated audit | complete | Prove correct source and regenerated mirrors | four-file source/test/changeset diff; no generated owner touched |
| Package/docs/scenario closure | complete | Run every applicable local contract | package typecheck/build and changeset status passed |
| Deslop | complete | Run bounded cleanup or N/A | delta scan exit 0; no occurrence regression; directory-count heuristic rejected |
| Agent-native reviewer | complete | Run for workflow changes or N/A | N/A: no agent action surface |
| Final lint | yes | Run `bun lint:fix` | 884 files checked; no fixes |
| Repository check | yes | Run `bun check` | exit 0 after merge with current main |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | clean, correctness 0.97, no actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-16-pr-329-autoclosure.md` | pending |
| Agent source / generated sync | complete | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | N/A: no agent/rule source changed |
| Installed lock audit | complete | Verify expected lock entries and removed skills through CLI-managed state | N/A: no installed skill state changed |
| Agent action discoverability | complete | Source-audit the skill/rule path an agent will read | N/A: no agent action changed |
| Helper and template smoke | complete | Syntax-check helpers and prove incomplete failure/completed representation when applicable | N/A: no helper/template changed |
| Agent-native review | complete | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | loaded; N/A for this runtime-only PR |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | four-file owner/source audit; zero feedback threads | review |
| Repair | complete | no code repair needed; merged current main cleanly | review |
| Review/checks | complete | focused tests, build, changeset, deslop, lint, check, autoreview | delivery |
| Delivery | in_progress | current-main merge committed locally | push, remote checks, merge |
| Closeout | pending | | final |

Verification evidence:
- TanStack Solid Query's `useQueries` stores the combined value and later calls
  array methods on it; the prior object combine therefore owns the mount crash.
- The PR keeps the observer lifecycle local, subscribes/disposes through Solid,
  and tests the real QueryClient/provider instead of mocking the failing layer.
- `bunx vitest run packages/kitcn/src/solid/use-infinite-query.vitest.tsx`:
  1 file, 9 tests, no type errors, both before and after merging current main.
- `bun --cwd packages/kitcn typecheck`, package build, and changeset status pass.
- Slop delta exits 0 with no new occurrences; only the coarse 33-file Solid
  directory heuristic moved, which is unrelated to this four-file invariant.
- Autoreview: clean, no accepted/actionable findings, correctness 0.97.
- `bun lint:fix`: 884 files checked, no fixes. `bun check`: exit 0, including
  1098 Bun tests, 729 Vitest tests, fixture parity, verify, and runtime lanes.

Timeline:
- 2026-08-16T18:36:44.977Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Prove PR #329 is a real minimal correctness fix, then merge and verify its isolated release. |
| What have I learned? | The PR has four files, no feedback, and is the dependency root for #339. |
| What have I done? | Frozen the scope and classified every closeout lane before checkout. |

Open risks:
- The implementation replaces a mocked hook path with a lower-level
  `QueriesObserver`; cleanup must not weaken Solid reactivity or disposal.
