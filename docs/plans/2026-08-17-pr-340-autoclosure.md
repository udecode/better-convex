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

Boundaries:
- intended delta: PR #340 cRPC validation and memoization work
- allowed repairs: output contract, review feedback, docs/skill/changeset sync,
  proof, and mergeability
- non-goals: auth parity (#339), rate limits (#341), ORM capabilities (#342)

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
| GitHub delivery | yes | exact head, merge, release, read-back | pending |

Work checklist:
- [x] Exact released-main diff and three review threads reconstructed.
- [x] Two upstream threads verified fixed by source and tests.
- [x] Handler/client transformed-output mismatch reproduced and repaired.
- [x] Changeset and docs/skill ownership reviewed.
- [x] Focused and package proof passes.
- [x] Deslop, lint, full check, and final whole-branch review pass.
- [ ] Feedback is resolved and exact remote delivery completes.

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

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | output type contract and changeset | proof |
| Review/checks | complete | focused/package/full gates; whole-branch review clean | delivery |
| Delivery | in_progress | committed head ready | exact GitHub closure |
| Closeout | pending | | release read-back |
