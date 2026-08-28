# Round 1 — [flowrider] Flowrider: author the flow-perspective test suites below the browser — package: server

## Context
Quest ID: a7520e60-430c-4d0e-b332-9952d6d5c042
Work Item ID: 409f08c0-ff54-42d1-82cd-68f95b60a64b
Operation Item ID: c1ecbc72-506e-459d-a9a5-7eedc0ee0107
Your operation item: [flowrider] Flowrider: author the flow-perspective test suites below the browser — package: server

Operations ledger (in order):
1. [x] [chaoswhisperer] Author spec + implementation plan
2. [x] [riftcarver] Riftcarver: carve the quest branch, worktree and preflight build
3. [x] [codeweaver] Codeweaver: build this slice — package: shared
4. [x] [codeweaver] Codeweaver: build this slice — package: server
5. [x] [codeweaver] Codeweaver: build this slice — package: web
6. [x] [ward changed] Ward gate (changed files)
7. [>] [flowrider] Flowrider: author the flow-perspective test suites below the browser — package: server  <-- YOUR OPERATION ITEM
8. [ ] [flowrider] Flowrider: author the flow-perspective test suites below the browser — seam: server + shared
9. [ ] [groundstomper] Groundstomper: author the browser walk for this flow — flow: health-badge
10. [ ] [siegemaster] Siegemaster: manual-QA this flow and review its test suite — flow: health-badge
11. [ ] [ward full] Ward gate (full monorepo)

Your flows: #health-badge
(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where your role has minions.)

Your packages: server
(YOUR coverage slice — you own every verification unit whose owning NODE tags one of these packages, and a unit spanning two of them belongs to the seam item, not to you. Read these packages first.)

Packages affected (whole quest): shared (edit, library), server (edit, http-backend), web (edit, frontend-react)

Original user request (the intent behind the flows):
The app top bar gives no indication of whether the server behind it is still
answering. When the server dies or wedges, the interface keeps rendering its
last state and the operator finds out only when an action fails.

Add a health badge to the top bar, visible on every route. It seeds itself at
mount from a new GET /api/health/status returning status, uptime and version,
then tracks a health-status heartbeat the server emits every 10 seconds over
the WebSocket the interface already holds open.

The badge reads ONLINE with uptime beside it, DEGRADED, or OFFLINE. It goes
OFFLINE when the seed request fails to reach the server, when the server
answers with an error, or when 30 seconds pass with no heartbeat — a server
can hold the socket open while no longer doing work, so silence is the signal
rather than disconnection. Clicking an OFFLINE badge retries the seed request.

/api/health stays as it is, a bare liveness probe.

## Plan

TOUCHES:
  ./packages/server/src/flows/server/server-flow.integration.test.ts — EXISTS (queue) — 7 lines. Its one case asserts `expect(ServerFlow).toStrictEqual(expect.any(Function))` and nothing else: it never CALLS ServerFlow, so ServerInitResponder never runs, no `/ws` route is registered, no `clients` Set exists and no heartbeat interval is started. ServerFlow (server-flow.ts:28) is the only caller of ServerInitResponder, which is the only place `/ws` (server-init-responder.ts:143-149) and the 10s heartbeat (server-init-responder.ts:811-819) are created.
      health-badge:observable:check-client-in-broadcast-set — a REAL client that completed the `/ws` upgrade and sent no message at all receives the next health-status frame on its own socket
      health-badge:observable:check-broadcast-reaches-unsubscribed-client — a second REAL client that sent `subscribe-quest` and a first that sent nothing both receive the SAME frame, so the fan-out is not routed through clientSubscriptions
  ./packages/server/test/harnesses/server-ws/server-ws.harness.ts — NEW — boots the REAL ServerFlow on a free port under a temp DUNGEONMASTER_HOME, opens real `/ws` clients, collects each client's received text frames, and closes every handle it opened in its own afterEach. For the server-flow suite alone; no other chunk drives through it.
  ./packages/web/src/widgets/app/app-widget.integration.test.tsx — EXISTS (jsdom) — one case, `'VALID: {chat + queue + rate-limits + health bindings mounted together} => exactly one WebSocket is opened'`. It stages three MSW endpoints (questsQueue, rateLimits, healthStatus), spies `globalThis.WebSocket` via registerSpyOn, calls `webSocketChannelState.clear()` + `.connect()`, mounts FOUR bindings through testingLibraryRenderHookAdapter, and asserts `healthResult.current` toStrictEqual `{badgeState: {state: 'online', uptimeSeconds: 11520}, retry: expect.any(Function)}` plus `socketConstructions` toStrictEqual `[true]`. It renders no DOM tree, asserts nothing about the request URL or count, and never delivers a health-status frame.
      health-badge:observable:check-seed-request-issued — exactly ONE fetch reaches `/api/health/status` on mount, at that exact URL with no query string appended
      health-badge:observable:check-heartbeat-reaches-badge — one health-status frame pushed through the real channel changes the RENDERED badge text, with the health endpoint's request count still 1
  ./packages/server/src/flows/health/health-flow.integration.test.ts — EXISTS (route) — two cases, both `HealthFlow().request(...)`. :11 asserts `/api/health` status 200, `toPlain(body) toStrictEqual parsed` and `parsed toStrictEqual {status: 'ok', timestamp: <ISO regex>}`. :28 asserts `/api/health/status` status 200 and `toPlain(body) toStrictEqual parsed`. Both parse transformers safeParse through a NON-strict zod object, which STRIPS unknown keys — so a fourth key survives in `toPlain(body)`, vanishes from `parsed`, and the toStrictEqual reds; a missing key makes the parse return undefined and it reds again.
      health-badge:observable:check-seed-route-answers — already true here, NO CHUNK
      health-badge:observable:check-liveness-probe-unchanged — already true here, NO CHUNK
  ./packages/server/src/brokers/health/heartbeat-emit/health-heartbeat-emit-broker.test.ts — EXISTS (module) — a UNIT test, listed because a unit of this round is already true in it. :62 `'ERROR: {first client throws} => first client removed from the set and returned dead, second client still receives the frame'` runs the REAL healthHeartbeatEmitBroker over the REAL wsEventRelayBroadcastBroker with a two-client Set, and asserts `clients.has(deadClient)` false, `deadClients.has(deadClient)` true, and the surviving client's captured messages toStrictEqual exactly one `{type:'health-status', payload:{status:'ok',uptimeSeconds:100,version:'0.1.0'}, timestamp:'2024-01-01T00:00:00.000Z'}`.
      health-badge:observable:check-dead-client-does-not-block — already true here, NO CHUNK

DEPENDS:
  ./packages/server/test/harnesses/server-ws/server-ws.harness.ts
      needed by: ./packages/server/src/flows/server/server-flow.integration.test.ts — everything the suite is forbidden to do itself: the temp DUNGEONMASTER_HOME and the free-port DUNGEONMASTER_PORT, the real ServerFlow boot, the real `/ws` client sockets, the per-client received-frame log, and the close of every handle afterwards. The suite may not import node:fs / node:net / node:child_process or any .proxy.ts, so all of it crosses this one link.
      needs: ./packages/server/test/harnesses/server-app/server-app.harness.ts — `setupTestHome({baseName})`, which writes a temp dir with a `config.json` of `{guilds: []}` into DUNGEONMASTER_HOME and hands back a restore(). A harness importing another harness is inside the import boundary; re-implementing the temp home here would be a second copy of it.
      needs: nothing else. It is the only NEW file in the round.
  ./packages/server/src/flows/server/server-flow.integration.test.ts
      needs: ./packages/server/test/harnesses/server-ws/server-ws.harness.ts — the boot, the clients, the frame log and the teardown, per the line above. ONE chunk owns both files, so this link never crosses a wave boundary.
      needed by: nothing. No other suite in the round reads it.
  ./packages/web/src/widgets/app/app-widget.integration.test.tsx
      needs: nothing new. Everything it drives already exists and is already imported by the file: `StartEndpointMock` and `registerSpyOn` from @dungeonmaster/testing, `webSocketChannelState` (whose `dispatchInbound` is a PUBLIC member at web-socket-channel-state.ts:130 and routes `type === 'health-status'` at :192-194, so the suite can push a frame with no proxy), `mantineRenderAdapter` and `MemoryRouter` for the DOM render (the shape app-widget.test.tsx:41 already uses), and `healthBadgeStatics.testId` for the locator.
      needed by: nothing.
  ./packages/server/src/flows/health/health-flow.integration.test.ts
      needs: nothing — it is unchanged this round; it is listed only because two units are already true in it.
      needed by: nothing.
  ./packages/server/src/brokers/health/heartbeat-emit/health-heartbeat-emit-broker.test.ts
      needs: nothing — unchanged this round; listed only because one unit is already true in it.
      needed by: nothing.

  No harness is shared by two chunks, no entry's fixtures are unseeded, and every `[ ]` unit on the checklist
  lands on exactly one entry above.

DECISIONS:
  - check-seed-route-answers and check-liveness-probe-unchanged are ALREADY TRUE, and no chunk improves
    them. Opened health-flow.integration.test.ts:11-24 and :28-37. Both cases compare
    `harness.toPlain(body)` against the safeParsed value from a non-strict zod object, which strips
    unknown keys — so an added fourth key survives on the left, vanishes on the right, and the
    toStrictEqual reds; a removed key makes the parse fail, `parsed` is undefined, and it reds again.
    The liveness case additionally pins `{status: 'ok', timestamp: <ISO regex>}` exactly. Nothing the
    observables ask for is left unasserted.
  - check-dead-client-does-not-block is ALREADY TRUE at health-heartbeat-emit-broker.test.ts:62-82, and
    NO integration-layer driver can improve on it. That case runs the REAL healthHeartbeatEmitBroker
    over the REAL wsEventRelayBroadcastBroker with the REAL health-status frame and asserts all three
    halves the observable names. It cannot be re-proved over a real socket, because the `ws` library's
    `WebSocket.prototype.send` does not throw synchronously on a closing or closed socket — it routes
    the failure to the caller's callback or emits an `error` event — so the catch arm at
    ws-event-relay-broadcast-broker.ts:13 is only reachable with a client OBJECT under test control,
    which is exactly what that suite has. A chunk here would either restate that suite or fake the
    throw and prove less.
  - check-seed-request-issued and check-heartbeat-reaches-badge are MINE, not the seam item's and not
    Groundstomper's. Both sit on nodes (#seed-fetch, #subscribe-heartbeat) whose other package is
    `web`, a browser package with no flowrider slice at all, so the whole node routes here even though
    the files sit in packages/web. The seam item (server + shared) owns #server-emits and #channel-routes,
    whose seven observables are all `[x]` on this checklist.
  - The "no query string" half of check-seed-request-issued is read off a passthrough registerSpyOn on
    `globalThis.fetch`, NOT off the MSW endpoint handle. `EndpointControl`
    (packages/testing/src/contracts/endpoint-control/endpoint-control-contract.ts:25-29) exposes only
    getRequestCount() and getRequestBodies(), and MSW matches a handler URL irrespective of search
    params, so a request carrying `?x=1` would still count as 1 and the assertion could not bite.
    Widening EndpointControl would touch seven files across a SHARED package, several of which pin the
    control with a whole-object toStrictEqual, and would need a testing rebuild. The spy's address IS
    the URL (packages/testing/CLAUDE.md's address table), and fetchGetWithStatusAdapter.ts:21 calls
    `globalThis.fetch(url, {method:'GET', headers:{Accept:'application/json'}})` with
    `webConfigStatics.api.routes.healthStatus` verbatim (health-status-get-broker.ts:26), so
    `callsMatching(['/api/health/status'])` returns the call today and returns NOTHING the moment a
    query string is appended.
  - Units 1 and 4 land on widgets/app/app-widget.integration.test.tsx rather than on
    flows/app/app-flow.integration.test.tsx, even though flows/ is where an integration test belongs by
    default. Opened both. app-flow.integration.test.tsx is a nine-line
    `expect(AppFlow).toStrictEqual(expect.any(Function))` stub with no render, and AppFlow is a `<Route>`
    tree that does not itself mount the badge — AppLayoutResponder -> AppWidget does (app-widget.tsx:80).
    app-widget.integration.test.tsx is the ONE integration test in packages/web that already stages the
    health MSW endpoint, spies the socket constructor and connects the real channel. No NEW integration
    test is cut outside flows/ or startup/ this round; the only NEW file in the round is a harness.
  - No spike was run, and the pattern chunk 1 needs is new to this repo — no integration test anywhere
    under packages/*/src opens a WebSocket (discover over all 104 integration tests for
    `WebSocket|websocket|honoServe|serve\(` returned zero content matches). A spike would need
    `npm run build` first (server resolves @dungeonmaster/orchestrator through dist) and then a Jest run,
    and its driver would be rewritten into the harness anyway. Everything reading COULD settle was
    settled: hono-serve-adapter.ts:21 passes `{fetch, port, hostname}` straight to `serve()`;
    server-init-responder.ts:487 takes the port from `portResolveBroker()`, which reads DUNGEONMASTER_PORT;
    :521 attaches the socket server via `nodeWebSocket.injectWebSocket(server)`;
    server-app.harness.ts:72-87 already isolates DUNGEONMASTER_HOME and hands back a restore();
    jest.config.base.js sets `testEnvironment: 'node'`, `detectOpenHandles: true` and `forceExit: true`,
    so a leaked handle is REPORTED but does not hang the run; and the client transport is settled —
    node v22.17.0 with a global `WebSocket` function, and `ws` itself hoisted and resolvable at
    <repo>/node_modules/ws even though packages/server declares only @hono/node-ws. What reading could
    not settle is named as the four hazards in chunk 1's NOTES.
  - Checker finding I ACCEPTED and folded in: server-flow.ts:28 is not the only caller of
    ServerInitResponder — server-init-responder.proxy.ts:155 calls it directly with its own `new Hono()`,
    which is how server-init-responder.test.ts reaches the `/ws` handlers. The claim that matters is
    unchanged and is the one chunk 1 rests on: the server-flow INTEGRATION suite never calls it, and the
    proxy path replaces both npm transports, so no test anywhere completes a real `/ws` upgrade.
  - I expect chunk 1 back as rework. It is this repo's first integration test that boots a listening
    server, and each of its four named hazards can cost a whole turn on its own.
  - Mess that is not this round's: server-flow.integration.test.ts and start-server.integration.test.ts
    are both seven-line `expect(X).toStrictEqual(expect.any(Function))` stubs, and five of packages/web's
    eight integration tests are the same shape. Chunk 1 replaces the server-flow one because its units
    land there. The other six are not this round's subject and get no chunk.

ASSERTIONS:
  - `packages/server/src/flows/server/server-flow.integration.test.ts` CALLS ServerFlow, and at least one
    of its cases reads a health-status frame off a real client WebSocket. Check: the file no longer
    contains `expect(ServerFlow).toStrictEqual(expect.any(Function))` as its only assertion, and at least
    one assertion compares a parsed frame's `type` to `'health-status'`.
  - Two REAL clients complete the `/ws` upgrade in that suite — one that sends no message at all, one
    that sends `subscribe-quest` — and both receive the SAME health-status frame. Check: a single
    toStrictEqual comparing the two clients' collected frames against one another and against the
    expected envelope, so a fan-out that consulted clientSubscriptions would leave the plain client's
    list empty and red it.
  - `packages/server/test/harnesses/server-ws/server-ws.harness.ts` exists, composes
    `serverAppHarness().setupTestHome`, and closes the HTTP listener and every client socket it opened.
    Check: it declares an `afterEach` property, and a scoped ward run over the suite reports no
    `detectOpenHandles` warning naming a TCP server or socket.
  - `packages/web/src/widgets/app/app-widget.integration.test.tsx` renders a real DOM tree carrying
    `healthBadgeStatics.testId` and asserts the badge's textContent twice — once after the seed settles
    and once after one health-status frame — with the two strings DIFFERENT. Check: two
    `expect(...).toBe('ONLINE 3h 12m')` / `toBe('ONLINE 3h 13m')`-shaped assertions on the same element,
    not one.
  - That same suite proves exactly one GET reached `/api/health/status` on mount and that it carried no
    query string, and that the count is still 1 after the frame. Check: a `callsMatching`
    assertion whose expected value is a one-element array whose first element is exactly
    `'/api/health/status'`.
  - The round changes NO file outside the two test files and the one new harness above, except a REPAIR
    a worker names in its report. Check: `git status --porcelain` at review time lists exactly those
    three paths plus this document, or lists a fourth path that a `REPAIR:` line accounts for.
  - Every one of the 7 `[ ]` units that `get-qa-checklist({questId, operationItemId})` returns for this
    item is named exactly once, either in a chunk's UNITS or in a NO CHUNK line. Check: 4 in UNITS rows,
    3 in `settled` lines, 7 total, no id appearing twice.

NO CHUNK:
  - settled health-badge:observable:check-seed-route-answers at 38732600e -> ./packages/server/src/flows/health/health-flow.integration.test.ts:28 (route) — `HealthFlow().request('/api/health/status')`, then `expect(response.status).toBe(200)` and `expect(harness.toPlain(body)).toStrictEqual(parsed)` where `parsed = parseHealthStatusPayloadTransformer({value: body})`. That transformer safeParses through healthStatusPayloadContract, a non-strict z.object that STRIPS unknown keys, so a fourth key stays on the left and vanishes on the right and the toStrictEqual reds; a missing key makes parsed undefined and it reds again. Exactly {status, uptimeSeconds, version}, no other keys, at 200.
  - settled health-badge:observable:check-liveness-probe-unchanged at 38732600e -> ./packages/server/src/flows/health/health-flow.integration.test.ts:11 (route) — `HealthFlow().request('/api/health')`, then `expect(response.status).toBe(200)`, `expect(harness.toPlain(body)).toStrictEqual(parsed)` through parseHealthResponseTransformer, AND `expect(parsed).toStrictEqual({status: 'ok', timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u)})`. The strip comparison is the "gains no new fields" arm; the literal toStrictEqual is the "exactly {status:'ok', timestamp}" arm.
  - settled health-badge:observable:check-dead-client-does-not-block at d47fa45f7 -> ./packages/server/src/brokers/health/heartbeat-emit/health-heartbeat-emit-broker.test.ts:62 (module) — `'ERROR: {first client throws} => first client removed from the set and returned dead, second client still receives the frame'`. It builds `new Set([deadClient, proxy.captureClient])` where deadClient's send throws `new Error('Connection closed')`, calls the REAL healthHeartbeatEmitBroker, which delegates to the REAL wsEventRelayBroadcastBroker (its proxy registers no mock; it only contributes a capture client), and asserts `clients.has(deadClient)` toBe false, `deadClients.has(deadClient)` toBe true, and the surviving client's captured messages toStrictEqual exactly one `{type:'health-status', payload:{status:'ok',uptimeSeconds:100,version:'0.1.0'}, timestamp:'2024-01-01T00:00:00.000Z'}` — all three halves of the observable. DECISIONS records why no real-socket driver can re-prove it.

### chunk 1 — the server-flow suite boots the real server and reads a heartbeat off two real sockets
INTENT:
  - `ServerFlow` is CALLED in ./packages/server/src/flows/server/server-flow.integration.test.ts, so the real ServerInitResponder runs, the real `/ws` route is registered, the real `clients` Set exists and the real 10-second heartbeat interval starts. Settled by: the file contains a call to `ServerFlow({...})`, not only `expect(ServerFlow).toStrictEqual(expect.any(Function))`.
  - A client that completed a REAL `/ws` upgrade and sent NO message at all receives a health-status frame on its own socket. Settled by: that client's collected frames, parsed, toStrictEqual a one-element array whose element carries `type: 'health-status'` and a payload of exactly {status, uptimeSeconds, version}.
  - A second client that DID send `subscribe-quest` receives the SAME frame as the first. Settled by: one toStrictEqual comparing both clients' collected frames against the same expected value — a fan-out routed through clientSubscriptions leaves the plain client's list empty and reds it.
  - ./packages/server/test/harnesses/server-ws/server-ws.harness.ts closes every handle it opened. Settled by: it declares an `afterEach` property that closes the HTTP listener and each client socket, and a scoped ward run over the suite reports no detectOpenHandles warning naming a TCP server or socket.
FILES:
  - ./packages/server/src/flows/server/server-flow.integration.test.ts
  - ./packages/server/test/harnesses/server-ws/server-ws.harness.ts
UNITS:
  - health-badge:observable:check-client-in-broadcast-set -> ./packages/server/src/flows/server/server-flow.integration.test.ts (queue) — assert the frames collected by a client that completed the real `/ws` upgrade and sent nothing at all are exactly one health-status envelope. The SHAPE is "a socket that only connected": the client must send no bytes before the assertion, or it proves a different claim.
  - health-badge:observable:check-broadcast-reaches-unsubscribed-client -> ./packages/server/src/flows/server/server-flow.integration.test.ts (queue) — assert the plain client's collected frames and the subscribe-quest client's collected frames are EQUAL to one another and to the expected envelope, in ONE toStrictEqual over both. The SHAPE is a comparison between two clients, not two independent single-client assertions.
MIRROR: ./packages/server/test/harnesses/server-app/server-app.harness.ts
NOTES:
  1. ENTRY POINT and FLOWS. This file drives `ServerFlow` (packages/server/src/flows/server/server-flow.ts:15-30), which builds the main Hono app, routes every sub-app onto it and calls `ServerInitResponder({app, serveWebBundle})`. That responder is the ONLY place `/ws` is registered (server-init-responder.ts:143-149, whose `onOpen` does `clients.add(ws)`) and the ONLY place the heartbeat starts (server-init-responder.ts:811-819, `setInterval(() => healthHeartbeatEmitBroker({clients}), healthHeartbeatStatics.emit.intervalMs)` at 10000ms, then `.unref()`). Flow #health-badge reaches it on paths P13-P19, at nodes #subscribe-heartbeat -> #server-emits -> #relay-broadcast.
  2. WHAT ALREADY COVERS THEM. Nothing at integration tier. server-flow.integration.test.ts today is 7 lines asserting only that ServerFlow is a function — I opened it. The nearest coverage is UNIT tier and does NOT complete an upgrade: server-init-responder.test.ts:1232 (one client, no message, 1/3/3 frames at 10s/30s/35s) and :1267 (a plain client and a subscribe-quest client both getting the identical three frames) both reach the `clients` Set through `proxy.simulateConnection`, and server-init-responder.proxy.ts replaces BOTH npm transports — honoServeAdapterProxy registerModuleMocks `@hono/node-server` outright and honoCreateNodeWebSocketAdapterProxy mocks `createNodeWebSocket`. So no test anywhere completes a real `/ws` upgrade, which is the exact word in check-client-in-broadcast-set. Do NOT delete or weaken those unit cases; this suite is additive.
  3. HARNESS. This chunk OWNS ./packages/server/test/harnesses/server-ws/server-ws.harness.ts and creates it; no other chunk uses it. It USES ./packages/server/test/harnesses/server-app/server-app.harness.ts for `setupTestHome({baseName})` (server-app.harness.ts:72-87 — a temp dir under the OS tmpdir holding `config.json` of `{guilds: []}`, DUNGEONMASTER_HOME pointed at it, and a restore() that unsets and removes it). A harness importing another harness is inside the import boundary. The TEST file may import node:fs / node:net / node:child_process NOWHERE and may import no .proxy.ts at all — every one of those belongs in the harness, which owns its lifecycle via optional `beforeEach`/`afterEach` properties that a ts-jest AST transformer auto-wires. The test itself writes no hooks.
  4. AUTHORITY. You may create the harness and rewrite the test file's body freely. Do NOT touch server-init-responder.ts, health-heartbeat-emit-broker.ts, ws-event-relay-broadcast-broker.ts or any statics — this round writes no product code. Do NOT edit server-init-responder.proxy.ts or server-init-responder.test.ts; that is the unit tier and is not yours. A defect the boot exposes in product code is a `REPAIR:` line in your report, not a change you make. Chunk 2 owns packages/web; nothing here overlaps it.
  5. DESIGN DECISIONS. #dd-refresh governs both units: "The interface already holds an open socket for quest, queue and rate-limit updates, so health rides the connection that exists instead of adding a polling timer. A pushed heartbeat also distinguishes a wedged server from a merely slow one, which request-response polling cannot do." — so the frame must arrive over the SAME socket a client got from the ordinary `/ws` upgrade, not a health-specific channel. #dd-degraded-recovers relates directly to #subscribe-heartbeat: "The badge subscribes at mount rather than after a healthy seed, so every rendered state keeps consuming heartbeats. ... Making any state stop listening would strand the badge on a reading that was true once and is not any more." — which is why a client that has sent NOTHING must still be a recipient. #dd-ws-scope: "health-status becomes a member of orchestrationEventTypeContract so both sides import one declaration of the frame rather than each restating its own. Every other event on the socket is already routed this way, and a second inbound shape parsed ahead of the envelope would be a parallel path maintained by hand." — so assert the envelope's `type` against the enum member rather than restating a literal in a second place.
  6. FIXTURES. Two clients that can be told apart: client A opens and sends NOTHING; client B opens and sends `JSON.stringify({type:'subscribe-quest', questId: <a QuestIdStub value>})` for a quest that does not exist on disk — hostile on purpose, because a fan-out that consulted clientSubscriptions would then deliver to neither and the equality assertion still reds. `uptimeSeconds` and `version` are read live off the real process, so pin the SHAPE (three keys, `status` one of ok/degraded) and pin `type` exactly, rather than pinning literal values.
  FOUR HAZARDS, each able to cost a turn on its own. Say in your report which you hit.
  (a) THE SERVER HANDLE IS NOT RETURNED. `ServerFlow` returns `{success: true}` and ServerInitResponder returns an AdapterResult; the node server from `honoServeAdapter` (server-init-responder.ts:513-521) is closure-private, so the harness has no handle to close. The way to get one WITHOUT replacing the transport: in the harness, `registerMock({fn: serve})` over `@hono/node-server`'s `serve`, and stage `.implement()` with an implementation that calls the REAL `serve` obtained via `requireActual({module: '@hono/node-server'})`, captures its return value and returns it. The real listener really binds; the harness merely holds the handle so afterEach can `.close()` it. Do NOT stage a fake return — that replaces the transport and loses the real upgrade the units are about.
  (b) THE SIGTERM HANDLER CALLS process.exit. ServerInitResponder registers SIGTERM/SIGINT handlers that exit the process, so tearing down by emitting a signal would kill the Jest worker. Tear down with the captured server handle instead. server-init-responder.proxy.ts:122 shows the shape for neutralising `process.exit` (`registerSpyOn({object: process, method: 'exit', passthrough: true})`) if you need it; prefer not needing it.
  (c) THE OUTBOX WATCHER AND THE ORCHESTRATOR BUS. ServerInitResponder also starts `orchestratorOutboxWatchAdapter` and subscribes `orchestratorEventsOnAdapter` under DUNGEONMASTER_HOME. `setupTestHome` is what keeps those off real user data; call it BEFORE ServerFlow and restore it after everything is closed.
  (d) THE 10-SECOND WAIT. There is no frame at t=0 — the first arrives one interval in — so the case needs an explicit per-test timeout: jest.config.base.js sets no testTimeout, so the default 5000ms fails an 11-second wait. Pass ~20000 as `it`'s third argument. Prefer the honest real wait; only if it proves flaky is `jest.useFakeTimers({doNotFake: [...]})` faking `setInterval` alone the alternative, and if you take it, say so in your report, because faking timers beside real sockets is its own hazard.
  PORT: server-init-responder.ts:487 takes the port from `portResolveBroker()`, which honours DUNGEONMASTER_PORT. The harness sets that env var to a free port (bind a throwaway `net` server on port 0, read `.address().port`, close it) and restores it in afterEach. Do not hardcode 3737 — a dogfood server may hold it.
  CLIENT TRANSPORT: node is v22.17.0 and `globalThis.WebSocket` is a function, so the harness can open clients with the GLOBAL WebSocket and declare no new dependency. `ws` is also resolvable (hoisted to <repo>/node_modules/ws), but packages/server declares only `@hono/node-ws`, so importing `ws` directly risks an extraneous-dependency lint — prefer the global, and say in your report which you used.
  URL: `ws://127.0.0.1:<port>/ws`. server-init-responder.ts:501-511 registers a catch-all `app.get('*')` that redirects non-API GETs, but `/ws` is excluded at :503 and the upgrade route is claimed first.

### chunk 2 — the app shell's one seed request, and a heartbeat that moves the rendered badge
INTENT:
  - ./packages/web/src/widgets/app/app-widget.integration.test.tsx renders a real DOM tree containing an element with `healthBadgeStatics.testId`. Settled by: a `getByTestId(healthBadgeStatics.testId)` that resolves, in a case that used mantineRenderAdapter rather than renderHook.
  - Exactly ONE fetch reached `/api/health/status` on mount, at that literal URL with no query string. Settled by: a `callsMatching(['/api/health/status'])` assertion whose expected value is a ONE-element array whose first element is exactly `'/api/health/status'` — a query string makes the address not match and the array come back empty.
  - One health-status frame pushed through the real channel changes the badge's rendered text. Settled by: two assertions on the SAME element's textContent, before and after the frame, whose expected strings differ (`'ONLINE 3h 12m'` then `'ONLINE 3h 13m'`).
  - That frame issued no second HTTP request. Settled by: the health endpoint's `getRequestCount()` toBe 1 AFTER the frame, in the same case.
FILES:
  - ./packages/web/src/widgets/app/app-widget.integration.test.tsx
UNITS:
  - health-badge:observable:check-seed-request-issued -> ./packages/web/src/widgets/app/app-widget.integration.test.tsx (jsdom) — assert the recorded fetch calls addressed to the health URL are exactly one, and that the recorded URL argument is the bare path. The SHAPE is an assertion on the RECORDED CALL LIST, not on a request count alone: a count cannot tell `/api/health/status` from `/api/health/status?t=1`.
  - health-badge:observable:check-heartbeat-reaches-badge -> ./packages/web/src/widgets/app/app-widget.integration.test.tsx (jsdom) — assert the rendered badge's textContent BEFORE and AFTER one delivered frame, both values pinned and different, with the request count still 1 after. The SHAPE is the DOM text moving, not the binding's `badgeState` object — reading the hook result is what the existing coverage already does.
MIRROR: ./packages/web/src/widgets/app/app-widget.test.tsx
NOTES:
  1. ENTRY POINT and FLOWS. The file's implementation is packages/web/src/widgets/app/app-widget.tsx, the app shell. It renders `<HealthBadgeWidget />` at :80, in the logo row beside RateLimitsStackWidget, so one mount covers every route. HealthBadgeWidget (health-badge-widget.tsx:24-47) is one `UnstyledButton` carrying `data-testid={healthBadgeStatics.testId}` with its text from `healthBadgeLabelTransformer`. `useHealthStatusBinding` (use-health-status-binding.ts:44-77) seeds once in a mount effect via `healthStatusGetBroker()`, subscribes `webSocketChannelState.healthStatus$()` unconditionally, and starts a 1000ms silence tick. Flow #health-badge reaches this file at #badge-mounts -> #seed-fetch and #badge-mounts -> #subscribe-heartbeat, on every path P1-P19.
  2. WHAT ALREADY COVERS THEM. Partially, and never together — I opened all of these. app-widget.integration.test.tsx's one existing case asserts the health binding's `badgeState` object and that exactly one WebSocket is constructed; it renders no DOM and never delivers a frame. health-status-get-broker.test.ts:7 and use-health-status-binding.test.ts:35 assert `getRequestCount()` toBe 1 but never inspect a URL. health-badge-widget.test.tsx:190 moves rendered text 'ONLINE 3h 12m' -> 'ONLINE 3h 13m' across two frames but asserts NO request count in that case. use-health-status-binding.test.ts:59 asserts the count across three frames but reads `badgeState`, never the DOM. Nothing anywhere asserts the "no query string" half. Keep the existing case in this file intact and ADD to it.
  3. HARNESS. None — packages/web has no jsdom harness, and its 24 harnesses under test/harnesses are all Playwright. This chunk creates none and owns none. Everything it needs is already imported by the file or by its mirror.
  4. AUTHORITY. You may add cases to app-widget.integration.test.tsx and add imports to it. Do NOT modify the existing case. Do NOT touch any .proxy.ts, any product file under packages/web/src, or anything in packages/testing — in particular do NOT widen `EndpointControl`; DECISIONS records why the fetch spy is used instead. Do NOT touch packages/server; chunk 1 owns it. A defect you expose in product code is a `REPAIR:` line in your report, not a change you make.
  5. DESIGN DECISIONS. #dd-endpoint governs the seed URL: "/api/health stays a bare liveness probe answering with status and timestamp, so anything already depending on it is unaffected. The badge needs uptime and version as well, and a separate route carries the richer body without widening the probe." — so the assertion pins `/api/health/status` and would red if the badge ever fell back to `/api/health`. #dd-refresh governs the "no further HTTP request" half: "The interface already holds an open socket for quest, queue and rate-limit updates, so health rides the connection that exists instead of adding a polling timer." — a second request after a frame would mean the badge is polling, which is what the count-still-1 assertion catches. #dd-slice: "An unreachable server is a state the badge renders, not an error it swallows." #dd-badge-text and #dd-uptime-format fix the two expected strings: "Uptime sits beside the word only in the healthy state" and "90061 seconds reads 25h 1m rather than 1d 1h 1m", so the label is ONLINE + one space + Xh Ym.
  6. FIXTURES. Values that can be told apart: stage the MSW seed at `{status:'ok', uptimeSeconds: 11520, version:'1.4.0'}` (renders 'ONLINE 3h 12m'), then deliver a frame carrying `uptimeSeconds: 11580` (renders 'ONLINE 3h 13m'). The two MUST differ or "the frame changed the badge text" is unprovable — that is the exact false green the phase-3 reviewer already fixed once in health-badge-widget.test.tsx. Rendering the WHOLE AppWidget mounts four HTTP-backed bindings and MSW runs with `onUnhandledRequest: 'error'`, so stage FOUR endpoints or the render throws: `webConfigStatics.api.routes.questsQueue`, `.rateLimits`, `.orchestrationDispatch` (DispatchToggleWidget sits inside QuestQueueBarWidget) and `.healthStatus`. Render AppWidget inside a MemoryRouter whose child route element is trivial, so `useGuildsBinding` and `/api/guilds` never mount — app-widget.test.tsx:22-37 shows the router shape but routes the real page widgets in; do not copy those in.
  MECHANICS.
  - The frame goes in through `webSocketChannelState.dispatchInbound({type:'health-status', payload:{status:'ok', uptimeSeconds:11580, version:'1.4.0'}, timestamp:'2026-07-28T10:00:00.000Z'})`. `dispatchInbound` is a PUBLIC member (web-socket-channel-state.ts:130) and its health-status branch at :192-194 safeParses through healthStatusPayloadContract and pushes synchronously. It takes a parsed OBJECT, not a JSON string. Wrap the call in `testingLibraryActAsyncAdapter` — it drives a React state update.
  - The URL assertion uses `registerSpyOn({object: globalThis, method: 'fetch', passthrough: true})`, whose address is the URL. `fetchGetWithStatusAdapter` (fetch-get-with-status-adapter.ts:21) calls `globalThis.fetch(url, {method:'GET', headers:{Accept:'application/json'}})` with `webConfigStatics.api.routes.healthStatus` verbatim (health-status-get-broker.ts:26), and `callsMatching` prefix-matches, so `callsMatching(['/api/health/status'])` returns that call today and returns nothing once a query string is appended. `passthrough: true` is required so MSW still answers every other binding's request. Using registerSpyOn directly in this file is the shape it already uses at app-widget.integration.test.tsx:44 for `globalThis.WebSocket`.
  - No beforeEach/afterEach, no conditionals, no toEqual/toMatchObject/toContain. Read the badge text as `getByTestId(healthBadgeStatics.testId).textContent` and assert with `toBe`.

PHASES:
  1: wave 1 — the whole round. No harness is shared between the two chunks, they sit in different packages, and neither imports nor drives the other, so there is nothing for a mid-round gate to read.

WAVES:
  1: 1, 2

## Round log

### report — chunk 2
RESULT:
  - app-widget.integration.test.tsx renders a real DOM tree containing an element with healthBadgeStatics.testId, via mantineRenderAdapter (not renderHook) — yes — `screen.getByTestId(healthBadgeStatics.testId).textContent` resolved to `'ONLINE 3h 12m'` at line 219, in the new case at line 152 which uses `mantineRenderAdapter` (not `testingLibraryRenderHookAdapter`).
  - Exactly ONE fetch reached `/api/health/status` on mount, at that literal URL with no query string — yes — `seedFetchUrls` (line 221-223, `fetchSpy.callsMatching([webConfigStatics.api.routes.healthStatus]).map((call) => call[0])`) equalled `['/api/health/status']` at line 225.
  - One health-status frame pushed through the real channel changes the badge's rendered text — yes — textContent read `'ONLINE 3h 12m'` at line 219 (before dispatchInbound) and `'ONLINE 3h 13m'` at line 245 (after), two different pinned strings on the same element.
  - That frame issued no second HTTP request — yes — `healthStatusEndpoint.getRequestCount()` was `1` at line 246, read immediately after the frame in the same case.
FILES:    ./packages/web/src/widgets/app/app-widget.integration.test.tsx
AUDIT:
  - health-badge:observable:check-seed-request-issued — absent — nothing reaches it. Opened the file's one pre-existing case (renderHook only, asserts `healthResult.current` object shape, never a fetch URL) plus health-status-get-broker.test.ts and use-health-status-binding.test.ts (both assert `getRequestCount()` toBe 1 but never inspect a URL, per this chunk's NOTES point 2). No case anywhere asserted the "no query string" half before this chunk.
  - health-badge:observable:check-heartbeat-reaches-badge — absent — nothing reaches it. health-badge-widget.test.tsx moves rendered text across two frames but asserts no request count in that case; use-health-status-binding.test.ts asserts request count across frames but reads `badgeState`, never the DOM; the pre-existing case in this file renders no DOM tree and never delivers a frame. No case combined "DOM text moves" + "still exactly one request" at this layer before this chunk.
MOCKS:
  - StartEndpointMock (MSW) on GET /api/quests/queue, /api/rate-limits, /api/orchestration/dispatch, /api/health/status — the real HTTP server (packages/server), unreachable from a packages/web jest run — the same boundary the file's pre-existing case already mocks for 3 of these 4 routes.
  - registerSpyOn({object: globalThis, method: 'fetch', passthrough: true}) — observes real fetch calls with passthrough:true; does not replace or fake anything, every call still reaches MSW's real interception. Not a behavior-replacing mock of any in-repo code.
EVIDENCE:
  - health-badge:observable:check-seed-request-issued — "On mount the badge issues GET /api/health/status exactly once, with no query string" — app-widget.integration.test.tsx:221-225 — `expect(seedFetchUrls).toStrictEqual([webConfigStatics.api.routes.healthStatus]);` where `seedFetchUrls = fetchSpy.callsMatching([webConfigStatics.api.routes.healthStatus]).map((call) => call[0])` — fails if the seed request's URL argument is anything other than the exact string '/api/health/status' (e.g. a query string appended), because callsMatching's address match then returns nothing and seedFetchUrls comes back empty — red witnessed: broke packages/web/src/brokers/health-status/get/health-status-get-broker.ts:26 (`url: webConfigStatics.api.routes.healthStatus,` → appended `+ '?probe=1'`), ran `npm run ward -- --onlyTests "mount, then one health-status frame" -- packages/web/src/widgets/app/app-widget.integration.test.tsx packages/web/src/brokers/health-status/get/health-status-get-broker.ts`, got `- Expected Array ["/api/health/status"] / + Received Array []` (run 1787953616357-0083), restored the line and confirmed `git diff` on that file was empty.
  - health-badge:observable:check-heartbeat-reaches-badge — "A health-status frame delivered after mount changes the badge text with no further HTTP request issued" — app-widget.integration.test.tsx:219 (before), :230-243 (dispatchInbound), :245-246 (after) — `expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 13m'); expect(healthStatusEndpoint.getRequestCount()).toBe(1);` — fails if the heartbeat's uptimeSeconds is not reflected into the rendered text (badge stays at the seed's 'ONLINE 3h 12m' instead of moving to 'ONLINE 3h 13m') — red witnessed: broke packages/web/src/bindings/use-health-status/use-health-status-binding.ts:52 (the heartbeat subscription's `setBadgeState(healthBadgeStateContract.parse({...baseState, lastHeartbeatAt: ...}))` → replaced with a no-op `setBadgeState((current) => (baseState ? current : current));`), ran the same scoped ward command against that file, got `Expected: "ONLINE 3h 13m" / Received: "ONLINE 3h 12m"` (run 1787953844537-d51b), restored the block verbatim and confirmed `git diff` on that file was empty.
UNCOVERED: none
USAGES:   Nothing others use. This chunk only appended test cases to an existing .integration.test.tsx file — no product code, export, contract, or symbol changed in the persisted diff. `git status --porcelain` shows exactly one modified path: ./packages/web/src/widgets/app/app-widget.integration.test.tsx. The two production files touched during step-9 red-witnessing (health-status-get-broker.ts, use-health-status-binding.ts) were restored byte-for-byte, confirmed via an empty `git diff` on each before moving on.
GOTCHAS:
  - orchestrationDispatch is staged (GET /api/orchestration/dispatch → {state: DispatchStateStub({mode:'paused'})}) but never actually called in this case: QuestQueueBarWidget returns null before reaching DispatchToggleWidget while the queue stays empty (`{entries: []}`), so the endpoint is a defensive safety net per this chunk's NOTES, not something the case asserts on.
  - webSocketChannelState is a module-level singleton shared with the file's pre-existing "shared websocket connection" case. The new case calls `.clear()` at the top for isolation but never `.connect()` — `dispatchInbound` pushes straight into the health-status subject regardless of connection state, so no WebSocket constructor spy was needed here (unlike the pre-existing case, which does spy on `globalThis.WebSocket`).
  - ESLint's `--fix` reformatted a string-concat expression into a template literal during the first witnessed-red ward run (cosmetic, on a temporary edit that was fully reverted afterward regardless — confirmed via empty `git diff`).
MARKERS:  none
WARD:     `npm run ward -- -- packages/web/src/widgets/app/app-widget.integration.test.tsx` — green — lint PASS (1/1), typecheck PASS (7304/7304), integration PASS (1 file, 8 discovered/passed). `unit` reported `skip` and the run then flagged a `DISCOVERY MISMATCH` naming only `unit` — expected and not a regression: this file is `.integration.test.tsx`, which the `unit` check type excludes by design, so `unit` has nothing to process on this scope.


### report — chunk 1
RESULT:
  - `ServerFlow` is CALLED in `./packages/server/src/flows/server/server-flow.integration.test.ts`, so the real ServerInitResponder runs, the real `/ws` route is registered, the real `clients` Set exists and the real 10-second heartbeat interval starts — yes — the file's `describe('health-status heartbeat over a real /ws upgrade', ...)` block calls `await serverWs.start()`, which calls `ServerFlow({ subApps: [] })` (harness line 184); the file's original `expect(ServerFlow).toStrictEqual(expect.any(Function))` case is retained but is no longer the file's only assertion (2 `it` blocks now).
  - A client that completed a REAL `/ws` upgrade and sent NO message at all receives a health-status frame on its own socket — yes — `silentClient` (opened first, never sends) resolves `waitForHealthStatusFrame` to a parsed, contract-validated frame; `expect([silentFrame, subscribedFrame]).toStrictEqual([expectedFrame, expectedFrame])` (test file line 65) pins `silentFrame` to `{type: 'health-status', payload: {status: 'ok', uptimeSeconds, version}, timestamp}`.
  - A second client that DID send `subscribe-quest` receives the SAME frame as the first — yes — same line-65 `toStrictEqual` compares `subscribedFrame` against the identical `expectedFrame` built from `silentFrame`'s own dynamic values, so a fan-out that filtered by `clientSubscriptions` (leaving either client's array without a health-status frame) would red it.
  - `./packages/server/test/harnesses/server-ws/server-ws.harness.ts` closes every handle it opened — yes — its `afterEach` closes every `openSockets` entry then `capturedServer.close()`; ward run `1787955664119-08b7` (green) reported no `detectOpenHandles` warning naming a TCP server or socket.
FILES:
  - ./packages/server/src/flows/server/server-flow.integration.test.ts
  - ./packages/server/test/harnesses/server-ws/server-ws.harness.ts
  - ./@types/ws/index.d.ts (NEW — see GOTCHAS; needed to type the `ws` import the CLIENT TRANSPORT hazard forced)
AUDIT:
  - health-badge:observable:check-client-in-broadcast-set — absent — nothing at integration tier reached a real `/ws` upgrade before this chunk (server-flow.integration.test.ts was a 7-line stub; the nearest coverage, server-init-responder.test.ts:1232, runs through server-init-responder.proxy.ts, which replaces both npm transports). Now proved at server-flow.integration.test.ts:65.
  - health-badge:observable:check-broadcast-reaches-unsubscribed-client — absent — same gap; the nearest coverage (server-init-responder.test.ts:1267) is also unit-tier through the same mocked transports. Now proved at the same line-65 assertion (one `toStrictEqual` over both clients, per this chunk's `UNITS` row).
MOCKS: none — the harness boots the REAL ServerFlow, a REAL listening `net.Server` (found via `process._getActiveHandles()`, never mocked), and REAL `ws`-package client sockets. The test file mocks nothing; every value it asserts on came off a real wire frame parsed through the real shared contracts.
EVIDENCE:
  - health-badge:observable:check-client-in-broadcast-set — "A client that completes the /ws upgrade receives the next health-status frame without sending any subscription message first" — server-flow.integration.test.ts:65 — `expect([silentFrame, subscribedFrame]).toStrictEqual([expectedFrame, expectedFrame])` — fails if `silentFrame` is anything other than the exact `{type:'health-status', payload:{status:'ok',uptimeSeconds,version}, timestamp}` echoed from itself, which happens when the silent client's frame array never contains a health-status entry — red witnessed: broke server-init-responder.ts:146 (`clients.add(ws as WsClient);` → replaced with a no-op `void (ws as WsClient);`) and ran `npm run ward -- -- ./packages/server/src/flows/server/server-flow.integration.test.ts ./packages/server/test/harnesses/server-ws/server-ws.harness.ts ./@types/ws/index.d.ts` (run `1787955614460-f041`): `Error: server-ws harness: no health-status frame arrived before the deadline`. Restored the line verbatim; `git diff --stat packages/server/src/responders/server/init/server-init-responder.ts` is empty.
  - health-badge:observable:check-broadcast-reaches-unsubscribed-client — "A client holding no quest subscription still receives every health-status frame" — server-flow.integration.test.ts:65 — same `expect([silentFrame, subscribedFrame]).toStrictEqual([expectedFrame, expectedFrame])` — fails if `subscribedFrame` (from the client that sent `subscribe-quest` for a nonexistent quest) differs from `silentFrame`'s echoed shape, which happens when the broadcast is filtered through `clientSubscriptions` for `health-status` (delivering to neither client, since the fake quest never resolves a subscription match) — red witnessed: same break, same run (`1787955614460-f041`), same timeout error — both clients timed out identically, since the broken `onOpen` drops every client from the broadcast `Set` regardless of subscription state. Restored and confirmed empty diff as above.
UNCOVERED: none
USAGES: `discover({ grep: "from 'ws'", strict: true })` — only `server-ws.harness.ts` imports `ws`; nothing else in the repo references it, `serverWsHarness`, or `@types/ws`, so nothing else needed checking.
GOTCHAS:
  - **Hazard (a) (the transport mock) does not work as NOTES proposed.** `registerMock({fn: serve})` called directly in a `.harness.ts` never activates: the ts-jest AST transformer only hoists a `registerMock`/`registerModuleMock` call into a real `jest.mock()` when the COMPILED FILE imports a path containing `.proxy` (`typescriptAstToProxyImportsAdapter` / `isProxyImportGuard`) — and harnesses are lint-BARRED from importing `.proxy.ts` files at all (pre-edit hook: "Harnesses and proxies use different mock mechanisms"). Confirmed empirically: `serve` stayed the real, unmocked function and `capturedServer` was never set. Tried `registerSpyOn` on `@hono/node-server`'s namespace export next — `TypeError: Cannot redefine property: serve`. Tried `registerSpyOn` on Node's native `http.createServer` next — same `TypeError: Cannot redefine property: createServer`, on this Node version. **What worked:** call `ServerFlow` fully real/unmocked, then find the bound `net.Server` by scanning `process._getActiveHandles()` for a handle whose `.address().port` matches the free port the harness chose. `_getActiveHandles` has no `@types/node` declaration; typed it through `process as unknown as Record<'_getActiveHandles', () => readonly unknown[]>` at one call site (a `declare global { namespace NodeJS {...} }` augmentation trips `@typescript-eslint/no-namespace`, which this repo cannot suppress — `eslint-comments/no-use` bans disable comments entirely).
  - **CLIENT TRANSPORT: the global (undici-based) `WebSocket` DOES NOT complete the handshake under Jest, though it works fine in a bare `tsx` script against the identical `@hono/node-server` + `@hono/node-ws` setup** (verified via a throwaway `tmp/ws-diag.ts`, gitignored, left in place). Under `npm run ward`'s jest run it failed with `failWebsocketConnection` from `undici` — a realm/version mismatch specific to `jest-environment-node`, not a real protocol incompatibility. Switched to the `ws` npm package's own `WebSocket` (hoisted, resolvable — `@hono/node-ws` depends on it) — the plan's DECISIONS anticipated this exact fallback. `ws` has no `@types/ws` installed anywhere in this monorepo's `node_modules`, so I added `./@types/ws/index.d.ts` (root-level, the sanctioned mechanism per `packages/CLAUDE.md`'s "Root @types/ folder" section) declaring only the surface this harness calls.
  - **PORT/HOST: `server-init-responder.ts:487-488` binds via `environmentStatics.hostname` (`'dungeonmaster.localhost'`), not `'127.0.0.1'`.** A client dialing `127.0.0.1` explicitly gets `ECONNREFUSED` even though the server is genuinely listening on the chosen free port — the harness's client now dials `environmentStatics.hostname` (imported from `@dungeonmaster/shared/statics`), matching how a real browser/CLI client resolves the same host.
  - Sibling chunk 2 is (or was) writing `./packages/web/src/widgets/app/app-widget.integration.test.tsx` concurrently in this same wave — untouched.
MARKERS: none — no product code was changed. `server-init-responder.ts:146` was broken and restored twice for the two units' witnessed reds (see EVIDENCE); `git diff --stat` on that file is empty.
WARD: `npm run ward -- -- ./packages/server/src/flows/server/server-flow.integration.test.ts ./packages/server/test/harnesses/server-ws/server-ws.harness.ts ./@types/ws/index.d.ts` (run `1787955664119-08b7`) — green — lint PASS (2/2 files), typecheck PASS (6175/6175), integration PASS (1/1 files, both cases). A `DISCOVERY MISMATCH` naming `unit` also printed (`unit: skip`) — none of these three files is a `.test.ts` unit file, so this is a skip per ward-discipline, not a regression.
NEXT: continue
