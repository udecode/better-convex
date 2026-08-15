# Close React auth PR

Objective:
Close PR 321 as the final batch merge and sole auto-release trigger after React,
RSC, auth-cache, and caller retry behavior is proved and all checks/reviews pass.

Flow mode:
one-shot execution

Goal plan:
docs/plans/321-close-react-auth-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Focused React/RSC/server tests pass; zero findings; package build and `bun check`
  pass; changeset agrees; all six earlier PRs are merged; PR 321 merges with
  auto-release checked; Version Packages merge and publish workflow succeed.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused React/RSC/server tests, package build/types, changeset audit, deslop,
  agent-native applicability audit, autoreview, lint, check, PR/release read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 321 JWT/auth cache/query metadata/RSC/caller retry behavior
- allowed repairs: touched React/RSC/server/internal source/tests and changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: unrelated query APIs or release-policy changes

Output budget strategy:
- Exact changed files and focused failures; compact GitHub release checks; exclude artifacts.

Blocked condition:
- Repeated publish/external failure or a finding requiring a new public client contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 321 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Merge last with auto-release checked; verify publish |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | no | N/A: runtime client behavior only |
| Source rule versus generated mirror boundary identified | no | N/A: no rule/mirror change |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill state change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded; applicability N/A |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | 102 focused React/Solid/RSC/server tests | complete |
| package/API/build | yes | Package build and root typecheck | complete |
| generated output | no | N/A: no generated output | N/A |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | no | N/A: no docs/skill delta | N/A |
| changeset | yes | `.changeset/react-rsc-auth-cache.md` audit | complete |
| agent workflow | no | N/A: no agent action | N/A |
| cleanup/review | yes | Deslop and committed-head autoreview clean at 0.86 confidence | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | PR 321 merge plus Version Packages/publish read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each pre-review lane is proven or N/A with a concrete reason.
- [x] Generated output is N/A: no generated owner is touched.
- [x] Package and changeset contracts are synchronized; docs/skill/fixture/scenario are N/A.
- [x] Accepted cleanup and review findings are closed.
- [x] Exact repository check passed on committed code head.
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
| Normalized RSC transformer was composed again in the HTTP layer | 1 | Pass the combined transformer directly | Red identity regression became green |
| `resolveEnabled(true, false)` enabled a caller-disabled query | 1 | Preserve explicit booleans at the shared helper | Red helper regression became green |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused React/Solid/RSC/server tests | passed: 102 tests across ten files |
| Source/generated audit | no | N/A: source-only runtime change | N/A |
| Package/docs/scenario closure | yes | Build package and audit changeset | passed; docs/scenarios N/A |
| Deslop | yes | Run changed-file cleanup review | passed: no added or worsened findings; score improved 3.09 |
| Agent-native reviewer | no | N/A: no agent-facing change | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | passed: 882 files; no fixes |
| Repository check | yes | Run `bun check` | passed on `23d05d9f1b76` |
| GitHub delivery | yes | Merge last and verify release/publish | pending |
| Autoreview | yes | Resolve every accepted actionable finding | passed: zero accepted/actionable findings at 0.86 confidence |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/321-close-react-auth-pr.md` | pending |
| Agent source / generated sync | no | N/A: no agent source/mirror | N/A |
| Installed lock audit | no | N/A: no skill state change | N/A |
| Agent action discoverability | no | N/A: no agent action | N/A |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | no | N/A after applicability audit | No agent surface |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR, source, tests, changeset, checks, and two threads read | repair |
| Repair | complete | Transformer ownership and explicit enabled gating fixed with TDD | review |
| Review/checks | complete | 102 focused tests, build, typecheck, lint, deslop, autoreview, and exact check pass | delivery |
| Delivery | in_progress | local rebased head ready for lease-protected push | remote gates and merge |
| Closeout | pending | | final |

Verification evidence:
- PR 321 CI/Vercel green at goal creation; auto-release checked; no approval yet.
- All six earlier PRs are merged. PR 319 merged at `2aee478fcc75` on
  2026-08-15T01:36:00Z without triggering a release.
- Focused proof passes 89 Bun tests and 13 Vitest tests across React, Solid,
  internal query keys/gates, RSC HTTP execution, and the server caller.
- The RSC query owner normalizes a custom transformer once and the HTTP request
  layer preserves that exact combined transformer.
- Explicit `enabled: false` remains false, predicates remain predicates, and
  prefetched infinite data hydrates without network work while auth is loading.
- `bun --cwd packages/kitcn build`, root typecheck, lint, and deslop pass.
- Committed-head autoreview reports zero accepted/actionable findings at 0.86
  confidence after the two local review repairs.
- Exact `bun check` passed on code head `23d05d9f1b76`, covering lint, types,
  unit and CLI tests, Concave smoke, fixture reproduction, and runtime scenarios.

Timeline:
- 2026-08-14T18:17:55.196Z Autoclosure plan created.
- 2026-08-15T03:41:00+02:00 Rebased onto the six merged predecessors, closed
  transformer recomposition and explicit enabled gating with red-to-green tests,
  and completed focused package proof.
- 2026-08-15T03:45:00+02:00 Committed-head autoreview passed with zero
  accepted/actionable findings at 0.86 confidence.
- 2026-08-15T03:52:00+02:00 Exact `bun check` passed on `23d05d9f1b76`
  through all fixture and live runtime lanes.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Delivery |
| Where am I going? | Push, remote gates, merge, release audit |
| What is the goal? | Merge final client/auth fix and publish the complete batch once |
| What have I learned? | See closure matrix |
| What have I done? | Rebased, repaired two findings, and completed focused proof |

Open risks:
- Remote gates, merge, and release proof remain.

Findings:
- PR 321 is intentionally last solely because it owns the single release trigger.

Decisions and tradeoffs:
- Keep React and Solid JWT decoding aligned because both clients implement the
  same signed-in token contract and the branch already carries both repairs.

Review fixes:
- The changeset uses separate user-facing outcomes instead of a combined retry narrative.
- The RSC HTTP layer accepts the already-normalized transformer and forwards it
  unchanged; a regression asserts object identity at the request executor.
- The shared enabled gate preserves explicit false and prevents prefetched data
  from starting network work while authentication is still loading.
