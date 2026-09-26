# Inventory: `@dungeonmaster/node` and `@dungeonmaster/browser`

Scope: every Node module/global and every browser global outside `fs`, `fs/promises` and
`child_process` (two other agents own those). Source: `tmp/adapters-fresh/adapters.json`,
`globals.json`, a `python3` re-scan of `packages/*/src/**` for the raw call sites
(`tmp/adapters-fresh/global-sites.json`), and the real files.

## 1. Subpaths

### Node modules

| Subpath | Kind | Why |
|---|---|---|
| `@dungeonmaster/node/path` | pass-through | Brief names it explicitly. No adapter over it does more than call one function (`path-join-adapter.ts` ×5 packages, `path-dirname-adapter.ts` ×3, `path-resolve-adapter.ts` ×3, `path-basename-adapter.ts` ×1 — all "one outside call, nothing added"). |
| `@dungeonmaster/node/os` | pass-through | `os-homedir-adapter.ts` (shared) adds one thing — `process.env.DUNGEONMASTER_HOME ?? homedir()` — which is app logic (env override), not a guard on `os` itself; it becomes a broker. `os-info-adapter.ts` (siegelense) only unit-converts bytes→MB, also broker logic. `os.tmpdir()` (siegelense, ward) is a bare call. Nothing here guards a sad path `os` itself can produce. |
| `@dungeonmaster/node/crypto` | pass-through | `crypto-random-uuid-adapter.ts` (cli) and `crypto-hash-adapter.ts` (siegelense) call `randomUUID`/`createHash` and validate the *output* with a zod brand — that belongs at the call site (gateway wrappers take/return plain values, never contracts). `crypto-hash-files-adapter.ts` (ward) reads files and folds a digest — real logic, but it is OUR logic over `fs` + `crypto` together; it moves to a broker in ward that imports both gateway modules. |
| `@dungeonmaster/node/util/types` | pass-through | Only `isNativeError` is used, always inline (`error-is-native-error-adapter.ts`, `fetch-probe-adapter.ts`, `process-is-alive-adapter.ts`, `process-kill-group-adapter.ts`, `fs-readdir`/`fs-stat` adapters). It never throws or needs a guard — it's a type-narrowing predicate. |
| `@dungeonmaster/node/url` | pass-through | Node's `url` module (`fileURLToPath`, etc.) has no caller found in this scan; `new URL()`/`URLSearchParams` uses seen are the GLOBAL constructors, not this module — see globals below. |
| `@dungeonmaster/node/events` | pass-through | No caller found anywhere in `packages/*/src/**` (no `EventEmitter`, no bare `events` import). Listed for completeness per the brief; first real caller decides if it ever needs curation. |
| `@dungeonmaster/node/module` | pass-through, with one exception | `require`, `require.resolve`, `__dirname`, `__filename` are the CommonJS-per-file locals the direction exempts from the globals rule (Defaults #5) — they are NOT re-exported here; a file that needs them keeps using them directly. The one thing that DOES move: `require.resolve('<pkg>')` used purely to *locate a package's install root* (not to load it) — see curated helper below. |
| `@dungeonmaster/node/net` | **curated** | See §2. |
| `@dungeonmaster/node/readline` | **curated** | See §2. |

### Node globals

| Subpath | Kind | Exports |
|---|---|---|
| `@dungeonmaster/node/process` | curated (mixed) | `stdout`, `stderr` — the raw `Writable` objects, unchanged, per the direction's own decision ("output is exported as the raw write for now"). `stdin` — one curated function, `readStdinToEnd()` (replaces `processStdinReadAdapter`). `env` — `getEnv(name)` (reads `process.env[name]`, returns `string \| undefined`; no parsing — `Number(...)`/`?? default` stays at the call site since callers disagree on the fallback). `argv` — a plain re-export of `process.argv` (a live array snapshot, no guard needed — the only "logic" today, `argv.slice(n)`, is call-site arithmetic). `cwd()`, `pid`, `exit(code)`, `exitCode` (getter/setter), `platform`, `execPath`, `on(signal, handler)`, `kill(pid, signal)` — thin, un-added-to pass-throughs of the same-named globals, each its own export so the raw-import rule has one name per call site to catch. |
| `@dungeonmaster/node/setTimeout` / `/setInterval` / `/clearTimeout` / `/clearInterval` | pass-through | Present on both platforms (Defaults §"Globals present on both platforms"); Node side re-exports the global functions unchanged — no adapter anywhere adds retry/guard logic around them, they are always paired with the caller's own `AbortController`/flag. |
| `@dungeonmaster/node/console` | pass-through | No Node-side caller found in this scan (all 100 `console.*` hits are in `packages/web`). Exported unchanged per the direction ("a shared logger is not part of the first version"). |
| `@dungeonmaster/node/Buffer` | pass-through | `Buffer.concat`/`.from`/`.alloc` calls (stdin-read, pngjs-decode, fs-read-file-range) do their own error handling already (or none); nothing wraps `Buffer` itself. |
| `@dungeonmaster/node/URL`, `@dungeonmaster/node/URLSearchParams` | pass-through | 6 + 1 uses, all `new URL(...)`/`new URLSearchParams(...)` with no try/catch anywhere (a malformed URL throws `TypeError [ERR_INVALID_URL]` uncaught today — a sad-path hole, see §5). |
| `@dungeonmaster/node/fetch` | **curated** | See §3. |

### Browser globals

| Subpath | Kind | Exports |
|---|---|---|
| `@dungeonmaster/browser/fetch` | **curated** | See §3. |
| `@dungeonmaster/browser/localStorage` | **curated** | See §2. |
| `@dungeonmaster/browser/sessionStorage` | pass-through | Zero real callers in web's own runtime (only 3 referrer sites, all inside `page.evaluate()` strings driven by siegelense against a REMOTE browser — see §6, not gateway candidates). Shipped as a pass-through of the same shape as `localStorage` in case a future caller needs it; wrap it the day one does. |
| `@dungeonmaster/browser/WebSocket` | **curated** | See §2. |
| `@dungeonmaster/browser/indexedDB` | **curated** | See §2. |
| `@dungeonmaster/browser/console` | pass-through | Direction's own decision: "`@acme/browser/console` exports the console, unchanged." |
| `@dungeonmaster/browser/crypto` | pass-through | `crypto.randomUUID()` (Web Crypto global) — orchestrator's 35 uses are actually **Node-side** (orchestrator is `programmatic-service`, so they route to `@dungeonmaster/node/crypto`'s `randomUUID`, not here); web's 10 uses route here. No sad path — `randomUUID()` cannot fail. |
| `@dungeonmaster/browser/atob` | pass-through | Used in `canvas-image-measure-adapter.ts`, `canvas-image-rescale-adapter.ts` (web) to decode a data-URL's base64 body. No caller wraps it; a malformed base64 throws `DOMException: InvalidCharacterError` uncaught (§5). |
| `@dungeonmaster/browser/Blob`, `/createImageBitmap` | pass-through | Same two adapters. `createImageBitmap` rejects on a non-image blob; uncaught today (§5). |
| `@dungeonmaster/browser/document` | pass-through | `createElement`, `createTextNode`, `getElementById` — all DOM-shape building, no sad path (DOM calls here don't throw for the inputs given). |
| `@dungeonmaster/browser/navigator` | pass-through | `clipboard-write-adapter.ts`'s only content is hiding the global; `navigator.clipboard.writeText` rejects when the page isn't focused or permission is denied — uncaught today (§5). |
| `@dungeonmaster/browser/XMLHttpRequest` | pass-through | `xhr-post-with-progress-adapter.ts`'s real value (progress-event wiring, `load`/`error`/`timeout`/`abort` → one settled promise, JSON-vs-text body sniffing) is OUR orchestration of the object, not a guard on the object itself — moves to a broker in web that imports the pass-through. |
| `@dungeonmaster/browser/FileReader` | pass-through | Same reasoning — `file-read-data-url-adapter.ts`'s promise-wrapping is broker logic. |
| `@dungeonmaster/browser/AbortController` | pass-through | Present on both platforms; browser side unused directly in web's adapters scanned (Node side is used constantly for fetch timeouts — see §3). |
| `@dungeonmaster/browser/URL` | pass-through | No web caller found; listed for completeness. |
| `@dungeonmaster/browser/ResizeObserver`, `/requestAnimationFrame`, `/location` | pass-through | Single-digit uses each, no guard logic anywhere. |

Global **types** (`HTMLDivElement`, `HTMLElement`, `Node`, `Range`, `IDBDatabase`, `AbortSignal`,
`BufferEncoding`, `NodeJS`, `KeyboardEvent`, `InputEvent`, …) are exempt from the globals rule
entirely (a type never runs) — they stay usable directly wherever they are today, no subpath needed.

## 2. Curated modules — signatures and sad paths

### `@dungeonmaster/node/net`

Replaces: `net-check-port-free-adapter.ts` (orchestrator), `net-free-port-pair-adapter.ts` (shared),
`net-unix-request-adapter.ts` / `net-unix-serve-adapter.ts` (siegelense).

| Export | Signature | Sad paths |
|---|---|---|
| `isPortFree(port: number): Promise<boolean>` | binds a throwaway server to `port`, resolves `true`/`false` | Bind refusal (`EADDRINUSE`, `EACCES`) → `false`, never throws — matches today's adapter. |
| `freePortPair(): Promise<{ firstPort: number; secondPort: number }>` | two OS-assigned ports, both bound at once before either is read, to close the hand-out-the-same-port race | Bind error on either socket → rejects with a message naming which port failed. A non-object `server.address()` (should never happen, but Node's own type says it can) → rejects rather than returning garbage. |
| `unixSocketRequest({ socketPath, requestLine, timeoutMs }): Promise<string>` | writes one line, reads one newline-terminated line back, plain strings in and out (the driver-protocol JSON encode/decode moves to siegelense's own broker, since the gateway takes no dependency on `driverResponseContract`) | **Connection refused** (`ECONNREFUSED`, no socket) / **not found** (`ENOENT`) → rejects with the raw `Error`, `.code` intact, caller classifies. **Timeout** → rejects after `timeoutMs`, socket destroyed. **Malformed frame** (no line ever completes) → the existing adapter used to `safeParse` and reject on a validation failure; the gateway version has no contract to parse against, so it just resolves whatever line arrived — the caller (siegelense's broker) does the `driverResponseContract.safeParse` and turns a bad parse into its own error. |
| `unixSocketServe({ socketPath, onRequestLine }): Promise<{ close(): Promise<void> }>` | `mkdir -p`s the socket's parent, unlinks a stale socket file, listens, hands each line to `onRequestLine` and writes back whatever string it resolves to | **Bind error** (`EACCES` from a missing parent dir, `EADDRINUSE` from a live listener) → rejects. **`onRequestLine` throws** → the existing adapter catches this per-connection and writes an error frame back; the gateway version keeps that behaviour (a `.catch` around the caller's own promise), since "never leave the peer's read hanging" is a Node-`net` protocol guarantee, not app logic. |

Both socket functions keep today's real defect fix as gateway behaviour, not a comment: `mkdir -p`
before `listen()` (a `net.Server.listen()` against a path whose parent doesn't exist rejects `EACCES`,
not `ENOENT`), and unlinking a stale socket file before rebinding.

### `@dungeonmaster/node/readline`

Replaces: `readline-question-adapter.ts` (cli), `readline-create-interface-adapter.ts` (orchestrator),
and becomes the shared building block for the fs/child_process agents' own `fs-watch-tail` and
`spawn-stream-lines` wrappers (this package does not write those files, only the primitive they call).

| Export | Signature | Sad paths |
|---|---|---|
| `question({ input, output, prompt, fallback }): Promise<string>` | `input`/`output` are `Readable`/`Writable` (today's caller always passes `process.stdin`/`process.stdout`, but the gateway takes the streams as arguments rather than reading the globals itself, so a test can pass anything `Readable`/`Writable`) | **Stdin ends before any line is typed** (EOF immediately) → `rl.question()` resolves `''`; the wrapper returns `fallback` for an empty/whitespace-only answer, same as today. Always `rl.close()`s in a `finally`, even on throw. |
| `lineReader(input: Readable): { onLine(cb): void; close(): void }` | thin `readline.createInterface` wrapper, unchanged shape from today's adapter | **Stream errors mid-read** (`input.on('error', ...)`) — today's adapter does not surface this at all; it is the sad-path hole in §5. The gateway version adds an `onError` callback parameter so callers stop losing it silently. |

`readline/promises`'s `createInterface` and plain `readline`'s `createInterface` are the same
underlying need (line-by-line reading) with one being interactive (question/answer) and the other
being a stream tap — kept as two exports rather than one, since their call shapes never overlap in
any caller found.

### `@dungeonmaster/node/fetch`

Replaces: `fetch-http-request-adapter.ts`, `fetch-probe-adapter.ts` (siegelense);
`shared/src/adapters/fetch/get/fetch-get-adapter.ts`; the raw `globalThis.fetch` calls in hooks (2),
hydration (1), hydration-recipes (1), orchestrator (1).

| Export | Signature | Sad paths |
|---|---|---|
| `fetchJson<T>({ url, method?, headers?, body?, timeoutMs? }): Promise<T>` | body auto-JSON-serialized (object → `content-type: application/json`), response body JSON-parsed | **Non-2xx** → throws `Error` naming url + status + body text (shared's fuller shape wins over web's status-only one — see §4 drift). **Invalid JSON on a 2xx** → throws naming the parse error, body text still in the message (shared's `{ cause: error }` wins). **Empty body** → `''` fails `JSON.parse`, falls into the invalid-JSON branch above rather than returning `undefined` silently. **Network refusal** (`ECONNREFUSED` etc.) → Node's `TypeError: fetch failed` propagates with `.cause` intact; NOT normalized here, because `isNativeError`-style cross-realm classification is the CALLER's job when it wants to tell "refused" from "malformed" (mirrors `fetch-probe-adapter.ts`'s own reasoning for keeping that logic outside the fetch call itself). **Timeout/abort** → `timeoutMs` (default from a statics value, mirrors `requestStatics.defaults.timeoutMs`) drives an internal `AbortController`; an aborted request rejects with `DOMException('AbortError')`, not normalized to `false` — that "not ready yet" reading is `fetchProbe`'s job below, not this general-purpose function's. |
| `fetchOk({ url, timeoutMs }): Promise<boolean>` | replaces `fetchProbeAdapter` verbatim — a 2xx reads ready, everything else (redirects landed on a 4xx/5xx, refusal, timeout) reads "not ready" and resolves `false`, EXCEPT a rejection that is neither `AbortError` nor `ECONNREFUSED`-shaped, which still throws | Preserves the existing adapter's precise `isNativeError` cross-realm check (needed because Jest's vm sandbox makes `instanceof Error` lie about a real `TypeError: fetch failed`) — this is exactly the kind of "guard a known problem" logic the direction says belongs in the gateway, so it moves in unchanged rather than being deleted as "our own logic." |

**Two names, deliberately.** `fetchJson` throws on anything unready; `fetchOk` never throws for the
three "still booting" shapes a poll loop expects. Collapsing them back into one function is what the
9-package `readFile`-style drift already shows the cost of: a caller that wants "throw on bad JSON"
and a caller that wants "poll until ready" would fight over one function's contract again.

### `@dungeonmaster/browser/fetch`

Replaces: `web/src/adapters/fetch/get/fetch-get-adapter.ts`; the 5 raw `globalThis.fetch` calls in web.

| Export | Signature | Sad paths |
|---|---|---|
| `fetchJson<T>({ url, method?, headers?, body? }): Promise<T>` | same call shape as the Node version, deliberately, so a shared caller (if `shared` ever needs one from a browser-run context) reads identically — but the BODY differs, per §"Fetch, twice" | **Non-2xx** → throws `Error` naming url + status only (web's shape wins — see §4). No status text/body captured today; kept as-is rather than silently upgrading web's error richness inside this pass, since a richer error is new behaviour, not a guard. **Invalid JSON** → today's web adapter does not catch this at all (`response.json()` rejects raw); the curated version keeps that — `response.json()`'s own `SyntaxError` propagates un-wrapped, which is a real sad-path hole (§5) callers should decide whether to close. **CORS/opaque response** → `response.ok` is `false` for a browser-blocked response same as any other non-2xx; no special-casing, since `fetch` gives no way to distinguish CORS failure from a real 4xx/5xx from inside a promise resolution (browsers surface CORS as a rejected promise with no detail, which propagates as-is). **Relative URL** → resolved against the page, which is what every web caller wants (server API calls use `/api/...`) — this is the browser/Node platform difference itself, not a bug to paper over. |

**Fetch, twice — how the two differ** (mirrors the brief's own table):

| | `@dungeonmaster/node/fetch` | `@dungeonmaster/browser/fetch` |
|---|---|---|
| Network failure shape | `TypeError: fetch failed`, real cause in `.cause`, built OUTSIDE Jest's vm sandbox (`instanceof Error` lies in tests) | `TypeError: Failed to fetch`, no further detail |
| Relative URL | refused — needs a full URL | resolved against the page's own origin |
| CORS / cookies / restricted headers | not applied | applied |
| Timeout mechanism | internal `AbortController` + `setTimeout`, always | not added by the gateway — no Node-side caller needs it; a browser caller that wants one composes its own `AbortController` and passes `signal` (not yet a parameter — first caller that needs it adds it) |
| Non-2xx error richness | status + statusText + body text | status only (today's behaviour, kept) |

### `@dungeonmaster/browser/localStorage`

Replaces: the raw `localStorage.getItem/setItem/removeItem/length/key` calls in
`comment-queue-state.ts` and `chat-input-widget.tsx` — **there is no adapter today**; every caller
touches the global directly.

| Export | Signature | Sad paths |
|---|---|---|
| `readItem(key: string): string \| null` | plain `localStorage.getItem` | **Storage disabled** (private browsing that blocks reads, a locked-down embedded webview) — `getItem` itself rarely throws, but a wrapper that also tried `JSON.parse` would; this export does NOT parse, so parsing/degrading-to-`[]` stays the caller's job (as `comment-queue-state.ts` already does). No behaviour change from today. |
| `writeItem(key: string, value: string): { success: boolean }` | never throws | **Quota exceeded** (`QuotaExceededError`, ~5MB shared across the whole origin) and **storage disabled for writes** (private browsing that allows reads but rejects writes) both caught and folded into `{ success: false }` — this is new: today `comment-queue-state.ts`'s own `write()` already catches and logs via `console.error`, but the raw call sites in `chat-input-widget.tsx` (`localStorage.setItem(dispatchedKey, 'true')`, `localStorage.setItem(scopedKey, text)`) do **not** catch anything — a full-quota browser today throws out of the composer's keystroke handler. Folding the try/catch into the gateway wrapper closes that hole for every caller at once, which is exactly requirement #4 in the design doc ("once code around a package needs care, every use of that package goes through the careful version"). |
| `removeItem(key: string): { success: boolean }` | same catch shape as `writeItem` | Removal essentially never throws in practice, but kept symmetrical with `writeItem` rather than asserted safe. |
| `keys(): string[]` | replaces the `for (i = 0; i < localStorage.length; i++) localStorage.key(i)` loop in `comment-queue-state.ts` | Storage disabled → empty array rather than a loop that reads `length` as `0` naturally (no real new behaviour, just removes the hand-rolled loop). |

### `@dungeonmaster/browser/WebSocket`

Replaces: `websocket-connect-adapter.ts` (web) verbatim — the existing adapter's shape is already the
right curated design (JSON-parse the incoming message, no-op the parse failure so one bad frame
doesn't tear down the connection, close/send guarded by `readyState`).

| Export | Signature | Sad paths |
|---|---|---|
| `connect({ url, onMessage, onOpen?, onClose? }): { close(): void; send(data): boolean }` | unchanged from today | **Malformed JSON on `message`** → silently ignored (today's behaviour — a comment says so, but nothing logs it; kept as-is, noted as a sad-path hole in §5 since a silently dropped server frame is invisible in production). **Socket closes** → `onClose` fires; reconnection is explicitly the CALLER's job (a state module elsewhere schedules a fresh `connect()`), not this wrapper's — correct separation, kept. **Socket errors** (`onerror`) → **not wired at all today** — `websocket-connect-adapter.ts` sets `onopen`/`onmessage`/`onclose` but never `onerror`; a connection failure surfaces only as a `close` event with no error detail. This is a real sad-path hole (§5): the curated version should accept an optional `onError` the same shape as `onOpen`/`onClose`, since a caller currently has no way to log why a socket died. **`send()` while not OPEN** → returns `false` rather than throwing or queuing, unchanged. |

### `@dungeonmaster/browser/indexedDB`

Replaces: `indexed-db-draft-images-read-adapter.ts` / `-replace-adapter.ts` (web) — the most
elaborate curated module in this scope; the existing adapter already does real self-healing that
must move in as behaviour, not be re-derived.

| Export | Signature | Sad paths |
|---|---|---|
| `openStore({ name, version, storeName }): Promise<IDBDatabase>` | opens (creating the store on `onupgradeneeded`), and SELF-HEALS two real corruption shapes | **Version mismatch** (an earlier heal bumped the on-disk version past the app's static `version`) → falls back to a version-less open rather than throwing `VersionError` forever. **Store missing at the expected version** (deleted by hand, or a decoy DB) → reopens one version ahead to force `onupgradeneeded` to run again and recreate the store — IndexedDB only runs that hook on a version increase, so a same-version open can never heal this on its own. **Open refused outright** (blocked by another tab holding an old version, disabled storage) → rejects with the real `DOMException` message. |
| `getAll(db, storeName): Promise<unknown[]>` | plain transaction read | **Read transaction error** → rejects with the real error message; caller (today's `pastedImageDraftContract.safeParse` per record) decides what a bad record means. |
| `put(db, storeName, value): Promise<IDBValidKey>` / `delete(db, storeName, key): Promise<void>` | plain transaction writes | **Write transaction error** (quota, another tab's exclusive transaction) → rejects; today's replace-adapter has its own logic here worth checking when that file is moved — not read in this pass since it is the sibling of the read-adapter above and shares its shape. |

The per-scope legacy-record migration (`migrateLegacyRecordsLayerAdapter`) and the scope-matching
guard (`isComposerScopeMatchGuard`) are OUR logic over the gateway, not IndexedDB-shaped guarding —
they move to a web broker that calls `openStore`/`getAll`/`put`, per the direction's rule that the
gateway holds no logic written against our own contracts.

## 3. Fetch, twice — see the curated tables above (§2) for both signatures; this section is the
one-paragraph summary the brief asks for. `@dungeonmaster/node/fetch` and `@dungeonmaster/browser/fetch`
are NOT the same function re-exported twice: Node's version normalizes a cross-realm `TypeError:
fetch failed` and adds its own timeout via `AbortController`+`setTimeout` (because every Node caller
found wants one); the browser version adds neither, because the platform's own timeout primitive
differs and no web caller in this scan uses one. Both keep today's status-only vs. status+body error
richness split rather than unifying it, since unifying is new behaviour outside this pass's mandate.

## 4. Mapping table — existing adapter → gateway function

| Existing adapter | Package | Replaced by |
|---|---|---|
| `path-join-adapter.ts` / `path-dirname-adapter.ts` / `path-resolve-adapter.ts` / `path-basename-adapter.ts` | config, eslint-plugin, hooks, mcp, shared | direct `import { join, dirname, resolve, basename } from '@dungeonmaster/node/path'` — deleted, not wrapped |
| `os-homedir-adapter.ts` | shared | `homedir` from `@dungeonmaster/node/os`, with the `DUNGEONMASTER_HOME` override moved into the broker that calls it |
| `os-user-homedir-adapter.ts` | shared | `homedir` from `@dungeonmaster/node/os` directly (adapter added nothing) |
| `os-info-adapter.ts` | siegelense | `cpus`/`freemem`/`loadavg`/`totalmem` from `@dungeonmaster/node/os`; MB conversion stays a siegelense broker |
| `os-tmpdir-adapter.ts` | siegelense, ward | `tmpdir` from `@dungeonmaster/node/os` directly |
| `crypto-random-uuid-adapter.ts` | cli | `randomUUID` from `@dungeonmaster/node/crypto` |
| `crypto-hash-adapter.ts` | siegelense | `createHash` from `@dungeonmaster/node/crypto` |
| `crypto-hash-files-adapter.ts` | ward | broker calling `createHash` (`@dungeonmaster/node/crypto`) + the fs gateway's read function |
| `error-is-native-error-adapter.ts` | siegelense | `isNativeError` from `@dungeonmaster/node/util/types` |
| `net-check-port-free-adapter.ts` | orchestrator | `isPortFree` from `@dungeonmaster/node/net` |
| `net-free-port-pair-adapter.ts` | shared | `freePortPair` from `@dungeonmaster/node/net` |
| `net-unix-request-adapter.ts` | siegelense | `unixSocketRequest` from `@dungeonmaster/node/net`, contract parsing moved to caller |
| `net-unix-serve-adapter.ts` | siegelense | `unixSocketServe` from `@dungeonmaster/node/net`, contract parsing moved to caller |
| `readline-question-adapter.ts` | cli | `question` from `@dungeonmaster/node/readline` |
| `readline-create-interface-adapter.ts` | orchestrator | `lineReader` from `@dungeonmaster/node/readline` |
| `process-stdin-read-adapter.ts` | cli | `readStdinToEnd` from `@dungeonmaster/node/process` |
| `process-cwd-adapter.ts` | shared | `cwd` from `@dungeonmaster/node/process` |
| `process-signal-adapter.ts` | orchestrator | `kill` from `@dungeonmaster/node/process`, try/catch kept at the caller (probe-vs-signal semantics differ per caller, see §5) |
| `proc-check-alive-adapter.ts` | orchestrator | `kill` from `@dungeonmaster/node/process`, same note |
| `process-is-alive-adapter.ts` / `process-kill-group-adapter.ts` | siegelense | `kill` from `@dungeonmaster/node/process` + `isNativeError` from `@dungeonmaster/node/util/types`; the ESRCH/EPERM classification is OUR logic and stays a siegelense broker |
| `process-dev-log-adapter.ts` | server | `stdout` (raw) + `getEnv('VERBOSE')` from `@dungeonmaster/node/process`; the `[dev]` prefix/gating stays a server broker |
| `shared-package-resolve-adapter.ts` | mcp | `resolvePackageRoot('@dungeonmaster/shared/contracts')` — a new curated helper in `@dungeonmaster/node/module` wrapping `require.resolve` + `dirname`, since this is genuinely "locate an installed package," the same job `@dungeonmaster/bin` does for `git`/`claude` |
| `web-bundle-dist-path-adapter.ts` | server | same `resolvePackageRoot` helper + `existsSync` (fs gateway, not ours) |
| `cli-package-bin-resolve-adapter.ts` / `package-root-find-layer-adapter.ts` | siegelense | same `resolvePackageRoot` helper + fs gateway calls |
| `fetch-http-request-adapter.ts` | siegelense | `fetchJson` from `@dungeonmaster/node/fetch` |
| `fetch-probe-adapter.ts` | siegelense | `fetchOk` from `@dungeonmaster/node/fetch` |
| `shared/adapters/fetch/get/fetch-get-adapter.ts` | shared | `fetchJson` from `@dungeonmaster/node/fetch` |
| `web/adapters/fetch/get/fetch-get-adapter.ts` | web | `fetchJson` from `@dungeonmaster/browser/fetch` |
| `websocket-connect-adapter.ts` | web | `connect` from `@dungeonmaster/browser/WebSocket` |
| `clipboard-write-adapter.ts` | web | `navigator` pass-through, wrapper logic (none) dropped |
| `canvas-image-measure-adapter.ts` / `canvas-image-rescale-adapter.ts` | web | `atob`, `Blob`, `createImageBitmap`, `document` pass-throughs; the base64→bytes loop and the downscale-target math stay web transformers, unchanged |
| `dom-composer-write-adapter.ts` | web | `document` pass-through; segment-building logic stays a web broker |
| `file-read-data-url-adapter.ts` | web | `FileReader` pass-through; the promise-wrapping stays a web broker |
| `indexed-db-draft-images-read-adapter.ts` / `-replace-adapter.ts` | web | `openStore`/`getAll`/`put`/`delete` from `@dungeonmaster/browser/indexedDB`; migration + scope-matching stay web brokers |
| `xhr-post-with-progress-adapter.ts` | web | `XMLHttpRequest` pass-through; the event-wiring/promise logic stays a web broker |
| localStorage raw calls in `comment-queue-state.ts`, `chat-input-widget.tsx` | web | `readItem`/`writeItem`/`removeItem`/`keys` from `@dungeonmaster/browser/localStorage` |
| raw `process.stdout`/`process.stderr` writes (~250 call sites, every package) | all | `stdout`/`stderr` from `@dungeonmaster/node/process` (mechanical import swap, no behaviour change) |
| raw `process.env.X` reads (~35 call sites) | all | `getEnv('X')` from `@dungeonmaster/node/process` |
| raw `crypto.randomUUID()` (Node-side: orchestrator, hydration-recipes) | orchestrator, hydration-recipes | `randomUUID` from `@dungeonmaster/node/crypto` |
| raw `crypto.randomUUID()` (browser-side: web) | web | `randomUUID` from `@dungeonmaster/browser/crypto` |
| raw `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval` (Node packages) | mcp, orchestrator, server, shared, siegelense | same-named exports from `@dungeonmaster/node/*` |
| raw `setTimeout`/`clearTimeout` (web) | web | same-named exports from `@dungeonmaster/browser/*` |

## 5. Sad-path holes found today

| Hole | Evidence |
|---|---|
| `websocket-connect-adapter.ts` never wires `socket.onerror` — a connection failure is indistinguishable from a clean close. | `packages/web/src/adapters/websocket/connect/websocket-connect-adapter.ts:28-47` — `onopen`/`onmessage`/`onclose` are set; no `onerror` anywhere in the file. |
| `websocket-connect-adapter.ts` silently drops a malformed incoming frame with no log. | `packages/web/src/adapters/websocket/connect/websocket-connect-adapter.ts:38` — `catch { // Malformed JSON is silently ignored }`. |
| `chat-input-widget.tsx`'s raw `localStorage.setItem` calls have no try/catch — a full quota (private browsing, ~5MB shared origin cap) throws out of a keystroke handler. | `packages/web/src/widgets/chat-input/chat-input-widget.tsx:149,158,173,175` — four bare calls; contrast with `comment-queue-state.ts:54-69`, which already catches the identical failure. |
| `fs-watch-tail-adapter.ts`'s readline `rl.on('line', onLine)` handler catches a throwing `onLine`, but nothing anywhere catches a `readline` interface's own `'error'` from a torn stream mid-tail beyond logging via `onError` — the NEW `@dungeonmaster/node/readline` `lineReader` closes this by exposing `onError` as a parameter, which the current bare adapter (`readline-create-interface-adapter.ts`) does not have at all. | `packages/orchestrator/src/adapters/readline/create-interface/readline-create-interface-adapter.ts:19-36` — no error handler wired on the returned interface. |
| Node's global `new URL(...)`/`new URLSearchParams(...)` calls (6 + 1 sites) have no surrounding try/catch anywhere found — a malformed URL throws `TypeError [ERR_INVALID_URL]` uncaught. | `tmp/adapters-fresh/global-sites.json` → `URL` / `URLSearchParams` entries; none paired with a `try` in the surrounding function in the packages checked (`server`, `web`). |
| `web/adapters/fetch/get/fetch-get-adapter.ts` does not catch `response.json()`'s own parse failure — an invalid-JSON 2xx throws an unwrapped `SyntaxError` with no url/status context. | `packages/web/src/adapters/fetch/get/fetch-get-adapter.ts:21` — bare `return (await response.json())`. |
| `canvas-image-measure-adapter.ts` / `canvas-image-rescale-adapter.ts` never catch `createImageBitmap`'s rejection on a non-image blob, or `atob`'s `InvalidCharacterError` on malformed base64. | `packages/web/src/adapters/canvas/image-measure/canvas-image-measure-adapter.ts:26,34` and the rescale sibling at the same lines — no try/catch in either file. |
| `clipboard-write-adapter.ts` never catches `navigator.clipboard.writeText`'s rejection (unfocused page, denied permission). | `packages/web/src/adapters/clipboard/write/clipboard-write-adapter.ts:12` — bare `await`. |

## 6. Not gateway candidates (found while scanning, excluded deliberately)

`playwright-session-adapter.ts`, `storage-read-layer-adapter.ts` and `paste-layer-adapter.ts`
(siegelense) reference `window.localStorage`/`window.sessionStorage`/`atob`/`Blob`/`ClipboardItem`
inside `page.evaluate(...)` closures — source text Playwright serializes to run **inside the remote
browser it drives**, not in siegelense's own Node process (`packages/siegelense/src/adapters/playwright/session/storage-read-layer-adapter.ts:24-39`,
`packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts:543-549`). The
typed-global lint rule will syntactically flag these (TS sees `window.localStorage` used in a `.ts`
file) but there is nothing for a gateway import to reach — the closure runs in a different runtime
entirely. This needs a lint carve-out (an escape for code inside a `page.evaluate` callback), not a
gateway wrapper; flagged for whoever builds the lint rule.

`net.Socket.write` shows up in `adapters.json`'s `outside` field for several files
(`playwright-session-adapter.ts`, `paste-layer-adapter.ts`, `child-process-spawn-stream-json-adapter.ts`,
`fs-watch-tail-adapter.ts`, `process-dev-log-adapter.ts`) — this is the TypeScript checker resolving
`process.stdout.write`/`process.stderr.write` to the `net.Socket.write` member Node's own type
declarations merge onto `process.stdout`'s type, not a real `net.Socket` object anyone constructed.
All of these route through `@dungeonmaster/node/process`'s `stdout`/`stderr`, not `@dungeonmaster/node/net`.

## Summary (for the report)

Ten Node subpaths (`path`, `os`, `crypto`, `util/types`, `url`, `events`, `module`, `net`, `readline`,
`fetch`) plus a `process` global module and four bare-name timer subpaths; eleven Browser subpaths
(`fetch`, `localStorage`, `sessionStorage`, `WebSocket`, `indexedDB`, `console`, `crypto`, `atob`,
`Blob`/`createImageBitmap`, `document`, `navigator`, `XMLHttpRequest`, `FileReader`) plus four
single-digit-use globals. Five modules are curated with real guard logic: Node `net`, Node
`readline`, Node `fetch`, Browser `fetch`, Browser `localStorage`, Browser `WebSocket`, Browser
`indexedDB` — the rest are pass-throughs because every adapter found over them does only one outside
call or wraps app logic that belongs in a broker, not a platform guard. `fetchGetAdapter` in web and
shared is the confirmed drift the brief named: same name, status-only vs. status+body+cause error
richness, kept as designed rather than unified. Seven sad-path holes found and none invented: two on
WebSocket, two on localStorage/URL, one on readline, one on browser fetch's JSON parse, two on the
canvas/clipboard browser adapters. Three siegelense files reference browser globals that actually run
inside a Playwright-driven remote page, not in siegelense's own process — excluded from the gateway
and flagged for lint instead.
