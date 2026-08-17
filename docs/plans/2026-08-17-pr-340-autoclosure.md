# PR 340 autoclosure

Objective:
Autoclose PR #340 by retaining its proven single-pass validation and
definition-time memoization, repairing its transformed-output type contract,
and delivering the package release with exact proof.

Goal plan:
docs/plans/2026-08-17-pr-340-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- cRPC parses output exactly once before wire encoding, handlers return schema
  input values, clients receive schema output values, schema/input/HTTP plans
  are built at definition time, and primitive codec dispatch is skipped only
  through an explicit `objectsOnly` declaration.
- Focused tests, package typecheck/build, full check, final review, exact remote
  gates, merge, release, npm/tag, and post-release CI all pass.

Verification surface:
- Released-main diff, cRPC transformer/builders, Zod transform and default
  regressions, package typecheck/build, changeset, docs/skill audit, deslop,
  lint, full check, autoreview, exact-head CI/Vercel, release matrix, and npm.

Constraints:
- Parse output once without weakening custom codec validation or changing the
  handler-input/client-output contract.
- Keep auth, rate-limit, and ORM capability work outside this PR.

Boundaries:
- intended delta: PR #340 cRPC validation and memoization work
- allowed repairs: output contract, review feedback, docs/skill/changeset sync,
  proof, and mergeability
- non-goals: auth parity (#339), rate limits (#341), ORM capabilities (#342)

Blocked condition:
- Stop only if the owning transformed-output contract cannot be proven by the
  focused type/runtime tests or maintainer delivery remains unavailable after
  the documented retry path.

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | transformer, builder, zod4, HTTP builder | complete |
| package/API/build | yes | package typecheck/build and function hints | complete |
| generated output | no | no generated artifacts | N/A |
| fixtures/scenarios | no | no scaffold/runtime fixture changes | N/A |
| docs/package skill | yes | procedures page; compressed skill already states direct same-transaction dispatch | reviewed |
| changeset | yes | `.changeset/crpc-validation-memoization.md` | updated |
| agent workflow | no | no agent tooling changes | N/A |
| cleanup/review | yes | zero-net deslop and repair review | clean |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | exact head, merge, release, read-back | complete |

Work Checklist:
- [x] Exact released-main diff and three review threads reconstructed.
- [x] Two upstream threads verified fixed by source and tests.
- [x] Handler/client transformed-output mismatch reproduced and repaired.
- [x] Changeset and docs/skill ownership reviewed.
- [x] Focused and package proof passes.
- [x] Deslop, lint, full check, and final whole-branch review pass.
- [x] Feedback is resolved and exact remote delivery completes.

Completion Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Targeted/package proof | yes | focused tests, typecheck, and build pass |
| Cleanup/review | yes | zero-net deslop and clean P1 reviews |
| Repository check | yes | `bun check` passes |
| GitHub delivery | yes | exact merge, release, matrix, npm, and CI read-back |
| Goal plan complete | yes | batch completion audit passes |

Verification evidence:
- The branch is broad but substantive, not generated slop. It removes repeated
  response traversal, repeated input-plan construction, and per-request HTTP
  query coercion while adding direct regressions for each owner.
- `objectsOnly` is an explicit codec capability; unknown codecs still receive
  primitives. `skipZodReturnsValidation` preserves the direct zCustom contract.
- The remaining review finding was valid: `.output(z.transform(...))` parsed a
  handler input at runtime but typed the handler as schema output. Query,
  mutation, and action handlers now return `z.input<TOutput>` while their
  static client hints expose `z.output<TOutput>`.
- Seventy-nine focused Bun tests and eight Vitest/type tests pass. Package
  typecheck/build, changeset status, zero-net slop delta, lint, and the full
  repository check pass. The repair-only P1 autoreview is clean at 0.96.
- The first whole-branch review found that `undefined` was converted to `null`
  before output parsing, breaking optional, void, and defaulted schemas. A red
  defaulted-output regression now passes after parsing the handler value
  unchanged; the focused follow-up review is clean at 0.98.
- The committed whole-branch P1 review is clean at 0.94 and reports no P0/P1
  defect across validation, memoization, HTTP coercion, or codec dispatch.
- Exact head `9c5050c3` passed all required gates and squash-merged as
  `13fbae32`. Release PR #358 merged as `d5ff987e`, published npm/GitHub
  `v0.23.0`, and post-release CI `31998182904` passed.
- Release Convex Matrix run `31998177107` passed job `95293531708`, including
  the full version matrix and runtime scenarios, from 05:31:15Z to 05:47:03Z.

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | output type contract and changeset | proof |
| Review/checks | complete | focused/package/full gates; whole-branch review clean | delivery |
| Delivery | complete | exact head merged and released | closeout |
| Closeout | complete | npm/tag/post-release CI read back | done |

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | Done |
| What is the goal? | Ship proven single-pass cRPC validation and typing. |
| What have I learned? | Performance work was real; transformed/defaulted output contracts required repair. |
| What have I done? | Repaired, proved, merged, released v0.23.0, and read back all gates. |

Open risks:
- None remaining inside PR #340 scope.
