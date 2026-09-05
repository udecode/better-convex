# 446 relation where non-id target read amplification

Objective:
Stop a relation `where` from re-resolving a non-`_id` relation target once per
drain. Extend #420's execution-scoped memo to the `.first()` branch.

Goal plan:
docs/plans/446-relation-where-non-id-target-read-amplification.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- none

Task source:
- type: GitHub issue
- id / link: #446 — https://github.com/udecode/kitcn/issues/446
- title: ORM: relation `where` re-resolves a non-`_id` relation target once per drain
- acceptance criteria: a relation `where` whose `one` relation joins on a column
  other than `_id` reads each distinct target once per execution, not once per
  32-row drain. Extend
  `packages/kitcn/src/orm/query.relation-where-reads.vitest.ts` rather than
  starting a new file.
- caveats: reporter's own note says "Small." The staleness argument from #420 was
  claimed to apply verbatim; that had to be verified, not assumed.
- likely files/packages: `packages/kitcn/src/orm/query.ts`, `packages/kitcn`
- browser surface: none
- root-cause layer: ORM relation loading (`_loadOneRelation` non-`useGetById`
  branch)

Timed checkpoint:
- requested duration: N/A — no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- A new focused vitest in
  `packages/kitcn/src/orm/query.relation-where-reads.vitest.ts` fails on the
  pre-fix tree (measured: 50 target-table `db.query` calls over a 50-row scan
  with 2 distinct targets) and passes after the fix at <= 2, with results
  unchanged and cross-execution staleness still observed.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/446-relation-where-non-id-target-read-amplification.md` passes.

Verification surface:
- `bunx vitest run packages/kitcn/src/orm/query.relation-where-reads.vitest.ts`
- `bunx vitest run packages/kitcn/src/orm` (19 files)
- `bun typecheck`, `bun --cwd packages/kitcn build`, `bun run test`,
  `bun lint:fix`
- `bun check` lanes: lint, typecheck, test, test:cli, test:concave, test:verify,
  test:runtime
- autoreview `--mode local --engine claude`

Constraints:
- Preserve existing user-facing behavior outside the task scope.
- Prefer the durable ownership boundary over caller-by-caller patches.
- When a GitHub PR is in scope, this plan owns exactly one PR. A coordinating
  batch plan must link a separate task plan for every PR an agent processes.
- Verified code changes must be committed and PR'd because the task skill
  requires that path unless the user explicitly says not to, the work has no
  local patch, or a real blocker is recorded.
- The absence of a separate "open a PR" sentence from the user is not a valid
  N/A reason for verified code-changing task work.
- A PR created by this task must use the PR #270 emoji task-style PR body
  contract below, not a generic summary/body from a git helper skill.
- A task-run PR body must include
  `🧭 Task plan: docs/plans/<plan>.md`; the plan must exist at the PR head and
  identify the exact PR before autoclosure.
- Do not add broad ceremony when the task is trivial or docs-only.
- User preference in force for this run: "Do not create PR under any
  circumstances, unless user prompts to." This is an explicit decline of the PR
  path.

Boundaries:
- Source of truth: GitHub issue #446.
- Allowed edit scope: `packages/kitcn/src/orm/query.ts`,
  `packages/kitcn/src/orm/query.relation-where-reads.vitest.ts`, `.changeset/`,
  `docs/plans/`.
- Browser surface: N/A — no UI or rendered output.
- GitHub issue sync: N/A — no PR exists to reference (user declined the PR
  path); no outward-facing comment was authorized.
- Non-goals: batching the residual membership predicate, changing the fan-out
  cap, touching the `_id` memo from #420, syncing the unrelated Expo fixture
  drift.

Output budget strategy:
- Read `query.ts` in bounded windows around grep hits rather than whole-file.
- Broad review delegated to one Workflow run whose subagents return structured
  findings only; raw agent transcripts were never streamed into this context.
- `bun check` output tailed to the last 35 lines; `test:runtime` redirected to
  `/tmp/runtime.log` and tailed.

Blocked condition:
- Would be blocked if the reported amplification could not be reproduced, or if
  the execution-scope guarantee for the new memo turned out to be weaker than
  `_documentByNormalizedId`'s. Neither occurred.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: valid
- confidence: 95-100%
- next owner: user (push + PR on request)
- reason: reproduced at the exact reported boundary, fixed at the owning
  boundary, proven by a test that fails pre-fix and passes post-fix, with the
  full repo gate green apart from one pre-existing upstream-drift lane.

Implementation readiness:
- verdict: ready
- exact owner: `GelRelationalQuery` single-target resolution —
  `_getById` covers the `_id` join, and nothing covered the non-`_id` join.
- contradiction status: none. Source, tests and runtime agreed.
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: `_loadOneRelation`'s `else` branch at `query.ts:8429-8435`
  issues `_queryByFields(...).first()` with no cross-drain memo, so the 32-row
  chunk drain re-reads the same target once per batch. `r.one.x({ to: x.id })`
  is covered by #420; `r.one.x({ to: x.someOtherColumn })` is not.
- suggested diagnosis or fix: give the non-id branch an execution-scoped memo
  keyed on `(targetTable, targetFields, values)`.
- repro ladder:
  - tests / source-level repro: DONE. Added a `teamBySlug` relation joined on an
    indexed `slug` column to the existing suite. Pre-fix:
    `counts.queryByTable.rw_teams` = **50** for the non-matching case over a
    50-row scan with 2 distinct targets, and **19** for the matching case.
    `counts.get` = 0, so the measurement isolates the non-`_id` branch exactly.
  - repo-owned automated browser or integration proof: N/A — ORM read-count
    behavior has no browser or integration surface.
  - Browser plugin: N/A — no browser-rendered output.
  - screenshot / visual proof: N/A — no visual output.
- reproduction verdict: reproduced
- validity verdict: valid
- best long-term fix boundary: the reporter's suggested boundary was right but
  named only one of three call sites. The durable owner is a private
  `_firstByFields(tableName, fields, values, indexName)` sibling of `_getById`,
  so that "resolve ONE target document" has exactly two implementations — by id
  and by eq-pinned key — and both are execution-memoized. All three
  single-target `.first()` sites were routed through it.
- harsh honest feedback: the issue's read of the drain site was slightly off —
  `:9221` is `_loadManyRelation`'s stream, whereas the shape in the issue's own
  existing tests goes through `matchesPostFetchMembership` ->
  `_applyRelationsFilterToRows([row], ...)`, a batch of one. The amplification
  and the fix are the same either way, so the conclusion held. The issue also
  scoped the fix to one call site; two more had the identical shape.
- hard-stop decision: none — proceeded after reproduction.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/446-relation-where-non-id-target-read-amplification.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: ORM read-count change; no UI or rendered output can change |
| Skill analysis before edits | yes | `task` loaded; `autogoal` loaded for measurable work; `changeset` rule read; `autoreview` loaded for closeout. `testing`/`tdd` not loaded — the issue named the exact existing test file to extend, so the test slice was already scoped |
| Active goal checked or created | yes | This plan, created by `create-goal-scratchpad.mjs --template task` |
| Source of truth read before edits | yes | `gh issue view 446` read in full before any file was opened; issue has 0 comments |
| Exact per-PR task ownership | no | N/A: no PR exists — user explicitly declined the PR path |
| GitHub comments and attachments read | yes | `gh issue view 446 --json comments` returned `[]` |
| Video transcript evidence required | no | N/A: no video or screen recording in the source |
| Pre-solution issue challenge required | yes | Recorded above; verdict `valid` |
| Reproduction verdict before implementation | yes | Reproduced at 50 target reads before any source edit |
| Repro escalation ladder selected | yes | Stopped at the lowest honest rung: source-level vitest |
| Suggested fix reviewed against durable boundary | yes | Suggested fix accepted in mechanism, widened from 1 to 3 call sites |
| `docs/solutions` checked for non-trivial existing-code work | no | N/A: no `docs/solutions` directory in this repo |
| TDD decision before behavior change or bug fix | yes | Red-first: failing test written and run (50 / 19) before the fix |
| Branch decision for code-changing task | yes | Already on `issue-446-task`, a dedicated non-`main` branch |
| Release artifact decision | yes | No unreleased changeset existed; created `.changeset/rotten-donkeys-shave.md` as `patch` |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | Commit: done. Push/PR: N/A — explicit user decline ("Do not create PR under any circumstances, unless user prompts to") |
| Task-style PR body decision | no | N/A: no PR created, per explicit user decline |
| Task-plan PR body evidence | no | N/A: no PR created, per explicit user decline |
| GitHub issue sync expectation decision | yes | N/A: no PR to reference and no outward-facing comment authorized; offered to the user instead |
| Output budget strategy recorded | yes | Recorded above |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration requested.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. N/A: no PR is in scope —
      the user explicitly declined the PR path.
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML. N/A: no video in the source.
- [x] For public GitHub bug reports, behavior claims, technical diagnoses, or
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict. Verdict: `valid`.
- [x] Repro escalation ladder followed for bug/behavior claims.
- [x] Hard-stop rule followed for bug/behavior claims: reproduced, so no hard
      stop; the suggested fix was widened at the same boundary.
- [x] Nearby repo instructions and implementation patterns read before edits:
      `CLAUDE.md`, `.agents/AGENTS.md`, `.agents/rules/changeset.mdc`, the
      `_documentByNormalizedId` doc comment, and the existing suite's counting
      proxy pattern.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified: `ready`.
- [x] Implementation fixes the right ownership boundary: a private sibling of
      `_getById`, applied to all three single-target `.first()` sites.
- [x] Release artifact requirement recorded: new changeset
      `.changeset/rotten-donkeys-shave.md` (`patch`).
- [x] Final handoff shape decided: bug shape, no PR body, no issue sync.
- [x] Commit/PR handling recorded: commit created; push/PR declined by the user.
- [x] PR body shape recorded. N/A: no PR created, per explicit user decline.
- [x] PR task evidence recorded. N/A: no PR created, per explicit user decline.
- [x] Branch handling recorded: dedicated branch `issue-446-task`.
- [x] Local-env-rot retry policy recorded: `bun typecheck` first failed with
      `TS2307: Cannot find module 'kitcn/auth/generated'` in `test-convex`.
      That is stale `dist`, not a code error. `bun --cwd packages/kitcn build`
      then `bun typecheck` -> 5/5 tasks green. No reinstall was needed.
- [x] Workspace authority recorded: every command below was run from
      `/Users/mikey/conductor/workspaces/kitcn/phoenix`, the worktree that owns
      `packages/kitcn`.
- [x] Output budget discipline recorded and followed.
- [x] High-risk note recorded (see below).
- [x] Review/autoreview target selected from actual diff state: `--mode local`,
      matching the dirty working tree at review time.
- [x] Agent-native review decision recorded. N/A: the diff touches no
      `.agents/**`, `.claude/**`, `.codex/**`, skill, hook, command, prompt, or
      user-action tooling.

High-risk note (runtime / package-behavior change):
- Realistic failure mode: the memo serves a stale target document after an
  intervening write, silently changing query results.
- Proof plan: (1) source-trace `_forExecution()` and confirm it does not copy
  the new map, so every `execute()` gets a fresh memo; (2) a test that reads,
  patches the target, then reads again in the same `t.run` and asserts the new
  value is observed — `'a non-\`_id\` target updated between two reads is not
  remembered'`; (3) a test that reads two distinct targets in one execution and
  asserts each row gets its own — `'two non-\`_id\` targets are told apart'`.
  All three closed.
- Why the boundary is right: `_getById` and `_firstByFields` are now the only
  two ways a single target document is resolved, and both carry the identical
  execution-scoped guarantee. Leaving the `else` branch unmemoized kept two
  sibling branches of the same `if` with different cost characteristics for no
  reason a caller could see.

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | `gh issue view 446`, 0 comments; read `query.ts` 8362-8509, 7617-7748, 625-694, 5784-5801, 2355-2390, 9000-9259 | implementation |
| Reproduction | complete | New tests red at 50 and 19 target-table queries | implementation |
| Implementation | complete | `_firstDocumentByFieldKey` + `_firstByFields`; 3 call sites rerouted | verification |
| Verification | complete | See Verification evidence | closeout |
| Commit / PR / GitHub sync | complete | Commit created; push/PR/issue-comment declined by the user | closeout |
| Closeout | complete | Adversarial workflow (29 agents, 0 surviving findings) + autoreview clean | final response |

Findings:
- The issue's `:9221` pointer names `_loadManyRelation`'s stream drain. The
  shape its own existing tests exercise reaches the same amplification through
  `matchesPostFetchMembership` (`query.ts:6970`), which calls
  `_applyRelationsFilterToRows([row], ...)` — a batch of one, so every
  per-batch dedup map inside the relation loaders is a no-op. Same defect,
  slightly different entry point. The fix covers both.
- Two more call sites had the identical single-target `.first()` shape and the
  same missing memo: `fetchThroughTargets` inside `_loadManyRelation` and
  `resolveTargetMatch` in the relation `_count` through path.
- `convex/orm/relation-loading.test.ts:1856` already defines a `through`
  relation joined on a non-`_id` column (`slug`), so call site 2 has existing
  coverage; it stayed green.
- `JSON.stringify(values)` over the exact same `values` already happens
  upstream of all three call sites (`query.ts:8201`, `:8439`, `:8746`,
  `:9192`), so the memo key introduces no new serialization-throw surface
  (e.g. `bigint()` columns) and no new collision class.

Decisions and tradeoffs:
- Memo, not batching. #420 already established the execution-scoped memo as the
  owner for this defect class. Batching the residual membership predicate would
  be a much larger change to the streaming contract and was not needed.
- Widened from the issue's 1 call site to all 3. Leaving two behind would have
  recreated the same asymmetry the issue is about.
- `indexName` is in the memo key even though the three call sites resolve it
  deterministically per relation. It is what decides which row `.first()`
  returns, so keying on it makes the memo correct by construction rather than
  by an invariant a future edit could break.
- An `undefined`-value bypass guards a collision `JSON.stringify` would
  otherwise create (`undefined` serializes to `null`). All current callers
  filter nullish join values first, so this only protects a future one.
- Did not sync the unrelated Expo fixture drift. It is upstream churn, not this
  task's scope, and committing it would put an unrelated dependency bump in a
  bug-fix diff.

Implementation notes:
- `packages/kitcn/src/orm/query.ts`
  - Added `_firstDocumentByFieldKey: Map<string, Promise<any | null>>` beside
    `_documentByNormalizedId`, with a doc comment stating the same execution
    scope and staleness argument.
  - Added `_firstByFields(tableName, fields, values, indexName)`: key is
    `JSON.stringify([tableName, indexName, fields, values])`; the pending
    promise is stored before it settles so concurrent loaders share one
    in-flight read; the entry is evicted on rejection so a failure is never
    cached — identical shape to `_getById`.
  - Rerouted `_loadOneRelation`'s non-`useGetById` branch,
    `fetchThroughTargets`, and `resolveTargetMatch`.
- `packages/kitcn/src/orm/query.relation-where-reads.vitest.ts`
  - `rw_teams` gained `slug` + `rw_teams_by_slug`; `rw_members` gained
    `teamSlug`; new `teamBySlug` relation joined on `slug`.
  - The counting proxy now also splits `query` calls by table
    (`queryByTable`), so a target read is separable from the parent scan.
  - Four new tests: read count, result correctness, cross-execution staleness,
    and target distinctness.

Review fixes:
- None. Both review passes came back with nothing to fix.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `bun typecheck` -> `TS2307: Cannot find module 'kitcn/auth/generated'` in `test-convex` | 1 | Build the package instead of reinstalling — this is stale `dist`, not code | `bun --cwd packages/kitcn build` then `bun typecheck` -> 5/5 green |
| `bun check` -> `fixtures:check` fixture drift in `expo` | 1 | Prove provenance before touching it | `expo@55.0.31` published 2026-08-31, five days after base commit `14bab503` (2026-08-26); fixture pins `~55.0.30`. Pre-existing on `origin/main`, unrelated to this diff. Not fixed here. |

Verification evidence:
All commands run from `/Users/mikey/conductor/workspaces/kitcn/phoenix`.
- `bunx vitest run packages/kitcn/src/orm/query.relation-where-reads.vitest.ts`
  - pre-fix: 2 failed / 5 passed — `expected 50 to be less than or equal to 2`
    and `expected 19 to be less than or equal to 2`
  - post-fix: **7 passed**, re-run once to rule out a stale transform pass
- `bunx vitest run packages/kitcn/src/orm` — **19 files, 157 tests passed**
- `bun --cwd packages/kitcn build` — 72 files, complete
- `bun typecheck` — 5/5 tasks green
- `bun run test` — **1400 bun tests passed (150 files)** + **985 vitest passed,
  14 skipped (92 files)**
- `bun lint:fix` — 960 files checked, no fixes applied
- `bun check` — `lint`, `typecheck`, `test`, `test:cli`, `test:concave` all
  green; `fixtures:check` **fails on pre-existing upstream Expo drift**
  (see Error attempts); `test:verify` exit 0; `test:runtime` exit 0
- Adversarial review Workflow — 5 lenses (staleness, memo key, call sites,
  resource use, tests) x 3 refuters per finding, 29 agents: **0 findings
  survived**; every raised finding was killed as pre-existing/accepted for
  `_documentByNormalizedId` or as unreachable
- `.agents/skills/autoreview/scripts/autoreview --mode local --engine claude` —
  `autoreview clean: no accepted/actionable findings reported`;
  `overall: patch is correct (0.88)`

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Non-`_id` `one` relation in a relation `where`, non-matching | re-resolves the target once per drain | `'a non-matching relation \`where\` on a non-\`_id\` join reads each target once'` | 50 `db.query('rw_teams')` over a 50-row scan | <= 2 | vitest, `counts.queryByTable.rw_teams` | passed |
| Same, matching | results must not change | `'a matching relation \`where\` on a non-\`_id\` join still returns the right rows'` | 19 queries, 10 correct rows | <= 2 queries, same 10 rows | vitest | passed |
| `r.one.x({ to: x.id })` still covered by #420 | already fixed, must not regress | 3 pre-existing tests in the same file | `counts.get <= 2` | unchanged | vitest | passed |
| Staleness across executions | #420's argument must apply verbatim | `'a non-\`_id\` target updated between two reads is not remembered'` | N/A (new) | intervening write observed | vitest | passed |
| Two distinct non-`_id` targets in one execution | memo must not alias them | `'two non-\`_id\` targets are told apart'` | N/A (new) | each row gets its own target | vitest | passed |
| `through` relation target, non-`_id` | same shape, not named in the issue | `convex/orm/relation-loading.test.ts:1856` (pre-existing) | N/A | unchanged | `bun run test` | passed |
| `_count` through target, non-`_id` | same shape, not named in the issue | `returning-count.read-amplification.vitest.ts` (pre-existing) | N/A | unchanged | `bunx vitest run packages/kitcn/src/orm` | passed |

Final handoff contract:
- Commit line: `fix(orm): memoize non-_id relation target reads per execution` on branch `issue-446-task` (HEAD)
- PR line: N/A — user preference in force: "Do not create PR under any
  circumstances, unless user prompts to." Branch `issue-446-task` is committed
  and ready to push.
- Issue line: N/A — no PR to reference; no outward-facing comment authorized.
- Confidence line: 🟢 95-100% confidence
- Flow table:
  - Reproduced: tests 🔴 (50 and 19 target reads), browser ➖ N/A
  - Verified: tests 🟢 (7/7 file, 157 ORM, 1400+985 repo), browser ➖ N/A
- Browser check: N/A — no browser-rendered or native output.
- Outcome: a relation `where` on a `one` relation joined on a non-`_id` column
  now reads each distinct target once per execution instead of once per drain.
- Caveat: `bun check` still fails its `fixtures:check` lane on pre-existing
  upstream Expo drift (`expo@55.0.31`, published five days after the base
  commit) that is unrelated to and untouched by this diff.
- Design:
  - Chosen boundary: `_firstByFields`, a private execution-memoized sibling of
    `_getById`, used by all three single-target `.first()` resolutions.
  - Why not quick patch: memoizing only `_loadOneRelation`'s `else` branch, as
    the issue proposed, would leave two structurally identical call sites with
    the same defect.
  - Why not broader change: batching the one-row-at-a-time residual membership
    predicate would rewrite the streaming contract; #420 already settled the
    memo as this defect class's owner.
- Verified: see Verification evidence.
- PR body verified: N/A — no PR created.

Task-style PR body contract:
- N/A for this run: no PR was created, per the explicit user preference. If the
  user later asks for a PR, the body must follow the PR #270 emoji format —
  `🐛 Fixes #446`, `🧭 Task plan:
  docs/plans/446-relation-where-non-id-target-read-amplification.md`,
  `🟢 95-100% confidence`, the `| Phase | 🧪 Tests | 🌐 Browser |` table with
  `Reproduced` / `Verified` rows, and bold emoji `**✅ Outcome**`,
  `**⚠️ Caveat**`, `**🏗️ Design**`, `**🧪 Verified**` sections — and this plan
  must then be updated to name the exact PR.

Final handoff / sync:
- Commit: HEAD of `issue-446-task` — `fix(orm): memoize non-_id relation target reads per execution`
- PR: N/A — explicit user decline
- Issue: N/A — no PR to reference; no comment authorized
- Browser proof: N/A
- Caveats: pre-existing `fixtures:check` Expo drift, unrelated to this diff

Timeline:
- 2026-09-05T06:07:37.683Z Task goal plan created.
- 2026-09-05T06:09Z Reproduced: 50 target-table reads over a 50-row scan.
- 2026-09-05T06:10Z Fix landed; focused suite green (7/7).
- 2026-09-05T06:13Z Full repo test suite green (1400 + 985).
- 2026-09-05T06:33Z Adversarial review workflow: 0 findings survived.
- 2026-09-05T06:38Z autoreview clean.
- 2026-09-05T06:55Z `bun check` lanes recorded; Expo drift proven pre-existing.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Final response |
| What is the goal? | Stop a relation `where` from re-resolving a non-`_id` relation target once per drain |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- None for this change. The only unresolved repo-level item is the pre-existing
  Expo fixture drift, which belongs to a separate `fixtures:sync` task.

Hard closeout guard:
- Satisfied: the user's standing preference "Do not create PR under any
  circumstances, unless user prompts to" is an explicit decline of the PR path.
  The verified change is committed locally on `issue-446-task` and is ready to
  push and open as a PR the moment the user asks.
