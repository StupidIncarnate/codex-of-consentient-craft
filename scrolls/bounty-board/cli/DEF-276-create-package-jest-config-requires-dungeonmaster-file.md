# DEF-276: `create-package` writes a Jest config that requires a file only dungeonmaster's own repo has

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: a consumer gets a generated package whose tests cannot load |
| Package | cli |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 11, 2026-10-01 |

## What is wrong

`dungeonmaster create-package` decides whether it runs inside dungeonmaster's own repo by one test: does the repo root
hold a `jest.config.base.js` (`cli-create-package-responder.ts:75-76`). Any consumer with its own root
`jest.config.base.js` passes that test, as assayer does.

The responder then picks the in-repo Jest templates. Two of them, `jestConfigNodeIntegration` and `jestConfigTsx`,
require `../../packages/testing/ts-jest/options.js` (`package-scaffold-config-statics.ts:137` and `:166`). Those are the
templates a cli and an app package get. A consumer has no `packages/testing`, so the generated package's Jest run fails
with "Cannot find module".

## What should happen

`create-package` tells dungeonmaster's own repo from a consumer by something only dungeonmaster's repo has, not by a
file name any repo may use. One option: compare the root `package.json` name with dungeonmaster's own, or check that
`packages/testing/ts-jest/options.js` itself exists. A consumer then gets templates that load the ts-jest options from
the published `@dungeonmaster/testing` package.

A test runs the responder against a consumer fixture that has a root `jest.config.base.js` and asserts that no written
file names `packages/testing/ts-jest/options.js`.

## Where to look

- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts:20-25` (header), `:75-76` (the test)
- `packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.ts:136-147`, `:165-187`
- `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.ts:197` (where the template is picked)

## History

Assayer upstream report 11.
