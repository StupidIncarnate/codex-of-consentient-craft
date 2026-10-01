# DEF-274: The gateway lint rules take the workspace scope from the root package name, so an unscoped root breaks them

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: a consumer gets every workspace import reported as a raw npm import |
| Package | eslint-plugin |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 1, 2026-10-01 |

## What is wrong

`raw-import-ban`, `gateway-import-boundary` and `bin-program-spawn-ban` decide which imports are the repo's own by one
scope string. `repoScopeResolveBroker` builds that string from the `name` of the workspaces root `package.json`
(`repo-scope-resolve-broker.ts:36`), through `packageScopeFromNameTransformer`. That transformer turns an unscoped name
into a scope by adding `@` (`package-scope-from-name-transformer.ts:21-22`).

Assayer's root was named `assayer-monorepo` and its packages `@assayer/core`, `@assayer/shared` and so on. The rules
read the scope as `@assayer-monorepo`. `raw-import-ban` then treated every `@assayer/*` import as a raw npm import
(`rule-raw-import-ban-broker.ts:151-152` and `:221-222` check `startsWith(\`${scope}/\`)`). Assayer renamed its root to
`@assayer/monorepo` to get past it (assayer decision D1).

The same derivation is in `resolve-gateway-scope-layer-broker.ts:50` (`platform-globals-ban`) and
`validate-gateway-specifier-layer-broker.ts:60` (`gateway-dependency-declared`).

## What should happen

A repo's own imports are the imports that name one of its workspace packages. The rules read that from the workspace
packages' own names, not from the root's name. `configWorkspacePackageNamesBroker` already lists those names. Where a
single scope is still needed (to build `@<scope>/node/...` gateway paths), read it from the gateway packages' own names
under `packages/@gateway/`.

A test lints a fixture repo whose root is unscoped (`acme-monorepo`) and whose packages are `@acme/*`, and no workspace
import is reported.

## Where to look

- `packages/eslint-plugin/src/brokers/repo-scope/resolve/repo-scope-resolve-broker.ts:28-50`
- `packages/shared/src/transformers/package-scope-from-name/package-scope-from-name-transformer.ts:21-22`
- `packages/eslint-plugin/src/brokers/rule/raw-import-ban/rule-raw-import-ban-broker.ts:151-152`, `:221-222`
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/resolve-gateway-scope-layer-broker.ts:50`
- `packages/eslint-plugin/src/brokers/rule/gateway-dependency-declared/validate-gateway-specifier-layer-broker.ts:60`
- `packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.ts`

## History

Assayer upstream report 1. Commit `e80c3adf0` fixed a different half: the three rules now walk up from the linted
file, not from the plugin's own folder. They still read the scope from the root name they find there.
