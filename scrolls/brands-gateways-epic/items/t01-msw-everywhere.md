# T01: MSW loads in every package and fails on anything unhandled

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T8 rows and ins-and-outs (lines 1935-1950), rows 2210-2211, gotcha 2159-2160 |
| Needs | G08 |
| Unblocks | T02, T03, T09 |
| Packages touched | `testing` (setup files), every other workspace package's `jest.config.*` (transform only) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for the transform rollout across all package jest configs, a second for the `jest.config.base.js` + `endpoint-mock-setup-responder.ts` + `network-record-lifecycle-responder.ts` changes |
| Runs alone | no |

## Why

MSW covers HTTP and WebSocket the way the I/O trap covers files, processes and sockets: it fails a
test on any request or connection nothing staged. Today MSW loads from only two places —
`packages/web/jest.config.cjs:30` and `packages/testing/jest.config.js:11` — so every other package's
unit tests send real HTTP on an uncaught `fetch`. MSW ships as ESM, and server's Jest does not
transform it, so loading it everywhere needs the ESM transform first. Once MSW loads everywhere, two
gaps in its setup need closing: an unhandled request only makes the request fail (code that catches
every error swallows that silently), and an unhandled WebSocket connection goes out for real today.

## Current state

Checked 2026-09-26 against this worktree:

- MSW is `msw@^2.12.10` in `packages/testing/package.json` and `packages/@gateway/npm/package.json`
  (matches the doc's cited version, `node_modules/msw/lib/core/ws/handleWebSocketEvent.mjs:24-37`, not
  independently re-read here).
- `start-endpoint-mock-setup.ts` lives at `packages/testing/src/startup/start-endpoint-mock-setup.ts`.
  Only `packages/testing/jest.config.js` and `packages/web/jest.config.cjs` load it today — every other
  package's Jest config was checked and does not.
- The ESM transform (`transformIgnorePatterns` with `/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)`)
  already exists in `packages/web/jest.config.cjs`, `packages/testing/jest.config.js`,
  `packages/hydration-recipes/jest.config.js` and `packages/orchestrator/jest.config.js` — the last two
  carry it (and the `/packages/testing/src/jest\.setup\.js$/` re-include line) even though neither loads
  `start-endpoint-mock-setup.ts` yet, because `@dungeonmaster/testing`'s root barrel already pulls in the
  MSW-backed endpoint-mock flow through other exports. `hydration-recipes/jest.config.js:9-14`'s own
  comment explains this and says `packages/orchestrator/jest.config.js` "carries the identical override
  for the identical import". The remaining packages — `mcp`, `cli`, `session-forensics`, `eslint-plugin`,
  `hydration`, `config`, `ward`, `local-eslint`, `tooling`, `hooks`, `siegelense` — have
  `transformIgnorePatterns` set to something else (not the MSW pattern). `shared` and `server` (and the
  four `@gateway/*` packages except `npm`) have no `transformIgnorePatterns` override at all, so they
  inherit the base config's default, which ignores all of `node_modules`.
- `endpoint-mock-setup-responder.ts:17` calls `server.listen({ onUnhandledRequest: 'error' })` — confirmed
  by reading the file. No unhandled-request recorder and no `afterEach` failure exist yet.
- `network-record-lifecycle-responder.ts`'s `afterEach` (lines 24-37) only writes recorded entries to
  `process.stderr` between two delimiter lines; it never fails the test. Confirmed by reading the file.
- No `ws` handler exists in the MSW setup today (not checked file-by-file beyond
  `endpoint-mock-setup-responder.ts`, which registers none).
- `jest.config.base.js` (repo root) does not load `start-endpoint-mock-setup.ts` itself — each package
  opts in individually.

## Work

Do these in order; each step's output is what the next step needs.

1. **Give every package's Jest config the MSW ESM transform.** Add (or extend)
   `transformIgnorePatterns` to allow `msw`, `@mswjs`, `until-async` and `outvariant` through, in every
   package that does not already have it: `mcp`, `cli`, `session-forensics`, `eslint-plugin`, `hydration`,
   `config`, `ward`, `local-eslint`, `tooling`, `hooks`, `siegelense`, `shared`, `server`, and the
   `@gateway/*` packages besides `npm`. Follow the existing pattern in `packages/web/jest.config.cjs`:
   ```js
   transformIgnorePatterns: [
     '/dist/',
     '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)',
   ],
   ```
   `packages/hydration-recipes/jest.config.js` and `packages/orchestrator/jest.config.js` already have
   this; do not duplicate it there. This repo's own rule is "no two jest configs are alike" (`packages/CLAUDE.md`,
   "Do not hand-copy the configs off a sibling") — check each package's own `moduleNameMapper` and
   `testEnvironment` overrides before adding the line, so the new entry does not clobber a JSX preset or
   another override already in that file.

2. **Load `start-endpoint-mock-setup.ts` from the root `jest.config.base.js`,** so every package gets it
   without an individual opt-in, and from the published `packages/testing/jest-config-base.js`, so a
   consumer gets it too. Remove the per-package `setupFilesAfterEnv` entry in `packages/web/jest.config.cjs`
   and `packages/testing/jest.config.js` that loads it today, since the base now covers it — check both
   files still need their other `setupFilesAfterEnv` entries.

3. **Record unhandled requests and fail in `afterEach`.** MSW's `server.listen()` accepts a function form
   for `onUnhandledRequest`, not just the string `'error'`. Change
   `endpoint-mock-setup-responder.ts:17` to pass a function that records the unhandled request (reusing
   the shape `network-record-lifecycle-responder.ts` already keeps for its own recording) instead of the
   bare `'error'` string, and fail the test in `afterEach` the same way the I/O trap does — the failure
   must survive code that catches the request's own rejection.

4. **Register a `ws` handler that fails any connection no test's handler took.** In the installed
   msw 2.12.10, `node_modules/msw/lib/core/ws/handleWebSocketEvent.mjs:24-37`: when no `ws` handler is
   registered at all, an unhandled connection is reported as unhandled and then connected to the real
   server anyway — the `'error'` strategy only adds an error event on the client socket, it does not stop
   the real connection. When any `ws` handler is registered, MSW gives every connection to the handlers
   instead (lines 8-16). So the base setup must register one `ws` handler, using MSW's `ws` API, that
   fails any connection no test's own handler took. Do this in `endpoint-mock-setup-responder.ts` beside
   the HTTP setup.

5. **Leave the network recorder's stderr-only behaviour alone**, unless step 3's own recording can reuse
   its code directly — the two are separate mechanisms (network recorder logs everything seen for
   diagnostics; MSW's own unhandled-request check fails the test). Do not merge them into one file without
   checking both still do their own job.

## Lint rules this item adds or changes

None.

## Teaching text this item changes

None directly. T09 (the test-infrastructure catalog) and Z03 (`get-testing-patterns`) pick up MSW's
new reach once this item lands; do not edit those docs here.

## Done when

- Every workspace package's Jest config transforms MSW's ESM (`transformIgnorePatterns` includes
  `msw|@mswjs|until-async|outvariant`).
- `jest.config.base.js` and `packages/testing/jest-config-base.js` both load
  `start-endpoint-mock-setup.ts`.
- A unit test in a package that never opted in before (e.g. `mcp` or `hooks`) that calls `fetch` with
  nothing staged fails with an MSW unhandled-request message.
- `endpoint-mock-setup-responder.ts`'s `afterEach` fails a test that made an unhandled request, even when
  the code under test caught the resulting rejection.
- A test that opens a `WebSocket` with no `ws` handler staged fails instead of connecting for real.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- MSW is ESM-only in `node_modules`; skipping the transform step produces a cryptic `Unexpected token
  'export'` failure that looks like a syntax error in the test file, not a config problem.
- `server`'s Jest does not transform MSW's ESM today — this is the gotcha the doc cites at line 2159-2160
  and `packages/hydration-recipes/jest.config.js:10` restates. A server integration test still cannot
  import the main `@dungeonmaster/testing` barrel until this item's transform change lands there too; use
  `serverAppHarness().setupTestHome()` for a temp home until then if a test needs one before this item
  merges.
- Adding the transform line without checking a package's existing `transformIgnorePatterns` can silently
  drop that package's other exclusions (e.g. a JSX-specific one). Read the whole array before replacing
  it.
- `packages/CLAUDE.md` says not to hand-copy jest configs off a sibling; copy the transform PATTERN, not
  the whole file.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
