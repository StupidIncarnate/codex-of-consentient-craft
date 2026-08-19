# Round 1 — [codeweaver] Codeweaver: build this slice — shared: foundation

SUMMARY: This round makes the two `@dungeonmaster/shared` contracts every other slice of this quest
imports exist on disk: the `health-updated` member on `orchestrationEventTypeContract` (without which
the WS frame cannot even be constructed, because `wsMessageContract.type` validates against that enum),
and the new `healthSnapshotContract` + stub + barrel export that the server responder produces and the
web binding parses. Both follow the rate-limits feature's shape exactly — `rateLimitsSnapshotContract`
is the direct mirror for the snapshot, and `rate-limits-updated` is the direct mirror for the enum
member — so no spike was needed; every pattern here already has a working sibling in this package.

Design choices settled while reading the tree, so no worker has to re-derive them:

1. **`status` is `z.literal('ok').brand<'HealthStatus'>()`, not the legacy `z.string().min(1)`.** The
   quest's property description leads with "Literal health marker. Always the string 'ok' on a 200 —
   the endpoint signals unhealthiness with a 500, not with a different status value." Its trailing
   "carried over unchanged from the existing healthResponseContract" refers to the field's *meaning*,
   not to that contract's looser zod chain; the server's `healthResponseContract`
   (`packages/server/src/contracts/health-response/health-response-contract.ts`) would accept
   `status: 'degraded'`, which the design decision explicitly rules out.
2. **The object is NOT `.strict()`.** `rateLimitsSnapshotContract` — the sibling this mirrors — is a
   plain `z.object`, so unknown keys are stripped rather than rejected. That matters at runtime: the
   web parses the 200 body with this contract, and under `.strict()` any future extra key the server
   adds would fail the parse and flip the badge to OFFLINE. The "keys are exactly the 7" observable
   (`#check-health-body-keys`) is an assertion about what the *server* emits, verified over HTTP by
   the server slice, not something the parser has to police.
3. **`version` is `z.string().min(1).brand<'PackageVersion'>()`, with no semver regex.** The repo's
   only existing `PackageVersion` brand (`packages/testing/src/contracts/package-json/`) is a bare
   branded string; a semver pattern here would reject a legitimate prerelease and buy nothing, since
   the value's only source is `packages/server/package.json`.
4. **`orchestration-event-type-contract.test.ts`'s hardcoded `it.each` list is replaced by a
   derivation from `orchestrationEventTypeContract.options`.** The repo's testing rules forbid a
   hardcoded list of enum members ("A hardcoded `it.each` array silently goes stale the moment someone
   adds a new member"). That file is the live proof: its list is *already* stale — `quest-paused` and
   `quest-resumed` are in the enum and absent from the list. Deriving fixes that and makes the file
   correct for every future member, and a separately-named `it` still pins `health-updated` by name so
   the new member is visible in the test output.
5. **Stub defaults are pinned to the flow's canonical example** (`uptimeSeconds: 745`, `version:
   '0.1.0'` → the badge's `[ ONLINE · 12m · v0.1.0 ]`), so the server and web slices downstream can
   assert against known numbers instead of inventing their own.

## chunk 1 — append `health-updated` to the orchestration event type enum

INTENT: `orchestrationEventTypeContract.parse('health-updated')` succeeds, so a
`wsMessageContract`-shaped frame with `type: 'health-updated'` can be built and validated; and the
colocated test derives its member list from the enum itself instead of a hand-maintained copy.

FILES:
  - ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
  - ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.test.ts

UNITS:
  - #health-updated-event

MIRROR: ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts
  (the existing `'rate-limits-updated'` member, appended the same way)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.ts ./packages/shared/src/contracts/orchestration-event-type/orchestration-event-type-contract.test.ts

NOTES:
  **The flow, and where this sits in it.** Flow `#server-health-badge` — "Server Health Badge in App
  Header". The user loads any page other than `/health` and sees a live badge in the header; the
  server pushes a tick every 5000ms and the badge refetches so the uptime visibly advances. This
  chunk implements the wire-level prerequisite for node `#ws-health-tick` ("Server broadcasts
  health-updated every 5000ms; web channel routes it") and for `#page-ws-tick` in flow
  `#health-detail-page`.

  **Contract this chunk owns**, from the quest, verbatim — `#health-updated-event` /
  `HealthUpdatedEvent` (event, modified):
  - `type: OrchestrationEventType = "health-updated"` — "New member appended to the
    orchestrationEventTypeContract enum. That enum is the single enumeration point for event types and
    is what wsMessageContract.type validates against, so the frame cannot go over the wire until this
    member exists."
  - `payload: WsMessagePayload` — "Empty object. The tick is a notification, not a data push — the web
    discards it and refetches over HTTP, exactly as the rate-limits-updated arm in
    webSocketChannelState.dispatchInbound does."
  - `timestamp: IsoTimestamp` — "ISO 8601 datetime string stamped when the frame is built, required by
    wsMessageContract."

  Only the `type` half is this chunk's work. `payload` and `timestamp` need **no new code at all** —
  `wsMessageContract` (`./packages/shared/src/contracts/ws-message/ws-message-contract.ts`) already
  declares `payload: z.record(z.string().brand<'PayloadKey'>(), z.unknown())` and
  `timestamp: z.string().datetime().brand<'IsoTimestamp'>()`, and `type: orchestrationEventTypeContract`
  — which is exactly why appending the member is the whole job. Do not add a new envelope contract.

  **Observables this makes achievable** (graded on the server/web slices, quoted so your change is the
  right shape for them):
  - `#check-tick-envelope-shape`: "The broadcast frame is JSON matching wsMessageContract with type
    'health-updated', an empty payload object, and a timestamp that is an ISO 8601 datetime string"
  - `#check-tick-routed-to-subject`: "webSocketChannelState routes an inbound 'health-updated' frame to
    its health-changed Subject, which emits undefined — the frame payload is discarded, not read"

  **The edit.** Append `'health-updated',` as the last member of the `z.enum([...])` array, after
  `'dispatch-state-changed'`. Nothing else in that file changes; do not reorder existing members
  (`server-init-responder` iterates `orchestrationEventTypeContract.options` in declaration order).

  **The stub needs no change.** `OrchestrationEventTypeStub` takes `{ value: string }` and parses it,
  so `OrchestrationEventTypeStub({ value: 'health-updated' })` starts working the moment the member
  lands. Do not touch `orchestration-event-type.stub.ts`.

  **The test edit — this is the part with a decision in it.** Read
  `orchestration-event-type-contract.test.ts` first. Its `it.each([...])` hardcodes 19 member
  literals, and that list is already stale: the enum contains `'quest-paused'` and `'quest-resumed'`
  and the list does not. The repo's testing rules are explicit that a finite member list in `it.each`
  must be derived, not hardcoded, precisely because it "silently goes stale the moment someone adds a
  new member to the union". So:
  - Replace the hardcoded array with `orchestrationEventTypeContract.options` (a `z.enum` exposes
    `.options` as a readonly tuple of its literals — `server-init-responder.ts:539` already consumes it
    that way, so this is an established access pattern in this repo, not a new one).
  - Keep the existing `'VALID: {value: %s} => parses successfully'` name template and the `%s`
    substitution — `enforce-test-name-prefix` validates the substituted name.
  - ADD one separate, explicitly named `it` for the new member so it is visible by name in test
    output, e.g. `it('VALID: {value: "health-updated"} => parses the new health tick event type', ...)`
    asserting `orchestrationEventTypeContract.parse('health-updated')` is `'health-updated'`.
  - Leave the three `INVALID:` tests and the default-stub test exactly as they are.

  **What this change does downstream, so you know it is intentional and not a regression.**
  `packages/server/src/responders/server/init/server-init-responder.ts` loops over
  `orchestrationEventTypeContract.options` and registers a bus relay subscription for every type
  except `quest-modified` and `quest-created`. Adding a member therefore adds one more bus
  subscription. That is harmless and expected here: design decision `#server-broadcasts-tick-directly`
  says "ServerInitResponder already owns the connected-clients Set and already calls
  wsEventRelayBroadcastBroker for global events, so a 5000ms heartbeat can broadcast straight from
  there" — nothing ever emits `health-updated` onto the orchestrator bus, so that subscription never
  fires. Do NOT add a skip for it. Also checked and clear: `devLogEventIconsStatics` is a partial map
  (not a `Record<OrchestrationEventType, …>`), and no exhaustive `Record` or `switch` over this union
  exists anywhere in the repo, so nothing else typechecks differently.

  Present-tense docs only — the file's PURPOSE line stays as-is; do not add a comment about what the
  enum "used to" contain.

## chunk 2 — new `healthSnapshotContract` in shared, with stub, test, and barrel export

INTENT: `import { healthSnapshotContract, HealthSnapshotStub } from '@dungeonmaster/shared/contracts'`
resolves, and `healthSnapshotContract.parse()` accepts the exact 7-field health body the server will
serve while rejecting a body that is missing `uptimeSeconds`.

FILES:
  - ./packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts
  - ./packages/shared/src/contracts/health-snapshot/health-snapshot.stub.ts
  - ./packages/shared/src/contracts/health-snapshot/health-snapshot-contract.test.ts
  - ./packages/shared/contracts.ts

UNITS:
  - #health-snapshot

MIRROR: ./packages/shared/src/contracts/rate-limits-snapshot/rate-limits-snapshot-contract.ts
  (plus its colocated `rate-limits-snapshot.stub.ts` and `rate-limits-snapshot-contract.test.ts` —
  follow all three files' shape, including the test's `describe('valid snapshots')` /
  `describe('invalid snapshots')` split)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts ./packages/shared/src/contracts/health-snapshot/health-snapshot.stub.ts ./packages/shared/src/contracts/health-snapshot/health-snapshot-contract.test.ts ./packages/shared/contracts.ts

NOTES:
  **The flow, and where this sits in it.** Both flows converge on one node. `#server-health-badge` →
  `#health-endpoint-serves-snapshot` ("GET /api/health assembles and returns health snapshot"), and
  `#health-detail-page` → `#page-endpoint-serves-snapshot` (same endpoint, same body). The user either
  sees a compact `[ ONLINE · 12m · v0.1.0 ]` badge in the header or, on `/health`, a 7-row labelled
  table. This contract is the single type both the server (producing) and the web (parsing) hold, and
  it is the reason neither can drift from the other.

  **Why it lives in shared.** Design decision `#snapshot-contract-in-shared`, quoted: "Both the server
  (producing the body) and the web (parsing the response) need the same type. The rate-limits feature
  already solves this exactly this way: rateLimitsSnapshotContract lives in packages/shared/src/contracts
  and both sides import it. Leaving the type in the server package would force the web package to import
  from @dungeonmaster/server, which no web file does today. The server's existing healthResponseContract
  is the narrower legacy shape and is superseded by this one."
  **Do NOT delete or edit `packages/server/src/contracts/health-response/health-response-contract.ts`
  in this chunk.** It is still imported by `parseHealthResponseTransformer`; retiring it is the server
  slice's call, not this one's.

  **The contract, field by field — every property description below is a requirement from the quest.**
  Build it as a plain `z.object` (NOT `.strict()`; see SUMMARY point 2), in this key order:

  | field | zod chain | quest property description |
  |---|---|---|
  | `status` | `z.literal('ok').brand<'HealthStatus'>()` | "Literal health marker. Always the string 'ok' on a 200 — the endpoint signals unhealthiness with a 500, not with a different status value." |
  | `timestamp` | `z.string().datetime().brand<'IsoTimestamp'>()` | "ISO 8601 datetime string of the moment the snapshot was assembled." |
  | `uptimeSeconds` | `z.number().int().nonnegative().brand<'UptimeSeconds'>()` | "Non-negative integer seconds the server process has been running, Math.floor of process.uptime()." |
  | `version` | `z.string().min(1).brand<'PackageVersion'>()` | "The version string from packages/server/package.json." |
  | `port` | `networkPortContract` | "The resolved server port from portResolveBroker() in @dungeonmaster/shared/brokers." |
  | `home` | `filePathContract` | "The resolved dungeonmaster home directory from dungeonmasterHomeFindBroker().homePath." |
  | `orchestrationMode` | `orchestrationModeContract` | "Either 'claude' or 'node', from StartOrchestrator.getOrchestrationMode()." |

  Use `.nonnegative()` rather than `.min(0)` so there is no bare `0` literal to justify against the
  no-magic-numbers rule, and do NOT create a statics file for it — the sibling
  `network-port-contract.ts` keeps its own `MIN_PORT`/`MAX_PORT` as module-level consts, so a
  one-bound contract needs nothing.

  **The three imports you reuse are real, verified on disk — do not re-declare their shapes inline:**
  - `import { networkPortContract } from '../network-port/network-port-contract';` — exports
    `networkPortContract` (`z.number().int().min(1).max(65_535).brand<'NetworkPort'>()`) and type
    `NetworkPort`.
  - `import { filePathContract } from '../file-path/file-path-contract';` — exports `filePathContract`
    (`z.union([absoluteFilePathContract, relativeFilePathContract]).brand<'FilePath'>()`) and type
    `FilePath`. This is the exact brand `dungeonmasterHomeFindBroker(): { homePath: FilePath }` returns,
    so the server slice can pass `homePath` straight through with no re-brand.
  - `import { orchestrationModeContract } from '../orchestration-mode/orchestration-mode-contract';` —
    exports `orchestrationModeContract` (`z.enum(['claude', 'node'])`, unbranded) and type
    `OrchestrationMode`.

  `timestamp` inlines its own `z.string().datetime().brand<'IsoTimestamp'>()` rather than importing an
  iso-timestamp contract. That is deliberate and is what the mirror does — `rateLimitsSnapshotContract`
  inlines exactly this chain for `updatedAt`. The only `isoTimestampContract` in the repo lives in
  `@dungeonmaster/orchestrator`, and shared must not reach into it for this.

  Export `export type HealthSnapshot = z.infer<typeof healthSnapshotContract>;` below the schema.

  **The stub** — `./packages/shared/src/contracts/health-snapshot/health-snapshot.stub.ts`, exactly the
  shape of `rate-limits-snapshot.stub.ts`: `StubArgument<HealthSnapshot>` object-spread form, defaults
  then `...props`, all of it through `healthSnapshotContract.parse()`. Use these EXACT defaults — the
  server and web slices will assert against them, so they must not drift:
  - `status: 'ok'`
  - `timestamp: '2026-05-05T13:00:00.000Z'` (same literal the rate-limits stub uses)
  - `uptimeSeconds: 745`
  - `version: '0.1.0'`
  - `port: 3737`
  - `home: '/home/user/.dungeonmaster'`
  - `orchestrationMode: 'claude'`
  `745` and `'0.1.0'` are not arbitrary: observable `#check-badge-online-text` reads "With
  uptimeSeconds 745 and version '0.1.0', SERVER_HEALTH_BADGE renders the exact text
  '[ ONLINE · 12m · v0.1.0 ]'", and `3737` is `environmentStatics.defaultPort`, the bottom rung of
  `portResolveBroker`'s ladder.

  **The test** — `health-snapshot-contract.test.ts`, mirroring
  `rate-limits-snapshot-contract.test.ts` (which imports BOTH its colocated contract and its stub; do
  the same). Cover every branch, using `toStrictEqual` for the whole object and no weak matchers, no
  hooks, no conditionals:
  - VALID: full stub => parses to the exact 7-key object (spell all 7 values out in one
    `toStrictEqual`) — this is the assertion that pins the key set.
  - EDGE: `uptimeSeconds: 0` => parses (the zero boundary the badge renders as `'0s'`).
  - EDGE: an input object carrying one extra unknown key => result `toStrictEqual`s the 7-key object
    with the extra key absent. **This test is what pins SUMMARY decision 2** (non-strict, keys
    stripped rather than rejected); without it a later session could add `.strict()` and break the web
    badge with a green suite.
  - INVALID: `status: 'degraded'` => throws (expect `invalid_literal`).
  - INVALID: `uptimeSeconds: -1` => throws (`too_small`).
  - INVALID: `uptimeSeconds: 3.5` => throws (`Expected integer`).
  - INVALID: `timestamp: 'not-a-timestamp'` => throws (`Invalid datetime`).
  - INVALID: `version: ''` => throws (`too_small`).
  - INVALID: `port: 0` => throws (`too_small`).
  - INVALID: `home: 'relative/path'` => throws. `filePathContract`'s relative branch requires a `./` or
    `../` prefix, so a bare `relative/path` is rejected by both branches; the absolute branch's
    `.refine` message is `Path must be absolute (start with / or C:\ on Windows)`.
  - INVALID: `orchestrationMode: 'hybrid'` => throws (`Invalid enum value`).
  - INVALID: body omitting `uptimeSeconds` => throws (`Required`). **Quote this observable in the test
    name's spirit** — `#check-invalid-body-takes-offline-branch` reads: "A 200 response whose body
    omits uptimeSeconds fails healthSnapshotContract parsing and the badge takes the offline branch
    rather than rendering a partial snapshot." This test is the contract half of that observable.
  - INVALID: `{}` => throws (`Required`).

  **Do not guess the thrown-error regexes.** Zod's `ZodError.message` is the JSON-serialised issue
  array, so `toThrow(/too_small/u)` matches on the issue `code` (that is how
  `rate-limits-snapshot-contract.test.ts:69` asserts `/too_big/u`). Write the test, RUN it via the
  WARD command above, read the real failure output, and assert on what actually came back — the
  expectations above are the intent, the runner is the authority.

  **The barrel** — `./packages/shared/contracts.ts`. Add a new section immediately after the
  `// Rate Limit Contracts` block (which currently ends with the two
  `rate-limits-history-line` lines, around line 731) and before `// Work Item Floor Ordering Contracts`:

  ```
  // Health Contracts
  export * from './src/contracts/health-snapshot/health-snapshot-contract';
  export * from './src/contracts/health-snapshot/health-snapshot.stub';
  ```

  Both lines are required — every contract in this barrel exports its stub alongside it, and the
  server and web slices need `HealthSnapshotStub` from `@dungeonmaster/shared/contracts`. The barrel
  lives at the package root (outside `src/`), so it is exempt from colocation and takes no test.

  **Build before ward.** `@dungeonmaster/shared` is consumed by every other package through `dist/`,
  so run `npm run build` as its own unpiped command and confirm it exits 0 before the WARD line above.
  Typecheck resolves the barrel source directly under node10 resolution, but the later server and web
  slices run against `dist/` — leave it stale and they hit phantom "property does not exist" errors on
  correct code.

  Write the file's `PURPOSE` line LAST, after the schema exists. It must say why this contract exists
  and when to reach for it rather than the server's legacy `healthResponseContract` — NOT what it
  validates, which the zod chain already states.
