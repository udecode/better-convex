# PR 337 autoclosure

Objective:
Autoclose PR #337 by retaining its proven aggregate-index and B-tree read
improvements, repairing transaction-budget accounting, and delivering the
package release with source-backed proof.

Goal plan:
docs/plans/2026-08-17-pr-337-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- Range-filtered count and aggregate work stays inside the configured budget
  across `IN` prefixes and extrema metrics; aggregate-index backfill, clearing,
  rank, count, sum, average, minimum, and maximum semantics retain owner-level
  proof; package/docs/skill/changeset/review/full gates, exact remote checks,
  merge, and release all pass.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Exact released-main diff; aggregate-index runtime/backfill and B-tree owners;
  two P1 review threads; focused metric/count/rank/B-tree/concurrency tests;
  package typecheck/build; docs/skill parity; changeset; deslop; lint; full
  check; autoreview; exact-head CI/Vercel; merge and release read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Do not publish the contributor's stale multi-PR release or cron roadmap.

Boundaries:
- intended delta: bound aggregate-index reads and improve aggregate bucket
  maintenance without changing unrelated ORM APIs
- allowed repairs: correctness, transaction-budget accounting, test,
  docs/skill, changeset, and mergeability defects required by that invariant
- unrelated files: preserve; do not treat as blockers
- non-goals: auth runtime (#338), Solid/React parity (#339), cRPC output (#340),
  rate-limit cleanup scheduling (#341), or ORM capability injection (#342)

Output budget strategy:
- Run touched aggregate owners first; save full-gate output to `/tmp`; keep
  GitHub polling to exact-head check summaries.

Blocked condition:
- Stop only if owning Convex runtime proof or maintainer merge authority remains
  unavailable after the documented retry path.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, exact released-main diff, two P1 threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update/merge or close #337 and settle release |
| Active goal checked or created | yes | root batch goal active |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | aggregate runtime/backfill, B-tree, focused tests | repair complete; broader proof pending |
| package/API/build | yes | package typecheck/build | complete after repair |
| generated output | yes | package skill source and `.agents` mirror | synchronized |
| fixtures/scenarios | yes | full check/runtime | pending |
| docs/package skill | yes | aggregate docs plus ORM package skill | repair complete |
| changeset | yes | `.changeset/aggregate-index-io.md` | repair complete |
| agent workflow | no | no rule/helper/workflow behavior | N/A |
| cleanup/review | yes | deslop and autoreview | deslop complete; autoreview pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | feedback, exact checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each local lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Released-main merge duplicated `mapWithConcurrency` ownership | 1 | trace current owner and remove the redundant new helper | resolved through `orm/write-fanout.ts`; owner tests pass |
| Range budget counted buckets but not extrema document reads | 1 | add low-budget extrema regressions and share reservations through the plan cache | fixed; single and multiple extrema metrics reject before exceeding budget |
| Chunked clear kickoff still reverse-scanned every backing-table index tuple | 1 | make lifecycle state canonical and retain only exact bounded recovery probes | fixed; automatic resume reads zero backing rows and exact state-less prune stays bounded |
| Metric/rank writes could race multi-transaction clearing | 1 | put a declared-index barrier before the raw lifecycle write | fixed; both kinds reject before document insertion while `CLEARING` |
| Concurrent prefix scans could each overshoot the hard range budget | 1 | reserve the whole batch from one shared remaining allowance | fixed; ten-prefix regression reads at most budget plus one global probe |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | in_progress | prove aggregate semantics and bounded reads | 77 focused aggregate tests plus 25 lifecycle/concurrency-owner tests pass |
| Source/generated audit | complete | audit runtime/docs and generated mirror | source/mirror synchronized |
| Package/docs/scenario closure | in_progress | typecheck/build/full check | package typecheck/build pass; full check pending |
| Deslop | complete | bounded changed-file cleanup | 167 -> 167; score unchanged |
| Agent-native reviewer | yes | docs/skill mirror audit | source/generated/action map passes |
| Final lint | yes | run `bun lint:fix` | 905 files clean |
| Repository check | yes | run `bun check` | pending |
| GitHub delivery | pending | push, feedback, exact checks, merge/release | pending |
| Autoreview | yes | final branch review | pending |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback, released main | repair |
| Repair | complete | merge overlap and budget accounting repaired | review/checks |
| Review/checks | in_progress | focused/package proof green | remaining local gates |
| Delivery | pending | | push, exact checks, merge/release |
| Closeout | pending | | final |

Verification evidence:
- The branch is substantial aggregate-index work rather than disposable slop,
  but its original transaction-safety claim omitted extrema reads.
- Released-main overlap introduced a second concurrency helper. The branch now
  reuses the existing `orm/write-fanout.ts` owner; its four tests pass.
- A red range aggregate with budget 5 read three buckets plus three extrema
  documents without rejecting. Range plans now reserve bucket and extrema work
  through the shared plan cache before querying extrema documents.
- A second regression proves `_min` and `_max` share one reservation: three
  bucket reads plus six extrema reads reject against budget 8.
- The focused aggregate surface passes 76 tests without type errors; package
  typecheck and build pass.
- The changeset and both aggregate references define work units precisely and
  keep example configuration below Convex's transaction read ceiling.
- P1 review found kickoff still reverse-scanned all distinct bucket/member/
  extrema index tuples before chunked clearing. A red read-count regression
  observed three backing-table reads. Lifecycle state now owns automatic
  pruning, so resume reads zero backing rows; exact state-less prune uses four
  bounded existence probes. All 32 count tests and the 76-test aggregate owner
  surface pass.
- The second P1 review cycle found both clearing kinds could erase concurrent
  user writes. The lifecycle owner now checks one table/status index before the
  raw create/update/delete and rejects only writes targeting declared indexes
  in `CLEARING`; removed-index pruning does not block unrelated writes. Metric
  and rank regressions prove the document is never inserted.
- The same review found 25 concurrent prefix scans could each spend a probe row.
  Batch width is now bounded by the shared remaining allowance, so the existing
  ten-prefix regression reads no more than 21 buckets for budget 20.
- Two-cycle scope pause: every accepted finding remains inside the declared
  aggregate read/clear invariant and its lifecycle owner. No protocol, storage,
  or unrelated product expansion remains, so one fresh review is authorized.
- Docs/skill agent-native mapping passes: the touched `www` aggregate reference
  maps to the package feature reference and regenerated `.agents` mirror;
  mirrors are byte-equal, Intent validates, and staleness is clean.
- Deslop is zero-net (167 -> 167, score 495.27 unchanged); the only hot-path
  async wrapper was removed. `bun lint:fix` leaves 905 files clean.

Timeline:
- 2026-08-17 Merged released main, removed duplicate concurrency ownership, and
  passed the first focused/package baseline.
- 2026-08-17 Repaired extrema budget accounting and synchronized docs/skill.
- 2026-08-17 Accepted P1 review, removed unbounded reverse discovery, and
  retained exact bounded recovery for state-less storage.
- 2026-08-17 Accepted the second P1 cycle, added the pre-write clearing barrier,
  bounded concurrent probes, and paused to reconfirm scope before final review.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Review/checks |
| Where am I going? | Finish local gates, then exact-head delivery and release |
| What is the goal? | Ship only proven bounded aggregate-index behavior. |
| What have I learned? | Bucket-only accounting could still cross Convex's read ceiling. |
| What have I done? | Reused the real concurrency owner and reserved extrema reads. |

Open risks:
- Full repository proof, final review, remote exact-head checks, merge, release,
  and post-release CI remain unproven until delivery completes.
