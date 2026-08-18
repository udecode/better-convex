# 368 codegen self-heals stale generated server

Objective:
Make `kitcn codegen` regenerate a stale `<functionsDir>/generated/server.ts` it owns, instead of aborting because that stale file throws while codegen evaluates project modules.

Goal plan:
docs/plans/368-codegen-self-heals-stale-generated-server.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: GitHub issue (attached as `.context/attachments/github-5175746510/[GITHUB]-368.md`)
- id / link: #368 — https://github.com/udecode/kitcn/issues/368
- title: codegen can't regenerate a stale pre-0.25 `generated/server.ts`, and the error points back at the command that just failed
- acceptance criteria:
  - `kitcn codegen` (default scope) regenerates `generated/server.ts` into the
    shape the current version requires, instead of aborting.
  - `kitcn dev` inherits the same repair (it runs codegen with scope=all).
  - The aggregate-capability hint must not send an upgrading user in a circle.
- caveats: reporter measured against the published 0.25.1 tarball; all claims
  re-verified against this repo's source.
- likely files/packages: `packages/kitcn/src/cli/codegen.ts`,
  `packages/kitcn/src/orm/capabilities.ts`, fixtures, docs.
- browser surface: none (CLI-only).
- root-cause layer: CLI codegen ordering — the emit that owns the file is gated
  behind evaluating modules that import the file.

Timed checkpoint:
- requested duration: N/A — no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- `kitcn codegen` completes and rewrites `generated/server.ts` with
  `capabilities: [aggregateCapability()]` when it starts from a pre-0.25 copy of
  that file in a project whose schema declares an `aggregateIndex`, proven by a
  test that fails on unpatched source with the exact reported message.
- The same run still records procedure metadata (no degraded intermediate).
- `kitcn codegen --scope auth|orm` no longer blanks the procedure-name lookup.
- A schema that fails to load aborts instead of silently regenerating the app as
  non-ORM.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/368-codegen-self-heals-stale-generated-server.md` passes.

Verification surface:
- `bun test packages/kitcn/src/cli/` (owns the changed codegen behavior)
- `bun run test` (full repo suite: bun + vitest lanes)
- `bun typecheck` (turbo, all packages)
- `bun run fixtures:sync` + `bun run fixtures:check` (generated scaffold output)
- `bun --cwd packages/kitcn build`
- `bun lint:fix`
- `.claude/skills/autoreview/scripts/autoreview --mode local`

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
- Source of truth: GitHub issue #368 plus this repo's source.
- Allowed edit scope: `packages/kitcn/src/cli/codegen.ts`,
  `packages/kitcn/src/cli/codegen.test.ts`,
  `packages/kitcn/src/orm/capabilities.ts`, regenerated `fixtures/**`,
  `example/**`, `convex/**` output, `www/content/docs/cli/backend.mdx`,
  `packages/kitcn/skills/kitcn/**`, `.changeset/**`.
- Browser surface: none.
- GitHub issue sync: N/A — issue #368 is linked from the PR body via
  `Fixes #368`; no separate issue comment requested.
- Non-goals: replacing the jiti parse loop with TS AST analysis; removing the
  `_generated/server` value import from emitted output; hard-cutting the
  bootstrap placeholder writers. All named as follow-ups.

Output budget strategy:
- Broad mapping delegated to a bounded 8-agent workflow that returned summaries
  instead of raw file dumps.
- Test/check output filtered with `tail`/`grep` at every call site.
- Fixture regeneration inspected via `git diff --stat` plus one representative
  file, not all 20.

Blocked condition:
- Would be blocked if the reported behavior could not be reproduced at the
  source layer, or if `fixtures:sync` could not run (it needs network for
  `bunx shadcn init`). Neither occurred.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: fixed
- confidence: 95-100%
- next owner: user
- reason: reproduced at the source layer with the exact reported message, fixed
  at the ownership boundary, and verified by targeted tests, the full repo
  suite, typecheck, fixture sync/check, and a clean autoreview.

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/cli/codegen.ts` emit ordering, plus the
  parse-derived/pre-parse split of generated output.
- contradiction status: none unresolved. The reporter's line references were to
  the published tarball; every claim was re-derived against repo source.
- source-listed cases complete: yes (see case matrix).

Pre-solution issue challenge:
- reporter claim: after upgrading past 0.25.0, `kitcn codegen` aborts on every
  function module with the missing-aggregate-capability error and never rewrites
  `generated/server.ts`, so the error's own advice ("rerun `kitcn codegen`") is
  circular.
- suggested diagnosis or fix: (1) emit `generated/server.ts` before the parse
  loop, (2) or widen the placeholder self-heal by sniffing the existing
  `createOrm(...)` capability set, (3) or at minimum fix the hint text.
- repro ladder:
  - tests / source-level repro: DONE. Added
    `packages/kitcn/src/cli/codegen.test.ts` →
    `generateMeta regenerates a generated/server.ts that predates the aggregate
    capability`, built on the existing `writeRealOrmFixture` helper so the real
    `createOrm` executes under jiti. On unpatched source it failed with exactly
    the reported message:
    `kitcn codegen aborted because module parsing failed:\n- orders.ts: Table
    'orders' declares an aggregateIndex/rankIndex, which requires the aggregate
    capability. ...`
  - repo-owned automated browser or integration proof: N/A — CLI-only surface.
  - Browser plugin: N/A — no browser-rendered output.
  - screenshot / visual proof: N/A — no visual output.
- reproduction verdict: valid — reproduced at the source layer, byte-for-byte.
- validity verdict: valid.
- best long-term fix boundary: `packages/kitcn/src/cli/codegen.ts` ordering /
  ownership. Codegen owns `generated/server.ts`, so it must put that file in the
  shape this version emits *before* it evaluates any module that imports it.
- harsh honest feedback: suggestion (2) is content sniffing and is rejected —
  it only heals the one drift shape the reporter hit and adds fallback parsing
  the repo forbids. Suggestion (3) alone leaves the defect in place. Suggestion
  (1) is directionally right but, as written, rewrites the file twice per run
  and breaks the fresh-bootstrap window; both were measured, not assumed.
- hard-stop decision: proceed (reproduced and valid).

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/368-codegen-self-heals-stale-generated-server.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: CLI-only change, no UI or rendered output can change |
| Skill analysis before edits | yes | Loaded `task`; added `autogoal` (non-trivial measurable), `changeset` rule, `autoreview`. Declined `major-task` (single-package bug, not architecture redesign), `tdd`/`testing` (bounded regression tests written directly), `find-skills` (no missing capability) |
| Active goal checked or created | yes | This plan, created via `create-goal-scratchpad.mjs --template task --with package-api`, renamed to ticket-number format per repo rule |
| Source of truth read before edits | yes | Read `.context/attachments/github-5175746510/[GITHUB]-368.md` in full before any tool call touching code |
| Exact per-PR task ownership | yes | https://github.com/udecode/kitcn/pull/372 — this plan owns exactly that PR |
| GitHub comments and attachments read | yes | Issue supplied as a local attachment containing the full body; no additional comments present in it |
| Video transcript evidence required | no | N/A: no video or screen recording in the source |
| Pre-solution issue challenge required | yes | Recorded above; all three reporter suggestions challenged, two rejected with measured evidence |
| Reproduction verdict before implementation | yes | `valid` — failing test produced the exact reported message before any fix |
| Repro escalation ladder selected | yes | Stopped at the lowest honest rung (source-level test); browser/visual rungs are N/A for a CLI |
| Suggested fix reviewed against durable boundary | yes | Reporter suggestion 1 adopted in corrected form; 2 rejected (sniffing); 3 adopted as an addition, not a substitute |
| `docs/solutions` checked for non-trivial existing-code work | no | N/A: no `docs/solutions` directory in this repo |
| TDD decision before behavior change or bug fix | yes | Red test written and confirmed failing before the fix; three further regression tests added |
| Branch decision for code-changing task | yes | Already on `issue-368`, a dedicated non-`main` branch matching this ticket; reused |
| Release artifact decision | yes | `.changeset/quiet-pugs-yawn.md` — published CLI behavior changes |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | Commit, push, and PR all completed. The user's standing no-PR preference was explicitly overridden by a later direct request to create a PR |
| Task-style PR body decision | yes | PR #270 emoji task-style body used, including the `auto-release` block |
| Task-plan PR body evidence | yes | Body line `🧭 Task plan: docs/plans/368-codegen-self-heals-stale-generated-server.md`; plan present at PR head; plan names PR #372 |
| GitHub issue sync expectation decision | yes | `Fixes #368` in the PR body links and closes the issue; no separate comment requested |
| Output budget strategy recorded | yes | Recorded above |
| Package/API pack selected | yes | `--with package-api` |
| Public surface or package boundary identified | yes | Generated-output shape for every kitcn app: `generated/server.ts` loses the inline lookup, new `generated/procedure-names.gen.ts` |
| Convex entry/import graph impact identified | yes | Net ~zero bytes: the lookup literal (8200 of 10740 bytes in `example/`) was already in every function entry's graph via `server.ts`; it moves behind one module boundary. Two-dot basename keeps the leaf out of Convex's entry-point walker |
| CLI/scaffold/generated impact identified | yes | 10 `generated/server.ts` regenerated, 10 `procedure-names.gen.ts` added, across 8 fixtures + `example/` + root `convex/` |
| Release artifact path selected | yes | `.changeset/quiet-pugs-yawn.md` (patch) |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` read; `## Patches` section shape and CHANGELOG tone followed |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; `fixtures:sync` + `fixtures:check` run |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration requested.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. This plan owns exactly
      one PR, https://github.com/udecode/kitcn/pull/372; no batch plan was used
      as a substitute.
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML, or marked N/A with reason. N/A: no video.
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
      `.changeset/quiet-pugs-yawn.md`.
- [x] Final handoff shape decided: bug fix, no PR, no issue sync.
- [x] Commit/PR handling recorded for code-changing work: committed, pushed,
      and PR #372 opened after the user directly requested a PR.
- [x] PR body shape recorded: PR #270 emoji task-style body, verified with
      `gh pr view --json body`.
- [x] PR task evidence recorded: body includes the `🧭 Task plan:` line, the
      plan exists at the PR head, and it names PR #372.
- [x] Branch handling recorded for code-changing work: renamed `issue-368` to
      `fix/codegen-regenerate-stale-generated-server` before the first push, per
      the user's `<type>/<kebab-summary>` branch convention.
- [x] Local-env-rot retry policy recorded: `packages/resend/dist` was missing
      and broke `fixtures:sync`; rebuilt once with `bun --cwd packages/resend
      build` and rerun. Codex autoreview engine failed on an unrelated local
      auth/provider-isolation conflict; recorded, not worked around.
- [x] Workspace authority recorded: every proof command names its cwd below.
- [x] Output budget discipline recorded and followed.
- [x] High-risk note recorded for public API/runtime/package-boundary changes.
- [x] Review/autoreview target selected from actual diff state:
      `--mode local`, clean.
- [x] Agent-native review decision recorded. N/A: no `.agents/**`, `.claude/**`,
      `.codex/**`, skill, hook, command, prompt, or user-action tooling changed.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset`.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. N/A: an artifact was created.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is explicit when public shape changes. Hard cut, and no user migration is needed: codegen writes both files in the same run.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive with explicit confirmation bypass when relevant.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized when public guidance changes.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded.
- [x] Package/API pack: `packages/kitcn` build, fixture sync/check, or other owning package proof is recorded when required.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the named commands | All run; see Verification evidence |
| Exact per-PR task ownership | yes | Record the exact PR | https://github.com/udecode/kitcn/pull/372 — this plan owns exactly that PR |
| Pre-solution issue challenge verdict | yes | Record challenge before implementation | Recorded above: `valid` |
| Repro escalation ladder | yes | Record ladder outcomes | Recorded above |
| Bug reproduced before fix | yes | Record failing repro | Exact reported message reproduced on unpatched source |
| Targeted behavior verification | yes | Run focused proof | `bun test packages/kitcn/src/cli/` → 397 pass, 0 fail |
| TypeScript or typed config changed | yes | Run typecheck | `bun typecheck` → 5 tasks successful |
| Package exports or file layout changed | yes | Run package build | `bun --cwd packages/kitcn build` → 71 files, complete |
| Package manifests, lockfile, or install graph changed | no | N/A | No manifest or lockfile change |
| Agent rules or skills changed | no | N/A | `packages/kitcn/skills/kitcn/**` is the published end-user skill (docs content), not repo agent tooling; `bun install` sync not required |
| Workspace authority proof | yes | Record cwd per proof | Recorded in Verification evidence |
| Browser surface changed | no | N/A | CLI-only |
| Browser final proof | no | N/A | CLI-only |
| UI walkthrough | no | N/A | No UI or rendered output changed |
| Scaffold or fixture output changed | yes | Run fixtures:sync + fixtures:check | Both run; `fixtures:check` reports every fixture matches fresh scaffold output |
| Package behavior or public API changed | yes | Add a changeset | `.changeset/quiet-pugs-yawn.md` |
| Docs and kitcn skill sync changed | yes | Keep www and skills in sync | `www/content/docs/cli/backend.mdx` + `packages/kitcn/skills/kitcn/references/setup/server.md` and `.../setup/index.md` |
| Docs or content changed | yes | Verify source-backed claims | Every doc claim traced to emitted output; no changelog language used |
| High-risk mini gate | yes | Record failure mode, proof plan, boundary rationale | See High-risk note |
| Agent-native review for agent/tooling changes | no | N/A | No agent tooling changed |
| Local install corruption suspected | yes | Rebuild once and rerun | `packages/resend/dist` missing → `bun --cwd packages/resend build` → `fixtures:sync` succeeded |
| Commit created | yes | Stage the checkout and commit | Commit created on `issue-368` |
| PR create or update | yes | Run check, push, create PR, sync body | `bun check` exit 0; pushed; PR #372 created with the task-style body |
| Task-style PR body verified | yes | Verify with `gh pr view --json body` | Verified: auto-release block preserved, `🐛 Fixes #368`, `🧭 Task plan:`, `🟢 95-100% confidence`, exact `Phase / 🧪 Tests / 🌐 Browser` header, Reproduced/Verified rows, bold emoji sections, no self-link |
| PR task evidence verified | yes | Verify plan line, plan at head, exact PR | All three confirmed for PR #372 |
| PR proof image hosting | no | N/A | No browser proof images in the body |
| GitHub issue sync-back | yes | Link the issue | `Fixes #368` in the PR body closes issue #368 on merge |
| Final handoff contract | yes | Fill the final handoff fields | Filled below |
| Final lint | yes | Run `bun lint:fix` | Run; fixed formatting in `codegen.ts` only |
| Output budget discipline | yes | Verify no unbounded output streamed | All command output filtered |
| Timed checkpoint | no | N/A | No duration requested |
| Autoreview for non-trivial implementation changes | yes | Run until no accepted findings | `--mode local --engine claude` → exit 0, `autoreview clean`, `patch is correct` |
| Goal plan complete | yes | Run check-complete.mjs | See Verification evidence |
| Public API / package boundary proof | yes | Source-audit public surface | Generated-output shape audited; leaf is codegen-owned and codegen-written |
| Convex bundle/import proof | yes | Audit function-entry static graphs | Lookup relocated, not duplicated; leaf excluded from Convex entry points by two-dot basename |
| CLI/scaffold/generated proof | yes | Prove command contract and regenerate output | `fixtures:sync`/`fixtures:check` green; `example/` and root `convex/` regenerated with the real CLI |
| Release artifact classification | yes | Classify the delta | Published CLI behavior change → patch changeset |
| Published package changeset | yes | Add one `.changeset/*.md` | `.changeset/quiet-pugs-yawn.md` |
| No release artifact | no | N/A | An artifact was created |
| Package typecheck/build/test | yes | Run owning package checks | Build + typecheck + tests all green |
| Fixture/scaffold generation | yes | Run fixtures:sync and fixtures:check | Both green |
| Docs/package skill sync | yes | Synchronize current-state guidance | Done |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | Issue attachment read in full first | implementation |
| Reproduction | complete | Red test emitting the exact reported message | design |
| Design | complete | 8-agent workflow: 1 verifier, 4 mappers, 3 adversarial judges | implementation |
| Implementation | complete | codegen emit split + reorder, fail-closed schema, hint fix | verification |
| Verification | complete | See Verification evidence | closeout |
| Commit / PR / GitHub sync | complete | Branch renamed, pushed, PR #372 opened, issue linked via `Fixes #368` | closeout |
| Closeout | complete | Autoreview clean | final response |

Findings:
- `emitGeneratedServerFile` had exactly one parse-derived input
  (`procedureNameLookup`); all five others were resolvable before the parse loop.
  That single coupling forced the emit to run after the parse loop, which is why
  a file codegen owns could brick codegen.
- `generated/server.ts` is never itself a parse candidate
  (`shared/meta-utils.ts:166` excludes `generated/`); it is only ever evaluated
  transitively as an import of user modules, through `lib/crpc.ts`.
- Convex's entry-point walker skips basenames containing more than one dot, which
  is why the repo already uses `migrations.gen.ts` / `*.runtime.ts`.
- Pre-existing, unrelated: `packages/kitcn/src/aggregate-core/btree.vitest.ts`
  is a flaky fast-check property test. It fails roughly 1 run in 7-10 with
  `TypeError: Cannot convert object to primitive value` at
  `aggregate-core/btree.ts:858`, with a different random seed each time.
  Reproduced on clean `HEAD` with all changes stashed (run 7 of 10 failed,
  seed `-42352683`), so it predates this work and is out of scope. Worth its
  own issue.

Decisions and tradeoffs:
- Four designs were scored by three independent adversarial judges (correctness,
  architecture, risk lenses), each with empirical probes:
  - (A) two-pass emit of `server.ts` (issue suggestion 1): **rejected**. The
    intermediate write carries `registerProcedureNameLookup({}, ...)`; the parse
    loop between the two writes measures 420-500 ms on `example/` against
    `convex dev`'s 500 ms `quiescenceDelay`, and on *any* fatal parse failure the
    degraded file persists (the rollback only removes files it created, so it
    cannot restore an in-place overwrite).
  - (sniff) overwrite when the on-disk `createOrm(...)` capability set disagrees
    (issue suggestion 2): **rejected** as content-sniffing/fallback parsing, and
    it heals only one drift shape.
  - (F) shim the project's own `generated/server` during the parse loop:
    **rejected**. jiti aliases match the literal specifier string, not the
    resolved path (measured), so it needs either an enumerated list of relative
    spellings (heuristic) or a `jiti.transform` rewrite that fails *open* —
    silently restoring the bug — plus a Proxy shim that would let module-scope
    `orm` usage emit silently empty metadata.
  - (B') split parse-derived output out of `server.ts` and emit `server.ts`
    before the parse loop: **chosen**.
- Chosen boundary: `emitGeneratedServerFile` mixed pre-parse-determined inputs
  with one parse-derived input and ran *after* the point where the artifact it
  emits had already been evaluated. Splitting that one input out makes
  `generated/server.ts` fully determined by pre-parse facts, so codegen can write
  it before it evaluates anything that imports it.
- Scope call: shipped as B'-minimal. The full B' proposal additionally replaced
  the emitted `_generated/server` value import with `convex/server` generics and
  hard-cut both placeholder writers. That is a larger generated-shape change than
  #368 requires, so instead the pre-parse emit is gated on Convex's `_generated`
  module already existing, and the existing bootstrap placeholder keeps owning
  the `kitcn init` window. Recorded as follow-up, not silently dropped.
- Leaf shape: `export const procedureNames = {...}` consumed by a value import,
  NOT a bare side-effect import. Measured under Convex's exact esbuild flags: a
  side-effect-only import is silently dropped when the enclosing `package.json`
  sets `"sideEffects": false` (which `packages/kitcn/package.json:20` itself
  does), which would silently blank `procedure.name` in every middleware.
- Leaf name: `procedure-names.gen.ts`. Two dots keeps it out of Convex's entry
  point walker, matching the existing `migrations.gen.ts` convention. It must not
  be `*.runtime.ts` (swept by the runtime-file cleanup) nor under
  `generated/plugins/` (removed wholesale each run).
- Leaf is deliberately excluded from abort rollback: an aborted run must never
  delete a file that the `server.ts` it leaves behind still imports.
- Bundle: net ~zero. The lookup literal is 8200 of 10740 bytes of
  `example/.../generated/server.ts` today and is already in every function
  entry's graph via `server.ts`; this relocates those bytes behind one module
  boundary.
- Two adjacent silent data-loss bugs in the same family are fixed by the same
  change rather than left behind:
  - `kitcn codegen --scope orm|auth` clobbered the lookup to `{}` (reachable
    without typing `--scope`: `cli/commands/add.ts:780` forces `scope: 'auth'`,
    and `codegen.scope` is persistent config). Scoped runs now leave the leaf
    alone.
  - `resolveSchemaMetadataForCodegen` failed open to `hasOrmSchema: false` on a
    schema load error, so a transiently broken `schema.ts` downgraded an ORM
    `server.ts` to the non-ORM variant and deleted `generated/aggregate.ts`.
    Failing open is unsafe once the emit moves earlier, so it now fails closed.
- Deferred (named, not done): replacing the jiti parse loop with TS AST analysis
  would dissolve this whole problem class, but `_crpcMeta` extraction currently
  depends on builder-chain execution. That is `major-task` scope.

Implementation notes:
- `packages/kitcn/src/cli/codegen.ts`
  - `getGeneratedProcedureNamesOutputFile` + `emitGeneratedProcedureNamesFile`:
    new zero-import data module.
  - `emitGeneratedServerFile` drops its `procedureNameLookup` parameter and
    imports `{ procedureNames }` instead; both the ORM and non-ORM branches.
  - `ensureGeneratedSupportPlaceholders` bootstraps the leaf, and deliberately
    does not register it for rollback.
  - `getConvexGeneratedServerFile` gates the new pre-parse emit on Convex's own
    `_generated` module existing.
  - `emitServerFile` closure is called once before the parse loop and once after;
    the second call is a `writeFileIfChanged` no-op except in the bootstrap
    window.
  - The leaf is rewritten post-parse only when `generateApi` is true.
  - `resolveSchemaMetadataForCodegen` rethrows schema load failures.
- `packages/kitcn/src/orm/capabilities.ts`: both capability hints stop advising
  the reader to rerun the command that just failed.

Review fixes:
- Self-caught before review: the leaf was initially registered as a rollback
  candidate, which could have left `server.ts` importing a deleted file after an
  unrelated fatal parse failure. Fixed and pinned by
  `generateMeta leaves generated/server.ts importable after a fatal parse failure`.
- PR thread `PRRT_kwDOPTlS686Z7oYe`: accepted. Published setup guidance changed
  but `.agents/skills/kitcn` remained stale. Regenerate from
  `packages/kitcn/skills/kitcn` with the source-owned sync command, audit
  parity. `bun tooling/sync-kitcn-skill.ts` plus `bun install` regenerated both
  missing references; package/mirror parity is exact. Reply/resolve pending.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `fixtures:sync` failed: `ENOENT ... packages/resend/dist` | 1 | Build the sibling package rather than debug fixtures | `bun --cwd packages/resend build`, then sync succeeded |
| `example` codegen failed on missing env (`ADMIN`, OAuth keys) | 2 | Supply the documented `convex/.env.example` values inline | Codegen completed |
| Autoreview Codex engine exited 1 with HTTP 401 | 1 | Diagnose rather than retry; found `--ignore-user-config` strips the custom `model_providers.OpenAI` gateway in `~/.codex/config.toml`, leaving an API key valid only for that gateway | Switched to the skill's other supported engine (`--engine claude`), which ran clean |
| `bun check` red on `btree.vitest.ts` | 3 | Test whether it is seed-flaky and whether it predates the change | Reproduced on stashed clean `HEAD`; confirmed pre-existing and unrelated |

Verification evidence:
All commands run from `/Users/mikey/conductor/workspaces/kitcn/hanoi-v2` unless
noted.
- Closeout cwd `/Users/zbeyens/git/better-convex`: merged current `main`
  (`a663e963`) without conflict.
- `bun tooling/sync-kitcn-skill.ts` + `bun install`: generated repo-local kitcn
  references persisted; package/`.agents` diff is empty; lockfiles unchanged.
- Agent-native review: PASS. `kitcn dev/codegen` is discoverable through the
  published setup skill, package source is authoritative, the generated mirror
  is exact, and codegen/fixture commands own proof.
- `bun test packages/kitcn/src/cli/codegen.test.ts`: 69 pass.
- `bun --cwd packages/kitcn build`: 71 files emitted.
- `bun run lint:slop:delta`: zero occurrence/score change.
- `autoreview --mode branch --base origin/main`: clean, patch correct 0.98.
- `bun lint:fix`: 932 files checked, no fixes.
- `NO_PROXY=localhost,127.0.0.1,::1 bun check`: exit 0 across lint, types,
  tests, CLI, Concave, all eight fixtures, verify, and runtime scenarios.
- Red repro (before fix): `bun test packages/kitcn/src/cli/codegen.test.ts -t
  "predates the aggregate capability"` → failed with
  `kitcn codegen aborted because module parsing failed: - orders.ts: Table
  'orders' declares an aggregateIndex/rankIndex, which requires the aggregate
  capability. ...` — byte-for-byte the issue's reported output.
- `bun test packages/kitcn/src/cli/codegen.test.ts` → 68 pass, 0 fail.
- `bun test packages/kitcn/src/cli/` → 397 pass, 0 fail, 40 files.
- `bun run test` → bun lane 1261 pass / 0 fail; vitest lane 839 pass / 0 fail.
- `bun typecheck` → 5 tasks successful (kitcn, test, test-convex,
  @kitcn/resend, example incl. `typecheck:convex`).
- `bun --cwd packages/kitcn build` → complete, 71 files.
- `bun run fixtures:sync` → all 8 fixtures regenerated; each runs its own
  `tsc --noEmit && bun run typecheck:convex` during sync.
- `bun run fixtures:check` → every fixture matches fresh
  `kitcn init -t <t>` / `kitcn add auth` output.
- `example/` regenerated with the real CLI
  (cwd `example/`, `bun ../packages/kitcn/dist/cli.mjs codegen`).
- Root `convex/` regenerated with the real CLI.
- `bun lint:fix` → clean (one formatting fix in `codegen.ts`).
- `bun check` → every lane green except the pre-existing flaky
  `btree.vitest.ts` property test, proven pre-existing by reproducing it on
  stashed clean `HEAD`.
- `.claude/skills/autoreview/scripts/autoreview --mode local --engine claude`
  → exit 0, `autoreview clean: no accepted/actionable findings reported`,
  `overall: patch is correct (0.75)`.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Stale pre-0.25 `server.ts` + aggregateIndex schema | `kitcn codegen` aborts and never rewrites the file | `codegen.test.ts` → `generateMeta regenerates a generated/server.ts that predates the aggregate capability` | Rejects with the exact reported message; file byte-identical | Resolves; file gains `capabilities: [aggregateCapability()]` | Test passes | fixed |
| Same run still collects metadata | Reporter did not raise this; risk introduced by the naive fix | Same test asserts `procedure-names.gen.ts` contains `orders:list` | N/A | Lookup populated on the first run, not the second | Test passes | fixed |
| Repeated runs | Reporter: `--scope orm && codegen` repairs in place | Same test reruns codegen and compares `server.ts` byte-for-byte | Two-step workaround required | Idempotent single command | Test passes | fixed |
| `kitcn dev` | "fails with the same abort and likewise repairs nothing" | `dev` runs codegen with `scope: 'all'` (`commands/dev.ts:474`, `:1234`), the exact path fixed | Aborted | Repairs | Shared code path | fixed |
| Circular hint text | "the error names something that actually unblocks the user" | `orm/capabilities.ts` hint strings | "rerun `kitcn codegen`" | Names a step that works from the generated file | Source | fixed |
| `--scope orm\|auth` lookup clobber | Not reported; found while verifying | `codegen.test.ts` → `generateMeta keeps the procedure name lookup across a scoped run` | Lookup silently reset to `{}` | Byte-identical across scoped runs | Test passes | fixed |
| Schema load failure downgrade | Not reported; found while verifying | `codegen.test.ts` → `generateMeta fails instead of downgrading generated output when the schema cannot load` | Silently emits non-ORM `server.ts`, deletes `aggregate.ts` | Throws; both files untouched | Test passes | fixed |
| Abort leaves importable tree | Not reported; self-caught risk of this fix | `codegen.test.ts` → `generateMeta leaves generated/server.ts importable after a fatal parse failure` | N/A (new risk) | Leaf survives whenever `server.ts` does | Test passes | fixed |
| Fresh bootstrap (no `convex/_generated`) | Not reported; regression risk measured in both A and B as stated | `fixtures:sync` runs a real `kitcn init` for all 8 templates | Worked via placeholder | Still works via placeholder | `fixtures:check` green | no regression |

High-risk note:
- Realistic failure mode: an app whose `package.json` sets `"sideEffects": false`
  could have the procedure-name module tree-shaken away, silently blanking
  `procedure.name` in every middleware (ratelimit, logging, authz). This was
  measured under Convex's exact esbuild flags and is why the leaf is consumed
  through a value import rather than a bare side-effect import — the value form
  was verified to survive even with `"sideEffects": false`.
- Second failure mode: writing generated output before the run is known good.
  Mitigated by making `resolveSchemaMetadataForCodegen` fail closed;
  `hasMigrationsManifest` is a plain `existsSync`, and
  `resolveHasAggregateIndexes` fails toward over-registering, which is safe.
- Proof plan: exercised by 4 new tests, the full CLI suite, all 8 fixture
  scaffolds regenerated and typechecked, and `example/` + root `convex/`
  regenerated with the real CLI.
- Why the boundary is right: codegen owns `generated/server.ts`. The only reason
  it could not repair that file was a single parse-derived input inside it.
  Removing that coupling makes the ownership rule enforceable rather than
  aspirational, and it fixes two further silent bugs that shared the same cause.

Final handoff contract:
- Commit line: `fix(cli): regenerate stale generated/server.ts before codegen reads it (#368)` on branch `fix/codegen-regenerate-stale-generated-server`
- PR line: https://github.com/udecode/kitcn/pull/372
- Issue line: 🐛 Fixes #368 (linked from the PR body)
- Confidence line: 🟢 95-100%
- Flow table:
  - Reproduced: tests 🔴 (exact reported message), browser ➖ N/A
  - Verified: tests 🟢, browser ➖ N/A
- Browser check: N/A — CLI-only change with no rendered output
- Outcome: `kitcn codegen` and `kitcn dev` now repair a stale
  `generated/server.ts` instead of aborting on it, and two adjacent silent
  data-loss paths are closed.
- Caveat: `bun check` also surfaces a pre-existing flaky fast-check property
  test in `aggregate-core/btree.vitest.ts`, reproduced on clean `HEAD` and
  unrelated to this change.
- Design:
  - Chosen boundary: split the one parse-derived input out of
    `generated/server.ts` so codegen can write that file before it evaluates
    anything that imports it.
  - Why not quick patch: emitting twice leaves a degraded file on disk across
    the whole parse-failure cycle, and capability sniffing heals one drift shape
    while adding forbidden fallback parsing.
  - Why not broader change: dropping the `_generated/server` value import and
    hard-cutting both placeholder writers is a bigger generated-shape change
    than #368 needs; gating the pre-parse emit on `_generated` existing keeps
    the bootstrap window untouched.
- Verified: targeted tests, full repo suite, typecheck, package build, fixture
  sync + check, lint, autoreview clean.
- PR body verified: `gh pr view 372 --json body` matches the PR #270 task-style contract.

Task-style PR body contract:
- Applied to PR #372: `<!-- auto-release:start -->` block preserved, `🐛 Fixes
  #368`, `🧭 Task plan:
  docs/plans/368-codegen-self-heals-stale-generated-server.md`, `🟢 95-100%
  confidence`, the exact `| Phase | 🧪 Tests | 🌐 Browser |` header with
  Reproduced/Verified rows, and bold emoji Outcome/Caveat/Design/Verified
  sections. No self-link to PR #372 inside its own body. Verified with
  `gh pr view 372 --json body`.

Final handoff / sync:
- Commit: `fix/codegen-regenerate-stale-generated-server`, pushed
- PR: https://github.com/udecode/kitcn/pull/372
- Issue: #368, closed by the PR on merge
- Browser proof: N/A
- Caveats: none blocking. `bun check` is green end to end (exit 0).

Timeline:
- 2026-08-17T21:57:12.621Z Task goal plan created.
- Source read, bug reproduced at source layer with the exact reported message.
- 8-agent workflow mapped the surface and adversarially scored four designs.
- Implemented B'-minimal; added 4 regression tests.
- Regenerated example, root convex, and all 8 fixtures; docs and skill synced.
- Verified, autoreviewed clean, committed.
- Closeout merged current main, repaired the generated skill mirror, reran
  agent-native/deslop/autoreview/full checks, and left merge paused only on npm
  release authentication.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete; merge paused on npm release authentication |
| Where am I going? | Push current-main merge and mirror receipts, then merge after `0.25.3` publishes |
| What is the goal? | Make `kitcn codegen` regenerate a stale `generated/server.ts` instead of aborting on it |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- The bootstrap placeholder still owns the pre-`convex codegen` window, so a
  stale `server.ts` in a project that has never run `convex codegen` is replaced
  by the placeholder rather than the real file. That path already self-heals; it
  is only noted because the full B' design would have removed the placeholder
  entirely.
- `aggregate-core/btree.ts:858` has a latent bug that fast-check finds
  intermittently. Pre-existing and unrelated; worth its own issue.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
- Recorded: the user later directly requested a PR, overriding the standing
  no-PR preference. Work is committed, pushed, and delivered as PR #372, so the
  local-only exemption no longer applies.
