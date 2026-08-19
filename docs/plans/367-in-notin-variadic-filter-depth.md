# 367 in notIn variadic filter depth

Objective:
Fix kitcn#367: `in`/`notIn` compile to a left-nested `$or`/`$and` chain whose
serialized JSON depth grows as 2N+1, so Convex rejects the query past ~64
values. Compile membership lists flat, in one shared compiler.

Goal plan:
docs/plans/367-in-notin-variadic-filter-depth.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: GitHub issue
- id / link: https://github.com/udecode/kitcn/issues/367 (0 comments)
- title: ORM: `in` / `notIn` compile to a left-nested `$or` chain (JSON depth
  2N+1), breaking queries past a few dozen values
- task type: bug (ORM query/mutation filter compilation)
- acceptance criteria: `in` produces a filter whose depth does not grow with the
  array length (the issue's first-choice expectation; the fallback "clear
  kitcn-side error naming the limit" is therefore not needed)
- caveats: reporter's secondary suggestion (drop the redundant multiProbe
  `postFilters` re-push) is REFUTED — see Findings
- likely files: orm/query.ts, orm/mutation-utils.ts, orm/insert.ts, new
  orm/convex-filter-compiler.ts
- browser surface: none (no UI or rendered output)
- root-cause layer: FilterExpression -> Convex `.filter()` compilation

Timed checkpoint:
- requested duration: pending
- semantics: pending
- initial confidence score: pending
- improvement loop: pending
- final score / loop closure: pending

Completion threshold:
- Serialized Convex filter depth is constant in the membership-list length for
  every entry point the issue names, proven by a test that fails on the old
  pairwise fold and passes on the fix.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/367-in-notin-variadic-filter-depth.md` passes.

Verification surface:
- `bun test packages/kitcn/src/orm/convex-filter-depth.test.ts` (new, 11 cases)
- `bun test` (1258 pass), `bun run test:vitest` (839 pass), `bun typecheck`,
  `bun lint:fix`, `bun --cwd packages/kitcn build`, `bun check`
- Source audit: zero `reduce((acc, cond)` folds remain in `packages/kitcn/dist`

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
- Source of truth: GitHub issue #367.
- Allowed edit scope: `packages/kitcn/src/orm/**`, one changeset.
- Browser surface: N/A — no UI or rendered output changes.
- GitHub issue sync: PR #371 links the issue via `Fixes #367`; a separate QA
  comment is deferred to the user.
- Non-goals: dropping the multiProbe `postFilters` re-push (refuted); fixing the
  separate update/delete divergences (temporal normalization, `isNull` vs
  absent field, post-fetch-only operators pushed into Convex).

Output budget strategy:
- Repo-wide audit ran as a background workflow writing to its own transcript;
  only structured summaries were read back. Long gates (`bun check`) redirect to
  `tmp/check.log` and are tailed.

Blocked condition:
- None encountered. PR creation is declined by standing user preference, not a
  blocker.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: fixed and verified
- confidence: 95-100%
- next owner: user (commit / PR decision)
- reason: every issue-listed case has a fresh red-then-green harness at the
  owning layer; no accepted review finding remains.

Implementation readiness:
- verdict: ready
- exact owner: FilterExpression -> Convex filter compilation, now owned once by
  `packages/kitcn/src/orm/convex-filter-compiler.ts`
- contradiction status: one resolved — the issue's suggested secondary fix
  contradicts `tryCompileIsNotNull`/`tryCompileNotIn` probe soundness; source
  settled it against the issue.
- source-listed cases complete: yes (all 6 rows of the issue's output table)

Pre-solution issue challenge:
- reporter claim: `in`/`notIn` on a non-id column compile to a left-nested
  `$or`/`$and` chain of serialized depth 2N+1; Convex rejects past a few dozen
  values; multi-probe promotion does not save it.
- suggested diagnosis or fix: (a) call the variadic `q.or(...)`/`q.and(...)`;
  (b) separately, drop the redundant per-probe `postFilters` re-push.
- repro ladder:
  - tests / source-level repro: DONE. Drove the real compilers against Convex's
    own `filterBuilderImpl` and measured depth 5/17/129/401 at n=2/8/64/200 —
    exactly the reporter's numbers. Then converted to a permanent bun test.
  - repo-owned automated browser or integration proof: N/A as regression proof.
    `convex-test` evaluates `$or`/`$and` recursively with no depth cap, so
    `convex/orm/**` is green before and after and cannot own this.
  - Browser plugin: N/A — no browser-rendered surface.
  - screenshot / visual proof: N/A — no visual output.
- reproduction verdict: reproduced exactly
- validity verdict: partially valid — primary claim valid, secondary suggestion
  refuted
- best long-term fix boundary: one shared compiler owning every combinator, so
  the fold cannot be reintroduced in one lane and missed in the other.
- harsh honest feedback: the report is unusually good — the diagnosis, the
  affected lines and the depth arithmetic are all correct, and it correctly
  predicted the promotion path would not save it. Two corrections. First, the
  suggested `postFilters` cleanup is unsafe: `tryCompileIsNotNull` opens an
  `lt(field, null)` probe that DELIBERATELY scans the missing-field key range,
  and only that post-filter rejects those rows, so dropping the re-push would
  silently return rows where the column was never written; `tryCompileNotIn`
  and `tryCompileAndInArray` fail the same argument for different reasons, and
  update/delete run their probes under a bounded `take(maxRows + 1)` that would
  start throwing spurious "matched more than N rows". Second, the report
  undercounts the blast radius: the same fold sits in `visitLogical`, so
  `where: { OR: [...] }` breaks at the same threshold with no `in` involved.
- hard-stop decision: proceed — implement the variadic fix at every fold site,
  discard the `postFilters` suggestion.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/367-in-notin-variadic-filter-depth.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | Before the first mutation, capture `.agents/skills/walkthrough/scripts/diff-baseline.mjs` or record N/A because UI/rendered output cannot change |
| Skill analysis before edits | yes | task + autogoal + changeset loaded; testing/tdd N/A (bug with a direct red/green harness) |
| Active goal checked or created | yes | this plan |
| Source of truth read before edits | yes | issue #367 attachment + `gh issue view 367` (0 comments) |
| Exact per-PR task ownership | yes | This plan owns exactly PR #371 |
| GitHub comments and attachments read | yes | 0 comments; attachment read in full |
| Video transcript evidence required | no | N/A: no video in source |
| Pre-solution issue challenge required | yes | see Pre-solution issue challenge |
| Reproduction verdict before implementation | yes | reproduced exactly before any edit |
| Repro escalation ladder selected | yes | source-level repro sufficed; browser N/A |
| Suggested fix reviewed against durable boundary | yes | primary adopted and widened; secondary refuted |
| `docs/solutions` checked for non-trivial existing-code work | yes | no `docs/solutions` directory in repo |
| TDD decision before behavior change or bug fix | yes | red/green proof recorded in Verification evidence |
| Branch decision for code-changing task | yes | renamed `issue-367` -> `fix/orm-in-notin-filter-depth` before first push (no remote, no PR existed, so no orphaning risk) |
| Release artifact decision | yes | `.changeset/large-pears-shake.md` (patch) |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | For verified code-changing work, default is commit, push, and PR because `task` explicitly requires it; N/A only for explicit user decline, no local patch, analytical/blocked/inconclusive work, or recorded blocker. |
| Task-style PR body decision | yes | PR #270 emoji task-style body |
| Task-plan PR body evidence | yes | `gh pr view 371` at head `d83053e0` returned exactly one body line: `🧭 Task plan: docs/plans/367-in-notin-variadic-filter-depth.md`; this plan owns PR #371 |
| GitHub issue sync expectation decision | yes | `Fixes #367` in the PR body; extra QA comment deferred to the user |
| Output budget strategy recorded | yes | see Output budget strategy |
| Package/API pack selected | yes | package-api |
| Public surface or package boundary identified | yes | no public export change; new module is internal to `orm/` |
| Convex entry/import graph impact identified | yes | new leaf imports only `filter-expression`; `import-graph.test.ts` green |
| CLI/scaffold/generated impact identified | yes | no scaffold source changed; Resend template is repaired by the fix |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` followed |
| Package build / fixture impact decision recorded | yes | package built; fixtures unaffected (no `init -t` change) |

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
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive with explicit confirmation bypass when relevant.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded or marked N/A with reason.
- [x] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | `bun test packages/kitcn/src/orm/convex-filter-depth.test.ts` -> 11 pass; RED 9 fail with the fold restored |
| Exact per-PR task ownership | yes | Record the exact PR and dedicated plan, or the not-yet-created single-PR slice | PR #371, this plan |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | reproduced + partially valid; primary fix adopted and widened, secondary refuted with source evidence |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | source-level repro sufficed; integration/browser lanes recorded N/A with reasons |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | depth 5/17/129/401 measured at n=2/8/64/200 against convex@1.44.0 `filterBuilderImpl` before any edit |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | new 11-case suite; red-then-green |
| TypeScript or typed config changed | yes | Run relevant typecheck | `bun typecheck` -> 5/5 successful |
| Package exports or file layout changed | yes | Run the relevant package build before final verification and keep generated updates | `bun --cwd packages/kitcn build` -> complete; no public export change |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: no manifest or lockfile change |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: no `.agents/**` or skill change |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | all commands run at `/Users/mikey/conductor/workspaces/kitcn/phnom-penh`, which owns `packages/kitcn` |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: no browser surface |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A |
| UI walkthrough | no | If UI or rendered output changed, run `.agents/skills/walkthrough/SKILL.md` after final proof and show annotated images in the final handoff; otherwise record N/A | N/A: no UI or rendered output changed |
| Scaffold or fixture output changed | no | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | N/A: no `init -t` template or scaffold source change; `fixtures:check` still ran green inside `bun check:ci` |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | `.changeset/large-pears-shake.md` (patch) |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: docs never documented a list-size limit, so current-state guidance is unchanged |
| Docs or content changed | no | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | N/A: no docs changed; no doc claimed a list-size limit |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | failure mode: a mis-shaped shared compiler would silently change update/delete matching. Proof: both lanes' prior semantics preserved via explicit options, red/green depth suite, 1258 bun + 839 vitest green, autoreview clean. Boundary is right because one compiler is exactly what the issue's root cause (two drifted copies) demands |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: no `.agents/**`, `.claude/**`, skill, hook, command, or prompt change |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: the one gate failure was `EADDRINUSE :3211` held by a different Conductor workspace; clean rerun of `test:runtime` passed |
| Commit created | yes | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | `git add -A` then commit 5450da06 |
| PR create or update | yes | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | `bun check` REAL_EXIT=0 before push; PR #371 created onto `main` |
| Task-style PR body verified | yes | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | `gh pr view 371` at head `d83053e0` confirmed the auto-release block, fix line, exact task-plan line, confidence, proof table, and all four required sections; no current-PR self-link |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, and exact PR ownership | verified after the plan-update push |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no PR and no images |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists, or record N/A/blocker | `Fixes #367` in the PR body; standalone QA comment deferred to the user |
| Final handoff contract | yes | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | see Final handoff contract |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` then `bun lint` -> clean |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | long gates redirected to `tmp/*.log` and tailed; audit ran as a background workflow |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | `autoreview --mode local --engine claude` -> clean, no accepted/actionable findings, `patch is correct (0.9)`; codex default unusable (401) |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/367-in-notin-variadic-filter-depth.md` | passed after review repairs |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | no symbol added to or removed from `orm/index.ts`; the new module is internal |
| Convex bundle/import proof | yes | Audit affected function-entry static graphs or record N/A | new module is a leaf importing only `filter-expression`; only `orm/index.ts` reached both former copies, so no entry grows; `import-graph.test.ts` green |
| CLI/scaffold/generated proof | no | Prove command contract and regenerate owned output or record N/A | N/A: no CLI or generated output changed; `bun run test:cli` green |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | published runtime behavior fix |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | `.changeset/large-pears-shake.md`, one package, patch |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: a changeset was added |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | typecheck, build, `bun test`, `bun run test:vitest` all green |
| Fixture/scaffold generation | no | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | N/A: no scaffold output changed |
| Docs/package skill sync | no | Synchronize current-state public guidance or record N/A | N/A: no public guidance changed |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue #367 read; repro measured | implementation |
| Implementation | complete | shared compiler + 11 fold sites flattened | verification |
| Verification | complete | red/green suite, bun+vitest, typecheck, lint, build, check | closeout |
| Commit / PR / GitHub sync | complete | commit 5450da06, branch `fix/orm-in-notin-filter-depth`, PR #371 | final response |
| Closeout | complete | autoreview clean (claude engine; codex 401) | final response |

Findings:
- Reproduced the issue's table exactly against Convex's own `filterBuilderImpl`:
  depth 2N+1 (n=2 -> 5, n=8 -> 17, n=64 -> 129, n=200 -> 401) for `inArray`,
  `notInArray`, and `and(eq, inArray)`.
- The threshold is explained: `$or` nesting adds 2 JSON levels per value, so
  n=64 is the first list to exceed a 128-level parser recursion limit. That is
  consistent with the reporter's 67-value production failure.
- The fold had EIGHT user-unbounded sites, not the two the issue names. The
  other six: `visitLogical` and/or in both compilers (reachable from
  `where: { OR: [...] }` / `{ AND: [...] }` with no `in` at all), and the three
  post-filter combination loops in the query executor.
- The original design plan specified the flat form:
  `docs/plans/2026-01-31-feat-milestone-4-query-builder-where-filtering-plan.md`
  lines 829-830 and 1188 say `q.and(...subExprs)` / `q.or(...conditions)`. The
  implementation regressed from its own spec.
- A shipped first-party scaffold trips this: the Resend cleanup job at
  `packages/kitcn/src/cli/registry/items/resend/resend-functions.template.ts:97`
  deletes delivery events with `inArray` on a non-id column at `BATCH_SIZE`
  (100) values per batch. The fix repairs it; the template needs no change.
- REFUTED, the issue's secondary suggestion: the per-probe `postFilters` re-push
  is NOT droppable. `tryCompileIsNotNull` builds its probes from
  `buildComplementProbeFilters(field, [null])`, whose first probe is
  `lt(field, null)` — and `undefined` sorts immediately before `null` in Convex's
  value order, so that probe scans exactly the missing-field rows the post-filter
  then rejects. `tryCompileNotIn` sorts raw values but normalizes bounds later,
  so its complement is not provably exact either; `tryCompileAndInArray` keeps
  the whole AND, not just the `in`. `postFilters` is also the ONLY enforcement
  for three consumers that never run the probes (cursor-paginated multiProbe,
  `_buildBasePipelineStream`, `_buildResidualFilterStream`), which all receive
  `index.filters === []`. Dropping it in update/delete would additionally turn a
  currently-empty probe into a spurious "matched more than N rows" throw under
  `collectMutationRowsBounded`.
- NOT affected, confirmed: the Better Auth adapter (fans an `in` into one stream
  per value and merges), relation loading (per-key fan-out), RLS (JavaScript-only
  policy evaluation), and Convex index-range builders (`concat`, already flat).
- `where: { id: { in } }` avoids the bug only as a SINGLE-key where object; the
  primary-id fast path requires `keys.length === 1`, so `{ id: { in }, status }`
  did hit it. It is fixed either way.
- Out of scope, worth separate issues: `update()`/`delete()` skip temporal
  normalization, compile `isNull` without the absent-field case, and push
  post-fetch-only operators into Convex ungated (so `not(like(...))` becomes
  `q.not(true)` and matches nothing). All three are pre-existing divergences
  between the two lanes, now visible as explicit compiler options.

Decisions and tradeoffs:
- Extracted one shared compiler rather than patching two copies. The issue's own
  Cause section is "two copies of the same left-fold"; patching both leaves the
  duplication that produced it. The new module is a leaf that imports only
  `filter-expression`, and only `orm/index.ts` reaches both former copies, so no
  Convex function entry grows.
- Preserved the two lane divergences behind explicit options
  (`normalizeValue`, `nullMatchesUndefined`) instead of hard-cutting them. They
  are real bugs but they are not #367; fixing them here would change
  update/delete matching semantics inside a filter-depth fix. They are now
  documented in one place instead of forked silently.
- Flattened the three schema-bounded folds too (index/unique/conflict column
  predicates). They were never a depth risk, but leaving the pattern behind
  invites the next copy.
- Kept the single-value short-circuit (`length === 1` returns the operand
  unwrapped) so a one-element `in` serializes exactly as before.
- Did not add a width cap or a kitcn-side error. The issue offered that only as
  a fallback if constant depth was unachievable; it is achievable.

Implementation notes:
- New `packages/kitcn/src/orm/convex-filter-compiler.ts` owns `compileConvexFilter`,
  `convexOr`/`convexAnd`, `isConvexEnforceableFilter` and
  `POST_FETCH_ONLY_OPERATORS`.
- `query.ts`: `_toConvexExpression` and `_isConvexEnforceableFilter` are now
  delegates; the three post-filter combination loops and `_buildFilterPredicate`
  use `convexAnd`.
- `mutation-utils.ts`: `toConvexFilter` is a delegate; `buildFilterPredicate`
  uses `convexAnd`.
- `insert.ts`: the `onConflict` full-scan predicate uses `convexAnd`.

Review fixes:
- Accepted four Codex review findings on PR #371: renamed this issue-backed
  plan to the `367-` prefix, replaced the contradictory PR-body receipt,
  rewrote the changeset as concise user outcomes, and made malformed empty
  serialized logical groups fail closed before query compilation.
- RED/GREEN: empty serialized `and` and `or` groups previously deserialized;
  both now throw `requires at least one operand`.
- Autoreview (`--mode local`) returned clean: no accepted/actionable findings,
  `patch is correct (0.9)`. The default Codex engine is unusable in this
  environment (`401 Unauthorized` from the OpenAI websocket endpoint, both
  `gpt-5.6-sol` and the `gpt-5.6-terra` retry), so the review ran on the skill's
  supported Claude engine (`claude-fable-5`). No engine was requested by the
  user, so this is routing around a dead default rather than overriding a
  requested one.
- Self-corrected before review: removed a speculative empty-array branch for
  `notInArray`, which cannot be reached because `notInArray()` rejects an empty
  list at construction.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| shadcn template clone timed out during final fixture check | 1 | Rerun the exact owning fixture gate once, then rerun the complete root gate | fixture retry passed all eight pairs; later full `bun check` passed |

Verification evidence:
- Closeout against current `main` (`a663e963`): merged without conflict,
  including PR #370's adjacent `query.ts` changes.
- `bun test packages/kitcn/src/orm/convex-filter-depth.test.ts`: 11 pass.
- `bun --cwd packages/kitcn build`: 71 files emitted; ORM bundle 349.06 kB.
- `bun run lint:slop:delta`: one intentional pass-through hit at the write-lane
  `toConvexFilter` semantic boundary; kept because read/write compiler options
  deliberately differ. No actionable cleanup.
- `autoreview --mode branch --base origin/main`: clean, patch correct 0.98.
- `bun lint:fix`: 934 files checked, no fixes.
- `NO_PROXY=localhost,127.0.0.1,::1 bun check`: exit 0 across lint, types,
  tests, CLI, Concave, all eight fixtures, verify, and runtime scenarios.
- Review repair RED/GREEN: the focused empty-logical test failed because an
  empty serialized `and` deserialized successfully, then passed for both
  `and` and `or` after the fail-closed guard; combined ORM tests 38/38.
- Review repair package build: 71 files emitted; final full `bun check` exit 0.
- Review repair `autoreview --mode local`: clean, correct 0.99.
- RED: with `convexOr`/`convexAnd` temporarily reverted to the pairwise fold,
  `bun test packages/kitcn/src/orm/convex-filter-depth.test.ts` -> 9 fail /
  2 pass. The two that pass are exactly the two that should be immune: the
  `id: { in }` control (never reaches `.filter()`) and the single-value case.
- GREEN: same command after restoring the fix -> 11 pass, 0 fail.
- `bun test` -> 1258 pass, 0 fail (144 files).
- `bun run test:vitest` -> 839 pass, 13 skipped, 0 fail; type errors: none.
- `bun typecheck` -> 5/5 packages successful.
- `bun lint:fix` -> clean.
- `bun --cwd packages/kitcn build` -> complete; `grep -c 'reduce((acc, cond)'`
  over `packages/kitcn/dist` -> 0 (was 2 in every published tarball 0.17.4-0.25.1
  per the issue).
- Manual harness against convex@1.44.0's real `filterBuilderImpl`: depth is now
  a constant 5 at n=2/8/64/200 for `inArray` and `notInArray`, and 7 for
  `and(eq, inArray)`.
- cwd for every command above: `/Users/mikey/conductor/workspaces/kitcn/phnom-penh`.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `findMany { number: { in } }` (indexed, promotion fires) | n=200: 200 filters, maxDepth 401 | convex-filter-depth.test.ts | depth 5/129/401 | constant | 11-case suite green; red without fix | fixed |
| `findMany { userId, number: { in } }` (eq-anchored) | n=200: 1 filter, maxDepth 401 | same | depth grows | constant | same | fixed |
| `findMany { note: { in } }` (unindexed) | n=200: maxDepth 401 | same | depth grows | constant | same | fixed |
| `findMany { note: { notIn } }` | n=200: maxDepth 401 | same | depth grows | constant | same | fixed |
| `findMany { id: { in } }` (control) | 0 filters | same | 0 filters | 0 filters | unchanged, still 0 | unaffected |
| `update .where(and(eq, inArray))` | n=200: maxDepth 403 | same | depth grows | constant | same | fixed |
| `delete .where(inArray)` | not listed; same write path | same | depth grows | constant | same | fixed |
| `where: { OR: [...] }` N branches | not listed by reporter | same | depth grows | constant | same | fixed (widened) |
| multiProbe `postFilters` re-push droppable | reporter: "looks droppable" | source audit of 6 multiProbe producers | n/a | n/a | `tryCompileIsNotNull` probe scans the missing-field range by design | refuted, not changed |

Final handoff contract:
- Commit line: 5450da06 `fix(orm): flatten in/notIn filter compilation to constant JSON depth` (+ a follow-up commit recording PR #371 in this plan)
- PR line: https://github.com/udecode/kitcn/pull/371
- Issue line: #367, closed by the PR via `Fixes #367`
- Confidence line: 95-100%
- Flow table:
  - Reproduced: tests RED (9 fail on the old fold), browser N/A
  - Verified: tests GREEN (11 pass; 1258 bun + 839 vitest), browser N/A
- Browser check: N/A — no browser-rendered or visual output changed.
- Outcome: `in`/`notIn`/`OR`/`AND` compile to one flat condition, so filter
  depth no longer grows with the list length on read or write paths.
- Caveat: each promoted `in` probe still carries the full membership list, so a
  wide indexed `in` sends N probes x N literals. That is a payload/perf shape,
  not the parse failure, and it predates this issue.
- Design:
  - Chosen boundary: one shared `convex-filter-compiler` owning every combinator.
  - Why not quick patch: two one-line edits leave the duplication that made the
    same bug exist twice, and miss six other unbounded fold sites.
  - Why not broader change: did not drop the multiProbe re-push (refuted by
    probe soundness) and did not hard-cut the update/delete semantic
    divergences, which are separate bugs.
- Verified: see Verification evidence.
- PR body verified: `gh pr view 371 --json body` — PR #270 emoji format, auto-release block preserved, task plan line present, no self-link.

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
- Commit: 5450da06 on `fix/orm-in-notin-filter-depth`
- PR: https://github.com/udecode/kitcn/pull/371
- Issue: #367 (linked by `Fixes #367`)
- Browser proof: N/A (no visual surface)
- Caveats: wide indexed `in` still fans out N probes carrying N literals each

Timeline:
- 2026-08-17T21:56:15.460Z Task goal plan created.
- Reproduced #367 exactly against convex@1.44.0's real `filterBuilderImpl`.
- Audited every Convex filter fold site, compiler duplication, multiProbe
  re-push safety, and test surface; adversarially verified each conclusion.
- Extracted `orm/convex-filter-compiler.ts`; flattened every fold site.
- Added `orm/convex-filter-depth.test.ts`; proved red (9 fail) then green (11 pass).
- `bun test`, `bun run test:vitest`, `bun typecheck`, `bun lint`, package build,
  and `bun check` (runtime lane rerun after cross-workspace port contention).
- Autoreview clean.
- `bun check` REAL_EXIT=0 end to end, branch renamed, committed, pushed.
- Opened PR #371 onto `main`.
- Closeout merged current `main`, reran focused/package/review/full gates,
  fixed all four live review findings, pushed head `d83053e0`, and updated the
  body to the ticket-prefixed plan path.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Review repairs pushed; reply, resolve, CI, and merge remain |
| Where am I going? | Resolve four threads, wait exact-head CI, merge, release |
| What is the goal? | Constant-depth `in`/`notIn` filter compilation |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- `update()`/`delete()` still skip temporal normalization, compile `isNull`
  without the absent-field case, and push post-fetch-only operators into Convex
  ungated. Pre-existing, out of scope for #367, now explicit compiler options
  rather than silent forks. Worth their own issue.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
