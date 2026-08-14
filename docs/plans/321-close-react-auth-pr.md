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
- non-goals: Solid client repair, unrelated query APIs, release-policy changes

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
| source behavior | yes | Focused React/RSC/server tests | pending |
| package/API/build | yes | Package build/types | pending |
| generated output | no | N/A: no generated output | N/A |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | no | N/A: no docs/skill delta | N/A |
| changeset | yes | `.changeset/react-rsc-auth-cache.md` audit | pending |
| agent workflow | no | N/A: no agent action | N/A |
| cleanup/review | yes | Deslop and autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 321 merge plus Version Packages/publish read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [x] Generated output is N/A: no generated owner is touched.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
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
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused React/RSC/server tests | pending |
| Source/generated audit | no | N/A: source-only runtime change | N/A |
| Package/docs/scenario closure | yes | Build package and audit changeset | pending |
| Deslop | yes | Run changed-file cleanup review | pending |
| Agent-native reviewer | no | N/A: no agent-facing change | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Merge last and verify release/publish | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/321-close-react-auth-pr.md` | pending |
| Agent source / generated sync | no | N/A: no agent source/mirror | N/A |
| Installed lock audit | no | N/A: no skill state change | N/A |
| Agent action discoverability | no | N/A: no agent action | N/A |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | no | N/A after applicability audit | No agent surface |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 321 CI/Vercel green at goal creation; auto-release checked; no approval yet.

Timeline:
- 2026-08-14T18:17:55.196Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge final client/auth fix and publish the complete batch once |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- Auth-cache scoping and failed-action retry can leak data or duplicate effects if review misses a path.
- Release proof is external and must be read back after merge.

Findings:
- PR 321 is intentionally last solely because it owns the single release trigger.

Decisions and tradeoffs:
- Keep Solid's matching decoder bug out of scope as the PR explicitly states.

Review fixes:
- Pending.
