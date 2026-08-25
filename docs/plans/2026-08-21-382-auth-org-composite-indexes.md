# 382 auth org composite indexes

Objective:
Make kitcn's generated Better Auth schema emit the composite indexes the
organization plugin actually queries, and stop `listOne` from answering "not
found" out of a truncated scan.

Goal plan:
docs/plans/2026-08-21-382-auth-org-composite-indexes.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- docs (docs/plans/templates/packs/docs.md)

Task source:
- type: GitHub issue (attachment)
- id / link: #382 https://github.com/udecode/kitcn/issues/382
- title: Auth: organization-plugin models get no composite indexes - org
  permission checks scan 200 rows and return a false "not a member" past row 200
- acceptance criteria:
  - generated auth schema emits composite indexes for every multi-field
    organization-plugin query shape
  - `member` findOne by `organizationId` + `userId` returns the row regardless of
    creation-order position
  - `organizationId` (and every other shadowed standalone) stays emitted
  - `.sort()` at create-schema.ts stays, because findIndex localeCompare-sorts
    eq fields before prefix matching
- caveats: fix must land in the generator; hand-added indexes do not survive the
  `--preset convex` whole-file rewrite
- likely files: packages/kitcn/src/auth/create-schema.ts,
  packages/kitcn/src/auth/adapter-utils.ts, example/convex/functions/schema.ts
- browser surface: none
- root-cause layer: schema generator (index declaration) + auth adapter
  (single-document read semantics)

Timed checkpoint:
- requested duration: pending
- semantics: pending
- initial confidence score: pending
- improvement loop: pending
- final score / loop closure: pending

Completion threshold:
- `createSchema` and `createSchemaExtensionOrm` emit `organizationId_userId`,
  `organizationId_role`, `organizationId_status`, `email_organizationId_status`,
  `teamId_userId` for the matching org-plugin models, and no index that exists
  today disappears.
- A convex-test proves `listOne` on `member` with `{organizationId, userId}`
  returns the row at creation position 240, both with the generated composite
  index and with no usable index at all.
- Package build, typecheck, lint, bun+vitest suites, and fixtures:check pass.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-21-382-auth-org-composite-indexes.md` passes.

Verification surface:
- `bun test packages/kitcn/src/auth/create-schema.test.ts packages/kitcn/src/auth/create-schema-orm.test.ts`
- `bunx vitest run --project integration packages/kitcn/src/auth/adapter-utils.vitest.ts`
- `bun --cwd packages/kitcn build`, `bun typecheck`, `bun lint`, `bun run test`
- `bun run fixtures:sync` + `bun run fixtures:check`
- index-delta audit script comparing emitted indexes before/after

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
- Source of truth: issue #382 attachment + better-auth organization plugin dist.
- Allowed edit scope: packages/kitcn/src/auth/**, example generated schema,
  docs/skill mirrors, .changeset.
- Browser surface: N/A - schema generation and server-side reads only.
- GitHub issue sync: PR #397 opened after the user later requested it.
- Non-goals: reworking findIndex's sort contract, adding an org fixture app,
  refreshing the already-stale AUTH_CONVEX_SCHEMA_TEMPLATE.

Output budget strategy:
- Broad enumeration ran in a background Workflow with schema-constrained
  returns; raw better-auth scans piped through python filters printing one line
  per query shape. Generated-schema inspection greps only `defineTable(`/`.index(`.

Blocked condition:
- None. User preference explicitly forbids PR creation, which is a recorded
  decline rather than a blocker.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: intake
- current_phase_status: in_progress
- next_phase: implementation
- goal_status: active

Current verdict:
- verdict: complete
- confidence: 95-100%
- next owner: reviewers on PR #397
- reason: both layers reproduced red, fixed, and re-proven green; every `bun
  check` lane passes; autoreview clean twice; PR opened

Implementation readiness:
- verdict: ready
- exact owner: `indexFields` in packages/kitcn/src/auth/create-schema.ts (both
  generators read it) + `listOne` in packages/kitcn/src/auth/adapter-utils.ts
- contradiction status: none - source, repro, and example schema agree
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: `member` findOne on `organizationId` + `userId` is unindexed,
  the scan is capped at 200 rows, and `listOne` returns the first page's
  `page[0]`, so a member past row 200 reads back as "not a member".
- suggested diagnosis or fix: add
  `member: ['organizationId', ['organizationId','userId'], ['organizationId','role']]`
  to `indexFields`, keep `.sort()`, keep the standalone `organizationId`.
- repro ladder:
  - tests / source-level repro: convex-test in
    packages/kitcn/src/auth/zz-repro382.vitest.ts (scratch) seeded 250 `member`
    rows against a schema mirroring today's generator output; `listOne` for
    `u240` returned `undefined`. Adding `.index('organizationId_userId', ...)`
    made the same test pass.
  - repo-owned automated browser or integration proof: N/A - no browser surface.
  - Browser plugin: N/A - schema generation and server-side reads only.
  - screenshot / visual proof: N/A - no visual output.
- reproduction verdict: reproduced
- validity verdict: valid, suggested fix incomplete
- best long-term fix boundary: `indexFields` covers every multi-field
  organization query shape (not only `member`), and `listOne` stops answering
  from a truncated page.
- harsh honest feedback: the issue's `indexFields` patch is correct but stops at
  `member`. The same defect exists on `teamMember` (`teamId`+`userId`),
  `invitation` (`organizationId`+`status`, `email`+`organizationId`+`status`),
  and `organizationRole` (`organizationId`+`role`). It also leaves the failure
  mode itself intact: any future unindexed two-field findOne silently returns
  the wrong answer again.
- hard-stop decision: proceed - claim reproduced at the source layer.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-21-382-auth-org-composite-indexes.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | No duration requested |
| Walkthrough baseline for possible UI change | no | N/A: schema generator + server read path, no UI or rendered output |
| Skill analysis before edits | yes | task + autogoal + changeset; no browser/testing skill needed |
| Active goal checked or created | yes | this plan |
| Source of truth read before edits | yes | issue attachment + better-auth org plugin dist read before first edit |
| Exact per-PR task ownership | no | N/A: user preference forbids PR creation |
| GitHub comments and attachments read | yes | .context/attachments/github-5214880197/[GITHUB]-382.md |
| Video transcript evidence required | no | N/A: no video evidence |
| Pre-solution issue challenge required | yes | recorded above |
| Reproduction verdict before implementation | yes | reproduced via convex-test before any src edit |
| Repro escalation ladder selected | yes | source-level convex-test sufficed |
| Suggested fix reviewed against durable boundary | yes | widened beyond `member`, plus listOne truncation fix |
| `docs/solutions` checked for non-trivial existing-code work | yes | no prior auth-index solution note |
| TDD decision before behavior change or bug fix | yes | red repro first, then generator + runtime regression tests |
| Branch decision for code-changing task | yes | renamed `issue-382` -> `fix/auth-org-composite-indexes` before first push |
| Release artifact decision | yes | new `.changeset` required (published generator output changes) |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | Commit + push + PR completed after the user explicitly requested a PR. |
| Task-style PR body decision | yes | PR #270 emoji task-style body used |
| Task-plan PR body evidence | yes | Body carries the plan line; plan exists at PR head naming PR #397 |
| GitHub issue sync expectation decision | yes | PR #397 links the issue via `Fixes #382` |
| Output budget strategy recorded | yes | recorded above |
| Package/API pack selected | yes | packages/kitcn generator + adapter |
| Public surface or package boundary identified | yes | `indexFields` export, generated schema output, adapter listOne semantics |
| Convex entry/import graph impact identified | yes | no new imports; listOne loop stays inside adapter-utils |
| CLI/scaffold/generated impact identified | yes | example schema + codegen; auth fixtures have no org plugin |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | .agents/rules/changeset.mdc |
| Package build / fixture impact decision recorded | yes | run kitcn build + fixtures:sync/check |
| Docs pack selected | yes | supporting surface only |
| Docs guidance loaded | yes | packages/kitcn/skills/kitcn/references/setup/doc-guidelines.md |
| Docs lane selected | yes | incidental docs, current-state voice |
| Target docs and nearest sibling docs read | yes | www organizations.mdx + skill mirror |
| Docs style doctrine read | yes | no changelog voice, latest-state only |
| Documented source owner identified | yes | packages/kitcn/skills/kitcn is source; .agents mirror is generated |

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
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed or marked N/A with reason.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages or are marked N/A with reason.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Ran named commands | see Verification evidence |
| Exact per-PR task ownership | yes | This plan owns exactly one PR | https://github.com/udecode/kitcn/pull/397 |
| Pre-solution issue challenge verdict | yes | Recorded before first src edit | valid, suggested fix incomplete |
| Repro escalation ladder | yes | Source-level convex-test reproduced it | ladder stopped at rung 1 |
| Bug reproduced before fix | yes | scratch repro returned undefined for u240 | then re-proven via stashed-src red run |
| Targeted behavior verification | yes | auth bun + vitest suites | 142 pass / 13 pass |
| TypeScript or typed config changed | yes | `bun typecheck` | 5/5 tasks successful |
| Package exports or file layout changed | yes | `bun --cwd packages/kitcn build` | 71 files |
| Package manifests, lockfile, or install graph changed | no | N/A: no manifest or lockfile change | git status clean of those |
| Agent rules or skills changed | yes | `bun tooling/sync-kitcn-skill.ts` | `.agents` mirror diff-identical |
| Workspace authority proof | yes | cwd recorded per command | repo root, plus example/ for schema:sync |
| Browser surface changed | no | N/A: schema generation + server read path | no browser surface |
| Browser final proof | no | N/A | no browser surface |
| UI walkthrough | no | N/A: no UI or rendered output changed | docs prose only |
| Scaffold or fixture output changed | yes | Ran both | zero fixture diff; check passed |
| Package behavior or public API changed | yes | `.changeset/tidy-donkeys-argue.md` | patch |
| Docs and kitcn skill sync changed | yes | Both edited in same diff | mirror regenerated |
| Docs or content changed | yes | Incidental docs; index names verified against generator output | highlight ranges recounted |
| High-risk mini gate | yes | See High-risk note | recorded |
| Agent-native review for agent/tooling changes | no | N/A: `.agents` change is a generated content mirror, no agent behavior | regenerated, not authored |
| Local install corruption suspected | no | N/A: no surprising repo-wide failure | only a real TS7022 in my own diff |
| Commit created | yes | Commits on `fix/auth-org-composite-indexes` | pushed to origin |
| PR create or update | yes | `bun check` lanes all green, pushed, PR opened | https://github.com/udecode/kitcn/pull/397 |
| Task-style PR body verified | yes | `gh pr view 397 --json body` | auto-release block, emoji header, Phase table, Outcome/Caveat/Design/Verified |
| PR task evidence verified | yes | Plan line in body; this plan names PR #397 at the PR head | verified |
| PR proof image hosting | no | N/A: no browser proof, no images | nothing to host |
| GitHub issue sync-back | yes | PR #397 body carries `Fixes #382`, which links and will close the issue on merge | no separate comment needed |
| Final handoff contract | yes | Filled below | Final handoff contract section |
| Final lint | yes | `bun lint:fix` then `bun lint` | clean, 935 files |
| Output budget discipline | yes | All scans filtered/tailed; enumeration via background workflow | no unbounded dumps |
| Timed checkpoint | no | N/A: no duration requested | no timed loop |
| Autoreview for non-trivial implementation changes | yes | `--mode local --engine claude` twice | clean both times (0.85, 0.86) |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-21-382-auth-org-composite-indexes.md` | run at closeout |
| Public API / package boundary proof | yes | `indexFields` export shape unchanged; `listOne` signature unchanged | additive index set |
| Convex bundle/import proof | yes | No new imports; loop stays in adapter-utils | graph unchanged |
| CLI/scaffold/generated proof | yes | `kitcn add auth --schema --yes` in example/ | clean no-op merge, no patch conflict |
| Release artifact classification | yes | Published runtime + generated-output behavior delta | patch |
| Published package changeset | yes | `.changeset/tidy-donkeys-argue.md` | one file, kitcn patch |
| No release artifact | no | N/A: a changeset was added | .changeset/tidy-donkeys-argue.md |
| Package typecheck/build/test | yes | kitcn typecheck + build + tests | all pass |
| Fixture/scaffold generation | yes | Both run | zero diff; check passed |
| Docs/package skill sync | yes | www + skill source + generated mirror | in sync |
| Docs source-backed claim audit | yes | Index names match generator output exactly | verified against emitted list |
| Docs links / routes / previews | no | N/A: no links, routes, or previews changed | code fences only |
| Docs MDX/content parser | yes | `bun lint` covers www content; highlight ranges recounted by hand | clean |
| Kitcn docs sync | yes | Same diff | mirror regenerated |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | done | issue attachment + better-auth dist enumerated | implementation |
| Implementation | done | indexFields + listOne + tests + docs + changeset | verification |
| Verification | done | see Verification evidence | closeout |
| Commit / PR / GitHub sync | done | local commit only; PR declined by user | final response |
| Closeout | done | autoreview clean x2; plan completion check | final response |

Findings:
- Reproduced at the source layer: 250 `member` rows, `listOne` for `u240` with
  `{organizationId, userId}` returned `undefined` against a schema mirroring
  today's generator output. Adding `organizationId_userId` made it pass.
- `indexFields` is the single owner: `create-schema.ts` and `create-schema-orm.ts`
  both read it, and `reconcile-auth-schema.ts` re-renders through those two, so
  one edit reaches every generated path.
- Independent enumeration of better-auth 1.6.18's organization plugin (64 adapter
  calls across 6 models) yields exactly six multi-field eq shapes needing a
  composite: member(organizationId,userId), member(organizationId,role) via
  `listMembers?sortBy=role`, teamMember(teamId,userId),
  invitation(email,organizationId,status), invitation(organizationId,status),
  organizationRole(organizationId,role). All are already alphabetically ordered.
- Shapes anchored on `id`/`_id` or a `unique` field short-circuit in `paginate`
  and never reach index selection, so they need no composite.
- `example/convex/functions/schema.ts` had already hand-added
  `organizationId_userId`, `organizationId_role`, `organizationId_status`, and
  `email_organizationId_status` - independent confirmation of the needed set.
- The documented hand-owned schema in `www/.../organizations.mdx` was missing
  `index('organizationId')` on member/invitation and `index('teamId_userId')` on
  teamMember, i.e. the same defect in the hand-owned path.
- Out of scope but same defect class, reported not fixed: siwe's
  `walletAddress(address, chainId)`, and device-authorization's `deviceCode`,
  which declares no unique/sortable/references field and so generates zero
  indexes despite a two-field `consumeOne`.

Decisions and tradeoffs:
- Widened past the issue's `member`-only patch to every org model with a real
  multi-field query shape. A partial fix on the same owner table would leave
  identical holes.
- Every shadowed standalone (`member.organizationId`, `invitation.email`,
  `invitation.organizationId`, `teamMember.teamId`,
  `organizationRole.organizationId`) is relisted so the change is strictly
  additive: no index emitted before disappears. Verified by diffing emitted
  index names before/after.
- Did NOT add `member(organizationId, role)` for an eq+eq reason - no such query
  exists. It is needed because `listMembers` accepts a caller `sortBy` and `role`
  is member's only sortable field.
- Fixed `listOne` as well as the indexes. The index change removes the reported
  bug for known shapes; the `listOne` change removes the failure mode. Any
  unindexed two-field findOne - a custom plugin, additionalFields, a user model -
  hits the identical silent false negative otherwise.
- Chose paging-to-exhaustion over throwing on truncation. Throwing would fire on
  legitimately-empty large filtered scans (e.g. an org with 300 cancelled
  invitations and no pending one), turning correct nulls into errors. Paging
  returns the true answer and matches what `handlePagination` already does for
  findMany/count.
- Tradeoff accepted: an unindexed single-document lookup on a large table is now
  a full scan instead of a capped 200-row scan, so it can hit Convex's read limit
  and throw. A loud failure is correct where the alternative is a silent
  authorization bypass, and `generateQuery` already logs the exact index to add.
- Left `siwe` and `device-authorization` alone: out of the issue's stated scope,
  no repo test coverage, and the `listOne` fix already removes their wrong-answer
  risk, leaving only a cost problem.
- Reverted `example/` regeneration. Running `kitcn add auth --schema --yes`
  produces a subscription-checksum and import-order diff that reproduces
  identically on unmodified `main`, so it is pre-existing drift, not this change.
  The relevant proof is that the org index merge is a clean no-op with no
  `Schema patch conflict`.

Implementation notes:
- `packages/kitcn/src/auth/create-schema.ts`: added `invitation`, `member`,
  `organizationRole`, `teamMember` entries to `indexFields`, plus a header
  comment stating the alphabetical-order and shadowing rules that make the map
  hard to edit correctly.
- `packages/kitcn/src/auth/adapter-utils.ts`: `listOne` pages until a match or
  `isDone`, with a no-forward-progress guard. Annotated the result as
  `PaginationResult<Doc>` to break a TS7022 circular inference.
- Tests: exact emitted-index lists in `create-schema.test.ts`, ORM parity in
  `create-schema-orm.test.ts`, three runtime cases in `adapter-utils.vitest.ts`
  (indexed / unindexed / genuine miss).
- Docs: `www/.../organizations.mdx` + `packages/kitcn/skills/kitcn/.../auth-organizations.md`
  gained the missing `organizationId` and `teamId_userId` indexes; `.agents`
  mirror regenerated via `bun tooling/sync-kitcn-skill.ts`.
- Verified kitcn's `stream.paginate()` iterates `iterWithKeys()` and never calls
  Convex's native `db.query().paginate()`, so looping it in `listOne` does not
  hit the once-per-function pagination restriction.

Review fixes:
- autoreview run 1: clean (0.85), three non-blocking nits. Fixed two: reworded a
  garbled comment in `create-schema-orm.test.ts`, and added
  `organizationId_role` to the test's `indexedSchema` so it truly mirrors
  generator output. Rejected the third: the `{4-68}` docs highlight range was
  recounted against the block and does cover every added line.
- autoreview run 2 after fixes: clean (0.86), no accepted/actionable findings.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
- cwd is repo root unless noted.
- Red-before-green: with src reverted via `git stash`, the new
  `adapter-utils.vitest.ts` case fails and the two generator tests fail
  (`7 pass 2 fail`); restored cleanly (`cmp` verified).
- `bun test packages/kitcn/src/auth/` -> 142 pass, 0 fail.
- `bunx vitest run --project integration packages/kitcn/src/auth/` -> 13 pass.
- `bun lint` -> clean (935 files).
- `bun typecheck` -> 5/5 tasks successful.
- `bun --cwd packages/kitcn build` -> 71 files, complete.
- `bun run test` -> 1290 bun pass / 0 fail; 848 vitest pass / 0 fail.
- `bun run fixtures:sync` -> zero fixture diff (no fixture enables the org
  plugin).
- `bun run fixtures:check` -> all four `-auth` fixtures match fresh output.
- `kitcn add auth --schema --yes` in `example/` -> org index merge is a no-op,
  no `Schema patch conflict`; the only diff reproduces on unmodified `main`.
- `bun tooling/sync-kitcn-skill.ts` -> `.agents` mirror byte-identical to
  `packages/kitcn/skills/kitcn`.
- Emitted-index delta audit: every pre-change index name still present; new names
  are member.organizationId_role, member.organizationId_userId,
  teamMember.teamId_userId, invitation.email_organizationId_status,
  invitation.organizationId_status, organizationRole.organizationId_role.
- Final re-run after the two autoreview nit fixes: `bun lint` clean,
  `bun --cwd packages/kitcn build` complete, `bun run test` -> 1290 bun pass /
  0 fail and 848 vitest pass / 0 fail, `bun typecheck` 5/5 successful.
- Final autoreview: `--mode local --engine claude` -> clean, no
  accepted/actionable findings (0.86).
- Autoclosure focused replay: 20 schema-generation and adapter-pagination tests
  pass; no type errors.
- Agent-native proof: published organization skill source matches its installed
  mirror; `bun run intent:validate` and `cd packages/kitcn && bunx intent stale`
  pass.
- Autoclosure branch P1 autoreview: clean, patch correct at 0.93 confidence.
- Deslop: 169 findings before and after, score unchanged, with zero occurrence
  changes.
- Autoclosure final `bun lint:fix && bun --cwd packages/kitcn build && bun
  check` replay exited 0, including fixture parity and every runtime scenario.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| member findOne past row 200 | returns false "not a member" | convex-test, 250 rows, `listOne` for `u240` | `undefined` | row returned | adapter-utils.vitest.ts "the generated composite index answers without a table scan" | done |
| no composite index at all | silent null | same harness, schema without the composite | `undefined` | row returned + warn logged | adapter-utils.vitest.ts "an unindexed lookup pages instead of reporting a false miss" | done |
| genuine miss | must stay null | same harness, unknown userId | null | null | adapter-utils.vitest.ts "a genuine miss still resolves to null" | done |
| generator emits composite | no composite for member | `createSchema` with organization() | no composite | organizationId_userId + organizationId_role | create-schema.test.ts | done |
| standalone survives shadowing | organizationId index would vanish | same | present | still present | create-schema.test.ts exact index list | done |
| ORM generator parity | both generators read indexFields | `createSchemaExtensionOrm` | no composite | composites emitted | create-schema-orm.test.ts | done |
| findMany/count unbounded shapes | sortBy createdAt + multi-field filters | index-emission audit | unindexed | organizationId exact-length index kept; invitation composites added | emitted-index delta audit | done |

Final handoff contract:
- Commit line: `fix/auth-org-composite-indexes`, pushed to origin
- PR line: https://github.com/udecode/kitcn/pull/397
- Issue line: closed by `Fixes #382` in the PR body on merge
- Confidence line: 95-100%
- Flow table:
  - Reproduced: tests red at both layers, browser N/A
  - Verified: tests green (1290 bun + 848 vitest), browser N/A
- Browser check: N/A - schema generation and server-side reads only
- Outcome: org-plugin composite indexes are generated, and `listOne` can no
  longer report "not found" from a truncated scan.
- Caveat: an unindexed single-document lookup on a large table now scans to
  exhaustion and can fail loudly at Convex's read limit. siwe and
  device-authorization carry the same missing-composite defect and were left out
  of scope.
- Design:
  - Chosen boundary: `indexFields` (the single map both generators read) plus
    `listOne`'s single-document read contract.
  - Why not quick patch: a `member`-only entry leaves the identical hole on
    teamMember, invitation, and organizationRole, and leaves the silent-wrong-
    answer failure mode intact for any future unindexed two-field findOne.
  - Why not broader change: did not touch `findIndex`'s sort contract, did not
    add an org fixture app, and did not fix siwe/device-authorization - all
    outside the issue's stated scope with no repro in hand.
- Verified: see Verification evidence.
- PR body verified: `gh pr view 397 --json body` matches the final handoff.

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
- Commit: pushed on `fix/auth-org-composite-indexes`
- PR: https://github.com/udecode/kitcn/pull/397
- Issue: #382, closed on merge via `Fixes #382`
- Browser proof: N/A
- Caveats: see Open risks

Timeline:
- 2026-08-21T14:09:31.148Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Intake and source read |
| Where am I going? | Implementation, verification, commit/PR/GitHub sync, closeout |
| What is the goal? | Generate the org-plugin composite indexes and stop `listOne` answering from a truncated scan |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- An unindexed single-document lookup on a large table now scans to exhaustion
  and can hit Convex's read limit instead of returning a capped wrong answer.
  Deliberate, documented in the changeset, and the adapter already logs the exact
  index to add.
- Two non-organization models carry the same missing-composite defect and were
  left out of scope: siwe `walletAddress(address, chainId)`, and
  device-authorization `deviceCode(deviceCode, status)` - the latter generates no
  indexes at all. The `listOne` fix removes their wrong-answer risk but not their
  read cost.
- No fixture app enables the organization plugin, so fixture-level regression
  coverage for org index output does not exist. Generator-level tests pin it
  instead.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.

High-risk note:
- Realistic failure mode: `listOne` now pages instead of capping at 200 scanned
  rows, so an unindexed single-document lookup on a large table can exhaust
  Convex's read limit and throw where it previously returned a (wrong) null.
- Proof plan: three runtime cases in `adapter-utils.vitest.ts` cover indexed hit,
  unindexed hit past the scan bound, and genuine miss; full bun+vitest suites and
  fixtures:check guard the rest.
- Why this boundary is right: a single-document read either answers definitively
  or fails loudly. Returning null from a truncated scan is an authorization
  answer the adapter has not actually computed, and in the organization plugin it
  reads as a false "not a member".

Timeline:
- 2026-08-21 Implementation, verification, and two clean autoreview passes
  completed; committed locally without push or PR per user decline.
- 2026-08-21 User requested a PR. Branch renamed to
  `fix/auth-org-composite-indexes`, `bun check` lanes all proven green, pushed,
  and PR #397 opened.

`bun check` blocker log:
- Run 1 failed with one non-reproducing `test:bun` failure (1288 tests
  registered vs 1290 on green runs); the harness's per-failure block was lost
  from the captured log, and a standalone `bun test` returned 1290 pass / 0 fail.
- Run 2 passed `check:ci` and `test:verify`, then failed `test:runtime` with
  `EADDRINUSE 127.0.0.1:3211` and `:::3005`.
- Root cause: `test:runtime` binds fixed ports, and sibling Conductor workspaces
  were running concurrently - `lsof` showed pid 54871 holding 3211, plus live
  `moab` and `mbabane` workspace processes. Not repo code, and not this diff.
- Resolution: reran `bun run test:runtime` alone -> exit 0, zero `EADDRINUSE`,
  `Auth smoke passed against http://localhost:3005`. Every `bun check` lane is
  green; they simply could not all pass inside one process while neighbouring
  workspaces held the ports. Sibling workspace processes were left untouched.
