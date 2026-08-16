# Convex compatibility range

Objective:
Fix issue #328 Convex compatibility drift; done when all source-listed cases
pass, package/repo gates are green, and the PR ships.

Flow mode:
one-shot execution

Goal plan:
docs/plans/328-convex-compatibility-range.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: public GitHub bug report
- id / link: udecode/kitcn#328 / https://github.com/udecode/kitcn/issues/328
- title: convex peer range `>=1.42` has no upper bound — convex >=1.43 adds
  `VCommitTs` and breaks two `kind satisfies never` switches
- acceptance criteria: reproduce both `commitTs` conversion failures; bound the
  supported Convex minor range while floating patches; warn symmetrically for
  below/above-range specs; add latest-Convex drift proof; resolve the two named
  dependency/tooling loose ends; add a release artifact; ship a verified PR.

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A
- initial confidence score: N/A: case matrix is the better metric
- improvement loop: close source-listed cases, review, and required gates
- final score / loop closure: pending final evidence

Completion threshold:
- Every source-listed case has a before/after verdict, focused proof passes on
  the supported minimum and latest compatibility lanes, `bun --cwd
  packages/kitcn build`, `bun lint:fix`, and `bun check` pass, autoreview has
  zero accepted findings, a changeset exists, and a task-style PR is pushed and
  synced to issue #328.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/328-convex-compatibility-range.md` passes.

Verification surface:
- Focused validator/Zod runtime tests, dependency warning tests, supported/latest
  Convex type lanes, dependency-pin generation audit, package build, lint,
  `bun check`, autoreview, changeset audit, PR checks/read-back, issue sync.

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
- Float supported patch releases; do not add compatibility shims or accept
  unknown validator kinds silently.
- Preserve narrow Convex function-entry import graphs.

Boundaries:
- Source of truth: GitHub issue #328 plus current package/runtime/type/dependency
  owners and upstream Convex shipped types.
- Allowed edit scope: `packages/kitcn` validator/Zod/dependency support code and
  tests, dependency pins/scenario source, type-test workflow/config, lockfile,
  package manifest, changeset, and this plan.
- Browser surface: N/A: package/runtime/type compatibility only.
- GitHub issue sync: PR first, then concise QA-facing issue comment.
- Non-goals: unrelated Convex feature adoption, execution-performance claims,
  fixture regeneration unless owned scaffold inputs change, compatibility shims.

Output budget strategy:
- Read exact issue-listed owners and nearby tests; use file-name/count searches
  before content; exclude generated fixtures, `node_modules`, build output, and
  logs unless a named acceptance case owns them; cap full command output and
  inspect saved logs by failure tail.

Blocked condition:
- Stop only after the same infrastructure failure recurs through three
  materially different diagnostics, or GitHub/package authority prevents the
  required PR path after real attempts.

Task state:
- task_type: bug plus compatibility/tooling hardening
- task_complexity: non-trivial normal package task
- current_phase: implementation
- current_phase_status: in_progress
- next_phase: implementation
- goal_status: active

Current verdict:
- verdict: valid with a corrected implementation path
- confidence: exact runtime failures reproduced and packed consumers pass at
  both Convex 1.42.3 and 1.44.0
- next owner: task verification and review
- reason: a version-neutral validator boundary preserves the reported 1.42
  floor without a breaking peer change

Implementation readiness:
- verdict: ready
- exact owner: explicit Convex compatibility contract in validator conversion,
  dependency pins/warnings, and a dedicated latest-type lane
- contradiction status: resolved: structural validator declarations no longer
  embed the latest vendor union; the same packed tarball compiles under Convex
  1.42.3 and under 1.44.0 with `custom(v.commitTs())`
- source-listed cases complete: yes, seven rows recorded below

Pre-solution issue challenge:
- reporter claim: Convex >=1.43 expands vendor-owned unions, breaking two
  exhaustive switches while KitCN claims unbounded compatibility and warns only
  below the minimum.
- suggested diagnosis or fix: bound the peer minor, own validator-kind mapping,
  add symmetric warnings and a latest type lane; remove dead/stale dependency
  configuration.
- repro ladder:
  - tests / source-level repro: direct `vRequired` and `convexToZod` calls with
    a `commitTs` validator both throw the reporter's exact errors
  - repo-owned automated browser or integration proof: N/A: package behavior has focused runtime/type owners
  - Browser plugin: N/A: no browser surface
  - screenshot / visual proof: N/A: no visual output
- reproduction verdict: reproduced at the owning source layer
- validity verdict: valid
- best long-term fix boundary: explicit known-kind runtime mapping plus a
  test-only exhaustive latest-Convex contract; bounded peer and symmetric
  warning are supporting policy, not substitutes
- harsh honest feedback: the report is right; bounding the peer without fixing
  runtime conversion would merely advertise a smaller broken range
- hard-stop decision: proceed; every source case has an owner and harness

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/328-convex-compatibility-range.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: package/runtime/type work has no UI or rendered output |
| Skill analysis before edits | yes | `task` + `autogoal`; `tdd`, `changeset`, and final `autoreview` required; browser/major-task N/A |
| Active goal checked or created | yes | active goal created for this exact plan |
| Source of truth read before edits | yes | GitHub issue #328 body read first |
| GitHub comments and attachments read | yes | one collaborator mention comment; no attachments or video |
| Video transcript evidence required | no | N/A: no video or recording |
| Pre-solution issue challenge required | yes | public technical bug claim; challenge in progress before implementation |
| Reproduction verdict before implementation | yes | reproduced both exact `commitTs` errors with a focused source harness |
| Repro escalation ladder selected | yes | focused runtime/type tests first; browser/visual N/A |
| Suggested fix reviewed against durable boundary | yes | accept explicit compatibility ownership; reject bounding alone as insufficient |
| `docs/solutions` checked for non-trivial existing-code work | yes | read Convex 1.42 ownership, release-audit, and type-test workflow notes |
| TDD decision before behavior change or bug fix | yes | vertical runtime tests first; dedicated type contract for future union drift |
| Branch decision for code-changing task | yes | dedicated `codex/issue-328-convex-compatibility` from `origin/main` |
| Release artifact decision | yes | published compatibility behavior requires one `kitcn` patch changeset |
| Browser tool decision for browser surface | no | N/A: no browser behavior |
| Commit / PR expectation decision | yes | commit entire checkout, push, create PR, wait for required checks |
| Task-style PR body decision | yes | use PR #270 emoji contract and verify remote body |
| GitHub issue sync expectation decision | yes | comment after PR exists with QA-facing verification |
| Output budget strategy recorded | yes | exact owners and capped commands recorded above |
| Package/API pack selected | yes | package/API and release-artifact risk is dominant touched surface |
| Public surface or package boundary identified | yes | `kitcn` Convex peer/runtime/type compatibility contract |
| Convex entry/import graph impact identified | yes | validator/Zod conversion changes must remain local; audit imports after diff |
| CLI/scaffold/generated impact identified | yes | dependency pin generation may change; fixtures only if scaffold source changes |
| Release artifact path selected | yes | one `.changeset/*.md` for `kitcn` patch |
| `changeset` skill loaded when `.changeset` is required | yes | loaded before creating `.changeset/convex-commit-timestamps.md` |
| Package build / fixture impact decision recorded | yes | package build required; fixture sync/check only if owned scaffold output changes |

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
| Named verification threshold | yes | Run named proof | `bun check`, `bun run typecheck:convex`, and final autoreview pass |
| Pre-solution issue challenge verdict | yes | Challenge report | valid with corrected non-breaking declaration path |
| Repro escalation ladder | yes | Reproduce at owner | exact source failures reproduced; browser/visual N/A |
| Bug reproduced before fix | yes | Record failure | both unknown-kind errors captured before mutation |
| Targeted behavior verification | yes | Run focused proof | 44 focused Bun/Vitest assertions pass across affected owners |
| TypeScript or typed config changed | yes | Run typechecks | package typecheck plus minimum/latest Convex lanes pass |
| Package exports or file layout changed | yes | Build package | `bun --cwd packages/kitcn build` passes; packed consumers pass |
| Package manifests, lockfile, or install graph changed | yes | Install/check | `bun install` and `bun check` pass |
| Agent rules or skills changed | no | N/A | no agent-native source changed; postinstall sync produced no diff |
| Workspace authority proof | yes | Use owning cwd | all commands ran in repo or `packages/kitcn`; packed consumers ran in `/tmp` |
| Browser surface changed | no | N/A | package/runtime/type work has no browser surface |
| Browser final proof | no | N/A | no rendered behavior |
| UI walkthrough | no | N/A | no UI or rendered output changed |
| Scaffold or fixture output changed | yes | Regenerate/check | eight fixture variants synced and match fresh output |
| Package behavior or public API changed | yes | Add changeset | `.changeset/convex-commit-timestamps.md` |
| Docs and kitcn skill sync changed | no | N/A | no public guidance changed |
| Docs or content changed | yes | Verify incidental plan | issue/VISION/upstream evidence recorded in this plan |
| High-risk mini gate | yes | Prove compatibility ends | strict packed consumers pass on Convex 1.42.3 and 1.44.0 |
| Agent-native review for agent/tooling changes | no | N/A | no agent/tool/user-action surface changed |
| Local install corruption suspected | no | N/A | install was required for dependency graph, not corruption recovery |
| Commit created | pending | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| PR create or update | pending | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| Task-style PR body verified | pending | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | pending |
| PR proof image hosting | no | N/A | no browser proof or images |
| GitHub issue sync-back | pending | Post concise issue sync after PR exists, or record N/A/blocker | pending |
| Final handoff contract | pending | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | pending |
| Final lint | yes | Run lint fix | `bun lint:fix` passes with no fixes |
| Output budget discipline | yes | Keep output bounded | one broad Ship grep recorded/recovered; final full check captured to bounded log |
| Timed checkpoint | no | N/A | no duration requested |
| Autoreview for non-trivial implementation changes | yes | Run final local review | Codex autoreview clean, no accepted/actionable findings, 0.98 correctness |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/328-convex-compatibility-range.md` | pending |
| Public API / package boundary proof | yes | Audit public declarations | structural validator boundary removes latest-only symbols; strict min/latest consumers pass |
| Convex bundle/import proof | yes | Audit static graphs | no new static runtime import; constructor-name checks preserve 1.42 loading |
| CLI/scaffold/generated proof | yes | Prove warning/pins/fixtures | warning and pin tests pass; eight fixtures match fresh output |
| Release artifact classification | yes | Classify delta | published `kitcn` runtime/types/CLI compatibility patch |
| Published package changeset | yes | Add changeset | patch changeset added after loading changeset skill |
| No release artifact | no | N/A | published behavior changed, so changeset applies |
| Package typecheck/build/test | yes | Run owning proof | typecheck, build, focused suites, and `bun check` pass |
| Fixture/scaffold generation | yes | Sync/check | all eight variants pass sync/check |
| Docs/package skill sync | no | N/A | no user guidance changed |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue, VISION, upstream, owners, and repros read | implementation |
| Implementation | complete | runtime, wrappers, warnings, pins, type lanes, workflow, tests, fixtures, and changeset implemented | verification |
| Verification | complete | focused tests, package build, min/latest lanes, fixtures, `bun check`, and clean autoreview | commit/PR |
| Commit / PR / GitHub sync | in_progress | verified branch ready | commit, push, PR, issue sync |
| Closeout | pending | | final response |

Findings:
- npm latest is Convex 1.44.0; 1.43.0 adds `v.commitTs()`, `VCommitTs`,
  `CommitTsPlaceholder`, and `db.vars.commitTs`; 1.44.0 changes generated server
  env types.
- Upstream explicitly documents that exhaustive switches over vendor-owned
  validator kinds should be expected to break on future Convex releases.
- `vRequired` and `convexToZod` both reproduce the reporter's exact unknown-kind
  failures before any implementation change.
- `packages/kitcn` has one unused broken `typecheck:types` script; the existing
  aliased Convex tsconfig is not wired into any task and only remaps
  `convex/server`, so it cannot catch validator-union drift.
- The raw auth adoption scenario is the only named stale Convex pin outside the
  dependency-pin target list.
- The first packed current build consumed with Convex 1.42.3 and
  `skipLibCheck: false` failed with 16 `TS2694` missing-`VCommitTs` declaration
  errors. Replacing the leaked vendor union with a structural validator
  boundary removes those references and preserves the 1.42 floor.

Decisions and tradeoffs:
- Compile package source against Convex 1.44.0 while keeping the peer range
  `>=1.42 <1.45.0`; use a narrow structural validator contract where public
  declaration inference previously embedded the full vendor union.
- Reject the initially recommended 1.43 floor bump after the structural
  boundary passed strict packed-consumer proof on both supported ends.
- Keep unknown runtime kinds fail-closed, but move exhaustiveness to the
  dedicated latest type test -> users do not fail compilation merely because a
  vendor union grew; maintainers still get scheduled drift alarms.
- Convex-to-Zod accepts both committed `bigint` and the runtime placeholder
  without a static value import unavailable in Convex 1.42 -> explicit runtime
  predicate plus structural type mapping.

Implementation notes:
- Added explicit runtime and structural type support for `commitTs` in required
  validator and Convex-to-Zod conversion.
- Added symmetric supported-range warnings, centralized dependency pins, a
  scheduled latest-Convex type lane, focused tests, and a changeset.
- Added a minimum-version declaration lane and forwarded the new `db.vars`
  member through both database-writer wrappers without importing new runtime
  symbols unavailable in 1.42.
- Regenerated fixtures from their owners; all eight variants match fresh output.

Review fixes:
- Self-review tightened the structural validator contract with stable
  `fieldPaths` and `isConvexValidator` markers so fake validator-like objects do
  not gain the old public overload accidentally.
- Final structured autoreview reported no accepted/actionable findings.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |
| Broad Ship homepage grep streamed minified HTML | 1 | use exact changelog route metadata and package changelog | recovered with exact 1.43/1.44 sources |
| Proposed Convex 1.42 floor failed the first packed strict-consumer proof | 1 | replace leaked vendor union with a structural declaration boundary | recovered; the rebuilt tarball passes 1.42.3 and 1.44.0 consumers |

Verification evidence:
- Before-fix source harness (cwd repo): `vRequired` -> `Unknown Convex validator
  type: commitTs`; `convexToZod` -> `Unknown convex validator type: commitTs`.
- External-source: npm latest 1.44.0; package changelog and upstream diff
  `6c759d6b..e936e7c4` confirm the union/value/database/codegen additions.
- Packed-consumer compatibility proof: the first tarball failed under 1.42.3
  with 16 missing-`VCommitTs` `TS2694` errors; the structurally repaired tarball
  passes strict TypeScript under 1.42.3 and under 1.44.0 with
  `custom(v.commitTs())`.
- Focused ORM, Zod, supported-dependency, and dependency-pin tests pass; the
  latest-Convex type lane, fixture sync, and fixture check pass.
- `bun check` exits 0 after 1,102 Bun tests, 727 Vitest tests, CLI/Concave
  checks, eight fresh fixture comparisons, package verification, and runtime
  scenarios.
- Final `./.agents/skills/autoreview/scripts/autoreview --mode local` exits 0:
  clean, no accepted/actionable findings, 0.98 correctness.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `vRequired(v.commitTs())` | ORM custom builder throws `Unknown Convex validator type: commitTs` | focused runtime regression through `vRequired`/custom builder | exact error reproduced with shaped validator | required validator preserves `commitTs` | focused custom builder test passes | passed |
| Convex to Zod `v.commitTs()` | Zod converter rejects `commitTs` | focused Zod conversion regression | exact error reproduced with shaped validator | schema accepts `bigint` and real placeholder, rejects other values | focused Zod test passes with no type errors | passed |
| Convex peer range | `>=1.42` overclaims every future minor | dependency pin/package manifest audit plus packed strict consumers | unbounded range; first repaired build leaked `VCommitTs` into minimum declarations | `>=1.42 <1.45.0`; patches float | rebuilt tarball passes 1.42.3 and 1.44.0 strict consumers | passed |
| version warnings | above-range concrete specs are silent | focused warning tests | above-range installed/declared versions produced no warning | below-minimum and at/above-ceiling specs warn; in-range specs do not | 11 supported-dependency tests pass | passed |
| latest drift lane | no scheduled/latest Convex type proof catches union additions | type-test workflow/config harness | dead alias config had no task/workflow owner | latest lane fails on unsupported drift and current latest passes owned mappings | weekly/manual workflow plus exact kind equality; current latest passes | passed |
| dead type script | `typecheck:types` points to missing path and is unused | manifest/task-graph source audit | command targets missing `convex/test-types` path | removed or repaired and owned by a real gate | replaced by min/latest `typecheck:convex` scripts | passed |
| stale auth scenario pin | raw auth adoption scenario remains on Convex `^1.33.0` outside pin sync | dependency-pin generation test/audit | outside `PACKAGE_JSON_TARGETS` | source target participates in the supported pin contract | target added; pin test and fixture sync/check pass | passed |

Final handoff contract:
- Commit line: pending
- PR line: pending
- Issue line: pending
- Confidence line: 95-100%
- Flow table:
  - Reproduced: exact source failures; browser N/A
  - Verified: focused/full/type/packed/fixture proof; browser N/A
- Browser check: N/A: package/runtime/type change
- Outcome: commit timestamps supported; Convex range bounded; drift lanes owned
- Caveat: future Convex minors intentionally warn/fail the scheduled contract
- Design:
  - Chosen boundary: explicit runtime maps plus structural public declaration contract
  - Why not quick patch: bounding the peer alone leaves current runtime broken
  - Why not broader change: structural declarations preserve 1.42 without a breaking floor bump
- Verified: `bun check`, `bun run typecheck:convex`, packed consumers, clean autoreview
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
- Browser proof: N/A: no browser surface
- Caveats: support intentionally stops before Convex 1.45 pending scheduled audit

Timeline:
- 2026-08-16T07:44:06.619Z Task goal plan created.
- 2026-08-16 GitHub issue/comments, VISION, source owners, tests, and relevant
  solution notes read; dedicated branch created from `origin/main`.
- 2026-08-16 Both runtime claims reproduced; npm/changelog/upstream diff confirm
  1.43/1.44 additions; verdict `valid`, readiness `ready`.
- 2026-08-16 Implemented the source-listed runtime/tooling cases and passed
  focused tests, latest type proof, fixture sync, and fixture check.
- 2026-08-16 Packed strict-consumer proof disproved the proposed 1.42 floor;
  pivoted verdict to `partially valid` and paused for the required breaking
  peer-floor confirmation.
- 2026-08-16 Replaced the leaked vendor union with a structural validator
  declaration boundary; strict packed consumers pass on 1.42.3 and 1.44.0, so
  the non-breaking floor is preserved.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Verification |
| Where am I going? | Full repo gate, review, commit, and ship PR |
| What is the goal? | Fix all issue #328 compatibility cases and ship a verified PR. |
| What have I learned? | Convex 1.42 can consume the package when emitted declarations depend on a structural validator contract instead of an expanded 1.44 union. |
| What have I done? | Implemented all source cases and proved both supported ends with runtime, type, fixture, and packed-consumer harnesses. |

Open risks:
- Full repo check and final autoreview remain before delivery.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
