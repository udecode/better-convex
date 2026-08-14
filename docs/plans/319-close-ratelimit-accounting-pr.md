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
| source behavior | yes | 47 focused ratelimit tests | complete |
| package/API/build | yes | Package build and root typecheck | complete |
| generated output | yes | Package skill to `.agents` mirror | complete |
| fixtures/scenarios | no | N/A: no scaffold output | N/A |
| docs/package skill | yes | www/package skill/mirror agreement | complete |
| changeset | yes | `.changeset/ratelimit-accounting.md` audit | complete |
| agent workflow | yes | Published behavior/guard discoverability | complete |
| cleanup/review | yes | Late GitHub findings fixed; final autoreview pending | in_progress |
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
| Root typecheck raced package build cleaning `dist` | 1 | Rerun typecheck after build completes | Standalone root typecheck passed |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused ratelimit tests | passed: 47 tests across four files |
| Source/generated audit | yes | Prove package skill/mirror parity | passed: sync plus three byte comparisons |
| Package/docs/scenario closure | yes | Build and audit docs/skill/changeset | passed |
| Deslop | yes | Run changed-file cleanup review | zero net findings and score; moved wrapper accepted |
| Agent-native reviewer | yes | Review published ratelimit guidance | pass: complete route/owner/mirror/proof chain |
| Final lint | yes | Run `bun lint:fix` | passed: 880 files; no fixes |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | yes | Update, squash-merge, read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | 14 fixed; compatibility fallback rejected by hard-cut doctrine; final rerun pending |
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
| Review/checks | in_progress | Late GitHub findings fixed with focused proof and deslop clean | final autoreview |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- PR 319 CI/Vercel green at goal creation; no approval yet.
- Rebased both original commits onto main at `799dc4f8` without conflicts.
- Focused proof passes 39 Vitest tests and 8 Bun tests across all four ratelimit
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

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Review/checks |
| Where am I going? | Exact repository gate, delivery, final audit |
| What is the goal? | Merge correct limiter accounting with synchronized guidance |
| What have I learned? | Exact global quotas need fallback and capacity-aware scaling, not only per-shard division |
| What have I done? | Rebased, repaired, synchronized, and proved all focused ratelimit lanes |

Open risks:
- Final autoreview, exact `bun check`, refreshed remote gates, and merge receipt
  remain.

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
- Cache writes prune expired count variants, bounding stale entries in shared
  long-lived maps.
- The changeset breaking section is split into concise user-facing outcomes.
- Snapshot compatibility fallback rejected: closed-alpha hard-cut doctrine
  requires the state-bearing shape across server, hook, types, and docs.
