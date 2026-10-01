# DEF-278: `create-worktree` cannot make a worktree for a repo with `file:` dependencies on a sibling checkout

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: such a consumer cannot use worktrees and runs agents in its main checkout instead |
| Package | orchestrator |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 6, 2026-10-01 |

## What is wrong

Assayer depends on `@dungeonmaster/*` with `file:../codex-of-consentient-craft/packages/<pkg>`. npm writes each one as
a relative link that climbs out of the repo, for example `node_modules/@dungeonmaster/cli ->
../../../codex-of-consentient-craft/packages/cli`.

`populateOneRootLayerBroker` treats every link that starts with `./` or `../` as a workspace link
(`populate-one-root-layer-broker.ts:158-161`). It copies the link as written into the worktree. From inside
`worktrees/<name>/node_modules/@dungeonmaster/`, that link lands at `worktrees/codex-of-consentient-craft/packages/cli`,
which does not exist. The broker also hands that path back as a workspace root to mirror next (`:215-218`). The failed
run left mirrored `node_modules` folders under `worktrees/codex-of-consentient-craft/`.

An absolute link fails too: `worktreeVerifyLinksBroker` refuses any link that is not relative or lands outside the
worktree (`worktree-verify-links-broker.ts:52`).

So no worktree can be made for such a repo. Assayer ran its whole epic on a branch in the main checkout instead
(assayer concession 4).

## What should happen

A relative link whose target is outside the source repo is not a workspace link. The populate step rewrites it so it
lands at the same real folder from the worktree, and does not mirror that folder's `node_modules`. The link check
accepts a link that lands at the same place the main checkout's link lands, when that place is outside the main
checkout too. Nothing is written outside the worktree.

A test carves a worktree for a fixture repo with a `file:` dependency on a sibling folder and asserts the link
resolves to the sibling and that nothing appears under `worktrees/` besides the new worktree.

## Where to look

- `packages/orchestrator/src/brokers/worktree/populate-node-modules/populate-one-root-layer-broker.ts:152-218`
- `packages/orchestrator/src/brokers/worktree/verify-links/worktree-verify-links-broker.ts:47-71`
- `packages/orchestrator/src/brokers/worktree/verify-links/walk-symlinks-layer-broker.ts:57`

## History

Assayer upstream report 6.
