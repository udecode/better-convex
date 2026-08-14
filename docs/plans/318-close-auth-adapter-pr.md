# Close auth adapter PR

Objective:
Close PR 318 without expanding its Better Auth adapter contract; merge only
after deterministic regression proof, review closure, `bun check`, and GitHub
read-back.

Flow mode:
one-shot execution

Goal plan:
docs/plans/318-close-auth-adapter-pr.md

Template:
docs/plans/templates/autoclosure.md

Primary template:
docs/plans/templates/autoclosure.md

Applied packs:
- agent-native (docs/plans/templates/packs/agent-native.md)

Linked plans:
- None.

Completion threshold:
- PR 318 has deterministic proof for model-scoped IDs, pagination/filtering,
  and `jwtCache: false`; zero accepted review findings; full checks pass; the
  auto-release checkbox is off; and the PR is squash-merged.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- Focused auth and auth-nextjs tests, package build/types, deslop,
  `agent-native-reviewer` N/A audit, autoreview, `bun lint:fix`, `bun check`,
  PR/check/merge read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: Better Auth adapter row ownership, pagination/filtering, and
  Next.js JWT-cache forwarding described by PR 318
- allowed repairs: auth/auth-nextjs source and tests plus the living changeset
- unrelated files: preserve; do not treat as blockers
- non-goals: broader Better Auth API redesign, Solid auth work, release policy

Output budget strategy:
- Read exact changed auth files and focused test output; cap review/check logs
  to failing sections; exclude generated/build directories.

Blocked condition:
- Repeated GitHub or environment failure after distinct repair attempts, or a
  finding that requires a new public auth contract.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Active source/plan reconstructed | yes | PR 318 body, commits, changed files, and CI read |
| Intended delta and exclusions recorded | yes | Objective and Boundaries above |
| Closure matrix classified | yes | Matrix below |
| GitHub delivery expectation recorded | yes | Disable auto-release, squash-merge, read back |
| Active goal checked or created | yes | Linked from active batch goal |
| Agent-native pack selected | yes | Materialized by governing autoclosure skill |
| Agent-facing action surface identified | no | N/A: runtime adapter behavior, no agent action changed |
| Source rule versus generated mirror boundary identified | no | N/A: no rule or generated skill mirror changed |
| Installed-skill lock versus local-rule owner identified | no | N/A: no skill membership change |
| `agent-native-reviewer` loaded or waiver recorded | yes | Loaded; child applicability is N/A |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| source behavior | yes | Focused auth/auth-nextjs tests | passed: 12 Vitest + 93 Bun |
| package/API/build | yes | `bun --cwd packages/kitcn build` and typecheck | passed |
| generated output | no | N/A: no generated owner touched | N/A |
| fixtures/scenarios | no | N/A: adapter source does not change scaffold output | N/A |
| docs/package skill | no | N/A: no public docs or package skill changed | N/A |
| changeset | yes | `.changeset/auth-adapter-wrong-rows.md` audit | passed: patch sections match final behavior |
| agent workflow | no | N/A: no agent workflow/action changed | N/A |
| cleanup/review | yes | Deslop and autoreview | passed: no accepted findings |
| repository check | yes | `bun check` | passed |
| GitHub delivery | yes | PR 318 update/merge/read-back | passed: squash merge `eddfc083` |

Work Checklist:
- [x] Intended behavior and exclusions are reconstructed from real sources.
- [x] Each lane is proven or N/A with a concrete reason.
- [x] Generated output is N/A: no generated owner is touched.
- [x] Package build and living changeset match the final behavior; docs/skill/
      fixtures/scenarios are N/A for this runtime-only delta.
- [x] Accepted cleanup and review findings are closed.
- [x] PR body and check state match the final evidence.
- [x] Residual blocker/waiver has exact evidence and next owner: none.
- [x] Agent-native pack: no rule or generated skill mirror is changed.
- [x] Agent-native pack: no agent action is changed, so discoverability is N/A.
- [x] Agent-native pack: `.agents/rules/**` and generated mirrors are N/A.
- [x] Agent-native pack: installed skill state is unchanged.
- [x] Agent-native pack: routing/receipt/eval rows are N/A for runtime adapter behavior.
- [x] Agent-native pack: agent-native review is N/A after applicability audit.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| `bun check` fixture lane stalled in a zero-CPU Start template network fetch | 1 | Interrupt only the inert run; rerun exact fixture gate without TTY | `bun run fixtures:check` passed all 8 fixtures |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Targeted behavior proof | yes | Run focused auth/auth-nextjs tests | passed: 12 Vitest + 93 Bun |
| Source/generated audit | no | N/A: source-only runtime change | No generated mirror |
| Package/docs/scenario closure | yes | Build package and audit changeset; other lanes N/A | package build/typecheck/changeset passed; fixtures and verify passed |
| Deslop | yes | Run changed-file cleanup review | passed: zero net findings; no worthwhile cleanup |
| Agent-native reviewer | no | N/A: no agent-facing action changed | Applicability audit recorded |
| Final lint | yes | Run `bun lint:fix` | passed: 876 files, no fixes |
| Repository check | yes | Run `bun check` | passed end to end |
| GitHub delivery | yes | Update checkbox/branch, squash-merge, read back | passed: auto-release off; CI/Vercel green; merge `eddfc083` |
| Autoreview | yes | Resolve every accepted actionable finding | passed: clean branch review, confidence 0.98 |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/318-close-auth-adapter-pr.md` | passed after merge read-back |
| Agent source / generated sync | no | N/A: no agent source or mirror change | N/A |
| Installed lock audit | no | N/A: no skill state change | N/A |
| Agent action discoverability | no | N/A: no agent action change | N/A |
| Helper and template smoke | no | N/A: no workflow helper/template change | N/A |
| Agent-native review | no | N/A after loaded-skill applicability audit | No agent surface |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | completed | PR contract/files/checks and proof gap reconstructed | repair |
| Repair | completed | deterministic Vitest forwarding proof added | review |
| Review/checks | completed | focused tests/build/types/lint/fixtures/verify/runtime, autoreview, and `bun check` passed | delivery |
| Delivery | completed | PR body synchronized, auto-release disabled, CI/Vercel green, squash merge `eddfc083` read back | final audit |
| Closeout | completed | no residual findings or blockers | final |

Verification evidence:
- PR 318 CI rerun `31827131380` passed before local repair.
- `bunx vitest run --project integration packages/kitcn/src/auth-nextjs/index.vitest.ts packages/kitcn/src/auth/adapter-utils.vitest.ts packages/kitcn/src/auth/adapter.vitest.ts` -> 3 files, 12 tests, type errors clean.
- Focused Bun auth/CLI command -> 93 pass, 0 fail.
- `bun --cwd packages/kitcn build` and `bun typecheck` -> passed.
- `bun lint:fix` -> 876 files, no fixes.
- `bun run lint:slop:delta` -> finding count unchanged, score +0.12; only existing auth directory fan-out hotspot.
- `bun run fixtures:check` -> all 8 fixtures match fresh output after one transient network-stall retry.
- `bun run test:verify` -> passed.
- `bun run test:runtime` -> passed; supported scenarios started and auth smoke checks passed.
- Autoreview branch diff against `kitcn/main` -> clean, no accepted or actionable findings, confidence 0.98.
- `bun check` -> passed end to end, including lint, types, tests, fixtures,
  verify, and runtime scenarios.
- GitHub read-back -> PR 318 merged at 2026-08-14T19:03:07Z as
  `eddfc083de4e1656237f1b871919c9c382eeb67e`; auto-release remained disabled.

Timeline:
- 2026-08-14T18:17:54.453Z Autoclosure plan created.
- 2026-08-14T18:25:00Z Restored deterministic JWT-cache forwarding proof in Vitest.
- 2026-08-14T18:41:00Z Focused/build/lint/fixture/verify proof passed.
- 2026-08-14T20:47:00Z Runtime scenarios and independent autoreview passed; exact final check remains.
- 2026-08-14T20:54:00Z Exact `bun check` passed end to end.
- 2026-08-14T21:03:07Z GitHub CI and Vercel passed; PR 318 squash-merged with auto-release disabled.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Closed |
| Where am I going? | Batch continues with PR 316 |
| What is the goal? | Merge PR 318 with deterministic auth adapter proof and no release trigger |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- None. The removed nondeterministic test was replaced by isolated Vitest proof.

Findings:
- Cross-table ID access can read, update, or delete the wrong model row.
- Current CI is green, but the forwarding regression test was removed.

Decisions and tradeoffs:
- Disable auto-release on this PR so PR 321 can publish the complete batch.

Review fixes:
- Missing deterministic `jwtCache: false` forwarding proof -> accepted -> added
  isolated Vitest assertion and replaced the Bun no-test comment.
