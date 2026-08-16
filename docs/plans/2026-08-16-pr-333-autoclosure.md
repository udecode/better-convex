# PR 333 autoclosure

Objective:
Autoclose PR #333 by preserving only proven Turbo/CI input fixes and scaffold
failure cleanup, rejecting benchmark residue or cache shortcuts without an
explicit owner.

Goal plan:
docs/plans/2026-08-16-pr-333-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Completion threshold:
- Turbo hashes every real typecheck input, dead CI cache work is removed, the
  prebuilt-package shortcut fails loudly when invalid, fixture drift always
  cleans its temp tree, command failures retain a non-zero exit, and PR #333
  has a pinned merge/close receipt.

Verification surface:
- Exact workflow/Turbo/tooling diff, all `scaffold-utils.run` callers, focused
  tooling tests, fixture check, deslop, agent-native review, autoreview, lint,
  full `bun check`, remote CI/Vercel, and final GitHub read-back.

Constraints:
- Finish the intended delta; do not restore the reverted concurrent fixtures.
- Keep the skip-build flag step-local and prove its built-artifact precondition.
- Preserve prepared scenario install specs.

Boundaries:
- intended delta: correct Turbo inputs, remove unused Next cache work, reuse an
  immediately preceding package build, and make fixture subprocess failures
  throwable so cleanup runs
- allowed repairs: correctness/test gaps inside these exact owners
- non-goals: new fixture concurrency, generalized process framework, package API

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, six-file diff, commit history, callers |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update and merge/close PR #333 |
| Active goal checked or created | yes | root batch goal active |
| Agent-native pack selected | yes | workflow/tooling change |
| Agent-facing action surface identified | yes | CI and repository fixture commands |
| Source rule versus generated mirror boundary identified | yes | no generated mirror touched |
| Installed-skill lock versus local-rule owner identified | yes | no skill lock delta |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded for batch and applies here |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | scaffold runner/fixture tests | 45 focused tests pass |
| package/API/build | no | no package source delta | N/A |
| generated output | no | no generated files | N/A |
| fixtures/scenarios | yes | fixture check/full repository gate | complete |
| docs/package skill | no | no published docs/skill delta | N/A |
| changeset | no | no package delta | N/A |
| agent workflow | yes | CI/Turbo task and failure receipts | capability map passes |
| cleanup/review | yes | deslop and two reviewers | slop delta zero; final review pending |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | pinned head and merge/read-back | pending |

Work Checklist:
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
| Targeted behavior proof | complete | focused tooling/fixture tests | 45 pass, including structured exit and cleanup |
| Source/generated audit | complete | audit source owners and N/A mirrors | six source/config owners; no generated delta |
| Package/docs/scenario closure | complete | fixture and repository gates | full check passes |
| Deslop | complete | bounded delta cleanup | 167 -> 167, no occurrence delta |
| Agent-native reviewer | complete | review workflow/tool action | capability map passes; no source-owner gap |
| Final lint | complete | `bun lint:fix` | 896 files clean |
| Repository check | complete | `bun check` | pass |
| GitHub delivery | pending | push, pinned checks, merge/read-back | pending |
| Autoreview | yes | final committed-head review | pending |
| Goal plan complete | yes | run checker | pending |
| Agent source / generated sync | complete | N/A or sync proof | N/A: no agent source/mirror delta |
| Installed lock audit | complete | N/A or lock proof | N/A: no skill lock delta |
| Agent action discoverability | complete | prove command/workflow routing | root scripts and CI workflow expose the actions |
| Helper and template smoke | complete | prove error/cleanup/skip-build paths | focused tests plus full fixture gate pass |
| Agent-native review | pending | close accepted findings | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | six-file diff and caller inventory | repair/proof |
| Repair | complete | added missing structured subprocess regression | review |
| Review/checks | in_progress | focused tests, dry-run inputs, deslop, lint, full check pass | autoreview |
| Delivery | pending | | closeout |
| Closeout | pending | | final |

Verification evidence:
- PR is a coherent six-file tooling delta, not generated churn. The abandoned
  concurrent fixture experiment was fully reverted; the remaining runner,
  cleanup, cache-input, and step-local build reuse changes have named owners.
- 45 focused tooling/scenario tests pass. The added runner regression proves
  exit code 7 both throws structured context and remains observable when
  explicitly allowed; fixture drift proves its temp tree is removed.
- Turbo dry-run materializes `tsconfig.json`, `tooling/global.d.ts`, and
  `packages/kitcn/src/**` in global cache inputs. No root command invokes the
  deleted Turbo build/lint tasks.
- Agent-native map passes: maintainer actions route through root scripts/CI;
  source owners are the workflow, Turbo config, and tooling scripts; proof is
  focused tests, Turbo dry-run, and full check. No mirror/lock is involved.
- Deslop is 167 -> 167 with zero added or worsened occurrences. Lint checked
  896 files with no fixes. Full `bun check` passed, including fixture/runtime.

Timeline:
- 2026-08-16 PR #331 merged; current main merged into #333 and audit started.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Final review |
| Where am I going? | Commit, autoreview, push, pinned remote merge |
| What is the goal? | Merge only the proven CI/tooling cleanup in #333. |
| What have I learned? | The final branch is much smaller than its commit history suggests. |
| What have I done? | Proved behavior/cache inputs, added exit regression, deslopped, linted, and passed full check. |

Open risks:
- Throwable `run` changes failure ownership for every scaffold utility caller.
- `KITCN_SKIP_LOCAL_BUILD` must never accept stale or absent output.
