# Round 1 — [codeweaver] Codeweaver: build this slice — web: health-detail-page

SUMMARY: This round turns `HealthPageWidget` from a title-only frame into the real `/health` surface: a
7-row snapshot table, a large sad-raccoon error panel with a RETRY control, live refresh off the
`health-updated` tick, and the socket-loss branch that blanks the table. Everything below the widget already
exists and is committed — `healthGetBroker`, `useHealthBinding`, `webSocketChannelState.healthChanged$()` /
`closes$()`, `sadRaccoonPixelsStatics`, `PixelSpriteWidget`, the `/health` route (`HealthFlow` → 
`AppHealthResponder` → `HealthPageWidget`, wired into `AppFlow`), and the badge's `/health` suppression in
`AppWidget` — so the shape of this round is: two small statics, one transformer, one additive change to the
existing binding, two layer widgets, the page widget that branches between them, and two wiring-test chunks.

Three design calls I settled while reading the tree, because nothing in the spec decides them:

1. **How the panel knows WHICH failure it is.** The observables demand three distinct literals — `HTTP 500`,
   `NO RESPONSE`, `CONNECTION LOST` — but `useHealthBinding` today surfaces only a message string, and
   `fetchGetAdapter` throws a plain `Error` with no status on it. I rejected retrofitting a
   `fetch/get-with-status` adapter (it would force `healthGetBroker` to change shape, and that broker is
   already signed off and shared with the badge). Instead the vocabulary lands in ONE place:
   `healthErrorStatics` holds the socket-close sentinel message and the three labels, and
   `healthErrorLabelTransformer` maps a failure message to a label — `/failed with status (\d+)$/` → 
   `HTTP <n>`, the socket sentinel → `CONNECTION LOST`, everything else → `NO RESPONSE`. One regex, one
   file, fully unit-tested, and no already-committed file changes shape.

2. **A malformed 200 body renders `NO RESPONSE`, and the panel shows the raw message underneath.** Falling
   back to `NO RESPONSE` for a Zod parse failure is defensible only if the operator can still see the cause,
   so the panel carries `HEALTH_PAGE_ERROR_DETAIL` with the underlying message verbatim. I ADDED two
   observables for exactly this (`check-error-panel-invalid-body-falls-back`,
   `check-error-panel-detail-message`) plus `check-page-loading-before-first-response`, which pins that the
   page shows `HEALTH_PAGE_LOADING` while the first GET is in flight rather than flashing the sad raccoon on
   every normal load. All three are already on the quest via `modify-quest` and are graded like any other.

3. **`retry` is the binding's existing `refresh`, exported — and it must NOT re-raise `isLoading`.** Flipping
   `isLoading` back to `true` on retry would tear the error panel down and back up, and
   `check-retry-failure-keeps-panel` says the panel REMAINS visible. The existing `refresh` never sets
   `isLoading` true, so exposing it unchanged is exactly the right behaviour.

Seam check, all three verified against committed code before planning, all present, none needing repair:
`apiRoutesStatics.health.check` and `webConfigStatics.api.routes.health` are both the literal `'/api/health'`;
`packages/server/src/flows/health/health-flow.integration.test.ts` drives BOTH the 200 and the 500 branch of
the endpoint; and the per-client 5000ms `health-updated` broadcast is committed under
`29bb1507 chunk 1: a quest-subscribed client and a plain client both get the 5000ms tick`.

## chunk 1 — healthPageRowsStatics: the ordered 7-row definition the table and its test both read
INTENT: One immutable, ordered list is the single source of truth for which snapshot fields the `/health`
table renders, in what order, under which label, and behind which two testids — so the widget maps over it
and the test derives its expected testid list from it instead of hardcoding a second copy.
FILES:
  - ./packages/web/src/statics/health-page-rows/health-page-rows-statics.ts
  - ./packages/web/src/statics/health-page-rows/health-page-rows-statics.test.ts
UNITS:
  - check-table-row-testids
MIRROR: ./packages/web/src/statics/http-status/http-status-statics.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/statics/health-page-rows/health-page-rows-statics.ts ./packages/web/src/statics/health-page-rows/health-page-rows-statics.test.ts
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — the `/health` route renders the full server health
  snapshot as a labelled table and stays live off the `health-updated` tick. This chunk is the data
  definition behind node `#snapshot-table-rendered` ("Table renders all 7 snapshot fields").

  OBSERVABLE THIS MUST SERVE, VERBATIM — `check-table-row-testids` [ui-state]: "HEALTH_PAGE_TABLE renders
  exactly 7 rows with testids HEALTH_PAGE_ROW_STATUS, HEALTH_PAGE_ROW_TIMESTAMP,
  HEALTH_PAGE_ROW_UPTIME_SECONDS, HEALTH_PAGE_ROW_VERSION, HEALTH_PAGE_ROW_PORT, HEALTH_PAGE_ROW_HOME,
  HEALTH_PAGE_ROW_ORCHESTRATION_MODE".

  SHAPE — export `healthPageRowsStatics` with a single `rows` array, `as const`, in exactly the observable's
  order. Each entry: `{ field, label, rowTestId, valueTestId }`.

  | field               | label              | rowTestId                            | valueTestId                            |
  |---------------------|--------------------|--------------------------------------|----------------------------------------|
  | `status`            | STATUS             | HEALTH_PAGE_ROW_STATUS               | HEALTH_PAGE_VALUE_STATUS               |
  | `timestamp`         | TIMESTAMP          | HEALTH_PAGE_ROW_TIMESTAMP            | HEALTH_PAGE_VALUE_TIMESTAMP            |
  | `uptimeSeconds`     | UPTIME SECONDS     | HEALTH_PAGE_ROW_UPTIME_SECONDS       | HEALTH_PAGE_VALUE_UPTIME_SECONDS       |
  | `version`           | VERSION            | HEALTH_PAGE_ROW_VERSION              | HEALTH_PAGE_VALUE_VERSION              |
  | `port`              | PORT               | HEALTH_PAGE_ROW_PORT                 | HEALTH_PAGE_VALUE_PORT                 |
  | `home`              | HOME               | HEALTH_PAGE_ROW_HOME                 | HEALTH_PAGE_VALUE_HOME                 |
  | `orchestrationMode` | ORCHESTRATION MODE | HEALTH_PAGE_ROW_ORCHESTRATION_MODE   | HEALTH_PAGE_VALUE_ORCHESTRATION_MODE   |

  The `field` values are the seven keys of `healthSnapshotContract`
  (`packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts`) — `status`, `timestamp`,
  `uptimeSeconds`, `version`, `port`, `home`, `orchestrationMode` — and nothing else. Chunk 5 indexes the
  parsed snapshot with `snapshot[row.field]`, so a typo here becomes a typecheck error there, which is the
  point.

  WHY THE VALUE CELL USES A DIFFERENT PREFIX: `HEALTH_PAGE_VALUE_*`, not `HEALTH_PAGE_ROW_*_VALUE`. The
  observable says "exactly 7 rows with testids HEALTH_PAGE_ROW_…", so a test querying every
  `HEALTH_PAGE_ROW_` testid must find seven elements, not fourteen. A nested value cell sharing the ROW
  prefix silently doubles that count.

  `statics/` may import only `statics/` — every value here is a plain string literal, so import nothing.

  TEST: assert the whole exported object with ONE `toStrictEqual` (see
  `packages/web/src/statics/http-status/http-status-statics.test.ts`), not seven per-row assertions.

## chunk 2 — healthErrorStatics: the socket-close sentinel and the three panel labels
INTENT: The error panel's whole display vocabulary — `HTTP `, `NO RESPONSE`, `CONNECTION LOST` — and the
sentinel message the binding writes on a socket close live in one file, so the binding that PRODUCES the
sentinel and the transformer that CONSUMES it can never drift into two different strings.
FILES:
  - ./packages/web/src/statics/health-error/health-error-statics.ts
  - ./packages/web/src/statics/health-error/health-error-statics.test.ts
UNITS:
  - check-error-panel-status-text
  - check-error-panel-network-text
  - check-error-panel-socket-text
MIRROR: ./packages/web/src/statics/http-status/http-status-statics.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/statics/health-error/health-error-statics.ts ./packages/web/src/statics/health-error/health-error-statics.test.ts
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page". This chunk is the vocabulary behind node
  `#page-error-sad-raccoon` ("Error panel renders large sad raccoon + status code + RETRY").

  OBSERVABLES THIS MUST SERVE, VERBATIM:
  - `check-error-panel-status-text` [ui-state]: "When the endpoint responded 500, HEALTH_PAGE_ERROR renders
    the literal text 'HTTP 500'"
  - `check-error-panel-network-text` [ui-state]: "When the request failed before any status was received,
    HEALTH_PAGE_ERROR renders the literal text 'NO RESPONSE'"
  - `check-error-panel-socket-text` [ui-state]: "When the panel was triggered by a WebSocket close rather
    than a failed request, HEALTH_PAGE_ERROR renders the literal text 'CONNECTION LOST'"

  SHAPE — export `healthErrorStatics`, `as const`:
  - `socketClosedMessage: 'WebSocket connection lost'` — this string is ALREADY the literal
    `useHealthBinding` writes into its `error` on `closes$()`
    (`packages/web/src/bindings/use-health/use-health-binding.ts`, in the `closeSubscription` handler), and
    `use-health-binding.test.ts` already asserts it. Copy it EXACTLY; chunk 4 replaces the inline literal in
    the binding with a read of this key, and chunk 3 keys the `CONNECTION LOST` branch on it.
  - `labels.connectionLost: 'CONNECTION LOST'`
  - `labels.noResponse: 'NO RESPONSE'`
  - `labels.httpPrefix: 'HTTP '` — note the trailing space; chunk 3 builds `HTTP 500` as
    `` `${httpPrefix}${status}` ``.

  Do NOT put the status regex here — that is logic, and it belongs in the transformer in chunk 3.

  `statics/` may import only `statics/`. TEST: one `toStrictEqual` over the whole exported object.

## chunk 3 — healthErrorLabelTransformer: one failure message in, one panel label out
INTENT: Given the failure message `useHealthBinding` surfaces, the panel's headline label is derivable
deterministically and in exactly one place — `HTTP <status>` when a status came back, `CONNECTION LOST` when
the socket dropped, `NO RESPONSE` for anything else including a body that arrived but would not parse.
FILES:
  - ./packages/web/src/transformers/health-error-label/health-error-label-transformer.ts
  - ./packages/web/src/transformers/health-error-label/health-error-label-transformer.test.ts
UNITS:
  - check-error-panel-status-text
  - check-error-panel-network-text
  - check-error-panel-socket-text
  - check-error-panel-invalid-body-falls-back
MIRROR: ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/transformers/health-error-label/health-error-label-transformer.ts ./packages/web/src/transformers/health-error-label/health-error-label-transformer.test.ts
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page", node `#page-error-sad-raccoon`. The reader is on
  `/health`, something went wrong, and the page must say WHAT in three words rather than showing a blank
  table or a raw stack.

  OBSERVABLES THIS MUST SERVE, VERBATIM:
  - `check-error-panel-status-text`: "When the endpoint responded 500, HEALTH_PAGE_ERROR renders the literal
    text 'HTTP 500'"
  - `check-error-panel-network-text`: "When the request failed before any status was received,
    HEALTH_PAGE_ERROR renders the literal text 'NO RESPONSE'"
  - `check-error-panel-socket-text`: "When the panel was triggered by a WebSocket close rather than a failed
    request, HEALTH_PAGE_ERROR renders the literal text 'CONNECTION LOST'"
  - ADDED (flag this with an `ADDED:` line in your commit body) — `check-error-panel-invalid-body-falls-back`
    [ui-state]: "When the 200 body fails healthSnapshotContract parsing, HEALTH_PAGE_ERROR is visible and
    HEALTH_PAGE_ERROR_STATUS renders the literal text 'NO RESPONSE' — a body that arrived but cannot be used
    is reported the same as no usable response at all."

  SIGNATURE: `healthErrorLabelTransformer = ({ message }: { message: string }): DisplayLabel`. Inputs may be
  raw primitives; the RETURN must be branded. Reuse the EXISTING
  `displayLabelContract` from `./packages/web/src/contracts/display-label/display-label-contract.ts`
  ("branded string type for UI display labels") — do NOT mint a new contract for this.

  BRANCHES, in this order:
  1. `message === healthErrorStatics.socketClosedMessage` → `labels.connectionLost`.
  2. `/failed with status (\d+)$/u` matches → `` `${labels.httpPrefix}${captured}` ``.
  3. otherwise → `labels.noResponse`.

  WHERE THE MESSAGES ACTUALLY COME FROM — read these off disk, they are the real inputs, do not invent them:
  - HTTP failure: `fetchGetAdapter` (`packages/web/src/adapters/fetch/get/fetch-get-adapter.ts`) throws
    `` `GET ${url} failed with status ${String(response.status)}` ``, so the real 500 message is
    `'GET /api/health failed with status 500'`. Already pinned by
    `use-health-binding.test.ts` and `health-get-broker.test.ts`.
  - Network failure: the message is `'Failed to fetch'`, pinned by `use-health-binding.test.ts`'s
    "ERROR: {network error}" case.
  - Socket close: `healthErrorStatics.socketClosedMessage`.
  - Unparseable 200 body: `healthSnapshotContract.parse` throws, and the message is the multi-line ZodError
    JSON — the exact string is in `use-health-binding.test.ts`'s "INVALID: {200 body missing uptimeSeconds}"
    case. It falls through to `NO RESPONSE` by branch 3; assert that explicitly.

  Transformers are pure — NO `.proxy.ts` (see `format-uptime-transformer`, which has only `.ts` + `.test.ts`).
  Cover every branch: a 500, a 404 (proves the status is captured rather than hardcoded), `Failed to fetch`,
  the socket sentinel, the ZodError text, and an empty string.

## chunk 4 — useHealthBinding exports refresh, and takes its socket sentinel from statics
INTENT: The `/health` page can re-run the fetch on demand — the RETRY control has a function to call that
updates the same state the page renders — and the socket-close sentinel message is read from
`healthErrorStatics` rather than typed inline, so the transformer's `CONNECTION LOST` branch can never fall
out of sync with the string the binding actually writes.
FILES:
  - ./packages/web/src/bindings/use-health/use-health-binding.ts
  - ./packages/web/src/bindings/use-health/use-health-binding.test.ts
  - ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.test.tsx
UNITS:
  - check-retry-issues-one-get
  - check-retry-success-swaps-panels
  - check-retry-after-socket-loss-recovers
  - check-page-socket-close-shows-error
MIRROR: ./packages/web/src/bindings/use-guilds/use-guilds-binding.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/bindings/use-health/use-health-binding.ts ./packages/web/src/bindings/use-health/use-health-binding.test.ts ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — nodes `#retry-clicked` ("User clicks RETRY, page
  refetches") and `#page-ws-channel-closed` ("WebSocket closes while /health is mounted"). This binding is
  ALREADY BUILT and already shared with the header badge; this chunk is ADDITIVE ONLY. Do not restructure it,
  do not rename anything, do not change what it returns beyond adding one key.

  OBSERVABLES THIS SERVES, VERBATIM:
  - `check-retry-issues-one-get` [api-call]: "Clicking HEALTH_PAGE_RETRY issues exactly one GET /api/health
    across the whole app"
  - `check-retry-success-swaps-panels` [ui-state]: "When the retry returns 200 with a valid body,
    HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE appears"
  - `check-retry-after-socket-loss-recovers` [ui-state]: "When the panel was triggered by a WebSocket close
    and the retry returns 200 with a valid body, HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE
    reappears — an HTTP retry recovers the page without waiting for the socket"
  - `check-page-socket-close-shows-error` [ui-state]: "When the WebSocket close event fires while /health is
    mounted, HEALTH_PAGE_ERROR becomes visible within 1000ms"

  THE TWO EDITS, AND NOTHING ELSE:
  1. Add `refresh` to the returned object (`return { snapshot, isLoading, error, refresh };`) and to the
     declared return type as `refresh: () => Promise<void>`. `refresh` is the `useCallback` that ALREADY
     exists in this file — export it as-is. `useGuildsBinding` returns its fetcher under exactly this name
     (`return { guilds, loading, error, refresh: fetchGuilds };`), so follow that.

     **`refresh` MUST NOT set `isLoading` back to `true`.** It does not today, and it must stay that way:
     `check-retry-failure-keeps-panel` requires `HEALTH_PAGE_ERROR` to REMAIN visible across a failed retry,
     and re-raising `isLoading` tears the panel down and rebuilds it, which a synchronous assertion right
     after the click reads as "the panel disappeared".
  2. Replace the inline `'WebSocket connection lost'` literal in the `closes$()` subscription with
     `healthErrorStatics.socketClosedMessage` (chunk 2). `bindings/` may import `statics/`. The emitted value
     is byte-identical, so no existing assertion changes because of this.

  TEST WORK IN `use-health-binding.test.ts`:
  - Five existing cases assert `expect(result.current).toStrictEqual({ snapshot, isLoading, error })`. Each
    now needs `refresh: expect.any(Function)` added. `expect.any(Function)` is the one sanctioned exception
    to the no-`expect.any` rule ("can't compare functions"), so use it — do not switch to a weaker matcher.
  - ADD a case: after a `setupServerError()` mount settles, restage a good snapshot, call
    `result.current.refresh()` inside `testingLibraryActAdapter`, and assert (a) the request count went from
    1 to exactly 2, and (b) `result.current` is now the full success shape with the new snapshot and
    `error: null`. That is `check-retry-issues-one-get` + `check-retry-success-swaps-panels` at the binding
    level.
  - ADD a case for the socket path: mount successfully, `proxy.closeChannel()`, restage a snapshot, call
    `refresh()`, and assert the snapshot is back and `error` is `null` — `check-retry-after-socket-loss-recovers`.
  The proxy (`use-health-binding.proxy.ts`) already exposes `setupSnapshot`, `setupServerError`,
  `setupNetworkError`, `setupInvalidBody`, `getRequestCount`, `setupConnectedChannel`, `deliverWsMessage` and
  `closeChannel` — it needs NO change, which is why it is not in FILES.

  `server-health-badge-widget.test.tsx` IS in FILES purely so a break shows up inside this chunk rather than
  three chunks later. It reads the badge through its own widget proxy and never asserts the hook's return
  shape, so it is expected to need NO edit — if it goes red, that regression is yours.

## chunk 5 — HealthTableLayerWidget: the seven snapshot rows
INTENT: Given a parsed `HealthSnapshot`, the page renders `HEALTH_PAGE_TABLE` containing exactly the seven
rows named by the spec, each carrying its field's value rendered verbatim.
FILES:
  - ./packages/web/src/widgets/health-page/health-table-layer-widget.tsx
  - ./packages/web/src/widgets/health-page/health-table-layer-widget.proxy.tsx
  - ./packages/web/src/widgets/health-page/health-table-layer-widget.test.tsx
UNITS:
  - check-table-row-testids
  - check-table-values-verbatim
  - check-page-body-reaches-widget
MIRROR: ./packages/web/src/widgets/queue-page/queue-page-widget.tsx
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/health-page/health-table-layer-widget.tsx ./packages/web/src/widgets/health-page/health-table-layer-widget.proxy.tsx ./packages/web/src/widgets/health-page/health-table-layer-widget.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — node `#snapshot-table-rendered` ("Table renders all 7
  snapshot fields"). A reader has opened `/health`; the server answered; this is what they read.

  OBSERVABLES THIS MUST SATISFY, VERBATIM:
  - `check-table-row-testids` [ui-state]: "HEALTH_PAGE_TABLE renders exactly 7 rows with testids
    HEALTH_PAGE_ROW_STATUS, HEALTH_PAGE_ROW_TIMESTAMP, HEALTH_PAGE_ROW_UPTIME_SECONDS,
    HEALTH_PAGE_ROW_VERSION, HEALTH_PAGE_ROW_PORT, HEALTH_PAGE_ROW_HOME, HEALTH_PAGE_ROW_ORCHESTRATION_MODE"
  - `check-table-values-verbatim` [ui-state]: "Each row's value cell renders its field from the GET
    /api/health body verbatim — port 3737 renders as '3737' and orchestrationMode 'claude' renders as
    'claude'"
  - `check-page-body-reaches-widget` [ui-state]: "The 200 body parses with healthSnapshotContract and all 7
    fields reach the health page widget"

  THIS IS A LAYER WIDGET, and layers are allowed in `widgets/` — see the committed precedent
  `packages/web/src/widgets/markdown-text/markdown-span-layer-widget.tsx`, which is a props-only layer with
  its own proxy and test. Name it `health-table-layer-widget.tsx`, flat beside `health-page-widget.tsx` in
  the SAME folder (no subfolder), and export `HealthTableLayerWidget`.

  PROPS — one prop, the parsed snapshot: `export type HealthTableLayerWidgetProps = { snapshot: HealthSnapshot }`,
  `HealthSnapshot` imported as a TYPE from `@dungeonmaster/shared/contracts` (the implementation file may
  import contracts; the TEST file may not — there it is `ReturnType<typeof HealthSnapshotStub>`). This layer
  calls NO binding; chunk 7's page widget owns the binding and passes the snapshot down.

  RENDERING — a `Stack` carrying `data-testid="HEALTH_PAGE_TABLE"`, then
  `healthPageRowsStatics.rows.map(...)` (chunk 1) emitting one row per entry:
  `<div data-testid={row.rowTestId}>` containing a dim label `<span>{row.label}</span>` and a value
  `<span data-testid={row.valueTestId}>{String(snapshot[row.field])}</span>`. `String(...)` is what makes
  `port: 3737` render as `'3737'` and `orchestrationMode: 'claude'` render as `'claude'` — no formatting, no
  `formatUptimeTransformer` here (the table shows RAW `uptimeSeconds`; the compact `12m` token is the
  BADGE's job and belongs only there).

  Follow `QueuePageWidget`'s visual language for the row chrome: `emberDepthsThemeStatics` colours,
  `fontFamily: 'monospace'`, `colors['text-dim']` for the label, `colors.border` for the row separator.
  Extract every literal number (padding, font size, border width) to a module const, as `QueuePageWidget`
  does — no magic numbers inline.

  PROXY — `HealthTableLayerWidgetProxy` (`.proxy.tsx`), screen queries only, no binding to delegate to.
  Give it `getRowTestIds(): string[]` reading the rendered rows, and
  `getValueText({ valueTestId })`. `getRowTestIds` must query the SEVEN row testids specifically — the
  value cells use the `HEALTH_PAGE_VALUE_` prefix precisely so a `HEALTH_PAGE_ROW_` sweep returns 7, not 14.

  TEST — derive the expected testid list from `healthPageRowsStatics` (the rule against a hardcoded case list
  applies), render with `mantineRenderAdapter` and a `HealthSnapshotStub()`, and assert the seven testids
  with ONE `toStrictEqual` on the array. For the values, build the expected map from the stub's own fields
  and assert with one `toStrictEqual` — do not write seven separate `toBe` calls. Include an explicit case
  with `HealthSnapshotStub({ port: 3737, orchestrationMode: 'claude' })` proving those two render as the
  literal strings the observable names.

## chunk 6 — HealthErrorLayerWidget: the large sad raccoon, the label, the cause, and RETRY
INTENT: When the page has no usable snapshot, it renders one panel that says what went wrong in three words,
shows the underlying message beneath it, draws the sad raccoon large enough to read as a state and not a
decoration, and offers a control that re-runs the fetch.
FILES:
  - ./packages/web/src/widgets/health-page/health-error-layer-widget.tsx
  - ./packages/web/src/widgets/health-page/health-error-layer-widget.proxy.tsx
  - ./packages/web/src/widgets/health-page/health-error-layer-widget.test.tsx
UNITS:
  - check-error-sad-raccoon-large
  - check-retry-button-present
  - check-error-panel-status-text
  - check-error-panel-network-text
  - check-error-panel-socket-text
  - check-error-panel-invalid-body-falls-back
  - check-error-panel-detail-message
MIRROR: ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.tsx
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/health-page/health-error-layer-widget.tsx ./packages/web/src/widgets/health-page/health-error-layer-widget.proxy.tsx ./packages/web/src/widgets/health-page/health-error-layer-widget.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — node `#page-error-sad-raccoon` ("Error panel renders
  large sad raccoon + status code + RETRY"). Reached from a non-200, an unparseable body, a refused
  connection, OR a WebSocket close. Its outgoing edges are "user clicks RETRY" → `#retry-clicked` and "user
  clicks logo" → `#return-to-home`.

  OBSERVABLES THIS MUST SATISFY, VERBATIM:
  - `check-error-panel-status-text` [ui-state]: "When the endpoint responded 500, HEALTH_PAGE_ERROR renders
    the literal text 'HTTP 500'"
  - `check-error-panel-network-text` [ui-state]: "When the request failed before any status was received,
    HEALTH_PAGE_ERROR renders the literal text 'NO RESPONSE'"
  - `check-error-panel-socket-text` [ui-state]: "When the panel was triggered by a WebSocket close rather
    than a failed request, HEALTH_PAGE_ERROR renders the literal text 'CONNECTION LOST'"
  - `check-error-sad-raccoon-large` [ui-state]: "HEALTH_PAGE_SAD_RACCOON renders a PIXEL_SPRITE built from
    sadRaccoonPixelsStatics.pixels at scale 8"
  - `check-retry-button-present` [ui-state]: "HEALTH_PAGE_RETRY is visible and renders the text 'RETRY'"
  - ADDED (put an `ADDED:` line in your commit body naming both) —
    `check-error-panel-invalid-body-falls-back` [ui-state]: "When the 200 body fails healthSnapshotContract
    parsing, HEALTH_PAGE_ERROR is visible and HEALTH_PAGE_ERROR_STATUS renders the literal text 'NO
    RESPONSE' — a body that arrived but cannot be used is reported the same as no usable response at all."
    and `check-error-panel-detail-message` [ui-state]: "HEALTH_PAGE_ERROR_DETAIL renders the underlying
    failure message verbatim beneath the status label — 'GET /api/health failed with status 500' after a
    500 — so an operator reading a bare 'NO RESPONSE' can still see what actually went wrong."

  A LAYER WIDGET again (same folder, flat, `HealthErrorLayerWidget`), props only, no binding.
  `export type HealthErrorLayerWidgetProps = { message: ErrorMessage; onRetry: () => void }` — `ErrorMessage`
  imported as a type from `@dungeonmaster/shared/contracts` in the implementation, and as
  `ReturnType<typeof ErrorMessageStub>` in the test.

  STRUCTURE — an outer container `data-testid="HEALTH_PAGE_ERROR"` holding, in order:
  - `<div data-testid="HEALTH_PAGE_SAD_RACCOON">` wrapping a `PixelSpriteWidget` at **scale 8**;
  - `<Text data-testid="HEALTH_PAGE_ERROR_STATUS">{healthErrorLabelTransformer({ message })}</Text>` — the
    label from chunk 3;
  - `<Text data-testid="HEALTH_PAGE_ERROR_DETAIL">{message}</Text>` — the raw message, verbatim;
  - the RETRY control: `data-testid="HEALTH_PAGE_RETRY"`, text exactly `RETRY`, calling `onRetry` on click.

  THE SPRITE — copy the working call from
  `packages/web/src/widgets/server-health-badge/server-health-badge-widget.tsx` lines 22-26 and 48-55
  exactly, changing only the scale from 2 to 8. That file already solves the two things that bite here:
  `sadRaccoonPixelsStatics.pixels` is a readonly array of plain strings and must be mapped through
  `pixelCoordinateContract.parse` ONCE at module scope, and `scale` / `width` / `height` are
  `PixelDimension`-branded so the numeric literal and the statics dimensions need `as PixelDimension`.
  `PixelSpriteWidget` itself needs NO change and must not be edited.

  THE RETRY CONTROL — use the existing `PixelBtnWidget`
  (`packages/web/src/widgets/pixel-btn/pixel-btn-widget.tsx`): `label={buttonLabelContract.parse('RETRY')}`,
  `onClick={onRetry}`. It renders its own `data-testid="PIXEL_BTN"`, so wrap it in a
  `<div data-testid="HEALTH_PAGE_RETRY">` to give the observable the testid it names. Do NOT hand-roll a
  button and do NOT edit `PixelBtnWidget`.

  PROXY — `HealthErrorLayerWidgetProxy` composing `PixelSpriteWidgetProxy()` (mirror
  `server-health-badge-widget.proxy.tsx`, which does exactly this) plus screen helpers:
  `getStatusText()`, `getDetailText()`, `hasSadRaccoon()`, `getRetryLabel()`, and an async
  `clickRetry()` using `userEvent`. Semantic names, no exposed child proxies.

  TEST — one case per message shape, each rendering with a `jest.fn()`-free plain callback captured into a
  local array so the click assertion is on a real recorded call:
  `'GET /api/health failed with status 500'` → status `HTTP 500` AND detail equal to that same message
  verbatim; `'Failed to fetch'` → `NO RESPONSE`; `healthErrorStatics.socketClosedMessage` → `CONNECTION
  LOST`; the ZodError text from `use-health-binding.test.ts`'s invalid-body case → `NO RESPONSE`. Plus: the
  sprite renders at scale 8 (assert the rendered `PIXEL_SPRITE` style width, which `PixelSpriteWidget` sets
  to `scale`), RETRY renders the exact text `RETRY`, and clicking it invokes `onRetry` exactly once.

## chunk 7 — HealthPageWidget: the binding, the three-way branch, retry and the live tick
INTENT: `/health` is one page that fetches once on mount, shows a loading line until the first answer, then
shows EITHER the snapshot table OR the error panel and never both — refetching on every `health-updated`
tick, dropping to the error panel the moment the socket closes, and recovering over HTTP when the reader
clicks RETRY.
FILES:
  - ./packages/web/src/widgets/health-page/health-page-widget.tsx
  - ./packages/web/src/widgets/health-page/health-page-widget.proxy.tsx
  - ./packages/web/src/widgets/health-page/health-page-widget.test.tsx
UNITS:
  - check-page-initial-get
  - check-page-loading-before-first-response
  - check-page-body-reaches-widget
  - check-table-hides-error-panel
  - check-error-panel-replaces-table
  - check-page-network-error-branch
  - check-page-tick-refetch
  - check-page-uptime-advances
  - check-page-socket-close-blanks-table
  - check-page-socket-close-shows-error
  - check-retry-issues-one-get
  - check-retry-success-swaps-panels
  - check-retry-failure-keeps-panel
  - check-retry-after-socket-loss-recovers
MIRROR: ./packages/web/src/widgets/queue-page/queue-page-widget.tsx
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/health-page/health-page-widget.tsx ./packages/web/src/widgets/health-page/health-page-widget.proxy.tsx ./packages/web/src/widgets/health-page/health-page-widget.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — this chunk owns the spine of it: `#page-initial-fetch`
  ("Page binding fetches GET /api/health on mount"), the `#page-response-valid` decision, `#page-ws-tick`
  ("health-updated tick arrives, page refetches"), `#page-ws-channel-closed` ("WebSocket closes while /health
  is mounted") and `#retry-clicked` ("User clicks RETRY, page refetches").

  THE FILE ALREADY EXISTS and currently renders only a title. EXTEND it — its own PURPOSE header says "A
  later session extends this same file with the health table, error panel and retry control rather than
  creating a second page widget". Keep `data-testid="HEALTH_PAGE"` and the `HEALTH_PAGE_TITLE` / `SERVER
  HEALTH` heading exactly as they are; `health-page-widget.test.tsx` has three existing cases asserting them
  and they must keep passing.

  OBSERVABLES THIS MUST SATISFY, VERBATIM:
  - `check-page-initial-get` [api-call]: "Mounting /health issues exactly one GET /api/health across the
    whole app — the header badge is suppressed on this route, so no second binding fetches alongside the
    page"
  - `check-page-body-reaches-widget` [ui-state]: "The 200 body parses with healthSnapshotContract and all 7
    fields reach the health page widget"
  - `check-table-hides-error-panel` [ui-state]: "HEALTH_PAGE_ERROR is absent from the DOM while
    HEALTH_PAGE_TABLE is rendered"
  - `check-error-panel-replaces-table` [ui-state]: "HEALTH_PAGE_ERROR is visible and HEALTH_PAGE_TABLE is
    absent from the DOM"
  - `check-page-network-error-branch` [api-call]: "A refused connection to /api/health drives the page to the
    error branch rather than leaving the page blank"
  - `check-page-tick-refetch` [api-call]: "Each 'health-updated' tick while /health is mounted issues exactly
    one GET /api/health across the whole app, because the header badge is not mounted on this route"
  - `check-page-uptime-advances` [ui-state]: "HEALTH_PAGE_ROW_UPTIME_SECONDS renders a strictly larger
    integer after a tick than before it"
  - `check-page-socket-close-blanks-table` [ui-state]: "When the WebSocket close event fires while /health is
    mounted, HEALTH_PAGE_TABLE is removed from the DOM within 1000ms"
  - `check-page-socket-close-shows-error` [ui-state]: "When the WebSocket close event fires while /health is
    mounted, HEALTH_PAGE_ERROR becomes visible within 1000ms"
  - `check-retry-issues-one-get` [api-call]: "Clicking HEALTH_PAGE_RETRY issues exactly one GET /api/health
    across the whole app"
  - `check-retry-success-swaps-panels` [ui-state]: "When the retry returns 200 with a valid body,
    HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE appears"
  - `check-retry-failure-keeps-panel` [ui-state]: "When the retry also fails, HEALTH_PAGE_ERROR remains
    visible and HEALTH_PAGE_TABLE stays absent"
  - `check-retry-after-socket-loss-recovers` [ui-state]: "When the panel was triggered by a WebSocket close
    and the retry returns 200 with a valid body, HEALTH_PAGE_ERROR disappears and HEALTH_PAGE_TABLE
    reappears — an HTTP retry recovers the page without waiting for the socket"
  - ADDED (`ADDED:` line in the commit body) — `check-page-loading-before-first-response` [ui-state]: "While
    the first GET /api/health is still in flight, HEALTH_PAGE_LOADING is visible and neither
    HEALTH_PAGE_TABLE nor HEALTH_PAGE_ERROR is in the DOM — a page that has not heard back yet must not flash
    the sad raccoon on every normal load."

  THE BRANCH, exactly three arms and in this order — this is what makes the two mutual-exclusion observables
  true by construction:
  1. `isLoading` → render `HEALTH_PAGE_LOADING` (a dim monospace line, mirror `QUEUE_PAGE_LOADING` in
     `QueuePageWidget`). Neither table nor panel in the DOM.
  2. `snapshot !== null` → `<HealthTableLayerWidget snapshot={snapshot} />` (chunk 5). No error panel.
  3. otherwise → `<HealthErrorLayerWidget message={error ?? <fallback>} onRetry={refresh} />` (chunk 6).
  Never render both layers. Never render the panel while `isLoading` is true.

  THE BINDING is `useHealthBinding` (`packages/web/src/bindings/use-health/use-health-binding.ts`), which
  after chunk 4 returns `{ snapshot, isLoading, error, refresh }`. It ALREADY does everything the tick and
  socket nodes need, and you must not reimplement any of it: it fetches once on mount, subscribes to
  `webSocketChannelState.healthChanged$()` and refetches once per emission, and subscribes to
  `webSocketChannelState.closes$()` where it nulls the snapshot and sets the error. Call it once, in render.
  Wire RETRY to `refresh` — a broker in an event handler is legal, but here the state that must update lives
  in the binding, so `refresh` is the right call (`useQuestChatBinding.sendMessage` is the house precedent
  for an action hanging off a binding).

  DESIGN DECISIONS THAT CONSTRAIN THIS, QUOTED:
  - `#badge-hidden-on-health-route` — "The badge lives in the app shell, so without this it would mount on
    /health alongside the page and both bindings would independently fetch GET /api/health on mount and on
    every tick — 2 requests per tick. Suppressing the badge on that one route restores an exact
    1-fetch-per-tick count with almost no code and no shared cache." That suppression is ALREADY committed in
    `AppWidget` via `isHealthRouteGuard`; this page is therefore the sole fetcher on `/health`, which is why
    every count observable says "exactly one … across the whole app".
  - `#page-socket-loss-blanks-table` — "Once the socket drops, ticks stop and every number in the table is
    frozen at its last value with nothing on screen saying so … Treating socket loss exactly like a failed
    fetch reuses the sad-raccoon error panel and RETRY control that already exist … RETRY recovers over HTTP
    without waiting for the socket to come back."
  - `#tick-notifies-web-refetches` — "health-updated carries no payload; the web refetches over HTTP on every
    tick … One code path produces the snapshot shape (the HTTP responder) instead of two, so the WS envelope
    and the HTTP body can never disagree."

  PROXY — `HealthPageWidgetProxy` already exists (`health-page-widget.proxy.tsx`) with `hasHealthPage()` and
  `getTitleText()`. KEEP both (`AppWidgetProxy` calls `hasHealthPage`, and the existing tests use
  `getTitleText`) and EXTEND it to delegate to `useHealthBindingProxy()` — that is what registers the MSW
  handler for `GET /api/health` and gives you `setupSnapshot`, `setupServerError`, `setupNetworkError`,
  `setupInvalidBody`, `getRequestCount`, `setupConnectedChannel`, `deliverWsMessage`, `closeChannel`. Mirror
  `server-health-badge-widget.proxy.tsx` exactly, which is the same composition one flow over. Add UI
  helpers: `hasTable()`, `hasErrorPanel()`, `isLoadingVisible()`, `getUptimeValue(): number` reading
  `HEALTH_PAGE_VALUE_UPTIME_SECONDS` and `Number(...)`-ing it, `getErrorStatusText()`, and an async
  `clickRetry()`.

  `getUptimeValue` must read the VALUE cell, not the ROW — the row's `textContent` is
  `'UPTIME SECONDS745'` and `Number()` on that is `NaN`.

  TEST — every case creates a fresh proxy, calls `setupConnectedChannel()` FIRST, then stages the response,
  then renders with `mantineRenderAdapter`. Copy the act/waitFor rhythm from `use-health-binding.test.ts`:
  `testingLibraryActAdapter` around `deliverWsMessage` / `closeChannel` / `clickRetry`, and
  `testingLibraryWaitForAdapter` for anything asynchronous. For the tick case, stage
  `HealthSnapshotStub({ uptimeSeconds: 745 })`, assert the rendered value, restage
  `HealthSnapshotStub({ uptimeSeconds: 900 })`, deliver
  `{"type":"health-updated","payload":{},"timestamp":"..."}`, then assert the request count went 1 → 2 AND
  the rendered uptime is strictly larger than before.

  EXPECTED COLLATERAL, DO NOT FIX IT HERE: landing this makes
  `packages/web/src/widgets/app/app-widget.test.tsx` fail, because its `/health` case currently asserts
  `expect(proxy.getHealthRequestCount()).toBe(0)` — true only while the page never fetched. Chunk 8 owns that
  file and that fix. Do not edit it, and do not widen your ward scope to it.

## chunk 8 — the app shell: exactly one fetch on /health, and the logo back to home
INTENT: At the whole-app level, mounting `/health` produces exactly one `GET /api/health` — the page's, with
the badge contributing none — and clicking the logo from `/health` leaves the page and brings the badge back.
FILES:
  - ./packages/web/src/widgets/app/app-widget.proxy.tsx
  - ./packages/web/src/widgets/app/app-widget.test.tsx
UNITS:
  - check-page-initial-get
  - check-logo-returns-home
  - check-badge-remounts-on-leaving-health
MIRROR: ./packages/web/src/widgets/app/app-widget.test.tsx
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/app/app-widget.proxy.tsx ./packages/web/src/widgets/app/app-widget.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — nodes `#page-initial-fetch` and `#return-to-home` ("User
  clicks logo, routes to /", a terminal). This is the only level at which "across the whole app" can be
  measured, because it is the only test that mounts the header badge and the page together.

  OBSERVABLES THIS MUST SATISFY, VERBATIM:
  - `check-page-initial-get` [api-call]: "Mounting /health issues exactly one GET /api/health across the
    whole app — the header badge is suppressed on this route, so no second binding fetches alongside the
    page"
  - `check-logo-returns-home` [ui-state]: "Clicking LOGO_LINK from /health changes window.location.pathname
    to / and HEALTH_PAGE is removed from the DOM"
  - `check-badge-remounts-on-leaving-health` [ui-state]: "After routing from /health back to /,
    SERVER_HEALTH_BADGE reappears in the DOM — suppression is scoped to the /health route only"

  THE MSW COLLISION YOU MUST HANDLE FIRST, and the reason `app-widget.proxy.tsx` is in this chunk. After
  chunk 7, `HealthPageWidgetProxy` registers its own MSW handler for `GET /api/health`, and
  `ServerHealthBadgeWidgetProxy` already registers one. `EndpointMockListenResponder`
  (`packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts`) gives EACH
  `listen` call its own private `requestLog` and registers via MSW `server.use`, which PREPENDS — so the
  handler registered LAST answers every request, and only THAT control's counter moves. Two live listeners
  therefore means one counter silently reads 0.

  Fix it in `AppWidgetProxy` by making the health-page proxy the last one constructed and routing BOTH
  health-related methods through it: `setupHealthSnapshot` and `getHealthRequestCount` must both delegate to
  the health-page proxy, not to `healthBadgeProxy`. Keep constructing `ServerHealthBadgeWidgetProxy()` (it
  still supplies the sprite proxy and channel setup the badge needs) — just stop routing the two health
  methods through it. With one live handler, the count is correct on `/` (where the badge fetches) and on
  `/health` (where the page does), which is exactly what "across the whole app" means.

  TEST WORK in `app-widget.test.tsx` — `renderApp({ initialPath })` already exists at the top of the file and
  already registers `<Route path="/health" element={<HealthPageWidget />} />`; use it as-is.
  - FIX the existing case `'VALID: {/health} => badge is suppressed, issues zero health fetches, logo still
    centered'`: `expect(proxy.getHealthRequestCount()).toBe(0)` becomes `toBe(1)`, and the case name must
    change to say what is now true — the badge issues none, the PAGE issues exactly one, one across the whole
    app. Stage a snapshot with `setupHealthSnapshot` so the page settles. Keep the two assertions that still
    hold: `SERVER_HEALTH_BADGE` is `null`, and the logo row still has 3 children with `LOGO_LINK` at index 1.
    That case is now also the app-level half of `check-page-initial-get`.
  - ADD a case for `#return-to-home`: render at `/health`, wait for `isHealthPageVisible()`, then
    `await proxy.clickLogoLink()` inside `testingLibraryActAsyncAdapter`, then assert BOTH
    `isHealthPageVisible()` is `false` AND `isServerHealthBadgeVisible()` is `true`. Model the click/await
    rhythm on the existing `'VALID: {on session view route, click logo} => navigates back to home'` case a
    few hundred lines up.

  ON `window.location.pathname`: these tests run under `MemoryRouter`, which never touches
  `window.location` — so the jsdom half of `check-logo-returns-home` is asserted as "HEALTH_PAGE left the
  DOM and the home surface mounted", which is the same transition observed through the DOM. The literal
  pathname assertion belongs to the groundstomper's browser walk for this flow, which runs later in the
  ledger. Say this in your commit body so nobody reads the jsdom form as the whole story; do NOT restate the
  observable.

## chunk 9 — the real route tree mounts HEALTH_PAGE at /health, and nothing at an unrecognised path
INTENT: `/health` is reachable through the ACTUAL composed route tree — `AppFlow` → `AppLayoutResponder` →
`HealthFlow` → `AppHealthResponder` → `HealthPageWidget` — rendering `HEALTH_PAGE` inside
`APP_MAP_CONTAINER`, while a path the app does not recognise renders no health page at all.
FILES:
  - ./packages/web/src/flows/health/health-flow.integration.proxy.ts
  - ./packages/web/src/flows/health/health-flow.integration.test.tsx
UNITS:
  - check-health-route-mounts
  - check-health-route-not-notfound
MIRROR: ./packages/web/src/widgets/app/app-widget.test.tsx
WARD: npm run ward -- --only lint,typecheck,unit,integration -- ./packages/web/src/flows/health/health-flow.integration.proxy.ts ./packages/web/src/flows/health/health-flow.integration.test.tsx
NOTES:
  FLOW: `#health-detail-page` "Health Detail Page" — node `#health-route-renders` ("/health route mounts the
  health page"), the flow's entry state. Every other node in the flow is downstream of this one actually
  mounting.

  OBSERVABLES THIS MUST SATISFY, VERBATIM:
  - `check-health-route-mounts` [ui-state]: "Navigating to /health renders an element with data-testid
    HEALTH_PAGE inside APP_MAP_CONTAINER"
  - `check-health-route-not-notfound` [ui-state]: "Navigating to /health does not render the not-found
    surface that an unrecognised path renders"

  WHY THIS IS NOT ALREADY COVERED. The existing `health-flow.integration.test.tsx` only inspects
  `HealthFlow()`'s returned `Route` props and runs `matchPath` against the pattern — it never mounts
  anything, so it cannot see `APP_MAP_CONTAINER` and cannot tell you the route is actually composed into the
  tree. And `app-widget.test.tsx` builds its OWN `<Routes>` by hand, so it proves the widget, not the wiring.
  KEEP the four existing cases in this file and ADD the mounting ones beneath them.

  WHAT TO RENDER: the real `AppFlow` (`packages/web/src/flows/app/app-flow.tsx`) inside a `MemoryRouter`
  with `initialEntries={['/health']}`. `AppFlow` composes `HealthFlow()` under
  `<Route element={<AppLayoutResponder />}>`, and `AppLayoutResponder` IS `AppWidget` (a direct re-export),
  which renders `APP_MAP_CONTAINER` around its `<Outlet />`. Assert containment structurally —
  `screen.getByTestId('APP_MAP_CONTAINER').contains(screen.getByTestId('HEALTH_PAGE'))` is `true` — not just
  that both exist.

  THE NOT-FOUND HALF, and what it actually resolves to on this tree. `AppFlow` declares routes for `/`,
  `/health`, `/queue`, the quest-chat paths and the session-view paths, and there is NO catch-all `path="*"`
  route — so an unrecognised path matches nothing, the pathless layout route never renders, and the app
  renders NOTHING at all. That is the "not-found surface" this observable is measured against. Render
  `AppFlow` a second time at a path the tree cannot match (e.g. `/definitely-not-a-route`) and assert that
  neither `HEALTH_PAGE` nor `APP_MAP_CONTAINER` is in the DOM — which is precisely "what /health renders is
  not what an unrecognised path renders". Two renders, two assertions, no restatement of the observable
  needed.

  THE PROXY, and why this chunk has one. Mounting the real `AppFlow` mounts every binding the shell owns —
  the quest queue bar, the rate-limits stack, the home content's guilds/sessions, and the health page —
  and `StartEndpointMock` is configured with `onUnhandledRequest: 'error'`, so any endpoint without a
  handler throws. `AppWidgetProxy` (`packages/web/src/widgets/app/app-widget.proxy.tsx`) already composes
  every one of those proxies; build `health-flow.integration.proxy.ts` on top of it and expose only the few
  semantic helpers this test needs (`setupEmptyShell()`, `hasHealthPage()`, `hasMapContainer()`,
  `healthPageIsInsideMapContainer()`). A colocated `.integration.proxy` is the documented pattern for a
  flow integration test that needs complex setup — do not inline the setup into the test file, and do not
  stub or replace `AppFlow`.

  IF THIS TURNS OUT UNWORKABLE — an endpoint you cannot get a handler onto, a jsdom limitation in mounting
  the real tree — return `rework` naming exactly what blocked you. Do NOT quietly downgrade this to another
  `matchPath` assertion: a route-pattern check passing while the route is not composed into `AppFlow` is the
  exact failure this chunk exists to catch.
