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

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
