# DEF-277: `gateway-sync` writes no wrapper for test tooling in `devDependencies`

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a consumer hand-writes a gateway wrapper for every test tool its tests import |
| Package | cli |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 2, 2026-10-01 |

## What is wrong

`gateway-sync` reads only `dependencies` when it decides which npm packages get a folder under
`packages/@gateway/npm/src/` (`gateway-npm-sync-statics.ts:33`, `dependencyKeys: ['dependencies']`). The list broker's
header says so: "`devDependencies` are never read: they are tooling, which shipped code does not import through the
gateway" (`gateway-npm-dependencies-list-broker.ts:4-5`).

Test files do import test tooling, and `raw-import-ban` makes them import it through the gateway too. Assayer's tests
import Playwright, Testing Library and Electron. All three sit in `devDependencies`, so `gateway-sync` writes nothing
for them. Assayer wrote each passthrough wrapper by hand.

## What should happen

`gateway-sync` also wraps a `devDependencies` package that some source or test file imports. A dev package nothing
imports (a CLI tool such as `typescript` run only as a binary) stays unwrapped, so the gateway does not fill with
packages nobody imports. The npm gateway records a dev package in its own `devDependencies`, not `dependencies`, so a
published gateway does not pull test tooling into production installs.

## Where to look

- `packages/cli/src/statics/gateway-npm-sync/gateway-npm-sync-statics.ts:33-34`
- `packages/cli/src/brokers/gateway/npm-dependencies-list/gateway-npm-dependencies-list-broker.ts:2-9`, `:61-70`
- `packages/cli/src/brokers/gateway/npm-sync/gateway-package-record-layer-broker.ts` (which `package.json` key a wrapped package is recorded under)

## History

Assayer upstream report 2.
