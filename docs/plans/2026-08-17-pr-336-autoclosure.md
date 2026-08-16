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
| source behavior | yes | ORM query/stream owners and read-count/result tests | 61 focused tests complete |
| package/API/build | yes | package typecheck/build | complete |
| generated output | yes | package skill source and `.agents` mirror | merge conflict regenerated from source |
| fixtures/scenarios | yes | full check/runtime | complete |
| docs/package skill | yes | pagination docs plus ORM package skill | complete |
| changeset | yes | `.changeset/lucky-donuts-repeat.md` | complete |
| agent workflow | no | no rule/helper/workflow behavior | N/A |
| cleanup/review | yes | deslop and autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, pinned checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each local lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Released-main merge conflicted in source and generated ORM guide | 1 | resolve package source with both proven intents, then regenerate mirror | resolved; 57 focused tests and package typecheck/build pass |
| Release/docs claimed one read per returned ID and all cursor queries | 1 | trace the literal advanced-path owner and count missing/policy-filtered IDs | fixed; claim scoped to `.select()` and listed positions visited |
| Early stop did not propagate iterator cleanup through wrappers | 1 | add return-tracking streams for mapped, direct, merged, and distinct exits | four red tests fixed; all 33 stream tests pass |
| First full check found one formatter-only line | 1 | run owning formatter, then restart full check and review | fixed; full check and fresh review pass |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | prove results, reads, cleanup, and cursors | 61 focused tests pass |
| Source/generated audit | complete | audit query/stream/docs and generated mirror | source/mirror byte-equal; intent/docs gates pass |
| Package/docs/scenario closure | complete | typecheck/build/full check | all pass |
| Deslop | complete | bounded changed-file cleanup | 167 -> 167; score unchanged; async noise simplified |
| Agent-native reviewer | yes | docs/skill mirror audit | capability map passes; no workflow action delta |
| Final lint | yes | run `bun lint:fix` | 904 files clean |
| Repository check | yes | run `bun check` | exit 0 after released-main merge |
| GitHub delivery | pending | push, feedback, pinned checks, merge/release | pending |
| Autoreview | yes | final branch review | P1 clean; patch correct (0.82) |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback, released main | repair |
| Repair | complete | docs scope and iterator cleanup repaired | review/checks |
| Review/checks | complete | focused/package/docs/skill/deslop/lint/full/review green | delivery |
| Delivery | in_progress | final local branch ready | push, feedback, pinned checks |
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
- The release text, pagination docs, package skill, and source comments now
  scope the behavior to `.select()` and say what is actually bounded: listed
  positions visited, including missing or policy-filtered IDs.
- Four red return-tracking regressions showed the new `ConcatStreams.return()`
  could not reach mapped, merged, distinct, or direct source iterators. Cleanup
  now propagates through `QueryStream`, `FlatMapStream`, `MergedStream`,
  `OrderByStream`, and `DistinctStream`; all four regressions are green.
- The complete focused owner surface passes: 33 stream plus 28 pipeline tests,
  with package typecheck/build green.
- Docs/skill agent-native map passes: user action -> `kitcn` skill -> package
  ORM reference -> generated `.agents` mirror and www pagination docs -> focused
  tests and full check. Mirrors are byte-equal; intent validation/staleness and
  docs quality gates pass.
- Deslop is zero-net (167 -> 167, score 495.27 unchanged); one new async wrapper
  was simplified and the remaining line-shifted hits are existing owners.
- `bun lint:fix` leaves 904 files clean. Full `bun check` passes against released
  v0.18.0 main, including fresh fixtures and runtime scenarios.
- Fresh branch P1 autoreview is clean with no accepted/actionable findings;
  patch-correct confidence is 0.82 and its parallel 61-test lane passed.

Timeline:
- 2026-08-17 PR #336 merged current main, resolved source/generated docs, and
  passed its first focused/package baseline.
- 2026-08-17 Repaired claim scope and iterator cleanup; all local closure gates
  pass against released v0.18.0 main.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Delivery |
| Where am I going? | Push, feedback, pinned checks, merge, release |
| What is the goal? | Ship only proven bounded stream and ID-list behavior. |
| What have I learned? | The stream fixes are credible; the docs overstate the lazy path. |
| What have I done? | Repaired two claim gaps and four cleanup paths; all local gates pass. |

Open risks:
- Remote exact-head checks, merge, release publication, and post-release CI
  remain unproven until delivery completes.
