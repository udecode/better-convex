# PR 341 autoclosure

Objective:
Autoclose PR #341 by retaining the proven request-key, RSC hydration, and
per-request identifier work; repairing deny-list correctness and boundedness;
and replacing recurring cleanup with a manual, indexed, batched mutation.

Goal plan:
docs/plans/2026-08-17-pr-341-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Completion threshold:
- HTTP query keys hydrate and address exact cache entries consistently.
- Anonymous traffic is partitioned by request IP when metadata exists.
- Deny-list failures use a true rolling window; all retained members are
  bounded; long values cannot collide by shared prefix and length.
- Stored state has an indexed manual/on-demand cleanup path. No recurring
  schedule is created, documented, or required.
- Focused tests, scaffold regeneration, package build/typecheck, skill sync,
  full check, final review, exact remote gates, merge, release, and remote
  read-back all pass.

Boundaries:
- intended delta: PR #341 rate-limit identifiers/options and HTTP/RSC cache keys
- allowed repairs: deny-list safety, manual cleanup, review feedback,
  docs/skill/changeset sync, proof, and mergeability
- non-goals: recurring cleanup, auth redesign, ORM capability injection (#342)

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | HTTP/RSC, plugin, deny-list, cleanup store | complete |
| package/API/build | yes | ratelimit export, typecheck/build | complete |
| generated output | yes | ratelimit scaffold and skill mirror | complete |
| fixtures/scenarios | yes | regenerate example scaffold; fixture check | complete |
| docs/package skill | yes | ratelimit docs and server reference | complete |
| changeset | yes | `.changeset/warm-pianos-repeat.md` | complete |
| agent workflow | yes | published skill source/mirror sync and reviewer | complete |
| cleanup/review | yes | zero-net deslop and clean P1 autoreview | complete |
| repository check | yes | `bun check`; explicit `bun run test:runtime` rerun | complete |
| GitHub delivery | yes | exact head, gates, merge, release, read-back | pending |

Work checklist:
- [x] Exact released-main diff and four review threads reconstructed.
- [x] Two upstream threads verified fixed in the submitted source.
- [x] Rolling-window, bounded blocked-state, and long-key regressions reproduced.
- [x] Deny-list repairs pass focused tests.
- [x] Manual cleanup helper and batched store mutation pass focused TDD.
- [x] Scaffold, docs, skill, generated output, and changeset are synchronized.
- [x] Focused, package, full-check, and final-review proof passes.
- [ ] Feedback is resolved and exact remote delivery completes.

Verification evidence:
- The PR is mixed but substantive, not wholesale slop. Exact HTTP keys, shared
  RSC freshness, request-IP identifiers, and option forwarding have real owners
  and regressions.
- The submitted deny-list implementation was unsafe: it implemented an
  inactivity timeout instead of a rolling window, bounded hit entries but not
  blocked entries, and collapsed long values sharing a prefix and length.
- Three red regressions now pass after one combined bounded member store, a true
  rolling timestamp window, and a 64-bit hashed suffix for long keys.
- The recurring-cleanup proposal is rejected. `cleanupRatelimitState` deletes
  one indexed batch before a caller-owned cutoff; the scaffold exposes it as a
  private mutation for explicit manual/on-demand calls.
- The canonical scaffold owns both the cleanup mutation and the documented
  `interactive` bucket. Regeneration created the function, index, lock mapping,
  exact internal API output type, and source-consistent example plugin.
- Package and example typechecks, package build, all eight fixture sync/check
  variants, intent validation/stale checks, and 99 focused behavior tests pass.
- Agent-native map passes: user action `convex run`; agent route in the package
  skill; source owners in the registry/helper; generated skill and example
  mirrors; rerunnable test, typecheck, build, and fixture proof.
- Deslop is net clean at 167 findings before and after with a lower score. Two
  accepted P1 review cycles exposed the finite-cache policy conflict; the final
  bounded LRU evicts hit histories first, refreshes active blocks, documents
  cold-block eviction/fallback honestly, and the final P1 review is clean at
  0.92.
- `bun check` passed its lint, typecheck, unit, CLI, fixture, verify, and runtime
  lanes. A separate `bun run test:runtime` rerun completed every scenario with
  exit 0, removing ambiguity from the unified command's closed output stream.

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, owners, feedback | repair |
| Repair | complete | deny-list, cleanup, scaffold, and docs synchronized | proof |
| Review/checks | complete | focused/package/fixture/full gates; P1 review clean | delivery |
| Delivery | in_progress | local proof complete | push and remote gates |
| Closeout | pending | | release read-back |
