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
| source behavior | yes | 71 focused server tests after review repairs | complete |
| package/API/build | yes | Package build and root typecheck | complete |
| generated output | no | N/A: no generated output | N/A |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | no | N/A: no docs/skill delta | N/A |
| changeset | yes | Minor changeset names Convex/HTTP middleware and raw-input behavior | complete |
| agent workflow | no | N/A: no agent action | N/A |
| cleanup/review | yes | Deslop tradeoff audited; autoreview clean at 0.98 | complete |
| repository check | yes | Exact final-tree `bun check` | complete |
| GitHub delivery | yes | PR 320 merged as `799dc4f8` | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each pre-delivery lane is proven or N/A with a concrete reason.
- [x] Generated output is N/A: no generated owner is touched.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner: none.
- [x] Agent-native pack: no rule/generated mirror changed.
- [x] Agent-native pack: no agent action changed; discoverability N/A.
- [x] Agent-native pack: mirror sync N/A.
- [x] Agent-native pack: installed skill state unchanged.
- [x] Agent-native pack: agent routing/eval rows N/A.
- [x] Agent-native pack: agent-native review N/A after applicability audit.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| HTTP middleware returned before its handler | 1 | Make the resolver the shared runner terminal | Red event-order test became green |
| Middleware raw JSON parse returned 500 | 1 | Route cloned JSON through the owned BAD_REQUEST reader | Red public route test became green |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused server tests | passed: 71 tests, 182 assertions |
| Source/generated audit | no | N/A: source-only runtime change | N/A |
| Package/docs/scenario closure | yes | Build package and audit changeset | passed |
| Deslop | yes | Run changed-file cleanup review | Score +2.06; one fan-out finding accepted for canonical shared runner |
| Agent-native reviewer | no | N/A: no agent-facing change | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | passed: 880 files; one formatting fix applied |
| Repository check | yes | Run `bun check` | passed on exact `764b98fa` tree |
| GitHub delivery | yes | Update, squash-merge, read back | merged as `799dc4f8` |
| Autoreview | yes | Resolve every accepted actionable finding | clean at 0.98; zero actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/320-close-crpc-correctness-pr.md` | passed |
| Agent source / generated sync | no | N/A: no agent source/mirror | N/A |
| Installed lock audit | no | N/A: no skill state change | N/A |
| Agent action discoverability | no | N/A: no agent action | N/A |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | no | N/A after applicability audit | No agent surface |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | VISION, PR, changeset, source, tests, checks, and four threads read | repair |
| Repair | complete | Rebased onto `b80d7340`; fixed both live HTTP findings with TDD | review |
| Review/checks | complete | Focused tests, build, typecheck, lint, deslop, autoreview, and exact check pass | delivery |
| Delivery | complete | CI 8m18 and Vercel passed; four threads resolved; squash-merged | final audit |
| Closeout | complete | Merge receipt and no-release state read back | final |

Verification evidence:
- Pre-rebase PR 320 CI/Vercel green; stale after rebasing onto PR 322 merge.
- Rebased both commits onto main at `b80d7340` without conflicts.
- Focused builder/error/http-builder proof passes 71 tests with 182 assertions.
- Red-to-green HTTP proof establishes middleware order as
  `before -> handler -> after` and maps malformed JSON read through
  `getRawInput()` to `400 BAD_REQUEST`.
- Convex and HTTP procedures share `middleware-runner.ts` as the one terminal
  chain owner; package build and root typecheck pass.
- Changeset starts each bullet with an action verb and covers Convex/HTTP
  wrapping plus middleware raw-input errors.
- Deslop score improves by 2.06; the one new directory fan-out occurrence is
  accepted because a canonical shared runner is safer than duplicated recursion.
- Final autoreview reports zero actionable findings at 0.98 confidence.
- Exact final-tree `bun check` passed at `764b98fa00544ab2d62e7244440295e6dc631ce8`.
- GitHub CI passed in 8m18, Vercel passed, and all four review threads were
  resolved before merge.
- PR 320 was squash-merged at 2026-08-14T21:56:25Z as
  `799dc4f80ab998646fd1960fbf82d6f536e5317a`; auto-release remained unchecked.

Timeline:
- 2026-08-14T18:17:54.952Z Autoclosure plan created.
- 2026-08-14T23:35:00+02:00 Rebased onto PR 322, closed both live HTTP
  findings with red-to-green tests, and completed pre-gate review proof.
- 2026-08-14T23:56:25+02:00 Passed exact check and remote gates, resolved all
  threads, and squash-merged without triggering a release.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | PR 319 closure |
| What is the goal? | Merge proven cRPC validation, middleware, and HTTP correctness |
| What have I learned? | HTTP and Convex middleware need one terminal-chain owner |
| What have I done? | Proved, reviewed, checked, delivered, and read back PR 320 |

Open risks:
- None within PR 320.

Findings:
- cRPC error identity crosses a Convex syscall boundary and needs behavior-level tests.

Decisions and tradeoffs:
- Keep the resolver as terminal middleware owner; reject adjacent API redesign.

Review fixes:
- Last-schema ownership for overlapping refined inputs: fixed by the second
  original commit and proved by focused tests.
- Changeset action verbs: fixed by the second original commit and re-audited.
- HTTP middleware terminal chaining: fixed with the shared resolver runner and
  a public event-order regression.
- Middleware `getRawInput()` malformed JSON: fixed through the BAD_REQUEST body
  reader and a public 400-response regression.
