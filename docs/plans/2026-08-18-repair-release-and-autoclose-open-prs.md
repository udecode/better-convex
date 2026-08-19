# repair release and autoclose open prs

Objective:
Repair the prior release closeout residue, then process every PR open at the
initial inventory through its own task-compliance and autoclosure gates.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-18-repair-release-and-autoclose-open-prs.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- [PR #370 task closeout](docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md) - aggregate `isNull` parity.
- [PR #371 task closeout](docs/plans/367-in-notin-variadic-filter-depth.md) - flat ORM filters.
- [PR #372 task closeout](docs/plans/368-codegen-self-heals-stale-generated-server.md) - codegen recovery.
- [PR #373 task closeout](docs/plans/369-output-undefined-contract-docs.md) - output diagnostics and docs.

Completion threshold:
- The abandoned revert scratch plan is removed; the failed release run is
  safely rerun or classified as immutable historical evidence without changing
  the already-published `0.25.2` artifacts; and every PR open at the initial
  inventory is either merged after complete proof or closed after the required
  task-evidence comment and read-back.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- GitHub release/run, npm, tag, and `main` read-back for `0.25.2`.
- Exact PR body + fetched immutable head + plan ownership audit for every PR.
- Required PR comments/states/checks/merge receipts.
- Focused proof and `bun check` for each compliant PR that reaches repair or
  merge, plus final open-PR inventory read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Preserve the immutable published `0.25.2` packages, tags, and release.
- Do not read implementation diffs or feedback before each PR passes the task
  compliance gate.

Boundaries:
- intended delta: release closeout residue plus all PRs open at initial inventory
- allowed repairs: stale local plan cleanup; safe workflow rerun/classification;
  compliant-PR fixes strictly within their existing plans
- unrelated files: preserve; do not treat as blockers
- non-goals: npm unpublish/version rollback, new product scope, or repairing a
  noncompliant PR

Output budget strategy:
- Inventory metadata first; cap list/log output; fetch exact heads; inspect only
  named plans until compliance passes; run one PR at a time and summarize long
  checks instead of streaming full logs.

Blocked condition:
- A required compliance comment cannot be posted/read back, an exact PR head is
  inaccessible, a merge requires an irreversible product decision outside the
  existing plan, or GitHub repeatedly prevents required delivery/read-back.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Dedicated task invocation and plan for exact PR | yes | Four exact PR plans linked above; process one task/autoclosure slice at a time |
| Task evidence verified at PR head | yes | #370-#373 each has exactly one body plan line, fetched head file, and exact PR ownership evidence |
| Active source/plan reconstructed | yes | Initial inventory: #370, #371, #372, #373 |
| Intended delta and exclusions recorded | yes | Release residue plus four exact PRs; no new feature or noncompliant repair |
| Closure matrix classified | yes | Compliance applies to all four; remaining lanes classify per PR |
| GitHub delivery expectation recorded | yes | Merge or compliance-close each inventory PR, then exact read-back |
| Active goal checked or created | yes | Goal created for this exact batch plan |
| Agent-native pack selected | yes | Materialized by the plan helper |
| Agent-facing action surface identified | yes | Per-PR task evidence, required close comment, GitHub state/read-back |
| Source rule versus generated mirror boundary identified | yes | `.agents/rules/**` remains source; no workflow edit assumed before diagnosis |
| Installed-skill lock versus local-rule owner identified | no | No installed-skill change in current scope |
| `agent-native-reviewer` loaded or waiver recorded | yes | #372/#373 agent-facing changes reviewed; both capability maps pass |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| per-PR task ownership | yes | exact PR + four linked dedicated task plans | complete |
| noncompliant close | no | all four passed immutable-head audit | N/A |
| source behavior | yes | per-PR focused and full proof | #370-#372 green; #373 prior focused 171/171, new security P1 pending |
| package/API/build | yes | per-PR build/types | #370-#372 green; #373 prior build green |
| generated output | yes | source-owned generation only | #370 fixtures; #372 codegen + mirror; #373 skill mirror |
| fixtures/scenarios | yes | sync/check/runtime proof | #370-#372 full green; #373 final check pending |
| docs/package skill | yes | package source + mirror parity | #370/#372/#373 exact parity |
| changeset | yes | per-PR release draft | #370-#372 consumed into `0.25.3`-`0.25.5`; #373 present |
| agent workflow | yes | agent-native capability map + mirror audit | #372/#373 PASS |
| cleanup/review | yes | per-PR deslop/autoreview | #370-#372 complete; #373 pending new P1 |
| repository check | yes | `bun check` | #370-#372 complete; #373 pending current-main rerun |
| GitHub delivery | yes | exact-head merge/release/read-back | #370-#372 merged and released as `0.25.3`-`0.25.5`; #373 pending |

Work Checklist:
- [ ] Every PR has its own `task` invocation and dedicated task plan; a batch
      plan or aggregate autoclosure is not used as a substitute.
- [ ] Task evidence was verified from the PR body, fetched head, and exact PR
      ownership; otherwise the required comment and `CLOSED` state were read
      back and no source review, repair, merge, or release work continued.
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

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Per-PR task ownership | pending | Record exact PR and dedicated task-plan path | pending |
| Noncompliant PR disposition | pending | Verify task evidence or comment then close and read back | pending |
| Targeted behavior proof | pending | Run smallest missing owning proof | pending |
| Source/generated audit | pending | Prove correct source and regenerated mirrors | pending |
| Package/docs/scenario closure | pending | Run every applicable local contract | pending |
| Deslop | pending | Run bounded cleanup or N/A | pending |
| Agent-native reviewer | pending | Run for workflow changes or N/A | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-18-repair-release-and-autoclose-open-prs.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | four compliant PRs ordered #370-#373 | repair |
| Repair | in_progress | #370 review fix and fixture drift repaired | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- `get_goal` -> active objective names this plan.
- `gh pr list` -> initial inventory exactly #370-#373.
- `git fetch origin pull/<n>/head:refs/pr/<n>` + `git show` -> every named plan
  exists at the immutable head and identifies the exact PR.
- `gh run rerun 32049349569 --failed` + watch -> historical release workflow
  rerun passed; it detected already-published state and skipped tag/release work.
- PR #370: review thread accepted and fixed with RED/GREEN guard tests;
  `autoreview --mode local` clean 0.98; final `bun check` exit 0; reply posted
  and thread resolved.
- PR #370 merged as `54c88d18`; release PR #374 merged as `a663e963`.
- Release `0.25.3` retry `32195291711` passed after token rotation. Both npm
  packages report version `0.25.3` and gitHead `a663e963`; both package tags
  dereference to that commit; GitHub release `v0.25.3`, CI `32195291753`, and
  release skill check `32235747049` are green.
- PR #371: merged current `main` cleanly; initial focused 11/11, package build,
  deslop, autoreview 0.98, and full `bun check` passed. Four later Codex review
  findings were accepted: ticket-prefixed plan, truthful body receipt, concise
  changeset, and fail-closed empty logical deserialization. RED/GREEN, 38/38
  focused, build, autoreview 0.99, and final `bun check` pass at `d83053e0`.
- PR #371 merged as `80a84414`; release PR #375 merged as `cb04592e`.
  Both packages report `0.25.4` with gitHead `cb04592e`; tags, GitHub release,
  release skill check `32237989925`, and post-release CI `32237839273` are green.
- PR #372: accepted stale mirror P1 plus four later findings. Current `main` is
  integrated; three RED/GREEN regressions pass in codegen 72/72; package build,
  exact skill parity, deslop, autoreview 0.99, and full `bun check` are green.
- PR #372 merged as `f2883042`; release PR #376 merged as `4315537b`. Both
  packages, tags, GitHub release `v0.25.5`, skill check `32240540068`, and
  post-release CI `32240350233` read back green.
- PR #373: prior output-issue sanitization passed security 72/72, server 171/171,
  package/docs builds, pack, mirror, agent-native review, autoreview 0.97, and
  full `bun check`. One newer dynamic-path leakage P1 remains under repair.

Timeline:
- 2026-08-18T22:28:46.540Z Autoclosure plan created.
- 2026-08-19 Initial inventory found four open PRs; all passed task compliance.
- 2026-08-19 Selected order #370, #371, #372, #373: oldest ORM work first,
  then CLI and server/docs, minimizing likely overlap and release churn.
- 2026-08-19 Repaired historical release red: failed-only rerun completed green
  without republishing or retagging `0.25.2`.
- 2026-08-19 PR #370 closeout patch counts physical nullish bucket probes,
  adds both budget regressions, refreshes source-owned fixture drift, and passes
  the full repository/runtime gate.
- 2026-08-19 PR #370 merged; release PR #374 auto-merged; `0.25.3` publication
  exposed the expired npm token.
- 2026-08-19 Token rotation completed; failed-only release retry published and
  read back `0.25.3` across npm, package tags, GitHub release, CI, and skills.
- 2026-08-19 PR #371 review repairs pushed at `d83053e0`; body now points to
  `docs/plans/367-in-notin-variadic-filter-depth.md`.
- 2026-08-19 PR #371 merged and released as `0.25.4`; exact artifacts, release
  skills, and post-release CI read back green.
- 2026-08-19 PR #372 integrated current `main`; all four later review findings
  were accepted, repaired, and proven locally before exact-head verification.
- 2026-08-19 PR #372 merged and released as `0.25.5`; exact artifacts, skills,
  and post-release CI read back green.
- 2026-08-19 PR #373 integrated current `main`; one later dynamic-path leakage
  P1 is being repaired before final verification.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | `0.25.5` published; repairing #373 final security P1 |
| Where am I going? | Verify, merge, release, and audit #373, then close the batch |
| What is the goal? | Repair release residue and close every initially open PR honestly |
| What have I learned? | `0.25.2` is aligned; four open PRs all carry valid exact task evidence |
| What have I done? | Removed stale revert plan, created goal/plan, fetched immutable heads, verified compliance, chose order |

Open risks:
- Release sequencing: finish each package publication and artifact readback
  before advancing to the next PR.
