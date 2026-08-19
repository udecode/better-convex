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
- id / link: PR #377 / https://github.com/udecode/kitcn/pull/377
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
  P1 findings before delivery, deterministic persisted priority/rationale,
  an unfiltered raw inventory for bot/author top-level feedback,
  final-material-push proof replay for resolved/outdated P1s regardless of file
  type, explicit evidence for any P2 deferral, and an exact-head external
  terminal receipt.
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
  mirrors from the approved sync path, the project-owned
  `resolve-pr-feedback` template/ledger required to execute the new gate, this
  dedicated plan, and the six generated fixture manifests whose external
  `shadcn@latest` dependency drift blocked every exact-head CI attempt.
- Browser surface: N/A: agent workflow only.
- GitHub issue sync: N/A: no issue; PR delivery/read-back required.
- Non-goals: changing `resolve-pr-feedback` semantics, fixing PR #373 in this
  branch, requiring P2 fixes after the user explicitly defers them, product
  behavior changes, or hand-editing fixture output instead of regenerating it.

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
- current_phase: live feedback repair
- current_phase_status: in_progress
- next_phase: reply, resolve, re-fetch, exact-head receipt, and merge
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
| Exact per-PR task ownership | yes | PR #377 and this dedicated plan |
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
| Task-plan PR body evidence | yes | PR #377 body names this plan; head file and exact PR owner will be read back after push |
| GitHub issue sync expectation decision | no | N/A: no issue |
| Output budget strategy recorded | yes | Narrow reads/capped searches/summary artifacts above |
| Agent-native pack selected | yes | Materialized in this plan |
| Agent-facing action surface identified | yes | Autoclosure feedback triage, repair, replies, resolution, delivery block |
| Source rule versus generated mirror boundary identified | yes | Edit `.agents/rules`, regenerate `.agents/skills` via `bun install` |
| Installed-skill lock versus local-rule owner identified | no | N/A: local repo rule, no skills CLI install |
| `agent-native-reviewer` loaded or waiver recorded | yes | Required after implementation, before closeout |

Work Checklist:
- [x] Timed checkpoint is N/A because no duration was requested.
- [x] Objective records outcome, threshold, verification, constraints,
      boundaries, and blocked condition.
- [x] Direct user task source and PR #377 ownership are classified above.
- [x] This plan owns exactly PR #377; the batch goal is not substituted.
- [x] Video/transcript evidence is N/A because the task has no media.
- [x] The workflow claim was challenged and reproduced as valid by source audit.
- [x] The source-level repro owns this text workflow; browser and screenshot
      escalation are N/A.
- [x] The valid claim proceeds at the durable source-rule boundary.
- [x] `.agents/AGENTS.md`, root `AGENTS.md`, the source rule, generated skill,
      and project template were read before edits.
- [x] All three source-listed cases have an owner, harness, and verdict.
- [x] Readiness is `ready` with the exact owner recorded above.
- [x] Implementation edits the source rule and reusable plan template, then
      regenerates the installed mirror.
- [x] Release artifact is N/A because no published package changed.
- [x] Final handoff and GitHub task-body shape are recorded below.
- [x] Commit `1b4e6058` and PR #377 exist; final plan receipt commit remains.
- [x] PR #377 uses the PR #270 emoji task-style body.
- [x] PR body names this plan; exact head ownership is verified after the final
      plan receipt push.
- [x] Dedicated branch `codex/autoclosure-p1-feedback-gate` is used.
- [x] Local-env-rot retry is N/A because no corruption signature appeared.
- [x] All proof commands ran in `/Users/zbeyens/git/better-convex`, the owning
      repository.
- [x] Searches were exact/capped; the verbose `bun check` stream was tool-capped
      and later commands returned concise summaries.
- [x] High-risk note: without this gate an unresolved P1 can merge despite
      green local review; source/mirror/template and live PR read-backs prove
      the durable rule boundary.
- [x] Autoreview target is PR #377 against `origin/main`, with P1 width.
- [x] Agent-native review is required and its capability map passes.
- [x] `.agents/rules/autoclosure.mdc` is the edited source of truth.
- [x] The changed action is discoverable from the autoclosure skill and template.
- [x] `bun install` regenerated `.agents/skills/autoclosure/SKILL.md`; Codex and
      Claude mirrors compare equal.
- [x] Installed-skill CLI handling is N/A because this is a repo-local rule.
- [x] Routing, P1 block, explicit P2 defer, final read-back, mirror equality,
      and forbidden delivery behavior have source/smoke rows.
- [ ] Agent-native review and live GitHub feedback have no open P1 gap; three
      newly accepted P1s remain open until their quoted replies, resolutions,
      and fresh read-back succeed.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Named verification threshold | yes | Run the named proof | Source/mirror smoke, intent validation, slop delta, lint, and `bun check` pass |
| Exact per-PR task ownership | yes | Record exact PR and plan | PR #377 / this plan |
| Pre-solution issue challenge verdict | yes | Record verdict and boundary | Valid; source rule + project template |
| Repro escalation ladder | yes | Record owning repro and N/A lanes | Source audit valid; browser/visual N/A |
| Bug reproduced before fix | yes | Record failing source repro | Current rule had no live-feedback/P1 gate; PR #373 retained one P1 |
| Targeted behavior verification | yes | Run focused proof | Required-token audit across rule/skill/template passes |
| TypeScript or typed config changed | no | N/A | No TypeScript/config change |
| Package exports or file layout changed | no | N/A | No package surface change |
| Package manifests, lockfile, or install graph changed | no | N/A | `bun install` reported no dependency change |
| Agent rules or skills changed | yes | Regenerate and compare | `bun install`; source/generated body and Claude symlink compare equal |
| Workspace authority proof | yes | Use owning repo | All commands ran in `/Users/zbeyens/git/better-convex` |
| Browser surface changed | no | N/A | No browser surface |
| Browser final proof | no | N/A | No browser surface |
| UI walkthrough | no | N/A | No UI or rendered output |
| Scaffold or fixture output changed | yes | Regenerate and verify snapshots | `bun run fixtures:sync`; `bun run fixtures:check` passes for all six fixture lanes |
| Package behavior or public API changed | no | N/A | No published package change; no changeset |
| Docs and kitcn skill sync changed | no | N/A | No `www` or published kitcn skill change |
| Docs or content changed | yes | Verify internal workflow content | Source audit and full lint pass |
| High-risk mini gate | yes | Record failure mode/proof/boundary | Unresolved P1 could merge; live read-back gate at autoclosure owner prevents it |
| Agent-native review for agent/tooling changes | yes | Close findings | Incomplete: latest live review added three accepted P1s |
| Local install corruption suspected | no | N/A | No corruption signature |
| Commit created | yes | Commit verified change | `1b4e6058` plus final plan receipt commit |
| PR create or update | yes | Push and sync body | PR #377 created with task-style body |
| Task-style PR body verified | yes | Read back body | `gh pr view 377 --json body` receipt required before final checker |
| PR task evidence verified | yes | Verify body/head/exact owner | Final head read-back required before final checker |
| PR proof image hosting | no | N/A | No images |
| GitHub issue sync-back | no | N/A | No issue |
| Final handoff contract | yes | Fill fields below | Filled for PR #377 |
| Final lint | yes | Run formatter | `bun lint:fix` passes |
| Output budget discipline | yes | Record stream handling | Searches capped; long check tool-capped, then concise summaries used |
| Timed checkpoint | no | N/A | No duration requested |
| Autoreview for non-trivial implementation changes | yes | Run branch review at P1 width | Incomplete: rerun after the latest P1 fixes freeze |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-08-19-require-p1-feedback-resolution-in-autoclosure.md` | Incomplete until replies, resolutions, fresh inventory, and exact-head receipt |
| Agent source / generated sync | yes | Run install and compare | PASS |
| Installed lock audit | no | N/A | Repo-local rule; no installed-skill mutation |
| Agent action discoverability | yes | Audit agent route | Autoclosure names `resolve-pr-feedback`, severity floor, receipts, and stops |
| Helper and template smoke | yes | Prove contract and incomplete failure | Required-token, raw-inventory, and source/mirror/template audits PASS |
| Agent-native review | yes | Close findings | Incomplete: close the three latest P1s and rerun |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Intake and source read | complete | source rule, template, PR #373 P1, repo instructions read | implementation |
| Implementation | complete | source rule + template + regenerated skill | verification |
| Verification | in progress | earlier proof passed; latest head-binding and conditional-gate edits need regeneration and replay | GitHub feedback |
| Commit / PR / GitHub sync | in progress | PR #377 exists; eight prior P1s closed and three new P1s open | quoted replies and resolutions |
| Closeout | blocked | terminal receipt is invalid while any P1 remains open | fresh inventory after all P1 resolutions |

Findings:
- Current autoclosure runs deslop, agent-native review, and autoreview but never
  invokes the GitHub `resolve-pr-feedback` workflow or blocks on live P1 state.
- PR #373 has one unresolved P1 despite prior local review/check completion.
- PR #377 live review exposed three P1s: exact task ownership was already
  fixed; unlabeled priority needed a deterministic persisted rubric; and
  resolved/outdated P1 proofs needed replay after the final code-changing push.
- P1-width autoreview found a terminal receipt push/fetch loop. The receipt now
  lives as an exact-head PR comment outside the branch and is read back without
  a receipt-only push.
- P1-width autoreview found that "code-changing push" excluded material
  Markdown workflow changes. Proof replay now keys off every material branch
  push regardless of file type.
- Fresh GitHub read-back found that the resolver helper filters recognized bot
  comments. Autoclosure now requires a second unfiltered inventory and
  content-based triage of every helper-excluded item.
- The latest live review found three more P1s: plan completion must remain open
  until its last P1 row closes, feedback gates must be conditional on task
  compliance, and local proof must bind committed HEAD to the immutable PR head.

Decisions and tradeoffs:
- Make full `resolve-pr-feedback` mandatory for compliant PRs, then encode P1 as
  the non-waivable delivery floor. Explicit user scope may defer P2; silent
  priority downgrades remain forbidden.

Implementation notes:
- Added a mandatory full `resolve-pr-feedback` pass, P1-or-higher delivery
  floor, explicit P2-or-lower deferral receipts, and final live re-fetch.
- Materialized the same receipts in `docs/plans/templates/autoclosure.md` and
  regenerated the installed skill with `bun install`.
- The first required live-feedback invocation proved the installed skill's
  named project template was missing. Added
  `docs/plans/templates/resolve-pr-feedback.md` with the exact target,
  inventory, triage, reply/resolution, and read-back ledger the skill requires;
  scratchpad creation then passed.

Review fixes:
- Agent-native review: PASS; no missing route, owner, mirror, proof, or
  discoverability finding.
- Deslop: zero added/worsened findings; no cleanup edit warranted.
- P1 exact task ownership: already fixed by the PR #377 task-source update.
- P1 priority ambiguity: accepted; added P0-P3 consequence rubric, fail-closed
  P1 ambiguity rule, and persisted priority/rationale ledger column.
- P1 resolved-finding regression: accepted; every P1 proof must rerun after the
  final material branch push regardless of file type, even when the thread is
  resolved/outdated.
- P1 terminal receipt loop: accepted; freeze/push versioned state first, then
  post/read back an exact-head external PR receipt with no receipt-only push.
- P1 narrow push trigger: accepted; replaced code-only wording with a material
  branch definition covering source, rules, skills, templates, config, plans,
  docs, tests, generated files, and code that affect behavior or proof.
- P1 filtered bot feedback: accepted; added raw API inventory/comparison for
  top-level comments and review bodies, with content-based dismissal only.
- P1 terminal head race: accepted; after reading the receipt back, re-fetch the
  live PR head and require the same OID or restart the final proof cycle.
- P1 incomplete raw ledger: accepted; added the second Codex review wrapper so
  every raw comment/review item is content-triaged.
- P1 post-receipt feedback race: accepted; after receipt/head verification,
  re-fetch helper and raw feedback and restart for any actionable P1.
- P1 self-ledger loop: accepted; only the exact current-run receipt is exempt
  after URL/body/OID read-back, never arbitrary marker-bearing comments.
- P1 lower-priority receipt drift: accepted; any other new unrecorded URL,
  including P2/P3, invalidates or externally supersedes the receipt.
- P1 resolved-thread inventory gap: accepted; raw GraphQL pagination now
  inventories all inline threads without resolved/outdated filtering.
- P1 premature plan completion: accepted; completion rows remain incomplete
  while any ledger P1 awaits a quoted reply, resolution, or fresh read-back.
- P1 noncompliant-path contradiction: accepted; live-feedback gates apply only
  after task compliance, while the required comment/CLOSED path records N/A.
- P1 stale or unrelated proof checkout: accepted; local committed HEAD must
  equal both the fetched immutable PR ref and live `headRefOid` before proof,
  reply, resolution, and terminal delivery.
- P2 author reply filtering: explicitly deferred by user at
  https://github.com/udecode/kitcn/pull/377#discussion_r3812203164.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| `resolve-pr-feedback` template missing | 1 | Add the project-owned template required by the installed workflow, then rerun the exact helper | Template and PR #377 ledger created successfully |
| Terminal read-back receipt creates another last push | 1 | Move terminal receipt outside the branch and read it back from the PR | Exact-head external PR receipt rule added |
| Final proof trigger excluded workflow Markdown | 1 | Define material branch changes regardless of file type | Source rule and reusable template now cover every behavior/proof-affecting file |
| Helper filtered recognized bot feedback | 1 | Add independent unfiltered GitHub inventory and content-based triage | Source rule and reusable template require raw ID/URL comparison |
| Terminal receipt could race a new push | 1 | Re-fetch live head after comment read-back and compare OIDs | Mismatch invalidates receipt and restarts final proofs |
| One raw review body missing from ledger | 1 | Reconcile every raw item by exact URL | Both Codex wrappers and every helper-excluded raw item are ledgered |
| New P1 can arrive after terminal receipt | 1 | Re-fetch helper/raw feedback after receipt read-back | Any actionable P1 invalidates receipt and restarts final cycle |
| Receipt appears as its own omitted author comment | 1 | Exempt only exact current-run receipt after URL/body/OID read-back | No versioned self-ledger loop; arbitrary markers remain untrusted |
| New lower-priority URL missing from receipt | 1 | Invalidate on every new unrecorded item, not only P1 | Superseding external receipt allowed when no branch fix is needed |
| Resolved inline thread missing from initial ledger | 1 | Inventory all review threads through unfiltered GraphQL pagination | Resolved state changes only mutation need; priority/proof remain required |
| Feedback plan marked complete while its newest P1 row remained open | 1 | Keep work, phase, and completion rows incomplete until reply/resolution/re-fetch | In progress until the three latest P1 threads close |
| Reusable feedback gates contradicted the noncompliant stop path | 1 | Make all live-feedback gates conditional on task compliance | Source/template edits applied; regenerate and verify |
| Local proof could come from a stale or unrelated checkout | 1 | Bind committed local HEAD to fetched immutable PR ref and live OID | Source/template edits applied; exact-head replay pending |
| Exact-head CI fixture check found `lucide-react` drift in Start output | 1 | Rerun the failed CI job once to distinguish registry nondeterminism | Rerun found the same `^1.32.0` to `^1.33.0` drift in Next output; durable drift confirmed |
| Six committed fixtures lagged fresh `shadcn@latest` output | 1 | Use the scenarios-owned sync/check workflow, never hand-edit snapshots | `bun run fixtures:sync` updated six generated manifests; `bun run fixtures:check` passed |

Verification evidence:
- `bun install` -> generated skill refreshed; no dependency change.
- required-token + source/generated byte comparison -> PASS.
- `bun run intent:validate` -> one published skill validated.
- `bun run lint:slop:delta` -> 0 added/worsened findings.
- `bun lint:fix` -> 934 files checked; no fixes.
- Latest local `bun check` -> all Bun tests passed (1277); one unrelated
  randomized aggregate B-tree Vitest seed failed, then the exact owning file
  passed 17/17 on immediate rerun.
- Exact-head Blacksmith attempt 1 -> failed on stale Start fixture
  `lucide-react`; attempt 2 reproduced the same drift in Next, proving it was
  durable rather than random.
- `bun run fixtures:sync` + `bun run fixtures:check` -> six generated fixture
  manifests updated to fresh `shadcn@latest` output and all lanes pass.
- Latest pre-receipt P1-width branch autoreview -> clean, 0.96.
- Initial PR #377 full feedback fetch -> 0 threads, 1 non-actionable
  changeset-bot comment, 0 review bodies.
- Latest full helper/raw read-back -> zero actionable P1; three explicitly
  deferred P2 threads; raw excluded items content-triaged in the child ledger.

Source-listed case matrix:
| Case | Source claim | Harness | Before | Expected after | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| unresolved P1 | P1s must never survive autoclosure | rule/template source audit | no GitHub feedback gate | full `resolve-pr-feedback`; zero actionable P1 before delivery | rule/skill/template carry mandatory gate | pass |
| explicit P2 defer | user may ignore P2 | rule/template source audit | no priority policy | P2 may remain only with explicit deferral evidence | exact URL + user scope required | pass |
| post-fix read-back | delivery needs fresh review state | rule/template source audit | no feedback re-fetch | re-fetch proves P1 count zero | final read-back gate + stop condition | pass |
| unlabeled priority | every actionable item needs a deterministic block/defer decision | rule/template/ledger audit | raw helper output has no derived priority | explicit label or consequence rubric; ambiguity fails closed as P1 | persisted priority/rationale rule and ledger column | pass |
| resolved P1 regression | resolved threads disappear from helper output | rule/template audit | later edits could regress a resolved fix | replay every P1 proof after final material branch push, regardless of file type | proof-replay gate covers resolved/outdated items | pass |
| terminal receipt cycle | recording read-back in branch creates another last push | sequence/source audit | fetch -> plan edit -> push loops | exact-head PR receipt outside branch; no receipt-only push | terminal external receipt gate | pass |
| filtered bot finding | recognized bot posts actionable top-level feedback | source/template + raw API audit | helper omits item before triage | compare unfiltered top-level comments/reviews and ledger omissions | identity cannot dismiss; concrete content rationale required | pass |
| receipt/head race | branch changes after terminal comment | source/template sequence audit | receipt can name a stale OID | re-fetch live `headRefOid` after comment read-back | OID mismatch restarts final proof cycle | pass |
| receipt/feedback race | new comment arrives without a branch push | source/template sequence audit | head equality misses new P1 | re-fetch helper/raw feedback after receipt read-back | any new P1 invalidates receipt | pass |
| receipt self-ledger | receipt is filtered author comment | source/template sequence audit | versioned ledger update creates another receipt | exempt exact current-run URL/body/OID only | no arbitrary marker exemption | pass |
| new deferred item | P2/P3 arrives after receipt | source/template sequence audit | zero-P1 check misses absent URL/deferral | invalidate any new unrecorded URL | supersede receipt externally when no branch change | pass |
| pre-resolved P1 | thread is resolved before autoclosure starts | source/template + all-thread inventory audit | helper returns unresolved only | fetch all threads without resolved/outdated filter | every thread enters ledger/proof replay | pass |
| noncompliant PR | missing task evidence must comment/close/stop | rule/template audit | unconditional feedback gates contradict stop path | mark feedback gates N/A after verified remediation comment and CLOSED state | conditional source/template gates | in progress |
| proof checkout | source proof must belong to exact PR head | immutable-ref/local/live OID audit | local checkout may be stale or unrelated | committed local HEAD equals fetched ref and live `headRefOid` before proof and terminal | exact-head rule/template gate | in progress |
| ledger truthfulness | open P1 cannot coexist with complete plan gates | plan/ledger audit | newest P1 row open while plan completion was checked | completion stays incomplete through reply, resolution, and fresh fetch | parent and child plans are currently incomplete | in progress |

Final handoff contract:
- Commit line: PR #377 branch commits through the final plan receipt commit
- PR line: PR #377
- Issue line: N/A: direct workflow repair
- Confidence line: 95-100% after final autoreview/live-feedback receipts
- Flow table:
  - Reproduced: source audit red; browser N/A
  - Verified: source/mirror, intent, slop, lint, full check green; browser N/A
- Browser check: N/A: no browser surface
- Outcome: autoclosure blocks delivery until exact-PR feedback is resolved and
  a final read-back shows zero actionable P1-or-higher findings.
- Caveat: priority remains source-backed review triage; no duplicate parser.
- Caveat: P2 author top-level reply filtering remains deferred by explicit user
  scope and is recorded in the feedback ledger.
- Design:
  - Chosen boundary: autoclosure source rule + reusable plan template.
  - Why not quick patch: generated skill edits would be overwritten.
  - Why not broader change: `resolve-pr-feedback` already owns feedback
    mechanics; autoclosure adds deterministic severity, sequencing, proof
    replay, and terminal receipt policy.
- Verified: commands listed above; exact-head replay/read-back is recorded in
  the external terminal PR receipt after this versioned plan freezes.
- PR body verified: exactly one task-plan line; fetched head contains this plan
  and identifies PR #377.

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
- Commit: PR #377 branch through the final plan receipt commit
- PR: #377
- Issue: N/A
- Browser proof: N/A
- Caveats: P2-or-lower is deferrable only by explicit user scope.

Timeline:
- 2026-08-19T10:19:36.334Z Task goal plan created.
- 2026-08-19 Source rule and template repaired; installed skill regenerated.
- 2026-08-19 Intent validation, deslop, lint, and full `bun check` passed.
- 2026-08-19 Commit `1b4e6058` pushed and PR #377 created.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | PR #377 latest three P1 repairs |
| Where am I going? | Regenerate, push, reply, resolve, replay proofs, post/read receipt, merge |
| What is the goal? | Make P1-or-higher feedback a blocking autoclosure gate |
| What have I learned? | See Findings |
| What have I done? | Repaired workflow, resolved eight P1s, and applied three newer P1 fixes awaiting proof and resolution |

Open risks:
- GitHub may add live feedback after a push; the repaired gate requires a fresh
  read-back and another resolve cycle before merge.

Hard closeout guard:
- A local-only final response for verified code-changing work is invalid unless
  this plan records an explicit user decline, no local patch, analytical/
  blocked/inconclusive outcome, or a real commit/PR blocker.
