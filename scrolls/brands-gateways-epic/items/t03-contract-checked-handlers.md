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
