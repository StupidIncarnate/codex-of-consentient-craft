# Round 1 — [codeweaver] Codeweaver: build this slice — server: health-detail-page

SUMMARY: This slice owns three nodes on flow `#health-detail-page` — `#page-endpoint-serves-snapshot`,
`#page-response-valid` and `#page-ws-tick` — and the SERVER half of all three is already on disk, built by
this branch's three earlier codeweaver operation items. I verified each against committed code rather than
the ledger, and two of the three are fully proven; the third is behaviourally correct but its distinguishing
clause is not asserted anywhere. **So this round is exactly one chunk: one test that pins the "not scoped"
half of `#check-tick-reaches-every-client`.** Everything else is a finding, recorded below so no worker
re-derives it and so the later `web` sessions know what they can rely on.

What I verified true on disk, with the file and the evidence:

1. **`#check-route-literals-pair` — server half DONE.** `packages/server/src/statics/api-routes/api-routes-statics.ts`
   line 11 is `health: { check: '/api/health' }`, and its colocated `api-routes-statics.test.ts` asserts the
   WHOLE exported object in one `toStrictEqual` (so the literal cannot drift and the key cannot be renamed
   without going red). `HealthFlow` mounts the route from that same constant
   (`packages/server/src/flows/health/health-flow.ts` line 19: `app.get(apiRoutesStatics.health.check, …)`),
   so the literal and the mounted path cannot disagree. The other half of the pairing —
   `webConfigStatics.api.routes.health` — does NOT exist yet
   (`packages/web/src/statics/web-config/web-config-statics.ts` has no `health` key) and belongs to operation
   item 7, "web: foundation", per contract `#web-health-routes`. **Do NOT add it here.** A server file cannot
   import `@dungeonmaster/web` and no web file imports `@dungeonmaster/server`, so no single unit test can
   hold both sides; the pairing is provable only from the web side or from a browser walk.
2. **`#check-page-500-takes-error-branch` — server half DONE.** `HealthCheckResponder`
   (`packages/server/src/responders/health/check/health-check-responder.ts`) wraps `healthSnapshotBroker` in
   a real try/catch and returns `{ status: 500, data: { error } }`, and `HealthFlow` passes both `result.data`
   and `result.status` through to `c.json`. `packages/server/src/flows/health/health-flow.integration.test.ts`
   drives BOTH branches through a real Hono `app.request('/api/health')` — its `ERROR:` case sets
   `DUNGEONMASTER_HOME='relative/path'` so `filePathContract`'s absolute-path refine throws for real (no
   mocking), and asserts `response.status === 500` plus the exact error string. So the page's error branch has
   a real 500 to react to.
3. **`#check-tick-reaches-every-client` — behaviour DONE, one clause UNASSERTED.** The heartbeat is at
   `server-init-responder.ts` lines 805-814 and calls `wsEventRelayBroadcastBroker({ clients, message })`,
   which (read at `brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.ts` lines 20-32) iterates
   the FULL `clients` set — not `clientSubscriptions`, not filtered by `PER_QUEST_EVENT_TYPES`. Five tests at
   `server-init-responder.test.ts:1224-1316` pin the cadence exactly (0 frames at 4999ms, 1 at 5000ms, 2 at
   10000ms), the exact wire envelope, fan-out to two clients, and no delivery after disconnect. **What no test
   distinguishes is the observable's own clause — "regardless of which route that client is viewing".** Both
   clients in the fan-out test are plain, unsubscribed connections, so they are indistinguishable to the
   server. The server receives no route information at all; the ONLY per-client state it holds is the
   `clientSubscriptions` map filled by `subscribe-quest` (a browser on a quest route subscribes; a browser on
   `/` or `/health` does not). That map IS the server-visible proxy for "which route this client is viewing",
   and nothing asserts the heartbeat ignores it. Chunk 1 closes exactly that.

Findings that are NOT chunks, recorded so nobody budgets work for them:

- **`/health` needs ZERO server route work, in both serving modes.** `server-init-responder.ts` lines 500-510
  are a single `app.get('*')` catch-all: any path that is not `/ws`, `/api` or `/api/*` either redirects to the
  vite web port preserving path+query (dogfood `npm run dev` / `npm run prod`, `serveWebBundle=false`) or is
  answered by `webBundleResponseBroker`, which returns `index.html` for every non-`/assets/` path as an SPA
  fallback (published `dungeonmaster start`, `serveWebBundle=true`). Both arms are already tested generically
  at `server-init-responder.test.ts:1056-1221` with a deep link (`/codex/quest/<id>?chat=hidden`). `/health` is
  one more such deep link. Node `#health-route-renders` and its `#check-health-route-mounts` /
  `#check-health-route-not-notfound` are WEB-attributed nodes and are a react-router concern, not a server one.
- **No observable was adjusted and none was added.** All three of this cell's targets are achievable as
  written, and I found no server-side outcome that flow `#health-detail-page` implies but nobody wrote down —
  the page's remaining nodes (`#page-ws-channel-closed`, `#page-error-sad-raccoon`, `#retry-clicked`,
  `#return-to-home`, `#snapshot-table-rendered`) are entirely browser-side and are owned by operation items
  8-9.
- **No repair chunk is warranted.** I read every commit body on this branch (`master..HEAD`, 22 commits) and
  found no shortfall against this cell's observables. Two prior reviews already caught and fixed the defects
  they found (a past-tense PURPOSE, two `process.env` leaks between jest test files).

Design choice I settled while reading, so the worker does not re-derive it: **the new test drives the
subscription through the real `subscribe-quest` WS message, not through a new proxy method.** Adding a
`simulateSubscribe` to `server-init-responder.proxy.ts` would be a second way to reach state that
`simulateMessage` already reaches, and the file's ~12 existing subscribe-quest tests all use the raw message.
See chunk 1's NOTES for the exact shape and the two timer hazards that shape avoids.

## chunk 1 — a quest-subscribed client and a plain client both get the 5000ms tick

INTENT: The `health-updated` heartbeat is proven to be UNSCOPED — a WebSocket client that has subscribed to a
quest and a client that has subscribed to nothing each receive exactly one `health-updated` frame from the
same 5000ms interval. A future change that routed the heartbeat through the per-quest subscription filter, or
that skipped clients carrying subscriptions, goes red.

FILES:
  - ./packages/server/src/responders/server/init/server-init-responder.test.ts

UNITS:
  - #check-tick-reaches-every-client

MIRROR: ./packages/server/src/responders/server/init/server-init-responder.test.ts itself — two blocks in it.
  For the timer half, the `health heartbeat broadcast` describe at lines 1224-1316 (`jest.useFakeTimers()` →
  `ServerInitResponderProxy()` → `callResponder()` → `simulateConnection` → `advanceTimersByTime` →
  `jest.useRealTimers()` → assert). For the subscription half and the counting assertion, the
  `websocket onMessage subscribe-quest concurrent subscriptions` test at lines 469-528 — specifically its
  `proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questIdX, workItems: [] }) })` staging (line 474), its
  `proxy.simulateMessage({ data: JSON.stringify({ type: 'subscribe-quest', questId }), ws: client })` (lines
  481-484), and its `sendMock.mock.calls.filter((c) => String(c[0]).includes('…')).length` counting idiom
  rolled into ONE `toStrictEqual` over an object of counts (lines 517-527).

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/responders/server/init/server-init-responder.test.ts

NOTES:
  **The flow, and where this chunk sits in it.** Flow `#health-detail-page` — "Health Detail Page". The user
  navigates to `/health` and sees the full seven-field health snapshot as a labelled table that stays live: the
  header badge is SUPPRESSED on this one route, so the page is the sole health surface and the sole fetcher.
  Every 5000ms the server pushes a `health-updated` WebSocket frame, the page refetches `GET /api/health` over
  HTTP, and `HEALTH_PAGE_ROW_UPTIME_SECONDS` visibly advances. This chunk is the SERVER half of node
  `#page-ws-tick` ("health-updated tick arrives, page refetches") — specifically the proof that the push
  reaches a browser sitting on `/health` exactly as it reaches a browser sitting on a quest route. The two
  WEB-attributed observables on this same node (`#check-page-tick-refetch`, `#check-page-uptime-advances`) are
  operation item 9's work: **do not build the web half, do not touch `packages/web`.**

  **The observable this chunk must satisfy, quoted VERBATIM — this is the acceptance target:**
  - `#check-tick-reaches-every-client`: "The server sends one 'health-updated' frame per connected WebSocket
    client per 5000ms interval, regardless of which route that client is viewing — the broadcast is not scoped
    to a page"

  **Why one more test, when five already exist.** The five tests at lines 1224-1316 already prove the first two
  clauses: "per 5000ms interval" (0 frames at 4999ms, 1 at 5000ms, 2 at 10000ms) and "one frame per connected
  client" (two clients, one frame each). They do NOT prove the third — "regardless of which route that client
  is viewing … not scoped to a page" — because both of their clients are plain, unsubscribed connections and
  are therefore indistinguishable to the server. The server is handed no route information by any WS message;
  the only per-client state it holds is `clientSubscriptions`, the `Map<WsClient, Set<QuestId>>` filled by
  `subscribe-quest` (declared at `server-init-responder.ts` line 92). A browser on a quest route subscribes; a
  browser on `/health` or `/` does not. So "which route the client is viewing" IS subscription state as far as
  this server can tell, and this test is the only place the "not scoped" clause becomes assertable.

  **The design decisions that constrain this chunk, quoted:**
  - `#server-broadcasts-tick-directly`: "ServerInitResponder already owns the connected-clients Set and already
    calls wsEventRelayBroadcastBroker for global events, so a 5000ms heartbeat can broadcast straight from
    there. Routing it through orchestrationEventsState instead would drag the orchestrator package into the
    quest for no behavioural gain — the orchestrator has no health state to own, and brokers there cannot
    import state/ so it would need a new bootstrap responder. Keeping the emit server-side holds the quest to
    web + server + shared."
  - `#tick-notifies-web-refetches`: "health-updated carries no payload; the web refetches over HTTP on every
    tick … One code path produces the snapshot shape (the HTTP responder) instead of two, so the WS envelope
    and the HTTP body can never disagree."
  - `#heartbeat-interval-5000ms`: "Matches the cadence of the existing rate-limits watcher poll, so the two
    live surfaces in the header update on a comparable rhythm and a stalled badge is visually obvious within a
    few seconds."

  **The contract on the wire**, from the quest verbatim — `#health-updated-event` / `HealthUpdatedEvent`:
  `type: OrchestrationEventType = "health-updated"` (already a member of `orchestrationEventTypeContract`),
  `payload: WsMessagePayload` — "Empty object. The tick is a notification, not a data push",
  `timestamp: IsoTimestamp`. The serialized frame on the wire is exactly
  `{"type":"health-updated","payload":{},"timestamp":"<ISO 8601>"}`.

  **THIS CHUNK ADDS A TEST AND NOTHING ELSE. Do not edit `server-init-responder.ts`.** The production
  behaviour is already correct and already committed — I read it. Lines 805-814 build the envelope with
  `wsMessageContract.parse({ type: 'health-updated', payload: {}, timestamp: … })` and hand it to
  `wsEventRelayBroadcastBroker({ clients, message })`; that broker
  (`brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.ts`, signature
  `({ clients, message }: { clients: Set<WsClient>; message: WsMessage }) => Set<WsClient>`) serializes once
  and sends to every member of `clients`, deleting any whose `send` throws. `health-updated` is deliberately
  NOT in `PER_QUEST_EVENT_TYPES` (line 66) and must not be added to it. If your run shows the test failing,
  read the failure before touching source — a red first run here most likely means one of the two timer
  hazards below, not a production bug.

  **The already-built exports and helpers you wire into — every name below was read off disk, none guessed.
  All of them are ALREADY IMPORTED in this test file; add NO new imports:**
  - `ServerInitResponderProxy` — `./server-init-responder.proxy` (test file line 17). Methods you need, all
    existing: `callResponder()`, `simulateConnection({ client })`, `simulateMessage({ data, ws })`,
    `setupLoadQuestSuccess({ quest })`. Its constructor already stages `portResolveBrokerProxy` at 3737 and a
    `Date.prototype.toISOString` spy returning `'2024-01-01T00:00:00.000Z'`.
  - `WsClientStub` — `../../../contracts/ws-client/ws-client.stub` (test file line 16). Used as
    `WsClientStub({ send: sendMock })` where `sendMock` is a bare `jest.fn()` — the established form in this
    file (lines 25-26).
  - `QuestStub`, `QuestIdStub` — `@dungeonmaster/shared/contracts` (test file lines 8-9).

  **The test — ONE new `it` appended INSIDE the existing `describe('health heartbeat broadcast', …)` block, so
  it goes after the last `it`'s closing `});` at line 1315 and before that describe's closing `});` at line
  1316.** Name it in the file's established style, e.g.
  `VALID: {one client subscribed to a quest, one subscribed to nothing} => both receive exactly one health-updated frame`.

  Shape, in order — the ordering is load-bearing and both hazards below are real:

  1. `jest.useFakeTimers();` **FIRST, before `ServerInitResponderProxy()`.** The heartbeat's `setInterval` is
     created inside `ServerInitResponder(...)`, which `callResponder()` invokes. Install fake timers after that
     and the interval is a REAL one that `advanceTimersByTime` can never drive — the test would hang or see
     zero frames. (HAZARD 1.)
  2. `const proxy = ServerInitResponderProxy();`
  3. `const questId = QuestIdStub({ value: 'quest-health-unscoped' });`
  4. `proxy.setupLoadQuestSuccess({ quest: QuestStub({ id: questId, workItems: [] }) });` — REQUIRED. The
     `subscribe-quest` handler kicks off `orchestratorLoadQuestAdapter({ questId })` and `registerMock` throws
     on an unstaged call. `workItems: []` is what the concurrent-subscriptions test at line 474 uses and it
     means the replay loop iterates nothing. You should NOT need `proxy.setupReplaySuccess()` for the same
     reason; add it only if the run tells you otherwise.
  5. `proxy.callResponder();`
  6. Two `jest.fn()` send mocks and two `WsClientStub`s — name them for their roles, e.g.
     `subscribedSend` / `plainSend`, `subscribedClient` / `plainClient`. Two `proxy.simulateConnection` calls.
  7. `proxy.simulateMessage({ data: JSON.stringify({ type: 'subscribe-quest', questId }), ws: subscribedClient });`
     — the subscription is registered SYNCHRONOUSLY inside the handler (`server-init-responder.ts` lines
     221-223, `clientSubscriptions.set(subWs, existing)`), before the async quest-load chain starts, so it is
     in place the moment this line returns.
  8. `await jest.advanceTimersByTimeAsync(5000);` — the test is `async`. Use the **Async** form so the
     subscribe-quest promise chain's microtasks flush between timer ticks instead of trailing into the next
     test. Jest 30 is in this repo's devDependencies so the API is available, but **no file in this repo uses
     `advanceTimersByTimeAsync` today — you are the first**. If it does not behave, the plain synchronous
     `jest.advanceTimersByTime(5000)` is a safe fallback for this specific assertion: the counting shape in
     step 10 counts only `health-updated` frames, so whether the replay chain's own frames have landed yet
     changes nothing about the numbers. Say in your commit body which form you used.
  9. `jest.useRealTimers();` — BEFORE the `expect`, so a failing assertion cannot leave fake timers installed
     for the next test in the file. (HAZARD 2 — the five existing heartbeat tests all do this.)
  10. Count, then assert once. Mirror lines 517-527's idiom exactly:
      ```ts
      const subscribedTicks = subscribedSend.mock.calls.filter((c) =>
        String(c[0]).includes('"type":"health-updated"'),
      ).length;
      const plainTicks = plainSend.mock.calls.filter((c) =>
        String(c[0]).includes('"type":"health-updated"'),
      ).length;

      expect({ subscribedTicks, plainTicks }).toStrictEqual({ subscribedTicks: 1, plainTicks: 1 });
      ```
      **Count, do not `toStrictEqual` the raw call list here.** The subscribed client also receives a
      `quest-modified` frame from the subscribe replay, so a whole-list assertion would be pinning replay
      behaviour that four other tests in this file already own, and would go red for reasons that have nothing
      to do with the heartbeat. The exact `health-updated` envelope is already asserted byte-for-byte by the
      first test in this describe block (line 1238-1240) — do not re-assert it.

  **What makes this test fail, i.e. why it is not a tautology.** `subscribedTicks: 1` is the whole point: it
  goes red if the heartbeat is ever routed through `clientSubscriptions` with a questId filter, or gated on a
  client having no subscriptions. `plainTicks: 1` guards the mirror case. A `0` on either side, or a `2`, is a
  real regression. Note the two counts differ in what they prove and both are needed — dropping either one
  collapses the test back into the existing fan-out test.

  **Conventions this file already follows, so match them:** no `beforeEach`/`afterEach`, no conditionals
  (`if`/ternary/`&&`/`switch`/`try`) anywhere in a test body — the `.filter((c) => …)` arrow above is an
  existing, lint-passing idiom in this same file and is not a conditional. No `toHaveLength`, no `toContain`,
  no `.not.*`, no `expect.any`. Do NOT reach for `registerMock`/`registerSpyOn` in the test file, and do NOT
  add a method to `server-init-responder.proxy.ts` — everything above is reachable through the four existing
  proxy methods named earlier.

  **Before ward: run `npm run build` as its OWN command and confirm it exits 0** (unpiped — piping discards
  the exit code and feeds a stale `dist/` into ward as phantom type errors). Then run the WARD line above
  ONCE, in the foreground, with `timeout: 600000`.
