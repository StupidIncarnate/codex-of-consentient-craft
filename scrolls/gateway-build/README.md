# Gateway build: hand-off

## 1. Where things stand

Four gateway packages (`npm`, `node`, `browser`, `bin`) exist under `packages/*` with wrappers,
tests, proxies and lint rules, plus a ten-unit trial that switched real callers onto them. Everything
described here is committed on branch `worktrees/gateway-pivot`, eleven commits ahead of `master`
(`git log --oneline master..HEAD`). **Nothing is merged to `master`.** No adapter has been deleted and
no adapter's caller has been switched except the ten trial units — the consumption phase (moving every
other caller) has not started.

## 2. The four gateway packages

| Package | Holds | Curated subpaths (main exports) | Pass-through rule |
|---|---|---|---|
| `@dungeonmaster/npm` (`packages/npm/src/`) | third-party npm packages | `glob` (`glob` — overrides the raw export, `packages/npm/src/glob/index.ts`); `@testing-library/react` (`render` wrapped in `MantineProvider`, `renderHook` untouched — `packages/npm/src/@testing-library/react/index.ts`) | every other subpath is `export * from '<pkg>'` plus `export { default }` where the package has one, for example `packages/npm/src/react/index.ts` and `packages/npm/src/zod/index.ts` |
| `@dungeonmaster/node` (`packages/node/src/`) | Node modules and Node globals | `fs` (`existsSync`, `readFileSync`, `readJsonFileSyncIfExists`, `globSync`, `walkFilesSync`, `tailFile`, `isFsError` — `packages/node/src/fs/index.ts`); `fs/promises`; `child_process` (`run`, `runSync`, `stream`, `streamLines`, `spawnDetached`, `spawnLongLived`, `spawnLive`, `runFireAndForget`, `RunNotFoundError` — `packages/node/src/child_process/index.ts`); `process` (`stdout`, `stderr`, `cwd`, `exit`, `kill`, `getEnv`, `readStdinToEnd` — `packages/node/src/process/index.ts`); `fetch` (`fetchJson`, `fetchOk`, `fetchWithStatus`); `module` (`createRequire`, `builtinModules`, `resolvePackageRoot`, `dynamicImport`) | `path`, `url`, `util`, `events`, `os`, `crypto`, `buffer` are plain pass-throughs |
| `@dungeonmaster/browser` (`packages/browser/src/`) | browser globals and APIs | `localStorage` (`readItem`, `writeItem`, `removeItem`, `keys` — `packages/browser/src/localStorage/index.ts`); `fetch` (`fetchJson`, `fetchWithStatus`); `WebSocket` (`connect`, now wires `onerror`); `indexedDB` (`openStore`, `getAll`, `put`, `deleteRecord`) | `document`, `window`, `navigator`, `console`, `crypto`, `URL`, and the rest of the global list pass through as `export const { x } = globalThis;` |
| `@dungeonmaster/bin` (`packages/bin/src/`) | programs run through `spawn` | `git` (`currentBranch`, `addAll`, `commit`, worktree ops, `GitNotInstalledError` — `packages/bin/src/git/index.ts`); `claude` (`resolveClaudeCliPath`, `spawnStreamJson`, `ClaudeNotInstalledError`); `npm` (`install`, `runBuild`, `runScript`); `lsof` (`listeningPids`); `kill` (`killPid`, `killGroup`); `cp` (`copyRecursive`) | none — every `@dungeonmaster/bin` module is curated, since a program has no exports to pass through |

Every gateway package also exports a `./testing` subpath (`packages/<pkg>/src/testing/index.ts`)
carrying that package's proxies, and declares no root `.` export.

## 3. Decisions made during the build that differ from, or add to, the design doc

| Decision | Reason | Where it lives |
|---|---|---|
| Subpaths sit under `src/`, one pattern export (`"./*"`) plus `typesVersions`, not a literal `exports` entry per subpath | Ward and the inventory tools only see a package's `src/`; a pattern export means adding a subpath is "add a folder with `index.ts`", never a `package.json` edit | `packages/{npm,node,browser,bin}/package.json`; decision recorded in `scrolls/gateway-build/brief.md` |
| A global whose name collides with a Node module name, ignoring case, gets no subpath of its own — `URL`/`URLSearchParams` live under `@dungeonmaster/node/url`, `Buffer` under `@dungeonmaster/node/buffer` | Two sibling folders differing only by case is unsafe across filesystems and confusing to a model reading the import | `brief.md`, "Orchestrator rulings made during the build" #2 |
| One `@dungeonmaster/bin` module per program (`git`, `npm`, `lsof`, `kill`, `cp`, `claude`), never a combined module like the design doc's sketched `bin/port` | The brief requires one module per program; the "list what's on this port, then kill it" composing function has no home yet and is a real gap, not a naming choice | `followups.md` "Where the lsof+kill combining function belongs"; `coverage.md` "Real gaps" |
| A wrapper that keeps the outside function's own name also keeps its calling shape (positional args); a wrapper with a new name takes one destructured object argument | Consistency rule so a model can tell from the name alone whether a call is positional or object-shaped | `brief.md`, "Orchestrator rulings" #1 |
| `run`/`stream`/`streamLines` throw `RunNotFoundError` when the program never started | So every `@dungeonmaster/bin` module reports "not installed" distinctly from an empty exit-1, instead of a bin function silently returning a blank result | `packages/node/src/child_process/run-not-found-error.ts`; commit `c87aa6fc6` |
| The gateway's own lint block is the MAIN rule set minus named omissions, not a short bespoke list — the reverse of the design doc's "rules skip the gateway as a whole" | Keeps every rule that still makes sense (file header, colocation, no silent catch) ON for the gateway by default, so a new rule added later reaches the gateway unless explicitly omitted | `eslint.config.js`; `lint-plan.md` "Decisions made while building" table |
| The three caller-facing rules (`raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`) were built, measured against every package, then commented out | They would fail every caller package immediately, since no caller has migrated yet; measuring first proves they detect real violations before flipping them on for good | `lint-measurements.md`; registered in the plugin's rule index only, not wired into `dungeonmasterCustomRules` per `followups.md` |
| The three gateway shape rules (`gateway-import-boundary`, `gateway-colocation`, `gateway-layout`) stay ON, live, in the gateway config block | They police the gateway's own shape and cost nothing to leave running while the gateway itself is being built | `lint-measurements.md` — 605 files, 0 failures on the gateway packages |
| `@dungeonmaster/testing` is reachable from a gateway `.proxy.ts`/`.test.ts`/`.stub.ts` file only, never from a gateway runtime file | The design doc's own "Tests" section says the gateway gets its own Jest config so `registerMock` proxies work there; `gateway-import-boundary` now special-cases `@<scope>/testing` gated to test-support suffixes | `followups.md` "RESOLVED" note under gateway-import-boundary; `gatewayTestSupportSuffixStatics` |

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
| `no-bare-process-cwd` | `noBareProcessCwdStatics.defaults.allowedFolders` gained `**/packages/node/src/process/**` | The rule's whole job is banning raw `process.cwd()` outside the one sanctioned wrapper; excluding the gateway wholesale would let every OTHER gateway file call it raw too |
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

## 5. The trial

Ten units, each switching 1-3 caller files from an adapter (or a raw call) to a gateway import.

| Unit | Package | What switched | What it found |
|---|---|---|---|
| 1 | mcp | `settings-permissions-add-broker` → `readJsonFileIfExists` | **Data-loss bug fixed**: a corrupt/unreadable `settings.json` now rejects instead of being silently replaced |
| 2 | hooks | `install-create-settings-responder` → `readJsonFileIfExists` | **Data-loss bug fixed**: same file, second writer, same bug |
| 3 | mcp | `install-config-create-responder` → `readJsonFileIfExists` | **Data-loss bug fixed**: a corrupt `.mcp.json` now rejects instead of dropping every configured MCP server |
| 4 | config | `install-create-config-responder` → `pathExists`, `readJsonFileIfExists`, `writeFile` | Control case: this responder already skipped the write on bad JSON; behaviour proven byte-identical after the swap |
| 5 | tooling | `duplicate-detection-detect-broker` → `glob`, `readFile` | A pure pass-through adapter (`fsReadFileAdapter`) disappears outright; the caller parses the gateway's result itself |
| 6 | siegelense | `instance-reserve-broker` → `currentBranch` from `bin/git` | sync→async, `null`-on-detached-HEAD kept, but a real git failure now throws instead of collapsing to `null` — an intentional tightening, not a regression |
| 7 | web | `comment-queue-state` → `readItem`/`writeItem`/`removeItem`/`keys` from `browser/localStorage` | Caller deletes its own two `try/catch` blocks; surfaced that the wrapper's `{success:false}` shape was discarding the real error (fixed, see below) |
| 8 | web | `home-content-widget.test.tsx` → `render` from `npm/@testing-library/react` | Proves a test can consume a WRAPPED npm export (Mantine-provider render), not just a pass-through, with zero assertion changes |
| 9 | mcp | `claude-permission-contract` → `z` from `npm/zod` | Proves a contract, its stub and its test all resolve through a pass-through with no behaviour difference |
| 10 | mcp | `file-scanner-broker` → `glob` from `npm/glob` | A second, independent glob caller reconciled onto the one gateway `glob` |

## 6. Edge cases the design did not account for

- **Cross-package proxy hoisting.** A caller's `.proxy.ts` composing a gateway package's `./testing`
  proxy (e.g. siegelense composing `@dungeonmaster/bin/testing`) silently failed to mock anything —
  the resolver only understood a relative import or the one hardcoded `@dungeonmaster/shared/testing`
  case. Fixed generally in `packages/testing/src` by reading each workspace package's own `exports` map
  (`workspacePackageImportResolveMiddleware`), not by hardcoding package names. (`followups.md`, unit 6)
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

## 7. Not done, and why

- **Every adapter except the ten trial units' callers is unmigrated.** `coverage.md` counts 220 adapters
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
npm run ward -- --only lint,typecheck,unit -- packages/node/src packages/npm/src packages/browser/src packages/bin/src
```

Start with `scrolls/gateway-build/lint-plan.md`'s "Decisions made while building" table and
`scrolls/gateway-build/followups.md` — every open question and every fix made in response to a trial
finding is logged there, in the order it was found. Then read one trial unit end to end
(`scrolls/gateway-build/trial/unit-6.md` is the densest — cross-package proxy hoisting, the
async/throw semantics change, and the proxy-naming fix all show up in one file) before skimming the
rest.
