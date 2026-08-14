# PR 314 closure and feedback

Objective:
Close PR 314 and its review feedback; done when all applicable closure lanes
pass, feedback is resolved, `bun check` passes, and the pushed PR head is read
back from GitHub.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-14-pr-314-closure-and-feedback.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- Every new actionable review thread/comment has a source-backed verdict,
  focused proof, reply status, and resolution status; final unresolved count is
  zero except any recorded `needs-human` item.
- All applicable closure-matrix rows are complete; `bun lint:fix`, targeted ORM
  tests, package build, `bun check`, deslop, required review passes, changeset
  audit, commit/push, PR head read-back, and goal-plan checker pass.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- PR 314 source/diff and review-feedback read-back through `gh` and the installed
  feedback scripts.
- Focused ORM tests for query filtering/pagination, `isNull`, `flatMap`, and soft
  cascade deletion; `bun --cwd packages/kitcn build`; fixture audit if the
  existing regenerated fixture pins are touched.
- `bun run lint:slop:delta`, local agent-native capability audit,
  `.agents/skills/autoreview/scripts/autoreview`, `bun lint:fix`, and `bun check`.
- Git commit/push plus `gh pr view 314` and feedback-script re-fetch.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: the four ORM correctness fixes and residual cursor-pagination
  filter fix already described by PR 314, their regression tests, changeset, and
  existing fixture dependency-pin regeneration.
- allowed repairs: accepted PR feedback and direct defects in those changed
  owners, tests, changeset, generated fixtures, plan, or PR description.
- unrelated files: preserve; do not treat as blockers
- non-goals: new ORM features, unrelated cleanup, compatibility shims, public
  API redesign, or expanding past the reviewed owner boundary.
- authority: the user invoked `autoclosure` and `resolve-pr-feedback`; repository
  policy authorizes whole-checkout commit/push, PR replies, and thread resolution.

Output budget strategy:
- Use exact PR/file/test owners, exclude generated/build trees from searches,
  cap reads to targeted slices, and retain only command summaries when full
  check/review output is noisy.

Blocked condition:
- Stop only for missing GitHub credentials/access, a public API/product decision
  not bounded by PR 314, or the same reproducible environment blocker after
  different repair attempts.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 314 metadata/body/files/commits/checks and this plan read 2026-08-14 |
| Intended delta and exclusions recorded | yes | Boundaries above copy the exact PR target and non-goals |
| Closure matrix classified | yes | Matrix below classifies every recurring lane before repair |
| GitHub delivery expectation recorded | yes | Whole-checkout commit/push, reply, resolve, and PR read-back authorized |
| Active goal checked or created | yes | Goal tool created the objective pointing to this plan |
| Agent-native pack selected | yes | Materialized `agent-native` pack in this plan |
| Agent-facing action surface identified | no | N/A: PR 314 changes ORM runtime/tests, not agent-facing behavior |
| Source rule versus generated mirror boundary identified | no | N/A: no `.agents/rules/**` or generated skill mirror is in PR 314 |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed-skill or lock change is in PR 314 |
| `agent-native-reviewer` loaded or waiver recorded | yes | Skill read completely; final capability audit remains required by autoclosure |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | fail-closed metadata repair plus final-visible-membership stream/fallback sizing; 6-file ORM lane passed 131 tests with 1 skip | complete |
| package/API/build | yes | final `bun --cwd packages/kitcn build` passed; no public API shape changed | complete |
| generated output | yes | `bun run fixtures:check` proved all committed fixtures match fresh scaffold output | complete |
| fixtures/scenarios | yes | `bun run fixtures:check` passed every fixture; scenario runtime N/A because ORM runtime behavior is covered by integration tests and no scaffold behavior changed | complete |
| docs/package skill | no | N/A: internal ORM correctness only; no public usage shape or docs/skill contract changed | complete |
| changeset | yes | `.changeset/olive-eyes-punch.md` covers the six user-visible fixes and no longer overclaims standalone full-page filling | complete |
| agent workflow | no | N/A: changed-file audit contains no agent rule, skill, mirror, lock, helper, or user-action tooling | complete |
| cleanup/review | yes | deslop stayed at zero net regression; agent-native audit unchanged; all in-scope findings fixed, final ordering finding rejected with `origin/main` source evidence | complete |
| repository check | yes | final `bun lint:fix` and restarted `bun check` exited 0 across every repo lane | complete |
| GitHub delivery | yes | whole-checkout commit/push, replies/resolution, PR read-back | pending |

Feedback ledger:
| ID / URL | Type | Path | Reviewer claim | Verdict | Owner / proof | Reply | Resolution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PRRT_kwDOPTlS686Y-7VP` / `discussion_r3776629135` | review thread | `packages/kitcn/src/orm/query.ts:5896` | Cursor pagination drops residual predicates | fixed: schema-backed residual predicates, RLS visibility, and relation membership run inside stream pagination before page sizing | 22 pagination + 14 RLS tests; combined 6-file ORM lane passed 130 with 1 skip | pending | pending |
| `PRRT_kwDOPTlS686ZPpy4` / `discussion_r3783055926` | review thread | `packages/kitcn/src/orm/query.ts:2324` | Metadata-free relations can drop residual cursor filters | fixed-differently after source/author evidence: unsupported standalone schema ownership fails closed through the canonical `defineSchema()` guard, also preventing silent `maxScan` loss | focused test red because the partial native fallback resolved instead of rejecting, green after guard; pagination file passed 22 tests | pending | pending |

Feedback triage notes:
- `changeset-bot` top-level comment is status boilerplate with no actionable
  question; no reply needed.
- Both Codex review bodies are boilerplate wrappers; their actionable findings
  are represented by the two inline threads above.
- A substantive PR-author reply arrived after the first fix/check cycle. Source
  confirmed standalone relation exports are rejected by schema ownership and
  advanced pagination already owns a canonical `defineSchema()` guard. The
  permissive native-page filter was replaced with that fail-closed invariant.

Review fixes:
- Accepted P1: residual cursor pagination counted rows before RLS. Moved RLS
  membership into `QueryStream.filterWith`; a red/green test puts an invisible
  newer row ahead of the visible match and still fills a one-row page.
- Accepted P1: residual cursor pagination counted rows before relation filters.
  Moved relation membership into the same stream predicate; a red/green test
  puts three newer non-matches ahead of the related match and fills the page.
- Accepted P2: non-cursor residual `take()` counted rows before RLS/relation
  filters. The same membership predicate now sizes limited reads by final
  visible matches and the post-stream path avoids duplicate membership work.
- Accepted final P2: metadata-free fallback and offset-only reads sliced after
  scalar residual filters but before RLS/relation membership. Membership now
  runs before fallback slicing; one red test simultaneously returned `[]` for
  `limit: 1` and the matching row for `offset: 1`, then green returned the
  matching limited row and no offset row.
- Rejected final P2 after the mandatory two-cycle pause: secondary cursor
  ordering is not a regression in the residual stream branch. `origin/main`
  emits the same promise that secondary fields are applied per page in its
  existing cursor branches, but those branches also finalize the native page
  without sorting. Fixing only the new branch would make cursor behavior
  inconsistent; the canonical all-branch ordering contract is separate scope.

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
| RLS cursor repro hit the `maxScan` guard before the residual stream | 1 | Give the fixture a real planner index and combine indexed `eq` with residual `like` | Red reproduced an empty page, then passed after membership moved into the stream |
| First metadata-free fallback repro hit the relation sizing guard | 1 | Enable the fixture's explicit full-scan authority so it reaches the slicing owner | The corrected repro returned the two opposite wrong results before the ordering fix |
| Patch context drifted after the first owner edit | 1 | Re-read exact bounded ranges and patch smaller hunks | Applied cleanly; `git diff --check` passed |
| `gh pr view` briefly reported a stale head SHA after push | 1 | Read the branch ref and PR head directly through GitHub API | Both direct API endpoints agreed on the pushed SHA |
| First final `bun check` found implicit-any parameters in new RLS tests | 1 | Replace callback filters with equivalent typed object filters, then rerun the owning typecheck and RLS suite | Convex typecheck and all 14 RLS tests passed; final full check passed |
| Corrected full check stalled in a GitHub fetch during Vite fixture creation | 1 | Prove the exact child/network state, interrupt only the stalled check tree, and rerun the exact gate | Restarted `bun check` crossed Vite normally and exited 0 |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | pending | Run smallest missing owning proof | pending |
| Source/generated audit | pending | Prove correct source and regenerated mirrors | pending |
| Package/docs/scenario closure | pending | Run every applicable local contract | pending |
| Deslop | pending | Run bounded cleanup or N/A | pending |
| Agent-native reviewer | pending | Run for workflow changes or N/A | pending |
| Final lint | yes | Run `bun lint:fix` | complete: 874 files, no fixes |
| Repository check | yes | Run `bun check` | complete: exit 0 on restarted final run |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-14-pr-314-closure-and-feedback.md` | pending |
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
- First standalone repro returned all five forbidden `Bob` rows. After the
  author/source correction, the final TDD case expected the canonical advanced
  pagination error and failed red because the partial fallback resolved; the
  explicit `defineSchema()` guard made it green.
- `bunx vitest run convex/orm/pagination.test.ts` -> 21 passed, including
  schema-backed full-page residual filtering and standalone metadata-free
  residual filtering.
- Focused combined Vitest lane for foreign-key actions, pagination, pipeline,
  string operators, and where filtering -> 5 files passed, 115 passed, 1 skipped,
  no type errors.
- `bun test packages/kitcn/src/orm/where-clause-compiler.test.ts` -> 18 passed.
- `bun --cwd packages/kitcn build` -> passed; ORM and all package artifacts built.
- `bun run fixtures:check` -> passed for Expo, Next, Start, Vite, and auth
  variants; every committed fixture matched fresh CLI output.
- `bun run lint:slop:delta` -> findings 166 to 166, score 493.71 unchanged,
  zero net regression. Three local lenses accepted only the changeset accuracy
  correction; pass-through/error-obscuring deltas cancelled and were ignored.
- Agent-native capability map -> N/A across action route/source mirror/lock/proof:
  the changed surface is ORM runtime and tests only; verdict PASS.
- `.agents/skills/autoreview/scripts/autoreview --mode branch --base origin/main --stream-engine-output` -> TruffleHog clean, one 59,712-byte bundle, zero findings, `patch is correct`, confidence 0.87, clean exit.
- Final `bun lint:fix` -> 874 files checked, no fixes applied.
- Final `bun check` -> exit 0: lint, all package typechecks/tests/builds, CLI
  123/123, Concave smoke, fixture parity, bare Convex verify, and runtime
  scenario matrix including auth smoke all passed.
- After the final fail-closed repair: focused combined Vitest lane -> 5 files,
  115 passed, 1 skipped, no type errors; package build passed; deslop remained
  166 to 166 with zero score change.
- Accepted the final autoreview's three composition findings as one owner
  invariant: residual stream limits must count final RLS-visible and
  relation-matching rows. Added cursor RLS, cursor relation, and non-cursor RLS
  regressions; the final 6-file lane passed 130 tests with 1 skip and no type
  errors, compiler tests passed 18, package build passed, and deslop remained
  166 to 166 with zero score change.
- The next review found one remaining fallback branch in the same invariant.
  Its combined red result was `[[], ['Candidate with post']]` for limit/offset;
  after moving membership ahead of fallback slicing it became
  `[['Candidate with post'], []]`. The 6-file lane passed 131 tests with 1 skip,
  compiler tests passed 18, package build passed, and deslop stayed unchanged.
- The post-cycle autoreview reported secondary per-page ordering in the new
  residual branch. Source comparison against `origin/main` proved the same
  warning/omission exists in all established cursor branches. Rejected as a
  pre-existing cross-branch ordering contract, not a PR 314 regression.
- Final `bun lint:fix` checked 874 files with no fixes. The first full check
  exposed implicit-any test callbacks; typed object filters fixed them and the
  owning Convex typecheck/RLS suite passed. A later Vite fixture Git fetch
  stalled with no progress, so only that process tree was interrupted. The
  exact restarted `bun check` exited 0 across lint, typechecks, all tests, CLI
  123/123, Concave smoke, every fixture, bare verify, and all runtime/auth
  scenarios.

Timeline:
- 2026-08-14T10:55:17.599Z Autoclosure plan created.
- 2026-08-14 PR 314 feedback fetched: two unresolved inline threads, zero
  actionable top-level comments, and zero actionable review bodies.
- 2026-08-14 Switched the same checkout from `main` to PR head branch
  `fix/orm-limit-isnull-flatmap-cascade` through `gh pr checkout 314`.
- 2026-08-14 Confirmed the second thread with a public-interface regression:
  standalone relations returned five violating rows; added the native fallback
  filter and observed the focused test and all 21 pagination tests pass.
- 2026-08-14 Narrowed the changeset claim from universal full-page filling to
  the proven invariant that cursor pages never contain non-matching rows.
- 2026-08-14 Focused ORM tests, package build, fixture parity, deslop, and the
  agent-native audit passed; no additional cleanup or workflow repair accepted.
- 2026-08-14 Committed the whole checkout as `12966fe0`, then ran the isolated
  branch autoreview clean with zero accepted/actionable findings.
- 2026-08-14 Final `bun lint:fix` and complete `bun check` passed; GitHub
  delivery is the only remaining executable lane.
- 2026-08-14 A new PR-author reply changed the second finding's source verdict:
  standalone exports are unsupported and silently dropping `maxScan` remained.
  Replaced the permissive fallback with the canonical fail-closed schema guard;
  all 21 pagination tests passed. Prior autoreview/check evidence is stale until
  rerun.
- 2026-08-14 Final branch autoreview found three related limit-composition
  defects around RLS/relation membership. Accepted them as one in-scope owner
  repair, proved each red/green, and reran the focused owner stack green.
- 2026-08-14 Second and final review-fix cycle found the metadata-free fallback
  ordering remainder. Reproduced both limited and offset failure directions in
  one test, moved membership before slicing, and reran all owner proof green.
- 2026-08-14 Mandatory post-cycle pause reclassified the only remaining review
  finding as a pre-existing all-cursor ordering contract; no third speculative
  patch cycle was started.
- 2026-08-14 Final lint passed. Full check caught and closed the RLS test typing
  gap; its first corrected run later stalled in an external GitHub template
  fetch, and the exact clean restart passed every lane with exit 0.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | All local closure lanes passed; GitHub delivery pending |
| Where am I going? | Push, feedback replies/resolution, GitHub read-back, final audit |
| What is the goal? | Close PR 314 with zero unhandled actionable feedback and every applicable proof/delivery gate complete |
| What have I learned? | Residual predicates, RLS, and relation membership form one final-visible-row predicate; any pushed-down limit must count that composite result |
| What have I done? | Reclassified the metadata case and fixed final-visible sizing in both stream and fallback paths; final review/check/delivery remain |

Open risks:
- Secondary cursor `orderBy` fields are not applied per page in any existing
  cursor branch despite the current warning; this pre-existing cross-branch
  contract needs separate ownership and does not block PR 314.
- Push, replies/resolution, final CI/PR head read-back, and the goal-plan checker
  remain.
