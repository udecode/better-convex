# support better auth 1.7 sync

Objective:
Sync convex-better-auth and resolve KitCN #428; done when fork parity, full
range classification, and one verified PR or evidence-backed no-action verdict
are recorded. This plan owns the sync audit, not implementation.

Flow mode:
one-shot execution

Goal plan:
docs/plans/428-support-better-auth-1-7-sync.md

Template:
docs/plans/templates/sync-convex-auth.md

Primary template:
docs/plans/templates/sync-convex-auth.md

Applied packs:
- none

Linked plans:
- [Issue #428 implementation](docs/plans/428-support-better-auth-1-7.md) - owns
  the one Better Auth 1.7 compatibility PR and package proof.

Completion threshold:
- Fork/upstream refs, behind/ahead counts, exact commit range, upstream diff
  summary, fork sync status, local KitCN surface audit, docs/solutions audit,
  classification ledger, selected slice or no-action verdict, ambiguity
  decisions, delegated `task` prompt/result or N/A reason, and final evidence
  are recorded.
- Closure is legal only when every upstream change in the compared range is
  classified, every non-`no-op` classification has evidence and a decision, the
  fork is fast-forwarded/PR'd or a blocker is recorded, and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7-sync.md` passes.

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
  highest-leverage opportunity is ambiguous and needs user approval.

Issue intake:
- Source: GitHub issue `udecode/kitcn#428`, "Support better-auth 1.7".
- Task type: compatibility feature request plus upstream sync audit.
- Observed claim: KitCN peer-pins `better-auth` below 1.7.
- Reporter interpretation: Better Auth 1.7 account identity, compound indexes,
  stable joins, and device-authorization indexes may require generated
  adapter/schema changes.
- Requested outcome: support Better Auth 1.7; optional 1.7 features are evidence
  for value, not automatic implementation scope.
- Acceptance: prove the pin and actual upstream contract, sync the fork safely,
  classify the complete imported range, implement the highest-risk coherent
  KitCN slice, run owned package/scaffold/auth checks, and open a dedicated PR.
- Likely owners: `packages/kitcn` auth package/templates, generated fixtures,
  auth docs/skill mirrors, and package dependency metadata.
- Browser surface: N/A unless the chosen slice changes rendered behavior.
- Likely root-cause layer: dependency compatibility plus generated auth schema
  ownership; proven by the Better Auth 1.7.1 contract and focused local tests.

Source case matrix:
| Case | Source claim | Smallest honest harness | Before | Expected after | Proof |
|------|--------------|-------------------------|--------|----------------|-------|
| Peer range | KitCN excludes Better Auth 1.7 | inspect package manifests and install resolution | 1.6.18 / `<1.7.0` | 1.7 accepted by owned manifests | 1.7.1 fixture installs and dependency tests green |
| Account issuer | 1.7 requires account `issuer` and backfill | compare Better Auth and convex-better-auth schema contracts to KitCN generation | issuer/index missing | generated contract matches required upstream surface | plain/ORM generator plus uniqueness tests green |
| Plugin indexes | 1.7 adds compound plugin indexes | compare upstream schema generation and KitCN generated schema | `table.indexes` ignored | relevant compound indexes preserved | organization/device generator tests green |
| Stable joins | joins moved to `advanced.database.joins` | inspect upstream adapter/schema API and KitCN wrappers/templates | removed experimental path used | KitCN uses current contract without compatibility glue | adapter option test green |
| Device codes | device and user codes need unique lookup indexes | inspect upstream plugin schema and KitCN generation | indexes absent | relevant unique indexes preserved | plain/ORM generation green |
| Optional features | metadata-only org fetch and session hydration benefit users | classify reachability and ownership | 1.7 excluded | Better Auth-owned APIs structurally compile | React/Solid type proof green; no wrapper added |

Sync refs:
- Fork: `zbeyens/convex-better-auth` via remote `fork`
- Upstream: `get-convex/better-auth` via remote `origin`; npm repository metadata
  resolved the missing GitHub parent metadata.
- Fork branch/ref: `main` / pre-sync `c628916b451a6b4cff0f5464f134475464b1a6da`
- Upstream branch/ref: `main` / `2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee`
- Behind count: 1
- Ahead count: 0
- Exact range: `c628916b451a6b4cff0f5464f134475464b1a6da..2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee`
- Fork sync status: fast-forward pushed
- Post-sync fork ref or PR: `fork/main` = `2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee`

Sync verdict:
- verdict: fork range no-op; issue compatibility slice selected
- selected slice: hard-cut KitCN's owned auth package to Better Auth 1.7.1 and
  implement its table-index, account identity, unique-tuple, and stable joins
  contracts.
- class: compatibility
- decision reason: the imported convex-better-auth commit is e2e-only, but
  issue #428 reproduces against KitCN's vendored runtime/schema owners and is
  higher-priority than optional upstream test infrastructure.
- next owner: `task` plan `docs/plans/428-support-better-auth-1-7.md`

Ambiguity / approval ledger:
| Item | Why ambiguous | Decision | Evidence |
|------|---------------|----------|----------|
| None yet | N/A | N/A | N/A |

Classification ledger:
| Class | Upstream change | Evidence | KitCN surface | Decision |
|-------|-----------------|----------|---------------|----------|
| no-op | `2f9fcf6` changes the upstream e2e provisioning host | exact patch changes only `e2e/backendHarness.js` from `provision.convex.dev` to `api.convex.dev` | none; KitCN does not consume this harness | ignore; optional upstream-only e2e infrastructure |
| compatibility | Better Auth PR #10403 `dbd302e` adds required account `issuer` and unique `(issuer, accountId)` | Better Auth v1.7.1 `get-tables.ts`; local generators ignore `table.indexes`; tests/build/fixtures required; high confidence | dependency owner, both schema generators, compound uniqueness | selected in one compatibility slice |
| compatibility | Better Auth PR #10402 `763a267` adds table-level compound index contracts | Better Auth `DBTableIndex` and `BetterAuthDBSchema.indexes`; local manual/special derivation ignores them; focused generator tests; high confidence | both schema generators and uniqueness helper | selected; merge declared indexes instead of copying plugin-specific lists |
| compatibility | Better Auth PR #10359 `8784c1c` moves joins to `advanced.database.joins` | local adapter still reads `options.experimental?.joins`; adapter test/typecheck; high confidence | shared option normalization for HTTP and DB adapters | selected; hard cut removed option |
| bugfix | Better Auth PR #10059 `49b5cf6` declares unique device/user code indexes | v1.7.1 device schema exposes `indexes`; local generator ignores them; generator/uniqueness tests; high confidence | shared index derivation and compound/single unique enforcement | selected through generic table-index support |
| feature | Better Auth PR #10397 `bb6c102` adds `organization.getOrganization()` | Better Auth client-owned API; install/typecheck is sufficient; high confidence | no KitCN wrapper owner | no separate code; validate through 1.7 client compilation |
| feature | Better Auth PR #8733 `4e8e4c7` adds `hydrateSession` | Better Auth client-owned API; install/typecheck is sufficient; high confidence | no KitCN wrapper owner | no separate code; validate through 1.7 client compilation |

Delegated task prompt:
```md
Implement this convex-better-auth sync opportunity.

Fork: zbeyens/convex-better-auth
Upstream: get-convex/better-auth
Range: c628916b451a6b4cff0f5464f134475464b1a6da..2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee
Behind: 1 commit
Fork sync: fast-forward pushed to 2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee

Opportunity: Support Better Auth 1.7.1 honestly in KitCN's vendored Convex auth package, including table indexes, account identity, compound uniqueness, and stable joins.
Class: compatibility

Evidence:

- Upstream commits: convex-better-auth range contains only e2e URL commit 2f9fcf6 (no-op); Better Auth 1.7 contracts are PRs #10403, #10402, #10359, #10059, #10397, and #8733.
- Upstream diff: exact convex range above plus Better Auth v1.7.1 tag and merge commits listed in the classification ledger.
- Kitcn evidence: packages/kitcn peers below 1.7; supported dependency is 1.6.18; adapter reads removed experimental.joins; both schema generators ignore BetterAuthDBSchema.indexes; prior Better Auth 1.6 and upstream-sync solution notes prove KitCN owns a vendored boundary.

Implementation:

- Inspect supported dependency metadata, both auth schema generators, adapter-utils uniqueness, and adapter joins normalization first.
- Hard-cut Better Auth 1.6; add behavior-first tests for exact/peer versions, account issuer and table indexes in Convex/ORM output, compound unique tuples, and advanced.database.joins.
- Let getOrganization and hydrateSession remain Better Auth-owned; prove them through install/type checks, not wrappers.
- Ignore the convex-better-auth e2e harness commit and all optional slow e2e/dev infrastructure.

Acceptance:

- Focused red-green tests for every selected behavior; existing auth client/type suites compile on 1.7.1.
- Update/reuse one KitCN minor changeset with the required account issuer backfill receipt.
- Run bun install, bun --cwd packages/kitcn build, bun run fixtures:sync, bun run fixtures:check, bun typecheck, bun lint:fix, bun check, and final autoreview.
- Open the one task-style PR fixing #428 after verification.

Do not preserve obsolete auth workarounds if the upstream change removes the need for them. Hard cut the hack.
Do not add optional slow e2e suites, broad examples, or dev-only upstream test infrastructure unless the user approved that scope.
```

Completion rule:
- Do not call `update_goal(status: complete)` while any required checklist item
  remains unchecked. If an item does not apply, check it and add `N/A: <reason>`.
- Do not call `update_goal(status: complete)` until the named sync audit
  evidence is recorded below and
  `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7-sync.md`
  passes.
- Do not create hook state for this goal. This file plus the active goal are
  the durable state.

Start Gates:
| Gate | Applies | Evidence |
|------|---------|----------|
| `sync-convex-auth` skill loaded | yes | Read `.agents/skills/sync-convex-auth/SKILL.md` completely. |
| Active goal checked or created | yes | `get_goal` returned none; goal created for this plan. |
| Source of truth read before audit | yes | `gh issue view 428 --repo udecode/kitcn --comments` read issue and zero comments. |
| Fork/upstream discovery strategy selected | yes | Start with `gh repo view` metadata, then npm/local/upstream fallbacks exactly as the skill requires. |
| Output budget strategy recorded | yes | Scoped summaries and patch reads above; generated/build trees excluded unless they become owning proof. |
| Optional-scope approval boundary recorded | yes | No slow e2e, broad fixtures/examples, release plumbing, or dev-only infrastructure without explicit approval. |
| Delegation boundary recorded | yes | This plan owns audit; a separate `task` plan owns the exact implementation PR. |

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
| Fork/upstream identity | complete | Record `gh repo view` or fallback evidence | complete |
| Ref fetch | complete | Fetch fork and upstream refs/tags in `../convex-better-auth` | complete |
| Behind/ahead counts | complete | Record `rev-list --count` results | complete |
| Commit range | complete | Record exact compared range and commit summary | complete |
| Fork sync | complete | Fast-forward/push fork, open fork PR, record already-synced state, or record divergence blocker | complete |
| Post-sync fork proof | complete | Fetch/read post-sync fork ref or record fork PR URL | complete |
| Upstream diff summary | complete | Record `diff --name-status` and relevant patch evidence | complete |
| Local KitCN surface audit | complete | Run/read scoped `rg` across KitCN integration points | complete |
| Institutional note audit | complete | Search/read relevant `docs/solutions` and `docs/plans` notes | complete |
| Classification ledger complete | complete | Every upstream change or file group has class/evidence/decision | complete |
| Ambiguous optional scope | complete | Ask one pointed question or record explicit N/A | complete |
| Selected slice or no-action verdict | complete | Record priority choice, evidence, and confidence | complete |
| Delegated task handoff | complete | Record exact delegated `task` prompt and final handoff, or N/A reason | complete |
| Browser surface changed | complete | Capture Browser proof or record N/A | complete |
| Package/scaffold/docs gates delegated | complete | Ensure delegated prompt includes package build, fixture, docs, or skills checks when applicable | complete |
| Workspace authority proof | complete | Record cwd/tool for every proof surface | complete |
| Autoreview for local implementation patch | complete | Run autoreview if this sync plan itself changes implementation code; otherwise N/A | complete |
| Final output contract | complete | Record terse audit table and delegation/no-action result | complete |
| Output budget discipline | complete | Verify no unbounded high-volume output was streamed, or record recovery | complete |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs docs/plans/428-support-better-auth-1-7-sync.md` | complete |

Phase / pass table:
| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| Setup refs | complete | fork/upstream refs and exact range recorded | fork sync |
| Fork sync | complete | fast-forward pushed `fork/main` to `2f9fcf6` | upstream diff |
| Upstream diff audit | complete | one e2e-only URL commit classified no-op | local impact audit |
| Local KitCN impact audit | complete | dependency, generator, adapter, type, fixture owners read | classification |
| Classification and decision | complete | full ledger selects one compatibility slice | delegated task |
| Delegation / closeout | complete | task plan implemented with all named gates green | final GitHub receipt |

Findings:
- GitHub fork metadata had no parent; npm metadata identifies
  `get-convex/better-auth` as the authoritative repository.
- Pre-sync fork was one commit behind and zero ahead; the range contained only
  `2f9fcf6 Use api.convex.dev, not provision.convex.dev` changing
  `e2e/backendHarness.js`.
- Fork `main` fast-forwarded successfully to `2f9fcf6` without force.
- Issue peer-range claim reproduced: root `package.json` pins `better-auth`
  `1.6.18`; `packages/kitcn/package.json` peers `>=1.6.11 <1.7.0`.

Decisions and tradeoffs:
- Ignore the fork's optional e2e-only URL change after syncing it; importing the
  harness would add no KitCN product proof.
- Implement one KitCN-owned compatibility slice because the issue reproduces
  independently of `@convex-dev/better-auth`.
- Leave organization/session convenience APIs upstream-owned and validate them
  through Better Auth 1.7.1 structural client compilation.

Error attempts:
| Error / failed attempt | Count | Next different move | Resolution |
|------------------------|-------|---------------------|------------|
| Broad auth `rg` across repo streamed 33k tokens before truncation | 1 | Read exact dependency/schema owners and named prior notes only | Narrowed all remaining searches; generated/build paths remain excluded. |
| Shared checkout goal lifecycle was blocked while #399/#400 held package ownership | 1 | Preserve plans and checkpoint, then resume only on explicit release | Fork audit and delegated task completed without checkout collision. |

Timeline:
- 2026-08-25T20:26:14.753Z Sync audit plan created.
- 2026-08-25 Issue #428, VISION.md, docs ownership, named skills, and autogoal
  lifecycle read; measurable goal created; issue claims extracted before audit.
- 2026-08-25 Resolved upstream through npm metadata, fetched both remotes,
  snapshotted the one-commit range, and fast-forward pushed the fork.
- 2026-08-25 Shared checkout pause repeated for three goal turns, so the goal
  tool was marked blocked. After PR #399 merged, the user explicitly released
  the checkout and authorized resumption. The goal tool cannot reopen a blocked
  goal; work continues under this preserved plan with degraded lifecycle state.

Verification evidence:
- In `../convex-better-auth`, both remotes fetched; behind/ahead was `1/0`;
  exact range and patch read; `fork/main` fast-forwarded to `2f9fcf6`.
- In `/Users/zbeyens/git/better-convex`, issue, Better Auth 1.7.1 source/types,
  VISION, local auth owners, and named prior notes were read and classified.
- Delegated task proof: 100 focused tests, React/Solid type proof, package build,
  all fixture families, root typecheck/lint, clean autoreview, and `bun check`.

Final handoff / sync:
- Fork/upstream: `zbeyens/convex-better-auth` / `get-convex/better-auth`.
- Range: `c628916b451a6b4cff0f5464f134475464b1a6da..2f9fcf6c3966bb27d38b2b83e80a1e914ab2a3ee`.
- Decision: fork change is no-op for KitCN; Better Auth 1.7 compatibility slice
  is implemented in the linked task plan.
- Delegated PR: https://github.com/udecode/kitcn/pull/430, owned by
  `docs/plans/428-support-better-auth-1-7.md`.
- Fork sync: direct fast-forward push complete at `2f9fcf6`.
- Caveats: existing KitCN account rows require issuer backfill.

Reboot status:
| Question | Answer |
|----------|--------|
| Where am I? | Final GitHub receipt closeout |
| Where am I going? | Record exact delegated PR and run child/parent completion checkers |
| What is the goal? | Sync the fork, classify the imported range, and deliver one evidenced KitCN #428 PR or no-action verdict. |
| What have I learned? | The fork range is e2e-only, while KitCN's vendored auth owners required the full Better Auth 1.7 schema, adapter, and type compatibility slice. |
| What have I done? | Synced the fork, classified every source case, delegated and verified the KitCN implementation, and preserved the exact evidence boundary. |

Open risks:
- Existing account rows need a correct issuer backfill before deploying the
  required Better Auth 1.7 schema.
