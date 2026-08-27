# Round 2 — [codeweaver] Codeweaver: build this slice — package: shared

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

Round 1's final reviewer (no PHASE/WAVE/SECTION brief) returned a full VERDICT: yes, accepted both
chunks (1: health-status enum member; 2: healthStatusPayloadContract), applied one fix (a header
comment correction on orchestration-event-type-contract.ts), reported ward green twice (build across
13 packages, then `npm run ward -- --staged` — lint 6 files, typecheck 12 packages/6136 files, unit 3
files/557 discovered, integration 3 files/1 discovered, e2e skip as shared is not e2e-eligible), and
committed + pushed as `round 1: …` (2cd42e5). `git status` after that return showed a clean tree.

But its return ended without a required `NEXT:` line — no `NEXT: continue`, no `NEXT: rework`, no
`NEXT: wall` anywhere in the text. Per protocol, a minion return with no `NEXT:` line at all is
treated as `rework`, regardless of how complete the prose otherwise reads.

Re-verify: confirm the round's work (both contracts, both tests, the barrel registration) is complete
and correct on disk, confirm the tree is clean, and confirm both `Must satisfy` acceptance targets
still hold. If genuinely nothing remains, close with an explicit `NEXT: continue` line. If something
is actually wrong, name it and close with `NEXT: rework — <what is not done>`.

## Plan

TOUCHES:
  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — EXISTS — the single `z.enum([...])` naming every frame type the orchestrator bus, the server relay and the web channel agree on. On disk right now it opens at :15 and closes at :41 with TWENTY-TWO members, `'health-status'` last at :40 immediately after `'dispatch-state-changed'` (:39); `export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>` at :43 is what every consumer imports. The 22nd member landed at c115205 and the file's PURPOSE header was rewritten at 2cd42e5; nothing in this round's `Must satisfy` list is outstanding on it. Its colocated companion `orchestration-event-type-contract.test.ts` (EXISTS) rides with it and already carries both halves of the guard: a `toStrictEqual` on `.options` pinning all 22 in order at :12-:36, and `it.each(orchestrationEventTypeContract.options)` at :39 deriving the per-member parse table from the live array rather than a hand-written list. `orchestration-event-type.stub.ts` (EXISTS) rides too and is untouched by the round — it takes a raw `string` and parses it, so it stubs the new member already.
      check-event-type-member — carry `'health-status'` as a 22nd member after `'dispatch-state-changed'` with all 21 prior literals at their existing spelling and index, including the three-line comment at :25-:27 above `'quest-load-failed'`. ALREADY TRUE — see NO CHUNK.
      OrchestrationEventType.healthStatus — declare that literal in the enum array so `OrchestrationEventType` widens to include it and `wsMessageContract.type` accepts a health-status frame with no edit of its own. ALREADY TRUE — see NO CHUNK.
  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — EXISTS — the object schema for the body of a health-status frame AND of the `GET /api/health/status` seed response, the one schema both ends of the wire parse. On disk at :15-:19 as a `z.object` with exactly three required keys — `status: z.enum(['ok', 'degraded'])` (:16, unbranded), `uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>()` (:17), `version: z.string().min(1).brand<'ServerVersion'>()` (:18) — with `export type HealthStatusPayload = z.infer<typeof healthStatusPayloadContract>` at :21. Created at c115205. Two companions ride with it and are also on disk: `health-status-payload.stub.ts` (`HealthStatusPayloadStub`, the `StubArgument<T>`-spread-through-`contract.parse()` form, defaults `{status: 'ok', uptimeSeconds: 120, version: '1.0.0'}`), which the server and web sessions need to build a valid frame body; and `health-status-payload-contract.test.ts`, eight cases across a `valid payloads` / `invalid payloads` describe split.
      check-payload-parses — parse `{status, uptimeSeconds, version}` successfully and REJECT an object missing `uptimeSeconds`. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.status — declare `z.enum(['ok', 'degraded'])`, unbranded, rejecting any third literal. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.uptimeSeconds — declare a whole, non-negative number branded `'UptimeSeconds'`. ALREADY TRUE — see NO CHUNK.
      HealthStatusPayload.version — declare a non-empty string branded `'ServerVersion'`. ALREADY TRUE — see NO CHUNK.
  ./packages/shared/contracts.ts — EXISTS — the package-root barrel behind the `./contracts` subpath export at packages/shared/package.json:6; every contract is registered as a PAIR of `export *` lines (contract then stub), many of them — including both of this piece's — under a `// <Name> Contracts` comment, though that comment is NOT universal: :250-:257 carries three consecutive uncommented pairs (`quest-contract-property`, `quest-contract-entry-id`, `quest-contract-entry`). The PAIR is the invariant; the comment is a convention. It carries the orchestration-event-type pair at :260-:261 (pre-existing, needed no edit) and the health-status-payload pair at :757-:758 under a `// Health Contracts` comment at :756, appended at c115205 directly after the `operation-plan` pair. This file is what makes both exports reachable as `@dungeonmaster/shared/contracts` from the server and web sessions still ahead on this quest. Root barrels are exempt from colocation, so it takes no test of its own and carries no unit.

DEPENDS:
  ./packages/shared/contracts.ts
      needs: ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts — the `export *` target at :757. The barrel line cannot resolve unless that file exists; it does, so the link is live.
      needs: ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts — the second half of the registered pair at :758. Every sibling entry in this file exports contract AND stub, and the server and web sessions' tests need `HealthStatusPayloadStub` to build a valid frame body without hand-writing one.
      needs: ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts — the `export *` target at :260, pre-existing and untouched by this piece of work.
      needed by: every consuming package, as `@dungeonmaster/shared/contracts` — this is the ONLY link that carries this round's work out of `shared`. node10 resolution reads `contracts.ts` source directly for typecheck and lint, so the server and web sessions typecheck against it with no build; they must rebuild `shared` before RUNNING. `packages/shared/index.ts:11` also re-exports the whole barrel, so both names are reachable from the package root too.
  ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
      needs: zod only — the file's sole import is `import { z } from 'zod'` at :13. It imports no other contract, no static and no error, so it sits at the bottom of the import order and nothing has to land before it.
      needed by: ./packages/shared/src/contracts/ws-message/ws-message-contract.ts — imports it at :11 and uses it directly as `type: orchestrationEventTypeContract` at :14. Crossing that link: the 22nd member widens what the envelope accepts, automatically. `payload` at :15 is `z.record(z.string().brand<'PayloadKey'>(), z.unknown())`, an unconstrained record, so the envelope carries a health-status body with NO edit of its own — which is why `wsMessageContract` is not a TOUCHES entry.
      needed by: ./packages/server/src/responders/server/init/server-init-responder.ts — `const eventTypes = orchestrationEventTypeContract.options;` at :539, then `for (const type of eventTypes)` at :540 skipping only `'quest-modified'` (:541) and `'quest-created'` (:542). Verified by discover as the ONLY `.options` consumer in the repo outside the contract's own test. Crossing that link: the 22nd member gets a relay subscription with zero server edits, which is exactly what the #server-emits seam needs from this side.
      needed by: ./packages/web/src/state/web-socket-channel/web-socket-channel-state.ts — `dispatchInbound` at :127 safe-parses the envelope at :134 and routes on `envelope.data.type` through a flat if-chain at :137-:188. Crossing that link: the member is what makes a health-status frame PARSE at :134 instead of being dropped at `if (!envelope.success) return;` (:135). The chain has NO arm for `'health-status'` and no default, so a health frame currently parses and is then silently discarded — adding that arm is the web session's half of #channel-routes, deliberately not built here.
      needed by: ./packages/shared/contracts.ts — already re-exported at :260-:261; no barrel edit was owed for the enum half.
  ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts
      needs: zod only — `status`, `uptimeSeconds` and `version` are all declared inline off `z` at :16-:18. No sibling contract exists for an uptime or a version brand, so nothing is imported and nothing has to land first.
      needed by: ./packages/shared/src/contracts/health-status-payload/health-status-payload.stub.ts — imports the contract value at :3 and `type HealthStatusPayload` at :4, and parses its defaults through the contract at :9.
      needed by: ./packages/shared/src/contracts/health-status-payload/health-status-payload-contract.test.ts — imports the contract at :1 and the stub at :2; this is the on-disk convention for a contract's own colocated test, and it is what proves both halves of check-payload-parses.
      needed by: ./packages/shared/contracts.ts — the barrel pair that publishes it. Without those two lines the contract is unreachable from `server` and `web` and BOTH remaining seams stall.
      needed by: the server session (#server-emits) and the web session (#channel-routes) — server constructs and serialises the emitted body against it; web parses the delivered frame's payload against it. discover confirms NEITHER exists yet: `healthStatusPayloadContract` and `HealthStatusPayloadStub` have zero references anywhere outside this contract's own folder. This piece of work owes them only the export, and the export is there.

DECISIONS:
  - ALL SIX UNITS IN THIS PIECE ARE ALREADY TRUE ON DISK, read off the files rather than off the ledger or the round-1 report. `git log --name-only master..HEAD -- packages/shared/` shows c115205 (`phase 1:`) introduced all six round-1 files and 2cd42e5 (`round 1:`) touched exactly one of them, and only its PURPOSE header. The enum member is at orchestration-event-type-contract.ts:40, last in a 22-member `z.enum` opened at :15; the payload schema is at health-status-payload-contract.ts:15-:19 with three required keys; the barrel pair is at contracts.ts:757-:758. Each unit's per-file evidence is in NO CHUNK below.
  - THE ROUND-1 DEFECT IS IN A RETURN MESSAGE, NOT IN THE TREE, so no chunk can repair it. `## Rework` names one thing: round 1's final reviewer ended without a `NEXT:` line, which protocol reads as `rework`. A return message is not a file — there is no path a worker could edit to add that line retroactively. What the tree can be asked is whether the work that return DESCRIBED is genuinely there, and it is: every SUBSTANTIVE claim in the 2cd42e5 commit body checks out against the files (both contracts, both colocated tests, the stub, the barrel pair, and the PURPOSE fix on orchestration-event-type-contract.ts:2-:6). Three of that body's LINE CITATIONS are stale, and they are stale in a way worth naming because the next round's planner reconstructs this quest from these commit bodies: it cites `orchestration-event-type-contract.ts:36` for `'health-status'` (really :40), `the :21-23 comment` for the quest-load-failed note (really :25-:27), and `contracts.ts:755-758` for the paired export (:755 is the second `operation-plan` line; the pair is :757-:758 under the comment at :756). All three are pre-PURPOSE-rewrite offsets — that same commit's header fix added four lines above them and it quoted its own pre-fix reading. The code is right; only the offsets in the prose drifted, and no chunk can repair a commit message. This round therefore delivers the re-verification `## Rework` asks for as a READING, and its `NEXT:` line is the artefact that was missing.
  - THE TREE IS CLEAN and no dead session left work mid-round. `git status` lists exactly one path, untracked: `.quest-plans/78da2360-…-round-2.md`, this document, which the holder wrote and which the planner's own commit tracks. No modified file, no staged file, no other untracked path. Nothing to cut as a chunk-1 repair.
  - ROUND 1 IS FULLY PUSHED, which changes what `npm run ward -- --staged` measures for this round. `git rev-parse HEAD` and `git rev-parse origin/quest/server-health-badge-in-the-app-top-bar-a7520e60` are the same commit (2cd42e5), and `git log origin/…..HEAD` is empty. `--staged` measures files origin lacks, so on a zero-chunk round it sees only this markdown document and reports skip / DISCOVERY MISMATCH on every check type — that is an empty code set, NOT a green ward over the shared contracts. The evidence that this tree is green is that `--staged` already ran green over exactly these six files at 2cd42e5 (lint 6 files, typecheck 12 packages / 6136 files, unit 3 files / 557 discovered, integration 3 files / 1 discovered, e2e skip — `shared` is not e2e-eligible), and the tree has not moved since. A file-scoped run over the six paths is the invocation that re-measures the same surface today.
  - ALL THREE SEAMS ARE STILL NOT BUILT YET, so none of the other side's observables is mine to repair, and the classification is confirmed against code rather than against the ledger. #server-emits (server): `orchestrationEventTypeContract.options` has exactly ONE consumer repo-wide, `server-init-responder.ts:539-:542`, a generic `for…of` that subscribes every member — so the server session inherits its relay subscription for free, but no emitter, no 10-second timer and no `GET /api/health/status` route exists. #channel-routes (server): no serialiser for the frame. #channel-routes (web): `web-socket-channel-state.ts` `dispatchInbound` (:127) routes on `envelope.data.type` through a flat if-chain at :137-:188 with NO `'health-status'` arm and no default, so a health frame parses at :134 and is then silently dropped. Adding that arm is the web session's half. This piece's whole obligation to all three is the two barrel-reachable exports plus `HealthStatusPayloadStub`, and discover confirms nothing outside the contract's own folder references either name yet — which is what NOT BUILT YET should look like from here.
  - `wsMessageContract` STILL NEEDS NO EDIT, re-checked rather than inherited. ws-message-contract.ts:13-:17 types the envelope as `{type: orchestrationEventTypeContract, payload: z.record(z.string().brand<'PayloadKey'>(), z.unknown()), timestamp: …}`; the payload half is an unconstrained record, so a health-status body crosses the existing envelope untouched. No TOUCHES entry for it.
  - THE FIVE NON-`shared` PATHS IN THE BRANCH DIFF ARE NOT THIS PIECE'S SUBJECT and get no chunk. `git diff --stat master..HEAD` names ELEVEN paths: the six shared files, plus `.claude/settings.json`, `.claude/commands/dumpster-{create,hunt,launch}.md`, and `.quest-plans/78da2360-f09a-4ef0-aed0-ba1efcf774b1-round-1.md` (237 insertions, added at 2cd42e5) — round 1's own round document, which is the planner's and reviewer's sanctioned commit and not stray mess. The four `.claude/` paths were produced by round 1's `npm run build && npm link --workspaces && npm run init` — this repo's own sanctioned remedy for a stale generated settings file — and round 1's reviewer verified them (the three `mcp__dungeonmaster__get-{planner,worker,reviewer}-information` permissions were already in `mcpToolsStatics.tools.names`, so the generated file was stale rather than the static; the three command files were confirmed byte-identical regenerations). They are committed, they are not `shared`, and CLAUDE.md forbids hand-editing `.claude/settings.json` in any case. Mess on a subject unrelated to this round is not this round's.
  - BOTH NEW BRAND TAGS ARE STILL UNIQUE REPO-WIDE, re-measured rather than inherited, because a zod brand is STRUCTURAL and a second declaration of the same tag would silently make two unrelated values interchangeable. A walk over every `.ts`/`.tsx` under `packages/**` excluding `dist` and `node_modules` finds `brand<'UptimeSeconds'>` and `brand<'ServerVersion'>` in exactly ONE file each — health-status-payload-contract.ts:17 and :18 — and `brand<'HealthStatus'>` in exactly one OTHER file, packages/server/src/contracts/health-response/health-response-contract.ts:12, where it sits on `z.string().min(1)` beside only a `HealthTimestamp`, with no `uptimeSeconds` and no `version`. That is precisely the incompatible base type the spec's `status` property text warns about, so the rename is load-bearing and correctly applied.
  - NO EXHAUSTIVE KEYED MAP OVER THE ENUM EXISTS, so the 22nd member cannot have broken a consumer at typecheck. `discover({grep: "Record<OrchestrationEventType|OrchestrationEventType,"})` returns 13 hits and every one is either a type-only import or a runtime `Map<OrchestrationEventType, …>` (orchestration-events-state.ts:15, orchestrator-events-on-adapter.proxy.ts:12) — a Map takes a new key without complaint. There is no `Record<OrchestrationEventType, …>` anywhere.
  - `get-planner-information` RESOLVES NOW. Round 1's plan recorded it as permission-blocked for sub-agents and fell back to the prompt's own template; that gap was closed by the settings regeneration above, and this plan is written against the tool's actual block order, chunk fields and index formats. Recording it because the two rounds' plans would otherwise look inconsistently sourced.

ASSERTIONS:
  - `orchestrationEventTypeContract.options` is exactly the 21 prior literals in their prior order followed by `'health-status'`, 22 in total. Check: read packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts:15-:41, then `git diff master..HEAD` on that file — the member half of the diff is the single line `+  'health-status',`, so no prior literal moved or changed spelling.
  - That 22-member list is self-guarding rather than a claim nobody rechecks. Check: orchestration-event-type-contract.test.ts:12-:36 asserts `.options` with ONE `toStrictEqual` on the whole ordered array, and :39 drives its per-member parse table from `orchestrationEventTypeContract.options` rather than a hand-written array — so a 23rd member reddens the membership test and is covered by the parse table with no edit.
  - `healthStatusPayloadContract` is a `z.object` with exactly the keys `status`, `uptimeSeconds` and `version`, none optional. Check: open health-status-payload-contract.ts:15-:19; there is no `.optional()`, no `.partial()` and no fourth key.
  - A payload missing `uptimeSeconds` FAILS the parse, and a well-formed one succeeds. Check: health-status-payload-contract.test.ts:6-:13 parses the stub and asserts the whole object with `toStrictEqual`; :52-:59 parses `{status: 'ok', version: '1.0.0'}` and asserts it throws `/Required/u`.
  - Each of the three properties rejects what its spec text forbids. Check: :42-:50 asserts a third `status` literal throws `/Invalid enum value/u`; :61-:69 and :71-:79 assert a fractional and a negative `uptimeSeconds` throw; :81-:89 asserts an empty `version` throws; and :28-:38 asserts `uptimeSeconds: 0` PARSES, which is the value the seed response and the first heartbeat carry in the server's opening second.
  - Both `healthStatusPayloadContract` and `HealthStatusPayloadStub` are importable from another package as `@dungeonmaster/shared/contracts`. Check: packages/shared/contracts.ts:756-:758 carries the `// Health Contracts` comment and both `export *` lines, matching the paired form every sibling entry uses; packages/shared/package.json:6 maps the `./contracts` subpath.
  - This round adds NO product code and NO test, and the only path it writes is its own round document. Check: `git diff --stat` for this round's commit names `.quest-plans/78da2360-f09a-4ef0-aed0-ba1efcf774b1-round-2.md` and nothing else. Every unit in the piece is accounted for in NO CHUNK as `settled`, so the round's full unit list is empty of uncovered entries.
  - Nothing this piece owes the server and web sessions is missing, and nothing belonging to them has been built here. Check: `discover({grep: "healthStatusPayloadContract|HealthStatusPayloadStub"})` returns hits ONLY inside packages/shared/src/contracts/health-status-payload/, and `web-socket-channel-state.ts:137-:188` still has no `'health-status'` routing arm.

NO CHUNK:
  - settled check-event-type-member at c115205 → packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts:40, the last literal of the `z.enum([...])` opened at :15 — read there: `'health-status',` sits immediately after `'dispatch-state-changed'` (:39) and immediately before the closing `]);` (:41). "The prior 21 unchanged" is proved mechanically rather than by eye: parsing the enum array out of `git show master:` and out of the working file gives 21 members against 22, `new[:21] == old` is True, and the single appended member is `'health-status'`. The three-line quest-load-failed comment survives at :25-:27. Its guard is orchestration-event-type-contract.test.ts:12-:36, one `toStrictEqual` pinning membership, count and order together.
  - settled OrchestrationEventType.healthStatus at c115205 → the same literal at orchestration-event-type-contract.ts:40, which is what widens `export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>` at :43 — read there: the inferred union is the enum's own member list, so declaring the literal IS declaring the type member; there is no second edit a type widening would need. The spec's property KEY is `healthStatus` (the quest's camelCase naming for the requirement); the value on the wire is the kebab-case `'health-status'`, matching every sibling member.
  - settled check-payload-parses at c115205 → packages/shared/src/contracts/health-status-payload/health-status-payload-contract.ts:15-:19, a `z.object` with exactly three keys and no `.optional()`, `.partial()` or fourth key — read there: because all three are required, a body missing `uptimeSeconds` cannot parse. Both halves are pinned in the colocated test: :6-:13 parses `HealthStatusPayloadStub()` and asserts the whole object with `toStrictEqual`, and :52-:59 parses `{status: 'ok', version: '1.0.0'}` and asserts it throws `/Required/u`.
  - settled HealthStatusPayload.status at c115205 → health-status-payload-contract.ts:16, `status: z.enum(['ok', 'degraded'])` — read there: two literals, UNBRANDED, so it carries no brand tag at all and in particular not `'HealthStatus'`. That tag is declared exactly once repo-wide, at packages/server/src/contracts/health-response/health-response-contract.ts:12, on `z.string().min(1)` — an incompatible base type that `shared` could not import anyway. Guarded at test :42-:50, where a third literal throws `/Invalid enum value/u`.
  - settled HealthStatusPayload.uptimeSeconds at c115205 → health-status-payload-contract.ts:17, `uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>()` — read there: `.int()` makes it whole seconds and `.nonnegative()` admits 0. Guarded at test :61-:69 (fractional throws), :71-:79 (negative throws) and :28-:38, which asserts `uptimeSeconds: 0` PARSES — the value the seed response and the first heartbeat carry in the server's opening second, and the case that would silently disappear if `.nonnegative()` ever drifted to `.positive()`.
  - settled HealthStatusPayload.version at c115205 → health-status-payload-contract.ts:18, `version: z.string().min(1).brand<'ServerVersion'>()` — read there: non-empty, and branded `'ServerVersion'` rather than `'PackageVersion'`, which is the testing package's tag. A repo-wide walk finds `brand<'ServerVersion'>` in this one file only, so the tag is free and nothing is silently interchangeable with it. Guarded at test :81-:89, where an empty string throws.

PHASES: none

WAVES: none

## Round log
