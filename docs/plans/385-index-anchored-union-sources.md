# Index-anchored union sources

Objective:
Make `select().union([...])` sources index-anchorable via a per-source `index: { name, range }`, so the documented shape typechecks and each source walks only its own index range instead of re-walking the shared index.

Goal plan:
docs/plans/385-index-anchored-union-sources.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- docs (docs/plans/templates/packs/docs.md)
- agent-native (docs/plans/templates/packs/agent-native.md)

Task source:
- type: GitHub issue
- id / link: #385 https://github.com/udecode/kitcn/issues/385
- title: Docs: union sources document a per-source `index:` key that `FindManyUnionSource` does not have (TS2353)
- task type: bug (docs/impl contradiction) -> API implementation
- acceptance criteria:
  - The documented per-source `index: { name, range }` union shape typechecks.
  - Each union source walks only its own index range at runtime.
  - `www/content/docs/orm/**` and `packages/kitcn/skills/kitcn/**` describe the
    same shipped API.
- caveats: three doc surfaces disagree today (filters.mdx shows the shared-index
  + `where` form, pagination.mdx/orm.md show the per-source `index` form,
  filters.mdx:420 already claims "index/range path per union source").
- likely files: `packages/kitcn/src/orm/types.ts`,
  `packages/kitcn/src/orm/query.ts`, `convex/orm/pipeline.test.ts`,
  `www/content/docs/orm/queries/pagination.mdx`,
  `packages/kitcn/skills/kitcn/references/features/orm.md`
- browser surface: none
- root-cause layer: ORM public config type + stream construction

Timed checkpoint:
- requested duration: pending
- semantics: pending
- initial confidence score: pending
- improvement loop: pending
- final score / loop closure: pending

Completion threshold:
- `FindManyUnionSource` accepts `index?: { name, range? }` typed against the
  table's declared indexes, and `_buildUnionSourceStream` anchors each source on
  it (falling back to the chain-level `withIndex(...)`).
- A runtime test proves per-source index ranges reduce document reads versus the
  shared-index + `where` form.
- The repro typecheck file that reproduced TS2353 is deleted; the same shape is
  asserted in the committed typecheck suite instead.
- `www` docs + `packages/kitcn/skills/kitcn` + regenerated `.agents/skills/kitcn`
  describe the shipped API consistently.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/385-index-anchored-union-sources.md` passes.

Verification surface:
- `bun --cwd convex x vitest run orm/pipeline.test.ts` (owning workspace: repo
  root `convex/`).
- `bun --cwd convex x tsc --noEmit` for the typecheck assertions.
- `bun --cwd packages/kitcn build` + `bun typecheck` + `bun lint:fix`.
- `.changeset/*.md` for the published API delta.
- Source audit of the three doc surfaces.

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
- Source of truth: GitHub issue #385.
- Allowed edit scope: `packages/kitcn/src/orm/**`, `convex/orm/*.test.ts` +
  typecheck suite, `www/content/docs/orm/**`,
  `packages/kitcn/skills/kitcn/references/features/orm.md`, regenerated
  `.agents/skills/kitcn/**`, `.changeset/**`, this plan.
- Browser surface: N/A — ORM query API, no rendered output.
- GitHub issue sync: N/A — user preference forbids PR creation, so there is no
  PR to reference in an issue comment.
- Non-goals: reworking `interleaveBy` ordering validation messages, changing the
  shared-index + `where` union form, touching search/vector union paths.

Output budget strategy:
- All greps capped with `head`; `sed -n` ranges instead of whole-file reads on
  the 7k-line `query.ts`; vitest scoped to single files.

Blocked condition:
- None. If `bun --cwd packages/kitcn build` or the convex vitest lane fails for
  reasons unrelated to this diff after one `bun install` retry, stop and report.

Task state:
- task_type: bug + additive feature
- task_complexity: non-trivial, non-heavyweight
- current_phase: closeout
- current_phase_status: in_progress
- next_phase: final response
- goal_status: active

Current verdict:
- verdict: implemented and verified
- confidence: 95-100%
- next owner: user (push/PR is declined by standing preference)
- reason: every source-listed case has fresh proof at its owning layer, red was
  proven before green, and `bun check` passes.

Implementation readiness:
- verdict: ready
- exact owner: `FindManyUnionSource` (public config type) +
  `_buildUnionSourceStream` (stream construction)
- contradiction status: resolved — docs claimed a capability the type lacked;
  the docs described the designed API, so the type and runtime were repaired to
  match, and the two doc examples that were wrong in the other direction were
  rewritten.
- source-listed cases complete: yes (A-G)

Pre-solution issue challenge:
- reporter claim: copying the documented union example fails with TS2353 because
  `FindManyUnionSource` has only `where`.
- suggested diagnosis or fix: two options — (1) delete `index:` from the docs,
  (2) implement per-source `index: { name, range }` in
  `_buildUnionSourceStream`.
- repro ladder:
  - tests / source-level repro: `bun --cwd convex x tsc --noEmit` on a scratch
    `convex/orm/repro-385.typecheck.ts` reproduced
    `TS2353: Object literal may only specify known properties, and 'index' does
    not exist in type 'FindManyUnionSource<...>'` at both source literals.
  - repo-owned automated browser or integration proof: N/A — no browser surface.
  - Browser plugin: N/A.
  - screenshot / visual proof: N/A — no rendered output.
- reproduction verdict: valid (exact TS2353 reproduced at the cited type).
- validity verdict: valid.
- best long-term fix boundary: option 2. The reporter's diagnosis is right but
  their fallback (option 1) is the weaker fix. Evidence: `orm.md` already has a
  dedicated `### Union with index ranges` section and `filters.mdx:420` already
  claims "index/range path per union source", so the per-source anchor is the
  designed API and only the type + stream construction were missing. It is also
  the only way to express the canonical `mergedStream` shape — today every union
  source re-walks the chain-level index and filters in JS.
- harsh honest feedback: the issue frames option 2 as "a larger change". It is
  not: `PredicateWhereIndexConfig` already models `{ name, range }` per declared
  index, and `_buildUnionSourceStream` already threads a `configuredIndex` into
  `stream(...).withIndex(...)`. The change is one optional type key plus one
  fallback expression. Option 1 would have deleted a working design and left the
  read amplification in place.
- hard-stop decision: proceed with option 2.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/385-index-anchored-union-sources.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: ORM query API + docs prose; no UI or rendered output |
| Skill analysis before edits | yes | loaded `task`, `autogoal`, `changeset`, `autoreview`, `agent-native-reviewer`; skipped `major-task` (additive type key, one method, one package) and `tdd` (used red-green directly in the existing pipeline suite) |
| Active goal checked or created | yes | `docs/plans/385-index-anchored-union-sources.md` |
| Source of truth read before edits | yes | attachment + `gh issue view 385 --json title,body,comments` |
| Exact per-PR task ownership | no | N/A: user preference forbids PR creation; no PR in scope |
| GitHub comments and attachments read | yes | `comments: []` |
| Video transcript evidence required | no | N/A: no media in the issue |
| Pre-solution issue challenge required | yes | see Pre-solution issue challenge |
| Reproduction verdict before implementation | yes | valid — TS2353 reproduced verbatim |
| Repro escalation ladder selected | yes | source-level typecheck + integration test; no browser layer exists for this surface |
| Suggested fix reviewed against durable boundary | yes | rejected option 1, took option 2; rationale recorded |
| `docs/solutions` checked for non-trivial existing-code work | no | N/A: no `docs/solutions` directory in this repo |
| TDD decision before behavior change or bug fix | yes | red proven by stashing the runtime fix and rebuilding; 4 tests failed, then green |
| Branch decision for code-changing task | yes | already on `issue-385`, dedicated to this issue |
| Release artifact decision | yes | `.changeset/cuddly-bats-repeat.md` (patch, additive) |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | commit yes; push/PR N/A — user preference: "Do not create PR under any circumstances, unless user prompts to" |
| Task-style PR body decision | no | N/A: no PR |
| Task-plan PR body evidence | no | N/A: no PR |
| GitHub issue sync expectation decision | no | N/A: sync-back is meant to point QA at a PR; none exists |
| Output budget strategy recorded | yes | see Output budget strategy |
| Package/API pack selected | yes | public type in `packages/kitcn/src/orm/types.ts` |
| Public surface or package boundary identified | yes | `FindManyUnionSource` reached through `select().union([...])` |
| Convex entry/import graph impact identified | yes | none: no new imports; `PredicateWhereIndexConfig` is already in the same module |
| CLI/scaffold/generated impact identified | yes | none for CLI/scaffold; generated `.agents/skills/kitcn` regenerated from source |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` read |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; no scaffold-template change, but `fixtures:check` ran anyway inside `bun check` |
| Docs pack selected | yes | 3 `www` pages + published skill reference |
| Docs guidance loaded | yes | `packages/kitcn/skills/kitcn/references/setup/doc-guidelines.md` |
| Docs lane selected | yes | supporting docs for a package API change |
| Target docs and nearest sibling docs read | yes | `pagination.mdx`, `filters.mdx`, `api-reference.mdx`, `orm.md` |
| Docs style doctrine read | yes | current-state reference voice; no changelog wording |
| Documented source owner identified | yes | `www/content/docs/orm/**` owns; `packages/kitcn/skills/kitcn/**` mirrors |
| Agent-native pack selected | yes | published skill reference doc changed |
| Agent-facing action surface identified | yes | `references/features/orm.md` "Union + interleave" is the route an agent reads to write this query |
| Source rule versus generated mirror boundary identified | yes | edited `packages/kitcn/skills/kitcn/**`, regenerated `.agents/skills/kitcn/**` with `bun tooling/sync-kitcn-skill.ts`; mirror byte-identical per `diff -q` |
| Installed-skill lock versus local-rule owner identified | yes | no installed-skill or `skills-lock.json` change |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded; ladder applied below |

Work Checklist:
- [x] N/A: no duration requested.
- [x] Objective, threshold, verification surface, constraints, boundaries, and
      blocked condition are filled above.
- [x] Task source classified (type, link, title, task type, acceptance, caveats,
      files, browser surface, root-cause layer).
- [x] N/A: no PR is in scope — the user preference forbids PR creation.
- [x] N/A: the issue contains no video or screen recording.
- [x] Reporter claim challenged; verdict `valid`, with the suggested fix's
      weaker option rejected on recorded evidence.
- [x] Repro ladder: source-level typecheck repro first, then integration test
      repro; browser/visual layers marked N/A because this surface has none.
- [x] Hard-stop rule followed: the claim reproduced verbatim before any edit.
- [x] `AGENTS.md`, `.agents/rules/changeset.mdc`, doc guidelines, and the
      surrounding `stream.ts` / `query-builder.ts` patterns read before edits.
- [x] Case matrix A-G complete with before/after and evidence.
- [x] Readiness: `ready`.
- [x] Implementation fixes the owning boundary: the public config type plus the
      one method that builds the source stream.
- [x] Release artifact: new `.changeset/cuddly-bats-repeat.md` (no unreleased
      changeset existed to update).
- [x] Final handoff shape: bug fix + feature, no PR, no issue sync.
- [x] Commit/PR: commit made; push and PR explicitly declined by the standing
      user preference "Do not create PR under any circumstances, unless user
      prompts to".
- [x] N/A: no PR body to shape.
- [x] N/A: no PR task evidence to record.
- [x] Branch: `issue-385`, dedicated to this issue.
- [x] N/A: no surprising repo-wide failure; the one stale-`dist` TS2307 during
      repro was resolved by the required `bun --cwd packages/kitcn build`, not by
      reinstalling.
- [x] Workspace authority: vitest and `tsc` run from the repo root over
      `convex/`, which owns the ORM integration behavior; the package build runs
      in `packages/kitcn`.
- [x] Output budget: greps capped with `head`, `sed -n` ranges over the 7k-line
      `query.ts`, per-file vitest runs, `bun check` streamed to a file.
- [x] High-risk note recorded below.
- [x] Autoreview target: `--mode local` over the uncommitted diff.
- [x] Agent-native review: `agent-native-reviewer` loaded; ladder recorded below.
- [x] Package/API pack: `FindManyUnionSource` gains one optional key; no export
      list change; changeset added.
- [x] Package/API pack: `.changeset` chosen.
- [x] Package/API pack: `changeset` rules followed (patch, `## Features`, action
      verbs, user-facing bullets, no file paths).
- [x] N/A: an artifact was required, so no no-artifact reason applies.
- [x] Package/API pack: purely additive optional key — nothing to migrate and
      nothing to hard-cut. Existing `where`-only sources keep working (test E).
- [x] Package/API pack: no new imports; the Convex import graph is unchanged.
- [x] N/A: no CLI command touched.
- [x] Package/API pack: `www` docs and `packages/kitcn/skills/kitcn/**` updated
      in the same diff and regenerated into `.agents/skills/kitcn/**`.
- [x] Package/API pack: `bun --cwd packages/kitcn build`, `bun typecheck`,
      `bun run test`, and `bun check` all pass.
- [x] Package/API pack: package build run; `fixtures:check` passed inside
      `bun check`.
- [x] Docs pack: lane, targets, siblings, and owner recorded in Start Gates.
- [x] Docs pack: every documented shape is backed by a passing test — the
      per-source `index`, the heterogeneous-index merge, and the chain-index
      fallback each have one.
- [x] Docs pack: current-state reference voice; no changelog wording.
- [x] Docs pack: no links or anchors added; the pre-existing
      `#composition-limitations` anchor is untouched.
- [x] Agent-native pack: edited `packages/kitcn/skills/kitcn/**`; regenerated the
      `.agents/skills/kitcn/**` mirror rather than hand-editing it.
- [x] Agent-native pack: the route is the existing "Union + interleave" and
      "Select Composition" headings an agent already reads for ORM work.
- [x] N/A: `.agents/rules/**` unchanged; the kitcn skill mirror was synced with
      `bun tooling/sync-kitcn-skill.ts` and verified byte-identical.
- [x] N/A: no installed skill added, updated, or removed.
- [x] Agent-native pack: proof rows are the four new tests plus the three
      typecheck assertions; an agent can rerun them from the doc's own example
      shape.
- [x] Agent-native pack: no findings rejected — see the ladder below.

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
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/385-index-anchored-union-sources.md` | pending |
| Public API / package boundary proof | pending | Source-audit public API, exports, and package boundary impact | pending |
| Convex bundle/import proof | pending | Audit affected function-entry static graphs or record N/A | pending |
| CLI/scaffold/generated proof | pending | Prove command contract and regenerate owned output or record N/A | pending |
| Release artifact classification | pending | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | pending |
| Published package changeset | pending | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | pending |
| No release artifact | pending | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | pending |
| Package typecheck/build/test | pending | Run owning package checks or record N/A with reason | pending |
| Fixture/scaffold generation | pending | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | pending |
| Docs/package skill sync | pending | Synchronize current-state public guidance or record N/A | pending |
| Docs source-backed claim audit | pending | Verify docs claims against current source or record N/A | pending |
| Docs links / routes / previews | pending | Verify leaf links, routes, anchors, and preview names or record N/A | pending |
| Docs MDX/content parser | pending | Run the relevant `www` docs parser/build for MDX/content changes, or record N/A | pending |
| Kitcn docs sync | pending | If `www/**` changed, update matching `packages/kitcn/skills/kitcn/**` content or record N/A | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | done | issue fetched, TS2353 reproduced | implementation |
| Implementation | done | type + `_buildUnionSourceStream` + 4 tests + 3 typecheck assertions + 4 doc surfaces + changeset | verification |
| Verification | done | red-then-green, `bun check` exit 0 | closeout |
| Commit / PR / GitHub sync | done | committed locally; push/PR/issue-sync declined by user preference | final response |
| Closeout | in_progress | autoreview + agent-native ladder | final response |

Findings:
- The reported TS2353 is the shallow half of the defect. The deeper half: the
  union source ignored `index` entirely, fell back to `by_creation_time`, and
  `interleaveBy(['numLikes'])` then threw
  `indexFields must be some sequence of fields the stream is ordered by`.
- A second, unreported docs defect: the shared-`withIndex` + per-source-`where`
  union form shown in `api-reference.mdx`, `filters.mdx`, and `orm.md` throws at
  runtime. `.withIndex('by_from_to')` with no range pins zero equality fields, so
  `OrderByStream` only accepts the full index-field list; `interleaveBy(['createdAt','id'])`
  is rejected. Proved with a scratch test, then deleted:
  `AssertionError: promise rejected "Error: indexFields must be some sequence …"`.
  That form can never express the conversation example — pinning `from`/`to` at
  the chain level would make both sources read the same direction. Per-source
  anchoring is the only correct shape, so all three examples were rewritten.
- `MergedStream` wraps every source in `OrderByStream(interleaveBy)` before
  comparing `getIndexFields()`, and `OrderByStream.getIndexFields()` returns the
  normalized interleave fields. So sources may pin *different* index names; the
  invariant is the shared trailing order, not the index name. Covered by a test
  and documented.

Decisions and tradeoffs:
- Chose the issue's option 2 (implement per-source `index`) over option 1 (delete
  `index:` from the docs). Option 1 would have deleted the designed API and left
  both the read amplification and the second docs defect in place.
- Per-source `index` overrides the chain-level `.withIndex(...)` rather than
  throwing on conflict. Rejected a conflict error: heterogeneous index names are
  a legitimate, now-tested capability, so a conflict check would have to model
  order-suffix compatibility that `OrderByStream` already owns and reports.
- Reused `PredicateWhereIndexConfig` instead of a new type, so a union source's
  index name and range builder are typed against the table's declared indexes
  exactly like `.withIndex(...)`.

Implementation notes:
- `packages/kitcn/src/orm/types.ts`: `FindManyUnionSource` gains
  `index?: PredicateWhereIndexConfig<TTableConfig>`.
- `packages/kitcn/src/orm/query.ts` `_buildUnionSourceStream`: anchor on
  `source.index ?? this.configuredIndex`, and pass that to
  `_assertWhereIndexRequirement` so a per-source anchor satisfies the
  `predicate(...)`-needs-an-index rule.

Review fixes:
- None yet.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
- `bun --cwd convex x tsc --noEmit` (cwd `convex/`): clean, including the three
  new union-index typecheck assertions.
- `NO_PROXY=... bun x vitest run convex/orm/pipeline.test.ts` (repo root):
  32 passed, `Type Errors: no errors`. Red proof first: with
  `packages/kitcn/src/orm/query.ts` stashed and the package rebuilt, the four new
  tests failed with
  `Error: indexFields must be some sequence of fields the stream is ordered by`.
- `bun --cwd packages/kitcn build`: `71 files, total: 1564.22 kB`.
- `bun typecheck`: 5/5 turbo tasks successful.
- `bun run test`: 1288 bun tests pass, 849 vitest tests pass, 0 fail,
  `Type Errors: no errors`.
- `bun lint:fix`: clean (biome reformatted one test helper signature).
- `bun check`: exit 0 — the full gate including `test:cli`, `test:concave`,
  `fixtures:check`, `test:verify`, and `test:runtime`.
- `diff -q packages/kitcn/skills/kitcn/references/features/orm.md .agents/skills/kitcn/references/features/orm.md`:
  identical after `bun tooling/sync-kitcn-skill.ts`.
- Autoreview: `--mode local --engine claude`, see Review fixes.

High-risk note (public API + runtime):
- Realistic failure mode: a source's `index` silently overrides a chain-level
  `.withIndex(...)` the caller thought applied, producing a differently-ordered
  or differently-scoped read.
- Why that is acceptable: the override is the only reading that makes
  per-source anchoring meaningful, it is documented in both doc surfaces and in
  the type's own JSDoc, and it is pinned by a test that fails if precedence
  flips. When the resulting order is actually incompatible, `OrderByStream`
  already throws rather than returning wrong rows.
- Proof plan: tests B, D, E, F cover anchor, heterogeneous anchors, fallback,
  and precedence respectively.
- Why this boundary: `FindManyUnionSource` is the only place a caller can
  express per-source intent, and `_buildUnionSourceStream` is the only place
  that intent turns into a Convex index walk. Anywhere else would be a caller
  patch.

Agent-native ladder (`user action -> agent route -> source owner -> proof -> handoff`):
- user action: write an index-anchored union query.
- agent route: `references/features/orm.md` -> "Union + interleave" /
  "Select Composition (Advanced)".
- source owner: `packages/kitcn/skills/kitcn/**` (mirror regenerated, not
  hand-edited).
- proof: `bun x vitest run convex/orm/pipeline.test.ts` and
  `bun --cwd convex x tsc --noEmit`.
- handoff: this plan plus the changeset.
- Gap closed by this change: the documented route previously taught a query that
  throws, so an agent following it could not complete the action at all.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A | Documented per-source `index` fails typecheck (TS2353) | scratch `convex/orm/repro-385.typecheck.ts`, then permanent assertions in `convex/orm/query-builder.typecheck.ts` | `TS2353: ... 'index' does not exist in type 'FindManyUnionSource<...>'` at both source literals | compiles; bad index name and bad range field still rejected | `bun --cwd convex x tsc --noEmit` clean; two `@ts-expect-error` rows hold | done |
| B | (implied) union sources cannot be index-anchored | `union sources anchor their own index range` | `Error: indexFields must be some sequence of fields the stream is ordered by: ["numLikes","_creationTime","_id"], ["_creationTime","_id"] (0 equality fields)` | `[1,2,3,4,5,6]` | red proven with the runtime fix stashed; green after | done |
| C | (implied) each source re-walks the shared index | same test, `countDocumentReads` | n/a — the query could not run at all | <= 8 reads for 6 matching rows beside 20 out-of-range rows | assertion passes | done |
| D | new: sources may pin different index names | `union sources can anchor different indexes with a shared order suffix` | threw as in B | `by_author_likes` + `numLikesAndType` merge under `interleaveBy(['numLikes'])` | green | done |
| E | regression: chain `withIndex` fallback preserved | `a union source without an index still falls back to the chain index` + pre-existing `select chain union can interleave indexed streams` | n/a | source without `index` uses the chain range | green | done |
| F | regression: per-source index beats chain index | `a union source index overrides the chain-level withIndex` | threw as in B | chain `by_author` ignored, `by_author_likes` used | green | done |
| G | unreported: shared-`withIndex` + `where` doc form throws | scratch test, deleted after proof | `AssertionError: promise rejected "Error: indexFields must be some sequence …"` | example rewritten to per-source anchors in all 3 doc surfaces | source audit of `api-reference.mdx`, `filters.mdx`, `orm.md` | done |

Final handoff contract:
- Commit line: local commit on `issue-385`; not pushed.
- PR line: N/A — standing user preference forbids PR creation.
- Issue line: N/A — issue sync-back exists to point QA at a PR.
- Confidence line: 95-100%.
- Flow table:
  - Reproduced: tests 🔴 (TS2353 + `indexFields must be some sequence...`),
    browser ➖ N/A
  - Verified: tests 🟢 (`bun check` exit 0), browser ➖ N/A
- Browser check: N/A — ORM query API and docs prose, no rendered output.
- Outcome: `select().union([...])` sources accept `index: { name, range }`, so
  the documented shape typechecks and each source walks only its own range.
- Caveat: a source's `index` overrides the chain-level `.withIndex(...)`; that is
  deliberate, documented, and pinned by a test.
- Design:
  - Chosen boundary: the public `FindManyUnionSource` type plus the single
    method that turns a source into a Convex index walk.
  - Why not quick patch: deleting `index:` from the docs (the issue's option 1)
    would have removed the designed API, kept the read amplification, and left
    the separate broken doc example in place.
  - Why not broader change: no conflict-detection layer was added, because
    `OrderByStream` already owns and reports order incompatibility, and
    heterogeneous index anchors are a legitimate use rather than an error.
- PR body verified: N/A — no PR.

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
- Commit: local commit on `issue-385`.
- PR: N/A — user preference forbids PR creation.
- Issue: N/A — no PR to reference.
- Browser proof: N/A — no browser surface.
- Caveats: per-source `index` overrides the chain-level `.withIndex(...)`.

Timeline:
- 2026-08-21T14:12:20.147Z Task goal plan created.
- 2026-08-21 Reproduced TS2353, then the deeper runtime throw.
- 2026-08-21 Implemented the type + stream anchor; 4 tests red then green.
- 2026-08-21 Found and fixed a second docs defect (the shared-`withIndex` union
  form throws) across 3 surfaces.
- 2026-08-21 `bun check` exit 0; changeset added; skill mirror regenerated.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout |
| Where am I going? | Final response |
| What is the goal? | Per-source `index` anchors on `select().union([...])` |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- The `interleaveBy` ordering error from `OrderByStream` is still phrased in raw
  index-field terms and does not name the offending union source. It is now
  reachable more often because per-source anchoring makes the constraint
  user-visible. Out of scope here; worth a follow-up.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
