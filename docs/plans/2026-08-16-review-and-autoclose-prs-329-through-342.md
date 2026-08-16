# Review and autoclose PRs 329 through 342

Objective:
Audit PRs #329-#342 for generated or speculative slop, close invalid work with
source-backed evidence, and autoclose every viable PR in dependency-safe order.

Goal plan:
docs/plans/2026-08-16-review-and-autoclose-prs-329-through-342.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- [PR #329 autoclosure](docs/plans/2026-08-16-pr-329-autoclosure.md) -
  Solid infinite-query mount crash and first release root.

Completion threshold:
- All 14 frozen PRs (#329-#342) have a recorded intent, overlap/dependency map,
  source-backed slop verdict, applicable closure-matrix proof, final GitHub
  disposition, and remote read-back. Viable PRs are merged; invalid or
  redundant PRs are closed with concise evidence.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Local fetched PR refs and exact diffs; owning source/tests; PR comments and
  review threads; focused proof; `deslop`; `agent-native-reviewer`;
  `autoreview`; `bun lint:fix`; `bun check`; changeset coverage; merge-base and
  branch-head GitHub checks; final open/merged/closed PR read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.
- Green CI is necessary but not a quality verdict; reject scope without a real
  invariant, redundant edits, benchmark-free performance claims, API churn,
  test laundering, generated-file-first changes, and unrelated bundles.
- Process one frozen PR at a time in dependency-safe order. Re-evaluate later
  PRs after earlier merges change `main`.
- User authorized the autoclosure GitHub path for each viable PR and closure of
  proven slop; do not merge speculative work merely to empty the queue.

Boundaries:
- intended delta: PRs #329-#342 by `MikeyZhang75`, frozen from the open-PR
  snapshot on 2026-08-16; #343 is excluded as our existing issue #328 PR
- allowed repairs: defects required to preserve the stated PR invariant,
  source/generated ownership, proof, changeset, or mergeability
- unrelated files: preserve; do not treat as blockers
- non-goals: new product scope, opportunistic architecture changes, merging
  because CI is green, release publication beyond PR merge receipts

Output budget strategy:
- Fetch each PR head once; inventory filenames/stats/commit/body in bounded
  tables before reading diffs; inspect exact owner slices; save full noisy test
  output to `/tmp` and report exit/tails; never stream all 14 diffs or CI logs.

Blocked condition:
- Stop only if repository protection or missing maintainer authority prevents
  merge/close after three verified attempts, or the same infrastructure failure
  survives three materially different diagnostics with no safe next move.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | frozen GitHub snapshot contains PRs #329-#342 from `MikeyZhang75`; current PR #343 excluded |
| Intended delta and exclusions recorded | yes | boundaries above |
| Closure matrix classified | yes | every PR gets the same matrix; applicability resolved from its exact file/behavior owners |
| GitHub delivery expectation recorded | yes | merge viable PRs; close invalid/redundant PRs with evidence; final remote read-back |
| Active goal checked or created | yes | no active goal; batch goal will use this exact plan |
| Agent-native pack selected | yes | required by `autoclosure`; materialized in this plan |
| Agent-facing action surface identified | yes | any PR touching `.agents`, `.claude`, `.codex`, prompts, skills, workflows, or user-action tooling triggers the agent-native lane |
| Source rule versus generated mirror boundary identified | yes | `.agents/AGENTS.md` and `.agents/rules/**` own generated mirrors; PR-specific audit required if touched |
| Installed-skill lock versus local-rule owner identified | yes | `skills-lock.json` is CLI-managed; repository rules/templates/helpers remain source-owned |
| `agent-native-reviewer` loaded or waiver recorded | yes | mandatory before viable PR delivery; load once before first applicable review and apply per PR |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | exact invariant plus focused tests/runtime per PR | inventory pending |
| package/API/build | conditional | public exports/types/build per touched package | inventory pending |
| generated output | conditional | owner plus regeneration/diff | inventory pending |
| fixtures/scenarios | conditional | sync/check/runtime proof | inventory pending |
| docs/package skill | conditional | paired owner audit | inventory pending |
| changeset | conditional | package delta coverage | inventory pending |
| agent workflow | conditional | source/mirror/lock/helper proof | inventory pending |
| cleanup/review | yes | deslop, agent-native reviewer, autoreview | inventory pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | yes | source-backed merge or close plus remote read-back | pending |

PR disposition ledger:
| PR | Intended invariant | Initial slop verdict | Feedback | Dependency / order | Status |
| --- | --- | --- | --- | --- | --- |
| #329 | Solid infinite query mounts against real Solid Query | not slop; real compact correctness fix | 0 threads | first; #339 depends on it | verified; delivery in progress |
| #330 | lazy CLI startup and bounded codegen rework | credible but broad | 2 P2 threads | before #337/#342 | repair pending |
| #331 | remove ORM write-path rereads without corrupting hooks/RLS | credible but oversized | 2 P1 threads | before #335/#336/#337/#342 | repair pending |
| #332 | preserve React queries across token rotation | credible identity fix | 1 outdated changeset thread | before #339 | verify pending |
| #333 | correct Turbo/CI inputs and delete dead work | credible tooling cleanup | 0 threads | before #342; ride 0.18 release | review pending |
| #334 | reduce example/www client work and reads | mixed bundle, not proven | browser gap + 1 P2 thread | ride 0.18 only if fixed | repair pending |
| #335 | push ORM limit/order into indexes | valuable but high-risk | 3 P1 threads | before #336/#337/#342 | repair pending |
| #336 | bound streams and id-list pagination | credible, breaking | 2 P2 threads | after #335 | repair pending |
| #337 | bound aggregate reads and clearing | valuable but high-risk | 2 P1 threads | before #342 | repair pending |
| #338 | cache auth schema and repair session restore | credible, breaking | 3 P1 threads | after #337 by release plan | repair pending |
| #339 | restore Solid/React parity | credible but broad | 4 outdated threads | after #329/#332 | verify/repair pending |
| #340 | validate cRPC output once | credible, silent contract risk | 3 P1 threads | after #339 by release plan | repair pending |
| #341 | key anonymous rate limits per request | high-risk operational/security bundle | 4 threads | late; must remove cron burden or redesign | decision pending |
| #342 | inject ORM capabilities to cut bundle graphs | potentially valuable architecture change, far too large for trust-by-CI | 4 threads | last; depends on #330/#331/#333/#335/#337/#341 | deep review pending |

Dependency-safe order:
- Release 0.17.2: #329.
- Release 0.18.x: #330, #331, #333, #334 if proven, then #332 as release trigger.
- Release 0.19.x: #335 then #336.
- Release 0.20.x: #337 then #338.
- Release 0.21.x: #339 then #340.
- Later isolated candidates: #341, then #342 only after explicit high-risk proof.

Work Checklist:
- [ ] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.
- [ ] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [ ] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [ ] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [ ] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [ ] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| overlap loop generated an invalid self/343 pair at the final bound | 1 | trust only pairs with `a < b`; use frozen 329-342 bound explicitly next time | valid overlap pairs preserved; bad tail ignored |
| feedback compactor assumed thread fields were top-level | 1 | inspect raw #330 schema and map `.review_threads[].node` | recovered; all 14 feedback ledgers fetched |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | Run smallest missing owning proof | pending |
| Source/generated audit | pending | Prove correct source and regenerated mirrors | pending |
| Package/docs/scenario closure | pending | Run every applicable local contract | pending |
| Deslop | pending | Run bounded cleanup or N/A | pending |
| Agent-native reviewer | pending | Run for workflow changes or N/A | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-16-review-and-autoclose-prs-329-through-342.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- GitHub snapshot: 14 contributor PRs #329-#342; every head had green CI and
  Vercel at inventory time, but 12 PRs have unresolved source/review owners.
- Local refs `refs/pr/329` through `refs/pr/342` fetched from the authoritative
  repository; file-overlap matrix establishes the order above.
- `get-pr-comments` fetched all 14 feedback ledgers: 30 unresolved threads total
  (P1/P2), concentrated in #330-#342; #329 and #333 have none.
- #329 source audit proves the crash owner against TanStack's real Solid Query
  implementation; focused 9-test regression, typecheck, build, changeset,
  deslop, lint, full `bun check`, and autoreview all pass after merging main.

Timeline:
- 2026-08-16T18:31:28.829Z Autoclosure plan created.
- 2026-08-16 Froze #329-#342, fetched local refs, audited PR bodies/files/checks,
  mapped overlaps, and retrieved every unresolved feedback thread.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | Give every PR #329-#342 an honest slop verdict and final disposition, then autoclose each viable PR. |
| What have I learned? | Thirteen contributor PRs are green but blocked on review; overlap and intent remain unproven. |
| What have I done? | Frozen the batch, excluded #343, recorded authority, constraints, proof standards, and delivery rules. |

Open risks:
- The batch is highly overlapping across ORM/Solid/runtime/performance surfaces;
  green heads may become stale or redundant as earlier PRs merge.
