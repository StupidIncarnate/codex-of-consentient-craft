# Round 1 — [codeweaver] Codeweaver: build this slice — web: server-health-badge

SUMMARY: This round builds the header badge end to end in the `web` package: a branded uptime-token
type and the transformer that produces it, a `healthGetBroker` over the already-live
`GET /api/health`, a `closes$` channel on `webSocketChannelState`, a `useHealthBinding` that seeds on
mount / refetches on every `health-updated` tick / flips to null on socket close, the
`ServerHealthBadgeWidget` itself, and the AppWidget wiring that drops it into the header's
already-empty left flex cell and suppresses it on `/health`.

Three things settled here rather than left to a worker. **First: the binding reports failure through
an `error` field, not through `console.error`.** `useRateLimitsBinding` logs from its inner catch and
its proxy has to install a `console.error` spy to stop tests throwing; doing the same here would put
TWO proxies onto `globalThis.console.error` inside one `AppWidgetProxy` construction, and it would
also make `#check-badge-parses-snapshot`'s "without writing anything to console.error" clause an
assertion about a log sink rather than about the code. A binding that never references `console` makes
that clause structurally true — a reader confirms it by the absence of the identifier in the file —
and the error path is proved by a real value (`error: null` on success, the message on failure)
instead. It also hands the `web: health-detail-page` session the error text its panel needs.
**Second: `webSocketChannelState` grows a `closes$` observable.** Nothing on the channel reports a
close today (`opens$` and `isConnected()` are all there is), and without one the badge cannot satisfy
`#check-socket-close-flips-offline`: when the server dies the ticks simply stop, so the badge would sit
on a frozen ONLINE uptime forever. The addition mirrors the existing `opensSubject` / `opens$` pair
line for line. It is new surface with no acceptance target in the spec, so this plan ADDED
`#check-close-routed-to-close-subject` to `#ws-channel-closed` (mirroring the wording of the existing
`#check-tick-routed-to-subject`) — chunk 3 owns it and its commit body must carry the `ADDED:` line.
**Third: the two logo-centering observables are met structurally at jest level and left to the browser
walk for their geometry.** jsdom performs no layout — `getBoundingClientRect()` returns zeros — so any
jsdom assertion about "within 2px of the viewport horizontal center" would be fabricated. The jest-level
guard is the structural invariant that actually produces the centering: the logo row still has exactly
three flex children, `LOGO_LINK` is still the middle one, and the badge lives INSIDE the pre-existing
left spacer cell rather than as a fourth sibling. Both halves are named in chunk 6's `NOTES`.

VERIFIED ON DISK, no chunk needed: every seam this brief marks ALREADY BUILT holds.
`packages/server/src/flows/health/health-flow.ts:19-22` routes `GET /api/health` through
`HealthCheckResponder`, which returns 200 + the seven-field snapshot or 500 + `{error}`
(`health-check-responder.ts:18-32`); `healthSnapshotBroker` assembles all seven fields
(`health-snapshot-broker.ts:23-31`); `ServerInitResponder` broadcasts `health-updated` with an empty
payload on `healthHeartbeatStatics.broadcast.intervalMs` and clears the interval on SIGTERM/SIGINT;
`webSocketChannelState.dispatchInbound` already carries the `health-updated` arm at
`web-socket-channel-state.ts:188-191`; and `#check-existing-smoke-assertion-holds` is already true —
`packages/web/src/flows/app/smoke.e2e.ts:17-25` asserts all seven keys with one `toStrictEqual`. No
repair chunk is warranted.

## chunk 1 — uptimeLabelContract and formatUptimeTransformer, the badge's duration token
INTENT: `formatUptimeTransformer({ seconds })` returns a branded `UptimeLabel` that is `'0s'` for 0,
`'45s'` for 45, `'1m'` for 60, `'12m'` for 745, `'1h0m'` for 3600 and `'1h2m'` for 3745 — the seconds
form applies strictly below 60 and the minutes form strictly below 3600.
FILES:
  - ./packages/web/src/contracts/uptime-label/uptime-label-contract.ts
  - ./packages/web/src/contracts/uptime-label/uptime-label-contract.test.ts
  - ./packages/web/src/contracts/uptime-label/uptime-label.stub.ts
  - ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts
  - ./packages/web/src/transformers/format-uptime/format-uptime-transformer.test.ts
UNITS:
  - "#check-uptime-format-zero"
  - "#check-uptime-format-seconds"
  - "#check-uptime-format-minutes"
  - "#check-uptime-format-hours"
  - "#check-uptime-format-one-minute-boundary"
  - "#check-uptime-format-one-hour-boundary"
MIRROR: ./packages/web/src/transformers/format-reset-duration/format-reset-duration-transformer.ts (and its contract trio at ./packages/web/src/contracts/reset-duration-label/)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/contracts/uptime-label/uptime-label-contract.ts ./packages/web/src/contracts/uptime-label/uptime-label-contract.test.ts ./packages/web/src/contracts/uptime-label/uptime-label.stub.ts ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts ./packages/web/src/transformers/format-uptime/format-uptime-transformer.test.ts
NOTES:
  FLOW: `#server-health-badge` "Server Health Badge in App Header". The user loads any page other
  than `/health` and the app header's left cell tells them whether the dungeonmaster server is alive:
  `[ ONLINE · 12m · v0.1.0 ]` when it answers, a sad-raccoon sprite plus `[ OFFLINE ]` when it does
  not. This chunk owns the `12m` token in the middle of that line — node `#badge-online`, the
  pure-function half. The rendered half (the same tokens read off the badge element) is chunk 5.

  OBSERVABLES, VERBATIM — these are the acceptance targets, all on `#badge-online`:
    - #check-uptime-format-seconds: "uptimeSeconds 45 renders in the badge as the token '45s'"
    - #check-uptime-format-minutes: "uptimeSeconds 745 renders in the badge as the token '12m'"
    - #check-uptime-format-hours: "uptimeSeconds 3745 renders in the badge as the token '1h2m'"
    - #check-uptime-format-zero: "uptimeSeconds 0 renders in the badge as the token '0s'"
    - #check-uptime-format-one-minute-boundary: "uptimeSeconds 60 renders in the badge as the token
      '1m', not '60s' — the seconds format applies strictly below 60"
    - #check-uptime-format-one-hour-boundary: "uptimeSeconds 3600 renders in the badge as the token
      '1h0m', not '60m' — the minutes format applies strictly below 3600"

  THE CONTRACT: `uptimeLabelContract = z.string().min(1).brand<'UptimeLabel'>()`, exported alongside
  `export type UptimeLabel = z.infer<typeof uptimeLabelContract>`. It exists because
  `@dungeonmaster/ban-primitives` forbids the transformer returning a raw `string`; it is NOT a reuse
  of `resetDurationLabelContract`, whose brand is a different domain (rate-limit reset windows, which
  emit days and never emit seconds). Copy `reset-duration-label-contract.ts`,
  `reset-duration-label-contract.test.ts` and `reset-duration-label.stub.ts` byte-for-byte in shape;
  the stub is `UptimeLabelStub({ value }: { value: string } = { value: '12m' }): UptimeLabel`.

  THE TRANSFORMER: `formatUptimeTransformer = ({ seconds }: { seconds: number }): UptimeLabel`.
  Inputs may be raw primitives; the RETURN must be branded. Three branches, in this order — extract
  `60` and `3600` to module constants (`MINUTE_SECONDS`, `HOUR_SECONDS`) exactly as
  `format-reset-duration-transformer.ts` does, no inline magic numbers:
    - `seconds < 60`  → `${seconds}s`
    - `seconds < 3600` → `${Math.floor(seconds / 60)}m`
    - otherwise        → `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}m`
  Note this is NOT the same ladder as `formatResetDurationTransformer`, which has a days branch, has
  no seconds branch, and floors at `'0m'` — do not copy its body, only its file shape.

  THE TEST: the six cases above differ only by an input literal with an identical body and assertion
  shape, so `get-testing-patterns` requires `it.each`, not six `it` blocks. The input list here is a
  hand-picked set of boundary values rather than the members of a union or an enum, so it is a
  legitimate inline `it.each` array — the derive-from-statics rule applies to finite membership sets,
  and there is no statics file enumerating "interesting uptimes". Keep the `VALID:` / `EDGE:` prefix
  and the `{input} => result` title shape so the substituted names still read. Assert with `.toBe()`
  on the exact string. Add at least one non-parameterised `EDGE:` case for a large value (e.g.
  `90061` → `'25h1m'`) proving the hours branch does not roll over into days the way the reset-duration
  ladder does.

## chunk 2 — healthGetBroker, the one GET the badge and the /health page both use
INTENT: `healthGetBroker()` resolves to a `HealthSnapshot` parsed from the `GET /api/health` 200 body,
and REJECTS on a non-200, on a network failure, and on a 200 whose body omits `uptimeSeconds`.
FILES:
  - ./packages/web/src/brokers/health/get/health-get-broker.ts
  - ./packages/web/src/brokers/health/get/health-get-broker.proxy.ts
  - ./packages/web/src/brokers/health/get/health-get-broker.test.ts
UNITS:
  - "#check-badge-parses-snapshot"
  - "#check-invalid-body-takes-offline-branch"
  - "#check-existing-smoke-assertion-holds"
MIRROR: ./packages/web/src/brokers/rate-limits/get/rate-limits-get-broker.ts (+ ./packages/web/src/brokers/quest/summary/quest-summary-broker.proxy.ts for the getRequestCount() accessor)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/brokers/health/get/health-get-broker.ts ./packages/web/src/brokers/health/get/health-get-broker.proxy.ts ./packages/web/src/brokers/health/get/health-get-broker.test.ts
NOTES:
  FLOW: `#server-health-badge`. Nodes `#badge-initial-fetch` → `#health-endpoint-serves-snapshot` →
  `#health-response-valid`. This chunk is the HTTP half of the badge's data path, and it is also what
  the `web: health-detail-page` session (operation item 9) will call — build it as the shared
  broker, not a badge-private one.

  OBSERVABLES, VERBATIM:
    - #check-badge-parses-snapshot (on #health-endpoint-serves-snapshot): "The badge binding parses
      the 200 body with healthSnapshotContract and renders it without writing anything to
      console.error"
    - #check-invalid-body-takes-offline-branch (on #health-response-valid): "A 200 response whose body
      omits uptimeSeconds fails healthSnapshotContract parsing and the badge takes the offline branch
      rather than rendering a partial snapshot"
    - #check-existing-smoke-assertion-holds (on #health-endpoint-serves-snapshot): "packages/web/src/
      flows/app/smoke.e2e.ts asserts the GET /api/health body with toStrictEqual over all 7 keys —
      status 'ok', an ISO-8601 timestamp, uptimeSeconds, version, port, home, orchestrationMode — and
      passes. Its current two-key toStrictEqual is widened as part of this quest; left unwidened it
      fails, because toStrictEqual rejects extra keys."

  `#check-existing-smoke-assertion-holds` IS ALREADY TRUE ON DISK and is listed here only so it has a
  graded home. `packages/web/src/flows/app/smoke.e2e.ts:17-25` already asserts all seven keys. DO NOT
  EDIT THAT FILE — it is not in your `FILES`. Your job for this unit is to READ it and confirm the
  seven keys it asserts are the same seven `healthSnapshotContract` parses, and to say so in your
  commit body with the line numbers. If they disagree, that IS a finding: report it, do not edit.

  THE CONTRACT you consume: `healthSnapshotContract` / `type HealthSnapshot` from
  `@dungeonmaster/shared/contracts` (source
  `packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts`, already committed). Seven
  fields, all required: `status` (literal `'ok'`), `timestamp` (ISO datetime), `uptimeSeconds`
  (non-negative int), `version` (non-empty string), `port`, `home`, `orchestrationMode`. Unknown keys
  are STRIPPED, not rejected. The stub is `HealthSnapshotStub` from the same barrel; its defaults are
  `uptimeSeconds: 745`, `version: '0.1.0'` — deliberately the exact pair `#check-badge-online-text`
  names, so downstream chunks can use the bare stub.

  THE IMPLEMENTATION:
    export const healthGetBroker = async (): Promise<HealthSnapshot> => {
      const body = await fetchGetAdapter<unknown>({ url: webConfigStatics.api.routes.health });
      return healthSnapshotContract.parse(body);
    };
  `webConfigStatics.api.routes.health` is `'/api/health'` and is already committed at
  `packages/web/src/statics/web-config/web-config-statics.ts:45`. `fetchGetAdapter`
  (`packages/web/src/adapters/fetch/get/fetch-get-adapter.ts:17-19`) ALREADY throws on a non-ok status
  — do not add your own status check. There is no `| null` return here: unlike
  `rateLimitsGetBroker`, "no data yet" is not a state this endpoint has, so every failure mode is a
  rejection and the binding above turns a rejection into the offline branch.

  THE PROXY: copy `rate-limits-get-broker.proxy.ts` for the `fetchGetAdapterProxy()` +
  `StartEndpointMock.listen({ method: 'get', url: webConfigStatics.api.routes.health })` shape, and
  copy `quest-summary-broker.proxy.ts` for the `getRequestCount(): RequestCount` accessor (`import type
  { RequestCount } from '@dungeonmaster/testing'`). Chunk 4 NEEDS `getRequestCount` to count the
  badge's GETs, so it is not optional here. Expose exactly:
    - `setupSnapshot({ snapshot })` → `endpoint.resolves({ data: snapshot })`
    - `setupInvalidBody()` → `endpoint.resolves({ data: <a 6-key body built from HealthSnapshotStub()
      with uptimeSeconds removed> })`, the body `#check-invalid-body-takes-offline-branch` names
    - `setupServerError()` → `endpoint.responds({ status: 500, body: { error: 'boom' } })`
    - `setupNetworkError()` → `endpoint.networkError()`
    - `getRequestCount()`
  Note `endpoint.resolves({ data })` sends `data` AS the body — this endpoint returns the snapshot at
  the top level, NOT wrapped in `{ snapshot }` the way `/api/rate-limits` does. Do not copy the
  wrapper.

  THE TEST: four cases — snapshot round-trips (`toStrictEqual` against the stub), 500 rejects,
  network error rejects, and the missing-`uptimeSeconds` body rejects. For the last one assert the
  rejection message matches the zod complaint about `uptimeSeconds` specifically
  (`rejects.toThrow(/uptimeSeconds/u)`), not a bare `/.+/u` — a `/.+/u` passes on any failure and
  would not distinguish "the contract caught a partial snapshot" from "the request blew up".

## chunk 3 — closes$ on webSocketChannelState, so a dead socket is observable
INTENT: `webSocketChannelState.closes$()` emits `undefined` exactly once each time the underlying
socket's close handler fires, and a subscriber registered before the close receives it.
FILES:
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.test.ts
UNITS:
  - "#check-close-routed-to-close-subject"
  - "#check-tick-routed-to-subject"
  - "#check-unrelated-type-ignored"
MIRROR: the existing `opensSubject` / `opens$` pair inside ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts ./packages/web/src/state/web-socket-channel/web-socket-channel-state.test.ts
NOTES:
  FLOW: `#server-health-badge`, node `#ws-channel-closed` — "WebSocket closes; no further health ticks
  arrive". This is the edge out of `#badge-online` labelled "socket drops". It matters because when the
  server dies the ticks simply STOP: nothing pushes, nothing fails, and a badge with no close signal
  sits on a frozen ONLINE uptime indefinitely. The close event is the only thing that can tell it
  otherwise.

  THIS CHUNK ADDS AN OBSERVABLE. `#check-close-routed-to-close-subject` did not exist in the approved
  spec; this plan added it, because `closes$` is new channel surface with no acceptance target
  otherwise. Your commit body MUST lead with an `ADDED:` line naming it. Verbatim:
    - #check-close-routed-to-close-subject: "webSocketChannelState routes the underlying socket's
      close event to a closes-channel Subject, which emits undefined exactly once per close; a
      consumer subscribed before the close receives that emission. Mirrors check-tick-routed-to-subject
      on the open/tick side, and is what gives the badge's offline flip a channel-level source instead
      of polling isConnected()."

  THE OTHER TWO UNITS ARE ALREADY SATISFIED and are listed so a regression is graded. Verbatim:
    - #check-tick-routed-to-subject: "webSocketChannelState routes an inbound 'health-updated' frame
      to its health-changed Subject, which emits undefined — the frame payload is discarded, not read"
    - #check-unrelated-type-ignored: "An inbound frame with type 'rate-limits-updated' produces zero
      emissions on the health-changed Subject"
  Both were built and reviewed in the `web: foundation` round (commit `7d2a152c`): the arm is at
  `web-socket-channel-state.ts:188-191`, the subject at `:79`, the getter `healthChanged$` at `:212`,
  and the covering tests are already in `web-socket-channel-state.test.ts`. Do not rewrite them; your
  obligation is that they still pass after your edit, and to say in the commit body that you read them.

  THE CONTRACT you are extending is `#health-channel-subject` HealthChannelSubject (event, modified),
  source `packages/web/src/state/web-socket-channel/web-socket-channel-state.ts`. Its three declared
  properties (`healthChangedSubject`, `dispatchArm`, `healthChanged`) are all present already; the
  closes channel is the addition this chunk makes on top.

  THE IMPLEMENTATION — three edits, each mirroring the `opensSubject` line directly above or below it:
    1. `closesSubject: SubjectAdapter<undefined>;` in the `internalState` type block, next to
       `opensSubject` (currently line 65), and `closesSubject: rxjsSubjectAdapter<undefined>(),` in the
       initialiser next to line 82.
    2. In `openConnection`'s `onClose` handler (currently lines 117-125): emit immediately after
       `internalState.isOpen = false; internalState.socket = null;` and BEFORE the
       `if (!internalState.shouldReconnect) return;` guard. Putting it after that guard is the bug to
       avoid — a `disconnect()`-initiated close would then be silent, and so would every close on a
       channel that is not re-arming.
    3. `closes$: (): ChannelObservable<undefined> => internalState.closesSubject.observable,` next to
       the existing `opens$` getter. Note `opens$` is deliberately NOT a plain getter (it merges a
       synthetic replay of the already-open state); `closes$` needs none of that — a consumer that
       missed a close has already been told by the fetch failing, and replaying a stale close would
       flip a healthy badge offline on mount. Keep it a plain observable getter.

  THE TEST: add a `describe` for the closes channel to the existing file. Use
  `webSocketChannelStateProxy()` (colocated, already exports `setupEmpty`, `connect`, `triggerOpen`,
  `triggerClose`) — construct it, `setupEmpty()`, `connect()`, `triggerOpen()`, subscribe to
  `closes$()` pushing into an array, `triggerClose()`, then assert the collected array with
  `toStrictEqual([undefined])`. That array assertion is what proves "exactly once"; a
  `toHaveBeenCalled` style check passes on a double-emit. Add a second case proving a subscriber
  registered on `closes$()` receives NOTHING when only a `health-updated` frame is delivered
  (`toStrictEqual([])`), so the two channels are not crossed. `triggerClose()` makes the channel
  schedule a real 3000ms reconnect `setTimeout`; the next test's `setupEmpty()` calls
  `webSocketChannelState.clear()` which clears it, so no jest fake-timer plumbing is needed — but do
  call `setupEmpty()` first in every test in the file, as the existing tests do.

## chunk 4 — useHealthBinding, the badge's live data
INTENT: `useHealthBinding()` issues exactly one `GET /api/health` on mount, exactly one more per
`health-updated` tick, resolves to `{ snapshot, isLoading: false, error: null }` on a valid 200, and to
`{ snapshot: null, isLoading: false, error: <message> }` on a failed request, an unparseable body, or a
WebSocket close.
FILES:
  - ./packages/web/src/bindings/use-health/use-health-binding.ts
  - ./packages/web/src/bindings/use-health/use-health-binding.proxy.ts
  - ./packages/web/src/bindings/use-health/use-health-binding.test.ts
UNITS:
  - "#check-badge-initial-get"
  - "#check-refetch-once-per-tick"
  - "#check-badge-parses-snapshot"
  - "#check-invalid-body-takes-offline-branch"
  - "#check-socket-close-flips-offline"
MIRROR: ./packages/web/src/bindings/use-rate-limits/use-rate-limits-binding.ts (+ .proxy.ts, + .test.ts)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/bindings/use-health/use-health-binding.ts ./packages/web/src/bindings/use-health/use-health-binding.proxy.ts ./packages/web/src/bindings/use-health/use-health-binding.test.ts
NOTES:
  FLOW: `#server-health-badge`, nodes `#badge-initial-fetch`, `#badge-refetch`, `#ws-channel-closed`.
  In user terms: the header badge is seeded by one GET when the shell mounts, then the server pushes a
  `health-updated` frame every 5000ms and the badge re-reads the endpoint — so the uptime visibly
  climbs while you watch — and if the socket drops, the badge stops claiming the server is up.

  OBSERVABLES, VERBATIM:
    - #check-badge-initial-get (#badge-initial-fetch): "Mounting the app shell on any pathname other
      than /health issues exactly one GET /api/health, before any WebSocket frame is delivered"
    - #check-refetch-once-per-tick (#badge-refetch): "Each 'health-updated' tick triggers exactly one
      additional GET /api/health"
    - #check-badge-parses-snapshot (#health-endpoint-serves-snapshot): "The badge binding parses the
      200 body with healthSnapshotContract and renders it without writing anything to console.error"
    - #check-invalid-body-takes-offline-branch (#health-response-valid): "A 200 response whose body
      omits uptimeSeconds fails healthSnapshotContract parsing and the badge takes the offline branch
      rather than rendering a partial snapshot"
    - #check-socket-close-flips-offline (#ws-channel-closed): "When the WebSocket close event fires,
      SERVER_HEALTH_BADGE flips to data-health-state=\"offline\" within 1000ms" — this chunk owns the
      STATE half (`snapshot` becomes null the moment `closes$` emits); chunk 5 owns the rendered
      `data-health-state` attribute.

  DESIGN DECISION constraining this chunk, quoted: `#tick-notifies-web-refetches` — "health-updated
  carries no payload; the web refetches over HTTP on every tick. This mirrors rate-limits-updated
  exactly: webSocketChannelState.dispatchInbound calls rateLimitsChangedSubject.next(undefined) and
  discards the payload, and useRateLimitsBinding responds by re-running its broker. One code path
  produces the snapshot shape (the HTTP responder) instead of two, so the WS envelope and the HTTP body
  can never disagree." And `#reconnect-is-existing-behaviour` — "webSocketChannelState already owns the
  connection lifecycle and reconnects on its own using webConfigStatics.websocket.reconnectDelayMs
  (3000). Once the socket is back, the next health tick arrives through the normal path and the badge
  refetches and recovers with no health-specific reconnect logic." So write NO reconnect logic here.

  THE SIGNATURE:
    export const useHealthBinding = (): {
      snapshot: HealthSnapshot | null;
      isLoading: boolean;
      error: ErrorMessage | null;
    }
  `HealthSnapshot` and `ErrorMessage` both come from `@dungeonmaster/shared/contracts`
  (`errorMessageContract` is the value form). A raw `string` in the return type is a
  `@dungeonmaster/ban-primitives` failure — brand it.

  THE IMPLEMENTATION: copy `use-rate-limits-binding.ts` and change three things.
    1. `refresh` sets `error` to `null` and `snapshot` to the result on success; on catch it sets
       `snapshot` to `null` AND `error` to
       `errorMessageContract.parse(error instanceof Error ? error.message : 'Failed to load health snapshot')`.
       Clearing the snapshot on failure is the difference from the rate-limits binding, which keeps the
       last good value — a badge that keeps rendering a stale ONLINE uptime after the server died is
       exactly the bug this flow exists to prevent.
    2. THIS BINDING MUST NOT REFERENCE `console` AT ALL. `use-rate-limits-binding.ts` logs from its
       catch and its proxy has to install a `registerSpyOn` on `globalThis.console.error` to keep tests
       from throwing; do not copy either. The error is reported through the returned `error` field
       instead, which is what makes `#check-badge-parses-snapshot`'s "without writing anything to
       console.error" clause structurally true — a reader confirms it by the identifier being absent
       from the file. It also avoids a second proxy landing on `globalThis.console.error` when chunk 6's
       `AppWidgetProxy` constructs the rate-limits and health binding proxies in the same test.
    3. The `useEffect` opens TWO subscriptions, both torn down in the cleanup: `healthChanged$()` →
       `refresh()`, and `closes$()` → set `snapshot` to `null` and `error` to
       `errorMessageContract.parse('WebSocket connection lost')`. `closes$` is chunk 3's addition —
       depend on it, do not re-add it. Do NOT set `isLoading` back to true on a close; the badge must
       flip straight to offline, not blank out.

  FOR THE NEXT SESSION: `web: health-detail-page` (operation item 9) renders 'HTTP 500', 'NO RESPONSE'
  and 'CONNECTION LOST' from these same failures and will likely EXTEND this binding with an option to
  distinguish an HTTP-status failure from a transport one. Leave the shape open — one `error` field, no
  badge-specific vocabulary baked in — and do not pre-build their branch.

  THE PROXY: mirror `use-rate-limits-binding.proxy.ts`'s composition of a broker proxy plus
  `webSocketChannelStateProxy`, MINUS the console spy. Spread chunk 2's `healthGetBrokerProxy()` (so
  `setupSnapshot` / `setupInvalidBody` / `setupServerError` / `setupNetworkError` / `getRequestCount`
  all surface), and add `setupConnectedChannel()` (`setupEmpty` → `connect` → `triggerOpen`),
  `deliverWsMessage({ data })`, and `closeChannel()` (delegating to the channel proxy's
  `triggerClose()`).

  THE TEST: mirror `use-rate-limits-binding.test.ts` — `testingLibraryRenderHookAdapter`,
  `testingLibraryWaitForAdapter`, `testingLibraryActAdapter`, whole-object `toStrictEqual` on
  `result.current`. Cases:
    - mount with a staged snapshot → `{ snapshot: HealthSnapshotStub(), isLoading: false, error: null }`
      AND `getRequestCount()` is 1, asserted BEFORE any frame is delivered (that ordering is literally
      what `#check-badge-initial-get` says).
    - deliver one `health-updated` frame (`JSON.stringify({ type: 'health-updated', payload: {},
      timestamp: '2026-05-05T13:00:00.000Z' })`) with a second, larger `uptimeSeconds` staged → the new
      snapshot lands AND `getRequestCount()` is exactly 2. Then deliver a second tick and assert 3 —
      one tick, one GET, no drift.
    - deliver a `rate-limits-updated` frame → `getRequestCount()` stays 1 and `result.current` is
      unchanged.
    - `setupInvalidBody()` → `{ snapshot: null, isLoading: false, error: <the zod message> }`. Assert
      the error VALUE, not merely that it is non-null.
    - `setupServerError()` and `setupNetworkError()` → snapshot null, error set.
    - `closeChannel()` after a successful mount → snapshot flips to null in place, `isLoading` stays
      false, error is `'WebSocket connection lost'`.

## chunk 5 — ServerHealthBadgeWidget, the header badge itself
INTENT: The badge renders `[ ONLINE · 12m · v0.1.0 ]` with `data-health-state="online"` for
`HealthSnapshotStub()`, and a scale-2 sad-raccoon `PIXEL_SPRITE` plus the exact text `[ OFFLINE ]` with
`data-health-state="offline"` when the snapshot is null — and in both states it is wrapped in a
`SERVER_HEALTH_BADGE_LINK` pointing at `/health`.
FILES:
  - ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.tsx
  - ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.proxy.tsx
  - ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.test.tsx
UNITS:
  - "#check-badge-online-state-attr"
  - "#check-badge-online-text"
  - "#check-badge-offline-state-attr"
  - "#check-badge-offline-text"
  - "#check-badge-sad-raccoon-sprite"
  - "#check-badge-clickable-while-offline"
  - "#check-socket-close-flips-offline"
  - "#check-badge-uptime-advances"
  - "#check-no-page-reload-on-tick"
  - "#check-uptime-format-seconds"
  - "#check-uptime-format-minutes"
  - "#check-uptime-format-hours"
  - "#check-uptime-format-zero"
  - "#check-uptime-format-one-minute-boundary"
  - "#check-uptime-format-one-hour-boundary"
MIRROR: ./packages/web/src/widgets/rate-limit-card/rate-limit-card-widget.tsx (bracketed monospace line) and ./packages/web/src/widgets/dumpster-raccoon/dumpster-raccoon-widget.tsx (PixelSpriteWidget wiring)
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.tsx ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.proxy.tsx ./packages/web/src/widgets/server-health-badge/server-health-badge-widget.test.tsx
NOTES:
  FLOW: `#server-health-badge`, nodes `#badge-online` and `#badge-offline-sad-raccoon`. This is the
  thing the user actually looks at: a one-line bracketed monospace readout in the top-left of every
  page, matching the rate-limit cards in the top-right, that says whether the server is answering and
  for how long it has been up — and that turns into a slumped raccoon when it is not.

  OBSERVABLES, VERBATIM:
    - #check-badge-online-state-attr: "SERVER_HEALTH_BADGE carries the attribute
      data-health-state=\"online\""
    - #check-badge-online-text: "With uptimeSeconds 745 and version '0.1.0', SERVER_HEALTH_BADGE
      renders the exact text '[ ONLINE · 12m · v0.1.0 ]'"
    - #check-badge-offline-state-attr: "SERVER_HEALTH_BADGE carries the attribute
      data-health-state=\"offline\""
    - #check-badge-offline-text: "SERVER_HEALTH_BADGE renders the exact text '[ OFFLINE ]'"
    - #check-badge-sad-raccoon-sprite: "A PIXEL_SPRITE element built from sadRaccoonPixelsStatics.pixels
      at scale 2 is visible inside SERVER_HEALTH_BADGE"
    - #check-badge-clickable-while-offline: "SERVER_HEALTH_BADGE_LINK is still present while offline
      and its href resolves to /health"
    - #check-socket-close-flips-offline: "When the WebSocket close event fires, SERVER_HEALTH_BADGE
      flips to data-health-state=\"offline\" within 1000ms"
    - #check-badge-uptime-advances: "After two consecutive ticks, the uptime token in
      SERVER_HEALTH_BADGE renders a strictly larger duration than it did before those ticks"
    - #check-no-page-reload-on-tick: "performance.getEntriesByType('navigation').length is 1 after
      three ticks, proving the badge updates in place with no page reload"
    - the six `#check-uptime-format-*` observables listed in chunk 1, whose text says "renders in the
      badge as the token" — chunk 1 proved the pure function, this chunk proves the rendered token.

  DESIGN DECISIONS constraining this chunk, quoted: `#sad-raccoon-is-pixel-statics` — "the sad raccoon
  is authored as a sibling statics array in the same 21x15 coordinate format and rendered through the
  existing PixelSpriteWidget, which needs no change." And `#dd-failure-ux` — "The user asked for the
  failure state to be a sad raccoon drawn from this repo's existing raccoon art."

  ALREADY-BUILT EXPORTS you wire into, read off disk:
    - `useHealthBinding` from `../../bindings/use-health/use-health-binding` — chunk 4.
    - `formatUptimeTransformer` from `../../transformers/format-uptime/format-uptime-transformer` —
      chunk 1.
    - `sadRaccoonPixelsStatics` from `../../statics/sad-raccoon-pixels/sad-raccoon-pixels-statics`,
      committed in the `web: foundation` round (commit `a338b6d4`). Shape:
      `{ dimensions: { width: 21, height: 15 }, pixels: readonly string[] }`, 98 entries, first entry
      `'5 5 #8a8a9a'`.
    - `PixelSpriteWidget` from `../pixel-sprite/pixel-sprite-widget`, props
      `{ pixels, scale, width, height, flip? }`. It renders one `<div data-testid="PIXEL_SPRITE">`
      whose `boxShadow` is the pixels joined as `${x*scale}px ${y*scale}px 0 0 ${color}` — it emits NO
      text, which is what keeps `#check-badge-offline-text`'s "exact text" exact.
    - `pixelCoordinateContract` from `../../contracts/pixel-coordinate/pixel-coordinate-contract` and
      `type PixelDimension` from `../../contracts/pixel-dimension/pixel-dimension-contract`.
    - `emberDepthsThemeStatics` from `../../statics/ember-depths-theme/ember-depths-theme-statics`.

  THE IMPLEMENTATION: copy `dumpster-raccoon-widget.tsx`'s module-level sprite prep verbatim in shape —
  `const sadRaccoonPixels = sadRaccoonPixelsStatics.pixels.map((p) => pixelCoordinateContract.parse(p));`
  outside the component, and `const BADGE_SPRITE_SCALE = 2;` passed as
  `scale={BADGE_SPRITE_SCALE as PixelDimension}` with `width` / `height` from
  `sadRaccoonPixelsStatics.dimensions` cast the same way. That `as PixelDimension` form is the
  established one in all three existing sprite call sites (`dumpster-raccoon`, `logo`, `chat-panel`);
  do not invent a different one.

    export const ServerHealthBadgeWidget = (): React.JSX.Element | null => {
      const { snapshot, isLoading } = useHealthBinding();
      if (isLoading) return null;
      ...
    }
  Returning `null` while loading is deliberate: the alternative — rendering the badge immediately —
  paints OFFLINE plus a sad raccoon for the duration of the first fetch on every single page load. No
  observable covers the loading state, and `#check-badge-mounted-in-header` is satisfied once the first
  response resolves.

  The rendered tree, once loaded, is a `<Link to="/health" data-testid="SERVER_HEALTH_BADGE_LINK">`
  (from `react-router-dom`, `style={{ textDecoration: 'none' }}` as `AppWidget`'s `LOGO_LINK` does)
  wrapping a `<Box data-testid="SERVER_HEALTH_BADGE" data-health-state={...}>`. Both states render the
  Link, which is what `#check-badge-clickable-while-offline` demands. Inside the Box:
    - `data-health-state` is `snapshot === null ? 'offline' : 'online'`.
    - offline only: the `PixelSpriteWidget`.
    - always: ONE `<Text ff="monospace" size="xs">` whose child is a SINGLE pre-built string —
      `snapshot === null ? '[ OFFLINE ]' : \`[ ONLINE · ${uptime} · v${snapshot.version} ]\`` where
      `uptime = formatUptimeTransformer({ seconds: Number(snapshot.uptimeSeconds) })`. Build it as one
      template literal, NOT as JSX fragments with `{' '}` between them: the observables demand exact
      text and JSX whitespace handling is where that quietly gains or loses a space. The separator is
      U+00B7 MIDDLE DOT `·`, and the version is prefixed with a literal lowercase `v`.
    - `whiteSpace: 'nowrap'`, and the colours from `emberDepthsThemeStatics.colors` — `text-dim` for
      the brackets/frame as `RateLimitCardWidget` uses, something in the danger register for the
      OFFLINE word. Keep it visually a sibling of the rate-limit cards in the opposite corner.

  THE PROXY: mirror `rate-limits-stack-widget.proxy.tsx` — construct `useHealthBindingProxy()` and
  re-expose its setup methods (`setupSnapshot`, `setupInvalidBody`, `setupNetworkError`,
  `setupConnectedChannel`, `deliverWsMessage`, `closeChannel`, `getRequestCount`) plus a
  `PixelSpriteWidgetProxy()` child construction for `enforce-proxy-child-creation`.

  THE TEST: `mantineRenderAdapter` wrapped in a `<MemoryRouter>` — the widget renders a `Link`, so an
  unwrapped render throws. Copy the wrapping from
  `./packages/web/src/widgets/queue-page/queue-page-widget.test.tsx`. Cases:
    - online: `getByTestId('SERVER_HEALTH_BADGE').getAttribute('data-health-state')` is `'online'` and
      `.textContent` is `'[ ONLINE · 12m · v0.1.0 ]'` from a bare `HealthSnapshotStub()` (whose
      defaults already are 745 / '0.1.0').
    - the six uptime tokens: `it.each` over `[[0,'0s'],[45,'45s'],[60,'1m'],[745,'12m'],
      [3600,'1h0m'],[3745,'1h2m']]`, staging `HealthSnapshotStub({ uptimeSeconds: n })` and asserting
      the WHOLE badge text (`'[ ONLINE · 45s · v0.1.0 ]'`), not a substring — `toContain` is banned and
      a substring check would pass on a badge that had dropped the version.
    - offline via `setupNetworkError()`: `data-health-state` is `'offline'`, `.textContent` is exactly
      `'[ OFFLINE ]'`, and `SERVER_HEALTH_BADGE_LINK` is present with `getAttribute('href')` `'/health'`.
    - offline via `setupInvalidBody()`: same offline assertions — this is the rendered half of
      `#check-invalid-body-takes-offline-branch`.
    - the sprite: `within(getByTestId('SERVER_HEALTH_BADGE')).getByTestId('PIXEL_SPRITE')`, and assert
      its `style.boxShadow` `toBe` the string you build IN THE TEST from
      `sadRaccoonPixelsStatics.pixels` at scale 2 (same `${x*2}px ${y*2}px 0 0 ${color}` join
      `PixelSpriteWidget` uses), plus `style.width` is `'2px'`. Deriving the expected value from the
      statics is what makes this fail if someone swaps in `raccoonWizardPixelsStatics` or scale 8;
      asserting merely that a `PIXEL_SPRITE` exists passes on both wrong sprites.
    - socket close: mount online, `closeChannel()` inside `testingLibraryActAdapter`, then
      `data-health-state` is `'offline'`. Capture the badge ELEMENT before the close and assert
      `getByTestId('SERVER_HEALTH_BADGE')` is `toBe` that same node afterwards — the flip happens in
      place.
    - uptime advances + no reload: mount at `uptimeSeconds: 45`, deliver two `health-updated` frames
      with 745 then 3745 staged, assert the badge text after each. Capture the badge element before the
      first tick and assert node identity is unchanged after both — that is the jest-level proof the
      badge updates in place. `#check-no-page-reload-on-tick` names
      `performance.getEntriesByType('navigation')`, which jsdom does not populate meaningfully; the
      navigation-entry count is the GROUNDSTOMPER's to assert in `*.e2e.ts`, and node identity is the
      falsifiable analogue available here. Say exactly that in your commit body — do not fake a
      `performance` assertion in jsdom.

## chunk 6 — the badge in AppWidget's left header cell, suppressed on /health
INTENT: On every pathname except `/health` the badge renders inside the logo row's pre-existing left
flex cell, immediately before `LOGO_LINK`; on `/health` it is absent from the DOM and issues zero
`GET /api/health`; and clicking it navigates to `/health`, where it unmounts itself.
FILES:
  - ./packages/web/src/guards/is-health-route/is-health-route-guard.ts
  - ./packages/web/src/guards/is-health-route/is-health-route-guard.test.ts
  - ./packages/web/src/widgets/app/app-widget.tsx
  - ./packages/web/src/widgets/app/app-widget.proxy.tsx
  - ./packages/web/src/widgets/app/app-widget.test.tsx
UNITS:
  - "#check-badge-mounted-in-header"
  - "#check-logo-stays-centered"
  - "#check-badge-absent-on-health-route"
  - "#check-no-badge-fetch-on-health-route"
  - "#check-logo-still-centered-without-badge"
  - "#check-badge-click-routes-to-health"
  - "#check-badge-unmounts-on-health-route"
MIRROR: the existing `RateLimitsStackWidget` right-hand cell inside ./packages/web/src/widgets/app/app-widget.tsx, and ./packages/web/src/guards/is-workspace-route/is-workspace-route-guard.ts
WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/web/src/guards/is-health-route/is-health-route-guard.ts ./packages/web/src/guards/is-health-route/is-health-route-guard.test.ts ./packages/web/src/widgets/app/app-widget.tsx ./packages/web/src/widgets/app/app-widget.proxy.tsx ./packages/web/src/widgets/app/app-widget.test.tsx
NOTES:
  FLOW: `#server-health-badge`, nodes `#app-shell-mount`, `#route-is-health-page`, `#badge-suppressed`
  and `#navigate-to-health-page`. This is the chunk that puts the badge on screen and takes it away
  again: it mounts in the header on every route, and clicking it takes the user to the `/health` detail
  page — where it removes itself, because that page is the health surface there.

  OBSERVABLES, VERBATIM:
    - #check-badge-mounted-in-header (#app-shell-mount): "On any pathname other than /health, an
      element with data-testid SERVER_HEALTH_BADGE is visible inside the app header logo row, in the
      left flex cell that sits before LOGO_LINK"
    - #check-logo-stays-centered (#app-shell-mount): "On a pathname where the badge renders, the
      horizontal center of LOGO_LINK's bounding box is within 2px of the viewport horizontal center"
    - #check-badge-absent-on-health-route (#badge-suppressed): "SERVER_HEALTH_BADGE is absent from the
      DOM while window.location.pathname is /health"
    - #check-no-badge-fetch-on-health-route (#badge-suppressed): "The badge binding issues zero GET
      /api/health requests while /health is mounted — every request to that route while on /health
      originates from the page binding"
    - #check-logo-still-centered-without-badge (#badge-suppressed): "With SERVER_HEALTH_BADGE absent on
      /health, the horizontal center of LOGO_LINK's bounding box is still within 2px of the viewport
      horizontal center — suppressing the badge does not shift the logo"
    - #check-badge-click-routes-to-health (#navigate-to-health-page): "Clicking SERVER_HEALTH_BADGE_LINK
      changes window.location.pathname to /health and mounts an element with data-testid HEALTH_PAGE"
    - #check-badge-unmounts-on-health-route (#navigate-to-health-page): "After the click lands on
      /health, SERVER_HEALTH_BADGE is removed from the DOM — the badge suppresses itself on the route
      it navigated to"

  DESIGN DECISIONS constraining this chunk, quoted: `#badge-sits-in-empty-header-cell` — "AppWidget's
  logo row is a three-cell flex: an empty left spacer div, the centered LogoWidget link, and a right
  cell holding RateLimitsStackWidget. The left spacer exists purely as the flex mirror of the
  rate-limits cell and renders nothing today, so the badge lands there as the natural left-hand
  counterpart with no layout restructuring and no risk of shifting the centered logo." And
  `#badge-hidden-on-health-route` — "The badge lives in the app shell, so without this it would mount
  on /health alongside the page and both bindings would independently fetch GET /api/health on mount
  and on every tick — 2 requests per tick. Suppressing the badge on that one route restores an exact
  1-fetch-per-tick count with almost no code and no shared cache."

  THE SUPPRESSION MUST BE A CONDITIONAL RENDER IN AppWidget, not an early return inside the badge
  widget. React forbids calling `useHealthBinding` conditionally, so a badge that mounts and then bails
  has ALREADY fired its GET — which is precisely what `#check-no-badge-fetch-on-health-route` forbids.
  `AppWidget` must not construct the element at all on `/health`.

  THE GUARD: `isHealthRouteGuard = ({ pathname }: { pathname?: string }): boolean`. Mirror
  `is-workspace-route-guard.ts` — same `pathname?` optional param, same `if (!pathname) return false`
  opener, path literal in a module constant. True for `'/health'` and `'/health/'`; false for `'/'`,
  `'/queue'`, `'/health/extra'`, `'/my-guild/health'`, `''` and an omitted `pathname` (omit the
  property entirely in that test case — `exactOptionalPropertyTypes` makes an explicit `undefined` a
  type error). The `'/health'` literal is duplicated between this guard, the `to="/health"` in chunk
  5's Link, and the `<Route path="/health">` already committed in
  `packages/web/src/flows/health/health-flow.tsx`; that mirrors how `/queue` is already duplicated
  between `queue-flow.tsx` and `QuestQueueBarWidget`, and the contract `#web-health-routes` explicitly
  states its `healthPagePath` "lives in the flow file rather than the statics file" — so do NOT hoist
  it into `webConfigStatics`.

  THE AppWidget EDIT — four changes, all inside the logo row (currently lines 56-78):
    1. Add `data-testid="APP_LOGO_ROW"` to the logo row div. It has no handle today, and both the
       structural centering assertions and the groundstomper's browser walk need one.
    2. The left spacer `<div style={{ flex: '1 1 0', minWidth: 0 }} />` becomes a populated cell:
       same `flex: '1 1 0', minWidth: 0`, plus `display: 'flex', justifyContent: 'flex-start'` — the
       exact mirror of the right cell's `justifyContent: 'flex-end'`. Keep it a self-closing-turned-
       container; do not add a wrapper, do not reorder the three children.
    3. Inside it: `{isHealthRoute ? null : <ServerHealthBadgeWidget />}`, with
       `const isHealthRoute = isHealthRouteGuard({ pathname: location.pathname });` next to the
       existing `isQuestRoute` line. `location` is already in scope from `useLocation()`.
    4. Import `ServerHealthBadgeWidget` from `../server-health-badge/server-health-badge-widget` and
       the guard from `../../guards/is-health-route/is-health-route-guard`.

  THE PROXY EDIT: `AppWidgetProxy` is constructed by EVERY test in `app-widget.test.tsx` and by
  `AppLayoutResponderProxy`, so adding the badge to `AppWidget` makes every one of those tests fetch
  `/api/health`. Construct `ServerHealthBadgeWidgetProxy()` in `AppWidgetProxy` so the MSW handler is
  registered (an unhandled request throws under `onUnhandledRequest: 'error'`). Do NOT stage a default
  response — mirror `RateLimitsStackWidgetProxy()`, which is already constructed there with nothing
  staged: the unconfigured endpoint answers 500, the broker rejects, and the badge renders offline,
  which none of the existing tests assert on. Re-expose `setupHealthSnapshot`,
  `getHealthRequestCount`, `isServerHealthBadgeVisible` (a `screen.queryByTestId(...) !== null` read,
  NOT a `getAttribute('data-testid')` tautology) and `clickServerHealthBadge`. Also alias
  `HealthPageWidgetProxy` alongside the existing `setupHomeContent` / `setupQuestChat` /
  `setupSessionView` aliases, since the new `/health` route renders it through the `Outlet`.

  THE TEST EDITS: extend the existing module-level `renderApp` helper to take
  `{ initialPath = '/' }: { initialPath?: string } = {}` and to declare a
  `<Route path="/health" element={<HealthPageWidget />} />` alongside the routes it already declares.
  Keep it ONE helper — `@dungeonmaster/forbid-non-exported-functions` fires on functions declared
  inside a test body, and a second module-level helper is avoidable churn. New cases, in a
  `describe('server health badge')`:
    - at `/` with a snapshot staged: `SERVER_HEALTH_BADGE` is visible; and the STRUCTURAL centering
      invariant — `APP_LOGO_ROW.children.length` is 3, `children[1]` is `toBe` the `LOGO_LINK` element,
      and `children[0].contains(badge)` is `true`. That triple is the jest-level content of
      `#check-badge-mounted-in-header` AND `#check-logo-stays-centered`: it fails if the badge lands as
      a fourth sibling, before the row, or in the right cell — each of which is what would actually
      move the logo. The literal "within 2px of the viewport horizontal center" half is BROWSER-ONLY
      (jsdom runs no layout, so `getBoundingClientRect()` returns zeros and any jsdom centering
      assertion is fabricated) and belongs to the groundstomper's `*.e2e.ts`. Say this in the commit
      body; do NOT write a `getBoundingClientRect` assertion here.
    - at `/health`: `SERVER_HEALTH_BADGE` is absent (`queryByTestId(...)` is `toBe(null)`),
      `getHealthRequestCount()` is `0`, and the same three-children / middle-`LOGO_LINK` structural
      assertion still holds — that last one is `#check-logo-still-centered-without-badge`'s jest half,
      and it is what proves suppression empties the cell rather than removing it.
    - at `/` then `clickServerHealthBadge()`: `HEALTH_PAGE` mounts and `SERVER_HEALTH_BADGE` is gone.
      Assert BOTH — the appearance alone passes on a build where the badge never suppresses itself.
    - the existing tests in this file must stay green. If one breaks because the badge now issues a
      request, fix it by staging through the proxy, never by removing the badge from the shared
      `renderApp`.
