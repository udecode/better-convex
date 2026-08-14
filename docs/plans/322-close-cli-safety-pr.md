# Close CLI safety PR

Objective:
Close PR 322 with destructive-overwrite and schema-edit regressions proved,
generated/docs/skill/fixture owners synchronized, review clean, checks passing,
and the PR merged without triggering release.

Flow mode:
one-shot execution

Goal plan:
docs/plans/322-close-cli-safety-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Focused CLI tests and fixture sync/check pass; source-owned package skill,
  `.agents` mirror, and docs agree; zero accepted findings; `bun check` passes;
  PR 322 is squash-merged with auto-release off.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- CLI tests, `fixtures:sync`, `fixtures:check`, package build/types, source/mirror
  audit, deslop, agent-native review, autoreview, lint, check, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 322 safe file ownership/refusal and AST schema editing
- allowed repairs: touched CLI owners/tests/docs/package skill/mirror/changeset/fixtures
- unrelated files: preserve; do not treat as blockers
- non-goals: new CLI commands, unrelated scaffold redesign, compatibility shims

Output budget strategy:
- Exact CLI changed files and focused test/fix logs; summarize fixture diffs;
  exclude materialized scenarios, build artifacts, and broad generated output.

Blocked condition:
- Repeated fixture/bootstrap environment failure or a finding requiring a new CLI contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 322 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Squash-merge; no release trigger |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | yes | `kitcn add/init --yes/--overwrite/--json` |
| Source rule versus generated mirror boundary identified | yes | Package skill owns `.agents/skills/kitcn` mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded fully |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused CLI tests | pending |
| package/API/build | yes | Package build/types | pending |
| generated output | yes | Package skill to `.agents` mirror plus fixtures | pending |
| fixtures/scenarios | yes | `fixtures:sync` and `fixtures:check` | pending |
| docs/package skill | yes | www/package skill/mirror audit | pending |
| changeset | yes | `.changeset/cli-safe-file-edits.md` audit | pending |
| agent workflow | yes | Deterministic non-interactive refusal/output contract | pending |
| cleanup/review | yes | Deslop, agent-native review, autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 322 update/merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill source owner/mirror boundary recorded.
- [ ] Agent-native pack: safe CLI refusal and overwrite routes are discoverable.
- [ ] Agent-native pack: package skill mirror and fixtures are regenerated/proved.
- [x] Agent-native pack: installed skill membership unchanged.
- [ ] Agent-native pack: JSON refused receipt, exit status, and forbidden overwrite behavior have tests.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused CLI tests | pending |
| Source/generated audit | yes | Regenerate/prove skill mirror and fixtures | pending |
| Package/docs/scenario closure | yes | Build, docs/skill/changeset, fixtures | pending |
| Deslop | yes | Run changed-file cleanup review | pending |
| Agent-native reviewer | yes | Review CLI agent route and receipts | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/322-close-cli-safety-pr.md` | pending |
| Agent source / generated sync | yes | Prove package skill mirror; `.agents/rules` N/A | pending |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Audit package skill CLI guidance | pending |
| Helper and template smoke | yes | Focused CLI planner/codegen/refusal tests | pending |
| Agent-native review | yes | Close accepted CLI agent-route findings | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 322 CI/Vercel green at goal creation; no approval yet.

Timeline:
- 2026-08-14T18:17:54.831Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge safe CLI ownership and schema editing with full generated proof |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- Fail-closed file ownership can half-install a plugin unless refusal and lockfile receipts agree.

Findings:
- This is the batch's widest generated/fixture/agent-facing closeout surface.

Decisions and tradeoffs:
- Require fixture sync/check and structured refusal proof before merge.

Review fixes:
- Pending.
