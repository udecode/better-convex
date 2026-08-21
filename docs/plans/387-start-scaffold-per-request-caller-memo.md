# 387 start scaffold per-request caller memo

Objective:
Give the TanStack Start auth scaffold Next-parity request-scoped auth: one Convex token fetch per request instead of one per procedure call, with proven cross-request isolation.

Goal plan:
docs/plans/387-start-scaffold-per-request-caller-memo.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- docs (docs/plans/templates/packs/docs.md)

Task source:
- type: GitHub issue (public bug report with technical diagnosis + suggested fix)
- id / link: #387 https://github.com/udecode/kitcn/issues/387
- title: Start scaffold: `runServerCall` builds a fresh caller per call, so K
  procedure calls cost K token fetches — the Next scaffold caches, Start does not
- comments: none (verified via `gh issue view 387 --json comments`)
- acceptance criteria: K procedure calls inside one Start request cost 1 token
  fetch, not K; Start reaches Next parity; per-request memo must not leak across
  requests.
- likely files/packages: `packages/kitcn/src/auth-start/server.ts`,
  `packages/kitcn/src/cli/registry/items/auth/auth-start-server-call.template.ts`,
  `packages/kitcn/src/server/lazy-caller.ts`, `fixtures/start-auth/**`,
  `www/content/docs/tanstack-start.mdx`,
  `packages/kitcn/skills/kitcn/references/setup/start.md`
- browser surface: none (server-side request/token plumbing, no rendered output)
- root-cause layer: library runtime + scaffold template (NOT scaffold-only as the
  issue claims)

Timed checkpoint:
- requested duration: N/A; none requested
- semantics: N/A
- initial confidence score: 95%
- improvement loop: P1 autoreview, red-green regression, full repo gate
- final score / loop closure: 98%; P1 review and full repo gate clean

Completion threshold:
- `kitcn init -t start` + auth apps fetch the Convex auth token at most once per
  request, proven by a bun test that counts token fetches and by a mutation test
  proving the guard is load-bearing; cross-request isolation proven by an
  identity assertion that a module-scope memo fails; repo gates green.
- PR #401 is open with the task-style body, `Fixes #387`, and this plan named
  at the PR head.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/387-start-scaffold-per-request-caller-memo.md` passes.

Verification surface:
- `bun test packages/kitcn/src/auth-start/ packages/kitcn/src/server/` (189 pass)
- `bun test` full suite (1297 pass, 0 fail)
- `CI=1 bun test ./packages/kitcn/src/cli/cli.commands.ts` (124 pass)
- `bun typecheck` (5/5 packages), `bun lint` (936 files, clean)
- `bun run fixtures:check` (8/8 fixtures match)
- Real client-bundle proof: `bun run scenario:prepare start-auth` then
  `bun run build` in `tmp/scenarios/start-auth/project`
- Mutation tests killing each new guard (recorded under Verification evidence)

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
- Source of truth: GitHub issue #387.
- Allowed edit scope: `packages/kitcn/src/auth-start/**`,
  `packages/kitcn/src/server/caller-factory*`, Start auth scaffold templates and
  their CLI assertions, `fixtures/start-auth/**` (generated), Start docs in
  `www/**` + `packages/kitcn/skills/kitcn/**`, `tooling/test-setup.ts`,
  `.changeset/**`.
- Browser surface: N/A — server-side request/token plumbing, no rendered output
  changes. Proof is the built client bundle, not a rendered page.
- GitHub issue sync: PR #401 opened at the user's explicit request; it carries
  `Fixes #387`, so the issue closes on merge. No separate issue comment.
- Non-goals: enabling `jwtCache` by default on Start (rejected with evidence,
  see Decisions); unifying `convex/browser` vs `convex/nextjs`; changing Next's
  always-swallow `isUnauthorized` semantics; memoizing inside `createLazyCaller`.

Output budget strategy:
- Workflow agent reports written to `/tmp/wf387-reports.md` and
  `/tmp/wf387-challenges.md` and read in bounded slices, never streamed whole.
- Test runs filtered through `tail`/`grep` to pass/fail summaries.
- One accidental large output: a `toContain` failure dumped the whole source
  file; assertion narrowed immediately after.

Blocked condition:
- None encountered. `fixtures:check` infra flakes (shadcn clone reset, bun
  `cssesc` link EEXIST) were retried to a clean pass rather than treated as
  blockers.

Task state:
- task_type: bug (library runtime + scaffold)
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: fixed
- confidence: 95-100%
- next owner: task
- reason: every source-listed case has a passing test, each new guard is
  mutation-proven, and the runtime claim is verified against a real built
  client/server bundle.

Implementation readiness:
- verdict: ready (after pivot from the issue's suggested fix)
- exact owner: `packages/kitcn/src/auth-start/server.ts` (library), with a
  shared-retry correction in `packages/kitcn/src/server/caller-factory.ts`.
- contradiction status: resolved. The issue says "scaffold parity gap, not a
  library runtime defect"; the repro proves the opposite. Settled by building
  the harness and reading React's own `cache` implementation.
- source-listed cases complete: yes (see case matrix)

Pre-solution issue challenge:
- reporter claim (falsifiable): "In a TanStack Start app scaffolded by
  `kitcn init -t start` + auth, K procedure calls in one request perform K
  Convex auth-token fetches; the Next scaffold performs 1."
- suggested diagnosis: `runServerCall` calls `createServerCaller()` per call, so
  the caller (and its context) is rebuilt each time.
- suggested fix: memoize the request context; Start has no React `cache()`
  equivalent so use a Start-appropriate per-request mechanism.
- repro ladder:
  - tests / source-level repro: DONE. `bun test` scratch harness reproducing the
    exact two scaffold templates. Results:
    `[A] 3 separate runServerCall -> tokenFetches=3 convexFetches=3`
    `[B] 1 runServerCall, 3 procedure calls on ONE caller -> tokenFetches=3`
    `[C] 3 direct getToken() -> tokenFetches=3`
  - repo-owned automated browser or integration proof: N/A — server-side token
    plumbing has no browser-observable surface; the bun test harness is the
    honest lowest layer.
  - Browser plugin: N/A — no browser-rendered output changes.
  - screenshot / visual proof: N/A — no visual output.
- reproduction verdict: valid — symptom reproduced exactly.
- validity verdict: **partially valid**. The symptom and the impact are real. The
  reporter's *diagnosis is incomplete* and the *suggested fix is insufficient*:
  1. Case [B] proves that building the caller once does NOT fix it.
     `packages/kitcn/src/server/lazy-caller.ts:92` calls `createContext()` on
     EVERY procedure invocation, so a single shared caller still costs K token
     fetches. The memo must live on the context function, not the caller.
  2. Case [C] proves a defect the issue never mentions:
     `packages/kitcn/src/auth-start/server.ts:26-30` memoizes `getToken` with
     `React.cache`, but React `cache()` is a **pass-through outside an RSC
     request scope**, and TanStack Start SSR is not RSC. Verified empirically on
     react 19.2.4: `Promise.all([f(o), f(o), f(o)])` => 3 executions. So
     `convexBetterAuthReactStart`'s advertised caching is a no-op in the only
     framework it exists for, and `fetchAuthQuery`/`Mutation`/`Action` pay it too.
  3. The issue's open question about `jwtCache` resolves to a real gap: the Start
     scaffold passes no `jwtCache`, so `packages/kitcn/src/auth/internal/token.ts:38`
     always network-fetches, while `packages/kitcn/src/auth-nextjs/index.ts:108`
     defaults it on (`jwtCache !== false`).
  4. Separate latent defect found while reading: the scaffold adapts `getToken`
     to `async () => ({ token: await getToken() })`, dropping `isFresh` and the
     `(siteUrl, headers, opts)` signature, so `forceRefresh` from
     `caller-factory.ts:168` cannot reach the token layer — the expired-token
     retry path is dead on Start.
- best long-term fix boundary: TanStack Start already runs every request inside
  an `AsyncLocalStorage<{h3Event}>` (`@tanstack/start-server-core`
  `dist/esm/request-response.js:6,42` — `requestHandler()` enters the store) and
  exports `getRequest(): Request` (`request-response.d.ts:8`), whose identity is
  stable for the request. That makes a `WeakMap` keyed on the request object a
  correct, dependency-free, request-isolated memo. Ownership belongs in
  `packages/kitcn/src/auth-start/server.ts` (library), not in the scaffold
  template, so hand-written Start callers get the fix too.
- harsh honest feedback: the issue's framing ("This is a scaffold parity gap, not
  a library runtime defect") is wrong. It is primarily a library runtime defect —
  `React.cache` in `auth-start/server.ts` never worked. Fixing only the scaffold
  as suggested would leave both case [B] and case [C] broken.
- hard-stop decision: proceed — reproduced and valid; pivot from the suggested
  scaffold-only patch to the library ownership fix.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/387-start-scaffold-per-request-caller-memo.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: server-side token plumbing; no UI or rendered output can change |
| Skill analysis before edits | yes | task + autogoal (task template, package-api + docs packs); changeset and autoreview loaded at closeout |
| Active goal checked or created | yes | this plan, created via create-goal-scratchpad.mjs |
| Source of truth read before edits | yes | attachment + `gh issue view 387` (body and comments) read before any edit |
| Exact per-PR task ownership | yes | This plan owns PR #401 and exists at its exact head |
| GitHub comments and attachments read | yes | attachment read; `gh issue view 387 --json comments` returned none |
| Video transcript evidence required | no | N/A: no video or screen recording in the source |
| Pre-solution issue challenge required | yes | see Pre-solution issue challenge: verdict partially valid |
| Reproduction verdict before implementation | yes | reproduced 3/3 source cases before any edit |
| Repro escalation ladder selected | yes | source-level bun test harness; browser/native rungs N/A (no rendered output) |
| Suggested fix reviewed against durable boundary | yes | suggested scaffold-only fix rejected; case [B] proves it insufficient |
| `docs/solutions` checked for non-trivial existing-code work | yes | found and updated start-loader-auth-must-prime-convex-query-client-before-provider-20260519.md |
| TDD decision before behavior change or bug fix | yes | repro-first, then shipped tests; each guard mutation-proven |
| Branch decision for code-changing task | yes | already on dedicated branch `issue-387`; not main |
| Release artifact decision | yes | .changeset/eighty-moons-invent.md (minor) |
| Browser tool decision for browser surface | no | N/A: no browser-rendered output; proof is the built client bundle |
| Commit / PR expectation decision | yes | Autoclosure requires commit, push, exact-head proof, receipt, and merge |
| Task-style PR body decision | yes | PR #270 emoji task-style body used |
| Task-plan PR body evidence | yes | Body carries `🧭 Task plan: docs/plans/387-start-scaffold-per-request-caller-memo.md`; plan is at the PR head and names PR #401 |
| GitHub issue sync expectation decision | yes | `Fixes #387` in the PR body; no separate comment needed |
| Output budget strategy recorded | yes | see Output budget strategy |
| Package/API pack selected | yes | --with package-api |
| Public surface or package boundary identified | yes | `kitcn/auth/start/server` (convexBetterAuthReactStart) and `kitcn/server` retry path |
| Convex entry/import graph impact identified | yes | none: nothing under convex/** imports kitcn/auth/start/server; kitcn/server gained no import |
| CLI/scaffold/generated impact identified | yes | both Start auth templates, their CLI assertions, and fixtures/start-auth |
| Release artifact path selected | yes | .changeset |
| `changeset` skill loaded when `.changeset` is required | yes | .agents/rules/changeset.mdc read before writing |
| Package build / fixture impact decision recorded | yes | bun --cwd packages/kitcn build + fixtures sync/check required and run |
| Docs pack selected | yes | --with docs (supporting surface) |
| Docs guidance loaded | yes | doc-guidelines / no-changelog-voice rule from AGENTS.md |
| Docs lane selected | yes | supporting: Start setup docs + mirrored kitcn skill |
| Target docs and nearest sibling docs read | yes | tanstack-start.mdx, migrations/auth.mdx, skills setup/start.md, nextjs sibling for parity |
| Docs style doctrine read | yes | current-state reference voice; no migration/changelog narrative in www |
| Documented source owner identified | yes | convexBetterAuthReactStart in packages/kitcn/src/auth-start/server.ts |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless (N/A: no duration requested)
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. This plan owns PR #401.
      PR, owns a not-yet-created PR slice, or records N/A because no PR is in
      scope; a batch plan is not used as a substitute.
- [x] Required video or screen-recording evidence is cached/read as normalized (N/A: no video in the source)
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
      (commit + push + PR #401 completed after the user requested a PR)
- [x] PR body shape recorded: PR #270 emoji task-style body used, N/A reason (N/A: no PR created)
      recorded, or blocker recorded.
- [x] PR task evidence recorded: body includes `🧭 Task plan: ...`, the plan (N/A: no PR created)
      exists at the PR head, and it identifies the exact PR before autoclosure.
- [x] Branch handling recorded for code-changing work: dedicated branch used,
      new branch needed, or N/A with reason.
- [x] Local-env-rot retry policy recorded for any surprising repo-wide failure: (N/A: no corruption signals; infra flakes were network/link races)
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
- [x] Agent-native review decision recorded for `.agents/**`, `.claude/**`, (N/A: only the generated kitcn skill mirror changed, from its package source)
      `.codex/**`, skills, hooks, commands, prompts, or user-action tooling.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. (N/A: a changeset was added)
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable, (N/A: no CLI command contract changed)
      and non-interactive with explicit confirmation bypass when relevant.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded or marked N/A with reason.
- [x] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed or marked N/A with reason.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages or are marked N/A with reason. (N/A: no links, anchors, or previews added)

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | all commands under Verification surface run; results under Verification evidence |
| Exact per-PR task ownership | yes | Record the exact PR and dedicated plan, or the not-yet-created single-PR slice | PR #401, this plan |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | partially valid; pivoted to the library boundary |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | source-level repro sufficient; higher rungs N/A (no rendered surface) |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | 3/3 cases reproduced before edits |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 189 pass across auth-start + server; 4 mutation tests kill each guard |
| TypeScript or typed config changed | yes | Run relevant typecheck | bun typecheck 5/5 packages |
| Package exports or file layout changed | no | Run the relevant package build before final verification and keep generated updates | N/A: no export-map change; ran bun --cwd packages/kitcn build anyway |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: no manifest or lockfile change |
| Agent rules or skills changed | yes | Run `bun install` and verify generated skill sync | packages/kitcn/skills/kitcn edited; regenerated .agents mirror via sync-kitcn-skill.ts; intent:validate + intent:stale clean |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | repo root for tests/typecheck/lint/fixtures; tmp/scenarios/start-auth/project for the bundle build |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: no browser-rendered output |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: replaced by a built client/server bundle audit |
| UI walkthrough | no | If UI or rendered output changed, run `.agents/skills/walkthrough/SKILL.md` after final proof and show annotated images in the final handoff; otherwise record N/A | N/A: no UI or rendered output changed |
| Scaffold or fixture output changed | yes | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | fixtures:sync then fixtures:check: 8/8 fixtures match |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | .changeset/eighty-moons-invent.md (minor, with Before/After per breaking change) |
| Docs and kitcn skill sync changed | yes | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | www + packages/kitcn/skills/kitcn edited together; .agents mirror regenerated |
| Docs or content changed | yes | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | source-backed against the new API; Callout type="warn" verified valid in fumadocs-ui |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | public API + runtime change; see High-risk note |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: only the generated kitcn skill mirror changed, from its package source; no hooks/commands/prompts/user-action tooling touched |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: no corruption signals; the two infra flakes were network/link races, resolved by retry |
| Commit created | yes | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | `8502bfeb` + plan-sync commit on `fix/start-request-scoped-convex-token` |
| PR create or update | yes | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | `bun check` green across every lane, pushed, PR #401 created |
| Task-style PR body verified | yes | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | `gh pr view 401 --json body` read back; auto-release block present, no self-link, all required sections present |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, and exact PR ownership | Plan line present; plan committed at PR head naming PR #401 |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no images; no browser-rendered output changed |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists, or record N/A/blocker | `Fixes #387` in PR #401 body links and closes the issue on merge |
| Final handoff contract | yes | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | see Final handoff / sync |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | bun lint:fix then bun lint: 936 files, clean |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | one oversized toContain failure dump; assertion narrowed immediately |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | --mode local --engine claude: clean, no accepted/actionable findings; its one sub-threshold doc finding applied |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/387-start-scaffold-per-request-caller-memo.md` | check-complete.mjs run at closeout |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | convexBetterAuthReactStart surface audited; kitcn/server barrel unchanged |
| Convex bundle/import proof | yes | Audit affected function-entry static graphs or record N/A | no convex/** entry imports kitcn/auth/start/server; kitcn/server gained no import |
| CLI/scaffold/generated proof | yes | Prove command contract and regenerate owned output or record N/A | test:cli 124 pass; fixtures:check 8/8; scenario build of the generated app succeeds |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | published package API + runtime behavior change |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | .changeset/eighty-moons-invent.md |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: a changeset was added |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | bun --cwd packages/kitcn build; bun typecheck; bun test 1297 pass |
| Fixture/scaffold generation | yes | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | fixtures:sync + fixtures:check clean |
| Docs/package skill sync | yes | Synchronize current-state public guidance or record N/A | skill mirror regenerated; intent:validate + intent:stale clean |
| Docs source-backed claim audit | yes | Verify docs claims against current source or record N/A | every snippet matches the emitted template and the fixture byte-for-byte |
| Docs links / routes / previews | no | Verify leaf links, routes, anchors, and preview names or record N/A | N/A: no links, routes, or previews added |
| Docs MDX/content parser | yes | Run the relevant `www` docs parser/build for MDX/content changes, or record N/A | Callout type="warn" confirmed a valid CalloutType in fumadocs-ui |
| Kitcn docs sync | yes | If `www/**` changed, update matching `packages/kitcn/skills/kitcn/**` content or record N/A | www/** and packages/kitcn/skills/kitcn/** changed in the same diff |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue + comments fetched; repro built | implementation |
| Implementation | complete | library memo, scaffold hard cut, retry write-back, docs, changeset | verification |
| Verification | complete | see Verification evidence | closeout |
| Commit / PR / GitHub sync | complete | branch renamed to `fix/start-request-scoped-convex-token`, pushed, PR #401 opened with the task-style body | closeout |
| Closeout | complete | autoreview run; findings resolved | final response |

Findings:
- React `cache()` is a **pass-through outside an RSC render**, so the memo in
  `auth-start/server.ts` never worked. React's default build (`react/cjs/react.development.js`)
  ships `cache` as a hardcoded identity wrapper with no dispatcher at all;
  the `react-server` build checks a dispatcher that only a live Flight render
  sets. TanStack Start resolves the default build.
- `createLazyCaller` calls `createContext()` on **every** procedure invocation
  (`lazy-caller.ts:92`), so the issue's suggested fix (build the caller once)
  would not have fixed anything. The memo must live on the context function.
- TanStack Start runs every request inside an `AsyncLocalStorage`
  (`@tanstack/start-server-core` `request-response.js`, `requestHandler` →
  `eventStorage.run({h3Event}, ...)`) and exports `getRequest(): Request`, whose
  identity is stable per request and distinct across requests. That is a sound,
  dependency-free `WeakMap` key.
- `getRequestHeaders()` is **not** identity-stable within a request. srvx serves
  a lazy header view until anything materializes the native Request, then swaps
  in that Request's `Headers` and drops the old one
  (`srvx/dist/adapters/node.mjs:230-232,281`); `start-server-core`'s
  server-function handler calls `await request.formData()`. An adversarial probe
  against a real `node:http` + srvx server saw the swap on 8 of 24 requests.
- The Start scaffold's `getToken` adapter dropped `isFresh`, which made
  `canRefreshToken` always true (`caller-factory.ts:153`) — so a legitimate
  `UNAUTHORIZED` from `requireAuth` re-ran the procedure, double-executing
  non-idempotent mutations and actions.
- `callWithTokenAndRetry` never wrote the refreshed token back into the shared
  `tokenResult`, so any memoized context replays the rejected token on every
  later call. Latent on Next today; my memo would have made it reachable on
  Start.
- `tooling/test-setup.ts` left `import('@testing-library/react')` floating, so
  Testing Library's module-scope `beforeAll` could land inside a running test.
  Reproduced at ~1 run in 5 once the auth-start suite grew.

Decisions and tradeoffs:
- **Ownership: the library, not the scaffold.** `kitcn/auth/start/server` owns
  request scoping because it is the only layer that knows what a Start request
  is. A scaffold-owned memo is a correctness invariant every app would have to
  reimplement, and getting it wrong is invisible — a module-scope memo scores
  *better* on every dedupe metric while serving one user's token to another.
- **Not `kitcn/server`.** That barrel is statically imported by Convex function
  entries, which run in a V8 isolate with no Node builtins and no dynamic
  imports. Start request-scope code there is a push-time failure.
- **Keep both scaffold files.** `auth-server.ts` is Start's analogue of Next's
  `server.ts` (the factory); `server.ts` is Start's analogue of Next's
  `rsc.tsx` (the request-bound caller). Preserves the documented import paths
  and mirrors Next's structure.
- **Hard-cut `runServerCall`.** With a request-scoped caller, a callback that
  receives a caller has no reason to exist. No alias, no shim (repo doctrine).
- **Rejected: `jwtCache` on by default** (the issue's open question). Two
  independent adversarial reviews found it is a separate parity gap that (a)
  ships an untested cookie path whose name depends on `cookiePrefix`, and (b)
  regresses the browser: `syncConvexAuthForStartLoader` captures the token
  string for the socket's lifetime, and a cookie JWT can be ~61s from expiry
  and cannot be renewed from that callback. Answer recorded: not by default.
  The option is exposed as `auth.jwtCache` with the hazard documented.
- **Rejected: memoizing inside `createLazyCaller`.** The Start caller is
  module-scope and outlives requests, so a caller-level memo is exactly the
  cross-user leak. Context-per-invocation is the right contract there.
- **Accepted asymmetry:** Start passes `isUnauthorized: auth.isUnauthorized`
  (undefined unless opted in) rather than Next's
  `?? defaultIsUnauthorized`, which makes Next always swallow UNAUTHORIZED to
  null. Preserving Start's current throw behavior beats importing a Next quirk;
  reconciling Next is out of scope.
- **Fixed the shared retry write-back** even though it is a pre-existing Next
  bug, because exposing `auth.jwtCache` would otherwise ship a footgun with it.

Implementation notes:
- None yet.

Review fixes:
- Autoreview (`--mode local --engine claude`, `claude-fable-5`): clean, no
  accepted/actionable P0 findings; verdict "patch is correct (0.78)".
- Applied its one sub-threshold finding: the `auth` option JSDoc still claimed
  "JWT caching is enabled by default", left over from the reverted default flip.
  It contradicted both the implementation and `AuthOptions.jwtCache`. Removed.
- Recorded its residual `isFresh` write-back note under Open risks rather than
  patching: it is the documented retry contract, not a defect.
- Autoclosure P1 review found that `fetchAuth*` replaced the request memo after
  refresh while an existing caller retained the old token object. The shipped
  cross-path test failed with three token fetches. `callWithToken` now mutates
  the shared result, so the caller uses the fresh token without another replay.

Autoclosure feedback ledger:
| Source | Priority | Rationale | Verdict | Proof | Reply / resolution |
| --- | --- | --- | --- | --- | --- |
| local autoreview at PR #401 head `80329e00` | P1 | Existing request callers could replay a mutation or action with a rejected token after a fetch-helper refresh | fixed | red `index.retry.test.ts`: 3 fetches; green: 2 fetches and one caller mutation | local finding; terminal PR receipt records the fix |

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `auth-start` suite failed ~1 run in 5 with Testing Library `beforeAll() inside a test` | ~4 | Check whether `main` flakes the same way before touching product code | Baseline was 10/10 clean, so the flake was mine to fix: `tooling/test-setup.ts` left `import('@testing-library/react')` floating and it could resolve mid-test. Awaited it. 12/12 clean after. |
| `bun test packages/kitcn/src/auth-start/` failed with `Export named 'getRequest' not found` only in directory runs | 1 | Suspect `mock.module` cross-file pollution, not the real module | `index.retry.test.ts` mocked `@tanstack/react-start/server` with only `getRequestHeaders`; updated its mock to the new module surface. |
| Header-churn regression test passed against a deliberately broken mutant | 1 | Reorder the test so the context is built *after* the swap | Rewrote it to resolve the ambient token first; mutant now dies with `Expected: 1 Received: 2`. |
| `fixtures:check` aborted: shadcn clone `Connection reset by peer`, then bun `Failed to link cssesc: EEXIST` | 2 | Retry rather than fall back; these are network/link races, not drift | Third run clean: 8/8 fixtures match. |
| Full `bun test` reported `1294 pass / 1 fail` once, running 1295 of 1297 tests | 1 | Try to reproduce before dismissing; compare against baseline | Not reproduced in 11 consecutive full runs afterwards; `main` baseline also 6/6 clean. Two tests not running (rather than an assertion failing) points at a module-load/mock-registry hiccup. Recorded as unreproduced, not claimed as fixed. |

Verification evidence:
- Pre-fix repro (scratch harness, since replaced by shipped tests):
  `[A] 3 separate runServerCall -> tokenFetches=3`, `[B] 3 calls on one caller
  -> tokenFetches=3`, `[C] 3 getToken() -> tokenFetches=3`.
- `bun test packages/kitcn/src/auth-start/ packages/kitcn/src/server/` → 189 pass, 0 fail.
- Cross-path refresh regression: `caller.getToken()` captures the stale shared
  result, `fetchAuthQuery` refreshes it, then `caller.todos.create` uses the
  fresh token directly. Red: 3 token fetches. Green: 2 token fetches, one caller
  mutation, no second replay.
- Final local P1 autoreview after the fix: clean; patch-correct confidence 0.93.
- Final `bun lint:fix`, package build, and `bun check`: exit 0. The gate covered
  lint, typecheck, Bun/Vitest/CLI tests, Concave smoke, all scaffold fixtures,
  and runtime scenarios.
- `bun test` (whole repo) → 1297 pass, 0 fail, 146 files.
- `CI=1 bun test ./packages/kitcn/src/cli/cli.commands.ts` → 124 pass, 0 fail.
- `bun typecheck` → 5/5 packages. `bun lint` → 936 files, clean.
- `bun run fixtures:check` → all 8 fixtures match fresh scaffold output.
  (Two infra flakes first: shadcn clone connection reset, then a bun
  `cssesc` link EEXIST. Retried to a clean pass; neither touched repo code.)
- Client-bundle proof, cwd `tmp/scenarios/start-auth/project` after
  `bun run scenario:prepare start-auth`: `bun run build` succeeded (client +
  SSR). Client bundle contains 0 files matching `node:async_hooks`,
  `async_hooks`, `convex/nextjs`, `getRequest`, `convexBetterAuthReactStart`,
  `createCallerFactory`; server bundle contains `getRequest` and `createCaller`.
  This is the gate that `scenario:check start-auth` does not cover.
- Mutation tests (each new guard proven load-bearing):
  | Mutation | Expected kill | Result |
  | --- | --- | --- |
  | Disable the per-request memo entirely | dedupe tests fail | 4 of 6 failed |
  | Module-scope memo key (cross-user leak) | SECURITY test fails | only the identity test failed — dedupe counts all passed, confirming a count-only suite cannot catch the leak |
  | Compare the live `request.headers` accessor instead of the snapshot | churn test fails | `Expected: 1  Received: 2` |
  | Remove the retry token write-back | reuse test fails | `Expected: 4  Received: 6` |
- Harness flake fix verified: auth-start suite 12/12 clean runs after awaiting
  the Testing Library import (was ~1 failure in 5 before; `main` baseline was
  10/10 clean, so the flake was introduced by suite growth, not pre-existing
  redness).

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| K calls cost K token fetches | issue title/summary | `server.request-scope.test.ts` "K procedure calls in one request cost 1 token fetch" | 3 fetches for 3 calls | 1 | pass; memo-disabled mutant fails | done |
| Next caches, Start does not | issue summary | same file, concurrent + shared-surface tests | Start had no working memo | 1 fetch shared by caller, `getToken()`, `fetchAuth*` | pass | done |
| Fix = build the caller once | issue suggested fix | repro case [B] | 3 calls on ONE caller still cost 3 fetches | n/a — claim disproven | recorded in Findings | rejected |
| Start has no React `cache()` equivalent | issue root cause | React source read + execution probe | `cache()` silently no-ops in Start | replaced by `getRequest()` + WeakMap | `index.test.ts` "keeps react out of the server entry" | done |
| Should Start enable jwtCache by default? | issue open question | two adversarial reviews + `token.ts` read | off | stays off; exposed as `auth.jwtCache` with hazard documented | Decisions | answered |
| Memo must not leak across requests | derived safety requirement | "SECURITY" test | n/a | alice never sees bob's token | pass; module-scope mutant fails only this test | done |

Final handoff contract:
- Commit line: PR #401 contributor commits plus the autoclosure P1 fix
- PR line: https://github.com/udecode/kitcn/pull/401
- Issue line: #387 closes through `Fixes #387` on merge
- Confidence line: 98%
- Flow table:
  - Reproduced: token refresh crossed helper/caller paths with 3 token fetches;
    browser N/A
  - Verified: 2 token fetches, one caller mutation, full repo gate green;
    browser N/A
- Browser check: N/A; server-only token plumbing
- Outcome: one request-scoped token result is shared and refreshed in place
- Caveat: `jwtCache` remains opt-in on Start
- Design:
  - Chosen boundary: Start request identity plus a shared mutable token result
  - Why not quick patch: caller-only memoization leaves helper paths stale
  - Why not broader change: Next and unrelated auth behavior are outside #387
- Verified: lint, package build, focused tests, full `bun check`, fixtures, and
  runtime scenarios pass
- PR body verified: task plan line, `Fixes #387`, final behavior, and proof are
  present

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
- Commit: `8502bfeb` plus a plan-sync commit, on `fix/start-request-scoped-convex-token`
  (renamed from `issue-387` before the first push, per the user's branch convention).
- PR: https://github.com/udecode/kitcn/pull/401 —
  `fix(auth-start): resolve Convex token once per request`. Opened after the
  user explicitly requested a PR, which overrode their standing default.
- Issue: #387 closes on merge via `Fixes #387` in the PR body.
- Browser proof: N/A — no browser-rendered output changed. Replaced by a built
  client/server bundle audit.
- Caveats: `jwtCache` deliberately stays off by default on Start; a very
  long-lived request that starts with no session cookie holds one freshly
  minted token for its lifetime (same semantics as Next under `React.cache`).

Timeline:
- 2026-08-21T14:13:41.645Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Final response |
| What is the goal? | One Convex token fetch per Start request, with proven cross-request isolation |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

High-risk note:
- Surface: public API (`convexBetterAuthReactStart` now requires `api` and
  returns `createCaller`/`createContext`) plus a runtime change to how the
  Convex auth token is resolved on every TanStack Start server call, and a
  shared change to `callWithTokenAndRetry` that also affects Next.
- Realistic failure mode: a per-request memo that is not actually per-request
  serves one user's Convex token to another. This fails silently and looks
  *better* on every performance metric, which is why a dedupe-count test suite
  is not adequate proof.
- Proof plan, executed: key the memo on `getRequest()`, whose identity comes
  from TanStack Start's own per-request `AsyncLocalStorage` and which throws
  (fails closed) outside a request; assert token *identity* per request, not
  just fetch counts; mutate the implementation to a module-scope memo and
  confirm only the identity assertion catches it; build the generated app and
  confirm no server-only symbol reaches the client bundle.
- Why this boundary is right: request scoping is a framework-correctness
  invariant, not a user preference. The library entry is the only layer that
  knows what a Start request is; `kitcn/server` cannot hold it (Convex isolates
  have no Node builtins), and the scaffold must not, because every app would
  reimplement it and a wrong implementation is invisible.

Open risks:
- `getRequest()` identity is an internal of a 0.x-cadence dependency. It fails
  closed (throws) outside a request scope, and node/srvx was probed directly,
  but Bun/Deno/CF/Vercel-edge adapters were not. A cheap future hardening is to
  fingerprint the memo entry with the request's `cookie` value and treat a
  mismatch as a miss.
- Suspense boundaries that resolve after the first SSR flush were not proven to
  retain the Start request scope. Not a regression — the previous code had the
  identical requirement via `getRequestHeaders()` — but `getRequest()` now runs
  on every procedure invocation including memo hits.
- After a forced refresh publishes `isFresh: true`, a later call in the same
  request that hits a genuine authorization failure surfaces it instead of
  refreshing again. That is the intended `isFresh` contract (a freshly minted
  token cannot be stale, and replaying is unsafe for mutations/actions), but it
  narrows the retry window at a token-expiry boundary.
- Follow-ups worth their own issue: `GetTokenOptions.jwtCache.isAuthError` is
  now dead config; Next's `convexBetterAuth` always swallows UNAUTHORIZED to
  null, contradicting `caller-factory`'s documented opt-in intent; `cache()` in
  a Next **route handler** is also a no-op, which silently voids
  `getQueryClient` hydration for any handler importing `@/lib/convex/rsc`.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
