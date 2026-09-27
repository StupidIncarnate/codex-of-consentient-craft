# T07: Consumers get the Jest home sandbox

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, "The Jest home sandbox" (lines 1988-2031), `ban-bare-os-home-tmp` removal (2239), docs rows 2379-2380, row 2201 |
| Needs | P0-1 |
| Unblocks | none named |
| Packages touched | `testing` (published `jest-config-base.js`), `local-eslint` (rule removal) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no |

## Why

This repo's own unit tests already run inside a sandboxed home (`fe456add9`'s three setup files), but a
consumer repo spreading `packages/testing/jest-config-base.js` gets none of it — that published config
sets no `globalSetup` or `globalTeardown`, so a consumer's tests run against the developer's own real
`HOME`, git config and `~/.claude/projects`. Once this ships, the lint rule `ban-bare-os-home-tmp` (which
existed only to force every `homedir()`/`tmpdir()` call through a mockable adapter before the sandbox
existed) can be removed — the sandbox and the I/O trap now isolate every test, so the rule's job is
already done a better way.

## Current state

Checked 2026-09-26:

- `packages/testing/jest-config-base.js` (the published base) exists, is 1644 bytes, and its
  `module.exports` sets `preset`, `testEnvironment`, `setupFilesAfterEnv` (pointing only at
  `src/jest.setup.js`), `testMatch`, `testPathIgnorePatterns`, `moduleFileExtensions`, `transform`,
  `coverageDirectory`, `verbose`, `detectOpenHandles`, `forceExit`. It does **not** set `globalSetup` or
  `globalTeardown` — confirmed by reading the file in full. This matches the doc's claim exactly.
- `packages/testing/src/jest.setup-global.js`, `packages/testing/src/jest.setup-home.js` and
  `packages/testing/src/jest.setup-global-teardown.js` all exist under `packages/testing/src/`,
  confirmed present.
- This repo's own root `jest.config.base.js` (not the published one) is a separate file at the repo root
  and was not opened in this pass to confirm it already wires these three files as `globalSetup`/
  `globalTeardown` — the source doc says it does (`fe456add9`); if the executing agent finds it does not,
  treat the code as authoritative and note the discrepancy under DECISIONS.
- The `ban-bare-os-home-tmp` rule was not located under `packages/local-eslint/src` in this pass (not
  searched directly); the doc says it lives in `local-eslint` and allows `homedir()`/`tmpdir()` only in
  `adapters/os/` — confirm its exact location before deleting it.

## Work

1. **Add `globalSetup` and `globalTeardown` to `packages/testing/jest-config-base.js`**, pointing at
   `jest.setup-global.js` and `jest.setup-global-teardown.js` respectively, the same way this repo's own
   root `jest.config.base.js` already does. Use `path.join(__dirname, 'src', 'jest.setup-global.js')` and
   the teardown equivalent, following the existing `setupFilesAfterEnv` path-join pattern already in this
   file.

2. **`jest.setup-home.js` stays this repo's own** — do not add it to the published base.
   `DUNGEONMASTER_HOME` is dungeonmaster's own data directory; a consumer's code never reads it, so
   wiring this file into the published config would set an environment variable no consumer code cares
   about, for no benefit.

3. **Remove `ban-bare-os-home-tmp`** from `local-eslint`. Locate it (likely under
   `packages/local-eslint/src/brokers/rule/` or similar, following this package's existing rule-folder
   convention), delete the rule, its test, its proxy if any, and its entry in whatever rule index
   registers it. Remove its entry from `dungeonmaster-rule-enforce-on-statics.ts` if it is tagged there.

4. **Update `packages/testing/CLAUDE.md:105-107`** — its line calling the teardown leak check "the one
   guard left for code the lint rule `ban-bare-os-home-tmp` can't see" needs to say the leak check IS the
   guard the sandbox holds, now that the lint rule is gone (not "the one left"). Confirm the exact current
   text before editing — line numbers may have drifted.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `ban-bare-os-home-tmp` (`local-eslint`) | **Removed.** It allowed `homedir()`/`tmpdir()` only in `adapters/os/`; the sandbox and the I/O trap now isolate every test, and `raw-import-ban` already refuses a raw `os` import outside the gateway | Removed — drop its `'pre-edit'` tag from the statics map if present |

## Teaching text this item changes

Per row 2380: `packages/testing/CLAUDE.md:105-107` — "Calls the teardown leak check 'the one guard left
for code the lint rule `ban-bare-os-home-tmp` can't see'" changes to "The leak check is the guard that
the sandbox held. The lint rule is gone." Confirm the current line numbers before editing (the file has
grown substantially since the doc's line reference was recorded — this pass found the file's actual
content much longer than a 105-107 span would suggest for this specific sentence; search the file's text
for the sentence rather than trusting the line number).

## Done when

- `packages/testing/jest-config-base.js` sets `globalSetup` and `globalTeardown` pointing at
  `jest.setup-global.js` and `jest.setup-global-teardown.js`.
- `ban-bare-os-home-tmp` no longer exists anywhere in `local-eslint` or its rule index.
- `packages/testing/CLAUDE.md`'s sentence about the rule is updated.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not wire `jest.setup-home.js` into the published base — that file is this repo's own
  `DUNGEONMASTER_HOME` sandbox, unrelated to what a consumer needs.
- `HOME` has to be set in Jest's globalSetup (parent process), never in a per-test `setupFilesAfterEnv`
  file — Jest gives each test file a copy of `process.env`, so an assignment inside a test never reaches
  `os.homedir()` or a spawned process. This is why `globalSetup`/`globalTeardown`, not
  `setupFilesAfterEnv`, is the right hook — do not "simplify" this by moving the HOME assignment into
  `setupFilesAfterEnv`.
- Confirm `packages/testing/CLAUDE.md`'s cited line numbers before editing; the doc's own figures are
  dated and this file is large.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
