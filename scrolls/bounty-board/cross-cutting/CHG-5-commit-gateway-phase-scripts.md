# CHG-5: Commit the gateway-phase codemod scripts that live only in a gitignored folder

| | |
|---|---|
| Kind | change |
| Status | needs decision |
| Package | cross-cutting |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 5, 2026-10-01 |

## What to build

Dungeonmaster's own gateway-phase scripts, `a18-codemod` and `a18-zod`, exist only in
`worktrees/gateway-pivot/tmp/`, which git ignores. No branch holds them. Assayer copied them into its own
`scrolls/brands-gateways-epic/scripts/` (folders `a18-codemod` and `a18-zod`) to run its own gateway move.

If the `gateway-pivot` worktree is removed, dungeonmaster loses them. A later consumer moving to the gateway cannot find
them in this repo.

## What should happen

The user chooses one:

1. Commit them under `scrolls/` beside the epic that used them (`scrolls/brands-gateways-epic/`), as a record.
2. Turn the reusable part into a `dungeonmaster` command for consumers moving to the gateway.
3. Leave them out. Assayer's copies are the record.

## Where to look

- `worktrees/gateway-pivot/tmp/a18-codemod/` and `worktrees/gateway-pivot/tmp/a18-zod/`
- assayer `scrolls/brands-gateways-epic/scripts/a18-codemod/` and `a18-zod/`
- `scrolls/brands-gateways-epic/a18-operator/` (the committed operator files for the same phase)

## History

Assayer upstream report 5.
