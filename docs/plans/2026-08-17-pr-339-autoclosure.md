# PR 339 autoclosure

Objective:
Autoclose PR #339 by retaining its proven Solid/React parity fixes, removing
stale release-story slop, and delivering the package release with source-backed
proof.

Goal plan:
docs/plans/2026-08-17-pr-339-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- Solid and React use the same subscription gate, auth-bound caches cannot leak
  across accounts, paginated cursor chains restart only for auth-bound queries,
  and Solid auth/query options stay reactive.
- No new product scope. Completion requires focused/package/full proof, final
  review, exact remote checks, merge/release read-back, and the goal checker.

Verification surface:
- Released-main diff; shared subscription/reset owners; React and Solid client,
  context, auth mutation, and infinite-query tests; package typecheck/build;
  changeset; deslop; lint; full check; autoreview; exact-head CI/Vercel; release.

Constraints:
- Preserve #329's real Solid Query mount proof and #332's stable JWT-identity
  owner while resolving conflicts.
- Finish the intended delta; do not publish the stale multi-PR or cron roadmap.

Boundaries:
- intended delta: restore Solid/React parity for subscription, auth reset,
  auth rebind, query options, and account-scoped pagination
- allowed repairs: correctness, test, changeset, and mergeability defects needed
  by those invariants
- non-goals: cRPC output (#340), rate-limit cleanup (#341), or ORM capability
  injection (#342)

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | exact diff, four threads, released owners |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update/merge #339 and settle release |
| Active goal checked or created | yes | root batch goal active |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | shared gate/reset plus React/Solid bindings | in_progress |
| package/API/build | yes | package typecheck/build | pending |
| generated output | no | no generated artifact changes | N/A |
| fixtures/scenarios | yes | full check/runtime | pending |
| docs/package skill | no | no end-user setup surface changes | N/A |
| changeset | yes | `.changeset/solid-bindings-parity.md` | repair pending |
| agent workflow | no | no agent workflow changes | N/A |
| cleanup/review | yes | deslop and autoreview | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | feedback, exact checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each local lane is proven or N/A with a concrete reason.
- [ ] Package/changeset ownership is closed.
- [ ] Accepted cleanup and review findings are closed locally.
- [ ] PR body and check state match the final evidence.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Branch conflicted with released auth and Solid mount owners | 1 | merge owners semantically and retain real Solid Query tests | focused merged-owner tests pass |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | run React/Solid owner suites | pending |
| Package/docs/scenario closure | pending | typecheck/build/full check | pending |
| Deslop | pending | changed-file cleanup | pending |
| Agent-native reviewer | no | no workflow changes | N/A |
| Final lint | yes | run `bun lint:fix` | pending |
| Repository check | yes | run `bun check` | pending |
| GitHub delivery | pending | push, feedback, exact checks, merge/release | pending |
| Autoreview | yes | final whole-branch review | pending |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | in_progress | source-backed main merge | focused proof |
| Review/checks | pending | | review/checks |
| Delivery | pending | | push, checks, merge/release |
| Closeout | pending | | final |

Verification evidence:
- The branch is broad but substantive, not disposable slop. Its four P1 review
  findings are addressed by later commits, subject to released-main proof.
- Merge conflicts kept the shared gate/reset behavior, main's stronger stable
  JWT-identity owner, stable React page options, and #329's unmocked Solid Query
  runtime suite. Initial focused React and shared-owner tests pass 41/41; Solid
  owner files pass 18/18; package typecheck passes.

Open risks:
- Solid parity behaviors need real-runtime regression coverage after the test
  conflict; changeset wording is inaccurate; full/review/delivery gates remain.
