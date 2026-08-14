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
| source behavior | yes | 31 planner/ownership tests and 124 CLI tests pass | complete |
| package/API/build | yes | Package build and root typecheck pass | complete |
| generated output | yes | Skill sync, Intent validation/staleness, and fixture sync pass | complete |
| fixtures/scenarios | yes | `fixtures:sync` and `fixtures:check` pass without drift | complete |
| docs/package skill | yes | www guidance audited; package skill equals `.agents` mirror | complete |
| changeset | yes | `.changeset/cli-safe-file-edits.md` covers the package behavior | complete |
| agent workflow | yes | Active `cli.ts` add route has JSON refusal receipt and nonzero exit tests | complete |
| cleanup/review | yes | Zero slop delta; agent-native audit and autoreview clean | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | PR 322 update/merge/read-back | passed: squash-merged as `b80d7340` |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each pre-delivery lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill source owner/mirror boundary recorded.
- [x] Agent-native pack: safe CLI refusal and overwrite routes are discoverable.
- [x] Agent-native pack: package skill mirror and fixtures are regenerated/proved.
- [x] Agent-native pack: installed skill membership unchanged.
- [x] Agent-native pack: JSON refused receipt, exit status, and forbidden overwrite behavior have tests.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Direct `bunx intent` executable resolution failed | 1 | Use repository-owned scripts | `bun run intent:validate` and `bun run intent:stale` passed |
| Package-intent saw stale `dist` from the previous PR | 1 | Rebuild the package, then rerun only that proof | Package build passed; 3 package-intent tests passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused CLI tests | 31 focused and 124 CLI tests pass |
| Source/generated audit | yes | Regenerate/prove skill mirror and fixtures | Sync, Intent, `cmp`, and fixture proofs pass |
| Package/docs/scenario closure | yes | Build, docs/skill/changeset, fixtures | Complete |
| Deslop | yes | Run changed-file cleanup review | Zero net delta |
| Agent-native reviewer | yes | Review CLI agent route and receipts | Pass; active route and all proof surfaces mapped |
| Final lint | yes | Run `bun lint:fix` | Pass; 879 files clean |
| Repository check | yes | Run `bun check` | Pass; full tests, fixtures, and runtime scenarios |
| GitHub delivery | yes | Update, squash-merge, read back | passed: merged 2026-08-14T21:33:37Z as `b80d7340` |
| Autoreview | yes | Resolve every accepted actionable finding | passed: all three GitHub threads resolved; final local review clean |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/322-close-cli-safety-pr.md` | passed after merge receipt |
| Agent source / generated sync | yes | Prove package skill mirror; `.agents/rules` N/A | Package skill and mirror byte-identical |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Audit package skill CLI guidance | Package skill and CLI docs document `add --yes/--overwrite/--json` |
| Helper and template smoke | yes | Focused CLI planner/codegen/refusal tests | Pass |
| Agent-native review | yes | Close accepted CLI agent-route findings | Pass; zero accepted findings |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR, source owners, active dispatch, mirrors, and docs audited | repair |
| Repair | complete | Two review regressions fixed with tests | review |
| Review/checks | complete | Focused tests, build, typecheck, fixtures, sync, deslop, reviews, lint, and exact check pass | delivery |
| Delivery | completed | Exact head `53bd56d4` passed CI/Vercel, all threads resolved, and PR merged as `b80d7340` | final audit |
| Closeout | completed | Merge read-back and child goal checker passed | final |

Verification evidence:
- `bun test` for planner and schema ownership: 31 pass.
- `bun run test:cli`: 124 pass, 865 assertions.
- `bun --cwd packages/kitcn build` and `bun typecheck`: pass.
- `bun run fixtures:sync` and `bun run fixtures:check`: pass with no fixture drift.
- `bun run intent:validate`, `bun run intent:stale`, and package-skill-to-mirror
  byte comparison: pass.
- Deslop reports zero net regression; final autoreview reports no actionable
  findings with 0.99 confidence.
- Exact `bun check` passes, including lint, typecheck, Bun/Vitest suites, 124
  CLI tests, Concave smoke, every fixture comparison, and runtime scenarios.
- Exact head `53bd56d4` passed CI in 7m03s and Vercel, all three review
  threads were source-backed and resolved, and PR 322 squash-merged as
  `b80d7340` with auto-release unchecked.
- Agent-native capability map: action `kitcn add --yes/--overwrite/--json`;
  active route `cli.ts` to `commands/add.ts`; mutation owner planner/apply helpers
  in `backend-core.ts`; guidance owners are CLI docs and package skill; generated
  mirror is `.agents/skills/kitcn`; proof owners are CLI, planner, package-intent,
  Intent, and fixture tests. The legacy `backend-core.run()` is not a package
  export or the bin dispatch route.

Timeline:
- 2026-08-14T18:17:54.831Z Autoclosure plan created.
- 2026-08-14T21:24:00+02:00 Fixed both source-backed review findings with
  focused regressions, synchronized generated owners, and completed pre-gate
  review evidence.
- 2026-08-14T23:19:57+02:00 Exact repository check passed end to end.
- 2026-08-14T21:33:37Z PR 322 squash-merged as `b80d7340` after exact-head
  CI/Vercel passed and the post-CI thread audit was clean.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | Next ranked batch PR |
| What is the goal? | Merge safe CLI ownership and schema editing with full generated proof |
| What have I learned? | Active add dispatch is modular; generated owners are synchronized |
| What have I done? | Fixed both findings and proved every pre-delivery lane |

Open risks:
- None for PR 322.

Findings:
- This is the batch's widest generated/fixture/agent-facing closeout surface.

Decisions and tradeoffs:
- Require fixture sync/check and structured refusal proof before merge.

Review fixes:
- Replaced parse snapshots and suffix sweeps with in-memory transformed-module
  parsing; user-owned former-suffix paths are preserved.
- Replaced textual backward dot search with the AST property-access dot token,
  so periods inside chained-call comments cannot corrupt schema insertion.
- Moved required runtime bindings out of whole type-only `kitcn/orm` imports
  while preserving unrelated type bindings.
