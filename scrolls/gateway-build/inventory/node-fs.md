# Inventory: `@dungeonmaster/node/fs` and `@dungeonmaster/node/fs/promises`

Scope: every adapter whose `outside` in `tmp/adapters-fresh/adapters.json` holds `@types/node :: fs.*` or
`@types/node :: fs/promises.*`, plus the testing package's `src/adapters/fs/*`, which that scan leaves out.
Every adapter was opened, and so were its production callers. Line numbers are against this worktree
on 2026-09-26. Paths in §2–§4 drop the leading `packages/`.

## 1. Proposed API

### Rules the whole module follows

| Rule | Decision | Why |
|---|---|---|
| Error shape | **An error raised by the OS passes through unchanged**: the raw `NodeJS.ErrnoException` with its own `code`, `path` and `syscall`. No wrapper puts it inside `new Error(msg, { cause })`. The module exports one realm-safe guard, `isFsError({ error, code })`, which checks `typeof error === 'object'` and the `code` field, never `instanceof`. | Most copies already let the raw error through (hooks, mcp, server, tooling, ward, shared, testing). The copies that wrap it (cli, config, orchestrator and siegelense `read-file`, hooks `stat`) make every caller dig `.cause.code` back out. That costs the 28-line check at `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts:40-70` and the pre-check workaround described in `packages/orchestrator/src/brokers/planned-work/read/planned-work-read-broker.ts:4-5`. Node builds `fs` rejections outside Jest's vm realm, so `instanceof Error` is false in tests (same file, lines 53-56). That is why the guard reads the code field and never uses `instanceof`. |
| Errors the gateway raises itself | Invalid JSON: a `SyntaxError` whose message names the path. It carries no `code`. | `JSON.parse`'s own message never names the file. Callers today cannot tell which read failed. |
| "Missing" | **ENOENT, and nothing else.** An `*IfExists` function returns `null` on ENOENT. On EACCES, EPERM, EISDIR, ENOTDIR and invalid JSON it rejects. | Every hole in §4 comes from treating "any failure" as "missing". |
| Absent value | `null`, everywhere. | cli, ward and siegelense `stat`, orchestrator `readlink` and config's sentinel already use `null`. mcp's `*IfExists` pair uses `undefined`, which is the minority shape. |
| Encoding | Text functions are always UTF-8 and return `string`. Bytes have their own functions. | siegelense passes `'latin1'` to read a PNG losslessly (`packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.ts:6-11`). `readFileBytes` covers that case. |
| Return values | Plain values only: `Stats` becomes `{ kind, sizeBytes, modifiedAtMs }`, and `Dirent` becomes `{ name, kind }`. | Default 3 in the design doc. Today's proxies cast to fake a `Stats` (`packages/ward/src/adapters/fs/stat/fs-stat-adapter.proxy.ts:15`, `as unknown as Stats`), and the brief bans that cast. |
| Subpath | A synchronous function goes in `fs`. A promise function goes in `fs/promises`. | A subpath equals the raw specifier, and Node's own split between `fs` and `fs/promises` is sync against async. A caller that imported `existsSync` from `'fs'` today imports it from `@dungeonmaster/node/fs`. |
| Raw `readFile` | Never re-exported. `readFile` is our wrapper: fixed UTF-8, plain `string`, and the error rules above. | Brief rule 3. |

Sad-path columns: **rejects** means the raw OS error propagates as described above. **n/a** means Node cannot raise that error for that call.

### `@dungeonmaster/node/fs/promises`

| Export | Signature | ENOENT | EACCES/EPERM | EISDIR/ENOTDIR | Invalid JSON | Empty file | Partial write |
|---|---|---|---|---|---|---|---|
| `readFile` | `(path) => Promise<string>` | rejects | rejects | rejects | n/a | `''` | reads whatever bytes are on disk |
| `readFileIfExists` | `(path) => Promise<string \| null>` | `null` | rejects | rejects | n/a | `''`, which is distinct from `null` | as `readFile` |
| `readFileBytes` | `(path) => Promise<Uint8Array>` | rejects | rejects | rejects | n/a | empty array | as `readFile` |
| `readFileFromOffset` | `({ path, fromByte }) => Promise<string>` | rejects | rejects | rejects | n/a | `''`; an offset past EOF also gives `''` | returns the bytes present |
| `readJsonFile` | `(path) => Promise<unknown>` | rejects | rejects | rejects | `SyntaxError` naming the path | `SyntaxError`, because empty is not JSON | `SyntaxError`; truncated is never reported as missing |
| `readJsonFileIfExists` | `(path) => Promise<unknown \| null>` | `null` | rejects | rejects | `SyntaxError` naming the path | `SyntaxError` | `SyntaxError` |
| `readNonEmptyLines` | `(path) => Promise<string[]>` | rejects | rejects | rejects | n/a, because lines come back unparsed | `[]` | a trailing partial line comes back as one line, and the caller's line parse decides what to do with it |
| `writeFile` | `(path, contents: string) => Promise<void>` | creates the file; ENOENT on a missing parent rejects | rejects | rejects | n/a | writes `''` | **not atomic**: a crash leaves a truncated file |
| `writeFileAtomic` | `(path, contents: string) => Promise<void>` | creates the parent directory | rejects | rejects | n/a | writes `''` | writes a sibling temp file, then `rename`s it over the target. **The temp file is removed if the rename fails.** Replaces the hand-built write-then-rename pairs listed in §2. |
| `writeFileExclusive` | `(path, contents: string) => Promise<void>` | creates the file | rejects | rejects | n/a | — | flag `'wx'`. EEXIST rejects raw, and that is the lock signal siegelense `boot-lock-acquire-broker` relies on. |
| `writeFileCreatingParent` | `(path, contents: string) => Promise<void>` | creates the parent directory and the file | rejects | rejects | n/a | — | not atomic |
| `writeFileBytes` | `(path, bytes: Uint8Array) => Promise<void>` | creates the file | rejects | rejects | n/a | — | not atomic |
| `writeFileFromBase64` | `(path, base64: string) => Promise<void>` | creates the file | rejects | rejects | n/a | — | not atomic |
| `appendFile` | `(path, contents: string) => Promise<void>` | creates the file | rejects | rejects | n/a | — | a torn last line is possible, so readers use `readNonEmptyLines` |
| `appendLinesCreatingParent` | `({ path, lines: string[] }) => Promise<void>` | creates the parent directory and the file | rejects | rejects | n/a | an empty `lines` list writes nothing | as `appendFile` |
| `ensureDir` | `(path) => Promise<void>` | creates the directory; always recursive | rejects | ENOTDIR rejects | n/a | — | — |
| `rm` | `(path, { recursive?, force? }) => Promise<void>` | rejects, or does nothing when `force` is set | rejects | rejects | n/a | — | — |
| `rename` | `(from, to) => Promise<void>` | rejects | rejects | rejects | n/a | — | atomic on one filesystem. ENOTEMPTY and EEXIST reject raw; ward treats that as a real answer. |
| `unlink` | `(path) => Promise<void>` | rejects | rejects | rejects | n/a | — | — |
| `unlinkIfExists` | `(path) => Promise<void>` | resolves | rejects | rejects | n/a | — | — |
| `copyFile` | `(from, to) => Promise<void>` | rejects | rejects | rejects | n/a | — | leaves a partial copy on failure |
| `copyDirContents` | `({ from, to, excludeNames: string[] }) => Promise<void>` | rejects | rejects | rejects | n/a | — | rejects on the first failure and **removes what it already copied into `to`** (see §4) |
| `symlink` | `({ target, path, type? }) => Promise<void>` | n/a | rejects | rejects | n/a | — | EEXIST rejects |
| `readlink` | `(path) => Promise<string>` | rejects | rejects | EINVAL (the path is not a link) rejects | n/a | — | — |
| `readlinkIfLink` | `(path) => Promise<string \| null>` | `null` | rejects | EINVAL gives `null` | n/a | — | — |
| `realpath` | `(path) => Promise<string>` | rejects | rejects | rejects | n/a | — | never returns the input path in place of a resolved one |
| `pathExists` | `(path) => Promise<boolean>` | `false` | **rejects** | ENOTDIR gives `false` | n/a | — | — |
| `stat` | `(path) => Promise<{ kind: 'file'\|'directory'\|'symlink'\|'other', sizeBytes, modifiedAtMs }>` | rejects | rejects | rejects | n/a | — | — |
| `statIfExists` | `(path) => Promise<… \| null>` | `null` | rejects | rejects | n/a | — | — |
| `diskFreeBytes` | `(path) => Promise<number \| null>` | rejects | rejects | rejects | n/a | — | `null` only when the runtime has no `statfs` |
| `readdir` | `(path) => Promise<string[]>` | rejects | rejects | ENOTDIR rejects | n/a | `[]` for an empty directory | — |
| `readdirIfExists` | `(path) => Promise<string[] \| null>` | `null`, kept distinct from `[]` | rejects | rejects | n/a | `[]` | — |
| `readdirEntries` | `(path) => Promise<{ name, kind }[]>` | rejects | rejects | rejects | n/a | `[]` | — |
| `isFsError` | `({ error: unknown, code: string }) => boolean` | — | — | — | — | — | the pure guard from the rules table. The same function is exported from both subpaths. |

### `@dungeonmaster/node/fs` (synchronous)

The synchronous functions follow the same rules and the same sad-path behaviour as their promise counterparts.

| Export | Signature | Notes |
|---|---|---|
| `existsSync` | `(path) => boolean` | Keeps Node's meaning exactly: `false` on any failure, EACCES included. It keeps the name because the meaning is unchanged. A caller that must tell EACCES apart from a missing path uses `pathExists`. |
| `readFileSync` | `(path) => string` | |
| `readFileSyncIfExists` | `(path) => string \| null` | Replaces eslint-plugin's check-then-read (`fs-ensure-read-file-sync-adapter.ts:22-26`), which has a gap between the check and the read. |
| `readJsonFileSync` / `readJsonFileSyncIfExists` | `(path) => unknown` / `unknown \| null` | ward `read-json-sync`, testing `queue-metadata-read`, siegelense `cli-package-bin-resolve` |
| `writeFileSync` / `appendFileSync` | `(path, contents: string) => void` | |
| `ensureDirSync` | `(path) => void` | Always recursive. No production caller passes `recursive: false`. |
| `rmSync` / `unlinkSync` / `symlinkSync` / `realpathSync` | as the promise versions | |
| `readdirSync` / `readdirEntriesSync` | `(path) => string[]` / `{ name, kind }[]` | |
| `statSync` | `(path) => {…}` | |
| `globSync` | `({ patterns, cwd, exclude? }) => string[]` | Node's `fs.globSync`. No default ignore list is built in. |
| `walkFilesSync` | `({ rootPath, suffix }) => { path, sizeBytes, modifiedAtMs }[]` | ENOENT or EACCES on a subtree **skips that subtree**. A file that disappears between listing and stat is skipped too. This leniency is a decision, not a hole: orchestrator's usage scan walks the whole Claude home, and one unreadable corner must not stop it. |
| `findUpSync` | `({ startDir, fileName }) => string \| null` | Walks up the directory tree. mcp and siegelense each have an identical copy today (§3). |
| `openForAppendSync` / `closeSync` | `(path) => number` / `(fd) => void` | These file descriptors feed spawn `stdio`. Flag `'a'` creates the file if it is missing. |
| `tailFile` | `({ path, startPosition: 'beginning'\|'end', awaitCreate?, onLine, onError }) => { stop }` | orchestrator's `fs-watch-tail-adapter.ts`, moved whole: `fs.watch`, a read stream and readline, with no contracts. ENOENT without `awaitCreate` reports through `onError`. A file that shrinks resets the read position to 0. |

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

## 5. How callers use the reads

The design doc's scan puts 61 read-file calls inside a `try` or `.catch`. Reading them gives these shapes, most common first:

| Shape | What "the read failed" means | Where it appears | Verdict |
|---|---|---|---|
| **Swallow everything, then continue to a write** | "start fresh" | settings, `.mcp.json` and `.gitignore` installers (§4) | Unsafe. Becomes `readJsonFileIfExists`: missing means start fresh, invalid JSON rejects, and the write uses `writeFileAtomic` |
| **Swallow everything, return a default** (`null`, `''`, `[]`, `{}`, `false`) | "not there yet" or "nothing to show" | ward workspace discovery, the typecheck tsconfig read, hooks folder-detail and subagent-stop (which fails open), shared architecture source read, orchestrator replay | Mostly meant ENOENT. Becomes `*IfExists` |
| **Test ENOENT, rethrow the rest** | "absent is a valid answer" | hooks `file-read-or-empty`, cli, ward and siegelense `stat`, siegelense `readdir`, ward `crypto-hash-files` | Correct, and this is the model the gateway copies |
| **Dig `.cause.code === 'ENOENT'`** | as above, through the wrap | siegelense heartbeat, orphan, boot-failure-marker, shutdown-reason, compare, results and boot-lock readers | Correct, but only because of the wrap. It collapses to `readFileIfExists` |
| **Check existence first, then read** | skip without reading | cli install-add-dev-deps, the testing testbed accessors, eslint-plugin `ensure-read`, orchestrator planned-work (which does this *because of* the wrap) | Leaves a gap between the check and the read. Becomes `*IfExists` |
| **Re-wrap as a domain error** | "config is broken", with a message | config `configFileLoadBroker` (as `InvalidConfigError`), cli register | Fine. The gateway error keeps the path, so this adds nothing |
| **No catch** | a fault | most strict reads | Fine, once invalid JSON names its path |

After a read, callers overwhelmingly `JSON.parse` the result and then run a zod contract on it. A few split lines: orchestrator `read-jsonl`, the siegelense buffer and transcript readers. `JSON.parse` with no guard of its own appears at `cli-create-package-responder.ts:40`, `install-add-dev-deps-responder.ts:47`, `package-register-broker.ts:40`, `siegelense boot-lock-acquire-broker.ts:105` and `heartbeat-read-broker.ts:60`. `readJsonFile*` gives each of these a `SyntaxError` that names the path.

## 6. Proxy design

**How it works today.** Each adapter's own proxy calls `registerMock({ fn: <node fn> })` on the Node function it wraps, for example `stat` from `'fs/promises'`. It stages answers keyed by the **path argument**: `handle.calledWith([filePath]).resolves(…)`, `.rejects(error)` (`packages/ward/src/adapters/fs/stat/fs-stat-adapter.proxy.ts:11-23`). The testing package's synchronous proxies add a no-argument default, `calledWith([]).returns('')`, so an unstaged call inside a composed broker does not throw (`packages/testing/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts:18-20`). A caller's proxy calls the adapter's proxy (for example `fsReadFileAdapterProxy()` from its responder proxy) and never touches `fs` directly. The ENOENT errors that proxies and tests stage are built by hand at every site with `Object.assign(new Error(...), { code: 'ENOENT' })`.

**Wrapper tests, inside the gateway.** Each gateway wrapper's own `.proxy.ts` mocks the Node function underneath with `registerMock`, keyed by path, exactly as today. The wrapper's `.test.ts` drives every row of §1 through it: ENOENT, EACCES, EISDIR, ENOTDIR, invalid JSON, empty file, truncated file, and for `writeFileAtomic` and `copyDirContents` a failed `rename` or copy. Staged errors come from one stub, `FsErrorStub({ code, path, syscall })`. The stub builds a **plain object with no `Error` prototype**, so every test also proves that `isFsError` never depends on `instanceof`, which real rejections from outside the Jest realm would fail.

**Callers' proxies.** `@dungeonmaster/node/testing` exports one proxy per wrapper: `readFileProxy`, `readFileIfExistsProxy`, `readJsonFileIfExistsProxy`, `writeFileAtomicProxy`, `statIfExistsProxy`, and so on. Each calls `registerMock({ fn: readFileIfExists })` on the **gateway function**, not on `fs`. Mocking `fs` would skip the wrapper's behaviour, and the broker depends on that behaviour. Every staging method is keyed by path and speaks in the wrapper's own terms, so a caller's test never builds an OS error:

| Proxy method | What it stages |
|---|---|
| `returns({ path, value })` | the wrapper's success value |
| `missing({ path })` | `null` on an `*IfExists` wrapper. On a strict wrapper it rejects with `FsErrorStub({ code: 'ENOENT' })` |
| `denied({ path })` | rejects with `FsErrorStub({ code: 'EACCES' })` |
| `invalidJson({ path })` | on `readJson*` only, rejects with the path-naming `SyntaxError` the wrapper raises |
| no-argument default | `readFile`-family proxies stage the answer `missing` gives. Write-family proxies resolve. |
| `writtenContents({ path })` | on write proxies, returns the contents written, so a caller's test asserts on real values and not merely that a write happened |

For callers, `FsErrorStub` and `isFsError` are the only error-related surface, which keeps the one error shape the only one a test can create.
