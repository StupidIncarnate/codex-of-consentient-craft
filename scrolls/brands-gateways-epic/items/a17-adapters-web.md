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

### W-POST2 scope

Second batch of fetch/post: the seven brokers W-POST left standing on `getRequestCount`, now unblocked by
F61. `server/stop` and `shell/session-create` do not exist in `packages/web/src/brokers/`, so nothing there.
`directory/browse` stays on `fetchPostAdapter` (mounted unstaged by `DirectoryBrowserModalWidget`), so
`adapters/fetch/post/` stays. The widget/binding proxies that compose these broker proxies
(`use-quest-chat-binding.proxy.ts`, `dispatch-toggle-widget.proxy.tsx`, `quest-chat-content-layer-widget.proxy.tsx`)
keep calling the same proxy method names, so they are read and run but not edited unless a run shows otherwise.

Files created:
- `packages/web/src/contracts/orchestration-dispatch-result/orchestration-dispatch-result-contract.ts` (+ `.stub.ts`, `-contract.test.ts`), shared by pause and play
- `packages/web/src/contracts/quest-clarify-result/quest-clarify-result-contract.ts` (+ `.stub.ts`, `-contract.test.ts`)
- `packages/web/src/contracts/quest-followup-stop-result/quest-followup-stop-result-contract.ts` (+ `.stub.ts`, `-contract.test.ts`)
- `packages/web/src/contracts/quest-merge-result/quest-merge-result-contract.ts` (+ `.stub.ts`, `-contract.test.ts`)
- `packages/web/src/contracts/quest-pause-result/quest-pause-result-contract.ts` (+ `.stub.ts`, `-contract.test.ts`)

Files edited (`.ts`, `.proxy.ts`, `.test.ts` each):
- `packages/web/src/brokers/orchestration/dispatch-pause/orchestration-dispatch-pause-broker*`
- `packages/web/src/brokers/orchestration/dispatch-play/orchestration-dispatch-play-broker*`
- `packages/web/src/brokers/quest/clarify/quest-clarify-broker*`
- `packages/web/src/brokers/quest/followup-stop/quest-followup-stop-broker*`
- `packages/web/src/brokers/quest/merge/quest-merge-broker*`
- `packages/web/src/brokers/quest/pause/quest-pause-broker*`
- `packages/web/src/brokers/quest/resume/quest-resume-broker*` (parses through the existing `questResumeOutcomeContract`)

### W-GET scope

Remaining Batch B: every caller of `fetchGetAdapter` moves onto `fetchJson` (`#gateway/browser/fetch`), with
proxies composing `fetchJsonProxy` at the bare route pattern (MSW ignores the query string, as `quest-delete`
already relies on). Broker method names on the proxies stay, so widget/binding proxies keep working; an unstaged
mount-time call is no longer answered (was a 500), so widget tests that relied on it are found by running
`packages/web` and are listed under "Widget staging" once known.

Brokers (`.ts`, `.proxy.ts`, `.test.ts` each), under `packages/web/src/brokers/`:
- `guild/detail/guild-detail-broker*`
- `guild/list/guild-list-broker*`
- `guild/session-list/guild-session-list-broker*`
- `orchestration/dispatch-get/orchestration-dispatch-get-broker*`
- `orchestration/mode-get/orchestration-mode-get-broker*`
- `process/status/process-status-broker*`
- `quest/list/quest-list-broker*`
- `quest/projection/quest-projection-broker*`
- `quest/queue/quest-queue-broker*`
- `quest/riftcarver-detail/quest-riftcarver-detail-broker*`
- `quest/summary/quest-summary-broker*`
- `quest/ward-detail/quest-ward-detail-broker*`
- `rate-limits/get/rate-limits-get-broker*`

New contracts (`-contract.ts`, `.stub.ts`, `-contract.test.ts` each), under `packages/web/src/contracts/`, for the four
wrapped bodies (`{state}`, `{mode}`, `{entries}`, `{snapshot}`):
- `orchestration-dispatch-get-result/`
- `orchestration-mode-get-result/`
- `quest-queue-result/`
- `rate-limits-get-result/`

Deleted once no caller is left: `packages/web/src/adapters/fetch/get/fetch-get-adapter{,.proxy,.test}.ts`.

Widget / binding proxies and tests: none named up front; the proxies keep their method names.

Item file: `scrolls/brands-gateways-epic/items/a17-adapters-web.md`.

#### W-GET scope, as executed

A full `packages/web` unit run with all 13 brokers moved showed which unstaged mount-time calls broke widget
tests. Four brokers went back to `fetchGetAdapter` because each would need staging in more than a handful of
widget tests: `quest/list` (app-widget and home-content mount it on every guild select), `quest/queue`
(`QuestQueueBarWidget` mounts it, 14 tests, plus app-widget), `orchestration/dispatch-get` (queue-bar
widget, 14 tests), `rate-limits/get` (app-widget, 22 tests). So `adapters/fetch/get/` stays.

Moved (`.ts`, `.proxy.ts`, `.test.ts` each unless noted): `guild/detail`, `guild/list`, `guild/session-list`,
`orchestration/mode-get`, `process/status`, `quest/projection`, `quest/riftcarver-detail` (no test change),
`quest/summary`, `quest/ward-detail` (no test change).

New contract: `contracts/orchestration-mode-get-result/` (`-contract.ts`, `.stub.ts`, `-contract.test.ts`).
The `orchestration-dispatch-get-result`, `quest-queue-result` and `rate-limits-get-result` contracts are not
created (their brokers stayed).

Widget / binding files edited for staging or the new error text:
- `bindings/use-quest-projection/use-quest-projection-binding.test.ts`, `bindings/use-quest-summary/use-quest-summary-binding.test.ts`, `widgets/quest-summary/quest-summary-widget.test.tsx` (404 message now carries `: <body>`)
- `widgets/execution-panel/execution-row-layer-widget.proxy.tsx`, `execution-work-item-row-layer-widget.proxy.tsx`, `execution-panel-widget.proxy.tsx`, and the tests `execution-work-item-row-layer-widget.test.tsx`, `execution-panel-widget.test.tsx` (stage the ward/riftcarver detail an expanded row fetches)
- `widgets/quest-chat/quest-chat-widget.proxy.tsx`, `quest-chat-widget.test.tsx` (stage the mode the content layer fetches)
- `widgets/home-content/home-content-widget.test.tsx` (stage the session list two tests left unstaged)

### F65 scope

The five brokers W-GET and W-POST left on `adapters/fetch/{get,post}` move onto `fetchJson` (`#gateway/browser/fetch`).
Their broker proxies compose `fetchJsonProxy` and keep their method names.

Staging design: `fetchJsonProxy` registers an MSW handler only when a `setup*` call runs, so a widget that fetches on
mount gets an unhandled request in every test that never staged it. Each composing widget proxy (the first proxy in
the chain that owns the widget) gains a named method for what its widget fetches on mount, and each affected test calls
that method with the data it means. No constructor default. Where a whole file needs one mount answer, a named
`setupMountDefaults`-style method that the tests call explicitly.

Contracts: `orchestration-dispatch-get` returns `{state}`, the same wire body as the existing
`orchestrationDispatchResultContract`, so it is reused, not duplicated. New: `quest-queue-result/` (`{entries}`),
`rate-limits-get-result/` (`{snapshot}`, nullable). `directory/browse` returns a bare array, parsed through
`directoryEntryContract.array()`; `quest/list` through the existing `questListResultContract`.

Brokers (`.ts`, `.proxy.ts`, `.test.ts`), `packages/web/src/brokers/`: `directory/browse`, `quest/list`, `quest/queue`,
`orchestration/dispatch-get`, `rate-limits/get`.
New contracts (`-contract.ts`, `.stub.ts`, `-contract.test.ts`): `quest-queue-result`, `rate-limits-get-result`.
Deleted: `packages/web/src/adapters/fetch/get/*`, `packages/web/src/adapters/fetch/post/*`.

Widget/binding proxies and tests that compose these (named from a read; the exact set is confirmed by the
`packages/web` unit run and appended under "as executed" below): bindings `use-directory-browser`, `use-dispatch-state`,
`use-quest-queue`, `use-quests`, `use-rate-limits` (proxy + test each); widgets `app`, `home-content`, `quest-queue-bar`,
`guild-empty-state`, `directory-browser-modal`, `dispatch-toggle`, `queue-page`, `rate-limits-stack` (proxy + test each,
where the run shows fallout).

#### F65 scope, as executed

All five brokers moved onto `fetchJson`; `packages/web/src/adapters/fetch/get/` and `fetch/post/` are deleted. No
`orchestration-dispatch-get-result` contract: the dispatch-get body is `{state}`, the wire body
`orchestrationDispatchResultContract` already validates, so the broker parses through that one.

A `packages/web` unit run with the brokers moved failed 76 tests in seven files, every one an unstaged mount fetch.
Staging, by widget (each a named method; nothing answers unless a test calls it):
- `directory-browser-modal` (binding browses on mount): its `setupEntries` was already named; the six tests that never
  called it now do, with an empty listing. `guild-empty-state` tests call its existing `setupDirectoryBrowse`;
  `guild-add-modal` proxy gains `setupDirectoryBrowse` and its tests call it.
- `home-content` proxy gains `setupDirectoryBrowse` (stages the empty-state form's browser and the add-guild modal's
  browser, which share one endpoint); its 18 tests call it, and the eight that select a guild also call the existing
  `setupQuests({ quests: [] })`.
- `quest-queue-bar` proxy gains `setupDispatchState` (the embedded dispatch toggle fetches it when the bar has
  entries); the 13 non-empty-queue tests call it.
- `app` proxy gains `setupDirectoryBrowse`, `setupRateLimits`, `setupDispatchState` and `setupMountDefaults` (empty
  directory, empty quests, empty queue, null rate-limits snapshot). The queue-bar test names its three fetches
  individually; the other 21 call `setupMountDefaults()` first and stage over it what they mean.
- `use-quests` binding: the empty-body test moved to a new `setupEmptyBody` (broker and binding proxies); the error is
  now the gateway's `returned invalid JSON` message, not a bare `SyntaxError`.

Files touched: the five `brokers/**` `.ts` + `.proxy.ts`; `contracts/quest-queue-result/` and
`contracts/rate-limits-get-result/` (3 files each); `brokers/quest/list/quest-list-broker.test.ts`;
`bindings/use-quests/use-quests-binding.{proxy.ts,test.ts}`; widgets `app`, `home-content`, `quest-queue-bar`,
`guild-add-modal`, `guild-empty-state`, `directory-browser-modal` (proxy where named above, plus test).

### W-NET scope

The remaining network adapters. `fetch/patch` and `fetch/post-with-status` move onto `fetchJson` and
`fetchWithStatus`; `websocket/connect` onto `#gateway/browser/WebSocket` `connect`. `xhr/post-with-progress`
stays: `@gateway/browser` exports the raw `XMLHttpRequest` global with no proxy and no wrapper, so the
broker proxies have nothing to compose.

Brokers (`.ts`, `.proxy.ts`, `.test.ts` each), `packages/web/src/brokers/quest/`: `modify/quest-modify-broker`,
`human-verdict/quest-human-verdict-broker`, `start/quest-start-broker`. The two `fetchWithStatus` brokers parse
the raw body themselves (JSON, raw-text fallback), and `human-verdict`'s `setupHeld` composes
`fetchWithStatusProxy().setupHeld`.

State: `packages/web/src/state/web-socket-channel/web-socket-channel-state.ts` and `.proxy.ts` (composes
`connectProxy`; the reconnect-timer flush, which the gateway proxy does not offer, moves into this proxy).

Deleted: `packages/web/src/adapters/fetch/patch/*`, `packages/web/src/adapters/fetch/post-with-status/*`,
`packages/web/src/adapters/websocket/connect/*` (three files each).

Item file: `scrolls/brands-gateways-epic/items/a17-adapters-web.md`.


### W-TL-RX scope

Deleted outright (30 files): `packages/web/src/adapters/testing-library/{act,act-async,render-hook,wait-for}/*` and `packages/web/src/adapters/rxjs/{filter,merge,of,subject,take,timeout}/*` (adapter, proxy, test each). Every caller imports `act`/`renderHook`/`waitFor` from `#gateway/npm/testing-library__react`, and `filter`/`take`/`timeout`/`merge`/`of`/`Subject` from `#gateway/npm/rxjs__operators` / `#gateway/npm/rxjs`. Files edited:

- `packages/web/src/bindings/use-agent-output/use-agent-output-binding.test.ts`
- `packages/web/src/bindings/use-auto-scroll/use-auto-scroll-binding.test.ts`
- `packages/web/src/bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.test.ts`
- `packages/web/src/bindings/use-comment-queue/use-comment-queue-binding.test.ts`
- `packages/web/src/bindings/use-directory-browser/use-directory-browser-binding.test.ts`
- `packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts`
- `packages/web/src/bindings/use-dispatch-state/use-dispatch-state-binding.test.ts`
- `packages/web/src/bindings/use-elapsed-tick/use-elapsed-tick-binding.test.ts`
- `packages/web/src/bindings/use-guild-detail/use-guild-detail-binding.test.ts`
- `packages/web/src/bindings/use-guilds/use-guilds-binding.test.ts`
- `packages/web/src/bindings/use-orchestration-mode/use-orchestration-mode-binding.test.ts`
- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.proxy.ts`
- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.test.ts`
- `packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts`
- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.proxy.ts`
- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.test.ts`
- `packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.ts`
- `packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.test.ts`
- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.proxy.ts`
- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.test.ts`
- `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.ts`
- `packages/web/src/bindings/use-quests/use-quests-binding.test.ts`
- `packages/web/src/bindings/use-rate-limits/use-rate-limits-binding.test.ts`
- `packages/web/src/bindings/use-session-list/use-session-list-binding.test.ts`
- `packages/web/src/bindings/use-session-replay/use-session-replay-binding.proxy.ts`
- `packages/web/src/bindings/use-session-replay/use-session-replay-binding.test.ts`
- `packages/web/src/bindings/use-session-replay/use-session-replay-binding.ts`
- `packages/web/src/bindings/use-ward-detail/use-ward-detail-binding.proxy.ts`
- `packages/web/src/bindings/use-ward-detail/use-ward-detail-binding.test.ts`
- `packages/web/src/bindings/use-ward-detail/use-ward-detail-binding.ts`
- `packages/web/src/state/web-socket-channel/web-socket-channel-state.proxy.ts`
- `packages/web/src/state/web-socket-channel/web-socket-channel-state.ts`
- `packages/web/src/widgets/app/app-widget.integration.test.tsx`
- `packages/web/src/widgets/app/app-widget.test.tsx`
- `packages/web/src/widgets/directory-browser-modal/directory-browser-modal-widget.test.tsx`
- `packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.test.tsx`
- `packages/web/src/widgets/execution-panel/execution-panel-widget.proxy.tsx`
- `packages/web/src/widgets/execution-panel/execution-panel-widget.test.tsx`
- `packages/web/src/widgets/home-content/home-content-widget.test.tsx`
- `packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx`
- `packages/web/src/widgets/quest-queue-bar/quest-queue-bar-widget.test.tsx`
- `packages/web/src/widgets/rate-limits-stack/rate-limits-stack-widget.test.tsx`

## Plan — F66 and F67

Scope: `packages/@gateway/browser/**` only. Web's callers are not migrated here.

Named files:
- `packages/@gateway/browser/src/XMLHttpRequest/xhr-post-with-progress/xhr-post-with-progress.ts` (new): `xhrPostWithProgress({ url, body, onProgress })` resolves `{ status, ok, body }` with `body` the raw response text (the `fetchWithStatus` shape); rejects naming the url on network error, timeout and abort.
- `.../xhr-post-with-progress/xhr-post-with-progress.proxy.ts` (new): stages through MSW (`StartEndpointMock`), like the fetch proxies. `setupResponse`, `setupRefused`, `getRequestBodies`, `getRequestCount`, all keyed by url (method is always POST). No catch-all default: an unstaged url fails the test through MSW's unhandled-request check. Progress is MSW's own upload event (loaded and total both the request body's byte length), not scripted.
- `.../xhr-post-with-progress/xhr-post-with-progress.test.ts` (new).
- `packages/@gateway/browser/src/XMLHttpRequest/XMLHttpRequest.ts` and `XMLHttpRequest.test.ts`: the raw-global re-export becomes the curated entry exporting `xhrPostWithProgress` (no caller imports the raw export).
- `packages/@gateway/browser/src/fetch/fetch-with-status/fetch-with-status.proxy.ts` and `fetch-with-status.test.ts` (F67): `setupHeld` hands `holdsOpen` the parsed JSON so the released body is the staged text; non-JSON text throws at staging. Test releases a held response and reads the exact body.

### W-MISC scope

Chunk: `elk/layout`, the four `xyflow/*` files, and `mantine/notifications`. Not attempted, gateway gaps
(see the report): `canvas/image-measure`, `canvas/image-rescale` (`@gateway/browser/createImageBitmap` has no
proxy and is `undefined` in jsdom at import), `indexed-db/*` (no `clear` wrapper, `getAll` returns no keys, and
the four gateway proxies hand out separate fakes that do not compose into one store). Not attempted, over the
file cap: `file/read-data-url`, `mantine/notifications-show`, `react-dom/mount`.

Created (all under `packages/web/src/`):
- `widgets/flow-edge/flow-edge-widget.tsx`, `.proxy.tsx`, `.test.tsx`
- `widgets/flow-node-handles/flow-node-handles-widget.tsx`, `.proxy.tsx`, `.test.tsx`
- `widgets/react-flow/react-flow-widget.tsx`, `.proxy.tsx`, `.test.tsx`
- `widgets/react-flow/node-measure-layer-widget.tsx`, `.proxy.tsx`, `.test.tsx`
- `brokers/elk/layout/elk-layout-broker.ts`, `.proxy.ts`, `.test.ts`

Edited:
- `widgets/react-flow-diagram/react-flow-diagram-widget.tsx`, `.proxy.tsx`
- `widgets/react-flow-diagram/flow-portal-node-layer-widget.tsx`, `.proxy.tsx`
- `widgets/react-flow-diagram/flow-node-card-layer-widget.tsx`, `.proxy.tsx`
- `widgets/react-flow-diagram/flow-observable-node-layer-widget.tsx`, `.proxy.tsx`
- `widgets/app-root/app-root-widget.tsx`, `.proxy.tsx`
- `statics/elk-layout/elk-layout-statics.ts` (comment names only, if it names a deleted file)

Deleted: `adapters/elk/layout/*`, `adapters/xyflow/{edge,node-handles,react-flow}/*`,
`adapters/mantine/notifications/*`.

## Plan — F69 and F70

Scope: `packages/@gateway/browser/**` only. Web's callers are not migrated here.

F69 (canvas), all under `packages/@gateway/browser/src/`:
- `createImageBitmap/createImageBitmap.ts` (rewritten to a call-time wrapper over `globalThis.createImageBitmap`),
  `createImageBitmap.test.ts` (rewritten), `createImageBitmap.proxy.ts` (new: stage a bitmap's width/height by input,
  stage a decode failure, read back requested inputs and closed bitmaps).
- `HTMLCanvasElement/HTMLCanvasElement.ts` and `.test.ts` (new barrel), `HTMLCanvasElement/canvas-encode/canvas-encode.ts`,
  `.proxy.ts`, `.test.ts` (new: create a canvas, draw a bitmap at a size, `toDataURL(mediaType, quality)`).
- `gateway-browser-globals.integration.test.ts` (add `HTMLCanvasElement` to the maintained global list).

F70 (IndexedDB), all under `packages/@gateway/browser/src/`:
- `gateway-test-support/fake-indexed-db.ts` and `.test.ts` (new: one in-memory store per database/store name per test,
  shared by every indexedDB proxy; transactions, requests, failure staging, read-back).
- `indexedDB/replace-all/replace-all.ts`, `.proxy.ts`, `.test.ts` (new: read, transform, clear and re-add in one transaction).
- `indexedDB/indexedDB.ts` and `.test.ts` (export `replaceAll`).
- `indexedDB/open-store/open-store.proxy.ts`, `indexedDB/get-all/get-all.proxy.ts`, `indexedDB/put/put.proxy.ts`,
  `indexedDB/delete-record/delete-record.proxy.ts` (reworked onto the shared store) and their `.test.ts` files.

Plan amendment (gateway-colocation lint): the `createImageBitmap` wrapper, proxy and test live in
`createImageBitmap/create-image-bitmap/` behind a re-export barrel; `HTMLCanvasElement/` also holds
`canvas-2d-context.stub.ts` and `.test.ts`; `gateway-test-support/fake-indexed-db.proxy.ts` (empty) is added.

### W-XHR-DOM scope

All under `packages/web/`. Deleted: `src/adapters/xhr/post-with-progress/*` (adapter, proxy, test), `src/adapters/dom/composer-*/*` (five adapters, each with proxy and test).

XHR callers:
- `src/brokers/quest/chat/quest-chat-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/quest/followup/quest-followup-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/quest/new/quest-new-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/bindings/use-quest-chat/use-quest-chat-binding.proxy.ts`, `.test.ts`
- `src/widgets/quest-chat/quest-chat-content-layer-widget.proxy.tsx`, `.test.tsx`
- `src/flows/quest-chat/send-images-chat-route.e2e.ts`, `composer-send-reload-race.e2e.ts` (comment)
- `test/harnesses/composer-send/composer-send.harness.ts` (comments)

DOM composer, decided per adapter. None wraps an npm package or a gateway global: each mutates or reads the `HTMLElement` the widget hands it, and the only true global touched was `document` in the write adapter, now `editor.ownerDocument`. The logic is ours, so none stays an adapter.
- read: `src/transformers/composer-read/composer-read-transformer.ts`, `.test.ts` (a DOM-in, `ComposerSegment[]`-out derivation with no mutation)
- write, insert-text, insert-image, delete-thumbnail: `src/brokers/composer/<name>/composer-<name>-broker.ts`, `.proxy.ts`, `.test.ts` (each mutates the editor)
- callers: `src/widgets/chat-input/chat-input-widget.tsx`, `.proxy.tsx`, `.test.tsx`
- comment renames: `src/statics/chat-composer/chat-composer-statics.ts`, `src/transformers/composer-parse-draft/composer-parse-draft-transformer.ts`, `src/transformers/composer-caret-filler-element/composer-caret-filler-element-transformer.ts`, `src/flows/quest-chat/composer-paste-draft-reload.e2e.ts`, `send-text-only-and-newline.e2e.ts`, `composer-paste-inserts-thumbnail.e2e.ts`, `test/harnesses/composer-paste/composer-paste.harness.ts`
- `src/contracts/composer-segment/composer-segment-contract.ts`: gains `ComposerSegmentInput`, the pre-parse type the read transformer needs (a transformer may not import zod).

### W-MISC2 scope

Chunk: `canvas/image-measure`, `canvas/image-rescale`, `indexed-db/*`, `file/read-data-url`, `mantine/notifications-show`. Left alone: `mantine/render`, `react-dom/mount`. All under `packages/web/src/`.

Deleted: `adapters/canvas/*`, `adapters/indexed-db/*`, `adapters/file/*`, `adapters/mantine/notifications-show/*` (each adapter, proxy, test).

Created:
- `brokers/image/measure/image-measure-broker.ts`, `.proxy.ts`, `.test.ts` (over `#gateway/browser/createImageBitmap`; the proxy stages through the gateway's `createImageBitmapProxy`, addressed by the Blob's byte length)
- `brokers/image/rescale/image-rescale-broker.ts`, `.proxy.ts`, `.test.ts` (over `createImageBitmap` and `canvasEncode`; the proxy stages `canvasEncode` with `registerMock`, because the ladder needs one answer per ask at the same media type and quality)
- `brokers/file/read-data-url/file-read-data-url-broker.ts`, `.proxy.ts`, `.test.ts` (over `#gateway/browser/FileReader`)
- `brokers/draft-images/read/draft-images-read-broker.ts`, `.proxy.ts`, `.test.ts` (over `openStore`, `getAll`)
- `brokers/draft-images/read/migrate-legacy-records-layer-broker.ts`, `.proxy.ts`, `.test.ts` (over `getAll`, `replaceAll`)

Edited:
- `brokers/draft-images/save/draft-images-save-broker.ts`, `.proxy.ts` (the replace adapter's logic moves in, over `openStore` and `replaceAll`)
- `brokers/draft-images/load/draft-images-load-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/pasted-image/downscale/pasted-image-downscale-broker.ts`, `.proxy.ts`, `.test.ts`
- `widgets/chat-input/chat-input-widget.tsx`, `.proxy.tsx`, `.test.tsx` (comments)
- `widgets/comment-queue-bar/comment-queue-bar-widget.tsx`, `.proxy.tsx`
- `widgets/home-content/home-content-widget.tsx`, `.proxy.tsx`
- `widgets/quest-chat/quest-chat-content-layer-widget.tsx`, `.proxy.tsx`
- `contracts/notification-message/notification-message-contract.ts` (comment names only)

### W-LAST scope

The last two web adapters and two follow-ups. `packages/web/src/adapters/` no longer exists afterwards.

Deleted: `packages/web/src/adapters/mantine/render/*` (adapter, proxy, test), `packages/web/src/adapters/react-dom/mount/*` (adapter, proxy, test).

Created:
- `packages/web/src/brokers/react-root/mount/react-root-mount-broker.ts`, `.proxy.ts`, `.test.ts` (`createRoot` through `#gateway/npm/react-dom__client`; the test mounts for real into jsdom)

Edited:
- every web `.ts`/`.tsx` importing `mantineRenderAdapter` (about 105 files, mostly `widgets/**/*.test.tsx`): the import moves to `@dungeonmaster/testing/adapters/mantine/render`
- `packages/web/src/responders/app/mount/app-mount-responder.ts`, `.proxy.ts`, `.test.ts`
- `packages/web/src/main.ts` (F71: the three global stylesheet imports)
- `packages/web/src/brokers/image/rescale/image-rescale-broker.proxy.ts`, `.test.ts` (F74)
- `packages/web/src/brokers/pasted-image/downscale/pasted-image-downscale-broker.proxy.ts` (F74)
- `packages/@gateway/browser/src/HTMLCanvasElement/canvas-encode/canvas-encode.proxy.ts`, `.test.ts` (F74: `stageEncodeOnce`, `stageContextUnavailableOnce`)
- `packages/shared/src/brokers/architecture/project-map/architecture-project-map-broker.integration.test.ts` (operator's addition: the `reactDomMountAdapter` line is asserted absent)
