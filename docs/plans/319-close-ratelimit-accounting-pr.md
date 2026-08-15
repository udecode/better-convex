# Close ratelimit accounting PR

Objective:
Close PR 319 with rate-limit accounting regressions proved, docs and published
package skill synchronized, reviews clean, checks passing, and PR merged.

Flow mode:
one-shot execution

Goal plan:
docs/plans/319-close-ratelimit-accounting-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Focused ratelimit tests prove count/sharding/remaining/reset behavior; docs,
  package skill, installed mirror, and changeset agree; zero findings; `bun check`
  passes; PR 319 is squash-merged without auto-release.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused ratelimit tests, package build/types, docs/skill/mirror audit, deslop,
  agent-native review, autoreview, lint, check, GitHub read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: PR 319 rate-limit accounting and sharding contract
- allowed repairs: touched ratelimit source/tests/docs/package skill/mirror/changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: new algorithms or unrelated plugin APIs

Output budget strategy:
- Exact ratelimit files and focused failures; cap review/check output; exclude artifacts.

Blocked condition:
- Repeated external/environment failure or a finding requiring a new limiter API.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 319 body/files/checks read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Squash-merge; no release trigger |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by autoclosure |
| Agent-facing action surface identified | yes | Published ratelimit package skill guidance |
| Source rule versus generated mirror boundary identified | yes | Package skill owns installed `.agents` mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded fully |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | 62 focused ratelimit tests | complete |
| package/API/build | yes | Package build and root typecheck | complete |
| generated output | yes | Package skill to `.agents` mirror | complete |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | yes | www/package skill/mirror agreement | complete |
| changeset | yes | `.changeset/ratelimit-accounting.md` audit | complete |
| agent workflow | yes | Published behavior/guard discoverability | complete |
| cleanup/review | yes | Late snapshot and fallback findings fixed; final autoreview pending | in_progress |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | PR 319 update/merge/read-back | pending |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each pre-delivery lane is proven or N/A with a concrete reason.
- [x] Generated output was changed through its owner and regenerated.
- [x] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [x] Accepted cleanup and review findings are closed in focused proof.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [x] Agent-native pack: package skill owner/mirror boundary recorded.
- [x] Agent-native pack: ratelimit semantics and invalid shard guard are discoverable.
- [x] Agent-native pack: package skill/mirror parity proved; `.agents/rules` N/A.
- [x] Agent-native pack: installed skill membership unchanged.
- [x] Agent-native pack: published guidance represents exact budget/guard behavior.
- [x] Agent-native pack: agent-native review passes with no findings.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| `maxReserved: 1` became unusable fractional shares | 1 | Deal whole reservation headroom | Red reservation test became green |
| Preferred exhausted shard denied while another had capacity | 1 | Retry untouched shards only after preferred failure | Red routing/cache tests became green |
| Fractional budget stranded whole requests | 1 | Deal whole portion and retain one fractional remainder | Red 4-of-5 test became green |
| Fixed-window capacity projected through refill limit | 1 | Scale stored balances with algorithm capacity | Red 150-versus-100 test became green |
| Large-request cache block poisoned smaller counts | 1 | Key blocks by shard and requested count | Red smaller-request test became green |
| Cached shard omitted from global retry deadline | 1 | Take minimum cached and evaluated reset | Red earliest-reset test became green |
| Ordinary cache block hid reservation headroom | 1 | Key blocks by reservation mode | Red reserved-retry test became green |
| Reserved retry used the non-reserved zero-debt deadline | 1 | Derive retry from excess debt beyond `maxReserved` | Red clocked token-bucket test became green |
| Aggregated token snapshot was refilled twice | 1 | Evaluate raw shards once at a common final timestamp | Red clocked exact-read test became green |
| Sliding snapshot discarded previous-window state | 1 | Carry projected state in the snapshot contract | Red server and React projection tests became green |
| `getRemaining()` netted debt and fractions across isolated shards | 1 | Sum per-shard clamped whole balances | Two red usable-balance tests became green |
| Uneven token capacity shares clipped an even refill split | 1 | Allocate refill in proportion to shard capacity | Red fifth-refill test became green |
| Expired count-specific cache variants accumulated | 1 | Prune expired entries on cache writes | Red cache-size test became green |
| Changeset combined unrelated outcomes and internals | 1 | Split concise user-facing outcomes | Breaking section is atomic |
| Published skill still described even token refill splits | 1 | Update source guidance and regenerate mirror | Skill, mirror, and public docs describe capacity-proportional refill |
| Token-bucket dynamic overrides persisted invalid refill rates | 1 | Validate every numeric override before writing | Red zero/negative/non-finite test became green |
| Aggregate snapshots transferred clipped refill across full shards | 1 | Carry and project sampled per-shard state | Server and React saturation tests became green |
| Exhaustion fallback awaited every shard read serially | 1 | Read each candidate set concurrently | Ten-shard timeout regression became green |
| Permanently oversized reserved requests returned finite retry times | 1 | Reject requests above every shard's capacity and reservation headroom | Red zero-read permanent-denial test became green |
| Permanently undersized shards shortened global reservation retries | 1 | Exclude impossible shard candidates from retry selection | Red uneven-shard retry test became green |
| Dynamic limit changes retained stale snapshots and block decisions | 1 | Clear instance caches after persisting an override | Red snapshot/block invalidation test became green |
| All-shard snapshots erased permanent oversized denials | 1 | Preserve the infinite retry sentinel through core and React projection | Red core and hook projection tests became green |
| Partial snapshots approved counts no shard could serve | 1 | Guard snapshot projections with maximum per-shard capacity | Red partial-snapshot hook test became green |
| Omitted `maxReserved` was treated as zero headroom | 1 | Centralize the existing uncapped reservation default | Red fixed/token reservation test became green |
| Hook docs tied `ok` to aggregate value sign | 1 | Document serviceability and permanent denial directly | Public hook contract matches retry-based evaluation |
| Invalid `maxReserved` values reached shard retry math | 1 | Validate finite non-negative headroom in every builder | Red cross-builder configuration test became green |
| Fresh sharded projections skipped per-shard size guards | 1 | Normalize shard-local algorithms and guard public aggregate calculation | Red fresh-state calculator test became green |
| In-flight operations restored caches after dynamic updates | 1 | Generation-guard snapshot and block-cache writes | Red controlled read-race test became green |
| Shared block caches retained unbounded permanent count variants | 1 | Skip infinite resets and cap finite variants per identifier | Red cache-bound test became green |
| Root typecheck raced package build cleaning `dist` | 1 | Rerun typecheck after build completes | Standalone root typecheck passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused ratelimit tests | passed: 62 tests across four files |
| Source/generated audit | yes | Prove package skill/mirror parity | passed: sync plus three byte comparisons |
| Package/docs/scenario closure | yes | Build and audit docs/skill/changeset | passed |
| Deslop | yes | Run changed-file cleanup review | zero net findings and score; moved wrapper accepted |
| Agent-native reviewer | yes | Review published ratelimit guidance | pass: complete route/owner/mirror/proof chain |
| Final lint | yes | Run `bun lint:fix` | passed: 880 files; no fixes |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | 29 fixed; compatibility fallback rejected by hard-cut doctrine; final rerun pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/319-close-ratelimit-accounting-pr.md` | pending |
| Agent source / generated sync | yes | Verify package skill/mirror | passed after `sync-kitcn-skill.ts` |
| Installed lock audit | no | N/A: no skill membership change | N/A |
| Agent action discoverability | yes | Audit published ratelimit skill route | passed: main skill links exact reference |
| Helper and template smoke | no | N/A: no workflow helper/template | N/A |
| Agent-native review | yes | Close accepted guidance findings | passed with no findings |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | complete | PR, source, tests, docs, skill owners, changeset, and seven threads read | repair |
| Repair | complete | Rebased and closed original plus independent review findings with TDD | review |
| Review/checks | in_progress | Late GitHub findings fixed with server, React, and timeout proof | final cleanup and review |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 319 CI/Vercel green at goal creation; no approval yet.
- Rebased both original commits onto main at `799dc4f8` without conflicts.
- Focused proof passes 51 Vitest tests and 11 Bun tests across all four ratelimit
  test files.
- TDD proves shard fallback, exact fractional whole-request capacity,
  whole-token reservation headroom, and capacity-based fixed-window projections.
- `bun --cwd packages/kitcn build`, root typecheck, and lint pass.
- Package skill, generated mirror, public docs, and changeset describe the same
  sharding, fallback, capacity, dynamic-limit, cache, snapshot, and check contracts.
- Package skill/mirror byte comparisons, `intent:validate`, and `intent:stale` pass.
- Deslop has zero net findings and zero score change; its added/resolved wrapper
  pair is the same existing `createFixedWindow` wrapper moved by the larger file.
- Agent-native review passes: `kitcn` route -> package skill owner -> generated
  mirror/public docs -> focused tests, sync, and Intent proof.
- The pre-push autoreview reported zero accepted/actionable findings at 0.90
  confidence before the late GitHub review added three more findings.
- Hard-cut-aware autoreview reports the required snapshot state and current-shape
  protocol are internally consistent; no compatibility shim is warranted.
- Final autoreview reports zero accepted/actionable findings at 0.94 confidence
  after proportional refill, cache pruning, guidance, and dynamic validation fixes.

Timeline:
- 2026-08-14T18:17:55.073Z Autoclosure plan created.
- 2026-08-15T00:13:00+02:00 Rebased onto PR 320, repaired the remaining
  reservation finding and three independent review findings with red-to-green
  tests, synchronized guidance, and completed focused proof.
- 2026-08-15T00:48:00+02:00 Closed six further cache, retry, and aggregate-read
  findings and received a clean final autoreview verdict.
- 2026-08-15T01:08:00+02:00 Closed the per-shard usable-balance finding and
  received a clean hard-cut-aware autoreview verdict at 0.90 confidence.
- 2026-08-15T01:36:00+02:00 Remote CI passed, then a post-CI audit found and
  closed refill clipping, expired cache growth, and changeset clarity findings.
- 2026-08-15T01:53:00+02:00 Closed stale refill guidance and invalid dynamic
  override findings; final autoreview is clean at 0.94 confidence.
- 2026-08-15T02:15:00+02:00 A final post-CI audit found and closed per-shard
  snapshot saturation and serial fallback latency findings with TDD.
- 2026-08-15T02:27:00+02:00 Closed the permanently oversized reservation
  finding with a zero-read permanent-denial contract and 52 focused tests.
- 2026-08-15T02:37:00+02:00 Closed the undersized-shard retry and dynamic-cache
  findings with two red-to-green regressions and 54 focused tests.
- 2026-08-15T02:47:00+02:00 Closed all-shard permanent-denial projection with
  core and React regressions, bringing focused proof to 56 tests.
- 2026-08-15T02:55:00+02:00 Closed partial-snapshot, uncapped-reservation, and
  hook-contract findings with 58 focused tests and synchronized guidance.
- 2026-08-15T03:04:00+02:00 Closed invalid reservation-headroom input with a
  cross-builder regression, bringing focused proof to 59 tests.
- 2026-08-15T03:14:00+02:00 Closed fresh projection, in-flight cache race, and
  shared-cache growth findings with 62 focused tests.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Review/checks |
| Where am I going? | Exact repository gate, delivery, final audit |
| What is the goal? | Merge correct limiter accounting with synchronized guidance |
| What have I learned? | Exact global quotas need fallback and capacity-aware scaling, not only per-shard division |
| What have I done? | Rebased, repaired, synchronized, and proved all focused ratelimit lanes |

Open risks:
- Final cleanup/autoreview, exact `bun check`, refreshed remote gates, and merge
  receipt remain.

Findings:
- The preferred-shard fast path must fall back before it can claim global exhaustion.
- Fixed-window balances are capacity values even when the response limit is the refill rate.

Decisions and tradeoffs:
- Retry untouched shards only after preferred candidates fail, preserving the
  low-contention fast path while enforcing the configured global budget.
- Keep fractional value on one shard after dealing the whole portion; rejecting
  valid fractional counts would narrow the existing numeric API unnecessarily.

Review fixes:
- Per-shard cache, dynamic shard guards, fixed capacity guards, exact
  `getRemaining()`, package skill synchronization, and indivisible budget
  documentation were fixed by the second original commit and re-proved.
- Whole-token reservation headroom was fixed with a red-to-green regression.
- Independent autoreview findings for shard fallback, capacity scaling, and
  fractional budgets were fixed with red-to-green regressions.
- Final autoreview findings for count-aware caching and earliest global reset
  were fixed with red-to-green regressions.
- Reservation-mode cache identity was fixed with a red-to-green reserved-retry
  regression.
- Reservation-aware retry deadlines and single-pass aggregated token reads were
  fixed with deterministic clock-based regressions.
- A post-CI review found lost sliding-window auxiliary snapshot state; server
  and React regressions now prove decay through the following boundary.
- Per-shard usable-balance regressions prove `getRemaining()` neither nets debt
  nor combines fractions that no individual shard can spend.
- Capacity-proportional refill restores the full configured token budget when
  whole-token capacity shares are uneven.
- Package skill, generated mirror, and public docs describe the same
  capacity-proportional refill rule; byte parity and Intent checks pass.
- Cache writes prune expired count variants, bounding stale entries in shared
  long-lived maps.
- The changeset breaking section is split into concise user-facing outcomes.
- Dynamic overrides are validated as positive finite budgets before persistence;
  zero, negative, `NaN`, and infinite token-bucket refill overrides are rejected.
- Snapshot state carries sampled shard states; all-shard server and React
  projections preserve independent saturation instead of transferring clipped
  refill across shards.
- Preferred and fallback candidate sets read concurrently, so exhaustion cost is
  bounded by candidate-set read latency instead of multiplying by shard count.
- Requests that exceed every shard's capacity and reservation headroom return
  `requestTooLarge` with no retry deadline and no shard reads.
- Permanently undersized shards cannot shorten a retry deadline, and dynamic
  limit changes invalidate local snapshots and block decisions.
- All-shard snapshots and the React hook preserve permanent oversized denial
  without scheduling an infinite retry timer.
- Partial snapshots enforce per-shard serviceability, omitted `maxReserved`
  remains uncapped, and hook docs describe retry-based `ok` semantics.
- Builders reject negative and non-finite `maxReserved` before shard dealing.
- Shard-local algorithms stop re-sharding, cache writes are generation-safe,
  and finite block variants are bounded per identifier.
- Snapshot compatibility fallback rejected: closed-alpha hard-cut doctrine
  requires the state-bearing shape across server, hook, types, and docs.
