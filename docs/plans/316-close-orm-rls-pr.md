# Close ORM RLS PR

Objective:
Close PR 316 as the fail-closed ORM RLS owner and merge it before PR 317 after
focused proof, source/mirror/docs sync, review closure, and `bun check`.

Flow mode:
one-shot execution

Goal plan:
docs/plans/316-close-orm-rls-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Role, nullish, and junction RLS regressions have focused proof; package skill,
  installed mirror, docs, and changeset agree; zero accepted findings remain;
  full checks pass; PR 316 is squash-merged before PR 317.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused ORM RLS tests, package build/types, package-skill/mirror/docs audit,
  deslop, agent-native review, autoreview, lint, `bun check`, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: fail-closed role/nullish/junction RLS behavior in PR 316
- allowed repairs: touched ORM RLS owner/tests/docs/package skill/changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: query-planner fixes owned by PR 317 or broader ORM redesign

Output budget strategy:
- Exact changed files, focused ORM tests, capped review/check failures; exclude
  build outputs, fixtures, coverage, and broad generated trees.

Blocked condition:
- Repeated external/environment failure or a finding requiring a new public ORM contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 316 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Merge before PR 317; no auto-release |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | yes | Published ORM package skill guidance |
| Source rule versus generated mirror boundary identified | yes | `packages/kitcn/skills/kitcn/**` owns `.agents/skills/kitcn/**` mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded fully |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused ORM RLS tests | pending |
| package/API/build | yes | Package build/types | pending |
| generated output | yes | Package skill owner to `.agents` mirror audit | pending |
| fixtures/scenarios | no | N/A: no scaffold output changes | N/A |
| docs/package skill | yes | www/package skill/mirror agreement | pending |
| changeset | yes | `.changeset/orm-rls-fail-closed.md` audit | pending |
| agent workflow | yes | Published skill discoverability and mirror parity | pending |
| cleanup/review | yes | Deslop, agent-native review, autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 316 merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill source owner and generated mirror are identified.
- [ ] Agent-native pack: ORM RLS action/constraints remain discoverable.
- [ ] Agent-native pack: package skill mirror parity is proved; `.agents/rules/**` is N/A.
- [x] Agent-native pack: installed skill membership is unchanged.
- [ ] Agent-native pack: package skill guidance represents required behavior and forbidden fail-open behavior.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused RLS tests | pending |
| Source/generated audit | yes | Prove package skill to `.agents` mirror parity | pending |
| Package/docs/scenario closure | yes | Build package; audit docs/skill/changeset | pending |
| Deslop | yes | Run changed-file cleanup review | pending |
| Agent-native reviewer | yes | Review published skill guidance/mirror | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/316-close-orm-rls-pr.md` | pending |
| Agent source / generated sync | yes | Verify package skill and installed mirror | pending |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Source-audit ORM package skill route | pending |
| Helper and template smoke | no | N/A: no workflow helper/template changed | N/A |
| Agent-native review | yes | Close accepted package-skill findings | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 316 CI and Vercel were green at goal creation; no approval yet.

Timeline:
- 2026-08-14T18:17:54.580Z Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Merge fail-closed RLS owner before PR 317 |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- PR 317 overlaps `packages/kitcn/src/orm/query.ts` and `convex/orm/rls.test.ts`.

Findings:
- PR 316 is the dependency root for the two-PR ORM sequence.

Decisions and tradeoffs:
- Merge before PR 317 to resolve shared ORM ownership once.

Review fixes:
- Pending.
