# Gateway build: hand-off

## 1. Where things stand

Four gateway packages (`npm`, `node`, `browser`, `bin`) exist, with wrappers, tests, proxies and lint
rules. Two trials have switched real callers onto them, at two different gateway locations — both are
in section 5, labeled Trial 1 and Trial 2:

- **Trial 1** ran while the gateway lived at `packages/{npm,node,browser,bin}` and callers imported it
  by its raw package name, e.g. `@dungeonmaster/npm/glob`. Ten units switched.
- **Trial 2** ran after the gateway moved to `packages/@gateway/{npm,node,browser,bin}` — the package
  `name`s themselves are unchanged (`@dungeonmaster/npm`, …) — onto the `#gateway/<folder>/<subpath>`
  import form (e.g. `#gateway/npm/glob`), the same text every consumer repo will use. It switched
  callers across web, mcp, server, siegelense, hooks, config, tooling, shared, orchestrator,
  eslint-plugin and ward.

16 commits land the gateway at its original location and Trial 1, on this worktree's branch
(`gateway-pivot`; `git log --oneline master..HEAD`). **Nothing is merged to `master`.** The move to
`packages/@gateway/` and Trial 2 are **uncommitted** in this worktree (`git status`); this doc-update
pass does not commit them. No adapter has been deleted. The consumption phase — moving every remaining
caller — has not started; the two trials together switch a small slice of the eventual callers.

## 2. The four gateway packages

Every gateway package now lives at `packages/@gateway/<folder>/`, moved there from `packages/<folder>/`.
The package `name`s did not change (`@dungeonmaster/npm`, `@dungeonmaster/node`,
`@dungeonmaster/browser`, `@dungeonmaster/bin`), so the old bare-name import (`@dungeonmaster/npm/glob`)
still resolves too, during the transition. Every caller now imports through
`#gateway/<folder>/<subpath>` instead (e.g. `import { readItem } from '#gateway/browser/localStorage'`)
— the same text in every repo, mapped by each package's own `package.json` `imports` field.

| Package | Holds | Curated subpaths (main exports) | Pass-through rule |
|---|---|---|---|
| `@dungeonmaster/npm` (`packages/@gateway/npm/src/`) | third-party npm packages | `glob` (`glob` — overrides the raw export, `packages/@gateway/npm/src/glob/index.ts`); `@testing-library/react` (`render` wrapped in `MantineProvider`, `renderHook` untouched — `packages/@gateway/npm/src/@testing-library/react/index.ts`) | every other subpath is `export * from '<pkg>'` plus `export { default }` where the package has one, for example `packages/@gateway/npm/src/react/index.ts` and `packages/@gateway/npm/src/zod/index.ts` — except a package whose own types use `export =` (react, debug, pixelmatch, eslint-plugin-jest, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/utils`), which names what callers need explicitly (`export { default } from '<pkg>'; export { a, b } from '<pkg>';`) instead of `export *` (see section 3) |
| `@dungeonmaster/node` (`packages/@gateway/node/src/`) | Node modules and Node globals | `fs` (`existsSync`, `readFileSync`, `readJsonFileSyncIfExists`, `globSync`, `walkFilesSync`, `tailFile`, `isFsError` — `packages/@gateway/node/src/fs/index.ts`); `fs/promises`; `child_process` (`run`, `runSync`, `stream`, `streamLines`, `spawnDetached`, `spawnLongLived`, `spawnLive`, `runFireAndForget`, `RunNotFoundError` — `packages/@gateway/node/src/child_process/index.ts`); `process` (`stdout`, `stderr`, `cwd`, `exit`, `kill`, `getEnv`, `readStdinToEnd` — `packages/@gateway/node/src/process/index.ts`); `fetch` (`fetchJson`, `fetchOk`, `fetchWithStatus`); `module` (`createRequire`, `builtinModules`, `resolvePackageRoot`, `dynamicImport`) | `url`, `util`, `os`, `crypto`, `buffer` are plain pass-throughs; `path` and `events` are Node-only, so they keep `export =` (see section 3) |
| `@dungeonmaster/browser` (`packages/@gateway/browser/src/`) | browser globals and APIs | `localStorage` (`readItem`, `writeItem`, `removeItem`, `keys` — `packages/@gateway/browser/src/localStorage/index.ts`); `fetch` (`fetchJson`, `fetchWithStatus`); `WebSocket` (`connect`, now wires `onerror`); `indexedDB` (`openStore`, `getAll`, `put`, `deleteRecord`) | `document`, `window`, `navigator`, `console`, `crypto`, `URL`, and the rest of the global list pass through as `export const { x } = globalThis;` |
| `@dungeonmaster/bin` (`packages/@gateway/bin/src/`) | programs run through `spawn` | `git` (`currentBranch`, `addAll`, `commit`, worktree ops, `GitNotInstalledError` — `packages/@gateway/bin/src/git/index.ts`); `claude` (`resolveClaudeCliPath`, `spawnStreamJson`, `ClaudeNotInstalledError`); `npm` (`install`, `runBuild`, `runScript`); `lsof` (`listeningPids`); `kill` (`killPid`, `killGroup`); `cp` (`copyRecursive`) | none — every `@dungeonmaster/bin` module is curated, since a program has no exports to pass through |

Every gateway package also exports a `_test_` subpath (`packages/@gateway/<pkg>/src/_test_/index.ts`,
the package.json `exports` entry `./_test_`) carrying that package's proxies, and declares no root `.`
export. `_test_` replaces the earlier `./testing` subpath: a leading `_` can't start an npm package
name, and no Node module or browser global is called `_test_`, so it never collides with a real subpath
the way `testing` risked.

## 3. Decisions made during the build that differ from, or add to, the design doc

| Decision | Reason | Where it lives |
|---|---|---|
| Subpaths sit under `src/`, one pattern export (`"./*"`) plus `typesVersions`, not a literal `exports` entry per subpath | Ward and the inventory tools only see a package's `src/`; a pattern export means adding a subpath is "add a folder with `index.ts`", never a `package.json` edit | `packages/@gateway/{npm,node,browser,bin}/package.json`; decision recorded in `scrolls/gateway-build/brief.md` |
| A global whose name collides with a Node module name, ignoring case, gets no subpath of its own — `URL`/`URLSearchParams` live under `@dungeonmaster/node/url`, `Buffer` under `@dungeonmaster/node/buffer` | Two sibling folders differing only by case is unsafe across filesystems and confusing to a model reading the import | `brief.md`, "Orchestrator rulings made during the build" #2 |
| One `@dungeonmaster/bin` module per program (`git`, `npm`, `lsof`, `kill`, `cp`, `claude`), never a combined module like the design doc's sketched `bin/port` | The brief requires one module per program; the "list what's on this port, then kill it" composing function has no home yet and is a real gap, not a naming choice | `followups.md` "Where the lsof+kill combining function belongs"; `coverage.md` "Real gaps" |
| A wrapper that keeps the outside function's own name also keeps its calling shape (positional args); a wrapper with a new name takes one destructured object argument | Consistency rule so a model can tell from the name alone whether a call is positional or object-shaped | `brief.md`, "Orchestrator rulings" #1 |
| `run`/`stream`/`streamLines` throw `RunNotFoundError` when the program never started | So every `@dungeonmaster/bin` module reports "not installed" distinctly from an empty exit-1, instead of a bin function silently returning a blank result | `packages/@gateway/node/src/child_process/run-not-found-error.ts`; commit `c87aa6fc6` |
| The gateway's own lint block is the MAIN rule set minus named omissions, not a short bespoke list — the reverse of the design doc's "rules skip the gateway as a whole" | Keeps every rule that still makes sense (file header, colocation, no silent catch) ON for the gateway by default, so a new rule added later reaches the gateway unless explicitly omitted | `eslint.config.js`; `lint-plan.md` "Decisions made while building" table |
| The three caller-facing rules (`raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`) were built, measured against every package, then commented out | They would fail every caller package immediately, since no caller has migrated yet; measuring first proves they detect real violations before flipping them on for good | `lint-measurements.md`; registered in the plugin's rule index only, not wired into `dungeonmasterCustomRules` per `followups.md` |
| The three gateway shape rules (`gateway-import-boundary`, `gateway-colocation`, `gateway-layout`) stay ON, live, in the gateway config block | They police the gateway's own shape and cost nothing to leave running while the gateway itself is being built | `lint-measurements.md` — 605 files, 0 failures on the gateway packages |
| `@dungeonmaster/testing` is reachable from a gateway `.proxy.ts`/`.test.ts`/`.stub.ts` file only, never from a gateway runtime file | The design doc's own "Tests" section says the gateway gets its own Jest config so `registerMock` proxies work there; `gateway-import-boundary` now special-cases `@<scope>/testing` gated to test-support suffixes | `followups.md` "RESOLVED" note under gateway-import-boundary; `gatewayTestSupportSuffixStatics` |
| The four gateway packages move to `packages/@gateway/{npm,node,browser,bin}`, keeping their package `name`s (`@dungeonmaster/npm`, …); root `workspaces` becomes `["packages/*", "packages/@gateway/*"]` | Every tool that lists packages needed one rule for "what counts as a package folder", not a `@gateway`-specific carve-out: a directory directly under `packages/` whose name starts with `@` is a group folder, and its children are the real packages | `package.json`'s `workspaces`; `discoverPackagesLayerBroker` (`packages/shared/src/brokers/architecture/project-map/discover-packages-layer-broker.ts`); `get-project-inventory`'s fallback scan in `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` |
| Every caller imports the gateway through `#gateway/<folder>/<subpath>` (e.g. `#gateway/browser/localStorage`), the same text in every repo, via each package's own `package.json` `imports` field | An npm package literally named `@dungeonmaster/node` would collide with a consumer repo's own differently-scoped `node` gateway package under Node's walk-up resolution; Node's `imports` field resolves a `#`-prefixed specifier from a package's OWN `package.json`, never through `node_modules`, so the two gateways can never meet | `packages/@gateway/{npm,node,browser,bin}/package.json`'s `imports` field; `gatewayLocationsStatics.importPrefix` in `packages/shared/src/statics/gateway-locations/gateway-locations-statics.ts`; `create-package` |
| The `./testing` subpath is renamed `./_test_` (`src/_test_/index.ts`) in every gateway package | A leading `_` can't start an npm package name, and no Node module or browser global is called `_test_`, so it never collides with a real subpath — `testing` risked exactly that collision | `gatewayLocationsStatics.testSubpath`; e.g. `packages/@gateway/bin/src/_test_/index.ts` |
| Every tsconfig keeps `moduleResolution: "node"` (which ignores `imports`); the root `tsconfig.json` gets a `paths` entry per gateway folder pointed at the gateway's own SOURCE, and every gateway package's `tsconfig.build.json` points the same specifier at the SIBLING gateways' `dist/*/index.d.ts` instead | `paths` is the only way `node`/`node10` resolution sees a `#`-prefixed specifier; a build config pointing at source would pull a sibling package's source into ITS OWN build program and TS6059 on `rootDir`. Switching to `moduleResolution: "bundler"` was rejected — it forces `module: "preserve"`, changing emitted JS | root `tsconfig.json`; `packages/eslint-plugin/tsconfig.json` (merges its own `paths` override); `packages/@gateway/npm/tsconfig.build.json` |
| Tools that reason about imports learn `#gateway` alongside the old `@dungeonmaster/<folder>` form, both accepted during the transition: `@dungeonmaster/testing`'s mock-hoisting resolver, several eslint-plugin rules and guards, ward's platform-crossing check, and the lint suggestion text (fixing a `Buffer`/`buffer` capitalization bug on the way) | Callers switch one at a time, not all at once, so both import forms have to keep working while the migration is in progress | `packages/testing/src/middleware/workspace-package-import-resolve/workspace-package-import-resolve-middleware.ts`; `packages/eslint-plugin/src/brokers/rule/{enforce-import-dependencies,enforce-proxy-child-creation,gateway-import-boundary,raw-import-ban}`; `packages/eslint-plugin/src/guards/is-npm-package/is-npm-package-guard.ts`; `packages/ward/src/brokers/platform-crossing/check/gateway-package-names-read-layer-broker.ts`; `packages/shared/src/transformers/gateway-path-from-import-source/gateway-path-from-import-source-transformer.ts` |
| A package that imports `#gateway/<folder>/...` lists `@dungeonmaster/<folder>` in its own `dependencies` (`"*"`) | The `imports` field only RENAMES a specifier; it never installs anything, so the real dependency edge still has to be declared | added to `packages/{eslint-plugin,hooks,orchestrator,server,shared,siegelense,ward}/package.json` |
| A pass-through of a package whose types use `export =` (react, debug, pixelmatch, eslint-plugin-jest, `@typescript-eslint/eslint-plugin`) names what callers need explicitly (`export { default } from '<pkg>'; export { a, b } from '<pkg>'; export type { T } from '<pkg>';`) instead of `import x = require()`/`export =` or `export *` | `export *` against an `export =`-typed module is TS2498, unconditionally; `export =`/`import ... = require()` hides named exports from Vite/Rollup and fails ESM-target typecheck (TS1202/TS1203). `typescript`'s pass-through, and `path`/`events` in `@dungeonmaster/node`, keep `export =` — they are Node-only, so no bundler or ESM-target ever sees them | e.g. `packages/@gateway/npm/src/{react,debug,pixelmatch,eslint-plugin-jest,@typescript-eslint/eslint-plugin}/index.ts`; `packages/@gateway/npm/src/typescript/index.ts`; `packages/@gateway/node/src/{path,events}/index.ts` |
| A gateway-listed package gets exactly ONE installed copy; `npm dedupe` merged the npm gateway's own nested `@mantine/core` 8.3.18 with web's 8.3.14 (and the matching `@mantine/notifications`/`hooks`/`store`) | A widget importing Mantine through the gateway couldn't see web's `MantineProvider` while two copies existed | `package-lock.json`; an unrelated bump the dedupe pulled in (`@types/node` 24.0.15 → 24.19.0) was reverted |
| web's jest `moduleNameMapper` maps `elkjs`, `@tabler/icons-react` and `@xyflow/react` under both the bare name and `#gateway/npm/<name>` | A pass-through's `export *` only copies keys a mock can enumerate; the tabler mock answers any `Icon*` name on demand without listing one, so it needs to be reachable under either spelling | `packages/web/jest.config.cjs` |
| Copy, don't reference: an agent adding a gateway module to a CONSUMER repo copies dungeonmaster's own wrapper into the consumer's `packages/@gateway/<folder>/`, never importing dungeonmaster's copy | Keeps a consumer repo's gateway self-contained the same way its other packages are | not yet wired into a tool or session snippet — recorded as a follow-up in `scrolls/gateway-build/followups.md` |

## 4. Lint

**No rule was turned off, and no `eslint-disable` was added.** Verified with a `python3` scan of
`git diff master..HEAD` for `eslint-disable` and `'off'` additions: every hit found is prose inside a
`scrolls/*.md` file describing the constraint, not a code change — no ESLint config or rule broker in
the diff adds either.

Existing rules taught about the gateway, and why (from `lint-plan.md`'s live-build table):

| Rule | What changed | Reason |
|---|---|---|
| `ban-primitives` | Gained an `isGatewayFileGuard` check in its own `create()` | Gateway wrappers take/return the outside package's own plain values by design; the config-level carve-out alone cannot reach `.test.ts` files, which the rule also fires on |
| `enforce-stub-usage` | Same `isGatewayFileGuard` check | Fires only on `.test.ts`, which a config-level omission (scoped to the implementation glob) never reaches |
| `no-bare-process-cwd` | `noBareProcessCwdStatics.defaults.allowedFolders` gained `**/packages/@gateway/node/src/process/**` | The rule's whole job is banning raw `process.cwd()` outside the one sanctioned wrapper; excluding the gateway wholesale would let every OTHER gateway file call it raw too |
| `enforce-import-dependencies` | `validateExternalImportLayerBroker` gained a gateway sentinel ahead of the `node_modules` gate | So every folder type, not just `adapters/`, can import any of the four gateway packages |
| `isIoBoundaryProxyGuard` (new) | Replaces a bare `/adapters/` substring check inside `enforce-proxy-patterns` and `jest-mocked-must-import` | Both rules now recognise a gateway proxy as an I/O-boundary proxy the same way they already recognise `/adapters/` |
| `isNpmPackageGuard` | Extended its special-case list to the four gateway packages and subpaths | A caller's proxy mocking a gateway export (`jest.mocked(readFileIfExists)`) was tripping `notNpmPackage` |

Rules omitted from the gateway config block (implementation files only), and why:

| Rule | Reason |
|---|---|
| `enforce-project-structure` | The gateway's flat one-folder-per-subpath layout has no `folderTypeContract` member for `fs`/`process`/etc — superseded by `gateway-layout`/`gateway-colocation` |
| `enforce-object-destructuring-params` | A same-name wrapper keeps the outside function's positional shape by design (ruling #1 above) |
| `enforce-proxy-child-creation` | Gateway proxies mock the outside function directly, with no child-proxy delegation — structural mismatch, not a gap |
| `enforce-stub-patterns` | Gateway stubs mirror the outside package's own error shape with no zod contract to `.parse()` |
| `ban-adhoc-types` | Gateway wrapper types (`FsError`, `WalkedFile`, …) are plain interfaces by design — the gateway never imports zod contracts to define them in instead |
| `forbid-type-reexport`, `require-zod-on-primitives`, `require-contract-validation` | Same "plain values, no contracts" reason as `ban-adhoc-types`/`ban-primitives` |

New rules and their measurement summary, from `lint-measurements.md` (2026-09-26, `npm run ward -- detail <runId>`, never estimated):

- The three gateway shape rules: **PASS, 605 files, 0 failed** across `bin`, `browser`, `node`, `npm`.
- The three caller-facing rules, one `ward -- --only lint` run per package: `raw-import-ban` fires from
  0 (`local-eslint`, already carved out for ESLint primitives) to 559 (`web`); `platform-globals-ban`
  fires from 0 to 568 (`web`, mostly `document`/`console`/`localStorage`); `bin-program-spawn-ban` fires
  only on `orchestrator` (2), `siegelense` (1) and `ward` (3) — every other package has none.
- One real rule bug found, not fixed in that pass: `platform-globals-ban`'s message names
  `@dungeonmaster/node/Buffer` (capital B) instead of the real lowercase `buffer` subpath — flagged for
  whoever turns the rule back on.

## 5. The trials

Two trials have run, at two different gateway locations and import forms — see section 1.

### Trial 1 — gateway at `packages/{npm,node,browser,bin}`, imported by package name

Ten units, each switching 1-3 caller files from an adapter (or a raw call) to a gateway import.

| Unit | Package | What switched | What it found |
|---|---|---|---|
| 1 | mcp | `settings-permissions-add-broker` → `readJsonFileIfExists` | **Data-loss bug fixed**: a corrupt/unreadable `settings.json` now rejects instead of being silently replaced |
| 2 | hooks | `install-create-settings-responder` → `readJsonFileIfExists` | **Data-loss bug fixed**: same file, second writer, same bug |
| 3 | mcp | `install-config-create-responder` → `readJsonFileIfExists` | **Data-loss bug fixed**: a corrupt `.mcp.json` now rejects instead of dropping every configured MCP server |
| 4 | config | `install-create-config-responder` → `pathExists`, `readJsonFileIfExists`, `writeFile` | Control case: it already skipped the write on a bad read. It still does, and now reports missing, invalid JSON and unreadable as three separate outcomes, each with the real error text. Before, an unreadable file was reported as "not valid JSON" |
| 5 | tooling | `duplicate-detection-detect-broker` → `glob`, `readFile` | The glob drift: tooling's copy included directories and hard-coded four ignore patterns. The broker now passes `nodir: false` and those patterns from a tooling statics file, so behaviour is identical. The pass-through `fsReadFileAdapter` simply drops out |
| 6 | siegelense | `instance-reserve-broker` → `currentBranch` from `bin/git` | sync→async, `null`-on-detached-HEAD kept, but a real git failure now throws instead of collapsing to `null` — an intentional tightening, not a regression |
| 7 | web | `comment-queue-state` → `readItem`/`writeItem`/`removeItem`/`keys` from `browser/localStorage` | Caller deletes its own two `try/catch` blocks; surfaced that the wrapper's `{success:false}` shape was discarding the real error (fixed, see below) |
| 8 | web | `home-content-widget.test.tsx` → `render` from `npm/@testing-library/react` | Proves a web test and proxy can import testing-library through the gateway. The test renders through web's own `mantineRenderAdapter`, so the gateway's Mantine-wrapping `render` was not exercised here |
| 9 | mcp | `claude-permission-contract` → `z` from `npm/zod` | Proves a contract, its stub and its test all resolve through a pass-through with no behaviour difference |
| 10 | mcp | `file-scanner-broker` → `glob` from `npm/glob` | mcp's copy was the winning glob shape and moved over unchanged. It broke 9 tests in `mcp-discover-broker.test.ts`, because the gateway `globProxy` only matched exact patterns. Fixed by giving `globProxy` a default, tail matching and call inspection, like the adapter proxy it replaces |

### Trial 2 — gateway at `packages/@gateway/{npm,node,browser,bin}`, imported as `#gateway/<folder>/<subpath>`

Switched callers, the rest of each package untouched. Grouped by package rather than by unit, since
several packages had more than 1-3 files switch this time.

| Package | Switched | Proof |
|---|---|---|
| web | `comment-queue-state` (browser/localStorage), `home-content-widget.test` (react default import), `react-flow-diagram-widget` + test (@mantine/core, testing-library, user-event), `quest-queue-bar-widget` (react-router-dom), `comment-queue-bar-widget` (@tabler/icons-react), `rxjs-filter-adapter` | ward e2e run `1790441023679-3060`: 133 spec files PASS against a production bundle; the bundle has no unresolved `#gateway/` text |
| mcp | the three earlier trial files, `claude-permission-contract`, `absolute-path-contract` (zod), `architecture-flow` (zod-to-json-schema), `mcp-server-flow` (three `@modelcontextprotocol/sdk` subpaths) | Node resolves them without the source condition; the npm gateway now builds with zero errors (fixes: a `paths` entry for `@modelcontextprotocol/sdk/server`, `dist` excluded from the build `include`, the gateway's own `#gateway/npm/*` build path pointed at src) |
| server | `guild-flow` (hono, hono/utils/http-status), `server-init-responder.proxy`, `hono-serve-adapter` (@hono/node-server), `hono-create-node-web-socket-adapter` (@hono/node-ws), `mtime-ms-contract` (zod), `fs-read-file-bytes-adapter` (`#gateway/node/fs/promises`) | real server booted via `dev:no-watch`; `/api/health` returned `{"status":"ok",…}` |
| siegelense | `instance-reserve-broker` (`#gateway/bin/git`) + proxy, `pngjs-decode-adapter`, `pixelmatch-compare-adapter`, `playwright-session-adapter` (@playwright/test) | cross-package `_test_` proxy composition applies mocks |
| hooks, config, tooling | the three earlier trial files, `debug-debug-adapter`, `message-contract` (zod), `eslint-linter-adapter` | — |
| shared, orchestrator | `quest-id-contract`, `work-item-role-contract`, `fast-xml-parser-parse-adapter`, `agent-role-contract`, `work-item-id-contract` | orchestrator whole-package typecheck + unit pass against them |
| eslint-plugin, ward | `eslint-typed-parser-services-adapter` (@typescript-eslint/utils), `minimatch-match-adapter`, ward's `typescript-module-shape-adapter` | live lint loads rules that import `#gateway` |

Final full run on all uncommitted changes: ward run `1790440830987-7d75` — lint, typecheck, unit,
integration all PASS (e2e skipped in that run; web's e2e ran separately, above).

## 6. Edge cases the design did not account for

- **Cross-package proxy hoisting.** A caller's `.proxy.ts` composing a gateway package's `./testing`
  proxy (now `_test_`; e.g. siegelense composing `@dungeonmaster/bin/testing`) silently failed to mock
  anything — the resolver only understood a relative import or the one hardcoded
  `@dungeonmaster/shared/testing` case (that one is the real `@dungeonmaster/testing` package's own
  subpath, unrelated to the gateway's `_test_` rename). Fixed generally in `packages/testing/src` by
  reading each workspace package's own `exports` map (`workspacePackageImportResolveMiddleware`), not
  by hardcoding package names. (`followups.md`, unit 6)
- **Proxy naming.** Every gateway proxy whose factory name didn't match `<exportName>Proxy` tripped
  `enforce-proxy-child-creation` for callers with no way to know the two names referred to the same
  export. Fixed by renaming all 24 mismatched proxies (all in `@dungeonmaster/bin`). (unit 6)
- **The gateway proxy needing parity with adapter proxies.** A caller's phantom proxy composition
  (kept alive only to satisfy `enforce-proxy-child-creation`) can silently depend on an old adapter
  proxy's implicit default (e.g. `'HEAD'` staged unconditionally); the new gateway proxy stages nothing
  by default, so every such composer needs an explicit setup call it never needed before. (unit 6)
- **Error loss in `{ success: false }` shapes.** `writeItem`/`removeItem`/`keys` originally folded
  every failure into a boolean or an empty array, discarding the real native error (`QuotaExceededError`,
  a storage-scan failure) a caller wanted to log. Fixed: both now carry `{ success: false; error: unknown }`
  forwarding the caught value as-is. (unit 7, "Resolved by the gateway sad-path fix")
- **Sync-to-async ripples.** Switching siegelense's git-branch read from `execSync` to the gateway's
  async `currentBranch` forced every caller of the broker (and every proxy composing it) onto `await`,
  and one caller (`instance-start-broker.proxy.ts`) needed a one-line fix to keep passing. (unit 6)
- **The platform-crossing check's full-repo cost.** It needs the whole import graph, so it cannot be a
  per-file ESLint rule — it runs as its own ward subcommand (`npm run ward -- platform`), not scoped by
  file, not integrated into `--only`/`--committed`/`--uncommitted`, and not saved to `.ward/` for
  `ward list`/`ward detail`. (`followups.md` "Platform-crossing check")

- **A gateway proxy must offer what the adapter proxy it replaced offered.** Callers came to rely on
  an adapter proxy's safe default, loose matching and call inspection. When the gateway proxy lacks
  them, the caller's tests break, or the caller copies broker logic into its proxy. `globProxy` is
  fixed. `followups.md` lists the other gateway proxies that still lack a default or call inspection.
  (unit 10)
- **The platform-crossing walk has to be memoized.** Without a cache it re-walked a shared file once per
  path that reached it, and ran out of heap on the full repo, at about 5.4 GB. With per-file memo and
  shared caches, one run on this tree took 3.2 seconds and about 740 MB, and reported no crossings.
- **Open rule gaps found late**, all in `followups.md`: `parseImplementationImportsTransformer` reads a
  per-name `type` import as a value import; `platform-globals-ban` misses a global used as an object
  shorthand (`{ fetch }`); and it does not special-case siegelense's `page.evaluate` callbacks, which run
  in the driven browser.

- **A gateway throw can break a caller written for the old collapse-to-null convention.** Trial 1's
  `currentBranch` reconciliation (a real git failure throws instead of returning `null`) turned into a
  real regression once a second caller reached it outside a git checkout:
  `driver-flow.integration.test.ts` runs in a non-git temp dir, so `currentBranch` rejecting with "not a
  git repository" broke it. Fixed with a narrow guard,
  `packages/siegelense/src/guards/is-git-not-a-repository-error/is-git-not-a-repository-error-guard.ts`,
  that maps only that one failure back to `null` inside `instanceReserveBroker`; every other git
  failure still throws.
- **A pass-through can simply be missing.** `eslint-typed-parser-services-adapter` needed
  `@typescript-eslint/utils`, which had no gateway wrapper yet — added at
  `packages/@gateway/npm/src/@typescript-eslint/utils/index.ts`.
- **Not everything can go through the gateway as code.** Three CSS side-effect imports in web
  (`@mantine/core/styles.css`, `@mantine/notifications/styles.css`, `@xyflow/react/dist/style.css`)
  stay raw imports — they aren't code, so a TypeScript pass-through has nothing to wrap.
- **A gateway-listed package needs exactly one installed copy.** The npm gateway had its own nested
  `@mantine/core` 8.3.18 while web had 8.3.14, so a widget importing Mantine through the gateway
  couldn't see web's `MantineProvider`. `npm dedupe` merged the four `@mantine/*` packages to one copy
  each; no other gateway-listed package was duplicated.
- **A pass-through's `export *` can't be mocked by name alone.** web's jest `moduleNameMapper` had to
  map `elkjs`, `@tabler/icons-react` and `@xyflow/react` under both their bare name and
  `#gateway/npm/<name>` (`packages/web/jest.config.cjs`), because `export *` only copies keys a mock
  can enumerate, and the tabler mock answers any `Icon*` name on demand without listing one.

## 7. Not done, and why

- **Every adapter except the ten trial units' callers is unmigrated.** `coverage.md`, counted on 2026-09-26, has 220 adapters
  fated `gateway`, 43 `split`, 83 `stays`, 3 `dead` — the consumption phase that switches the rest has
  not started (brief rule 6: write new gateway files, never move existing callers, until that phase).
- **Three adapters have no gateway home yet**: `process-kill-by-port-adapter` (orchestrator),
  `net-kill-port-adapter` and `net-port-in-use-adapter` (ward) all need a composing "list what's on this
  port, then kill it" function over `bin/lsof` + `bin/kill` that nobody has written (`coverage.md` "Real
  gaps", `followups.md`).
- **Adapters left caller-less by the trial stay in place on purpose**: `packages/mcp/src/adapters/path/join/...`,
  `fs-read-file-adapter.ts`, etc., and `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts`
  are untouched with no remaining callers where the trial fully replaced them — per the trial rules,
  never delete or edit an adapter, only switch its caller.
- **The platform-crossing check is not a full ward check type.** It runs as a bolted-on subcommand.
  Full integration needs a `'platform'` member on `checkTypeContract`, a `checkRunPlatformBroker`, a
  dispatch point that runs it once repo-wide (not per package), `--only platform` support, and folding
  its result into `WardResult` so `ward list`/`ward detail` show it. (`followups.md` "What full
  integration would still need")
- **`get-project-map` and `get-project-inventory` do not show a `gateway` package type yet.** The design
  doc's "Discovery" item (a new package type listing subpaths and pass-through/wrapped status) is not
  built.
- **Teaching text is not updated.** The design doc's migration order step "Update the teaching text and
  the tools: map, inventory, `init`, `create-package`" has not happened.
- **`(b)` and `(c)` of `gateway-layout`'s three checks are not lint rules.** Only the case-collision half
  runs as a rule; whether an `@dungeonmaster/npm` folder matches an installed dependency, and whether a
  `node`/`browser` folder names a real builtin or global, both need a per-package unit test instead
  (`followups.md` "gateway-layout: only the case-collision half is a lint rule").
- **The mirror direction of the platform check (Node reaching `@scope/browser/*`) shares the code path
  but has no fixture test of its own** — only the browser-reaching-node direction is fixture-tested.

## 8. How to review

```bash
npm run ward -- platform                                            # the whole-repo platform-crossing check
npm run ward -- --only lint,typecheck,unit -- packages/@gateway/node/src packages/@gateway/npm/src packages/@gateway/browser/src packages/@gateway/bin/src
```

Start with `scrolls/gateway-build/lint-plan.md`'s "Decisions made while building" table and
`scrolls/gateway-build/followups.md` — every open question and every fix made in response to a trial
finding is logged there, in the order it was found. Then read one trial unit end to end
(`scrolls/gateway-build/trial/unit-6.md` is the densest — cross-package proxy hoisting, the
async/throw semantics change, and the proxy-naming fix all show up in one file) before skimming the
rest.
