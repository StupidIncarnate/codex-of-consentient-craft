# Round 1 — [codeweaver] Codeweaver: build this slice — server: foundation

SUMMARY: This round turns `GET /api/health` from an inline two-key `c.json` literal into a real
endpoint that assembles and returns the 7-field `HealthSnapshot` the shared slice already shipped, with
a genuine 500 branch when assembly throws — plus the server-side `healthHeartbeatStatics.intervalMs`
constant the next slice's WS heartbeat consumes. The chain is built bottom-up in the repo's standard
layering: a narrow contract for the one field read out of the server's own `package.json`, two new
adapters (`process.uptime()`, the version read), one orchestration broker that assembles the snapshot,
one responder that owns the 200/500 split, then the flow wiring. Two clean-up chunks close the change:
the legacy `healthResponseContract` + `parseHealthResponseTransformer` pair, which the quest calls
"superseded" and which is orphaned the moment the flow's integration test stops importing it, and the
one-line widening of `packages/web/src/flows/app/smoke.e2e.ts` that design decision
`#smoke-e2e-assertion-widened` explicitly assigns to whichever session builds the endpoint.

Design choices settled while reading the tree, so no worker re-derives them:

1. **A broker assembles the snapshot; the responder only picks the status code.** Four independent
   sources (uptime, version, port, home) plus the orchestration-mode adapter is orchestration, and
   `responders/` forbids business logic. `HealthCheckResponder` therefore mirrors
   `OrchestrationModeGetResponder` exactly: `try { broker } catch { 500 }`.
2. **The version is read at runtime from the resolved `@dungeonmaster/server/package.json`, not
   hardcoded into a statics file.** `require.resolve('@dungeonmaster/server/package.json')` resolves to
   `<repo>/packages/server/package.json` — verified from a node REPL in this worktree — and the sibling
   `webBundleDistPathAdapter` already uses exactly this `require.resolve` form and its unit test
   exercises it for real under jest. A statics copy of `'0.1.0'` would silently drift on the next
   version bump, which is the one thing this field must not do.
3. **`UptimeSeconds` / `PackageVersion` are re-used off `healthSnapshotContract.shape.*`, never
   re-declared.** `healthSnapshotContract` exports no standalone field contracts, and declaring a second
   `z.string().brand<'PackageVersion'>()` would be a second source of truth for one brand. The
   `.shape.<field>` reuse form is established across this repo (`packageGraphEntryContract` does
   `changeType: questPackageEntryContract.shape.changeType`; ward, hooks and orchestrator all use
   `.shape.X.parse(...)`).
4. **The `500` branch is provable end-to-end with no mocking.** `DUNGEONMASTER_HOME='relative/path'`
   makes `dungeonmasterHomeFindBroker()` run `filePathContract.parse('relative/path')`, whose relative
   branch requires a `./` or `../` prefix, so it throws for real — an env-driven assembly failure the
   flow integration test can drive with two lines and no proxy.
5. **`port` and `orchestrationMode` are deterministic in this repo's test runs.** The worktree root
   `.dungeonmaster.json` declares `"orchestrationMode": "node"` and `"dungeonmaster": {"port": 4800}`,
   and `portResolveBroker` / `OrchestrationDispatchFlow.getMode()` both walk up to it from cwd. The flow
   integration test additionally pins `DUNGEONMASTER_PORT` inline so the assertion cannot be flipped by
   an ambient env var.
6. **The 5000ms heartbeat timer is NOT this round's work.** Only the constant is. See chunk 1's NOTES.

## chunk 1 — `healthHeartbeatStatics`, the server-side heartbeat interval constant

INTENT: `healthHeartbeatStatics.intervalMs` exists and is `5000`, so the next slice's
`ServerInitResponder` heartbeat has a single named source for its cadence instead of an inline literal.

FILES:
  - ./packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts
  - ./packages/server/src/statics/health-heartbeat/health-heartbeat-statics.test.ts

UNITS:
  - #health-heartbeat-statics

MIRROR: ./packages/server/src/statics/http-status/http-status-statics.ts (and its colocated
  `http-status-statics.test.ts`, which asserts the whole exported object in one `toStrictEqual`)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts ./packages/server/src/statics/health-heartbeat/health-heartbeat-statics.test.ts

NOTES:
  **The flow, and where this sits in it.** Flow `#server-health-badge` — "Server Health Badge in App
  Header". The user is on any page other than `/health` and sees a live `[ ONLINE · 12m · v0.1.0 ]`
  badge; the server pushes a tick every 5000ms and the badge refetches, so the uptime visibly advances.
  This chunk implements the constant half of node `#ws-health-tick` ("Server broadcasts health-updated
  every 5000ms; web channel routes it").

  **The contract this chunk owns**, from the quest, verbatim — `#health-heartbeat-statics` /
  `HealthHeartbeatStatics` (data, new), source
  `packages/server/src/statics/health-heartbeat/health-heartbeat-statics.ts`:
  - `intervalMs: MillisecondDuration = "5000"` — "How often ServerInitResponder broadcasts the
    health-updated frame. This is a server-side timer constant and is NOT serialized onto the WS frame —
    the frame carries only type, an empty payload and a timestamp. Split out of HealthUpdatedEvent so no
    implementer mistakes it for part of the wire shape."

  **The design decision that fixes the number**, quoted — `#heartbeat-interval-5000ms`: "Matches the
  cadence of the existing rate-limits watcher poll, so the two live surfaces in the header update on a
  comparable rhythm and a stalled badge is visually obvious within a few seconds. Fast enough that
  uptimeSeconds visibly advances during a manual walk-through, slow enough that the refetch-per-tick
  cost stays trivial."

  **The file.** `statics/` forbids primitives at the root (`@dungeonmaster/enforce-grouped-statics`), so
  nest it:

  ```ts
  export const healthHeartbeatStatics = {
    broadcast: {
      intervalMs: 5000,
    },
  } as const;
  ```

  `as const` is mandatory. One export per file. No conditionals, no logic. Write the `PURPOSE` line LAST
  and make it say *why this constant exists and who reads it* (the ServerInitResponder heartbeat) — NOT
  "defines the heartbeat interval", which only restates the file's own name.

  **What is deliberately NOT in this chunk, and who owns it.** The `setInterval` that actually
  broadcasts the frame belongs to the NEXT operation item, `[codeweaver] Codeweaver: build this slice —
  server: server-health-badge`, because its observables (`#check-tick-broadcast-cadence`,
  `#check-tick-envelope-shape`) hang off flow `#server-health-badge`. Read off disk so you know exactly
  what you are leaving them: `packages/server/src/responders/server/init/server-init-responder.ts`
  already imports `wsEventRelayBroadcastBroker` (line 36) and already runs a `setInterval` for its
  chat-output flush (line 771); `wsEventRelayBroadcastBroker({ clients, message })` takes
  `clients: Set<WsClient>` and `message: WsMessage` and returns the dead-client set. Do NOT add the
  timer here — this chunk is the constant only.

  **Do not add `health-updated` to `devLogEventIconsStatics`.** Round 1 of the shared slice already
  checked: `devLogEventIconsStatics.icons` is a partial 11-key literal map, not a
  `Record<OrchestrationEventType, …>`, so nothing typechecks differently and nothing is missing.

## chunk 2 — `serverPackageJsonContract`, the one field read out of the server's own manifest

INTENT: `serverPackageJsonContract.parse(JSON.parse(rawPackageJson))` yields a `version` already branded
as the same `PackageVersion` that `healthSnapshotContract.version` requires, so the version adapter in
chunk 3 never re-brands and never hand-rolls a second copy of that brand.

FILES:
  - ./packages/server/src/contracts/server-package-json/server-package-json-contract.ts
  - ./packages/server/src/contracts/server-package-json/server-package-json.stub.ts
  - ./packages/server/src/contracts/server-package-json/server-package-json-contract.test.ts

UNITS:
  - #health-check-endpoint (the `successStatus` property's `HealthSnapshot` body — its `version` field)

MIRROR: ./packages/server/src/contracts/responder-result/responder-result-contract.ts (plus its
  colocated `responder-result.stub.ts` and `responder-result-contract.test.ts` — follow all three files'
  shape)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/contracts/server-package-json/server-package-json-contract.ts ./packages/server/src/contracts/server-package-json/server-package-json.stub.ts ./packages/server/src/contracts/server-package-json/server-package-json-contract.test.ts

NOTES:
  **The flow, and where this sits in it.** Both quest flows converge on one node —
  `#health-endpoint-serves-snapshot` in `#server-health-badge` and `#page-endpoint-serves-snapshot` in
  `#health-detail-page` are the same `GET /api/health`. This chunk is the type that lets the endpoint
  answer one of its seven fields.

  **The observable it serves, verbatim** — `#check-health-version-value`: "version equals the version
  field of packages/server/package.json, which is the string '0.1.0'".

  **The quest's property description for the field**, verbatim, from `#health-snapshot`:
  `version: PackageVersion = "0.1.0"` — "The version string from packages/server/package.json. New
  field. No package-version static, adapter or broker exists anywhere in the monorepo today, so the read
  is new work."

  **The file — this is a deliberately narrow contract, and that is the point.**

  ```ts
  import { z } from 'zod';
  import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';

  export const serverPackageJsonContract = z.object({
    version: healthSnapshotContract.shape.version,
  });

  export type ServerPackageJson = z.infer<typeof serverPackageJsonContract>;
  ```

  Three things about that, none optional:
  - **Reuse `healthSnapshotContract.shape.version`; do NOT write
    `z.string().min(1).brand<'PackageVersion'>()` again.** That chain already lives in
    `packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts` (verified on disk, line
    20). Reusing the schema object is the repo's own pattern —
    `packages/shared/src/contracts/package-graph-entry/package-graph-entry-contract.ts` does
    `changeType: questPackageEntryContract.shape.changeType`. A second declaration would be a second
    source of truth for one brand.
  - **NO `.passthrough()`.** A plain `z.object` strips the ~15 other keys in that manifest, which is
    exactly right: we read one field. `.passthrough()` would also widen `z.infer` with an index
    signature and make `StubArgument<ServerPackageJson>` awkward for no gain. (Note the shared
    `packageJsonContract` is `.passthrough()` and types `name`/`bin`/`dependencies`/`exports` but NOT
    `version` — that is why it cannot be reused here.)
  - **`contracts/` may import `@dungeonmaster/shared/contracts`** — a cross-package import is classified
    by its folder-type subpath, and `contracts/` is in the allowed list.

  **The stub** — `server-package-json.stub.ts`, the object-stub form:

  ```ts
  import type { StubArgument } from '@dungeonmaster/shared/@types';
  import { serverPackageJsonContract } from './server-package-json-contract';
  import type { ServerPackageJson } from './server-package-json-contract';

  export const ServerPackageJsonStub = ({
    ...props
  }: StubArgument<ServerPackageJson> = {}): ServerPackageJson =>
    serverPackageJsonContract.parse({
      version: '0.1.0',
      ...props,
    });
  ```

  `'0.1.0'` is not arbitrary — it is the real value in `packages/server/package.json` (read off disk)
  and the value `#check-health-version-value` names.

  **The test** — `server-package-json-contract.test.ts`. Import BOTH the colocated contract and the
  stub (that is what `responder-result-contract.test.ts` and the shared
  `health-snapshot-contract.test.ts` both do). `toStrictEqual` on objects, no weak matchers, no hooks,
  no conditionals. Cover:
  - `VALID: {version: "0.1.0"} => parses to the one-key object` — assert
    `toStrictEqual({ version: '0.1.0' })`.
  - `VALID: {version: "1.2.3-beta.4"} => parses a prerelease` — there is no semver regex, by design;
    this pins that.
  - `EDGE: {manifest carrying name/description/scripts} => result carries only version` — hand the raw
    parse a realistic multi-key object literal and assert `toStrictEqual({ version: '0.1.0' })`. **This
    is the test that pins the no-`.passthrough()` decision**; without it a later session adds
    `.passthrough()` and nothing goes red.
  - `INVALID: {version: ""} => throws`.
  - `INVALID: {} => throws` (missing `version`).
  - `INVALID: {version: 3} => throws` — use `as never` for the deliberately-wrong type, never
    `as string`.

  **Do not guess the thrown-error regexes.** Zod's `ZodError.message` is the JSON-serialised issue
  array, so a `toThrow(/too_small/u)` matches on the issue `code`. Write the tests, RUN the WARD line
  above, read the real failure output, and assert on what actually came back. The list above is the
  intent; the runner is the authority.

  Write `PURPOSE` LAST. It must say why a manifest contract this narrow exists (the health endpoint
  reads exactly one field out of the server's own `package.json`) — not what it validates.

## chunk 3 — `serverPackageVersionAdapter`, the runtime read of the server's own version

INTENT: `serverPackageVersionAdapter()` returns the `version` string from the resolved
`@dungeonmaster/server/package.json`, branded and ready to drop straight into a `HealthSnapshot`, and
throws with the specifier in the message when the manifest cannot be read or does not carry a version.

FILES:
  - ./packages/server/src/adapters/server-package/version/server-package-version-adapter.ts
  - ./packages/server/src/adapters/server-package/version/server-package-version-adapter.proxy.ts
  - ./packages/server/src/adapters/server-package/version/server-package-version-adapter.test.ts

UNITS:
  - #health-check-endpoint (the `successStatus` property's `HealthSnapshot` body — its `version` field)

MIRROR: ./packages/server/src/adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.ts (plus its
  `.proxy.ts` and `.test.ts` — the same `require.resolve` + sync-`fs` shape, and the same
  domain-named-folder convention `adapters/<domain>/<operation>/`)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/adapters/server-package/version/server-package-version-adapter.ts ./packages/server/src/adapters/server-package/version/server-package-version-adapter.proxy.ts ./packages/server/src/adapters/server-package/version/server-package-version-adapter.test.ts

NOTES:
  **The flow, and where this sits in it.** Node `#health-endpoint-serves-snapshot` — "GET /api/health
  assembles and returns health snapshot", the merge node both quest flows route through. This adapter
  answers the `version` field of that snapshot.

  **The observable it serves, verbatim** — `#check-health-version-value`: "version equals the version
  field of packages/server/package.json, which is the string '0.1.0'".

  **The shape.** `require.resolve('@dungeonmaster/server/package.json')` is verified to resolve to
  `<worktree>/packages/server/package.json` in this repo (npm links every workspace into the root
  `node_modules/@dungeonmaster/`, and `packages/server/package.json` declares no `exports` map, so the
  subpath resolves under node10). `webBundleDistPathAdapter` uses the identical `require.resolve` call
  for `@dungeonmaster/web/package.json` and its unit test lets that call run for real under jest, so
  this is an established pattern here, not a new one.

  ```ts
  import { readFileSync } from 'fs';
  import { serverPackageJsonContract } from '../../../contracts/server-package-json/server-package-json-contract';
  import type { ServerPackageJson } from '../../../contracts/server-package-json/server-package-json-contract';

  const SERVER_PACKAGE_JSON_SPECIFIER = '@dungeonmaster/server/package.json';

  export const serverPackageVersionAdapter = (): ServerPackageJson['version'] => {
    try {
      const raw = readFileSync(require.resolve(SERVER_PACKAGE_JSON_SPECIFIER), 'utf8');
      const parsed: unknown = JSON.parse(raw);
      const { version } = serverPackageJsonContract.parse(parsed);
      return version;
    } catch (error: unknown) {
      throw new Error(`Failed to read ${SERVER_PACKAGE_JSON_SPECIFIER} version: ${String(error)}`);
    }
  };
  ```

  Constraints baked into that, all of them repo rules:
  - **`JSON.parse` output MUST be typed `unknown` and validated through the contract** — never read
    `.version` off a raw parse, and never `Reflect.get` (banned outside `*-guard.ts` / `*-contract.ts`).
  - **Adapters must NOT return `void`** and must return a branded type; `ServerPackageJson['version']`
    is the brand, reached by indexed access so no second contract is imported.
  - **Wrap the external error with domain context and re-throw** — never catch-and-return-null here.
    The throw is load-bearing: it is what gives `GET /api/health` a real 500 path, which the endpoint
    contract's `errorStatus` property requires and which the handler has never had before.
  - `readFileSync` (sync) rather than `fs/promises`, mirroring `webBundleDistPathAdapter`'s `existsSync`
    — one tiny local file, and it keeps the adapter synchronous so the broker composes it without a
    needless await.
  - **Adapters cannot import other adapters.** Do NOT reach for `fsReadFileAdapter`; call `readFileSync`
    directly, exactly as the mirror calls `existsSync` directly.

  **The proxy** — mock the npm boundary (`readFileSync` from `'fs'`) with `registerMock`, never the
  adapter. The resolved path is environment-derived, so address the mock with a PREDICATE, not a
  literal. `packages/server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts` already documents
  this exact case in a comment ("A predicate is also accepted for callers whose real path is
  environment-resolved (e.g. require.resolve'd) rather than test-authored"), so copy that form:

  ```ts
  const handle = registerMock({ fn: readFileSync });
  // returns:  handle.calledWith([(value: unknown) => String(value).endsWith('package.json')]).returns(rawJson)
  // throws:   ...same address... .throws(error)
  ```

  Expose semantic methods only — e.g. `returnsManifest({ version })` (which stringifies a manifest for
  you), `returnsRawManifest({ raw })` (for the malformed-JSON and missing-field cases), and
  `readFails({ error })`. Tests must never touch `registerMock` directly.

  **The test** — fresh proxy per test, created BEFORE the call. Cover every branch:
  - `VALID: {manifest with version "0.1.0"} => returns "0.1.0"`.
  - `VALID: {manifest with version "9.9.9"} => returns "9.9.9"` — proves it reads the file rather than
    returning a constant.
  - `ERROR: {manifest without a version field} => throws naming the specifier` — assert
    `toThrow(/@dungeonmaster\/server\/package\.json/u)`.
  - `ERROR: {manifest is not valid JSON} => throws naming the specifier`.
  - `ERROR: {read fails with ENOENT} => throws naming the specifier`.

  RUN the WARD line and assert on the messages that actually come back; the regexes above are the
  intent, the runner is the authority.

  Write `PURPOSE` LAST and make it say when to reach for this rather than its nearest sibling
  (`webBundleDistPathAdapter`, the other `require.resolve`-based adapter in this package) — not what it
  returns or that it throws.

## chunk 4 — `processUptimeAdapter`, the `process.uptime()` boundary

INTENT: `processUptimeAdapter()` returns `Math.floor(process.uptime())` branded as the
`UptimeSeconds` the snapshot requires, so the fractional seconds Node reports never reach the wire.

FILES:
  - ./packages/server/src/adapters/process/uptime/process-uptime-adapter.ts
  - ./packages/server/src/adapters/process/uptime/process-uptime-adapter.proxy.ts
  - ./packages/server/src/adapters/process/uptime/process-uptime-adapter.test.ts

UNITS:
  - #health-check-endpoint (the `successStatus` property's `HealthSnapshot` body — its `uptimeSeconds`
    field)

MIRROR: ./packages/server/src/adapters/process/dev-log/process-dev-log-adapter.ts (the sibling in the
  same `adapters/process/` domain folder; its `.proxy.ts` is also the nearest example of `registerSpyOn`
  against a `process` global)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/adapters/process/uptime/process-uptime-adapter.ts ./packages/server/src/adapters/process/uptime/process-uptime-adapter.proxy.ts ./packages/server/src/adapters/process/uptime/process-uptime-adapter.test.ts

NOTES:
  **The flow, and where this sits in it.** Node `#health-endpoint-serves-snapshot` again — this adapter
  answers the `uptimeSeconds` field, the one the badge renders as `12m` and the `/health` table renders
  as a raw integer that must strictly increase between ticks.

  **The observable it serves, verbatim** — `#check-health-uptime-integer`: "uptimeSeconds is a
  non-negative integer equal to Math.floor(process.uptime()) at the moment the request is served".

  **The quest's property description**, verbatim, from `#health-snapshot`:
  `uptimeSeconds: UptimeSeconds` — "Non-negative integer seconds the server process has been running,
  Math.floor of process.uptime(). New field. Nothing in the repo reads process.uptime today, so this
  needs a fresh adapter at the process boundary."

  **The shape.**

  ```ts
  import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';
  import type { HealthSnapshot } from '@dungeonmaster/shared/contracts';

  export const processUptimeAdapter = (): HealthSnapshot['uptimeSeconds'] =>
    healthSnapshotContract.shape.uptimeSeconds.parse(Math.floor(process.uptime()));
  ```

  - `healthSnapshotContract.shape.uptimeSeconds` is `z.number().int().nonnegative().brand<'UptimeSeconds'>()`
    — verified on disk at `packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts:19`.
    Reuse it; do NOT declare a second `UptimeSeconds` brand.
  - A value import from `@dungeonmaster/shared/contracts` inside a server adapter is already established
    — `packages/server/src/adapters/fs/read-file/fs-read-file-adapter.ts:13` value-imports
    `fileContentsContract` the same way.
  - `Math.floor` is what makes the `.int()` parse pass; without it the contract rejects `745.9` and every
    request 500s. That is the branch the tests below exist to pin.

  **The proxy** — `registerSpyOn({ object: process, method: 'uptime' })`, addressed `calledWith([])`
  (uptime takes no argument, so `[]` is the honest address, not a lazy catch-all — the same reasoning
  `orchestrator-get-orchestration-mode-adapter.proxy.ts` states in its own comment). Expose one semantic
  method, e.g. `returnsSeconds({ seconds }: { seconds: number })`.

  **The test** — fresh proxy per test, created BEFORE the call. `it.each` is NOT appropriate here (the
  cases are boundary values with distinct meanings, not a derived member list). Cover:
  - `VALID: {process.uptime(): 745.9} => returns 745` — the floor, and the `745` the badge stub uses.
  - `EDGE: {process.uptime(): 0.4} => returns 0` — the zero boundary the badge renders as `'0s'`.
  - `EDGE: {process.uptime(): 60} => returns 60` — an already-integral value passes through unchanged.
  - `EDGE: {process.uptime(): 3600.999} => returns 3600` — the hour boundary the badge renders as
    `'1h0m'`.

  Write `PURPOSE` LAST; say why the floor happens here rather than in the consumer — not what it
  returns.

## chunk 5 — `healthSnapshotBroker`, the assembly

INTENT: `healthSnapshotBroker()` returns a `HealthSnapshot` whose seven fields come from the five real
sources the quest names, parsed through `healthSnapshotContract` so the endpoint can never emit a body
the web cannot parse; and any source that throws propagates unchanged so the responder can turn it into
a 500.

FILES:
  - ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.ts
  - ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.proxy.ts
  - ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.test.ts

UNITS:
  - #health-check-endpoint (`successStatus` — the `HealthSnapshot` body, all seven fields)

MIRROR: ./packages/server/src/brokers/web-bundle/response/web-bundle-response-broker.proxy.ts (the
  nearest server broker proxy that composes several child proxies, including one imported from
  `@dungeonmaster/shared/testing`)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.ts ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.proxy.ts ./packages/server/src/brokers/health/snapshot/health-snapshot-broker.test.ts

NOTES:
  **The flow, and where this sits in it.** This IS node `#health-endpoint-serves-snapshot` / node
  `#page-endpoint-serves-snapshot` — the merge node both quest flows route through. The user either sees
  `[ ONLINE · 12m · v0.1.0 ]` in the header or, on `/health`, a 7-row labelled table; both render the
  object this broker builds.

  **The observables it must satisfy, verbatim:**
  - `#check-health-body-keys`: "GET /api/health responds 200 with a JSON body whose keys are exactly
    status, timestamp, uptimeSeconds, version, port, home, orchestrationMode"
  - `#check-health-status-literal`: "The status field of the GET /api/health body equals the string 'ok'"
  - `#check-health-uptime-integer`: "uptimeSeconds is a non-negative integer equal to
    Math.floor(process.uptime()) at the moment the request is served"
  - `#check-health-version-value`: "version equals the version field of packages/server/package.json,
    which is the string '0.1.0'"
  - `#check-health-port-value`: "port equals the number returned by portResolveBroker() — 3737 when
    neither DUNGEONMASTER_PORT nor .dungeonmaster.json overrides it"
  - `#check-health-home-value`: "home equals the homePath returned by dungeonmasterHomeFindBroker() —
    the DUNGEONMASTER_HOME value verbatim when that env var is set and non-empty"
  - `#check-health-mode-value`: "orchestrationMode equals the value returned by
    StartOrchestrator.getOrchestrationMode(), which is either 'claude' or 'node'"

  **The already-built exports you wire into — every name below was read off disk, none is guessed:**
  - `healthSnapshotContract`, type `HealthSnapshot` — `@dungeonmaster/shared/contracts`. Seven keys in
    this order: `status`, `timestamp`, `uptimeSeconds`, `version`, `port`, `home`, `orchestrationMode`.
  - `portResolveBroker` — `@dungeonmaster/shared/brokers`. Signature
    `({ startDir }?: { startDir?: AbsoluteFilePath }) => NetworkPort`. **Synchronous.** Call it with no
    arguments so it walks up from `process.cwd()`.
  - `dungeonmasterHomeFindBroker` — `@dungeonmaster/shared/brokers`. Signature
    `() => { homePath: FilePath }`. **Synchronous.** `FilePath` is the exact brand
    `healthSnapshotContract.home` requires, so `homePath` passes straight through with no re-brand.
  - `orchestratorGetOrchestrationModeAdapter` —
    `../../../adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter`.
    `() => Promise<OrchestrationMode>`. **Async.**
  - `processUptimeAdapter` (chunk 4) and `serverPackageVersionAdapter` (chunk 3) — both synchronous.

  A `brokers/` file may import another package's `brokers/` and `contracts/` subpaths, so both shared
  brokers are legal imports here. A broker may NOT import `state/` or `responders/`.

  **The shape.**

  ```ts
  export const healthSnapshotBroker = async (): Promise<HealthSnapshot> => {
    const orchestrationMode = await orchestratorGetOrchestrationModeAdapter();
    const { homePath } = dungeonmasterHomeFindBroker();

    return healthSnapshotContract.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: processUptimeAdapter(),
      version: serverPackageVersionAdapter(),
      port: portResolveBroker(),
      home: homePath,
      orchestrationMode,
    });
  };
  ```

  **Let every error propagate — do NOT wrap any of these calls in try/catch.** The repo's broker rule is
  explicit: "Responders (not brokers) are the error boundary — brokers throw, responders catch and
  translate to HTTP status". Chunk 6 is that boundary.

  **The proxy** — compose child proxies; mock nothing yourself except the clock. Assign each child proxy
  to a variable before calling setup on it (`enforce-proxy-patterns` only recognises the Identifier
  form), and expose SEMANTIC methods — never hand a child proxy back to the test.

  ```
  const modeProxy    = orchestratorGetOrchestrationModeAdapterProxy();   // ../../../adapters/orchestrator/get-orchestration-mode/…proxy
  const uptimeProxy  = processUptimeAdapterProxy();                      // ../../../adapters/process/uptime/…proxy
  const versionProxy = serverPackageVersionAdapterProxy();               // ../../../adapters/server-package/version/…proxy
  const portProxy    = portResolveBrokerProxy();                         // '@dungeonmaster/shared/testing'
  const homeProxy    = dungeonmasterHomeFindBrokerProxy();               // '@dungeonmaster/shared/testing'
  const clock        = registerSpyOn({ object: Date.prototype, method: 'toISOString' });
  ```

  Both shared proxies ARE exported from `@dungeonmaster/shared/testing` (verified: `testing.ts` lines
  44 and 48), and other server proxies already import from that barrel
  (`session-list-broker.proxy.ts`, `web-bundle-response-broker.proxy.ts`).

  **Drive port and home through their ENV rungs, not their adapter rungs.** `portResolveBroker` returns
  early on `DUNGEONMASTER_PORT`, and `dungeonmasterHomeFindBroker` returns early on
  `DUNGEONMASTER_HOME` — so `portProxy.setEnvPort({ value: '3737' })` and
  `homeProxy.setHomeEnv({ value: '/home/user/.dungeonmaster' })` give you full control with zero adapter
  staging and no chance of colliding with another proxy over `pathJoin`. **Env vars leak between tests
  in the same worker and no `afterEach` exists**, so follow the discipline
  `packages/shared/src/brokers/port/resolve/port-resolve-broker.test.ts` already uses: call the
  implementation, then clear the env, THEN assert — so a failing assertion still leaves the env clean.
  Expose that as one semantic proxy method (e.g. `clearEnv()`) which calls
  `portProxy.clearEnvPort()` and `homeProxy.clearHomeEnv()`.

  Suggested semantic surface: `setupSnapshot({ uptimeSeconds, version, port, home, orchestrationMode,
  timestamp })` staging all five sources plus the clock, `setupVersionFailure({ error })`,
  `setupModeFailure({ error })`, and `clearEnv()`.

  **The test** — fresh proxy per test, created BEFORE the call. Cover:
  - `VALID: {all sources healthy} => returns the exact 7-key snapshot` — one `toStrictEqual` spelling
    out all seven values. **This is the assertion that pins `#check-health-body-keys`.** Use the shared
    stub's canonical values so the web slice downstream asserts against the same numbers:
    `uptimeSeconds: 745`, `version: '0.1.0'`, `port: 3737`, `home: '/home/user/.dungeonmaster'`,
    `orchestrationMode: 'claude'`, `timestamp: '2026-05-05T13:00:00.000Z'`, `status: 'ok'`.
  - `VALID: {orchestrationMode: 'node', port: 4800} => those values reach the snapshot` — a second,
    different set, so the first test cannot pass on hardcoded constants.
  - `ERROR: {version read throws} => rejects with that error` — proves the broker does not swallow.
  - `ERROR: {orchestration mode adapter throws} => rejects with that error`.

  `status: 'ok'` is a literal in the contract (`z.literal('ok')`), so there is no "unhealthy" value to
  test — the endpoint signals unhealthiness with a 500, per the quest's own property description.

  Write `PURPOSE` LAST; say why the assembly lives in a broker rather than the responder — not what it
  returns.

## chunk 6 — `HealthCheckResponder`, the 200/500 boundary

INTENT: `HealthCheckResponder()` returns `{ status: 200, data: <HealthSnapshot> }` when assembly
succeeds and `{ status: 500, data: { error: <non-empty string> } }` when it throws — the error path the
endpoint has never had.

FILES:
  - ./packages/server/src/responders/health/check/health-check-responder.ts
  - ./packages/server/src/responders/health/check/health-check-responder.proxy.ts
  - ./packages/server/src/responders/health/check/health-check-responder.test.ts

UNITS:
  - #health-check-endpoint (`successStatus` and `errorStatus`)

MIRROR: ./packages/server/src/responders/orchestration/mode-get/orchestration-mode-get-responder.ts
  (plus its `.proxy.ts` and `.test.ts` — copy all three shapes; it is the same
  "no-input GET, delegate, try/catch to 500" responder)

WARD: npm run ward -- --only lint,typecheck,unit -- ./packages/server/src/responders/health/check/health-check-responder.ts ./packages/server/src/responders/health/check/health-check-responder.proxy.ts ./packages/server/src/responders/health/check/health-check-responder.test.ts

NOTES:
  **The flow, and where this sits in it.** Decision node `#health-response-valid` — "200 with body
  matching healthSnapshotContract?" — branches to `#badge-online` on a valid 200 and to
  `#badge-offline-sad-raccoon` on "non-200 / invalid body / network error". This responder is what
  produces the non-200 side of that branch.

  **The contract this chunk owns**, from the quest, verbatim — `#health-check-endpoint` /
  `HealthCheckEndpoint` (endpoint, modified):
  - `successStatus: HttpStatusCode = "200"` — "httpStatusStatics.success.ok, carrying a HealthSnapshot
    body."
  - `errorStatus: HttpStatusCode = "500"` — "httpStatusStatics.serverError.internal, carrying an error
    string. New — the handler today is an inline c.json literal that cannot fail, so it has no error
    path at all."

  **The observable it must satisfy, verbatim** — `#check-500-on-assembly-failure`: "When snapshot
  assembly throws, GET /api/health responds 500 with a JSON body containing an error field holding a
  non-empty string".

  **The shape** — a near-exact copy of `OrchestrationModeGetResponder`:

  ```ts
  export const HealthCheckResponder = async (): Promise<ResponderResult> => {
    try {
      const snapshot = await healthSnapshotBroker();
      return responderResultContract.parse({
        status: httpStatusStatics.success.ok,
        data: snapshot,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assemble health snapshot';
      return responderResultContract.parse({
        status: httpStatusStatics.serverError.internal,
        data: { error: message },
      });
    }
  };
  ```

  - `responderResultContract` and type `ResponderResult` —
    `../../../contracts/responder-result/responder-result-contract` (`{ status: branded int, data:
    unknown }`, read off disk).
  - `httpStatusStatics.success.ok` is `200`, `httpStatusStatics.serverError.internal` is `500` — read
    off disk at `../../../statics/http-status/http-status-statics`. Use the statics, never inline
    literals.
  - The responder takes NO parameters — `GET /api/health` has no params, query or body, so there is
    nothing to validate at the boundary. `OrchestrationModeGetResponder` is the same and is the
    precedent.
  - **`data` is the snapshot itself, not `{ snapshot }`.** The body IS the seven keys — that is what
    `#check-health-body-keys` and the web's `healthSnapshotContract.parse(body)` both require. Do not
    nest it.
  - **No transformer.** The "never return raw broker data" rule exists to stop internal fields leaking;
    here the broker's return value is already the exact wire contract that `@dungeonmaster/shared`
    defines and the web parses, so a transformer would be an identity function and a second place for
    the shape to drift. `OrchestrationModeGetResponder` returns its adapter's value the same way.

  **The proxy** — delegate to `healthSnapshotBrokerProxy` (chunk 5), exactly as
  `OrchestrationModeGetResponderProxy` delegates to the adapter proxy, and expose
  `callResponder: typeof HealthCheckResponder` so the test never imports the responder directly. Surface:
  `setupSnapshot({...})`, `setupFailure({ message })`, `clearEnv()`, `callResponder`.

  **The test** — fresh proxy per test. Cover:
  - `VALID: {broker returns a snapshot} => returns 200 with the 7-key body` — one `toStrictEqual` on
    `{ status: 200, data: { …all seven… } }`.
  - `ERROR: {broker throws} => returns 500 with the error message` — `toStrictEqual` on
    `{ status: 500, data: { error: 'read failed' } }`.
  - `ERROR: {broker throws a non-Error value} => returns 500 with the fallback message` — this pins the
    `error instanceof Error` ternary's else branch, which is a real branch and the one most often left
    uncovered.

  Write `PURPOSE` LAST.

## chunk 7 — `HealthFlow` serves the snapshot, and its integration test drives both branches

INTENT: `GET /api/health` returns 200 with a body that `healthSnapshotContract` parses, and returns 500
with an `error` string when assembly genuinely fails — both proved by a real Hono request through the
real responder → broker → adapter chain.

FILES:
  - ./packages/server/src/flows/health/health-flow.ts
  - ./packages/server/src/flows/health/health-flow.integration.test.ts

UNITS:
  - #health-check-endpoint (`method`, `path`, `successStatus`, `errorStatus`)

MIRROR: ./packages/server/src/flows/orchestration/orchestration-flow.ts (its
  `app.get(apiRoutesStatics.orchestration.mode, …)` arm is the exact form to copy) and
  ./packages/server/src/flows/orchestration/orchestration-flow.integration.test.ts (the
  `serverAppHarness` + `setupTestHome` + `restore()`-before-`expect` shape)

WARD: npm run ward -- --only lint,typecheck,unit,integration -- ./packages/server/src/flows/health/health-flow.ts ./packages/server/src/flows/health/health-flow.integration.test.ts

NOTES:
  **The flow, and where this sits in it.** This is the route itself — entry to node
  `#health-endpoint-serves-snapshot` (flow `#server-health-badge`) and node
  `#page-endpoint-serves-snapshot` (flow `#health-detail-page`). Every other surface in this quest hangs
  off this one HTTP response.

  **The contract this chunk owns**, from the quest, verbatim — `#health-check-endpoint`:
  - `method: HttpMethod = "GET"` — "Unchanged from the route that exists today."
  - `path: ApiRoute = "/api/health"` — "Unchanged. Already declared as apiRoutesStatics.health.check and
    already mounted by StartServer, so no route registration work — only the handler body changes."
  - `successStatus` / `errorStatus` as quoted in chunk 6.

  **The design decision that governs this edit**, quoted — `#extend-existing-health-endpoint`: "GET
  /api/health already exists and is live: HealthFlow registers an inline c.json({status:'ok', timestamp})
  handler. Adding uptimeSeconds, version, port, home and orchestrationMode to that same body is the right
  move under this repo's extension-over-creation rule — a second endpoint would duplicate the route."
  Its second half is chunk 9's job, not this chunk's.

  **The observable this chunk must satisfy, verbatim** — `#check-route-literals-pair`:
  "apiRoutesStatics.health.check and webConfigStatics.api.routes.health are the identical literal string
  '/api/health', so the page and the badge hit one route". `apiRoutesStatics.health.check` is already
  `'/api/health'` (read off disk); the web half is the web slice's work. **Do not change the route
  string.**

  **The edit to `health-flow.ts`** — replace the inline `c.json({...})` with a delegation, exactly the
  form `orchestration-flow.ts` uses:

  ```ts
  app.get(apiRoutesStatics.health.check, async (c) => {
    const result = await HealthCheckResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });
  ```

  `ContentfulStatusCode` is a type-only import from `'hono/utils/http-status'` —
  `orchestration-flow.ts:13` already imports it that way. `flows/` may import `responders/`, `statics/`
  and `hono`, so both new imports are legal. Update the USAGE block if it goes stale; keep the file
  routing-only with no business logic.

  **The integration test** — rewrite `health-flow.integration.test.ts` completely. It currently imports
  `parseHealthResponseTransformer`, which chunk 8 deletes; after this chunk it must import
  `healthSnapshotContract` from `@dungeonmaster/shared/contracts` instead. Use
  `serverAppHarness()` from `../../../test/harnesses/server-app/server-app.harness` (its
  `setupTestHome({ baseName })` sets `DUNGEONMASTER_HOME` to a fresh `/tmp` dir and returns a
  `restore()`; `toPlain(body)` JSON-round-trips the body). Flows take NO `.proxy.ts` — real code all the
  way down.

  Two tests:

  1. `VALID: {} => 200 with the full 7-field snapshot`.
     - `const restore = harness.setupTestHome({ baseName: 'health-flow-snapshot' });` and capture
       `const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;` — that is the exact value
       `#check-health-home-value` expects `home` to equal.
     - Pin the port inline so the assertion cannot be flipped by an ambient env var: save
       `process.env.DUNGEONMASTER_PORT`, set it to `'4800'`, and restore it before the assertions.
       (`4800` is this repo's own `.dungeonmaster.json` value, so it stays honest either way.)
     - Pin the clock with `jest.useFakeTimers().setSystemTime(new Date('2024-01-15T10:00:00.000Z'))`
       and `jest.useRealTimers()` before asserting — `orchestration-flow.integration.test.ts` does
       exactly this. Fake timers do NOT affect `process.uptime()`.
     - Bracket the uptime rather than pretending it is fixed: read
       `const before = Math.floor(process.uptime());` immediately before `app.request(...)` and
       `const after = Math.floor(process.uptime());` immediately after, then assert
       `expect(parsed.uptimeSeconds >= before).toBe(true);` and
       `expect(parsed.uptimeSeconds <= after).toBe(true);`. That IS
       `#check-health-uptime-integer` ("equal to Math.floor(process.uptime()) at the moment the request
       is served") stated as something a test can actually falsify; the exact-value proof lives in
       `processUptimeAdapter`'s unit test.
     - Parse the body with `healthSnapshotContract.parse(harness.toPlain(body))` — a body missing any
       field or of the wrong type throws, so this single call is what proves the key set and the types.
     - Then assert the deterministic fields individually with `toBe`: `status` `'ok'`, `version`
       `'0.1.0'`, `port` `4800`, `home` the captured temp dir, `timestamp`
       `'2024-01-15T10:00:00.000Z'`, `orchestrationMode` `'node'`. `'node'` comes from this worktree's
       committed `.dungeonmaster.json` (`"orchestrationMode": "node"`), which
       `StartOrchestrator.getOrchestrationMode()` walks up to from cwd.
     - Order matters: `restore()` and every env/timer restoration BEFORE the `expect`s, so a failure
       does not leave the worker's env dirty.

  2. `ERROR: {DUNGEONMASTER_HOME is a bare relative path} => 500 with a non-empty error string`.
     - Set `process.env.DUNGEONMASTER_HOME = 'relative/path'` (saving and restoring the previous value
       inline). `dungeonmasterHomeFindBroker` returns that verbatim through
       `filePathContract.parse(...)`, whose relative branch requires a `./` or `../` prefix and whose
       absolute branch carries the refine message `Path must be absolute (start with / or C:\ on
       Windows)` — so it throws for REAL, with no mocking, and the broker propagates it to the responder.
       That is `#check-500-on-assembly-failure` driven end to end.
     - Assert `expect(response.status).toBe(500);` and that the body's `error` is a non-empty string —
       e.g. `toMatch(/Path must be absolute/u)` after reading what actually came back.

  **RUN the WARD line and assert what actually came back.** The literals above are the intent; the
  runner is the authority. In particular, confirm `orchestrationMode` and the exact 500 message rather
  than trusting this plan for them.

## chunk 8 — retire the superseded `healthResponseContract` and its transformer

INTENT: The two-field legacy health shape is gone from the tree, and nothing imports it — the server
has exactly one health body type, the shared `HealthSnapshot`.

FILES:
  - ./packages/server/src/contracts/health-response/health-response-contract.ts
  - ./packages/server/src/contracts/health-response/health-response-contract.test.ts
  - ./packages/server/src/contracts/health-response/health-response.stub.ts
  - ./packages/server/src/transformers/parse-health-response/parse-health-response-transformer.ts
  - ./packages/server/src/transformers/parse-health-response/parse-health-response-transformer.test.ts

UNITS:
  - #health-check-endpoint (`successStatus` — one body type, one source of truth)

MIRROR: (none — this chunk only deletes)

WARD: npm run ward -- --only lint,typecheck,unit,integration -- ./packages/server/src/flows/health/health-flow.ts ./packages/server/src/flows/health/health-flow.integration.test.ts

NOTES:
  **Why this is in scope.** Design decision `#snapshot-contract-in-shared`, quoted: "The server's
  existing healthResponseContract is the narrower legacy shape and is superseded by this one." The
  shared slice's plan deliberately left the retirement to the server slice — that is this operation
  item — and its reviewer confirmed on the record that the file was left untouched for exactly that
  reason. After chunk 7 the last importer is gone and these five files are orphaned; the repo's own
  performance rule says to delete orphaned files and dead code.

  **Delete all five files listed in FILES. Delete the two now-empty directories with them**
  (`packages/server/src/contracts/health-response/` and
  `packages/server/src/transformers/parse-health-response/`).

  **Verify the reference set BEFORE deleting, and do not take this plan's word for it.** As of this
  plan the only files in the repo that mention `health-response` / `healthResponseContract` /
  `HealthResponseStub` / `parseHealthResponseTransformer` are the five above, plus
  `packages/server/src/flows/health/health-flow.integration.test.ts` (which chunk 7 rewrites) and one
  PURPOSE line in `packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts` that
  mentions the name in prose only. Re-check with `discover({ grep: "healthResponseContract" })` and
  `discover({ grep: "parseHealthResponseTransformer" })` first. **If anything else imports them, STOP,
  leave the files in place, and return `rework` naming the importer** — a broken import is far worse
  than a lingering orphan.

  **Also update the one prose reference.** `health-snapshot-contract.ts`'s PURPOSE currently reads
  "Reach for this over the server's legacy healthResponseContract — that narrower shape is superseded by
  this one…". Once that contract does not exist, the sentence points at nothing, and the repo's
  present-tense documentation rule forbids describing code that is gone. Rewrite that PURPOSE to state
  the same non-derivable facts without the dangling reference — why this contract lives in `shared`
  (both the server producing the body and the web parsing it hold one type) and that unknown keys are
  stripped rather than rejected so a future server-only field cannot flip the badge OFFLINE. **That file
  is NOT in this chunk's FILES because it belongs to `@dungeonmaster/shared`; edit it, then add
  `./packages/shared/src/contracts/health-snapshot/health-snapshot-contract.ts` to your ward invocation
  alongside the two files above, and run `npm run build` (unpiped, exit 0) before ward since shared is
  consumed through `dist/`.** Comment-only change — do not touch the zod chain.

  The WARD line above re-runs the health flow's integration test, which is the thing that would go red
  if a deletion took something live with it.

## chunk 9 — widen the pre-existing smoke e2e assertion to the 7-key body

INTENT: `packages/web/src/flows/app/smoke.e2e.ts` asserts the `GET /api/health` body against the full
seven-key snapshot, so the endpoint change does not leave a red e2e behind.

FILES:
  - ./packages/web/src/flows/app/smoke.e2e.ts

UNITS:
  - #check-existing-smoke-assertion-holds

MIRROR: ./packages/web/src/flows/app/smoke.e2e.ts itself (the `expect.stringMatching(...)` form already
  used for `timestamp` in the very assertion you are widening)

WARD: npm run ward -- --only lint,typecheck -- ./packages/web/src/flows/app/smoke.e2e.ts

NOTES:
  **Why a server-slice chunk edits a web file.** Design decision `#smoke-e2e-assertion-widened`, quoted
  in full because it is the authorisation: "packages/web/src/flows/app/smoke.e2e.ts currently asserts
  the GET /api/health body with toStrictEqual over exactly {status, timestamp}. Two ways to keep it
  green: widen it to the full 7-key shape, or make the five new fields optional so a 2-key body stays
  valid. Optional fields are the wrong answer — they would let the endpoint silently ship without
  uptime, version, port, home or mode and still satisfy the contract, which is the entire payload of
  this quest. So the assertion is widened to the new full shape. This makes editing that pre-existing
  e2e file explicitly in scope for whichever session builds the endpoint; without this decision
  recorded, a codeweaver would hit a red test it has no authorisation to touch." This round builds the
  endpoint, so the edit is ours. **This is not authoring a browser walk** — it is one assertion widened
  in a spec that already exists; do not add tests, harnesses or `page.*` calls to this file.

  **The observable, verbatim** — `#check-existing-smoke-assertion-holds`: "packages/web/src/flows/app/
  smoke.e2e.ts asserts the GET /api/health body with toStrictEqual over all 7 keys — status 'ok', an
  ISO-8601 timestamp, uptimeSeconds, version, port, home, orchestrationMode — and passes. Its current
  two-key toStrictEqual is widened as part of this quest; left unwidened it fails, because toStrictEqual
  rejects extra keys."

  **The edit** — only the `toStrictEqual` inside `test('VALID: health endpoint responds', …)`
  (currently lines 13-16). Leave every other test in the file alone.

  ```ts
  expect(body).toStrictEqual({
    status: 'ok',
    timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
    uptimeSeconds: expect.any(Number),
    version: '0.1.0',
    port: expect.any(Number),
    home: expect.stringMatching(/^\//u),
    orchestrationMode: expect.stringMatching(/^(claude|node)$/u),
  });
  ```

  The reasoning per field, so none of it looks arbitrary:
  - `version: '0.1.0'` is exact because the observable names that literal and the value is committed in
    `packages/server/package.json`. It is the only new field whose value is knowable ahead of the run.
    A version bump means updating this line — that is intended, not a defect.
  - `port` CANNOT be `4800` here: ward's e2e runner passes a rotating free port via `DUNGEONMASTER_PORT`
    (`netFreePortAdapter`), so the value differs every run.
  - `home` CANNOT be pinned either: Playwright runs the server under
    `DUNGEONMASTER_HOME=/tmp/dm-e2e-{pid}`. Asserting it starts with `/` still proves the field is a
    real absolute path rather than empty or missing.
  - `uptimeSeconds` is genuinely nondeterministic; the exact-value proofs live in
    `processUptimeAdapter`'s unit test and the flow integration test's bracket.
  - **The Jest ban on `expect.any` / `expect.stringMatching` does not apply here.** This is a Playwright
    spec, `expect` comes from `test/harnesses/e2e-fixtures`, and the file's existing `timestamp`
    assertion already uses `expect.stringMatching`. Follow the file.

  **Do not run e2e.** The WARD line is `lint,typecheck` only. If ward reports `DISCOVERY MISMATCH` or a
  `skip` for a check type on this one file, that is the documented behaviour of a scoped run and is NOT
  a regression — narrow, never widen, and never add `--passWithNoTests`. The real e2e execution is the
  dispatcher's own ward gate, not yours.
