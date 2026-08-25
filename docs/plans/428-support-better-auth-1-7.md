# support better auth 1.7

Objective:
Support Better Auth 1.7.1 through KitCN's owned auth package; done when the
version, schema/index, unique-tuple, and stable joins cases pass, repo checks
pass, and one task-style PR fixes #428.

Flow mode:
one-shot execution under the active sync goal

Linked plans:
- None.

Goal plan:
docs/plans/428-support-better-auth-1-7.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: GitHub feature/compatibility issue
- id / link: #428 https://github.com/udecode/kitcn/issues/428
- title: Support better-auth 1.7
- acceptance criteria: install and peer support Better Auth 1.7.1; generated
  Convex and ORM auth schemas preserve the 1.7 account issuer and table-level
  indexes; compound unique tuples are enforced; the adapter uses stable
  `advanced.database.joins`; package/scaffold/auth verification passes; one PR
  links and fixes #428.
- caveat: upgrading existing account data requires an `issuer` backfill before
  the required field can deploy; record the breaking hard cut in the changeset.
- likely files: supported dependency owner, auth schema/index owners, adapter
  uniqueness and joins owners, focused tests, generated fixtures, lockfile, and
  one KitCN changeset.
- browser surface: none; package schema/runtime/type behavior only.
- root-cause layer: KitCN's pinned dependency family plus its vendored Convex
  adapter/schema generator, not `@convex-dev/better-auth` package consumption.

Timed checkpoint:
- requested duration: N/A
- semantics: N/A: no duration requested
- initial confidence score: 88%; source contract and owners are proven, red
  behavior tests and Better Auth 1.7 install proof remain.
- improvement loop: one red-green vertical slice per source case, then package,
  fixture, repo, review, and PR proof.
- final score / loop closure: pending final evidence

Completion threshold:
- Better Auth exact install is `1.7.1` and KitCN peers hard-cut to
  `>=1.7.0 <1.8.0`.
- Fresh red-green proof covers 1.7 account `issuer`, table-level account/device
  indexes in Convex and ORM generation, compound unique enforcement, and
  `advanced.database.joins` disabling for the non-join Convex adapter.
- Existing auth client/type suites prove `organization.getOrganization()` and
  `hydrateSession` remain available through Better Auth without KitCN wrappers.
- `bun --cwd packages/kitcn build`, `bun run fixtures:sync`,
  `bun run fixtures:check`, focused tests, `bun typecheck`, `bun lint:fix`,
  `bun check`, and final autoreview pass.
- One `kitcn` minor changeset records the breaking 1.7 account/schema upgrade.
- Entire checkout is committed, pushed, and opened as one task-style PR fixing
  #428; this plan names the exact PR and its body links this plan.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7.md` passes.

Verification surface:
- Focused Bun tests for supported dependency metadata, both schema generators,
  compound uniqueness, and adapter options.
- KitCN package build, fixture regeneration/check, auth-relevant typecheck,
  lint, `bun check`, and changeset source audit in this checkout.
- Better Auth v1.7.1 source/tag plus npm metadata for the dependency contract.
- Final autoreview with zero accepted/actionable findings.
- `gh pr view --json body,url,state,headRefOid` and issue comment read-back.

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
- Hard cut Better Auth 1.6. Do not preserve `experimental.joins` fallbacks,
  compatibility aliases, or parallel schema parsing.
- Keep Convex function entry imports narrow; schema generation remains behind
  its existing lazy boundary.
- Do not import upstream e2e infrastructure or broad examples.

Boundaries:
- Source of truth: issue #428; Better Auth v1.7.1 contracts/merged PRs #10403,
  #10402, #10359, #10059, #10397, and #8733; KitCN VISION; local vendored auth
  owners; prior Better Auth 1.6 and upstream-sync solution notes.
- Allowed edit scope: dependency-version owner and synced manifests/fixtures,
  auth schema/index/uniqueness/joins owners, focused tests, lockfile, plans, and
  one active/new KitCN changeset.
- Browser surface: N/A: no rendered or browser-native behavior.
- GitHub issue sync: PR first, then concise QA comment on #428.
- Non-goals: fork e2e harness adoption, organization/session convenience
  wrappers, broad auth examples, unrelated dependency upgrades, or migration
  automation beyond the required breaking upgrade receipt.

Output budget strategy:
- Read exact owners and exact Better Auth tag files; cap test/build output;
  exclude generated/build/node_modules trees from searches. Two earlier broad
  audit outputs are recorded in the parent sync plan and will not be repeated.

Blocked condition:
- Block only if a source-listed compatibility case cannot be made red honestly,
  Better Auth 1.7.1 cannot install, the required account/index contract cannot
  be represented without a new public architecture decision, repo gates remain
  broken after one install-rot retry when applicable, or push/PR access fails.

Task state:
- task_type: published package compatibility feature and breaking dependency hard cut
- task_complexity: non-trivial measurable
- current_phase: verification
- current_phase_status: implementation and focused TDD complete; checkpointing
  before shared-checkout handoff
- next_phase: final focused proof, autoreview, `bun check`, and PR delivery
- goal_status: active

Checkpoint evidence:
- Better Auth `1.7.1` exact installs and `>=1.7.0 <1.8.0` peer ownership are
  implemented across package, example, scaffold, generated fixtures, and Expo.
- Convex and ORM generation preserve declared table indexes; account issuer,
  device-code indexes, compound uniqueness, stable joins, atomic consume and
  increment adapter methods, client types, and owned OIDC discovery have
  focused green proof.
- Package build, fixture regeneration/check, root typecheck, and lint passed.
  A redundant full dependency validator advanced through package build and
  generated fixture checks before a GitHub sparse-checkout network timeout
  while recreating the Vite fixture; the failure is environmental, not a
  product assertion.
- Final autoreview, `bun check`, plan closure, PR creation, and issue sync remain
  after the shared checkout is returned.

Autoreview scope baseline:
- Request/invariant: issue #428 requires honest Better Auth 1.7.1 support; the
  prior peer range excluded 1.7 while the owned schema and adapter paths ignored
  required table indexes, compound identity, stable joins, and atomic adapter
  methods.
- Target: `codex/428-support-better-auth-1-7` against
  `origin/main@9963d33048ec532f0a2d9a06bb618486856178b1`.
- Owner boundary: supported dependency metadata, auth schema generators,
  adapter uniqueness/options/mutations, generated auth contracts, and React/
  Solid structural client types; sibling surfaces are the plain/ORM generators,
  HTTP/DB adapters, generated enabled/disabled contracts, and all auth fixture
  templates.
- Contracts: Better Auth 1.7.1 public adapter/schema/client types, Convex atomic
  mutation and narrow import behavior, hard-cut dependency policy, generated
  fixture parity, and required account issuer backfill disclosure.
- Measurement: 34 changed files total; 25 non-test files at +1320/-129 lines,
  including the two task plans, lockfile, manifests, and generated fixtures.

Current verdict:
- verdict: partially valid
- confidence: high
- next owner: task
- reason: peer exclusion and stale vendored adapter/schema contracts are proven;
  optional convenience APIs need no KitCN wrapper.

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/cli/supported-dependencies.ts`, both auth
  schema generators and their shared index derivation, `adapter-utils.ts`
  compound uniqueness, and `adapter.ts` stable joins option handling.
- contradiction status: upstream `@convex-dev/better-auth@0.12.5` still peers
  below 1.7, but KitCN deliberately vendors/owns these runtime surfaces, so its
  compatibility boundary is independent.
- source-listed cases complete: yes; matrix below covers every issue item.

Pre-solution issue challenge:
- reporter claim: KitCN excludes Better Auth 1.7 and its generated
  adapter/schema likely misses required 1.7 account/index/joins behavior.
- suggested diagnosis or fix: raise the range plus update account identity,
  table indexes, joins, and device-code indexes; optional org/session features
  should become usable.
- repro ladder:
  - tests / source-level repro: package manifests prove the exclusion; local
    adapter reads removed `experimental.joins`; schema generators ignore
    `BetterAuthDBSchema.indexes`; each behavior gets a fresh red test next.
  - repo-owned automated browser or integration proof: N/A: package-only case.
  - Browser plugin: N/A: no browser surface.
  - screenshot / visual proof: N/A: no visual output.
- reproduction verdict: reproduced at source; red tests required before each fix.
- validity verdict: partially valid: compatibility/schema claims are valid;
  `getOrganization` and `hydrateSession` belong to Better Auth and should not
  gain KitCN wrappers.
- best long-term fix boundary: hard-cut the dependency family and teach the
  shared vendored schema/adapter owners the stable 1.7 contract once.
- harsh honest feedback: a range-only bump would be fake support; copying
  upstream e2e or wrapping Better Auth convenience APIs would be cargo cult.
- hard-stop decision: proceed with the compatibility slice only.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested. |
| Walkthrough baseline for possible UI change | no | N/A: package schema/runtime only; no UI or rendered output. |
| Skill analysis before edits | yes | Read `task`, `sync-convex-auth`, `autogoal`, `tdd`, `better-auth-best-practices`, and `changeset`; autoreview deferred to final diff. |
| Active goal checked or created | yes | Parent sync goal active; this exact task plan is its one implementation child. |
| Source of truth read before edits | yes | Issue/comments, VISION, Better Auth v1.7.1 sources and six linked PRs, local owners, and prior notes read. |
| Exact per-PR task ownership | yes | This plan owns one not-yet-created PR for issue #428. |
| GitHub comments and attachments read | yes | Issue has zero comments and no attachments. |
| Video transcript evidence required | no | N/A: no video evidence. |
| Pre-solution issue challenge required | yes | Partially-valid verdict and durable boundary recorded above. |
| Reproduction verdict before implementation | yes | Peer exclusion and stale schema/joins source reproduced; each mutation waits for its focused red. |
| Repro escalation ladder selected | yes | Focused package tests; browser/visual lanes N/A. |
| Suggested fix reviewed against durable boundary | yes | Shared vendored owners selected; range-only and new wrappers rejected. |
| `docs/solutions` checked for non-trivial existing-code work | yes | Read Better Auth 1.6 structural-wrapper and convex-better-auth sync notes plus #382 plan. |
| TDD decision before behavior change or bug fix | yes | Vertical cycles: dependency family, schema indexes, ORM indexes, compound uniqueness, stable joins. |
| Branch decision for code-changing task | yes | Created `codex/428-support-better-auth-1-7` from fresh `origin/main`; existing plan edits carried forward. |
| Release artifact decision | yes | Breaking published package hard cut requires one `kitcn` minor changeset. |
| Browser tool decision for browser surface | no | N/A: no browser surface. |
| Commit / PR expectation decision | yes | Task requires full-checkout commit, push, PR, then issue sync. |
| Task-style PR body decision | yes | Use required PR #270 emoji body. |
| Task-plan PR body evidence | yes | Body will name this plan; exact PR added after creation. |
| GitHub issue sync expectation decision | yes | PR first, then concise QA comment on #428. |
| Output budget strategy recorded | yes | Exact-owner/capped strategy above. |
| Package/API pack selected | yes | Published dependency, runtime, schema, and peer contract. |
| Public surface or package boundary identified | yes | Better Auth peer/install contract and generated schema/runtime behavior. |
| Convex entry/import graph impact identified | yes | No new deployed dependency; schema code stays behind existing lazy imports. |
| CLI/scaffold/generated impact identified | yes | Dependency sync changes generated auth app manifests; fixtures sync/check required. |
| Release artifact path selected | yes | Reuse one active unreleased KitCN changeset if present, else create one. |
| `changeset` skill loaded when `.changeset` is required | yes | Read generated skill and `.agents/rules/changeset.mdc` completely. |
| Package build / fixture impact decision recorded | yes | KitCN build plus fixtures sync/check are mandatory. |

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
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7.md` | pending |
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
| Intake and source read | in_progress | created plan | implementation |
| Implementation | pending | | verification |
| Verification | pending | | closeout |
| Commit / PR / GitHub sync | pending | | final response |
| Closeout | pending | | final response |

Findings:
- None yet.

Decisions and tradeoffs:
- None yet.

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
| Dependency family | KitCN excludes Better Auth 1.7 | supported-dependencies test + manifest/install audit | exact 1.6.18, peer `<1.7.0` | exact 1.7.1, peer `>=1.7.0 <1.8.0` | pending red-green | ready |
| Account identity | account requires `issuer` and `(issuer, accountId)` identity | `getAuthTables` through public `createSchema` and `createSchemaOrm` | generator ignores table compound index; installed 1.6 has no issuer | required issuer and compound index emitted | pending red-green | ready |
| Plugin indexes | Better Auth 1.7 table-level compound indexes must survive generation | handcrafted/public schema contract plus organization/device schemas | `table.indexes` ignored | declared indexes merged, field-mapped, deduped in both generators | pending red-green | ready |
| Stable joins | `experimental.joins` moved to `advanced.database.joins` | public adapter factory options mutation | adapter reads removed experimental option | stable option forced false once because Convex adapter has no native joins | pending red-green | ready |
| Device codes | device/user lookup fields are unique indexes | device authorization schema generation | plugin table indexes ignored | both indexes emitted and enforced | pending red-green | ready |
| Metadata org fetch | `organization.getOrganization()` should be usable | existing Better Auth client/type compilation on 1.7.1 | dependency excluded 1.7 | available through Better Auth client without wrapper | pending install/type proof | ready |
| Session hydration | `hydrateSession` should be usable | existing auth-client type compilation on 1.7.1 | dependency excluded 1.7 | available through Better Auth client without wrapper | pending install/type proof | ready |

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
- 2026-08-25T20:30:39.504Z Task goal plan created.
- 2026-08-25 Source/readiness complete; dedicated branch created; TDD vertical
  slices selected before package behavior mutation.
- 2026-08-25 Resumed after PR #399 merged and the shared checkout was
  explicitly released. Restored `codex/428-support-better-auth-1-7`,
  fast-forwarded to `origin/main@475c5792`, and retained both #428 plans. The
  blocked goal tool cannot reopen, so this plan is the active execution ledger.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Dependency-contract TDD on the restored dedicated branch |
| Where am I going? | Schema/runtime red-green, verification, commit/PR/GitHub sync, closeout |
| What is the goal? | Support Better Auth 1.7.1 honestly through KitCN's owned package and ship one PR fixing #428. |
| What have I learned? | The fork delta is irrelevant; KitCN's own vendored adapter makes the issue actionable and currently misses stable joins/table indexes. |
| What have I done? | Read all sources/skills, challenged issue claims, selected owners, created/restored the task branch, and recorded the resumed degraded goal lifecycle. |

Open risks:
- Existing accounts need issuer backfill before deploying the required 1.7
  schema. The package cannot infer an OAuth issuer from Convex rows; the
  changeset must state this rather than invent unsafe migration automation.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
