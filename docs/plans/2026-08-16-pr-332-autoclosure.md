# PR 332 autoclosure

Objective:
Autoclose PR #332 by retaining only source-backed React identity stability,
proving auth rotation does not clear live queries, and shipping a patch release.

Goal plan:
docs/plans/2026-08-16-pr-332-autoclosure.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Completion threshold:
- Same-identity JWT rotation keeps auth-bound queries and subscriptions; real
  identity changes reset them; returned React hook values remain stable only
  while their observable inputs are equal; package contracts, review, full
  check, pinned remote gates, merge, and patch publication all pass.

Verification surface:
- Exact 13-file branch diff, JWT issuer payload, TanStack Query owners, 80
  focused React tests, package typecheck/build, changeset, deslop, lint, full
  check, autoreview, feedback, CI/Vercel, merge and release read-back.

Constraints:
- No unrelated Solid parity, auth protocol, or new product capability.
- Do not accept benchmark-free claims as proof; identity/event assertions must
  call the real hook/client owners.
- Keep repository v0 changeset policy: additive and corrective work is patch.

Boundaries:
- intended delta: stop query resets on routine JWT rotation and remove proven
  React/TanStack identity churn in the touched hook owners
- allowed repairs: correctness, type, test, documentation, and release-story
  defects required by those invariants
- non-goals: new auth claims, server protocol changes, Solid parity, new APIs

Blocked condition:
- Stop only if the current-main merge, owning React runtime, or maintainer
  authority remains unavailable after the documented retry path.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR body, 13-file diff, issuer payload, one thread |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | matrix below |
| GitHub delivery expectation recorded | yes | update and merge/close #332, publish patch |
| Active goal checked or created | yes | root batch goal active |
| Agent-native pack selected | yes | required by autoclosure |
| Agent-facing action surface identified | yes | React hooks/public package behavior |
| Source rule versus generated mirror boundary identified | yes | no generated or agent mirror delta |
| Installed-skill lock versus local-rule owner identified | yes | no skill delta |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded for batch; no agent workflow delta |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | React hook/client owners and focused tests | 80 tests green |
| package/API/build | yes | React export audit, typecheck, build | complete |
| generated output | no | no generated owner changed | N/A |
| fixtures/scenarios | yes | full check | complete |
| docs/package skill | no | no user docs or published skill touched | N/A |
| changeset | yes | `.changeset/spicy-pianos-guess.md` patch | complete; accidental feature/API claim removed |
| agent workflow | no | no agent files or workflow actions | N/A |
| cleanup/review | yes | deslop and committed-head autoreview | complete |
| repository check | yes | `bun check` | complete |
| GitHub delivery | yes | feedback, pinned checks, merge/release | complete |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each local lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated, or N/A.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text, or N/A is recorded.
- [x] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [x] Agent-native pack: installed skills are changed only through `npx skills add/update/remove`; no skill delta here.
- [x] Agent-native pack: routing, receipts, failure, completion, and forbidden behavior have eval/smoke rows, or N/A.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| PR body claims a minor while branch changeset is patch | 1 | trust repository v0 rule and actual file | patch is correct; PR story must be rewritten |
| JWT helper extraction returned `object` where a record was required | 1 | preserve the runtime guard and narrow explicitly | package typecheck passes |
| Re-exporting established `decodeJwtExp` tripped the barrel rule | 1 | document the narrow compatibility re-export | lint passes without exposing the new identity helper |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | complete | run changed owner tests | 80 tests across 5 files pass |
| Source/generated audit | complete | inspect issuer, hook and query owners | sessionId is stable; volatile mint claims excluded |
| Package/docs/scenario closure | complete | typecheck/build/full check | all pass |
| Deslop | complete | bounded changed-file delta | score improves 2.0; one unchanged public-wrapper false positive |
| Agent-native reviewer | N/A | no agent workflow delta | no `.agents`/skill/workflow changes |
| Final lint | yes | `bun lint:fix` | complete |
| Repository check | yes | `bun check` | complete, exit 0 |
| GitHub delivery | complete | push, feedback, pinned checks, merge/release | PR #332 and release PR #348 merged; v0.17.5 live |
| Autoreview | complete | final committed-head review | clean at `0d9f81b1` |
| Goal plan complete | yes | run checker | pending final plan commit |
| Agent source / generated sync | N/A | no agent files | N/A |
| Installed lock audit | N/A | no skill delta | N/A |
| Agent action discoverability | N/A | no agent workflow delta | N/A |
| Helper and template smoke | N/A | no agent helper/template delta | N/A |
| Agent-native review | N/A | no agent workflow delta | N/A |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | exact diff, source owners, feedback, released main | repair |
| Repair | complete | internal JWT owner; no accidental API; release story corrected | review |
| Review/checks | complete | 80 focused, typecheck, build, deslop, lint, full check, autoreview | delivery |
| Delivery | complete | pinned CI/Vercel, merge, release matrix, publish, post-release CI | closeout |
| Closeout | complete | exact remote and registry read-back | final |

Verification evidence:
- The JWT issuer always includes stable `sessionId` and freshly minted `iat`;
  comparing every non-volatile claim distinguishes session/org/role changes
  while ignoring routine token rotation.
- Five focused owner suites pass 80 tests after merging released main: auth
  store, context, client lifecycle, query options, and infinite query.
- The unresolved changeset review is outdated and correct in substance: repo v0
  policy requires patch. The branch already uses patch; the PR body is stale.
- The branch is broad but not disposable slop: each retained area has a direct
  React/TanStack identity or cache-event invariant. Final deslop/review decides
  whether comments/helpers overstate or duplicate ownership.
- `decodeJwtIdentity` no longer escapes through `kitcn/react`; JWT parsing and
  comparison live under `internal`, while the established `decodeJwtExp` export
  remains. The changeset describes only shipped patch behavior.
- Deslop removed an internal pass-through wrapper and colocated shared identity
  policy under `internal`. Repo score improves by 2.0. The remaining scanner hit
  is the unchanged documented public `ConvexQueryClient.hashFn()` API.
- Package typecheck/build, `bun lint:fix`, and full `bun check` pass. The latter
  includes all tests, fresh fixture parity, auth smokes, and runtime scenarios.
- v0.17.4 post-release CI run `31973032035` passed before this branch's gate.
- Committed head `0d9f81b1` passed autoreview, CI run `31973863217`, and
  Vercel. The changeset thread was replied to and resolved.
- PR #332 squash-merged as `2609245d`. Release PR #348 head `7b790683` passed
  Convex Matrix run `31974237216` plus Vercel and merged as `c38d4a7c`.
- npm `kitcn@0.17.5` and `@kitcn/resend@0.17.5`, GitHub release `v0.17.5`,
  release workflow `31974926748`, and post-release CI `31974926735` all
  read back successfully. The release-note AI annotation is non-blocking and
  package/tag/GitHub publication succeeded.

Timeline:
- 2026-08-16 v0.17.4 published; PR #332 merged released main cleanly.
- 2026-08-17 PR #332 merged and published as v0.17.5; post-release CI passed.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closed |
| Where am I going? | Batch PR #335 |
| What is the goal? | Ship only proven React identity stability as a patch. |
| What have I learned? | The behavior is real; the release story is inflated and stale. |
| What have I done? | Removed API creep, proved the patch, merged it, and verified v0.17.5 end to end. |

Open risks:
- None for PR #332.
