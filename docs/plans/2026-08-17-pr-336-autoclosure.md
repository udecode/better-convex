# PR 336 autoclosure

Objective:
Autoclose PR #336 by retaining only proven stream read-amplification fixes and
ID-list pagination behavior, repairing stale documentation and correctness
gaps, and delivering its package release with source-backed proof.

Goal plan:
docs/plans/2026-08-17-pr-336-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- Distinct, merged, and concatenated streams preserve result/cursor semantics
  while avoiding repeated wrappers, eager unopened queries, and all-source
  refills; every ID-list ordering and `maxScan` claim has owner-level runtime
  proof; package/docs/skill/changeset/review/full gates, pinned remote checks,
  merge, and release all pass.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Exact eight-file released-main diff; ORM query/stream owners; two P2 review
  threads; focused read-count, result, pagination, and cursor tests; package
  typecheck/build; docs/skill parity; changeset; deslop; lint; full check;
  autoreview; pinned CI/Vercel; merge and release read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Do not publish the contributor's stale seven-release roadmap.

Boundaries:
- intended delta: remove stream-tree/read amplification and make supported
  ID-list pagination lazy and bounded without changing unrelated ORM APIs
- allowed repairs: correctness, cursor/resource cleanup, test, docs/skill,
  changeset, and mergeability defects required by that invariant
- unrelated files: preserve; do not treat as blockers
- non-goals: query limit/index selection (#335), aggregate indexes (#337),
  auth runtime (#338), or new pagination syntax

Output budget strategy:
- Run the two touched owner suites first; save full-gate output to `/tmp`; keep
  GitHub polling to exact-head check summaries.

Blocked condition:
- Stop only if owning Convex runtime proof or maintainer merge authority remains
  unavailable after the documented retry path.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, eight-file diff, two P2 threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update/merge or close #336 and settle release |
| Active goal checked or created | yes | root batch goal active |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | ORM query/stream owners and read-count/result tests | focused baseline green after main merge |
| package/API/build | yes | package typecheck/build | baseline complete |
| generated output | yes | package skill source and `.agents` mirror | merge conflict regenerated from source |
| fixtures/scenarios | yes | full check/runtime | pending |
| docs/package skill | yes | pagination docs plus ORM package skill | repair pending |
| changeset | yes | `.changeset/lucky-donuts-repeat.md` | audit pending |
| agent workflow | no | no rule/helper/workflow behavior | N/A |
| cleanup/review | yes | deslop and autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | feedback, pinned checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Released-main merge conflicted in source and generated ORM guide | 1 | resolve package source with both proven intents, then regenerate mirror | resolved; 57 focused tests and package typecheck/build pass |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | prove results, reads, cleanup, and cursors | baseline 57 tests pass; adversarial audit pending |
| Source/generated audit | pending | audit query/stream/docs and generated mirror | pending |
| Package/docs/scenario closure | pending | typecheck/build/full check | package baseline passes; full pending |
| Deslop | pending | bounded changed-file cleanup | pending |
| Agent-native reviewer | yes | docs/skill mirror audit | pending |
| Final lint | yes | run `bun lint:fix` | pending |
| Repository check | yes | run `bun check` | pending |
| GitHub delivery | pending | push, feedback, pinned checks, merge/release | pending |
| Autoreview | yes | final committed-head review | pending |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback, released main | repair |
| Repair | in_progress | source-owned merge conflict resolved | adversarial proof |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- The contributor branch is substantial, owner-local performance work rather
  than disposable slop, but its behavioral and read-cost claims require direct
  runtime proof after #335 changed the same query planner.
- Released main merged cleanly in `query.ts`; only the ORM guide and generated
  mirror conflicted. The package source preserves #335's order-serving index
  rule and #336's bounded ID-list restriction; the mirror was regenerated.
- The merged baseline passes 57 focused query/stream tests plus package
  typecheck and build.
- P2 feedback correctly identifies stale prose: the one-read-per-returned-row
  guarantee currently belongs only to the advanced stream path, not every
  plain `findMany` cursor request.

Timeline:
- 2026-08-17 PR #336 merged current main, resolved source/generated docs, and
  passed its first focused/package baseline.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Repair |
| Where am I going? | Adversarial proof, review/checks, delivery, release |
| What is the goal? | Ship only proven bounded stream and ID-list behavior. |
| What have I learned? | The stream fixes are credible; the docs overstate the lazy path. |
| What have I done? | Merged main source-first and passed baseline owner gates. |

Open risks:
- Lazy ID-list iteration may leak or miscount around missing IDs, residual
  filters, early return, descending cursors, or plain non-select pagination.
