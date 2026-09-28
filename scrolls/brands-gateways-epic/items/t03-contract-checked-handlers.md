# T03: MSW handlers are checked against the server's contracts

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T8's "Handlers are checked against the server's contracts" (lines 1949-1950), the "Contract-checked handlers" catalog row (line 1964) |
| Needs | T01 |
| Unblocks | T09 |
| Packages touched | `testing` (the builder function), every package that serves an HTTP endpoint (ships handlers beside its endpoints) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for `testing`'s builder function, then one agent per server package that ships endpoints |
| Runs alone | no |

## Why

A staged MSW response has to be checked against the real contract the server would send, or a test can
stage a response the real server could never produce — the client-side mirror of T6 (no mocking another
workspace package's exports) applied to HTTP. Without this check, a client test can stage a shape that
silently drifts from what the endpoint actually returns, and nothing catches the drift until a real
integration breaks.

## Current state

Not yet built. Searched `packages/testing/src` for an existing handler-builder function and found none
under this name; `start-endpoint-mock-setup.ts` and `endpoint-mock-setup-responder.ts` set up the MSW
server lifecycle only (T01), with no handler-construction helper. No package's `src` was found to ship
handlers beside its endpoint definitions yet. Mark this "not yet built" rather than "not checked" — the
absence was confirmed by a directory walk of `packages/testing/src`, not inferred.

## Work

1. **Write the builder in `@dungeonmaster/testing`**: a function that takes an endpoint's contract (the
   response schema the server's responder validates against, or is expected to conform to) and returns an
   MSW handler. The handler parses each staged response through that contract before returning it, so a
   test staging a response the contract would reject fails at staging time, not silently.

2. **The package that serves each endpoint ships its own handlers beside its endpoint definitions** — not
   in `testing`, and not in the client package that consumes them. `testing` ships only the mechanism (the
   builder function); each serving package calls it once per endpoint it owns and exports the resulting
   handler from a file beside that endpoint's responder or route definition. A client test imports the
   handler from the serving package's own file, following T6's rule that a workspace package's own
   behaviour is reused through what it ships, never re-staged by hand in the consumer.

3. **In any repo, the package that serves each endpoint does this** — this is not specific to `server`;
   whichever package owns an HTTP endpoint (this repo's `server`, and `mcp` for its own HTTP surface if it
   has one — confirm which packages serve endpoints before assuming it is only `server`) ships that
   endpoint's handler.

4. **Wire client tests onto these handlers** as they are written, replacing any hand-rolled
   `server.use(...)` staging that invents its own response shape inline.

## Lint rules this item adds or changes

None described in the source doc for this specific piece. If the executing agent finds staged handlers
that bypass the builder (a raw `http.post(...)` MSW handler built inline instead of through the
contract-checked builder), note it under LEFT STANDING rather than adding a new rule — no rule for this
is named in the source.

## Teaching text this item changes

None directly in this item; the catalog row ("Contract-checked handlers" in the "What dungeonmaster ships
for tests" table) is picked up by T09 once this item's builder exists and has a real name and import
path to record.

## Done when

- `@dungeonmaster/testing` exports a function that builds an MSW handler from an endpoint's contract and
  parses each staged response through it.
- At least one real endpoint in the package that serves it has a handler built this way, beside that
  endpoint's own file.
- A test staging a response that does not match the contract fails at staging, with a message naming
  what did not match.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not put the handler-builder's output in `testing` itself — only the builder function lives there.
  Handlers live beside the endpoints they mock, in the serving package, per T6's reasoning: a consumer's
  copy of another package's behaviour drifts from it.
- This item depends on T01 only for MSW being loaded broadly; it does not depend on T02's trap extension.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Checked against code on 2026-09-27:

- The item's "not yet built" claim holds, but it undersells what's already there: `EndpointMockListenResponder`
  (`packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts`) is a general
  `{method,url} => EndpointControl` builder already threaded through `EndpointMockFlow.listen` and
  `StartEndpointMock.listen`. The right move per "Extension Over Creation" is to add an optional `contract`
  param to this EXISTING function, not write a new one — Work step 1's "write the builder" is really "extend it."
- Trap: `endpoint-mock-flow.ts:15-16` destructures only `{ method, url }` out of `ResponderParams` and drops
  everything else before calling the responder — `EndpointMockFlow.listen: ({ method, url }: ResponderParams) =>
  EndpointMockListenResponder({ method, url })`. Adding `contract` to the responder's param type is not enough;
  this flow file silently swallows it unless also edited. `start-endpoint-mock.ts` needs no edit (`StartEndpointMock
  = EndpointMockFlow` is a bare alias).
- Work step 3's "confirm which packages serve endpoints" is answered: only `server` does. `mcp`'s flows
  (`ArchitectureFlow`, `QuestFlow`, `InteractionFlow`, `McpServerFlow` — `get-project-map({packages:['mcp']})`)
  are MCP stdio tool handlers, not Hono/fetch routes; nothing in `packages/mcp/src` registers an HTTP endpoint.
  So "one agent per server package that ships endpoints" is one agent, on `server`.
- `responders/` and `flows/` folder configs do not list `@dungeonmaster/testing` in `allowedImports`
  (`packages/shared/src/statics/folder-config/folder-config-statics.ts:291-303,124-137`) — confirmed no
  `packages/*/src/responders/**` file imports `from 'zod'` or testing infra directly. A production-shaped
  responder/flow file cannot host the handler; it has to live in a file already exempt from that boundary.
  `.proxy.ts` files already are (every proxy imports `@dungeonmaster/testing/register-mock`), so the handler is
  added as a new method on the endpoint's EXISTING `.proxy.ts`, not a new file.
- Picked `QuestCommentBatchResponder` over `GuildListResponder`/health as the "one real endpoint": its 200 body
  is already parsed through a dedicated contract at `quest-comment-batch-responder.ts:111`
  (`data: commentBatchResponseContract.parse({...})`) — the literal "schema the responder validates against."
  `GuildListResponder` has no per-endpoint response contract (`data: guilds` is raw `Guild[]`), and health's
  route is inlined in `health-flow.ts` with no `.proxy.ts` at all (flows never get one), so it has nowhere
  import-legal to host the handler.

### Files

| Batch | Files | Does | Needs | Runs beside |
|---|---|---|---|---|
| T03-1 | `packages/testing/src/contracts/endpoint-control/endpoint-control-contract.ts` (edit: add `EndpointResponseContract = { parse: (value: unknown) => unknown }`, structurally satisfied by any zod schema's `.parse`); `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts` (edit: optional `contract?: EndpointResponseContract` param; `.resolves({data})` runs `contract ? contract.parse(data) : data` before responding); `packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.test.ts` (edit: add a valid-contract case and an invalid-contract case asserting `.resolves()` itself throws, with the zod message) | Builds the contract-check mechanism | T01 (done) | G22, G24-remainder — disjoint from `packages/testing/src/adapters/jest/**` |
| T03-2 | `packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.ts` (edit: destructure and forward `contract` too); `packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.integration.test.ts` (edit: add one wiring case with a contract) | Stops the flow from dropping `contract` before it reaches the responder | T03-1 | G22, G24-remainder — disjoint |
| T03-3 | `packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.proxy.ts` (edit: add a `mockHttpEndpoint` method returning `StartEndpointMock.listen({method:'post', url: apiRoutesStatics.quests.<comment-batch key>, contract: commentBatchResponseContract})`, imported beside the responder); `packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.test.ts` (edit: add a case proving a mismatched staged response fails at staging with a message naming the mismatch — the item's literal Done-when proof) | Ships the one real, contract-checked handler beside its endpoint | T03-1, T03-2 | any item not touching `server`'s `quest/comment-batch` folder |
| T03-4 | `scripts/consumer-check/lib/sample-sources.mjs` (edit: add a fixture mirroring the existing `MSW_TRAP_PROOF_*` constants, staging a contract-mismatched response through `StartEndpointMock.listen` and asserting the throw, inside an installed consumer); `scripts/consumer-check/lib/assertions/works.mjs` (edit only if the new fixture's pass/fail needs a new assertion helper — read this file first, it may already generalize) | Proves the new `@dungeonmaster/testing` public surface works from a real install, not just source resolution — required because this item changes what `@dungeonmaster/testing` publishes (EPIC rule 13) | T03-1, T03-2, T03-3 | nothing — `scripts/consumer-check` is outside every package and outside ward |

### Verification

| Batch | Ward | Extra |
|---|---|---|
| T03-1 | `npm run ward -- --only lint,typecheck,unit -- packages/testing/src/contracts/endpoint-control/endpoint-control-contract.ts packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.ts packages/testing/src/responders/endpoint-mock/listen/endpoint-mock-listen-responder.test.ts` | — |
| T03-2 | `npm run ward -- --only lint,typecheck,unit,integration -- packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.ts packages/testing/src/flows/endpoint-mock/endpoint-mock-flow.integration.test.ts` | After T03-1+T03-2 both land: run `testing`'s and `web`'s WHOLE unit suites (`npm run ward -- --only unit -- packages/testing` / `packages/web`) — dozens of `web`'s broker `.proxy.ts` files compose `StartEndpointMock.listen`, and MSW is wired only in `web` and `testing` (source doc line 1943-1944), so no other package's suite is at risk |
| T03-3 | `npm run ward -- --only lint,typecheck,unit -- packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.proxy.ts packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.test.ts` | No other `server` file composes this proxy today (it's a leaf), so no wider server run needed |
| T03-4 | None — `scripts/consumer-check` runs outside ward by design | Operator only: `npm run build:clean` then `npm run check:consumer` (never the implementing agent — agents never build, per `agent-brief.md`) |

### Build / consumer

No batch needs a build for ward (all four read source). T03-1/T03-2 change `@dungeonmaster/testing`'s public API
(additive: `contract` is optional, so every existing `.listen({method,url})` call keeps working unchanged) —
this is "changes what a package publishes" under EPIC rule 13, which is why T03-4 exists. G27 (the rule-13
mechanism) is done, so this is live now, not deferred.

### Open questions

1. `.responds()`/`.respondRaw()` are left un-checked (only `.resolves()` parses through `contract`) because their
   bodies are explicit non-default-status error shapes that legitimately differ from the success contract.
   Confirm this is the intended scope before T03-1 lands — checking them too would need a second, differently-shaped
   contract per endpoint (error body vs. success body), which the item doesn't describe.
2. T03-3 does not wire any `web` broker test onto the new handler (e.g. `quest-comment-batch-broker.proxy.ts`'s
   existing hand-rolled `StartEndpointMock` staging) because `server` has no `package.json` `exports` map and
   `web` does not depend on `@dungeonmaster/server` — cross-package proxy imports for non-gateway workspace
   packages are B03's job, not landed yet. Confirm this item should stay scoped to "the handler exists and proves
   itself inside `server`," leaving actual client rewiring to land incrementally per Work step 4 / T09, rather than
   pulling B03-shaped work into T03 now.
