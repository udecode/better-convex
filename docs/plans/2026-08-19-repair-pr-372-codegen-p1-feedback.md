# repair PR 372 codegen P1 feedback

Objective:
Repair both unresolved P1 codegen regressions left on merged PR #372, ship
them in one dedicated follow-up PR, resolve the original threads, and release
the package fix with exact artifact read-backs.

Goal plan:
docs/plans/2026-08-19-repair-pr-372-codegen-p1-feedback.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: merged GitHub PR review feedback, full mode
- id / link: PR #372, threads
  https://github.com/udecode/kitcn/pull/372#discussion_r3811956286 and
  https://github.com/udecode/kitcn/pull/372#discussion_r3811956292
- title: constrained env schemas and missing generated runtimes must not block
  codegen bootstrap
- acceptance criteria: codegen schema evaluation does not validate fabricated
  required env values; source-derived runtime placeholders exist before schema
  evaluation for every scope; unrelated schema failures remain fatal; new
  behavior has RED/GREEN tests; package/check/PR/autoclosure/release gates pass

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A
- initial confidence score: N/A: binary P1 proof owns closure
- improvement loop: one vertical RED/GREEN slice per P1, combined verification,
  exact-head feedback read-back, release read-back
- final score / loop closure: both P1 regressions green and both original
  threads resolved

Completion threshold:
- Both P1 cases fail before the fix and pass after it; no unrelated schema
  failure is swallowed; package build, typecheck, lint, `bun check`, and final
  review pass; one dedicated follow-up PR carries this plan and exact PR
  ownership; both original #372 threads have quoted replies and resolved
  read-backs; the follow-up is autoclosure-merged and its release is proven in
  npm, tag, GitHub release, release workflow, skills check, and post-release CI.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-repair-pr-372-codegen-p1-feedback.md` passes.

Verification surface:
- `packages/kitcn/src/cli/codegen.test.ts` focused RED/GREEN and full file.
- `bun --cwd packages/kitcn build`, `bun typecheck`, `bun lint:fix`, `bun check`.
- Source audit of the parser shim and pre-schema placeholder lifecycle.
- Follow-up PR task/body/head, helper/raw/all-thread feedback, CI, receipt, merge.
- Original #372 thread replies/resolutions and npm/tag/release/workflow read-back.

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
- Source of truth: the two P1 threads plus current `main` codegen source and
  atomic-failure doctrine in
  `docs/solutions/integration-issues/codegen-parse-failures-must-preserve-last-generated-outputs-20260328.md`.
- Allowed edit scope: `packages/kitcn/src/cli/codegen.ts`, parser shim,
  codegen tests, one changeset, this task plan, and exact GitHub feedback/
  delivery state.
- Browser surface: N/A: Node CLI/package behavior only.
- GitHub issue sync: reply/resolve the two exact PR #372 threads after the
  repair PR exact head is proven.
- Non-goals: P2 feedback, public API redesign, docs/scaffold/UI changes,
  swallowing unrelated schema errors, or changing runtime `createEnv`.

Output budget strategy:
- Use exact files/ranges, focused test names, capped command output, and `/tmp`
  JSON for raw GitHub inventories; summarize full checks.

Blocked condition:
- Stop only if the accepted P1s cannot be reproduced, a fix requires a public
  API decision outside the existing codegen contract, GitHub cannot mutate or
  read back required feedback, or release publication repeatedly fails after
  distinct repairs.

Task state:
- task_type: bug fix / merged-PR P1 feedback repair
- task_complexity: non-trivial, bounded package CLI behavior
- current_phase: GitHub delivery
- current_phase_status: in_progress
- next_phase: create the dedicated PR, bind its exact number to this plan, then
  run autoclosure and release proof
- goal_status: active

Current verdict:
- verdict: fixed locally and P1 review-clean
- confidence: high: both failures had honest REDs, are green in the full
  codegen suite, and the second high-effort P1 autoreview found no actionable
  findings
- next owner: autoclosure after dedicated PR creation
- reason: codegen tolerates only validation issues exactly attributable to
  absent required fields, and source-derived runtime placeholders exist only
  around schema evaluation with `finally` cleanup

Implementation readiness:
- verdict: implemented and verified; GitHub delivery pending
- exact owner: codegen parse shim plus pre-schema generated-runtime bootstrap
- contradiction status: none; both reviewer claims match current source
- source-listed cases complete: yes: two P1 cases, unrelated-error preservation

Pre-solution issue challenge:
- reporter claim: constrained required env values and missing generated runtime
  imports can still abort every codegen scope before stale output recovery.
- suggested diagnosis or fix: avoid validating fabricated env values and
  create source-derived runtime placeholders before schema evaluation.
- repro ladder:
  - tests / source-level repro: add one focused codegen test per P1 and watch
    each fail for the reviewer-stated reason before implementation
  - repo-owned automated browser or integration proof: codegen test suite and
    package/full checks own the behavior; no browser lane
  - Browser plugin: N/A: CLI-only
  - screenshot / visual proof: N/A: no rendered output
- reproduction verdict: reproduced with two executable RED tests: refined
  schemas rejected `.partial()`, and schemas without partial parsing accepted
  an invalid supplied value
- validity verdict: valid
- best long-term fix boundary: parser-only `createEnv` behavior and transient
  pre-schema source-derived runtime placeholders with guaranteed cleanup
- harsh honest feedback: merging #372 with two fresh P1s unresolved was a real
  closeout failure; green CI did not cover these bootstrap cases
- hard-stop decision: proceed only after both RED tests fail honestly

Execution evidence:
- RED: the missing constrained value test rejected because `.partial()` threw;
  the supplied invalid value test incorrectly resolved because validation was
  bypassed.
- GREEN: both regression tests pass after fail-closed field issue matching;
  the missing generated-runtime import test passes with transient placeholder
  cleanup.
- Focused preservation matrix: 4/4 pass, including unrelated schema load
  failures remaining fatal.
- Full codegen suite: 74 pass, 0 fail, 507 expectations.
- Package/repo proof: `bun --cwd packages/kitcn build`, `bun typecheck`,
  `bun lint:fix`, `bun run lint:slop:delta`, and `bun check` pass; the runtime
  lane was also rerun independently through its complete scenario matrix.
- Review cycle 1 accepted two P1 corrections (`.partial()` on refined schemas
  and raw-env validation bypass); review cycle 2 reported no accepted or
  actionable P0/P1 findings (`overall: patch is correct (0.91)`).
- Release artifact: `.changeset/calm-wolves-code.md` patches `kitcn` only.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-repair-pr-372-codegen-p1-feedback.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | yes | N/A: none requested |
| Walkthrough baseline for possible UI change | no | N/A: CLI behavior cannot change UI/rendered output |
| Skill analysis before edits | yes | `task`, `autogoal`, `autoclosure`, `resolve-pr-feedback`, and `tdd` loaded; `changeset` required before release note edit |
| Active goal checked or created | yes | Existing batch release goal remains active; this is its linked per-PR repair slice |
| Source of truth read before edits | yes | Both exact P1 bodies, current source/tests, and atomic parse-failure solution read |
| Exact per-PR task ownership | yes | This plan owns one not-yet-created follow-up PR; exact number will be committed at its head before autoclosure |
| GitHub comments and attachments read | yes | Full helper inventory plus exact REST bodies read; no attachments |
| Video transcript evidence required | no | N/A: no video |
| Pre-solution issue challenge required | yes | Both claims match current source; RED execution follows |
| Reproduction verdict before implementation | yes | Source-proven valid; two executable RED tests are the next action |
| Repro escalation ladder selected | yes | Focused codegen tests own both cases; browser lanes N/A |
| Suggested fix reviewed against durable boundary | yes | Partial parser semantics plus transient pre-schema source-derived placeholders preserve fail-closed behavior |
| `docs/solutions` checked for non-trivial existing-code work | yes | Atomic parse-failure and generated-runtime ownership solutions read |
| TDD decision before behavior change or bug fix | yes | One RED/GREEN vertical slice per P1, then combined refactor/proof |
| Branch decision for code-changing task | yes | Dedicated `codex/pr-372-p1-followup` from current `origin/main` |
| Release artifact decision | yes | Published CLI behavior: new `kitcn` patch changeset required |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | `task` authorizes commit/push/dedicated PR after `bun check` |
| Task-style PR body decision | yes | Use PR #270 emoji format with exact plan line and no self-link |
| Task-plan PR body evidence | yes | Pending exact PR creation; plan must be amended with the number and pushed before autoclosure |
| GitHub issue sync expectation decision | yes | Quote/reply/resolve both original #372 threads only after repair PR proof |
| Output budget strategy recorded | yes | Exact ranges, focused tests, capped output, `/tmp` inventories |
| Package/API pack selected | yes | CLI/package/release behavior is touched |
| Public surface or package boundary identified | yes | No API type change; published `kitcn codegen` command behavior changes |
| Convex entry/import graph impact identified | no | N/A: CLI-only parser/generator graph, not deployed Convex function entries |
| CLI/scaffold/generated impact identified | yes | Codegen bootstrap lifecycle changes; no scaffold source or committed generated output |
| Release artifact path selected | yes | New patch changeset for `kitcn` |
| `changeset` skill loaded when `.changeset` is required | yes | Loaded before finalizing `.changeset/calm-wolves-code.md` |
| Package build / fixture impact decision recorded | yes | Package build/full codegen tests required; fixture sync N/A unless tests prove generated fixture drift |

Work Checklist:
- [ ] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [ ] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [ ] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [ ] Every GitHub PR in scope has its own task plan. This plan owns one exact
      PR, owns a not-yet-created PR slice, or records N/A because no PR is in
      scope; a batch plan is not used as a substitute.
- [ ] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML, or marked N/A with reason.
- [ ] For public GitHub bug reports, behavior claims, technical diagnoses, or
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict: `valid`, `not reproduced`, `invalid`,
      `wont-fix`, `partially valid`, or `platform limitation`. Feature, docs,
      support, or cleanup requests with no bug claim may mark reproduction
      `N/A` with reason.
- [ ] Repro escalation ladder followed for bug/behavior claims: focused
      test/source-level repro first when applicable; existing repo-owned
      automated browser or integration proof next when available and useful as
      executable coverage; the repo-approved Browser tool next when tests or
      automation cannot reproduce or cannot model the surface honestly;
      screenshot or explicit visual-proof waiver when visual/native state
      matters.
- [ ] Hard-stop rule followed for bug/behavior claims: no code when the issue
      is not reproduced, invalid, or won't-fix; partial validity pivots to the
      best long-term fix and records what was wrong or incomplete in the
      issue's proposed path.
- [ ] Nearby repo instructions and implementation patterns read before edits.
- [ ] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [ ] Readiness is classified `ready`, `repair-source`, `major`, `blocked`, or
      `invalid` with evidence.
- [ ] Implementation fixes the right ownership boundary, or the narrower choice
      is recorded with reason.
- [ ] Release artifact requirement recorded: active changeset, new changeset, or
      N/A with reason.
- [ ] Final handoff shape decided: bug/feature/testing/batch/review/GitHub
      requirements, PR body sync, and issue sync when applicable.
- [ ] Commit/PR handling recorded for code-changing work: commit and PR
      completed, no local patch, user explicitly declined, or blocker recorded.
      "User did not separately ask for a PR" is not a valid blocker.
- [ ] PR body shape recorded: PR #270 emoji task-style body used, N/A reason
      recorded, or blocker recorded.
- [ ] PR task evidence recorded: body includes `🧭 Task plan: ...`, the plan
      exists at the PR head, and it identifies the exact PR before autoclosure.
- [ ] Branch handling recorded for code-changing work: dedicated branch used,
      new branch needed, or N/A with reason.
- [ ] Local-env-rot retry policy recorded for any surprising repo-wide failure:
      reinstall/rerun evidence or N/A with reason.
- [ ] Workspace authority recorded: every proof command names the cwd/tool that
      owns the changed behavior.
- [ ] Output budget discipline recorded and followed: broad searches are
      scoped, capped, counted, or artifacted instead of streamed into goal
      context.
- [ ] High-risk note recorded for public API, runtime, package-boundary,
      browser behavior, agent-action, or command-contract changes, or marked
      N/A with reason.
- [ ] Review/autoreview target selected from actual diff state for non-trivial
      implementation work, or marked N/A with reason.
- [ ] Agent-native review decision recorded for `.agents/**`, `.claude/**`,
      `.codex/**`, skills, hooks, commands, prompts, or user-action tooling.
- [ ] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [ ] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
- [ ] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [ ] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`.
- [ ] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes.
- [ ] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [ ] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive with explicit confirmation bypass when relevant.
- [ ] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes.
- [ ] Package/API pack: package-owned typecheck/build/test proof is recorded or marked N/A with reason.
- [ ] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | pending | Run the command, proof, source audit, or artifact check named in this plan | pending |
| Exact per-PR task ownership | pending | Record the exact PR and dedicated plan, or the not-yet-created single-PR slice | pending |
| Pre-solution issue challenge verdict | pending | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | pending |
| Repro escalation ladder | pending | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | pending |
| Bug reproduced before fix | pending | Record failing test/repro or N/A with reason | pending |
| Targeted behavior verification | pending | Run focused test/proof for changed behavior or record N/A | pending |
| TypeScript or typed config changed | pending | Run relevant typecheck | pending |
| Package exports or file layout changed | pending | Run the relevant package build before final verification and keep generated updates | pending |
| Package manifests, lockfile, or install graph changed | pending | Run `bun install` and relevant package checks | pending |
| Agent rules or skills changed | pending | Run `bun install` and verify generated skill sync | pending |
| Workspace authority proof | pending | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | pending |
| Browser surface changed | pending | Capture Browser Use proof or record explicit waiver/blocker | pending |
| Browser final proof | pending | Attach screenshot or exact browser verification caveat when browser proof applies | pending |
| UI walkthrough | pending | If UI or rendered output changed, run `.agents/skills/walkthrough/SKILL.md` after final proof and show annotated images in the final handoff; otherwise record N/A | pending |
| Scaffold or fixture output changed | pending | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | pending |
| Package behavior or public API changed | pending | Add a changeset or record why no changeset applies | pending |
| Docs and kitcn skill sync changed | pending | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | pending |
| Docs or content changed | pending | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | pending |
| High-risk mini gate | pending | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | pending |
| Agent-native review for agent/tooling changes | pending | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | pending |
| Local install corruption suspected | pending | Run `bun install` once, rerun the exact failing command, or record N/A | pending |
| Commit created | pending | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| PR create or update | pending | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| Task-style PR body verified | pending | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | pending |
| PR task evidence verified | pending | Verify body plan line, plan at PR head, and exact PR ownership | pending |
| PR proof image hosting | pending | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | pending |
| GitHub issue sync-back | pending | Post concise issue sync after PR exists, or record N/A/blocker | pending |
| Final handoff contract | pending | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | pending |
| Final lint | pending | Run `bun lint:fix` or scoped equivalent | pending |
| Output budget discipline | pending | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | pending |
| Timed checkpoint | pending | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | pending |
| Autoreview for non-trivial implementation changes | pending | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-repair-pr-372-codegen-p1-feedback.md` | pending |
| Public API / package boundary proof | pending | Source-audit public API, exports, and package boundary impact | pending |
| Convex bundle/import proof | pending | Audit affected function-entry static graphs or record N/A | pending |
| CLI/scaffold/generated proof | pending | Prove command contract and regenerate owned output or record N/A | pending |
| Release artifact classification | pending | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | pending |
| Published package changeset | pending | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | pending |
| No release artifact | pending | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | pending |
| Package typecheck/build/test | pending | Run owning package checks or record N/A with reason | pending |
| Fixture/scaffold generation | pending | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | pending |
| Docs/package skill sync | pending | Synchronize current-state public guidance or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | exact P1/helper/source/solution audit and task plan | reproduction |
| Reproduction | in_progress | source-level validity proven | two RED tests |
| Implementation | pending | | verification |
| Verification | pending | | closeout |
| Commit / PR / GitHub sync | pending | | final response |
| Closeout | pending | | final response |

Findings:
- Codegen parser shim invents `""` for required values and calls the full
  schema parser, so constraints such as `.min(1)` reject the fabricated value.
- `resolveSchemaMetadataForCodegen()` runs before source-derived runtime
  placeholders exist, so schema trigger imports cannot bootstrap themselves.

Decisions and tradeoffs:
- In codegen-only parser context, parse real environment values with a partial
  schema when available; never invent schema values.
- Create runtime placeholders from source filenames immediately around schema
  evaluation and remove only files created by that transient pass in `finally`.

Implementation notes:
- None yet.

Review fixes:
- None yet.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
- Pending.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| constrained required env | fabricated empty value fails `.min(1)`-like validation | focused `generateMeta` schema fixture whose full parse rejects empty and partial parse accepts absence | RED expected | codegen resolves without full-schema fabrication | pending | ready |
| schema imports missing runtime | schema trigger import reaches missing `generated/user.runtime` before bootstrap | focused scoped-codegen fixture with `user.ts` plus schema runtime import | RED expected | every scope loads schema and removes transient placeholder | pending | ready |
| unrelated schema error | bootstrap fix must not swallow real failures | existing fail-closed schema throw regression | already green | remains green | existing test | retained |

Final handoff contract:
- Commit line: pending
- PR line: pending
- Issue line: pending
- Confidence line: pending
- Flow table:
  - Reproduced: tests pending, browser pending
  - Verified: tests pending, browser pending
- Browser check: pending
- Outcome: pending
- Caveat: pending
- Design:
  - Chosen boundary: pending
  - Why not quick patch: pending
  - Why not broader change: pending
- Verified: pending
- PR body verified: pending

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
- Commit: pending
- PR: pending
- Issue: pending
- Browser proof: pending
- Caveats: pending

Timeline:
- 2026-08-19T14:40:05.191Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Two executable RED tests |
| Where am I going? | Vertical fixes, package/full proof, dedicated PR, feedback resolution, release |
| What is the goal? | Repair both merged #372 P1s and release the fix |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- Transient placeholder cleanup must preserve pre-existing generated runtimes
  and must not weaken fatal schema-error behavior.
- Partial schema parsing must validate real provided values while allowing
  missing Convex-only required keys during codegen metadata evaluation.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
