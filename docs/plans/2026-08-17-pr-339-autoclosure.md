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

Output budget strategy:
- Run focused React/Solid owners first; keep GitHub polling to exact-head
  summaries and save full-gate logs outside the final handoff.

Blocked condition:
- Stop only if owning Solid runtime proof or maintainer merge authority remains
  unavailable after the documented retry path.

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
| source behavior | yes | shared gate/reset plus React/Solid bindings | complete |
| package/API/build | yes | package typecheck/build | complete |
| generated output | no | no generated artifact changes | N/A |
| fixtures/scenarios | yes | full check/runtime | pending |
| docs/package skill | no | no end-user setup surface changes | N/A |
| changeset | yes | `.changeset/solid-bindings-parity.md` | complete |
| agent workflow | no | no agent workflow changes | N/A |
| cleanup/review | yes | deslop and autoreview | review rerun pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | feedback, exact checks, merge/release | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each focused local lane is proven or N/A with a concrete reason.
- [x] Package/changeset ownership is closed.
- [x] Accepted cleanup and review findings are closed locally.
- [ ] PR body and check state match the final evidence.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Branch conflicted with released auth and Solid mount owners | 1 | merge owners semantically and retain real Solid Query tests | focused merged-owner tests pass |
| Stable fetcher missed account switches; provider transitions missed cache reset | 1 | publish a stable identity through the provider bridge and reset at the Solid CRPC owner | three red regressions now pass; 90 Solid owner tests green |
| Solid CRPC reset had no query-client auth-store owner | 1 | install the provider auth store into the query client before observing transitions | red owner-sync regression passes; 129 Solid tests green |
| Session ID masked JWT tenant/role changes | 1 | combine stable session and non-volatile claim identity while ignoring routine rotation | red same-session claim regression passes; 129 Solid tests green |
| New session reused the previous session's valid JWT | 1 | bind cached tokens to their session and invalidate before the replacement session authenticates | red cross-session token regression passes |
| New session inherited the previous session's in-flight token request | 1 | scope pending requests and late writes to the initiating session | red deferred-request race passes |
| First hydrated session claimed an unowned SSR JWT | 1 | keep SSR tokens pending-only and fetch after a client session is confirmed | red hydration account-switch regression passes |
| Unowned SSR claims seeded the hydrated cache identity | 1 | derive identity claims only from a token owned by the confirmed session | red pre-token bridge identity regression passes |
| First settled client identity skipped hydration reset | 1 | conservatively clear auth-bound state on the first settled identity | immediate-settled context regression passes |
| Query reset restored previous-account `initialData` | 1 | remove and rebuild observed auth queries without `initialData` | public reset resurrection regression passes |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | run React/Solid owner suites | 41 shared/React plus 131 Solid tests pass |
| Package/docs/scenario closure | pending | typecheck/build/full check | package typecheck/build green; final full check rerun pending |
| Deslop | complete | changed-file cleanup | 167 -> 167; zero net findings |
| Agent-native reviewer | no | no workflow changes | N/A |
| Final lint | yes | run `bun lint:fix` | 910 files clean |
| Repository check | yes | run `bun check` | pending |
| GitHub delivery | pending | push, feedback, exact checks, merge/release | pending |
| Autoreview | yes | final whole-branch review | pending |
| Goal plan complete | yes | run checker | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | released-main merge plus provider identity owner | focused proof |
| Review/checks | in_progress | focused/package/deslop green | full check and final review |
| Delivery | pending | | push, checks, merge/release |
| Closeout | pending | | final |

Verification evidence:
- The branch is broad but substantive, not disposable slop. Its four P1 review
  findings are addressed by later commits, subject to released-main proof.
- Merge conflicts kept the shared gate/reset behavior, main's stronger stable
  JWT-identity owner, stable React page options, and #329's unmocked Solid Query
  runtime suite. Initial focused React and shared-owner tests pass 41/41; Solid
  owner files pass 18/18; package typecheck passes.
- The first whole-branch P1 review found Solid could miss account switches when
  the token fetcher stayed stable and provider-driven transitions bypassed the
  cache reset. Three red regressions reproduced both paths. The provider now
  publishes a stable session identity, legacy custom providers retain safe
  reactive rebinding, and the Solid CRPC owner resets auth-bound caches on each
  observed identity transition. The CRPC provider also installs its auth store
  into the query client before resets, so auth epochs and subscription gates
  share the same owner. The identity key also tracks non-volatile JWT claims,
  so tenant or role changes inside one session rebind without treating routine
  expiry rotation as a transition. Replacing a session clears its token owner
  and abandons prior-session in-flight requests before fetching the replacement
  JWT. A confirmed hydrated session also replaces any unowned SSR token and
  cannot inherit its claim identity. The first settled identity clears
  unproven hydration data, and observed queries are rebuilt so future public
  resets cannot resurrect the old account's `initialData`. All 131 Solid tests
  pass; package typecheck/build pass.

Open risks:
- Final full check, review rerun, and remote delivery gates remain.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Final local review/check rerun |
| Where am I going? | Exact-head delivery and release |
| What is the goal? | Ship only proven Solid/React parity. |
| What have I learned? | Mutation-only resets miss provider transitions, and resets need the provider's auth-store owner. |
| What have I done? | Merged released owners, removed changeset slop, and closed three P1 identity gaps. |
