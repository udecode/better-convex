# Fix queryFilter no-args prefix key

Objective:
Make `crpc.<path>.queryFilter()` with no args match every args variant in the
React and Solid Convex proxies, and give that rule one owner shared with the
HTTP proxies.

Goal plan:
docs/plans/386-fix-queryfilter-no-args.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- docs (docs/plans/templates/packs/docs.md)

Task source:
- type: GitHub issue
- id / link: https://github.com/udecode/kitcn/issues/386
- title: React: `queryFilter()` with no args builds `[prefix, name, undefined]`,
  which `partialMatchKey` never matches — invalidation silently misses every
  args-bearing query
- acceptance criteria: no-args `queryFilter()` returns a prefix key that
  partial-matches every args variant; Solid bindings checked for the same splice
  pattern
- caveats: fix correctly causes *more* invalidation, not less
- likely files/packages: `packages/kitcn/src/react/proxy.ts`,
  `packages/kitcn/src/solid/proxy.ts`, `packages/kitcn/src/internal/**`
- browser surface: none directly; symptom is stale UI in consumer apps
- root-cause layer: query-key construction in the cRPC options proxy

Timed checkpoint:
- requested duration: N/A: no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- `queryFilter()` and `queryFilter({})` return `[prefix, funcName]` in both the
  React and Solid Convex proxies; `queryFilter(args)` keeps the 3-element key;
  a real `QueryClient` invalidates every args variant through the no-args
  filter; full `bun test`, `vitest run`, `bun typecheck`, and `bun lint` pass.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/386-fix-queryfilter-no-args.md` passes.

Verification surface:
- `bun test packages/kitcn/src/react/proxy.test.ts` (shape + live-cache +
  `invalidateQueries` regression tests)
- `bun test packages/kitcn/src/internal/query-filter.test.ts` (owner unit tests)
- `npx vitest run packages/kitcn/src/solid/proxy.vitest.tsx` (Solid mirror)
- `bun test` (full), `npx vitest run` (full), `bun typecheck`, `bun lint`
- `bun --cwd packages/kitcn build`

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
- Source of truth: GitHub issue #386.
- Allowed edit scope: `packages/kitcn/src/{react,solid,internal}/**`,
  `www/content/docs/react/queries.mdx`,
  `packages/kitcn/skills/kitcn/references/features/react.md`, `.changeset/**`.
- Browser surface: N/A: no Convex deployment credentials in this workspace
  (`example/.env.local` and `example/convex/.env` absent).
- GitHub issue sync: N/A: user preference forbids creating a PR, so there is no
  fixed-in-PR line to post.
- Non-goals: centralizing every Convex query-key construction site; changing
  `queryKey`, `infiniteQueryKey`, or `mutationKey` arity.

Output budget strategy:
- Discovery ran as one bounded 10-agent workflow returning structured findings
  instead of streaming greps into context; full transcript kept as an artifact.
- Test/lint/typecheck output piped through `tail`/`grep`.

Blocked condition:
- Nothing blocking. Browser proof is waived for a recorded environment reason,
  and PR creation is declined by explicit user preference.

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
- next owner: task
- reason: Reproduced at the owning layer, fixed at a single shared owner, and
  proved green with a test that is red against the pre-fix implementation.

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/internal/query-filter.ts`
  (`hasQueryFilterArgs` + `buildConvexFilterKey`), consumed by all four proxies
- contradiction status: none; docs, HTTP precedent, and issue agreed
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: no-args `queryFilter()` builds `[prefix, name, undefined]`,
  which `partialMatchKey` never matches against args-bearing queries, so
  invalidation silently misses them.
- suggested diagnosis or fix: port the `hasArgs` branch from
  `react/http-proxy.ts` to `react/proxy.ts`; check Solid too.
- repro ladder:
  - tests / source-level repro: reproduced. A real `QueryClient` seeded with
    three `todos:list` variants returned `[]` from
    `findAll(queryFilter())` — 3 failing assertions before the fix.
  - repo-owned automated browser or integration proof: N/A: no repo-owned
    browser lane covers cRPC cache invalidation.
  - Browser plugin: N/A: `example/` cannot boot without Convex deployment
    credentials, which are absent in this workspace.
  - screenshot / visual proof: N/A: no rendered-output change in this repo.
- reproduction verdict: reproduced
- validity verdict: valid — and understated. The reporter said the filter
  "matches only no-args queries"; it actually matches *nothing*, because
  `queryOptions()`/`queryKey()` store omitted args as `{}`, and
  `partialMatchKey({}, undefined)` is false.
- best long-term fix boundary: one shared owner for the "no args means every
  variant" rule, consumed by React cRPC, Solid cRPC, React HTTP, and Solid HTTP.
  The bug existed because that rule lived in two places and only one was right.
- harsh honest feedback: the suggested fix (copy the `hasArgs` block into
  `proxy.ts`) would have worked but would have left the rule duplicated four
  ways and left two live landmines untouched: `isConvexQuery`/`isConvexAction`
  accepted 2-element keys and would hash a prefix key into a throw, and
  `client.ts` carried its own drifting copy of `isConvexAction`.
- hard-stop decision: proceed — claim reproduced and valid.

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/386-fix-queryfilter-no-args.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible UI change | no | N/A: library cache-key change; no UI or rendered output in this repo changes |
| Skill analysis before edits | yes | `task` owns workflow; `autogoal` for plan; `changeset` for release artifact; `autoreview` as closeout |
| Active goal checked or created | yes | docs/plans/386-fix-queryfilter-no-args.md |
| Source of truth read before edits | yes | attachment + `gh issue view 386 --json title,body,comments` (no comments) |
| Exact per-PR task ownership | no | N/A: user preference forbids creating a PR |
| GitHub comments and attachments read | yes | issue has zero comments |
| Video transcript evidence required | no | N/A: no video in source |
| Pre-solution issue challenge required | yes | recorded above; verdict `valid` |
| Reproduction verdict before implementation | yes | RED: 2 failing tests before fix, 3 after adding the invalidate test |
| Repro escalation ladder selected | yes | source-level repro sufficed; browser rung waived for env reason |
| Suggested fix reviewed against durable boundary | yes | pivoted from copy-paste to single shared owner |
| `docs/solutions` checked for non-trivial existing-code work | yes | directory does not exist |
| TDD decision before behavior change or bug fix | yes | red-first regression tests written before the fix |
| Branch decision for code-changing task | yes | already on dedicated `issue-386` branch |
| Release artifact decision | yes | `.changeset/olive-crabs-sneeze.md` (patch) |
| Browser tool decision for browser surface | yes | waived: no Convex credentials; owning-layer proof used instead |
| Commit / PR expectation decision | yes | Commit: yes. Push/PR: N/A — explicit user preference "Do not create PR under any circumstances, unless user prompts to" |
| Task-style PR body decision | no | N/A: no PR created |
| Task-plan PR body evidence | no | N/A: no PR created |
| GitHub issue sync expectation decision | no | N/A: no PR to reference in a sync comment |
| Output budget strategy recorded | yes | see Output budget strategy |
| Package/API pack selected | yes | published package runtime behavior changed |
| Public surface or package boundary identified | yes | `kitcn/react` + `kitcn/solid` `queryFilter` runtime behavior; no type-signature change |
| Convex entry/import graph impact identified | yes | new module has zero imports; not reachable from any Convex function entry |
| CLI/scaffold/generated impact identified | no | N/A: no CLI, scaffold, or generated output touched |
| Release artifact path selected | yes | `.changeset` |
| `changeset` skill loaded when `.changeset` is required | yes | `.agents/rules/changeset.mdc` read and followed |
| Package build / fixture impact decision recorded | yes | build run; fixtures N/A (no `init -t` template change) |
| Docs pack selected | yes | React query docs stated no contract for omitted args |
| Docs guidance loaded | yes | CLAUDE.md docs rules (current-state voice, skills mirror) |
| Docs lane selected | yes | supporting docs edit alongside a code fix |
| Target docs and nearest sibling docs read | yes | `www/content/docs/react/queries.mdx`, `www/content/docs/server/http.mdx` (correct sibling contract) |
| Docs style doctrine read | yes | no changelog voice; latest-state only |
| Documented source owner identified | yes | `DecorateQuery.queryFilter` in `react/crpc-types.ts` |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration requested.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every GitHub PR in scope has its own task plan. N/A: no PR in scope
      (explicit user preference).
- [x] Required video or screen-recording evidence is cached/read as normalized
      `<video-transcripts>` XML, or marked N/A with reason. N/A: no video.
- [x] For public GitHub bug reports, reporter claims are challenged before
      implementation with a recorded verdict. Verdict: `valid`.
- [x] Repro escalation ladder followed for bug/behavior claims.
- [x] Hard-stop rule followed for bug/behavior claims.
- [x] Nearby repo instructions and implementation patterns read before edits.
- [x] Source-listed case matrix is complete and every contradiction has an
      owner, harness, and verdict before mutation.
- [x] Readiness is classified. Verdict: `ready`.
- [x] Implementation fixes the right ownership boundary.
- [x] Release artifact requirement recorded: new changeset (patch).
- [x] Final handoff shape decided: bug shape, no PR/issue sync.
- [x] Commit/PR handling recorded for code-changing work: commit yes; push/PR
      declined by explicit user preference.
- [x] PR body shape recorded. N/A: no PR created.
- [x] PR task evidence recorded. N/A: no PR created.
- [x] Branch handling recorded: dedicated `issue-386` branch already checked out.
- [x] Local-env-rot retry policy recorded: 3 initial `bun test` failures were
      stale `dist`; `bun --cwd packages/kitcn build` cleared them (1297 pass).
- [x] Workspace authority recorded: all proofs run from repo root against
      `packages/kitcn/src`, which owns the changed behavior.
- [x] Output budget discipline recorded and followed.
- [x] High-risk note recorded for public API / runtime change. See Open risks.
- [x] Review/autoreview target selected from actual diff state.
- [x] Agent-native review decision recorded. N/A: no `.agents/**`, `.claude/**`,
      `.codex/**`, skill, hook, command, or prompt files changed.
- [x] Package/API pack: public API, package boundary, export, and release-artifact impact are recorded.
- [x] Package/API pack: release artifact matrix is applied: `.changeset`.
- [x] Package/API pack: `.changeset` work loads `changeset` and follows its package/version/prose rules.
- [x] Package/API pack: no-artifact decisions state why. N/A: artifact created.
- [x] Package/API pack: compatibility, migration, or hard-cut decision is
      explicit — behavior fix, no type-signature change, no shim.
- [x] Package/API pack: affected Convex static import graphs stay narrow. New
      module has zero imports.
- [x] Package/API pack: CLI commands remain deterministic. N/A: no CLI change.
- [x] Package/API pack: docs and `packages/kitcn/skills/kitcn/**` stay
      current-state synchronized.
- [x] Package/API pack: package-owned typecheck/build/test proof is recorded.
- [x] Package/API pack: `packages/kitcn` build proof recorded; fixtures N/A.
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages. N/A: no
      new links introduced; `InfoIcon`/`Callout` already imported on the page.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run named commands | `bun test` 1297 pass / 0 fail; `vitest run` 847 pass, 2 files skipped; `bun typecheck` 5/5 tasks successful; `bun lint` clean |
| Exact per-PR task ownership | no | — | N/A: no PR created (user preference) |
| Pre-solution issue challenge verdict | yes | Record verdicts | recorded above: reproduced / valid / pivoted boundary |
| Repro escalation ladder | yes | Record rungs | source-level repro reproduced; browser rung waived for missing Convex credentials |
| Bug reproduced before fix | yes | Record failing repro | `findAll(queryFilter())` returned `[]`; 2 fail before fix, and 3 fail when the invalidate test is run against stashed pre-fix `proxy.ts` |
| Targeted behavior verification | yes | Run focused proof | `bun test packages/kitcn/src/react/proxy.test.ts` 7 pass; `internal/query-filter.test.ts` 5 pass; solid vitest 19 pass |
| TypeScript or typed config changed | yes | Run typecheck | `bun typecheck` 5 successful, 5 total |
| Package exports or file layout changed | yes | Run package build | `bun --cwd packages/kitcn build` — 71 files, build complete |
| Package manifests, lockfile, or install graph changed | no | — | N/A: no manifest or lockfile change |
| Agent rules or skills changed | no | — | N/A: no `.agents/**` rule or skill source changed |
| Workspace authority proof | yes | Record cwd | all commands run from repo root `/Users/mikey/conductor/workspaces/kitcn/brasilia-v3`, which owns `packages/kitcn` |
| Browser surface changed | no | — | N/A: no Convex deployment credentials; `example/.env.local` and `example/convex/.env` absent |
| Browser final proof | no | — | N/A: see above; owning-layer QueryClient proof used instead |
| UI walkthrough | no | — | N/A: no UI or rendered output changed in this repo |
| Scaffold or fixture output changed | no | — | N/A: no `init -t` template or scaffold source changed |
| Package behavior or public API changed | yes | Add changeset | `.changeset/olive-crabs-sneeze.md` (patch) |
| Docs and kitcn skill sync changed | yes | Keep in sync | `www/content/docs/react/queries.mdx` + `packages/kitcn/skills/kitcn/references/features/react.md` updated together |
| Docs or content changed | yes | Verify claims | key shapes in docs verified against `proxy.test.ts` assertions |
| High-risk mini gate | yes | Record failure mode + boundary | see Open risks |
| Agent-native review for agent/tooling changes | no | — | N/A: no agent-native surface changed |
| Local install corruption suspected | yes | Rerun after build | 3 stale-`dist` failures cleared by `bun --cwd packages/kitcn build`; no reinstall needed |
| Commit created | yes | Create commit | see Final handoff / sync |
| PR create or update | no | — | N/A: explicit user preference "Do not create PR under any circumstances, unless user prompts to" |
| Task-style PR body verified | no | — | N/A: no PR created |
| PR task evidence verified | no | — | N/A: no PR created |
| PR proof image hosting | no | — | N/A: no PR created |
| GitHub issue sync-back | no | — | N/A: no PR to reference; user preference bars the PR that a sync comment would announce |
| Final handoff contract | yes | Fill fields | see Final handoff contract |
| Final lint | yes | Run lint | `bun lint:fix` then `bun lint` — clean |
| Output budget discipline | yes | Verify | no unbounded output streamed |
| Timed checkpoint | no | — | N/A: no duration requested |
| Autoreview for non-trivial implementation changes | yes | Run autoreview until clean | see Review fixes |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/386-fix-queryfilter-no-args.md` | see Verification evidence |
| Public API / package boundary proof | yes | Source-audit | `queryFilter` return type is `QueryFilters`, whose `queryKey` is `QueryKey`; a 2-element key needs no signature change |
| Convex bundle/import proof | yes | Audit graphs | `internal/query-filter.ts` has zero imports; `rg` shows no Convex-entry package reaches `internal/query-key` or `internal/hash` |
| CLI/scaffold/generated proof | no | — | N/A |
| Release artifact classification | yes | Classify | published package runtime behavior change |
| Published package changeset | yes | Add changeset | `.changeset/olive-crabs-sneeze.md` |
| No release artifact | no | — | N/A: artifact created |
| Package typecheck/build/test | yes | Run | recorded above |
| Fixture/scaffold generation | no | — | N/A |
| Docs/package skill sync | yes | Synchronize | recorded above |
| Docs source-backed claim audit | yes | Verify | recorded above |
| Docs links / routes / previews | yes | Verify | no new links; existing `Callout`/`InfoIcon` imports reused |
| Docs MDX/content parser | yes | Run docs build/parse | covered by `bun lint` (biome checks MDX-adjacent content) and unchanged component usage |
| Kitcn docs sync | yes | Update skill mirror | `packages/kitcn/skills/kitcn/references/features/react.md` updated in the same diff |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | issue fetched, zero comments; four proxy impls read | implementation |
| Implementation | complete | shared owner + 4 call sites + arity guard + dedupe | verification |
| Verification | complete | full bun/vitest/typecheck/lint/build green | closeout |
| Commit / PR / GitHub sync | complete | commit created; PR/sync N/A by user preference | final response |
| Closeout | complete | autoreview clean | final response |

Findings:
- The reporter understated the bug. `queryFilter()` matched **zero** queries,
  not "only no-args queries": `queryOptions()`/`queryKey()` normalize omitted
  args to `{}`, and `partialMatchKey({}, undefined)` is `false`.
- `queryFilter({})` already worked by accident — `partialMatchKey` recurses into
  objects and `Object.keys({}).every(...)` is vacuously true. Only the fully
  omitted form was dead, which is why the bug survived the docs examples that
  use `queryFilter({}, ...)`.
- `solid/proxy.ts` is byte-identical to `react/proxy.ts` except the
  `@tanstack/react-query` → `@tanstack/solid-query` import, so it carried the
  same defect.
- `isConvexQuery`/`isConvexAction` guarded on `length >= 2` while their type
  predicates claim a 3-element key. Feeding the new 2-element prefix key to
  `createHashFn()` throws
  `undefined is not a valid Convex value` — verified at runtime. This only
  triggers on `exact: true`, and the pre-fix 3-element `undefined` key threw
  identically, so it was a latent landmine rather than a regression.
- `react/client.ts` and `solid/client.ts` each carried a private duplicate of
  `isConvexAction`, also at `length >= 2` — the same duplication-drift shape
  that produced #386.
- Eight live no-args `queryFilter()` call sites in `example/` silently
  invalidate nothing today (auth 224/225/260/297/354, orm 242, aggregate 171,
  triggers 129, ratelimit 192). They are correct callers of a broken API and
  need no edit.
- `www/content/docs/react/queries.mdx:93` sits inside the `subscribe: false`
  section, where `invalidateQueries` is the *only* refresh path — the worst
  possible place for a silent no-op.

Decisions and tradeoffs:
- Chose a single shared owner (`internal/query-filter.ts`) over copying the
  `hasArgs` block into `proxy.ts`. The root cause is that the rule lived in two
  places and only the HTTP copy was right; duplicating it a third and fourth
  time would preserve the defect's cause. All four proxies now call one
  predicate.
- Gave the new module **zero imports** so it can be pulled into any bundle
  without touching the Convex function-entry import graph. Rejected
  `internal/query-key.ts` as the home for the predicate because it imports
  `convex/values` and `crpc/transformer`, and rejected `shared/meta-utils.ts`
  because it *is* on the Convex entry path via `server/caller.ts`.
- Tightened `isConvexQuery`/`isConvexAction` to `length >= 3` rather than
  special-casing the prefix key at the hash site. Every real cache key is
  exactly 3 elements, and all callers read cache keys, never filter keys, so the
  guard was simply lying about arity.
- Deduped the private `isConvexAction` copies in both `client.ts` files instead
  of tightening them in place. Leaving a `>= 2` twin of a predicate just
  tightened to `>= 3` would rebuild the exact drift being fixed.
- Accepted that the prefix key now also matches `'skip'` sentinel entries. A
  skipped query is a real variant of the function, `enabled: false` keeps it out
  of the default `refetchType: 'active'` refetch, and a test asserts both that
  the prefix key matches it and that `invalidateQueries` does not throw.
- Treated nullish args as omitted rather than as a narrowing value. `null` in
  the args slot matches nothing — the same silent no-op as #386 — and the two
  proxies disagreed about it, so folding it into "no args" removes a footgun
  and makes cRPC and HTTP agree. Reachable only from untyped JS, since
  `queryFilter(args?: DeepPartial<FunctionArgs<T>>)` does not admit `null`.
- Did not centralize every Convex query-key construction site
  (`use-query-options.ts`, `use-infinite-query.ts`, `crpc/query-options.ts`).
  That is a larger refactor than #386 warrants and would risk the hot query path.

Implementation notes:
- New: `packages/kitcn/src/internal/query-filter.ts` — `hasQueryFilterArgs`,
  `buildConvexFilterKey`, and the `ConvexKeyPrefix`/`ConvexFnQueryKey`/
  `ConvexFnPrefixKey` types, modelled on the existing `crpc/http-types.ts`
  key-owner precedent.
- `react/proxy.ts` + `solid/proxy.ts`: `queryFilter` builds its key through
  `buildConvexFilterKey`.
- `react/http-proxy.ts` + `solid/http-proxy.ts`: inline `hasArgs` blocks
  replaced with the shared `hasQueryFilterArgs`.
- `internal/query-key.ts`: arity guards tightened to `>= 3` with the reason
  documented.
- `react/client.ts` + `solid/client.ts`: private `isConvexAction` duplicates
  deleted in favour of the shared import.

Review fixes:
- `autoreview --mode local --engine claude`, cycle 1: clean on P0
  ("patch is correct", 0.88) with two sub-threshold notes. Both were verified
  against the real code path and both were real, so both were fixed rather than
  rejected:
  1. The skip-entry regression test seeded with
     `setQueryData(key, undefined)`, which TanStack v5 treats as a no-op —
     confirmed at runtime: 0 cache entries created. The assertion was vacuous.
     Fixed by building the entry through `getQueryCache().build(...)` and
     adding a real `findAll` assertion that the prefix key matches the `'skip'`
     sentinel alongside the args-bearing entry.
  2. `null` args produced `[prefix, name, null]`, which matches nothing — the
     exact #386 failure mode, reachable from untyped JS. Confirmed at runtime
     that HTTP and cRPC disagreed: `buildHttpQueryKey` normalizes via
     `args ?? {}` so HTTP `queryFilter(null)` matched everything while cRPC
     matched nothing. Fixed by treating nullish args as omitted
     (`args == null`), which makes both proxies agree and removes the footgun.
     No HTTP regression: both before and after, HTTP `queryFilter(null)`
     matches every variant.
- `autoreview --mode local --engine claude`, cycle 2 (after the fixes): clean
  on P0 ("patch is correct", 0.9), no accepted/actionable findings. Converged
  in two cycles.
- Engine note: `--engine claude` used because `--ignore-user-config` strips the
  custom provider gateway and makes the Codex default 401.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `bun test` 3 failures (`Cannot find module 'kitcn/auth/client'`, `kitcn/dist/orm/index.js`) | 1 | Suspect stale `dist` before suspecting the diff | `bun --cwd packages/kitcn build` → 1297 pass / 0 fail |

Verification evidence:
- RED before fix: `bun test packages/kitcn/src/react/proxy.test.ts` → 3 pass /
  2 fail; `findAll(queryFilter())` returned `[]`.
- RED confirmed for the `invalidateQueries` test by stashing only
  `react/proxy.ts`: 4 pass / 3 fail on the pre-fix implementation.
- GREEN after fix: same file 7 pass / 0 fail.
- `bun test packages/kitcn/src/internal/query-filter.test.ts` → 5 pass.
- `npx vitest run packages/kitcn/src/solid/proxy.vitest.tsx packages/kitcn/src/solid/http-proxy.vitest.ts` → 19 pass, no type errors.
- Post-review re-run: `bun test` on react proxy + query-filter + http-proxy →
  23 pass / 0 fail.
- `bun test` (full, final) → 1298 pass / 0 fail.
- Vacuous-assertion proof: `setQueryData(key, undefined)` leaves the cache at
  0 entries, which is why the skip test now uses `getQueryCache().build(...)`.
- Null-divergence proof: HTTP `queryFilter(null)` key `['httpQuery',route,{}]`
  matched an args-bearing entry (`true`); pre-fix cRPC key
  `['convexQuery',name,null]` did not (`false`).
- `npx vitest run` (full) → 78 files passed, 2 skipped; 847 tests passed; no type errors.
- `bun typecheck` → 5 successful, 5 total.
- `bun lint` → clean.
- `bun --cwd packages/kitcn build` → build complete, 71 files.
- Runtime landmine proof: `createHashFn()(['convexQuery','todos:list'])` throws
  `undefined is not a valid Convex value`; guarded by the tightened arity check
  plus an `exact: true` regression test.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| React `queryFilter()` no args | builds `[prefix, name, undefined]`, matches nothing | `react/proxy.test.ts` shape + live `QueryClient` | `['convexQuery','todos:list',undefined]`, `findAll` → `[]` | `['convexQuery','todos:list']`, matches 3 variants | 7 pass / 0 fail | done |
| React `queryFilter({})` | empty object should mean every variant | `react/proxy.test.ts` | `[...,{}]` (worked by accident) | `['convexQuery','todos:list']` | asserted | done |
| React `queryFilter(args)` | must keep narrowing | `react/proxy.test.ts` | 3-element key | unchanged 3-element key | asserted | done |
| Action `queryFilter()` | same splice pattern on `convexAction` | `react/proxy.test.ts` | `['convexAction','workers:run',undefined]` | `['convexAction','workers:run']` | asserted | done |
| Solid bindings | issue asks to check for the same pattern | `solid/proxy.vitest.tsx` | identical defect (byte-identical file) | prefix key for query and action | 19 pass | done |
| HTTP proxies | already correct; must not regress | `react/http-proxy.test.ts`, `solid/http-proxy.vitest.ts` | correct | unchanged, now via shared predicate | pass | done |
| `exact: true` with a filter | latent hash throw on short keys | `react/proxy.test.ts` | throws on `undefined` args slot | no throw | asserted | done |
| Skip sentinel entries | prefix key newly matches `'skip'` | `react/proxy.test.ts` (entry built via `cache.build`) | not matched | matched, `invalidateQueries` does not throw | asserted | done |
| `queryFilter(null)` | untyped-JS nullish args | `internal/query-filter.test.ts` | cRPC matched nothing while HTTP matched everything | both return the prefix key | asserted | done |

Final handoff contract:
- Commit line: `fix(react,solid): match every args variant from no-args queryFilter`
- PR line: N/A: user preference forbids creating a PR
- Issue line: N/A: no PR exists to announce
- Confidence line: 🟢 95-100% confidence
- Flow table:
  - Reproduced: tests 🔴 (2→3 failing before fix), browser ➖ N/A
  - Verified: tests 🟢 (full bun + vitest green), browser ➖ N/A
- Browser check: N/A: `example/` has no Convex deployment credentials in this
  workspace; the bug lives in the QueryClient key layer and is proved there.
- Outcome: `crpc.<path>.queryFilter()` with no args now returns a prefix key and
  invalidates every args variant in React and Solid; the rule has one owner
  shared with the HTTP proxies.
- Caveat: the fix correctly invalidates *more* than before, including `'skip'`
  sentinel entries and infinite-query page entries for the same function.
- Design:
  - Chosen boundary: one zero-dependency owner module consumed by all four
    proxies.
  - Why not quick patch: copying `hasArgs` into `proxy.ts` would leave the rule
    duplicated four ways — the cause of the bug.
  - Why not broader change: centralizing every Convex query-key construction
    site would touch the hot query path for no #386 benefit.
- Verified: full `bun test`, `vitest run`, `bun typecheck`, `bun lint`,
  package build, plus red-before/green-after proof.
- PR body verified: N/A: no PR created

Task-style PR body contract:
- N/A for this run: no PR was created, by explicit user preference. If the user
  later asks for a PR, use the PR #270 emoji task-style body with
  `🐛 Fixes #386`, `🧭 Task plan: docs/plans/386-fix-queryfilter-no-args.md`,
  a `🟢 95-100% confidence` line, the
  `| Phase | 🧪 Tests | 🌐 Browser |` table with `Reproduced`/`Verified` rows,
  and bold emoji `**✅ Outcome**`, `**⚠️ Caveat**`, `**🏗️ Design**`,
  `**🧪 Verified**` sections.

Final handoff / sync:
- Commit: created on `issue-386`, not pushed
- PR: N/A: explicit user preference
- Issue: N/A: no PR to reference
- Browser proof: N/A: no Convex credentials in this workspace
- Caveats: more invalidation is expected and correct; `'skip'` entries now match

Timeline:
- 2026-08-21T14:12:31.397Z Task goal plan created.
- 2026-08-21T14:20Z Issue reproduced RED at the QueryClient layer.
- 2026-08-21T14:35Z Shared owner landed; all four proxies wired.
- 2026-08-21T14:50Z Full suites, typecheck, lint, and build green.
- 2026-08-21T14:55Z Docs + changeset synced; autoreview closed.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete |
| Where am I going? | Final response |
| What is the goal? | Make no-args `queryFilter()` match every args variant in React and Solid, under one shared owner |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- Public API / runtime high-risk note. Realistic failure mode: a consumer that
  relied on the broken no-op — for example a `refetchQueries(queryFilter())`
  loop that was silently dead — now performs real work and could refetch more
  than expected, including `'skip'` sentinel and infinite-query entries for the
  same function. Proof plan: shape tests for all four key forms, a live
  `QueryClient` `findAll` test, an `invalidateQueries` + `isInvalidated` test
  scoped to one function, and an `exact: true` / skip-entry no-throw test.
  Why the boundary is right: the filter key is the single place the
  "every variant" contract is expressed, it is the layer TanStack matches on,
  and putting it behind one predicate makes cRPC and HTTP provably agree
  instead of drifting.

Hard closeout guard:
- A local-only final response is valid here: the user preference
  "Do not create PR under any circumstances, unless user prompts to" is an
  explicit decline of the PR path. The commit gate is satisfied.
