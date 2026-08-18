# Fix aggregate isNull missing absent-field rows

Objective:
Make aggregate `isNull: true` match absent-field rows so `count()`, `aggregate()`, `groupBy()`, and relation `_count` agree with `findMany()` (issue #366).

Goal plan:
docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- docs (docs/plans/templates/packs/docs.md)

Task source:
- type: GitHub issue
- id / link: https://github.com/udecode/kitcn/issues/366
- title: Aggregate `isNull: true` misses rows whose column is absent — count()/aggregate()/groupBy()/`_count` silently disagree with findMany()
- acceptance criteria: `count()`, `aggregate()`, `groupBy()`, and filtered
  relation `_count` under `where: { col: { isNull: true } }` return the same
  population `findMany()` returns under the identical `where`; `groupBy()` emits
  one group, not a `_count: 0` phantom; `eq: null` keeps matching only
  explicitly-`null` rows.
- caveats: reporter's suggested single-line dist patch fixes count/aggregate/`_count`
  but not `groupBy()`; reporter also proved the naive groupBy variant splits one
  logical group into two rows.
- likely files/routes/packages: `packages/kitcn/src/orm/aggregate-index/runtime.ts`,
  `packages/kitcn/src/orm/query.ts`, `convex/orm/*.test.ts`, `www/content/docs/orm/queries/aggregates.mdx`,
  `packages/kitcn/skills/kitcn/references/features/aggregates.md`
- browser surface: none
- root-cause layer: aggregate bucket-key read path (constraint compilation), not storage

Timed checkpoint:
- requested duration: N/A: no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- All four surfaces named in issue #366 agree with `findMany()` under
  `isNull: true` when the column is absent, proven by a failing-then-passing
  regression suite; `eq: null` parity preserved; repo lint, typecheck, and the
  default test suite green; docs and the published kitcn skill state the
  semantics; a changeset exists.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md` passes.

Verification surface:
- `npx vitest run convex/orm/aggregate-nullish.test.ts --project integration` (new regression suite)
- `npx vitest run convex/orm --project integration` (aggregate/count/groupBy/relation regression neighborhood)
- `bun run test` (bun + vitest default suites)
- `bun typecheck`, `bun lint`
- `bun --cwd packages/kitcn build`
- `bun tooling/sync-kitcn-skill.ts` (generated `.agents` skill mirror)
- autoreview `--mode local`
- `bun check` (repo PR gate: lint, typecheck, test, test:cli, test:concave,
  fixtures:check, test:verify, test:runtime)

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
- The user's standing preference initially declined the PR path, then the user
  explicitly requested a PR. The commit/push/PR path is authorized for this run.
- Branch renamed to `fix/aggregate-isnull-absent-rows` per the user's branch
  convention before the first push, while unpushed and with no PR open.

Boundaries:
- Source of truth: GitHub issue #366 plus `packages/kitcn/src` aggregate read path.
- Allowed edit scope: aggregate constraint compilation and groupBy candidate
  construction, their regression tests, aggregate docs in `www/**` and
  `packages/kitcn/skills/kitcn/**`, and a changeset.
- Browser surface: N/A: server-side query semantics, no rendered output.
- GitHub issue sync: post a QA-facing fixed-in-PR comment on #366 after the PR
  exists.
- Non-goals: rank() namespace encoding, bulk `update`/`delete` `isNull`
  compilation, and any stored bucket-key/namespace migration. Both are confirmed
  defects but are separate owners with their own storage/rebuild decisions —
  recorded under Findings for follow-up.

Output budget strategy:
- Audit fan-out ran through a background Workflow whose per-area results were
  read from `journal.jsonl` via a capped `node -e` projection instead of being
  streamed whole; test and build output tail-limited; repo-wide greps scoped to
  `packages/kitcn/src`, `convex/`, `www/`, and the skill tree.

Blocked condition:
- None encountered. Would have blocked only on an unreproducible claim or a
  required stored-data migration decision the user had not authorized.

Task state:
- task_type: bug
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: valid
- confidence: 95-100%
- next owner: reviewer of the opened PR
- reason: every source-listed case reproduced at the source layer, then passed
  after the fix, with the full repo gate green.

Implementation readiness:
- verdict: ready
- exact owner: `parseFieldFilter` in `packages/kitcn/src/orm/aggregate-index/runtime.ts`
  (constraint compilation for every aggregate metric surface) and
  `_buildGroupByCandidates` in `packages/kitcn/src/orm/query.ts` (group identity).
- contradiction status: resolved. The ORM contract is that `isNull` means
  null-or-absent (`where-clause-compiler.ts:372-384`, `query.ts` post-fetch
  `isNull`, groupBy `having` `isNull`). The aggregate read path was the single
  dissenting implementation; it was repaired to match, rather than relaxing the
  contract or adding a compatibility path.
- source-listed cases complete: yes — count(), aggregate(), groupBy(), relation `_count`.

Pre-solution issue challenge:
- reporter claim: aggregate `isNull: true` counts only the explicit-`null`
  bucket, silently dropping rows whose column is absent, while `findMany()`
  returns them.
- suggested diagnosis or fix: probe `[null, void 0]` at the aggregate read site;
  reporter noted it does not fix `groupBy()` and that the naive groupBy variant
  splits the group; reporter also floated write-side normalization requiring a
  backfill.
- repro ladder:
  - tests / source-level repro: `convex/orm/aggregate-nullish.test.ts` — 3 of 4
    cases failed on pristine source (count/aggregate 1 vs 3, groupBy
    `_count: 1` / `_sum: 10` vs 3 / 14, relation `_count` 1 vs 3).
  - repo-owned automated browser or integration proof: N/A: no browser surface.
  - Browser plugin: N/A: no browser surface.
  - screenshot / visual proof: N/A: no visual output.
- reproduction verdict: reproduced
- validity verdict: valid
- best long-term fix boundary: read-side. The aggregate read path must probe the
  same encoding the write path stored, so `isNull` covers both the `null` bucket
  and the `__kitcnUndefined` sentinel bucket. groupBy then delegates nullish
  semantics to that compiler instead of duplicating it.
- harsh honest feedback: the reporter's analysis was accurate and their caveats
  held. Their fallback proposal (write-side `undefined -> null` in
  `computeCountKeyParts`) was rejected: it needs a bucket rebuild on every
  existing deployment, and it would newly break `eq: null` parity with the row
  path by folding absent rows into the explicit-`null` bucket.
- hard-stop decision: not triggered.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: server-side aggregate semantics; no UI or rendered output can change |
| Skill analysis before edits | yes | Loaded `task` + `autogoal`; `changeset` rule read before writing `.changeset/loud-jars-shave.md`; `autoreview` loaded for closeout |
| Active goal checked or created | yes | This plan created via `create-goal-scratchpad.mjs --template task --with package-api --with docs` |
| Source of truth read before edits | yes | `gh issue view 366` read in full before any file mutation |
| Exact per-PR task ownership | yes | This plan owns exactly one PR: https://github.com/udecode/kitcn/pull/370 |
| GitHub comments and attachments read | yes | `gh issue view 366 --json comments` returned `[]` |
| Video transcript evidence required | no | N/A: issue contains no video or screen recording |
| Pre-solution issue challenge required | yes | Recorded above; verdict `valid` |
| Reproduction verdict before implementation | yes | `convex/orm/aggregate-nullish.test.ts` failed 3/4 before any source edit |
| Repro escalation ladder selected | yes | Source-level integration test was sufficient; browser/visual rungs N/A |
| Suggested fix reviewed against durable boundary | yes | Reporter's read-side probe adopted and extended; write-side normalization rejected with reasons |
| `docs/solutions` checked for non-trivial existing-code work | yes | `docs/solutions/logic-errors/aggregate-range-filters-must-normalize-string-mode-timestamps-20260406.md` is the only aggregate entry; unrelated to null semantics |
| TDD decision before behavior change or bug fix | yes | Red-green: regression suite written and failing first |
| Branch decision for code-changing task | yes | Dedicated branch renamed to `fix/aggregate-isnull-absent-rows` before push; not `main` |
| Release artifact decision | yes | `.changeset/loud-jars-shave.md` (patch) |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | User explicitly requested a PR; commit, push, and PR completed |
| Task-style PR body decision | yes | PR #270 emoji task-style body used |
| Task-plan PR body evidence | yes | Body carries `🧭 Task plan: docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md`; plan exists at PR head and names https://github.com/udecode/kitcn/pull/370 |
| GitHub issue sync expectation decision | yes | QA-facing fixed-in-PR comment posted on #366 |
| Output budget strategy recorded | yes | Recorded above |
| Package/API pack selected | yes | Change lands in published `kitcn` runtime behavior |
| Public surface or package boundary identified | yes | No export shape change; behavior of `count`/`aggregate`/`groupBy`/`_count` filters; one new internal export `NULLISH_PROBE_VALUES` in the aggregate runtime module |
| Convex entry/import graph impact identified | yes | No new imports; edits are inside modules already in the aggregate graph |
| CLI/scaffold/generated impact identified | yes | No CLI/scaffold change; generated `.agents/skills/kitcn` mirror regenerated from source |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` read; patch + `## Patches` structure followed |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; `fixtures:sync` N/A: no `kitcn init -t` template or scaffold source changed |
| Docs pack selected | yes | Docs are a supporting surface, not the dominant risk |
| Docs guidance loaded | yes | `packages/kitcn/skills/kitcn/references/setup/doc-guidelines.md` policy honored: current-state voice only |
| Docs lane selected | yes | `www/content/docs/orm/queries/aggregates.mdx` + its skill mirror |
| Target docs and nearest sibling docs read | yes | Aggregates page, skill aggregates reference, and the RLS/orm null-handling siblings reviewed |
| Docs style doctrine read | yes | No changelog phrasing used; statements describe the latest state only |
| Documented source owner identified | yes | `parseFieldFilter` isNull branch and groupBy candidate construction |

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
      PR: https://github.com/udecode/kitcn/pull/370. No batch plan was used as a substitute.
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML, or marked N/A with reason. N/A: no video in source.
- [x] For public GitHub bug reports, behavior claims, technical diagnoses, or
      suggested fixes, reporter claims are challenged before implementation
      with a recorded verdict.
- [x] Repro escalation ladder followed for bug/behavior claims.
- [x] Hard-stop rule followed for bug/behavior claims.
- [x] Nearby repo instructions and implementation patterns read before edits.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified `ready`, `repair-source`, `major`, `blocked`, or
      `invalid` with evidence.
- [x] Implementation fixes the right ownership boundary, or the narrower choice
      is recorded with reason.
- [x] Release artifact requirement recorded: `.changeset/loud-jars-shave.md`.
- [x] Final handoff shape decided: bug shape, PR body synced to the task handoff, issue sync posted.
- [x] Commit/PR handling recorded for code-changing work: user explicitly
      requested a PR; commit, push, and PR creation completed.
- [x] PR body shape recorded: PR #270 emoji task-style body.
- [x] PR task evidence recorded: body plan line present, plan at PR head names the exact PR.
- [x] Branch handling recorded for code-changing work: renamed to
      `fix/aggregate-isnull-absent-rows` while unpushed and PR-free, then pushed.
- [x] Local-env-rot retry policy recorded: `packages/kitcn/dist` was missing, so
      5 `convex/orm` suites failed with `Cannot find package 'kitcn/server'`
      before any relevant edit; `bun --cwd packages/kitcn build` resolved it and
      all 31 files passed. No product code was changed to chase it.
- [x] Workspace authority recorded: every proof command ran from the repo root
      `/Users/mikey/conductor/workspaces/kitcn/tacoma-v3`, which owns both the
      package source and the `convex/orm` integration suites that exercise it.
- [x] Output budget discipline recorded and followed.
- [x] High-risk note recorded for public API, runtime, package-boundary,
      browser behavior, agent-action, or command-contract changes.
- [x] Review/autoreview target selected from actual diff state: `--mode local`.
- [x] Agent-native review decision recorded: N/A: no `.agents/**` source,
      `.claude/**`, hook, command, prompt, or user-action tooling changed. The
      only `.agents` delta is the generated kitcn skill mirror, regenerated from
      `packages/kitcn/skills/kitcn/**` by `bun tooling/sync-kitcn-skill.ts`.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset`.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why the diff has no published package user-visible delta from `main`. N/A: a changeset was added.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is
      explicit: no migration. The fix is read-side only; stored bucket keys and
      `keyDefinitionHash` are untouched, so no rebuild or backfill is required.
- [x] Package/API pack: affected Convex static import graphs stay narrow and
      plugin/per-module boundaries are used where appropriate.
- [x] Package/API pack: CLI commands remain deterministic, `--json` capable,
      and non-interactive. N/A: no CLI surface changed.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded.
- [x] Package/API pack: `packages/kitcn` build recorded; fixture sync/check N/A.
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages. N/A: no new links or anchors added.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the named commands | All four surfaces pass; see Verification evidence |
| Exact per-PR task ownership | yes | Record the exact PR and dedicated plan | https://github.com/udecode/kitcn/pull/370 |
| Pre-solution issue challenge verdict | yes | Record claim, fix, repro, validity, boundary, decision | Recorded above; verdict `valid` |
| Repro escalation ladder | yes | Record each rung or N/A | Source-level repro sufficient; browser/visual N/A |
| Bug reproduced before fix | yes | Record failing test | 3/4 cases failed on pristine source |
| Targeted behavior verification | yes | Run focused proof | `vitest run convex/orm/aggregate-nullish.test.ts` 4/4 pass |
| TypeScript or typed config changed | yes | Run typecheck | `bun typecheck` 5/5 tasks successful |
| Package exports or file layout changed | yes | Run package build | `bun --cwd packages/kitcn build` 71 files |
| Package manifests, lockfile, or install graph changed | no | Run `bun install` | N/A: no manifest or lockfile change |
| Agent rules or skills changed | yes | Verify generated skill sync | `bun tooling/sync-kitcn-skill.ts` regenerated `.agents/skills/kitcn` from package source |
| Workspace authority proof | yes | Record cwd | All commands from repo root, which owns package source and the integration suites |
| Browser surface changed | no | Capture browser proof | N/A: server-side query semantics |
| Browser final proof | no | Attach screenshot or caveat | N/A: no browser surface |
| UI walkthrough | no | Run walkthrough skill | N/A: no UI or rendered output changed |
| Scaffold or fixture output changed | no | Run fixtures sync/check | N/A: no `kitcn init -t` template or scaffold source changed |
| Package behavior or public API changed | yes | Add a changeset | `.changeset/loud-jars-shave.md` (patch) |
| Docs and kitcn skill sync changed | yes | Keep `www/**` and skill in sync | Both aggregates docs updated in the same diff, mirror regenerated |
| Docs or content changed | yes | Verify source-backed claims | Semantics sentences verified against `parseFieldFilter` and the passing regression suite |
| High-risk mini gate | yes | Record failure mode, proof plan, boundary rationale | See High-risk note |
| Agent-native review for agent/tooling changes | no | Load agent-native-reviewer | N/A: only the generated kitcn skill mirror changed, regenerated from package source |
| Local install corruption suspected | yes | Run install/build once and rerun | Missing `packages/kitcn/dist` diagnosed and fixed by the package build; failures disappeared |
| Commit created | yes | Stage the entire checkout and commit | Whole checkout staged and committed on `fix/aggregate-isnull-absent-rows` |
| PR create or update | yes | Run `check`, push, create PR, sync body | `bun check` green, pushed, PR opened at https://github.com/udecode/kitcn/pull/370 |
| Task-style PR body verified | yes | `gh pr view --json body` | Verified: emoji fix line, task plan line, confidence line, `| Phase | 🧪 Tests | 🌐 Browser |` table, bold emoji sections |
| PR task evidence verified | yes | Verify body plan line, plan at PR head, exact PR ownership | Verified after the plan-sync commit |
| PR proof image hosting | no | Host proof images | N/A: no browser proof images |
| GitHub issue sync-back | yes | Post concise issue sync after PR exists | QA-facing comment posted on #366 |
| Final handoff contract | yes | Fill final handoff fields | Filled below |
| Final lint | yes | Run `bun lint:fix` | `bun lint:fix` then `bun lint` clean over 932 files |
| Output budget discipline | yes | Verify no unbounded output | Audit results projected from `journal.jsonl`; command output tail-limited |
| Timed checkpoint | no | Keep improving until elapsed | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Run until no accepted findings | `autoreview --mode local` |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-fix-aggregate-isnull-missing-absent-field-rows.md` | Run at closeout |
| Public API / package boundary proof | yes | Source-audit public API and exports | No public export shape change; behavior-only fix plus one internal named constant |
| Convex bundle/import proof | yes | Audit affected entry graphs | No new imports; both edited modules were already in the aggregate graph |
| CLI/scaffold/generated proof | no | Prove command contract | N/A: no CLI or scaffold change |
| Release artifact classification | yes | Classify the change | Published package runtime behavior change |
| Published package changeset | yes | Add/update one `.changeset/*.md` | `.changeset/loud-jars-shave.md` |
| No release artifact | no | Record no-artifact reason | N/A: a changeset was added |
| Package typecheck/build/test | yes | Run owning package checks | build + typecheck + `bun run test` all green |
| Fixture/scaffold generation | no | Run fixtures sync/check | N/A: no scaffold output changed |
| Docs/package skill sync | yes | Synchronize public guidance | `www` and skill aggregates docs updated together |
| Docs source-backed claim audit | yes | Verify claims against source | Both sentences assert behavior covered by the passing regression suite |
| Docs links / routes / previews | no | Verify leaf links | N/A: no new links, routes, or previews |
| Docs MDX/content parser | yes | Run www docs parser/build for MDX changes | `bun lint` (biome) clean over the changed MDX; `bun run test` includes the www content suites |
| Kitcn docs sync | yes | Update matching skill content | `packages/kitcn/skills/kitcn/references/features/aggregates.md` updated in the same diff |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | `gh issue view 366` read in full, zero comments | implementation |
| Implementation | complete | read-path probe + groupBy slot merge + error-text accuracy | verification |
| Verification | complete | regression suite red->green, repo gates green | closeout |
| Commit / PR / GitHub sync | complete | branch renamed, `bun check` green, committed, pushed, PR opened, issue synced | closeout |
| Closeout | complete | autoreview local, plan filled | final response |

Findings:
- Root cause: a nullable column compiles to `v.optional(v.union(v.null(), T))`,
  so an omitted field is stored absent. `computeCountKeyParts`
  (`aggregate-index/runtime.ts`) encodes absent as `{ __kitcnUndefined: true }`,
  a different bucket from `null`. `parseFieldFilter`'s `isNull` branch probed
  only the `null` bucket.
- The fix propagates by construction: every aggregate read shape resolves bucket
  identity through `serializeStable`, which normalizes `undefined` to the same
  sentinel the write path stored, so `deepEquals` and `keyHash` both match.
  Independent executable verification confirmed the point-lookup, OR-union,
  range-prefix, and post-filter shapes all pick up both buckets with no
  double-counting (bucket documents differ by `keyHash`, and the range path
  dedupes by `_id`).
- `groupBy` needed a second change: its candidates are both the emitted group key
  and the probe filter, so widening the constraint alone produced two rows
  labelled `null`. Splitting the candidate into `{ key, where }` keeps one group
  and lets the aggregate compiler combine metrics across both buckets — which is
  also why `_sum`/`_avg`/`_min`/`_max` come out right, where a post-hoc row merge
  would have been unsound for `_avg`.
- Confirmed follow-up defect 1 (out of scope, same contract, different owner):
  `rank()` has the same null-vs-absent bug through a different encoding. Rank
  writes its namespace from raw `doc[field]`, so an absent partition field lands
  in the `undefined` namespace, while `validateRankWhereValue` maps `isNull: true`
  to `null`. Empirically: `findMany` with `gameId: { isNull: true }` returned 3
  rows, `rank('lb').count()` under the identical filter returned 1. Notably there
  is no way to address the `undefined` namespace at all today, so those rows are
  unreachable rather than merely miscounted. Fixing it needs a namespace-encoding
  decision plus a rank rebuild story, and rank's order-dependent readers
  (`at`, `indexOf`, `paginate`) cannot simply union two btrees.
- Confirmed follow-up defect 2 (out of scope, same contract, different owner):
  `toConvexFilter` in `orm/mutation-utils.ts` compiles `isNull` to
  `q.eq(q.field(f), null)`, so bulk `update`/`delete` with `isNull()` skips
  absent-field rows. This contradicts the row query path in `orm/query.ts`, which
  emits `q.or(q.eq(f, null), q.eq(f, undefined))` for the same operator.
  Empirically: 3 rows seeded (absent / explicit null / set), `findMany` with
  `isNull` matched 2, and `delete(...).where(isNull(tier))` left `["ABSENT", "gold"]`
  — it deleted only the explicitly-`null` row.
- Consistency bonus: groupBy's `having` already implemented null-or-absent
  semantics, so `where` and `having` now agree within the same method.
- No existing test asserted the buggy behavior, so nothing had to be un-frozen.
  The one pre-existing aggregate `isNull` assertion (`convex/orm/count.test.ts`)
  seeds only explicitly-`null` rows and still passes.

Decisions and tradeoffs:
- Read-side probe over write-side normalization. Normalizing `undefined -> null`
  in `computeCountKeyParts` would fix all four surfaces at once, but it rewrites
  stored bucket keys (forcing a rebuild on every existing deployment) and folds
  absent rows into the explicit-`null` bucket, which would newly break `eq: null`
  parity with the row path. The read-side probe needs no migration and keeps
  `eq: null` exact.
- `isNull` pushes two constraint atoms (`null`, `undefined`) rather than one
  opaque "nullish" token. That is what lets `AND` intersection still narrow
  `{ AND: [{ isNull: true }, { eq: null }] }` down to the explicit-`null` bucket
  instead of collapsing to an empty set.
- groupBy merges at candidate-build time, not after execution. Post-hoc row
  merging cannot reconstruct `_avg` from two emitted averages, and merging late
  would let `having`, `orderBy`, `cursor`, and `skip`/`take` operate on half-groups.
- Nullish slot merge preserves the caller's value order (the first nullish value
  keeps its position) so `in` list ordering in group output is unchanged.
- Accepted, not engineered around: an `isNull` field now contributes 2 key
  candidates instead of 1, so `aggregateCartesianMaxKeys`/`aggregateWorkBudget`
  are reached sooner. Discounting it would understate real read cost, since the
  query genuinely issues both bucket reads. The two guard messages were reworded
  to name `isNull` as an expander so the advice they give is accurate.
- rank() and bulk update/delete left out of scope deliberately: different owners,
  different encodings, and rank additionally needs a stored-namespace decision.
  Both recorded above with reproduction evidence.

Implementation notes:
- `packages/kitcn/src/orm/aggregate-index/runtime.ts`: added exported
  `NULLISH_PROBE_VALUES` with the rationale comment; `parseFieldFilter`'s `isNull`
  branch now pushes both probes in a single `pushConstraint` call (two calls would
  intersect to empty); reworded the cartesian and work-budget guard messages.
- `packages/kitcn/src/orm/query.ts`: added `GroupBySlot`/`GroupByCandidate` types;
  `_parseGroupByFieldConstraint` `isNull` pushes `[null, undefined]`; new
  `_buildGroupBySlots` collapses nullish values into one slot that reports `null`
  and filters with `{ isNull: true }`; `_buildGroupByCandidates` returns
  `{ key, where }`; `_executeGroupBy` reads `candidate.where` for the probe and
  `candidate.key` for the emitted group; `_coerceGroupByConfig` return type updated.
- PR closeout: `GroupBySlot` and `GroupByCandidate` retain physical
  `probeCount`; Cartesian/work guards sum that count instead of logical rows,
  so a merged nullish group cannot under-report two bucket reads as one.
- `convex/orm/aggregate-nullish.test.ts`: new regression suite.
- Docs: `www/content/docs/orm/queries/aggregates.mdx` and
  `packages/kitcn/skills/kitcn/references/features/aggregates.md`, mirror regenerated.

Review fixes:
- Guard-message accuracy (`isNull` now expands key combinations) applied after the
  audit flagged that "Reduce IN list sizes" would misdirect users whose fan-out
  comes from `isNull`.
- PR thread `PRRT_kwDOPTlS686Z63eZ`: accepted. A merged nullish logical group
  can issue two physical bucket probes, so Cartesian/work budgets must retain
  probe cardinality. RED tests added for both guards before the implementation
  fix. RED: both tests reached `AGGREGATE_INDEX_BUILDING`; GREEN: 6/6 focused
  tests pass. Pushed in `174f9db8`; replied at
  https://github.com/udecode/kitcn/pull/370#discussion_r3808674038 and resolved
  with `isResolved: true` read-back.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `bun check` runtime lane `listen EADDRINUSE 127.0.0.1:3211` | 1 | Check whether anything actually holds the port before suspecting the diff | Port was free afterwards; transient collision. `test:runtime` passed alone, then full `bun check` passed end to end |
| autoreview Codex engine failed to start (both sol and terra) | 1 | Use a supported alternate engine rather than skipping the gate | Ran autoreview on the skill's Claude engine; clean |
| 5 `convex/orm` suites failed with `Cannot find package 'kitcn/server'` | 1 | Check for missing build output before suspecting the diff | `packages/kitcn/dist` was absent; `bun --cwd packages/kitcn build` fixed it, 31/31 files passed |
| `bun typecheck` TS18046 `'candidate.key' is of type 'unknown'` | 1 | Propagate the new candidate type to the declared return type | Updated `_coerceGroupByConfig` return member to `GroupByCandidate[]` |
| New budget RED tests first failed with `AGGREGATE_NOT_INDEXED` | 1 | Add the finite `orgId` prefix required by the existing `by_org_tier` aggregate index | Harness corrected; rerun must fail on undercounted probe budgets before source fix |
| Broad ORM suite raced the parallel package build and 5 suites could not resolve `kitcn/server` | 1 | Wait for the owning package build, then rerun the exact suite sequentially | Build passed; sequential rerun passed 31 files / 463 tests |
| `bun check` randomized B-tree property failed on seed `-1453951435` with a null-prototype object | 1 | Prove ownership against `origin/main`, rerun the exact unchanged test, then rerun the full gate | Zero branch diff in B-tree owner; exact file rerun passed 17/17; next full test lane passed 845/845 |
| Second `bun check` reached fixture drift: shadcn moved `lucide-react` `^1.31.0` to `^1.32.0` | 1 | Regenerate through `bun run fixtures:sync`, verify snapshots, then rerun the full gate | Six package snapshots regenerated; `bun run fixtures:check` passed all eight fixtures |

Verification evidence:
- `npx vitest run convex/orm/aggregate-nullish.test.ts --project integration`:
  closeout RED 2/6 (both guards under-counted and reached index execution),
  GREEN 6/6 after retaining physical probe cardinality.
- `npx vitest run convex/orm --project integration`: 31 files passed, 2
  skipped; 463 tests passed, 13 skipped.
- `bun --cwd packages/kitcn build`: 71 files emitted.
- `bun run fixtures:sync` + `bun run fixtures:check`: six `lucide-react`
  snapshots refreshed from the owner; all eight fixtures match.
- final `autoreview --mode local`: clean, patch correct 0.98.
- `bun lint:fix`: 932 files checked, no fixes.
- final `NO_PROXY=localhost,127.0.0.1,::1 bun check`: exit 0; lint,
  typecheck, 1,258 Bun tests, 845 Vitest tests, CLI, Concave, all eight
  fixture comparisons, verify lane, and all runtime scenarios passed.
- `npx vitest run convex/orm/aggregate-nullish.test.ts --project integration`:
  before any source edit 3 failed / 1 passed; after the read-path fix 1 failed
  (groupBy only) / 3 passed; after the groupBy fix 4 passed.
- `npx vitest run convex/orm --project integration`: 31 files passed, 2 skipped;
  461 tests passed, 13 skipped.
- `bun run test`: bun 1258 pass / 0 fail across 144 files; vitest 78 files passed,
  843 tests passed, 13 skipped, no type errors.
- `bun typecheck`: 5/5 turbo tasks successful.
- `bun lint`: 932 files checked, no fixes applied.
- `bun --cwd packages/kitcn build`: 71 files emitted.
- `bun check`: exit 0 end to end (`check:ci` + `test:verify` + `test:runtime`).
  First attempt failed in the runtime scenario lane with
  `listen EADDRINUSE 127.0.0.1:3211`; no process held the port afterwards, so it
  was a transient local port collision, not the diff. `bun run test:runtime`
  passed on its own, then the full `bun check` passed end to end.
- autoreview `--mode local`: `autoreview clean: no accepted/actionable findings`,
  `patch is correct`. The Codex engine failed to start in this environment on
  both `gpt-5.6-sol` and its `gpt-5.6-terra` fallback, so the review ran on the
  skill's supported Claude engine (`claude-fable-5`). The one theoretical gap it
  raised (a lone `undefined` slot filter reading as unconstrained) was tested
  directly: `groupBy({ by: ['tier'], where: { tier: undefined } })` returns
  `[{ tier: null, _count: 2 }]`, i.e. absent-only, not unconstrained.
- cwd for every command: `/Users/mikey/conductor/workspaces/kitcn/tacoma-v3`.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| count() | returns 0 for absent-field rows under `isNull` | `aggregate-nullish.test.ts` "counts absent-field rows for isNull" | 1 (explicit null only) | 3 (matches findMany) | vitest pass | fixed |
| aggregate(_count) | same undercount | same test | `{_count: 1}` | `{_count: 3}` | vitest pass | fixed |
| groupBy() | emits a phantom group claiming `_count: 0` | "emits one merged group for an isNull-constrained groupBy field" | one group `_count: 1`, `_sum: 10`, `_min/_max: 10` | one group `tier: null`, `_count: 3`, `_sum: 14`, `_min: 1`, `_max: 10` | vitest pass | fixed |
| relation `_count` | documented soft-delete pattern undercounts | "counts absent-field rows in filtered relation _count" | 1 | 3 (matches findMany) | vitest pass | fixed |
| `eq: null` parity | must keep matching only explicit null | "keeps eq: null scoped to explicitly null rows on every surface" | 1 | 1 (unchanged) | passed before and after | preserved |

High-risk note:
- Realistic failure mode: an `isNull` aggregate filter now expands to two key
  candidates per field, so a query that previously sat just under
  `aggregateCartesianMaxKeys` (default 4096) or `aggregateWorkBudget` (default
  16384) could start throwing `*_FILTER_UNSUPPORTED`. Reaching it requires a
  combined `in`/`isNull` fan-out above ~2048 combinations, which is far outside
  normal use; the thrown error is explicit and names both the cause and the
  schema default to raise.
- Proof plan: the full `convex/orm` suite, including the dedicated
  `limits.defaults-tuning` and cartesian-guard tests, passes unchanged.
- Why the boundary is right: `parseFieldFilter` is the single point where every
  aggregate metric surface (count, countField, sum, avg, min, max, relational
  `_count`, and groupBy's per-group aggregate) turns a filter into bucket
  identity. Repairing it there fixes all of them at once and keeps `eq`, `in`,
  and range semantics untouched. groupBy needed the second edit only because it
  owns group identity, which the aggregate compiler cannot see.

Final handoff contract:
- Commit line: committed on `fix/aggregate-isnull-absent-rows` (whole checkout staged per repo policy).
- PR line: https://github.com/udecode/kitcn/pull/370
- Issue line: QA-facing fixed-in-PR comment posted on #366.
- Confidence line: 95-100%
- Flow table:
  - Reproduced: tests 🔴 3/4 failing on pristine source, browser ➖ N/A
  - Verified: tests 🟢 4/4 regression + 461 convex/orm + full `bun run test`, browser ➖ N/A
- Browser check: N/A: server-side aggregate semantics, no rendered output.
- Outcome: aggregate `isNull: true` now matches explicitly-`null` and absent rows
  across `count()`, `aggregate()`, `groupBy()`, and relation `_count`, agreeing
  with `findMany()`; `groupBy()` emits a single group keyed `null`.
- Caveat: no stored-data migration is needed, but two adjacent defects with the
  same contract are confirmed and deliberately out of scope — `rank()` and bulk
  `update`/`delete` `isNull`.
- Design:
  - Chosen boundary: aggregate constraint compilation (`parseFieldFilter`) plus
    groupBy candidate identity.
  - Why not quick patch: patching only the count call site would leave groupBy
    wrong and would duplicate null semantics per surface.
  - Why not broader change: write-side normalization would force a bucket rebuild
    and break `eq: null` parity; rank() and bulk mutation filters are different
    owners with their own storage decisions.
- Verified: `bun run test`, `bun typecheck`, `bun lint`, package build, targeted
  vitest regression suite.
- PR body verified: `gh pr view --json body` confirms the PR #270 emoji task-style shape.

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
- Commit: `fix/aggregate-isnull-absent-rows`.
- PR: https://github.com/udecode/kitcn/pull/370
- Issue: #366 synced with a QA-facing comment.
- Browser proof: N/A: no browser surface.
- Caveats: `rank()` and bulk `update`/`delete` `isNull` carry the same
  null-vs-absent defect and are left for separate tasks with reproduction
  evidence recorded under Findings.

Timeline:
- 2026-08-17T21:54:39.498Z Task goal plan created.
- Issue #366 fetched and read in full; zero comments.
- Aggregate read/write path read directly; parallel source audit fanned out and
  adversarially verified.
- Regression suite written first; 3 of 4 cases failed on pristine source.
- Read-path probe fix landed; count/aggregate/relation `_count` green, groupBy still red.
- groupBy candidate split landed; 4/4 green.
- Guard messages reworded for `isNull` expansion.
- Docs, skill mirror, and changeset landed; repo gates green; autoreview run.
- User authorized the PR path; branch renamed to `fix/aggregate-isnull-absent-rows`,
  `bun check` green, committed, pushed, PR #370 opened, issue #366 synced.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Final response |
| What is the goal? | Make aggregate `isNull: true` match absent-field rows across count/aggregate/groupBy/relation `_count` (issue #366) |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- `rank()` still misses absent-partition rows and cannot address that namespace
  at all; needs its own task and a rebuild decision.
- Bulk `update`/`delete` with `isNull()` still skips absent-field rows.
- `isNull` fan-out now counts toward the cartesian and work budgets; intentional,
  and the guard messages say so.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
- Not applicable: the user explicitly requested a PR, so this run commits,
  pushes, and opens https://github.com/udecode/kitcn/pull/370.
