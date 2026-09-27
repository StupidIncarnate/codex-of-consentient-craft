# G03: Publish `@dungeonmaster/testing` publicly

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 21a, lines 513-520 |
| Needs | nothing |
| Unblocks | [G22](g22-jest-through-gateway.md), [G25](g25-consumer-init-end-to-end.md) |
| Packages touched | `testing` |
| Checks to run | `lint,typecheck,unit` (no code changes beyond `package.json`, so mostly a config check) |
| Split | one agent |
| Runs alone | no |

## Why

Consumer repos need `registerMock`, the I/O trap, the jest setup files and the proxy-mock hoister, and
all of them live in `@dungeonmaster/testing`. Its `package.json` has no `publishConfig` with `"access":
"public"`, and a consumer install of it failed with a 404. `init` already lists `@dungeonmaster/testing`
in the consumer's root `devDependencies`, so today that install fails for every consumer.

It matters more now because `init` copies dungeonmaster's node and browser gateways into the consumer
(their source, not just `dist`), and every copied proxy and test file imports `@dungeonmaster/testing`.
Without a public publish, a fresh `dungeonmaster init` in any real consumer repo cannot finish
`npm install`.

## Current state

Checked 2026-09-26 against the code. `packages/testing/package.json` has no `publishConfig` key at all
(confirmed by reading the parsed JSON: `d.get('publishConfig')` returns `None`). The four gateway
packages this item's fix should match are not individually re-checked in this pass, but the source doc
says they already carry the public `publishConfig` — the executing agent confirms this by reading one of
them (e.g. `packages/@gateway/node/package.json`) before copying its shape.

`packages/testing/package.json`'s `files` array today:
```json
"files": [
  "dist",
  "src",
  "!src/**/*.test.ts",
  "ts-jest",
  "jest-config-base.js"
]
```

Checked what a consumer install actually needs to load, by reading the files on disk:

- The jest setup files a consumer's own `jest-config-base.js` references
  (`packages/testing/jest-config-base.js:16`) live at `packages/testing/src/jest.setup.js` — under `src`,
  already covered by the `files` entry, and not excluded by the `!src/**/*.test.ts` negation since it is
  not a `.test.ts` file.
- The OTHER jest setup files (`jest.setup-home.js`, `jest.setup-global.js`, `jest.setup-io-trap.js`,
  `jest.setup-global-teardown.js`) also live under `packages/testing/src/`, so they are covered the same
  way — but they are wired up by the ROOT `jest.config.base.js` at the repo root, not by
  `packages/testing/jest-config-base.js` (the PUBLISHED one a consumer actually uses). Read
  `packages/testing/jest-config-base.js` in full: its `setupFilesAfterEnv` points at `src/jest.setup.js`
  only. It does not set `globalSetup`/`globalTeardown`/`setupFiles` the way the repo-root config does. This
  is worth flagging under DECISIONS if the executing agent finds a consumer actually needs the sandboxed
  `HOME` behaviour those give (`packages/testing/CLAUDE.md`'s "What Is Real, What Is Mocked, What Is
  Isolated" section) — today the PUBLISHED base config looks like it does not wire that in for a
  consumer at all. Not fixed as part of this item unless it blocks G25's consumer end-to-end proof; flag
  it either way.
- `packages/testing/ts-jest/` is a real folder (not `src/ts-jest`) holding `transformers.js`,
  `harness-lifecycle-transformer.js` and `proxy-mock-transformer.js` — the AST transformers that make
  `registerMock`/proxy files and jest-mock hoisting work. It is already a top-level `files` entry.
- `packages/testing/jest-config-base.js` (root of the package, not under `src`) is already a top-level
  `files` entry.

So by inspection, `files` already covers what a consumer's `require('@dungeonmaster/testing/jest-config-
base')` chain touches. The gap this item found is `publishConfig`, not `files` — but `npm pack --dry-run`
is the way to PROVE `files` is complete rather than trust this reading, and the item still asks for that
proof (Work step 3).

## Work

1. Add `publishConfig` to `packages/testing/package.json`, matching the four gateway packages:
   ```json
   "publishConfig": { "access": "public" }
   ```
2. Confirm the package's `name` (`@dungeonmaster/testing`) is scoped the same way the four gateway
   packages are (it already is — `@dungeonmaster/npm`, `node`, `browser`, `bin` are the precedent), so no
   further `package.json` field needs to change for a scoped-public npm publish.
3. **Check `files` covers everything a consumer loads** with `npm pack --dry-run` from inside
   `packages/testing/` (or `npm pack --dry-run --workspace=@dungeonmaster/testing` from the root) — this
   is NOT a build and NOT an install, so it is allowed even under this item's own restrictions. Read the
   file list `npm pack --dry-run` prints and confirm it includes:
   - every `jest.setup*.js` file under `src/` that a consumer's jest run needs (per Current State above)
   - `ts-jest/transformers.js`, `ts-jest/harness-lifecycle-transformer.js`,
     `ts-jest/proxy-mock-transformer.js` (the hoister)
   - `jest-config-base.js`
   - `register-mock` and every other subpath `package.json` `exports` names under `.` (the `dist`
     entries in particular — a consumer resolves `import`/`require` conditions, not `source`, so
     anything reachable only through `dist` needs `dist` actually present in the packed tarball; confirm
     `dist` is not accidentally stale or excluded)
4. If `npm pack --dry-run` shows a gap, fix `files` to close it. If it shows everything already listed
   above, no `files` change is needed — say so in the report rather than adding entries nothing is
   missing.

## Done when

- [ ] `packages/testing/package.json` has `"publishConfig": { "access": "public" }`.
- [ ] `npm pack --dry-run`'s file list was read and checked against every consumer-facing file named in
  Current State; any gap found is fixed in `files`.
- [ ] The report names whether the published `jest-config-base.js` actually wires up the sandboxed-HOME
  setup (`jest.setup-global.js`/`jest.setup-home.js`/`jest.setup-global-teardown.js`) for a consumer, or
  only the auto-reset `jest.setup.js` — this is a DECISION to flag, not necessarily to fix here.
- [ ] `npm run ward -- -- packages/testing/package.json` (`lint,typecheck,unit`) exits 0 — a
  `package.json`-only change should not fail any of these, but ward still runs to confirm nothing else in
  `testing` broke.

## Traps

- `npm pack --dry-run` is explicitly allowed here even though this item's own restrictions say "run no
  build" — it does not compile anything and does not install anything, it only prints what `npm publish`
  WOULD include. Do not confuse it with `npm run build` or `npm install`.
- Do not actually publish. This item only prepares the package.json and file list; a real
  `npm publish` is an operator/release decision outside this epic's scope.

## Concessions made while executing
