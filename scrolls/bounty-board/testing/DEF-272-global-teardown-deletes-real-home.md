# DEF-272: The published Jest global teardown deletes the real home directory when its own setup never ran

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | testing |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 12, 2026-10-01 |

## What is wrong

`packages/testing/src/jest.setup-global-teardown.js` reads `process.env.HOME` at line 29 and deletes that folder
recursively in its `finally` block (lines 67-71). The `finally` runs on every path, including the early return at
lines 33-35, which is the path taken when `jest.setup-global.js` never ran.

`jest.setup-global.js` is what moves `HOME` to a sandbox under the OS tmp folder (line 70). When it did not run,
`process.env.HOME` is still the user's real home directory, and the teardown deletes it.

A consumer hits this by keeping its own `globalSetup` and spreading the published Jest base, which brings the published
`globalTeardown`. Assayer found it this way. The first Jest run then deletes the real home directory. Assayer works
around it with a setup script that calls the published sandbox setup and throws if `HOME` did not move (assayer
concession 7).

## What should happen

The teardown deletes only a folder that the published setup created. It deletes nothing when the setup did not run.
One safe check: delete only when `DUNGEONMASTER_TEST_REAL_HOME` is set and `HOME` differs from it and sits under the
OS tmp folder with the `dungeonmaster-jest-sandbox-` prefix that `jest.setup-global.js` uses (line 22). A test covers
the "setup never ran" case and proves the folder named by `HOME` is untouched.

## Where to look

- `packages/testing/src/jest.setup-global-teardown.js:29` (reads `HOME`), `:33-35` (early return), `:67-71` (the delete)
- `packages/testing/src/jest.setup-global.js:22` (sandbox prefix), `:40` (sandbox path), `:70` (moves `HOME`)
- `packages/testing/jest-config-base.js` (where a consumer picks up the teardown)

## History

Assayer upstream report 12. See DEF-273 for the same file's leak check failing runs when other sessions work at the
same time.
