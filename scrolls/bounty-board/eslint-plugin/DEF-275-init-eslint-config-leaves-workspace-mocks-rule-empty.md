# DEF-275: `init` writes an ESLint config in which `ban-workspace-export-mocks` checks nothing

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: a lint rule silently checks nothing in every consumer `init` sets up |
| Package | eslint-plugin |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 4, 2026-10-01 |

## What is wrong

`dungeonmaster init` does not wire a consumer's `eslint.config.js` the way this repo's own config is wired.

- A new config comes from the template in `install-detect-config-responder.ts:21-91`. It uses the prebuilt
  `dungeonmaster.configs.dungeonmaster` (line 24). That prebuilt config comes from `configDungeonmasterBroker()` with no
  arguments (`eslint-plugin-create-responder.ts:350`), so `workspacePackageNames` is `[]` and `gatewayLintConfig` is
  empty (`config-dungeonmaster-broker.ts:43-44`).
- `ban-workspace-export-mocks` returns early when `workspacePackageNames` is empty
  (`rule-ban-workspace-export-mocks-broker.ts:46`). So in every consumer that `init` set up, the rule is on and checks
  nothing, with no warning.
- An existing config is left alone. If it mentions `@dungeonmaster`, `init` reports "ESLint already configured" (line
  104). Otherwise it prints "please add @dungeonmaster/eslint-plugin manually" (line 117) and says nothing about
  `configGatewayLintConfigBroker` or `configWorkspacePackageNamesBroker`.

Assayer had to write the gateway block, the `gatewayLintConfig` call and the `workspacePackageNames` call by hand,
copying this repo's own `eslint.config.js`.

## What should happen

The config `init` writes calls `configGatewayLintConfigBroker` and `configWorkspacePackageNamesBroker` and passes both
to `configDungeonmasterBroker`, the way this repo's own `eslint.config.js` does (lines 20-49). For an existing config
that lacks those calls, `init` names exactly what to add. `ban-workspace-export-mocks` reports when it runs with an
empty list, so a config that forgot the names is visible.

## Where to look

- `packages/eslint-plugin/src/responders/install/detect-config/install-detect-config-responder.ts:21-91`, `:104`, `:117`
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts:350-351`
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts:43-52`
- `packages/eslint-plugin/src/brokers/rule/ban-workspace-export-mocks/rule-ban-workspace-export-mocks-broker.ts:44-46`
- This repo's `eslint.config.js:20-49`, the wiring to copy

## History

Assayer upstream report 4. Commit `7469542ee` exported the two brokers from the plugin's main entry, which a written
config needs first.
