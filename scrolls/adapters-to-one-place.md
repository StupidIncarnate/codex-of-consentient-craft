# Adapters to one place

Direction agreed on 2026-09-25, and every question raised about it was settled the same day, either in discussion ("Structure") or as an obvious default ("Defaults decided without discussion"). A few details are left for build time; each is marked "Still to settle when building".

**The gateway**, in this doc, means the four workspace packages this direction creates:
`packages/npm` for third-party npm packages, `packages/node` for everything the Node runtime provides, `packages/browser` for everything the browser provides, and `packages/bin` for programs installed on the machine, such as git and the Claude CLI. `@acme` below stands for any repo's own scope; in this repo it is `@dungeonmaster`.

## The problem

Every number here comes from one TypeScript-checker scan of implementation files on 2026-09-25. Test files and the testing package are left out. The scan scripts are in `tmp/adapters-fresh/`.

### Most adapters do nothing, and the rest are copied

315 adapter files exist outside the testing package; production code reaches 290 of them.

| What the adapter's code does                                            | Adapters |
|-------------------------------------------------------------------------|----------|
| Adds something: failure handling, fixed options, several calls, parsing | 156      |
| Makes one library call and adds nothing                                 | 56       |
| Only calls another of our own packages                                  | 66       |
| Calls no library at all                                                 | 12       |

35 library functions are wrapped in more than one package, across 135 adapter files. `readFile` and
`writeFile` are each wrapped in 9 packages. `join`, `dirname`, `mkdir` and `existsSync` are each wrapped in 7.

### The copies drift apart

- **`fsReadFileAdapter` exists in 9 packages, in two
  shapes.** The cli, config, orchestrator and siegelense copies wrap every error in `new Error(…, { cause })`. The hooks, mcp, server, tooling and ward copies let the raw Node error through. Callers are written against their own package's shape:
  hooks' `file-read-or-empty-broker.ts` checks `error.code === 'ENOENT'`, and siegelense's
  `boot-lock-release-broker.ts` digs into `error.cause` behind a 20-line comment.
- **`globFindAdapter` exists in 3 packages, with 3
  behaviours.** mcp takes its ignore list from the caller and leaves out directories. server and tooling hard-code four ignore patterns and include directories. server still carries a fallback for glob v7, left over from the last glob upgrade.
- **Forwarders to the orchestrator drift too.** mcp's `getQuest` wrapper passes `flowId` and
  `packageName`; server's copy of the same wrapper drops both.
- **Setup is copied at call sites.** Three mcp flow files each define their own
  `jsonSchemaOptions = { $refStrategy: 'none' }`, used by 20 calls.

### The one job adapters should do happens at the callers

275 of the 1,245 production calls to adapters sit inside a `try` or a `.catch`. 61 of them wrap a read-file adapter and give "the file is missing" four different meanings. One of those loses user data: `settings-permissions-add-broker.ts:62-67` swallows every read error, and line 119 writes the file back. A `settings.json` with one typo is replaced by a file holding only our permissions.

### Copied type trees

Contracts may not import a package's types, so eslint-plugin copies them:

| Copy                                                                         | Lines | Stands in for                              |
|------------------------------------------------------------------------------|-------|--------------------------------------------|
| `eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`                  | 597   | @typescript-eslint's AST spec, 2,164 lines |
| `eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts`      | 95    | ESLint's types, 2,296 lines                |
| `eslint-plugin/src/statics/tsestree-node-type/tsestree-node-type-statics.ts` | 183   | the AST node-type enum                     |

133 implementation files use the copies. The AST copy is one flat node type with every field optional, so the 327 `.type === '…'` checks in those files tell TypeScript nothing, and the files carry 366 `?.` guards.

### Why the current rules produce this

- "Only `adapters/` may import a package" is cheapest to satisfy by writing another adapter in your own package. That is how `readFile` ended up wrapped 9 times.
- "Contracts may not import a package's types" is cheapest to satisfy by copying the types. That is how the 597-line AST copy happened.

## What the direction has to satisfy

| # | Requirement                                                                                                                                                   |
|---|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | Setup and failure handling around a package live in one place, so a fix reaches every caller                                                                  |
| 2 | Swapping one package for another touches one place                                                                                                            |
| 3 | Nobody copies a large type tree, such as TypeScript's or ESLint's                                                                                             |
| 4 | Once code around a package needs care, every use of that package goes through the careful version                                                             |
| 5 | Our own workspace packages call each other directly, with no wrapper                                                                                          |
| 6 | A model that hits a lint error in the middle of other work takes the correct fix, because the correct fix is small and local and every cheap escape is closed |

## The direction

1. **The gateway.** Four workspace packages: `@acme/npm` in `packages/npm`, `@acme/node` in
   `packages/node`, `@acme/browser` in `packages/browser`, and `@acme/bin` in `packages/bin`. Each outside thing is a subpath carrying its real name: `@acme/npm/react`,
   `@acme/npm/@playwright/test`, `@acme/node/fs`, `@acme/browser/fetch`, `@acme/bin/git`.
   `dungeonmaster init` installs them.
2. **No raw
   imports.** Code outside the gateway never imports an outside package. It imports through the gateway, for example `…/npm/react` or `…/node/fs`, so any wrapping added there reaches every caller.
3. **Two kinds of gateway module.**
    - Pass-through: re-exports the whole package, types included. React and zod are this kind.
    - Wrapped: exports our wrappers, which guard known problems such as missing files and streaming. Node fs and WebSocket are this kind.

   Either way, the package's types pass through; nobody copies them.
4. **Helpers can live in the gateway.** Their exports must be discoverable through
   `get-project-map` and `get-project-inventory`.
5. **Adding a
   package.** Teaching text tells a model adding an npm package to review the package's exports and guard the known problems, such as file handling and streaming, before exposing it.
6. **Starting set:** Node fs, WebSocket, and similar packages that need guarding.
7. **This replaces the `adapters/` folder type.**
8. **Our workspace packages call each other
   directly.** A wrapper whose only job is to call another of our packages is removed.
9. **Consumer repos** are converted by a migration run, not by hand.

## Structure

### The gateway stays under `packages/`

Moving it to the repo root would not change what lint sees: the main rule block applies to every
`**/*.ts` file, not just `packages/**`. It would break every tool that assumes workspace packages live under `packages/*`: ward's package discovery, `get-project-map`, `get-project-inventory`,
`discover`, `create-package` and `init`.

### One package per kind, one subpath per outside package, named for it

Decided on 2026-09-25.

```ts
import { useState } from '@acme/npm/react';
import type { Page } from '@acme/npm/@playwright/test';
import { Button } from '@acme/npm/@mantine/core';
import { createRoot } from '@acme/npm/react-dom/client';     // the package's own subpath, mirrored
import { readFileIfExists } from '@acme/node/fs';
import { fetchJson } from '@acme/browser/fetch';
```

The subpath after `@acme/npm/` is the outside package's real name, `@` included. A model reading the import recognises the package from its training.

An npm package name holds at most one slash (`@scope/name`), so `@acme/npm/react` cannot be a package of its own. It is the `./react` subpath of the package `@acme/npm`. The folders mirror the subpaths exactly:

```
packages/npm/                   "name": "@acme/npm"
  package.json                  exports: "./react", "./zod", "./@playwright/test", "./@mantine/core", …
                                no root "." export: that would be a barrel
  react/index.ts                export * from 'react'
  @playwright/test/index.ts     export * from '@playwright/test'
packages/node/                  "name": "@acme/node"
  fs/index.ts                   our fs wrappers
packages/browser/               "name": "@acme/browser"
  fetch/index.ts                our fetch wrappers for the browser
packages/bin/                   "name": "@acme/bin"
  git/index.ts                  currentBranch(), changedFiles(), …
```

**A subpath starting with `@` resolves everywhere we need it.** Tested with a scratch package in
`tmp/gateway-exp/`:

| Resolver                                                  | `@exp/npm/react` | `@exp/npm/@hono/node-server`      |
|-----------------------------------------------------------|------------------|-----------------------------------|
| Node, ESM `import`                                        | works            | works                             |
| Node, CommonJS `require`, which is how our packages run   | works            | works                             |
| TypeScript `moduleResolution: bundler`                    | works            | works                             |
| TypeScript `node16`                                       | works            | works                             |
| TypeScript `node10`, which this repo's root tsconfig uses | works            | works                             |
| esbuild bundle                                            | —                | works, and React is not pulled in |
| Vite bundle                                               | —                | works, and React is not pulled in |

`node10` resolution ignores `exports` and looks for real folders. It works only because the folders mirror the subpaths, so the mirroring is a requirement, not a style choice.

**Bundles never pull in what is not imported, as long as there is no root
barrel.** Scratch builds, each entry importing only `useState`:

| How the entry imports                                                       | Vite (Rollup)          | esbuild                     |
|-----------------------------------------------------------------------------|------------------------|-----------------------------|
| `import { useState } from '@exp/npm/react'`, a module holding only React    | 61.7 KB, no hono       | 46.3 KB, no hono            |
| `import { useState } from '@exp/npm'`, a barrel re-exporting react and hono | 61.7 KB, no hono       | **104.2 KB, hono included** |
| Control: actually uses `new Hono()`                                         | 66.9 KB, hono included | 57.8 KB, hono included      |

webpack is not installed here, so it was not measured.

**What this shape gives
up.** `@acme/npm`'s `package.json` lists every outside package, and our packages list only `@acme/npm`. Which outside packages one of our packages uses is read from its import lines instead. Installing one of our packages on its own, outside the monorepo, would install every outside package. Inside a workspace this changes nothing: everything installs once at the root.

**What it keeps
simple.** The gateway is four ordinary workspace packages under `packages/*`, so ward, `get-project-map`, `get-project-inventory`, `create-package` and `init` see them without change.

Before/after of this decision: the first answer on 2026-09-25 was one workspace package per outside package (`@acme/npm-react`, `@acme/npm-playwright-test`, nested workspaces under `packages/npm/*`). It was reversed the same day so imports could carry the outside package's real name.

### Type-only imports go through the gateway too

Decided on 2026-09-25. `import type { Page } from '@acme/npm/@playwright/test'`, never
`import type { Page } from '@playwright/test'`. The rule has no exceptions: nothing outside the gateway imports an outside package, value or type, so there is one path to every package.

This differs from global types, which stay usable directly: a global type arrives without an import, while a package's type arrives on an import line the rule already sees.

Today there are 53 type-only imports of outside packages in implementation code: zod 11,
`hono/utils/http-status` 9, rxjs 6, `@playwright/test` 6, fs 5, eslint 3, and others. The number is low because today's rules forbid them in most folders, which is what produced the hand-copied types.

### Test files follow the same rule

Decided on 2026-09-25. Tests, proxies, stubs, harnesses and the testing package import through the gateway like everything else. There are no exceptions for test support files.

A proxy mocks the function its implementation calls. A broker that calls `readFileIfExists` from
`@acme/node/fs` has a proxy that mocks `readFileIfExists`, imported from `@acme/node/fs`. Mocking
`fs` underneath would still intercept the call, but it would skip the wrapper's own behaviour, which is what the broker relies on. Inside the gateway, a wrapper's own proxy mocks `fs` directly.

What this rewrites, measured on 2026-09-25:

| File kind                      | Raw imports | Files | Mostly                                                      |
|--------------------------------|-------------|-------|-------------------------------------------------------------|
| Proxies                        | 424         | 330   | `fs` 185, testing-library 94, `path` 30, `child_process` 28 |
| Tests                          | 160         | 126   | testing-library 98, zod 10, react-router 10, React 9        |
| Harnesses                      | 151         | 72    | `fs` 47, `path` 43, `@playwright/test` 27                   |
| The testing package, and stubs | 139         | 125   | zod, `fs`, typescript                                       |

### The gateway is recognised by its location

Decided on 2026-09-25. The workspace packages at `packages/npm`, `packages/node`,
`packages/browser` and `packages/bin` are the gateway, whatever the repo's scope makes their names. Lint and our tools target them with the path globs `packages/npm/**`, `packages/node/**`,
`packages/browser/**` and `packages/bin/**`, and need no configuration. The check that refuses raw imports allows an import only when it resolves into one of those four folders.

### Naming in a repo with no scope

Decided on 2026-09-25. A repo whose root `package.json` has a scoped name uses that scope:
`@acme/npm`, `@acme/node`, `@acme/browser`, `@acme/bin`. A repo whose root name is unscoped gets a scope built from that name: a root named `acme-app` gets `@acme-app/npm`, `@acme-app/node`,
`@acme-app/browser` and `@acme-app/bin`. `init` writes the names.

Unscoped names are ruled out: `npm` and `node` are real packages on the npm registry, and the workspace link would shadow them inside the repo.

Still to settle when building `init`: a root `package.json` with no `name` at all.

### Four packages, split by where the code comes from

Decided on 2026-09-25. Whether something is imported or global only says how code reaches it; where it comes from decides how it behaves. So the gateway is four packages:

| Package         | Holds                                                           | Examples                                                                                                |
|-----------------|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `@acme/npm`     | third-party packages                                            | `@acme/npm/react`, `@acme/npm/@hono/node-ws`                                                            |
| `@acme/node`    | everything the Node runtime provides, modules and globals alike | `@acme/node/fs`, `@acme/node/process`, `@acme/node/console`, `@acme/node/fetch`                         |
| `@acme/browser` | everything the browser provides                                 | `@acme/browser/fetch`, `@acme/browser/WebSocket`, `@acme/browser/localStorage`, `@acme/browser/console` |
| `@acme/bin`     | programs installed on the machine, run through `spawn`          | `@acme/bin/git`, `@acme/bin/claude`, `@acme/bin/npm` (see "Outside programs get homes in `@acme/bin`")  |

A CLI runs on Node, so it uses `@acme/node`, and ink comes through `@acme/npm`.

Before/after: the first answer the same day put globals in a separate `@acme/globals` package (`@acme/globals/browser/fetch`). It was replaced because `fs` and `console` both come from Node and belong together.

The same global behaves differently on each platform:

|                                        | Browser                                 | Node (18+, built on undici)                                                                                                                      |
|----------------------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `fetch` network failure                | `TypeError: Failed to fetch`, no detail | `TypeError: fetch failed`, the real error (`ECONNREFUSED`, …) in `.cause`; built outside Jest's sandbox, so `instanceof Error` is false in tests |
| `fetch('/api/quests')`, a relative URL | resolved against the page               | refused; a full URL is needed                                                                                                                    |
| CORS, cookies, restricted headers      | applied                                 | not applied                                                                                                                                      |
| `console` / `process.stdout`           | 52 `console` calls in web               | 224 direct `process.stdout/stderr.write` calls across the Node packages                                                                          |

The drift is already here: web and shared each have a `fetchGetAdapter` with the same name and signature. shared's copy puts the response body in its error and wraps invalid JSON; web's does neither.

**A WebSocket server is always an npm
package.** Here the server side is `@hono/node-ws`, so it goes through `@acme/npm/@hono/node-ws`. The browser's built-in client, `new WebSocket(url)`, comes from the browser, so it goes through `@acme/browser/WebSocket`; web has no WebSocket package in its dependencies. A project that uses `ws` or `socket.io-client` imports them through `@acme/npm` like any package.

### Lint reads a package's platform from dungeonmaster's package-type detection

Decided on 2026-09-25. Package types are already detected from a package's folders and
`package.json`, by `architecturePackageTypeDetectBroker` and `packageBrowserTypeTransformer` in shared. Ward already uses the detection for e2e eligibility (`check-run-e2e-broker.ts:63`).

| Package type                                                                                                       | Platform                                                                      | A direct `fetch` is sent to         |
|--------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|-------------------------------------|
| `frontend-react`                                                                                                   | browser                                                                       | `@acme/browser/fetch`               |
| `frontend-ink`, `cli-tool`, `http-backend`, `mcp-server`, `hook-handlers`, `eslint-plugin`, `programmatic-service` | Node                                                                          | `@acme/node/fetch`                  |
| `library`                                                                                                          | not decided by its own type: it runs wherever the packages that import it run | checked by following imports, below |

`@acme/bin` runs programs through Node's `child_process`, so it is Node-only, like `@acme/node`.

### Platform code must not reach a package on the other platform

Decided on 2026-09-25. Lint starts from each package's own files, follows every import into the packages it depends on and onward, and flags a file that is actually reached and imports the other platform's gateway:

```
web (browser) → @acme/shared/brokers/cwd-resolve → @acme/node/fs
@acme/node is not available in a browser package
```

It follows imports rather than reading `package.json` dependencies alone, because it catches errors better:

|                                     | `package.json` only                                                                                                                         | `package.json` plus following imports |
|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| Node code actually reached from web | caught only when the dependency is listed; npm workspaces install everything at the root, so an unlisted import still works and goes unseen | caught, listed or not                 |
| False alarms                        | yes: it flags shared today, whose brokers use Node though web never loads them                                                              | none                                  |
| What the error names                | a whole package                                                                                                                             | the exact import chain                |
| The fix it pushes a model toward    | split a package, or escape the error                                                                                                        | change or remove one import           |

What shared imports today, and why the import-following version stays quiet on it:

| shared folder                                                 | Outside imports                                                                                     | Imported by web                                     |
|---------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `contracts/` (238 files)                                      | `zod`                                                                                               | yes, 291 imports                                    |
| `adapters/` (16 files)                                        | Node: `path`, `child_process`, `fs`, `fs/promises`, `os`, `readline`, `net`; npm: `fast-xml-parser` | no                                                  |
| `brokers/`, `guards/`, `statics/`, `transformers/`, `errors/` | none; the brokers reach Node through shared's adapters                                              | guards 6, statics 10, transformers 3; brokers never |

After the migration, shared's brokers import `@acme/node` directly. Web never reaches them, so nothing is flagged unless web starts importing them.

**Cost:** the check needs the repo-wide import graph, so it runs in ward, not in the per-edit hook ("Defaults", item 9).

npm packages that run on only one platform, such as `@playwright/test` reached from web, are not detected in the first version ("Defaults", item 6).

### A lint rule forbids every platform global outside the gateway

Decided on 2026-09-25. Code outside the gateway may not use a platform global directly. It imports it from the gateway package for its platform instead:

```ts
process.stderr.write(line);                      // refused
import { stderr } from '@acme/node/process';     // what replaces it

globalThis.fetch(url);                           // refused
import { fetchJson } from '@acme/browser/fetch';
```

**What counts as a platform global, with no
list:** an identifier that is not imported, and whose declaration lives in the browser's or Node's type files (`lib.dom*`, `lib.webworker*`,
`@types/node`). JavaScript's own built-ins are declared in `lib.es*` and stay usable: `JSON`,
`Math`, `Promise`, `Array`, `Map`, `Set`, `Date`, `Error`, `RegExp`, `Symbol`, `Intl`. A global reached through `globalThis.X` counts as `X`. The rule needs typed lint, which this repo's config already turns on (`project: true`).

**Global types stay usable
directly.** Decided on 2026-09-25. A type never runs, so it cannot carry a behaviour bug; the rule refuses only runtime uses. `useRef<HTMLDivElement>(null)`, a `Buffer`
parameter type and `NodeJS.ErrnoException` stay as they are. A package's own types still come through the gateway, because they arrive by import.

**What it would refuse
today:** 628 runtime uses in implementation code. The scan also found 93 type uses, which the rule leaves alone. Measured with `tmp/adapters-fresh/globals.cjs`.

| Global                                                       | Uses | Where                                                       |
|--------------------------------------------------------------|------|-------------------------------------------------------------|
| `process.stderr`                                             | 149  | orchestrator 69, siegelense 28, hooks 20, ward 17, server 6 |
| `process.stdout`                                             | 78   | siegelense 19, tooling 16, ward 16, cli 13, hooks 11        |
| `crypto` (Web Crypto, e.g. `crypto.randomUUID()`)            | 52   | orchestrator 35, web 10                                     |
| `console` (as `globalThis.console`)                          | 52   | web                                                         |
| `process.exit`, `process.exitCode`                           | 37   | hooks 19, ward 9                                            |
| `process.stdin`                                              | 25   | hooks 22, cli 3                                             |
| `process.env`                                                | 25   | orchestrator 8, shared 6                                    |
| `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` | 57   | siegelense, orchestrator, web, server                       |
| `Buffer`                                                     | 8    | siegelense 4, tooling 2                                     |
| `localStorage`                                               | 18   | web                                                         |
| `fetch` (as `globalThis.fetch`)                              | 12   | web 5, hooks 2, siegelense 2                                |
| `require.resolve`, `__dirname`, `__filename`                 | 17   | cli, orchestrator, server                                   |

By package: web 149, orchestrator 134, siegelense 99, hooks 77, ward 47, cli 32, server 28, tooling 21, mcp 13, shared 13.

**Globals present on both platforms** (`setTimeout`, `fetch`, `crypto`, `console`,
`AbortController`, `Blob`) go to `@acme/node/<name>` or `@acme/browser/<name>` by the package's platform, from package-type detection.

**Output is exported as the raw write.** Decided on 2026-09-25, for now. `@acme/node/process`
exports `stdout` and `stderr`, and `@acme/browser/console` exports the console, unchanged. Each package keeps its own logger or output module on top, because the same write means different things by package:

| Package                               | What its writes are                                                                           |
|---------------------------------------|-----------------------------------------------------------------------------------------------|
| server, orchestrator, siegelense, mcp | log lines for a developer; server already gates them behind `VERBOSE=1` with a `[dev]` prefix |
| ward, tooling, cli                    | the answer a person reads                                                                     |
| hooks                                 | the JSON reply Claude Code reads; a stray log line on stdout corrupts it                      |

A shared logger in the gateway is not ruled out; it is not part of the first version.

### Outside programs get homes in `@acme/bin`

Decided on 2026-09-25. Programs installed on the machine, such as git and the Claude CLI, are the same problem as a library, reached through `spawn` instead of `import`. Following the split by where code comes from, they get a fourth gateway package, `@acme/bin`, in `packages/bin`:
`@acme/bin/git`, `@acme/bin/claude`. Their wrappers return plain values: the current branch, the changed files, the Claude CLI's output lines. Translating those lines into our chat entries stays in orchestrator, because it uses our contracts.
**How Claude is launched is going to change, which is exactly why its launch must live in one place.**

**How lint detects a program run outside its home:**

1. Raw `child_process` can be imported only inside the gateway, so every process start goes through
   `@acme/node/child_process`.
2. At each call to it, lint reads the command: a literal, the first word of a template or shell string, a statics value or a module constant. `sh -c '<script>'` is read by the script's first word. If that program has a home in `@acme/bin`, the call is refused:

   ```ts
   spawnCapture({ command: 'git', args: ['rev-parse', '--abbrev-ref', 'HEAD'] });
   //                     ^ git has a home: use currentBranch() from @acme/bin/git
   ```
3. The Claude CLI is always spawned through a resolved path, never by name. Its path comes from resolving the `@anthropic-ai/claude-code` package, so the raw-import rule treats
   `require.resolve('<package>')` as an import of that package. Only the Claude home can locate the CLI, so nothing else can spawn it.
4. **Commands built at runtime are
   allowed.** Lint cannot read them, and most are commands users configure in `.dungeonmaster.json` or paths to our own CLIs.

What this covers today, from a checker-resolved scan (`tmp/adapters-fresh/spawns.cjs`): 76 calls start a process. 24 sit inside the child-process adapters and pass a parameter through; those become the gateway's own code. Of the 49 elsewhere:

| The call names                                                                                                                        | Calls                               | Lint reads the program                                            |
|---------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|-------------------------------------------------------------------|
| `'git'`                                                                                                                               | 24 (orchestrator, siegelense, ward) | yes                                                               |
| `lsof`, `kill`, `npm`                                                                                                                 | 7                                   | yes                                                               |
| a statics value                                                                                                                       | 1                                   | yes                                                               |
| a runtime value: user-configured commands, our own CLIs' paths with env overrides, `process.execPath`, the Claude CLI's resolved path | 17                                  | no; the Claude CLI is covered by step 3, and the rest are allowed |

### Our lint rules skip the gateway as a whole

The shipped lint config is built in one place, `configDungeonmasterBroker` in eslint-plugin, which consumers receive too.

```js
// every rule we have now, and every rule we add later
{ files: ['**/*.ts', …], ignores: ['packages/npm/**', 'packages/node/**', 'packages/browser/**', 'packages/bin/**'], rules: { …ourRules } }

// the gateway's own, short rule set
{ files: ['packages/npm/**', 'packages/node/**', 'packages/browser/**', 'packages/bin/**'], rules: { …gatewayRules } }
```

A rule added to the main set later skips the gateway without anyone remembering to exempt it.

### Tests

The gateway has its own Jest config that extends the root base, so `registerMock` proxies and the unit-test I/O trap work there as they do for adapters today.

Draft of the gateway's own rule set:

| File kind                                              | Rule                                                                                                                                |
|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Pass-through entry (`react/`, `zod/`)                  | Holds only re-exports: `export * from 'react'`, plus `export { default }` where the package has a default export. No test or proxy. |
| Wrapper (`node/fs/`, `browser/WebSocket/`, `bin/git/`) | Colocated `.test` and `.proxy`. No silent catch.                                                                                    |
| Imports                                                | Outside packages and other gateway files only, never our workspace packages, which keeps the gateway the bottom layer               |
| Layout                                                 | One folder per outside package, named exactly after it, and one subpath export per folder                                           |
| Type re-exports                                        | Allowed: re-exporting types is the gateway's job                                                                                    |
| Proxies for callers                                    | The gateway exports its wrappers' proxies through a `./testing` subpath, as orchestrator, shared and siegelense already do          |

## Defaults decided without discussion

Decided on 2026-09-25 as the obvious answers, so the discussion could focus on the questions that need a judgement. Any of them can be reopened.

1. **Dependencies.** `@acme/npm` lists outside packages as ordinary dependencies, so its
   `package.json` is the one place every version is set and upgraded. A package the host must supply stays a peer dependency: the ones our packages already declare as peers today (eslint and
   `@typescript-eslint/*` in eslint-plugin, hooks and ward; `typescript` in eslint-plugin;
   `@playwright/test` in siegelense; `@anthropic-ai/claude-code` in cli). Our other packages list only the gateway packages they use: `@acme/npm`, `@acme/node`, `@acme/browser`, `@acme/bin`. Listing everything as a peer would scatter versions again; listing everything as ordinary would give a consumer two ESLints.
2. **Pass-through or wrapped.** Whoever adds a gateway module decides, guided by the teaching text.
    - A module starts as a pass-through (`export * from 'glob'`) unless the package touches the outside world on the host: Node's `fs`, `child_process`, `net`, and the browser's `fetch`,
      `localStorage`, `indexedDB`, `WebSocket`. Those start curated: only reviewed wrappers, no
      `export *`. Every `@acme/bin` module is curated, since a program has no exports to pass through. `path` is a pass-through.
    - **A pass-through gains a wrapper by overriding one
      export.** An explicit export takes precedence over `export *` for the same name. When a bug in one function turns up, such as glob's ignore list, the module overrides `glob` with a guarded version, and every caller gets the fix without changing a line.
3. **Wrapper
   signatures.** A wrapper takes and returns plain values or the gateway's own types, never the package's objects when a plain value will do. For example, a directory read returns names and kinds, not `Dirent`. That keeps a swap inside the gateway. A package's own types are still re-exported for code that needs them, such as Playwright's `Page`.
4. **Subpath names for globals** use the global's exact name: `@acme/browser/document`,
   `@acme/browser/window`, `@acme/browser/navigator`, `@acme/node/process`, `@acme/node/Buffer`.
5. **CommonJS module values stay usable directly.** `__dirname`, `__filename` and `require` (with
   `require.resolve`) are declared as globals, but each module gets its own copy: `__dirname` is the folder of the file that uses it. Exported from the gateway, they would describe the gateway's own folder. They are the only globals exempt from the globals rule. 17 uses today. The argument of
   `require.resolve` still counts: `require.resolve('<package>')` is treated as an import of that package (see "Outside programs get homes in `@acme/bin`").
6. **Single-platform npm
   packages.** The first version of lint does not detect them. The web build already fails when browser code reaches a Node built-in. Revisit if a case slips through.
7. **The gateway's own rule set**, starting point:
    - Applied: `ban-silent-catch`; the file header rule (`enforce-file-metadata`); a colocated `.test`
      and `.proxy` for every wrapper; the proxy and test rules, since the test preset applies to the gateway's tests as it does everywhere; imports limited to outside packages and the gateway's own files; folders mirroring the subpath exports; no root `"."` export.
    - Not applied: folder-type structure, the brand and contract rules, `ban-primitives`,
      `forbid-type-reexport`, and the per-folder import allowlists.
    - The carve-out removes the gateway from the main implementation preset only. Its tests still get the test preset.
8.
**Discovery.** `get-project-map` shows the four gateway packages as a new package type, `gateway`, listing their subpaths and whether each is a pass-through or wrapped. `get-project-inventory` lists each wrapped subpath's exported functions with their PURPOSE line. A pass-through subpath shows only the package name and version, since its exports are the package's own.
9. **Escapes and timing.**
    - `eslint-comments/no-use` is turned back on, and its 2 current uses are cleaned up.
    - `require()` and `import()` of an outside package are refused outside the gateway.
      `ban-require-in-source` already covers `require()`.
    - The raw-import rule and the globals rule run in the per-edit hook. The globals rule needs typed lint; if the hook cannot give it that, the rule runs in ward.
    - The import-following platform check runs in ward, because it needs the whole import graph.
10. **Migration order in this repo:**
    1. Create the four gateway packages, with a pass-through module for every package imported today. The new rules stay off.
    2. Rewrite every import and global use to gateway paths mechanically: 2,393 import statements and 628 global uses. Ward stays green.
    3. Turn on the raw-import and globals rules.
    4. Move the generic wrappers into gateway modules one package at a time: fs, child process, fetch, glob, the WebSocket client, localStorage, and the programs git, npm and the Claude CLI. Reconcile the copies as each moves. The two read-file error shapes are one such reconciliation, and every caller written for the losing shape has to be reviewed. So is
       "read the current branch", written once in orchestrator and once in siegelense.
    5. Delete the forwarders. Move the adapters holding our own logic into brokers. Delete the type copies.
    6. Remove the `adapters/` folder type. Update the teaching text and the tools: map, inventory,
       `init`, `create-package`.
11. **The consumer migration
    run:** `init` scaffolds the four packages, named from the repo's scope, and generates a pass-through module for every package the repo imports. It then rewrites imports and global uses and turns the rules on. Wrapping is left for later, when the repo finds a reason.

## What moves where

| Today                                                                                                                                                                   | After                                                                                                                                            |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Generic wrappers: fs, child process, fetch, glob, the WebSocket client                                                                                                  | Wrapped gateway modules in `@acme/node`, `@acme/npm` or `@acme/browser`, by where each comes from                                                |
| Adapters holding our own logic: loading the dungeonmaster config, the Playwright session, ELK's flow-graph layout, translating the Claude CLI's lines into chat entries | Brokers in their own packages, calling the gateway. The gateway imports none of our code, so it cannot hold logic written against our contracts. |
| Adapters and brokers that run outside programs: orchestrator's 15 git adapters, ward's 4 git brokers, siegelense's git and npm adapters, spawning the Claude CLI        | Wrapped modules in `@acme/bin`: `@acme/bin/git`, `@acme/bin/npm`, `@acme/bin/claude`                                                             |
| 66 adapters that only call another of our packages                                                                                                                      | Deleted. Their 102 call sites call the other package directly.                                                                                   |
| 12 adapters that call no library                                                                                                                                        | Transformers or guards, by what they do                                                                                                          |
| 1,489 raw import statements in 1,362 implementation files, covering 44 packages (zod alone: 1,037)                                                                      | Rewritten to gateway paths                                                                                                                       |
| 904 raw import statements in 678 test-side files: tests, proxies, stubs, harnesses and the testing package                                                              | Rewritten to gateway paths. Proxies of callers mock gateway exports.                                                                             |
| 628 runtime uses of platform globals (`process.stderr`, `console`, `setTimeout`, `fetch`, …)                                                                            | Imported from `@acme/node` or `@acme/browser`                                                                                                    |
| The three copied type trees in eslint-plugin                                                                                                                            | Deleted. The 133 files that use them import the real types through the gateway.                                                                  |

## Questions raised, and where each was settled

1. Settled: four packages split by where the code comes from, `@acme/npm`, `@acme/node`,
   `@acme/browser` and `@acme/bin`, with one subpath per outside thing named for it (see
   "Structure").
2. Settled: lint finds the gateway by its location, and a repo with no scope builds one from its root package name (see "Structure").
3. Settled: a package's platform comes from dungeonmaster's package-type detection, and lint follows imports to catch code that reaches the other platform's gateway (see "Structure"). Single-platform npm packages: see "Defaults", item 6.
4. Settled: every runtime use of a platform global goes through the gateway, global types stay usable directly, and output is exported as the raw write (see "Structure"). Subpath names and the CommonJS exemption: see "Defaults", items 4 and 5.
5. Settled: type-only imports go through the gateway too (see "Structure").
6. Settled: test files follow the same rule (see "Structure").
7. to 13. Decided as defaults: dependencies, pass-through or wrapped, wrapper signatures, the gateway's rule set, discovery, escapes and timing, and migration order (see "Defaults decided without discussion").
14. Settled: outside programs get homes in a fourth gateway package, `@acme/bin`, and commands built at runtime are allowed (see "Structure"). The case for it: git code sits in three packages today, and "read the current branch" is written twice. orchestrator spawns
    `['rev-parse', '--abbrev-ref', 'HEAD']`, and siegelense runs
    `execSync('git rev-parse --abbrev-ref HEAD')`. ward and siegelense do not depend on orchestrator, so they could not use its git code.

Out of scope for this doc: duplicated logic that is our own, not the use of an outside package. The dungeonmaster config is read four ways today: config's official loader, shared's own reader in
`port-config-walk-broker.ts` with a different contract (`projectConfigContract`), a raw
`JSON.parse(readFileSync(…))` in web's `playwright.config.ts`, and forwarders in orchestrator and siegelense. shared cannot call config's loader, because config depends on shared. That is ordinary duplicated code, and it exists with or without adapters.
