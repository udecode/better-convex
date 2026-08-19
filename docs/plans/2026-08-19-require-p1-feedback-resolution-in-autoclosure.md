# require P1 feedback resolution in autoclosure

Objective:
Make P1 review feedback a blocking autoclosure gate; done when the source rule,
template, generated skill, checks, and dedicated PR all prove the gate.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-08-19-require-p1-feedback-resolution-in-autoclosure.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Task source:
- type: direct user request
- id / link: current Codex task; dedicated PR not yet created
- title: require `resolve-pr-feedback` inside autoclosure
- acceptance criteria: autoclosure must run `resolve-pr-feedback` for every
  compliant PR, block delivery while any actionable P1 remains, permit explicit
  P2 deferral, and record fresh feedback read-back before merge/closeout; repair
  ships in its own task-backed PR before PR #373 feedback work resumes.

Timed checkpoint:
- requested duration: N/A: none requested
- semantics: N/A
- initial confidence score: N/A: binary source/mirror/check/PR receipts
- improvement loop: repair source owner, regenerate, review, check, ship
- final score / loop closure: all binary receipts green

Completion threshold:
- `.agents/rules/autoclosure.mdc` and the project autoclosure template require a
  full `resolve-pr-feedback` pass for compliant PRs, zero unresolved actionable
  P1 findings before delivery, explicit evidence for any P2 deferral, and a
  fresh post-fix feedback read-back.
- Generated `.agents/skills/autoclosure/SKILL.md` matches the source rule; agent
  workflow validation, `bun check`, agent-native review, autoreview, dedicated
  task-style PR creation, and immutable-head task-evidence read-back all pass.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-require-p1-feedback-resolution-in-autoclosure.md` passes.

Verification surface:
- Source audit across `.agents/rules/autoclosure.mdc`,
  `docs/plans/templates/autoclosure.md`, and generated skill.
- `bun install`, intent/skill validation if present, `bun lint:fix`, `bun check`,
  agent-native reviewer, and autoreview.
- Dedicated GitHub PR body/head/plan ownership read-back.

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
- Source of truth: user correction plus `.agents/rules/autoclosure.mdc`.
- Allowed edit scope: autoclosure source rule, project plan template, generated
  mirrors from the approved sync path, and this dedicated plan.
- Browser surface: N/A: agent workflow only.
- GitHub issue sync: N/A: no issue; PR delivery/read-back required.
- Non-goals: changing `resolve-pr-feedback` semantics, fixing PR #373 in this
  branch, requiring P2 fixes after the user explicitly defers them, or product
  behavior changes.

Output budget strategy:
- Read exact rule/template/generated files; cap searches with `head`; save long
  review/check output to files and inspect summaries.

Blocked condition:
- GitHub push/PR/read-back unavailable after retries, generated mirror cannot be
  reproduced from the source rule, or checks expose an unrelated decision that
  cannot be safely isolated.

Task state:
- task_type: agent workflow repair
- task_complexity: normal
- current_phase: intake
- current_phase_status: in_progress
- next_phase: implementation
- goal_status: active

Current verdict:
- verdict: ready
- confidence: high
- next owner: task
- reason: exact missed gate and source owner are known

Implementation readiness:
- verdict: ready
- exact owner: `.agents/rules/autoclosure.mdc` plus materialized plan template
- contradiction status: none; current autoclosure reviews locally but does not
  fetch/resolve live GitHub feedback before delivery
- source-listed cases complete: yes; P1 blocks, P2 may be explicitly deferred,
  and feedback must be re-fetched after resolution

Pre-solution issue challenge:
- reporter claim: autoclosure allowed PR #373 to retain an unresolved P1
- suggested diagnosis or fix: invoke `resolve-pr-feedback` as part of autoclosure
- repro ladder:
  - tests / source-level repro: source audit confirms no live-feedback step or
    P1 completion gate in the current rule/template
  - repo-owned automated browser or integration proof: N/A: text workflow
  - Browser plugin: N/A: no browser surface
  - screenshot / visual proof: N/A: no visual surface
- reproduction verdict: valid
- validity verdict: valid
- best long-term fix boundary: autoclosure source rule plus plan template
- harsh honest feedback: local autoreview cannot substitute for unresolved
  GitHub review feedback; delivery was permitted too early
- hard-stop decision: proceed with narrow workflow repair

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-require-p1-feedback-resolution-in-autoclosure.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | No duration requested |
| Walkthrough baseline for possible UI change | no | N/A: no UI/rendered output |
| Skill analysis before edits | yes | `task`, `autogoal`, `autoclosure`, and `resolve-pr-feedback` read |
| Active goal checked or created | yes | Existing release goal is paused; latest user explicitly authorizes this repair and mismatch is recorded here |
| Source of truth read before edits | yes | User request, current autoclosure rule/template, and PR #373 feedback read |
| Exact per-PR task ownership | yes | This plan owns one not-yet-created workflow-repair PR |
| GitHub comments and attachments read | yes | PR #373 feedback fetched; one unresolved P1 proves the miss |
| Video transcript evidence required | no | N/A: no media |
| Pre-solution issue challenge required | yes | Validity and durable owner recorded above |
| Reproduction verdict before implementation | yes | Valid source-level repro |
| Repro escalation ladder selected | yes | Source audit is the owning proof; browser lanes N/A |
| Suggested fix reviewed against durable boundary | yes | Source rule + template, not generated skill hand-edit |
| `docs/solutions` checked for non-trivial existing-code work | no | N/A: agent workflow rule repair |
| TDD decision before behavior change or bug fix | no | N/A: static workflow contract; smoke/source audits own proof |
| Branch decision for code-changing task | yes | `codex/autoclosure-p1-feedback-gate` from current `origin/main` |
| Release artifact decision | no | N/A: no published package change |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | Commit, push, and dedicated PR required |
| Task-style PR body decision | yes | PR #270 task body required |
| Task-plan PR body evidence | yes | Plan line/head/exact PR read-back after PR creation |
| GitHub issue sync expectation decision | no | N/A: no issue |
| Output budget strategy recorded | yes | Narrow reads/capped searches/summary artifacts above |
| Agent-native pack selected | yes | Materialized in this plan |
| Agent-facing action surface identified | yes | Autoclosure feedback triage, repair, replies, resolution, delivery block |
| Source rule versus generated mirror boundary identified | yes | Edit `.agents/rules`, regenerate `.agents/skills` via `bun install` |
| Installed-skill lock versus local-rule owner identified | no | N/A: local repo rule, no skills CLI install |
| `agent-native-reviewer` loaded or waiver recorded | yes | Required after implementation, before closeout |

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
- [ ] Agent-native pack: source-of-truth rule files are edited instead of generated skill mirrors.
- [ ] Agent-native pack: the changed agent action is discoverable from the skill/rule text.
- [ ] Agent-native pack: generated mirrors are synced when `.agents/rules/**` changed, or N/A reason is recorded.
- [ ] Agent-native pack: installed skills are changed only through
      `npx skills add/update/remove`; local rules/templates/helpers stay source-owned.
- [ ] Agent-native pack: routing, required receipts, placeholder failure,
      completion representability, and forbidden behavior have eval/smoke rows.
- [ ] Agent-native pack: accepted agent-native review findings are fixed or explicitly rejected with reason.

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
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-require-p1-feedback-resolution-in-autoclosure.md` | pending |
| Agent source / generated sync | pending | Run `bun install` when `.agents/rules/**` changed and verify generated mirrors | pending |
| Installed lock audit | pending | Verify expected lock entries and removed skills through CLI-managed state | pending |
| Agent action discoverability | pending | Source-audit the skill/rule path an agent will read | pending |
| Helper and template smoke | pending | Syntax-check helpers and prove incomplete failure/completed representation when applicable | pending |
| Agent-native review | pending | Load `.agents/skills/agent-native-reviewer/SKILL.md` and close accepted findings, or record N/A | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | in_progress | created plan | implementation |
| Implementation | pending | | verification |
| Verification | pending | | closeout |
| Commit / PR / GitHub sync | pending | | final response |
| Closeout | pending | | final response |

Findings:
- Current autoclosure runs deslop, agent-native review, and autoreview but never
  invokes the GitHub `resolve-pr-feedback` workflow or blocks on live P1 state.
- PR #373 has one unresolved P1 despite prior local review/check completion.

Decisions and tradeoffs:
- Make full `resolve-pr-feedback` mandatory for compliant PRs, then encode P1 as
  the non-waivable delivery floor. Explicit user scope may defer P2; silent
  priority downgrades remain forbidden.

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
| unresolved P1 | P1s must never survive autoclosure | rule/template source audit | no GitHub feedback gate | full `resolve-pr-feedback`; zero actionable P1 before delivery | pending | ready |
| explicit P2 defer | user may ignore P2 | rule/template source audit | no priority policy | P2 may remain only with explicit deferral evidence | pending | ready |
| post-fix read-back | delivery needs fresh review state | rule/template source audit | no feedback re-fetch | re-fetch proves P1 count zero | pending | ready |

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
- 2026-08-19T10:19:36.334Z Task goal plan created.

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
