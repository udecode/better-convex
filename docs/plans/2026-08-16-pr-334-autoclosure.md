# PR 334 autoclosure

Objective:
Autoclose PR #334 by preserving proven example/docs render and read reductions,
repairing its boolean-query contract, and proving every changed route live.

Goal plan:
docs/plans/2026-08-16-pr-334-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Completion threshold:
- The home page keeps only the picker as client JS; `/http` hydrates its
  prefetches; aggregate/ORM mutations rely on live snapshots; migrations do not
  poll while idle; tag merge cannot truncate; the nav reads a bounded boolean;
  all five changed routes have browser/runtime and walkthrough proof; PR #334
  has a pinned merge/close receipt.

Verification surface:
- Source and generated owners, actual read-count regressions, changed example
  tests/typecheck, Next `/_next/mcp`, Browser/agent-browser route proof,
  responsive/console/interaction screenshots, walkthrough receipt, deslop,
  lint, full check, autoreview, feedback, CI/Vercel, and merge read-back.

Constraints:
- No new demo capability or visual redesign.
- Do not treat generated files or copy-pasted query snippets as behavior proof.
- Preserve auth/loading/empty states and current visual output.

Boundaries:
- intended delta: reduce static landing-page hydration, eliminate discarded or
  transaction-heavy demo reads, bound tag merge, and stop idle mutation polling
- allowed repairs: exact query/generated/test/browser gaps required by that delta
- non-goals: migration registry redesign, demo feature expansion, public API

Blocked condition:
- Required browser/runtime tooling, auth fixture, or maintainer authority is
  unavailable after the documented fallback/retry path is exhausted.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, 15-file diff, two review threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update and merge/close #334 |
| Active goal checked or created | yes | root batch goal active |
| Agent-native pack selected | yes | generated/runtime/browser actions |
| Agent-facing action surface identified | yes | codegen, dev routes, browser proof |
| Source rule versus generated mirror boundary identified | yes | functions own generated API/runtime |
| Installed-skill lock versus local-rule owner identified | yes | no skill lock delta |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded for batch |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | real query/mutation owners and focused tests | dedicated existence repair green |
| package/API/build | yes | codegen parser stub, 63 tests, package build | complete |
| generated output | yes | `bun --cwd example codegen` | complete: 17 HTTP routes plus `projects.hasAny` |
| fixtures/scenarios | yes | full check and live example routes | complete |
| docs/package skill | no | landing UI only; no reference prose/API guidance | N/A |
| changeset | yes | existing unreleased ORM patch changeset extended for codegen fix | complete |
| agent workflow | yes | deterministic codegen/runtime/browser routes | complete |
| cleanup/review | yes | deslop, agent-native map, committed-head autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, pinned checks, merge/read-back | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each local lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [x] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [x] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Production-owner regression imported a missing helper | 1 | implement the bounded helper and route the procedure through it | red module failure became 2 green read-count tests |
| Tag regressions copied mutation logic and used `any` | 1 | extract the real mutation owner and test it directly | `mergeTags` has two constant-read owner tests |
| `/http` returned “HTTP route not found: health” | 1 | inspect generated route metadata and parser stub | stub now preserves nested route method/path metadata; 63 codegen tests pass |
| Helper hyphens produced invalid Convex module paths | 1 | use Convex-safe underscore module names | codegen and deploy pass |
| Vitest files run through `bun test` failed at the runner boundary | 1 | invoke the owning Vitest runner | 4 focused tests pass |
| Mixed `dist` and `src` middleware identities survived install | 1 | make the Convex graph source-first for all kitcn subpaths | Convex and example typechecks pass |
| Full runtime scenarios collided with walkthrough port 3210 | 1 | stop only the walkthrough processes and rerun | full `bun check` exits 0 |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | changed owner tests plus UI interactions | 4 read-count tests, 63 codegen tests, five live routes |
| Source/generated audit | complete | codegen and exact output review | 17 HTTP routes and `projects.hasAny` regenerated |
| Package/docs/scenario closure | complete | typecheck/full/live proof | package build, two typechecks, full check, Browser proof |
| Deslop | complete | bounded changed-file delta | 167 findings before/after; score unchanged |
| Agent-native reviewer | complete | map codegen/browser route | capability map below passes; no workflow files touched |
| Final lint | yes | `bun lint:fix` | complete |
| Repository check | yes | `bun check` | complete, exit 0 |
| GitHub delivery | complete | push, feedback, pinned checks, merge | head `26b8f4de`, CI `31971886260`, Vercel, merge `6bc8d1ca` |
| Autoreview | yes | final committed-head review | clean, 0.98 confidence |
| Goal plan complete | yes | run checker | complete |
| Agent source / generated sync | N/A | no `.agents/rules/**` change | no mirror sync needed |
| Installed lock audit | N/A | no skill installation delta | lock untouched |
| Agent action discoverability | complete | prove codegen/browser commands | `kitcn codegen`, `bun --cwd example codegen`, Browser routes |
| Helper and template smoke | complete | prove procedure and UI states | owner tests plus template picker and five routes |
| Agent-native review | complete | close accepted findings | capability map pass; no agent-workflow delta |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, doctrine, sources, feedback | repair |
| Repair | complete | existence/tag owners, HTTP parser, source-first type graph | review |
| Review/checks | complete | focused tests, browser, walkthrough, deslop, lint, full check, autoreview | delivery |
| Delivery | complete | both threads resolved; pinned CI/Vercel green; squash merge | closeout |
| Closeout | complete | merge and v0.17.4 publication read back | final |

Verification evidence:
- The branch is mixed but each retained delta maps to a real rendered or read
  owner. The landing extraction is markup-preserving; engine timing was invalid
  because Convex freezes time; mutation snapshots duplicate live queries; idle
  migration polling spends mutation ratelimit capacity; tag merge previously
  truncated at the schema default.
- The initial nav fix was still slop: it fetched the complete dropdown model to
  derive one boolean, and its test copied the query instead of calling product
  code. A missing-owner red now passes through `hasAnyProject`; two read-count
  tests stay constant with 40 unrelated projects. Codegen exposes `hasAny`.
- The original tag tests were proof-shaped slop: they copied production logic
  and typed the database as `any`. Tests now call the real `mergeTags` owner and
  stay constant with unrelated rows.
- Live Browser proof exposed a package bug hidden by a no-assertion codegen
  test: the parser stub erased nested HTTP route metadata. The stub preserves
  method/path and recursively flattens routers; 63 codegen tests and the live
  `/http` page prove all 17 routes.
- Browser proof: `/http`, `/migrations`, `/aggregate`, and `/orm` render their
  intended states without fresh console errors; the landing template picker
  selects Vite; `/http` and the landing page have no horizontal overflow at
  390 px. Walkthrough artifacts live under `tmp/walkthrough/pr-334/`.
- `bun --cwd packages/kitcn build`, both example/Convex typechecks,
  `bun lint:fix`, and full `bun check` pass.
- Committed head `26b8f4de` passed autoreview, CI run `31971886260`, and
  Vercel; both review threads were resolved before squash merge `6bc8d1ca`.
- Release PR #346 merged as `e79a0d8d`; npm and GitHub `v0.17.4` include the
  nested HTTP route codegen repair.

Agent-native capability map:
| User action | Route | Source owner | Generated/runtime output | Proof | Verdict |
| --- | --- | --- | --- | --- | --- |
| Generate cRPC HTTP types | `kitcn codegen` / `bun --cwd example codegen` | `crpc-builder-stub.ts` and codegen | `example/convex/shared/api.ts` | 63 tests plus live `/http` | pass |
| Inspect changed routes | Browser navigation and interaction | example/www source | screenshots and diff receipt | desktop/mobile, console, interaction | pass |

Timeline:
- 2026-08-16 PR #333 merged; walkthrough baseline captured on #334 before repair.
- 2026-08-16 PR #334 merged and the package repair published in v0.17.4.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closed |
| Where am I going? | Next frozen PR |
| What is the goal? | Merge only the proven render/read reductions with live route proof. |
| What have I learned? | Two copied tests and one no-assert test concealed real source-owner defects. |
| What have I done? | Repaired all three owners, merged #334, and published its package repair in v0.17.4. |

Open risks:
- None for PR #334.
