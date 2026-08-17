# require task per pr

Objective:
Require one dedicated `task` run and task plan for every agent-processed PR,
including PRs inside a batch, and keep autoclosure as a per-PR closeout step.

Goal plan:
docs/plans/2026-08-17-require-task-per-pr.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- docs (docs/plans/templates/packs/docs.md)
- agent-native (docs/plans/templates/packs/agent-native.md)

Task source:
- type: user workflow correction after PR #362
- id / link: https://github.com/udecode/kitcn/pull/362
- title: Require task for each PR
- acceptance criteria: enforce the requirement in AGENTS, task, autoclosure,
  plan templates, generated mirrors, and contributor guidance; ship through a
  task-style follow-up PR because #362 was already sealed by GitHub

Timed checkpoint:
- requested duration: N/A
- semantics: N/A
- initial confidence score: 85%
- improvement loop: source/generated/contributor audit, agent-native review,
  autoreview, full gate, exact PR read-back
- final score / loop closure: 99%; source, mirrors, templates, contributor
  discovery, intent checks, agent-native review, and autoreview agree

Completion threshold:
- Canonical rules require one `task` invocation and dedicated task plan for
  every PR an agent authors, reviews, repairs, or merges; batch and autoclosure
  paths cannot substitute; generated mirrors and contributor guidance agree.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-require-task-per-pr.md` passes.

Verification surface:
- Source/generated parity after `bun install`; exact policy searches across
  AGENTS/task/autoclosure/template/contributor surfaces; agent-native reviewer;
  final branch autoreview; `bun lint:fix`; `bun check`; task-style PR body and
  exact remote gate/merge read-back.

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
- Source of truth: user correction plus `.agents/AGENTS.md`, `task`, and
  `autoclosure` source rules.
- Allowed edit scope: workflow sources, generated mirrors, plan templates,
  contributor docs, README link, and active proof plans.
- Browser surface: N/A; no rendered product output.
- GitHub issue sync: N/A; follow-up PR links the sealed #362 context.
- Non-goals: product/package behavior, forcing human-only contributors to run
  an agent skill, or retroactively claiming the original batch used `task`.

Output budget strategy:
- Scope searches to workflow sources/mirrors/docs and cap command output; use
  exact parity diffs rather than streaming generated trees.

Blocked condition:
- Stop only if mirror generation cannot reproduce source rules after a clean
  install, required review finds a contradictory owner, or GitHub authority
  prevents the follow-up PR after three verified attempts.

Task state:
- task_type: agent workflow and contributor-doc repair
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: done
- goal_status: complete after exact merge read-back

Current verdict:
- verdict: valid
- confidence: 85%
- next owner: task
- reason: the batch-level autoclosure plan did not establish per-PR task owners

Implementation readiness:
- verdict: ready
- exact owner: `.agents/AGENTS.md`, `.agents/rules/task.mdc`, and
  `.agents/rules/autoclosure.mdc`
- contradiction status: none; current rules recommend task but do not require
  one invocation and plan per PR inside a batch
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: the agent processed the PR batch without `task` per PR
- suggested diagnosis or fix: make per-PR task use mandatory in AGENTS and
  contributor/workflow surfaces
- repro ladder:
  - tests / source-level repro: current task and autoclosure rules allow one
    aggregate batch plan without an explicit per-PR task gate
  - repo-owned automated browser or integration proof: N/A
  - Browser plugin: N/A
  - screenshot / visual proof: N/A
- reproduction verdict: reproduced from canonical workflow text and batch plan
- validity verdict: valid
- best long-term fix boundary: canonical rules plus autoclosure template and
  contributor discovery, then generated mirrors
- harsh honest feedback: aggregate autoclosure is not task ownership; the old
  wording was too weak to prevent exactly this failure
- hard-stop decision: proceed

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-require-task-per-pr.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration |
| Walkthrough baseline for possible UI change | no | N/A: workflow Markdown only |
| Skill analysis before edits | yes | `task`; agent-native review and autoreview required |
| Active goal checked or created | yes | active #329-#342 batch goal; this repair is a linked closeout requirement |
| Source of truth read before edits | yes | user correction, PR #362 state, canonical rules, templates, README |
| Exact per-PR task ownership | yes | this plan owns the single workflow-repair PR created after sealed #362 |
| GitHub comments and attachments read | no | N/A: source is the user's correction; PR #362 state/body were read |
| Video transcript evidence required | no | N/A: no video |
| Pre-solution issue challenge required | yes | valid workflow failure reproduced in canonical text |
| Reproduction verdict before implementation | yes | reproduced: no per-PR task gate existed |
| Repro escalation ladder selected | yes | source audit owns this documentation/rule failure |
| Suggested fix reviewed against durable boundary | yes | fix sources, template, contributor discovery, then regenerate |
| `docs/solutions` checked for non-trivial existing-code work | yes | no workflow solution owner; canonical rules/templates own the fix |
| TDD decision before behavior change or bug fix | no | N/A: rule/docs hard cut, no runtime behavior |
| Branch decision for code-changing task | yes | `codex/require-task-per-pr` from sealed #362 main |
| Release artifact decision | no | N/A: no package delta |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | task requires commit/push/follow-up PR |
| Task-style PR body decision | yes | required PR #270 emoji shape |
| GitHub issue sync expectation decision | no | N/A: no issue |
| Output budget strategy recorded | yes | scoped/capped source and parity reads |
| Docs pack selected | yes | supporting contributor docs and README |
| Docs guidance loaded | yes | root README and docs ownership map |
| Docs lane selected | yes | repository contributor workflow, not www user docs |
| Target docs and nearest sibling docs read | yes | README, AGENTS, task/autoclosure/template owners |
| Docs style doctrine read | no | N/A: no `www/**` docs |
| Documented source owner identified | yes | `.agents` sources; CONTRIBUTING is human discovery owner |
| Agent-native pack selected | yes | applied at plan creation |
| Agent-facing action surface identified | yes | exact PR enters through `task`, then optional autoclosure |
| Source rule versus generated mirror boundary identified | yes | edit `.agents/AGENTS.md` and `.agents/rules/**`; run `bun install` |
| Installed-skill lock versus local-rule owner identified | yes | no installed-skill change; lock N/A |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded; capability map passes with no findings |

Work Checklist:
- [x] If a duration was requested, it is recorded as minimum active work unless
      explicitly marked hard stop; when no better metric exists, initial and
      final confidence scores are recorded.
- [x] Objective includes outcome, completion threshold, verification surface,
      constraints, boundaries, and blocked condition.
- [x] Task source classified with source type, id/link, title, task type,
      acceptance criteria, caveats, likely files/routes/packages, browser
      surface, and root-cause layer.
- [x] Every agent-processed GitHub PR has its own task plan. This plan owns one
      exact PR, owns a not-yet-created PR slice, or records N/A because no PR is
      in scope; a batch plan is not used as a substitute.
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
- [x] Docs pack: docs lane, target docs, nearest sibling docs, and source owner are recorded.
- [x] Docs pack: every named API, import, option, route, component, transform, demo, and preview is source-backed or marked N/A with reason.
- [x] Docs pack: docs use current-state reference voice, not changelog voice.
- [x] Docs pack: links, anchors, and previews target real leaf pages or are marked N/A with reason.
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
| Named verification threshold | yes | Source/mirror/template/doc audit plus repository gate | source audit, intent gates, reviews, and `bun check` pass |
| Exact per-PR task ownership | yes | Record the exact PR and dedicated plan, or the not-yet-created single-PR slice | this plan owns the one follow-up workflow-repair PR |
| Pre-solution issue challenge verdict | yes | Record claim, repro, verdict, boundary | valid; aggregate workflow lacked per-PR gate |
| Repro escalation ladder | yes | Source-level proof; higher layers N/A | canonical text proved the gap; no UI/runtime surface |
| Bug reproduced before fix | yes | Record source repro | task/autoclosure had no mandatory per-PR gate |
| Targeted behavior verification | yes | Source/generated/template audit | exact fixed-string audit passes |
| TypeScript or typed config changed | no | N/A | Markdown only |
| Package exports or file layout changed | no | N/A | no package delta |
| Package manifests, lockfile, or install graph changed | no | N/A | install changed no manifest or lock content |
| Agent rules or skills changed | yes | Run `bun install` and verify generated skill sync | pass; root/Codex/Claude mirrors agree |
| Workspace authority proof | yes | Verify in `/Users/zbeyens/git/better-convex` | source, mirrors, templates, and repo scripts audited here |
| Browser surface changed | no | N/A | no browser surface |
| Browser final proof | no | N/A | no rendered product output |
| UI walkthrough | no | N/A | no UI/rendered output |
| Scaffold or fixture output changed | no | N/A | no scaffold delta |
| Package behavior or public API changed | no | N/A | no changeset required |
| Docs and kitcn skill sync changed | no | N/A | no `www/**` or published kitcn skill change |
| Docs or content changed | yes | Verify source-backed claims and link | CONTRIBUTING claims map to canonical rules; README link resolves |
| High-risk mini gate | yes | Record workflow failure mode and proof | aggregate autoclosure skip; fixed at canonical routes and mandatory plan gates |
| Agent-native review for agent/tooling changes | yes | Run capability review | PASS; no findings after task-template gate repair |
| Local install corruption suspected | no | N/A | no corruption signal |
| Commit created | yes | Stage whole checkout and commit | `c72bbfd5` initial workflow commit; final plan receipt commit follows |
| PR create or update | yes | Push and create/update PR | PR #363 exact head `f6c9549b` passed CI `32011406464`, Vercel, and auto-release |
| Task-style PR body verified | yes | Read back exact PR #270 emoji body | `gh pr view 363 --json body` matches all required fields and has no self-link |
| PR proof image hosting | no | N/A | no browser proof images |
| GitHub issue sync-back | no | N/A | no issue source |
| Final handoff contract | yes | Fill exact PR/confidence/proof/outcome/caveat/design | complete below |
| Final lint | yes | Run `bun lint:fix` | pass; 929 files, no fixes |
| Output budget discipline | yes | Verify scoped/capped output | pass; one broad full-check stream belongs to prior #362 task, not this run |
| Timed checkpoint | no | N/A | no duration |
| Autoreview for non-trivial implementation changes | yes | Run dirty local review | clean, correct 0.99, no actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-require-task-per-pr.md` | pass after final receipt update |
| Docs source-backed claim audit | yes | Verify contributor claims against rules | pass |
| Docs links / routes / previews | yes | Verify README leaf link | `CONTRIBUTING.md` exists at linked path |
| Docs MDX/content parser | no | N/A | no MDX/www change |
| Kitcn docs sync | no | N/A | no www/published skill change |
| Agent source / generated sync | yes | Run install and verify mirrors | pass |
| Installed lock audit | no | N/A | no installed-skill changes |
| Agent action discoverability | yes | Audit AGENTS/task/autoclosure/CONTRIBUTING | pass |
| Helper and template smoke | yes | Verify mandatory task/autoclosure plan gates | both templates expose pending gate and represent exact completion evidence |
| Agent-native review | yes | Close accepted findings | PASS; task-template enforcement gap accepted and fixed |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | user source, PR state, rules/templates/docs read | implementation |
| Implementation | complete | canonical rules, templates, mirrors, contributor docs | verification |
| Verification | complete | intent, source/mirror audit, reviews, and `bun check` pass | commit/PR |
| Commit / PR / GitHub sync | complete | commit pushed; PR #363 task body read back | remote gates/merge |
| Closeout | complete | exact source head gates green; final receipt-only head will be merged | done |

Findings:
- The old workflow recommended `task` but did not require one invocation and
  plan per PR inside a batch.
- Agent-native review found the first repair still lacked a mandatory gate in
  the task-plan template; accepted and fixed.

Decisions and tradeoffs:
- Apply the mandate to agent-processed PRs; human-only contributors can submit
  normally.
- Keep batch plans as ordering owners and autoclosure as closeout only.

Implementation notes:
- Canonical owners are `.agents/AGENTS.md`, task/autoclosure rule sources, and
  repo plan templates. `bun install` regenerated root and skill mirrors.

Review fixes:
- Added the exact per-PR ownership gate to the task template after the
  agent-native review identified that completion was not machine-represented.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Literal-safe source audit used shell backticks in a double-quoted command | 1 | use single-quoted patterns or fixed-string searches | harmless `task: command not found`; rerun safely |
| Used `bunx intent` instead of repo-owned scripts | 1 | run package scripts named in package.json | `bun run intent:validate` and `intent:stale` pass |

Verification evidence:
- `bun install` regenerated root and skill mirrors twice after source edits.
- Fixed-string routing audit and Codex/Claude mirror comparisons pass.
- `bun run intent:validate` and `bun run intent:stale` pass.
- Agent-native review passes after one accepted template-gate fix.
- Local autoreview is clean at 0.99 with no actionable findings.
- `bun check` passes on the final workflow source, mirrors, templates, plans,
  and contributor docs, including all fixtures and runtime scenarios.
- PR #363 head `f6c9549b` passed CI run `32011406464` in 6m03s,
  Vercel, and auto-release run `32011406411` with no release requested.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| existing PR | agent must use task before review/repair/merge | exact PR + dedicated plan rule audit | batch rule allowed aggregate ownership | one task and plan per exact PR | task/AGENTS/autoclosure sources and mirrors | pass |
| new PR | agent task begins before PR number exists | task template ownership gate | no exact single-PR slice gate | one not-yet-created PR slice per task plan | task template constraint/start/completion gates | pass |
| PR batch | batch plan may order but not replace tasks | program/batch and contributor audits | one batch autoclosure could cover all PRs | linked per-PR task plans, sequential task to autoclosure slices | task/autoclosure/AGENTS/CONTRIBUTING | pass |
| autoclosure without task | route back before closeout | autoclosure source/template audit | no prerequisite | missing per-PR task is forbidden, not waived | source, mirror, closure matrix, checklist, completion gate | pass |
| human-only author | submitting without Codex remains allowed | CONTRIBUTING audit | ambiguous scope could burden external contributors | agent mandate only | CONTRIBUTING opening paragraph | pass |

Final handoff contract:
- Commit line: `c72bbfd5 docs: require task per PR`; `f6c9549b` records PR
- PR line: #363 exact source head gates green; final receipt-only head follows
- Issue line: N/A
- Confidence line: 99%
- Flow table:
  - Reproduced: source audit red, browser N/A
  - Verified: source/mirror/template/check/review green, browser N/A
- Browser check: N/A
- Outcome: one agent-processed PR requires one task invocation and plan
- Caveat: #362 was already merged and cannot accept another commit
- Design:
  - Chosen boundary: canonical rules + required plan gates + contributor discovery
  - Why not quick patch: AGENTS-only wording would not constrain task/autoclosure plans
  - Why not broader change: no runtime/CI can reliably prove a skill invocation occurred
- Verified: install parity, intent gates, source audit, agent-native review,
  autoreview, and full repository check
- PR body verified: exact #270 emoji shape read back with `gh pr view 363`

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
- Commit: `c72bbfd5`
- PR: https://github.com/udecode/kitcn/pull/363; exact source gates green
- Issue: N/A
- Browser proof: N/A
- Caveats: #362 was already sealed; #363 is the technically necessary follow-up

Timeline:
- 2026-08-17T08:25:05.242Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Remote closeout |
| Where am I going? | Final receipt-only head gates and exact merge |
| What is the goal? | Require one task invocation and plan per agent-processed PR |
| What have I learned? | Rules need plan gates; prose alone did not prevent aggregate autoclosure |
| What have I done? | Patched sources/templates/docs, regenerated mirrors, proved locally, opened #363 |

Open risks:
- None in the workflow repair. Final merge read-back is an external GitHub
  receipt and cannot be committed inside the PR after it merges.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
