# Drain CLEARING aggregate index before kickoff rebuilds it

Objective:
Make aggregate `kickoff` finish an in-progress CLEARING drain before a metric-definition change restarts the build, and assert that invariant at the state writer.

Goal plan:
docs/plans/383-drain-clearing-before-building.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: GitHub issue (attachment)
- id / link: https://github.com/udecode/kitcn/issues/383
- PR: https://github.com/udecode/kitcn/pull/398 (this plan owns exactly this one PR)
- title: ORM: aggregate kickoff moves a CLEARING index straight to BUILDING without draining
- acceptance criteria:
  - `kickoff`'s `metricChanged` branch handles `COUNT_STATUS_CLEARING` explicitly
    (drain first, or stay CLEARING).
  - Invariant asserted: no state leaves CLEARING for BUILDING with a non-empty
    deletion stack / surviving stored state.
  - Regression coverage for the rank path (`needsMetricBackfill` is always true).
- caveats: latent today (per-key deletes keep partial clears consistent); this is
  a prerequisite for the rank-clear `O(N log N)` optimization.
- likely files: packages/kitcn/src/orm/aggregate-index/{backfill,runtime,rank-runtime,schema}.ts
- browser surface: none (Convex server runtime)
- root-cause layer: aggregate-index backfill state machine

Timed checkpoint:
- requested duration: N/A: no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- `convex/orm/count.test.ts` gains regression tests that fail on `main` with
  `expected 'BUILDING' to be 'CLEARING'` and pass after the fix, for both the
  rank and metric paths.
- Full `vitest run`, `bun test`, `bun typecheck`, and `bun lint` are green.
- `bun --cwd packages/kitcn build` succeeds and a `.changeset` exists.
- `autoreview` closes with no accepted/actionable findings.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/383-drain-clearing-before-building.md` passes.

Verification surface:
- `npx vitest run convex/orm/count.test.ts` (repo root) — targeted repro + fix.
- `npx vitest run` (repo root) — full vitest suite.
- `bun test` (repo root) — bun suite.
- `bun typecheck`, `bun lint`, `bun --cwd packages/kitcn build`.
- Source audit of every `aggregate_state.status` write site.

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

Boundaries:
- Source of truth: `.context/attachments/github-5214880463/[GITHUB]-383.md` (issue #383).
- Allowed edit scope: `packages/kitcn/src/orm/aggregate-index/**`,
  `convex/orm/count.test.ts`, `.changeset/**`, this plan.
- Browser surface: N/A: Convex server runtime, no rendered output.
- GitHub issue sync: N/A: user preference forbids PR creation; no PR to reference.
- Non-goals: the rank-clear `O(N log N)` optimization itself; the pre-existing
  `needsRebuild` liveness gap on a keyDefinitionHash change.

Output budget strategy:
- Greps scoped to `packages/kitcn/src` and `convex/orm` with `| head -N`.
- Test runs piped through `tail -N`.
- Broad cross-file investigation delegated to a background read-only workflow
  that returns structured findings instead of raw file dumps.

Blocked condition:
- Would block only if the CLEARING state could not be reproduced in
  `convex-test`, or if draining inside `kickoff` broke the shared clear budget
  contract. Neither occurred.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: verification
- current_phase_status: in_progress
- next_phase: closeout
- goal_status: active

Current verdict:
- verdict: valid, reproduced, fixed
- confidence: high
- next owner: task
- reason: two new tests reproduce the exact reported transition and pass after
  the fix; full repo test suites are green.

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/orm/aggregate-index/backfill.ts` `kickoff`
  (`metricChanged` branch) plus `runtime.ts` `setCountState` for the invariant.
- contradiction status: none. `www/content/docs/migrations/aggregate.mdx:204`
  already documents "CLEARING indexes ... finish draining first", so the code
  was the side that was wrong.
- source-listed cases complete: yes (rank + metric)

Pre-solution issue challenge:
- reporter claim: `kickoff` writes `COUNT_STATUS_BUILDING` unconditionally in the
  `metricChanged` branch, abandoning an in-progress clear.
- suggested diagnosis or fix: drain first, or stay CLEARING; assert that nothing
  leaves CLEARING with a non-empty deletion stack.
- repro ladder:
  - tests / source-level repro: reproduced. `convex/orm/count.test.ts` — both new
    tests fail on the unfixed code with
    `AssertionError: expected 'BUILDING' to be 'CLEARING'`.
  - repo-owned automated browser or integration proof: N/A: server-side state
    machine, fully covered by the convex-test integration harness.
  - Browser plugin: N/A: no browser-rendered surface.
  - screenshot / visual proof: N/A: no visual output.
- reproduction verdict: valid
- validity verdict: valid, and broader than filed — the metric (non-rank) path
  hits the same branch whenever `requiresMetricBackfill` is true, so the second
  regression test covers `aggregateIndex` as well as `rankIndex`.
- best long-term fix boundary: drain-first in the `metricChanged` branch (matches
  `rebuild` mode and `chunk`), plus a verification guard in `setCountState` so no
  future branch can write BUILDING over an undrained CLEARING row.
- harsh honest feedback: the issue's "stay CLEARING" alternative would have
  contradicted the published `resume` contract in
  `www/content/docs/migrations/aggregate.mdx:204`; drain-first is the only option
  that keeps docs and code agreeing. Handling the branch alone would also have
  left the bug class open, which is why the invariant is asserted at the writer.
- hard-stop decision: proceed (reproduced and valid).

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/383-drain-clearing-before-building.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: Convex server runtime only; no UI or rendered output can change |
| Skill analysis before edits | yes | `task` + `autogoal` (plan) + `changeset` + `autoreview`; no browser/video/testing skill needed |
| Active goal checked or created | yes | this plan |
| Source of truth read before edits | yes | `.context/attachments/github-5214880463/[GITHUB]-383.md` read first |
| Exact per-PR task ownership | yes | PR #398, owned solely by this plan |
| GitHub comments and attachments read | yes | issue body supplied as attachment; no comments present |
| Video transcript evidence required | no | N/A: no video evidence |
| Pre-solution issue challenge required | yes | recorded above; verdict `valid` |
| Reproduction verdict before implementation | yes | two failing tests written before the fix |
| Repro escalation ladder selected | yes | source-level test repro sufficed; browser/native rungs N/A |
| Suggested fix reviewed against durable boundary | yes | chose drain-first over "stay CLEARING" and replaced the proposed trust flag with a read-only probe |
| `docs/solutions` checked for non-trivial existing-code work | yes | no aggregate-index CLEARING entry exists |
| TDD decision before behavior change or bug fix | yes | red-green: both tests failed with `expected 'BUILDING' to be 'CLEARING'` first |
| Branch decision for code-changing task | yes | renamed `issue-383` -> `fix/drain-clearing-index-before-rebuild` per user branch convention, before any push |
| Release artifact decision | yes | new `.changeset/wild-donkeys-shave.md`, patch |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | User prompted for a PR; commit `97ac0577` pushed, PR #398 opened |
| Task-style PR body decision | yes | PR #270 emoji task-style body used |
| Task-plan PR body evidence | yes | Body carries `🧭 Task plan: docs/plans/383-drain-clearing-before-building.md`; plan present at PR head |
| GitHub issue sync expectation decision | yes | PR body carries `🐛 Fixes #383`, which closes the issue on merge |
| Output budget strategy recorded | yes | see Output budget strategy |
| Package/API pack selected | yes | `--with package-api` |
| Public surface or package boundary identified | yes | none changed: `setCountState`, `isIndexStateDrained` and `rankAggregateName` are all internal; `orm/aggregate-index/index.ts` exports are untouched |
| Convex entry/import graph impact identified | yes | zero new module edges: `runtime.ts` and `rank-runtime.ts` already imported `./schema` |
| CLI/scaffold/generated impact identified | yes | none; `bun run fixtures:check` passes |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` followed (new file, patch, `## Patches` only) |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; `fixtures:sync` not needed, `fixtures:check` run anyway and passed |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      N/A: no duration requested.
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. This plan owns one exact
      PR #398 is the single PR this plan owns.
      PR, owns a not-yet-created PR slice, or records N/A because no PR is in
      scope; a batch plan is not used as a substitute.
- [x] Required video or screen-recording evidence is cached/read as normalized
      N/A: no video evidence.
      `<video-transcripts>` XML, or marked N/A with reason.
- [x] For public GitHub bug reports, behavior claims, technical diagnoses, or
      Verdict: valid.
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict: `valid`, `not reproduced`, `invalid`,
      `wont-fix`, `partially valid`, or `platform limitation`. Feature, docs,
      support, or cleanup requests with no bug claim may mark reproduction
      `N/A` with reason.
- [x] Repro escalation ladder followed for bug/behavior claims: focused
      Source-level test repro succeeded; higher rungs N/A.
      test/source-level repro first when applicable; existing repo-owned
      automated browser or integration proof next when available and useful as
      executable coverage; the repo-approved Browser tool next when tests or
      automation cannot reproduce or cannot model the surface honestly;
      screenshot or explicit visual-proof waiver when visual/native state
      matters.
- [x] Hard-stop rule followed for bug/behavior claims: no code when the issue
      Reproduced, so implementation proceeded.
      is not reproduced, invalid, or won't-fix; partial validity pivots to the
      best long-term fix and records what was wrong or incomplete in the
      issue's proposed path.
- [x] Nearby repo instructions and implementation patterns read before edits.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified `ready`, `repair-source`, `major`, `blocked`, or
      ready.
      `invalid` with evidence.
- [x] Implementation fixes the right ownership boundary, or the narrower choice
      is recorded with reason.
- [x] Release artifact requirement recorded: active changeset, new changeset, or
      New changeset added.
      N/A with reason.
- [x] Final handoff shape decided: bug/feature/testing/batch/review/GitHub
      Bug shape; PR/issue sync N/A.
      requirements, PR body sync, and issue sync when applicable.
- [x] Commit/PR handling recorded for code-changing work: commit and PR
      User prompted for a PR; commit 97ac0577 pushed and PR #398 opened.
      completed, no local patch, user explicitly declined, or blocker recorded.
      "User did not separately ask for a PR" is not a valid blocker.
- [x] PR body shape recorded: PR #270 emoji task-style body used, N/A reason
      N/A: no PR.
      recorded, or blocker recorded.
- [x] PR task evidence recorded: body includes `🧭 Task plan: ...`, the plan
      N/A: no PR.
      exists at the PR head, and it identifies the exact PR before autoclosure.
- [x] Branch handling recorded for code-changing work: dedicated branch used,
      Renamed to `fix/drain-clearing-index-before-rebuild` before pushing.
      new branch needed, or N/A with reason.
- [x] Local-env-rot retry policy recorded for any surprising repo-wide failure:
      Stale `packages/kitcn/dist` caused 6 vitest failures; rebuilt and reran to green.
      reinstall/rerun evidence or N/A with reason.
- [x] Workspace authority recorded: every proof command names the cwd/tool that
      All commands from repo root; cwd recorded in Verification evidence.
      owns the changed behavior.
- [x] Output budget discipline recorded and followed: broad searches are
      scoped, capped, counted, or artifacted instead of streamed into goal
      context.
- [x] High-risk note recorded for public API, runtime, package-boundary,
      See Open risks.
      browser behavior, agent-action, or command-contract changes, or marked
      N/A with reason.
- [x] Review/autoreview target selected from actual diff state for non-trivial
      `--mode local`, clean.
      implementation work, or marked N/A with reason.
- [x] Agent-native review decision recorded for `.agents/**`, `.claude/**`,
      N/A: no agent-native surface touched.
      `.codex/**`, skills, hooks, commands, prompts, or user-action tooling.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
      No public export changed.
- [x] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
      `.changeset` added.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`.
      N/A: an artifact was required and added.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes.
      N/A: no public shape change.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      Zero new module edges.
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      N/A: no CLI change.
      and non-interactive with explicit confirmation bypass when relevant.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      N/A: docs already document the fixed behavior.
      current-state synchronized when public guidance changes.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded or marked N/A with reason.
- [x] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.
      Build run; fixtures:check passed.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the named commands | all green; see Verification evidence |
| Exact per-PR task ownership | yes | Record the exact PR | PR #398 |
| Pre-solution issue challenge verdict | yes | Record verdict | `valid`, reproduced, recorded above |
| Repro escalation ladder | yes | Record rungs | source-level repro succeeded; higher rungs N/A |
| Bug reproduced before fix | yes | Record failing repro | both new tests failed `expected 'BUILDING' to be 'CLEARING'` pre-fix |
| Targeted behavior verification | yes | Focused test | `npx vitest run convex/orm/count.test.ts` 35/35; `runtime.vitest.ts` 5/5 |
| TypeScript or typed config changed | yes | Typecheck | `bun typecheck` 5/5 tasks green |
| Package exports or file layout changed | yes | Package build | `bun --cwd packages/kitcn build` OK (71 files) |
| Package manifests, lockfile, or install graph changed | no | N/A | no manifest or lockfile change |
| Agent rules or skills changed | no | N/A | no `.agents/**` change |
| Workspace authority proof | yes | Record cwd | all commands run from repo root `/Users/mikey/conductor/workspaces/kitcn/nairobi`; behavior is owned by `packages/kitcn` and exercised by the `convex` workspace harness |
| Browser surface changed | no | N/A | Convex server runtime only |
| Browser final proof | no | N/A | no browser surface |
| UI walkthrough | no | N/A | no UI or rendered output changed |
| Scaffold or fixture output changed | no | N/A | `bun run fixtures:check` passed (exit 0) with no sync needed |
| Package behavior or public API changed | yes | Changeset | `.changeset/wild-donkeys-shave.md` (patch) |
| Docs and kitcn skill sync changed | no | N/A | docs already document the fixed behavior; see Findings |
| Docs or content changed | no | N/A | no doc edit required |
| High-risk mini gate | yes | Record note | see Open risks |
| Agent-native review for agent/tooling changes | no | N/A | no agent-native surface touched |
| Local install corruption suspected | yes | Reinstall/rerun | 6 vitest failures were stale `packages/kitcn/dist`; `bun --cwd packages/kitcn build` then rerun -> green |
| Commit created | yes | Stage whole checkout, commit | `97ac0577` fix(orm): drain CLEARING aggregate index before rebuilding it |
| PR create or update | yes | Run check, push, open PR | pushed to `origin/fix/drain-clearing-index-before-rebuild`; PR #398. `bun check` green except `test:runtime`, blocked by sibling workspaces holding port 3211 |
| Task-style PR body verified | yes | `gh pr view --json body` | verified: auto-release block, `🐛 Fixes #383`, plan line, `🟢 95-100%`, exact table header, Outcome/Caveat/Design/Verified sections, no self-link |
| PR task evidence verified | yes | Verify plan line and PR ownership | plan path resolves at PR head and names PR #398 |
| PR proof image hosting | no | N/A | no browser proof in body |
| GitHub issue sync-back | yes | Sync issue | `🐛 Fixes #383` in the PR body closes it on merge |
| Final handoff contract | yes | Fill fields | see Final handoff contract |
| Final lint | yes | Run lint | `bun lint:fix` then `bun lint` clean (936 files) |
| Output budget discipline | yes | Verify | all runs tail-capped; cross-file audit delegated to a background workflow |
| Timed checkpoint | no | N/A | no duration requested |
| Autoreview for non-trivial implementation changes | yes | Run until clean | `autoreview --mode local --engine claude` -> "autoreview clean: no accepted/actionable findings" |
| Goal plan complete | yes | Run check-complete | see Verification evidence |
| Public API / package boundary proof | yes | Source audit | no public export changed; all new symbols internal to `orm/aggregate-index` |
| Convex bundle/import proof | yes | Audit graph | zero new module edges; `./schema` was already imported by both touched runtimes |
| CLI/scaffold/generated proof | no | N/A | no CLI or generated output changed |
| Release artifact classification | yes | Classify | published package runtime behavior change -> changeset required |
| Published package changeset | yes | Add changeset | `.changeset/wild-donkeys-shave.md` |
| No release artifact | no | N/A | artifact was required and added |
| Package typecheck/build/test | yes | Owning package checks | `bun --cwd packages/kitcn build`, `bun typecheck`, `bun test` 1288/0 |
| Fixture/scaffold generation | no | N/A | `fixtures:check` passed without sync |
| Docs/package skill sync | no | N/A | no public guidance changed |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue attachment read; source sites located | implementation |
| Reproduction | complete | 2 failing tests: `expected 'BUILDING' to be 'CLEARING'` | implementation |
| Implementation | complete | drain-first branch + `setCountState` invariant | verification |
| Verification | complete | vitest 852, bun test 1288, typecheck, lint, build, fixtures:check | closeout |
| Commit / PR / GitHub sync | complete | commit `97ac0577`, PR #398 | closeout |
| Closeout | complete | autoreview clean | final response |

Findings:
- Reproduced exactly as filed: both new tests fail pre-fix with
  `AssertionError: expected 'BUILDING' to be 'CLEARING'`.
- Broader than filed. The issue frames this as rank-only ("for `target.kind === 'rank'`,
  `needsMetricBackfill` is unconditionally `true`"), but the metric path takes the same
  branch whenever `requiresMetricBackfill` returns true, so `aggregateIndex` is affected
  too. Both are covered.
- More severe than "benign today". `clearCountIndexChunk`'s bucket and extrema phases are
  the only sweep that removes rows no member backs; the refcount-driven deletes never
  touch them. Abandoning the clear skips that sweep, and `readKeyExtrema`
  (`runtime.ts:2483`) has no liveness predicate while `applyExtremaDelta`
  (`runtime.ts:2143`) only deletes at `count <= 0`, so a surviving row is returned by
  `min()`/`max()` on an index that reports READY. Verified by reading both sites.
- Docs were already right. `www/content/docs/migrations/aggregate.mdx:204` documents
  "`CLEARING` indexes (rebuild or prune in progress) finish draining first" under the
  `resume` heading — the exact broken path. Drain-first is therefore the only fix that
  reconciles code with the shipped contract; the issue's "stay CLEARING" alternative
  would have contradicted it. No doc edit needed.
- The ORM's `rankTreeTable` (`orm/aggregate-index/schema.ts:123`) has no `deletionStack`
  field, so the issue's literal "non-empty deletion stack" cannot be persisted on this
  path. The invariant is expressed as "no tree row survives", which is what
  `deleteTrees` actually reports done on.
- Out of scope, worth filing separately: `backfill.ts:636-638`'s
  `keyDefinitionHash` mismatch does `needsRebuild += 1; continue;`, skipping
  `scheduleChunk`. A CLEARING index that also changes key shape is left parked with
  nothing scheduled and the write barrier engaged. Fixing it changes kickoff counters
  and CLI strict-mode exit behavior, so it needs its own test and changeset.

Decisions and tradeoffs:
- Drain-first over "stay CLEARING": matches `rebuild` mode (`backfill.ts:612`) and
  `chunk` (`backfill.ts:804`), reuses the shared `clearBudget` so a multi-index kickoff
  still cannot exceed per-mutation limits, and keeps the documented `resume` contract.
- Invariant as a read-only probe, not the trust flag the issue proposed. A
  `drainFinished: true` argument would be set at the same call site that forgets to
  drain, so it verifies nothing. `isIndexStateDrained` re-reads the same emptiness
  conditions the clear chunks report `done` on, needs no call-site changes, and is the
  only shape that would have caught the original bug.
- Guard placed in `setCountState` rather than a backfill helper. A helper only protects
  callers that remember to call it; the bug was a branch that called nothing. Every
  status write already funnels through `setCountState`, so that is the structural choke
  point.
- Cost is negligible: the probe runs only on the CLEARING -> non-CLEARING edge, at most
  once per clear campaign, and short-circuits on the first member row.
- `rankAggregateName` hoisted to `schema.ts` so the state writer and the rank runtime
  share one definition instead of duplicating the string format. No import cycle:
  `runtime.ts` cannot import `rank-runtime.ts`, but both already import `./schema`.

Implementation notes:
- `packages/kitcn/src/orm/aggregate-index/backfill.ts` — `metricChanged` branch drains
  via `drainIndexClear` with the shared `clearBudget` when the index is CLEARING, then
  writes `cleared ? BUILDING : CLEARING`. Falls through to `scheduleChunk` unchanged.
- `packages/kitcn/src/orm/aggregate-index/runtime.ts` — new `isIndexStateDrained` plus a
  guard in `setCountState` that throws on any CLEARING -> non-CLEARING write while
  stored state survives.
- `packages/kitcn/src/orm/aggregate-index/schema.ts` — `rankAggregateName` hoisted here.
- `packages/kitcn/src/orm/aggregate-index/rank-runtime.ts` — uses the hoisted helper.
- `convex/orm/count.test.ts` — two end-to-end regression tests (rank + metric).
- `packages/kitcn/src/orm/aggregate-index/runtime.vitest.ts` — new; 5 unit tests for the
  invariant, including both negative (no false trip) cases.

Review fixes:
- From the background audit, before autoreview:
  - Corrected the rank comment in `isIndexStateDrained`: the ORM `rankTreeTable` has no
    `deletionStack` column, so the comment now describes what `deleteTrees` actually
    reports.
  - Added `expect(resumed).toMatchObject({ scheduled: 1, needsRebuild: 0, ... })` to both
    regression tests. Without it, a "fix" that parks the index in CLEARING but skips
    `scheduleChunk` would pass while stalling the drain forever.
  - Added `runtime.vitest.ts`, because after the fix no public path can reach the guard,
    which would otherwise have shipped untested.
- `autoreview --mode local --engine claude`: clean, no accepted/actionable findings.
  Its two stated residual risks were checked directly: `clearCountIndexChunk` does drain
  extrema before reporting `done`, and `drainIndexClear` consumes the shared
  `clearBudget` exactly as `rebuild` mode does.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
All commands run from repo root `/Users/mikey/conductor/workspaces/kitcn/nairobi`.
- Red: `npx vitest run convex/orm/count.test.ts -t "mid-drain"` -> 2 failed,
  `AssertionError: expected 'BUILDING' to be 'CLEARING'` at both new tests.
- Green: `npx vitest run convex/orm/count.test.ts` -> 35 passed.
- Guard: `npx vitest run packages/kitcn/src/orm/aggregate-index/runtime.vitest.ts` -> 5 passed.
- Full vitest: `npx vitest run` -> 79 files, 852 passed, 2 skipped, no type errors.
- Bun suite: `bun test` -> 1288 pass, 0 fail, 145 files.
- `bun typecheck` -> 5/5 tasks successful.
- `bun lint:fix` then `bun lint` -> clean, 936 files.
- `bun --cwd packages/kitcn build` -> complete, 71 files.
- `bun run fixtures:check` -> exit 0, "fixtures/vite-auth matches fresh
  `kitcn init -t vite && kitcn add auth` output".
- `autoreview --mode local --engine claude` -> "autoreview clean: no
  accepted/actionable findings".
- Known-flaky, unrelated: one `bun test` run showed
  `ConvexAuthProvider types > accepts a Better Auth client with organization plugins`
  failing at 5421ms under full-suite load. It passes in isolation in 2.18s and has zero
  references to aggregates; 3 of 4 full runs were clean.
- Autoclosure focused replay: 40 state-machine and aggregate end-to-end tests
  pass; no type errors.
- Autoclosure branch P1 autoreview: clean, patch correct at 0.93 confidence.
- Deslop: 169 findings before and after, score unchanged, with zero occurrence
  changes.
- Autoclosure final `bun lint:fix && bun --cwd packages/kitcn build && bun
  check` replay exited 0, including fixture parity and every runtime scenario.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| rank index, metric change mid-clear | `needsMetricBackfill` is unconditionally true for rank, so a CLEARING rank index always takes the BUILDING write | `convex/orm/count.test.ts` "keeps a rank index CLEARING when a metric change lands mid-drain" | `BUILDING` with 10 members and a live tree surviving | stays `CLEARING`, drain resumes, reaches READY with count 12 / sum 24 | test red then green | done |
| metric index, metric change mid-clear | implied by the shared branch; not called out in the issue | `convex/orm/count.test.ts` "keeps a metric index CLEARING when a metric change lands mid-drain" | `BUILDING` with members and buckets surviving | stays `CLEARING`, reaches READY with count 12 / sum 24 | test red then green | done |
| liveness of the parked index | not raised in the issue | counter assertion on the kickoff result | n/a | `scheduled: 1`, `needsRebuild: 0`, loop reaches READY | both regression tests | done |
| invariant: no undrained exit from CLEARING | "the invariant to assert is that no state transitions out of CLEARING into BUILDING with a non-empty deletion stack" | `packages/kitcn/src/orm/aggregate-index/runtime.vitest.ts` | no guard existed | throws on surviving member / bucket / extrema / rank tree, for BUILDING and READY alike | 5 passing unit tests | done |
| no false positives on the guard | n/a | same file | n/a | drained rank index advances; a rank member never blocks the metric index | 2 positive-path tests | done |

Final handoff contract:
- Commit line: `97ac0577` on `fix/drain-clearing-index-before-rebuild`.
- PR line: https://github.com/udecode/kitcn/pull/398
- Issue line: closes #383 on merge via `🐛 Fixes #383`.
- Confidence line: 95-100%.
- Flow table:
  - Reproduced: tests red (2 new, `expected 'BUILDING' to be 'CLEARING'`), browser N/A
  - Verified: tests green (vitest 852, bun 1288, 7 new), browser N/A
- Browser check: N/A: Convex server runtime, no rendered output.
- Outcome: a CLEARING aggregate or rank index now finishes draining before a metric
  change restarts its build, and `setCountState` refuses any undrained exit from
  CLEARING.
- Caveat: the `keyDefinitionHash` mismatch liveness gap at `backfill.ts:636-638` is real
  but out of scope; it needs its own counter/CLI-behavior decision.
- Design:
  - Chosen boundary: drain-first in the kickoff branch, plus the invariant at
    `setCountState`, the single choke point every status write already passes through.
  - Why not quick patch: fixing only the one branch leaves the bug class open; the next
    branch to write BUILDING would reintroduce it silently.
  - Why not broader change: the shared-clear refactor and the `keyDefinitionHash`
    liveness gap change kickoff counters and CLI exit behavior, so they belong in their
    own change.
- Verified: 7 new tests, full repo suites, build, lint, typecheck, fixtures:check,
  autoreview clean.
- PR body verified: `gh pr view 398 --json body` matches the PR #270 task-style contract.

Task-style PR body contract:
- Preserve any existing `<!-- auto-release:start -->` block. If a changeset is
  part of the diff and repo policy expects auto release, include that block.
- Use the accepted PR #270 visual format. The body starts with an emoji
  issue/fix line, for example `🐛 Fixes #123` or `🐛 Fixes ➖ N/A`, then
  `🧭 Task plan: docs/plans/<plan>.md`, then an emoji confidence line like
  `🟢 95-100% confidence`.
- Use this exact table header: `| Phase | 🧪 Tests | 🌐 Browser |`.
- Use `Reproduced` and `Verified` rows. Mark passing proof with `🟢`, repro or
  failing proof with `🔴`, and non-applicable cells with `➖ N/A`.
- Use bold emoji section headings: `**✅ Outcome**`, `**⚠️ Caveat**`,
  `**🏗️ Design**`, and `**🧪 Verified**`.
- Never include a line that links to the current PR itself. The current PR URL
  belongs in the final response, not in its own description.
- Do not replace this with a generic `Summary` / `Verification` PR body, an
  adaptive prose body from a git helper skill, plain `## Outcome` sections, or
  an unrelated generated badge footer unless the caller or repo template
  explicitly asks for it.
- Proof is `gh pr view --json body` output or a concise source-backed summary
  of that output.

Final handoff / sync:
- Commit: `97ac0577`, plus a follow-up commit recording PR #398 in this plan.
- PR: #398.
- Issue: #383, closed on merge by the PR body.
- Browser proof: N/A.
- Caveats: `keyDefinitionHash` liveness gap left for a follow-up. Two unrelated
  ~5s-timeout flakes were seen under the contributor's full-suite load
  (`ConvexAuthProvider types`, `package intent metadata`); the autoclosure full gate
  passed, including every runtime scenario.

Timeline:
- 2026-08-21T14:16:17.034Z Task goal plan created.
- 2026-08-21 Reproduced with 2 failing tests (rank + metric).
- 2026-08-21 Fix landed: drain-first branch + `setCountState` invariant.
- 2026-08-21 Background audit returned; 3 recommendations applied.
- 2026-08-21 Full verification green; autoreview clean.
- 2026-08-21 User prompted for a PR. Branch renamed, committed `97ac0577`, pushed, PR #398 opened.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Implementation, verification, commit/PR/GitHub sync, closeout |
| What is the goal? | Drain a CLEARING aggregate index before a metric change restarts its build, and assert that invariant at the state writer |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
High-risk note (runtime behavior change in a published package):
- Realistic failure mode: the new guard throws on a transition the drain believed was
  complete, aborting a backfill mutation. That requires `drainIndexClear` reporting
  `done` while stored state survives, i.e. the two conditions drifting apart.
- Proof plan: `runtime.vitest.ts` pins both directions of the guard, and the two
  end-to-end tests drive the real drain-to-READY loop, so a drift would surface as
  either a stalled loop or a false trip in CI.
- Why the boundary is right: `setCountState` is the only writer of
  `aggregate_state.status`, so it is the one place the invariant cannot be bypassed by a
  future branch.
Remaining risk:
- `backfill.ts:636-638` can still park a CLEARING index with no chunk scheduled when the
  key definition also changed. Out of scope here; recommended as a separate issue.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
