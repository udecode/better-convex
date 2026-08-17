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
| fixtures/scenarios | yes | full check/runtime | complete |
| docs/package skill | no | no end-user setup surface changes | N/A |
| changeset | yes | `.changeset/solid-bindings-parity.md` | complete |
| agent workflow | no | no agent workflow changes | N/A |
| cleanup/review | yes | deslop and autoreview | clean |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, exact checks, merge/release | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each focused local lane is proven or N/A with a concrete reason.
- [x] Package/changeset ownership is closed.
- [x] Accepted cleanup and review findings are closed locally.
- [x] PR body and check state match the final evidence.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| Branch conflicted with released auth and Solid mount owners | 1 | merge owners semantically and retain real Solid Query tests | focused merged-owner tests pass |
| Stable fetcher missed account switches; provider transitions missed cache reset | 1 | publish a stable identity through the provider bridge and reset at the Solid CRPC owner | three red regressions now pass; 90 Solid owner tests green |
| Solid CRPC reset had no query-client auth-store owner | 1 | install a real provider auth store into the query client before observing transitions | red owner-sync regression passes; 129 Solid tests green |
| Session ID masked JWT tenant/role changes | 1 | combine stable session and non-volatile claim identity while ignoring routine rotation | red same-session claim regression passes; 129 Solid tests green |
| New session reused the previous session's valid JWT | 1 | bind cached tokens to their session and invalidate before the replacement session authenticates | red cross-session token regression passes |
| New session inherited the previous session's in-flight token request | 1 | scope pending requests and late writes to the initiating session | red deferred-request race passes |
| First hydrated session claimed an unowned SSR JWT | 1 | keep SSR tokens pending-only and fetch after a client session is confirmed | red hydration account-switch regression passes |
| Unowned SSR claims seeded the hydrated cache identity | 1 | derive identity claims only from a token owned by the confirmed session | red pre-token bridge identity regression passes |
| First settled client identity skipped hydration reset | 1 | conservatively clear auth-bound state on the first settled identity | immediate-settled context regression passes |
| Query reset restored previous-account `initialData` | 1 | remove and rebuild observed auth queries without `initialData` | public reset resurrection regression passes |
| Placeholder callback republished previous-account data | 1 | rebuild auth observers without placeholder history | function-form placeholder regression passes |
| Sign-in mutations reset before Convex adopted the new identity | 1 | leave sign-in resets to the settled provider transition | red React/Solid mutation regressions pass |
| Custom Convex auth installed the always-loading fallback store | 1 | install only a real Better Auth store into the query client | red custom-provider regression passes |
| Auth epochs accumulated pagination IDs in a process-wide map | 1 | retain IDs solely in persisted QueryClient pagination state | React/Solid pagination suites pass |
| Custom auth had no pagination epoch owner | 1 | publish the epoch from the settled Convex bridge when no Better Auth store exists | red bridge epoch regression plus Solid pagination suite pass |
| Provider reset could refetch before Convex changed identity | 1 | clear immediately, publish identity only after Convex confirms it, then refetch | red settlement and two-phase reset regressions pass |
| Pagination bypassed the new bridge-aware epoch accessor | 1 | read the epoch through `useAuthValue` inside the reactive store-key memo | red custom-auth pagination regression passes |
| Clear-only observer rebinding still fetched immediately | 1 | rebuild observers disabled and restore them only at settlement | red shared helper and Solid client lifecycle regressions pass |
| Prefetched optional pages bypassed auth-loading gates | 1 | keep hydration state but gate every auth-bound page observer while loading | red React/Solid optional hydration regressions pass |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | run React/Solid owner suites | 54 late-finding owner tests plus the prior 41 shared/React and 131 Solid tests pass |
| Package/docs/scenario closure | complete | typecheck/build/full check | package typecheck/build and full check green |
| Deslop | complete | changed-file cleanup | 167 -> 167; zero net findings |
| Agent-native reviewer | no | no workflow changes | N/A |
| Final lint | yes | run `bun lint:fix` | 910 files clean |
| Repository check | yes | run `bun check` | passed on `f2445ea1` |
| GitHub delivery | yes | push, feedback, exact checks, merge/release | pass |
| Autoreview | yes | final whole-branch review | clean at `ebbbedcf`; patch correct (0.86) |
| Goal plan complete | yes | run checker | pass from batch closeout |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | released-main merge plus provider identity owner | focused proof |
| Review/checks | complete | focused/package/deslop, final autoreview, full check green | delivery |
| Delivery | complete | exact head merged and released | closeout |
| Closeout | complete | v0.22.1 correction and post-release CI read back | done |

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
  observed identity transition. The CRPC provider installs a real Better Auth
  store into the query client before resets and leaves custom Convex auth on its
  bridge, so the fallback store cannot permanently block subscriptions. The
  identity key also tracks non-volatile JWT claims,
  so tenant or role changes inside one session rebind without treating routine
  expiry rotation as a transition. Replacing a session clears its token owner
  and abandons prior-session in-flight requests before fetching the replacement
  JWT. A confirmed hydrated session also replaces any unowned SSR token and
  cannot inherit its claim identity. The first settled identity clears
  unproven hydration data, and observed queries are rebuilt so future public
  resets or placeholder callbacks cannot resurrect the old account's data.
  Sign-in mutations wait for that settled provider transition instead of
  resetting under the previous Convex identity, while pagination persistence
  no longer duplicates IDs in a process-wide map. All
  131 Solid tests pass; package typecheck/build and `bun check` pass. Final
  whole-branch P1 review is clean and reports the patch correct.
- Three late GitHub findings reproduced two premature auth-reset paths, an
  always-loading fallback store installed for custom Convex auth, and an
  obsolete pagination ID map. The React/Solid owner suites pass 54/54 after the
  repairs; package typecheck/build, deslop, changeset status, lint, and the full
  repository gate pass again. A fresh whole-branch review remains required
  because these findings changed source after the earlier clean review.
- That fresh review found custom auth still lacked an epoch owner and the reset
  could refetch before Convex settled. Both are in-scope privacy failures. The
  bridge now publishes identity and epoch only after Convex confirmation; the
  query client clears data at transition start and defers refetch until that
  confirmation. Fifty-nine focused Solid and forty React owner tests pass;
  package typecheck/build and zero-net deslop pass. Full check and final review
  must rerun on this source.
- The convergence review then found the infinite-query store key still read the
  fallback store directly. After the required two-cycle pause, this remained
  the same in-scope account-isolation blocker. The existing transition test was
  rewritten against the bridge-aware accessor, failed on the old wire, and now
  passes with all 59 focused Solid tests plus package typecheck/build/deslop.
- The next full review proved the clear-only phase was not truly idle: query-core
  fetched when observers rebound, and optional prefetched pages bypassed the
  loading gate. The shared reset owner now restores disabled observers only
  after settlement, Solid sign-out cannot bypass the provider barrier, and
  React/Solid page observers remain disabled while auth loads. The red shared,
  client-lifecycle, mutation, and hydration regressions now pass.
- The following convergence review found two remaining races in that barrier:
  an obsolete settlement could refetch after a newer transition started, and
  restoring the observer snapshot could overwrite option changes made while it
  was suspended. The Solid client now gives every transition a generation and
  only the latest generation can restore, refetch, or resubscribe. The shared
  reset owner restores only its temporary suspension fields while retaining
  newer observer options. The two red regressions pass with 137 focused tests,
  package typecheck, and package build.
- The next review found queries mounted after the clear snapshot could bypass
  the barrier. Convex bridge settlement is now authoritative over the ready
  Better Auth store, and the Solid client blocks both one-shot requests and
  live subscriptions created mid-transition. The two red owner regressions and
  the 37-test focused auth/context/client group pass.
- The next review repeated two findings already disproven by the current source:
  observer restoration spreads current options and restores only the temporary
  `enabled` gate, while context and client both reject obsolete generations.
  Its third finding was valid: a delayed Convex callback could publish an older
  identity. Binding callbacks now carry their own generation, and the red
  superseded-callback regression passes with the surrounding 27-test owner set.
- The committed-head whole-branch P1 review is clean with no actionable P0/P1
  findings and reports the patch correct at 0.86 confidence.

Open risks:
- None remaining inside PR #339 scope.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Complete |
| Where am I going? | Done |
| What is the goal? | Ship only proven Solid/React parity. |
| What have I learned? | Mutation-only resets miss provider transitions, and resets need the provider's auth-store owner. |
| What have I done? | Repaired, merged, corrected, released v0.22.1, and read back exact remote gates. |
