# Close cRPC correctness PR

Objective:
Close PR 320 within its cRPC validation/middleware/HTTP error contract after
focused proof, cleanup, review closure, full checks, and squash merge.

Flow mode:
one-shot execution

Goal plan:
docs/plans/320-close-crpc-correctness-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Focused server tests prove validation, middleware chaining, error identity,
  status mapping, and malformed JSON behavior; zero findings; package build and
  `bun check` pass; changeset agrees; PR 320 is merged without auto-release.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused server tests, package build/types, changeset audit, deslop,
  agent-native applicability audit, autoreview, lint, check, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 320 cRPC input/middleware/error/HTTP correctness
- allowed repairs: touched server source/tests and living changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: new procedure APIs or unrelated transport redesign

Output budget strategy:
- Exact server files and focused failures; cap review/check output; exclude artifacts.

Blocked condition:
- Repeated external/environment failure or a finding requiring a new public server contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 320 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Squash-merge; no release trigger |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | no | N/A: runtime server behavior only |
| Source rule versus generated mirror boundary identified | no | N/A: no rule/mirror change |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill state change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded; applicability N/A |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused server tests | pending |
| package/API/build | yes | Package build/types | pending |
| generated output | no | N/A: no generated output | N/A |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | no | N/A: no docs/skill delta | N/A |
| changeset | yes | `.changeset/crpc-procedure-contracts.md` audit | pending |
| agent workflow | no | N/A: no agent action | N/A |
| cleanup/review | yes | Deslop and autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 320 update/merge/read-back | pending |

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
| Targeted behavior proof | yes | Run focused server tests | pending |
| Source/generated audit | no | N/A: source-only runtime change | N/A |
| Package/docs/scenario closure | yes | Build package and audit changeset | pending |
| Deslop | yes | Run changed-file cleanup review | pending |
| Agent-native reviewer | no | N/A: no agent-facing change | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/320-close-crpc-correctness-pr.md` | pending |
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
- PR 320 CI/Vercel green at goal creation; no approval yet.

Timeline:
- 2026-08-14T18:17:54.952Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge proven cRPC validation, middleware, and HTTP correctness |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- Middleware terminal-chain changes can double-run or skip handlers if review misses propagation paths.

Findings:
- cRPC error identity crosses a Convex syscall boundary and needs behavior-level tests.

Decisions and tradeoffs:
- Keep the resolver as terminal middleware owner; reject adjacent API redesign.

Review fixes:
- Pending.
