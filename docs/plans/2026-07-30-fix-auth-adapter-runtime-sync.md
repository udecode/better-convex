# fix auth adapter runtime sync

Objective:
Fix KitCN auth runtime parity with the synced upstream; done when unbounded
pagination terminates, shared runMutation typing is action-safe, checks pass,
and a PR exists.

Goal plan:
docs/plans/2026-07-30-fix-auth-adapter-runtime-sync.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- docs (docs/plans/templates/packs/docs.md)
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: upstream sync audit
- id / link:
  `docs/plans/2026-07-30-sync-convex-auth.md`,
  `get-convex/better-auth@6f940f9`, and
  `get-convex/better-auth@38fa19a`
- title: port action-safe runMutation typing and terminating auth pagination
- acceptance criteria: unbounded auth adapter pagination proceeds beyond 200
  rows and aborts a page that cannot make progress; `RunMutationCtx` exposes
  only the mutation call shape valid from action contexts; focused tests,
  package build, typecheck, lint, autoreview, and `bun check` pass; a KitCN
  changeset, durable solution note, commit, push, and task-style PR exist.

Timed checkpoint:
- requested duration: N/A
- semantics: N/A: no timed request
- initial confidence score: 95%
- improvement loop: red-green each source-listed case, then full verification
- final score / loop closure: 99%; the autoreview finding is repaired, all
  repeated local gates pass, and final rereview is clean; GitHub delivery and
  remote checks remain

Completion threshold:
- Both source-listed cases fail before their fix and pass after it against the
  public helper/type surface.
- Published package change has one patch changeset and a source-backed
  `docs/solutions/integration-issues` note.
- Focused tests, `bun --cwd packages/kitcn build`, `bun typecheck`,
  `bun lint:fix`, final autoreview, and `bun check` pass.
- The entire checkout is committed, pushed, and opened as a task-style PR.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-fix-auth-adapter-runtime-sync.md` passes.

Verification surface:
- `bun test packages/kitcn/src/auth/adapter.test.ts` for unbounded and
  no-forward-progress pagination.
- Focused `tsc --noEmit` on
  `packages/kitcn/src/server/context-utils.test-d.ts`, Vitest's `--typecheck`
  lane, and `bun typecheck` for action-safe `runMutation` typing.
- `bun --cwd packages/kitcn build`, `bun lint:fix`, and `bun check`.
- Source audit of the shared adapter/context owners and unchanged public
  exports/import graphs.
- `.agents/skills/autoreview/scripts/autoreview --mode local`.
- `gh pr view --json body,url,state` for task-style PR proof.

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

Boundaries:
- Source of truth: linked sync plan, frozen upstream commits `6f940f9` and
  `38fa19a`, current Convex server types, local adapter/context implementations,
  and prior auth sync/Better Auth 1.6 solution notes.
- Allowed edit scope: shared auth pagination and context types, focused tests
  plus their direct Vitest type-test registration, one KitCN changeset, this
  task/sync plan, one durable solution note, and the six user-approved generated
  fixture dependency snapshots.
- Browser surface: N/A: package runtime and type-only behavior, no UI route.
- GitHub issue sync: N/A: task originates from a repository sync, not a public
  KitCN issue.
- Non-goals: authored dependency bumps, cross-domain wrapper changes, upstream
  examples, scaffold source changes, and new public API.

Output budget strategy:
- Use exact owner files, focused test output, capped build/check output, and
  concise GitHub JSON. Do not stream package locks, full generated trees, or
  bot-heavy PR comment histories.

Blocked condition:
- Block only if the source regressions cannot be reproduced, the durable fixes
  conflict with supported Convex 1.38, package/check failures remain after one
  install repair when the failure shape is local dependency rot, or push/PR
  permissions fail. The user approved refreshing the five additional generated
  fixture snapshots; no current blocker remains.

Task state:
- task_type: package runtime and type compatibility bugfix
- task_complexity: non-trivial measurable
- current_phase: GitHub delivery
- current_phase_status: final autoreview clean
- next_phase: commit, PR, and remote checks
- goal_status: resumed after explicit user approval

Current verdict:
- verdict: valid
- confidence: high
- next owner: task
- reason: local source contains exact pre-fix code from both upstream commits.

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/auth/adapter.ts` and
  `packages/kitcn/src/server/context-utils.ts`
- contradiction status: none; both fixes preserve supported Convex 1.38 while
  repairing behavior exposed on newer Convex
- source-listed cases complete: yes; two cases in matrix below

Pre-solution issue challenge:
- reporter claim: unbounded `count` / `findMany` can loop forever after the
  first 200 rows, and the shared context exposes a mutation-only runner shape
  when the runtime may be an action.
- suggested diagnosis or fix: use an infinite budget only when the caller has
  no limit, abort non-progressing pages, and type the common runner from
  `GenericActionCtx`.
- repro ladder:
  - tests / source-level repro: focused public `handlePagination` and
    `RunMutationCtx` regressions selected; red evidence required before fixes.
  - repo-owned automated browser or integration proof: N/A: no browser/runtime
    route is needed to model either package behavior.
  - Browser plugin: N/A: no UI/browser surface.
  - screenshot / visual proof: N/A: no visual state.
- reproduction verdict: valid; all three focused regressions failed before
  their owning fix for the expected reason
- validity verdict: valid
- best long-term fix boundary: the two shared owners used by all adapter/context
  consumers, not individual HTTP/database callers
- harsh honest feedback: the pagination expression is a textbook infinite-loop
  bug, not an edge-case preference; requesting zero rows while keeping the
  cursor cannot terminate.
- hard-stop decision: proceed only after each focused regression fails for the
  expected reason.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-fix-auth-adapter-runtime-sync.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested. |
| Skill analysis before edits | yes | Read `sync-convex-auth`, `autogoal`, `task`, `tdd`, and `changeset` before implementation. |
| Active goal checked or created | yes | Active sync goal owns this linked task plan. |
| Source of truth read before edits | yes | Read frozen upstream patches, current Convex types, exact local owners, and prior auth institutional notes. |
| GitHub comments and attachments read | no | N/A: no KitCN issue; upstream commit patches are the frozen source. |
| Video transcript evidence required | no | N/A: no video. |
| Pre-solution issue challenge required | yes | Exact source comparison proves both claims; focused red tests required next. |
| Reproduction verdict before implementation | yes | Verdict valid; no implementation source changed yet. |
| Repro escalation ladder selected | yes | Focused source-level tests; browser/visual lanes N/A. |
| Suggested fix reviewed against durable boundary | yes | Both changes land once in shared owners used by all affected consumers. |
| `docs/solutions` checked for non-trivial existing-code work | yes | Read prior upstream-sync and Better Auth 1.6 structural-wrapper notes. |
| TDD decision before behavior change or bug fix | yes | Vertical cycles: unbounded pagination, no-progress guard, then action-safe type. |
| Branch decision for code-changing task | yes | Created `codex/sync-convex-auth-runtime-fixes` from current `origin/main`. |
| Release artifact decision | yes | Published KitCN patch requires a new changeset; only README/config currently exist. |
| Browser tool decision for browser surface | no | N/A: no browser surface. |
| Commit / PR expectation decision | yes | Verified code-changing work will commit the entire checkout, push, and open a PR as required by `task`. |
| Task-style PR body decision | yes | Use the required PR #270 emoji task format. |
| GitHub issue sync expectation decision | no | N/A: no KitCN issue. |
| Output budget strategy recorded | yes | Exact owner reads and capped command output only. |
| Docs pack selected | yes | Internal durable solution note only. |
| Docs guidance loaded | yes | Read `docs/README.md`; `www` doc guidance is N/A. |
| Docs lane selected | yes | `docs/solutions/integration-issues`. |
| Target docs and nearest sibling docs read | yes | Read the prior Convex Better Auth sync and Better Auth 1.6 integration notes. |
| Docs style doctrine read | no | N/A: no `www/**` public reference docs. |
| Documented source owner identified | yes | Shared adapter/context source plus frozen upstream patches. |
| Package/API pack selected | yes | Published KitCN runtime/type behavior changes. |
| Public surface or package boundary identified | yes | Exported `RunMutationCtx` type and adapter factory behavior. |
| Convex entry/import graph impact identified | yes | No new imports or static entry graph expansion. |
| CLI/scaffold/generated impact identified | yes | No CLI/template source changed; fresh shadcn generation moved six fixture manifests from `lucide-react ^1.27.0` to `^1.28.0`. |
| Release artifact path selected | yes | New `.changeset/*.md` for `kitcn` patch. |
| `changeset` skill loaded when `.changeset` is required | yes | Read skill and source rule completely. |
| Package build / fixture impact decision recorded | yes | Package build required; six generated fixtures required an approved registry-drift refresh and matching targeted checks. |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration.
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
- [ ] Commit/PR handling recorded for code-changing work: commit and PR
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
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed or marked N/A with reason.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages or are marked N/A with reason.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. N/A: this diff has a published KitCN patch delta and a changeset.
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
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | The repaired Convex 1.42 type lane passes and fails on production revert; repeated focused/package/full gates pass. |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | Recorded above before implementation; verdict valid. |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | Source-level red/green tests apply; integration, Browser, and screenshots are N/A for package-only behavior. |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | Three focused regressions failed before their owning fixes for the expected reason. |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 31 focused runtime tests and the Vitest type-test lane pass. |
| TypeScript or typed config changed | yes | Run relevant typecheck | Focused `tsc`, Vitest typecheck, package typecheck, and root `bun typecheck` pass. |
| Package exports or file layout changed | yes | Run the relevant package build before final verification and keep generated updates | `bun --cwd packages/kitcn build` passes; public export names and paths are unchanged. |
| Package manifests, lockfile, or install graph changed | yes | Run `bun install` and relevant package checks | `bun install` added pinned `convex-type-test@1.42.3`; regular gates keep Convex 1.38, and all six generated fixture checks pass. |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: no agent rules or skills changed. |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | All commands ran in `/Users/zbeyens/git/better-convex`; package checks used `packages/kitcn`. |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: package runtime/type behavior has no UI route. |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: no visual state. |
| Scaffold or fixture output changed | yes | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | Scenarios-owned targeted sync/check passes for `next`, `next-auth`, `start`, `start-auth`, `vite`, and `vite-auth`; each diff is one generated dependency line. |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | `.changeset/calm-auth-pagination.md` records a KitCN patch. |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: no public docs or published skill guidance changed. |
| Docs or content changed | yes | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | Internal solution and plans are source-backed; no MDX, links, or rendered route changed. |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | Failure modes are infinite pagination and mutation-only options exposed to actions; shared-owner red/green proof covers both. |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: no agent/tooling files changed. |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: no corruption-shaped failure; `bun install` was used only to restore the lockfile baseline after the Convex 1.42 type repro. |
| Commit created | pending | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| PR create or update | pending | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| Task-style PR body verified | pending | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | pending |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no browser proof applies. |
| GitHub issue sync-back | no | Post concise issue sync after PR exists, or record N/A/blocker | N/A: this task originates from the fork sync, not a KitCN issue. |
| Final handoff contract | pending | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | pending |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | Final `bun lint:fix` checked 874 files with no fixes. |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | Broad command output was redirected to temporary logs and tailed; searches and diffs were capped. |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested. |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | Final local rereview: TruffleHog clean, no accepted/actionable findings, patch correct at 0.91. |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-fix-auth-adapter-runtime-sync.md` | pending |
| Docs source-backed claim audit | yes | Verify docs claims against current source or record N/A | Internal solution claims match frozen upstream commits, local source, and focused regressions. |
| Docs links / routes / previews | no | Verify leaf links, routes, anchors, and preview names or record N/A | N/A: no links, routes, anchors, or previews changed. |
| Docs MDX/content parser | no | Run the relevant `www` docs parser/build for MDX/content changes, or record N/A | N/A: no `www` or MDX content changed. |
| Kitcn docs sync | no | If `www/**` changed, update matching `packages/kitcn/skills/kitcn/**` content or record N/A | N/A: no `www/**` change. |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | Names/exports remain unchanged; only shared pagination behavior and the invalid third-argument type surface narrow. |
| Convex bundle/import proof | yes | Audit affected function-entry static graphs or record N/A | No imports were added; function-entry static graphs do not expand. |
| CLI/scaffold/generated proof | yes | Prove command contract and regenerate owned output or record N/A | No CLI/scaffold source changed; all six affected generated fixtures match fresh scenario output. |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | Published KitCN patch: auth adapter runtime behavior and action-safe context type. |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | `.changeset/calm-auth-pagination.md` is a patch changeset for `kitcn`. |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: a published patch artifact is required and present. |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | 31 focused tests, dedicated type-test lane, package typecheck, package build, and root typecheck pass. |
| Fixture/scaffold generation | yes | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | Targeted scenario sync/check passes for all six affected fixtures. |
| Docs/package skill sync | no | Synchronize current-state public guidance or record N/A | N/A: no public docs or package skill guidance changed. |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | source, owner, regressions, branch, and release path recorded | done |
| Implementation | complete | three red-green cycles at shared owners | done |
| Verification | complete | review finding repaired with red/green type proof; repeated full `bun check` and final rereview pass | done |
| Commit / PR / GitHub sync | pending | | final response |
| Closeout | pending | | final response |

Findings:
- The upstream pagination fix maps byte-for-byte to KitCN's shared helper, which
  serves both HTTP and database adapters.
- The installed Convex 1.42.3 types expose mutation-only transaction options,
  while branch metadata remains compatible with Convex 1.38. The type fix is a
  safe common subset, not a minimum-version bump.
- Cross-domain plugin typing is intentionally excluded because KitCN owns
  structural wrappers and does not depend on the upstream package.
- Full `bun check` reached external shadcn registry drift: all six shadcn
  fixtures recorded `lucide-react ^1.27.0`, while fresh generation installs
  `^1.28.0`. User-approved targeted syncs changed exactly one generated line
  per fixture, and all six matching checks pass.

Decisions and tradeoffs:
- Keep the public surface names unchanged; narrow only an invalid call shape.
- Test pagination through the exported helper and types through a committed
  type regression.
- Do not broaden into authored dependencies, examples, scaffold source, or
  public docs; the generated fixture refresh is the exact approved exception.

Implementation notes:
- Changed the absent-limit budget only; explicit limits and the 200-row page cap
  retain their current behavior.
- Added a termination invariant after state update: a non-final page must
  advance the cursor or produce rows/count.
- Typed `RunMutationCtx.runMutation` from `GenericActionCtx`, the safe callable
  surface common to mutation and action contexts.
- Added patch changeset `.changeset/calm-auth-pagination.md` and a durable
  integration solution note.
- Registered `packages/**/*.test-d.ts` in Vitest's integration project so the
  committed type regression is checked instead of merely transpiled.
- Pinned the dedicated type-test resolver to `convex@1.42.3`, where mutation
  contexts expose transaction limits, while regular package gates keep the
  minimum supported Convex 1.38 baseline.
- Excluded `*.test-d.ts` from the normal package tsconfig and cleared that
  exclusion in the dedicated config, so each Convex version owns one honest
  type lane.

Review fixes:
- Scope baseline before autoreview: branch
  `codex/sync-convex-auth-runtime-fixes`; shared adapter/context behavior; two
  source files, three focused test/config files, one changeset, one solution
  note, and two plans. Review-triggered growth beyond this owner boundary or
  twice this file/LOC footprint requires reclassification.
- An initial local autoreview before fixture closeout exited clean at `0.96`.
- Final-bundle autoreview found one actionable P2: the committed type lane used
  Convex 1.38, so reverting production to `GenericMutationCtx` would still pass.
- Added the pinned `convex-type-test` alias and a mutation-context control call.
  The lane fails with an unused `@ts-expect-error` when production is reverted
  and passes after restoring `GenericActionCtx`. Final rereview remains.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `vitest --typecheck` filter did not include `*.types.test.ts` | 1 | Check current Vitest type-test discovery rules | Official docs require `*.test-d.ts` by default. |
| Normal `.vitest.ts` execution reported green despite TypeScript diagnostics | 1 | Move the fixture to `*.test-d.ts` and run Vitest `--typecheck` | Type fixture now uses Vitest's actual non-runtime type-test lane. |
| First registered Vitest type lane used the root tsconfig and emitted 1,189 unrelated fixture errors | 1 | Give the lane a KitCN-only type-test tsconfig | Added `packages/kitcn/tsconfig.type-tests.json`; the dedicated lane passes. |
| First type fixture omitted the required `RunMutationCtx` data-model generic | 1 | Use `GenericDataModel` explicitly | Remaining red errors isolated the intended invalid third argument. |
| Final autoreview proved the type lane was false-green on Convex 1.38 | 1 | Resolve the dedicated lane against a pinned Convex version that exposes mutation-only options and add a positive control | Convex 1.42.3 lane fails on a production revert and passes on the fix. |
| Normal package typecheck compiled the Convex 1.42-only positive control against Convex 1.38 | 1 | Isolate `*.test-d.ts` to the dedicated config instead of weakening either assertion | Package typecheck and the dedicated Convex 1.42 lane both pass. |
| First `bun check` failed on `fixtures/next` lucide registry drift | 1 | Use the scenarios-owned target sync/check instead of hand editing | `fixtures/next/package.json` regenerated to `^1.28.0`; targeted check passed. |
| Second `bun check` failed on the same drift in `fixtures/next-auth` | 1 | Stop before broad fixture expansion and request approval as required by the sync skill | Remaining affected fixtures: `next-auth`, `start`, `start-auth`, `vite`, `vite-auth`. |

Verification evidence:
- RED, this checkout with installed Convex 1.42.3:
  `bun test packages/kitcn/src/auth/adapter.test.ts` failed because the second
  unbounded request asked for zero rows.
- GREEN: the same adapter command passed 28 tests after both pagination fixes.
- RED, this checkout with installed Convex 1.42.3: focused `tsc --noEmit`
  reported unused `@ts-expect-error` and incompatible action-runner equality
  before changing `RunMutationCtx`.
- GREEN: focused `tsc --noEmit`, Vitest's `*.test-d.ts` lane, and combined
  adapter / context runtime tests passed after the type fix.
- On the locked Convex 1.38 baseline: 31 focused runtime tests, root
  `bun typecheck`, and `bun --cwd packages/kitcn build` exited 0.
- The committed Vitest type-test lane resolves pinned Convex 1.42.3. Its
  mutation-context control accepts transaction limits; reverting production to
  `GenericMutationCtx` fails with an unused `@ts-expect-error`; restoring
  `GenericActionCtx` passes with no type errors.
- After isolating `*.test-d.ts` to its dedicated config, package typecheck,
  package build, focused runtime tests, the Convex 1.42 type lane, and lint all
  exit 0.
- `bun check` passed lint, typecheck, unit, CLI, Concave, and earlier fixture
  lanes before failing only on generated shadcn dependency drift.
- `bun tooling/fixtures.ts sync next --backend concave` changed only
  `fixtures/next/package.json`; its matching targeted check exited 0.
- Read-only targeted checks for `next-auth`, `start`, `start-auth`, `vite`, and
  `vite-auth` each reported exactly one diff:
  `lucide-react ^1.27.0` to `^1.28.0`; no other snapshot drift surfaced.
- User-approved targeted sync/check passes for `next`, `next-auth`, `start`,
  `start-auth`, `vite`, and `vite-auth`; the committed diff is one dependency
  line per fixture.
- The pre-rereview `bun check` exited 0 after all lint, typecheck, test, CLI,
  Concave, fixture, and scenario lanes; the post-fix rerun supersedes it.
- The post-fix repeated `bun check` exited 0 across all repository gates.
- Final local autoreview: TruffleHog clean; no accepted/actionable findings;
  patch correct with overall confidence `0.91`.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| unbounded pagination | More than 200 rows requests zero items and may loop forever. | `adapter.test.ts` exported-helper regression | failed: second request received `numItems: 0` | 201 rows terminate | focused red/green command | verified |
| action-safe runner type | A union that may hold an action exposes mutation-only transaction options on Convex 1.42. | `context-utils.test-d.ts` with third-argument rejection | failed: `@ts-expect-error` unused | mutation-only option rejected | focused explicit `tsc` red/green plus Vitest type-test lane | verified |
| no forward progress | A non-done empty page with the same cursor can loop forever. | `adapter.test.ts` exported-helper regression with two-query cap | failed with test cap instead of invariant | helper throws clear error after first page | focused red/green command | verified |

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
- Commit: pending
- PR: pending
- Issue: pending
- Browser proof: pending
- Caveats: the user approved regenerating the five additional shadcn-owned
  fixture snapshots for `lucide-react ^1.28.0`; final gates are in progress.

Timeline:
- 2026-07-30T12:05:36.311Z Task goal plan created.
- 2026-07-30T12:20:00Z Filled task contract, source matrix, branch, TDD, docs,
  release, and verification decisions.
- 2026-07-30T14:11:00+0200 Completed three red-green cycles and added the
  changeset plus durable solution note.
- 2026-07-30T14:25:00+0200 Full gate isolated repeated shadcn registry drift;
  targeted `next` sync/check passed, then `next-auth` proved five more
  snapshots require explicit scope approval.
- 2026-07-30T14:30:00+0200 Read-only targeted checks proved every remaining
  affected fixture has exactly the same one-line dependency drift.
- 2026-07-30T14:31:00+0200 The same explicit-approval blocker reached three
  consecutive goal turns; goal marked blocked until the user approves.
- 2026-07-30T14:48:00+0200 User approved the five exact generated fixture
  refreshes; verification and PR closeout resumed.
- 2026-07-30T14:53:58+0200 Refreshed and verified all six affected fixtures;
  each snapshot changed only `lucide-react ^1.27.0` to `^1.28.0`.
- 2026-07-30T15:01:00+0200 Final `bun check` passed all repository gates.
- 2026-07-30T15:07:44+0200 Repaired the autoreview P2 with a pinned Convex
  1.42.3 type lane; it fails on a production revert and passes on the fix.
- 2026-07-30T15:15:00+0200 Repeated final `bun check` passed after the type-lane
  repair.
- 2026-07-30T15:18:00+0200 Final local autoreview found no accepted/actionable
  issues and judged the patch correct.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Final verification and review |
| Where am I going? | Commit, PR, remote checks, closeout |
| What is the goal? | Fix terminating auth pagination and action-safe mutation typing, then ship a verified task-style PR. |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- Pending.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
