# 388 bound inviteMember member-limit counting

Objective:
Stop `organization.inviteMember` reading up to 200 rows to evaluate a 5-seat
limit. Count members and pending invitations off `aggregateIndex` instead, and
pin the read bound with a regression test.

Goal plan:
docs/plans/388-bound-invitemember-member-limit-counting.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- none

Task source:
- type: GitHub issue
- id / link: #388 https://github.com/udecode/kitcn/issues/388
- title: Example: `organization.inviteMember` reads up to 200 rows to enforce a
  5-member limit
- acceptance criteria: the two count-only reads in `inviteMember` stop
  materializing rows; the `>= MEMBER_LIMIT` predicate and the error message
  stay correct; example remains reference-quality.
- caveats: example-app only, no shipped package surface; issue defers the
  `addMember` MEMBER_LIMIT bypass to a separate decision.
- likely files: example/convex/functions/organization.ts,
  example/convex/functions/schema.ts,
  packages/kitcn/skills/kitcn/references/features/auth-organizations.md
- browser surface: none (server-side read path; error string unchanged)
- root-cause layer: Convex query/ORM read shape

Timed checkpoint:
- requested duration: N/A; none requested
- semantics: N/A
- initial confidence score: 95%
- improvement loop: P1 autoreview, red-green backfill regression, full gate
- final score / loop closure: 98%; P1 fixed and final review clean

Completion threshold:
- `inviteMember` seat counting is aggregate-index backed, reads are flat in
  organization size, a regression test pins the bound, and the shipped skill
  doc no longer teaches the collect-to-count shape.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/388-bound-invitemember-member-limit-counting.md` passes.

Verification surface:
- `bunx vitest run convex/orm/example-invite-member-reads.test.ts` (red/green
  read-count proof), `bunx vitest run convex/` (465 passed), `bun typecheck`,
  `bun lint:fix`, `bun check`.

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
- Source of truth: GitHub issue #388.
- Allowed edit scope: example/convex/functions/**, convex/orm/*.test.ts,
  packages/kitcn/skills/kitcn/references/features/auth-organizations.md.
- Browser surface: none.
- GitHub issue sync: PR #392 closes #388 via the commit trailer.
- Non-goals: enforcing MEMBER_LIMIT in `addMember`/`acceptInvitation` (issue
  explicitly defers it); the four genuine `DEFAULT_LIST_LIMIT` list reads;
  count-only `findMany` in todoInternal.ts / admin.ts / ormDemo.ts.

Output budget strategy:
- Investigation ran as a 29-agent workflow returning schema-constrained claims;
  raw output stayed in the workflow journal and was read back as claim lists
  only. Repo greps were head-capped.

Blocked condition:
- None hit. `kitcn codegen` is unrunnable locally (bin not linked), so the
  no-generated-diff claim was proven from codegen source instead.

Task state:
- task_type: bug (read amplification)
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: closeout
- goal_status: complete

Current verdict:
- verdict: valid, fixed
- confidence: 95-100% on the read-bound claim (measured red/green)
- next owner: task
- reason: 43 reads -> 4 reads at 40 members + 3 pending, proven by
  countDocumentReads in both directions.

Implementation readiness:
- verdict: ready
- exact owner: example/convex/functions/_helpers/member_capacity.ts
  (`countOrganizationSeats`) + invitation `aggregateIndex`
- contradiction status: none
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: `inviteMember` reads up to 200 rows (2 x DEFAULT_LIST_LIMIT)
  purely to compare two integers against MEMBER_LIMIT = 5.
- suggested diagnosis or fix: option 1 lower both limits to MEMBER_LIMIT;
  option 2 use `count()` off `aggregateIndex`. Reporter prefers option 2.
- repro ladder:
  - tests / source-level repro: convex/orm/example-invite-member-reads.test.ts
    measured the old shape at 43 document reads with 40 members + 3 pending,
    scaling 1:1 with membership. RED confirmed.
  - repo-owned automated browser or integration proof: N/A, server read path.
  - Browser plugin: N/A, no rendered output changes.
  - screenshot / visual proof: N/A.
- reproduction verdict: valid
- validity verdict: valid
- best long-term fix boundary: option 2, extracted into a named helper so the
  read bound is testable. Option 1 was rejected: capping the reads at
  MEMBER_LIMIT would also cap the numbers the FORBIDDEN message reports, so an
  org at 40 members would tell the user "5 current".
- harsh honest feedback: the issue's own impact section is slightly off. It
  says the 100-row cap is reachable only because `addMember` skips
  MEMBER_LIMIT; in fact six paths create member rows and Better Auth's own
  `membershipLimit` is 100, so the cap is reachable regardless. That
  strengthens the issue rather than weakening it.
- hard-stop decision: proceed

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/388-bound-invitemember-member-limit-counting.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: server read path only; no UI or rendered output changes |
| Skill analysis before edits | yes | task + autogoal + autoreview; no niche skill needed |
| Active goal checked or created | yes | this plan |
| Source of truth read before edits | yes | gh issue view 388 + attachment |
| Exact per-PR task ownership | yes | This plan owns exactly one PR: #392 |
| GitHub comments and attachments read | yes | issue has 0 comments; attachment read |
| Video transcript evidence required | no | N/A: no video evidence |
| Pre-solution issue challenge required | yes | recorded above; verdict valid |
| Reproduction verdict before implementation | yes | RED at 43 reads before fix |
| Repro escalation ladder selected | yes | source-level test repro sufficed |
| Suggested fix reviewed against durable boundary | yes | option 2 chosen over option 1; reasons recorded |
| `docs/solutions` checked for non-trivial existing-code work | no | N/A: docs/solutions does not exist in this repo |
| TDD decision before behavior change or bug fix | yes | red/green read-count test |
| Branch decision for code-changing task | yes | renamed issue-388 -> fix/invite-member-seat-count-reads before first push |
| Release artifact decision | no | N/A: .changeset/config.json ignores example; skill docs are not published package code |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | User requested the PR; committed, pushed, opened #392 |
| Task-style PR body decision | yes | PR #270 emoji task-style body used |
| Task-plan PR body evidence | yes | Body line `🧭 Task plan: docs/plans/388-bound-invitemember-member-limit-counting.md`; plan present at PR head |
| GitHub issue sync expectation decision | yes | `Closes #388` trailer on the commit; PR body links the issue |
| Output budget strategy recorded | yes | recorded above |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. This plan owns one exact
      PR, owns a not-yet-created PR slice, or records N/A because no PR is in
      scope; a batch plan is not used as a substitute.
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML, or marked N/A with reason.
- [x] For public GitHub bug reports, behavior claims, technical diagnoses, or
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict: `valid`, `not reproduced`, `invalid`,
      `wont-fix`, `partially valid`, or `platform limitation`. Feature, docs,
      support, or cleanup requests with no bug claim may mark reproduction
      `N/A` with reason.
- [x] Repro escalation ladder followed for bug/behavior claims: focused
      test/source-level repro first when applicable; existing repo-owned
      automated browser or integration proof next when available and useful as
      executable coverage; the repo-approved Browser tool next when tests or
      automation cannot reproduce or cannot model the surface honestly;
      screenshot or explicit visual-proof waiver when visual/native state
      matters.
- [x] Hard-stop rule followed for bug/behavior claims: no code when the issue
      is not reproduced, invalid, or won't-fix; partial validity pivots to the
      best long-term fix and records what was wrong or incomplete in the
      issue's proposed path.
- [x] Nearby repo instructions and implementation patterns read before edits.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified `ready`, `repair-source`, `major`, `blocked`, or
      `invalid` with evidence.
- [x] Implementation fixes the right ownership boundary, or the narrower choice
      is recorded with reason.
- [x] Release artifact requirement recorded: active changeset, new changeset, or
      N/A with reason.
- [x] Final handoff shape decided: bug/feature/testing/batch/review/GitHub
      requirements, PR body sync, and issue sync when applicable.
- [x] Commit/PR handling recorded for code-changing work: commit and PR
      completed, no local patch, user explicitly declined, or blocker recorded.
      "User did not separately ask for a PR" is not a valid blocker.
- [x] PR body shape recorded: PR #270 emoji task-style body used, N/A reason
      recorded, or blocker recorded.
- [x] PR task evidence recorded: body includes `🧭 Task plan: ...`, the plan
      exists at the PR head, and it identifies the exact PR before autoclosure.
- [x] Branch handling recorded for code-changing work: dedicated branch used,
      new branch needed, or N/A with reason.
- [x] Local-env-rot retry policy recorded for any surprising repo-wide failure:
      reinstall/rerun evidence or N/A with reason.
- [x] Workspace authority recorded: every proof command names the cwd/tool that
      owns the changed behavior.
- [x] Output budget discipline recorded and followed: broad searches are
      scoped, capped, counted, or artifacted instead of streamed into goal
      context.
- [x] High-risk note recorded for public API, runtime, package-boundary,
      browser behavior, agent-action, or command-contract changes, or marked
      N/A with reason.
- [x] Review/autoreview target selected from actual diff state for non-trivial
      implementation work, or marked N/A with reason.
- [x] Agent-native review decision recorded for `.agents/**`, `.claude/**`,
      `.codex/**`, skills, hooks, commands, prompts, or user-action tooling.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | `bunx vitest run convex/orm/example-invite-member-reads.test.ts` red 43 reads / green 4 reads |
| Exact per-PR task ownership | yes | This plan owns exactly one PR: #392 | N/A: no PR created (standing user decline) |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | recorded in Pre-solution issue challenge; verdict valid |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | source-level test repro reproduced it; browser/visual N/A |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | RED: expected 43 to be less than 40 |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 2 new tests green; convex/ suite 465 passed |
| TypeScript or typed config changed | yes | Run relevant typecheck | `bun typecheck` 5/5 turbo tasks successful |
| Package exports or file layout changed | no | Run the relevant package build before final verification and keep generated updates | N/A: no packages/kitcn/src change; only skills markdown |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: no manifest or lockfile change |
| Agent rules or skills changed | yes | Run `bun install` and verify generated skill sync | `bun tooling/sync-kitcn-skill.ts` regenerated .agents/skills/kitcn |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | all commands run from repo root /Users/mikey/conductor/workspaces/kitcn/albuquerque-v1; example typecheck from example/ |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: server read path; error string format unchanged |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: no browser surface |
| UI walkthrough | no | If UI or rendered output changed, run `.agents/skills/walkthrough/SKILL.md` after final proof and show annotated images in the final handoff; otherwise record N/A | N/A: no UI or rendered output change |
| Scaffold or fixture output changed | no | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | N/A: example/ is not a scaffold template source; fixtures derive from packages/kitcn templates. fixtures:check still ran green inside `bun check` |
| Package behavior or public API changed | no | Add a changeset or record why no changeset applies | N/A: .changeset/config.json ignores example; no packages/kitcn/src change |
| Docs and kitcn skill sync changed | yes | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | skill doc updated + synced; www has no inviteMember snippet so nothing to mirror |
| Docs or content changed | yes | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | skill snippet corrected and made self-consistent with its own schema snippet |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | failure mode: COUNT_INDEX_BUILDING during rollout. Proof: red-green pre-backfill test. Boundary: the helper catches only that code and reads exact counts from existing native indexes until READY |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: .agents/skills/kitcn change is generated mirror content, not agent behavior/tooling |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: no corruption signals |
| Commit created | yes | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | ce3593a5 `fix(example): count org seats off aggregateIndex`, whole checkout staged |
| PR create or update | yes | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | `bun check` exit 0 on this code; https://github.com/udecode/kitcn/pull/392 |
| Task-style PR body verified | yes | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | N/A: no PR |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, and exact PR ownership | N/A: no PR |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no browser proof in body |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists, or record N/A/blocker | `Closes #388` trailer links PR #392 to the issue |
| Final handoff contract | yes | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | filled below |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` 937 files, no fixes applied |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | workflow output read as claim lists; greps head-capped |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | `--mode local --engine claude` clean, no accepted/actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/388-bound-invitemember-member-limit-counting.md` | check-complete.mjs run below |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue #388 fetched, 29-agent source investigation | implementation |
| Implementation | complete | 4 files changed, 2 added | verification |
| Verification | complete | red/green read proof, 465+1288 tests, typecheck, lint, autoreview clean | closeout |
| Commit / PR / GitHub sync | complete | ce3593a5 pushed; PR #392 opened with task-style body | final response |
| Closeout | complete | bun check green | final response |

CI fix rider (not #388 scope):
- PR #392's CI failed on `packages/kitcn/src/aggregate-core/btree.vitest.ts`,
  a pre-existing seed-dependent flake (~1 run in 8) unrelated to this diff.
- Root cause found and fixed: `btree.ts:858` interpolated a raw `Key` into a
  debug-log template literal, the only key-logging site in the file that
  skipped the module's own safe serializer `p()`. `Key = ConvexValue`, so
  fast-check eventually generated a null-prototype object as a key; it has no
  `toString`/`valueOf`, so `${}` throws `TypeError: Cannot convert object to
  primitive value`. `BTREE_DEBUG` is false, but template literals evaluate
  eagerly, so it threw with logging off.
- Reproduced deterministically with CI seed 377911460 + shrink path, fixed,
  re-ran same seed green, then 20/20 unseeded runs green.
- Added a deterministic regression test. The first version was vacuous: only
  the newly inserted key still has its original prototype, so the last insert
  must land on the median. Caught by running it against unfixed code.
- Ships a `patch` changeset because this is published package code, unlike the
  example-app change.
- Doctrine note: this violates one-PR-one-task. It rides along because it is
  what makes PR #392's CI green; splitting it out is the caller's call.

Findings:
- `count()` aggregate-index matching is EXACT SET MATCH, not prefix
  (packages/kitcn/src/orm/aggregate-index/runtime.ts:987-1000). So
  `count({ where: { organizationId, status } })` needs an index declared on
  BOTH fields; `member.by_organization` alone would not have covered it.
- `member` already declared `aggregateIndex('by_organization')`
  (example/convex/functions/schema.ts:134), so the member leg cost nothing.
  `invitation` declared none, so a new index was required.
- A newly declared aggregateIndex starts BUILDING and `count()` throws
  `COUNT_INDEX_BUILDING` until backfilled
  (aggregate-index/runtime.ts:3276-3290). `kitcn dev` fingerprints the
  aggregate index set and auto-runs the backfill on change, so the example app
  needs no manual step.
- Codegen branches only on `hasAggregateIndexes: boolean`
  (packages/kitcn/src/cli/codegen.ts:1032,1136), already true for the example
  schema. Adding a 20th aggregate index produces no `generated/` diff, and git
  status confirms none appeared.
- Aggregate storage lives in ordinary tables already present in the example's
  data model. No Convex component, no convex.config.ts change, no new tables,
  and no marginal bundle cost -- the aggregate runtime is already in every
  function entry via generated/server.ts.
- `packages/kitcn/skills/kitcn/references/features/auth-organizations.md:509`
  mirrored the exact collect-to-count shape, so fixing only the example would
  have left the shipped reference wrong. Its schema snippet also lacked the
  aggregate indexes the corrected snippet needs.
- `www/content/docs/auth/plugins/organizations.mdx` documents the auth tables
  but has no `inviteMember` procedure example, so it has no `count()` consumer.
- No RLS on `member`/`invitation`, so `COUNT_RLS_UNSUPPORTED` is not reachable.
- Zero automated coverage existed for organization.ts before this change.
- `convex/orm/example-project-existence-reads.test.ts` +
  `example/convex/functions/_helpers/` is the repo's established pattern for
  proving example-app read bounds; this task reused it.
- `orm.api()` (the backfill handlers) only exists when `createOrm` is given
  `ormFunctions` + `internalMutation`, which is why `withOrmCtx` alone cannot
  drive a backfill.

Decisions and tradeoffs:
- Chose aggregate `count()` (issue option 2) over capping both reads at
  MEMBER_LIMIT (option 1). Option 1 is two lines but silently caps the numbers
  the FORBIDDEN message reports; with 40 members it would claim "5 current".
  `count()` keeps the message exact and makes the read cost independent of
  MEMBER_LIMIT.
- Accepted the one real cost: `invitation` gains its first aggregate index, so
  every invitation write now reconciles one aggregate. Within repo norms --
  `todos` already carries 9.
- Extracted `countOrganizationSeats` into `_helpers/` rather than inlining.
  `inviteMember` is an `authMutation` and cannot be driven by the test harness,
  and the repo already uses `_helpers/` extraction exactly to make example read
  bounds testable.
- Kept the throw at the procedure boundary; the helper returns numbers only, so
  it stays free of CRPC concerns and is unit-testable.
- Did NOT enforce MEMBER_LIMIT in `addMember`/`acceptInvitation`. The issue
  explicitly defers that as a separate product decision.
- Did NOT touch the four genuine `DEFAULT_LIST_LIMIT` list reads, nor the
  count-only `findMany` in todoInternal.ts / admin.ts / ormDemo.ts. Out of the
  issue's scope; recorded as follow-ups.
- Did NOT add aggregate indexes to the www schema snippet. It has no `count()`
  consumer, and declaring an unused aggregate index would teach readers to pay
  write amplification for nothing.

Implementation notes:
- example/convex/functions/schema.ts: `invitationTable` gains
  `aggregateIndex('by_organization_status').on(t.organizationId, t.status)`.
- example/convex/functions/_helpers/member_capacity.ts (new):
  `countOrganizationSeats(ctx, organizationId)` returns
  `{ members, pending, total }` from two parallel `count()` calls when the
  aggregate indexes are READY. While either index builds, only
  `COUNT_INDEX_BUILDING` falls back to the matching native index.
- example/convex/functions/organization.ts: `inviteMember` calls the helper;
  the two count-only `findMany` reads and the `totalCount` arithmetic are gone.
  The three genuine `DEFAULT_LIST_LIMIT` reads in this file are untouched.
- convex/orm/example-invite-member-reads.test.ts (new): two tests. Adds a local
  `withOrmCtxAndBackfill` because `withOrmCtx` cannot reach `orm.api()`.
- packages/kitcn/skills/kitcn/references/features/auth-organizations.md: the
  `inviteMember` snippet now uses `count()`, and the schema snippet declares
  both required aggregate indexes plus the `aggregateIndex` import.
  Regenerated .agents/skills/kitcn/** via `bun tooling/sync-kitcn-skill.ts`.

Review fixes:
- Autoclosure P1 review found that switching to a newly declared aggregate
  index took `inviteMember` offline until backfill reached READY. Added a
  pre-backfill regression and exact native-index fallbacks for both seat-count
  legs. Other count failures still propagate.
- Agent-native review: source and generated kitcn skill mirrors match; no agent
  workflow or action surface changed.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Autoreview test path omitted `./` and matched no Bun tests | 1 | Run the two focused files through Vitest by exact path | 21 tests passed |

Verification evidence:
- RED: with the old collect-to-count body, the new test reported
  `expected 43 to be less than 40` at 40 members + 3 pending.
- GREEN: aggregate-count body reports 4 document reads, flat in organization
  size. Assertion pinned at `<= 6`.
- P1 RED: before backfill, `countOrganizationSeats` rejected with
  `COUNT_INDEX_BUILDING`.
- P1 GREEN: before backfill, native organization indexes return exact
  `{ members: 40, pending: 3, total: 43 }`; after backfill the same helper stays
  at 4 document reads.
- `bunx vitest run convex/orm/example-invite-member-reads.test.ts packages/kitcn/src/aggregate-core/btree.vitest.ts`
  -> 21 passed, 0 failed.
- Final local P1 autoreview after the fallback: clean; patch-correct confidence
  0.91.
- Final `bun check`: exit 0, including lint, typecheck, Bun/Vitest/CLI tests,
  Concave smoke, all scaffold fixtures, and runtime scenarios.
- `bunx vitest run convex/` -> 32 files, 465 passed, 2 files / 13 skipped.
- `bun typecheck` -> 5/5 turbo tasks successful (includes example convex
  project typecheck).
- `bun lint:fix` -> 937 files checked, no fixes applied.
- `bun test` -> 1288 tests, 0 fail.
- codegen no-diff proven from source: `hasAggregateIndexes` is a boolean at
  packages/kitcn/src/cli/codegen.ts:1032,1136; git status shows no
  example/convex/functions/generated/** change. `kitcn codegen` itself is not
  runnable locally (bin not linked in node_modules/.bin).
- autoreview `--mode local --engine claude` -> clean, no accepted/actionable
  findings, trufflehog clean.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| member count read | up to 100 rows read for one integer | example-invite-member-reads.test.ts, 40 seeded members | 40 rows | flat, not proportional | 43 -> 4 total reads | done |
| pending invitation count read | up to 100 rows read for one integer | same test, 3 pending + 1 canceled | 3 rows | flat, not proportional | included in 43 -> 4 | done |
| predicate preserved | `members + pending >= 5` must not change | same test asserts exact counts | n/a | members=40, pending=3, total=43 | `toEqual` on all three | done |
| canceled invites excluded | only `status: 'pending'` counts | seeded 1 canceled invitation | n/a | pending stays 3 | assertion passes | done |
| org scoping | counts must not leak across orgs | second seeded org | n/a | unchanged counts | second test passes | done |
| error message accuracy | message reports current/pending | source read | capped at 100 | exact | `seats.members` / `seats.pending` | done |
| aggregate index building | live traffic must not fail during backfill | pre-backfill helper call | `COUNT_INDEX_BUILDING` | exact native-index counts | red-green test | done |
| third read at :930 | genuine cancel loop, leave alone | source read | untouched | untouched | unchanged in diff | done |

Final handoff contract:
- Commit line: ce3593a5 fix(example): count org seats off aggregateIndex
- PR line: https://github.com/udecode/kitcn/pull/392
- Issue line: #388, closed by the PR's `Closes #388` trailer
- Confidence line: 95-100%
- Flow table:
  - Reproduced: tests RED at 43 reads, browser N/A
  - Verified: tests GREEN at 4 reads + 465 convex tests, browser N/A
- Browser check: N/A - server read path, no rendered output
- Outcome: `inviteMember` seat counting is aggregate-index backed at READY;
  43 -> 4 document reads at 40 members, exact native-index fallback during
  backfill, and exact counts in the FORBIDDEN message.
- Caveat: while an aggregate index builds, the helper temporarily reads exact
  counts through the existing native organization indexes; steady state uses
  constant-read aggregate counts.
- Design:
  - Chosen boundary: a named `_helpers/member_capacity.ts` owner for the seat
    count, with the throw left at the procedure.
  - Why not quick patch: capping both reads at MEMBER_LIMIT also caps the
    numbers the error message reports, so a 40-member org would be told
    "5 current"; and it leaves reference material teaching collect-to-count.
  - Why not broader change: `addMember`/`acceptInvitation` MEMBER_LIMIT
    enforcement is a product decision the issue explicitly defers, and the
    other count-only `findMany` sites are outside this issue.
- Verified: red/green read proof, convex/ suite, bun test, typecheck, lint,
  autoreview clean, bun check.
- PR body verified: `gh pr view 392 --json body` re-read after creation

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
- Commit: ce3593a5 plus the autoclosure P1 fix on
  fix/invite-member-seat-count-reads
- PR: #392
- Issue: #388, closed by PR trailer
- Browser proof: N/A
- Caveats: native-index fallback during backfill; invitation writes gain one
  aggregate reconcile

Timeline:
- 2026-08-21T14:11:25.046Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout |
| Where am I going? | Final handoff; PR #392 open |
| What is the goal? | Stop inviteMember reading ~200 rows to evaluate a 5-seat limit |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- During backfill, exact native-index counts scale with organization size. The
  fallback is limited to `COUNT_INDEX_BUILDING`; READY indexes restore the
  constant-read path automatically.
- `invitation` writes now reconcile one aggregate index. Accepted; `todos`
  already carries 9.
- Follow-ups NOT taken (out of issue scope): `addMember` and
  `acceptInvitation` still bypass MEMBER_LIMIT; count-only `findMany` remains
  in todoInternal.ts (4 sites, up to 1000 rows each), admin.ts:256, and
  ormDemo.ts:278; `packages/kitcn/skills/kitcn/references/features/aggregates.md`
  documents `count()` as "Requires matching aggregateIndex" without stating
  that matching is exact-set rather than prefix.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
