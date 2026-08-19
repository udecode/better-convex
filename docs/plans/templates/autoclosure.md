# {{TITLE}}

Objective:
TODO: State the already-started work and exact clean/ship threshold.

Goal plan:
{{PLAN_PATH}}

Template:
{{TEMPLATE_PATH}}

Completion threshold:
- TODO: Define the complete closeout matrix.
- No new product scope. Completion requires every applicable lane below to have
  fresh evidence, `bun check` passing, review findings closed, authorized
  GitHub delivery complete, and the goal checker passing.

Verification surface:
- TODO: Name targeted proof, generation, reviews, `bun check`, and PR read-back.

Constraints:
- Finish the intended delta; do not invent the next feature.
- Preserve source/generated/package/docs ownership.
- Use a different diagnostic after repeated failure signatures.

Boundaries:
- intended delta: pending
- allowed repairs: pending
- unrelated files: preserve; do not treat as blockers
- non-goals: pending

Output budget strategy:
- TODO: Scope closeout audits and cap noisy commands.

Blocked condition:
- TODO: Name missing authority, external action, or proven environment blocker.

Start Gates:
| Gate | Applies | Evidence |
| --- | --- | --- |
| Dedicated task invocation and plan for exact PR | pending | pending |
| Task evidence verified at PR head | pending | body path + head file + exact PR owner |
| Active source/plan reconstructed | pending | pending |
| Intended delta and exclusions recorded | pending | pending |
| Closure matrix classified | pending | pending |
| Live PR feedback target resolved | pending | exact PR for full `resolve-pr-feedback` mode |
| Unfiltered top-level feedback inventory | pending | raw GitHub PR comments/reviews compared with helper output |
| GitHub delivery expectation recorded | pending | pending |
| Active goal checked or created | pending | pending |

Closure matrix:
| Lane | Applies | Owner/proof | Status |
| --- | --- | --- | --- |
| per-PR task ownership | pending | exact PR + dedicated task plan | pending |
| noncompliant close | pending | required comment + `CLOSED` read-back | pending |
| source behavior | pending | pending | pending |
| package/API/build | pending | pending | pending |
| generated output | pending | pending | pending |
| fixtures/scenarios | pending | pending | pending |
| docs/package skill | pending | pending | pending |
| changeset | pending | pending | pending |
| agent workflow | pending | pending | pending |
| live PR feedback | yes | `resolve-pr-feedback` + final P1 read-back | pending |
| cleanup/review | pending | pending | pending |
| repository check | yes | `bun check` | pending |
| GitHub delivery | pending | pending | pending |

Work Checklist:
- [ ] Every PR has its own `task` invocation and dedicated task plan; a batch
      plan or aggregate autoclosure is not used as a substitute.
- [ ] Task evidence was verified from the PR body, fetched head, and exact PR
      ownership; otherwise the required comment and `CLOSED` state were read
      back and no source review, repair, merge, or release work continued.
- [ ] Intended behavior and exclusions are reconstructed from real sources.
- [ ] Each lane is proven or N/A with a concrete reason.
- [ ] Generated output was changed through its owner and regenerated.
- [ ] Package/docs/skill/fixture/scenario/changeset contracts are synchronized.
- [ ] Full `resolve-pr-feedback` ran for the exact compliant PR; every
      actionable P1-or-higher finding was fixed, proved, replied to, and
      resolved or received the required top-level reply receipt.
- [ ] Unfiltered top-level PR comments and review bodies were fetched through
      the GitHub API, compared by ID/URL with helper output, and every excluded
      bot/author item was ledgered; identity alone never dismissed feedback.
      Only the exact terminal receipt produced/read back by this run is exempt
      from the versioned ledger.
- [ ] Every actionable feedback item has a persisted P0-P3 priority and
      one-sentence rationale from the autoclosure rubric; ambiguous P1-versus-
      lower items fail closed as P1.
- [ ] Every P1-or-higher proof reran after the final material branch push,
      regardless of file type, including resolved or outdated threads that
      disappear from the helper's unresolved-thread output.
- [ ] Feedback was re-fetched after the last push/reply/resolution and shows
      zero unresolved actionable P1-or-higher findings.
- [ ] After all versioned plan/source updates were pushed, the exact-head P1
      proof/read-back receipt was posted to the PR and read back; no terminal
      receipt-only branch push was created. A post-comment `headRefOid` fetch
      matches the OID recorded in that receipt, and a post-comment helper/raw
      feedback fetch still shows zero actionable P1-or-higher items and no new
      URL lacking a verdict or explicit deferral, except the verified receipt.
- [ ] Any remaining P2-or-lower item has its exact URL plus the user's explicit
      priority deferral recorded; no feedback was silently ignored.
- [ ] Accepted cleanup and review findings are closed.
- [ ] PR body and check state match the final evidence.
- [ ] Residual blocker/waiver has exact evidence and next owner.

Error attempts:
| Failure signature | Count | Next different move | Resolution |
| --- | ---: | --- | --- |
| None yet | 0 | | |

Completion Gates:
| Gate | Applies | Required action | Evidence |
| --- | --- | --- | --- |
| Per-PR task ownership | pending | Record exact PR and dedicated task-plan path | pending |
| Noncompliant PR disposition | pending | Verify task evidence or comment then close and read back | pending |
| Targeted behavior proof | pending | Run smallest missing owning proof | pending |
| Source/generated audit | pending | Prove correct source and regenerated mirrors | pending |
| Package/docs/scenario closure | pending | Run every applicable local contract | pending |
| Live PR feedback resolution | yes | Run full `resolve-pr-feedback` for the exact PR and close every actionable P1-or-higher finding | pending |
| Feedback priority classification | yes | Persist P0-P3 plus rationale for every actionable item; classify ambiguous P1-versus-lower as P1 | pending |
| Final P1 proof replay | yes | After the final material branch push, regardless of file type, rerun every P1-or-higher proof, including resolved/outdated items | pending |
| Final live feedback read-back | yes | Re-fetch helper output plus unfiltered top-level comments/review bodies after the last push/reply/resolution; require zero unresolved actionable P1-or-higher findings and record explicit P2-or-lower deferrals | pending |
| External terminal receipt | yes | Post exact head OID, P1 proof results, zero-P1 counts, and deferred URLs; read it back, require live `headRefOid` equality, then require zero actionable P1-or-higher and no unrecorded helper/raw URL except that verified receipt; supersede externally when no branch fix is needed | pending |
| Deslop | pending | Run bounded cleanup or N/A | pending |
| Agent-native reviewer | pending | Run for workflow changes or N/A | pending |
| Final lint | yes | Run `bun lint:fix` | pending |
| Repository check | yes | Run `bun check` | pending |
| GitHub delivery | pending | Commit/push/open or update PR and read back | pending |
| Autoreview | yes | Resolve every accepted actionable finding | pending |
| Goal plan complete | yes | Run `node .agents/skills/autogoal/scripts/check-complete.mjs {{PLAN_PATH}}` | pending |

Phase / pass table:
| Phase | Status | Evidence | Next |
| --- | --- | --- | --- |
| Inventory | in_progress | plan created | missing proof |
| Repair | pending | | review |
| Review/checks | pending | | delivery |
| Delivery | pending | | final audit |
| Closeout | pending | | final |

Verification evidence:
- Pending.

Timeline:
- {{CREATED_AT}} Autoclosure plan created.

Reboot status:
| Question | Answer |
| --- | --- |
| Where am I? | Inventory |
| Where am I going? | Repair, review/checks, delivery, final audit |
| What is the goal? | TODO |
| What have I learned? | See closure matrix |
| What have I done? | See timeline |

Open risks:
- Pending.
