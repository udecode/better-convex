# Close ratelimit accounting PR

Objective:
Close PR 319 with rate-limit accounting regressions proved, docs and published
package skill synchronized, reviews clean, checks passing, and PR merged.

Flow mode:
one-shot execution

Goal plan:
docs/plans/319-close-ratelimit-accounting-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Focused ratelimit tests prove count/sharding/remaining/reset behavior; docs,
  package skill, installed mirror, and changeset agree; zero findings; `bun check`
  passes; PR 319 is squash-merged without auto-release.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused ratelimit tests, package build/types, docs/skill/mirror audit, deslop,
  agent-native review, autoreview, lint, check, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 319 rate-limit accounting and sharding contract
- allowed repairs: touched ratelimit source/tests/docs/package skill/mirror/changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: new algorithms or unrelated plugin APIs

Output budget strategy:
- Exact ratelimit files and focused failures; cap review/check output; exclude artifacts.

Blocked condition:
- Repeated external/environment failure or a finding requiring a new limiter API.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 319 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Squash-merge; no release trigger |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | yes | Published ratelimit package skill guidance |
| Source rule versus generated mirror boundary identified | yes | Package skill owns installed `.agents` mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded fully |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused ratelimit tests | pending |
| package/API/build | yes | Package build/types | pending |
| generated output | yes | Package skill to `.agents` mirror | pending |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | yes | www/package skill/mirror agreement | pending |
| changeset | yes | `.changeset/ratelimit-accounting.md` audit | pending |
| agent workflow | yes | Published behavior/guard discoverability | pending |
| cleanup/review | yes | Deslop, agent-native review, autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 319 update/merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill owner/mirror boundary recorded.
- [ ] Agent-native pack: ratelimit semantics and invalid shard guard are discoverable.
- [ ] Agent-native pack: package skill/mirror parity proved; `.agents/rules` N/A.
- [x] Agent-native pack: installed skill membership unchanged.
- [ ] Agent-native pack: published guidance represents exact budget/guard behavior.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused ratelimit tests | pending |
| Source/generated audit | yes | Prove package skill/mirror parity | pending |
| Package/docs/scenario closure | yes | Build and audit docs/skill/changeset | pending |
| Deslop | yes | Run changed-file cleanup review | pending |
| Agent-native reviewer | yes | Review published ratelimit guidance | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/319-close-ratelimit-accounting-pr.md` | pending |
| Agent source / generated sync | yes | Verify package skill/mirror | pending |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Audit published ratelimit skill route | pending |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | yes | Close accepted guidance findings | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 319 CI/Vercel green at goal creation; no approval yet.

Timeline:
- 2026-08-14T18:17:55.073Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge correct limiter accounting with synchronized guidance |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- PR currently changes www docs without the matching published package skill; closeout must repair that owner drift.

Findings:
- Repo policy requires www docs and package skill synchronization.

Decisions and tradeoffs:
- Add/update package skill owner, regenerate mirror, and keep runtime scope unchanged.

Review fixes:
- Pending.
