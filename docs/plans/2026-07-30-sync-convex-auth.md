# sync convex auth

Objective:
Sync convex-better-auth fork and ship the highest-leverage kitcn auth slice;
done when fork sync and a verified PR or sourced no-action verdict exist; plan
docs/plans/2026-07-30-sync-convex-auth.md.

Flow mode:
one-shot execution

Goal plan:
docs/plans/2026-07-30-sync-convex-auth.md

Template:
docs/plans/templates/sync-convex-auth.md

Primary template:
docs/plans/templates/sync-convex-auth.md

Applied packs:
- none

Linked plans:
- `docs/plans/2026-07-30-fix-auth-adapter-runtime-sync.md`

Completion threshold:
- Fork/upstream refs, behind/ahead counts, exact commit range, upstream diff
  summary, fork sync status, local KitCN surface audit, docs/solutions audit,
  classification ledger, selected slice or no-action verdict, ambiguity
  decisions, delegated `task` prompt/result or N/A reason, and final evidence
  are recorded.
- Closure is legal only when every upstream change in the compared range is
  classified, every non-`no-op` classification has evidence and a decision, the
  fork is fast-forwarded/PR'd or a blocker is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-sync-convex-auth.md` passes.

Verification surface:
- `gh repo view` or fallback evidence for fork/upstream identity.
- `git -C ../convex-better-auth fetch <fork-remote> --tags` and upstream
  fetch.
- `git -C ../convex-better-auth rev-list --count ...` for behind/ahead counts.
- `git -C ../convex-better-auth log ...` and `git diff --name-status ...`.
- Fork sync proof: fast-forward push result, fork PR URL, already-synced ref, or
  divergent/blocker evidence.
- Patch reads for relevant upstream files.
- Local `rg` surface audit across `packages`, `www`, `.agents`, `docs`,
  `tooling`, `fixtures`, and `example`.
- `docs/solutions` / `docs/plans` note audit.
- Delegated `task` final handoff, or no-action/blocked verdict with evidence.

Constraints:
- Use evidence, not vibes.
- Snapshot the pre-sync compare range, then sync the fork itself when safe.
- Never force push `zbeyens/convex-better-auth`.
- Pull only upstream changes that matter to KitCN auth integration.
- Stop and ask before importing optional e2e suites, broad fixtures, examples,
  release plumbing, or dev-only test infrastructure unless they are the direct
  verification path for the selected required fix.
- Prefer deleting obsolete KitCN glue over adding more glue.
- Do not open a vanity PR when no actionable opportunity exists.
- Do not use this template as the delegated implementation task plan; delegate
  implementation through `task`.

Boundaries:
- Source of truth: `sync-convex-auth` skill, fork/upstream metadata,
  `../convex-better-auth` commits and patches, local KitCN auth surfaces, and
  institutional notes under `docs/solutions` / `docs/plans`.
- Allowed sync-audit scope: fork/upstream refs, upstream diff evidence,
  fork fast-forward/PR state, classification ledger, local surface map, selected
  slice, delegated `task` prompt, and final sync verdict.
- Delegated implementation scope: owned by the delegated `task` plan and PR.
- Browser surface: N/A unless upstream change or local KitCN impact requires
  real browser proof.
- GitHub sync: N/A unless the sync run starts from an issue or PR.
- Non-goals: force-pushing a diverged fork, importing optional test/example
  infrastructure without approval, and coding inside the sync audit plan.

Output budget strategy:
- Use `rg`, `git diff --name-status`, commit summaries, and scoped patch reads
  before broad diffs.
- Cap command output or save large compare data as artifacts.
- Group large upstream ranges by subsystem before reading patches.
- Record only evidence needed to justify relevance, irrelevance, or ambiguity.

Blocked condition:
- Blocked only if upstream cannot be identified after documented fallbacks,
  required fork/upstream refs cannot be fetched, the compare is too large to
  classify without a user-selected bound, the fork has diverged and needs a
  merge/rebase decision, direct fork sync and fork PR creation both fail, or the
  highest-leverage opportunity is ambiguous and needs user approval. The user
  approved the five proven one-line generated fixture refreshes; no current
  blocker remains.

Sync refs:
- Fork: `zbeyens/convex-better-auth`
- Upstream: `get-convex/better-auth`
- Fork branch/ref:
  `main@c8df6790a496ab066f72139be16767c9c235df91`
- Upstream branch/ref:
  `main@c628916b451a6b4cff0f5464f134475464b1a6da`
- Behind count: 7
- Ahead count: 0
- Exact range:
  `c8df6790a496ab066f72139be16767c9c235df91..c628916b451a6b4cff0f5464f134475464b1a6da`
- Fork sync status: `fast-forward pushed`
- Post-sync fork ref or PR:
  `main@c628916b451a6b4cff0f5464f134475464b1a6da`; 0 behind, 0 ahead

Sync verdict:
- verdict: actionable sync completed; KitCN implementation selected
- selected slice: safe `runMutation` context typing plus terminating unbounded
  auth-adapter pagination
- class: compatibility + bugfix
- decision reason: both upstream fixes map directly to copied KitCN owners;
  the pagination bug can hang `count` / unbounded `findMany` above 200 rows,
  while the context type currently exposes mutation-only transaction options
  to action callers on newer Convex versions
- next owner: linked task closeout

Ambiguity / approval ledger:
| Item | Why ambiguous | Decision | Evidence |
|------|---------------|----------|----------|
| Cross-domain client typing | Upstream fixed its own public plugin type, while KitCN carries structural wrappers. | No local patch. | `docs/plans/195-fix-cross-domain-client-types.md` fixes upstream ownership; the local Better Auth 1.6 solution records that KitCN no longer imports or depends on `@convex-dev/better-auth`. |
| Upstream examples and regenerated npm locks | The Resend bump and lock churn do not prove KitCN behavior. | No local patch. | Only `examples/**` manifests/locks changed; KitCN owns different examples and dependency pins. |
| Upstream release / CI maintenance | Releases and checkout action updates are fork maintenance, not KitCN runtime. | No local patch. | `b51ec4d`, `dd9f1ee`, and `c628916` touch workflow/version/changelog/package release surfaces only. |

Classification ledger:
| Class | Upstream change | Evidence | KitCN surface | Decision |
|-------|-----------------|----------|---------------|----------|
| cleanup | `b51ec4d` updates `actions/checkout` to v6. | Frozen-range commit/file summary. | No KitCN auth runtime owner. | No local patch. |
| no-op | `e18fdf4` repairs `crossDomainClient()` typing. | Upstream patch plus `docs/plans/195-fix-cross-domain-client-types.md`. | KitCN structural wrappers in `packages/kitcn/src/auth-client/types.ts` and `packages/kitcn/src/solid/types.ts`; no upstream package dependency. | Keep local wrappers; upstream is the correct owner. |
| no-op | `c176fc4` updates Resend in upstream examples and regenerates locks. | Frozen-range name-status/stat. | No matching KitCN auth runtime behavior. | Do not import example/lock churn. |
| compatibility | `6f940f9` types shared `runMutation` from `GenericActionCtx`. | Upstream `src/utils/index.ts` patch; Convex 1.42 mutation contexts accept transaction options while action contexts do not. | `packages/kitcn/src/server/context-utils.ts` contains the same older `GenericMutationCtx['runMutation']` declaration. | Implement the action-safe common call surface with a type regression. |
| no-op | `dd9f1ee` releases upstream `0.12.4`. | Version/changelog/package metadata only. | KitCN vendors the used runtime surfaces and has no `@convex-dev/better-auth` dependency. | No package bump. |
| bugfix | `38fa19a` fixes unbounded `count` / `findMany` pagination and adds a forward-progress guard. | Upstream adapter patch and 201-row regression test. | `packages/kitcn/src/auth/adapter.ts` has the exact `(limit ?? 200) - docs.length` loop in the shared HTTP/DB pagination owner; existing tests stop below the failing boundary. | Implement at the shared helper with unbounded and no-progress regressions. |
| no-op | `c628916` releases upstream `0.12.5`. | Version/changelog/package metadata only. | No direct package dependency. | No package bump. |

Delegated task prompt:
```md
Use `kitcn:task` and `kitcn:tdd`.

Port the two directly applicable runtime fixes from the frozen
`convex-better-auth` range:

1. In `packages/kitcn/src/server/context-utils.ts`, type
   `RunMutationCtx.runMutation` from `GenericActionCtx` so callers only receive
   the mutation-call shape valid in both mutation and action contexts. Add a
   type regression proving action callers cannot pass mutation-only
   transaction options on Convex versions that expose them.
2. In the shared `packages/kitcn/src/auth/adapter.ts` pagination helper, keep an
   unbounded request budget when no limit exists and abort a non-done page that
   neither advances the cursor nor produces rows/count. Add red regressions for
   a 201-row-equivalent unbounded result and for no forward progress.

Do not add `@convex-dev/better-auth`, copy upstream examples, or alter the
cross-domain wrappers. Add the required KitCN changeset and durable solution
note. Run focused tests/type proof, `bun --cwd packages/kitcn build`,
`bun typecheck`, `bun lint:fix`, final autoreview, and `bun check`. Commit,
push, and open a task-style PR.
```

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until the named sync audit
  evidence is recorded below and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-sync-convex-auth.md`
  passes.
- Do not create hook state for this goal. This file plus the active goal are
  the durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| `sync-convex-auth` skill loaded | yes | Read `.agents/skills/sync-convex-auth/SKILL.md` completely. |
| Active goal checked or created | yes | Previous goal was complete; created the matching sync objective for this plan. |
| Source of truth read before audit | yes | User request, sync skill, `autogoal`, `task`, `VISION.md`, and `docs/README.md` read. |
| Fork/upstream discovery strategy selected | yes | Start with GitHub fork metadata; use npm/local clone/known upstream only as ordered fallbacks. |
| Output budget strategy recorded | yes | File/commit summaries first, scoped patches second; generated/build trees excluded. |
| Optional-scope approval boundary recorded | yes | Slow e2e, broad examples/fixtures, release plumbing, and dev-only infrastructure require user approval unless direct proof for a required fix. |
| Delegation boundary recorded | yes | This plan owns fork sync/audit; a linked `task` child owns any kitcn implementation and PR. |

Work Checklist:
- [x] Objective, threshold, verification surface, constraints, boundaries, and
      blocked condition are filled from the active sync goal.
- [x] Fork, upstream, branches/refs, behind count, ahead count, and exact range
      are recorded.
- [x] Local clone exists or is created, fork/upstream remotes are identified by
      URL, and fork/upstream refs are fetched.
- [x] Fork sync is executed when fast-forward-safe, represented by a fork PR
      when direct push is blocked, or stopped with a recorded blocker when the
      fork diverged.
- [x] Post-sync fork ref or fork PR URL is recorded before KitCN implementation
      delegation.
- [x] Upstream commit list and file summary are read.
- [x] Relevant upstream patches are read; large compares are grouped before
      deep patch review.
- [x] Local KitCN auth surfaces are searched and relevant hits are read.
- [x] `docs/solutions` and `docs/plans` institutional notes are searched and
      relevant hits are read.
- [x] Every upstream change or file group is classified as `security`,
      `compatibility`, `bugfix`, `feature`, `cleanup`, `docs`, `tests`, or
      `no-op`.
- [x] Every non-`no-op` item records commit evidence, diff evidence, local KitCN
      files affected, expected implementation surface, verification command(s),
      confidence, and decision.
- [x] Optional or ambiguous additions are either explicitly approved, rejected,
      or recorded as a blocker before implementation.
- [x] Highest-leverage slice is selected using the skill priority order, or a
      no-action verdict is recorded with evidence.
- [x] Delegated `task` prompt is recorded exactly enough for implementation, or
      N/A reason is recorded because no actionable opportunity exists.
- [x] Final sync output matches the skill output contract before delegation or
      no-action closeout.
- [x] Workspace authority recorded: each proof names the repo/tool that owns the
      evidence.
- [x] Output budget discipline recorded and followed.
- [x] Autoreview decision recorded for any local implementation patch, or N/A
      reason recorded for audit-only/no-local-patch work.

Completion Gates:
| Gate | Applies | Required action | Evidence |
|------|---------|-----------------|----------|
| Fork/upstream identity | yes | Record `gh repo view` or fallback evidence | GitHub parent was null; npm metadata and local remote URLs identify `get-convex/better-auth`. |
| Ref fetch | yes | Fetch fork and upstream refs/tags in `../convex-better-auth` | Both `fork` and `origin` fetches exited 0. |
| Behind/ahead counts | yes | Record `rev-list --count` results | Pre-sync 7 behind / 0 ahead; post-sync 0 / 0. |
| Commit range | yes | Record exact compared range and commit summary | Frozen SHA range and seven commits recorded above. |
| Fork sync | yes | Fast-forward/push fork, open fork PR, record already-synced state, or record divergence blocker | Direct fast-forward push succeeded without force. |
| Post-sync fork proof | yes | Fetch/read post-sync fork ref or record fork PR URL | `fork/main` resolves to `c628916b451a6b4cff0f5464f134475464b1a6da`. |
| Upstream diff summary | yes | Record `diff --name-status` and relevant patch evidence | Seven commits / 17 files grouped; runtime patches read directly. |
| Local KitCN surface audit | yes | Run/read scoped `rg` across KitCN integration points | Read shared adapter, adapter tests, context utility, structural auth wrappers, and dependency ownership notes. |
| Institutional note audit | yes | Search/read relevant `docs/solutions` and `docs/plans` notes | Read prior sync solution, Better Auth 1.6 wrapper solution, prior sync plan, and cross-domain task plan. |
| Classification ledger complete | yes | Every upstream change or file group has class/evidence/decision | Ledger above covers all seven commits and changed file groups. |
| Ambiguous optional scope | yes | Ask one pointed question or record explicit N/A | Optional examples, release plumbing, CI, and upstream-owned cross-domain typing explicitly rejected. |
| Selected slice or no-action verdict | yes | Record priority choice, evidence, and confidence | Compatibility plus infinite-loop bugfix selected; confidence high from exact local source matches. |
| Delegated task handoff | yes | Record exact delegated `task` prompt and final handoff, or N/A reason | Prompt above is ready for linked task execution. |
| Browser surface changed | no | Capture Browser proof or record N/A | N/A: package runtime and type-only behavior; no UI route. |
| Package/scaffold/docs gates delegated | yes | Ensure delegated prompt includes package build, fixture, docs, or skills checks when applicable | Changeset, solution note, package build, typecheck, review, full check, and user-approved generated-fixture checks are required. |
| Workspace authority proof | yes | Record cwd/tool for every proof surface | Upstream Git evidence comes from `../convex-better-auth`; KitCN source evidence comes from this checkout. |
| Autoreview for local implementation patch | yes | Run autoreview if this sync plan itself changes implementation code; otherwise N/A | Linked task final local rereview: TruffleHog clean, no accepted/actionable findings, patch correct at 0.91. |
| Final output contract | pending | Record terse audit table and delegation/no-action result | pending |
| Output budget discipline | yes | Verify no unbounded high-volume output was streamed, or record recovery | One broad PR-comments read and one broad local search were truncated; all subsequent evidence used commit metadata and exact file slices. |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/2026-07-30-sync-convex-auth.md` | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Setup refs | complete | exact refs and range recorded | done |
| Fork sync | complete | fast-forward push; post-sync 0 behind / 0 ahead | done |
| Upstream diff audit | complete | all seven commits and 17 files classified | done |
| Local KitCN impact audit | complete | exact copied owners and institutional notes read | done |
| Classification and decision | complete | compatibility + pagination slice selected | delegated task |
| Delegation / closeout | in progress | review P2 repaired; repeated full `bun check` and final rereview green | ship PR |

Findings:
- Kitcn doctrine favors direct upstream ownership and deletion of obsolete auth
  glue; upstream changes are not actionable merely because the fork was behind.
- GitHub omits fork parent metadata, but npm package metadata, `fork`/`origin`
  clone URLs, and `gh repo view get-convex/better-auth` independently identify
  the upstream.
- The frozen fork ref is exactly the merge base: 7 behind, 0 ahead, so direct
  fast-forward sync is safe.
- Direct push fast-forwarded fork `main` to upstream `c628916`; refetch proves
  0 behind and 0 ahead.
- `38fa19a` fixes an exact local copy bug: after collecting 200 unbounded rows,
  KitCN requests `numItems: 0` while retaining the same cursor and can loop
  forever. The same shared helper drives HTTP and database adapter consumers.
- `6f940f9` narrows the shared `runMutation` surface to the action-safe call
  shape. Convex 1.42 exposes transaction options only from mutation context;
  KitCN currently leaks that mutation-only option through a union that may hold
  an action context.
- The upstream cross-domain type fix was already authored and verified at its
  correct package owner. KitCN intentionally owns structural wrappers and does
  not consume the upstream package.
- The selected KitCN slice is implemented. User-approved targeted syncs changed
  exactly one `lucide-react` dependency line in each of six generated shadcn
  fixtures, and all six matching checks pass.

Decisions and tradeoffs:
- Use one-shot execution: sync the fork safely, classify the frozen pre-sync
  range, then delegate at most one coherent kitcn slice.
- Keep optional upstream test/example infrastructure out unless it is required
  to prove a selected runtime or compatibility fix.
- Ship both directly copied runtime fixes in one bounded auth-correctness task;
  neither needs optional upstream infrastructure or a dependency bump.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Broad `gh pr view --comments` included bot deployment logs and was truncated | 1 | Read PR title/body/files and exact source commits instead | Relevant human-authored fix intent was recovered from commit patches. |
| Broad local auth search produced a capped result | 1 | Read exact owner files and prior plans/solutions | Local ownership and no-op decisions are now sourced. |
| `bun check` reached repeated external shadcn fixture drift | 2 | Regenerated and verified only `next`, then stopped when `next-auth` proved a five-fixture expansion | User approved the five exact one-line generated refreshes. |

Timeline:
- 2026-07-30T11:57:57.509Z Sync audit plan created.
- 2026-07-30T12:00:00Z Proved fork/upstream identity through GitHub, npm, and
  local remote URLs; fetched both remotes and froze the 7-commit range.
- 2026-07-30T12:02:00Z Fast-forward pushed upstream `origin/main` to fork
  `main`; post-sync refetch proves exact equality.
- 2026-07-30T12:16:00Z Classified all seven commits; selected action-safe
  `runMutation` typing and terminating unbounded pagination for task execution.
- 2026-07-30T14:48:00+0200 User approved the five remaining exact generated
  fixture refreshes.
- 2026-07-30T14:53:58+0200 All six affected fixture snapshots match fresh
  generation; final full gate and review remain.

Verification evidence:
- command, `../convex-better-auth`: fetched `fork` and `origin`; fork ref
  `c8df679`, upstream ref `c628916`, behind 7, ahead 0, merge base equals fork.
- command, `../convex-better-auth`: pushed
  `refs/remotes/origin/main:refs/heads/main`; fork now `c628916`, behind/ahead
  both 0.
- command, `../convex-better-auth`: frozen-range log lists seven commits from
  `b51ec4d` through `c628916`; name-status lists 17 changed files.
- source, `../convex-better-auth`: `6f940f9` changes the shared run-mutation
  declaration from mutation to action context; `38fa19a` changes an absent
  limit from 200 to Infinity and adds a no-progress guard.
- source, this checkout: `packages/kitcn/src/server/context-utils.ts` and
  `packages/kitcn/src/auth/adapter.ts` contain the exact pre-fix declarations.
- source, this checkout: prior cross-domain and Better Auth 1.6 notes confirm
  that KitCN owns structural wrappers and no longer imports the upstream
  package.
- command, this checkout: focused runtime/type tests, package build, root
  typecheck, and lint pass; initial review was clean, while final-bundle review
  found and prompted repair of a false-green Convex 1.38 type lane.
- command, this checkout: targeted scenario sync/check passes for all six
  affected shadcn fixtures; each committed change is exactly
  `lucide-react ^1.27.0` to `^1.28.0`.
- command, this checkout: repeated post-fix `bun check` passes all repository
  gates.

Final handoff / sync:
- Fork/upstream: `zbeyens/convex-better-auth` / `get-convex/better-auth`
- Range:
  `c8df6790a496ab066f72139be16767c9c235df91..c628916b451a6b4cff0f5464f134475464b1a6da`
- Fork sync: fast-forward complete; `fork/main` equals upstream at `c628916`.
- Decision: delegate the two exact local runtime matches; skip upstream-owned
  plugin typing, examples, release metadata, and CI churn.
- Decision: pending
- Delegated PR: pending
- Fork sync: pending
- Caveats: pending

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Linked task final review |
| Where am I going? | Commit, PR, remote checks, closeout |
| What is the goal? | Safely sync the fork, classify the frozen upstream range, and ship one useful kitcn auth slice or prove no action. |
| What have I learned? | Two upstream fixes map exactly to shared KitCN owners; the remaining changes are no-ops locally. |
| What have I done? | Fast-forwarded the fork, classified all seven commits, implemented the selected slice, and verified all affected generated fixtures. |

Open risks:
- PR creation and remote checks remain.
