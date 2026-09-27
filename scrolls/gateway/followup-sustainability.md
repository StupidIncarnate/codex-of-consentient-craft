# Gateway: sustainability follow-ups

Open problems and unbuilt work for `packages/@gateway`, the folder holding the four gateway packages
(`npm`, `node`, `browser`, `bin`) that code imports as `#gateway/<folder>/<subpath>`. Each item names
what is wrong or missing, where, and why it costs us later. Finished work is removed; git history has
it.

## Found in the first review

### 5. Adding a gateway folder means editing many hand-kept copies of the same list

The four folder names (`npm`, `node`, `browser`, `bin`) are written out separately in:

- the `imports` field of every workspace `package.json`, gateway packages included
- `gatewayLocationsStatics`, twice: once in `folders` and again in `packageGlobs`
- `gatewayFoldersStatics` in `cli`, which `init` scaffolds from, and the node/browser split in
  `gatewaySourceCopyStatics` beside it

Nothing checks that these copies agree. A fifth folder, or a renamed one, means finding every copy
by hand.

### 6. Two whole-repo checks run only when asked for

`npm run ward -- platform` and `npm run ward -- dedupe` are separate subcommands. A bare
`npm run ward` runs neither, and neither result is saved for `ward list` or `ward detail`. A
platform crossing or a duplicate install goes unnoticed until someone remembers to run them. Item 30
has the work.

## Found in the file-structure review

### 10. Each `bin` program repeats the same run-and-error pair

`git`, `npm`, `kill` and `cp` each have a `<program>-run/` and a `<program>-not-installed-error/`
wrapper folder (`bin/src/git/git-run/`, `bin/src/git/git-not-installed-error/`). These turn `RunNotFoundError` into a program-specific error class, and each has its own proxy
and test. `lsof` has the error class but no run file, so it does the same job a different way. A new
program means copying four to six files and choosing which of the two styles to follow.

### 12. The npm gateway hand-writes types for the MCP SDK

`packages/@gateway/npm/@types/modelcontextprotocol-sdk.d.ts` declares part of the SDK by hand. The
file says it copies `packages/mcp/@types/modelcontextprotocol.d.ts`. Both copies exist because
`moduleResolution: "node"` could not read the SDK's `exports` map. The repo now resolves with `node16`,
which does read it, so both may be deletable: delete them and typecheck. A hand-written type copy breaks
the design doc's requirement 3:
"Nobody copies a large type tree". A per-package `@types/` folder also breaks `packages/CLAUDE.md`,
which says type definitions go in the root `@types/`.

### 15. `render` in the npm gateway is web's test setup

`packages/@gateway/npm/src/testing-library__react/render/render.ts` wraps every render in `MantineProvider`.
That is one app's choice of UI library, placed inside the shared wrapper for `@testing-library/react`.
It makes `@testing-library/react` depend on `@mantine/core`. A second React package using another UI
library would have to override `wrapper` on every call.

### 17. `bin/npm` and the `npm` gateway share a name

`#gateway/npm/...` means an npm package. `#gateway/bin/npm` means the `npm` program. A model reading
`npm` in an import must check which prefix it is under.

### 19. Every pass-through carries its own near-identical test

Each pass-through folder has its barrel (`<subpath>/<subpath>.ts`) and a `<subpath>.test.ts` that is a
copy of one template. For the `export *`
form, the test compares export keys, which is useful. For the named-list form used by `react` and the
other `export =` packages, the test checks one or two names. A new export in the real package goes
unnoticed until a caller hits a type error. One table-driven test would cover every pass-through and
remove a file per subpath. Barrels are excluded from the one-export rule, so the standards do not yet
say whether a barrel needs a test of its own.

## Gateway standards not built yet

The layout itself is built: one folder per subpath under `src/`, named with `__` for `/` and scopes
and no `.js` (`fs__promises`, `modelcontextprotocol__sdk__types`); a barrel named after its folder;
one folder per wrapper; a `<subpath>.proxy.ts` test barrel reached as `#gateway/<pkg>/_test_/<subpath>`;
`node16` resolution with the `source` and `gateway-dist` conditions; `sideEffects`; and `init`
scaffolding it all for consumers. What follows is agreed but not built.

### Lint rules that keep the layout honest

Barrels are written by hand, and nothing checks them yet. Build:

- A barrel holds at most one `export * from '<its real module>'`, plus one re-export per function or
  schema file in the folders beside it, and nothing else.
- The `_test_` barrel re-exports every proxy and stub in those folders, and nothing else.
- Linting a function, schema, proxy or stub file fails when the matching barrel does not re-export it.
- Linting a barrel fails when it re-exports a file that does not exist, or misses one that does.
- Every gateway file other than a barrel exports one thing, and is named after it. Files declaring
  only types count; `gateway-colocation` already exempts them from needing a test and a proxy.
- Every subpath ships at least one stub (item 25).

These barrels do not fit the first rule today and need a decision when it is built:

- `node/src/fs__promises/fs__promises.ts` re-exports `isFsError` and `FsError` from the `fs` subpath's
  folder, not its own. Callers of `#gateway/node/fs__promises` use them.
- `npm/src/fast-xml-parser/fast-xml-parser.ts` names its exports instead of `export *`, because
  the package's CommonJS types are `export =` (`TS2498`).
- `node/src/process`, `node/src/module` and `node/src/path` cannot pass their real module through
  with `export *` for the same reason; `path` uses `import mod = require('path'); export = mod;`.

### A `gateway` config in `.dungeonmaster.json` constrains the gateway as bugs arise

Not built: no `gateway` key, no validation and no rules exist. It matters now: the Node module
subpaths pass their real module through with `export *` (`#gateway/node/fs` exports raw `readFileSync`,
`#gateway/node/child_process` exports raw `spawn`), and nothing bans the unsafe ones until this exists.

Lint rules read a `gateway` key in `.dungeonmaster.json`. `dungeonmasterConfigContract` validates it,
and `init` writes an empty one in consumer repos. Nothing is restricted until an entry says so.

```json
"gateway": {
  "bannedExports": [
    {
      "subpath": "#gateway/node/fs__promises",
      "name": "readFile",
      "use": "readTextFile",
      "reason": "readFile returns a Buffer; callers kept treating it as text"
    }
  ],
  "restrictedTo": [
    {
      "subpath": "#gateway/bin/claude",
      "name": "spawnStreamJson",
      "packages": ["orchestrator"],
      "reason": "every Claude spawn goes through orchestrator's agent-spawn broker"
    }
  ]
}
```

| Rule | Fails when |
|---|---|
| Banned export | a file imports a name listed in `bannedExports` from that subpath. The message gives `use` and `reason`. The rule checks the importing file, not the barrel, because a barrel's `export *` cannot leave out one name. |
| Restricted use | a file outside the listed `packages` imports a `restrictedTo` subpath, or the named export when `name` is set |
| Config names exist | a `subpath` is missing from the gateway, a banned `name` is missing from the real outside module, or a listed package is not a workspace package. A rename upstream then fails lint instead of silently banning nothing. |

A `restrictedTo` entry's `packages` names whole workspace packages (`packages/*`), never a folder
inside one.

There is no allow-list. Any package may use any gateway export unless `restrictedTo` says otherwise. A
model is trusted to know which outside packages suit which package, such as web against server.

`bannedExports` replaces a blanket rule that a same-named wrapper must keep the real contract. A raw
call such as `readFile` is banned once the gateway offers enough safer variants to cover its uses.
Guidance for new wrappers, not enforced: prefer a new name when you change a real function's
contract.

Every `subpath` in the config is written in full, starting with `#gateway/`, the same text a caller
imports.

### Jest goes through the gateway like every other outside package

Jest's API is the npm package `@jest/globals`, so it is the subpath `#gateway/npm/jest__globals`. No
package outside the gateway touches `jest` directly, `packages/testing` included. Everything in
`packages/testing` that calls `jest.spyOn`, `jest.doMock`, `jest.requireActual`,
`jest.isolateModulesAsync` or the other `jest` members gets untangled: the jest call moves into a
gateway wrapper, and `testing` calls the wrapper.

To check while untangling: four orchestrator proxies call `jest.requireActual` inside a `jest.mock()`
factory, which is hoisted above every import. A factory that calls an imported gateway function may
run before that import has loaded. Those four need a verified pattern before they switch:
`quest-route-scope-broker.proxy.ts`, `quest-node-dispatch-loop-broker.proxy.ts`,
`quest-run-step-broker.proxy.ts` and `step-handler-riftcarver-broker.proxy.ts`.

### The discovery tools show the gateway as `#gateway`

`get-project-map` lists `#gateway` beside the other packages and points at
`get-project-inventory({ packageName: "#gateway" })` for its contents, as it does for any library
package. The inventory groups subpaths under `node`, `npm`, `browser` and `bin`. Each subpath line
starts with its full import path, says which real module its `export *` passes through, and lists
our wrappers by name. A name banned or restricted by the `gateway` config is marked on that line.

```
## #gateway [gateway] — outside packages, Node, the browser and installed programs, reached only through here

### node
  #gateway/node/fs             passes through 'fs'
      ours: existsSync, readFileSync, readJsonFileSyncIfExists, walkFilesSync, tailFile, …
  #gateway/node/fs__promises   passes through 'fs/promises'
      ours: readFile ✗ banned, use readTextFile, readFileIfExists, readJsonFile, pathExists, …

### bin
  #gateway/bin/claude
      ours: resolveClaudeCliPath, spawnStreamJson (orchestrator only), ClaudeNotInstalledError
```

Measured 2026-09-26: `get-project-map({ packages: ["node"] })` answers `Unknown package(s): node`, and
`get-project-inventory({ packageName: "@gateway" })` answers `## @gateway (0 files) (empty)`. A model
searching the gateway through these tools finds nothing.

The name `#gateway` is the same in a caller's import, in both discovery tools, and in the config.

## Replace every adapter with the gateway, then delete what nothing uses

This is the biggest piece of work left. The trials switched only a sample of callers, and no adapter has
been deleted.

`scrolls/gateway-build/coverage.md` lists every adapter with its fate and its gateway replacement.
Counted 2026-09-26:

| Fate | Adapters | What happens |
|---|---|---|
| `gateway` | 220 | Switch each caller to the gateway export `coverage.md` names. The caller's proxy composes the wrapper's proxy from its `_test_` barrel (item 28). Then delete the adapter with its proxy, test and stub. |
| `split` | 43 | The outside half moves to a gateway wrapper. Our half becomes a broker or transformer in the package that owns it, sorted by the architecture: pure is a transformer, an operation is a broker. |
| `stays` | 83 | See below. None stays an adapter: the `adapters/` folder type goes away. |
| `dead` | 3 | Delete. |

The 83 `stays` adapters, sorted by what their code does:

| What it is | Count | What happens |
|---|---|---|
| A one-line forward into another of our packages: 18 in `mcp/src/adapters/orchestrator/`, 47 in `server/src/adapters/orchestrator/`, and `dungeonmaster-config-resolve-adapter.ts` in orchestrator and in siegelense | 67 | Callers import the other package directly (design direction #8). Delete the forwards. |
| `hooks`'s `dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts`, which filters `dungeonmasterRuleEnforceOnStatics` | 1 | A transformer in `shared`, beside the statics it reads |
| `hydration-recipes`'s `dm-http-response-unwrap-adapter.ts` builds a `{url, status, body}` error, and `hydration`'s `route-failure-transformer.ts` reads the same shape | 1 | One owner for that error shape, used by both packages |
| siegelense's `dom-read-`, `key-press-`, `key-read-` and `root-check-layer-adapter.ts`, which build JavaScript source strings for `page.evaluate` | 4 | The strings are siegelense's own code: statics or transformers. The `page.evaluate` call goes through `#gateway/npm/playwright__test`. |
| siegelense's `paste-layer-adapter.ts` and `storage-read-layer-adapter.ts` | 2 | Filed as "no outside call", but both make real Playwright calls. Gateway material. |
| siegelense's `listeners-layer-adapter.ts`, which formats readings it already collected | 1 | A siegelense transformer |
| `testing`'s `register-mock`, `register-spy-on`, `register-module-mock`, `require-actual`, `isolate-modules`, `child-process-mocker` and `timers-watch` adapters | 7 | Their jest, `child_process` and timer calls go through `#gateway/npm/jest__globals` and `#gateway/node`. The exports stay in `testing` (item 21), reclassified by what each does. |

Also:

1. **Delete the adapters the trials already left without callers,** such as mcp's `path/join` and
   `fs-read-file` adapters and siegelense's `git-branch-read-adapter.ts`. They were kept only because
   the trial rules forbade deleting an adapter.
2. **Review the callers items 32 and 33 name** before switching them: the port-kill broker, and the
   `currentBranch` and `killPid` behaviour changes.
3. **Once a package imports an outside package only through the gateway,** delete that package's own
   `package.json` entry for it. The version then lives in the gateway package alone, and `ward dedupe`
   catches any second installed copy.
4. **Move the raw calls that never had an adapter.** Code outside `adapters/` also calls outside
   packages, Node globals and programs directly. `scrolls/gateway-build/lint-measurements.md` counts them
   per package, from the three caller-facing rules. Two known cases: ward's
   `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts` spawns `npm` by hand instead of calling
   `runScript` from `#gateway/bin/npm`, and web's `chat-input-widget.tsx` calls `localStorage.setItem`
   four times (lines 149, 158, 173, 175) with no `try/catch`, so a full storage quota throws out of a
   keystroke handler. `#gateway/browser/localStorage`'s `writeItem` returns the failure instead.
5. **When the last adapter is gone,** turn on the caller-facing lint rules (item 29) and remove the
   `adapters` folder type ("Docs and teaching text to update").

Split the work per package, 1 to 3 files per agent, as the root `CLAUDE.md` says for cleanup agents.

## Docs and teaching text to update

### A `gateway` folder-type doc

Every folder type has a doc that `get-folder-detail({ folderType })` serves, from
`packages/mcp/src/statics/folder-constraints/<type>-constraints.md`, mapped in
`folderConstraintsStatics`. The folder types themselves come from `folderConfigStatics` in
`packages/shared/src/statics/folder-config/folder-config-statics.ts`, which also feeds
`folderTypeContract`, `enforce-project-structure` and the `<dungeonmaster-folderTypes>` session snippet.

Add `gateway-constraints.md`, served as `get-folder-detail({ folderType: "gateway" })`. How
`folderConfigStatics` describes the gateway is open: its fields assume a `fileSuffix` and an
`exportSuffix`, and gateway files carry neither, since each is named after the outside export it wraps.

The doc covers, from the built gateway, the standards above and the items below:

| Topic | Source |
|---|---|
| What goes in: anything whose shape someone else controls, reached through `npm`, `node`, `browser` or `bin`. Jest is `#gateway/npm/jest__globals`. | "Jest goes through the gateway…" |
| The import form `#gateway/<kind>/<subpath>`, `__` for `/` and scopes, no `.js` | `gatewayPathFromImportSourceTransformer` in `shared` |
| The layout: subpath folder, `{subpath}.ts` barrel, `{subpath}.proxy.ts`, one folder per export with its test, proxy, stubs and schemas, nothing deeper | `packages/@gateway/node/src/fs` as built; the `gateway-colocation` and `gateway-layout` rules |
| What a barrel may hold; how a named re-export replaces the raw one from `export *`; the global form `export const { document } = globalThis;` | "Lint rules that keep the layout honest"; `packages/@gateway/browser/src/document/document.ts` |
| Side-effect-only pass-throughs, and the `sideEffects` list | `packages/@gateway/npm/package.json` |
| Nothing is private; a wrapper may call the raw package to build helpers; prefer a new name when changing a real function's contract | the `bin` barrels (`gitRun` and its siblings are exported), the config section |
| Composing two outside calls is a broker in the owning package, not a gateway function | item 32 |
| Return types: the package's type, a gateway-declared type, or `unknown` | item 22 |
| Stubs and schemas | items 25, 26 |
| Proxies: `registerMock` from `@dungeonmaster/testing`, no catch-all defaults, recorded failures, tolerant addressing and read-back, callers import from `#gateway/<pkg>/_test_/<subpath>` | items 21, 23, 24, 28 |
| The `gateway` config: `bannedExports`, `restrictedTo` | "A `gateway` config…" |
| Dependencies: each outside package listed in its gateway package, one installed copy, callers list the gateway package | "Two gateway-dependency checks" in item 30, `gateway-dependency-declared` |
| Worked examples: `fs` (wrapped, with `export *`), `glob` (a wrapper named after its subpath), `zod` (pass-through), `document` (a global) | those folders under `packages/@gateway/*/src/` |

### Existing text that changes

| Where | Says today | Changes to |
|---|---|---|
| `architecture-overview-broker.ts:76` (`get-architecture`), forbidden-folders table | "`lib/` → `adapters/`: Only adapters wrap an npm package" | the gateway wraps outside packages |
| `architecture-overview-broker.ts:110` | "node10 resolution (`moduleResolution: "node"`, used everywhere) ignores the `exports` map…" | `node16` with the `source` condition; how that resolves a root barrel and `#gateway` |
| `architecture-overview-broker.ts`, layer diagram and import rules | `adapters/` alone may import `node_modules` | every folder type imports outside things through `#gateway`; nothing imports a raw package |
| `architecture-testing-patterns-broker.ts:225`, `:251` (`get-testing-patterns`) | "Adapters – Mock npm dependencies (axios, fs, etc.) at adapter boundary" | a caller's proxy composes the gateway wrapper's proxy from its `_test_` barrel |
| `architecture-testing-patterns-broker.ts:297` | allows a constructor-level `calledWith([])` catch-all in some cases | banned for a function that takes arguments (item 23) |
| `adapters-constraints.md` and `folderConfigStatics.adapters` | adapters wrap npm packages | the adapters folder type goes away (design direction #7); what is left is reclassified by what it does into a transformer or broker in the owning package |
| `folderConfigStatics` `allowedImports`, every folder type | `node_modules` for adapters, `adapters/` for the rest | `#gateway` |
| `<dungeonmaster-packages>` session snippet and `get-project-map`'s valid-name list | list `@gateway` as one package | `#gateway` ("The discovery tools show the gateway as `#gateway`") |
| `<dungeonmaster-folderTypes>` session snippet | "adapters/ … Wrap npm package" | the gateway, and no adapters row |
| `packages/CLAUDE.md`, "Root `@types/` folder" | type files go only in root `@types/` | unchanged; `packages/@gateway/npm/@types/` breaks it (item 12) |
| `scrolls/gateway-build/README.md` section 3 | the layout as first built: `index.ts` barrels, one `_test_/index.ts`, `#gateway` tsconfig `paths` | a note at the top pointing at the current layout, as section 2 already has |
| `scrolls/gateway-build/README.md` section 7 | its own list of work not done | a pointer to this doc, so the two lists cannot drift |
| `scrolls/adapters-to-one-place.md`, "Structure" | an update note about the move to `packages/@gateway/` | one more line pointing here for the standards that replace its layout |
| Brands doc, "Today's rules and docs that change" (main checkout) | the testing-patterns and architecture rows for T1–T8 | apply alongside this table; that doc lists them line by line |

The design doc's migration order ends with "Update the teaching text and the tools: map, inventory,
`init`, `create-package`". Map and inventory are "The discovery tools show the gateway as
`#gateway`". `init` is done. `create-package` should refuse, or handle, a name under
`packages/@gateway/`.

## Work carried over from the gateway build

The gateway build kept its own follow-up list. Everything in it that is still open, and still fits the
standards above, is here, rewritten as the work left to do. Checked 2026-09-26.

### 21. Bug: the build orders packages by test-only dependencies, which will report a false cycle

`registerMock` stays in `@dungeonmaster/testing`. The testing standards say every proxy mocks with
`registerMock` from `@dungeonmaster/testing/register-mock`, and name `testing` as its home. Gateway
proxies follow the same rule.

Once `testing` calls jest and other outside packages through `#gateway`, the dependencies are:

| Edge | Needed at |
|---|---|
| gateway proxies and tests import `@dungeonmaster/testing` (a `devDependency`) | test time, and build time for the proxies: gateway builds emit proxies and stubs so callers can compose them, and the build reads `testing` through its `source` condition, not its `dist` |
| `testing` imports `#gateway/...` (a `dependency`) | build time and runtime, so the gateway builds before `testing` |

That is not a cycle. `scripts/build-workspaces.mjs` reports one anyway: `readManifests` merges
`dependencies`, `devDependencies` and `peerDependencies` into one list before it orders the build, so a
test-only `devDependency` counts as a build edge. It then throws `Dependency cycle among workspaces`.

Fix: order the build by the dependencies a package's build actually compiles against, not by
`devDependencies` used only by files its build config excludes. The proxy edge above is read through
`source`, so it needs no build order either. Needed before `testing` switches to `#gateway`.

### 21a. `@dungeonmaster/testing` must be published publicly

Consumer repos need `registerMock`, the I/O trap, the jest setup files and the proxy-mock hoister, and
all of them live in `@dungeonmaster/testing`. Its `package.json` has no `publishConfig` with
`"access": "public"`, and a consumer install of it failed with a 404. `init` already lists it in the
consumer's root `devDependencies`, so today that install fails. It also matters more now: `init` copies
dungeonmaster's node and browser gateways into the consumer, and every copied proxy and test imports
`@dungeonmaster/testing`. Fix: publish it publicly, like the four gateway packages.

### 22. A gateway function returns the package's type, a gateway-declared type, or `unknown`

A gateway function never casts to a type its caller picks. The caller would be claiming what the data
is, with nothing checking the claim. For our own data the gateway returns `unknown`, and the caller
parses it through a contract, because the gateway cannot import contracts. A cast to a type the outside
package declares, or the gateway declares, is fine: it names a real type instead of copying one.

A new lint rule, gateway files only, needs the type checker. It refuses:

| Refused | Example |
|---|---|
| A cast whose target is a type parameter of the enclosing function | `JSON.parse(text) as T` |
| A return type that is a bare type parameter, or a `Promise` of one | `async <T>(…): Promise<T>` |
| A `JSON.parse` result not cast on the line it appears, so `any` leaves the function | `const data = JSON.parse(text);` |

It leaves alone a type parameter that only passes the caller's own value through, such as a generic
array helper, and any cast to `unknown` or to a declared type.

Work:

1. Build the rule.
2. Change `fetchJson` in `#gateway/node/fetch` and `#gateway/browser/fetch` to return `unknown`. Both
   take a `<TResponse>` today and return `JSON.parse(text) as TResponse`.
3. Move every caller to `contract.parse(await fetchJson(…))`.

### 23. Gateway proxies drop their catch-all defaults

A proxy constructor may not stage `calledWith([])` for a function that takes arguments, and may not
stage a predicate that is always true, such as `calledWith([() => true])`. A catch-all answers calls no
test described. A forgotten call then quietly succeeds, and the I/O trap cannot see it, because the call
counts as staged. This is rule T4 of `scrolls/brands-types-tests-rules.md` in the main checkout, and
its lint rule `ban-proxy-catch-all-defaults` covers gateway proxies.

Work: remove `handle.calledWith([]).resolves([])` from
`packages/@gateway/npm/src/glob/glob/glob.proxy.ts`. `file-scanner-broker.proxy.ts` already stages its
second scan by name, so it keeps passing. Any other caller that leaned on the default stages its call.

### 24. Gateway proxies fail with recorded failures, not invented ones

A proxy never hands a hand-made `Error` to a mock's `rejects` or `throws`. A failure comes from a
recorded-failure stub that carries the platform's real fields (T5 of the brands doc).

Work: `fetchJsonProxy`'s `setupNetworkError({ url, error })`, in both fetch modules, accepts any
`Error`. Replace it with a named scenario built on a recorded `ECONNREFUSED` stub. Then check every
other gateway proxy for a parameter that accepts any `Error`. The `node/fs` proxies are known cases:
`fs__promises`' `read-file-if-exists`, `stat-if-exists`, `read-json-file` proxies and the rest
expose `rejects({ path, error: unknown })`. Their replacements are named scenarios such as `denied` and
`invalidJson`, built on recorded failures.

### 25. Every gateway subpath ships stubs for the outside values it hands back

Every subpath has at least one stub. A stub lives in the folder of the function or type it builds, and
exports from the subpath's `_test_` barrel. `@dungeonmaster/testing` ships none.

A stub is typed with the outside package's own type, or a type the gateway declares, never one of our
contracts. It builds whatever the module hands back, not only objects: the `path` stub returns a path
built by the real `path`. It builds a complete value, with no `Partial` and no cast. Gateway runtime
code may cast; a stub may not, because building the value is its whole job.

Work:

1. Extend `gateway-colocation` to require at least one `.stub.ts` per subpath, exported from the
   subpath's `_test_` barrel.
2. Write the gateway stubs that replace the repo's copied-type stubs. The copied stubs and their
   contracts are deleted, not moved, in the brands cleanup:

   | Deleted later | Replaced by, in the gateway |
   |---|---|
   | `TsestreeStub` (eslint-plugin) | one stub per node type in `typescript-eslint__utils`: `CallExpressionStub` and the rest |
   | `EslintContextStub` (eslint-plugin) | `RuleContextStub` in `typescript-eslint__utils` |
   | `TypescriptSourceFileStub` (testing) | `SourceFileStub` in `typescript` |
   | `ChildProcessStub` (hooks) | a stub in `node/child_process` |
   | `FileStatsStub` (hooks) | `StatsStub` in `node/fs` |
   | `TimerHandleStub` (testing) | a stub in `node/setTimeout` |

3. Write the recorded-failure stubs in the module whose failure each records: `FileMissingErrorStub`,
   and `ECONNREFUSED`, `EADDRINUSE`, `ENOTFOUND` and `ESRCH`.
4. Keep `enforce-stub-usage`'s `isGatewayFileGuard` skip for that rule's existing checks. The brands
   doc's new C5 check, no object literal cast to a package type in a test, proxy or stub file, applies
   to gateway files too.

How each replacement builds its value. Checked 2026-09-24 on Node 22.17 while the brands doc was
written:

| Stub | How it builds the value |
|---|---|
| AST nodes | Each parses default code with `@typescript-eslint/parser` and returns the matching node, typed `TSESTree.<Type>`, through one shared parse-and-find function. Tests build 68 distinct node types today. The 12 most used cover 81% of uses (1,602 of 1,974): `Identifier`, `ArrowFunctionExpression`, `CallExpression`, `MemberExpression`, `ObjectExpression`, `Program`, `BlockStatement`, `ReturnStatement`, `Literal`, `ExpressionStatement`, `Property` and `VariableDeclaration`. Write stubs for the node types tests use. |
| AST parent links | The parser does not set `parent`; ESLint adds it while it walks. The shared function walks the tree once with `simpleTraverse(ast, { enter() {} }, true)` from `@typescript-eslint/typescript-estree`. Parsing `foo(a)` gave a real `CallExpression` with its `arguments`, and after the walk its `parent` was set. |
| JSX nodes | `JSXElement` and `JSXFragment` need the parser's `jsx` option. `is-jsx-structural-child-guard.test.ts` builds both. |
| Parser cost | Loading the parser takes about 250 ms once per test file. A parse plus the walk then takes about 0.18 ms: 1,000 warm calls took 176 ms. |
| `RuleContextStub` | A rule context exists only while ESLint lints, so the stub writes every member of `TSESLint.RuleContext`, with no `Partial` and no cast. Nearly all of today's 307 `EslintContextStub` calls override only `report`. |
| `SourceFileStub` | `ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true)` |
| child process | `new ChildProcess()` gives a real instance without spawning, with `PassThrough` streams attached. |
| timer | `setTimeout` gives a real handle, cleared. `.unref()` gives one whose `hasRef()` is `false`. |
| `StatsStub` | The `fs.Stats` constructor works but is deprecated (warning `DEP0180`), so the stub builds the complete object: about 14 data fields, 4 date getters and 7 `is…()` methods. That object is not `instanceof fs.Stats`, so a `Stats` schema uses `z.custom` with a check, not `z.instanceof`. |

### 26. The gateway owns a schema, branded `#Gateway<Type>`, for each of its types our contracts hold

When one of our contracts holds a value of a gateway type, such as a `ChildProcess` or a `WalkedFile`,
it reuses the schema the gateway exports for that type (C9 of the brands doc). The gateway owns the one
check, so every contract holding one shares it. The node, browser and bin gateway packages then import
zod and list it in their own `dependencies`. `gateway-import-boundary` already allows that.

```ts
// packages/@gateway/node/src/child_process/child-process/child-process-schema.ts
export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
// packages/@gateway/node/src/fs/walk-files-sync/walked-file-schema.ts
export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();
```

| Rule | Why |
|---|---|
| A class uses `z.instanceof(Class)`; plain data uses `z.custom<T>(check)` with a check | A bare `z.custom<T>()` accepts a missing field and any junk at runtime, in zod v3 and v4 alike. Measured 2026-09-26, `tmp/zod-lib-field/probe.ts` in the main checkout. |
| The brand text is `#Gateway` plus the type's name | Derived, so nobody picks it. The `#` keeps it apart from our own brand texts. |
| A type name is unique across the four gateway packages | One brand text must mean one check. A second `Stats` in another module would share `'#GatewayStats'`. |
| A stub for a type with a schema returns the branded value, built through the schema: `childProcessSchema.parse(new ChildProcess())` | Our `StubArgument` keeps a `#Gateway` field as it is, so a test passes the gateway's stub, and a partial fake fails to compile. Measured in `tmp/zod-lib-field/brand-probe.ts` in the main checkout. |

Work:

1. Add a schema for each gateway type a contract holds. The brands doc's C9 lint rule refuses
   `z.custom` and `z.instanceof` in `contracts/`, so every contract field that needs one shows up as an
   error.
2. A gateway lint rule, gateway files only: no bare `z.custom<T>()` without a check; a
   `.brand<'…'>()` text must be `#Gateway` plus the name of the type the schema checks; and no two
   gateway modules may export types with the same name.

### 28. Gateway proxies need the addressing and read-back the adapter proxies gave callers

When the trial moved mcp's file scanner onto the gateway `glob`, its callers broke. The old adapter
proxy matched a pattern by its end, so a cwd the test never saw still matched, and it let a test read
back the options a call really sent. Without those, each composing proxy either staged every possible
call or copied the broker's ignore-list logic into itself. `globProxy` now has both.

Check every new gateway proxy against these. Item 23 withdraws the old advice to add a safe default.

- The real call joins a value the caller does not control, such as a resolved cwd, onto the value a
  test wants to stage. Offer a tolerant address, such as an end-of-pattern match or a predicate, beside
  the exact one.
- The replaced adapter proxy matched only some of the call's options. Offer an address that checks only
  the keys it names, so a caller that cannot know a computed option can still stage the call.
- The replaced adapter proxy offered call read-back, such as `getOptionsFor` or `getCallsFor`. Offer
  the same.

Proxies still missing call read-back:

| Package | Proxies |
|---|---|
| bin | every `git` proxy; `cp-run`, `cp-copy-recursive`; `kill-pid`, `kill-group`, `kill-run`; `lsof-listening-pids`; `npm-run`, `npm-install`, `npm-run-build`, `npm-run-script` |
| node | the read-shaped `fs/promises` proxies (`read-file`, `read-json-file`, `readdir`, `readdir-entries`, `realpath`, `readlink`, `stat`, `path-exists` and the rest; the write-shaped ones already have it); `net`'s `free-port-pair` and `is-port-free`; `readline`'s `line-reader` and `question` |
| browser | every `fetch`, `indexedDB` and `localStorage` proxy |

### 29. Turn on the caller-facing lint rules once every caller has moved

`raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban` are built and ship commented out in
`configDungeonmasterBroker`
(`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`). Their
suggestion text already reads `#gateway/...`.

Work: turn them on once every caller imports through `#gateway`; any caller still importing raw fails
the moment they go live. At the same moment, ban the old `@dungeonmaster/<folder>/...` import form.
Otherwise a caller that switched early and one that did not both keep passing.

Before turning on `platform-globals-ban`, close two gaps the gateway build found:

- It misses a global used as an object shorthand, such as `{ fetch }`.
- It does not special-case siegelense's `page.evaluate` callbacks, which run in the driven browser, not
  in siegelense's own process.

### 30. Make the platform-crossing and dedupe checks real ward check types

Both run today only as subcommands: `npm run ward -- platform` and `npm run ward -- dedupe`. Each always
checks the whole repo, takes no `--only`, file list or `--onlyTests`, exits 1 on a violation, and saves
nothing to `.ward/`, so `ward list` and `ward detail` never show it. A bare `npm run ward` runs neither
(item 6). Fix both in one pass:

1. Add `'platform'` and `'dedupe'` to `checkTypeContract`'s enum and `allCheckTypesStatics`. Neither
   spawns a command, so neither fits `checkRunLintBroker`'s spawn-then-parse shape. Each gets its own
   `checkRun…Broker` that calls its broker (`platformCrossingCheckBroker`, `duplicateInstallCheckBroker`)
   in-process and builds a `ProjectResult`: one `ErrorEntry` per violation, `filePath` holding the
   file, `message` holding the display transformer's text.
2. Run each once, at the top of `commandRunBroker`, before the per-package dispatch. Each needs the
   whole repo in one pass, so neither belongs in `singlePackageLayerBroker`'s per-package loop or
   `multiPackageLayerBroker`'s per-package child spawn. Fold its violations into one `ProjectResult` for
   the repo root.
3. Teach `isCheckTypeGuard` and the `--only` parser the new members. Decide what `--committed`,
   `--uncommitted` and a file list mean for a check that always walks the whole repo; today they are
   ignored.
4. Fold the result into `WardResult`, so `storage-save`, `storage-load`, `ward list` and `ward detail`
   carry it.

Still open inside the platform check:

- A package on one platform importing an npm package that only works on the other, such as web
  importing `#gateway/npm/playwright__test`, is not detected. The npm gateway is not split by platform,
  so the walk treats the package as an outside leaf.
- The Node-reaching-browser direction shares its code path with the direction that is tested, but has
  no fixture of its own. Add a fourth fixture scenario to `platform-crossing-check-broker.integration.test.ts`:
  a `cli-tool` or `http-backend` package reaching `#gateway/browser/fetch`.
- `barrelProvidesNameTransformer` looks one level into an `export *`. A barrel that re-exports another
  barrel stops narrowing after the first hop and falls back to following everything. No gateway or
  root barrel chains barrels today, so this only matters if one ever does.

### 31. `gateway-layout` checks that need a per-package unit test

`gateway-layout` checks only that two sibling folders never differ just by case. Three more checks need
a unit test in each gateway package, because they read package data or JSON that ESLint's globs never
reach:

1. Every folder under the npm gateway names a package in its `dependencies` or `peerDependencies`. The
   `__` naming turns a folder name back into the package name, so the test can compare the two.
2. Every folder under the node and browser gateways names a real builtin or global of that platform.
   ESLint runs under Node and cannot see the browser's globals, so this needs a maintained list per
   platform. `nodeBuiltinStatics` already covers Node's modules.
3. Each gateway `package.json` has exactly the `exports` entries the standards name, `./*` and
   `./_test_/*`, and no root `.` entry.

### 32. Write the "list what's on this port, then kill it" broker

The gateway has `listeningPids` in `bin/lsof`, and `killPid` and `killGroup` in `bin/kill`, one module
per program. Every current caller uses them together. Composing them is business logic over two gateway
functions, so it is a broker in whichever package owns port cleanup. Orchestrator and ward each have a
copy today.

Work: write the broker, then move `processKillByPortAdapter` (orchestrator), `netKillPortAdapter` and
`netPortInUseAdapter` (ward) onto it.

### 33. Callers to review when they move onto `currentBranch` and `killPid`

**`currentBranch({ cwd })`** in `bin/git` is async, returns `null` for a detached HEAD, and throws on a
real git failure such as "not a repository".

- Orchestrator's `gitCurrentBranchAdapter` returns `{exitCode, output}` and passes the literal `'HEAD'`
  through for a detached worktree. Each of its callers switches to a plain `string | null` and checks
  `null` instead of `'HEAD'`.
- Siegelense's `gitBranchReadAdapter` was sync and turned every failure into `null`. Trial 1 moved
  `instanceReserveBroker` onto `currentBranch`, and `isGitNotARepositoryErrorGuard` maps only "not a
  repository" back to `null` there. Any other caller that moves has to `await` it, and decide whether it
  wants other git failures to throw.

**`killPid({ pid, signal = 'SIGKILL' })`** in `bin/kill` sends one signal per pid. It does not throw on
a non-zero exit, so the caller reads `exitCode` and `output` to tell "already gone" from a real refusal.

- Ward's `netKillPortAdapter` sends the default signal, `SIGTERM`, in one batched `kill`, and ignores the
  error, so a partial failure reads as success. Moving it to `killPid` changes the signal to `SIGKILL`
  and makes a partial failure visible. Confirm ward's e2e-artifact teardown wants both before switching.

### 34. `parseImplementationImportsTransformer` treats a per-name `type` import as a value

In `import { walkBroker, type WalkMemo } from './walk-broker'`, the transformer in `packages/eslint-plugin`
keeps `WalkMemo`, and `enforce-proxy-child-creation` then asks for a `WalkMemoProxy`.

Work: skip specifiers whose `importKind` is `type`. The platform check worked around this by deriving its
types through `Parameters<typeof broker>[0]['field']`; that workaround can go once the fix lands.

### 35. Tell a consumer's agent how to add an npm or bin wrapper

`init` gives a consumer dungeonmaster's node and browser gateways as their own source. Their npm and
bin gateways start empty, with a placeholder `src/index.d.ts`. Nothing tells an agent in a consumer repo
what to do next: that it writes or copies a wrapper into its own `packages/@gateway/{npm,bin}/`, where
dungeonmaster's own npm and bin source can be read from (the installed packages ship only `dist`), that
it deletes the placeholder once the first subpath exists, and that it never imports ours.

Work: write that rule into a session snippet in
`packages/shared/src/statics/session-snippet/session-snippet-statics.ts`.

### 38. Turn on `@typescript-eslint/no-shadow`, so a local name hiding a gateway import is caught clearly

Gateway functions carry real package names such as `glob`, `stat`, `run` and `commit`, which are also
ordinary variable names. When a caller's parameter or variable has the same name as a gateway import,
the local name hides the import. TypeScript then reports the call as `This expression is not callable`,
pointing at the call instead of at the clash. Trial unit 10 hit this: mcp's file scanner took a `glob`
pattern parameter and imported the gateway's `glob`.

No rule in this repo checks shadowing today. The existing rule `@typescript-eslint/no-shadow` reports a
local name that hides an outer one, imports included, and names both. No custom rule is needed.

Work: measure how many existing shadows it reports across the repo, fix them, then turn it on.

## Found while restructuring

### 39. Ward's slow-test gate flags the `cli` install test under full-suite load

The full `npm run ward` of 2026-09-26 passed every check, then failed its slow-test gate on
`packages/cli/src/startup/start-install.integration.test.ts`: slowest test 10.7s against the 10s
integration bar (`slowFileThresholdStatics.integrationTestWarnMs`). Run alone, the same file's slowest
test takes 2.4s. The gateway source copy `init` now runs takes 50ms for 408 files, so the time is load
from the rest of the suite, not the copy. A bare `npm run ward` is not green while it stands.

Work: find which of the file's six tests hits 10s under load and why, before deciding between making it
cheaper and raising the bar.

### 40. Suspected: `init` in a consumer looks for dungeonmaster's packages in the wrong place

`packages/cli/bin/cli-entry.ts` sets `dungeonmasterRoot` four directories above the running bin. In
this repo that is the repo root. In a consumer, the bin sits at
`node_modules/@dungeonmaster/cli/dist/bin/`, so `dungeonmasterRoot` becomes `<consumer>/node_modules`,
and `packageDiscoverBroker` then looks for `node_modules/packages/*/dist/startup/start-install.js`.
Not verified against a real published install. The gateway source copy does not depend on it: it
finds `@dungeonmaster/node` and `@dungeonmaster/browser` through Node's own module resolution.

Work: install the packed packages into a scratch consumer and run `dungeonmaster init`.

### 41. The node and browser gateways `init` copies have not been run inside a consumer

`init` copies dungeonmaster's node and browser source, tests and proxies included, into a consumer's
`packages/@gateway/{node,browser}`. A scratch-consumer run proved the files land and the configs are
written. Nobody has run the consumer's typecheck, tests or build against the copy. Known blockers:
`@dungeonmaster/testing` is not published (item 21a), and the browser copy's tests need
`jest-environment-jsdom` and `undici`, which `init` lists in the browser gateway's `devDependencies`.

Work: once item 21a is done, run `npm install`, typecheck, the gateway tests and `npm run build` in a
freshly `init`-ed consumer.

### 42. Tool tests still use the old gateway layout as sample data

Tests in `packages/testing/src/middleware/`, `packages/testing/src/transformers/` and several
`packages/eslint-plugin` rule tests feed their code specifiers such as `#gateway/npm/_test_` and
package maps whose `exports` point at `./src/_test_/index.ts` and `./src/*/index.ts`. Each fixture is
self-consistent, so the tests still prove their resolver or rule. But a reader copying a fixture gets a
layout that no longer exists.

Work: move the fixtures to the current forms, `#gateway/<pkg>/_test_/<subpath>` and `./src/*/*.ts`.

### 43. The published base tsconfig still resolves with node10

`packages/eslint-plugin/configs/tsconfig.json`, published as `@dungeonmaster/eslint-plugin/tsconfig`,
sets `module: "commonjs"` and `moduleResolution: "node"`. A consumer gets `node16` only because `init`
writes it into their root tsconfig, which extends the base. A package tsconfig that extends the
published base directly, skipping the root, cannot resolve `#gateway/...`.

Work: decide whether the published base moves to `node16` with `customConditions: ["source"]`, so the
root override becomes unneeded.

### 44. The ts-jest inline options are repeated in every package's Jest config

`module: 'commonjs'` and `moduleResolution: 'node'` now sit in the root `jest.config.base.js`, in 13
package `jest.config.*` files that override `transform` with their own copy of the same inline options,
in the published `@dungeonmaster/testing/jest-config-base`, and in `create-package`'s templates.
A future ts-jest option has to be added to each copy by hand.

Work: have the package configs reuse the base's `transform` entry instead of restating it.
