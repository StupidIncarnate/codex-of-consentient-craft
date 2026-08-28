# Round 1 — [codeweaver] Codeweaver: build this slice — package: web

## Context

Quest ID: a7520e60-430c-4d0e-b332-9952d6d5c042
Work Item ID: eede2011-9119-46a2-ae35-d79ef66b85cb
Operation Item ID: e77d99f2-e6a5-401e-bfc9-aafdd7cb8985
Your operation item: [codeweaver] Codeweaver: build this slice — package: web

Operations ledger (in order):
1. [x] [chaoswhisperer] Author spec + implementation plan
2. [x] [riftcarver] Riftcarver: carve the quest branch, worktree and preflight build
3. [x] [codeweaver] Codeweaver: build this slice — package: shared
4. [x] [codeweaver] Codeweaver: build this slice — package: server
5. [>] [codeweaver] Codeweaver: build this slice — package: web  <-- YOUR OPERATION ITEM
6. [ ] [ward changed] Ward gate (changed files)
7. [ ] [flowrider] Flowrider: author the flow-perspective test suites below the browser — package: server
8. [ ] [flowrider] Flowrider: author the flow-perspective test suites below the browser — seam: server + shared
9. [ ] [groundstomper] Groundstomper: author the browser walk for this flow — flow: health-badge
10. [ ] [siegemaster] Siegemaster: manual-QA this flow and review its test suite — flow: health-badge
11. [ ] [ward full] Ward gate (full monorepo)

Flows your operation item lands on: #health-badge
(A starting point, NOT a boundary — read every flow, and build whatever the flows need.)

Packages your operation item lands in: web
(Name these packages in every minion brief you write — the planner and the workers point their own searches here instead of guessing. NOT a boundary: a minion may touch another package if the work needs it.)

Your nodes (rendered from the spec as it stands right now, not from the ledger): #badge-mounts, #seed-fetch, #seed-outcome, #render-online, #render-degraded, #render-offline, #subscribe-heartbeat, #channel-routes, #heartbeat-outcome, #badge-live, #silence-timer, #retry-click, #badge-unmounts

Must satisfy — these are YOUR acceptance targets, verbatim:
  - check-badge-rendered [ui-state] on #badge-mounts: "The app top bar renders an element with testid HEALTH_BADGE on every route, beside the existing dispatch toggle and rate-limit stack"
  - check-badge-pending-text [ui-state] on #badge-mounts: "Between mount and the first seed response the badge reads exactly CHECKING"
  - check-seed-request-issued [api-call] on #seed-fetch: "On mount the badge issues GET /api/health/status exactly once, with no query string"
  - check-online-label [ui-state] on #render-online: "Given a seed body of {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'} the badge reads exactly ONLINE 3h 12m"
  - check-uptime-hours-do-not-roll [ui-state] on #render-online: "Given uptimeSeconds of 90061 the badge reads exactly ONLINE 25h 1m, not 1d 1h 1m"
  - check-degraded-label [ui-state] on #render-degraded: "Given a seed body with status 'degraded' the badge reads exactly DEGRADED, with no uptime appended"
  - check-offline-on-500 [ui-state] on #render-offline: "When GET /api/health/status responds 500 the badge reads exactly OFFLINE"
  - check-offline-on-network-failure [ui-state] on #render-offline: "When the seed request never reaches the server the badge reads exactly OFFLINE"
  - check-offline-is-clickable [ui-state] on #render-offline: "The badge in its OFFLINE state is an enabled control that accepts a click"
  - check-offline-title-unreachable [ui-state] on #render-offline: "When the seed request never reaches the server the badge's title attribute reads exactly No response from server"
  - check-offline-title-server-error [ui-state] on #render-offline: "When the seed request returns 500 the badge's title attribute reads exactly Server returned 500"
  - check-offline-title-silence [ui-state] on #render-offline: "After 30 seconds of heartbeat silence the badge's title attribute reads exactly No heartbeat for 30 seconds"
  - check-offline-after-silence [ui-state] on #render-offline: "With the socket still open and no health-status frame for 30 seconds, the badge reads exactly OFFLINE"
  - check-heartbeat-reaches-badge [ui-state] on #subscribe-heartbeat: "A health-status frame delivered after mount changes the badge text with no further HTTP request issued"
  - check-payload-updates-badge [ui-state] on #channel-routes: "A delivered health-status frame changes the badge text within 1 second of arrival"
  - check-reconnect-resumes [ui-state] on #channel-routes: "After the socket drops and reconnects, the first health-status frame moves the badge out of OFFLINE with no click issued"
  - check-uptime-advances-on-heartbeat [ui-state] on #badge-live: "Heartbeats carrying uptimeSeconds 11520 then 11580 move the badge from ONLINE 3h 12m to ONLINE 3h 13m"
  - check-no-refetch-while-live [api-call] on #badge-live: "No GET /api/health/status request is issued for as long as heartbeats keep arriving"
  - check-still-online-before-threshold [ui-state] on #badge-live: "At 29 seconds of silence the badge still reads the ONLINE text from its last heartbeat"
  - check-retry-refetches [api-call] on #retry-click: "Clicking the OFFLINE badge issues one new GET /api/health/status"
  - check-retry-recovers [ui-state] on #retry-click: "When the retry response is 200 with status ok, the badge changes from OFFLINE to ONLINE with its uptime appended"
  - check-subscription-released [custom] on #badge-unmounts: "Unmounting the app shell leaves zero active health-status subscribers on webSocketChannelState"
  - check-no-frames-after-unmount [custom] on #badge-unmounts: "A health-status frame delivered after unmount produces no state update and no console error"

Contracts you own — every property description is a requirement:
  - HealthStatusEndpoint (endpoint, modified) [packages/server/src/statics/api-routes/api-routes-statics.ts]
      webRoutePath [packages/web/src/statics/web-config/web-config-statics.ts]: The same literal declared on the web side under api.routes, per the repo's two-sided route pairing. This property lives in a different package from the rest of this contract, so it carries its own source.
  - HealthBadgeStatics (data, new) [packages/web/src/statics/health-badge/health-badge-statics.ts]
      online: Rendered with the formatted uptime appended after a single space, giving ONLINE 3h 12m.
      degraded: Rendered alone; no uptime is appended in this state.
      offline: Rendered alone for all three offline causes; the cause itself is carried in the title attribute.
      checking: Rendered only between mount and the first seed response, never after.
      testId: The stable locator the badge element carries in every state.
      silenceThresholdMs: Time since the last heartbeat after which the badge flips to OFFLINE, measured from lastHeartbeatAt.
      offlineTitleUnreachable: The title attribute when the seed request never reached the server.
      offlineTitleServerError: The title attribute when the seed request was answered with an error status.
      offlineTitleSilence: The title attribute when the badge went offline because heartbeats stopped rather than because a request failed.
  - HealthBadgeState (data, new) [packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts]
      state: One of checking, online, degraded or offline. Decides which label renders and whether uptime is appended.
      uptimeSeconds: Present only in the online state; absent in the other three, so a stale uptime can never render beside DEGRADED or OFFLINE.
      lastHeartbeatAt: Branded ISO-8601 timestamp of the most recent frame. The silence threshold is measured from it. Absent until the first frame arrives.
      offlineCause: One of unreachable, server-error or silence. Present only in the offline state, and selects which title string renders. Absent in every other state.

Design decisions constraining your scope:
  - Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a server that answers with an error, and a server that has gone quiet are three different conditions, and rendering one OFFLINE word for all three loses which is happening. The word stays one word so the top bar layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and assertable exactly.
  - Pending: the badge reads CHECKING until the first response — The three settled labels do not cover the window between mount and the first seed response. Leaving the badge blank hides that it is working, and defaulting it to OFFLINE reports something untrue about a server that may be fine. CHECKING is a fourth label used only in that window and never after.
  - The badge carries testid HEALTH_BADGE — Every interactive element in the interface carries a stable testid, and browser checks locate by testid rather than by role. Without one the badge is only reachable by its own text, which is the thing under test and therefore useless as a locator.
  - Uptime renders as Xh Ym, hours never rolling into days — One format keeps the badge to a single short line at any server age: 90061 seconds reads 25h 1m rather than 1d 1h 1m. The string never changes shape as the server ages, so the top bar layout never shifts under it.
  - DEGRADED and OFFLINE both stay in the heartbeat loop — The badge subscribes at mount rather than after a healthy seed, so every rendered state keeps consuming heartbeats. A server that recovers moves the badge back to ONLINE on its next frame with no click and no reload. Making any state stop listening would strand the badge on a reading that was true once and is not any more.
  - A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel already owns reconnection, so this flow adds nothing for it.

Seams — each line is a node you share with another package, and where that package’s half of it stands:
  - #seed-fetch with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not
      attributed to server — check-seed-route-answers: "GET /api/health/status returns 200 with a JSON body of exactly {status, uptimeSeconds, version} and no other keys"
      attributed to server — check-liveness-probe-unchanged: "GET /api/health still returns 200 with a body of exactly {status: 'ok', timestamp} and gains no new fields"
  - #subscribe-heartbeat with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not
      attributed to server — check-client-in-broadcast-set: "A client that completes the /ws upgrade receives the next health-status frame without sending any subscription message first"
  - #channel-routes with server — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not
      attributed to server — check-frame-crosses-wire: "The serialised health-status envelope arrives at the browser as one WebSocket text message carrying type, payload and timestamp"
  - #channel-routes with shared — ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not
      attributed to shared — check-payload-parses: "A health-status payload parses against healthStatusPayloadContract, and a payload missing uptimeSeconds fails that parse"

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
  ./packages/web/src/statics/web-config/web-config-statics.ts — EXISTS — the one flat map every web broker reads its URL from (api.routes, 33 keys, guilds through orchestrationMode, as const); its colocated test pins the WHOLE object with one toStrictEqual — which means it re-lists every route literal, so the key and the pin move together and the new literal necessarily appears twice.
      HealthStatusEndpoint.webRoutePath — must declare healthStatus: '/api/health/status' inside api.routes, byte-identical to the server's apiRoutesStatics.health.status.

  ./packages/web/src/statics/health-badge/health-badge-statics.ts — NEW — the badge's four state words, its testid, the silence threshold and the three offline title strings, so no label or title is a literal at a render site.
      HealthBadgeStatics.online — the word ONLINE, rendered with the formatted uptime appended after a single space.
      HealthBadgeStatics.degraded — the word DEGRADED, rendered alone.
      HealthBadgeStatics.offline — the word OFFLINE, rendered alone for all three offline causes.
      HealthBadgeStatics.checking — the word CHECKING, used only between mount and the first seed response.
      HealthBadgeStatics.testId — the literal HEALTH_BADGE the badge element carries in every state.
      HealthBadgeStatics.silenceThresholdMs — 30000, the age of lastHeartbeatAt past which the badge flips to OFFLINE.
      HealthBadgeStatics.offlineTitleUnreachable — the exact string 'No response from server'.
      HealthBadgeStatics.offlineTitleServerError — the server-error title, carried as the prefix 'Server returned' with the status code appended by the title transformer, so a 503 does not read 500.
      HealthBadgeStatics.offlineTitleSilence — the exact string 'No heartbeat for 30 seconds'.

  ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts — NEW — the one declaration of what the badge is currently showing; a discriminatedUnion on state, so an absent field is absent structurally rather than by convention.
      HealthBadgeState.state — the discriminator: checking, online, degraded or offline.
      HealthBadgeState.uptimeSeconds — declared ONLY on the online branch, so no other state can carry a stale uptime.
      HealthBadgeState.lastHeartbeatAt — branded ISO-8601, optional on online/degraded/offline and absent from the checking branch.
      HealthBadgeState.offlineCause — unreachable, server-error or silence, declared ONLY on the offline branch.

  ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts — NEW — the method-agnostic status/ok/body shape both status-aware fetch adapters parse through; same fields and same HttpStatusCode brand the POST-only contract carries today.

  ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts — EXISTS — the POST-named copy of that shape, with its stub and its test; removed by the chunk that lands the file above, because a GET-named twin beside it is exactly the variant file the architecture forbids.

  ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts — EXISTS — the only importer of that contract; its two import lines and its return type move to the renamed one, and nothing else in it changes.

  ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts — NEW — a GET that returns status/ok/body instead of throwing on non-2xx; without it a 500 and a request that never reached the server are the same thrown Error, and two of the three offline titles cannot be told apart.

  ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts — NEW — seconds to the Xh Ym string.
      check-uptime-hours-do-not-roll — must return exactly '25h 1m' for 90061 seconds, never a day unit (part 1 of 2; chunk 12 owns the rest).

  ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — NEW — badge state to the exact string the badge reads.
      check-online-label — must return exactly 'ONLINE 3h 12m' for the online branch carrying uptimeSeconds 11520 (part 1 of 2; chunk 12 owns the rest).
      check-degraded-label — must return exactly 'DEGRADED' with nothing appended, for the degraded branch (part 1 of 2; chunk 12 owns the rest).

  ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — NEW — badge state to the exact string the badge's title attribute carries.
      check-offline-title-unreachable — must return exactly 'No response from server' for offlineCause unreachable (part 1 of 2; chunk 12 owns the rest).
      check-offline-title-server-error — must return exactly 'Server returned 500' for offlineCause server-error carrying offlineStatusCode 500 (part 1 of 2; chunk 12 owns the rest).
      check-offline-title-silence — must return exactly 'No heartbeat for 30 seconds' for offlineCause silence (part 1 of 2; chunk 12 owns the rest).

  ./packages/web/src/transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer.ts — NEW — the one construction site for the online and degraded badge states, so the seed broker and the heartbeat binding cannot build two different shapes out of the same wire payload.

  ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts — NEW — the threshold comparison, pure, so 29s and 30s are provable with no timer at all.
      check-still-online-before-threshold — must return false at 29000 ms since lastHeartbeatAt (part 1 of 2; chunk 11 owns the rest).
      check-offline-after-silence — must return true at exactly healthBadgeStatics.silenceThresholdMs since lastHeartbeatAt (part 1 of 2; chunk 11 owns the rest).

  ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.ts — EXISTS — the Subject wrapper every channel subject is built from; gains a reader over the non-deprecated Subject.observed getter so the channel can answer whether anything is still listening.

  ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — EXISTS — the single shared socket per browser tab; dispatchInbound has no health-status branch today, so every heartbeat the server already emits parses past the envelope check and falls off the end of the if-chain.
      check-payload-updates-badge — must parse and push a health-status frame inside the same synchronous dispatchInbound call, introducing no delay between arrival and delivery (part 1 of 2; chunk 11 owns the rest).
      check-reconnect-resumes — the health-status subject must outlive a close and reopen, so the first frame after reconnect arrives on the same observable with nothing re-subscribed (part 1 of 2; chunk 11 owns the rest).
      check-subscription-released — must expose a reader that is true while one binding is subscribed and false once it unsubscribes (part 1 of 2; chunk 11 owns the rest).

  ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — NEW — the seed request, and the mapping of its three outcomes onto a badge state.
      check-seed-request-issued — must GET webConfigStatics.api.routes.healthStatus with no query string, once per call (part 1 of 2; chunk 11 owns the rest).
      check-offline-on-500 — must return the offline branch with offlineCause server-error and offlineStatusCode 500 (part 1 of 2; chunk 12 owns the rest).
      check-offline-on-network-failure — must return the offline branch with offlineCause unreachable when the fetch rejects (part 1 of 2; chunk 12 owns the rest).

  ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — NEW — seeds once at mount, then holds the badge state off the heartbeat, the silence tick and the retry.
      check-seed-request-issued — must call the seed broker exactly once on mount, and not again on re-render (part 2 of 2; chunk 10 owns the rest).
      check-heartbeat-reaches-badge — a delivered frame must replace the badge state with no second request to the seed endpoint.
      check-no-refetch-while-live — the seed endpoint must record exactly one request across three delivered heartbeats.
      check-uptime-advances-on-heartbeat — frames carrying 11520 then 11580 must leave uptimeSeconds 11580 (part 1 of 2; chunk 12 owns the rest).
      check-payload-updates-badge — the delivered frame must be readable in the returned state on the same act() that delivered it (part 2 of 2; chunk 9 owns the rest).
      check-reconnect-resumes — after a close and a reconnect, the first frame must move the state out of offline with no retry call (part 2 of 2; chunk 9 owns the rest).
      check-subscription-released — unmount must leave the channel's health-status subscriber reader false (part 2 of 2; chunk 9 owns the rest).
      check-no-frames-after-unmount — a frame delivered after unmount must leave the last state untouched and log nothing.
      check-still-online-before-threshold — at 29 seconds of silence the returned state must still be the online branch from the last frame (part 2 of 2; chunk 6 owns the rest).
      check-offline-after-silence — at 30 seconds of silence with the socket still open, the state must be offline with offlineCause silence (part 2 of 2; chunk 6 owns the rest).
      check-retry-refetches — retry must issue one new seed request (part 1 of 2; chunk 12 owns the rest).
      check-retry-recovers — a 200 retry must move the state from offline to the online branch carrying its uptime (part 1 of 2; chunk 12 owns the rest).

  ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — NEW — the rendered badge: one enabled control carrying the testid, the label text and the title attribute.
      check-badge-pending-text — must read exactly CHECKING between mount and the first seed response, and never after.
      check-online-label — must read exactly 'ONLINE 3h 12m' for a seed body of status ok, uptimeSeconds 11520, version 1.4.0 (part 2 of 2; chunk 5 owns the rest).
      check-uptime-hours-do-not-roll — must read exactly 'ONLINE 25h 1m' for uptimeSeconds 90061 (part 2 of 2; chunk 5 owns the rest).
      check-degraded-label — must read exactly DEGRADED for a seed body with status degraded (part 2 of 2; chunk 5 owns the rest).
      check-offline-on-500 — must read exactly OFFLINE when the seed responds 500 (part 2 of 2; chunk 10 owns the rest).
      check-offline-on-network-failure — must read exactly OFFLINE when the seed never reaches the server (part 2 of 2; chunk 10 owns the rest).
      check-offline-is-clickable — the offline badge must be an enabled control whose click fires.
      check-offline-title-unreachable — the rendered title attribute must be exactly 'No response from server' (part 2 of 2; chunk 8 owns the rest).
      check-offline-title-server-error — the rendered title attribute must be exactly 'Server returned 500' (part 2 of 2; chunk 8 owns the rest).
      check-offline-title-silence — the rendered title attribute must be exactly 'No heartbeat for 30 seconds' (part 2 of 2; chunk 8 owns the rest).
      check-uptime-advances-on-heartbeat — the rendered text must move from 'ONLINE 3h 12m' to 'ONLINE 3h 13m' across two frames (part 2 of 2; chunk 11 owns the rest).
      check-retry-refetches — clicking the badge in its offline state must issue the new seed request (part 2 of 2; chunk 11 owns the rest).
      check-retry-recovers — the rendered text must change from OFFLINE to ONLINE with its uptime after a 200 retry (part 2 of 2; chunk 11 owns the rest).

  ./packages/web/src/widgets/app/app-widget.tsx — EXISTS — the shared layout every route renders through (AppLayoutResponder is an alias of this component, mounted once around the router Outlet); its logo row is the only top-bar surface that renders unconditionally.
      check-badge-rendered — must render the badge inside the logo row's right-hand cell, beside RateLimitsStackWidget, on every route.

DEPENDS:
  ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts
      needs: ./packages/web/src/statics/http-status/http-status-statics.ts — httpStatusStatics.range.min/max, to bound offlineStatusCode the way fetch-post-with-status-result-contract.ts:19-20 already bounds status. EXISTS, unchanged this round.
      needed by: ./packages/web/src/transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer.ts — the contract it parses through; it is the only assembly site for the online and degraded branches.
      needed by: ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — the HealthBadgeState type it switches on; the union's branches are what let it read uptimeSeconds without a guard.
      needed by: ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — the same union, plus offlineCause and offlineStatusCode on the offline branch.
      needed by: ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts — the lastHeartbeatAt field type.
      needed by: ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — its return type, and the contract it parses the two offline branches through.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — the state it holds, and the contract it parses the silence branch through.
      needed by: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — via the binding's return type only; the widget declares nothing of its own.

  ./packages/web/src/statics/health-badge/health-badge-statics.ts
      needs: nothing — a statics file may import only statics, and this one needs none.
      needed by: ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — the four state words.
      needed by: ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — the three offline titles.
      needed by: ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts — silenceThresholdMs.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — silenceThresholdMs, for the tick interval.
      needed by: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — testId.

  ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts
      needs: ./packages/web/src/statics/http-status/http-status-statics.ts — the same range bounds the file it replaces reads. EXISTS, unchanged this round.
      needed by: ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts — its parse call and its return type, both currently pointing at the POST-named file.
      needed by: ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts — the same two, for the new GET.

  ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts
      needs: ./packages/web/src/statics/http-status/http-status-statics.ts — as it does today.
      needed by: ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts — the ONLY importer outside its own stub and test, confirmed by a repo-wide search for fetchPostWithStatusResultContract / FetchPostWithStatusResult; that is what makes the rename a four-file change.

  ./packages/web/src/statics/web-config/web-config-statics.ts
      needs: nothing.
      needed by: ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — api.routes.healthStatus, the seed URL.
      needed by: ./packages/web/src/brokers/health-status/get/health-status-get-broker.proxy.ts — the same key, as the url StartEndpointMock.listen is registered against (the shape rate-limits-get-broker.proxy.ts:15 already uses).

  ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts
      needs: ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts — the shape it parses its response into.
      needed by: ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — the only caller; it is what lets the broker see a 500 as a value rather than as a throw.

  ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts
      needs: ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts — after the rename.
      needed by FOUR brokers, all unchanged this round: orchestration/dispatch-play (reads result.body only, at :25), quest/start (:31-45, reads body, ok and status), quest/followup (:28-42, the same three) and quest/comment-batch (:42-84, the same three plus httpStatusStatics.conflict). None of the four imports the TYPE name — a repo-wide search for FetchPostWithStatusResult finds it only in the contract, its stub, its test and the adapter — so the rename reaches none of them, and none is in chunk 4's FILES.

  ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts
      needs: ./packages/web/src/contracts/display-label/display-label-contract.ts — its branded return type, the same one duration-display-transformer.ts:29 parses through. EXISTS, unchanged.
      needed by: ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — the string it appends after ONLINE and a single space.

  ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts
      needs: ./packages/web/src/statics/health-badge/health-badge-statics.ts, ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts, ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts, ./packages/web/src/contracts/display-label/display-label-contract.ts.
      needed by: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the badge's whole text content.

  ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts
      needs: ./packages/web/src/statics/health-badge/health-badge-statics.ts, ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts, ./packages/web/src/contracts/display-label/display-label-contract.ts. It must NOT import health-badge-label-transformer: both land in the same wave, and a same-wave import is a file one chunk reads while another writes it.
      needed by: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the badge's title attribute.

  ./packages/web/src/transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer.ts
      needs: ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts, and healthStatusPayloadContract from @dungeonmaster/shared/contracts (EXISTS, committed at 903f8b5cf).
      needed by: ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — the 200 path.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — every delivered heartbeat frame.

  ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts
      needs: ./packages/web/src/statics/health-badge/health-badge-statics.ts, ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — the only caller; it runs on each tick of the binding's interval.

  ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.ts
      needs: nothing new — rxjs only, as today.
      needed by: ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — all ten existing subjects plus the new health-status one; the SubjectAdapter<T> alias at web-socket-channel-state.ts:44 is ReturnType of this function, so the new member appears on every subject without any further edit.
      needed by: ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.proxy.ts — NOT by import, by DUPLICATION: :13-24 re-declares the adapter's {next, observable, complete} shape twice over, once as the factory's return annotation and once as create<T>'s own. Nothing type-links the two, so adding a member to the adapter and not to the proxy is a silent drift rather than a compile error. It rides with the adapter in chunk 9 and is named in that chunk's FILES.

  ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts
      needs: ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.ts — the observed reader.
      needs: healthStatusPayloadContract from @dungeonmaster/shared/contracts — the payload safeParse inside the new dispatchInbound branch, mirroring how the rate-limits and chat-output branches parse theirs.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — healthStatus$() to subscribe to, and the subscriber reader the unmount case asserts on.

  ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts
      needs: the GET-with-status adapter, web-config-statics, health-badge-state-contract, the payload transformer, and healthStatusPayloadContract from shared.
      needed by: ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — the single broker this binding wraps, called on mount and again on retry.

  ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts
      needs: the seed broker, webSocketChannelState, the payload transformer, the silence guard, health-badge-statics and health-badge-state-contract.
      needed by: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the only consumer; the widget calls no broker in render and reads everything from here.

  ./packages/web/src/widgets/health-badge/health-badge-widget.tsx
      needs: the binding, the label transformer, the title transformer, health-badge-statics, and emberDepthsThemeStatics for its colours (EXISTS, unchanged).
      needed by: ./packages/web/src/widgets/app/app-widget.tsx — one new child in the logo row's right-hand cell.
      needed by: ./packages/web/src/widgets/app/app-widget.proxy.tsx — HealthBadgeWidgetProxy must be constructed there, or every existing AppWidget test throws the moment the badge's seed request finds no staged endpoint.

  ./packages/web/src/widgets/app/app-widget.tsx
      needs: ./packages/web/src/widgets/health-badge/health-badge-widget.tsx.
      needed by: ./packages/web/src/responders/app/layout/app-layout-responder.ts — `export const AppLayoutResponder = AppWidget;`, the element every route in app-flow.tsx renders through. Unchanged this round; it is what makes one mount cover every route.

DECISIONS:
  - All four ALREADY BUILT seams are present in committed code, so this round cuts no REPAIR chunk. check-seed-route-answers and check-liveness-probe-unchanged: health-flow.ts:19 registers apiRoutesStatics.health.check returning status and timestamp only, and :26 registers apiRoutesStatics.health.status over HealthStatusResponder. check-client-in-broadcast-set: server-init-responder.ts:147 does clients.add(ws as WsClient) at upgrade with no subscription condition, :813 calls healthHeartbeatEmitBroker({clients}) on the interval at :817, and PER_QUEST_EVENT_TYPES at :67 does not carry health-status. check-frame-crosses-wire: health-heartbeat-emit-broker.ts:22-28 parses type/payload/timestamp through wsMessageContract and hands it to wsEventRelayBroadcastBroker. check-payload-parses: health-status-payload-contract.ts:15-19 declares all three fields required. All committed at 36acbc778 and 903f8b5cf.
  - The web half of #channel-routes is NOT built and is this round's work. web-socket-channel-state.ts:127-189 is an exhaustive if-chain over envelope.data.type with branches for ten types and none for health-status, so every heartbeat the server has been emitting since 38732600e parses past the wsMessageContract check at :134 and falls off the end of the chain unread.
  - The badge mounts in AppWidget's logo row, not inside QuestQueueBarWidget beside the dispatch toggle. quest-queue-bar-widget.tsx:30-32 returns null whenever the queue is empty or has no active entry, so a badge placed there is absent on most routes — which is exactly what check-badge-rendered forbids. app-layout-responder.ts:11 aliases AppWidget as the element every route in app-flow.tsx renders through, and its logo row (app-widget.tsx:56-78) renders unconditionally with RateLimitsStackWidget already in the right-hand cell at :76.
  - The binding consumes the heartbeat's own payload rather than re-fetching on it. useRateLimitsBinding:39-43 and useDispatchStateBinding:39-43 both call refresh() on every channel emission, because their frames carry an empty payload. Copying that shape here would issue an HTTP request every ten seconds forever, which check-no-refetch-while-live forbids in those words. So the health-status subject is typed SubjectAdapter<HealthStatusPayload> and carries the parsed body, the way chatOutputSubject does at :55.
  - HealthBadgeState is a z.discriminatedUnion on state, not one flat object of optionals. The property description for uptimeSeconds says a stale uptime can never render beside DEGRADED or OFFLINE; an .optional() field only asks nobody to set it, while a union branch that does not declare it makes zod strip it on parse. comment-batch-send-result-contract.ts:18-32 is the existing three-branch example in this package, and its stub at comment-batch-send-result.stub.ts carries the note that the union parse strips the now-irrelevant default fields — which is what makes a single-default stub workable for four branches.
  - HealthBadgeState gains a fifth property nobody wrote down: offlineStatusCode, branded HttpStatusCode against httpStatusStatics.range, declared only on the offline branch. check-offline-title-server-error demands the title read exactly 'Server returned 500', and the four listed properties carry no status anywhere — offlineCause is the three-value enum. Without the code the static can only be a fixed string, which would report 500 for a 503. Flagged in chunk 3's NOTES so its round-log block carries ADDED.
  - healthBadgeStatics.offlineTitleServerError is therefore the PREFIX 'Server returned', and health-badge-title-transformer appends the code after a single space. A statics file holds immutable values, not template functions, so the composition belongs in the transformer.
  - health-badge-title-transformer returns the plain state word from healthBadgeStatics for checking, online and degraded, and does NOT import health-badge-label-transformer. The two land in the same wave; importing one from the other is a file one chunk reads while its wave-mate is writing it. No observable constrains the title outside the offline state.
  - The GET-with-status result reuses one contract rather than gaining a GET-named twin. fetch-post-with-status-result-contract.ts declares exactly the status/ok/body shape the seed needs, and a repo-wide search for fetchPostWithStatusResultContract and FetchPostWithStatusResult finds importers in four files only — the contract, its stub, its test, and fetch-post-with-status-adapter.ts:12-13,21,41. The architecture's Extension Over Creation section names a variant file as the thing to avoid, so the contract is renamed to fetch-with-status-result and both adapters parse through it.
  - The subscriber reader is built on Subject.observed, not Subject.observers.length. rxjs 7.8.2's Subject.d.ts tags observers @deprecated ("Internal implementation detail, do not use directly") while observed is an ordinary getter. observed is false exactly when the count is zero, which is what check-subscription-released asserts.
  - The silence flip is a repeating tick that compares Date.now() against lastHeartbeatAt through a pure guard, not a re-armed setTimeout. The contract's own words are that the silence threshold is measured from lastHeartbeatAt; a re-armed timeout measures from the arrival instead and leaves the field decorative. The guard makes 29s and 30s provable with no timer at all, and the binding's tick only has to fire more often than the threshold.
  - After a successful seed with no frame ever delivered, lastHeartbeatAt stays absent and the badge does not flip on silence. That is the contract as written — lastHeartbeatAt is "of the most recent frame... Absent until the first frame arrives" — and the server emits every 10s (healthHeartbeatStatics.emit.intervalMs), so the first frame lands well inside the 30s window in any live browser. Recorded because it is the one gap a reader will look for.
  - Every one of the 23 observables is reachable below the browser, so NO CHUNK carries no out-of-medium line. The two that read like browser work are not: check-badge-rendered asks for an element with a testid beside two named siblings, which is a DOM assertion and not painted geometry; and check-payload-updates-badge's one-second budget is satisfied by delivery inside the same synchronous act(), since web-socket-channel-state.ts:127-189 dispatches with no scheduler between the frame and the subject.
  - Nothing in this round's unit list is already true on disk. A glob over packages/web/src for any health-named file returns nothing, and web-config-statics.ts holds no health key in its 33-entry api.routes. So NO CHUNK carries no settled line either.
  - Every finding the plan's checker returned was right and is fixed above rather than argued with: the route map holds 33 keys and not 32; the whole-object pin in web-config-statics.test.ts re-lists every literal, so the new one lands twice under packages/web/src; the rendered-text assertion parsed two ways and now parses one; fetch-post-with-status-adapter has FOUR broker callers rather than one, and dispatch-play reads only result.body; and rxjs-subject-adapter.proxy.ts duplicates the adapter's return shape instead of importing it. The one claim the checker could not reach — rxjs's own Subject.d.ts — was opened here directly at node_modules/rxjs/dist/types/internal/Subject.d.ts, which carries `/** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */ observers: Observer<T>[];` and, below it, a plain `get observed(): boolean;`. The decision stands.
  - Companion-file requirements were settled by listing the real mirror folders rather than by rule of thumb: statics and transformers and guards take .ts plus .test.ts; contracts take -contract.ts plus -contract.test.ts plus .stub.ts; adapters and brokers and state and bindings take .ts plus .proxy.ts plus .test.ts; widgets take .tsx plus .proxy.tsx plus .test.tsx. app-widget additionally carries app-widget.integration.test.tsx, which asserts exactly one WebSocket is opened across the mounted bindings — adding a fourth channel consumer is precisely what that test exists to catch, so the mount chunk owns it.
  - git status carries one untracked path, this round document, and nothing else. No dead session left work mid-round, so chunk 1 is ordinary layer-one work rather than a repair.
  - fetchGetAdapter is left alone. fetch-get-adapter.ts:17-19 throws on a non-ok response and lets a connection failure reject unmodified, and its test distinguishes the two only by message text. Branching on an Error message to decide which of two offline titles to render is the kind of coupling a status field removes, and every other GET in the package is happy with the throwing adapter.

ASSERTIONS:
  - webConfigStatics.api.routes.healthStatus parses as the exact string '/api/health/status', character-identical to apiRoutesStatics.health.status. Read both files.
  - healthBadgeStatics exports all nine properties the contract names, and its colocated test pins the WHOLE object in one toStrictEqual, so a tenth key cannot land unasserted.
  - healthBadgeStateContract.parse({state: 'degraded', uptimeSeconds: 1}) returns an object with no uptimeSeconds key, and parse({state: 'checking', offlineCause: 'silence'}) returns an object with no offlineCause key. Run either in the contract's test.
  - webSocketChannelState exposes healthStatus$(), and a JSON frame of type health-status delivered through the channel proxy reaches a subscriber carrying the parsed payload; a frame whose payload is missing uptimeSeconds reaches nobody.
  - Mounting the badge makes webSocketChannelState report a health-status subscriber, and unmounting it makes that reader false.
  - The app shell issues GET /api/health/status exactly once per mount, and the recorded request count stays at one across three delivered heartbeat frames.
  - An element with data-testid HEALTH_BADGE is in the DOM at '/' and still in the DOM after navigating to a session-view route, inside the same logo row as RATE_LIMITS_STACK.
  - The badge's rendered text is exactly one of four things: the bare word CHECKING, the bare word DEGRADED, the bare word OFFLINE, or the word ONLINE followed by a single space and an Xh Ym uptime. Only the ONLINE case carries an uptime — the other three are one word with nothing after it — and no uptime the badge ever renders uses a day unit.
  - When the badge is offline its title attribute is exactly one of 'No response from server', 'Server returned <status>', or 'No heartbeat for 30 seconds', and which one it is follows the cause rather than the order the failures happened in.
  - Clicking the badge while it reads OFFLINE issues exactly one further GET /api/health/status, and a 200 answer with status ok moves the text to ONLINE with its uptime appended.
  - fetchPostWithStatusResultContract no longer exists anywhere in the repo, and both fetch-post-with-status-adapter.ts and fetch-get-with-status-adapter.ts parse through fetchWithStatusResultContract. Grep for the old name.
  - The literal '/api/health/status' appears under packages/web/src in exactly two places, both in the same folder: web-config-statics.ts and the colocated whole-object toStrictEqual in web-config-statics.test.ts. No broker, binding, widget or test elsewhere in the package spells the path out. Grep for it.
  - The words ONLINE, DEGRADED, OFFLINE and CHECKING appear as badge text in no production file under packages/web/src other than health-badge-statics.ts. Grep for them.

NO CHUNK: none

### chunk 1 — the web side of the seed route literal
INTENT:
  - webConfigStatics.api.routes.healthStatus exists and is the string '/api/health/status'; read it beside apiRoutesStatics.health.status and the two are character-identical.
  - web-config-statics.test.ts's single whole-object toStrictEqual carries the new key, so the map and its pin cannot drift apart.
  - git diff on web-config-statics.ts is exactly one added line, and every one of the 33 existing route literals (guilds through orchestrationMode) is byte-unchanged.
  - The new literal appears twice under packages/web/src and nowhere else: once in the statics file and once in its colocated whole-object toStrictEqual, which re-lists every route.
FILES:
  - ./packages/web/src/statics/web-config/web-config-statics.ts
  - ./packages/web/src/statics/web-config/web-config-statics.test.ts
UNITS:
  - HealthStatusEndpoint.webRoutePath → ./packages/web/src/statics/web-config/web-config-statics.ts — must declare healthStatus: '/api/health/status' inside api.routes.
MIRROR: ./packages/web/src/statics/web-config/web-config-statics.ts (its own existing rateLimits: '/api/rate-limits' line, at :40)
NOTES:
  Flow #health-badge "health-badge": the operator opens any route of the app and gets a top-bar badge that
  says whether the server behind it is still answering. This chunk is node #seed-fetch's web half — the URL
  the seed request is issued against, and nothing else.

  No acceptance observable lands here. The requirement is the contract property, quoted:
  "webRoutePath: The same literal declared on the web side under api.routes, per the repo's two-sided route
  pairing. This property lives in a different package from the rest of this contract, so it carries its own
  source."

  Contract taken and returned: none. This is a statics file; a statics file may import only statics, and this
  one needs no import at all.

  Design decision constraining it: none of the six governs a route literal. The pairing convention does:
  @dungeonmaster/shared's httpEdgesLayerBroker joins server routes to web routes on (method, urlPattern) by
  reading packages/server/src/statics/api-routes/api-routes-statics.ts against
  packages/web/src/statics/web-config/web-config-statics.ts, so a literal that differs by one character
  produces two orphan edges instead of one paired one.

  Already built, read off disk: packages/server/src/statics/api-routes/api-routes-statics.ts declares
  `health: { check: '/api/health', status: '/api/health/status' }` (landed at 285dc155c). Copy the status
  value from there. web-config-statics.ts today ends its api.routes block at
  `orchestrationMode: '/api/orchestration/mode'` and carries `as const` on the whole object.

  What outside this chunk uses the change: chunk 10's broker reads api.routes.healthStatus for its URL, and
  chunk 10's broker proxy registers StartEndpointMock.listen against the same key.

### chunk 2 — the badge's words, its testid and its threshold
INTENT:
  - healthBadgeStatics exports exactly nine properties: online, degraded, offline, checking, testId, silenceThresholdMs, offlineTitleUnreachable, offlineTitleServerError, offlineTitleSilence.
  - healthBadgeStatics.testId is the string 'HEALTH_BADGE' and silenceThresholdMs is the number 30000.
  - offlineTitleUnreachable is exactly 'No response from server' and offlineTitleSilence is exactly 'No heartbeat for 30 seconds'.
  - offlineTitleServerError is the prefix 'Server returned', with no code and no trailing space; chunk 8 appends the status.
  - The colocated test is ONE it holding a single toStrictEqual over the whole exported object, so a tenth key cannot land unasserted.
FILES:
  - ./packages/web/src/statics/health-badge/health-badge-statics.ts
  - ./packages/web/src/statics/health-badge/health-badge-statics.test.ts
UNITS:
  - HealthBadgeStatics.online → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the word ONLINE, carried alone; the uptime is appended by chunk 5's label transformer.
  - HealthBadgeStatics.degraded → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the word DEGRADED.
  - HealthBadgeStatics.offline → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the word OFFLINE, one word for all three causes.
  - HealthBadgeStatics.checking → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the word CHECKING.
  - HealthBadgeStatics.testId → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the literal HEALTH_BADGE.
  - HealthBadgeStatics.silenceThresholdMs → ./packages/web/src/statics/health-badge/health-badge-statics.ts — 30000, measured from lastHeartbeatAt.
  - HealthBadgeStatics.offlineTitleUnreachable → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the title when the seed request never reached the server.
  - HealthBadgeStatics.offlineTitleServerError → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the title prefix when the seed was answered with an error status.
  - HealthBadgeStatics.offlineTitleSilence → ./packages/web/src/statics/health-badge/health-badge-statics.ts — the title when heartbeats stopped rather than a request failing.
MIRROR: ./packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts (nested as const, PURPOSE naming the period rather than restating the shape, one whole-object toStrictEqual in its test)
NOTES:
  Flow #health-badge "health-badge": the operator opens any route and reads one word — plus an uptime when
  the server is healthy — telling them whether the server is still answering. This chunk is the vocabulary
  every later chunk renders from; it implements no node on its own.

  No acceptance observable lands here. The requirements are the nine contract property descriptions, quoted:
  "online: Rendered with the formatted uptime appended after a single space, giving ONLINE 3h 12m."
  "degraded: Rendered alone; no uptime is appended in this state."
  "offline: Rendered alone for all three offline causes; the cause itself is carried in the title attribute."
  "checking: Rendered only between mount and the first seed response, never after."
  "testId: The stable locator the badge element carries in every state."
  "silenceThresholdMs: Time since the last heartbeat after which the badge flips to OFFLINE, measured from lastHeartbeatAt."
  "offlineTitleUnreachable: The title attribute when the seed request never reached the server."
  "offlineTitleServerError: The title attribute when the seed request was answered with an error status."
  "offlineTitleSilence: The title attribute when the badge went offline because heartbeats stopped rather than because a request failed."

  ADJUSTED — offlineTitleServerError is the PREFIX 'Server returned', not a whole title. The observable it
  serves is check-offline-title-server-error: "When the seed request returns 500 the badge's title attribute
  reads exactly Server returned 500". A fixed whole string would report 500 for a 503, and a statics file
  holds immutable values rather than template functions, so chunk 8's transformer appends the code. Say so in
  the file's own PURPOSE.

  Add a tenth property if and only if chunk 11's tick needs one: silenceTickMs. The threshold is 30000 and the
  tick has only to fire more often than that; 1000 is the value chunk 11 assumes. Declaring it here keeps
  chunk 11 free of a magic number. It is not one of the nine required properties, so if you add it, say so in
  your report and keep the whole-object toStrictEqual honest.

  Contracts taken and returned: none. A statics file may import only statics, and this one needs none. Do not
  brand testId here — chunk 12's widget parses it through testIdContract if it needs the brand.

  Design decisions constraining it, quoted:
  "Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a
  server that answers with an error, and a server that has gone quiet are three different conditions, and
  rendering one OFFLINE word for all three loses which is happening. The word stays one word so the top bar
  layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and
  assertable exactly."
  "Pending: the badge reads CHECKING until the first response — The three settled labels do not cover the
  window between mount and the first seed response. Leaving the badge blank hides that it is working, and
  defaulting it to OFFLINE reports something untrue about a server that may be fine. CHECKING is a fourth
  label used only in that window and never after."
  "The badge carries testid HEALTH_BADGE — Every interactive element in the interface carries a stable testid,
  and browser checks locate by testid rather than by role. Without one the badge is only reachable by its own
  text, which is the thing under test and therefore useless as a locator."

  Already built, read off disk: packages/web/src/contracts/test-id/test-id-contract.ts:11 is
  `export const testIdContract = z.string().brand<'TestId'>();`. packages/server/src/statics/health-heartbeat/
  health-heartbeat-statics.ts declares the server's 10-second emit period as emit.intervalMs = 10000; the 30s
  threshold here is three of those, which is why silence and a single dropped frame are not the same event.

  What outside this chunk uses the change: chunks 5, 6, 8, 11 and 12 all import healthBadgeStatics. Renaming
  any of the nine keys after this chunk lands breaks all five.

### chunk 3 — what the badge is currently showing, as one discriminated union
INTENT:
  - healthBadgeStateContract is a z.discriminatedUnion on 'state' with exactly four branches: checking, online, degraded, offline.
  - healthBadgeStateContract.parse({state: 'degraded', uptimeSeconds: 1}) returns an object with NO uptimeSeconds key.
  - healthBadgeStateContract.parse({state: 'checking', offlineCause: 'silence'}) returns an object with NO offlineCause key.
  - The online branch REQUIRES uptimeSeconds; parsing {state: 'online'} with no uptimeSeconds throws.
  - The offline branch REQUIRES offlineCause and rejects a fourth cause value.
  - HealthBadgeStateStub defaults to the checking branch and produces any of the other three from a full override.
FILES:
  - ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts
  - ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.test.ts
  - ./packages/web/src/contracts/health-badge-state/health-badge-state.stub.ts
UNITS:
  - HealthBadgeState.state → ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts — the union's discriminator, z.literal per branch over checking/online/degraded/offline.
  - HealthBadgeState.uptimeSeconds → ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts — declared ONLY on the online branch, so the union itself is what stops a stale uptime reaching DEGRADED or OFFLINE.
  - HealthBadgeState.lastHeartbeatAt → ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts — z.string().datetime().brand<'IsoTimestamp'>().optional() on online, degraded and offline; absent from the checking branch entirely.
  - HealthBadgeState.offlineCause → ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts — declared ONLY on the offline branch, over unreachable | server-error | silence.
MIRROR: ./packages/web/src/contracts/comment-batch-send-result/comment-batch-send-result-contract.ts (and its .stub.ts, whose comment explains why one default branch is enough for a union stub)
NOTES:
  Flow #health-badge "health-badge": every node downstream of #seed-outcome renders from this shape. This
  chunk is the shape and nothing else — no producer, no consumer.

  No acceptance observable lands here. The requirements are the four contract property descriptions, quoted:
  "state: One of checking, online, degraded or offline. Decides which label renders and whether uptime is appended."
  "uptimeSeconds: Present only in the online state; absent in the other three, so a stale uptime can never render beside DEGRADED or OFFLINE."
  "lastHeartbeatAt: Branded ISO-8601 timestamp of the most recent frame. The silence threshold is measured from it. Absent until the first frame arrives."
  "offlineCause: One of unreachable, server-error or silence. Present only in the offline state, and selects which title string renders. Absent in every other state."

  ADDED — a fifth property nobody wrote down: offlineStatusCode, on the offline branch only, optional, as
  `z.number().int().min(httpStatusStatics.range.min).max(httpStatusStatics.range.max).brand<'HttpStatusCode'>()`.
  check-offline-title-server-error requires the title to read exactly "Server returned 500", and none of the
  four listed properties can carry a status — offlineCause is a three-value enum. Without this the title can
  only be a fixed string that lies about a 503. Flag it in your report so the round log carries ADDED.

  Contracts taken and returned: this file declares HealthBadgeState and its inferred type. It imports
  httpStatusStatics from ../../statics/http-status/http-status-statics (a contract may import statics), and
  nothing else. Brand uptimeSeconds `z.number().int().nonnegative().brand<'UptimeSeconds'>()` — the SAME tag
  shared's healthStatusPayloadContract uses at packages/shared/src/contracts/health-status-payload/
  health-status-payload-contract.ts:17, so chunk 5's transformer re-brands with no assertion. Brand
  lastHeartbeatAt 'IsoTimestamp', the tag both packages/web/src/contracts/comment-queue-entry/
  comment-queue-entry-contract.ts:21 and shared's wsMessageContract.timestamp carry.

  Design decisions constraining it, quoted:
  "Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a
  server that answers with an error, and a server that has gone quiet are three different conditions, and
  rendering one OFFLINE word for all three loses which is happening. The word stays one word so the top bar
  layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and
  assertable exactly."
  "Pending: the badge reads CHECKING until the first response — ... CHECKING is a fourth label used only in
  that window and never after."

  Already built, read off disk: packages/web/src/statics/http-status/http-status-statics.ts declares
  `{ conflict: 409, range: { min: 100, max: 599 } } as const`. packages/web/src/contracts/
  comment-batch-send-result/comment-batch-send-result.stub.ts is the discriminated-union stub pattern:
  `({ ...props }: StubArgument<CommentBatchSendResult> = {}) => contract.parse({ <default branch>, ...props })`,
  with a comment saying the union parse strips the now-irrelevant default fields. Copy that shape; StubArgument
  comes from '@dungeonmaster/shared/@types'.

  What outside this chunk uses the change: chunks 5, 6, 8, 10, 11 and 12. The branch NAMES and the field names
  are the whole public surface — renaming one after this lands breaks six chunks.

### chunk 4 — one with-status result shape, shared by both fetch adapters
INTENT:
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts exports fetchWithStatusResultContract and the type FetchWithStatusResult, declaring the same status/ok/body fields and the same 'HttpStatusCode' brand the POST-named file carries today.
  - The whole folder ./packages/web/src/contracts/fetch-post-with-status-result/ is gone, and a repo-wide search for fetchPostWithStatusResultContract, FetchPostWithStatusResult and FetchPostWithStatusResultStub returns nothing.
  - fetch-post-with-status-adapter.ts imports and parses through the renamed contract, and its behaviour is otherwise byte-unchanged: the same method, the same headers, the same text-then-JSON.parse fallback.
  - fetch-post-with-status-adapter.test.ts still passes untouched, or its only change is the stub import path.
FILES:
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.test.ts
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result.stub.ts
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.test.ts
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result.stub.ts
  - ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts
  - ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.test.ts
UNITS: none — this chunk exists so chunk 7's GET adapter can reuse the POST adapter's result shape instead of adding a variant contract beside it. The architecture's Extension Over Creation section names a variant file as the thing to avoid, and this shape has nothing POST-specific in it.
MIRROR: ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts (the file being renamed — carry its fields, its brand, its httpStatusStatics bounds and its test cases across unchanged)
NOTES:
  Flow #health-badge "health-badge": node #seed-outcome has to tell three answers apart — a body, an error
  status, and no response at all. This chunk is the enabling rename that lets chunk 7 build the adapter which
  makes that distinction possible; it implements no node itself.

  No acceptance observable lands here, and no contract property either.

  Contracts taken and returned: the moved file declares `{ status: <branded HttpStatusCode>, ok: z.boolean(),
  body: z.unknown() }` and imports httpStatusStatics for its range bounds. Keep the brand tag EXACTLY
  'HttpStatusCode' — chunk 3 declares the same tag independently for HealthBadgeState.offlineStatusCode, and
  the two must stay assignable.

  Design decisions constraining it: none of the six. The constraint is architectural: the same shape under two
  method-named files is the variant file the repo forbids.

  Already built, read off disk: fetch-post-with-status-result-contract.ts:15-26 is the whole schema and the
  inferred type. fetch-post-with-status-adapter.ts:12-13 are the two imports, :21 the return type and :41 the
  parse call — those four lines are the entire adapter change. A repo-wide search for the three old names
  found importers in exactly four files: the contract, its stub, its test and that adapter.

  The adapter itself has FOUR broker callers, and none of them is in this chunk's FILES — check that before
  you widen it. They are orchestration/dispatch-play (:25, reads result.body only), quest/start (:31-45),
  quest/followup (:28-42) and quest/comment-batch (:42-84, which also compares result.status against
  httpStatusStatics.conflict). Every one of them imports the ADAPTER by its unchanged name and reads fields
  off the value it returns; not one imports the type FetchPostWithStatusResult, which is why the rename does
  not reach them. If typecheck says otherwise, the finding is real and the file joins your FILES — but read
  the import line before assuming it.

  What outside this chunk uses the change: chunk 7's adapter imports the renamed contract. Nothing else in the
  round touches it.

### chunk 5 — the three pure transformers behind the badge's text and its live state
INTENT:
  - formatUptimeTransformer({uptimeSeconds}) returns exactly '3h 12m' for 11520 and exactly '25h 1m' for 90061 — no day unit at any input.
  - formatUptimeTransformer returns '0h 0m' for 0 and '0h 1m' for 61, so a fresh server renders the same shape as an old one.
  - healthBadgeLabelTransformer returns exactly 'ONLINE 3h 12m' for the online branch with uptimeSeconds 11520, exactly 'DEGRADED' for the degraded branch, exactly 'OFFLINE' for every offline branch whatever its cause, and exactly 'CHECKING' for the checking branch.
  - The degraded and offline labels have no trailing space and nothing appended — asserted with toBe on the whole string, not a prefix match.
  - healthPayloadToBadgeStateTransformer maps status 'ok' to the online branch and status 'degraded' to the degraded branch, carries uptimeSeconds straight through, and returns a state with NO lastHeartbeatAt when it is handed null.
  - Given a lastHeartbeatAt it returns a state carrying exactly that timestamp.
FILES:
  - ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts
  - ./packages/web/src/transformers/format-uptime/format-uptime-transformer.test.ts
  - ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts
  - ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.test.ts
  - ./packages/web/src/transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer.ts
  - ./packages/web/src/transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer.test.ts
UNITS:
  - check-uptime-hours-do-not-roll → ./packages/web/src/transformers/format-uptime/format-uptime-transformer.ts — must return exactly '25h 1m' for 90061 seconds, and no input may produce a day unit (part 1 of 2; chunk 12 owns the rest).
  - check-online-label → ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — must return exactly 'ONLINE 3h 12m' for the online branch carrying uptimeSeconds 11520 (part 1 of 2; chunk 12 owns the rest).
  - check-degraded-label → ./packages/web/src/transformers/health-badge-label/health-badge-label-transformer.ts — must return exactly 'DEGRADED', with nothing appended, for the degraded branch (part 1 of 2; chunk 12 owns the rest).
MIRROR: ./packages/web/src/transformers/duration-display/duration-display-transformer.ts (a pure seconds-to-string transformer returning displayLabelContract.parse(...), with its colocated test and no proxy)
NOTES:
  Flow #health-badge "health-badge": the operator reads one line in the top bar. These three transformers are
  nodes #render-online, #render-degraded and #render-offline's string half, plus the payload-to-state mapping
  #seed-outcome and #heartbeat-outcome both run. Nothing here renders anything or calls anything.

  The observables, quoted word for word:
  check-online-label: "Given a seed body of {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'} the badge reads exactly ONLINE 3h 12m"
  check-uptime-hours-do-not-roll: "Given uptimeSeconds of 90061 the badge reads exactly ONLINE 25h 1m, not 1d 1h 1m"
  check-degraded-label: "Given a seed body with status 'degraded' the badge reads exactly DEGRADED, with no uptime appended"
  Each says "the badge reads" — chunk 12 owns that half against a rendered widget. Your half is the exact
  string, asserted with toBe.

  Contracts taken and returned: formatUptimeTransformer takes uptimeSeconds and returns DisplayLabel via
  displayLabelContract.parse. healthBadgeLabelTransformer takes {badgeState: HealthBadgeState} and returns
  DisplayLabel; it imports healthBadgeStatics for the four words and formatUptimeTransformer for the appended
  uptime, and appends after exactly one space. healthPayloadToBadgeStateTransformer takes
  {payload: HealthStatusPayload; lastHeartbeatAt: IsoTimestamp | null} and returns HealthBadgeState via
  healthBadgeStateContract.parse — pass null and build the object WITHOUT the key rather than passing
  undefined, because this repo runs exactRequiredOptionalPropertyTypes-style strictness and an explicit
  undefined is not the same as an omitted key.

  Design decisions constraining them, quoted:
  "Uptime renders as Xh Ym, hours never rolling into days — One format keeps the badge to a single short line
  at any server age: 90061 seconds reads 25h 1m rather than 1d 1h 1m. The string never changes shape as the
  server ages, so the top bar layout never shifts under it."
  "Failure states: the cause of OFFLINE is named, not just the state — ... The word stays one word so the top
  bar layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and
  assertable exactly." — which is why the label transformer returns the bare word OFFLINE for all three
  causes and never appends the cause to it.

  Already built, read off disk: packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts:15-19
  is `z.object({ status: z.enum(['ok','degraded']).brand<'HealthStatusValue'>(), uptimeSeconds:
  z.number().int().nonnegative().brand<'UptimeSeconds'>(), version: z.string().min(1).brand<'ServerVersion'>() })`,
  exported from '@dungeonmaster/shared/contracts' together with HealthStatusPayloadStub. Import it by that
  subpath — a transformer may import another package's contracts. packages/web/src/contracts/display-label/
  display-label-contract.ts:11 is `z.string().brand<'DisplayLabel'>()` with an unconstrained base, so any
  string parses. duration-display-transformer.ts:29 shows the parse-on-return shape.

  What outside this chunk uses these: chunk 12's widget imports the label transformer; chunks 10 and 11 both
  import the payload transformer; only the label transformer imports formatUptime. Their signatures are the
  public surface.

### chunk 6 — the silence threshold, as a pure comparison
INTENT:
  - isHeartbeatSilentGuard returns false when now is exactly 29000 ms after lastHeartbeatAt.
  - It returns true when now is exactly healthBadgeStatics.silenceThresholdMs after lastHeartbeatAt — the boundary is inclusive, and the test names 30000 rather than reading the static, so a change to the static reds the test.
  - It returns false when lastHeartbeatAt is absent, so a badge that has never seen a frame never flips on silence.
  - It reads no clock of its own: `now` is a parameter, so every case is provable with no timer.
FILES:
  - ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts
  - ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.test.ts
UNITS:
  - check-still-online-before-threshold → ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts — must return false at 29000 ms since lastHeartbeatAt (part 1 of 2; chunk 11 owns the rest).
  - check-offline-after-silence → ./packages/web/src/guards/is-heartbeat-silent/is-heartbeat-silent-guard.ts — must return true at exactly healthBadgeStatics.silenceThresholdMs since lastHeartbeatAt (part 1 of 2; chunk 11 owns the rest).
MIRROR: ./packages/web/src/guards/is-workspace-route/is-workspace-route-guard.ts (a pure boolean guard, .ts plus .test.ts and no proxy)
NOTES:
  Flow #health-badge "health-badge": node #silence-timer. The socket can stay open while the server behind it
  has stopped doing work, so silence — not disconnection — is what moves the badge to OFFLINE. This chunk is
  the comparison only; chunk 11 owns the tick that calls it and the state it writes.

  The observables, quoted word for word:
  check-still-online-before-threshold: "At 29 seconds of silence the badge still reads the ONLINE text from its last heartbeat"
  check-offline-after-silence: "With the socket still open and no health-status frame for 30 seconds, the badge reads exactly OFFLINE"
  Both say what the badge reads; chunk 11 owns that half against the binding's returned state. Your half is
  the boundary, at 29000 and at 30000 exactly.

  Contracts taken and returned: takes {lastHeartbeatAt: HealthBadgeState['lastHeartbeatAt'] | undefined-free
  equivalent; now: number-branded-per-repo-convention} — read health-badge-state-contract.ts for the exact
  field type chunk 3 landed and take THAT, rather than restating an ISO string type of your own. Returns
  boolean, which is what a guard returns and the one place ban-primitives does not bite. Imports
  healthBadgeStatics for silenceThresholdMs.

  Design decision constraining it, quoted:
  "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by
  transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold
  may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel
  already owns reconnection, so this flow adds nothing for it."
  That is why this guard takes a timestamp and a clock reading and nothing about the socket.

  Already built, read off disk: packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts sets
  the server's emit period to 10000 ms, so 30000 is three missed frames rather than one — do not narrow the
  threshold to catch a single dropped frame.

  What outside this chunk uses it: chunk 11's binding, and nothing else.

### chunk 7 — a GET that hands back the status instead of throwing it away
INTENT:
  - fetchGetWithStatusAdapter resolves with {status: 500, ok: false, body: <parsed>} for a 500 instead of throwing.
  - It resolves with {status: 200, ok: true, body: <parsed>} for a 200.
  - A connection-level failure still REJECTS, so the caller can tell "answered badly" from "never answered".
  - It sends GET with an Accept: application/json header and no body, and the URL it is given reaches globalThis.fetch unchanged — no query string is appended.
  - A non-JSON body comes back as raw text rather than throwing, matching the POST adapter's behaviour exactly.
FILES:
  - ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts
  - ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.proxy.ts
  - ./packages/web/src/adapters/fetch/get-with-status/fetch-get-with-status-adapter.test.ts
UNITS: none — this chunk exists because fetch-get-adapter.ts:17-19 collapses a 500 and an unreachable server into one thrown Error, and two of the badge's three offline titles are exactly that distinction. The observables it enables are proved in chunks 10 and 12.
MIRROR: ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts (and its .proxy.ts, which is the empty `(): Record<PropertyKey, never> => ({})` shape every fetch adapter proxy in this package uses, because MSW intercepts at the network level)
NOTES:
  Flow #health-badge "health-badge": node #seed-fetch's transport. The badge has to say WHICH way the server
  failed, and the existing GET adapter throws the same Error shape either way.

  No acceptance observable lands here; chunk 10's broker is where the outcomes become badge states, and chunk
  12's widget is where they become titles.

  Contracts taken and returned: takes {url: string} and returns Promise<FetchWithStatusResult> from
  ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts — the file chunk
  4 lands. Do NOT import fetch-post-with-status-result-contract; chunk 4 deletes it in the wave before yours.

  Design decision constraining it, quoted:
  "Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a
  server that answers with an error, and a server that has gone quiet are three different conditions, and
  rendering one OFFLINE word for all three loses which is happening."

  Already built, read off disk: fetch-post-with-status-adapter.ts:22-45 is the whole body to mirror — fetch,
  then `const text = await response.text()`, then a try/catch JSON.parse that falls back to the raw text, then
  one contract.parse of {status, ok, body}. Change the method to GET, drop the request body and the
  Content-Type header, keep Accept. fetch-get-adapter.ts:9-22 is the existing throwing GET; leave it alone,
  every other GET in the package is happy with it.

  What outside this chunk uses it: chunk 10's broker is the only caller.

### chunk 8 — the badge's title attribute, one string per cause
INTENT:
  - healthBadgeTitleTransformer returns exactly 'No response from server' for the offline branch with offlineCause 'unreachable'.
  - It returns exactly 'Server returned 500' for offlineCause 'server-error' with offlineStatusCode 500, and exactly 'Server returned 503' for 503 — the code is read from the state, never hardcoded.
  - It returns exactly 'No heartbeat for 30 seconds' for offlineCause 'silence'.
  - For the checking, online and degraded branches it returns the plain state word from healthBadgeStatics, so the title is always a string and the widget never has to branch on undefined.
  - It does NOT import health-badge-label-transformer.
FILES:
  - ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts
  - ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.test.ts
UNITS:
  - check-offline-title-unreachable → ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — must return exactly 'No response from server' for offlineCause unreachable (part 1 of 2; chunk 12 owns the rest).
  - check-offline-title-server-error → ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — must return exactly 'Server returned 500' for offlineCause server-error carrying offlineStatusCode 500 (part 1 of 2; chunk 12 owns the rest).
  - check-offline-title-silence → ./packages/web/src/transformers/health-badge-title/health-badge-title-transformer.ts — must return exactly 'No heartbeat for 30 seconds' for offlineCause silence (part 1 of 2; chunk 12 owns the rest).
MIRROR: ./packages/web/src/transformers/duration-display/duration-display-transformer.ts (pure, returns displayLabelContract.parse(...), .ts plus .test.ts, no proxy)
NOTES:
  Flow #health-badge "health-badge": nodes #render-offline and #seed-outcome. OFFLINE stays one word so the
  top bar layout holds, and the reason it is offline lives in the title attribute where a hover reveals it.

  The observables, quoted word for word:
  check-offline-title-unreachable: "When the seed request never reaches the server the badge's title attribute reads exactly No response from server"
  check-offline-title-server-error: "When the seed request returns 500 the badge's title attribute reads exactly Server returned 500"
  check-offline-title-silence: "After 30 seconds of heartbeat silence the badge's title attribute reads exactly No heartbeat for 30 seconds"
  Chunk 12 owns the rendered-attribute half of each. Your half is the exact string, asserted with toBe.

  Contracts taken and returned: takes {badgeState: HealthBadgeState} and returns DisplayLabel via
  displayLabelContract.parse. Imports healthBadgeStatics and health-badge-state-contract only.

  healthBadgeStatics.offlineTitleServerError is the PREFIX 'Server returned'; you append a single space and
  the code. When offlineStatusCode is absent from an otherwise server-error state, return the prefix alone
  rather than 'Server returned undefined' — and give that case a test, because the union permits it.

  You must NOT import health-badge-label-transformer, even though returning its output for the three
  non-offline states would read well. Chunk 5 writes that file in the same wave as this one, and a same-wave
  import is a file one worker reads while another is still writing it. Read healthBadgeStatics directly.

  Design decision constraining it, quoted:
  "Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a
  server that answers with an error, and a server that has gone quiet are three different conditions, and
  rendering one OFFLINE word for all three loses which is happening. The word stays one word so the top bar
  layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and
  assertable exactly."

  Already built, read off disk: packages/web/src/contracts/display-label/display-label-contract.ts:11 is
  `z.string().brand<'DisplayLabel'>()`.

  What outside this chunk uses it: chunk 12's widget, and nothing else.

### chunk 9 — the channel routes health-status, and can say who is still listening
INTENT:
  - webSocketChannelState.healthStatus$() exists and a frame of {type: 'health-status', payload: {status, uptimeSeconds, version}, timestamp} delivered through the channel proxy reaches a subscriber carrying the PARSED payload, not the raw record.
  - A health-status frame whose payload is missing uptimeSeconds reaches no subscriber, because the branch safeParses through healthStatusPayloadContract the way every other branch parses its own payload.
  - The new branch sits inside dispatchInbound and pushes synchronously — the subscriber's callback has run by the time deliverMessage returns.
  - The health-status subject survives triggerClose followed by triggerReconnect: a subscriber taken before the close still receives the first frame after the reopen, with nothing re-subscribed.
  - rxjsSubjectAdapter exposes a reader over Subject.observed, and webSocketChannelState reports false for health-status subscribers before anything subscribes, true while one subscription is live, and false again after it unsubscribes.
  - Every existing branch of dispatchInbound and every existing observable getter is byte-unchanged, and web-socket-channel-state.test.ts's existing cases still pass.
FILES:
  - ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.ts
  - ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.proxy.ts
  - ./packages/web/src/adapters/rxjs/subject/rxjs-subject-adapter.test.ts
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.proxy.ts
  - ./packages/web/src/state/web-socket-channel/web-socket-channel-state.test.ts
UNITS:
  - check-payload-updates-badge → ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — must parse and push a health-status frame inside the same synchronous dispatchInbound call, so no delay is introduced between arrival and delivery (part 1 of 2; chunk 11 owns the rest).
  - check-reconnect-resumes → ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — the health-status subject must outlive a close and reopen, so the first frame after reconnect arrives on the same observable with nothing re-subscribed (part 1 of 2; chunk 11 owns the rest).
  - check-subscription-released → ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — must expose a reader that is true while one subscription is live and false once it unsubscribes (part 1 of 2; chunk 11 owns the rest).
MIRROR: ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts itself — the chat-output branch at :137-141 (safeParse the payload, push the parsed data, return) and the chatOutputSubject / chatOutput$ pair at :55 and :193-194
NOTES:
  Flow #health-badge "health-badge": nodes #subscribe-heartbeat and #channel-routes, the web half. The server
  has been emitting a health-status frame every ten seconds since 38732600e; the browser has been dropping
  every one of them, because dispatchInbound's if-chain has no branch for that type and the frame falls off
  the end.

  The observables, quoted word for word:
  check-payload-updates-badge: "A delivered health-status frame changes the badge text within 1 second of arrival"
  check-reconnect-resumes: "After the socket drops and reconnects, the first health-status frame moves the badge out of OFFLINE with no click issued"
  check-subscription-released: "Unmounting the app shell leaves zero active health-status subscribers on webSocketChannelState"
  Chunk 11 owns the badge-state half of each. Your half is the channel: delivery in the same synchronous call,
  survival across a reconnect, and a truthful subscriber reader.

  Contracts taken and returned: add `healthStatusSubject: SubjectAdapter<HealthStatusPayload>` to
  internalState, initialised `rxjsSubjectAdapter<HealthStatusPayload>()`, and
  `healthStatus$: (): ChannelObservable<HealthStatusPayload> => internalState.healthStatusSubject.observable`
  beside the other getters. Import HealthStatusPayload and healthStatusPayloadContract from
  '@dungeonmaster/shared/contracts'. Note the shape difference from rate-limits: rateLimitsChangedSubject is
  SubjectAdapter<undefined> because that frame carries an empty payload, and its consumers re-fetch. This one
  carries the body, and check-no-refetch-while-live forbids re-fetching — so type the subject on the payload.

  For the subscriber reader: add `observed: (): boolean => subject.observed` to rxjsSubjectAdapter's returned
  object and its declared return type, then expose
  `hasHealthStatusSubscribers: (): boolean => internalState.healthStatusSubject.observed()` on
  webSocketChannelState. Use Subject.observed, NOT Subject.observers.length — rxjs 7.8.2's Subject.d.ts tags
  `observers` @deprecated ("Internal implementation detail, do not use directly. Will be made internal in
  v8."), while `observed` is an ordinary getter that is false exactly when the count is zero. The
  SubjectAdapter<T> alias at web-socket-channel-state.ts:44 is ReturnType<typeof rxjsSubjectAdapter<T>>, so
  the new member appears on all eleven subjects with no further edit; keep rxjs-subject-adapter.proxy.ts's
  create<T>() return shape in parity or its declared type drifts from the adapter's.

  Design decisions constraining it, quoted:
  "DEGRADED and OFFLINE both stay in the heartbeat loop — The badge subscribes at mount rather than after a
  healthy seed, so every rendered state keeps consuming heartbeats. A server that recovers moves the badge
  back to ONLINE on its next frame with no click and no reload. Making any state stop listening would strand
  the badge on a reading that was true once and is not any more."
  "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by
  transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold
  may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel
  already owns reconnection, so this flow adds nothing for it."
  The second is why you add NO reconnect handling here: openConnection at :104-125 and the onClose reconnect
  timer at :115-123 already do it, and internalState's subjects are module-level, so they survive a socket
  swap untouched. Prove that rather than building for it.

  Already built, read off disk: web-socket-channel-state.proxy.ts exposes setupEmpty(), connect(),
  deliverMessage({data}), triggerOpen(), triggerClose(), triggerReconnectFlush(), triggerReconnect() and
  getSentMessages(); triggerReconnect calls webSocketChannelState.openConnection() then fires onopen
  explicitly, and its inline comment explains why the two steps are needed. Tests must call setupEmpty()
  before connect() to reset the singleton. shared's orchestration-event-type-contract.ts:36 already carries
  'health-status' as an enum member, so wsMessageContract.safeParse at :134 already ACCEPTS these frames —
  what is missing is only the branch below it. wsMessageContract's payload field is
  `z.record(z.string().brand<'PayloadKey'>(), z.unknown())`, so envelope.data.payload is a record you pass
  straight to healthStatusPayloadContract.safeParse.

  What outside this chunk uses the change: chunk 11's binding subscribes to healthStatus$() and asserts on
  hasHealthStatusSubscribers(). Both names are the public surface; nothing else in the round touches this file.

### chunk 10 — the seed request, and its three outcomes as badge states
INTENT:
  - healthStatusGetBroker() issues exactly one GET against webConfigStatics.api.routes.healthStatus per call, with no query string — asserted from the endpoint's own recorded request count, not from a spy on fetch.
  - A 200 carrying {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'} returns the online branch with uptimeSeconds 11520 and no lastHeartbeatAt.
  - A 200 carrying status 'degraded' returns the degraded branch, with no uptimeSeconds on the returned object at all.
  - A 500 returns the offline branch with offlineCause 'server-error' and offlineStatusCode 500, and does not throw.
  - A network error returns the offline branch with offlineCause 'unreachable', and does not throw.
  - A 200 whose body fails healthStatusPayloadContract returns the offline branch with offlineCause 'server-error' rather than throwing into the binding.
FILES:
  - ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts
  - ./packages/web/src/brokers/health-status/get/health-status-get-broker.proxy.ts
  - ./packages/web/src/brokers/health-status/get/health-status-get-broker.test.ts
UNITS:
  - check-seed-request-issued → ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — must GET webConfigStatics.api.routes.healthStatus with no query string, once per call (part 1 of 2; chunk 11 owns the rest).
  - check-offline-on-500 → ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — must return the offline branch with offlineCause server-error and offlineStatusCode 500 (part 1 of 2; chunk 12 owns the rest).
  - check-offline-on-network-failure → ./packages/web/src/brokers/health-status/get/health-status-get-broker.ts — must return the offline branch with offlineCause unreachable when the fetch rejects (part 1 of 2; chunk 12 owns the rest).
MIRROR: ./packages/web/src/brokers/rate-limits/get/rate-limits-get-broker.ts (and its .proxy.ts, which registers StartEndpointMock.listen({method: 'get', url: webConfigStatics.api.routes.<key>}) and exposes semantic setup methods)
NOTES:
  Flow #health-badge "health-badge": nodes #seed-fetch and #seed-outcome. At mount the badge asks the server
  once how it is, and this broker turns the three possible answers into the three things the badge can say.

  The observables, quoted word for word:
  check-seed-request-issued: "On mount the badge issues GET /api/health/status exactly once, with no query string"
  check-offline-on-500: "When GET /api/health/status responds 500 the badge reads exactly OFFLINE"
  check-offline-on-network-failure: "When the seed request never reaches the server the badge reads exactly OFFLINE"
  Chunk 11 owns the once-per-mount half of the first; chunk 12 owns the rendered-OFFLINE half of the other two.

  Contracts taken and returned: takes nothing and returns Promise<HealthBadgeState>. It calls
  fetchGetWithStatusAdapter (chunk 7), branches on result.ok, safeParses result.body through
  healthStatusPayloadContract from '@dungeonmaster/shared/contracts', hands a successful parse to
  healthPayloadToBadgeStateTransformer (chunk 5) with lastHeartbeatAt null, and parses the two offline shapes
  through healthBadgeStateContract itself. The unreachable case is the adapter's REJECTION, so it needs a
  try/catch — catch, return the unreachable branch, and do not swallow silently: this IS handling, and
  ban-silent-catch is satisfied by returning a state that reports the failure.

  Design decision constraining it, quoted:
  "Failure states: the cause of OFFLINE is named, not just the state — A server that cannot be reached, a
  server that answers with an error, and a server that has gone quiet are three different conditions, and
  rendering one OFFLINE word for all three loses which is happening."
  Two of those three are decided here; the third is chunk 11's.

  Already built, read off disk: rate-limits-get-broker.ts:14-24 is the broker shape —
  `fetchGetAdapter<...>({url: webConfigStatics.api.routes.rateLimits})` then a contract parse.
  rate-limits-get-broker.proxy.ts:13-16 registers `StartEndpointMock.listen({method: 'get', url:
  webConfigStatics.api.routes.rateLimits})` and constructs fetchGetAdapterProxy() for the
  enforce-proxy-child-creation rule — construct fetchGetWithStatusAdapterProxy() instead.
  EndpointMockListenResponder returns resolves({data}), responds({status, body}), respondRaw(...),
  networkError(), getRequestCount(): RequestCount and getRequestBodies(): Promise<unknown[]>. Surface
  getRequestCount through your proxy — chunk 11 needs it for check-no-refetch-while-live, and it is the only
  honest way to count requests without spying on fetch.
  The server side is committed and verified: health-flow.ts:26 registers apiRoutesStatics.health.status over
  HealthStatusResponder, which answers 200 with the payload as the WHOLE body — not nested under a key —
  and 500 with {error} when the version read throws.

  A note on blast radius: @dungeonmaster/shared's httpEdgesLayerBroker pairs web broker fetch calls against
  server flow routes to build the project-map EDGES view, and this broker plus chunk 1's route key create a
  new paired edge. architecture-project-map-broker.integration.test.ts runs against the real monorepo; its
  assertions are structural (headers, separators, named chains) rather than an exhaustive route list, so a new
  edge should pass it. If it does not, the fix is that test, not this broker.

  What outside this chunk uses it: chunk 11's binding, which calls it on mount and again on retry. Its proxy's
  method names are what chunk 11's proxy delegates to.

### chunk 11 — the binding: one seed, then the heartbeat, the silence tick and the retry
INTENT:
  - useHealthStatusBinding returns the checking branch before the seed resolves, and the seed's result after.
  - It calls the seed broker exactly once per mount: the endpoint's recorded request count is 1 after mount and still 1 after three delivered heartbeat frames.
  - A delivered health-status frame replaces the returned state, carrying that frame's uptimeSeconds and a lastHeartbeatAt.
  - Two frames carrying uptimeSeconds 11520 then 11580 leave uptimeSeconds 11580.
  - At 29 seconds after the last frame the state is still the online branch from that frame; at 30 seconds it is the offline branch with offlineCause 'silence'.
  - After triggerClose then triggerReconnect, the first delivered frame moves the state out of offline with no retry call.
  - Mounting makes webSocketChannelState.hasHealthStatusSubscribers() true; unmounting makes it false.
  - A frame delivered after unmount leaves the last returned state untouched and records zero console.error calls.
  - retry() issues exactly one further seed request, and a 200 with status ok moves the state from offline to the online branch carrying its uptime.
FILES:
  - ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts
  - ./packages/web/src/bindings/use-health-status/use-health-status-binding.proxy.ts
  - ./packages/web/src/bindings/use-health-status/use-health-status-binding.test.ts
UNITS:
  - check-seed-request-issued → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — must call the seed broker exactly once on mount and not again on re-render (part 2 of 2; chunk 10 owns the rest).
  - check-heartbeat-reaches-badge → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — a delivered frame must replace the returned state with no second request to the seed endpoint.
  - check-no-refetch-while-live → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — the endpoint's recorded request count must still be 1 after three delivered heartbeats.
  - check-uptime-advances-on-heartbeat → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — frames carrying 11520 then 11580 must leave uptimeSeconds 11580 (part 1 of 2; chunk 12 owns the rest).
  - check-payload-updates-badge → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — the delivered frame must be readable in the returned state on the same act() that delivered it (part 2 of 2; chunk 9 owns the rest).
  - check-reconnect-resumes → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — after a close and a reconnect, the first frame must move the state out of offline with no retry call (part 2 of 2; chunk 9 owns the rest).
  - check-subscription-released → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — unmount must leave hasHealthStatusSubscribers() false (part 2 of 2; chunk 9 owns the rest).
  - check-no-frames-after-unmount → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — a frame delivered after unmount must leave the last state untouched and record zero console.error calls.
  - check-still-online-before-threshold → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — at 29 seconds of silence the returned state must still be the online branch from the last frame (part 2 of 2; chunk 6 owns the rest).
  - check-offline-after-silence → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — at 30 seconds of silence with the socket still open, the state must be offline with offlineCause silence (part 2 of 2; chunk 6 owns the rest).
  - check-retry-refetches → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — retry must issue exactly one new seed request (part 1 of 2; chunk 12 owns the rest).
  - check-retry-recovers → ./packages/web/src/bindings/use-health-status/use-health-status-binding.ts — a 200 retry must move the state from offline to the online branch carrying its uptime (part 1 of 2; chunk 12 owns the rest).
MIRROR: ./packages/web/src/bindings/use-rate-limits/use-rate-limits-binding.ts (and its .proxy.ts and .test.ts — the seed-in-useEffect, subscribe, unsubscribe-in-cleanup shape, the console.error passthrough spy, and setupConnectedChannel / deliverWsMessage)
NOTES:
  Flow #health-badge "health-badge": nodes #subscribe-heartbeat, #heartbeat-outcome, #badge-live, #silence-timer,
  #retry-click and #badge-unmounts. This is the largest chunk in the round and the heart of the feature: the
  badge is seeded once, then kept alive by frames the server already sends, flipped to OFFLINE by silence
  rather than by disconnection, and recoverable by a click.

  The observables, quoted word for word:
  check-seed-request-issued: "On mount the badge issues GET /api/health/status exactly once, with no query string"
  check-heartbeat-reaches-badge: "A health-status frame delivered after mount changes the badge text with no further HTTP request issued"
  check-payload-updates-badge: "A delivered health-status frame changes the badge text within 1 second of arrival"
  check-reconnect-resumes: "After the socket drops and reconnects, the first health-status frame moves the badge out of OFFLINE with no click issued"
  check-uptime-advances-on-heartbeat: "Heartbeats carrying uptimeSeconds 11520 then 11580 move the badge from ONLINE 3h 12m to ONLINE 3h 13m"
  check-no-refetch-while-live: "No GET /api/health/status request is issued for as long as heartbeats keep arriving"
  check-still-online-before-threshold: "At 29 seconds of silence the badge still reads the ONLINE text from its last heartbeat"
  check-offline-after-silence: "With the socket still open and no health-status frame for 30 seconds, the badge reads exactly OFFLINE"
  check-retry-refetches: "Clicking the OFFLINE badge issues one new GET /api/health/status"
  check-retry-recovers: "When the retry response is 200 with status ok, the badge changes from OFFLINE to ONLINE with its uptime appended"
  check-subscription-released: "Unmounting the app shell leaves zero active health-status subscribers on webSocketChannelState"
  check-no-frames-after-unmount: "A health-status frame delivered after unmount produces no state update and no console error"

  Contracts taken and returned: returns {badgeState: HealthBadgeState; retry: () => void}. It wraps ONE broker
  — healthStatusGetBroker — which is what the bindings rule requires; the channel subscription, the tick and
  the guard are not brokers. Do NOT re-fetch on a frame: healthPayloadToBadgeStateTransformer turns the
  delivered payload straight into the next state, with lastHeartbeatAt taken from the moment of arrival. This
  is the one place this binding must NOT copy useRateLimitsBinding, whose :39-43 calls refresh() on every
  emission — that shape would issue an HTTP request every ten seconds forever and fail
  check-no-refetch-while-live in those words.

  The silence tick: a setInterval at healthBadgeStatics.silenceTickMs (add it in chunk 2 if it is not there;
  1000 is the value assumed here) that calls isHeartbeatSilentGuard with the current state's lastHeartbeatAt
  and Date.now(), and on true parses {state: 'offline', offlineCause: 'silence', lastHeartbeatAt} through
  healthBadgeStateContract. Clear it in the effect cleanup beside subscription.unsubscribe(). Note the gap and
  do not try to close it: with no frame ever delivered the state has no lastHeartbeatAt, so a seed-only badge
  never flips on silence. That is the contract as written ("Absent until the first frame arrives") and the
  server emits every 10s, so the first frame lands well inside the window.

  Design decisions constraining it, quoted:
  "DEGRADED and OFFLINE both stay in the heartbeat loop — The badge subscribes at mount rather than after a
  healthy seed, so every rendered state keeps consuming heartbeats. A server that recovers moves the badge
  back to ONLINE on its next frame with no click and no reload. Making any state stop listening would strand
  the badge on a reading that was true once and is not any more." — subscribe unconditionally in the mount
  effect, never inside a branch on the seed's outcome.
  "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by
  transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold
  may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel
  already owns reconnection, so this flow adds nothing for it." — do not subscribe to opens$ and do not
  re-seed on reconnect. check-reconnect-resumes is proved by there being no such code.
  "Pending: the badge reads CHECKING until the first response — ... CHECKING is a fourth label used only in
  that window and never after."

  Already built, read off disk: use-rate-limits-binding.ts:34-48 is the effect shape — seed, subscribe, return
  a cleanup that unsubscribes. use-rate-limits-binding.proxy.ts composes rateLimitsGetBrokerProxy() and
  webSocketChannelStateProxy(), exposes setupConnectedChannel() (setupEmpty, connect, triggerOpen) and
  deliverWsMessage({data}), and registers `registerSpyOn({object: globalThis.console, method: 'error',
  passthrough: true}).calledWith(['[use-rate-limits]']).returns(undefined)` — passthrough because React's own
  act() warnings flow through the same sink. use-rate-limits-binding.test.ts:80-90 shows delivering a frame
  inside testingLibraryActAdapter({callback}) with a JSON.stringify'd {type, payload, timestamp}.
  testingLibraryRenderHookAdapter returns @testing-library/react's RenderHookResult, so `unmount` and
  `rerender` are available off the same destructure as `result`.
  For the timer cases, jest fake timers are already used in this package — see
  packages/web/src/adapters/rxjs/timeout/rxjs-timeout-adapter.test.ts:14,45,63 for useFakeTimers and
  advanceTimersByTime. Modern fake timers move Date.now() with the clock, which is what makes the 29s and 30s
  cases real; be careful mixing them with testingLibraryWaitForAdapter, which polls on a real clock.
  For the zero-console-error assertion, use the spy's callsMatching([]) list length rather than a negated
  matcher — `.not.toHaveBeenCalled()` is banned in this repo.

  What outside this chunk uses the change: chunk 12's widget is the only consumer, and it reads both
  badgeState and retry. The returned property names are the public surface.

### chunk 12 — the badge itself
INTENT:
  - The badge renders one element carrying data-testid HEALTH_BADGE in every one of the four states.
  - It reads exactly CHECKING between mount and the first seed response, and never after one has arrived.
  - Given a seed body of {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'} it reads exactly 'ONLINE 3h 12m'; given uptimeSeconds 90061 it reads exactly 'ONLINE 25h 1m'.
  - Given a seed body with status 'degraded' it reads exactly DEGRADED, with nothing after the word.
  - It reads exactly OFFLINE when the seed responds 500, and exactly OFFLINE when the seed never reaches the server.
  - Its title attribute reads exactly 'No response from server', 'Server returned 500' and 'No heartbeat for 30 seconds' in those three cases respectively.
  - The badge is an enabled control in its OFFLINE state: it is not disabled, and a click on it reaches the binding's retry.
  - Clicking it while OFFLINE issues one further seed request, and a 200 with status ok changes the text from OFFLINE to ONLINE with its uptime appended.
  - Two delivered frames move the rendered text from 'ONLINE 3h 12m' to 'ONLINE 3h 13m'.
FILES:
  - ./packages/web/src/widgets/health-badge/health-badge-widget.tsx
  - ./packages/web/src/widgets/health-badge/health-badge-widget.proxy.tsx
  - ./packages/web/src/widgets/health-badge/health-badge-widget.test.tsx
UNITS:
  - check-badge-pending-text → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — must read exactly CHECKING between mount and the first seed response, and never after.
  - check-online-label → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text for that seed body must be exactly 'ONLINE 3h 12m' (part 2 of 2; chunk 5 owns the rest).
  - check-uptime-hours-do-not-roll → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text for uptimeSeconds 90061 must be exactly 'ONLINE 25h 1m' (part 2 of 2; chunk 5 owns the rest).
  - check-degraded-label → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text for a degraded seed must be exactly DEGRADED (part 2 of 2; chunk 5 owns the rest).
  - check-offline-on-500 → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text after a 500 seed must be exactly OFFLINE (part 2 of 2; chunk 10 owns the rest).
  - check-offline-on-network-failure → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text after a network-failed seed must be exactly OFFLINE (part 2 of 2; chunk 10 owns the rest).
  - check-offline-is-clickable → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the offline badge must be an enabled control whose click reaches retry.
  - check-offline-title-unreachable → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered title attribute must be exactly 'No response from server' (part 2 of 2; chunk 8 owns the rest).
  - check-offline-title-server-error → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered title attribute must be exactly 'Server returned 500' (part 2 of 2; chunk 8 owns the rest).
  - check-offline-title-silence → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered title attribute must be exactly 'No heartbeat for 30 seconds' (part 2 of 2; chunk 8 owns the rest).
  - check-uptime-advances-on-heartbeat → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text must move from 'ONLINE 3h 12m' to 'ONLINE 3h 13m' across two frames (part 2 of 2; chunk 11 owns the rest).
  - check-retry-refetches → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — clicking the offline badge must issue the new seed request (part 2 of 2; chunk 11 owns the rest).
  - check-retry-recovers → ./packages/web/src/widgets/health-badge/health-badge-widget.tsx — the rendered text must change from OFFLINE to ONLINE with its uptime after a 200 retry (part 2 of 2; chunk 11 owns the rest).
MIRROR: ./packages/web/src/widgets/dispatch-toggle/dispatch-toggle-widget.tsx (a small top-bar control driven entirely by one binding, with its .proxy.tsx delegating to that binding's proxy) — and ./packages/web/src/widgets/pixel-btn/pixel-btn-widget.tsx for the UnstyledButton styling this package's controls use
NOTES:
  Flow #health-badge "health-badge": nodes #badge-mounts, #render-online, #render-degraded, #render-offline
  and #retry-click. This is the surface the operator actually reads — one short line in the top bar that says
  whether the server behind the interface is still answering, and, on hover, why it is not.

  The observables, quoted word for word:
  check-badge-pending-text: "Between mount and the first seed response the badge reads exactly CHECKING"
  check-online-label: "Given a seed body of {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'} the badge reads exactly ONLINE 3h 12m"
  check-uptime-hours-do-not-roll: "Given uptimeSeconds of 90061 the badge reads exactly ONLINE 25h 1m, not 1d 1h 1m"
  check-degraded-label: "Given a seed body with status 'degraded' the badge reads exactly DEGRADED, with no uptime appended"
  check-offline-on-500: "When GET /api/health/status responds 500 the badge reads exactly OFFLINE"
  check-offline-on-network-failure: "When the seed request never reaches the server the badge reads exactly OFFLINE"
  check-offline-is-clickable: "The badge in its OFFLINE state is an enabled control that accepts a click"
  check-offline-title-unreachable: "When the seed request never reaches the server the badge's title attribute reads exactly No response from server"
  check-offline-title-server-error: "When the seed request returns 500 the badge's title attribute reads exactly Server returned 500"
  check-offline-title-silence: "After 30 seconds of heartbeat silence the badge's title attribute reads exactly No heartbeat for 30 seconds"
  check-uptime-advances-on-heartbeat: "Heartbeats carrying uptimeSeconds 11520 then 11580 move the badge from ONLINE 3h 12m to ONLINE 3h 13m"
  check-retry-refetches: "Clicking the OFFLINE badge issues one new GET /api/health/status"
  check-retry-recovers: "When the retry response is 200 with status ok, the badge changes from OFFLINE to ONLINE with its uptime appended"

  Assert the text with toBe on the element's whole textContent, never a substring check — 'ONLINE 3h 12m'
  passes a contains-check for 'ONLINE' and so does 'ONLINE 3h 12m (stale)'.

  Contracts taken and returned: takes no props and returns React.JSX.Element. It calls useHealthStatusBinding
  in render, healthBadgeLabelTransformer and healthBadgeTitleTransformer for its two strings, and
  healthBadgeStatics for its testid. It must NEVER return null: the badge is on every route in every state,
  and RateLimitsStackWidget's `return null` at :19-24 is the shape NOT to copy here.

  Render it as a Mantine UnstyledButton carrying data-testid, title and onClick — an enabled control in every
  state, with onClick calling retry unconditionally. Do not gate the click on the state being offline: only
  check-retry-refetches constrains it, a click in another state costs one request nobody asked for and no
  observable forbids, and a conditional handler is a branch that has to be tested for both arms. Do not reuse
  PixelBtnWidget: it carries data-testid="PIXEL_BTN" of its own and takes no title prop, so the badge would
  need a wrapper and the title would land on the wrong element.

  Design decisions constraining it, quoted:
  "The badge carries testid HEALTH_BADGE — Every interactive element in the interface carries a stable testid,
  and browser checks locate by testid rather than by role. Without one the badge is only reachable by its own
  text, which is the thing under test and therefore useless as a locator."
  "Failure states: the cause of OFFLINE is named, not just the state — ... The word stays one word so the top
  bar layout holds, and the cause is carried in the badge's title attribute where it is readable on hover and
  assertable exactly."
  "Pending: the badge reads CHECKING until the first response — The three settled labels do not cover the
  window between mount and the first seed response. Leaving the badge blank hides that it is working, and
  defaulting it to OFFLINE reports something untrue about a server that may be fine. CHECKING is a fourth
  label used only in that window and never after."
  "Uptime renders as Xh Ym, hours never rolling into days — One format keeps the badge to a single short line
  at any server age ... The string never changes shape as the server ages, so the top bar layout never shifts
  under it."

  Already built, read off disk: dispatch-toggle-widget.tsx:32 shows the inline `data-testid="DISPATCH_TOGGLE"`
  convention — testids in this package are string literals at the element, so read healthBadgeStatics.testId
  into the attribute rather than hardcoding. pixel-btn-widget.tsx:44-61 is the UnstyledButton styling to copy:
  monospace, fontSize 11, colours off emberDepthsThemeStatics, `border: 1px solid ${colors.border}`,
  borderRadius 2, padding '4px 12px'. rate-limits-stack-widget.proxy.tsx is the two-line widget-proxy shape —
  construct the child binding proxy and re-export its setup methods — and it is what chunk 13's AppWidgetProxy
  will construct in turn.

  What outside this chunk uses it: chunk 13 mounts this widget in AppWidget and constructs its proxy in
  AppWidgetProxy. Your proxy's setup method names are what chunk 13 delegates to, so name them for scenarios
  (setupOnlineSeed, setupDegradedSeed, setupServerError, setupUnreachable, deliverHeartbeat) rather than for
  mechanics.

### chunk 13 — the badge in the top bar, on every route
INTENT:
  - An element with data-testid HEALTH_BADGE is in the DOM when AppWidget renders at '/', and still in the DOM after navigating to the session-view route.
  - It renders inside the logo row's right-hand flex cell, as a sibling of RATE_LIMITS_STACK's container, and neither the LOGO_LINK's centering nor the row's existing layout changes.
  - Every existing case in app-widget.test.tsx still passes, with AppWidgetProxy constructing HealthBadgeWidgetProxy so the badge's seed request finds a staged endpoint.
  - app-widget.integration.test.tsx still proves exactly ONE WebSocket is opened, now with the health binding mounted alongside chat, queue and rate-limits.
FILES:
  - ./packages/web/src/widgets/app/app-widget.tsx
  - ./packages/web/src/widgets/app/app-widget.proxy.tsx
  - ./packages/web/src/widgets/app/app-widget.test.tsx
  - ./packages/web/src/widgets/app/app-widget.integration.test.tsx
UNITS:
  - check-badge-rendered → ./packages/web/src/widgets/app/app-widget.tsx — must render HealthBadgeWidget inside the logo row's right-hand cell, so the testid is in the DOM on every route.
MIRROR: ./packages/web/src/widgets/app/app-widget.tsx itself — the right-hand cell at :68-77 that already holds RateLimitsStackWidget, and AppWidgetProxy's constructor block at :66-72 where each child widget's proxy is created
NOTES:
  Flow #health-badge "health-badge": node #badge-mounts, and the whole point of the feature. The operator
  should never have to be on a particular page to find out the server has stopped answering.

  The observable, quoted word for word:
  check-badge-rendered: "The app top bar renders an element with testid HEALTH_BADGE on every route, beside the
  existing dispatch toggle and rate-limit stack"

  Read "beside the existing dispatch toggle and rate-limit stack" as prose locating the top-bar region, not as
  a DOM-sibling claim about both widgets — because it cannot be both. DispatchToggleWidget lives inside
  QuestQueueBarWidget, which returns null at quest-queue-bar-widget.tsx:30-32 whenever the queue is empty or
  has no active entry, so a badge placed beside it is ABSENT on most routes, which is what the first half of
  the same sentence forbids. The assertable reading is the one to build: the testid is in the DOM on every
  route, in the same top-bar row as the rate-limit stack. Do not move DispatchToggleWidget, and do not make
  QuestQueueBarWidget render unconditionally — both are other flows' surfaces.

  Contracts taken and returned: none new. AppWidget's own signature does not change.

  Design decision constraining it, quoted:
  "The badge carries testid HEALTH_BADGE — Every interactive element in the interface carries a stable testid,
  and browser checks locate by testid rather than by role. Without one the badge is only reachable by its own
  text, which is the thing under test and therefore useless as a locator."

  Already built, read off disk: app-widget.tsx:56-78 is the logo row — a left spacer at :64, the LOGO_LINK at
  :65-67, and a right-hand cell at :68-77 with `flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent:
  'flex-end'` holding `<RateLimitsStackWidget />` at :76. Add the badge in that cell; give the cell a gap
  rather than adding margin to the badge. app-layout-responder.ts:11 is
  `export const AppLayoutResponder = AppWidget;`, and app-flow.tsx:9-26 wraps HomeFlow, QueueFlow,
  QuestChatFlow and SessionViewFlow in one `<Route element={<AppLayoutResponder />}>` — that single wrap is
  what makes one mount cover every route, and it is why this chunk changes no flow file.
  app-widget.proxy.tsx:66-72 constructs LogoWidgetProxy(), MapFrameWidgetProxy(), the three Outlet-reached
  proxies via aliased calls (the comment at :32-37 explains the enforce-proxy-child-creation phantom-detection
  workaround), QuestQueueBarWidgetProxy() and RateLimitsStackWidgetProxy(). Add HealthBadgeWidgetProxy()
  beside them and surface whichever of its setup methods the new test cases need. Without that call EVERY
  existing AppWidget case throws the moment the badge's seed request finds no staged endpoint — that is the
  first thing to check if the file goes red.
  app-widget.test.tsx:22-37 is renderApp(), which mounts at initialEntries={['/']} with routes for '/',
  '/:guildSlug/session/:sessionId' and the two quest paths; its "click session => navigates to readonly
  session view route" case at :169 shows how to reach a second route without a second render helper.
  app-widget.integration.test.tsx:15 is the one case that asserts exactly one WebSocket is opened across the
  mounted bindings — extend its wording and its mounted set rather than adding a second case beside it.

  What outside this chunk uses the change: nothing. This is the round's last chunk and the top of its import
  graph.

PHASES:
  1: wave 1 — the route literal, the badge's vocabulary and the state shape every later chunk imports, plus the with-status contract both fetch adapters will share
  2: waves 2-3 — the pure transformers and guard, the status-aware GET, the channel's health-status routing, and the seed broker that turns a response into a badge state
  3: waves 4-6 — the binding that keeps the badge alive, the badge itself, and its mount in the top bar

WAVES:
  1: 1, 2, 3, 4
  2: 5, 6, 7, 8, 9
  3: 10
  4: 11
  5: 12
  6: 13

## Round log

### report — chunk 2
RESULT:
  - healthBadgeStatics exports exactly nine properties: online, degraded, offline, checking, testId, silenceThresholdMs, offlineTitleUnreachable, offlineTitleServerError, offlineTitleSilence. — yes — read the file: object literal has exactly these nine keys, nothing else; the colocated test's single toStrictEqual pins the whole object and is green.
  - healthBadgeStatics.testId is the string 'HEALTH_BADGE' and silenceThresholdMs is the number 30000. — yes — `testId: 'HEALTH_BADGE'`, `silenceThresholdMs: 30000` in the exported object.
  - offlineTitleUnreachable is exactly 'No response from server' and offlineTitleSilence is exactly 'No heartbeat for 30 seconds'. — yes — both string literals match verbatim in the file.
  - offlineTitleServerError is the prefix 'Server returned', with no code and no trailing space; chunk 8 appends the status. — yes — `offlineTitleServerError: 'Server returned'`, no trailing space, no code appended.
  - The colocated test is ONE it holding a single toStrictEqual over the whole exported object, so a tenth key cannot land unasserted. — yes — health-badge-statics.test.ts has exactly one `it()` with one `expect(healthBadgeStatics).toStrictEqual({...})` naming all nine keys.
FILES:    ./packages/web/src/statics/health-badge/health-badge-statics.ts, ./packages/web/src/statics/health-badge/health-badge-statics.test.ts
EVIDENCE:
  - "healthBadgeStatics VALID: exported value => matches expected shape" — first run against an empty-object shell (`export const healthBadgeStatics = {} as const;`) printed `- Expected - 11 / + Received + 1` with `+ Object {}` against the full nine-key expected object — a genuine wrong-value red, not an import/type error.
USAGES:   grepped `healthBadgeStatics` via discover — the only hits are this chunk's own two files (the statics file and its test). No downstream chunk (5, 6, 8, 11, 12) has landed yet, so nothing else imports it.
GOTCHAS:
  - Did NOT add the optional tenth property `silenceTickMs` the chunk's NOTES floats for chunk 11's tick — that addition is conditional on chunk 11's own need, and this chunk's INTENT is explicit that the export carries exactly nine properties.
  - The docstring for the statics folder type (via get-folder-detail) describes an `enforce-grouped-statics` lint rule forbidding primitives at the object root. No such rule exists in packages/eslint-plugin (grep found zero implementation), and the real precedent file packages/web/src/statics/http-status/http-status-statics.ts already carries a root primitive (`conflict: 409`) beside a grouped key. The plan's own TOUCHES/DEPENDS/NOTES sections consistently reference these nine properties by flat dot-access (`healthBadgeStatics.testId`, `healthBadgeStatics.silenceThresholdMs`, …), never nested under a group — so I built it flat, matching both the plan's wording and the httpStatusStatics precedent. Lint passed clean on this shape.
MARKERS:  none
WARD:     npm run ward -- -- ./packages/web/src/statics/health-badge/health-badge-statics.ts ./packages/web/src/statics/health-badge/health-badge-statics.test.ts — green — lint PASS, typecheck PASS, unit PASS (1/1), integration PASS (1/1), e2e skip (no e2e-relevant file in scope).

### report — chunk 4
RESULT:
  - fetch-with-status-result-contract.ts exports fetchWithStatusResultContract and type FetchWithStatusResult, declaring status/ok/body with the 'HttpStatusCode' brand — yes — file declares `z.object({status: z.number().int().min(httpStatusStatics.range.min).max(httpStatusStatics.range.max).brand<'HttpStatusCode'>(), ok: z.boolean(), body: z.unknown()})` and `export type FetchWithStatusResult = z.infer<typeof fetchWithStatusResultContract>`.
  - The whole folder ./packages/web/src/contracts/fetch-post-with-status-result/ is gone, and a repo-wide search for the three old names returns nothing — yes — `rm -rf` removed the folder (confirmed absent via `ls`), and `discover({grep: "fetchPostWithStatusResultContract|FetchPostWithStatusResult|FetchPostWithStatusResultStub"})` returned `count: 0`.
  - fetch-post-with-status-adapter.ts imports and parses through the renamed contract, byte-unchanged otherwise — yes — only lines 12-13 (imports), 21 (return type) and 41 (parse call) changed; method 'POST', headers, and the text-then-JSON.parse-with-fallback logic (lines 22-39) are untouched.
  - fetch-post-with-status-adapter.test.ts still passes untouched, or its only change is the stub import path — yes — the test file was never edited (it imports only `fetchPostWithStatusAdapter` and `StartEndpointMock`, no contract/stub import existed to update); its 5 cases pass under `npm run ward` unit run.
FILES:
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts (new)
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.test.ts (new)
  - ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result.stub.ts (new)
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.ts (deleted)
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract.test.ts (deleted)
  - ./packages/web/src/contracts/fetch-post-with-status-result/fetch-post-with-status-result.stub.ts (deleted)
  - ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts (edited: 4 lines)
FILES-UNCHANGED (in chunk's FILES list, left untouched, ward-verified green):
  - ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.test.ts
EVIDENCE:
  - UNITS: none — this chunk is a pure rename/move with no new behaviour, so there is no red-first cycle to report. The proof is structural: the fields, brand, bounds and every test CASE from fetch-post-with-status-result-contract.test.ts carried across unchanged (only identifier names changed: fetchWithStatusResultContract / FetchWithStatusResult / FetchWithStatusResultStub), and `npm run ward` ran all 5 new contract tests plus the 5 unchanged adapter tests green.
  - Repo-wide grep for the new name (`discover({grep: "fetchWithStatusResultContract|FetchWithStatusResult"})`) returns hits in exactly 4 files: the new contract, its test, its stub, and the adapter — matching the plan's claim that the rename reaches only those four.
  - Repo-wide grep for the old three names returns `count: 0`.
USAGES:   Searched `fetchPostWithStatusResultContract|FetchPostWithStatusResult|FetchPostWithStatusResultStub` (0 hits, confirms the rename is complete) and `fetchWithStatusResultContract|FetchWithStatusResult` (4 hits, all in this chunk's own files: the new contract/test/stub plus the adapter). Read fetch-post-with-status-adapter.proxy.ts — it is a no-op (`Record<PropertyKey, never>`) that never imported the contract, so it needed no change and is not in FILES. The plan's four broker callers of the adapter (orchestration/dispatch-play, quest/start, quest/followup, quest/comment-batch) import the adapter by name and read fields off its return value — none imports the type FetchPostWithStatusResult — confirmed by the same grep finding zero hits outside this chunk's files, so none of the four needed touching.
GOTCHAS:
  - Chunk 7 (a later wave, not yet built) is the next and only planned consumer of fetchWithStatusResultContract, for the new GET adapter. Nothing else in the round currently imports it.
  - Kept the brand tag exactly 'HttpStatusCode' per NOTES, so it stays assignable with chunk 3's HealthBadgeState.offlineStatusCode brand.
  - The new contract's PURPOSE was reworded (no longer says "POST fetch") to reflect that the shape is now method-agnostic and shared by both fetch-with-status adapters; the adapter's own PURPOSE header was left alone since the adapter itself is still POST-specific.
MARKERS:  none
WARD:     npm run ward -- -- ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.ts ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result-contract.test.ts ./packages/web/src/contracts/fetch-with-status-result/fetch-with-status-result.stub.ts ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.ts ./packages/web/src/adapters/fetch/post-with-status/fetch-post-with-status-adapter.test.ts — green — lint PASS (5/5 files), typecheck PASS (7281/7281 files across 13 packages), unit PASS (17/17 files, 358 discovered), integration PASS (23/23 files, 8 discovered), e2e skip (no e2e files in scope).
### report — chunk 1
RESULT:
  - webConfigStatics.api.routes.healthStatus exists and is the string '/api/health/status'; read it beside apiRoutesStatics.health.status and the two are character-identical — yes — both read '/api/health/status' (web-config-statics.ts:45, api-routes-statics.ts:12).
  - web-config-statics.test.ts's single whole-object toStrictEqual carries the new key, so the map and its pin cannot drift apart — yes — healthStatus: '/api/health/status' added to the expected object at web-config-statics.test.ts:41.
  - git diff on web-config-statics.ts is exactly one added line, and every one of the 33 existing route literals (guilds through orchestrationMode) is byte-unchanged — yes — `git diff --stat` shows 1 insertion, 0 deletions for this file; the added line is the new healthStatus key after orchestrationMode.
  - The new literal appears twice under packages/web/src and nowhere else: once in the statics file and once in its colocated whole-object toStrictEqual, which re-lists every route — yes — discover grep for '/api/health/status' (strict) returns exactly 2 hits, both in packages/web/src/statics/web-config/ (web-config-statics.ts:45 and web-config-statics.test.ts:41).
FILES:    ./packages/web/src/statics/web-config/web-config-statics.ts, ./packages/web/src/statics/web-config/web-config-statics.test.ts
EVIDENCE:
  - HealthStatusEndpoint.webRoutePath: web-config-statics.test.ts's toStrictEqual, before the statics fix — `expect(received).toStrictEqual(expected) // deep equality` (received object missing the healthStatus key the test now expects); after adding healthStatus to web-config-statics.ts, the same assertion passes.
USAGES:   Searched discover for grep "healthStatus" and grep "/api/health/status" (strict) across packages/web/src/**. Only hits are the two lines just written (web-config-statics.ts:45, web-config-statics.test.ts:41) plus an unrelated health-badge-state-contract.ts docstring mention and unrelated "HealthStatus" tool-output test fixtures. Nothing outside this chunk's FILES reads api.routes.healthStatus yet — chunk 10 (a later wave) is the first consumer, per the plan's NOTES.
GOTCHAS:
  - The first scoped ward run (before the statics fix) surfaced 7 unrelated failures — ENOENT on fetch-post-with-status-result-contract.ts and an unused-import TS6133 on fetch-post-with-status-adapter.ts:12 — from chunk 4's in-progress rename (a live wave-mate on this round). Those were not touched; the second ward run (after the fix) shows the whole @dungeonmaster/web package green, confirming chunk 4 landed cleanly in the meantime.
  - Placed the new key as the LAST entry in api.routes (after orchestrationMode), matching the NOTES' description of where the block currently ends.
MARKERS:  none
WARD:     npm run ward -- -- ./packages/web/src/statics/web-config/web-config-statics.ts ./packages/web/src/statics/web-config/web-config-statics.test.ts — green — lint PASS (2/2), typecheck PASS (1108/1108 files), unit PASS (67/67 files, 358 discovered), integration PASS (75/75 files, 8 discovered), e2e skip.

### report — chunk 3
RESULT:
  - healthBadgeStateContract is a z.discriminatedUnion on 'state' with exactly four branches: checking, online, degraded, offline. — yes — read off disk: four z.object branches literal-keyed 'checking'/'online'/'degraded'/'offline'; test "INVALID: {state: unknown} => throws discriminator validation error" passes against /Invalid discriminator/u.
  - healthBadgeStateContract.parse({state: 'degraded', uptimeSeconds: 1}) returns an object with NO uptimeSeconds key. — yes — test "branch stripping VALID: {state: degraded, uptimeSeconds: 1}" passes: result is {state: 'degraded'}.
  - healthBadgeStateContract.parse({state: 'checking', offlineCause: 'silence'}) returns an object with NO offlineCause key. — yes — test "branch stripping VALID: {state: checking, offlineCause: silence}" passes: result is {state: 'checking'}.
  - The online branch REQUIRES uptimeSeconds; parsing {state: 'online'} with no uptimeSeconds throws. — yes — test "INVALID: {state: online, missing uptimeSeconds}" passes, throws matching /Required/u.
  - The offline branch REQUIRES offlineCause and rejects a fourth cause value. — yes — tests "INVALID: {state: offline, missing offlineCause}" (/Required/u) and "INVALID: {state: offline, offlineCause: made-up}" (/Invalid enum value/u) both pass.
  - HealthBadgeStateStub defaults to the checking branch and produces any of the other three from a full override. — yes — "VALID: {state: checking}" (no args) returns {state: 'checking'}; the online/degraded/offline override cases each return their own branch's exact shape.
FILES:    ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts, ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.test.ts, ./packages/web/src/contracts/health-badge-state/health-badge-state.stub.ts
EVIDENCE:
  - "branch stripping VALID: {state: degraded, uptimeSeconds: 1}" against a temporary shell (every field present-and-optional on every branch): expected {state: 'degraded'}, received {state: 'degraded', uptimeSeconds: 1}.
  - "branch stripping VALID: {state: checking, offlineCause: silence}" against the same shell: expected {state: 'checking'}, received {state: 'checking', offlineCause: 'silence'}.
  - "INVALID: {state: online, missing uptimeSeconds}" against the shell: expected throw matching /Required/u, received "function did not throw".
  - "INVALID: {state: offline, missing offlineCause}" against the shell: expected throw matching /Required/u, received "function did not throw".
  - "INVALID: {state: offline, offlineStatusCode: 99}" against the shell: expected throw matching /too_small/u, received "function did not throw".
  - "INVALID: {state: offline, offlineStatusCode: 600}" against the shell: expected throw matching /too_big/u, received "function did not throw".
USAGES:   discover({grep: "healthBadgeStateContract|HealthBadgeState", glob: "packages/web/src/**"}) returns hits only inside this chunk's own three files. Nothing else in the round has landed yet to consume it — chunks 5, 6, 8, 10, 11 and 12 are the eventual consumers per this chunk's own NOTES, none built yet.
GOTCHAS:
  - A brand-new contract file has no prior behaviour to disagree with, so getting a genuine WRONG-VALUE red (not a type error) took a temporary shell: every field present-and-optional on every branch, keeping StubArgument<HealthBadgeState> (which distributes over the union) a superset of the real type so the stub/test kept type-checking while the runtime stayed permissive. Swapped back to the real per-branch schema in the same turn before the final ward run; the file now on disk is the schema described in this chunk's own FILES, with no shell code left in it.
  - ward's scoped run discovers this same .test.ts under both "unit" and "integration" check types (both went green on the final run) — an existing ward discovery behavior for this package's contract tests, not something this chunk introduced. Noted so the reviewer doesn't read the doubled listing as a second file.
MARKERS:  ADDED: offlineStatusCode — a fifth property beyond the four the contract's own property descriptions named, declared only on the offline branch, optional, z.number().int().min(httpStatusStatics.range.min).max(httpStatusStatics.range.max).brand<'HttpStatusCode'>(). Required because check-offline-title-server-error (chunk 8) demands the title read exactly 'Server returned 500', and none of state/uptimeSeconds/lastHeartbeatAt/offlineCause can carry a numeric status code — offlineCause is the three-value cause enum, not the code.
WARD:     npm run ward -- -- ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.ts ./packages/web/src/contracts/health-badge-state/health-badge-state-contract.test.ts ./packages/web/src/contracts/health-badge-state/health-badge-state.stub.ts — green — lint PASS (3 files), typecheck PASS (1108 files), unit PASS (1 file/358 discovered), integration PASS (1 file/8 discovered), e2e skip.
