# Cut Deployed Bundle and ORM Update Reads

Objective:
Close and merge the rebased bundle/read performance refactor in PR #352; done
when review repairs and checks pass, every thread is resolved, exact remote
gates pass, the PR merges, and the package release is read back; plan
docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- docs (docs/plans/templates/packs/docs.md)
- browser (docs/plans/templates/packs/browser.md)
- agent-native (docs/plans/templates/packs/agent-native.md)
- package-api (docs/plans/templates/packs/package-api.md)

Linked plans:
- None.

Task source:
- type: GitHub pull request closeout
- id / link: PR #352, https://github.com/udecode/kitcn/pull/352
- title: `refactor(server,orm,cli): cut deployed bundle and update() reads`
- acceptance criteria: create this dedicated plan naming PR #352; include the
  rebased `ratelimit.ts` namespace-import fix; add the plan line and task-style
  evidence to the PR body; run `bun check`; commit and force-push the rebased
  dedicated branch; reopen PR #352; read back its head, body, and `OPEN` state.
- caveat: the user supplied benchmark numbers and said the implementation had
  already passed `bun check`; this closeout reruns the repository gate but does
  not repeat every timing benchmark.
- likely owners: `packages/kitcn`, CLI scaffold templates, Convex entries,
  fixtures/tooling, `www`, published kitcn guidance, changeset, and GitHub PR.
- browser surface: affected `www` docs route showing the current zod import.
- root-cause layer: branch delivery evidence plus one rebased Convex entry that
  reintroduced a root-barrel zod import.

Timed checkpoint:
- requested duration: N/A: no duration requested.
- semantics: N/A: one-shot closeout.
- initial confidence score: N/A: binary artifact and command gates apply.
- improvement loop: fix accepted review findings, rerun affected proof, then
  close only after GitHub read-back.
- final score / loop closure: N/A: all binary delivery gates passed.

Completion threshold:
- Exactly one plan at
  `docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md`
  names PR #352 and is
  present at the remote PR head.
- `example/convex/functions/plugins/ratelimit.ts` uses `import * as z`.
- `bun check` exits 0 in this workspace after the final source changes.
- The canonical code-standard source explicitly permits the tree-shakeable Zod
  namespace import required by this PR, and generated mirrors match.
- Required package, fixture, docs, browser, agent-native, and autoreview gates
  pass with no accepted/actionable findings.
- The rebased branch is force-pushed, PR #352 has a task-style body containing
  `🧭 Task plan: docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md`, and
  GitHub reads `OPEN` with
  the expected remote head.
- Both unresolved review threads are source-backed, replied to, resolved, and
  absent on final re-fetch; PR #352 is merged and its changeset release is
  verified through GitHub, npm, and post-release gates.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md` passes.

Verification surface:
- Source audit of the final branch diff and affected zod imports.
- `bun --cwd packages/kitcn build`, fixture sync/check where required, and
  root `bun check`, all from this workspace.
- Browser proof of one representative affected docs route plus walkthrough
  baseline/receipt, or an exact caveat if the approved browser backends are
  unavailable after escalation.
- Agent-native review, final autoreview, and zero accepted findings.
- `git` remote-head audit and `gh pr view 352` body/state/head read-back.

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
- Preserve the supplied implementation and measured claims; only repair the
  rebased zod import, delivery evidence, and findings proven during review.
- Do not rename the current branch. Force-push is explicitly authorized for
  this rebased branch and PR only.

Boundaries:
- Source of truth: the user request plus GitHub PR #352 body, comments, review,
  head, and branch state.
- Allowed edit scope: the existing branch diff, requested `ratelimit.ts` fix,
  this task plan, task-style PR body, and review-proven corrections.
- Browser surface: one representative changed `www` docs route; no product
  interaction behavior changed.
- GitHub issue sync: N/A: no separate issue is linked; PR #352 is the tracker.
- Non-goals: repeat all performance benchmarks, expand product scope, alter
  unrelated behavior, or rename the branch. Merge and release are authorized
  by the current autoclosure invocation.

Output budget strategy:
- Use exact files and bounded `rg` globs; inspect diff stats before full diffs;
  cap GitHub/review output; keep screenshots and walkthrough receipts under
  ignored `tmp/walkthrough/pr-352`; do not stream build artifacts or logs unless
  a failing owner requires a narrow excerpt.

Blocked condition:
- Stop only if repository/GitHub write access is unavailable, `bun check`
  repeatedly fails without an in-scope repair, the force-push is rejected, or
  a required behavioral surface remains unproved after prescribed escalation.

Task state:
- task_type: PR closeout for an existing cross-package performance refactor
- task_complexity: normal, non-trivial, measurable
- current_phase: closeout
- current_phase_status: complete
- next_phase: exact merge and release read-back
- goal_status: complete after external merge/release receipts

Current verdict:
- verdict: ready to merge
- confidence: 92%; capped below 95% because timing benchmarks were not rerun and
  the approved browser backends were unavailable
- next owner: GitHub delivery
- reason: canonical rule/mirrors, refreshed fixtures, full check, full-branch
  review, both thread replies/resolutions, and exact remote gates pass.

Implementation readiness:
- verdict: repair-source
- exact owner: ratelimit package scaffold template, generated example, published
  skill source/mirrors, this plan, PR body, branch head, and GitHub state;
  existing implementation remains owned by its current files.
- contradiction status: bounded: current main added a Convex entry that violates
  the branch-wide namespace-import invariant; the supplied local fix resolves it.
- source-listed cases complete: yes; all implementation and closeout cases are
  recorded in the matrix below.

Pre-solution issue challenge:
- reporter claim: the branch cuts zod bundle weight, redundant ORM reads, CLI
  latency/installs, and toolchain work while preserving behavior; the rebase
  added one Convex entry that would repin zod locales.
- suggested diagnosis or fix: retain the implemented ownership changes and use
  the same namespace-import form in the new `ratelimit.ts` entry.
- repro ladder:
  - tests / source-level repro: the registry assertion failed RED against the
    named import, passed GREEN after the template repair, and the full branch
    suite passed.
  - repo-owned automated browser or integration proof: root checks and fixture
    checks own code/scaffold behavior; browser does not own performance claims.
  - Browser plugin: Browser setup returned `No browser is available`; the
    prescribed Chrome fallback also returned `Browser is not available: chrome`.
  - screenshot / visual proof: unavailable because neither approved backend was
    provisioned; the static route returned HTTP 200 and `www` built 189 pages.
- reproduction verdict: valid for closeout; bounded rebase regression proven
  statically, numerical benchmark reruns explicitly outside closeout scope.
- validity verdict: valid.
- best long-term fix boundary: keep namespace imports consistent across runtime,
  scaffolds, examples, and docs; keep ORM/CLI/tooling fixes at their existing
  owners rather than adding compatibility wrappers.
- harsh honest feedback: benchmark numbers are historical PR evidence until
  rerun; confidence must stay below 95% if closeout does not repeat them.
- hard-stop decision: proceed; the claim is not disproven and the bounded
  rebase repair is already present.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | yes | Captured `tmp/walkthrough/pr-352/baseline.json` before plan creation |
| Skill analysis before edits | yes | `task` + required `autogoal`; `walkthrough`, Browser, `changeset`, `agent-native-reviewer`, and final `autoreview` selected from touched surfaces |
| Active goal checked or created | yes | Active goal matches this exact PR closeout and plan |
| Source of truth read before edits | yes | `gh pr view 352` read body, commits, files, review, comments, state, and head before mutation |
| Exact per-PR task ownership | yes | This plan owns only PR #352 |
| GitHub comments and attachments read | yes | Three comments and one review read; no attachments |
| Video transcript evidence required | no | N/A: no video or screen recording |
| Pre-solution issue challenge required | yes | Public technical/performance claims classified above |
| Reproduction verdict before implementation | yes | Valid for delivery; bounded rebase regression proven by source diff |
| Repro escalation ladder selected | yes | Source/tests first; Browser only for rendered docs; screenshot after final proof |
| Suggested fix reviewed against durable boundary | yes | Namespace import applied at the new Convex entry; existing owner-level fixes retained |
| `docs/solutions` checked for non-trivial existing-code work | yes | Focused zod/bundle/update/concurrency search found no matching solution note |
| TDD decision before behavior change or bug fix | yes | Rebase exposed a scaffold behavior gap; add a registry-render assertion, observe RED on named import, then patch template and regenerate |
| Branch decision for code-changing task | yes | Use current dedicated `refactor/cut-deployed-bundle-and-orm-reads`; do not rename; force-push authorized |
| Release artifact decision | yes | Reuse existing `.changeset/perf-zod-namespace-and-write-path.md` |
| Browser tool decision for browser surface | yes | Use repo-approved Browser on representative changed docs route |
| Commit / PR expectation decision | yes | Commit all checkout changes, force-push rebased branch, update and reopen PR #352 |
| Task-style PR body decision | yes | Replace generic body with required PR #270 task-style shape while preserving auto-release block |
| Task-plan PR body evidence | yes | PR body names this exact plan; GitHub's remote content API reads the plan at the PR head and the plan identifies only PR #352 |
| GitHub issue sync expectation decision | no | N/A: PR #352 is the tracker; no separate issue linked |
| Output budget strategy recorded | yes | Exact paths/bounded searches/capped logs recorded above |
| Docs pack selected | yes | Supporting docs changed; docs are not dominant risk |
| Docs guidance loaded | yes | Read `VISION.md`, `docs/README.md`, and kitcn docs sync contract |
| Docs lane selected | yes | Supporting current-state import-example sync |
| Target docs and nearest sibling docs read | yes | Read `server/scheduling.mdx` and nearest `server/server-side-calls.mdx` |
| Docs style doctrine read | yes | Current-state docs and www-to-skill sync doctrine read |
| Documented source owner identified | yes | `www/**` owns public docs; `packages/kitcn/skills/kitcn/**` is compressed published guidance |
| Browser pack selected | yes | Rendered docs output changed |
| Browser route / app surface identified | yes | Representative `http://localhost:3100/docs/server/scheduling`; dev server returned HTTP 200 |
| Browser tool decision recorded | yes | Browser first; no native Chrome/OS behavior applies |
| Console/network caveat policy recorded | yes | Check page console/network after navigation; record unrelated dev noise separately |
| UI state/accessibility matrix recorded | yes | Desktop/mobile rendering applies; loading/error/permission/mutation/keyboard/motion are N/A for a static code-snippet import change |
| Agent-native pack selected | yes | Generated `.agents/skills/kitcn/**` mirrors changed |
| Agent-facing action surface identified | yes | Published kitcn guidance mirrors current import examples |
| Source rule versus generated mirror boundary identified | yes | `packages/kitcn/skills/kitcn/**` is source; `.agents/skills/kitcn/**` is generated mirror |
| Installed-skill lock versus local-rule owner identified | no | N/A: no installed skill or lock entry changes |
| `agent-native-reviewer` loaded or waiver recorded | yes | Skill loaded; source/mirror/action audit found no actionable finding |
| Package/API pack selected | yes | Published runtime, ORM, CLI, scaffold, and changeset surfaces changed |
| Public surface or package boundary identified | yes | `kitcn` runtime/ORM/CLI plus `@kitcn/resend` scaffold output |
| Convex entry/import graph impact identified | yes | Every statically bundled entry must avoid the named zod namespace binding that retains locales |
| CLI/scaffold/generated impact identified | yes | Analyze/add behavior, scaffold templates, generated fixtures, docs mirrors |
| Release artifact path selected | yes | Existing patch changeset covers `kitcn`; audit package list before closeout |
| `changeset` skill loaded when `.changeset` is required | yes | Loaded and existing draft checked against patch/body rules |
| Package build / fixture impact decision recorded | yes | `packages/kitcn` build and fixture sync/check required before root check |

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
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed or marked N/A with reason.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages or are marked N/A with reason; import-only edits add no links or anchors.
- [x] Browser pack: route, interaction path, and expected visible outcome are recorded before proof.
- [x] Browser pack: browser proof uses the repo-approved browser tool or records a blocker/waiver; Browser and Chrome backends were unavailable.
- [x] Browser pack: console and network errors are checked or explicitly out of scope; direct Browser inspection was unavailable, while the route returned 200 and the production build passed.
- [x] Browser pack: screenshot, trace, or exact verification caveat is ready for final handoff; no screenshot could be captured without an approved backend.
- [x] Browser pack: loading, empty, error, permission, mutation, keyboard/focus,
      reduced motion, and responsive cases are covered or N/A with reason.
- [x] Browser pack: Browser is used first for ordinary app QA; Chrome/Computer
      own native browser/OS behavior when applicable.
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed guidance is discoverable in direct setup/import snippets; no action routing changed.
- [x] Agent-native pack: generated mirrors are synced; `.agents/rules/**` did not change, and `diff -qr` proves package skill source equals its mirror.
- [x] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: routing, receipts, placeholder failure, and completion evals are N/A because only import examples changed; source/mirror parity is the smoke row.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason; review found none.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset` or explicit no-artifact reason.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. N/A: an artifact is required and present.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes. N/A: no public API shape changes.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive with explicit confirmation bypass when relevant.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded below.
- [x] Package/API pack: `packages/kitcn` build and fixture sync/check all passed.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the named local gates | `NO_PROXY=localhost,127.0.0.1,::1 bun check` exited 0 |
| Exact per-PR task ownership | yes | Record one PR and one dedicated plan | This date-prefixed plan owns only PR #352 |
| Pre-solution issue challenge verdict | yes | Challenge technical claims before mutation | Verdict `valid`; historical benchmarks distinguished from fresh proof |
| Repro escalation ladder | yes | Use source/tests, integration, Browser, then visual caveat | RED/GREEN registry test; full integration gate; Browser and Chrome unavailable; exact caveat recorded |
| Bug reproduced before fix | yes | Record failing test/repro | Registry render test failed on `import { z }` before template repair |
| Targeted behavior verification | yes | Run focused proof | Registry test passed 5/5 after repair; local CLI regeneration exited 0 |
| TypeScript or typed config changed | yes | Run relevant typecheck | Root `bun check` typecheck passed 5/5 tasks |
| Package exports or file layout changed | yes | Build package | `bun --cwd packages/kitcn build` exited 0 after repairing aggregate import owner |
| Package manifests, lockfile, or install graph changed | no | N/A when no manifest or lockfile delta | N/A: no `package.json` or lockfile delta from `origin/main` |
| Agent rules or skills changed | yes | Sync source-owned skill mirror | `bun tooling/sync-kitcn-skill.ts`; `diff -qr` returned no difference; rules unchanged so root `bun install` N/A |
| Workspace authority proof | yes | Run proof in owning workspace | Package build in `packages/kitcn`; docs build in `www`; fixtures/root checks at repo root |
| Browser surface changed | yes | Use approved Browser or record exhausted waiver | Browser had no backend; Chrome fallback unavailable; static route returned HTTP 200 |
| Browser final proof | yes | Attach screenshot or exact caveat | No approved screenshot backend; `www` production build generated 189 pages |
| UI walkthrough | no | N/A for no layout/interaction change | N/A: only code-snippet text changed; baseline and diff receipt retained under `tmp/walkthrough/pr-352` |
| Scaffold or fixture output changed | yes | Sync and check fixtures | `bun run fixtures:sync` and separate `bun run fixtures:check` passed all 8 |
| Package behavior or public API changed | yes | Add changeset | `.changeset/perf-zod-namespace-and-write-path.md` is a `kitcn` patch |
| Docs and kitcn skill sync changed | yes | Keep guidance synchronized | Current-state examples synced; package skill and generated mirror are byte-identical |
| Docs or content changed | yes | Verify claims/parser/render | Source/sibling audit and `bun --cwd www build` passed 189 pages |
| High-risk mini gate | yes | Record failure modes and boundary | Zod graph, ORM row semantics, and ordered concurrency risks/proof recorded above |
| Agent-native review for agent/tooling changes | yes | Review action parity and mirrors | Reviewer checklist found no action/routing change and no actionable finding |
| Local install corruption suspected | no | N/A when failure is proven external | N/A: failed runtime probe was Conductor proxy routing; focused and full reruns passed with `NO_PROXY` |
| Commit created | yes | Stage the entire verified checkout and commit | `54f911a8 fix(cli,orm): preserve rebased performance owners`; plan-only receipts follow in branch history |
| PR create or update | yes | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | Existing PR #352 updated, reopened, and read back `OPEN` on the verified branch head |
| Task-style PR body verified | yes | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, confidence, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | `gh pr view 352 --json body` preserved the auto-release block and returned every required section with no current-PR self-link |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, and exact PR ownership | Body contains the exact date-prefixed plan line; remote content read-back found this plan at the head; this plan names only PR #352 |
| PR proof image hosting | no | N/A when body has no proof image | N/A: no screenshot artifact exists and body will state the caveat |
| GitHub issue sync-back | no | N/A when no separate issue exists | N/A: PR #352 is the sole tracker |
| Final handoff contract | yes | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | Filled below with PR, confidence, tests, browser caveat, outcome, design, and verification evidence |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` exited 0; final `bun check` lint also passed |
| Output budget discipline | yes | Bound output and searches | Searches were path-bounded; required full-check output was polled with caps and summarized |
| Timed checkpoint | no | N/A when no duration requested | N/A: one-shot goal |
| Autoreview for non-trivial implementation changes | yes | Run branch review and close accepted findings | TruffleHog clean; nested Codex helper hit external 401 twice; isolated same-model `gpt-5.6-sol`/high review covered all 100 files with no P0 findings at 94% |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-cut-deployed-bundle-and-orm-reads.md` | Final receipt contains no open state; checker exits 0 before the receipt commit is pushed |
| Docs source-backed claim audit | yes | Verify changed claims against source | Import-only examples match runtime/scaffold namespace form |
| Docs links / routes / previews | no | N/A when no link/route/preview target changed | N/A: only import forms changed; representative route itself returned 200 |
| Docs MDX/content parser | yes | Run relevant docs build | `bun --cwd www build` generated 189 static pages |
| Kitcn docs sync | yes | Sync matching published guidance | All affected package-skill examples use namespace imports and mirror exactly |
| Browser interaction proof | no | N/A for static snippet with unavailable approved backends | N/A: no interaction changed; HTTP 200 and production render build are the substitute |
| Browser console/network check | no | N/A when approved backend unavailable | N/A: Browser and Chrome unavailable; dev server logged a successful route request |
| Browser state/accessibility proof | no | N/A for no UI state/layout behavior | N/A: only code-snippet text changed |
| Browser final proof artifact | yes | Record screenshot/trace or exact caveat | Exact no-backend caveat plus walkthrough diff receipt recorded |
| Agent source / generated sync | yes | Verify source and mirror | `diff -qr packages/kitcn/skills/kitcn .agents/skills/kitcn` exited 0 |
| Installed lock audit | no | N/A when installed-skill state is unchanged | N/A: no lock or installed skill changes |
| Agent action discoverability | yes | Source-audit guidance path | Setup/import examples are direct text under the published kitcn skill |
| Helper and template smoke | yes | Prove changed template output | Registry test and local `kitcn add ratelimit --overwrite --json --no-codegen` passed |
| Agent-native review | yes | Close actionable findings | No findings; guidance-only sync preserves action parity |
| Public API / package boundary proof | yes | Audit export/ownership impact | No public export shape changed; runtime, CLI, and template owners retain behavior |
| Convex bundle/import proof | yes | Audit affected entry graphs | No named zod import remains in runtime/scaffold/docs sources; test fixtures are intentionally excluded |
| CLI/scaffold/generated proof | yes | Prove command and regeneration | CLI tests passed 124/124; fixtures passed 8/8; ratelimit regeneration exited 0 |
| Release artifact classification | yes | Classify published impact | Published `kitcn` performance/runtime/CLI behavior: patch release |
| Published package changeset | yes | Add one changeset per affected package | Existing `kitcn` patch changeset covers all published behavior |
| No release artifact | no | N/A because an artifact is present | N/A: published package delta has a changeset |
| Package typecheck/build/test | yes | Run owning package gates | Package build plus root typecheck/unit/CLI tests passed |
| Fixture/scaffold generation | yes | Sync and check generated fixtures | Both explicit fixture commands passed all 8; full check repeated parity |
| Docs/package skill sync | yes | Synchronize current-state guidance | `www` and package skill import examples audited; generated mirror exact |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | completed | PR, comments, doctrine, owners, and prior evidence read | implementation |
| Implementation | completed | ratelimit owner/output, skill source/mirror, and stale concurrency import repaired | verification |
| Verification | completed | focused RED/GREEN, builds, fixture parity, audits, and full check pass | commit/review |
| Commit / PR / GitHub sync | completed | repair pushed; threads resolved; task body and auto-release verified | closeout |
| Closeout | completed | exact source head gates green; final receipt fast-forward precedes merge | merge/release |

Findings:
- PR #352 reads `OPEN` and `MERGEABLE` on the rebased branch. GitHub initially
  retained pre-rebase head `d54c886c`; the verified delivery head before this
  final plan-only receipt was `843d0ecf` on current `origin/main` `56b3e6ba`.
- The only pre-existing working-tree edit is the requested
  `example/convex/functions/plugins/ratelimit.ts` import change.
- PR comments contain the changeset bot, Vercel preview, and maintainer closure
  reason; the single Codex review contains no actionable finding.
- `rg` is unavailable in this workspace; use bounded `grep`/`find` fallbacks.
- Current main introduced both the generated ratelimit example and its owning
  package scaffold template with the bundle-pinning import. The supplied example
  edit alone would violate generated ownership and future adds would regress.
- Five published kitcn skill snippets also retain the named import while their
  corresponding generated `.agents` mirror matches exactly; these are in the
  PR's stated docs/import scope and need source-first sync.
- The first package build exposed a stale aggregate-index import from the old
  `write-fanout` helper owner; moving it to `internal/concurrency` removed the
  build warning and completed the intended deduplication.
- Conductor injects proxy variables without `NO_PROXY`; Bun routed the Start
  readiness probe through that proxy and received 502 while direct curl returned
  the rendered page. The focused scenario and full check pass with local hosts
  excluded from the proxy.

Decisions and tradeoffs:
- Keep the rebased branch and force-push only its named remote -> required by
  user; risk is remote history replacement, bounded by exact branch/head audits.
- Preserve implementation and prior benchmark evidence -> closeout scope asks
  for fresh `bun check`, not a full benchmark rerun; final confidence stays
  below 95% unless every timing claim is freshly repeated.
- Treat zod import form as an entry-graph invariant -> a new Convex entry can
  undo the bundle win, so fix the source entry rather than document an exception.
- Full task-style PR body replaces the generic performance essay -> required
  per-PR evidence remains concise while the changeset and plan retain details.
- High-risk note: a missed named zod import can repin locales; stale ORM rows or
  over-hoisted constraints can change mutation semantics; unordered CLI pools
  can drift output. Proof is static import audit, focused tests/full check,
  package/fixture checks, and review. Existing package/runtime owners remain the
  correct boundary because callers cannot restore tree-shaking or write-path
  invariants independently.

Implementation notes:
- Include the supplied namespace-import repair and this exact PR plan in the
  closeout commit; do not rewrite completed implementation without a finding.
- RED/GREEN owner: `packages/kitcn/src/cli/registry/index.test.ts` exercises the
  rendered registry file; template is implementation; `kitcn add ... --overwrite`
  regeneration owns the example output.

Review fixes:
- Repaired ratelimit at the package template owner, added a registry render
  regression, and regenerated the example instead of leaving an output-only fix.
- Synced stale published kitcn import examples through their package source and
  generated `.agents` mirror.
- Repointed aggregate-index runtime to the deduplicated internal concurrency
  owner after the package build exposed the stale import.
- Independent pre-ship branch audit found no correctness or regression finding.
  Residual gap: no explicit shared-column multi-FK memoization test; the
  implementation conservatively keeps any column used by a per-row FK.
- Accepted current P1: the Zod namespace import conflicts with the canonical
  no-namespace summary. Added a narrow source-owned Zod exception and
  regenerated root/Codex/Claude mirrors.
- Verified current P1 already fixed: published kitcn skill source and generated
  mirror use namespace imports across the reviewed setup references.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `rg` unavailable | 1 | Use bounded `grep`/`find` | Fallback selected; no task impact |
| First package build warned that `mapWithConcurrency` was missing from `write-fanout` | 1 | Audit every helper consumer and repair the owner import | Rebuild exited 0 without the warning |
| Browser and Chrome backends unavailable | 2 | Escalate Browser to Chrome, then use source/dev-server/build proof | Static route returned 200 and `www` built; screenshot caveat retained |
| Start runtime readiness timed out through Conductor proxy | 2 | Inspect listener/fetch path, add local hosts to `NO_PROXY`, rerun focused then full gate | Focused scenario and full `bun check` exited 0 |
| Autoreview prerequisite missing | 1 | Install required scanner through the repo-proven Homebrew path | TruffleHog 3.97.0 installed; rerun queued |
| Nested Codex autoreview engine unauthorized | 2 | Keep the required engine/model; use an isolated same-model/high read-only reviewer without changing auth | TruffleHog clean; equivalent full-branch review found no P0 issue at 94% |
| GitHub refused to reopen after the closed PR branch was force-pushed | 2 | Restore the recorded old head with an explicit lease, reopen, then force-push the verified rebased head while the PR is open | REST reopen returned `open`; verified head then pushed and read back `OPEN` and `MERGEABLE` |
| Feedback helper could not infer renamed repository from legacy remote | 1 | Pass authoritative `udecode/kitcn` explicitly | two unresolved threads fetched |
| Full check found Expo SDK-55 patch drift on both branch and `origin/main` | 1 | Regenerate through `bun run fixtures:sync`, never hand-edit snapshots | Expo and Expo-auth advanced to current patch versions; final full check passed |

Verification evidence:
- RED: `bun test packages/kitcn/src/cli/registry/index.test.ts` failed because
  the rendered ratelimit template still contained `import { z }`.
- GREEN: the same test passed 5 tests / 19 expectations after the template fix.
- `bun ../packages/kitcn/dist/cli.mjs add ratelimit --yes --json --overwrite --no-codegen`
  from `example` exited 0 and reported the generated entry current.
- `bun tooling/sync-kitcn-skill.ts` passed; package skill source and `.agents`
  mirror compare byte-identical.
- `bun --cwd packages/kitcn build`, `bun lint:fix`, `bun run fixtures:sync`,
  separate `bun run fixtures:check`, and `bun --cwd www build` all exited 0.
- Current closeout reran `bun run fixtures:sync` for fresh Expo SDK-55 patch
  output, then `NO_PROXY=localhost,127.0.0.1,::1 bun check`; all eight fixture
  comparisons and every runtime scenario passed.
- Canonical `4-ultracite` source, root guidance, and Codex/Claude mirrors now
  contain the narrow tree-shakeable Zod namespace-import exception; intent and
  source/mirror audits pass.
- `NO_PROXY=localhost,127.0.0.1,::1 bun run scenario:test -- start` isolated and
  passed the proxy-affected runtime lane.
- Final local gate: `NO_PROXY=localhost,127.0.0.1,::1 bun check` exited 0,
  including lint, typecheck, unit/Vitest, 124 CLI tests, Concave smoke, all 8
  fixture parity checks, verify, and every runtime scenario.
- Static audits found no named zod imports in production runtime/scaffold/docs
  sources, no stale write-fanout concurrency import, no old plan filename, and
  no source/mirror difference. `git diff --check` passed.
- Independent full branch/worktree audit reported no findings across ORM guards,
  CLI install/concurrency paths, fixture packing, template ownership, and mirrors.
- Autoreview preflight scanned clean. Its nested Codex CLI could not authenticate
  (`401 Unauthorized`), so an isolated `gpt-5.6-sol`/high reviewer inspected all
  100 changed files and commits with no P0 finding at 94% confidence.
- Browser setup and Chrome fallback were unavailable; the representative docs
  dev route returned HTTP 200 and the production docs build generated 189 pages.
- GitHub read-back returned PR #352 `OPEN`, base `main`, the expected branch,
  `mergeable: MERGEABLE`, `closedAt: null`, the compliant body, and remote head
  `843d0ecf77a2182d963237145e01c380b9f0e341` before this final plan-only receipt.
- The remote content API returned this exact date-prefixed plan at the PR head;
  `git ls-remote` matched local HEAD before the final receipt fast-forward.
- Current repair `12c924df` passed CI run `32047952153` in 6m07s,
  Vercel, and auto-release; both review threads were replied to, resolved, and
  re-fetched empty. Full-branch autoreview is clean at 0.96.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Zod import graph | Namespace imports cut 255.6 KB / 22.3% from non-auth deployments | Static import audit, fixtures, root check | Named `z` binding retains locales; rebase added one new named import | Runtime, scaffolds, examples, and docs use tree-shakeable namespace form | Historical PR benchmark plus fresh source audit, fixtures, and full check | passed |
| ORM update reads | `returning()` and one-column FK probe reduce 16 reads to 1 for eight rows | `update.read-amplification.vitest.ts` through root check | Redundant per-row reads | One statement-level FK read; no post-write read when guards allow | Fresh regression suite and full check passed; timing is historical PR evidence | passed |
| Analyze concurrency | Bundle entries concurrently with stable order, 2876 ms to 2052 ms | CLI tests and root check | Serial builds | Bounded concurrent builds with byte-stable output | Fresh CLI/full suites passed; timing is historical PR evidence | passed |
| Add installs | Plugin add uses two installs instead of three | CLI command tests and root check | Three installs | Two installs while planning dependency remains available | Fresh CLI/full suites passed | passed |
| Toolchain | One npm pack, no fixture repack, incremental tsc | Package/tooling tests, fixture checks, root check | Repeated pack/cache loss | Memoized pack path and retained incremental state | Package tests, explicit fixtures, and full gate passed | passed |
| Concurrency owner | Deduplicate ordered lane pool | Source audit and root check | Two copies | `internal/concurrency.ts` owns helper | Stale aggregate consumer repaired; package build and full check passed | passed |
| Rebase repair | New ratelimit scaffold and generated entry must not repin locales | Registry-render test, regeneration, and final import audit | Main added `import { z }` to template/output | Template and generated entry use `import * as z` | RED/GREEN, CLI regeneration, audit, and fixtures passed | passed |
| Per-PR plan | PR #352 needs dedicated task evidence | File and remote-head audit | No plan at old PR head | This plan exists and names PR #352 | Remote content API returned this plan at the PR head; it names only PR #352 | passed |
| PR body | Body must include plan line and task-style receipts | `gh pr view --json body` | Generic body; no plan line | Required emoji shape and exact plan path | Exact plan line, table, required sections, and auto-release block read back | passed |
| Repository gate | Rebased final checkout passes | `bun check` in workspace root | Prior reported pass before current plan/import | Exit 0 after final changes | Final proxy-safe full gate exited 0 | passed |
| Remote branch | Rebased branch replaces old remote head | Git local/remote OID audit | Remote `d54c886c`; local rebased `678f82ad` plus closeout commits | Remote equals final local HEAD | `git ls-remote` matched local delivery HEAD; final receipt is a fast-forward on the same branch | passed |
| Reopen/read-back | PR #352 returns to reviewable state | REST reopen then `gh pr view` | `CLOSED`, conflicting old head | `OPEN`, expected head/body/base | Read-back returned `OPEN`, expected branch/body/base/head, and `MERGEABLE` | passed |

Final handoff contract:
- Commit line: implementation receipts through `843d0ecf`; review/fixture repair
  `12c924df`; final plan receipt follows
- PR line: https://github.com/udecode/kitcn/pull/352; compliant, `OPEN`, source
  gates green, auto-release enabled, zero unresolved threads
- Issue line: N/A: no separate issue; PR #352 is the tracker
- Confidence line: 92%; fresh correctness gates passed, but historical timing
  claims and unavailable direct browser proof cap confidence below 95%
- Flow table:
  - Reproduced: RED registry render test; Browser backend unavailable
  - Verified: GREEN focused test and full gate; route HTTP 200/docs build pass
- Browser check: Browser and Chrome unavailable; no interaction changed; exact
  route/dev/build substitute and caveat recorded
- Outcome: rebased performance branch retains the namespace-import invariant at
  the ratelimit owner/output and passes all local gates
- Caveat: performance numbers are prior PR evidence; approved browser backends
  were not provisioned for a screenshot/console read
- Design:
  - Chosen boundary: package template, generated output, published skill source,
    generated mirror, and shared concurrency owner
  - Why not quick patch: output-only ratelimit change would regress on next add
  - Why not broader change: implementation was already complete and rebased;
    only source/review-proven closeout gaps were in scope
- Verified: focused TDD, package/docs builds, fixtures, static audits, full check;
  TruffleHog clean, same-model review clean, and GitHub state/body/head read back
- PR body verified: exact date-prefixed plan line, required task-style sections,
  test/browser table, and preserved auto-release block returned by GitHub

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
- Commit: implementation, verification, review, and final plan receipts committed
- PR: #352 updated and reopened; GitHub returned `OPEN`, correct body/base/branch,
  and a mergeable verified delivery head before the final receipt fast-forward
- Issue: N/A: no separate issue
- Browser proof: exact unavailable-backend caveat; route 200 and 189-page build
- Caveats: benchmark reruns and direct Browser screenshot are outside earned proof

Timeline:
- 2026-08-17T09:53:58.383Z Task goal plan created.
- 2026-08-17 PR source, discussion, doctrine, branch, diff, and required skills
  read; walkthrough baseline captured before plan creation.
- 2026-08-17 user corrected the generic PR-delivery filename; plan moved to the
  specific date-prefixed outcome path used throughout this file and PR body.
- 2026-08-17 source-first ratelimit, skill mirror, and aggregate concurrency
  repairs completed with focused tests, regeneration, builds, and static audits.
- 2026-08-17 Browser and Chrome escalation exhausted; dev route/build substitute
  recorded. Proxy cause isolated; focused runtime and final full check passed.
- 2026-08-17 verified checkout committed as `54f911a8`; required TruffleHog
  prerequisite installed after autoreview failed closed before engine invocation.
- 2026-08-17 TruffleHog preflight passed; nested Codex auth failed with 401 on
  two attempts. Same `gpt-5.6-sol`/high isolated review completed with no P0
  finding at 94% across the full branch.
- 2026-08-17 compliant PR body applied. After GitHub rejected reopening the
  force-pushed closed head, the old head was restored with an explicit lease,
  PR #352 reopened, and the verified rebased head force-pushed while open.
- 2026-08-17 GitHub read back `OPEN`, `MERGEABLE`, correct body/base/branch/head,
  and the exact date-prefixed plan at the remote PR head.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Exact merge, release, npm, and post-release read-back |
| What is the goal? | Close the rebased bundle/read performance refactor with repaired owners, passing checks, compliant evidence, pushed head, and `OPEN` read-back |
| What have I learned? | Rebase also left the template owner, skill snippets, and one concurrency consumer stale; Conductor proxy affects local readiness fetches |
| What have I done? | Repaired owners and standards, synced fixtures/mirrors, proved full behavior, resolved feedback, and passed remote gates |

Open risks:
- Benchmark numbers remain prior PR evidence and direct Browser proof remains
  unavailable; confidence stays at 92%.
- Merge/release receipts are external state and cannot be committed after merge.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
