# Round 1 — [codeweaver] Codeweaver: build this slice — server: server-health-badge

SUMMARY: This slice owns three nodes — `#health-endpoint-serves-snapshot`, `#health-response-valid` and
`#ws-health-tick` — and the first two are ALREADY TRUE on disk. I verified them against committed code,
not against the ledger: `healthSnapshotBroker` assembles the seven fields from the five real sources
(`packages/server/src/brokers/health/snapshot/health-snapshot-broker.ts`), `HealthCheckResponder` owns the
200/500 split, `HealthFlow` delegates to it, and `health-flow.integration.test.ts` drives BOTH branches
through a real Hono request — its 200 case destructures `uptimeSeconds` out and `toStrictEqual`s the other
six (which is what pins "keys are exactly …" at seven), brackets uptime between two `Math.floor(process.uptime())`
reads, and asserts `version '0.1.0'`, `port 4800`, the temp `home`, `orchestrationMode 'node'`; its 500 case
drives a genuine assembly failure through `DUNGEONMASTER_HOME='relative/path'`. The web-attributed
`#check-existing-smoke-assertion-holds` is also already widened to the 7-key body in
`packages/web/src/flows/app/smoke.e2e.ts`. **No repair chunk is warranted, so this round is exactly one
chunk: the 5000ms `health-updated` heartbeat, which nothing in the tree emits today.**

Design choices settled while reading the tree, so no worker re-derives them:

1. **The timer lives INLINE in `ServerInitResponder`, not behind a new broker.** Design decision
   `#server-broadcasts-tick-directly` puts it there ("ServerInitResponder already owns the connected-clients
   Set and already calls wsEventRelayBroadcastBroker for global events"), and the file already builds a
   `wsMessageContract` envelope inline in seven places and already runs one `setInterval` (the 100ms
   chat-output flush) in exactly this shape. A wrapper broker over `wsEventRelayBroadcastBroker` — which
   already takes `{clients, message}` and already owns dead-client removal — would be a five-line
   indirection whose only new content is the envelope literal, and the responder unit test proves that
   literal end-to-end anyway.
2. **No `if (clients.size === 0) return` gate.** `wsEventRelayBroadcastBroker` iterates an empty Set as a
   no-op; a gate would add an untested branch to save one `Date` + one zod parse per 5 seconds. Do not add
   one — this is a decision, not an oversight.
3. **The interval handle is cleared in BOTH signal handlers, mirroring `flushIntervalHandle`.** Those two
   `clearInterval(flushIntervalHandle)` lines are the file's established shutdown shape and are themselves
   untested (no test drives SIGTERM, because the handler ends in `process.exit(0)` and would take the jest
   worker with it). Mirroring an untested-but-established line is correct; inventing a `process.exit` spy in
   the shared proxy to test it would change mocking for all ~35 tests in that file for two lines of hygiene.
   Do NOT add that spy.
4. **Cadence is proven by advancing fake timers, not by comparing wall-clock timestamps.** The proxy stubs
   `Date.prototype.toISOString` to a fixed literal, so two frames can carry the same timestamp; advancing to
   4999ms (zero frames), 5000ms (one) and 10000ms (two) proves the interval EXACTLY, which is strictly
   stronger than the observable's "5000ms ± 500ms".
5. **No spec observable was added and none was adjusted.** Both of this round's targets are achievable as
   written.

## chunk 1 — the 5000ms `health-updated` heartbeat in `ServerInitResponder`

INTENT: A connected WebSocket client receives a `health-updated` frame every 5000ms — the first one at
5000ms and not before, one per interval after that, one per connected client, none after it disconnects —
and the frame on the wire is exactly `{"type":"health-updated","payload":{},"timestamp":"<ISO 8601>"}`.

FILES:
  - ./packages/server/src/responders/server/init/server-init-responder.ts
  - ./packages/server/src/responders/server/init/server-init-responder.test.ts
  - ./packages/server/CLAUDE.md

UNITS:
  - #check-tick-broadcast-cadence
  - #check-tick-envelope-shape

MIRROR: ./packages/server/src/responders/server/init/server-init-responder.ts itself — the
  `flushIntervalHandle` block at lines 771-800 (a `setInterval` over a named constant, whose handle is
  cleared in both signal handlers) and the `wsMessageContract.parse({type, payload, timestamp})` envelope
  literal at lines 812-816. For the test, the same file's `.test.ts` at lines 96-129: the
  `jest.useFakeTimers()` → `ServerInitResponderProxy()` → `callResponder()` → `simulateConnection` →
  `advanceTimersByTime` → `useRealTimers()` → assert-on-`sendMock.mock.calls` shape.

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/responders/server/init/server-init-responder.ts ./packages/server/src/responders/server/init/server-init-responder.test.ts

NOTES:
  **The flow, and where this chunk sits in it.** Flow `#server-health-badge` — "Server Health Badge in App
  Header". The user is on any page other than `/health` and sees a live `[ ONLINE · 12m · v0.1.0 ]` badge in
  the header; the server pushes a tick every 5000ms, the web channel routes it to a Subject, the badge
  binding refetches `GET /api/health`, and the uptime token visibly advances without a page reload. This
  chunk is the SERVER HALF of node `#ws-health-tick` ("Server broadcasts health-updated every 5000ms; web
  channel routes it") — the thing that does the pushing. It is the only unbuilt server work on this flow.

  **The two observables this chunk must satisfy, verbatim — these are the acceptance targets:**
  - `#check-tick-broadcast-cadence`: "The server sends a WebSocket frame with type 'health-updated' to every
    connected client on a 5000ms interval; two consecutive frames arrive 5000ms ± 500ms apart"
  - `#check-tick-envelope-shape`: "The broadcast frame is JSON matching wsMessageContract with type
    'health-updated', an empty payload object, and a timestamp that is an ISO 8601 datetime string"

  **A third observable, owned by the NEXT operation item, that this chunk's fan-out test also settles** —
  `#check-tick-reaches-every-client` on node `#page-ws-tick` of flow `#health-detail-page`: "The server sends
  one 'health-updated' frame per connected WebSocket client per 5000ms interval, regardless of which route
  that client is viewing — the broadcast is not scoped to a page". That is why the two-client test below is
  not optional padding: it is the only place the "not scoped" half is provable. Do NOT build anything else
  for that flow — it is a different session's slice.

  **The design decisions that constrain this chunk, quoted:**
  - `#server-broadcasts-tick-directly`: "ServerInitResponder already owns the connected-clients Set and
    already calls wsEventRelayBroadcastBroker for global events, so a 5000ms heartbeat can broadcast straight
    from there. Routing it through orchestrationEventsState instead would drag the orchestrator package into
    the quest for no behavioural gain — the orchestrator has no health state to own, and brokers there cannot
    import state/ so it would need a new bootstrap responder. Keeping the emit server-side holds the quest to
    web + server + shared."
  - `#tick-notifies-web-refetches`: "health-updated carries no payload; the web refetches over HTTP on every
    tick … One code path produces the snapshot shape (the HTTP responder) instead of two, so the WS envelope
    and the HTTP body can never disagree." **The payload is `{}`. Do not put a snapshot, a uptime, or a
    questId in it.**
  - `#heartbeat-interval-5000ms`: "Matches the cadence of the existing rate-limits watcher poll … Fast enough
    that uptimeSeconds visibly advances during a manual walk-through, slow enough that the refetch-per-tick
    cost stays trivial."

  **The contract half already on the wire**, from the quest, verbatim — `#health-updated-event` /
  `HealthUpdatedEvent` (event, modified): `type: OrchestrationEventType = "health-updated"`,
  `payload: WsMessagePayload` — "Empty object. The tick is a notification, not a data push", and
  `timestamp: IsoTimestamp` — "ISO 8601 datetime string stamped when the frame is built, required by
  wsMessageContract." The enum member is ALREADY committed (`orchestration-event-type-contract.ts` line 41),
  so nothing in `@dungeonmaster/shared` needs touching for this chunk.

  **The already-built exports you wire into — every name and line number below was read off disk, none is
  guessed:**
  - `healthHeartbeatStatics` — `packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts`.
    The value is nested: **`healthHeartbeatStatics.broadcast.intervalMs` === 5000**. Import it with
    `import { healthHeartbeatStatics } from '../../../statics/health-heartbeat/health-heartbeat-statics';`
    — this is the ONE new import the file needs.
  - `wsEventRelayBroadcastBroker` — already imported at line 36.
    `({ clients, message }: { clients: Set<WsClient>; message: WsMessage }) => Set<WsClient>`. It serializes
    once, sends to every client, and deletes any client whose `send` throws. Ignore its return value, exactly
    as the global-event call at line 763 does.
  - `wsMessageContract` — already imported at line 14. `z.object({ type: orchestrationEventTypeContract,
    payload: z.record(z.string().brand<'PayloadKey'>(), z.unknown()), timestamp: z.string().datetime().brand<'IsoTimestamp'>() })`.
  - `isoTimestampContract` — already imported at line 39; every existing envelope stamps
    `isoTimestampContract.parse(new Date().toISOString())`.
  - `clients` — the `Set<WsClient>` declared at line 88, filled by `onOpen` and emptied by `onClose`.

  **The edit — insert the block immediately AFTER the `flushIntervalHandle` `setInterval` (which ends at
  line 800 with `}, FLUSH_INTERVAL_MS);`) and BEFORE the `orchestratorOutboxWatchAdapter({` call:**

  ```ts
  // The heartbeat broadcasts straight from here rather than through the orchestration event bus:
  // this responder already owns `clients`, and the orchestrator holds no health state to own.
  const healthHeartbeatIntervalHandle = setInterval(() => {
    wsEventRelayBroadcastBroker({
      clients,
      message: wsMessageContract.parse({
        type: 'health-updated',
        payload: {},
        timestamp: isoTimestampContract.parse(new Date().toISOString()),
      }),
    });
  }, healthHeartbeatStatics.broadcast.intervalMs);
  ```

  Then add `clearInterval(healthHeartbeatIntervalHandle);` directly beneath the existing
  `clearInterval(flushIntervalHandle);` in BOTH the `SIGTERM` and the `SIGINT` handler (lines 849 and 856).
  Symmetry with the flush timer is the whole reason those lines exist; do not add a test that emits the
  signal (see SUMMARY point 3 — the handler calls `process.exit(0)`).

  **Do not touch anything else in this file.** The relay loop at line 540 iterates
  `orchestrationEventTypeContract.options` and therefore already subscribes to `health-updated` on the
  in-memory bus — nothing emits it there, that subscription is inert, and removing or special-casing it is
  out of scope. `health-updated` must NOT be added to `PER_QUEST_EVENT_TYPES`: the tick is global by
  definition and a per-quest frame is delivered to nobody without a `questId`.

  **The tests — a new `describe('health heartbeat broadcast', …)` block appended inside the existing
  top-level `describe('ServerInitResponder', …)`.** Fresh proxy per test, created AFTER `jest.useFakeTimers()`
  (so the responder's `setInterval` is the fake one) and BEFORE `callResponder()`. `jest.useRealTimers()`
  goes BEFORE the `expect` so a failing assertion cannot leave fake timers installed for the next test — the
  same ordering `health-flow.integration.test.ts` uses for its env restores. Five tests:

  1. `VALID: {one client connected, 5000ms elapses} => broadcasts exactly one health-updated frame` —
     the envelope proof. Assert the RAW serialized call list, which pins type, payload and timestamp in one
     strict assertion and needs no `JSON.parse` cast:
     ```ts
     expect(sendMock.mock.calls).toStrictEqual([
       ['{"type":"health-updated","payload":{},"timestamp":"<the literal the run prints>"}'],
     ]);
     ```
  2. `EDGE: {4999ms elapses} => no health-updated frame yet` — `expect(sendMock.mock.calls).toStrictEqual([])`.
  3. `VALID: {10000ms elapses} => broadcasts two frames, one per 5000ms interval` — a two-element
     `toStrictEqual`. Tests 2 and 3 together ARE `#check-tick-broadcast-cadence`, proved exactly rather than
     within ±500ms.
  4. `VALID: {two clients connected} => both receive the tick` — two `WsClientStub`s, two
     `simulateConnection` calls, advance 5000, then one assertion over both:
     `expect({ first: firstSend.mock.calls, second: secondSend.mock.calls }).toStrictEqual({ … })`.
  5. `EDGE: {client disconnects before the tick} => that client receives nothing` — `simulateConnection`,
     then `simulateDisconnect`, then advance 5000, then `toStrictEqual([])`.

  **Pin the clock, then RUN the ward line and assert what actually came back.** Use
  `jest.useFakeTimers().setSystemTime(new Date('2024-01-15T10:00:00.000Z'))` so the timestamp is
  deterministic whichever way it resolves: the proxy installs
  `registerSpyOn({ object: Date.prototype, method: 'toISOString', passthrough: true })` returning
  `'2024-01-01T00:00:00.000Z'` (proxy lines 106-111), and whether that spy survives jest's fake `Date` is
  something only the runner can tell you. **Do not guess the literal, and do not weaken the assertion to a
  regex or `expect.stringMatching` to dodge the question** — those matchers are banned in jest tests here.
  Run it, read the received value, paste it in. If the two frames in test 3 carry DIFFERENT timestamps
  (5000ms apart), that is the passthrough case and is even better evidence — assert both literals.

  **Test-file conventions this file already follows, so you match them:** `const sendMock = jest.fn();` then
  `WsClientStub({ send: sendMock })` (lines 25-26) — a bare `jest.fn()` in the test is the established form
  here for the WS client, and `WsClientStub` comes from
  `../../../contracts/ws-client/ws-client.stub`. No `beforeEach`/`afterEach`, no conditionals, no
  `toHaveLength`, no `toContain`, no `.not.*`. Do NOT reach for `registerMock`/`registerSpyOn` in the test
  file, and do NOT add a method to `server-init-responder.proxy.ts` — everything above is reachable through
  `simulateConnection` / `simulateDisconnect` / `callResponder`, which already exist.

  **Watch for one interaction and report it if it appears:** advancing 5000ms also fires the 100ms flush
  timer 50 times. Its buffer is empty in every test above, so it returns early and sends nothing — the
  existing `EDGE: {empty buffer at flush interval}` test at line 96 already pins that. If a heartbeat test
  shows unexpected extra `send` calls, that is the thing to look at first.

  **The doc edit — `packages/server/CLAUDE.md`, section "## Quest Event Relay", three lines and nothing
  else.** It currently opens "The server has two WS broadcast paths — they handle different event tiers:"
  over a two-row table. After this chunk that sentence is false, and this repo's present-tense documentation
  rule makes fixing it part of the change. Change "two" to "three" and append one row:
  `| **Health heartbeat** (`setInterval` in `ServerInitResponder`) | `health-updated` | A 5000ms timer;
  broadcasts to every connected client via `wsEventRelayBroadcastBroker`, never through the orchestration bus |`.
  Do not restructure the section, and do not touch any other part of that file. It is deliberately absent
  from the WARD line — markdown carries no ward check type, and passing it would report a DISCOVERY MISMATCH.

  **Before ward: run `npm run build` as its own command and confirm it exits 0** (unpiped — piping discards
  the exit code and feeds a stale `dist/` into ward as phantom type errors). Then run the WARD line above
  ONCE, in the foreground, with `timeout: 600000`.
