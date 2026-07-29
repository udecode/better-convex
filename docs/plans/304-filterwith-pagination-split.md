# filterWith pagination split

Objective:
Settle discussion #304 `filterWith` split behavior; done when five-row limits
2 and 3 have a reproduced verdict and any valid bug is fixed with checks.

Flow mode:
one-shot execution

Goal plan:
docs/plans/304-filterwith-pagination-split.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: public GitHub discussion follow-up
- id / link: discussion #304,
  https://github.com/udecode/kitcn/discussions/304#discussioncomment-17826947
- title: Partial migration to Infinite Query breaks pagination
- acceptance criteria:
  - Reproduce five eligible rows through `stream(...).filterWith(...).paginate`.
  - With `limit: 2`, distinguish the expected next-page subscription from
    automatic page splitting.
  - With `limit: 3`, determine whether the two extra queries are intentional
    reactive split subscriptions or an eager-fetch regression.
  - If invalid behavior reproduces, fix the shared React/Solid owner without
    breaking explicit `fetchNextPage()` or Convex-requested page splitting.

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A: no timed checkpoint
- initial confidence score: N/A: binary two-case reproduction
- improvement loop: reproduce native `filterWith` results, then pass those
  exact shapes through the hook
- final score / loop closure: evidence-bounded confidence at handoff

Completion threshold:
- Both source-listed limits have native result metadata and hook query-count
  evidence.
- If a bug reproduces, a regression test fails before the fix and passes after
  for React and Solid parity.
- If no bug reproduces, implementation hard-stops and the discussion gets a
  source-backed explanation.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/304-filterwith-pagination-split.md` passes.

Verification surface:
- Focused `convex-test` reproduction using `convex-helpers/server/stream`.
- Focused React/Solid infinite-query tests with the exact pagination metadata.
- Source audit of `filterWith`, Convex pagination, and kitcn split ownership.
- If code changes: package tests/typecheck/build, lint, changeset, autoreview,
  `bun check`, PR body read-back, and discussion reply read-back.
- Browser proof is N/A: this is package subscription behavior with an honest
  automated harness and no visual surface.

Constraints:
- Preserve existing user-facing behavior outside the task scope.
- Prefer the durable ownership boundary over caller-by-caller patches.
- Verified code changes must be committed and PR'd because the task skill
  requires that path unless the user explicitly says not to, the work has no
  local patch, or a real blocker is recorded.
- The absence of a separate "open a PR" sentence from the user is not a valid
  N/A reason for verified code-changing task work.
- A PR created by this task must use the PR #270 emoji task-style PR body
  contract below, not a generic summary/body from a git helper skill.
- Do not add broad ceremony when the task is trivial or docs-only.
- Do not suppress `SplitRequired`/`SplitRecommended` handling merely to reduce
  query count; prove whether those queries are data fetches or bounded reactive
  subscriptions.
- Do not blame `filterWith` without running its actual paginator.

Boundaries:
- Source of truth: discussion #304 follow-up, current `main`, local
  `convex-helpers`/Convex source, and kitcn React/Solid pagination owners.
- Allowed edit scope: focused cRPC pagination tests/runtime under
  `packages/kitcn`, plan, changeset, and docs only if public guidance is wrong.
- Browser surface: N/A: no browser-owned state.
- GitHub issue sync: reply after a verified verdict; PR first if code changes.
- Non-goals: ORM migration, query rewrite, filtering semantics redesign,
  unrelated cache behavior, or compatibility shims.

Output budget strategy:
- Use exact-symbol `rg` and bounded file slices. Exclude `tmp`, generated/build
  output, logs, and unrelated packages. Cap focused commands at one screen.

Blocked condition:
- Stop implementation if the actual `filterWith` harness does not reproduce an
  unintended query. Stop shipping only if required package/repo gates remain
  broken after the one allowed install-corruption retry or GitHub access fails.

Task state:
- task_type: bug / runtime compatibility follow-up
- task_complexity: normal non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: active

Current verdict:
- verdict: partially valid
- confidence: 98%
- next owner: reporter dependency upgrade
- reason: the five-row limit-3 case reproduces on `convex-helpers` 0.1.116 and
  0.1.117 as `SplitRecommended`; 0.1.118 removes that recommendation.

Implementation readiness:
- verdict: invalid for kitcn implementation; ready for dependency guidance
- exact owner: `convex-helpers/server/stream` split recommendation policy
- contradiction status: settled: kitcn correctly honors `SplitRecommended`;
  old `convex-helpers` recommended it too aggressively after filtered scans
- source-listed cases complete: yes; limit 2 and limit 3 rows below

Pre-solution issue challenge:
- reporter claim: five eligible rows behave normally at limit 2, but limit 3
  triggers two subsequent queries without an explicit fetch.
- suggested diagnosis or fix: reporter suspects
  `shouldSplitPaginationPage`; no concrete fix proposed.
- repro ladder:
  - tests / source-level repro: actual `filterWith` paginator first, then hook
  - repo-owned automated browser or integration proof: package harness owns it
  - Browser plugin: N/A unless package harness proves dishonest
  - screenshot / visual proof: N/A: no visual state
- reproduction verdict: reproduced on `convex-helpers` 0.1.116/0.1.117
- validity verdict: partially valid: the extra subscriptions are real, but
  kitcn's split predicate is not the defect
- best long-term fix boundary: upstream recommendation policy, already fixed
  in `convex-helpers` 0.1.118
- harsh honest feedback: counting subscriptions alone is insufficient; Convex
  can intentionally split one reactive page into bounded ranges
- hard-stop decision: no kitcn patch; tell the reporter to upgrade to
  `convex-helpers >= 0.1.118`

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/304-filterwith-pagination-split.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: none requested |
| Skill analysis before edits | yes | Loaded requested continuation workflow: `task`, `autogoal`; TDD, changeset, and autoreview became N/A after the kitcn implementation hard-stop |
| Active goal checked or created | yes | Created the exact objective naming discussion #304, the five-row limits 2/3 threshold, checks, and this plan |
| Source of truth read before edits | yes | Read full discussion #304 and latest reply through GraphQL |
| GitHub comments and attachments read | yes | Full thread read; no attachments/video |
| Video transcript evidence required | no | N/A: no recording |
| Pre-solution issue challenge required | yes | Public runtime claim; two-case matrix recorded |
| Reproduction verdict before implementation | yes | Implementation hard-stops until actual `filterWith` harness verdict |
| Repro escalation ladder selected | yes | Native paginator then React/Solid hook harness; browser N/A |
| Suggested fix reviewed against durable boundary | yes | Predicate suspicion is not authority; distinguish split subscriptions from eager pages |
| `docs/solutions` checked for non-trivial existing-code work | yes | Exact pagination/`filterWith` search before implementation |
| TDD decision before behavior change or bug fix | no | N/A: no kitcn behavior change; upstream owner already shipped the fix |
| Branch decision for code-changing task | no | N/A: no product patch |
| Release artifact decision | no | N/A: no published delta from this checkout |
| Browser tool decision for browser surface | no | N/A: package behavior with direct harness |
| Commit / PR expectation decision | no | N/A: analytical reproduction with no product patch |
| Task-style PR body decision | no | N/A: no PR |
| GitHub issue sync expectation decision | yes | Reply with verified explanation or PR after outcome |
| Output budget strategy recorded | yes | Exact symbols/files; noisy paths excluded and capped |
| Package/API pack selected | yes | Audited published runtime impact before determining no kitcn change |
| Public surface or package boundary identified | yes | `convex-helpers/server/stream` owns the recommendation; kitcn only honors its metadata |
| Convex entry/import graph impact identified | yes | Client-only hooks/helper expected; no function-entry graph change |
| CLI/scaffold/generated impact identified | no | N/A unless investigation finds a different owner |
| Release artifact path selected | no | N/A: no checkout delta |
| `changeset` skill loaded when `.changeset` is required | no | N/A: no changeset required |
| Package build / fixture impact decision recorded | no | N/A: no kitcn package or scaffold change |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
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

Checklist closure evidence:
- Duration and video: N/A; neither was requested or attached.
- Implementation, branch, commit, PR, PR body, autoreview, lint, changeset,
  package build, fixtures, docs sync, CLI, compatibility, and import-graph
  mutation: N/A because the verified owner is an already-fixed upstream
  dependency and this checkout has no product patch.
- Local environment retry: N/A; no surprising repo-owned failure occurred.
- High-risk runtime decision: preserving Convex-compatible split handling is
  safer than suppressing legitimate split metadata in kitcn.
- Workspace authority: behavior proof ran in
  `/Users/zbeyens/git/convex-helpers`; kitcn source was audited in
  `/Users/zbeyens/git/better-convex`.
- Public-package classification: guidance-only outcome; no user-visible delta
  from `main`, so no release artifact.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | Exact five-row limits 2/3 proved on 0.1.116 and 0.1.118 |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | Recorded as partially valid; upstream stream policy owns the defect |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | Actual stream harness completed; browser and screenshots N/A for package behavior |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | 0.1.116 exact test returned `SplitRecommended` only at limit 3 |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 0.1.118 exact test returned 2/3 rows without split metadata |
| TypeScript or typed config changed | no | Run relevant typecheck | N/A: no code/config patch |
| Package exports or file layout changed | no | Run the relevant package build before final verification and keep generated updates | N/A: unchanged |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: unchanged in better-convex |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: unchanged |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | Stream tests ran in `/Users/zbeyens/git/convex-helpers`; kitcn source audit ran here |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: no browser surface |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: direct package harness is authoritative |
| Scaffold or fixture output changed | no | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | N/A: unchanged |
| Package behavior or public API changed | no | Add a changeset or record why no changeset applies | N/A: no checkout delta |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: unchanged |
| Docs or content changed | no | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | N/A: only this task record changed |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | Weakening kitcn would suppress legitimate Convex splits; preserve predicate and upgrade dependency |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: no agent/tooling changes |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: no such failure |
| Commit created | no | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | N/A: analytical reproduction, no product patch |
| PR create or update | no | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | N/A: no product patch |
| Task-style PR body verified | no | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | N/A: no PR |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no PR/browser proof |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists, or record N/A/blocker | Replied at https://github.com/udecode/kitcn/discussions/304#discussioncomment-17831805; PR N/A |
| Final handoff contract | yes | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | Filled below |
| Final lint | no | Run `bun lint:fix` or scoped equivalent | N/A: no code patch |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | Searches and test output were focused and capped |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: none requested |
| Autoreview for non-trivial implementation changes | no | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | N/A: no implementation diff |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/304-filterwith-pagination-split.md` | Passed after closing the final phase |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | Audited kitcn predicate, Convex equivalent, and upstream stream paginator; no kitcn API delta |
| Convex bundle/import proof | no | Audit affected function-entry static graphs or record N/A | N/A: no import change |
| CLI/scaffold/generated proof | no | Prove command contract and regenerate owned output or record N/A | N/A: unchanged |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | No published user-visible delta from this checkout |
| Published package changeset | no | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | N/A: no package delta |
| No release artifact | yes | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | No user-visible delta from `main`; outcome is dependency guidance |
| Package typecheck/build/test | no | Run owning package checks or record N/A with reason | N/A: no kitcn package change; upstream focused tests are recorded |
| Fixture/scaffold generation | no | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | N/A: unchanged |
| Docs/package skill sync | no | Synchronize current-state public guidance or record N/A | N/A: public docs unchanged |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | Full discussion, skills, doctrine, plan, and relevant source read | reproduction |
| Reproduction | complete | Exact five-row paginator case reproduced on 0.1.116 | implementation or hard-stop |
| Implementation | complete | N/A: hard-stopped; upstream owner fixed it in 0.1.118 | verification |
| Verification | complete | Exact case and upstream regression passed on 0.1.118 | closeout |
| Commit / PR / GitHub sync | complete | Commit/PR N/A; verified reply posted to discussion #304 | final response |
| Closeout | complete | Completion checker rerun after closing the final phase | final response |

Findings:
- The reporter corrected the earlier missing-row claim: filtering happened
  after pagination and was application code, not kitcn.
- The new query uses `convex-helpers/server/stream` with `filterWith` before
  `.paginate`, five eligible rows, and compares limits 2 and 3.
- `convex-helpers` 0.1.116/0.1.117 used
  `indexKeys.length >= numItems + 1` for `SplitRecommended`. Two early matches
  make limit 2 scan only two rows, while a third late match makes limit 3 scan
  five and recommend a split.
- Upstream commit `a669eb1` changed that policy to avoid cascading splits;
  release 0.1.118 is the first stable tag containing it.
- The exact five-row harness passes on 0.1.118 with counts 2/3 and no
  `pageStatus`/`splitCursor` at limit 3.

Decisions and tradeoffs:
- Treat extra queries as suspicious but not automatically wrong: native
  reactive pagination deliberately splits range subscriptions.
- Do not weaken kitcn's split predicate. Ignoring a legitimate
  `SplitRecommended` would diverge from Convex and break bounded reactive pages.
- No package patch or changeset: the correct owner already shipped the fix.

Implementation notes:
- No kitcn implementation. Upgrade `convex-helpers` to 0.1.118 or later.

Review fixes:
- N/A: no implementation diff.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Tested upstream 0.1.117 for the new regression name, but that tag predates the fix/test | 1 | Check commit ancestry across stable tags | 0.1.118 is the first fixed release |
| Discussion-comment REST read-back returned 404 | 1 | Read the nested discussion reply through GraphQL | Exact posted body and URL verified |

Verification evidence:
- `/Users/zbeyens/git/convex-helpers`: exact five-row filtered paginator test
  passed on 0.1.116 with limit 2 undefined status and limit 3
  `SplitRecommended`.
- `/Users/zbeyens/git/convex-helpers`: upstream
  `no SplitRecommended without endCursor` passed on 0.1.118.
- `/Users/zbeyens/git/convex-helpers`: exact five-row test passed on 0.1.118
  with requested 2/3 counts and no limit-3 split metadata.
- Temporary upstream probes were removed; sibling clone is clean.
- GitHub GraphQL read-back returned the exact reply body and
  https://github.com/udecode/kitcn/discussions/304#discussioncomment-17831805.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| five rows, limit 2 | works as expected | Actual `stream.filterWith.paginate` | 2 rows; no status on 0.1.116 | first page 2; no split | focused test passed | verified |
| five rows, limit 3 | two subsequent queries | Same harness plus upstream tag comparison | 3 rows; `SplitRecommended` on 0.1.116/0.1.117 | 3 rows; no split for this small scan | 0.1.118 focused test passed | verified |

Final handoff contract:
- Commit line: N/A: no product patch
- PR line: N/A: no product patch
- Issue line: https://github.com/udecode/kitcn/discussions/304#discussioncomment-17831805
- Confidence line: 98%
- Flow table:
  - Reproduced: exact upstream stream test passed on 0.1.116; browser N/A
  - Verified: exact case and upstream regression passed on 0.1.118; browser N/A
- Browser check: N/A: package paginator behavior has an authoritative test harness
- Outcome: old `convex-helpers` split too aggressively; upgrade to 0.1.118+
- Caveat: if the reporter already uses 0.1.118+, collect exact first-result
  `page.length`, `pageStatus`, `splitCursor`, and `isDone`
- Design:
  - Chosen boundary: upstream `convex-helpers` split recommendation policy
  - Why not quick patch: suppressing the kitcn predicate breaks legitimate splits
  - Why not broader change: current Convex and kitcn split semantics agree
- Verified: old/new stable-tag source ancestry and focused tests
- PR body verified: N/A: no PR

Task-style PR body contract:
- Preserve any existing `<!-- auto-release:start -->` block. If a changeset is
  part of the diff and repo policy expects auto release, include that block.
- Use the accepted PR #270 visual format. The body starts with an emoji
  issue/fix line, for example `🐛 Fixes #123` or `🐛 Fixes ➖ N/A`, then
  an emoji confidence line like `🟢 95-100% confidence`.
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
- Commit: N/A: no product patch
- PR: N/A: no product patch
- Issue: https://github.com/udecode/kitcn/discussions/304#discussioncomment-17831805
- Browser proof: N/A: package behavior
- Caveats: exact installed dependency version remains reporter-owned

Timeline:
- 2026-07-29T19:48:20.386Z Task goal plan created.
- 2026-07-29 Source thread read; corrected filtering claim and concrete
  `filterWith` repro recorded.
- 2026-07-29 Exact five-row case reproduced on 0.1.116 and verified fixed on
  0.1.118; temporary probes removed and sibling checkout left clean.
- 2026-07-29 Posted source-backed dependency-upgrade guidance to discussion
  #304 at discussion comment 17831805.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | GitHub sync |
| Where am I going? | Explain the fixed upstream boundary, then close |
| What is the goal? | Settle whether limit 3 performs eager loading or intentional splits |
| What have I learned? | `convex-helpers <0.1.118` causes cascading split recommendations after sparse filters |
| What have I done? | Reproduced on 0.1.116, verified fixed in 0.1.118, removed probes |

Open risks:
- The reporter has not supplied their installed `convex-helpers` version. If
  they are already on 0.1.118+, their exact row order/data differs from the
  rough query and needs fresh metadata.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
