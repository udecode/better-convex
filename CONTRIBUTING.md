# Contributing

## One PR, one task

Every PR requires a dedicated `task` invocation and task plan under
`docs/plans/**`.

Invoke `$kitcn:task <PR URL or #>` for an existing PR. For a new PR, invoke
`$kitcn:task <issue, spec, or single-PR task>` before editing.

The PR body must include `🧭 Task plan: docs/plans/<plan>.md`. The plan must
exist at the PR head and identify the exact PR before autoclosure.

- A batch plan can choose dependency order, but it cannot replace per-PR task
  plans.
- Run `autoclosure` only after the exact PR has entered through `task`.
- Finish one `task` -> optional `autoclosure` PR slice before moving to the next
  PR unless parallel work was explicitly requested.
- Use the task-style PR body and record exact checks, merge, release, and
  read-back receipts when they apply.

Autoclosure comments on and closes PRs without valid task evidence before any
code review or repair. Its remediation comment recommends GPT-5.6 with
high-or-higher reasoning effort. The comment must be visible before the PR is
closed.

## Verification

Run the owning focused checks while iterating, then run the repository gate
before opening or updating a PR:

```bash
bun install
bun check
```

Edits to `.agents/AGENTS.md` or `.agents/rules/**` must be regenerated with
`bun install`; never edit generated skill or root-agent mirrors directly.
