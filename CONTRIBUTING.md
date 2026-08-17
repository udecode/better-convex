# Contributing

## One PR, one task

Human contributors can open PRs normally. Whenever an agent authors, reviews,
repairs, or merges a PR, invoke `task` for that exact PR and keep a dedicated
task plan under `docs/plans/**`.

Invoke `$kitcn:task <PR URL or #>` for an existing PR. For a new PR, invoke
`$kitcn:task <issue, spec, or single-PR task>` before editing.

- A batch plan can choose dependency order, but it cannot replace per-PR task
  plans.
- Run `autoclosure` only after the exact PR has entered through `task`.
- Finish one `task` -> optional `autoclosure` PR slice before moving to the next
  PR unless parallel work was explicitly requested.
- Use the task-style PR body and record exact checks, merge, release, and
  read-back receipts when they apply.

## Verification

Run the owning focused checks while iterating, then run the repository gate
before opening or updating a PR:

```bash
bun install
bun check
```

Edits to `.agents/AGENTS.md` or `.agents/rules/**` must be regenerated with
`bun install`; never edit generated skill or root-agent mirrors directly.
