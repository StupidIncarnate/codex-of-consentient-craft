# Startup Split Plan: packages/ward

## Overview

Two startup files need splitting:

1. **`start-ward.ts`** — CLI entry point, routes subcommands (run/list/detail/raw) to brokers, has `isDirectExecution`
   guard, imports brokers + transformers directly
2. **`start-install.ts`** — Install hook, manages `.gitignore` for `.ward/` entry, imports adapters directly, has
   inline business logic with branching

Neither `flows/`, `responders/`, nor `bin/` directories exist yet.

---

## File 1: `start-ward.ts`

### Current violations

- Imports 4 brokers + 1 transformer (startup may only import flows/contracts/statics/errors)
- 4 `if` statements for command routing
- Multiple ternary operators for arg parsing
- `isDirectExecution` guard (if statement)

### Split design

#### New files to create

1. **`packages/ward/bin/ward-entry.js`** — Plain JS thin CLI entry (replaces `isDirectExecution` guard)
   - Reads `process.argv`, calls `StartWard({ args: process.argv })`, handles `.catch` + `process.exit(1)`
   - Lives outside `src/` so ESLint folder rules don't apply, plain JS so no tsconfig changes needed

2. **`packages/ward/src/flows/ward/ward-flow.ts`** — Routes subcommand to the correct responder
   - Imports all 4 responders
   - Contains the command routing `if`/`switch` chain (allowed in flows)
   - Returns the result of the matched responder

3. **`packages/ward/src/flows/ward/ward-flow.integration.test.ts`** — Wiring test for the flow

4. **`packages/ward/src/responders/ward/run/ward-run-responder.ts`** — Handles `run` subcommand
   - Parses args via `cliArgsParseTransformer`, calls `commandRunBroker`
   - All current `run` branch logic moves here

5. **`packages/ward/src/responders/ward/run/ward-run-responder.proxy.ts`** — Proxy for run responder

6. **`packages/ward/src/responders/ward/run/ward-run-responder.test.ts`** — Unit tests for run responder

7. **`packages/ward/src/responders/ward/list/ward-list-responder.ts`** — Handles `list` subcommand
   - Parses optional runId, calls `commandListBroker`

8. **`packages/ward/src/responders/ward/list/ward-list-responder.proxy.ts`** — Proxy

9. **`packages/ward/src/responders/ward/list/ward-list-responder.test.ts`** — Unit tests

10. **`packages/ward/src/responders/ward/detail/ward-detail-responder.ts`** — Handles `detail` subcommand
    - Validates required args (runId, filePath), parses verbose flag, calls `commandDetailBroker`
    - Contains the usage error write if args missing

11. **`packages/ward/src/responders/ward/detail/ward-detail-responder.proxy.ts`** — Proxy

12. **`packages/ward/src/responders/ward/detail/ward-detail-responder.test.ts`** — Unit tests

13. **`packages/ward/src/responders/ward/raw/ward-raw-responder.ts`** — Handles `raw` subcommand
    - Validates required args (runId, checkType), calls `commandRawBroker`
    - Contains the usage error write if args missing

14. **`packages/ward/src/responders/ward/raw/ward-raw-responder.proxy.ts`** — Proxy

15. **`packages/ward/src/responders/ward/raw/ward-raw-responder.test.ts`** — Unit tests

#### Files to modify

1. **`packages/ward/src/startup/start-ward.ts`** — Becomes a thin one-liner delegating to `WardFlow`
   - Only imports: `WardFlow` from flows, contracts as needed
   - No branching, no broker imports

2. **`packages/ward/package.json`** — Update `bin` to point to `./bin/ward-entry.js` (compiled from
   `bin/ward-entry.ts`)

3. **`packages/ward/tsconfig.json`** — Add `"bin/**/*"` to `include` array so `bin/ward-entry.ts` gets compiled

#### Test redistribution

- **`start-ward.integration.test.ts`** — The 3 error-path tests (unknown command, missing detail args, missing raw
  args) move to the **flow's** `ward-flow.integration.test.ts` since they test routing behavior. The startup integration
  test can be simplified or removed (it just delegates to the flow now).
- **`start-ward.proxy.ts`** — Remove. Startup files don't get proxies. The proxy setup moves to the flow's integration
  test and individual responder proxies.
- **`start-ward.e2e.test.ts`** — Stays as-is. E2E test runs the compiled binary, which now goes through
  `bin/ward-entry.ts` → startup → flow → responders. The binary path in the test may need updating if the bin entry
  changes the output location.

---

## File 2: `start-install.ts`

### Current violations

- Imports 2 adapters (startup may only import flows/contracts/statics/errors)
- `if` statement checking `.includes(WARD_ENTRY)`
- 3 ternary operators for content building
- try/catch for file read (note: try/catch IS allowed per the constraints, but the logic still needs to move because of
  the adapter imports and if/ternary branching)

### Split design

#### New files to create

1. **`packages/ward/src/flows/install/install-flow.ts`** — Thin pass-through to responder
   - Follows exact pattern of `packages/cli/src/flows/install/install-flow.ts`

2. **`packages/ward/src/flows/install/install-flow.integration.test.ts`** — Wiring test

3. **`packages/ward/src/responders/install/write-gitignore/install-write-gitignore-responder.ts`** — All current
   start-install logic moves here
   - Imports adapters (allowed for responders)
   - Contains the try/catch, includes check, content building ternaries
   - Returns `InstallResult`

4. **`packages/ward/src/responders/install/write-gitignore/install-write-gitignore-responder.proxy.ts`** — Proxy

5. **`packages/ward/src/responders/install/write-gitignore/install-write-gitignore-responder.test.ts`** — Unit tests

#### Files to modify

1. **`packages/ward/src/startup/start-install.ts`** — Becomes one-liner delegating to `InstallFlow`
   - Follows exact pattern of canonical `packages/cli/src/startup/start-install.ts`

#### Test redistribution

- **`start-install.integration.test.ts`** — The 3 tests (create, merge, skip) test business logic, not wiring. They
  move to `install-write-gitignore-responder.test.ts` as unit tests using the responder's proxy. The startup integration
  test can be simplified to just verify delegation to the flow, or removed entirely since the flow integration test
  covers wiring.

---

## Build config changes summary

1. **`packages/ward/package.json`** — Change bin from `./dist/startup/start-ward.js` to `./bin/ward-entry.js`
2. **`packages/ward/bin/ward-entry.js`** — Plain JS file (no TS compilation needed). Ward's tsconfig has
   `rootDir: "./src"` so we can't compile `bin/` without restructuring output paths. Plain JS avoids this:
   ```js
   #!/usr/bin/env node
   const { StartWard } = require('../dist/startup/start-ward');
   StartWard({ args: process.argv }).catch((error) => {
     process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
     process.exit(1);
   });
   ```
3. **`packages/ward/package.json` postbuild** — Add `chmod +x bin/*.js` to make the entry executable
4. **No tsconfig changes needed** — bin entry is plain JS

## Constraint conflicts

None identified. All logic fits cleanly into the flow/responder pattern. No additional npm package whitelisting needed
for flows (the ward flow does pure routing without framework imports).
