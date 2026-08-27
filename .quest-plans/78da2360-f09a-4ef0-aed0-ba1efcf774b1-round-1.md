# Round 1 — [codeweaver] Codeweaver: build this slice — package: shared

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

## Plan

TOUCHES:
  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — EXISTS — the single `z.enum([...])` naming every frame type the orchestrator bus, the server relay and the web channel agree on; `orchestrationEventTypeContract` opens at :11 with 21 members and closes at :36, and `export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>` at :38 is what every consumer imports. Adding a member here is the whole of the enum half. Its colocated companion `orchestration-event-type-contract.test.ts` (EXISTS) rides with it in the same chunk and is REWRITTEN in that pass: the hand-written 19-literal `it.each` table at :11-:31 becomes a table derived from `orchestrationEventTypeContract.options`, plus a new `toStrictEqual` on `.options` pinning all 22 members in order. `orchestration-event-type.stub.ts` (EXISTS) rides too but needs NO edit — it takes a raw `string` and parses it (:4-:6), so a new member is stubbable already.
      check-event-type-member — carry `'health-status'` as a 22nd member appended AFTER `'dispatch-state-changed'` (:35), leaving all 21 existing literals at their existing spelling and index, including the three-line comment at :21-:23 above `'quest-load-failed'`
      OrchestrationEventType.healthStatus — declare that literal in the enum array so `OrchestrationEventType` widens to include it and `wsMessageContract.type` accepts a health-status frame with no edit of its own
  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — NEW — the object schema for the body of a health-status frame and of the GET /api/health/status seed response, exported as `healthStatusPayloadContract` with `export type HealthStatusPayload = z.infer<typeof healthStatusPayloadContract>`. Lives in shared because server produces it and web parses it, and shared is the only package both may import. Two NEW companions ride with it in the same chunk and are written in the same pass: `health-status-payload.stub.ts` (`HealthStatusPayloadStub`, the object-stub form at rate-limits-snapshot.stub.ts:7-15 — `StubArgument<T>` spread through `contract.parse()`), which server and web tests need to build a valid frame body and which the barrel's second `export *` line publishes; and `health-status-payload-contract.test.ts`, which carries every `VALID:`/`INVALID:` case the ASSERTIONS below name.
      check-payload-parses — parse `{status, uptimeSeconds, version}` successfully, and REJECT an object missing `uptimeSeconds` (all three fields required, none optional)
      HealthStatusPayload.status — declare `z.enum(['ok', 'degraded'])`, unbranded, rejecting any third literal
      HealthStatusPayload.uptimeSeconds — declare a whole, non-negative number branded `'UptimeSeconds'`, rejecting a fractional and a negative value
      HealthStatusPayload.version — declare a non-empty string branded `'ServerVersion'`
  ./packages/shared/contracts.ts — EXISTS — the package-root barrel behind the `./contracts` subpath export (packages/shared/package.json:6); every contract is registered as a PAIR of `export *` lines (contract then stub) under a `// <Name> Contracts` comment, e.g. :727-728 for rate-limits-snapshot. It is what makes a shared contract reachable as `@dungeonmaster/shared/contracts` from server and web. Root barrels are exempt from colocation, so it takes no test of its own.

DEPENDS:
  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
      needs: zod only — the file's sole import is `import { z } from 'zod'` at :9. It imports no other contract, no static and no error, so it sits at the bottom of the import order and nothing in this round has to land before it.
      needed by: ./packages/shared/src/contracts/ws-message/ws-message-contract.ts — imports it at :11 and uses it as `type: orchestrationEventTypeContract` at :13-:14. The 22nd member widens what the envelope accepts automatically; `payload` is `z.record(z.string().brand<'PayloadKey'>(), z.unknown())` at :15, so the envelope needs NO edit to carry a health-status body.
      needed by: ./packages/shared/contracts.ts — already re-exports contract and stub at :260-:261 under `// Orchestration Event Contracts` (:259). No barrel edit is needed for the enum half.
      needed by: ./packages/server/src/responders/server/init/server-init-responder.ts — `const eventTypes = orchestrationEventTypeContract.options;` at :539 then `for (const type of eventTypes)` at :540, skipping only `'quest-modified'` (:541) and `'quest-created'` (:542). This is the ONLY consumer of `.options` in the repo. Crossing that link: the 22nd member gets a relay subscription with zero edits in server, which is precisely the shape the #server-emits seam needs from this side.
      needed by: ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — `dispatchInbound` at :127 parses the envelope at :134 and routes on `envelope.data.type` through a flat if-chain (:137-:186). Crossing that link: the member makes a health-status frame PARSE rather than fall over at the envelope; adding the routing arm is the web session's half, not this round's.
  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts
      needs: zod only — `status`, `uptimeSeconds` and `version` are all declared inline off `z`, mirroring dispatch-state-contract.ts which imports nothing but zod for the same enum-beside-branded-scalars shape. No sibling contract exists for uptime or for a version string (no `UptimeSeconds`, `ServerVersion` or `VersionString` brand anywhere in packages/**/src), so nothing is imported and nothing else in this round has to land first.
      needed by: ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts — imports `healthStatusPayloadContract` and `type HealthStatusPayload` from the colocated contract and parses defaults through it, the shape at rate-limits-snapshot.stub.ts:1-15.
      needed by: ./packages/shared/contracts.ts — the barrel pair that publishes it; without those two lines the contract is unreachable from server and web and both seams stall.
      needed by: the server session (#server-emits) and the web session (#channel-routes) — server parses/constructs the emitted body against it, web parses the delivered frame's payload against it. Neither exists yet; this round owes them only the export.
  ./packages/shared/contracts.ts
      needs: ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — the `export *` target; the barrel line cannot resolve until that file exists.
      needs: ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts — the second half of the registered pair; every sibling entry in this file exports contract AND stub, and server/web tests need `HealthStatusPayloadStub` to build a valid frame body.
      needed by: every consuming package — `import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts'` (the live form at packages/web/src/brokers/rate-limits/get/rate-limits-get-broker.ts:8-9, value and type split into two statements). node10 resolution reads `contracts.ts` source directly for typecheck and lint, so downstream packages typecheck immediately but must rebuild shared before running.

DECISIONS:
  - The `HealthStatus` brand tag is genuinely taken, so the spec's rename is correct and not merely stylistic: packages/server/src/contracts/health-response/health-response-contract.ts:12 declares `status: z.string().min(1).brand<'HealthStatus'>()` (and :13 takes `HealthTimestamp`). That contract has no `uptimeSeconds` and no `version`, and lives in server, which shared may not import. The new contract therefore brands nothing `HealthStatus`.
  - `version` brands `'ServerVersion'`, not `'PackageVersion'`. `PackageVersion` is already declared at packages/testing/src/contracts/package-json/package-json-contract.ts:14; zod brands are structural, so reusing the tag in shared would make a test-harness package-version and a server version silently interchangeable — the same trap the spec's `HealthStatusPayload` note describes. No `ServerVersion`, `UptimeSeconds` or `VersionString` brand exists anywhere under packages/**/src today, so both new tags are free.
  - `status` is a bare, UNBRANDED `z.enum(['ok', 'degraded'])`. CORRECTED after the stage-5 check: shared's precedent is MIXED, not one-sided — packages/shared/src/contracts/image-block-param/image-block-param-contract.ts:13 brands an enum that IS an object field (`media_type: z.enum([...]).brand<'MediaType'>()`), so "shared never brands an enum field" would be false and is not the reason. The reason is the nearest analogue plus the spec: packages/shared/src/contracts/dispatch-state/dispatch-state-contract.ts:15 (`mode: z.enum(['node-playing', 'paused'])`) is the same thing this field is — a two-literal mode on a small server-produced status payload shipped to the web UI — and carries no brand; and the spec's property text gives `status` as "Either the literal 'ok' or the literal 'degraded'" while warning off a `HealthStatus`-shaped brand here. A brand on a closed two-literal enum buys nothing at a seam where both sides parse the same schema.
  - `wsMessageContract` needs NO edit this round. packages/shared/src/contracts/ws-message/ws-message-contract.ts:13-17 types the envelope as `{type: orchestrationEventTypeContract, payload: z.record(z.string().brand<'PayloadKey'>(), z.unknown()), timestamp: ...}` — the payload half is an unconstrained record, so once the enum carries `'health-status'` a health frame parses through the existing envelope untouched. No TOUCHES entry for it.
  - Adding a 22nd member breaks nothing on disk, verified by grep rather than inferred: `orchestrationEventTypeContract.options` has exactly ONE consumer repo-wide — packages/server/src/responders/server/init/server-init-responder.ts:539-542, a `for…of` that subscribes every member and skips only `'quest-modified'` and `'quest-created'` — and there is no `Record<OrchestrationEventType, …>` anywhere in packages/**/src, so no exhaustive keyed map goes red. The two structures that DO enumerate members by hand are already non-exhaustive with fallbacks (server `PER_QUEST_EVENT_TYPES`, an 8-member subset; server `dev-log-event-icons-statics`, 11 of 21 keys with a `'· '` default at dev-log-event-format-transformer.ts:28) and belong to the server session in any case.
  - The existing `it.each` table at packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.test.ts:11-31 hardcodes only 19 of the current 21 members — `'quest-paused'` and `'quest-resumed'` are absent between `'quest-persisted'` (:22) and `'clarification-request'` (:23) — and no assertion anywhere in that file reads `.options` or a member count. `get-testing-patterns` bans exactly this ("NEVER hardcode the list of cases… derive it from its `*-statics.ts` / Zod `.options`… A hardcoded `it.each` array silently goes stale the moment someone adds a new member"). Chunk 1 derives the table from `orchestrationEventTypeContract.options`, which is both the fix for the stale two and what makes "the prior 21 unchanged" self-guarding rather than a claim nobody rechecks.
  - Contract tests in this repo DO import their own colocated contract, despite `get-folder-detail({folderType:'contracts'})` stating "Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files". Both orchestration-event-type-contract.test.ts:1 and rate-limits-snapshot-contract.test.ts:2 import the contract value alongside the stub, and `@dungeonmaster/ban-contract-in-tests` is green on them — the rule evidently permits the colocated case. Workers mirror the on-disk files, not that doc line.
  - Contracts carry NO `.proxy.ts`. `discover({glob: 'packages/shared/src/contracts/**/*.proxy.ts'})` returns 0 results across all 657 shared contract files, and get-folder-detail states "Proxy Required: No". The new folder is exactly three files: `-contract.ts`, `.stub.ts`, `-contract.test.ts`.
  - Both seams are NOT BUILT YET, so neither is mine to repair: #server-emits (server) and #channel-routes (server, web). This round builds only the shared half — the enum member and the payload contract — and the shape those sessions need from it is the two barrel-reachable exports plus `HealthStatusPayloadStub`. The server session inherits its relay subscription for free from the `.options` loop at server-init-responder.ts:539; the web session still has to add a routing arm to `dispatchInbound` (web-socket-channel-state.ts:137-188 is a flat if-chain with no default, so an unrouted health frame is silently dropped rather than erroring). Left for them, deliberately.
  - Round 1 has no rework and no dead-session mess: `git status --porcelain` lists only the untracked `.quest-plans/` (this document), and `git log master..HEAD` is empty — the branch sits at master's head, ff3f95679. Nothing to repair as chunk 1.
  - `get-planner-information` is permission-blocked in this session — three calls returned "Claude requested permissions to use mcp__dungeonmaster__get-planner-information, but you haven't granted it yet". This plan is therefore written from the `codeweaver-planner-minion` prompt's own document template, block order and chunk-field definitions, which carry the same structure. Flagging it because the block would otherwise look self-invented, and because the permission gap will hit every planner minion on this quest until it is granted.

ASSERTIONS:
  - `orchestrationEventTypeContract.options` is exactly the 21 existing literals in their existing order followed by `'health-status'`, 22 in total. Check: read packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts:11-36 against the pre-round list, and read the `toStrictEqual` on `.options` in its colocated test — one assertion pins membership, count and order together.
  - The enum test derives its parse table from `orchestrationEventTypeContract.options` rather than a hand-written array, so a 23rd member added later is covered without editing the table. Check: grep the test file for a literal array of event names — there should be none driving `it.each`.
  - `healthStatusPayloadContract` and `type HealthStatusPayload` exist at packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts. Check: open the file; the schema is a `z.object` with exactly the keys `status`, `uptimeSeconds`, `version`, none optional.
  - A payload missing `uptimeSeconds` FAILS the parse. Check: the colocated test's `INVALID:` case parses `{status: 'ok', version: '…'}` and asserts it throws `/Required/u`.
  - `status` accepts `'ok'` and `'degraded'` and rejects any third literal. Check: the test's two `VALID:` cases and an `INVALID:` case asserting `/Invalid enum value/u`.
  - `uptimeSeconds` rejects a fractional value and a negative value. Check: two `INVALID:` cases in the test, asserting on the real zod messages the implementation produces.
  - `version` rejects the empty string. Check: an `INVALID:` case in the test.
  - Both the contract and `HealthStatusPayloadStub` are importable from another package as `@dungeonmaster/shared/contracts`. Check: packages/shared/contracts.ts carries the two paired `export *` lines under a `// Health Contracts` comment, matching the pair form used at :727-728.
  - No existing enum member changes spelling or position, and the round touches exactly SIX files. Check: `git diff --stat` for the round names exactly these and nothing else — packages/shared/contracts.ts (edited), .../orchestration-event-type/orchestration-event-type-contract.ts (edited, a pure insertion), .../orchestration-event-type/orchestration-event-type-contract.test.ts (edited), .../health-status-payload/health-status-payload-contract.ts (new), .../health-status-payload/health-status-payload.stub.ts (new), .../health-status-payload/health-status-payload-contract.test.ts (new). `orchestration-event-type.stub.ts` is NOT in the diff.

NO CHUNK:
  - (none) — both acceptance targets and all four contract property requirements are absent from the tree, so nothing is `settled`; and all six are provable in Jest at the contract layer, so nothing is `out-of-medium`. The browser-only surfaces of this flow (the badge's painted text, the 30-second silence threshold, the click-to-retry on OFFLINE) belong to observables attributed to `web`, which are NOT in this piece's `Must satisfy` list — they route to the web codeweaver session and then to groundstomper's browser walk, and are named here only so their absence from the chunks reads as routing rather than omission.

### chunk 1 — add 'health-status' as the 22nd orchestration event type, and make its parse table derive from the enum
INTENT:
  - `orchestrationEventTypeContract.options` returns 22 members, the first 21 byte-identical to what they are now and `'health-status'` last. Settled by reading the diff: it is a pure insertion of one line before the closing `]);`.
  - The colocated test asserts `.options` as ONE whole array with `toStrictEqual`, and drives its per-member parse cases from `orchestrationEventTypeContract.options` rather than a hand-written list. Settled by reading the test: no array literal of event names drives `it.each`, and a 23rd member added later needs no edit to that table.
FILES:
  - ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
  - ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.test.ts
UNITS:
  - check-event-type-member → ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — declare `'health-status'` as a 22nd string literal in the `z.enum([...])` array, inserted after `'dispatch-state-changed'` and before the closing bracket, with every existing literal and the three-line comment above `'quest-load-failed'` left exactly as they are.
  - OrchestrationEventType.healthStatus → ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — the same literal is what widens the inferred `OrchestrationEventType` union, which is the type the server relay and the web channel both hold.
MIRROR: ./packages/shared/src/contracts/signoff-verdict/signoff-verdict-contract.test.ts
NOTES:
  1. THE FLOW. `#health-badge`. The operator opens the app; the top bar carries a health badge on every route, seeded at mount from a new `GET /api/health/status` and then tracking a `health-status` heartbeat the server emits every 10 seconds over the WebSocket the interface already holds open. The badge reads ONLINE with uptime beside it, DEGRADED, or OFFLINE. This chunk implements the enum half of TWO nodes at once: `#server-emits` (the relay can only subscribe to a type the enum names) and `#channel-routes` (the browser can only parse an envelope whose `type` the enum accepts). It builds no emitter, no route and no badge — those are the server and web sessions'.
  2. THE OBSERVABLES, WORD FOR WORD.
       check-event-type-member [custom] on #server-emits: "orchestrationEventTypeContract.options contains 'health-status' and has 22 members, the prior 21 unchanged"
       OrchestrationEventType.healthStatus: "The new twenty-second member of the enum. All 21 existing members keep their spelling and order; this one is added so both the server relay and the web channel accept the frame type."
  3. THE CONTRACTS. Takes and returns nothing new. It edits `orchestrationEventTypeContract` (a `z.enum`, so it exposes `.options` as a readonly tuple) and, through it, `export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>`. The literal string is `'health-status'` — kebab-case, matching every other member; the spec's property KEY is `healthStatus`, which is the quest's own camelCase naming for the requirement and is NOT the value that goes in the array.
  4. THE DESIGN DECISION THAT CONSTRAINS IT, QUOTED. "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel already owns reconnection, so this flow adds nothing for it." For this chunk that means: add ONE member and nothing else. Do not add a `health-status-lost`, `health-timeout`, `socket-reconnected` or any second member to represent silence — silence is the absence of a frame, and nothing on the wire represents it.
  5. THE ALREADY-BUILT EXPORTS YOU WIRE INTO, READ OFF DISK.
       - `orchestration-event-type-contract.ts:11-36` — `export const orchestrationEventTypeContract = z.enum([...])`, currently 21 members opening at :11 and closing at :36. `:21-:23` is a three-line comment above `'quest-load-failed'`; leave it in place.
       - `orchestration-event-type-contract.ts:38` — `export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>;`
       - `orchestration-event-type.stub.ts:4-6` — `export const OrchestrationEventTypeStub = ({ value }: { value: string } = { value: 'phase-change' }): OrchestrationEventType => orchestrationEventTypeContract.parse(value);`. It takes a RAW string and parses it, so it needs NO edit and already stubs the new member. Use it in the `it.each` body exactly as the mirror uses `SignoffVerdictStub`. DO NOT edit this file.
       - `packages/shared/contracts.ts:259-261` — the barrel already exports this contract and its stub under `// Orchestration Event Contracts`. DO NOT touch the barrel in this chunk.
       - `packages/shared/src/contracts/ws-message/ws-message-contract.ts:13-17` — `wsMessageContract` uses this enum as its `type` field and types `payload` as `z.record(z.string().brand<'PayloadKey'>(), z.unknown())`. It needs NO edit; do not open it.
       - `packages/server/src/responders/server/init/server-init-responder.ts:539-542` — `const eventTypes = orchestrationEventTypeContract.options;` then a `for…of` that subscribes every member, skipping only `'quest-modified'` and `'quest-created'`. This is the only `.options` consumer in the repo; your member is subscribed there automatically. DO NOT edit that file — it belongs to the server session.
     REWRITING THE TEST: the existing `it.each` at `:11-:31` is a hand-written array listing only 19 of the current 21 members (`'quest-paused'` and `'quest-resumed'` are missing). Replace that array with `orchestrationEventTypeContract.options` and add a membership test above it asserting the whole 22-member array with `toStrictEqual`, exactly as the MIRROR does at its `:6-:15`. Keep the three existing `INVALID:` cases, including the `'smoketest-progress'` removed-value regression case — they still hold. Keep the `VALID: {default} => uses default phase-change` case.

### chunk 2 — the health-status payload contract, its stub, its test, and its barrel pair
INTENT:
  - `healthStatusPayloadContract` parses `{status, uptimeSeconds, version}` and REJECTS the same object with `uptimeSeconds` removed. Settled by running the colocated test, whose `INVALID:` case asserts that throw on the real zod message.
  - `import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts'` and `import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts'` both resolve from another package. Settled by reading `packages/shared/contracts.ts` for the paired `export *` lines.
FILES:
  - ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts
  - ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts
  - ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.test.ts
  - ./packages/shared/contracts.ts
UNITS:
  - check-payload-parses → ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — declare a `z.object` whose three fields are ALL required, so a well-formed body parses and one missing `uptimeSeconds` throws.
  - HealthStatusPayload.status → ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — declare `status: z.enum(['ok', 'degraded'])`, unbranded.
  - HealthStatusPayload.uptimeSeconds → ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — declare `uptimeSeconds` as a whole, non-negative number branded `'UptimeSeconds'`.
  - HealthStatusPayload.version → ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — declare `version` as a non-empty string branded `'ServerVersion'`.
MIRROR: ./packages/shared/src/contracts/rate-limits-snapshot/rate-limits-snapshot-contract.ts
NOTES:
  1. THE FLOW. `#health-badge`. The operator opens the app; the top bar carries a health badge on every route, seeded at mount from a new `GET /api/health/status` returning status, uptime and version, then tracking a `health-status` heartbeat the server emits every 10 seconds over the WebSocket the interface already holds open. The badge reads ONLINE with uptime beside it, DEGRADED, or OFFLINE. This chunk implements the payload half of `#channel-routes`: the ONE schema both ends of the wire agree on. It is the body of the heartbeat frame AND the body of the seed response — one contract, two carriers. It builds neither carrier.
  2. THE OBSERVABLE, WORD FOR WORD.
       check-payload-parses [custom] on #channel-routes: "A health-status payload parses against healthStatusPayloadContract, and a payload missing uptimeSeconds fails that parse"
     And the three contract property requirements, word for word:
       status: "Either the literal 'ok' or the literal 'degraded'. Deliberately NOT named HealthStatus: the server's existing health-response contract already brands that name onto z.string().min(1), and two schemas sharing a brand tag with different base types are not interchangeable. shared also cannot import from server, so the name must differ rather than be reused."
       uptimeSeconds: "Whole seconds the server process has been running. Rendered as Xh Ym beside ONLINE."
       version: "The server package version string, carried for display and diagnosis."
  3. THE CONTRACTS THIS CHUNK TAKES AND RETURNS. It creates them. `export const healthStatusPayloadContract = z.object({...})` and `export type HealthStatusPayload = z.infer<typeof healthStatusPayloadContract>`, at `packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts`. Field shapes: `status: z.enum(['ok', 'degraded'])` — UNBRANDED, and NOT `.brand<'HealthStatus'>()`, which is taken (see below); `uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>()`; `version: z.string().min(1).brand<'ServerVersion'>()`. All three required — no `.optional()` on any of them, because the observable's whole second clause is that a missing `uptimeSeconds` FAILS. It imports zod and nothing else.
  4. THE DESIGN DECISION THAT CONSTRAINS IT, QUOTED. "A socket reconnect needs no special handling — Offline is decided by heartbeat silence rather than by transport state, so a drop and reconnect is invisible to the badge's own logic: frames stop, the threshold may elapse, and the first frame after reconnect moves the badge on its ordinary path. The existing channel already owns reconnection, so this flow adds nothing for it." For this chunk that means the payload carries NO transport state and NO third status: there is no `'offline'` member, no `connected` boolean, no `lastSeenAt`. OFFLINE is decided by the browser from silence, not sent over the wire — a server that can send you a frame is by definition not offline. The enum is exactly two members.
  5. THE ALREADY-BUILT EXPORTS YOU WIRE INTO, READ OFF DISK.
       - The MIRROR, `rate-limits-snapshot-contract.ts:12-18`: `export const rateLimitsSnapshotContract = z.object({...});` then a blank line then `export type RateLimitsSnapshot = z.infer<typeof rateLimitsSnapshotContract>;`. Follow its file shape and its PURPOSE/USAGE header form.
       - The STUB mirror, `rate-limits-snapshot.stub.ts:1-15`: `import type { StubArgument } from '@dungeonmaster/shared/@types';` … `export const RateLimitsSnapshotStub = ({ ...props }: StubArgument<RateLimitsSnapshot> = {}): RateLimitsSnapshot => rateLimitsSnapshotContract.parse({ <defaults>, ...props });`. Your `HealthStatusPayloadStub` takes exactly that shape. Pick defaults a reader recognises as a healthy server — `status: 'ok'` and a non-zero `uptimeSeconds` — because server and web tests will build every frame off this.
       - The TEST mirror, `rate-limits-snapshot-contract.test.ts`: a `describe('valid …')` / `describe('invalid …')` split, `toStrictEqual` on the whole parsed object, and at `:56-:60` the exact missing-field case your second clause needs — `expect(() => { contract.parse({}); }).toThrow(/Required/u);`. Note this file imports BOTH the contract and the stub (`:2-:3`); that is the on-disk convention for a contract's own colocated test.
       - `packages/shared/src/contracts/dispatch-state/dispatch-state-contract.ts:14-20` — the shape precedent for an unbranded two-literal enum sitting beside branded scalars in one shared payload object.
       - `packages/shared/src/contracts/timeout-ms/timeout-ms-contract.ts:11` — `z.number().int().min(0).brand<'TimeoutMs'>()`, the repo's whole-number-duration form.
       - `packages/server/src/contracts/health-response/health-response-contract.ts:12` — `status: z.string().min(1).brand<'HealthStatus'>()`. THIS IS WHY THE NAME DIFFERS. Do not import it (shared cannot import server) and do not reuse the tag.
       - `packages/testing/src/contracts/package-json/package-json-contract.ts:14` — `version: z.string().brand<'PackageVersion'>()`. Also do not reuse: zod brands are structural, so the same tag in shared would make the two silently interchangeable. `'ServerVersion'` is free.
       - `packages/shared/contracts.ts` — the barrel. It currently ends at `:753-754` with the `operation-plan` contract/stub pair. Append a new commented pair in the established form: a `// Health Contracts` comment line, then `export * from './src/contracts/health-status-payload/health-status-payload-contract';` and `export * from './src/contracts/health-status-payload/health-status-payload.stub';`. Both lines, not one — server and web tests need the stub.

PHASES:
  1: wave 1 — the whole round is the contracts layer. Nothing in this piece imports anything else in this piece: chunk 1 edits an enum whose only import is zod, chunk 2 creates an object schema whose only import is zod, and the two share no file. So this is a legal one-phase round, and its phase gate is where the reviewer catches a wrong contract before the server and web sessions build on it.

WAVES:
  1: 1, 2

## Round log




