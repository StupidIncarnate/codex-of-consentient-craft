# A17: Adapters: `web`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` web rows; `scrolls/brands-types-tests-rules.md` D1 (2035-2054), T1-T3, R1; `scrolls/adapters-to-one-place.md` "The one job adapters should do happens at the callers" |
| Needs | [G05](g05-error-classes-in-error-files.md), [G13](g13-mantine-render-to-testing.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md), [T10](t10-jsx-only-in-widgets-and-flows.md) |
| Packages touched | web |
| Checks to run | lint, typecheck, unit, e2e |
| Split | operator splits, 2 to 4 files per agent (batches below); the xyflow batch runs together, since all four files compose one diagram |
| Runs alone | no other agent editing `web` at the same time |

## Current state

Census of `packages/web/src/adapters/**` run 2026-09-26: 38 files, none dead, all fated in `coverage.md`.

**Canvas / DOM / file (8 files) — `split`, browser-global calls move, our logic stays:**

| Path | Replacement |
|---|---|
| `canvas/image-measure/canvas-image-measure-adapter.ts` | split → `@dungeonmaster/browser/atob`, `/Blob`, `/createImageBitmap`, `/document`; the base64→bytes loop and the downscale-target math stay a web transformer/broker |
| `canvas/image-rescale/canvas-image-rescale-adapter.ts` | split → same shape |
| `dom/composer-delete-thumbnail/dom-composer-delete-thumbnail-adapter.ts` | split → `@dungeonmaster/browser/document`; segment-deletion logic stays |
| `dom/composer-insert-image/dom-composer-insert-image-adapter.ts` | split → `@dungeonmaster/browser/document`; `ComposerAttachment` contract + `chatComposerStatics` logic stays |
| `dom/composer-insert-text/dom-composer-insert-text-adapter.ts` | split → `@dungeonmaster/browser/document`; `composerCaretFillerElementTransformer` logic stays |
| `dom/composer-read/dom-composer-read-adapter.ts` | split → `@dungeonmaster/browser/document`; `composerSegmentContract` + `chatComposerStatics` logic stays |
| `dom/composer-write/dom-composer-write-adapter.ts` | split → `@dungeonmaster/browser/document`; segment-building logic stays |
| `file/read-data-url/file-read-data-url-adapter.ts` | split → `@dungeonmaster/browser/FileReader`; promise-wrapping logic stays |

**Fetch (5 files) — all `gateway`, straight `fetchJson`/`fetchWithStatus` swaps:**

`fetch/delete` → `fetchJson` (throws on non-ok; the `{error}` body-message drift against other packages' copies is
NOT reconciled by this swap — leave it); `fetch/get` → `fetchJson`; `fetch/patch` → `fetchJson`; `fetch/post` →
`fetchJson`; `fetch/post-with-status` → `fetchWithStatus`.

**IndexedDB (3 files) — `split`:**

| Path | Replacement |
|---|---|
| `indexed-db/draft-images-read/indexed-db-draft-images-read-adapter.ts` | split → `@dungeonmaster/browser/indexedDB` `openStore`, `getAll`; per-record `safeParse` stays |
| `indexed-db/draft-images-read/migrate-legacy-records-layer-adapter.ts` | split → `@dungeonmaster/browser/indexedDB`; the migration and `isComposerScopeMatchGuard` logic stays |
| `indexed-db/draft-images-replace/indexed-db-draft-images-replace-adapter.ts` | split → `@dungeonmaster/browser/indexedDB` `put`, `deleteRecord` |

**Misc singles (7 files):**

| Path | Replacement |
|---|---|
| `clipboard/write/clipboard-write-adapter.ts` | gateway → `@dungeonmaster/browser/navigator` — the wrapper adds nothing over the raw `navigator.clipboard.writeText` call |
| `elk/layout/elk-layout-adapter.ts` | split → `@dungeonmaster/npm/elkjs`; the node-sizing math, `FlowNode`/`FlowEdge` contract parsing and portal handling stay. `elkjs` is mocked in jest via `moduleNameMapper` (`^elkjs$` → `__mocks__/elkjs-mock.cjs`, per `web/CLAUDE.md`'s own React Flow section) — keep that mapper working for BOTH the bare specifier and `#gateway/npm/elkjs` once the import source changes |
| `react-dom/mount/react-dom-mount-adapter.ts` | split → `@dungeonmaster/npm/react-dom/client` `createRoot` + `@dungeonmaster/browser/document`; the `AdapterResult`/`Wrapper` shape stays |
| `websocket/connect/websocket-connect-adapter.ts` | gateway → `@dungeonmaster/browser/WebSocket` `connect`; the JSON-parse + readyState guards are promoted as-is; the `onerror` wiring is a known sad-path hole — do not silently fix it, report it if you touch it |
| `xhr/post-with-progress/xhr-post-with-progress-adapter.ts` | split → `@dungeonmaster/browser/XMLHttpRequest`; the progress-event wiring and one-settled-promise logic stay |
| `mantine/notifications-show/mantine-notifications-show-adapter.ts` | gateway → `@dungeonmaster/npm/@mantine/notifications` |
| `mantine/notifications/mantine-notifications-adapter.ts` | gateway → `@dungeonmaster/npm/@mantine/notifications` — flagged: the scan that fed `coverage.md` said "no outside call", but line 10 imports `Notifications` directly; this file DOES touch npm |

**`mantine/render/mantine-render-adapter.ts` moves out of `web` entirely.** [G13](g13-mantine-render-to-testing.md)
writes the Mantine-wrapped `render` in `@dungeonmaster/testing`, calling the raw `render` from
`#gateway/npm/testing-library__react`. This item's job is the OTHER half: once G13 has landed, delete
`web`'s own copy and switch every `web` test that imports it to `@dungeonmaster/testing`'s wrapped `render`
instead. Confirm G13 has actually landed before doing this — if `@dungeonmaster/testing` has no wrapped `render`
yet, report LEFT STANDING rather than duplicating G13's work here.

**rxjs (6 files) — all `gateway`, one function each:** `rxjs/filter`, `rxjs/merge`, `rxjs/of`, `rxjs/subject`,
`rxjs/take`, `rxjs/timeout` — each re-exports one rxjs call from `@dungeonmaster/npm/rxjs` or
`@dungeonmaster/npm/rxjs/operators`.

**testing-library (4 files) — no production user, per D1:**

`testing-library/act-async`, `testing-library/act`, `testing-library/render-hook`, `testing-library/wait-for` —
each wraps one `@testing-library/react` export (`act`, `act`, `renderHook`, `waitFor`). D1's own words (brands doc,
2050-2051): "in web, 26 of 38 adapter proxies are empty, because the 'adapters' there are components and test
helpers, not outside calls." Confirmed 2026-09-26: none of these four has a real production caller — every
importer is a `.test.ts`/`.test.tsx` file. **Recommended — the executing agent may change this with a reason in
DECISIONS:** delete all four outright and switch every test file that imports them to import the matching
`@testing-library/react` export directly from `#gateway/npm/testing-library__react` — there is no wrapper
behaviour to preserve (each is a bare re-export), so there is nothing to keep as a broker or transformer.

**xyflow (4 files) — React components misfiled as adapters, per D1's own worked example:**

| Path | Fate |
|---|---|
| `xyflow/react-flow/xyflow-react-flow-adapter.ts` | D1's own named example → `widgets/react-flow/react-flow-widget.tsx`, importing `#gateway/npm/@xyflow/react` |
| `xyflow/edge/xyflow-edge-adapter.ts` | **not named by D1, but confirmed 2026-09-26 to be the same shape**: it returns `React.ReactElement`, built entirely from `React.createElement` calls (`BaseEdge`, `EdgeLabelRenderer`) — a real custom React Flow edge component, registered as an `edgeTypes` entry. This is a widget, not an adapter |
| `xyflow/node-handles/xyflow-node-handles-adapter.ts` | **not named by D1, but confirmed the same shape**: returns `React.JSX.Element`, renders `Handle` components — a real React component |
| `xyflow/react-flow/node-measure-layer-adapter.ts` | **not named by D1, but confirmed the same shape**: returns `React.JSX.Element | null`, calls `useNodesInitialized`/`useUpdateNodeInternals` — a React component (renders nothing, used purely for its effect) |

**Recommended — the executing agent may change this with a reason in DECISIONS:** move all four into
`widgets/react-flow/` (or one widget file each, following whatever `get-folder-detail({ folderType: 'widgets' })`
prescribes for naming), not just the one D1 names. `coverage.md`'s own fate label for all four is "gateway...
'stays whole, not split' — no separable wrapper, only the import source changes", which is consistent with them
being pure components: there is no outside-call/our-logic line to draw, because the ENTIRE file is a React
component calling `@xyflow/react`. Reason: D1's rule is "JSX appears only in `widgets/` and `flows/`" — a rule
about the FILE'S CONTENT (does it return JSX), not about which of the four files someone happened to write first as
the example.

## Work

1. For every `split`/`gateway` non-React row: switch every caller to the named export, imported from its
   `#gateway/<kind>/<subpath>` path; keep the our-logic half as a broker or transformer.
2. For the four `testing-library/*` rows: delete outright per the recommendation above, updating every test file
   that imported them.
3. For the four `xyflow/*` rows: move each into `widgets/`, updating its own import from `@xyflow/react` to
   `#gateway/npm/@xyflow/react` and updating every caller (the diagram widget that registers them as
   `edgeTypes`/`nodeTypes`/children).
4. For `mantine-render-adapter.ts`: delete it once [G13](g13-mantine-render-to-testing.md) has landed, switching
   every test importer to `@dungeonmaster/testing`'s wrapped `render`.
5. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/browser/fetch/fetch-json/fetch-json.proxy`), never through a barrel, per T1/T3.
6. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
7. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught. Run the diagram's own e2e spec
   (`flows/quest-chat/flow-diagram-interaction.e2e.ts`) after the xyflow batch — the six React Flow sizing gotchas
   `packages/web/CLAUDE.md` documents are real-browser-only and a jsdom unit test cannot catch a regression in them.

## Done when

- None of the 38 adapter files remain, and `packages/web/src/adapters/` is gone.
- All four `xyflow/*` files (and `mantine/render`, once G13 lands) live under `widgets/`, not `adapters/`.
- All four `testing-library/*` files are gone, with no replacement file (test files import the gateway directly).
- `npm run ward -- --only lint,typecheck,unit,e2e -- packages/web` exits 0.

## Traps

- The `elkjs` Jest mock (`moduleNameMapper`) must map BOTH the bare `elkjs` specifier and whatever new
  `#gateway/npm/elkjs` specifier callers use after this migration — check `packages/web/jest.config.cjs` covers
  both, per the brands doc's own note on this exact file.
- `web/CLAUDE.md`'s six React Flow sizing gotchas are ALL real-browser-only; do not trust a green unit-test run
  alone for the xyflow batch — run the e2e spec.
- Confirm [G13](g13-mantine-render-to-testing.md) has landed before touching `mantine-render-adapter.ts`.
- Do not confuse `mantine-notifications-adapter.ts` (flagged: really does import npm) with
  `mantine-notifications-show-adapter.ts` (a plain gateway swap) — they are two different files with two different
  starting points.

## Concessions made while executing

Group Z-W1 (web fetch) found that `@gateway/browser`'s `fetchJsonProxy`/`fetchWithStatusProxy` cannot coexist,
in one Jest test file, with a not-yet-migrated sibling caller's `StartEndpointMock` (MSW) staging — both spy on
`globalThis.fetch` with no `passthrough` option, and `registerSpyOn` shares one handle per object+method, so
constructing either gateway proxy anywhere in a file makes it answer (or throw for) every OTHER proxy's fetch
call in that same file too. Proven with two real ward runs (`1790612452409-b669` red / `1790612713471-6efa`
green on `home-content-widget.test.tsx`; `1790612919815-e53f` red / `1790613137577-302b` green across
`app-widget`, `quest-chat-content-layer-widget`, `quest-chat-widget`), not inferred from reading code. See the
"Plan — web fetch" section's "Blocking finding" for the full trace. No file in `packages/web` changed; the
attempts were reverted back to the committed originals. Needs an operator decision: either a gateway-side fix
(`passthrough` on these two proxies) before any A17 fetch batch proceeds, or an all-at-once migration of every
web fetch adapter plus every composing widget/binding proxy in one pass wide enough that no migrated/unmigrated
pair ever shares a test file — which conflicts with the 2-to-4-file agent batch-size rule.

## Plan — web fetch

### Group Z-W1 — BLOCKED. Zero files changed; every attempt reverted after a real ward run proved a regression. See "Blocking finding" below.

An implementer attempted `fetch/delete` (`quest-delete-broker`) and, after that broke an unrelated widget's tests, `fetch/post-with-status`'s `quest-comment-batch-broker` (chosen because it looked composer-free). Both were reverted byte-for-byte back to the committed originals (`git status --porcelain -- packages/web/` is empty). `fetch/patch` and `fetch/post-with-status`'s `quest-start-broker`/`quest-human-verdict-broker` were never written, for the same reason below.

**Blocking finding, proven with two real ward runs (not a read-code guess):**

`fetchJsonProxy` and `fetchWithStatusProxy` (`packages/@gateway/browser/src/fetch/{fetch-json,fetch-with-status}/*.proxy.ts`) each do `registerSpyOn({ object: globalThis, method: 'fetch' })` with **no `passthrough` option** — confirmed by reading both files verbatim. Per `get-testing-patterns`, "Throw-on-unmatched is unconditional, EXCEPT `registerSpyOn({ passthrough: true })`." Every hand-written web fetch proxy this item is meant to replace does the opposite on purpose: `quest-delete-broker.proxy.ts`'s own header said so — "fetchSpy wraps the already-MSW-patched globalThis.fetch, so passthrough still hits the mocked endpoint" — and its spy is `registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true })`. `registerSpyOn`/`registerMock` on one object+method is ONE SHARED HANDLE across every proxy in a test file (`get-testing-patterns`: "Staging is SHARED across every proxy mocking the same function"), so constructing a gateway fetch proxy anywhere in a test file makes IT the handler for every `globalThis.fetch` call any OTHER proxy in that same file makes too — including ones still staged through `StartEndpointMock` (MSW), which relies on the real (or MSW-patched) `globalThis.fetch` running for unmatched calls. Un-passthrough-spied, those calls throw instead, and the widget under test silently renders its empty/error state.

Reproduced twice:
1. `quest-delete-broker.proxy.ts` composing `fetchJsonProxy()` (zero other change) turned `packages/web/src/widgets/home-content/home-content-widget.test.tsx` from 18/18 green to over a dozen failures — including tests with nothing to do with delete ("guild list view VALID: {guilds loaded} => shows guild items"), because `HomeContentWidgetProxy` constructs `questDeleteBrokerProxy()` unconditionally alongside `useGuildsBindingProxy()`/`useQuestsBindingProxy()`/`useSessionListBindingProxy()`/`guildCreateBrokerProxy()`, all still MSW-based. Reverting `quest-delete-broker.{ts,proxy.ts,test.ts}` and `adapters/fetch/delete/*` to the committed originals (verified via `git show HEAD:<path>`) made the same ward run pass again — run ids `1790612452409-b669` (red, migrated) then `1790612713471-6efa` (green, reverted; ran `--only unit -- packages/web/src/widgets/home-content/home-content-widget.test.tsx` alone).
2. `quest-comment-batch-broker.proxy.ts` composing `fetchWithStatusProxy()` (chosen because a literal-string `discover` grep for `questCommentBatchBrokerProxy` found no composer — the discover result actually said "— 2 matching lines" for `use-quest-chat-binding.proxy.ts` without printing them, and those 2 lines were exactly this: `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.proxy.ts:8` imports it, `:60` constructs it as `commentBatchProxy`, alongside `questChatBrokerProxy`/`questClarifyBrokerProxy`/`questFollowupBrokerProxy`/`questFollowupStopBrokerProxy` — all still fetch/XHR+MSW-based) broke `app-widget.test.tsx`, `quest-chat-content-layer-widget.test.tsx` and `quest-chat-widget.test.tsx` the same way (run id `1790612919815-e53f`, 47 errors across 4 files). Reverted the same way; run id `1790613137577-302b` (`--only unit` on all 6 touched-or-adjacent files) is green.

**Why this blocks the whole group, not just these two callers:** `useQuestChatBindingProxy` is the shared binding proxy `web/CLAUDE.md`'s "Every user-message injection goes through `useQuestChatBinding`" section describes — nearly every quest-workspace widget composes it, and it currently composes a mix of migrated-eventually and still-MSW fetch/XHR brokers together by design. `home-content-widget.proxy.tsx` does the same for the home screen. So ANY caller in this item whose proxy is composed — directly or transitively — by a widget/binding proxy that also composes a not-yet-migrated MSW-based fetch caller breaks that widget's tests the moment its own proxy calls `fetchJsonProxy()`/`fetchWithStatusProxy()`, regardless of whether the specific TEST exercises that caller (construction alone poisons the shared `globalThis.fetch` handle for the whole file). Per `EPIC.md`'s own order (Phase 2 runs "operator splits, 2 to 4 files per agent"), web's ~26 outside-call adapters cannot all move in one atomic pass small enough for the batch-size rule, so this collision is not a transient artifact of picking the wrong caller first — it recurs for every batch until fixed.

**What would clear it (not this item's package to fix — `web` only, per this run's scope):** `@gateway/browser`'s `fetchJsonProxy`/`fetchWithStatusProxy` need a `passthrough`-shaped escape hatch (matching `registerSpyOn({ passthrough: true })`, or an unmatched-call fallback to whatever `globalThis.fetch` already was) so a migrated caller's proxy can coexist, in the same test file, with a not-yet-migrated sibling's `StartEndpointMock`-based one. Until then, per this run's brief ("If the web gateway's fetch proxies cannot express what web's tests need, stop on that caller and report the exact gap"), the fetch/delete, fetch/patch and fetch/post-with-status batches stay on their existing adapters.

Two narrower findings surfaced while investigating, still true once the blocker above clears:

(a) `fetchWithStatusProxy` also has no way to stage a response that resolves only once released. `quest-human-verdict-broker.proxy.ts`'s `setupHeld(): { release: () => void }` (MSW's `endpoint.holdsOpen(...)`) needs exactly that, and it is load-bearing: `widgets/quest-summary/human-check-row-layer-widget.test.tsx`'s "VALID: {click MET, held response} => disables both controls in flight, re-enables once released" drives real UI behaviour through it. A second, independent reason `quest-human-verdict-broker` cannot move as planned.

(b) `fetchWithStatus`'s real body is ALWAYS a raw string (`{status, ok, body: string}`, per its own header: "body is the raw response text, never parsed"). The OLD `fetchPostWithStatusAdapter` JSON-parsed with a raw-text fallback before returning. `questCommentBatchBroker`, `questHumanVerdictBroker` and `questStartBroker` all `safeParse` `result.body` against an OBJECT-shaped contract, which always fails against a raw string — a second body-shape drift beyond the `{error}`-message drift the item names. Whichever agent eventually moves these callers needs the same inline try/catch `JSON.parse`-with-fallback the old adapter did centrally.

(c) `fetchJson`'s real connection-refused rejection is the RAW `ConnectionRefusedErrorStub()` result (`NodeJS.ErrnoException`, `code: 'ECONNREFUSED'`), not wrapped — confirmed against the gateway's own `fetch-json.test.ts`. `fetchWithStatus`'s wrapped message is `"<method> <url> failed: <cause.message>"`. Neither contains the substring "fetch", so every migrated broker's "network error" test assertion needs to move from `.rejects.toThrow(/fetch/iu)` to a regex matching the real thrown value (e.g. `/ECONNREFUSED/u`).

---

### Remaining Web Fetch Batches (Exceeds 30-file cap: 75 files left standing for subsequent groups)

#### Remaining Batch A: fetch/post (33 files)
- `packages/web/src/adapters/fetch/post/fetch-post-adapter.ts` (delete)
- `packages/web/src/adapters/fetch/post/fetch-post-adapter.proxy.ts` (delete)
- `packages/web/src/adapters/fetch/post/fetch-post-adapter.test.ts` (delete)
- `packages/web/src/brokers/directory/browse/directory-browse-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/guild/create/guild-create-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/orchestration/dispatch-pause/orchestration-dispatch-pause-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/orchestration/dispatch-play/orchestration-dispatch-play-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/abandon/quest-abandon-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/clarify/quest-clarify-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/followup-stop/quest-followup-stop-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/merge/quest-merge-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/pause/quest-pause-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/resume/quest-resume-broker.ts` (+ proxy, test)

#### Remaining Batch B: fetch/get (42 files)
- `packages/web/src/adapters/fetch/get/fetch-get-adapter.ts` (delete)
- `packages/web/src/adapters/fetch/get/fetch-get-adapter.proxy.ts` (delete)
- `packages/web/src/adapters/fetch/get/fetch-get-adapter.test.ts` (delete)
- `packages/web/src/brokers/guild/detail/guild-detail-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/guild/list/guild-list-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/guild/session-list/guild-session-list-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/orchestration/dispatch-get/orchestration-dispatch-get-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/orchestration/mode-get/orchestration-mode-get-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/process/status/process-status-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/list/quest-list-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/projection/quest-projection-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/queue/quest-queue-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/riftcarver-detail/quest-riftcarver-detail-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/summary/quest-summary-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/quest/ward-detail/quest-ward-detail-broker.ts` (+ proxy, test)
- `packages/web/src/brokers/rate-limits/get/rate-limits-get-broker.ts` (+ proxy, test)

## Plan — F56

Clears the Z-W1 blocker: `fetchJsonProxy`/`fetchWithStatusProxy` stop spying on `globalThis.fetch`
directly (one shared handle per test file, throw-on-unmatched, no `passthrough`) and instead register
their staged responses as MSW handlers via `StartEndpointMock.listen()` — the same mechanism every
still-MSW-based sibling proxy in a shared test file (e.g. `useQuestChatBindingProxy`,
`HomeContentWidgetProxy`) already uses. Two independent MSW handlers coexist in one test file with no
shared-handle collision, because MSW itself resolves which registered handler answers a given
request — unlike a single spied function reference.

**Dependency check (no cycle):** `packages/@gateway/browser/package.json` already lists
`"@dungeonmaster/testing": "*"` under `devDependencies` (confirmed by reading the file) — no edit
needed. `packages/testing/package.json`'s own `dependencies` are `@dungeonmaster/node`,
`@dungeonmaster/npm`, `@mantine/core`, `msw`, `tsx`, `undici`, `zod` — no dependency on
`@dungeonmaster/browser`, direct or transitive (node does not depend on browser either), so
`browser → testing → node` stays a DAG. Confirmed further: `fetch-json.proxy.ts` already imports
`@dungeonmaster/testing/register-mock` today, proving this package already resolves from a browser
gateway proxy file.

**Design:** each proxy keeps a `Map<"<method> <url>", EndpointControl>` in its closure (fresh per
proxy instance, matching "create fresh proxy per test"). A `endpointFor({method, url})` helper calls
`StartEndpointMock.listen({method: method ?? 'get', url})` once per distinct address and caches the
result, so a test that calls one setup method against one address gets exactly one MSW handler. Every
setup method keeps its old name where reasonable; drops `returnsMatchingUrl`/`getCallsFor`
(`ValueMatcher`-keyed) since MSW's own path matching already tolerates a query string appended to a
literal path (proven by the ALREADY-COMMITTED `quest-delete-broker.proxy.ts`, which registers the bare
`/api/quests/:questId` pattern and already matches real requests carrying `?guildId=...`) — the
"tolerant addressing" test is rewritten to prove that real MSW behavior instead of a predicate mock.
Read-back moves from a raw `[url, init]` args tuple to `getRequestBodies({method, url}): Promise<unknown[]>`
(delegates to `EndpointControl.getRequestBodies()`), matching testing's own contract.

Connection-refused and abort scenarios stop being INVENTED (a hand-built `ConnectionRefusedErrorStub()`
rejection, or an unconditional AbortError with no real signal check) and become RECORDED: `networkError()`
is MSW's own real network-failure path, and an abort scenario either pre-aborts the `AbortSignal` before
calling (the WHATWG fetch spec's own synchronous short-circuit — no staging needed at all) or holds a
response open via `EndpointControl.holdsOpen()` and aborts mid-flight for real. `fetchWithStatusProxy`
gains a `setupHeld` passthrough to `holdsOpen()` — cheap, and directly what finding (a) says
`quest-human-verdict-broker` will need later. Exact thrown-error wording (message, `.cause`, `.code`) is
observed from a REAL ward run against the rewritten test files, not assumed from the old (invented) mock
shapes — the old assertions (`/fetch/iu` generic, or an invented ECONNREFUSED shape) are replaced with a
regex anchored to the value MSW/undici actually produce.

`quest-delete-broker.proxy.ts` registers `fetchJsonProxy().setupSuccess/setupConnectionRefused` at the
EXACT expected URL (path with the real `questId` interpolated, plus the real `?guildId=...` query
string) rather than the bare wildcard pattern — if MSW discriminates on a literal query string in the
handler pattern (to confirm empirically), a broker bug that builds the wrong query param fails the
whole test via MSW's "unhandled request" throw, which is a STRONGER proof than the old proxy's passive
`getRequestUrl()`/`getRequestMethod()` read-back (itself removed, since `EndpointControl` exposes no
URL read-back — only bodies — so a passive read of the exact request URL is not something the testing
package's public surface offers). If MSW does NOT discriminate on query string in practice, drop back to
the bare path pattern and record the resulting loss of query-exactness coverage under DECISIONS, per the
"stop and report the exact gap" rule — not a hard block, since the broker's status/body behavior is
still fully covered.

`quest-comment-batch-broker.proxy.ts` keeps every existing public method name
(`setupSent`, `setupSentWithDeliveredMessage`, `setupSentWithoutChatProcessId`,
`setupSentUnparseableBody`, `setupStaleAnchors`, `setupStaleAnchorsEmpty`, `setupBadRequest`,
`setupNotFound`, `setupServerError`, `setupServerErrorNoBody`, `setupNetworkError`, `getRequestBody`,
`getRequestCount`) since its own test file (in scope) calls all of them — only the internals swap from
a locally-owned `StartEndpointMock.listen()` + a raw `registerSpyOn(globalThis, 'fetch', {passthrough:
true})` (used only for read-back) onto composing `fetchWithStatusProxy()` from the gateway, which
removes the raw fetch spy entirely (`getRequestBodies()` replaces it). `getRequestBody` becomes
`async` (MSW's own body read is a Promise), so `quest-comment-batch-broker.test.ts` adds `await` at
every call site — the only signature change reaching that test file.

`questCommentBatchBroker` gains the inline `JSON.parse`-with-raw-text-fallback finding (b) says is
now the caller's job, since `fetchWithStatus`'s `body` is always a raw string (`fetchPostWithStatusAdapter`
used to do this centrally). `questDeleteBroker` gains a new `contracts/quest-delete-result/` (`+.stub.ts`,
`+.test.ts`) so `fetchJson`'s `unknown` return is parsed through a contract per R1, replacing the
previous unbranded inline `Promise<{deleted: boolean}>`.

**Files:**

- `packages/@gateway/browser/src/fetch/fetch-json/fetch-json.proxy.ts` — rewrite onto `StartEndpointMock`
- `packages/@gateway/browser/src/fetch/fetch-json/fetch-json.test.ts` — rewrite scenarios onto the new proxy API and real (not invented) failure shapes
- `packages/@gateway/browser/src/fetch/fetch-with-status/fetch-with-status.proxy.ts` — rewrite onto `StartEndpointMock`
- `packages/@gateway/browser/src/fetch/fetch-with-status/fetch-with-status.test.ts` — rewrite scenarios onto the new proxy API and real failure shapes
- `packages/web/src/contracts/quest-delete-result/quest-delete-result-contract.ts` — new, `{deleted: boolean}`
- `packages/web/src/contracts/quest-delete-result/quest-delete-result.stub.ts` — new
- `packages/web/src/contracts/quest-delete-result/quest-delete-result-contract.test.ts` — new
- `packages/web/src/brokers/quest/delete/quest-delete-broker.ts` — `fetchDeleteAdapter` → `fetchJson` (`#gateway/browser/fetch/fetch-json/fetch-json`), result parsed through `questDeleteResultContract`
- `packages/web/src/brokers/quest/delete/quest-delete-broker.proxy.ts` — compose `fetchJsonProxy` (`#gateway/browser/fetch/fetch-json/fetch-json.proxy`) instead of the deleted adapter's no-op proxy + raw fetch spy
- `packages/web/src/brokers/quest/delete/quest-delete-broker.test.ts` — adjust to the new proxy API and the real network-error message
- `packages/web/src/brokers/quest/comment-batch/quest-comment-batch-broker.ts` — `fetchPostWithStatusAdapter` → `fetchWithStatus` (`#gateway/browser/fetch/fetch-with-status/fetch-with-status`), inline JSON-parse-with-fallback added
- `packages/web/src/brokers/quest/comment-batch/quest-comment-batch-broker.proxy.ts` — compose `fetchWithStatusProxy` (`#gateway/browser/fetch/fetch-with-status/fetch-with-status.proxy`) instead of the (still-alive-for-other-callers) adapter's no-op proxy + raw fetch spy
- `packages/web/src/brokers/quest/comment-batch/quest-comment-batch-broker.test.ts` — `await` added to `getRequestBody()` call sites; real network-error message
- `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.ts` (delete) — `quest-delete-broker` was its only caller (confirmed via `discover`)
- `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.proxy.ts` (delete)
- `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.test.ts` (delete)

**NOT touched:** `packages/web/src/adapters/fetch/post-with-status/*` stays — `quest-human-verdict-broker`
and `quest-start-broker` still call `fetchPostWithStatusAdapter` (confirmed via `discover`); deleting it
would break them, and migrating them is a later group's job. `packages/@gateway/node`'s twin fetch
proxies are out of scope (F56 is `@gateway/browser` only).

**Verification order:** run `npm run ward -- --only unit -- packages/@gateway/browser/src/fetch` first
(the gateway's own two proxy tests) to nail down the real MSW/undici failure shapes before touching the
web brokers, then implement the two web brokers, then run
`packages/web/src/widgets/home-content/home-content-widget.test.tsx`,
`packages/web/src/widgets/app/app-widget.test.tsx` (or wherever `AppWidget`'s test lives),
`packages/web/src/widgets/quest-chat-content-layer/quest-chat-content-layer-widget.test.tsx` and
`packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx` (paths per `discover`) to prove the
four files Z-W1 broke now stay green.

---

### W-POST scope

First batch of Remaining Batch A (fetch/post). The full batch has 10 brokers and would touch 51 files (exceeding the ~35 file threshold).
- 7 of the 10 brokers require `getRequestCount` on `fetchJsonProxy` (which currently lacks it, unlike `fetchWithStatusProxy`).
- 1 broker (`directory-browse-broker`) is called on mount by `useDirectoryBrowserBinding` in multiple widgets (`GuildEmptyStateWidget`, `DirectoryBrowserModalWidget`, `HomeContentWidget`) without explicit test staging. In `fetchJsonProxy`, MSW handlers are registered lazily on `setup*` (unlike the old proxy's immediate `StartEndpointMock.listen`), and made-up default values in proxy constructors are banned.
- The remaining 2 brokers (`guild-create-broker` and `quest-abandon-broker`) are migrated cleanly onto `fetchJson` and `fetchJsonProxy`, with new contracts/stubs/tests for their response shapes.
- `fetch-post-adapter.*` is preserved until the remaining brokers are migrated.

#### Files created:
- `packages/web/src/contracts/guild-create-result/guild-create-result-contract.ts`
- `packages/web/src/contracts/guild-create-result/guild-create-result.stub.ts`
- `packages/web/src/contracts/guild-create-result/guild-create-result-contract.test.ts`
- `packages/web/src/contracts/quest-abandon-result/quest-abandon-result-contract.ts`
- `packages/web/src/contracts/quest-abandon-result/quest-abandon-result.stub.ts`
- `packages/web/src/contracts/quest-abandon-result/quest-abandon-result-contract.test.ts`

#### Files edited:
- `scrolls/brands-gateways-epic/items/a17-adapters-web.md`
- `packages/web/src/brokers/guild/create/guild-create-broker.ts`
- `packages/web/src/brokers/guild/create/guild-create-broker.proxy.ts`
- `packages/web/src/brokers/guild/create/guild-create-broker.test.ts`
- `packages/web/src/brokers/quest/abandon/quest-abandon-broker.ts`
- `packages/web/src/brokers/quest/abandon/quest-abandon-broker.proxy.ts`
- `packages/web/src/brokers/quest/abandon/quest-abandon-broker.test.ts`
- `packages/web/src/widgets/app/app-widget.proxy.tsx` (expose setupCreateGuildError needed when exact staging exposed unstaged guild create in app-widget test)
- `packages/web/src/widgets/app/app-widget.test.tsx` (fix test calling setupGuildsError instead of setupCreateGuildError)

#### Left standing:
1. `packages/web/src/brokers/directory/browse/directory-browse-broker.ts` (+ proxy, test): called on mount without staging in several widget tests; needs gateway/proxy coordination for unstaged mount calls.
2. Awaiting gateway `getRequestCount` on `fetchJsonProxy`:
   - `packages/web/src/brokers/orchestration/dispatch-pause/orchestration-dispatch-pause-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/orchestration/dispatch-play/orchestration-dispatch-play-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/quest/clarify/quest-clarify-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/quest/followup-stop/quest-followup-stop-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/quest/merge/quest-merge-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/quest/pause/quest-pause-broker.ts` (+ proxy, test)
   - `packages/web/src/brokers/quest/resume/quest-resume-broker.ts` (+ proxy, test)
3. Adapter preserved while callers remain:
   - `packages/web/src/adapters/fetch/post/fetch-post-adapter.ts`
   - `packages/web/src/adapters/fetch/post/fetch-post-adapter.proxy.ts`
   - `packages/web/src/adapters/fetch/post/fetch-post-adapter.test.ts`



## Plan — F61

Clears the seven W-POST brokers that assert `getRequestCount()`. `EndpointControl` already exposes
`getRequestCount(): RequestCount`, so no `packages/testing` change and no `registerSpyOn` on
`globalThis.fetch`. `fetchWithStatusProxy` already forwards it; `fetchJsonProxy` gains the same
`getRequestCount({ method, url })`, both delegating to the per-address cached endpoint.

Files (all under `packages/@gateway/browser/src/fetch/`):
- `fetch-json/fetch-json.proxy.ts` — add `getRequestCount({ method, url })`.
- `fetch-json/fetch-json.test.ts` — count is per address and counts real requests.
- `fetch-with-status/fetch-with-status.test.ts` — same tests for its existing read-back.
