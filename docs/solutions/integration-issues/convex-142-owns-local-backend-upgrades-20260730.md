---
title: Convex 1.42 owns non-interactive local backend upgrades
date: 2026-07-30
category: integration-issues
module: kitcn cli
problem_type: integration_issue
component: development_workflow
symptoms:
  - kitcn retains a hidden `convex dev --local` recovery command
  - Convex 1.40 rejects `convex dev --local`
  - local bootstrap behavior is duplicated between kitcn and Convex
root_cause: obsolete_workaround
resolution_type: dependency_upgrade
severity: high
tags:
  - kitcn
  - convex
  - dev
  - bootstrap
  - non-interactive
  - local-backend
---

# Convex 1.42 owns non-interactive local backend upgrades

## Problem

Older Convex versions could fail `convex init` when a local backend upgrade
needed interactive confirmation. Kitcn recovered by detecting the prompt and
running a hidden command:

```text
convex dev --local --once --skip-push --local-force-upgrade --typecheck disable --codegen disable
```

That command is invalid on the supported Convex 1.42 contract. Convex 1.40
replaced `dev --local` with explicit deployment selection, and Convex 1.42
automatically confirms local upgrades when stdin is not a TTY.

## Symptoms

- Source or tests still mention `isLocalBackendUpgradePrompt`.
- Kitcn runs `convex dev --local` after `convex init` fails.
- A supported Convex CLI exits with `` `--local` is deprecated `` instead of
  recovering.

## What Didn't Work

- Keeping the fallback and only removing `--local`.
  Target Convex already owns non-interactive upgrade confirmation, so the
  second bootstrap path has no supported failure to recover.
- Preserving tests that synthesize the old prompt.
  Those tests lock kitcn to behavior below its declared peer floor.
- Adding another version check.
  The package contract already defines the supported Convex behavior.

## Solution

Run `convex init` once and treat its result as authoritative:

```ts
const initCommandArgs = [
  ...params.backendAdapter.argsPrefix,
  "init",
  ...(params.targetArgs ?? []),
];

const result = await runCommand(initCommandArgs);
```

Kitcn launches the command with piped stdio. Convex 1.42 reads that as
non-interactive and transfers local data during the backend upgrade without
asking a question. One upstream command owns deployment selection, upgrade
policy, output, and failure.

## Prevention

- Do not preserve hidden Convex flags after the supported peer floor makes them
  invalid.
- Read the target CLI source before translating a removed flag into another
  workaround.
- Keep one regression test proving normal local dev stays on `convex init`.
- Test supported behavior, not synthetic errors from versions below the peer
  floor.

## Related Issues

- [published-cli-bootstrap-must-ship-runtime-deps-and-anonymous-convex-init-20260331](/Users/zbeyens/git/better-convex/docs/solutions/integration-issues/published-cli-bootstrap-must-ship-runtime-deps-and-anonymous-convex-init-20260331.md)
- [dev-preflight-and-fast-failure-output-must-not-be-silent-20260325](/Users/zbeyens/git/better-convex/docs/solutions/integration-issues/dev-preflight-and-fast-failure-output-must-not-be-silent-20260325.md)
