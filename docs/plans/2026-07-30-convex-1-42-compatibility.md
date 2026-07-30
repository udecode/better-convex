# convex 1.42 compatibility

Objective:
Implement the selected Convex 1.42 compatibility hard cut; done when the
obsolete local-upgrade fallback is deleted, dependency consumers are at
1.42.3, checks pass, and a reviewed PR exists.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-07-30-convex-1-42-compatibility.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- docs (docs/plans/templates/packs/docs.md)
- package-api (docs/plans/templates/packs/package-api.md)

Linked plans:
- None.

Task source:
- type: delegated plain task from the parent Convex release audit
- id / link:
  `docs/plans/2026-07-30-convex-release-audit.md#selected-slice`
- title: Convex 1.42 compatibility hard cut
- acceptance criteria: upgrade the canonical Convex pin to `1.42.3`; remove
  the obsolete prompt detector/fallback and dead tests; refresh generated
  dependency consumers and institutional guidance; add breaking changeset
  entries for `kitcn` and `@kitcn/resend`; pass focused tests, package build,
  fixture/scenario checks, `bun check`, autoreview, commit, push, and PR

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A: no timed checkpoint
- initial confidence score: N/A: pass/fail artifact checklist owns completion
- improvement loop: N/A: one-shot task
- final score / loop closure: N/A: exact gates own closure

Completion threshold:
- `SUPPORTED_CONVEX_VERSION`, direct package pins, peer floors, scenario seeds,
  generated fixtures, and lockfile resolve the `1.42.3` contract.
- No `isLocalBackendUpgradePrompt` or hidden `dev --local --skip-push
  --local-force-upgrade` fallback remains in kitcn source/tests.
- The current solution guidance describes Convex 1.42 as the upgrade owner.
- The breaking changeset covers both published packages.
- Focused tests, package build, fixture/scenario validation, `bun check`, and
  autoreview pass; the entire checkout is committed, pushed, and PR'd.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-convex-1-42-compatibility.md` passes.

Verification surface:
- focused `backend-core`/dev and dependency-pin test files selected after source
  inspection
- `rg` source audit for removed fallback symbols/flags and refreshed versions
- `bun --cwd packages/kitcn build`
- `bun run fixtures:sync` and `bun run fixtures:check`
- scenario/dependency checks owned by `tooling/dependency-pins.ts`
- `bun check`, final `autoreview`, commit/push/PR, and PR-body readback

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

Boundaries:
- Source of truth: parent audit, Convex target source/diff, dependency pin
  tooling, `runConvexInitIfNeeded`, focused tests, generated consumers, and
  current `docs/solutions` guidance.
- Allowed edit scope: canonical Convex version owner and generated consumers;
  obsolete local-upgrade fallback/tests; dependency lockfile; one current
  solution note; one changeset; parent/child plan evidence.
- Browser surface: N/A: CLI/package contract only.
- GitHub issue sync: N/A: no issue source.
- Non-goals: wrappers for new Convex features; changes to metadata, auth,
  transaction limits, React providers, or unrelated dependency upgrades.

Output budget strategy:
- Read exact owners and focused test ranges; use `rg` counts/filenames before
  excerpts; cap build/check output; avoid generated/build trees except named
  dependency consumers and fixture receipts.

Blocked condition:
- Stop only if target dependency installation, generated fixture ownership,
  the repository gate, or GitHub PR delivery remains unavailable after the
  repo-prescribed retry path and a distinct retry are recorded.

Task state:
- task_type: compatibility cleanup and dependency upgrade
- task_complexity: non-trivial
- current_phase: verification
- current_phase_status: complete
- next_phase: commit / PR / GitHub sync
- goal_status: active

Current verdict:
- verdict: ready
- confidence: high
- next owner: task
- reason: source, target behavior, local owner, generated ownership, and
  verification commands are known

Implementation readiness:
- verdict: ready
- exact owner: `packages/kitcn/src/cli/supported-dependencies.ts` for the
  version contract; `runConvexInitIfNeeded` for bootstrap behavior
- contradiction status: resolved: old solution/tests model a pre-target prompt
  path; target Convex auto-confirms piped upgrades and rejects `--local`
- source-listed cases complete: yes, recorded below

Pre-solution issue challenge:
- reporter claim: N/A: delegated release opportunity, not a public bug report
- suggested diagnosis or fix: hard-cut the target-invalid fallback
- repro ladder:
  - tests / source-level repro: exact upstream compare and local source/tests
  - repo-owned automated browser or integration proof: N/A: CLI/package task
  - Browser plugin: N/A: no browser surface
  - screenshot / visual proof: N/A: no visual output
- reproduction verdict: source-level contradiction reproduced
- validity verdict: valid
- best long-term fix boundary: dependency owner plus deletion of the dead
  `runConvexInitIfNeeded` branch
- harsh honest feedback: retaining a hidden fallback that the supported CLI
  rejects is compatibility theater
- hard-stop decision: proceed; source evidence is conclusive

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-convex-1-42-compatibility.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: none requested. |
| Skill analysis before edits | yes | Loaded release audit, autogoal, task, and changeset skills; skipped TDD because this hard-cuts dead legacy behavior and repo doctrine forbids removal-theater tests. |
| Active goal checked or created | yes | Continue under the matching parent audit goal; this child plan is linked from it. |
| Source of truth read before edits | yes | Parent audit, target upstream source/diff, local owners/tests, dependency tooling, and solution notes read. |
| GitHub comments and attachments read | no | N/A: no GitHub issue/PR source. |
| Video transcript evidence required | no | N/A: no video. |
| Pre-solution issue challenge required | no | N/A: release compatibility task, not public report. |
| Reproduction verdict before implementation | yes | Upstream `dev.ts` makes `--local` fatal; local source sends it. |
| Repro escalation ladder selected | yes | Source/diff plus focused tests and scenario verification; no browser. |
| Suggested fix reviewed against durable boundary | yes | Delete target-invalid fallback at owner; do not translate or shim. |
| `docs/solutions` checked for non-trivial existing-code work | yes | Read local-upgrade, non-interactive setup, verify, published bootstrap, and prior release-audit notes. |
| TDD decision before behavior change or bug fix | no | N/A: dead legacy branch removal; retain current behavior tests and add no legacy assertions. |
| Branch decision for code-changing task | yes | Created `codex/convex-1-42-compatibility` from `main`. |
| Release artifact decision | yes | Breaking changeset for `kitcn` and `@kitcn/resend` peer-floor hard cut. |
| Browser tool decision for browser surface | no | N/A: no browser surface. |
| Commit / PR expectation decision | yes | Task requires stage entire checkout, commit, push, and PR after passing `bun check`. |
| Task-style PR body decision | yes | Use and read back the required PR #270 emoji body. |
| GitHub issue sync expectation decision | no | N/A: no issue. |
| Output budget strategy recorded | yes | Exact owners, capped output, generated trees only when named. |
| Docs pack selected | yes | Supporting `docs/solutions` guidance changes. |
| Docs guidance loaded | yes | `VISION.md` documentation doctrine and nearest solution notes read. |
| Docs lane selected | yes | Incidental institutional guidance, not `www` user docs. |
| Target docs and nearest sibling docs read | yes | Five release/bootstrap/local-upgrade solution notes read. |
| Docs style doctrine read | no | N/A: no `www/**`; current-state source-backed solution prose applies. |
| Documented source owner identified | yes | Local-upgrade solution note owns the stale institutional guidance. |
| Package/API pack selected | yes | Convex peer floor and CLI bootstrap contract change. |
| Public surface or package boundary identified | yes | `kitcn` and `@kitcn/resend` published peer floors; kitcn CLI bootstrap behavior. |
| Convex entry/import graph impact identified | no | N/A: no Convex function entry imports change. |
| CLI/scaffold/generated impact identified | yes | CLI fallback removed; version pin regeneration updates scenario seeds/fixtures. |
| Release artifact path selected | yes | New `.changeset/*.md`; no active unreleased draft exists. |
| `changeset` skill loaded when `.changeset` is required | yes | Loaded `.agents/skills/changeset/SKILL.md` and source rule. |
| Package build / fixture impact decision recorded | yes | Run kitcn build plus fixture sync/check and scenario/dependency checks. |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded. N/A: no duration.
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
      `N/A` with reason. N/A: release compatibility cleanup.
- [x] Repro escalation ladder followed for bug/behavior claims: focused
      test/source-level repro first when applicable; existing repo-owned
      automated browser or integration proof next when available and useful as
      executable coverage; the repo-approved Browser tool next when tests or
      automation cannot reproduce or cannot model the surface honestly;
      screenshot or explicit visual-proof waiver when visual/native state
      matters. Source/diff is owning proof; no browser surface.
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
      is recorded with reason: canonical dependency owner plus deletion of the
      target-invalid fallback.
- [x] Release artifact requirement recorded: new changeset covers `kitcn` and
      `@kitcn/resend`.
- [x] Final handoff shape decided: task-style PR body and concise final audit
      receipt; issue sync is N/A because no issue backs the task.
- [ ] Commit/PR handling recorded for code-changing work: commit and PR
      completed, no local patch, user explicitly declined, or blocker recorded.
      "User did not separately ask for a PR" is not a valid blocker.
- [ ] PR body shape recorded: PR #270 emoji task-style body used, N/A reason
      recorded, or blocker recorded.
- [x] Branch handling recorded for code-changing work: dedicated
      `codex/convex-1-42-compatibility` branch used.
- [x] Local-env-rot retry policy recorded: N/A, no install-corruption-shaped
      failure occurred.
- [x] Workspace authority recorded: all commands ran from
      `/Users/zbeyens/git/better-convex`; package build used
      `packages/kitcn`.
- [x] Output budget discipline recorded and followed: searches were scoped and
      capped; only the repository's inherently verbose full gate streamed broad
      fixture output.
- [x] High-risk note recorded: raising both peer floors can reject Convex 1.41
      apps, and deleting the fallback can expose a target regression; manifest
      warnings, live Convex scenarios, and the full runtime matrix prove the
      chosen hard cut.
- [x] Review/autoreview target selected from actual diff state:
      `autoreview --mode local`.
- [x] Agent-native review decision recorded: N/A, no `.agents/**`,
      `.claude/**`, `.codex/**`, skill, hook, prompt, or agent-action file
      changed.
- [x] Docs pack: institutional solution lane, replacement note, adjacent
      integration notes, and `runConvexInitIfNeeded` source owner recorded.
- [x] Docs pack: all named Convex flags and behavior are source-backed by the
      target upstream diff/source.
- [x] Docs pack: solution guidance uses current-state reference voice.
- [x] Docs pack: related solution links resolve to real files; no route,
      preview, or anchor surface exists.
- [x] Package/API pack: package peer floors and CLI bootstrap behavior are the
      only published boundaries changed; exports/file layout are unchanged.
- [x] Package/API pack: release artifact matrix requires and includes a
      changeset for both published packages.
- [x] Package/API pack: `changeset` and its source rule were loaded; minor
      breaking entries and a before/after command are present.
- [x] Package/API pack: no-artifact decision is N/A because a published
      behavior delta exists.
- [x] Package/API pack: hard cut is explicit; no compatibility aliases or
      fallback path remain.
- [x] Package/API pack: Convex static function-entry imports are unchanged.
- [x] Package/API pack: CLI command behavior remains deterministic and
      non-interactive; target Convex owns non-TTY upgrade confirmation.
- [x] Package/API pack: N/A, no `www/**` or published kitcn skill guidance
      changed; the solution note is internal institutional guidance.
- [x] Package/API pack: package build, typecheck, 39 focused tests, and full
      `bun check` pass.
- [x] Package/API pack: kitcn build, fixture sync/check, dependency scenarios,
      and the full runtime fixture matrix pass.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | pending | Run the command, proof, source audit, or artifact check named in this plan | Implementation proof is complete; commit/PR/body readback remain. |
| Pre-solution issue challenge verdict | yes | Record reporter claim, suggested fix, repro verdict, validity verdict, durable boundary, and hard-stop/pivot decision before implementation | Release cleanup is valid; upstream source contradicts the retained fallback; proceed with hard cut. |
| Repro escalation ladder | yes | For bug/behavior claims, record test/source-level, automated browser/integration, Browser, and screenshot/visual-proof outcomes or N/A/blocker reasons before `not reproduced` | Upstream source and live CLI scenarios are owning proof; browser/visual proof N/A. |
| Bug reproduced before fix | no | Record failing test/repro or N/A with reason | N/A: compatibility cleanup, not a user bug; exact target source proves the hidden command is fatal. |
| Targeted behavior verification | yes | Run focused test/proof for changed behavior or record N/A | 39 focused tests pass; dependency/scenario upgrade runner and `bun check` pass. |
| TypeScript or typed config changed | yes | Run relevant typecheck | Root `turbo typecheck`: 5/5 tasks passed in both upgrade runner and `bun check`. |
| Package exports or file layout changed | no | Run the relevant package build before final verification and keep generated updates | N/A: no exports or package layout changed; package build still passed. |
| Package manifests, lockfile, or install graph changed | yes | Run `bun install` and relevant package checks | Canonical upgrade ran install/build/fixtures/scenarios/typecheck/lint; full check passed. |
| Agent rules or skills changed | no | Run `bun install` and verify generated skill sync | N/A: no agent-rule or skill diff. |
| Workspace authority proof | yes | Run verification in the owning repo/package/app/route/tool and record cwd; do not count the wrong workspace as proof | Root gates ran in `/Users/zbeyens/git/better-convex`; package build ran through the canonical owner. |
| Browser surface changed | no | Capture Browser Use proof or record explicit waiver/blocker | N/A: package/CLI contract only. |
| Browser final proof | no | Attach screenshot or exact browser verification caveat when browser proof applies | N/A: no browser-visible surface. |
| Scaffold or fixture output changed | yes | Run `bun run fixtures:sync` and `bun run fixtures:check`, or record N/A | Canonical upgrade sync/check passed; `bun check` independently compared all eight fresh fixtures. |
| Package behavior or public API changed | yes | Add a changeset or record why no changeset applies | `.changeset/tidy-convex-upgrade.md` covers `kitcn` and `@kitcn/resend`. |
| Docs and kitcn skill sync changed | no | Keep `www/**` and `packages/kitcn/skills/kitcn/**` in sync, or record N/A | N/A: no public docs or kitcn skill changed. |
| Docs or content changed | yes | For docs-heavy work, use `--template docs`; for incidental docs, verify source-backed claims, links, examples, and rendered output or record N/A | Docs pack applied; target-source claims and related file links verified. |
| High-risk mini gate | yes | For public API/runtime/package-boundary/browser/agent-action/command-contract changes, record realistic failure mode, proof plan, and why the chosen boundary is right; otherwise N/A | Failure modes and proof matrix recorded in checklist; canonical owner avoids duplicate policy. |
| Agent-native review for agent/tooling changes | no | For `.agents/**`, `.claude/**`, `.codex/**`, skills, hooks, commands, prompts, or user-action tooling, load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted/actionable findings, or record N/A | N/A: no agent/tooling-control file changed. |
| Local install corruption suspected | no | Run `bun install` once, rerun the exact failing command, or record N/A | N/A: no corruption-shaped failure. |
| Commit created | pending | For verified code-changing work, stage the entire current checkout per repo policy and create a commit; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| PR create or update | pending | For verified code-changing work, run `check`, push, create or update the PR, and sync PR body to the task-style final handoff; N/A only for no local patch, explicit user decline, analytical/blocked/inconclusive work, or recorded external blocker | pending |
| Task-style PR body verified | pending | Verify the PR body with `gh pr view --json body`; it must preserve auto-release blocks when applicable, must not include a current-PR self-link, and must use the PR #270 emoji format: `🐛 Fixes ...`, `🟢 95-100% confidence`, `Phase / 🧪 Tests / 🌐 Browser` table, and bold emoji Outcome/Caveat/Design/Verified sections | pending |
| PR proof image hosting | no | If PR body needs browser proof, replace local image paths with hosted GitHub URLs or record N/A | N/A: no browser proof applies. |
| GitHub issue sync-back | no | Post concise issue sync after PR exists, or record N/A/blocker | N/A: no issue source. |
| Final handoff contract | pending | Fill the final handoff fields below with exact PR/issue/confidence/tests/browser/outcome/caveats/design/verification content or N/A reason | pending |
| Final lint | yes | Run `bun lint:fix` or scoped equivalent | `bun lint:fix` and `bun check` lint passed. |
| Output budget discipline | yes | Verify no unbounded high-volume command output was streamed, or record the accidental output and recovery | Searches and diffs were scoped/capped; full gate output was bounded by tool token caps. |
| Timed checkpoint | no | If duration was requested, keep improving until elapsed, then finish the current loop cleanly; otherwise N/A | N/A: no duration requested. |
| Autoreview for non-trivial implementation changes | yes | Load `.agents/skills/autoreview/SKILL.md`; use dirty local `--mode local`, branch/PR `--mode branch --base <base>`, or committed slice `--mode commit --commit <ref>` until no accepted/actionable findings, or record N/A for docs-only/trivial/no local patch | Local review clean, zero findings, correctness 0.91. |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-convex-1-42-compatibility.md` | pending |
| Docs source-backed claim audit | yes | Verify docs claims against current source or record N/A | Convex target `dev.ts` and `upgrade.ts` prove every behavioral claim. |
| Docs links / routes / previews | yes | Verify leaf links, routes, anchors, and preview names or record N/A | Both related-solution file targets exist; routes/previews N/A. |
| Docs MDX/content parser | no | Run the relevant `www` docs parser/build for MDX/content changes, or record N/A | N/A: no MDX or `www` content changed. |
| Kitcn docs sync | no | If `www/**` changed, update matching `packages/kitcn/skills/kitcn/**` content or record N/A | N/A: no `www/**` diff. |
| Public API / package boundary proof | yes | Source-audit public API, exports, and package boundary impact | Only peer floors and CLI fallback change; no exports/file layout changed. |
| Convex bundle/import proof | no | Audit affected function-entry static graphs or record N/A | N/A: no Convex function import graph changed. |
| CLI/scaffold/generated proof | yes | Prove command contract and regenerate owned output or record N/A | 35 CLI tests, 4 pin-tool tests, generated fixture comparisons, and live scenario matrix pass. |
| Release artifact classification | yes | Record whether the change is published package behavior/API/types/config/runtime or no published user-visible delta | Published package compatibility/runtime delta for both packages. |
| Published package changeset | yes | If published package users see a delta, load `changeset` and add/update one `.changeset/*.md` per package | Breaking minor changeset added for `kitcn` and `@kitcn/resend`. |
| No release artifact | no | If no artifact is needed, record the exact reason: internal-only, docs-only, agent-only, test-only, or no user-visible delta from `main` | N/A: release artifact required and present. |
| Package typecheck/build/test | yes | Run owning package checks or record N/A with reason | Package build passed; root typecheck passed; 39 focused tests and full suites passed. |
| Fixture/scaffold generation | yes | Run `bun run fixtures:sync` and `bun run fixtures:check` when scaffold output changed, otherwise N/A | Sync/check passed twice through canonical upgrade and full check. |
| Docs/package skill sync | no | Synchronize current-state public guidance or record N/A | N/A: institutional note only; no public docs/skill contract changed. |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | parent audit, target diff/source, local owners/tests/tooling/solutions, and task skills read | implementation |
| Implementation | complete | version owner/consumers upgraded; dead fallback/tests removed; guidance and changeset added | verification |
| Verification | complete | focused tests, build, fixtures, scenarios, lint, typecheck, full check, autoreview | commit / PR |
| Commit / PR / GitHub sync | pending | | final response |
| Closeout | pending | | final response |

Findings:
- Target Convex auto-confirms local backend upgrades for non-TTY stdin.
- Kitcn runs `convex init` with piped stdio, then retains an obsolete fallback
  that target Convex would reject because it includes `--local`.
- Canonical dependency sync already owns direct pins, peers, scenario seeds,
  and fixture generation; edit the owner, not each output.

Decisions and tradeoffs:
- Hard cut the prompt detector/fallback/tests; do not translate `--local` or
  preserve compatibility below the new peer floor.
- Treat the peer-floor rise as breaking for both published packages.
- Update institutional solution guidance only; no `www`/published skill change
  because the CLI's public command surface does not change.

Implementation notes:
- Ran `bun tooling/dependency-pins.ts upgrade convex 1.42.3`; the canonical
  command updated direct pins, peer floors, scenario seeds, generated fixtures,
  and lockfile, then passed install/build/fixture/scenario/typecheck/lint gates.
- Deleted the prompt detector, deployment inference, hidden `dev --local`
  command, and two legacy synthetic tests from the `runConvexInitIfNeeded`
  owner.
- Replaced the obsolete solution note and updated its two inbound references.
- Added the required breaking changeset for both published packages.

Review fixes:
- None. `autoreview --mode local` returned zero findings and 0.91 correctness
  confidence.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Focused test command initially omitted `./` for the root tooling test | 1 | Run `bun test ./tooling/dependency-pins.test.ts` explicitly | 4/4 passed. |
| Five dependency warning assertions still encoded the 1.38 contract | 1 | Update current-behavior fixtures/expectations to 1.42 and rerun | 35/35 CLI/dependency tests passed. |

Verification evidence:
- `bun tooling/dependency-pins.ts upgrade convex 1.42.3` -> install, package
  build, eight fixture sync/check lanes, broad dependency/scenario checks,
  Concave smoke, 5/5 typecheck tasks, and lint passed.
- `bun test packages/kitcn/src/cli/commands/dev.test.ts
  packages/kitcn/src/cli/supported-dependencies.test.ts` -> 35/35 passed.
- `bun test ./tooling/dependency-pins.test.ts` -> 4/4 passed.
- `rg` audits -> no fallback symbols or executable
  `--local-force-upgrade` path; no `1.38` package manifest remains.
- `bun check` -> lint, 5/5 typecheck tasks, full Bun/Vitest/CLI suites,
  Concave smoke, all eight fresh fixture comparisons, verify smoke, and live
  Expo/Next/Start/Vite/auth/create-convex runtime matrix passed.
- `.agents/skills/autoreview/scripts/autoreview --mode local
  --stream-engine-output` -> clean, zero findings, correctness 0.91.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| target dependency | kitcn supports Convex `1.42.3` | dependency owner, generated consumers, install/build/check | `1.38.0` / `>=1.38` | exact/range/minimum resolve `1.42.3` / `>=1.42` | manifest audit + canonical upgrade + full check | proven |
| local init upgrade | target `convex init` owns piped upgrade confirmation | upstream target source + focused CLI tests | synthetic prompt invokes fatal `dev --local` | no detector or fallback; init result is authoritative | source audit + 35 CLI tests + live scenarios | proven |
| generated scaffolds | canonical version sync owns outputs | fixture sync/check | fixture pins `1.38.0` | fixture pins `1.42.3` | eight sync/check lanes passed twice | proven |
| release contract | both package peer floors rise | changeset + manifest audit | `>=1.38` | `>=1.42` with breaking receipt | manifests + changeset + package build | proven |
| institutional guidance | old note recommends the fallback | source-backed docs audit | stale hidden command | Convex 1.42 is direct owner | replacement note + link/source audit | proven |

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
- 2026-07-30T09:12:25.403Z Task goal plan created.
- 2026-07-30T09:15:00Z Linked task from the parent audit, created the dedicated
  branch, loaded task/changeset rules, and closed implementation start gates.
- 2026-07-30T11:30:00Z Canonical Convex upgrade completed: version consumers,
  package build, fixtures, scenarios, typecheck, and lint passed.
- 2026-07-30T11:33:00Z Focused tests passed 39/39 after updating five stale
  1.38 assertions.
- 2026-07-30T11:34:00Z Autoreview completed clean with zero findings and 0.91
  correctness confidence.
- 2026-07-30T11:40:00Z Full `bun check` passed, including all generated
  comparisons and live runtime smokes.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Implementation and verification complete |
| Where am I going? | Commit/PR/GitHub sync, then mechanical closeout |
| What is the goal? | Remove the target-invalid local upgrade fallback, move the supported Convex contract to 1.42.3, prove generated/package behavior, and ship the PR. |
| What have I learned? | Target Convex owns non-TTY upgrades; canonical dependency tooling owns every generated pin. |
| What have I done? | Upgraded the contract, deleted the dead fallback/tests, refreshed guidance/fixtures/lockfile, added the changeset, and passed focused plus full proof. |

Open risks:
- Convex 1.41 apps must upgrade before consuming the next kitcn release; this
  is the intentional closed-alpha hard cut recorded by the changeset.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
