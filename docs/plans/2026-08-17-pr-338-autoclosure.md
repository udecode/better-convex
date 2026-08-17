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
| source behavior | yes | auth runtime, adapters, provider tests | repair in progress |
| package/API/build | yes | package typecheck/build | pending |
| generated output | no | no generated artifact changes | N/A |
| fixtures/scenarios | yes | full check/runtime | pending |
| docs/package skill | no | generated `defineAuth` is the documented surface | N/A |
| changeset | yes | `.changeset/auth-runtime-hot-path.md` | present |
| agent workflow | no | no agent workflow changes | N/A |
| cleanup/review | yes | deslop and autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | feedback, exact checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each local lane is proven or N/A with a concrete reason.
- [x] Package/docs/skill/changeset ownership is classified.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Restore success could land after token ownership changed | 1 | guard success before atom/fallback writes | fixed; sign-out regression passes |
| A never-settling request outlived the grace deadline | 1 | race every probe against the shared deadline | fixed; bounded recovery regression passes |
| Reference equality treated a cloned seeded session as a new sign-in | 1 | compare stable session IDs | fixed; clone regression passes |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | run full auth owner surface | provider 25/25 passes |
| Package/docs/scenario closure | pending | typecheck/build/full check | pending |
| Deslop | pending | changed-file cleanup | pending |
| Agent-native reviewer | no | no workflow changes | N/A |
| Final lint | yes | run `bun lint:fix` | pending |
| Repository check | yes | run `bun check` | pending |
| GitHub delivery | pending | push, feedback, exact checks, merge/release | pending |
| Autoreview | yes | final branch review | pending |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | in_progress | three session-race defects repaired | review/checks |
| Review/checks | pending | provider tests green | full owner proof |
| Delivery | pending | | push, checks, merge/release |
| Closeout | pending | | final |

Verification evidence:
- The branch is substantial runtime work, not disposable slop, but its original
  persisted-token recovery could overwrite newer auth state and hang forever.
- Red/green provider regressions prove token ownership, request deadlines, and
  cloned seeded-session identity. The full provider file passes 25 tests.

Open risks:
- The remaining auth runtime/adapters need full focused proof and final review.
- Remote exact-head checks, merge, release, and post-release CI remain unproven.
