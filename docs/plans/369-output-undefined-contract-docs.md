# 369 output undefined contract docs

Objective:
Document and de-trap the cRPC `.output()` return contract for issue #369: correct the
misleading docs callout, state the rule in www + kitcn skill, complete the 0.23.0
changelog, ship CHANGELOG.md on npm, and make output-validation failures diagnosable.

Goal plan:
docs/plans/369-output-undefined-contract-docs.md

Template:
docs/plans/templates/docs.md

Primary template:
docs/plans/templates/docs.md

Applied packs:
- package-api (docs/plans/templates/packs/package-api.md)
- agent-native (docs/plans/templates/packs/agent-native.md)

Docs source:
- type: GitHub issue
- id / link: #369 https://github.com/udecode/kitcn/issues/369
- title: Docs/changelog: 0.23.0 silently changed `.output()` runtime behavior for handlers returning `undefined`
- acceptance criteria: (1) a changelog entry for 0.23.0 recording that the fluent
  `.output()` return path no longer coerces `undefined` to `null`; (2) a rule in
  `skills/kitcn/` stating the `.output()` contract and how the low-level `returns:`
  option differs. Also reported in-issue: output-validation failures throw a bare
  `ZodError` that Convex redacts to `Server Error`.

Docs lane:
- lane: API reference (procedure return contract) + guide/system
- target docs: `www/content/docs/server/procedures.mdx` (`## Output Validation`),
  `www/content/docs/server/error-handling.mdx` (`### Output Validation`)
- documented source owner: `packages/kitcn/src/server/builder.ts` (`.output()` parse,
  `resolveConvexReturnsSchema`), `packages/kitcn/src/server/validation.ts`,
  `packages/kitcn/src/internal/upstream/server/zod4.ts` (low-level `returns:`)
- nearest sibling docs: `www/content/docs/server/procedures.mdx` `## Input Validation`,
  `www/content/docs/server/http.mdx`
- kitcn skill mirror: `packages/kitcn/skills/kitcn/SKILL.md` (source) regenerated into
  `.agents/skills/kitcn/` via `bun tooling/sync-kitcn-skill.ts`; `.claude/skills/kitcn`
  is a symlink to that mirror

Timed checkpoint:
- requested duration: N/A - no duration requested
- semantics: N/A
- initial confidence score: N/A
- improvement loop: N/A
- final score / loop closure: N/A

Completion threshold:
- `www/content/docs/server/procedures.mdx` states the `.output()` return contract in
  current-state voice, its pre-existing callout no longer implies a coercion the fluent
  path does not perform, and it names `.nullable()` (not a top-level `.optional()`) as
  the way to model an absent value.
- The same rule exists in `packages/kitcn/skills/kitcn/SKILL.md` and its generated mirror.
- The 0.23.0 `CHANGELOG.md` entry records the dropped `undefined` -> `null` substitution,
  and `CHANGELOG.md` is included in the published tarball.
- Output-validation failures carry a diagnosable error instead of an opaque `Server Error`,
  pinned by tests, with a changeset describing the published delta.
- Every factual claim added to docs is backed by executed source/runtime evidence.
- Docs closure is legal only when the page teaches the fastest correct path,
  every claim is source-backed, docs-lane shape is satisfied, required MDX/link/
  preview checks are recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/369-output-undefined-contract-docs.md`
  passes.

Verification surface:
- `bun test packages/kitcn/src/server/` for the pinned contract and error shape.
- `bun check` (lint, typecheck, bun+vitest suites, CLI, concave, fixtures, verify,
  scenario runtime) as the repo gate.
- `bun --cwd www build` for MDX/content and anchor rendering.
- `bun --cwd packages/kitcn build` plus `npm pack --dry-run` for the packaged file list.
- `diff -r packages/kitcn/skills/kitcn .agents/skills/kitcn` for mirror sync.
- `.agents/skills/autoreview/scripts/autoreview` plus a 4-lens adversarial review workflow.

Constraints:
- Follow `packages/kitcn/skills/kitcn/references/setup/doc-guidelines.md` for
  docs style and workflow when `www/**` changes.
- Write current-state docs only. No changelog voice.
- Keep code examples repo-backed and copy-pasteable.
- Do not invent APIs, routes, demos, imports, components, transforms, or options.
- Do not add docs ceremony for tiny typo/copy edits.

Boundaries:
- Source of truth: GitHub issue #369 plus the kitcn source at HEAD.
- Allowed edit scope: `www/content/docs/server/**`, `packages/kitcn/skills/kitcn/**`
  (+ generated mirror), `packages/kitcn/CHANGELOG.md`, `packages/kitcn/package.json`,
  `packages/kitcn/src/server/**`, `.changeset/`, `docs/plans/`.
- Browser surface: none. The change has no rendered UI behavior; docs prose is proven by
  the www content build and anchor check rather than a browser session.
- GitHub sync: PR #373 onto `main`. No issue comment.
- Non-goals: redesigning `resolveConvexReturnsSchema` so a top-level `.output(optional)`
  becomes expressible; fixing the low-level `returns:` coercion for `.optional()`/
  `.default()`; adding a README to the published package; reconciling the HTTP builder's
  `z.infer` output typing with the fluent builder's `z.input`.

Output budget strategy:
- Broad exploration ran inside two background workflows that returned schema-validated
  structured results; their full transcripts stayed in `journal.jsonl` artifacts and were
  queried with bounded `node -e` extractions rather than streamed into context.
- Long-running gates (`bun check`, `test:runtime`, `www build`, autoreview) wrote to
  `/tmp/*.log` and were read with `tail`/`grep`.
- Repo greps were capped with `head` and scoped to specific paths.

Blocked condition:
- A required repo gate fails for a reason attributable to this diff and cannot be fixed
  inside the allowed edit scope.
- The `.output()` contract turns out to need a runtime/API redesign rather than
  documentation, which belongs to `major-task` and an owner decision.

Docs state:
- task_type: docs
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: final response
- goal_status: complete

Current verdict:
- verdict: partially valid - every reported behavior reproduced; the docs were not merely
  silent but actively misleading, and the reported papercut was real
- confidence: 95-100%
- next owner: none - complete
- reason: all source-listed cases reproduced at the owning layer, fixed, and pinned by
  tests; `bun check` green; autoreview clean

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/369-output-undefined-contract-docs.md`
  passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration requested |
| Walkthrough baseline for possible rendered change | no | N/A: no rendered UI or visual output changes; docs prose only, proven by `bun --cwd www build` |
| Docs guidance loaded | yes | Read `packages/kitcn/skills/kitcn/references/setup/doc-guidelines.md` in full |
| Active goal checked or created | yes | This plan, created via `create-goal-scratchpad.mjs --template docs --with package-api --with agent-native` |
| Docs lane selected | yes | API reference + guide/system; see Docs lane |
| Target docs read | yes | `procedures.mdx` `## Output Validation` and `error-handling.mdx` read before writing |
| Nearest sibling docs read | yes | `procedures.mdx` `## Input Validation`, `server/http.mdx`, `react/error-handling.mdx` |
| Docs style doctrine read | yes | doc-guidelines.md S3 compression contract, S4 destination matrix, S8 quality gates |
| Documented source code read | yes | `builder.ts` output parse + `resolveConvexReturnsSchema`, `zod4.ts` `parseReturns`, `error.ts` `toCRPCError`, `http-builder.ts` |
| Ownership map drafted | yes | `procedures.mdx` owns `.output()` semantics; SKILL.md core owns the agent-facing rule; CHANGELOG owns version history |
| Output budget strategy recorded | yes | See Output budget strategy |
| Kitcn skill sync decision | yes | `www/**` changed, so SKILL.md updated in the same diff and mirror regenerated |
| Browser/render proof decision | no | N/A: no browser-rendered behavior changes; `bun --cwd www build` + anchor id check used instead |
| PR/GitHub expectation decision | yes | PR #373 opened onto `main` after `bun check` passed |
| Package/API pack selected | yes | `packages/kitcn` public error behavior, `files`, and published guidance all change |
| Public surface or package boundary identified | yes | `.output()` failure error shape; `parseOutput`/`zodIssuesToConvexValue` deliberately kept out of `server/index.ts` |
| Convex entry/import graph impact identified | yes | `validation.ts` adds no new dependency edge: `convex/values` is type-only, `./error` was already imported by both callers |
| CLI/scaffold/generated impact identified | no | N/A: no CLI, `init -t` template, or scaffold source changed; `fixtures:check` green |
| Release artifact path selected | yes | `.changeset/olive-donkeys-tap.md` (patch) |
| `changeset` skill loaded when `.changeset` is required | yes | Followed `.agents/rules/changeset.mdc`: patch bump, `## Patches` section, action-verb bullets, no file paths |
| Package build / fixture impact decision recorded | yes | `bun --cwd packages/kitcn build` run; fixtures unaffected but `fixtures:check` ran inside `bun check` |
| Agent-native pack selected | yes | `packages/kitcn/skills/kitcn/SKILL.md` and its generated `.agents/skills/kitcn` mirror changed |
| Agent-facing action surface identified | yes | An agent authoring a cRPC procedure with `.output()` - rule lives in always-loaded SKILL.md core |
| Source rule versus generated mirror boundary identified | yes | Edited `packages/kitcn/skills/kitcn/SKILL.md` only; mirror regenerated by `bun tooling/sync-kitcn-skill.ts` |
| Installed-skill lock versus local-rule owner identified | yes | No installed skill added/removed; `skills-lock.json` untouched |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded and applied; see Completion Gates `Agent-native review` |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Docs lane is classified as install, guide/system, plugin/feature,
      serialization/conversion, workflow/AI, API reference, or spec/law.
- [x] Target docs and nearest sibling docs were read before writing.
- [x] Docs style doctrine in the kitcn doc guidelines was read before writing,
      or marked N/A for non-`www/**` docs.
- [x] Documented behavior or API was verified against current source.
- [x] Ownership map records package, kitcn skill, app-local, and docs-site
      ownership where relevant.
- [x] Fastest success path appears before deeper mechanics or API reference.
- [x] Opening is three sentences or fewer and avoids generic fluff.
- [x] Named APIs, options, transforms, components, imports, routes, and package
      specifiers are exact and current.
- [x] Plugin docs, if applicable, satisfy kitcn plugin guidance and package
      ownership.
- [x] Serialization docs, if applicable, split directions and state environment
      constraints before examples.
- [x] API reference docs, if applicable, use exact contracts and avoid tutorial
      filler.
- [x] Spec/law docs, if applicable, record owner map, evidence, and explicit
      gaps.
- [x] Demos/previews/examples are real source-backed surfaces or marked N/A
      with reason.
- [x] Links target real leaf pages and do not reinforce pages being displaced.
- [x] Anti-slop audit passed: no changelog voice, no fake APIs, no placeholder
      comments, no TODOs, no dead anchors, no redundant summary section.
- [x] Workspace authority recorded: every proof command names the cwd/tool that
      owns the changed docs.
- [x] Output budget discipline recorded and followed: broad searches are
      scoped, capped, counted, or artifacted instead of streamed into goal
      context.
- [x] Review/autoreview target selected for non-trivial docs work, or marked
      N/A with reason.
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
- [x] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [x] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [x] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [x] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [x] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [x] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the source audit, parser/build, link/demo check, or review named in this plan | `bun check` EXIT=0 (lint, typecheck, bun 1262 + vitest 839 tests, CLI, concave, fixtures, verify, 11 runtime scenarios) |
| Docs lane shape satisfied | yes | Check the lane-specific structure against kitcn docs guidance or record N/A | Fastest path (example) precedes mechanics; contract stated before edge cases; skill keeps only the non-parity delta |
| Source-backed claim audit | yes | Verify every named API/option/transform/component/import/route against source | Every added claim executed: pre-0.23.0 tree via `git archive 13fbae32^`, HEAD via `_handler`, `exportReturns()` payloads, Convex `registration_impl.js:44` undefined->null |
| Ownership map verified | yes | Confirm package/layer/kit/app-local ownership claims against source | `procedures.mdx` is the only www page stating the `.output()` contract; `zCustomQuery` is public via `server/index.ts:3` and documented nowhere else |
| MDX/content parser | yes | Run the relevant `www` docs parser/build for MDX/content changes, or record N/A | `bun --cwd www build` EXIT=0, 60 pages prerendered |
| Links/routes/previews verified | yes | Check leaf links, routes, anchors, and `<ComponentPreview>` names or record N/A | `id=output-validation` and `id=what-the-handler-must-return` present in the built `procedures.html` |
| Kitcn docs sync | yes | If `www/**` changed, update matching `packages/kitcn/skills/kitcn/**` content or record N/A | SKILL.md delta list, Common Mistakes row, and Error Model entry updated in the same diff |
| Browser/render surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: no rendered UI change; content build + anchor check used instead |
| Package/API behavior changed | yes | Add changeset or record N/A | `.changeset/olive-donkeys-tap.md` |
| Agent rules or skills changed | yes | Run `bun install` and verify generated skill sync | `bun tooling/sync-kitcn-skill.ts`; `diff -r` of source vs mirror clean |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` - no fixes applied on the final pass |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | Workflow results read from `journal.jsonl` via bounded extractions; gates logged to `/tmp` and tailed |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested |
| Agent-native reviewer | yes | Run for agent workflow docs or record N/A | Action/context/source/proof/discoverability parity checked; see Agent-native review |
| UI walkthrough | no | If docs changed a rendered UI or visual output, run `.agents/skills/walkthrough/SKILL.md` after final proof and show annotated images in the final handoff; otherwise record N/A | N/A: no UI or rendered-output change |
| Autoreview for non-trivial docs changes | yes | Load `.agents/skills/autoreview/SKILL.md` and run the right target, or record N/A for tiny/no-local-patch work | `autoreview --engine claude --thinking high` -> `autoreview clean: no accepted/actionable findings`, `patch is correct (0.85)` |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/369-output-undefined-contract-docs.md` | `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/369-output-undefined-contract-docs.md` passes |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | `validation.ts` is not re-exported from `server/index.ts`; only the `.output()` failure error shape changes for users |
| Convex bundle/import proof | yes | Audit affected function-entry static graphs or record N/A | `validation.ts` imports `convex/values` type-only and `./error`, both already in each caller's graph; no new entry edge |
| CLI/scaffold/generated proof | no | Prove command contract and regenerate owned output or record N/A | N/A: no CLI or scaffold source changed |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | Published package behavior + packaged file list + public guidance changed -> changeset required |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | `.changeset/olive-donkeys-tap.md`, `kitcn: patch` |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: an artifact was required and added |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | `bun typecheck` (5/5 turbo tasks), `bun --cwd packages/kitcn build`, `bun test packages/kitcn/src/server/` 170 pass |
| Fixture/scaffold generation | no | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | N/A: no `init -t` template or scaffold source changed; `fixtures:check` still ran green inside `bun check` |
| Docs/package skill sync | yes | Synchronize current-state public guidance or record N/A | www and `packages/kitcn/skills/kitcn/**` updated together in current-state voice |
| Agent source / generated sync | yes | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | `.agents/rules/**` unchanged; kitcn skill mirror regenerated and verified identical |
| Installed lock audit | no | Verify expected lock entries and removed skills through CLI-managed state | N/A: no installed skill added, updated, or removed |
| Agent action discoverability | yes | Source-audit the skill/rule path an agent will read | Rule reachable from always-loaded SKILL.md delta #3, Common Mistakes row, and Error Model item 7 |
| Helper and template smoke | yes | Syntax-check helpers and prove incomplete failure/completed representation when applicable | `check-complete.mjs` run against this plan; its three stale `2026-08-17-` self-references were repaired after review |
| Agent-native review | yes | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | Source-vs-mirror, setup-free SKILL.md, and Ents/`ctx.table` gates from doc-guidelines S8 all pass |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | Issue #369 read; 5-agent investigation + 3 adversarial verifiers, all `refuted: false` | writing |
| Writing | complete | docs, SKILL.md (+mirror), CHANGELOG, `files`, `parseOutput`, tests, changeset | verification |
| Verification | complete | `bun check` EXIT=0; `bun --cwd www build` EXIT=0; 170 server tests | closeout |
| PR / GitHub sync | complete | PR #373 opened onto `main` from `fix/crpc-output-contract-and-diagnostics` | final response |
| Closeout | complete | 4-lens adversarial review (4 confirmed findings, all fixed) + autoreview clean | final response |

Findings:
- Verdict: **partially valid — understated**. Every runtime claim in #369 reproduced and
  survived adversarial refutation (3/3 verifiers returned `refuted: false`).
- 0.23.0 is a **two-sided** change, not a one-sided regression. Proven by running the
  pre-0.23.0 tree (`git archive 13fbae32^`):
  | schema (handler returns `undefined`) | `.output()` pre-0.23.0 | `.output()` HEAD | low-level `returns:` HEAD |
  |---|---|---|---|
  | `z.string().nullable()` | `null` | **THREW** | `null` |
  | `z.null()` | `null` | **THREW** | `null` |
  | `z.string().optional()` | THREW | **`undefined`** | THREW (`received null`) |
  | `z.string().default('x')` | THREW | **`'x'`** | THREW (`received null`) |
  | `z.string().nullish()` / `z.any()` / `z.unknown()` | `null` | `undefined` | `null` |
  So it broke `.nullable()`/`.null()` **and** fixed `.optional()`/`.default()` — but only in
  JS. `.output(z.string().optional())` still cannot be deployed: `zodOutputToConvex` drops
  top-level optionality (`exportReturns()` -> `{"type":"string"}`) and Convex wires an
  `undefined` return as `null`, so the backend raises
  `ReturnsValidationError: Value: null, Validator: v.string()`. Only `.nullable()` (explicit
  `null`) and `.default()` are genuinely usable remedies.
- Mechanism: `builder.ts:875` sets `skipZodReturnsValidation: true`, gating out the
  `value === undefined ? null : value` coercion at `zod4.ts:914`; `builder.ts:921` is then
  the only parse and sees the raw handler value. Both introduced by 13fbae32 (PR #340).
- Types already matched HEAD runtime: `.output()` handlers are typed `Promise<z.input<S>>`
  (builder.ts:1119/1274/1424), so `undefined` was always forbidden. The low-level path's
  `NullToUndefinedOrNull<T> = T extends null ? T | undefined | void : T` (zod4.ts:1012-1041)
  explicitly permits it. 0.23.0 aligned fluent runtime to its long-standing type contract.
- Docs are not merely silent, they are **wrong**: `www/content/docs/server/procedures.mdx`
  callout says "`void`/`undefined` responses are serialized by Convex as `null`", which reads
  as the coercion that `.output()` no longer performs.
- Test gap that let it ship silently: `builder.test.ts:843-853` pins only the *fixed* half
  (`.default()` -> `'fallback'`). Nothing pinned `.nullable()`/`.null()`.
- CHANGELOG is not published at all. Real registry tarballs for 0.22.1 / 0.23.0 / 0.25.1 each
  contain exactly one root entry, `package/package.json`. `files` omits CHANGELOG.md and npm
  only auto-includes package.json / README / LICENSE / main / bin.
- CHANGELOG.md is changesets **prepend-only**, so a hand-edit to the historical 0.23.0 section
  survives future releases.
- Papercut confirmed end to end: `toCRPCError` has no ZodError branch and returns `null`
  (error.ts:291), so `builder.ts:927` rethrows the bare ZodError. It carries no
  `Symbol.for('ConvexError')`, so `serializeConvexErrorData` drops `.data` and the client sees
  an opaque `Server Error`. `.input()` failures wrap into `ConvexError({ZodError})`
  (builder.ts:701-706). HTTP output failures fall to a generic 500.
- Zod v4 issue JSON carries no received values (only expected type names + path), so forwarding
  output issues to the client leaks schema shape, not row data.

Decisions and tradeoffs:
- Fix the docs at the owning boundary (`procedures.mdx` is the sole owner of `.output()`
  semantics) rather than only adding a changelog line. Current-state voice, no changelog voice.
- Amend the historical 0.23.0 CHANGELOG entry rather than inventing a new release note, and
  state **both** directions. Rejected: leaving it, since the entry is what a bisecting user reads.
- Add `CHANGELOG.md` to `files`. Root cause of "no CHANGELOG in the published package".
- Fix the papercut with Option A (a `parseOutput` sibling to `parseInput` in builder.ts).
  Rejected Option B (ZodError branch in `toCRPCError`): it cannot tell input, output, and
  handler-body ZodErrors apart and would change `builder.test.ts:1163-1178` behavior.
  Rejected Option C (restore the coercion): it would revert the intentional `.optional()` /
  `.default()` fix and still leaves every other output failure opaque.
- Error code `INTERNAL_SERVER_ERROR`: an output mismatch is a server fault, and it preserves
  the HTTP 500 status the existing http-builder test asserts while replacing the opaque message.
- Pin BOTH halves of the contract in tests, so this class of change cannot ship silently again.
- Out of scope, flagged not fixed: `packages/kitcn` ships no README.md either (npm page is
  blank); the low-level `returns:` coercion is itself wrong for `.optional()`/`.default()`;
  the HTTP builder types output as `z.infer` while the fluent builder uses `z.input`.

Implementation notes:
- `parseOutput` lives in `packages/kitcn/src/server/validation.ts` so the Convex builder and
  the HTTP builder share it. It is deliberately absent from `server/index.ts`, keeping it
  internal. `builder.ts` cannot be imported by `http-builder.ts` (builder already imports it),
  so a shared module was the only non-circular home.
- `safeParseAsync` replaces `parseAsync`; verified equivalent for transforms, defaults, async
  refinements, and non-Zod throws from a `.refine()` (those still propagate).
- `handleHttpError` now logs 5xx server-side. Without it, wrapping the ZodError into a
  `CRPCError` would have *removed* the `console.error` the old fallback branch provided -
  a regression caught in review.
- `zodIssuesToConvexValue` stringifies bigints. `z.bigint().min(5n)` puts a bigint in the
  issue, and plain `JSON.stringify` throws on it, which had replaced the mismatch with a
  `TypeError`. Applied to `parseInput` as well, same bug class, same file neighborhood.

Review fixes:
- **P1 (PR security review).** Client-visible output issues currently include
  custom messages and fields that a `.refine()`/`.superRefine()` callback can
  populate with rejected server output. Accepted: retain only structural
  `code`, `path`, and string `expected` in `error.data.ZodError`; keep the full
  `ZodError` in `cause` for server diagnostics. RED: 4/72 focused failures;
  GREEN: 72/72 after sanitization. Docs/skill/changeset synced; reply pending.
- **P1 (self-inflicted, docs).** The first draft recommended `.output(z.string().optional())`
  for a genuinely-`undefined` return. Proven wrong: `zodOutputToConvex` drops top-level
  optionality (`exportReturns()` -> `{"type":"string"}`) and Convex wires `undefined` as
  `null`, so the deployment raises `ReturnsValidationError: Value: null, Validator: v.string()`.
  Removed from `procedures.mdx`, SKILL.md, and the CHANGELOG amendment; replaced with a callout
  naming the trap. Pinned by a test asserting `exportReturns()` for nullable/optional/nested.
- **P2 (self-inflicted, HTTP).** Wrapping the output ZodError routed it into `handleHttpError`'s
  early return, which serializes only `code`/`message` and never logged - silently removing the
  only diagnostic channel HTTP routes had. Fixed by logging 5xx server-side, pinned by a test.
- **P2 (bigint).** `JSON.stringify` on issues carrying a bigint threw a `TypeError`, degrading
  the diagnostic error back to an opaque one. Fixed with a replacer, pinned by a test.
- **P3 (plan hygiene).** Three `check-complete.mjs` self-references still pointed at the
  pre-rename `2026-08-17-369-...` path, so the required gate reported `goal plan not found`.
- Rejected after refutation: pre-existing gaps in the low-level `returns:` path, the HTTP
  builder's `z.infer` output typing, and `unrecognized_keys` leaking key names.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
- Closeout cwd `/Users/zbeyens/git/better-convex`: merged current `main`
  (`a663e963`) without conflict.
- Security RED/GREEN: builder + HTTP suite 4/72 failed before client issue
  sanitization, then 72/72 passed; custom message/field values do not occur in
  `error.data`, while the full issue remains on the server-side cause.
- `bun test packages/kitcn/src/server/`: 171 pass.
- `bun --cwd packages/kitcn build`: 71 files emitted.
- `bun --cwd www build`: 62 docs routes / 189 static outputs built.
- `npm pack --dry-run --json`: `CHANGELOG.md` present; 110 package entries.
- `diff -qr packages/kitcn/skills/kitcn .agents/skills/kitcn`: empty.
- Agent-native review: PASS. Package skill source owns the contract, the repo
  mirror is exact, and server/docs/package proof is discoverable.
- `bun run lint:slop:delta`: no occurrence-level regression; the server
  directory hotspot reflects the necessary shared `validation.ts` owner.
- `autoreview --mode branch --base origin/main`: clean, patch correct 0.97.
- `bun lint:fix`: 933 files checked, no fixes.
- `NO_PROXY=localhost,127.0.0.1,::1 bun check`: exit 0 across lint, types,
  tests, CLI, Concave, all eight fixtures, verify, and runtime scenarios.
- `bun check` -> EXIT=0. Covers `bun lint`, `bun typecheck` (5/5 turbo tasks), `bun run test`
  (1262 bun + 839 vitest, 0 fail, no type errors), `test:cli`, `test:concave`, `fixtures:check`,
  `test:verify`, and `test:runtime` (11 scenarios incl. expo, next, start, auth smoke).
- `bun test packages/kitcn/src/server/` -> 170 pass / 0 fail.
- `bun --cwd www build` -> EXIT=0, 60 pages; `id="output-validation"` present in built HTML.
- `bun --cwd packages/kitcn build` -> 71 files.
- `npm pack --dry-run --json` -> root entries `['CHANGELOG.md','package.json']` (was
  `['package.json']`).
- `diff -r packages/kitcn/skills/kitcn .agents/skills/kitcn` -> identical.
- Issue claims: reproduced on HEAD and on the pre-0.23.0 tree; 3/3 adversarial verifiers
  returned `refuted: false`.
- Review: 4-lens adversarial workflow (20 agents) -> 4 confirmed findings, all fixed;
  `autoreview --engine claude` -> `no accepted/actionable findings`, `patch is correct (0.85)`.
- Blocked: `autoreview --engine codex` fails with 401 on its websocket from the sanitized
  subprocess env, though a direct `codex exec` authenticates. Environment issue, not the diff.

Final handoff contract:
- PR line: https://github.com/udecode/kitcn/pull/373
- Issue line: Fixes #369
- Confidence line: 95-100%
- Docs lane: API reference + guide/system
- Source-backed claims: every added claim executed against source, the pre-0.23.0 tree, or Convex's runtime
- Content build / parser: `bun --cwd www build` EXIT=0, 60 pages
- Links / demos / previews: heading anchors verified in built HTML
- Browser check: N/A - no rendered UI change
- Outcome: `.output()` contract documented at its owning boundary, 0.23.0 changelog completed and now published,
  output-validation failures diagnosable instead of opaque
- Caveat: `.output(z.<T>().optional())` at top level remains unusable on Convex; documented as a trap, not fixed
- Verified: `bun check` EXIT=0; 170 server tests; autoreview clean

Final handoff / sync:
- PR: #373 https://github.com/udecode/kitcn/pull/373 (branch `fix/crpc-output-contract-and-diagnostics`)
- Issue: not commented; #369 is linked from the PR body
- Browser proof: N/A
- Caveats: see Open risks

Timeline:
- 2026-08-17T21:55:00.274Z Docs goal plan created.
- Investigation: 5 parallel lenses + 3 adversarial verifiers; all issue claims confirmed.
- Implementation: docs, SKILL.md (+mirror), CHANGELOG, `files`, `parseOutput`, tests, changeset.
- Verification: `bun check` EXIT=0 after clearing a cross-workspace port-3211 collision.
- Review: 4-lens adversarial workflow surfaced 4 confirmed findings; all fixed and re-verified.
- Closeout: autoreview clean; agent-native and doc-guideline gates pass.
- PR closeout: merged current main, fixed client issue-data leakage, synced
  docs/skill/changeset, reran all proof, and paused merge only for npm release
  authentication.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Closeout complete; merge paused on npm release authentication |
| Where am I going? | Push security fix/receipts, then merge after `0.25.3` publishes |
| What is the goal? | Document and de-trap the cRPC `.output()` return contract for issue #369 |
| What have I learned? | See Findings |
| What have I done? | See Timeline |

Open risks:
- `.output(z.<T>().optional())` at top level is still accepted by TypeScript and by the JS
  parse, but cannot be deployed, because Convex's returns validator has no top-level optional
  and wires `undefined` as `null`. Documented as a trap and pinned by an `exportReturns()`
  test; making the builder reject or widen it is a public-API decision left to an owner.
- The low-level `returns:` coercion is itself wrong for `.optional()`/`.default()` schemas
  (it substitutes `null`, which those reject). Pre-existing, out of scope for #369.
- `packages/kitcn` still publishes no README, so the npm page stays blank. Separate fix.
- The historical 0.23.0 amendment corrects `CHANGELOG.md` only. The immutable GitHub Release
  body for v0.23.0 still omits it.
