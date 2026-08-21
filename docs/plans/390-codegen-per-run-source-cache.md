# 390 codegen per-run source cache

Objective:
Give kitcn codegen one per-run owner for the files it reads, writes and deletes,
so each Convex module is read once and `functionsDir` is walked once, with
byte-identical generated output.

Goal plan:
docs/plans/390-codegen-per-run-source-cache.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: GitHub issue, supplied as a local attachment
- id / link: #390 — https://github.com/udecode/kitcn/issues/390
- title: CLI: codegen reads every Convex module source up to 4x per run and
  walks `functionsDir` twice
- acceptance criteria: each Convex module source is read once per codegen run;
  `functionsDir` is walked once per run; the cache is per invocation so watch
  cycles re-read from disk; generated output is unchanged.

Timed checkpoint:
- requested duration: N/A: no duration requested.
- semantics: N/A: no duration requested.
- initial confidence score: N/A: no duration requested.
- improvement loop: N/A: no duration requested.
- final score / loop closure: N/A: no duration requested.

Completion threshold:
- `generateMeta` reads every path at most once per run, walks `functionsDir`
  once per run, and emits output identical to `main` on the repo's own
  `example` app.
- A regression test fails on pre-fix `codegen.ts` and passes after.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/390-codegen-per-run-source-cache.md` passes.

Verification surface:
- `bun test packages/kitcn/src/cli/codegen.test.ts packages/kitcn/src/cli/utils/codegen-file-cache.test.ts packages/kitcn/src/cli/watcher.test.ts`
- Red proof: the same test run against a stashed pre-fix `codegen.ts`.
- `bun typecheck`, `bun lint:fix`, `bun --cwd packages/kitcn build`, `bun check`.
- Output equivalence: `git status --short example/` after two real codegen runs
  over the 82-module `example` app.
- Read/walk counts: `fs.readFileSync` and `fs.readdirSync` counters around
  `generateMeta` on `example`, run against pre-fix and post-fix `codegen.ts`.

Constraints:
- Preserve existing user-facing behavior outside the task scope.
- Prefer the durable ownership boundary over caller-by-caller patches.
- Cache lifetime is one `generateMeta` call, never the process, because watch
  mode re-runs codegen precisely when the filesystem changed.
- No module-level mutable cache: the lifetime has to be provable from the call
  graph rather than from discipline.
- When a GitHub PR is in scope, this plan owns exactly one PR. A coordinating
  batch plan must link a separate task plan for every PR an agent processes.
- The user initially instructed "Do not create PR under any circumstances,
  unless user prompts to", so the first pass closed local-only. The user then
  explicitly requested a PR, which lifted that decline; this plan owns exactly
  one PR, #393.
- A PR created by this task must use the PR #270 emoji task-style PR body
  contract below, not a generic summary/body from a git helper skill.
- A task-run PR body must include
  `🧭 Task plan: docs/plans/<plan>.md`; the plan must exist at the PR head and
  identify the exact PR before autoclosure.
- Do not add broad ceremony when the task is trivial or docs-only.

Boundaries:
- Source of truth: issue #390 text plus `packages/kitcn/src/cli/codegen.ts`.
- Allowed edit scope: `packages/kitcn/src/cli/codegen.ts`,
  `packages/kitcn/src/cli/utils/codegen-file-cache.ts` (new),
  `packages/kitcn/src/cli/codegen.test.ts`,
  `packages/kitcn/src/cli/utils/codegen-file-cache.test.ts` (new), `.changeset`,
  this plan.
- Browser surface: N/A: CLI-only change with no rendered output.
- GitHub issue sync: satisfied by the PR body's `🐛 Fixes #390` link, which
  GitHub renders on the issue. No separate comment was requested.
- Non-goals: jiti's own transitive-graph reads, the `listGeneratedRuntimeFiles`
  walks that must observe mid-run state, and any change to generated output.

Output budget strategy:
- Directory listings and greps scoped to `packages/kitcn/src/cli`; test and
  check output piped through `tail` or `grep`; read/walk measurement emitted as
  one JSON summary instead of a per-path stream.

Blocked condition:
- Blocked only if generated output could not be proven identical on a real
  Convex app, or if `bun check` failed for a reason attributable to this diff.

Task state:
- task_type: bug, performance
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: valid
- confidence: 95-100%
- next owner: task
- reason: Both claims reproduced by direct measurement, fixed at the file-I/O
  ownership boundary, and re-measured with unchanged generated output.

Implementation readiness:
- verdict: ready
- exact owner: file I/O for one codegen run, now `createCodegenFileCache()` in
  `packages/kitcn/src/cli/utils/codegen-file-cache.ts`, threaded explicitly
  through every codegen reader and writer.
- contradiction status: none. Source, tests and runtime agreed once measured.
- source-listed cases complete: yes, both claims in the issue are covered by the
  case matrix below.

Pre-solution issue challenge:
- reporter claim: codegen reads every Convex module source up to four times per
  run and walks `functionsDir` twice.
- suggested diagnosis or fix: a per-invocation source cache keyed by absolute
  path, shared by the export test, the parser and the emit phase.
- repro ladder:
  - tests / source-level repro: counted `fs.readFileSync` and `fs.readdirSync`
    per path across a warm `generateMeta` run on the repo's own
    `writeScopedFixture` and on `example`, 82 modules. Confirmed 2 walks of
    `functionsDir`, 5 reads of `todos.ts`, 4 of `http.ts`, 4 of `schema.ts`,
    3 of `generated/server.ts`, 2 each of `generated/auth.ts` and
    `generated/aggregate.ts`.
  - repo-owned automated browser or integration proof: N/A: CLI-only surface.
  - Browser plugin: N/A: no browser-rendered output.
  - screenshot / visual proof: N/A: no visual output.
- reproduction verdict: reproduced
- validity verdict: valid
- best long-term fix boundary: the issue's "source cache" framing is correct but
  too narrow to be safe. Codegen rewrites and deletes its own `generated/`
  files partway through a run, so a read-only memo would hand the emit phase
  bytes that no longer exist on disk. `generated/plugins/*.runtime.ts` and the
  runtime placeholders codegen deletes and recreates in the same run would be
  silently skipped as "unchanged". The durable owner is a per-run cache that
  owns reads, writes and removals together.
- harsh honest feedback: the issue's own "not worth doing naively" section is
  right that the read count is not the dominant cost. After the fix, every
  remaining repeated read on `example` is jiti's, 42x `package.json` and
  22x `generated/server.ts`, and those are untouched. The value delivered here
  is a single file-I/O owner with a correct write and remove invalidation
  contract; the read and walk savings are the measurable side effect.
- hard-stop decision: proceed. Claim reproduced, fix widened to the correct
  ownership boundary.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/390-codegen-per-run-source-cache.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: CLI-only change, no UI or rendered output can change |
| Skill analysis before edits | yes | `task` plus `autogoal` task template with the package-api pack; `.agents/rules/changeset.mdc` read before writing the changeset |
| Active goal checked or created | yes | This plan, created via `create-goal-scratchpad.mjs`, renamed to the ticket-prefixed name per repo policy |
| Source of truth read before edits | yes | Read the issue attachment, then `codegen.ts`, `shared/meta-utils.ts` and `watcher.ts` |
| Exact per-PR task ownership | yes | This plan owns exactly one PR: https://github.com/udecode/kitcn/pull/393 |
| GitHub comments and attachments read | yes | The attachment is the full issue body; no additional comments were supplied |
| Video transcript evidence required | no | N/A: no video or screen recording in the source |
| Pre-solution issue challenge required | yes | Recorded above; verdict `valid` with a widened fix boundary |
| Reproduction verdict before implementation | yes | Reproduced by read and walk counters before any edit |
| Repro escalation ladder selected | yes | Source-level counter harness; browser and visual rungs N/A for a CLI |
| Suggested fix reviewed against durable boundary | yes | Read-only cache rejected as unsafe; write and remove invalidation added |
| `docs/solutions` checked for non-trivial existing-code work | yes | Grepped `docs/solutions` for codegen entries; none covers file-read caching |
| TDD decision before behavior change or bug fix | yes | Red proof taken against stashed pre-fix `codegen.ts` for both claims |
| Branch decision for code-changing task | yes | Work started on `issue-390`; renamed to `fix/codegen-read-each-file-once` before the first push, per the user's branch-naming convention, so the remote branch and PR were created with the right name |
| Release artifact decision | yes | `.changeset/olive-spies-shake.md`, `kitcn: patch` |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | Commit created, branch pushed, PR #393 opened onto `main` after the user requested it |
| Task-style PR body decision | yes | PR #270 emoji task-style body used, not the generic summary shape |
| Task-plan PR body evidence | yes | Body carries `🧭 Task plan: docs/plans/390-codegen-per-run-source-cache.md`; the file exists at the PR head and names PR #393 |
| GitHub issue sync expectation decision | yes | `🐛 Fixes #390` in the PR body links the fix on the issue; no separate comment was requested |
| Output budget strategy recorded | yes | Recorded above; measurement emitted as one JSON summary |
| Package/API pack selected | yes | `--with package-api`, because the diff is inside published `packages/kitcn` |
| Public surface or package boundary identified | yes | No export change: the new module is CLI-internal and unreachable from `package.json` `exports` |
| Convex entry/import graph impact identified | yes | None: the new module is imported only by the CLI, never by a Convex function entry |
| CLI/scaffold/generated impact identified | yes | `kitcn codegen` behavior only; generated file contents unchanged |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | Read `.agents/rules/changeset.mdc` and `packages/kitcn/CHANGELOG.md` tone before writing |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; no `init -t` template or scaffold source touched, so `fixtures:sync` is not required beyond the `bun check` lane |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration requested.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. This plan owns exactly one
      PR, #393, and no batch plan was substituted.
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML. N/A: no video in the source.
- [x] For public GitHub bug reports, behavior claims, technical diagnoses, or
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict.
- [x] Repro escalation ladder followed for bug/behavior claims.
- [x] Hard-stop rule followed for bug/behavior claims.
- [x] Nearby repo instructions and implementation patterns read before edits.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified `ready`.
- [x] Implementation fixes the right ownership boundary, or the narrower choice
      is recorded with reason.
- [x] Release artifact requirement recorded: new changeset
      `.changeset/olive-spies-shake.md`.
- [x] Final handoff shape decided: bug fix with tests, no browser proof, no PR,
      no issue sync.
- [x] Commit/PR handling recorded for code-changing work: committed, pushed,
      and PR #393 opened once the user requested a PR.
- [x] PR body shape recorded: PR #270 emoji task-style body, verified with `gh pr view --json body`.
- [x] PR task evidence recorded: body plan line present, plan exists at the PR head, and it names PR #393.
- [x] Branch handling recorded for code-changing work: renamed `issue-390` to
      `fix/codegen-read-each-file-once` before the first push, so no remote
      branch was orphaned.
- [x] Local-env-rot retry policy recorded. The one env-shaped failure,
      `Cannot find module .../dist/orm/index.js` while measuring `example`, was
      resolved by the required `bun --cwd packages/kitcn build`, not a
      reinstall. The `bun check` failure was a port collision, retried clean.
- [x] Workspace authority recorded: every proof command names the cwd/tool that
      owns the changed behavior.
- [x] Output budget discipline recorded and followed.
- [x] High-risk note recorded for public API, runtime, package-boundary,
      browser behavior, agent-action, or command-contract changes.
- [x] Review/autoreview target selected from actual diff state for non-trivial
      implementation work: `--mode local`, matching the uncommitted patch.
- [x] Agent-native review decision recorded. N/A: no `.agents/**`, `.claude/**`,
      `.codex/**`, skill, hook, command, prompt, or user-action tooling changed;
      the only non-package files are this plan and a changeset.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset`.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. N/A: a changeset was written.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes. N/A: no public shape change.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate. The new module is
      CLI-only and never reaches a Convex function entry.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive with explicit confirmation bypass when relevant. No
      command surface changed and `kitcn codegen` output is byte-identical.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes. N/A: no public
      guidance changed.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded.
- [x] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | 97 focused tests pass; read/walk A/B and output-equivalence proof recorded in the case matrix |
| Exact per-PR task ownership | yes | Record the exact PR and dedicated plan | This plan owns PR #393 alone |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | Recorded above: `valid`, boundary widened from a read-only cache to a read/write/remove owner |
| Repro escalation ladder | yes | Record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A reasons | Source-level counter harness reproduced both claims; browser and visual rungs N/A for a CLI |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | Pre-fix `codegen.ts` fails the new test twice over: `functionsDirWalks` expected 1, received 2; `generated/auth.ts` reads expected 1, received 2 |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | `bun test packages/kitcn/src/cli/codegen.test.ts packages/kitcn/src/cli/utils/codegen-file-cache.test.ts packages/kitcn/src/cli/watcher.test.ts` → 97 pass, 0 fail |
| TypeScript or typed config changed | yes | Run relevant typecheck | `bun typecheck` → 5 packages successful |
| Package exports or file layout changed | yes | Run the relevant package build before final verification | `bun --cwd packages/kitcn build` → 71 files, build complete |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: no manifest, lockfile or dependency change |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: no `.agents` rule or skill changed |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd | All commands run from the workspace root `/Users/mikey/conductor/workspaces/kitcn/seattle-v2`; the `example` measurement `chdir`s into `example/` because `getConvexConfig()` is cwd-relative |
| Browser surface changed | no | Capture Browser proof or record explicit waiver | N/A: CLI-only change |
| Browser final proof | no | Attach screenshot or exact browser verification caveat | N/A: CLI-only change |
| UI walkthrough | no | Run walkthrough if UI or rendered output changed | N/A: no UI or rendered output changed |
| Scaffold or fixture output changed | no | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | N/A: no `init -t` template or scaffold source touched; the `bun check` run still exercised `fixtures:check` and it passed |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | `.changeset/olive-spies-shake.md`, `kitcn: patch` |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: no user-facing guidance changed |
| Docs or content changed | no | Verify source-backed claims, links, examples, and rendered output | N/A: the only non-code files are this plan and a changeset |
| High-risk mini gate | yes | Record realistic failure mode, proof plan, and why the chosen boundary is right | See the High-risk note below |
| Agent-native review for agent/tooling changes | no | Load `agent-native-reviewer` and close findings | N/A: no agent-native surface changed |
| Local install corruption suspected | no | Run `bun install` once and rerun the exact failing command | N/A: the missing-module failure was a genuinely absent `packages/kitcn/dist`, fixed by the required package build |
| Commit created | yes | For verified code-changing work, stage the entire current checkout per repo policy and create a commit | `fix(codegen): read each file once per run` on `fix/codegen-read-each-file-once` |
| PR create or update | yes | Run `check`, push, create or update the PR, and sync the PR body to the task-style final handoff | `bun check` run on this exact tree before opening; branch pushed; https://github.com/udecode/kitcn/pull/393 opened onto `main` |
| Task-style PR body verified | yes | Verify the PR body with `gh pr view --json body` | Verified: auto-release block preserved, `🐛 Fixes #390`, plan line, `🟢 95-100% confidence`, `\| Phase \| 🧪 Tests \| 🌐 Browser \|` table with Reproduced/Verified rows, and the four bold emoji sections; no self-link |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, and exact PR ownership | Plan line present in the body; plan pushed to the PR head naming PR #393 |
| PR proof image hosting | no | Replace local image paths with hosted GitHub URLs | N/A: CLI-only change, the body carries no images |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists | `🐛 Fixes #390` in the PR body surfaces the fix on the issue; no separate comment was requested |
| Final handoff contract | yes | Fill the final handoff fields below | Filled below |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` → 937 files checked, no fixes applied |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed | All test and check output piped through `tail` or `grep`; measurement emitted as one JSON object |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Load `autoreview` and close accepted/actionable findings | `.agents/skills/autoreview/scripts/autoreview --mode local --engine claude` → `autoreview clean: no accepted/actionable findings reported`, `overall: patch is correct (0.75)` |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/390-codegen-per-run-source-cache.md` | Passes |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | `packages/kitcn/package.json` `exports` unchanged; `codegen-file-cache.ts` is reachable only from `src/cli` |
| Convex bundle/import proof | no | Audit affected function-entry static graphs | N/A: no Convex function entry imports the changed modules |
| CLI/scaffold/generated proof | yes | Prove the command contract and regenerate owned output | Two real `generateMeta` runs over `example/` left `git status --short example/` empty, so all 33 tracked generated files are byte-identical to `main` |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | Published CLI behavior: `kitcn codegen` does measurably less filesystem work per run |
| Published package changeset | yes | Load `changeset` and add/update one `.changeset/*.md` per package | `.changeset/olive-spies-shake.md` |
| No release artifact | no | Record the exact reason no artifact is needed | N/A: a changeset was written |
| Package typecheck/build/test | yes | Run owning package checks or record N/A | `bun typecheck`, `bun --cwd packages/kitcn build`, focused `bun test`, and the full `bun check` gate |
| Fixture/scaffold generation | no | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed | N/A: no scaffold output changed |
| Docs/package skill sync | no | Synchronize current-state public guidance | N/A: no public guidance changed |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | Issue attachment, `codegen.ts`, `shared/meta-utils.ts` and `watcher.ts` read before any edit | implementation |
| Implementation | complete | `codegen-file-cache.ts` added; every codegen read, write and remove routed through it; duplicate walk hoisted | verification |
| Verification | complete | Red proof, 97 focused tests, typecheck, lint, package build, `bun check`, `example` output equivalence, read/walk A/B | closeout |
| Commit / PR / GitHub sync | complete | Committed, branch renamed and pushed, PR #393 opened, plan synced to name it | closeout |
| Closeout | complete | Autoreview clean; plan filled; final handoff recorded | final response |

Findings:
- The issue's read count is real but its "up to 4x" undercounts some paths.
  `todos.ts` was read 5x per warm run: prefilter, parser, procedure-name lookup,
  emit-phase runtime check, plus one jiti read. `schema.ts` was read 4x: three
  `hasNamedExport` calls plus jiti.
- A read-only cache would have been actively wrong. Codegen writes runtime
  placeholders, deletes them, and writes them again inside one run, and it wipes
  `generated/plugins/` before re-emitting the plugin runtimes. Memoizing reads
  without invalidating on write and delete would have made those later writes
  look like no-ops and silently left the files missing.
- After the fix, every remaining repeated read on `example` belongs to jiti:
  42x `package.json`, 22x `generated/server.ts`, 23x `schema.ts`. jiti re-reads
  shared imports once per parsed candidate. That is a separate, larger
  optimization and is deliberately out of scope for #390.

Decisions and tradeoffs:
- Threaded the cache explicitly through roughly 30 call sites instead of using a
  module-level global. The global is a smaller diff but makes "one cache per
  run" a discipline rather than a fact, and `generateMeta` is async, so two
  interleaved runs would silently share state.
- Gave the cache write and remove methods rather than only `read` and
  `invalidate`. `writeIfChanged` already had to read the previous contents to
  decide, so folding the compare into the same owner removes the last raw
  `fs.writeFileSync` from codegen and makes the invalidation contract
  unavoidable rather than remembered.
- Replaced `existsSync` plus `readFileSync` pairs with a single cached read that
  returns `null` for a missing path. That is one syscall instead of two on the
  hit path and removes the "checked, then read, then it moved" race.
- Left `listGeneratedRuntimeFiles` walking `generated/` twice. Those two calls
  deliberately observe different mid-run states, before parsing and after
  emitting, so collapsing them would be a behavior change, not an optimization.
- Left jiti's reads alone. The issue scopes them out and they need a different
  fix, at the jiti layer, with different risk.

Implementation notes:
- New `packages/kitcn/src/cli/utils/codegen-file-cache.ts` exports
  `createCodegenFileCache()` with `read`, `write`, `writeIfChanged`, `remove`
  and `removeDirectory`. Keys are `path.resolve`d. A write stores what it wrote,
  a remove stores `null`, and `removeDirectory` stores `null` for every cached
  path under the tree.
- `codegen.ts` now creates one cache at the top of `generateMeta` and passes it
  to `hasNamedExport`, `hasDefaultExport`, `readLegacyProcedureNameLookup`,
  `moduleUsesOwnGeneratedRuntime`, `buildProcedureNameLookupEntries`,
  `parseModuleRuntime`, `ensureGeneratedSupportPlaceholders`,
  `ensureGeneratedRuntimePlaceholders`, `emitGeneratedModuleRuntimeFile` and
  `cleanupGeneratedPluginArtifacts`. `writeFileIfChanged` was deleted in favor
  of `fileCache.writeIfChanged`.
- The two `listFilesRecursive(functionsDir)` walks collapsed into one
  `convexModuleFiles` snapshot. That is safe because everything codegen writes
  in between lands in `generated/`, which `isValidConvexFile` rejects, and it
  also guarantees the runtime placeholders and the parse candidates derive from
  the same snapshot.
- A module deleted between the walk and the prefilter now reads as empty instead
  of throwing an unhandled `ENOENT` out of the whole run. Watch mode re-runs on
  that deletion anyway.

Review fixes:
- Self-review before autoreview caught three items, all fixed:
  `ensureGeneratedSupportPlaceholders` used `writeIfChanged` on a path already
  known absent, now `write`; the new "file vanished" error did not match the
  repo's `kitcn codegen could not ...` phrasing; and `hasAuthFile` still used a
  raw `existsSync` next to a cached read of the same path.
- Autoreview `--mode local --engine claude` reported no accepted or actionable
  findings, so no review-driven fixes were required.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| fs spy recorded zero reads: `/var` versus `/private/var` prefix mismatch after `chdir` into a temp dir | 1 | Compare against `fs.realpathSync(dir)` instead of the raw `mkdtemp` path | Fixed; the measurement and the regression test both resolve the real path |
| `bun test packages/...` from the `packages/kitcn` cwd matched no files | 1 | Run test paths from the workspace root | Fixed |
| Measuring `example` failed with `Cannot find module .../dist/orm/index.js` | 1 | Build the package rather than reinstall | `bun --cwd packages/kitcn build` fixed it |
| `git stash push` rejected the whole pathspec because the new util file is untracked | 1 | Stash only the tracked `codegen.ts` for the red and baseline runs | Fixed |
| Importing `vi` from `bun:test` removed the global `describe`/`test`/`expect` in `codegen.test.ts` | 1 | Import all four names explicitly | Fixed |
| `bun check` failed in `test:runtime`: `listen EADDRINUSE 127.0.0.1:3211`, so `convex:dev` never started and auth smoke got a 500 | 1 | Confirm the port owner is a parallel workspace, wait for it to free, rerun only the failing lane | Port was free on recheck; `bun run test:runtime` rerun exited 0 with `concave site proxy ready at http://127.0.0.1:3211` |

Verification evidence:
- `bun test packages/kitcn/src/cli/codegen.test.ts packages/kitcn/src/cli/utils/codegen-file-cache.test.ts packages/kitcn/src/cli/watcher.test.ts` → 97 pass, 0 fail, 572 expects. Run from the workspace root.
- Red proof with the pre-fix `codegen.ts` stashed in:
  `expect(functionsDirWalks).toBe(1)` received 2; with that line relaxed, the
  `generated/auth.ts` read assertion received 2 instead of 1.
- `bun typecheck` → 5 packages successful.
- `bun lint:fix` → 937 files checked, no fixes applied.
- `bun --cwd packages/kitcn build` → 71 files, build complete.
- `NO_PROXY=localhost,127.0.0.1 bun check` → `check:ci` and `test:verify`
  passed; `test:runtime` failed only because port 3211 was held by a parallel
  Conductor workspace. `NO_PROXY=localhost,127.0.0.1 bun run test:runtime`
  rerun after the port freed → exit 0.
- `.agents/skills/autoreview/scripts/autoreview --mode local --engine claude` →
  `autoreview clean: no accepted/actionable findings reported`,
  `overall: patch is correct (0.75)`, trufflehog clean.
- `git status --short example/` → empty after two real `generateMeta` runs over
  the 82-module app, so all 33 tracked generated files match `main` byte for
  byte, including the `generated/plugins/*.runtime.ts` files that the run
  deletes and re-emits.
- Read and walk A/B on `example`, warm second run, counters wrapped around
  `generateMeta`: reads under `functionsDir` 447 → 390; `functionsDir` walks
  2 → 1; total directory walks under `functionsDir` 28 → 18.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Module source read repeatedly | "reads every Convex module source up to 4x per run" | `fs.readFileSync` counter around a warm `generateMeta` on `writeScopedFixture` | `todos.ts` 5, `http.ts` 4, `schema.ts` 4 | one codegen read each, plus jiti's own read for parsed modules | `todos.ts` 2, `http.ts` 2, `schema.ts` 2; the remainder is jiti | closed |
| Generated file read after codegen rewrites it | implied by the same claim | same counter, on paths jiti never touches | `generated/server.ts` 3, `generated/auth.ts` 2, `generated/aggregate.ts` 2 | 1 each | 1 each, asserted in `codegen.test.ts` | closed |
| `functionsDir` walked twice | "walks `functionsDir` twice" | `fs.readdirSync` counter keyed on `functionsDir` | 2 | 1 | 1, asserted in `codegen.test.ts` | closed |
| Cache must not outlive one run | "invalidated per watch cycle rather than held for the process lifetime" | Cache constructed inside `generateMeta`, never at module scope | a module-scope global was the tempting shape | fresh cache per call | `createCodegenFileCache()` is called in `generateMeta`; a unit test asserts a second cache re-reads changed bytes | closed |
| Output must not change | not claimed, required by the task constraints | Two real codegen runs over `example` | n/a | byte-identical | `git status --short example/` empty | closed |

High-risk note:
- Realistic failure mode: the cache serves bytes that codegen itself has already
  replaced or deleted, so `writeIfChanged` decides "unchanged" and silently
  leaves a generated file stale or missing. The two concrete paths are the
  runtime placeholders codegen writes, deletes and rewrites within one run, and
  `generated/plugins/`, which is wiped before the plugin runtimes are re-emitted.
- Proof plan: unit tests assert that a removed file and a removed directory both
  force the next `writeIfChanged` to write, and the `example` run proves the two
  tracked `generated/plugins/*.runtime.ts` files survive a real wipe and
  re-emit cycle byte-identical.
- Why this boundary is right: the alternative, memoizing reads only, leaves the
  invalidation obligation spread across every `fs.rmSync` call site in a
  2,800-line file. Folding writes and removals into the same owner makes the
  obligation impossible to forget, and it is what let the last raw
  `fs.writeFileSync` and `fs.rmSync` calls leave `codegen.ts` entirely.

Final handoff contract:
- Commit line: `fix(codegen): read each file once per run` on `fix/codegen-read-each-file-once`
- PR line: https://github.com/udecode/kitcn/pull/393
- Issue line: linked from the PR body via `🐛 Fixes #390`
- Confidence line: 🟢 95-100% confidence
- Flow table:
  - Reproduced: tests 🔴 pre-fix walk count 2 and `generated/auth.ts` read count 2, browser ➖ N/A
  - Verified: tests 🟢 97 pass plus `bun check`, browser ➖ N/A
- Browser check: N/A: CLI-only change with no rendered output
- Outcome: `kitcn codegen` reads each file once and walks the functions
  directory once per run. On the 82-module `example` app that is 447 → 390 file
  reads and 28 → 18 directory listings, with byte-identical output.
- Caveat: the remaining repeated reads belong to jiti, which re-reads shared
  imports once per parsed module. The issue scopes that out and it is untouched.
- Design:
  - Chosen boundary: a per-run `CodegenFileCache` that owns reads, writes and
    removals, threaded explicitly through codegen instead of held in a module
    global.
  - Why not quick patch: a read-only memo would have left the emit phase reading
    bytes codegen had already deleted, silently skipping the re-emit of the
    runtime placeholders and plugin runtimes it removes mid-run.
  - Why not broader change: jiti's transitive-graph reads dominate the real cost
    but need a different fix with different risk, and the issue explicitly
    scopes them out.
- Verified: focused tests, red proof against pre-fix code, typecheck, lint,
  package build, the full `bun check` gate, autoreview, and byte-identical
  generated output on a real 82-module Convex app.
- PR body verified: `gh pr view 393 --json body` matches the PR #270 emoji contract

Task-style PR body contract:
- Applied to PR #393 in the PR #270 emoji format: the
  `<!-- auto-release:start -->` block is preserved because a changeset ships in
  this diff, the body opens with `🐛 Fixes #390`, then
  `🧭 Task plan: docs/plans/390-codegen-per-run-source-cache.md`, then
  `🟢 95-100% confidence`, then a `| Phase | 🧪 Tests | 🌐 Browser |` table with
  `Reproduced` and `Verified` rows, then `**✅ Outcome**`, `**⚠️ Caveat**`,
  `**🏗️ Design**` and `**🧪 Verified**` sections. No line links to PR #393
  itself.

Final handoff / sync:
- Commit: `fix(codegen): read each file once per run` on `fix/codegen-read-each-file-once`
- PR: https://github.com/udecode/kitcn/pull/393
- Issue: #390, linked from the PR body
- Browser proof: N/A: CLI-only change
- Caveats: jiti's own repeated reads remain and are out of scope for #390

Timeline:
- 2026-08-21T14:20:47.371Z Task goal plan created.
- 2026-08-21 Issue #390 read; both claims reproduced by fs counters on
  `writeScopedFixture` and on `example`.
- 2026-08-21 `codegen-file-cache.ts` added; codegen threaded onto it; the
  duplicate `functionsDir` walk hoisted.
- 2026-08-21 Red proof taken against stashed pre-fix `codegen.ts`; focused
  tests, typecheck, lint and package build green; `example` output proven
  byte-identical.
- 2026-08-21 `bun check` hit a port-3211 collision from a parallel workspace;
  the runtime lane reran clean once the port freed.
- 2026-08-21 Autoreview clean; plan filled; commit created.
- 2026-08-21 User requested a PR, lifting the earlier decline. Branch renamed
  `issue-390` -> `fix/codegen-read-each-file-once` before the first push, pushed,
  and PR #393 opened onto `main` with the task-style body.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout, complete |
| Where am I going? | Final response |
| What is the goal? | One per-run file-I/O owner for codegen so each file is read once and `functionsDir` is walked once, with unchanged output |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- None outstanding. The only known remaining inefficiency is jiti re-reading
  shared imports once per parsed module, which is out of scope for #390 and
  worth its own ticket.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical,
  blocked or inconclusive outcome, or a real commit/PR blocker.
- Not applicable now: the user lifted the earlier PR decline and requested a
  PR, so this work is committed, pushed, and delivered as PR #393.
