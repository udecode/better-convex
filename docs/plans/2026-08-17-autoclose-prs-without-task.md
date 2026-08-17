# autoclose prs without task

Objective:
Make autoclosure comment on and close any PR without verifiable per-PR `task`
evidence, including a GPT-5.6 high-or-higher effort recommendation.

Goal plan:
docs/plans/2026-08-17-autoclose-prs-without-task.md

Template:
docs/plans/templates/task.md

Primary template:
docs/plans/templates/task.md

Applied packs:
- docs (docs/plans/templates/packs/docs.md)
- agent-native (docs/plans/templates/packs/agent-native.md)

Task source:
- type: user workflow requirement
- id / link: https://github.com/udecode/kitcn/pull/364
- title: Autoclose PRs without task
- acceptance criteria: define verifiable task evidence; comment before close;
  recommend GPT-5.6 with high-or-higher reasoning effort; verify comment and
  closed state; hard-cut the human-only exception; sync all agent mirrors/docs

Timed checkpoint:
- requested duration: N/A
- semantics: N/A
- initial confidence score: 90%
- improvement loop: evidence contract, destructive-path review, mirrors,
  templates, contributor docs, structured review, full gate, GitHub delivery
- final score / loop closure: 99%; exact source head remote gates green

Completion threshold:
- Task and PR-body rules expose verifiable per-PR evidence. Autoclosure checks
  it before all other work, comments with the exact remediation/model guidance,
  closes the PR only after comment success, and reads both actions back.
- Task closure is legal only when the source-of-truth acceptance criteria are
  satisfied or explicitly narrowed, required verification evidence is recorded,
  code-review and release-artifact gates are closed when applicable, verified
  code changes are committed and PR'd unless explicitly declined or blocked,
  task-style PR body sync is complete or marked N/A with reason,
  GitHub issue/PR sync is complete or marked N/A with reason, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-autoclose-prs-without-task.md` passes.

Verification surface:
- Canonical/mirror/source audit; template completion gates; contributor docs;
  install/intent parity; agent-native review; autoreview; `bun check`;
  task-style PR body; exact remote gates and merge read-back.

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
- Comment must succeed before close. Do not infer task execution from author,
  green CI, labels, or prose without a task-plan path and exact-PR ownership.

Boundaries:
- Source of truth: user requirement and canonical task/autoclosure rules.
- Allowed edit scope: AGENTS, task/autoclosure sources and mirrors, plan
  templates, CONTRIBUTING/README discovery, and active proof plans.
- Browser surface: N/A.
- GitHub issue sync: N/A.
- Non-goals: bulk-closing currently open PRs, product/package behavior, cron,
  or weakening review/check requirements for compliant PRs.

Output budget strategy:
- Scope audits to named workflow sources/mirrors/templates/docs; cap review and
  check output; use exact GitHub summaries rather than streaming logs.

Blocked condition:
- Stop only if source/mirror generation disagrees after a clean install, the
  comment-before-close contract cannot be represented safely, or GitHub
  delivery remains unauthorized after three verified attempts.

Task state:
- task_type: agent workflow policy hard cut
- task_complexity: non-trivial
- current_phase: closeout
- current_phase_status: complete
- next_phase: done
- goal_status: complete after exact merge read-back

Current verdict:
- verdict: valid
- confidence: 90%
- next owner: task
- reason: current autoclosure routes back to task but leaves a noncompliant PR open

Implementation readiness:
- verdict: ready
- exact owner: `.agents/rules/autoclosure.mdc`, `.agents/rules/task.mdc`,
  `.agents/AGENTS.md`, and repo plan templates
- contradiction status: user requirement supersedes the current human-only
  exception and route-back-only behavior
- source-listed cases complete: yes

Pre-solution issue challenge:
- reporter claim: autoclosure must close PRs without a task run and explain why
- suggested diagnosis or fix: verify task-plan evidence; comment; close; mention
  GPT-5.6 high-or-higher reasoning effort
- repro ladder:
  - tests / source-level repro: current autoclosure step left noncompliant PRs open
  - repo-owned automated browser or integration proof: N/A; structural policy
  - Browser plugin: N/A
  - screenshot / visual proof: N/A
- reproduction verdict: reproduced in current autoclosure route-back-only text
- validity verdict: valid
- best long-term fix boundary: canonical rules, evidence contract, templates,
  generated mirrors, and contributor discovery
- harsh honest feedback: a requirement without a close action is toothless
- hard-stop decision: proceed

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until every completion threshold
  above is satisfied, final handoff evidence is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-autoclose-prs-without-task.md` passes.
- Do not create hook state for this goal. This file plus the active goal are the
  durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| Timed checkpoint parsed | no | N/A: no duration |
| Walkthrough baseline for possible UI change | no | N/A: no UI/rendered output |
| Skill analysis before edits | yes | user invoked `task` and `autoclosure`; agent-native review/autoreview required |
| Active goal checked or created | yes | dedicated one-PR task plan created |
| Source of truth read before edits | yes | user requirement and current generated task/autoclosure skills |
| Exact per-PR task ownership | yes | this plan owns one not-yet-created workflow PR |
| GitHub comments and attachments read | no | N/A: user prompt is source; no source PR yet |
| Video transcript evidence required | no | N/A: no video |
| Pre-solution issue challenge required | yes | current route-back-only policy reproduced |
| Reproduction verdict before implementation | yes | valid gap in canonical autoclosure source |
| Repro escalation ladder selected | yes | source/mirror/template audit owns proof |
| Suggested fix reviewed against durable boundary | yes | exact evidence + comment-before-close at autoclosure intake |
| `docs/solutions` checked for non-trivial existing-code work | yes | no stronger owner; canonical rules own repository workflow |
| TDD decision before behavior change or bug fix | no | N/A: rule/docs hard cut, no runtime code |
| Branch decision for code-changing task | yes | `codex/autoclose-prs-without-task` from released main |
| Release artifact decision | no | N/A: no package delta |
| Browser tool decision for browser surface | no | N/A: no browser surface |
| Commit / PR expectation decision | yes | task requires commit, push, PR, gates, and merge |
| Task-style PR body decision | yes | include task-plan evidence line in PR body |
| Task-plan PR body evidence | yes | this plan path will be added to the PR body and updated with exact PR number |
| GitHub issue sync expectation decision | no | N/A: no issue |
| Output budget strategy recorded | yes | scoped source/mirror/template audits |
| Docs pack selected | yes | CONTRIBUTING and plan templates support agent workflow |
| Docs guidance loaded | yes | docs ownership map and contributor guidance |
| Docs lane selected | yes | repository workflow docs, not www user docs |
| Target docs and nearest sibling docs read | yes | task/autoclosure templates, CONTRIBUTING, AGENTS |
| Docs style doctrine read | no | N/A: no `www/**` docs |
| Documented source owner identified | yes | `.agents` sources; CONTRIBUTING discovery |
| Agent-native pack selected | yes | applied at plan creation |
| Agent-facing action surface identified | yes | autoclosure compliance intake, comment, close, read-back |
| Source rule versus generated mirror boundary identified | yes | edit `.agents` sources; regenerate with `bun install` |
| Installed-skill lock versus local-rule owner identified | yes | local rules changed; no lock mutation |
| `agent-native-reviewer` loaded or waiver recorded | yes | loaded; two safety findings accepted and fixed |

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
| Named verification threshold | yes | Source/mirror/template audit, reviews, full check | all pass |
| Exact per-PR task ownership | yes | Record exact PR and dedicated plan | this plan owns PR #364 |
| Pre-solution issue challenge verdict | yes | Record claim, repro, verdict, boundary | valid route-back-only gap; hard cut authorized |
| Repro escalation ladder | yes | Source-level proof; higher layers N/A | current rule leaves noncompliant PR open |
| Bug reproduced before fix | yes | Record source repro | autoclosure step 1 routed to task without comment/close |
| Targeted behavior verification | yes | Source/generated/template audit | pass after install regeneration |
| TypeScript or typed config changed | no | N/A | Markdown rules/docs only |
| Package exports or file layout changed | no | N/A | no package delta |
| Package manifests, lockfile, or install graph changed | no | N/A | install produced no manifest/lock delta |
| Agent rules or skills changed | yes | Install and mirror audit | pass |
| Workspace authority proof | yes | Verify in `/Users/zbeyens/git/better-convex` | canonical sources, generated mirrors, docs, templates |
| Browser surface changed | no | N/A | no browser surface |
| Browser final proof | no | N/A | no rendered output |
| UI walkthrough | no | N/A | no UI/rendered output |
| Scaffold or fixture output changed | no | N/A | no scaffold delta |
| Package behavior or public API changed | no | N/A | no changeset |
| Docs and kitcn skill sync changed | no | N/A | no www/published skill change |
| Docs or content changed | yes | Audit current claims | CONTRIBUTING matches canonical rules |
| High-risk mini gate | yes | Prove destructive ordering/authority/idempotency | comment success precedes close; retry reuses comment; closed state stops |
| Agent-native review for agent/tooling changes | yes | Capability/safety review | pass after two accepted findings |
| Local install corruption suspected | no | N/A | no corruption signal |
| Commit created | yes | Stage whole checkout and commit | `117d699e`; exact PR binding `60319be3` |
| PR create or update | yes | Push and create/update PR | PR #364 open on dedicated branch |
| Task-style PR body verified | yes | Read back exact body | required issue, plan, confidence, table, and sections present; no self-link |
| PR task evidence verified | yes | Verify body line, fetched head file, exact owner | exactly one line; `refs/pr/364` contains plan identifying PR #364 |
| PR proof image hosting | no | N/A | no browser images |
| GitHub issue sync-back | no | N/A | no issue source |
| Final handoff contract | yes | Fill exact PR/confidence/proof/outcome/caveat/design | complete below |
| Final lint | yes | Run `bun lint:fix` | pass; 929 files, no fixes |
| Output budget discipline | yes | Scope/cap noisy commands | pass |
| Timed checkpoint | no | N/A | no duration |
| Autoreview for non-trivial implementation changes | yes | Dirty local review | clean, correct 0.98, no actionable findings |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-17-autoclose-prs-without-task.md` | pass after final receipt update |
| Docs source-backed claim audit | yes | Compare CONTRIBUTING with rules | pass |
| Docs links / routes / previews | yes | README contributor link | existing leaf resolves |
| Docs MDX/content parser | no | N/A | no MDX/www change |
| Kitcn docs sync | no | N/A | no www/published skill change |
| Agent source / generated sync | yes | Install and compare mirrors | pass |
| Installed lock audit | no | N/A | no installed-skill change |
| Agent action discoverability | yes | Audit AGENTS/task/autoclosure/CONTRIBUTING | pass |
| Helper and template smoke | yes | Required evidence and disposition gates exist | pass |
| Agent-native review | yes | Close accepted safety findings | pass |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | user source, skills, owners, docs read | implementation |
| Implementation | complete | evidence gate, comment/close path, templates, docs, mirrors | verification |
| Verification | complete | source/mirror/intent/reviews and `bun check` pass | commit/PR |
| Commit / PR / GitHub sync | complete | PR #364 body and task evidence read back | remote gates |
| Closeout | complete | source head gates green; final receipt-only head will be merged | done |

Findings:
- Current autoclosure routed missing task evidence back to task and left the PR
  open, contradicting the requested enforcement.
- Agent-native review found retry duplication and non-open PR ambiguity; both
  were repaired before destructive delivery.

Decisions and tradeoffs:
- Accept only exact body/head/PR-owner evidence; do not infer compliance.
- Comment must succeed before close. Retries reuse the exact comment.
- Do not bulk-apply the new policy during this implementation task.

Implementation notes:
- Canonical `.agents` rules own behavior; install regenerates root, Codex, and
  Claude mirrors. Templates make compliant and noncompliant completion visible.

Review fixes:
- Agent-native P1 accepted: make retries reuse the exact remediation comment
  and stop cleanly for non-open PRs.
- Agent-native P2 accepted: name exact `gh pr view`, fetched PR-head, `git
  show`, comment, close, and read-back proof steps.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| None yet | 0 | | |

Verification evidence:
- `bun install` regenerated all mirrors after each source edit.
- Fixed-string source/mirror audits and mirror comparisons pass.
- `bun run intent:validate` and `bun run intent:stale` pass.
- Agent-native review passes after idempotency and exact-proof repairs.
- Autoreview local is clean at 0.98 with no actionable findings.
- `bun check` passes, including every fresh fixture comparison and runtime
  scenario.
- PR #364 body contains exactly one task-plan line. Its exact fetched head
  contains this plan, which identifies PR #364 in task source and ownership.
- PR #364 head `cf852b2c` passed CI run `32014117778` in 6m26s,
  Vercel, and auto-release run `32014117836` with no release requested.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| compliant PR | task evidence exists | body + fetched head + exact plan owner | route continues | proceed with normal autoclosure | source/template audit | pass |
| missing body line | no verifiable task evidence | body audit | PR stayed open | exact comment, verify, close, verify, stop | comment template and ordered steps | pass |
| missing plan at head | mutable prose only | fetched `pull/<n>/head` + `git show` | could be falsely accepted | same noncompliant close | exact-head rule | pass |
| batch/wrong plan | no exact PR owner | task source/ownership audit | aggregate plan could substitute | same noncompliant close | explicit invalid-evidence rule | pass |
| comment failure | explanation not delivered | `gh pr comment` + read-back | close could be unexplained | leave open and stop | hard stop rule | pass |
| retry | exact comment already exists | comment read-back | duplicate public comments | reuse comment then close/read back | idempotency rule | pass |
| already closed | no action needed | initial state read-back | duplicate comment possible | record and stop | non-open state rule | pass |

Final handoff contract:
- Commit line: `117d699e docs: close PRs without task evidence`
- PR line: #364 exact task evidence verified; source head gates green at `cf852b2c`
- Issue line: N/A
- Confidence line: 98%
- Flow table:
  - Reproduced: source policy red, browser N/A
  - Verified: source/mirror/template/review/check/PR evidence green, browser N/A
- Browser check: N/A
- Outcome: noncompliant PRs get one verified explanation, then close/read-back
- Caveat: policy is not bulk-applied during this task
- Design:
  - Chosen boundary: autoclosure intake plus task evidence and plan templates
  - Why not quick patch: AGENTS-only prose would not define proof or destructive ordering
  - Why not broader change: no CI can prove an unrecorded model invocation
- Verified: install, intent, parity, reviews, full check, exact PR evidence
- PR body verified: `gh pr view 364 --json body`; exact evidence smoke passes

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
- Commit: `117d699e`, `60319be3`
- PR: https://github.com/udecode/kitcn/pull/364
- Issue: N/A
- Browser proof: N/A
- Caveats: no bulk-close in this implementation PR

Timeline:
- 2026-08-17T08:55:01.517Z Task goal plan created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Complete implementation; final GitHub merge receipt next |
| Where am I going? | Final receipt-only head gates and exact merge |
| What is the goal? | Comment and close PRs without verifiable task evidence |
| What have I learned? | Destructive enforcement needs immutable evidence and idempotent ordering |
| What have I done? | Patched sources/templates/docs, regenerated, reviewed, checked, opened compliant #364 |

Open risks:
- None in the workflow policy. Final merge read-back is an external GitHub
  receipt and cannot be committed inside the PR after merge.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
