# Round 3 — [codeweaver] Codeweaver: build this slice — package: shared

## Context

Quest ID: a7520e60-430c-4d0e-b332-9952d6d5c042
Work Item ID: e5ea4f0c-838c-46f5-80ef-adae72f0fff7
Operation Item ID: 78da2360-f09a-4ef0-aed0-ba1efcf774b1
Your operation item: [codeweaver] Codeweaver: build this slice — package: shared

Operations ledger (in order):
1. [x] [chaoswhisperer] Author spec + implementation plan
2. [x] [riftcarver] Riftcarver: carve the quest branch, worktree and preflight build
3. [>] [codeweaver] Codeweaver: build this slice — package: shared  <-- YOUR OPERATION ITEM
4. [ ] [codeweaver] Codeweaver: build this slice — package: server
5. [ ] [codeweaver] Codeweaver: build this slice — package: web
6. [ ] [ward changed] Ward gate (changed files)
7. [ ] [flowrider] Flowrider: author the flow-perspective test suites below the browser — package: server
8. [ ] [flowrider] Flowrider: author the flow-perspective test suites below the browser — seam: server + shared
9. [ ] [groundstomper] Groundstomper: author the browser walk for this flow — flow: health-badge
10. [ ] [siegemaster] Siegemaster: manual-QA this flow and review its test suite — flow: health-badge
11. [ ] [ward full] Ward gate (full monorepo)

Flows your operation item lands on: #health-badge
(A starting point, NOT a boundary — read every flow, and build whatever the flows need.)

Packages your operation item lands in: shared
(Name these packages in every minion brief you write — the planner and the workers point their own searches here instead of guessing. NOT a boundary: a minion may touch another package if the work needs it.)

Your nodes (rendered from the spec as it stands right now, not from the ledger): #server-emits, #channel-routes

Must satisfy — these are YOUR acceptance targets, verbatim:
  - check-event-type-member [custom] on #server-emits: "orchestrationEventTypeContract.options contains 'health-status' and has 22 members, the prior 21 unchanged"
  - check-payload-parses [custom] on #channel-routes: "A health-status payload parses against healthStatusPayloadContract, and a payload missing uptimeSeconds fails that parse"

Contracts you own — every property description is a requirement:
  - HealthStatusPayload (data, new) [packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts]
      status: Either the literal 'ok' or the literal 'degraded'. Deliberately NOT named HealthStatus: the server's existing health-response contract already brands that name onto z.string().min(1), and two schemas sharing a brand tag with different base types are not interchangeable. shared also cannot import from server, so the name must differ rather than be reused.
      uptimeSeconds: Whole seconds the server process has been running. Rendered as Xh Ym beside ONLINE.
      version: The server package version string, carried for display and diagnosis.
  - OrchestrationEventType (data, modified) [packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts]
      healthStatus: The new twenty-second member of the enum. All 21 existing members keep their spelling and order; this one is added so both the server relay and the web channel accept the frame type.

Design decisions constraining your scope:
  - A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel already owns reconnection, so this flow adds nothing for it.

Seams — each line is a node you share with another package, and where that package's half of it stands:
  - #server-emits with server — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs
      attributed to server — check-emit-interval: "With the server running, three health-status frames arrive within 35 seconds, spaced 10 seconds apart"
      attributed to server — check-emit-payload-advances: "Each health-status frame carries exactly {status, uptimeSeconds, version}, and uptimeSeconds is strictly greater than the previous frame's"
  - #channel-routes with server — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs
      attributed to server — check-frame-crosses-wire: "The serialised health-status envelope arrives at the browser as one WebSocket text message carrying type, payload and timestamp"
  - #channel-routes with web — NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs
      attributed to web — check-payload-updates-badge: "A delivered health-status frame changes the badge text within 1 second of arrival"
      attributed to web — check-reconnect-resumes: "After the socket drops and reconnects, the first health-status frame moves the badge out of OFFLINE with no click issued"

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

## Rework

Round 2's final reviewer returned `NEXT: rework` with this line, word for word:

> NEXT: rework — packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx:67 races a
> real two-frame timer instead of controlling it, so it reddens only under full-suite load; make it
> deterministic (registerSpyOn over globalThis.requestAnimationFrame in
> use-disclosure-anchor-binding.proxy.ts) in the web slice

Full WARD detail from that reviewer's return, carried forward so this round's planner does not have
to re-derive it:

`npm run build` was green across all 13 packages. `npm run ward -- --staged` (run
1787853283828-7425, 899.2s) ran the whole monorepo — because `--staged` cannot be scoped — and was
RED on exactly one test: `packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx`,
case "SubagentChainWidget disclosure anchoring VALID: {click header twice to re-expand} => puts the
auto-scroll on hold again", failing at `subagent-chain-widget.test.tsx:67:40` with
`Expected: true / Received: false`. Everything else was green: lint PASS 7260 files, typecheck PASS
7239 files, integration PASS 114 files, e2e PASS 83 files. The reviewer re-ran that one file alone
(run 1787854341522-cbb5, 23.2s) and it passed clean, with an empty diff and a clean tree at the time —
confirming a flake, not a regression from this quest's work.

The reviewer's read of the mechanism, from the source: `useDisclosureAnchorBinding.holdAnchor`
(`use-disclosure-anchor-binding.ts:46-60`) increments a held count and schedules `release()` inside
two nested `requestAnimationFrame` callbacks. jsdom's rAF fires on a ~16ms timer while `userEvent`'s
inter-event await is a 0ms macrotask; under many packages' suites running at once, a 0ms macrotask
slips past 32ms and both pending releases drain the count to 0 before line 67 runs its assertion. The
production two-frame hold is by design — the defect is in the TEST's timing control, not the widget
behaviour. This is why it surfaced only now: round 1's `--staged` measured only the six `shared`
paths and never ran the whole monorepo; this is the first round whose ward genuinely covered
`packages/web`.

This is the one thing left un-green on the branch. Per the ward rule, the round's reviewer owns
making the round's ward pass, and `packages/web` being outside the `shared` package this operation
item names is not a boundary — a minion may touch another package if the work needs it, and here the
whole-round ward needs it.

Full prior detail is also persisted as quest note `round-2-web-subagent-chain-flake`.

Re-verify once fixed: confirm `npm run ward -- --staged` is green end to end, confirm the tree is
clean, and close with an explicit `NEXT: continue` line.

## Plan

TOUCHES:
  ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts — EXISTS — the one file every disclosure-anchoring test reaches the hold through: `useDisclosureAnchorBindingProxy`, which today constructs `disclosureAnchorStateProxy()` (:7) and returns `setupReleased` (:10) and `isHeld` (:14) and registers NO mock or spy of any kind. It is the home for the `requestAnimationFrame` spy because it is the ONE place shared by all four widget proxies that compose anchoring (chat-message :12, show-earlier-toggle :7, subagent-chain :20, tool-row :8) plus the binding's own test. Listed as its own entry rather than riding with `use-disclosure-anchor-binding.ts` because the binding SOURCE does not change on this round — the production two-frame hold is correct and is what the round is protecting.
      (no unit — this round's work is the `## Rework` line, which carries no observable id)
  ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts — EXISTS — five cases over the binding, all synchronous, so none of them ever yielded a macrotask for a pending rAF and none of them flaked. Rides with the proxy above and is where the frame-advance control gets its behavioural coverage. Its case at :44, `'VALID: {two holds} => stays held until both are released'`, asserts only `isHeld()` at :54 and never releases anything — the name states a claim the body does not make, and the new control is what lets it.
      (no unit)
  ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.proxy.ts — EXISTS — `disclosureAnchorStateProxy`, exposing `setupReleased` (:11, `releaseAll()`), `setupHeld` (:15) and `isHeld` (:19) over the module singleton in `disclosure-anchor-state.ts` (`{ held: 0 }` at :16). Its comment at :8-:10 states "a real hold is released a frame later by a requestAnimationFrame jest never runs" — jsdom under `jest-environment-jsdom` DOES run rAF, on a ~16ms timer, which is the whole mechanism of this round's flake. The comment is false today and false in a new way once the spy lands.
      (no unit)
  ./packages/web/src/widgets/subagent-chain/subagent-chain-widget.tsx — EXISTS — the widget whose header `onClick` (:84-:87) calls `holdAnchor()` then `setExpanded`. Its colocated `.test.tsx` rides with it and is the file `## Rework` names: the case at :55-:68 clicks the header TWICE and asserts `proxy.isAutoScrollHeld()` at :67. It is the only case in the repo that leaves TWO release chains pending at once, which is why it and nothing else reddens. Neither the widget nor its test needs an edit — the determinism arrives through the shared proxy — but the file is what the round is measured on.
      (no unit)
  ./packages/web/src/widgets/{chat-message,tool-row,show-earlier-toggle,chat-entry-list,chat-panel,session-view}/, ./packages/web/src/widgets/execution-panel/{execution-row-layer,execution-panel}/, ./packages/web/src/widgets/quest-chat/{quest-chat-content-layer,quest-chat}/ — EXISTS — the blast radius: every widget whose proxy chain reaches `useDisclosureAnchorBindingProxy`, directly or through `ChatEntryListWidgetProxy` / `ChatPanelWidgetProxy`. None of them changes; all of them must stay green, because a spy installed in a shared proxy constructor takes effect in every test that constructs it. The twelve exact test-file paths are enumerated in DECISIONS and are the chunk's `FILES`.
      (no unit)
  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — EXISTS — the shared frame-type vocabulary. `z.enum([...])` opens at :15 and closes at :41 with `'health-status'` at :40, immediately after `'dispatch-state-changed'` (:39); `export type OrchestrationEventType = z.infer<...>` at :43. `git diff master..HEAD` on this file is exactly one added enum line plus the PURPOSE rewrite, so no prior literal moved. Its `.test.ts` rides with it and pins all 22 in order with one `toStrictEqual` at :12-:37, deriving its `it.each` table from `.options` at :39.
      check-event-type-member — expose `'health-status'` as a 22nd member with the prior 21 unchanged. ALREADY TRUE — see NO CHUNK.
      OrchestrationEventType.healthStatus — declare that literal so the inferred union widens and `wsMessageContract.type` (ws-message-contract.ts:14) accepts the frame with no edit of its own. ALREADY TRUE — see NO CHUNK.
  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — EXISTS — the body of a health-status frame and of the `GET /api/health/status` seed response. `z.object` at :15-:19 with exactly `status: z.enum(['ok','degraded'])` (:16, unbranded), `uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>()` (:17) and `version: z.string().min(1).brand<'ServerVersion'>()` (:18); `export type HealthStatusPayload` at :21. Both companions ride with it and are on disk: `health-status-payload.stub.ts` (`HealthStatusPayloadStub`, `StubArgument<T>` spread through `contract.parse()`, defaults `{status:'ok', uptimeSeconds:120, version:'1.0.0'}`) and `health-status-payload-contract.test.ts` (eight cases across a valid/invalid describe split).
      check-payload-parses — parse `{status, uptimeSeconds, version}` and REJECT a body missing `uptimeSeconds`. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.status — declare `z.enum(['ok','degraded'])`, unbranded, rejecting a third literal. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.uptimeSeconds — declare a whole, non-negative number branded `'UptimeSeconds'`. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.version — declare a non-empty string branded `'ServerVersion'`. ALREADY TRUE — see NO CHUNK.
  ./packages/shared/contracts.ts — EXISTS — the package-root barrel behind the `./contracts` subpath export. Carries the orchestration-event-type pair at :260-:261 (pre-existing) and the health-status-payload pair at :757-:758 under a `// Health Contracts` comment at :756. This is what makes both exports reachable as `@dungeonmaster/shared/contracts` from the server and web sessions still ahead on this quest. Root barrels are exempt from colocation, so it takes no test and carries no unit.
      (no unit)

DEPENDS:
  ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts
      needed by: ./packages/web/src/widgets/chat-message/chat-message-widget.proxy.tsx (:1 import, :12 construct) — must keep answering `setupReleased` / `isHeld` with the same names and signatures; a rename here breaks four widget proxies at once
      needed by: ./packages/web/src/widgets/show-earlier-toggle/show-earlier-toggle-widget.proxy.tsx (:1, :7) — same
      needed by: ./packages/web/src/widgets/subagent-chain/subagent-chain-widget.proxy.tsx (:4, :20) — same, and this is the proxy whose `isAutoScrollHeld` (:29) is what the reddening assertion reads
      needed by: ./packages/web/src/widgets/tool-row/tool-row-widget.proxy.tsx (:1, :8) — same
      needed by: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts (:3) — must ALSO get the new frame-advance control, since that is where the two-frame release gets its behavioural coverage
      needs: ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.proxy.ts — `disclosureAnchorStateProxy`, whose `releaseAll()` and `isHeld()` the two existing methods delegate to
      needs: @dungeonmaster/testing/register-mock — `registerSpyOn` and the `SpyOnHandle` type, a NEW import on this file. Exported at packages/testing/src/register-mock.ts:13-:14; the adapter's signature is `<T extends object>({ object, method, passthrough = false })` at jest-register-spy-on-adapter.ts:32
      needs: globalThis.requestAnimationFrame — not an import but the thing the spy replaces. Under `jest-environment-jsdom`, `globalThis === window`, so this is the same property slot the binding reads at use-disclosure-anchor-binding.ts:56-:57

  ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.proxy.ts
      needed by: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts — `setupReleased` / `isHeld`
      needed by: ./packages/web/src/bindings/use-auto-scroll/use-auto-scroll-binding.proxy.ts (:7) — uses `setupHeld`, the other direction. Nothing about this round changes what that proxy sees, and the comment correction must not touch `setupHeld`
      needs: ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.ts — the `{ held: 0 }` singleton and its four methods

  ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts
      needed by: nothing — a test file is a leaf
      needs: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts — the frame-advance control it drives
      needs: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.ts — `holdAnchor`, whose nested `window.requestAnimationFrame` at :56-:60 is the behaviour under test
      needs: ./packages/web/src/adapters/testing-library/render-hook/testing-library-render-hook-adapter — already imported at :1

  ./packages/web/src/widgets/subagent-chain/subagent-chain-widget.tsx
      needed by: ./packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.tsx — renders a chain per subagent group; unaffected by this round
      needs: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.ts — `useDisclosureAnchorBinding()` at :54, destructured to `{ anchorRef, holdAnchor }`, called from the header `onClick` at :84-:87. UNCHANGED by this round: the production two-frame hold is correct and is what the fix protects
      needs (its test companion): ./packages/web/src/widgets/subagent-chain/subagent-chain-widget.proxy.tsx — `clickHeader` (:30) and `isAutoScrollHeld` (:29). Its determinism arrives entirely through the anchor proxy it constructs at :20, so no edit is expected in either the widget or its test

  ./packages/web/src/widgets/{chat-message,tool-row,show-earlier-toggle,chat-entry-list,chat-panel,session-view,execution-panel,quest-chat}/ — the blast radius
      needs: ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts — transitively, through their own proxies. What crosses the link is the SPY, not a value: a `registerSpyOn` installed in a shared proxy constructor replaces `globalThis.requestAnimationFrame` for the whole of that test, so every rAF consumer in that test's module graph is affected, not just the anchor binding
      needed by: `app-widget.proxy.tsx` (:36-:37 alias, :68-:69 call) and the two app responder proxies (`app-quest-chat-responder.proxy.ts:4`, `app-session-view-responder.proxy.ts:4`) — these are the OUTERMOST constructors, above `quest-chat-widget.proxy.tsx` (:26) and `execution-panel-widget.proxy.tsx` (:53, :60). Every one of them has its own colocated test, and the full fifteen-file list is in DECISIONS

  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
      needed by: ./packages/shared/src/contracts/ws-message/ws-message-contract.ts (:14, `type: orchestrationEventTypeContract`) — inherits the 22nd member with no edit, since :15 is an unconstrained `z.record` payload
      needed by: ./packages/shared/contracts.ts (:260) — the barrel pair
      needed by: the server and web sessions still ahead on this quest (ledger items 4 and 5) — the relay and the channel both key on this vocabulary. Nothing consumes `'health-status'` yet, which is what NOT BUILT YET means
      needs: zod only

  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts
      needed by: ./packages/shared/contracts.ts (:757) — the barrel pair, contract then stub
      needed by: ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts — `HealthStatusPayloadStub` parses through it
      needed by: the server and web sessions ahead — the seed response body and the frame body are the same schema. Zero references outside its own folder today
      needs: zod only. It deliberately does NOT need packages/server/src/contracts/health-response/health-response-contract.ts (:12, `brand<'HealthStatus'>` on `z.string().min(1)`) — shared cannot import server, and the differing base type is why the name had to differ

  ./packages/shared/contracts.ts
      needed by: every downstream package importing `@dungeonmaster/shared/contracts`
      needs: both contract files above and both their stubs — four `export *` lines, at :260-:261 and :757-:758

DECISIONS:
  - All SIX units this operation item owes are already true on disk, re-checked here against the files rather than against round 2's plan. I opened orchestration-event-type-contract.ts ('health-status' at :40, last of the enum opened at :15), orchestration-event-type-contract.test.ts (:12-:37 pins all 22 with one toStrictEqual, :39 derives the it.each table from .options), health-status-payload-contract.ts (:15-:19, three required keys, no .optional()/.partial()/fourth key), health-status-payload-contract.test.ts (eight cases; :6-:14 parses a full body, :52-:59 asserts a body missing uptimeSeconds throws /Required/u), health-status-payload.stub.ts and contracts.ts (:260-:261, :757-:758). `git diff master..HEAD -- packages/shared` is six files, 170 insertions. Corrected after a stage-5 check: the ENUM ARRAY's whole diff is the single line `+  'health-status',` — which is what makes "the prior 21 unchanged" a fact rather than an eyeball — but the FILE's diff is 7 insertions / 1 deletion, because round 1's reviewer also replaced the one-line PURPOSE with the five-line paragraph now at :2-:6. That rewrite is committed, is true of the body beneath it, and changes no literal.
  - So this round cuts ZERO chunks for its own package. `## Rework` is the round's entire work, exactly as the round-3 document says.
  - All three seams are still NOT BUILT YET, verified rather than assumed: `discover` for healthStatusPayloadContract|HealthStatusPayloadStub|'health-status' returns five files, ALL of them inside packages/shared/src/contracts/{health-status-payload,orchestration-event-type}/. Nothing in server or web references either export or the literal. My half is therefore complete AND correctly shaped for them — the pair is exported from the root barrel, wsMessageContract.type (:14) already widens off the enum, and wsMessageContract's payload (:15) is an unconstrained z.record that carries the new body untouched. Nothing is left for me to shape and nothing of theirs is mine to build.
  - The `## Rework` defect is a TEST-timing defect, not a production defect. holdAnchor (use-disclosure-anchor-binding.ts:46-:60) takes the hold synchronously at :47 and schedules the release inside two nested window.requestAnimationFrame callbacks at :56-:60; the reasoning for both the two-frame count and the scheduling site is in the source comment at :50-:55 and again in packages/web/CLAUDE.md. That production shape is correct and this round does not touch it. The defect is that the TEST has no control over when those frames run.
  - jsdom really does run requestAnimationFrame, and the repo currently believes it does not. packages/web/jest.config.cjs:13 sets testEnvironment 'jsdom', and packages/web/src/__mocks__/jsdom-polyfills.cjs — which stubs ResizeObserver (:3-:9), fetch/undici, streams and Node timers — has no rAF entry at all, so jsdom's own ~16ms-timer implementation is what fires. The comment at disclosure-anchor-state.proxy.ts:8-:10 asserts the opposite ("a requestAnimationFrame jest never runs"), which is precisely the assumption the flake breaks; correcting it is part of the fix, because leaving it hands the next session a false mechanism.
  - Why only the twice-clicked case reddens: each holdAnchor schedules its own two-frame release chain, and userEvent's inter-event await is a 0ms macrotask. One click leaves ONE chain pending and the count at 1; two clicks leave TWO chains pending and the count at 2, and the window between the two clicks is a second chance for the first chain's ~32ms to elapse. Under whole-monorepo load a 0ms macrotask slips past 32ms, both chains drain, and the count reaches 0 before line 67. subagent-chain-widget.test.tsx:55-:68 is the only case in the repo that clicks a disclosure twice and then asserts the hold — the sibling single-click case at :39-:53 and the cases in use-disclosure-anchor-binding.test.ts are all either single-hold or fully synchronous, which is why none of them has ever flaked.
  - The spy goes on globalThis, not on window, following packages/web/src/adapters/websocket/connect/websocket-connect-adapter.proxy.ts:80-:84. Corrected after a stage-5 check: that is packages/web's only spy over a scheduling global, not the repo's — packages/orchestrator has three more, timer-set-timeout-adapter.proxy.ts:13-:17 (setTimeout, passthrough true), timer-set-interval-adapter.proxy.ts:17-:21 and :29-:33 (setInterval / clearInterval, passthrough true) and an indexProxy at :12 and :15 (setInterval / clearInterval, no passthrough). All four agree on the object being globalThis, which is the part this decision rests on, and the fourth shows the no-passthrough form this round needs. The binding's call site reads window.requestAnimationFrame; under jest-environment-jsdom the test global object IS the jsdom window, so globalThis and window are the same object and the same property slot. This also matches the wording of `## Rework`.
  - passthrough must be FALSE. registerSpyOn({ passthrough: true }) makes the real implementation the catch-all (jest-register-spy-on-adapter.ts:70-:76), which leaves jsdom's real rAF running and the flake exactly where it was. With passthrough false an unstaged call THROWS (:78), so the proxy must stage a constructor-level calledWith([]) catch-all — the sanctioned "record-and-swallow" case in get-testing-patterns, where the spy exists to capture callbacks the test drains separately via callsMatching.
  - The spy is not enough on its own, and a spy nothing observes is a spy a later session deletes. The proxy therefore also gets a frame-advance control, which buys real coverage the repo does not have: NOTHING below Playwright currently pins the two-frame release. With the control, one frame must leave the hold taken and two must release it — that is the regression guard for the production comment at use-disclosure-anchor-binding.ts:50-:55, and it turns use-disclosure-anchor-binding.test.ts:44's name, "VALID: {two holds} => stays held until both are released", into a claim its body actually makes (today it asserts only isHeld() at :54 and releases nothing).
  - Draining is TWO passes, not one, because the release chain is NESTED: invoking the outer callback calls window.requestAnimationFrame again, which the spy records as a new call. callsMatching([args]) is documented as a fresh snapshot per call, so a drain must re-read it after each pass and invoke only the calls it has not already run. The mirror at websocket-connect-adapter.proxy.ts:115-:126 shows the read shape (callsMatching([]).map((call) => call[0] as () => void)); the index-tracking is this proxy's own addition, and belongs in the proxy closure, which is fresh per test.
  - BLAST RADIUS, enumerated rather than estimated. A spy installed in a shared proxy constructor takes effect in every test that constructs that proxy, so these FIFTEEN test files are in scope and must stay green, all under packages/web/src/: bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts; widgets/subagent-chain/subagent-chain-widget.test.tsx; widgets/tool-row/tool-row-widget.test.tsx; widgets/show-earlier-toggle/show-earlier-toggle-widget.test.tsx; widgets/chat-message/chat-message-widget.test.tsx; widgets/chat-entry-list/chat-entry-list-widget.test.tsx; widgets/chat-panel/chat-panel-widget.test.tsx; widgets/execution-panel/execution-row-layer-widget.test.tsx; widgets/execution-panel/execution-panel-widget.test.tsx; widgets/quest-chat/quest-chat-content-layer-widget.test.tsx; widgets/quest-chat/quest-chat-widget.test.tsx; widgets/session-view/session-view-widget.test.tsx; widgets/app/app-widget.test.tsx; responders/app/quest-chat/app-quest-chat-responder.test.ts; responders/app/session-view/app-session-view-responder.test.ts. Derived by walking the proxy graph: four widget proxies construct the anchor proxy directly; ChatEntryListWidgetProxy constructs all four; ChatPanelWidgetProxy and ExecutionRowLayerWidgetProxy construct that; ExecutionPanelWidgetProxy, QuestChatContentLayerWidgetProxy, QuestChatWidgetProxy and SessionViewWidgetProxy sit above those; AppWidgetProxy CALLS QuestChatWidgetProxy and SessionViewWidgetProxy at app-widget.proxy.tsx:68-:69 (aliased at :36-:37 to dodge enforce-proxy-child-creation, but really invoked); and the two app responder proxies construct QuestChatWidgetProxy / SessionViewWidgetProxy. All fifteen were confirmed to exist on disk. app-widget.integration.test.tsx is deliberately NOT on the list — it drives bindings directly and never constructs AppWidgetProxy.
  - Three more files are edited-file adjacency rather than rAF exposure, and belong in the same ward run for lint and typecheck: state/disclosure-anchor/disclosure-anchor-state.test.ts, bindings/use-auto-scroll/use-auto-scroll-binding.test.ts and widgets/auto-scroll-container/auto-scroll-container-widget.test.tsx. All three reach disclosure-anchor-state.proxy.ts, whose comment this round corrects; none of them reaches the anchor BINDING proxy, so no spy is installed in them.
  - That radius is acceptable, and here is the evidence rather than the hope: requestAnimationFrame has exactly ONE CALL SITE in packages/web/src — use-disclosure-anchor-binding.ts:56-:57 — so no other app code in this package schedules a frame. Corrected after a stage-5 check: the TOKEN occurs in one other file, as prose, in the false comment at disclosure-anchor-state.proxy.ts:9 that this round removes. What remains is node_modules (Mantine transitions), and the tests in this radius assert synchronously on rendered DOM immediately after an await userEvent.click, i.e. inside a window in which a real ~16ms rAF would not have fired anyway. Swallowing frames is therefore very close to the behaviour these files already get, minus the nondeterminism. If a file in the radius nevertheless reddens for a reason genuinely about a frame never running, that is a real finding for the round log — and the narrow repair is to give THAT widget's own proxy a semantic frame-advance call, never to restore the real timer, which is the flake.
  - Nothing in this round touches production code. The whole diff is .proxy.ts and .test.ts files. That is recorded as an assertion so the reviewer can check it with one `git diff --stat`.
  - No chunk here authors Playwright and none is owed. The scroll ARITHMETIC half of the anchoring is invisible to jsdom — getBoundingClientRect is all zeros and ResizeObserver is the no-op stub at jsdom-polyfills.cjs:3-:9 — and packages/web/CLAUDE.md already records that only Playwright proves the scrollport moved. That surface belongs to ledger item 9 (groundstomper), is unrelated to this round's flake, and is not a unit of this operation item, so it takes no out-of-medium line here.
  - Not this round's mess, and deliberately not chunked: `git status` at the start of this round is clean apart from this round document itself. There is no dead session's half-finished work to fold in.

ASSERTIONS:
  - packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts installs registerSpyOn over requestAnimationFrame on globalThis with passthrough absent or false, staged with a constructor-level catch-all that does NOT invoke its callback argument. A reader checks it by opening the file: there is a registerSpyOn call whose object is globalThis and whose method is requestAnimationFrame, and the staging attached to it hands back a number without calling the callback.
  - useDisclosureAnchorBindingProxy returns a control that advances the pending animation frames, and it is on the proxy's declared return type. A reader checks it by reading the return-type annotation, which this repo requires to be explicit.
  - packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts carries a case in which ONE frame is advanced after holdAnchor and isHeld is asserted toBe true, and a case in which TWO are advanced and isHeld is asserted toBe false. A reader checks it by reading the two assertions; both are toBe on a boolean the binding actually produced.
  - The case at use-disclosure-anchor-binding.test.ts:44, whose name says two holds stays held until both are released, releases something. A reader checks it by confirming the body advances frames rather than ending at an isHeld toBe true.
  - Running packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx repeatedly passes every time, including the case at :55 whose name says click header twice to re-expand puts the auto-scroll on hold again. A reader checks it by running the file; the stronger check is that no timer decides the outcome, which is readable from the proxy.
  - All fifteen blast-radius test files enumerated in DECISIONS pass, and so do the three adjacency files named beside them. A reader checks it by warding exactly those paths.
  - packages/web/src/state/disclosure-anchor/disclosure-anchor-state.proxy.ts contains no claim that jest or jsdom never runs requestAnimationFrame, and states in present tense why setupReleased exists. A reader checks it by reading the comment above setupReleased.
  - The round's diff contains no production file: `git diff --stat` over the round shows only .proxy.ts, .test.ts and this round document. In particular use-disclosure-anchor-binding.ts, disclosure-anchor-state.ts and subagent-chain-widget.tsx are byte-identical to their committed versions.
  - The round's diff contains nothing under packages/shared. A reader checks it with `git diff --stat -- packages/shared`, which is empty, because all six units were already true at c115205.
  - `npm run ward -- --staged` exits 0 across the whole monorepo, and the tree is clean afterwards. This is the round reviewer's check, and it is the thing `## Rework` asks be re-verified.

NO CHUNK:
  - settled check-event-type-member at c115205 → packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts:40, the last literal of the z.enum opened at :15 and closed at :41 — read there: 'health-status' sits immediately after 'dispatch-state-changed' (:39). "The prior 21 unchanged" is proved by the diff rather than by eye: git diff master..HEAD on that file adds exactly one line inside the enum array. Its guard is orchestration-event-type-contract.test.ts:12-:37, one toStrictEqual pinning membership, count and order together, with the it.each table at :39 derived from .options so a 23rd member cannot silently skip it.
  - settled OrchestrationEventType.healthStatus at c115205 → the same literal at orchestration-event-type-contract.ts:40, which is what widens export type OrchestrationEventType = z.infer at :43 — read there: the inferred union IS the enum's member list, so declaring the literal is declaring the type member and no second edit exists for a type widening to need. The spec's property key is camelCase healthStatus; the value on the wire is the kebab-case 'health-status', matching all 21 siblings.
  - settled check-payload-parses at c115205 → packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts:15-:19, a z.object with exactly three keys and no .optional(), no .partial() and no fourth key — read there: because all three are required, a body missing uptimeSeconds cannot parse. Both halves are pinned in the colocated test: :6-:14 parses HealthStatusPayloadStub and asserts the whole object with toStrictEqual, and :52-:59 parses a body of only status and version and asserts it throws /Required/u.
  - settled HealthStatusPayload.status at c115205 → health-status-payload-contract.ts:16, status: z.enum with the two literals ok and degraded — read there: UNBRANDED, so it carries no brand tag at all and in particular not HealthStatus. That tag is declared exactly once repo-wide, at packages/server/src/contracts/health-response/health-response-contract.ts:12, on z.string().min(1) — an incompatible base type that shared could not import anyway. Guarded at test :42-:50, where a third literal throws /Invalid enum value/u.
  - settled HealthStatusPayload.uptimeSeconds at c115205 → health-status-payload-contract.ts:17, a z.number().int().nonnegative() branded UptimeSeconds — read there: .int() makes it whole seconds and .nonnegative() admits 0. Guarded at test :61-:69 (fractional throws), :71-:79 (negative throws) and :28-:38, which asserts uptimeSeconds 0 PARSES — the value the seed response and the first heartbeat carry in the server's opening second, and the case that would silently disappear if .nonnegative() ever drifted to .positive().
  - settled HealthStatusPayload.version at c115205 → health-status-payload-contract.ts:18, a z.string().min(1) branded ServerVersion — read there: non-empty, and branded ServerVersion rather than PackageVersion, which is the testing package's tag. Guarded at test :81-:89, where an empty string throws /String must contain at least 1 character/u. Both exports reach downstream packages through packages/shared/contracts.ts:757-:758.

### chunk 1 — put the disclosure anchor's animation frames under the test's control, so the hold stops racing a jsdom timer
INTENT:
  - useDisclosureAnchorBindingProxy installs a registerSpyOn over requestAnimationFrame on globalThis, and the constructor-level catch-all it stages records the call and hands back a number WITHOUT invoking the callback it was given. Settled by reading the proxy: no path inside the staged implementation calls its callback argument.
  - useDisclosureAnchorBindingProxy's declared return type carries a frame-advance method alongside setupReleased and isHeld. Settled by reading the return-type annotation, which this repo requires to be explicit.
  - After one holdAnchor and ONE advanced frame, the hold still reads true; after TWO advanced frames it reads false. Settled by two new cases in use-disclosure-anchor-binding.test.ts, each a toBe on the boolean the binding actually produced — not on a call count, and not on a mock.
  - The existing case at use-disclosure-anchor-binding.test.ts:44, whose name promises the hold stays until BOTH releases have run, actually releases both. Settled by reading its body: it advances frames and asserts the transition, rather than ending on a toBe true that its name over-claims.
  - disclosure-anchor-state.proxy.ts contains no sentence claiming jest or jsdom never runs requestAnimationFrame, and says in present tense why setupReleased exists. Settled by reading the comment above setupReleased.
  - packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx passes, and passes again on a repeat run. Settled by running it twice; the stronger settlement is that no timer decides the outcome, which is readable off the proxy without running anything.
  - Every path in FILES is green under lint, typecheck and unit. Settled by the ward run.
  - The chunk's diff lists only .proxy.ts and .test.ts paths. Settled by reading git diff --stat: use-disclosure-anchor-binding.ts, disclosure-anchor-state.ts and subagent-chain-widget.tsx do not appear in it.
FILES:
  - ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy.ts
  - ./packages/web/src/bindings/use-disclosure-anchor/use-disclosure-anchor-binding.test.ts
  - ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.proxy.ts
  - ./packages/web/src/state/disclosure-anchor/disclosure-anchor-state.test.ts
  - ./packages/web/src/bindings/use-auto-scroll/use-auto-scroll-binding.test.ts
  - ./packages/web/src/widgets/auto-scroll-container/auto-scroll-container-widget.test.tsx
  - ./packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx
  - ./packages/web/src/widgets/tool-row/tool-row-widget.test.tsx
  - ./packages/web/src/widgets/show-earlier-toggle/show-earlier-toggle-widget.test.tsx
  - ./packages/web/src/widgets/chat-message/chat-message-widget.test.tsx
  - ./packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.test.tsx
  - ./packages/web/src/widgets/chat-panel/chat-panel-widget.test.tsx
  - ./packages/web/src/widgets/execution-panel/execution-row-layer-widget.test.tsx
  - ./packages/web/src/widgets/execution-panel/execution-panel-widget.test.tsx
  - ./packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx
  - ./packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx
  - ./packages/web/src/widgets/session-view/session-view-widget.test.tsx
  - ./packages/web/src/widgets/app/app-widget.test.tsx
  - ./packages/web/src/responders/app/quest-chat/app-quest-chat-responder.test.ts
  - ./packages/web/src/responders/app/session-view/app-session-view-responder.test.ts
UNITS: none — this chunk exists to settle the `## Rework` line, which names a defect in a TEST rather than an observable. All six units this operation item owes were already true on disk before the round opened and are accounted for under NO CHUNK; nothing in this chunk moves a unit, and nothing in this chunk touches packages/shared.
MIRROR: ./packages/web/src/adapters/websocket/connect/websocket-connect-adapter.proxy.ts
NOTES:
  1. THE FLOW, AND WHERE THIS CHUNK SITS IN IT. The quest flow is #health-badge: the operator opens the app, the top bar carries a health badge on every route, seeded at mount from a new GET /api/health/status and then tracking a health-status heartbeat the server emits every 10 seconds over the WebSocket the interface already holds open. THIS CHUNK IMPLEMENTS NO NODE OF THAT FLOW. It exists because the round document's `## Rework` section makes it this round's job, and because the whole-monorepo ward gate the flow has to pass is currently red on one test in packages/web that has nothing to do with the badge. The badge itself is built by ledger items 4 and 5 (server, web); this operation item's own contribution to the flow — the shared frame-type vocabulary and the payload schema — is already on disk and is listed under NO CHUNK.
  2. WHAT THIS CHUNK MUST SATISFY, QUOTED WORD FOR WORD. It has no observable id. Its target is the round document's `## Rework`, whose operative line reads:
       "NEXT: rework — packages/web/src/widgets/subagent-chain/subagent-chain-widget.test.tsx:67 races a real two-frame timer instead of controlling it, so it reddens only under full-suite load; make it deterministic (registerSpyOn over globalThis.requestAnimationFrame in use-disclosure-anchor-binding.proxy.ts) in the web slice"
     and whose closing instruction reads:
       "Re-verify once fixed: confirm `npm run ward -- --staged` is green end to end, confirm the tree is clean, and close with an explicit `NEXT: continue` line."
     That ward sweep and that tree check belong to the ROUND'S REVIEWER, not to this worker. This worker runs ward over the paths in FILES only.
     The reddening case is named, in full: SubagentChainWidget disclosure anchoring VALID: {click header twice to re-expand} => puts the auto-scroll on hold again. It fails at subagent-chain-widget.test.tsx:67:40 with Expected: true / Received: false.
  3. THE CONTRACTS IT TAKES AND RETURNS. None — no branded contract enters or leaves this chunk. The one shape that matters is the module singleton in packages/web/src/state/disclosure-anchor/disclosure-anchor-state.ts:16, a plain object holding a numeric count, with hold at :19 (count + 1), isHeld at :23 (count > 0), release at :25 (count - 1, floored at 0) and releaseAll at :29 (count = 0). Because it is a MODULE SINGLETON it outlives a test file, which is why every test asserting the hold must open by calling setupReleased. Do not change that state file and do not change its four method names — packages/web/src/bindings/use-auto-scroll/use-auto-scroll-binding.proxy.ts:7 reads it from the other side.
  4. THE DESIGN DECISIONS THAT CONSTRAIN IT. The quest's own design decision on this flow is about the socket, not about this chunk, and is quoted here in full so the worker can see it does NOT bear on the work: "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel already owns reconnection, so this flow adds nothing for it."
     The constraints that DO bear on this chunk are the repo's own, and are load-bearing rather than stylistic:
       - The production two-frame hold is CORRECT and is not to be touched. Its own source comment at use-disclosure-anchor-binding.ts:50-:55 says why, and packages/web/CLAUDE.md repeats it: a ResizeObserver callback for the mutation runs after the layout effects AND after that same frame's first rAF, so releasing any sooner hands the auto-scroll the very resize the hold exists to suppress; and scheduling inside holdAnchor rather than in the layout effect is what stops a component that unmounts itself by toggling from leaving a hold nothing ever releases.
       - No beforeEach / afterEach, no conditionals in a test body, and no jest.mock / jest.spyOn / jest.mocked anywhere. registerSpyOn is the only sanctioned route to a global.
       - Tests never call registerSpyOn directly — it belongs in the proxy, and the test drives a semantic method.
       - Assertions are toBe / toStrictEqual. No toBeTruthy, no toBeDefined, no negated matchers, no unpaired toHaveBeenCalledTimes.
  5. THE ALREADY-BUILT EXPORTS IT WIRES INTO, read off disk rather than guessed.
       - packages/testing/src/register-mock.ts:13 exports jestRegisterSpyOnAdapter under the name registerSpyOn, and :14 exports the type SpyOnHandle from the same module. The import specifier is @dungeonmaster/testing/register-mock. The exact two-line form to copy is at websocket-connect-adapter.proxy.ts:1-:2 — a value import of registerSpyOn and a separate `import type` of SpyOnHandle.
       - The adapter signature, at packages/testing/src/adapters/jest/register-spy-on/jest-register-spy-on-adapter.ts:32-:40, takes a destructured object of object, method and an optional passthrough that DEFAULTS TO FALSE, and returns SpyOnHandle. Its dispatcher at :56-:85 records every call into a per-spy list BEFORE matching (:57), so callsMatching sees calls the staging never answered. At :78 it throws when nothing matched and passthrough is false.
       - The handle's three methods are calledWith at :95, onceFor at :104 and callsMatching at :114. callsMatching returns the recorded ARGUMENT ARRAYS, so a recorded rAF call is a one-element array whose [0] is the callback.
       - The staging verbs are returns, resolves, rejects, throws and implement. requestAnimationFrame is synchronous and returns a handle id, so the honest staging is a returns of a number — NOT a resolves.
       - The proxy this chunk edits currently reads: an import of disclosureAnchorStateProxy at :1, an explicit return type at :3-:6 declaring setupReleased and isHeld, `const stateProxy = disclosureAnchorStateProxy();` at :7, and the two delegating methods at :10-:15. Keep both names and both signatures — four widget proxies call them (chat-message-widget.proxy.tsx:12/:21/:24, show-earlier-toggle-widget.proxy.tsx:7/:11/:14, subagent-chain-widget.proxy.tsx:20/:27/:29, tool-row-widget.proxy.tsx:8/:13/:16) and every one of them re-exports them as setupAutoScrollReleased and isAutoScrollHeld.
       - The nearest in-package precedent for a registerSpyOn INSIDE A BINDING PROXY, with the explanatory comment this repo expects beside one, is use-dispatch-state-binding.proxy.ts:14-:20. Copy its comment discipline: say why the spy is there and why passthrough is or is not set.
       - The MIRROR, websocket-connect-adapter.proxy.ts, is where the DRAIN shape comes from: :121 reads `setTimeoutSpy.callsMatching([]).map((call) => call[0] as () => void)`, then :122-:125 picks and invokes. Its module-scope `const createMockSocket = ...` at :20 is also this repo's precedent that a named, non-exported helper is acceptable in a .proxy.ts file — useful if the drain wants one, though an inline method body is simpler.
  6. GOTCHAS, each one measured rather than assumed.
       - THE DRAIN IS NESTED, so one pass is not enough. holdAnchor schedules an OUTER frame whose callback schedules an INNER frame whose callback calls release. Invoking the outer callback therefore appends a NEW call to the spy's record. callsMatching is a fresh snapshot per call, so the drain must re-read it after each pass and invoke only what it has not already invoked; keep that index in the proxy closure, which is fresh per test. Advancing ONE frame must leave the hold taken. Advancing TWO must release it. That asymmetry IS the test.
       - passthrough MUST NOT be set. With passthrough true the real jsdom rAF is the catch-all and the flake survives untouched. With it absent, the constructor must stage a catch-all or the first unstaged rAF throws.
       - THE CATCH-ALL IS DELIBERATELY BLIND. `calledWith([])` is a prefix match on zero arguments, so it answers every rAF call in the test, including any Mantine makes. That is intended: requestAnimationFrame has exactly one call site in packages/web/src, and swallowing frames is close to what these tests already get, since they assert synchronously right after an await. If a file in FILES nevertheless reddens because something genuinely needed a frame to run, report it in the round log and give THAT widget's own proxy a frame-advance call — never restore the real timer, which is the flake.
       - THE PROXY IS CONSTRUCTED SEVERAL TIMES IN ONE TEST. ChatMessageWidgetProxy builds the anchor proxy at :12 AND builds ToolRowWidgetProxy at :17, which builds another. registerSpyOn is idempotent per target — its isDispatcher guard at jest-register-spy-on-adapter.ts:47-:51 installs the dispatcher once — but each construction stages another identical catch-all. Identical catch-alls are harmless. A drain index in one closure is NOT shared with another closure's, so do NOT forward the frame-advance control up into the four widget proxies: only the binding's own test needs it, and two proxies each exposing a drain over one shared call record is how the same callback gets invoked twice.
       - jest.setup.js:38-:43 runs clearAllMocks, resetAllMocks and restoreAllMocks in beforeEach, so the spy is torn down between tests and reinstalled by the next test's proxy construction. Do not add teardown of your own.
       - disclosure-anchor-state.proxy.ts:8-:10 is a COMMENT CORRECTION, not a behaviour change. Its three lines currently claim jest never runs requestAnimationFrame; jsdom does, on a timer, which is the entire mechanism of this flake. Rewrite it to state, in present tense, what is true now: the singleton outlives a test file, and the proxy freezes the frame that would release a hold, so a test asserting the hold opens from a known release. Per this repo's rule, do NOT write down what the comment used to say or that it was wrong — just make it true.
       - Do not edit subagent-chain-widget.test.tsx or subagent-chain-widget.proxy.tsx. The determinism arrives entirely through the shared binding proxy; both files are in FILES so the ward run covers them, not so they get changed.

PHASES:
  1: wave 1 — the disclosure anchor's frames come under the test's control, so the one red test on the branch stops depending on how loaded the machine is, and the two-frame release gets the first coverage it has ever had below Playwright.

WAVES:
  1: 1

## Round log
