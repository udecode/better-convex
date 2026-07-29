# Handle invalid ORM IDs safely

Objective:
Handle invalid ORM IDs safely; done when all reported query and relation cases
have red-green proof, package checks pass, and review is clean.

Goal plan:
docs/plans/2026-07-29-handle-invalid-orm-ids-safely.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)

Task source:
- type: Discord support bug report supplied verbatim by the user
- id / link: N/A: no public issue or link was supplied
- title: ORM findFirst/findMany by ID throws on invalid IDs
- acceptance criteria: invalid primary-key equality returns no match; invalid
  members of primary-key `in` filters are ignored; invalid relation IDs produce
  null/empty/count-zero results across all three direct `db.get` relation
  paths; valid IDs still resolve normally

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A: one-shot task execution
- initial confidence score: N/A: explicit behavior matrix is stronger
- improvement loop: red-green per behavior, then package/repo/review gates
- final score / loop closure: evidence-bound confidence after all cases

Completion threshold:
- Five source-derived behavior rows have failing-before and passing-after proof,
  `bun --cwd packages/kitcn build`, relevant typecheck/lint, `bun check`, and
  autoreview pass, a patch changeset exists, and the verified patch is committed,
  pushed, and attached to a task-style PR.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-29-handle-invalid-orm-ids-safely.md` passes.

Verification surface:
- Focused Convex runtime regression tests in `packages/kitcn/src/orm`.
- `bun --cwd packages/kitcn build`, package/root typecheck as applicable,
  `bun lint:fix`, `bun check`, autoreview, changeset audit, and PR-body readback.
- Source audit of the primary-key and three relation `db.get` paths.
- Browser proof is N/A: this is server-side package runtime behavior.

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
- Preserve `findFirst()` returning `null`, `findFirstOrThrow()` throwing on no
  match, valid-ID resolution, relation RLS/filtering, ordering, and fan-out
  behavior.

Boundaries:
- Source of truth: the supplied Discord report, current ORM source, and public
  `findFirst(): Promise<T | null>` contract.
- Allowed edit scope: ORM query runtime/tests, one `kitcn` changeset, this plan,
  and formatting/generated package artifacts only when required by checks.
- Browser surface: N/A: no browser-rendered behavior.
- GitHub issue sync: N/A: no GitHub issue was supplied.
- Non-goals: changing raw Convex `db.get`, accepting malformed IDs as valid,
  compatibility aliases, unrelated ORM lookup paths, or public API redesign.

Output budget strategy:
- Use exact `query.ts` ranges, capped `rg | head` inventories, focused test
  files, and bounded command output; exclude `node_modules`, `dist`, build
  output, fixtures, and logs unless a named verification command owns them.

Blocked condition:
- Stop without implementation if an honest Convex runtime harness cannot
  reproduce any source-listed case. Stop closeout only if required package,
  review, git, or GitHub tooling fails after its documented retry.

Task state:
- task_type: public package runtime bug
- task_complexity: non-trivial, bounded
- current_phase: verification
- current_phase_status: in_progress
- next_phase: review and closeout
- goal_status: active

Current verdict:
- verdict: valid
- confidence: 90% after production-semantic RED proof
- next owner: ORM query runtime
- reason: public ORM query rejects with the supplied production error before
  normalization; `convex-test` alone masks the production behavior

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/orm/query.ts`
- contradiction status: `convex-test` returns null for malformed raw IDs while
  production `db.get` throws; the system-boundary harness models production
- source-listed cases complete: five rows enumerated below

Pre-solution issue challenge:
- reporter claim: invalid string IDs reach primary-key and relation `db.get`
  fast paths and throw instead of behaving as missing records
- suggested diagnosis or fix: normalize each ID against its target table before
  every direct `db.get`
- repro ladder:
  - tests / source-level repro: RED public ORM query with production-semantic
    database boundary; rejects with `Invalid ID length 13`
  - repo-owned automated browser or integration proof: N/A: server package bug
  - Browser plugin: N/A: no browser surface
  - screenshot / visual proof: N/A: no visual output
- reproduction verdict: reproduced at the package boundary
- validity verdict: valid
- best long-term fix boundary: target-table ID normalization immediately before
  each ORM-owned direct `db.get`
- harsh honest feedback: the report's diagnosis is plausible, but source line
  numbers and a suggested patch are not proof; runtime behavior decides
- hard-stop decision: proceed; the primary claim is reproduced

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-29-handle-invalid-orm-ids-safely.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Skill analysis before edits | yes | `task`, `autogoal`, `tdd`, `changeset`, and `autoreview` selected; no browser or major-task lane |
| Active goal checked or created | yes | active goal created for this plan |
| Source of truth read before edits | yes | supplied Discord report, `VISION.md`, `docs/README.md`, ORM source, and public API catalog read |
| GitHub comments and attachments read | no | N/A: source is pasted Discord text with no link or attachment |
| Video transcript evidence required | no | N/A: no video supplied |
| Pre-solution issue challenge required | yes | falsifiable claim and five-case matrix recorded |
| Reproduction verdict before implementation | yes | valid: focused test rejects with the supplied invalid-ID error |
| Repro escalation ladder selected | yes | focused `convex-test` runtime tests first; browser/visual layers N/A |
| Suggested fix reviewed against durable boundary | yes | normalize at ORM direct-read owners, not middleware/callers |
| `docs/solutions` checked for non-trivial existing-code work | yes | inventory found no invalid-ID ORM solution |
| TDD decision before behavior change or bug fix | yes | bounded vertical red-green runtime coverage |
| Branch decision for code-changing task | yes | created `codex/fix-invalid-orm-id-lookups`; prior branch was unrelated |
| Release artifact decision | yes | new patch changeset for `kitcn` |
| Browser tool decision for browser surface | no | N/A: server runtime only |
| Commit / PR expectation decision | yes | commit, push, and task-style PR after verification |
| Task-style PR body decision | yes | use mandatory PR #270 emoji format |
| GitHub issue sync expectation decision | no | N/A: no issue supplied |
| Output budget strategy recorded | yes | bounded strategy above |
| Package/API pack selected | yes | package-api pack materialized |
| Public surface or package boundary identified | yes | behavior of published `kitcn/orm` entry |
| Convex entry/import graph impact identified | yes | local method calls only; no new imports or broader static graph planned |
| CLI/scaffold/generated impact identified | yes | ORM change has no scaffold impact; full check exposed external `lucide-react` fixture drift, refreshed only through `fixtures:sync` |
| Release artifact path selected | yes | create one `.changeset/*.md` patch for `kitcn` |
| `changeset` skill loaded when `.changeset` is required | yes | skill and `.agents/rules/changeset.mdc` read |
| Package build / fixture impact decision recorded | yes | package build passed; `fixtures:sync` refreshed six generated package snapshots and full check verified them |

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
- [ ] PR body shape recorded: PR #270 emoji task-style body used, N/A reason
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
| Named verification threshold | yes | Run the command, proof, source audit, or artifact check named in this plan | five behavior rows, focused/package/root gates, and clean review recorded |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | valid verdict and production/emulator contradiction recorded |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | package-boundary RED proof; browser/visual N/A |
| Bug reproduced before fix | yes | Record failing test/repro or N/A with reason | focused RED test rejected with supplied invalid-ID error |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 2 files and 15 tests passed |
| TypeScript or typed config changed | yes | Run relevant typecheck | package and root typechecks passed |
| Package exports or file layout changed | no | Run the relevant package build before final verification and keep generated updates | N/A: no export or file-layout change; package build still passed |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` and relevant package checks | N/A: no package manifest or lockfile change |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: no agent source changed |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | all commands ran in repo/package owning `kitcn/orm` |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: server package behavior |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: no visual output |
| Scaffold or fixture output changed | yes | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | generated six fixture dependency snapshots; final `bun check` passed fixture check |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | `.changeset/fix-invalid-orm-ids.md` |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: existing public contract unchanged |
| Docs or content changed | no | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | N/A: only internal goal plans and changeset text |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | wrong-table normalization risk and proof recorded |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: no agent/tooling changes |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: failure was deterministic generated fixture drift, not install corruption |
| Commit created | pending | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| PR create or update | pending | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| Task-style PR body verified | pending | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | pending |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no browser proof |
| GitHub issue sync-back | no | Post concise issue sync after PR exists, or record N/A/blocker | N/A: no GitHub issue supplied |
| Final handoff contract | pending | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | pending |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` passed; final `bun check` lint passed |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | broad commands were capped; full required gate was noisy but streamed in bounded chunks |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | final local review clean, 0 findings, overall confidence 0.93 |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-29-handle-invalid-orm-ids-safely.md` | pending |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | public shape/exports unchanged; runtime semantics match `findFirst(): T or null` |
| Convex bundle/import proof | yes | Audit affected function-entry static graphs or record N/A | no imports added; package build and full runtime gate passed |
| CLI/scaffold/generated proof | yes | Prove command contract and regenerate owned output or record N/A | ORM change N/A; generated fixture drift refreshed by `fixtures:sync` and verified |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | published `kitcn/orm` runtime patch |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | patch changeset added for `kitcn` |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: published runtime delta has a changeset |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | package typecheck/build and focused tests passed |
| Fixture/scaffold generation | yes | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | sync completed; final full check verified all fixtures |
| Docs/package skill sync | no | Synchronize current-state public guidance or record N/A | N/A: no public guidance change |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | source, owner, five cases, contradiction, and RED verdict recorded | implementation |
| Implementation | complete | table-aware `_getById` owns all four direct lookup sites | verification |
| Verification | complete | 15 focused tests, typechecks, lint, package build, fixture regeneration, full `bun check`, and final autoreview pass | commit and PR |
| Commit / PR / GitHub sync | in_progress | branch ready; commit/PR pending | final response |
| Closeout | pending | | final response |

Findings:
- Source confirms the top-level ID fast path and three relation target-ID paths
  call `db.get` without target-table normalization.
- Mutation primary-ID paths already normalize and filter invalid IDs.
- Public API catalog defines `findFirst` as `Promise<T | null>`.
- No existing `docs/solutions` note owns this invalid-ID bug class.
- `convex-test` does not model the production rejection, so the regression uses
  a production-semantic database boundary and keeps existing real-Convex valid
  ID tests in the focused run.

Decisions and tradeoffs:
- Keep the public API unchanged: malformed and wrong-table IDs are missing
  records, not a new error class.
- Normalize at each target-table read boundary; do not teach raw Convex
  `db.get` different semantics or force validation into every caller.
- High-risk note: the realistic regression is normalizing against the wrong
  table and hiding a valid lookup. The helper requires the owning table name at
  every call, tests cover parent and target tables with mixed IDs, and no new
  import or Convex function-entry graph is introduced.

Implementation notes:
- Added one private table-aware `_getById` owner and routed top-level primary-ID,
  filtered through-count, one-relation, and many-through reads through it.
- Added a patch changeset; public shape, exports, docs, CLI, and scaffold source
  are unchanged. Six generated fixture package snapshots refreshed after the
  full gate exposed upstream shadcn dependency drift.

Review fixes:
- Final local autoreview: 0 findings; patch correct at 0.93 confidence.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `convex-test` does not reproduce production invalid-ID rejection | 1 | model production `db.get` at the database system boundary | public ORM test now fails with the supplied error |
| First `bun check` found generated fixture drift from upstream shadcn | 1 | run source-owned `fixtures:sync`, never patch snapshots by hand | six `lucide-react` pins refreshed; second `bun check` passed |

Verification evidence:
- `bun vitest packages/kitcn/src/orm/query-invalid-id.vitest.ts --run`
  (cwd `/Users/zbeyens/git/better-convex`) -> RED: public `findFirst` rejects
  with `Invalid argument id for db.get ... Invalid ID length 13`.
- `bun vitest packages/kitcn/src/orm/query-invalid-id.vitest.ts
  packages/kitcn/src/orm/mutation-id-fast-path.vitest.ts --run` (repo cwd) ->
  2 files, 15 tests passed after the fix.
- `bun --cwd packages/kitcn typecheck` -> passed.
- `bun lint:fix` -> passed after replacing one disallowed generic array form.
- `bun --cwd packages/kitcn build` -> passed; published ORM bundle produced.
- `bun typecheck` (repo cwd) -> 5/5 tasks passed.
- Source audit `rg -n "_getById\\(|this\\.db\\.get\\(values\\[0\\]"
  packages/kitcn/src/orm/query.ts` -> four lookup sites use `_getById`; zero
  direct relation `db.get(values[0])` remains.
- `bun run fixtures:sync` -> six generated fixture package snapshots refreshed
  from `lucide-react ^1.26.0` to `^1.27.0`.
- `bun check` (repo cwd) -> passed after fixture refresh, including lint,
  typecheck, full tests, CLI/Concave checks, fixture parity, verification
  scenario, and runtime scenarios.
- `.agents/skills/autoreview/scripts/autoreview --mode local
  --stream-engine-output` -> clean, 0 accepted/actionable findings, overall
  confidence 0.93.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Primary equality | `findFirst({ where: { id: invalid } })` throws | public ORM query with production-semantic database boundary | rejects with supplied invalid-ID error | returns `null` | focused RED then GREEN | passed |
| Primary `in` | `findMany` reaches invalid IDs | mixed valid/invalid public ORM query | pre-fix fast path reaches every input ID | returns only valid rows | focused suite returns one valid row and records no invalid read | passed |
| One relation | direct target-ID relation read throws on malformed FK | `with: { author: true }` over malformed stored FK | RED rejects at `_loadOneRelation` | relation is `null` | focused RED then GREEN | passed |
| Many-through relation | through target-ID read throws on malformed FK | many-to-many `with` over mixed valid/invalid through rows | RED rejects at `_loadManyRelation` | invalid target is omitted | focused RED then GREEN | passed |
| Filtered through count | relation count target-ID read throws on malformed FK | `with._count` with target filter over mixed through rows | RED rejects at `_countRelationForRow` | counts only valid matching targets | focused RED then GREEN | passed |

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
- Caveats: pending

Timeline:
- 2026-07-29T20:51:13.000Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Intake and source read |
| Where am I going? | Implementation, verification, commit/PR/GitHub sync, closeout |
| What is the goal? | TODO: Fill from Objective |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- Pending.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
