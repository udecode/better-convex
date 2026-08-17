# PR 338 autoclosure

Objective:
Autoclose PR #338 by retaining its proven auth hot-path reductions, repairing
persisted-session ownership and deadline races, and delivering the package
release with source-backed proof.

Goal plan:
docs/plans/2026-08-17-pr-338-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- Auth schema derivation and counted reads avoid redundant work without changing
  adapter results; persisted-token recovery terminates inside its grace window
  and cannot overwrite sign-out, a different sign-in, or a cloned copy of its
  own seeded session; package/review/full gates, exact remote checks, merge, and
  release all pass.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Exact released-main diff; generated auth runtime, adapters, Convex auth
  plugin, React auth provider; three P1 review threads; focused auth tests;
  package typecheck/build; changeset; deslop; lint; full check; autoreview;
  exact-head CI/Vercel; merge and release read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Do not publish the contributor's stale multi-PR or cron roadmap.

Boundaries:
- intended delta: reduce repeated auth runtime work and make persisted-token
  recovery bounded and ownership-safe
- allowed repairs: correctness, test, changeset, and mergeability defects
  required by that invariant
- non-goals: Solid/React parity (#339), cRPC output (#340), scheduled rate-limit
  cleanup (#341), or ORM capability injection (#342)

Output budget strategy:
- Run focused auth owners first; keep GitHub polling to exact-head summaries.

Blocked condition:
- Stop only if owning auth proof or maintainer merge authority remains
  unavailable after the documented retry path.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | exact diff and three P1 threads |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update/merge #338 and settle release |
| Active goal checked or created | yes | root batch goal active |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | auth runtime, adapters, provider tests | complete |
| package/API/build | yes | package typecheck/build | complete |
| generated output | no | no generated artifact changes | N/A |
| fixtures/scenarios | yes | full check/runtime | complete |
| docs/package skill | no | generated `defineAuth` is the documented surface | N/A |
| changeset | yes | `.changeset/auth-runtime-hot-path.md` | present |
| agent workflow | no | no agent workflow changes | N/A |
| cleanup/review | yes | deslop and autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, exact checks, merge/release | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each local lane is proven or N/A with a concrete reason.
- [x] Package/docs/skill/changeset ownership is classified.
- [x] Accepted cleanup and review findings are closed locally.
- [x] PR body and check state match the final evidence.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Restore success could land after token ownership changed | 1 | guard success before atom/fallback writes | fixed; sign-out regression passes |
| A never-settling request outlived the grace deadline | 1 | race every probe against the shared deadline | fixed; bounded recovery regression passes |
| Reference equality treated a cloned seeded session as a new sign-in | 1 | compare stable session IDs | fixed; clone regression passes |
| First page treated one match as proof of uniqueness while nonterminal | 1 | continue transaction-local pagination to terminal or two matches | fixed; 201-row scan regression passes |
| `fixtures:check` timed out cloning shadcn upstream | 1 | verify upstream reachability, then rerun the exact full gate | `git ls-remote` passed; full `bun check` retry passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | run full auth owner surface | 101 focused auth tests pass; provider 26/26 |
| Package/docs/scenario closure | complete | typecheck/build/full check | package typecheck/build and final `bun check` retry pass |
| Deslop | complete | changed-file cleanup | 167 -> 167; score unchanged |
| Agent-native reviewer | no | no workflow changes | N/A |
| Final lint | yes | run `bun lint:fix` | 905 files clean |
| Repository check | yes | run `bun check` | complete against released v0.20.0 main |
| GitHub delivery | complete | push, feedback, exact checks, merge/release | PR #338 merged `7163710a`; release PR #354 merged `351abde5`; v0.21.0 published; post-release CI green |
| Autoreview | yes | final branch review | final whole-branch P1 review clean at 0.87 |
| Goal plan complete | yes | run checker | complete at final audit |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | three session-race defects repaired | review/checks |
| Review/checks | complete | focused/package/deslop/lint/full gates green | final review |
| Delivery | complete | exact checks, merge, release, and post-release CI green | closeout |
| Closeout | complete | final receipts recorded | final |

Verification evidence:
- The branch is substantial runtime work, not disposable slop, but its original
  persisted-token recovery could overwrite newer auth state and hang forever.
- Red/green provider regressions prove token ownership, request deadlines, and
  cloned seeded-session identity. A separate competing-sign-in regression
  proves a different session cannot be overwritten. The full provider file
  passes 26 tests; all seven touched auth owners pass 101 tests.
- Released-main package typecheck/build, zero-net deslop, lint, and full
  `bun check` all pass. The repair-only P1 autoreview is clean at 0.91.
- Whole-branch review found update uniqueness only inspected the first filtered
  pagination page. A red 201-row scan returned one match on a nonterminal page
  and silently patched it despite a later duplicate. The mutation now follows
  continuation cursors inside the same transaction until terminal or two
  matches; it rejects before patching the ambiguous record.
- The first post-repair full gate hit a network timeout cloning shadcn's own
  repository during `fixtures:check`. `git ls-remote` immediately proved the
  path had recovered; the exact full `bun check` retry passed every fixture and
  runtime scenario.
- The final committed whole-branch P1 autoreview is clean and calls the patch
  correct at 0.87 confidence.

Timeline:
- 2026-08-17 Repaired persisted-session ownership and deadline races.
- 2026-08-17 Repaired paginated update uniqueness and passed final review/checks.
- 2026-08-17 Merged #338 and #354, published v0.21.0, and verified post-release CI.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closeout complete |
| Where am I going? | PR #339 |
| What is the goal? | Ship only proven auth hot-path behavior. |
| What have I learned? | Green auth paths still hid ownership and pagination races. |
| What have I done? | Closed four P1 gaps and verified merge, release, and post-release CI. |

Open risks:
- None in PR #338 scope.
