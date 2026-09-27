# Inventory: `@dungeonmaster/node` and `@dungeonmaster/browser`

Scope: every Node module or global and every browser global outside `fs`, `fs/promises`, and
`child_process`, which have their own inventories. `@dungeonmaster/node` and `@dungeonmaster/browser` are
built, in `packages/@gateway/node/src/*/` and `packages/@gateway/browser/src/*/`. What follows is what a
caller migrating onto them still needs: which subpaths carry real guard logic, how two old copies of a
function differed, and which sad-path holes are still open.

## 1. Subpaths

Every subpath this inventory named is built. Most are plain pass-throughs — `export * from '<module>'` for a
Node module, or `export const { name } = globalThis` for a global — because no adapter over them ever did
more than one outside call. Seven carry real guard logic instead, covered in section 2: `node/net`,
`node/readline`, `node/fetch`, `browser/fetch`, `browser/localStorage`, `browser/WebSocket`, and
`browser/indexedDB`.

Two routing facts are not obvious from a folder name:

- `require`, `require.resolve`, `__dirname`, and `__filename` stay direct CommonJS-per-file locals. They are
  exempt from the platform-globals rule and never move behind a gateway subpath.
- Global types (`HTMLDivElement`, `IDBDatabase`, `NodeJS`, and the rest) are exempt too. A type never runs,
  so it stays usable directly wherever it is today.

## 2. Curated modules

Seven subpaths carry real guard logic, each built with its own PURPOSE comment naming its signature and its
sad-path behavior, so this inventory does not repeat it file by file:

- `node/net` — `isPortFree`, `freePortPair`, `unixSocketRequest`, `unixSocketServe`, in
  `packages/@gateway/node/src/net/`.
- `node/readline` — `question` and `lineReader`, in `packages/@gateway/node/src/readline/`. Kept as two
  exports, not one: one is interactive (question/answer), the other taps a stream line by line, and no
  caller found needs both at once.
- `node/fetch` and `browser/fetch` — `fetchJson`, `fetchOk` (Node only), and `fetchWithStatus`, in
  `packages/@gateway/node/src/fetch/` and `packages/@gateway/browser/src/fetch/`. These are two different
  functions sharing a name, not one function re-exported twice — section 3 has why.
- `browser/localStorage` — `readItem`, `writeItem`, `removeItem`, `keys`, in
  `packages/@gateway/browser/src/localStorage/`.
- `browser/WebSocket` — `connect`, in `packages/@gateway/browser/src/WebSocket/`.
- `browser/indexedDB` — `openStore`, `getAll`, `put`, `deleteRecord`, in
  `packages/@gateway/browser/src/indexedDB/`.

`node/module` is a pass-through with two curated exceptions, both in `packages/@gateway/node/src/module/`:
`resolvePackageRoot` (locates an installed package's root directory from a bare `require.resolve`, walking up
to the nearest `package.json`) and `dynamicImport` (wraps the native `import()` expression, so every dynamic
load goes through one mockable seam). Neither existed as a real export before the gateway — the closest prior
art, mcp's `shared-package-resolve-adapter.ts`, called `require.resolve` and `dirname` directly.

## 3. Fetch, twice

`@dungeonmaster/node/fetch` and `@dungeonmaster/browser/fetch` are not the same function exported from two
places. Node's `fetchJson` normalizes a cross-realm `TypeError: fetch failed` and always applies an internal
timeout via `AbortController`. The browser's `fetchJson` does neither: no web caller found needs a timeout,
and the browser has its own cross-realm story. Both keep their platform's existing error richness
(status+body+cause on Node, status-only in the browser) rather than unifying it. Each file's own PURPOSE
comment names what differs for its platform.

## 4. Mapping: existing call site → gateway replacement

`scrolls/gateway-build/coverage.md` has the current per-adapter mapping for every call site here — `os`,
`crypto`, `util/types`, `net`, `readline`, `process`, `fetch`, and every browser global. Two facts about call
sites that are not adapters do not appear there, since coverage.md tracks only files under `adapters/`:

- `chat-input-widget.tsx`'s four raw `localStorage.setItem` calls (lines 149, 158, 173, 175) have no
  try/catch today. A full quota throws out of a keystroke handler. `comment-queue-state.ts` already catches
  the identical failure at its own call sites. Both files move onto `readItem`/`writeItem`/`removeItem`/
  `keys` from `@dungeonmaster/browser/localStorage`, none of which throws.
- Node-side `crypto.randomUUID()` calls in orchestrator and hydration-recipes route to
  `@dungeonmaster/node/crypto`, not `@dungeonmaster/browser/crypto` — orchestrator runs as Node, never in a
  browser, even though the call looks identical to web's.

## 5. Sad-path holes

Every hole this inventory found in a curated subpath is fixed in the built wrapper. `browser/WebSocket`'s
`connect` wires `onerror`, where the raw global left a connection failure indistinguishable from a clean
close. `node/readline`'s `lineReader` takes an `onError` callback the raw interface has none for. Browser
`fetchJson` wraps a bad JSON body in a real `Error` instead of leaking `response.json()`'s own `SyntaxError`.
Each file's own PURPOSE comment names the hole it closes.

What is left open belongs to a subpath that is a plain pass-through by design, so it carries no guard logic
for anyone: a malformed base64 string throws an uncaught `DOMException` through `atob`; a non-image blob
rejects uncaught through `createImageBitmap`; an unfocused page or a denied permission rejects uncaught
through `navigator.clipboard.writeText`; a malformed URL throws an uncaught `TypeError [ERR_INVALID_URL]`
through `URL`/`URLSearchParams`. Nobody has decided whether any of these should become a curated wrapper.

## 6. Not gateway candidates

`packages/siegelense/src/adapters/playwright/session/playwright-session-adapter.ts`,
`storage-read-layer-adapter.ts`, and `paste-layer-adapter.ts` reference `window.localStorage`,
`window.sessionStorage`, `atob`, `Blob`, and `ClipboardItem` inside `page.evaluate(...)` closures — source
text Playwright serializes to run inside the remote browser it drives, not in siegelense's own Node process.
A typed-global lint rule sees `window.localStorage` in a `.ts` file and flags it, but there is nothing for a
gateway import to reach, since the closure runs in a different runtime entirely. This needs a lint carve-out,
not a gateway wrapper — `scrolls/gateway/followup-sustainability.md` item 29 names the same gap for
`platform-globals-ban`.

`net.Socket.write` shows up as an "outside call" for several files (`playwright-session-adapter.ts`,
`paste-layer-adapter.ts`, `child-process-spawn-stream-json-adapter.ts`, `fs-watch-tail-adapter.ts`,
`process-dev-log-adapter.ts`). This is TypeScript resolving `process.stdout.write`/`process.stderr.write` to
the `net.Socket.write` member Node's own type declarations merge onto `process.stdout`'s type, not a real
`net.Socket` object anyone constructed. All of these route through `@dungeonmaster/node/process`'s
`stdout`/`stderr`, not `@dungeonmaster/node/net`.
