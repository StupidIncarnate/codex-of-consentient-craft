# Inventory: `@dungeonmaster/node/fs` and `@dungeonmaster/node/fs/promises`

Scope: every adapter whose `outside` in `tmp/adapters-fresh/adapters.json` holds `@types/node :: fs.*` or
`@types/node :: fs/promises.*`, plus the testing package's `src/adapters/fs/*`, which that scan leaves out.
Every adapter was opened, and so were its production callers. Line numbers are against this worktree
on 2026-09-26. Paths in §2–§4 drop the leading `packages/`.

## 1. Status: built

`@dungeonmaster/node/fs` and `@dungeonmaster/node/fs/promises` are built, at
`packages/@gateway/node/src/fs/` and `packages/@gateway/node/src/fs/promises/`. Node's raw `fs` and
`fs/promises` are never re-exported; every export is our own wrapper, and each wrapper file states its
own behavior in its `PURPOSE` comment. An `*IfExists` function returns `null` on ENOENT and rejects on
every other OS error. `readJsonFile` and `readJsonFileIfExists` raise a `SyntaxError` naming the path on
invalid JSON. Every return value is a plain object — never a real `fs.Stats` or `Dirent`. `isFsError({
error, code })` is the one guard every wrapper uses to check an error's code: Node builds `fs` rejections
outside Jest's vm realm, so `instanceof Error` is false there even though it is true in production, and
this guard reads the `code` field instead of using `instanceof`.

Section 2 below maps each old adapter to its gateway export. Section 3 names the adapters that wrapped
the same function differently, and which behavior won.

## 2. Mapping: today's adapter → gateway export

Paths are under `packages/`. **fp** means `…/fs/promises`, and **fs** means `…/fs`.

| Today | Gateway |
|---|---|
| cli `fs/read-file` · `write-file` · `append-file` · `mkdir` · `rename` | fp `readFile` · `writeFile` · `appendFile` · `ensureDir` · `rename` (the write and rename pair in `rateLimitsSnapshotWriteBroker` becomes `writeFileAtomic`) |
| cli `fs/stat` · `readdir` · `realpath` | fp `statIfExists` · fs `readdirSync` · fs `realpathSync` (this drops the swallow; the adapter has no production caller) |
| config `fs/access` · `read-file` · `write-file` | fp `pathExists` · `readFile` / `readJsonFileIfExists` · `writeFile` |
| eslint-plugin `fs/exists-sync` · `read-file-sync` · `ensure-read-file-sync` · `write-file-sync` | fs `existsSync` · `readFileSync` · `readFileSyncIfExists` · `writeFileSync` |
| hooks `fs/exists-sync` · `read-file` · `stat` · `ensure-write` | fs `existsSync` · fp `readFile` / `readFileIfExists` · fp `stat` (drops the `cause` wrap) · fp `writeFileCreatingParent` |
| hydration `fs/ensure-write`; hydration-recipes `fs/write-text` | fp `writeFileCreatingParent` |
| hydration-recipes `fs/write-file` · `append-file` · `rename` · `rm` · `dm-jsonl/append` | fp `writeFile` · `appendFile` · `rename` · `rm` · `appendLinesCreatingParent` |
| mcp `fs/read-file` · `read-file-if-exists` · `readdir` · `readdir-if-exists` · `stat` · `write-file` · `mkdir` | fp `readFile` · `readFileIfExists` (narrowed to ENOENT) · `readdir` · `readdirIfExists` (narrowed to ENOENT) · `stat` · `writeFile` · `ensureDir` |
| mcp `shared-package/resolve/find-shared-package-root-layer-adapter` | fs `findUpSync`. The `require.resolve` wrapper around it stays an mcp broker. |
| orchestrator `fs/read-file` · `write-file` · `append-file` · `rename` · `rm` · `symlink` | fp `readFile` (drops the wrap) · `writeFile` · `appendFile` · `rename` · `rm` · `symlink` (the write and rename pair in `dispatch-state-write` and `quest-persist` becomes `writeFileAtomic`) |
| orchestrator `fs/is-accessible` · `readlink` · `read-file-range` · `read-jsonl` | fp `pathExists` · `readlinkIfLink` · `readFileFromOffset` · `readNonEmptyLines` (each line keeps its own `streamJsonLineContract.parse` in the caller) |
| orchestrator `fs/readdir` · `walk-files` · `watch-tail` | fs `readdirSync` · `walkFilesSync` · `tailFile` |
| orchestrator `child-process/spawn-stream-json` | Stays in the child-process inventory. Its `readFileSync` of `.claude/settings.json` becomes fs `readFileSyncIfExists`. |
| server `fs/read-file` · `read-file-bytes` · `write-file` · `write-file-bytes` · `write-file-base64` | fp `readFile` · `readFileBytes` · `writeFile` (no production caller) · `writeFileBytes` · `writeFileFromBase64` |
| server `fs/mkdir` · `rm` · `stat` · `realpath` | fp `ensureDir` · `rm` · `stat` · `realpath` |
| server `web-bundle/dist-path` | Stays an adapter-turned-broker (`require.resolve`). Its `existsSync` call moves to fs. |
| shared `fs/access` · `exists-sync` · `mkdir` · `read-file-sync` · `readdir-with-types` | fp `pathExists` · fs `existsSync` · fp `ensureDir` · fs `readFileSync` / `readFileSyncIfExists` · fs `readdirEntriesSync` |
| siegelense `fs/read-file` · `write-file` · `append-file` · `rename` · `unlink` | fp `readFile` (drops the wrap), plus `readFileBytes` for PNG reads · `writeFile` / `writeFileExclusive` · `appendFile` · `rename` · `unlink` / `unlinkIfExists` (the write and rename pair in `registry-write` becomes `writeFileAtomic`) |
| siegelense `fs/stat` · `readdir` · `readlink` · `realpath` · `statfs` | fp `statIfExists` · `readdirIfExists` (`[]` becomes `null`) · `readlink` · `realpath` · `diskFreeBytes` (the conversion to megabytes stays with the caller) |
| siegelense `fs/copy-file` · `cp` · `rm` · `symlink` · `open-fd` · `close-fd` | fp `copyFile` · `copyDirContents` · `rm` · `symlink` · fs `openForAppendSync` · `closeSync` |
| siegelense `cli-package/bin-resolve/*` · `net/unix-serve` · `playwright/session/paste-layer` | Composed logic, which stays with siegelense. Their `existsSync`, `readFileSync`, `mkdirSync` and `unlinkSync` calls move to fs. `package-root-find-layer-adapter` becomes `findUpSync`. |
| tooling `fs/read-file` | fp `readFile` |
| ward `fs/read-file` · `write-file` · `mkdir` · `rename` · `rm` · `unlink` | fp `readFile` · `writeFile` · `ensureDir` · `rename` · `rm` · `unlink` |
| ward `fs/stat` · `readdir` · `readdir-dirs` · `read-json-sync` · `glob-sync` | fp `statIfExists` · `readdir` / `readdirIfExists` · `readdirEntries` filtered to `kind === 'directory'` · fs `readJsonFileSyncIfExists` · fs `globSync` (`discoveredCount` stays with the caller) |
| ward `crypto/hash-files` | `@dungeonmaster/node/crypto` `hashFiles`, which calls fs `readFileSync` internally. Its per-file skip of ENOENT and EISDIR, with everything else rethrown, is kept. This belongs to the crypto inventory. |
| testing `fs/read-file` · `write-file` · `append-file` · `mkdir` · `rm` · `unlink` · `symlink` · `readdir` | fs `readFileSync` · `writeFileSync` · `appendFileSync` · `ensureDirSync` · `rmSync` · `unlinkSync` · `symlinkSync` · `readdirSync` |
| testing `fs/exists` · `exists-sync` | fs `existsSync`. These are two adapters with identical bodies. |
| testing `fs/queue-metadata-read` | fs `readJsonFileSync`. The contract parse stays in the harness. |

## 3. Drift: copies of one wrapper that behave differently

| Wrapper | Behaviour A | Behaviour B | Winner |
|---|---|---|---|
| read-file | Wraps the error in `new Error(msg, { cause })`: `cli/src/adapters/fs/read-file/fs-read-file-adapter.ts:21-23`, `config/…:22-24`, `orchestrator/…:21-23`, `siegelense/…:36-39` | Raw error: `hooks/…:18`, `mcp/…:21`, `server/…:22`, `ward/…:21`, `tooling/…:18`, testing `…:14` (the testing copy is synchronous) | **Raw.** Callers of A dig into `.cause`, for example `siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts:39-54` |
| stat | Wraps the error and never returns null: `hooks/src/adapters/fs/stat/fs-stat-adapter.ts:13-17` | ENOENT gives `null` and anything else rethrows: `cli/…:18-30`, `ward/…:24-36`, `siegelense/…:25-42` (siegelense returns `{ sizeBytes, modifiedAtMs }`). A third behaviour is raw with no null: `mcp`, `server` | **`stat` raw plus `statIfExists` for ENOENT.** The plain-object return comes from siegelense. |
| realpath | Swallows every error and returns the input path: `cli/src/adapters/fs/realpath/fs-realpath-adapter.ts:18-24` | Raw rejection: `server/…`, `siegelense/…:22` | **Raw.** Server's own header says a check against the unresolved name can be stepped around. |
| readlink | Swallows everything and returns `null`: `orchestrator/src/adapters/fs/readlink/fs-readlink-adapter.ts:21-26` | Raw: `siegelense/…:22`. Its caller `install-link-create-responder` classifies ENOENT and EINVAL itself. | **Both kept, both narrowed:** `readlink` stays raw, and `readlinkIfLink` returns null on ENOENT or EINVAL only |
| readdir when missing | Swallows everything and returns `undefined`: `mcp/src/adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.ts:20-25` | ENOENT gives `[]` and anything else rethrows: `siegelense/src/adapters/fs/readdir/fs-readdir-adapter.ts:26-39` | **siegelense's narrowing with mcp's distinct absent value.** The absent value is `null`, not `[]`, so "never existed" and "exists but empty" stay apart. |
| read-file when missing | Swallows everything and returns `undefined`: `mcp/src/adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.ts:23-28` | hooks `file-read-or-empty-broker.ts:20-31` gives `''` on ENOENT and rethrows other Node errors (a non-Node error still falls through to `''`) | **ENOENT only**, returning `null` |
| existence check | `orchestrator/…/is-accessible/…:19-24`: `access(R_OK)`, and every error gives `false` | config and shared `access`: raw rejection, and callers `.catch(() => false)` it | **`pathExists`**: ENOENT and ENOTDIR give `false`, EACCES rejects |
| readdir sync or async | synchronous: cli, orchestrator, testing | asynchronous: mcp, siegelense, ward | **Both exist, split by subpath** |
| mkdir `recursive` | Always recursive: cli, mcp, server, shared, ward | Parameter supplied by the caller: `testing/src/adapters/fs/mkdir/fs-mkdir-adapter.ts:14-19` | **Always recursive** (`ensureDir`) |
| write, creating parent | hooks `ensure-write`, hydration `ensure-write`, hydration-recipes `write-text` | the same body under three names | one `writeFileCreatingParent` |
| find-up walk | `mcp/…/find-shared-package-root-layer-adapter.ts` | `siegelense/…/package-root-find-layer-adapter.ts`, the same logic | one `findUpSync` |
| exists | testing `fs/exists` | testing `fs/exists-sync`, the same `existsSync` call | one `existsSync` |

## 4. Sad-path holes

| Where | What goes wrong | Data loss |
|---|---|---|
| `mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts:62-67` → write at `:119` | **Confirmed.** A bare `catch {}` around read plus `JSON.parse` sets `existingSettings = {}` on ENOENT, EACCES *or* invalid JSON. The broker then writes back a settings file holding only our permissions. | **Yes** |
| `hooks/src/responders/install/create-settings/install-create-settings-responder.ts:49-53` → write at `:119` | **The same bug on the same file**, `.claude/settings.json`: `.then(JSON.parse).catch(() => null)`, then the `null` branch writes a fresh settings file with only our hooks and defaults. A single typo in a user's settings file is erased by `init` twice. | **Yes** |
| `mcp/src/responders/install/config-create/install-config-create-responder.ts:40-45` → write at `:93-95` | `.mcp.json`: a read or parse failure leaves `existingConfig` as `null`, and the responder then writes a new file containing only the dungeonmaster server. Every other MCP server the user configured is lost. | **Yes** |
| `ward/src/responders/install/write-gitignore/install-write-gitignore-responder.ts:37-41` | Any read error becomes `''`, then ward's lines are written as the whole file. On EACCES the write fails too, so the damage is limited: the realistic outcome is a misleading message, not lost lines. | Low |
| `config/src/responders/install/create-config/install-create-config-responder.ts:45-47` and `:55-57` | `access().catch(() => false)` treats EACCES as missing. A read failure and a parse failure both become `null`, which reports "not valid JSON". It **does** skip the write. | No, but the diagnosis is wrong |
| `cli/src/responders/install/add-dev-deps/install-add-dev-deps-responder.ts:47`; `cli-create-package-responder.ts:40`; `cli/src/brokers/package/register/package-register-broker.ts:34-40` | `JSON.parse` has no guard. A malformed `package.json` throws a bare `SyntaxError` that names no file. The register broker also re-wraps a read failure of any kind as "No package.json found". | No |
| `ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts:76-80` | A missing or invalid `tsconfig.json` quietly becomes `{}`, so typecheck discovers a different file set and nothing reports it. | No, but the result is silently wrong |
| `ward/src/brokers/workspace/discover/workspace-discover-broker.ts:23` | `.catch(() => null)` makes EACCES on the root `package.json` read as "not a workspace", which changes how ward runs. | No |
| `orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.ts:162-192` | A bare `catch` around readdir plus every sub-agent read. EACCES, or one unreadable sub-agent file, drops **all** sub-agent entries from the replay. | Display only |
| `orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts:66-70`, `:81-89` | Any error reading `.claude/settings.json` becomes "no settings", and malformed JSON is passed on as the raw string. A spawned child can then run without the project's permissions. | No |
| `mcp/src/adapters/fs/read-file-if-exists/…:26-28`, `…/readdir-if-exists/…:23-25`, `orchestrator/…/readlink/…:24-26`, `orchestrator/…/is-accessible/…:22-24` | Each swallows everything, so EACCES reads as absent. Every caller inherits the ambiguity. | Makes the rows above possible |
| `cli/src/adapters/fs/realpath/fs-realpath-adapter.ts:21-24` | Returns the unresolved path on any error. A caller checking where a path really points can be sent the wrong way. | No, but security-relevant |
| `siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts:39` | The unlink sits inside the `try`, but the catch only accepts `.cause.code === 'ENOENT'`. A raw ENOENT from a competitor's unlink has no `cause`, so it is rethrown as a failure instead of "already released". | No, but the boot fails spuriously |
| `siegelense/…/cp/fs-cp-adapter.ts:35-44` and its callers `snapshot-capture`, `snapshot-restore-layer` | `Promise.all` over per-entry `cp` with no cleanup. A failure part-way leaves a half-copied snapshot, and a later restore trusts it. | **Partial snapshot** |
| write-then-rename pairs: cli `rateLimitsSnapshotWriteBroker`, orchestrator `dispatch-state-write` and `quest-persist`, hydration-recipes `quest-persist-direct`, siegelense `registry-write` | Each is hand-built, and none removes the `.tmp` file when `rename` fails. hydration-recipes appends to the outbox after the rename with no try, so a failed append leaves the quest written and its event missing. | Orphaned files, a lost event |
| `siegelense/src/adapters/fs/statfs/fs-statfs-adapter.ts:36` | A real `statfs` failure rejects the whole `machine-read-broker` status reading, not just the disk field. | No |
| `server/src/brokers/local-image/copy/local-image-copy-broker.ts:57-63` | A failed image write goes to stderr and returns `undefined`. The image is dropped from the chat message and the user is not told. | **The image is dropped** |
| `testing/src/brokers/integration-environment/create/integration-environment-create-broker.ts` `getPackageJson` | The only accessor in that file with no existence guard. The testing `read-file` itself is a synchronous read with no guard. | Test-harness crash |
| `siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts:105`, `siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts:60` | `JSON.parse` with no guard of its own; malformed content throws a bare `SyntaxError` that names no file | No |

## 5. Proxy design

Every wrapper's own `.proxy.ts` file mocks the Node function underneath with `registerMock`, keyed by
the path argument — for example `packages/@gateway/node/src/fs/promises/read-file-if-exists.proxy.ts`
mocks `readFile` from `fs/promises`. Every fs proxy checked (`read-file-if-exists`, `stat-if-exists`,
`read-json-file`, and others beside them) exposes one generic `rejects({ path, error })` method that
accepts any `unknown` value as the staged rejection, rather than a named method per error code. Item 24
of `scrolls/gateway/followup-sustainability.md` asks for every gateway proxy to be checked for a
parameter that accepts any `Error`; the fs proxies still need that check.

`FsErrorStub({ code, path, syscall })`, in `packages/@gateway/node/src/fs/fs-error.stub.ts`, is the one
recorded-failure stub these proxies stage with. It builds a real `Error` instance (not a bare object), so
`registerMock`'s `.rejects()` and Jest's `.toThrow()` both accept it unchanged.
