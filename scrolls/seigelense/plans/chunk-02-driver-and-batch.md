# Chunk 2 — the driver, the batch, and the teardown that ships with it

The process that holds a browser and outlives an MCP rebuild; `start`, `run` and `kill` registered as three
real MCP tools; six step verbs that drive the real dungeonmaster web UI; capture-on-every-acting-step with
the `open:` flags that decide what a session reads; and the teardown suite written red-first, including the
three-instance parallel case.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/siegelense`.** Never the main checkout.

Coverage is tracked in `scrolls/seigelense/build-ledger.md`. **This plan does not edit that file** — §8 lists
the rows it expects to move and the ledger's owner moves them.

Chunk 1 is `plans/chunk-01-registry-spine.md`. Every signature quoted below was read off disk in this
worktree after chunk 1 landed; where chunk 1's plan and the delivered code disagree, the code wins and this
file carries the code's shape.

---

## 1. Scope

### Delivered by this chunk

| Spec section | Line | What lands |
|---|---|---|
| The shape | 42 | `start` → an instance id and a manifest · `run` → a STATUS with an index and a shot list, never a payload · `kill` → teardown that keeps the evidence. **Not** `results` |
| An instance is a TIMELINE of runs, and every run is addressable | 63 | Run ids minted per run, step numbering restarting at 1, shots namespaced `run_N/stepN.png`, buffers armed once at boot with each run recording its WINDOW, an index that counts only that window. **Not** the retention window or `results`' query surface |
| What a batch buys beyond call count | 293 | Batched steps at millisecond gaps; stop-on-first-failure by default; `expect: 'error'` per step; `stopOn: 'never'` per batch |
| Teardown: the failure that is silent… | 1077 | All four rows of the lessons table (1086–1090) plus the evidence rule at 1107 |
| When it dies without warning: OOM, SIGKILL, a full disk | 1111 | The heartbeat TICKER in the driver (chunk 1 built the writer), and `kill` reaping a dead instance's recorded pgids when its driver is gone. **Not** `status`, `likelyCause`, the OOM evidence or the disk checks |
| The TOOL staggers, because nobody else can | 1456 | `start` blocks on `boot.lock` and reports `queuedMs` and `aheadOfMe`. **Not** the pool-size refusal, which needs `capacity` |
| 4A · The service: instances, runs, batches | 1606 | rows 1610, 1613 (the browserless spec exists and browser steps error by name), 1616, 1627, 1629, 1630, 1631 (the write half), 1635, 1638, 1639, 1640 |
| 4A · Perception: shots, pixelChange, animation | 1587 | rows 1591, 1592, 1593 (the `node:` label), 1601 (frozen capture), 1604's negative half (no `video`). **Not** `pixelChange`, **not** `blank` |
| 4A · Teardown and crash recovery | 1654 | rows 1658, 1659, 1660, 1676, 1680, 1681, 1682, 1683 |
| What the TOOLING must guarantee | 1743 | the retention row's WRITE half (1752 — evidence is append-only and flushed per step) and the per-run numbering row (1753) now enforced by the run executor, not only by a contract |
| The tool is `siegelense`, and its recipes live beside it | 1817 | `dungeonmaster siegelense` (line 1824) — the third fixed convention, given a job |
| The thirteen calls | 2094 | Three of them registered as `siegelense-start`, `siegelense-run`, `siegelense-kill`, with the prefix taken from `siegelenseToolsStatics.tools.prefix` |
| The rule that governs every targeting step | 1961 | All three outcomes: one match proceeds, AMBIGUOUS throws carrying the candidates, NO MATCH throws naming the near misses |
| Steps that exist today and are kept | 2365 | `goto`, `waitFor`, `click`, `type`, `screenshot`, `eval` — ambiguity now throws, and `end` has become the instance-level `kill` |
| What every acting step returns, on top of its own reading | 2564 | `shot` on every acting step. **Not** `pixelChange`, **not** `elements` |
| Cycles / A clean return / A failing return / A timeout | 2794–2877 | the `RunResult` shape: `status`, `stepsRun`, `index`, `shots` with `open` and `why`, `stoppedAt` naming the step and the verb |
| Part 7 items 2, 2b, 17 | 1911, 1913, 1939 | in part — §8 says exactly which part |

### Deliberately deferred

| Deferred | To roughly | Why it is safe to wait |
|---|---|---|
| `results`, `compare`, `status`, `snapshots` | chunk 3 | They READ a tree. This chunk is the tree's first WRITER, and it writes the run's stored return to `runs/run_N.json` and its transcript to `runs/run_N.jsonl` exactly as spec line 1634 requires them to be readable. A reader over an empty tree proves nothing; a reader over this chunk's output is a query layer with no new shape to invent |
| `capacity`, `profile`, RSS sampling, the pool-size refusal on `start` | chunk 3 | `start` already blocks on `boot.lock` and reports `queuedMs`, which is the half that stops a minion reporting a `wall` (line 1473). The refusal needs a measured profile and there is no sampler |
| `cleanup`, `prune`, retention, the tombstone resolution through `.quest-plans/` | chunk 4 | `kill` already writes the `killed` tombstone (chunk 1's `instanceReleaseBroker`) and this chunk adds the orphan reap that `cleanup` will call. The CITATION half is blocked on Part 7 item 11g — typed `instanceId`/`runId` on a `walked` note — which is an orchestrator change, not this package's |
| `pixelChange` and `blank` | chunk 3, with Part 7 item 6's remainder | Both need a pixel-diff dependency this package does not have. **The fields are ABSENT from `ShotListing`, never null** — spec line 1585: "An absent field is honest where an empty one invites a session to wonder what went wrong." Capture-always and the `open:` policy, which are the halves that change what a session READS, land here |
| The SETTLE detector | chunk 3 | This is the one deferral with a real cost, and it is stated rather than hidden. Spec 1754 makes settle-based stepping a determinism guarantee. Chunk 2 uses Playwright's own actionability waiting plus an explicit `timeoutMs` ceiling per step, and a step that hits its ceiling reports the target it was waiting on — which is the actionable half of line 1641. What is missing is the network/paint/DOM-quiet triple and the repeating-request discount, and until it lands two runs of one batch on a loaded machine can read differently |
| `look`, refs, the key, the map | chunk 4+ | Part 7 item 7. Every targeting step here takes a `target` selector and an optional `within`, which spec line 2027 calls the DURABLE handle; refs are the live-session shortcut and arrive with the `look` that mints them. The AMBIGUOUS error therefore offers `within` as its recovery instead of a ref, and the candidates carry the `within` that would disambiguate each one |
| `health`, `until`, `dom`, `hold`, `video`, `reset`, `snapshot`, `seed`, `request`, `resize`, `key`, `file`, `before` | chunks 4+ | Part 7 items 5, 8–11, 14, 15. Steps are DATA inside `run` (spec line 26), so the tool surface does not grow when they arrive and the `stepContract` union gains a member |
| `seed:` on `start` and the `seed` STEP | chunk 3, with the recipe book | Part 7 item 3. `packages/siegelense-recipes/` holds one statics and no recipes. `start`'s return therefore OMITS the `seeded` field (spec 2112) rather than returning an empty one |
| `docs` and the seven scopes | the chunk that finishes the surface | Chunk 1 pinned the seven scope names. `docs` describes thirteen calls; three exist. A manual that documents ten calls nothing can make is the thing a `docs` call was built to stop |
| The remaining ten tool registrations | as each chunk lands its tools | §3's registration decision |
| Moving the lane spec where CONSUMERS get it (Part 7 item 17's second half) | last | Line 1947: "Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice." This chunk takes the FIRST half — the spec becomes DATA with N processes and a declared browser flag, so `siege-lane.ts`'s "exactly two processes against one port pair" is gone. The two built-in specs still live in a package-local statics that names `@dungeonmaster/server` and `@dungeonmaster/web`, so the tool is still this-repo-only. §7 says what that costs |
| Both local lint rules (Part 7 item 16) | chunk 3 for the `.first()` rule | **This chunk creates the first rule's subject.** `packages/siegelense/src/brokers/step/**` is where `.first()` would be written. The rule is deferred one chunk, not to "later": it can only be shown firing against a real violation once the commands exist, and they exist after this chunk. The package `CLAUDE.md` carries it as prose in the meantime |

### Where this departs from Part 7's order, and why

Part 7 puts item 6 (capture) at position 6 and calls it "the only one that changes what gets SIGNED…
If one capability ships alone, ship that one" (lines 1944–1945). **This chunk pulls the half of item 6 that
is free forward and leaves the half that is not.** Capturing on every acting step, listing every shot, and
flagging which to open costs one Playwright call and a list; `animations: 'disabled'` and `caret: 'hide'`
(line 1601) are two options on that same call. `pixelChange` and `blank` need a pixel differ. Splitting
there means the run's return is honest from the first batch rather than rewritten in chunk 3.

Part 7 puts item 17 last. This chunk takes its FIRST half — the N-process spec as data — because writing a
lane that hardcodes two processes and then rewriting it is the exact double-work line 1947 warns about,
arriving from the other direction: item 17 is about files this chunk CREATES, not files it adds to.

---

## 2. The contract surface, up front

**Every return is a branded contract; inputs may take a raw `string`.** All of these live in
`packages/siegelense/src/contracts/<domain>/` as `<domain>-contract.ts` + `<domain>-contract.test.ts` +
`<domain>.stub.ts`.

`contentTextContract`, `fileNameContract`, `absoluteFilePathContract`, `filePathContract`,
`fileContentsContract`, `networkPortContract`, `processIdContract`, `timeoutMsContract`, `guildIdContract`,
`questIdContract`, `adapterResultContract` and `arrayIndexContract` come from `@dungeonmaster/shared/contracts`.
Do not re-declare any of them. `epochMsContract`, `instanceIdContract`, `runIdContract`, `stepIndexContract`,
`specNameContract`, `specHashContract`, `instanceStateContract`, `instanceOwnerContract`,
`processGroupIdContract`, `portPairContract`, `repoLocalPathContract`, `registryEntryContract` and
`registryContract` come from chunk 1, in this package.

### Branded primitives

| Contract | Brand | Schema | Owner |
|---|---|---|---|
| `selectorContract` | `Selector` | `z.string().min(1)` — a CSS/testid selector, never a ref | W2 |
| `nodeLabelContract` | `NodeLabel` | `z.string().min(1)` — the optional `node:` a step carries (spec 2821) | W2 |
| `stepVerbContract` | `StepVerb` | `z.enum(stepStatics.verbs.all)` — derived from the statics, never a second hardcoded list | W2 |
| `locatorStateContract` | `LocatorState` | `z.enum(['visible','hidden','attached','detached'])` | W2 |
| `stopOnContract` | `StopOn` | `z.enum(['error','never'])` | W2 |
| `runStatusContract` | `RunStatus` | `z.enum(['done','timeout','failed'])` | W2 |
| `stepExpectationContract` | `StepExpectation` | `z.enum(['ok','error'])` | W2 |
| `shotOpenReasonContract` | `ShotOpenReason` | `z.enum(['start','end','failed'])` | W2 |
| `readingCountContract` | `ReadingCount` | `z.number().int().nonnegative()` — every count in a run index | W2 |
| `urlPathContract` | `UrlPath` | `z.string().startsWith('/')` | W4 |
| `laneProcessNameContract` | `LaneProcessName` | `z.string().min(1)` | W4 |
| `portRoleContract` | `PortRole` | `z.enum(['api','web'])` | W4 |
| `driverRequestKindContract` | `DriverRequestKind` | `z.enum(['ping','run','kill'])` | W6 |

### Object contracts

| Contract | Fields | Owner |
|---|---|---|
| `stepCandidateContract` | `{ index: ArrayIndex; within: Selector \| null; text: ContentText; rect: ContentText }` — one row of an AMBIGUOUS error. `within` is the nearest testId ancestor, i.e. the scope that WOULD disambiguate this candidate | W2 |
| `laneProcessContract` | `{ name: LaneProcessName; command: ContentText; args: readonly ContentText[]; portRole: PortRole \| null; readyPath: UrlPath \| null; logFileName: FileName; env: Readonly<Record<string, ContentText>> }` | W4 |
| `laneSpecContract` | `{ name: SpecName; processes: readonly LaneProcess[]; browser: z.boolean(); bootTimeoutMs: TimeoutMs; env: Readonly<Record<string, ContentText>> }` | W4 |
| `stepContract` | `z.discriminatedUnion('step', [...])` — six members, listed below | W5 |
| `stoppedAtContract` | `{ step: StepIndex; verb: StepVerb; error: ContentText; candidates: readonly StepCandidate[] }` | W5 |
| `runRequestContract` | `{ instanceId: InstanceId; steps: readonly Step[]; stopOn: StopOn }` | W5 |
| `stepReadingContract` | `{ step: StepIndex; verb: StepVerb; node: NodeLabel \| null; ok: boolean; expected: StepExpectation; reading: ContentText; shot: AbsoluteFilePath \| null; startedAtMs: EpochMs; endedAtMs: EpochMs }` — one line of `runs/run_N.jsonl`, flushed as it is taken | W5 |
| `runIndexContract` | `{ console: { errors: ReadingCount; warnings: ReadingCount }; server: { errors: ReadingCount }; network: { exchanges: ReadingCount; non2xx: ReadingCount } }` | W5 |
| `shotListingContract` | `{ step: StepIndex; path: AbsoluteFilePath; open: z.boolean(); why: ShotOpenReason \| null; node: NodeLabel \| null }` — **no `pixelChange`, no `blank`** | W5 |
| `runResultContract` | `{ instanceId: InstanceId; runId: RunId; status: RunStatus; stepsRun: StepIndex; stoppedAt: StoppedAt \| null; index: RunIndex; shots: readonly ShotListing[] }` | W5 |
| `instanceManifestContract` | `{ instanceId: InstanceId; specName: SpecName; baseUrl: ContentText; home: AbsoluteFilePath; evidence: RepoLocalPath; logs: { api: RepoLocalPath; web: RepoLocalPath }; queuedMs: EpochMs; aheadOfMe: ReadingCount; bootMs: EpochMs }` — what `start` returns | W6 |
| `killResultContract` | `{ instanceId: InstanceId; stopped: z.boolean(); portsReleased: readonly NetworkPort[]; homeRemoved: z.boolean(); evidenceKept: RepoLocalPath; reapedPgids: readonly ProcessGroupId[] }` | W6 |
| `driverRequestContract` | `{ kind: DriverRequestKind; payload: ContentText }` | W6 |
| `driverResponseContract` | `{ ok: z.boolean(); payload: ContentText; error: ContentText \| null }` | W6 |
| `browserSessionContract` | a FACADE — see below | W7 |
| `laneSessionContract` | a FACADE — see below | W7 |

### The six members of `stepContract`

Every member carries the same two optional fields — `node?: NodeLabel` and `expect?: StepExpectation` — and
`expect` defaults to `'ok'`.

```
{ step: 'goto',       path: UrlPath }
{ step: 'waitFor',    target: Selector, within?: Selector, state: LocatorState, timeoutMs?: TimeoutMs }
{ step: 'click',      target: Selector, within?: Selector, timeoutMs?: TimeoutMs }
{ step: 'type',       target: Selector, within?: Selector, value: ContentText, timeoutMs?: TimeoutMs }
{ step: 'screenshot', name: FileName }
{ step: 'eval',       source: ContentText }
```

`goto`, `click` and `type` are the ACTING steps. Every acting step captures unasked; `waitFor`, `screenshot`
and `eval` do not (`screenshot` captures because it IS the capture).

### The two facades, which are the one novel shape in this chunk

An adapter may not return an npm package's type (`get-folder-detail({folderType:'adapters'})`: "ALL outputs
MUST use contracts (no returning npm package types)"), and a contract may not import `@playwright/test`
(contracts import only `statics`, `errors`, `contracts`, `zod`, `@dungeonmaster/shared/@types`). So the
Playwright `Browser`, `BrowserContext` and `Page` never leave `adapters/playwright/session/`. What leaves is
a facade whose METHODS are the operations this package needs, declared structurally.

This is the sanctioned pattern, not an invention: the contracts folder detail documents it as
`eslintContextContract` — `z.object({...})` for the data, a TypeScript intersection for the functions,
"Zod's `z.function()` breaks type inference. Contract validates data, TypeScript enforces function
signatures."

```ts
// contracts/browser-session/browser-session-contract.ts
export const browserSessionContract = z.object({});

export type BrowserSession = z.infer<typeof browserSessionContract> & {
  goto: ({ url }: { url: string }) => Promise<void>;
  countMatches: ({ target, within }: { target: string; within?: string }) => Promise<number>;
  describeMatches: ({ target, within }: { target: string; within?: string }) => Promise<readonly StepCandidate[]>;
  nearestNames: ({ target }: { target: string }) => Promise<readonly string[]>;
  clickMatch: ({ target, within, timeoutMs }: { target: string; within?: string; timeoutMs: number }) => Promise<void>;
  fillMatch: ({ target, within, value, timeoutMs }: { target: string; within?: string; value: string; timeoutMs: number }) => Promise<void>;
  waitForMatch: ({ target, within, state, timeoutMs }: { target: string; within?: string; state: string; timeoutMs: number }) => Promise<void>;
  capture: ({ filePath }: { filePath: string }) => Promise<void>;
  evaluateSource: ({ source }: { source: string }) => Promise<ContentText>;
  readConsoleSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  readNetworkSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  readWebsocketSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  bufferLengths: () => { consoleLines: number; networkLines: number; websocketLines: number };
  close: () => Promise<void>;
};
```

`readConsoleSince` / `bufferLengths` are what make spec line 1635 true — "Buffers are continuous; a run
records its WINDOW, and its index counts only that window." A run records `bufferLengths()` at its start and
reads from there; it never resets a buffer.

`laneSessionContract` is the same shape one level out:

```ts
export const laneSessionContract = z.object({});

export type LaneSession = z.infer<typeof laneSessionContract> & {
  specName: SpecName;
  ports: PortPair;
  homePath: AbsoluteFilePath;
  evidencePath: AbsoluteFilePath;
  baseUrl: ContentText;
  pgids: readonly ProcessGroupId[];
  browser: BrowserSession | null;
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly ContentText[];
  serverLogLength: () => number;
};
```

`browser` is `null` for a browserless spec, and that `null` is what the browser-step guard reads.

### Two edits to chunk 1's shapes

**`registryEntryContract` gains `socketPath: absoluteFilePathContract.nullable()`.** It is `null` on a
reservation and on a tombstone, and it is how a `kill` from a different OS process finds the driver to talk
to. `.nullable()`, never `.optional()`, for the reason chunk 1 already recorded. Owner: W3. Every existing
`registry-entry.stub.ts` default and every test asserting the complete row moves with it.

**`locationsStatics.siegelense` (in `@dungeonmaster/shared`) gains the run and socket literals.** Owner: W1.

### Errors

| Class | Carries | Thrown when | Owner |
|---|---|---|---|
| `StepAmbiguousError` | `target`, `within`, `candidates` | a targeting step matched more than one element. The message renders the candidates, one per line, and ends with "Pick one by narrowing with `within`." | W3 |
| `StepNoMatchError` | `target`, `within`, `nearest` | a targeting step matched zero elements. The message names the near-miss testIds on the page | W3 |
| `BrowserStepUnsupportedError` | `verb`, `specName` | a browser step was submitted against a spec whose `browser` is `false`. **Names the spec** | W3 |
| `LaneBootFailedError` | `specName`, `instanceId`, `unready`, `logPaths` | a lane's processes did not answer their ready path inside `bootTimeoutMs`. Carries the log paths, because the reason is in them | W3 |
| `DriverUnreachableError` | `instanceId`, `socketPath`, `cause` | the socket refused or is absent. **Never surfaced bare** — `kill` catches it and takes the orphan-reap path | W3 |

### Statics

| Statics | Holds | Owner |
|---|---|---|
| `locationsStatics.siegelense` (**in `@dungeonmaster/shared`**) — added keys | `runsDir: 'runs'`, `transcriptExtension: '.jsonl'`, `runReturnExtension: '.json'`, `shotExtension: '.png'`, `shotPrefix: 'step'`, `socketsDirName: 'dm-siege-sockets'`, `socketExtension: '.sock'`, `driverLog: 'driver.log'` | W1 |
| `driverStatics` | `socket: { connectTimeoutMs, requestTimeoutMs, maxRequestBytes }` · `idle: { timeoutMs: 900_000 }` · `boot: { readyPollMs: 250, defaultTimeoutMs: 180_000, readyProbeTimeoutMs }` · `teardown: { graceMs: 3_000 }` · `run: { defaultStepTimeoutMs: 30_000 }` | W1 |
| `stepStatics` | `verbs: { all: [...six...], acting: ['goto','click','type'], targeting: ['waitFor','click','type'], browser: [...all six...] }` · `defaults: { stopOn: 'error', expect: 'ok' }` | W1 |
| `laneSpecStatics` | the two built-in specs — `dungeonmaster-web` (api + vite + chromium) and `dungeonmaster-headless` (api only, `browser: false`) | W4 |

**Why the sockets live under the OS tmp dir and not under the siegelense root.** Two reasons and both are
load-bearing. A socket is STATE, and the state/evidence line (spec 1012, 1090) puts state outside the
evidence tree. And a unix socket path has a 107-byte ceiling on Linux: `inst_` plus 32 hex is 37 characters
before the directory, and `<home>/.dungeonmaster/siegelense/sockets/` spends most of the rest on a long
username. `<os.tmpdir()>/dm-siege-sockets/<instanceId>.sock` is ~64 bytes on any machine.

---

## 3. Two decisions the user asked for by name

### Register the tools a chunk IMPLEMENTS, as that chunk lands them — three of them here

Chunk 1 registered none, on the argument that thirteen stubs answering errors teach the wrong thing. That
argument holds. What has changed is the user's verification bar: a capability that cannot be exercised by a
person through a real command or a real screen cannot be signed off, and an unregistered tool cannot be
called at all.

**Cost it honestly.** `packages/mcp/CLAUDE.md` records one name as "one edit of roughly 29". Read that list
and the 29 is dominated by the number of PLACES, not the number of names — seven copies of an allow-list, an
eighth in the install flow's integration test, a ninth in the permissions transformer, four index-aligned
arrays in the owning flow's integration test. Adding three names touches the same files as adding one, with
three entries each instead of one. The first tool this package registers pays essentially the whole bill;
each later chunk's tools cost one line per place plus one `describe` block.

So the choice is not "three now or thirteen now" — it is "pay the places once now and one line per tool
afterwards, or pay the places once later and answer errors in between". Three now:

- Every registered name WORKS. The surface a session meets is small and true, which is the property chunk 1's
  deferral was protecting.
- The person can drive it, which is the bar.
- `docs` stays unregistered on purpose. `docs { for: 'driving' }` is the manual for a session nobody
  orchestrated, and a manual describing ten calls that do not exist is the failure `docs` was invented to
  prevent, arriving from inside.

**W18 owns the whole cascade**, and it is dispatched as one item because splitting nine copies of one
allow-list across two agents is a merge conflict by construction.

**Siegelense gets its OWN flow and responder in `packages/mcp`, not a branch in `QuestHandleResponder`.**
`packages/mcp/CLAUDE.md`: "A tool handled inline in `responders/quest/handle/quest-handle-responder.ts`
costs cyclomatic complexity, and that function sits AT the ceiling (`complexity: max 50`)." `ArchitectureFlow`
is the template — six registrations, one handle responder, `zodToJsonSchema` over each input contract.

**All three tools take required input, so all three go in `TOOLS_EXEMPT_FROM_SIZE_CAP`.** That list's own
rule, from the same file: "a tool with required input belongs here too — not only one whose response exceeds
the cap. A `.strict()` contract rejects `{}`."

### `dungeonmaster siegelense` does two things, and both land here

The spec names the command at line 1824 as one of three fixed conventions and never says what it does. It
needs a job or it stays a placeholder that echoes a string, which is what
`packages/siegelense/src/startup/start-siegelense.ts` and `src/flows/siegelense/siegelense-flow.ts` do today.

Two jobs, and they are the only two the design actually needs from a COMMAND rather than from a TOOL:

| Invocation | Does | Why a command and not a tool |
|---|---|---|
| `dungeonmaster siegelense driver --instance <instanceId>` | runs the driver process for one instance until it is killed or goes idle | **This is the launch vector.** The MCP tools are thin clients over a socket to a process that must outlive an MCP rebuild (spec 1616), so `siegelense-start` has to SPAWN something. In a consumer repo the published artifact is one npm package and there is no `packages/siegelense/dist/...` to point at — the `dungeonmaster` binary is what is on PATH. Spawning it is the only vector that resolves in both this checkout and a consumer's |
| `dungeonmaster siegelense` (bare) | prints the registry as a table — id, state, spec, ports, last beat, evidence dir | **This is the human surface.** Every other read in the design is a tool because an agent calls it. A person at a terminal wanting to know what is running has no MCP client, and "open a REPL and call a broker" is not a verification step |

`packages/cli`'s `CliFlow` gains a `siegelense` branch that delegates to a `CliSiegelenseResponder`, which
reaches `@dungeonmaster/siegelense/startup` through `runtimeDynamicImportAdapter` from
`@dungeonmaster/shared/adapters`. **Dynamic, not static** — `install-execute-broker` already imports each
package's `StartInstall` that way, and a static import would pull Playwright into the esbuild bundle that
becomes `dist/bin/dungeonmaster.js`.

`@playwright/test` goes in siegelense's `peerDependencies` and `devDependencies`, never `dependencies`. It is
already in `devDependenciesStatics.packages` at `^1.58.2`, so `dungeonmaster init` puts it in every consumer
project that runs it. `zod` moves into siegelense's `dependencies` — the contracts need it at runtime and
today it only resolves through the workspace root.

---

## 4. Work items

**Maximum three agents at once.** Waves A, F, G and J run alone because everything downstream reads what
they write, or because the item is the whole wave.

| Wave | Items | Parallel? |
|---|---|---|
| A | W1 | alone — SEQUENCE |
| B | W2 · W3 · W4 | PARALLEL |
| C | W5 · W6 · W7 | PARALLEL |
| D | W8 · W9 · W10 | PARALLEL |
| E | W11 · W12 · W13 | PARALLEL |
| F | W14 | alone — SEQUENCE |
| G | W15 | alone — SEQUENCE |
| H | W16 · W17 | PARALLEL |
| I | W18 · W19 | PARALLEL |
| J | W20 | alone — SEQUENCE |

### Three orchestrator-owned builds, and a dispatched agent must never run one

`<dungeonmaster-buildDiscipline>`: a dispatched agent does not build.

1. **After W1, before any lint in wave B**: `npm run build --workspace=@dungeonmaster/shared`. W1 changes
   `locationsStatics`, and this repo's own ESLint rules import `@dungeonmaster/shared/statics` at module load
   with no `source` condition. The root `CLAUDE.md` names this as one of four build cases this checkout owns.
2. **After W19, before any manual drive**: `npm run build && npm link --workspaces && npm run init`, then
   reconnect the MCP. The driver runs COMPILED output (`dungeonmaster siegelense driver` resolves through
   `dist/`), the MCP child loads `packages/mcp/dist/src/index.js`, and `npm run init` is what regenerates
   `permissions.allow[]` for the three new tool names. `packages/mcp/CLAUDE.md`: "Any fix to MCP code only
   takes effect after a rebuild AND an MCP reconnect."
3. **Before W20**: the same build again if anything changed after (2). W20's integration suite spawns the
   real `dungeonmaster siegelense driver`.

---

### W1 — The location literals and the package statics (wave A, alone)

**Edits (in `@dungeonmaster/shared`, which is why this item runs alone)**

- `packages/shared/src/statics/locations/locations-statics.ts` — add to the existing `siegelense` group:
  `runsDir: 'runs'`, `transcriptExtension: '.jsonl'`, `runReturnExtension: '.json'`,
  `shotExtension: '.png'`, `shotPrefix: 'step'`, `socketsDirName: 'dm-siege-sockets'`,
  `socketExtension: '.sock'`, `driverLog: 'driver.log'`. The group currently ends at `webLog: 'web-server.log'`.
- `packages/shared/src/statics/locations/locations-statics.test.ts` — extend the full-value assertion.

**Creates**

- `packages/siegelense/src/statics/driver/driver-statics.ts` + `.test.ts`
- `packages/siegelense/src/statics/step/step-statics.ts` + `.test.ts`

**Edits** `packages/siegelense/package.json` — move `zod` into `dependencies` (match the root's `^3.25.76`),
add `@playwright/test` to BOTH `peerDependencies` and `devDependencies` at `^1.58.2` (the version
`devDependenciesStatics.packages` already pins), and add `@dungeonmaster/shared` is already there. Do not add
a `dependencies` entry for `@playwright/test`.

**Depends on** nothing.

**Tests** `step-statics.test.ts` asserts the complete `verbs.all` array with `toStrictEqual` and asserts that
`verbs.acting` and `verbs.targeting` are each a subset of `verbs.all` by deriving the check from `verbs.all`,
never from a second hardcoded list. `driver-statics.test.ts` asserts the complete object with `toStrictEqual`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/locations/locations-statics.ts packages/shared/src/statics/locations/locations-statics.test.ts packages/siegelense/src/statics/driver/driver-statics.ts packages/siegelense/src/statics/driver/driver-statics.test.ts packages/siegelense/src/statics/step/step-statics.ts packages/siegelense/src/statics/step/step-statics.test.ts`

**Acceptance criteria, quoted**

> line 78: `| screenshots are namespaced by run                                         | `run_2/step4.png`, or the second run silently overwrites the first's evidence                                                                 |`

> line 1676: `| The step transcript is flushed PER STEP, never buffered                                                               | a buffered transcript loses the whole run on a crash, including the steps that led to it — the part anyone would want most                                                                                         |`

> line 1157: `      evidence:  { dir:        '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_9b2c/',`
> line 1158: `                   transcript: 'run_2.jsonl', logs: ['api-server.log', 'web-server.log'],`
> line 1159: `                   lastShot:   'run_2/step7.png' },`

---

### W2 — Step vocabulary contracts (wave B, PARALLEL with W3 and W4)

**Creates** under `packages/siegelense/src/contracts/`, each as `<domain>-contract.ts` +
`<domain>-contract.test.ts` + `<domain>.stub.ts`:

`selector/`, `node-label/`, `step-verb/`, `locator-state/`, `stop-on/`, `run-status/`,
`step-expectation/`, `shot-open-reason/`, `reading-count/`, `step-candidate/`.

`stepVerbContract` is `z.enum(stepStatics.verbs.all)` — **derived, never a second list.** A contract that
retypes the six verbs is the shape that goes stale the day a seventh arrives.

`stepCandidateContract` is `{ index: ArrayIndex; within: Selector | null; text: ContentText; rect: ContentText }`.
Its PURPOSE must say what distinguishes it from a ref: a candidate carries the `within` that WOULD
disambiguate it, because chunk 2 has no refs and `within` is the only recovery a caller has.

**Depends on** W1 (`stepStatics.verbs.all`).

**Tests** `step-verb-contract.test.ts` uses `it.each` over `stepStatics.verbs.all` — derive the case list
from the statics, never hardcode it. Each enum contract asserts every member parses to itself, derived from
the contract's own `.options`, plus one `INVALID:` for an unlisted string. `step-candidate-contract.test.ts`
asserts both `within` branches, because the `null` branch is a candidate at the document root and it is real.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the thirty files>`

**Acceptance criteria, quoted**

> line 1963: `**Nothing ever silently picks a match. Ambiguity is an ERROR.**`

> lines 1977–1981:
> ```
> click { target: '[data-testid="PIXEL_BTN"]' }
> → ERROR  AMBIGUOUS: 2 elements match.
>      ref 16   PIXEL_BTN  under GUILD_LIST           "+"   (444,348) 27x25
>      ref 23   PIXEL_BTN  under GUILD_SESSION_LIST   "+"   (965,348) 27x25
>    Pick one by ref, or narrow with `within`.
> ```

> line 1991: `**The error carries the disambiguation.** It is not "ambiguous, go and work it out" — it hands back the candidates with`

> line 2027: `| testId, plus a `within` scope | **yes**         | the spec, or a `look` you transcribe       | anything saved, re-run, briefed, or written into a record |`

> line 2821: `**`node` is an optional label a STEP carries, echoed onto its shot and its reading.** Most steps have none; a step that`

---

### W3 — The five errors and the registry `socketPath` field (wave B, PARALLEL with W2 and W4)

**Creates** under `packages/siegelense/src/errors/`, each as `<name>-error.ts` + `<name>-error.test.ts`:

- `step-ambiguous/step-ambiguous-error.ts` — `({ target, within, candidates }: { target: string; within: string | null; candidates: readonly { index: number; within: string | null; text: string; rect: string }[] })`. Match chunk 1's three errors exactly: `public constructor`, raw `string` params, `super(...)` then `this.name`.
- `step-no-match/step-no-match-error.ts` — `({ target, within, nearest }: { target: string; within: string | null; nearest: readonly string[] })`
- `browser-step-unsupported/browser-step-unsupported-error.ts` — `({ verb, specName }: { verb: string; specName: string })`
- `lane-boot-failed/lane-boot-failed-error.ts` — `({ specName, instanceId, unready, logPaths }: { specName: string; instanceId: string; unready: readonly string[]; logPaths: readonly string[] })`
- `driver-unreachable/driver-unreachable-error.ts` — `({ instanceId, socketPath, cause }: { instanceId: string; socketPath: string; cause: unknown })`

**Edits**

- `packages/siegelense/src/contracts/registry-entry/registry-entry-contract.ts` — add
  `socketPath: absoluteFilePathContract.nullable()` after `pgids`.
- `packages/siegelense/src/contracts/registry-entry/registry-entry.stub.ts` — default it to `null`.
- `packages/siegelense/src/contracts/registry-entry/registry-entry-contract.test.ts` — every complete-row
  assertion gains the field, plus one `VALID:` row carrying a real socket path.
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.ts` and its test — a reservation
  writes `socketPath: null`.
- `packages/siegelense/src/brokers/instance/release/instance-release-broker.ts` and its test — a release
  clears it to `null` beside `pid` and `pgids`, because a tombstone's socket is gone.

**Depends on** nothing (the error classes); the registry edit depends on chunk 1 only.

**Tests** each error's `.test.ts` asserts the complete error object (`{ name, message }` plus each context
field) with `toStrictEqual` on the destructured shape, and `instanceof` both ways. `StepAmbiguousError`'s
test asserts the RENDERED message for a two-candidate case against an anchored regex — the message is what a
session reads, so a test asserting only that it throws is the false positive this repo's own bar refuses.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the ten error files and the five edited files>`

**Acceptance criteria, quoted**

> lines 1985–1988:
> ```
> click { target: '[data-testid="GUILD_ADD"]' }
> → ERROR  NO MATCH: 0 elements.
>    Nearest names on this page: GUILD_LIST, GUILD_ITEM_f52cd…, PIXEL_BTN.
>    Run `look` for the current key.
> ```

> line 1551: `| **No step ever picks among matches. Ambiguity THROWS, and the error carries the candidates with their refs** | `.first()` is live today in `click`, `type`, `waitFor`, `paste` and `screenshot`. It clicks BROWSE while you meant CREATE and hands back a clean-looking result. Zero matches throws too, naming near-miss testIds, because a misremembered id is the common case |`

> line 2128: `**Only the browser steps go missing with it, and they go missing LOUDLY.** A `look`, a `click` or a `hold` submitted`
> line 2129: `against a browserless instance is an error naming the spec, never an empty key — a reading that quietly returns nothing`
> line 2130: `is the `count: 0` problem arriving at the one place a walk cannot recover from it.`

> line 1666: `| **A reaped or pruned instance leaves a TOMBSTONE; what is gone answers as gone, never as empty**                      | `pruned at 03:14, olderThan 7d` is an answer. …`

---

### W4 — The lane spec as DATA (wave B, PARALLEL with W2 and W3)

**Creates**

- `packages/siegelense/src/contracts/url-path/` — `UrlPath`
- `packages/siegelense/src/contracts/lane-process-name/` — `LaneProcessName`
- `packages/siegelense/src/contracts/port-role/` — `PortRole`
- `packages/siegelense/src/contracts/lane-process/` — `LaneProcess`, fields as §2
- `packages/siegelense/src/contracts/lane-spec/` — `LaneSpec`, fields as §2. A `.refine` rejects a spec whose
  `processes` is empty, and one that rejects two processes claiming the same `portRole`.
- `packages/siegelense/src/statics/lane-spec/lane-spec-statics.ts` + `.test.ts` — the two built-in specs.
- `packages/siegelense/src/transformers/lane-spec-hash/lane-spec-hash-transformer.ts` + `.test.ts` —
  `({ spec }: { spec: LaneSpec }): SpecHash`. A stable canonical JSON of the spec through `createHash('sha256')`,
  truncated to a length `specHashContract`'s `/^[0-9a-f]{8,64}$/u` accepts.
- `packages/siegelense/src/brokers/lane-spec/find/lane-spec-find-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ specName }: { specName: SpecName }): LaneSpec`. Parses the named entry out of `laneSpecStatics` and
  throws naming the spec and listing the known names when it is absent.

**The two built-in specs, and what each carries.** Mirror `packages/web/test/siege-driver/siege-lane.ts`
lines 98–130 exactly for the env blocks, the `dev:no-watch` choice and the `DUNGEONMASTER_WEB_PORT`
requirement — that file is the measured shape and every line of it was paid for.

- `dungeonmaster-web` — three processes: `api` (`npm run dev:no-watch --workspace=@dungeonmaster/server`,
  `portRole: 'api'`, `readyPath: '/api/guilds'`, `logFileName: locationsStatics.siegelense.apiLog`),
  `web` (`npm run dev --workspace=@dungeonmaster/web`, `portRole: 'web'`, `readyPath: '/'`,
  `logFileName: locationsStatics.siegelense.webLog`) — and `browser: true`. Chromium is NOT a
  `LaneProcess`; it is the `browser` flag, because it is launched through Playwright rather than spawned.
- `dungeonmaster-headless` — the `api` process only, `browser: false`.

**`{apiPort}` and `{webPort}` are placeholders**, substituted into `args`, `env` and `readyPath` by the boot
broker in W11. The statics holds the template; nothing in `statics/` computes.

**Depends on** W1 (`locationsStatics.siegelense.apiLog` / `.webLog`).

**Tests** `lane-spec-statics.test.ts` asserts both complete specs with `toStrictEqual`, and asserts that
`dungeonmaster-headless.browser` is `false` and its `processes` length is derived by filtering
`dungeonmaster-web.processes` on `portRole === 'api'` rather than hardcoded — the two specs must not drift.
`lane-spec-hash-transformer.test.ts` asserts that ADDING a process changes the hash and that reordering an
`env` object's keys does NOT, because the second is what makes a profile comparable across machines.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twenty-one files>`

**Acceptance criteria, quoted**

> line 1691: `| The profile is keyed by the lane spec's content HASH                                                               | add a process to the spec and the hash changes, the profile is stale, measurement restarts. The "I added a second server" case is handled by construction rather than by remembering                                                                               |`

> line 1613: `| **A BROWSERLESS lane spec is a first-class spec, and the browser steps error against it BY NAME**                                          | an operational flow has no screen, and a spec is keyed by content hash, so the cheaper spec profiles itself and `capacity` allows more of them. A `look` answering an empty key instead of an error is `count: 0` where a walk cannot recover from it                    |`

> line 2119: `**A BROWSERLESS spec is just another spec, and the profile prices it on its own.** An operational flow has no screen to`

> line 1689: `| "All happy walks in parallel" means a POOL, and the pool size is MEASURED, not assumed                             | "three processes per instance" is a fact about THIS repo's lane spec, not about instances. A repo with one server is cheaper, one with two is not — and adding a second server here changes the right cap the moment it lands                                      |`

> line 2090: `| **`dev:no-watch`, never `dev`, for the lane's API server**                                                                    | `--conditions=source` puts every `packages/*/src` file in the watcher's graph; one save anywhere restarts the server and Vite's `/api` proxy answers with a bare 500 for ~1.5s                         |`

---

### W5 — The run family of contracts (wave C, PARALLEL with W6 and W7)

**Creates** under `packages/siegelense/src/contracts/`:

`step/`, `stopped-at/`, `run-request/`, `step-reading/`, `run-index/`, `shot-listing/`, `run-result/` —
fields exactly as §2, and `stepContract`'s six members exactly as §2's block.

`stepContract` is a `z.discriminatedUnion('step', [...])`. Every member is a `z.object` carrying `node`
and `expect` as optionals; `expect` takes `.default(stepStatics.defaults.expect)`.

**Depends on** W1 (statics), W2 (`Selector`, `NodeLabel`, `StepVerb`, `LocatorState`, `StopOn`, `RunStatus`,
`StepExpectation`, `ShotOpenReason`, `ReadingCount`, `StepCandidate`), W4 (`UrlPath`).

**Tests** `step-contract.test.ts` uses `describe.each` over `stepStatics.verbs.all` for the "every verb
parses its own minimal member" case, derived from the statics. Beyond that, one `INVALID:` per member for a
missing required field, and `EDGE: {expect omitted} => defaults to 'ok'`.

`shot-listing-contract.test.ts` must assert the COMPLETE object with `toStrictEqual` and therefore proves
`pixelChange` and `blank` are absent — a reviewer grading a later chunk against spec line 2809's example
should see them arrive, not find them sitting as `null`.

`run-result-contract.test.ts` covers, at minimum: `VALID:` a clean `done` run with `stoppedAt: null` ·
`VALID:` a `failed` run whose `stoppedAt` carries two candidates · `VALID:` a `timeout` run whose
`stoppedAt.error` names the target and the ceiling · `EMPTY: {shots: []} => parses` — a run of only `eval`
steps took no shots and that is a real answer.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twenty-one files>`

**Acceptance criteria, quoted**

> line 1627: `| The completion status is an index, not a payload                                                                                           | otherwise every run returns everything and the cap problem returns                                                                                                                                                                                                       |`

> lines 2809–2816:
> ```
>     { step: 1, path: 'run_2/step1.png', pixelChange: null,  blank: false, open: true,  why: 'start state' },
>     { step: 2, path: 'run_2/step2.png', pixelChange: '38%', blank: false, open: true,  why: 'large change',
>       node: 'guild-selected' },
>     { step: 3, path: 'run_2/step3.png', pixelChange: '0%',  blank: false, open: false },
>     { step: 4, path: 'run_2/step4.png', pixelChange: '0%',  blank: false, open: false,
>       node: 'chain-rendered' },
>     { step: 5, path: 'run_2/step5.png', pixelChange: '0%',  blank: true,  open: true,
>       why: 'BLANK — single colour #0d0907 across the whole frame' },
> ```
> (`pixelChange` and `blank` are chunk 3. The rest of each row is this chunk.)

> lines 2846–2862, the failing return, in particular:
> line 2852: `  stoppedAt: {`
> line 2853: `    step: 4, verb: 'click',`
> line 2854: `    error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',`

> line 101: `**A timeout must name the step.** "Timed out" alone is useless. "step 9 `waitFor` on`
> line 102: ``[data-testid=X]` never resolved after 10s" is a defect report. A hang is a finding, not a tool failure.`

> line 1585: `| The numbered MAP is built LAST and is OPTIONAL — `look` omits the field until it ships, then returns it only on `map: true` | the one trial arm that had it rendered three and opened none, reporting the key was enough. An absent field is honest where an empty one invites a session to wonder what went wrong                                 |`

---

### W6 — The instance and wire contracts (wave C, PARALLEL with W5 and W7)

**Creates** under `packages/siegelense/src/contracts/`:

`driver-request-kind/`, `driver-request/`, `driver-response/`, `instance-manifest/`, `kill-result/` —
fields exactly as §2.

**`driverRequestContract` and `driverResponseContract` carry an opaque `payload: ContentText`, not a typed
union.** The socket is a TRANSPORT; each end parses its own shape through `runRequestContract` /
`runResultContract` / `killResultContract`. A wire contract that named those shapes would make the transport
depend on every call it ever carries, and every new tool would edit it.

**Depends on** W2 (`ReadingCount`), chunk 1 (`InstanceId`, `SpecName`, `RepoLocalPath`, `EpochMs`,
`ProcessGroupId`), shared (`NetworkPort`, `AbsoluteFilePath`, `ContentText`).

**Tests** `instance-manifest-contract.test.ts` asserts a complete manifest with `toStrictEqual`, including
`evidence` and both `logs` entries as `RepoLocalPath` objects carrying `linkPresent: true`, AND a second
`VALID:` case where `linkPresent` is `false` — the absent-link branch is the whole point of chunk 1's
`repoLocalPathContract` and it must survive into the manifest rather than being flattened to a string.
`kill-result-contract.test.ts` asserts `EDGE: {reapedPgids: [33812]} => parses` — the orphan-reap path.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fifteen files>`

**Acceptance criteria, quoted**

> lines 2109–2112:
> ```
> → { instance: 'inst_7f3a', baseUrl: 'http://…:34173', home: '/tmp/dm-siege-…',
>     evidence: '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_7f3a/',
>     logs: { api: '…/api-server.log', web: '…/web-server.log' },
>     seeded: { guildSlug: 'siege-1', guildId: '7306b468-…' } }
> ```
> (`seeded` is chunk 3, with the recipes. The other four fields are this chunk.)

> line 2136: `**`evidence` is what a session with no record works from.** Everything `results` returns lives under it, and after the`
> line 2137: `instance is gone that directory is still there and still readable. There is no LOOKUP call to recover it later, so a`

> line 1470: `→ { instance: 'inst_c41e', queuedMs: 34000, aheadOfMe: 2, bootMs: 21000, … }`

> line 1473: `**Without `queuedMs`, a 55-second start is indistinguishable from a hang** — and a minion that decides the tool is`

> lines 2359–2360:
> ```
> kill { instance: 'inst_7f3a' }
> → { stopped: true, ports: 'released' }
> ```

> line 1172: `  reap — and `kill` accepts a dead instance's id for exactly that.`

---

### W7 — The two facade contracts (wave C, PARALLEL with W5 and W6)

**Creates**

- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` + `.test.ts` + `.stub.ts`
- `packages/siegelense/src/contracts/lane-session/lane-session-contract.ts` + `.test.ts` + `.stub.ts`

Shapes exactly as §2's two blocks. **Read §2's "The two facades" paragraph before writing a line** — the
reason the Playwright types are declared structurally rather than imported is an import rule, and an agent
that reaches for `import type { Page } from '@playwright/test'` in a contract will be blocked by the
pre-edit lint hook with a message that does not explain why.

**The stubs are where the functions come from.** Follow the contracts folder detail's "Mixed Data + Function
Stubs" pattern exactly: destructure the function props out, `contract.parse()` the data half (which is `{}`
here), and preserve the function references so a test can hand in a `jest.fn()`. Every method gets a default
implementation that returns an empty/zero answer, so a test only overrides what it cares about.

**Depends on** W2 (`Selector`, `StepCandidate`), W4 (`LaneProcess`, `PortRole`), chunk 1 (`SpecName`,
`PortPair`, `ProcessGroupId`).

**Tests** `browser-session-contract.test.ts` asserts that `BrowserSessionStub()` with no arguments returns a
usable session whose `countMatches` resolves to `0` and whose `bufferLengths()` is
`{ consoleLines: 0, networkLines: 0, websocketLines: 0 }`, and that a handed-in `jest.fn()` is the SAME
reference on the returned object — the reference-preservation rule is what the whole downstream test suite
depends on, and a stub that parses its functions silently breaks every `toHaveBeenCalledWith` in waves E–G.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

**Acceptance criteria, quoted**

> line 1635: `| Buffers are continuous; a run records its WINDOW, and its index counts only that window                                                     | the listeners are armed once at boot and never stop. An index counting the running total makes run 5 report 47 errors that are mostly run 1's                                                                                                                             |`

> lines 81–83:
> ```
> **The buffers are CONTINUOUS; each run records its WINDOW into them.** The lane's console, network and websocket
> listeners are armed once at boot and never stop — that is already true and is why they catch what a listener attached
> later would have missed. So a run does not reset them; it records where it started and stopped:
> ```

> line 90: `**A run's index counts its OWN window, never the running total.** Otherwise run 5 reports 47 console errors that are`

---

### W8 — The Playwright session adapter (wave D, PARALLEL with W9 and W10)

**Creates** under `packages/siegelense/src/adapters/playwright/session/`:

- `playwright-session-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ baseUrl, evidencePath }: { baseUrl: string; evidencePath: AbsoluteFilePath }): Promise<BrowserSession>`
- `listeners-layer-adapter.ts` + `.proxy.ts` + `.test.ts` — arms the four listeners and pushes into the three
  buffers. Layer files are allowed in `adapters/` and this one exists because the parent would otherwise pass
  300 lines.

**This is the ONLY file in the package that may import `@playwright/test`.** It launches Chromium, opens a
context against `baseUrl`, grants clipboard permissions on that origin, opens a page, arms the listeners, and
returns the `BrowserSession` facade closing over all of it. `packages/web/test/siege-driver/siege-lane.ts`
lines 204–341 is the measured shape for the launch and every listener; copy it, including
`BODY_SKIP_RESOURCE_TYPES`, `MAX_BODY_CHARS` and the `PLAYWRIGHT_BROWSERS_PATH` default.

**Four things the facade must do that the prototype does not:**

1. **`countMatches` / `describeMatches` never call `.first()` or `.last()`.** `describeMatches` evaluates in
   the page over `querySelectorAll` — never `querySelector`, per the package `CLAUDE.md` — and for each match
   walks UP for the nearest ancestor carrying a `data-testid`, which becomes that candidate's `within`.
2. **`nearestNames` returns the testIds on the page**, for a zero-match error. A simple `querySelectorAll('[data-testid]')`
   read of the attribute values, capped and sorted.
3. **`capture` passes `{ animations: 'disabled', caret: 'hide', path: filePath }`** on every screenshot.
4. **The three buffers are never cleared.** `readConsoleSince({ fromIndex })` slices; `bufferLengths()` reports
   the current ends.

**Depends on** W2, W7.

**Tests** the proxy mocks `@playwright/test`'s `chromium` via `registerMock`, staged on the launch options
object. Unit tests cover: `VALID: {two matches} => describeMatches returns both with their nearest-testid within` ·
`VALID: {no matches} => countMatches returns 0` · `VALID: {capture} => screenshot called with animations disabled and caret hidden`
— assert the OPTIONS object with `toStrictEqual`, because "capture was called" is the false positive this
whole item exists to avoid · `VALID: {console message} => readConsoleSince({fromIndex: 0}) returns it` ·
`EDGE: {readConsoleSince from the current length} => returns []` — the window rule.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

**Acceptance criteria, quoted**

> line 1601: `| Capture for COMPARISON runs with `animations: 'disabled'` and `caret: 'hide'`                                              | this UI animates on purpose, so two captures of one logical state are otherwise never identical and `pixelChange` is noise on every step. The byte-identity measured in `siege-verification-remainder.md` Part 2 was a STATIC screen and does not generalise |`

> lines 1785–1786:
> ```
> | `animations: 'disabled'` on screenshot | CSS animations and transitions, finished and frozen at their end state  |
> | `caret: 'hide'`                        | the text cursor, which otherwise blinks every capture into a difference |
> ```

> line 2080: `| **Never `querySelector` in eval source — `querySelectorAll` and count**                                                       | singular silently returns match one; lint cannot see inside the template literal                                                                                                                       |`

> line 1552: `| The no-pick rule is held by a LINT RULE over the command implementations, not by prose                       | `page.locator(t).first().click()` is the obvious line to write and the wrong one. `.first()`/`.last()` are banned outright there; `.nth()` only with a caller-supplied argument                                                                                   |`

> line 526: `- **Own text nodes, never `textContent`.** Recursive text is what pulled a whole stylesheet into a reading.`

---

### W9 — Process adapters (wave D, PARALLEL with W8 and W10)

**Creates** under `packages/siegelense/src/adapters/`:

- `child-process/spawn-detached/child-process-spawn-detached-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ command, args, cwd, env, stdoutFd, stderrFd }): { pid: ProcessId; pgid: ProcessGroupId }`. Spawns with
  `detached: true`, which is what makes the child a process-group leader.
- `process/kill-group/process-kill-group-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ pgid, signal }: { pgid: ProcessGroupId; signal: string }): AdapterResult`. Calls `process.kill(-pgid, signal)`.
  **Its `AdapterResult` says whether a signal was actually sent**, so the caller can skip a dead child.
- `process/is-alive/process-is-alive-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ pgid }: { pgid: ProcessGroupId }): boolean`. `process.kill(-pgid, 0)` inside a try, `false` on `ESRCH`.
  This is what turns the SIGKILL pass into a no-op for a group that already went, and it is also what
  `status` and `cleanup` will read later.

**`enforce-folder-return-types` refuses `Promise<void>` on an adapter.** All three return a value.

**Depends on** chunk 1's `processGroupIdContract`, shared's `processIdContract` and `adapterResultContract`.

**Tests** each proxy mocks the node builtin via `registerMock` addressed on the arguments the adapter really
passes — `process.kill` is addressed on `[-pgid, signal]`, with the NEGATED pgid, because that negation is
the whole mechanism and a proxy keyed on the positive number would pass while the implementation killed one
process. Cover `ERROR: {ESRCH} => isAlive returns false` and `VALID: {alive group} => returns true`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 1087: `| servers spawn `detached: true` so the whole process GROUP can be killed | `npm run` is a wrapper and the real listener is a grandchild via `sh -c`. Killing the child leaves the listener holding the port              |`

> line 2086: `| **Kill the process GROUP, not the child — and skip the signal for one that already exited**                                   | `npm run` is a wrapper; the listener is a grandchild via `sh -c`. And signalling a dead child logs `kill ESRCH` on every clean teardown, which reads as a failure in the one log a later session opens |`

> line 1089: `| **skip the signal for a child that already exited**                     | otherwise every clean teardown logs `kill ESRCH`, "which reads as a failure in the one log a later session opens to find out what went wrong" |`

> line 1132: `- **A heartbeat file per instance** — pid, instance id, **the process-group ids of every child**, and a timestamp`

---

### W10 — Socket adapters, fs adapters and the run path resolvers (wave D, PARALLEL with W8 and W9)

**Creates** under `packages/siegelense/src/adapters/`:

- `net/unix-request/net-unix-request-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ socketPath, request, timeoutMs }: { socketPath: AbsoluteFilePath; request: DriverRequest; timeoutMs: number }): Promise<DriverResponse>`.
  Connects, writes one newline-terminated JSON frame, reads one back, closes. Rejects with the socket's own
  error on `ENOENT` / `ECONNREFUSED` — the caller wraps it in `DriverUnreachableError`.
- `net/unix-serve/net-unix-serve-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ socketPath, onRequest }: { socketPath: AbsoluteFilePath; onRequest: (args: { request: DriverRequest }) => Promise<DriverResponse> }): Promise<AdapterResult>`.
  Unlinks a stale socket file first, then listens.
- `fs/rm/fs-rm-adapter.ts` + `.proxy.ts` + `.test.ts` — `({ dirPath }): Promise<AdapterResult>`,
  `rm(dirPath, { recursive: true, force: true })`.
- `fs/append-file/fs-append-file-adapter.ts` + `.proxy.ts` + `.test.ts` — `({ filePath, contents }): Promise<AdapterResult>`.
  This is the per-step transcript flush.
- `fs/open-fd/fs-open-fd-adapter.ts` + `.proxy.ts` + `.test.ts` — `({ filePath }): FileDescriptor` and its
  companion `fs/close-fd/`. A spawned process's stdio needs a real fd, and `openSync`/`closeSync` are the only
  way to get one. `fileDescriptorContract` is a new branded `z.number().int().nonnegative()` in this item.

**Creates** under `packages/siegelense/src/brokers/locations/`:

- `socket-path-find/locations-socket-path-find-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath` →
  `<os.tmpdir()>/dm-siege-sockets/<instanceId>.sock`. SYNCHRONOUS and no `Promise`, matching every other
  locations broker in this package.
- `run-paths-find/locations-run-paths-find-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ evidencePath, runId }: { evidencePath: AbsoluteFilePath; runId: RunId }): { transcript: AbsoluteFilePath; storedReturn: AbsoluteFilePath; shotsDir: AbsoluteFilePath }`.
  `<evidence>/runs/run_N.jsonl`, `<evidence>/runs/run_N.json`, `<evidence>/runs/run_N/`.
- `shot-path-find/locations-shot-path-find-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ shotsDir, step }: { shotsDir: AbsoluteFilePath; step: StepIndex }): AbsoluteFilePath` →
  `<shotsDir>/step<N>.png`, from `locationsStatics.siegelense.shotPrefix` and `.shotExtension`.

**Every one of these composes `locationsRootPathFindBroker()` or takes its base as a parameter — none
re-derives the home.** Chunk 1's `locationsRootPathFindBroker()` is synchronous and takes no parameters;
`locationsInstanceEvidencePathFindBroker({ instanceId, guildId })` is synchronous too.

**Depends on** W1 (the new location literals), W6 (`DriverRequest` / `DriverResponse`), chunk 1.

**Tests** the socket adapters' proxies mock `node:net` — `createConnection` and `createServer` — addressed on
the socket path. `run-paths-find` asserts all three composed absolute strings with `toBe`, never `toContain`.
`socket-path-find` asserts the composed string AND asserts its BYTE LENGTH is under 108 for a
32-hex instance id under a realistic tmpdir — the ceiling is why the path is not under the siegelense root
and an assertion is the only thing that keeps it there.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twenty-four files>`

**Acceptance criteria, quoted**

> line 1616: `| The MCP tools are thin clients over a local socket; the DRIVER holding the browsers is a separate process                                  | about lifetime, not transport: an MCP rebuild-and-reconnect would otherwise kill every live instance mid-pass                                                                                                                                                            |`

> lines 35–37:
> ```
> > takes work over the filesystem, which is the only channel open to an agent that has Write and Read
> > but cannot hold a socket between turns
> ```
> line 38: `That argues the **driver must be a persistent process** — true, a browser has to outlive a turn. It does **not** argue`
> line 39: `the transport must be files. Those two got welded together and only the first is load-bearing. An MCP server is itself a`

> line 1012: `So the boundary is explicit: **a snapshot covers the STATE subtree only. Logs, captures and the run transcript sit`
> line 1013: `outside it and survive every reset at every level.** Evidence accumulates forward; only state rewinds.`

---

### W11 — The lane boot broker (wave E, PARALLEL with W12 and W13)

**Creates**

- `packages/siegelense/src/transformers/lane-placeholder-substitute/lane-placeholder-substitute-transformer.ts`
  + `.test.ts` — `({ template, ports }: { template: string; ports: PortPair }): ContentText`. Replaces
  `{apiPort}` and `{webPort}`. Pure, so the spec's templates are testable without a process.
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ spec, ports, instanceId, homePath, evidencePath }: { spec: LaneSpec; ports: PortPair; instanceId: InstanceId; homePath: AbsoluteFilePath; evidencePath: AbsoluteFilePath }): Promise<LaneSession>`
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ url, deadlineMs }: { url: string; deadlineMs: number }): Promise<boolean>`. **Recursion with an early
  return, never `while (true)`** — `siege-lane.ts`'s `waitForHttp` (lines 167–183) is the exact shape and it
  is already in this repo.
- `packages/siegelense/src/adapters/fetch/probe/fetch-probe-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ url, timeoutMs }): Promise<boolean>`. A refused connection is `false`, not a throw; the DEADLINE in the
  ready-wait broker is what turns a persistent refusal into a reported failure.

**What `lane-boot-broker` does, in order:** mkdir the throwaway home and the evidence dir · open one log fd
per process · spawn each `LaneProcess` detached, with its placeholders substituted and the spec's env merged
over `process.env` · `Promise.all` the ready waits against each process's `readyPath` · on any failure, kill
every group with SIGKILL and throw `LaneBootFailedError` naming which processes were unready and the log
paths · when `spec.browser` is true, launch the browser session through W8's adapter · return the
`LaneSession` carrying every pgid.

**Depends on** W4, W7, W8, W9, W10, chunk 1's `portPairContract`.

**Tests** unit only, with the adapter proxies staging each case. At minimum:
`VALID: {web spec} => spawns three groups and returns a session with a browser` — assert the spawn calls'
complete argument objects with `toStrictEqual`, including `detached: true` and the substituted port in the
env · `VALID: {headless spec} => spawns one group and returns browser: null` ·
`ERROR: {api never ready} => kills every spawned group with SIGKILL and throws LaneBootFailedError naming 'api'`
— assert the kill calls, because a boot failure that leaks the processes it just spawned is the leak this
whole chunk exists to make impossible · `ERROR: {web ready, api not} => the error names only 'api'`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fourteen files>`

**Acceptance criteria, quoted**

> lines 1098–1105, the six quiet failures, in particular:
> line 1102: `| partial teardown — browser closes, servers survive | ports bound, an instance half-gone and not listed as either                     |`
> line 1103: `| a port not released before the next allocation     | two instances on one port, which reads as a walk measuring another walk's state |`

> line 1618: `| Ports are CLAIMED in the registry before they are bound                                                                                    | two sessions asking the OS for a free pair in the same moment can overlap, and two instances on one port reads as a walk measuring another walk's state                                                                                                                  |`

> lines 125–128 of `packages/web/test/siege-driver/siege-lane.ts`:
> ```
>       // Vite must bind the SAME port the browser is pointed at. Both sides fall back to
>       // `API port + 1`, and those fallbacks agree only while one launcher picks both ports —
>       // netFreePortPairAdapter asks the OS for them independently, so they usually do not.
>       DUNGEONMASTER_WEB_PORT: String(webPort),
> ```

> line 1125: `| a CHILD dies — the API server OOMs, the browser crashes | **yes**                     | the driver notices and reports WHICH child, with its last log lines. This is the recoverable case and the common one                 |`

---

### W12 — The lane teardown broker (wave E, PARALLEL with W11 and W13)

**Creates**

- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ session, instanceId }: { session: LaneSession; instanceId: InstanceId }): Promise<KillResult>`

**The sequence, and every step of it is an assertion in W20:** close the browser if there is one · SIGTERM
every pgid, **skipping any group `processIsAliveAdapter` says is gone** · wait `driverStatics.teardown.graceMs` ·
SIGKILL every pgid still alive, skipping the rest · close both log fds · `fsRmAdapter` the THROWAWAY HOME ·
**never touch the evidence directory** · unlink the socket file · return a `KillResult` naming the ports
released, the pgids reaped, `homeRemoved: true`, and `evidenceKept` as the repo-local path.

**Teardown is a first-class concern with its own broker, not a `finally` block in the driver.** Spec 1659
says so, and the reason is that a `finally` cannot be dispatched by a `cleanup` call from another process —
which is exactly what W20's SIGKILLed-driver assertion requires.

**Depends on** W6, W7, W9, W10, chunk 1's `instanceReleaseBroker` and `locationsRepoLinkPathFindBroker`.

**Tests** unit, with the process adapter proxies staging each case. At minimum:
`VALID: {three live groups} => SIGTERM each, then SIGKILL each` — assert both call lists with
`toHaveBeenCalledWith` on the NEGATED pgid, paired with the counts ·
`VALID: {a group already exited} => no signal is sent to it` — `toHaveBeenCalledTimes` on the kill adapter
paired with the calls that DID happen, which is this repo's rule for a zero-call assertion ·
`VALID: {teardown} => the home is removed and the evidence path is never passed to fsRmAdapter` — assert the
complete `fsRmAdapter` call list with `toStrictEqual`, so an evidence path appearing in it FAILS rather than
passing a "the home was removed" check · `VALID: {no browser} => headless teardown still kills its group`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

**Acceptance criteria, quoted**

> line 1088: `| SIGTERM, a 3-second grace, then SIGKILL                                 | a server given no grace leaves a half-written log                                                                                             |`

> line 1090: `| the throwaway home is removed; the instance's EVIDENCE directory is NOT | logs, captures and the transcript are evidence and outlive the instance. See the state-versus-evidence boundary above                         |`

> line 1107: `**And one the new design introduces:** `kill` must not take the evidence with it. A session that kills before writing`
> line 1108: `its record would otherwise lose the logs, captures and transcript that were the whole point. Evidence outlives the`
> line 1109: `instance; only the throwaway state goes.`

> line 1680: `| `kill` removes the throwaway STATE and never the evidence                                                             | a session that kills before writing its ROUND RECORD would otherwise lose the logs, captures and transcript that were the point                                                                                    |`

> line 1659: `| Teardown is a first-class concern with its own tests, not a `finally` block                                           | every leak is invisible to the session that caused it — the walk completes, the return reads clean, three processes stay up. Under a pool of three parallel instances that compounds fast                          |`

> line 2087: `| **`kill` removes the throwaway home and never the evidence directory**                                                        | logs, captures and the transcript are evidence and outlive the instance                                                                                                                                |`

---

### W13 — The no-pick rule (wave E, PARALLEL with W11 and W12)

**Creates**

- `packages/siegelense/src/brokers/step/target-resolve/step-target-resolve-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ session, target, within }: { session: BrowserSession; target: string; within?: string }): Promise<AdapterResult>`.
  Counts the matches. **One** → returns `{ success: true }`. **More than one** → `describeMatches` and throw
  `StepAmbiguousError` carrying every candidate. **Zero** → `nearestNames` and throw `StepNoMatchError`
  naming them.
- `packages/siegelense/src/guards/is-browser-step/is-browser-step-guard.ts` + `.test.ts` —
  `({ verb }: { verb: StepVerb }): boolean`. True when `verb` is in `stepStatics.verbs.browser`. Pure, no proxy.
- `packages/siegelense/src/guards/is-targeting-step/is-targeting-step-guard.ts` + `.test.ts` —
  `({ step }: { step: Step }): boolean`. True when the member carries a `target`.

**Every targeting step goes through `step-target-resolve-broker` before it acts. No exceptions, and this
is the reason the broker exists as its own file** rather than as three copies of a count-and-branch inside
`click`, `type` and `waitFor` — three copies is three places for `.first()` to come back.

**Depends on** W2, W3, W5, W7.

**Tests** unit, with `BrowserSessionStub` handing in `jest.fn()`s. At minimum:
`VALID: {one match} => returns success` · `INVALID: {two matches} => throws StepAmbiguousError carrying both candidates`
— assert the thrown error's complete `candidates` array with `toStrictEqual`, not just that it threw ·
`EMPTY: {zero matches} => throws StepNoMatchError naming the nearest testIds` — assert the `nearest` array ·
`VALID: {within narrows two matches to one} => returns success` — this is the RECOVERY the ambiguous error
offers, and a suite that never proves it works has documented a dead end.

`is-browser-step-guard.test.ts` uses `it.each` over `stepStatics.verbs.all` with the expected value derived by
membership in `stepStatics.verbs.browser` — one statics drives both the iteration list and the expected set.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the seven files>`

**Acceptance criteria, quoted**

> line 1969: `Every targeting step has exactly three outcomes:`

> lines 1971–1974:
> ```
> click { target: '[data-testid="subagent-chain-duration"]' }
> → one match. Proceeds.
> ```

> line 1993: `their refs, so recovery is one step rather than a hunt. A zero-match error names the near misses for the same reason,`

> line 1967: `and nothing flags it. That is how a session clicks BROWSE while meaning CREATE and gets a clean-looking result back.`

> line 2005: `**A local lint rule over the command implementations.** `.first()` and `.last()` on a locator are never legitimate`
> line 2006: `there: both mean "resolve an ambiguity the caller did not resolve", which is the whole defect. …`

---

### W14 — The six step brokers and the dispatcher (wave F, alone)

**Creates** under `packages/siegelense/src/brokers/step/`, each as `step-<verb>-broker.ts` + `.proxy.ts` + `.test.ts`:

- `goto/` — `({ session, path }): Promise<ContentText>` → the reading is the resolved URL
- `wait-for/` — `({ session, target, within, state, timeoutMs }): Promise<ContentText>` → the reading names
  the target and the state that resolved, or the ceiling it hit
- `click/` — `({ session, target, within, timeoutMs }): Promise<ContentText>`
- `type/` — `({ session, target, within, value, timeoutMs }): Promise<ContentText>`
- `screenshot/` — `({ session, filePath }): Promise<ContentText>` → the reading is the path
- `eval-source/` — `({ session, source }): Promise<ContentText>` → the reading is the stringified value

Plus `dispatch/step-dispatch-broker.ts` + `.proxy.ts` + `.test.ts` —
`({ lane, step, index, shotPath }: { lane: LaneSession; step: Step; index: StepIndex; shotPath: AbsoluteFilePath | null }): Promise<StepReading>`.
It: refuses a browser step against `lane.browser === null` with `BrowserStepUnsupportedError` naming the spec ·
runs `stepTargetResolveBroker` first for a targeting step · calls the verb's broker · captures to `shotPath`
when one was given · stamps `startedAtMs` / `endedAtMs` / `node` / `expected` · returns the `StepReading`.

**`expect: 'error'` inverts the outcome, it does not suppress it.** A step declaring `expect: 'error'` that
THROWS is `ok: true`; one that SUCCEEDS is `ok: false` and stops the batch exactly as an unexpected failure
would. That inversion belongs in the dispatcher, once, not in six brokers.

**Depends on** W5, W7, W8, W13, W3.

**Tests** unit, with `BrowserSessionStub` and `LaneSessionStub`. Every verb gets its own happy case asserting
the exact reading string with `toBe`. The dispatcher gets, at minimum:
`VALID: {click on a single match} => returns a reading with ok true and the shot path` ·
`INVALID: {browser step against a headless lane} => throws BrowserStepUnsupportedError naming the spec` —
assert the message with an anchored regex containing the spec name ·
`VALID: {expect error, step throws} => returns ok true` ·
`INVALID: {expect error, step succeeds} => returns ok false` — this pair is spec line 1639's whole point and
it is the one an implementation gets backwards ·
`VALID: {node label} => the reading carries it` ·
`VALID: {non-acting step} => shot is null`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twenty-one files>`

**Acceptance criteria, quoted**

> line 1639: `| A step declares `expect: 'error'` rather than the batch loosening                                                                          | an attack wants a 400; halting there makes every attack a one-step batch. And a step expecting failure that SUCCEEDS is itself a finding                                                                                                                                 |`

> lines 2608–2610:
> ```
> `expect: 'error'` means a failure here is the outcome under test: the batch records it and carries on. **A step carrying
> `expect: 'error'` that SUCCEEDS is itself a finding** — the attack landed and nothing refused it — and it stops the
> batch exactly as an unexpected failure would.
> ```

> line 1641: `| An acting step ends on SETTLE — network, paint and DOM quiet together — with a ceiling, not a timeout                                       | a fixed timeout is wrong both ways, and a step that hits a ceiling reports WHAT was still busy, which is actionable, where a timeout reports only that time passed                                                                                                       |`
> (Chunk 2 delivers the CEILING half — a step that hits it reports the target it was waiting on. The settle triple is chunk 3; §1 says so.)

> line 1550: `| A step returns a READING, never a verdict on a unit                                                          | `siege-command.ts`'s founding rule. Comparing two measured values is still a reading; deciding a unit passes is not                                                                                                                                               |`

---

### W15 — The run executor (wave G, alone)

**Creates**

- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ lane, instanceId, runId, steps, stopOn }: { lane: LaneSession; instanceId: InstanceId; runId: RunId; steps: readonly Step[]; stopOn: StopOn }): Promise<RunResult>`
- `packages/siegelense/src/brokers/run/transcript-append/run-transcript-append-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ transcriptPath, reading }: { transcriptPath: AbsoluteFilePath; reading: StepReading }): Promise<AdapterResult>`.
  One JSON line appended. **Called after every step, before the next one begins.**
- `packages/siegelense/src/brokers/run/return-write/run-return-write-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ storedReturnPath, result }: { storedReturnPath: AbsoluteFilePath; result: RunResult }): Promise<AdapterResult>`.
  Writes `runs/run_N.json` — the run's own return, so `results { instance, run }` with no `step` and no
  `kind` has something to answer with in chunk 3.
- `packages/siegelense/src/transformers/run-index-compute/run-index-compute-transformer.ts` + `.test.ts` —
  `({ consoleLines, networkLines, serverLines }): RunIndex`. Pure counting over the WINDOW's slices.
- `packages/siegelense/src/transformers/shot-open-decide/shot-open-decide-transformer.ts` + `.test.ts` —
  `({ shots, failedStep }: { shots: readonly ShotListing[]; failedStep: StepIndex | null }): readonly ShotListing[]`.
  Sets `open: true` with a `why` on the FIRST shot (`'start'`), the LAST (`'end'`), and the failing step
  (`'failed'`). Pure, so the policy is testable without a browser.

**What the executor does, in order:** record `lane.browser.bufferLengths()` and `lane.serverLogLength()` as
the window's start · mkdir the shots dir · for each step, mint its `StepIndex` starting at
`instanceLifecycleStatics.numbering.firstStep`, resolve its shot path when the verb is in
`stepStatics.verbs.acting`, dispatch it, APPEND the reading to the transcript, and stop when
`stopOn === 'error'` and the reading is not `ok` · compute the index over the window's slices · run the
shot-open policy · assemble the `RunResult` · WRITE it to `runs/run_N.json` · return it.

**The step numbering restarts at 1 for every run, and the shots dir is namespaced by run.** Chunk 1 pinned
the rule in `stepIndexContract`; this is the file that has to obey it.

**Depends on** W5, W6, W10, W14, chunk 1's `instanceLifecycleStatics`.

**Tests** unit, with the dispatcher proxy staging each step's reading. At minimum:
`VALID: {five ok steps} => status done, stepsRun 5, stoppedAt null` ·
`VALID: {step 3 fails, stopOn error} => status failed, stepsRun 3, stoppedAt names step 3 and its verb, steps 4 and 5 never dispatched`
— assert the dispatcher's call count paired with the calls that DID happen ·
`VALID: {step 3 fails, stopOn never} => status failed, stepsRun 5` ·
`VALID: {two runs on one lane} => the second run's first step is step 1 and its shots are under runs/run_2/`
— this is the per-run numbering invariant and it is the assertion a suite that tests one run in isolation
never makes ·
`VALID: {run 2 index} => counts only the lines that arrived after run 1's end` — stage the buffer to hold
run 1's lines already, and assert run 2's `console.errors` is the WINDOW's count, not the total. A suite that
starts from an empty buffer passes whether or not the window is implemented ·
`VALID: {transcript} => appended once per step, in order, before the result is written` — assert the append
adapter's complete call list with `toStrictEqual` ·
`VALID: {shot policy} => first and last open with their why, middles closed` ·
`VALID: {failing run} => the failing step's shot is open with why 'failed'`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the seventeen files>`

**Acceptance criteria, quoted**

> line 1630: `| Step numbers restart at 1 per run; screenshots are namespaced by run                                                                       | otherwise run 2 silently overwrites run 1's evidence and `stoppedAt: { step: 4 }` is ambiguous                                                                                                                                                                           |`

> line 1638: `| A batch stops on first failure BY DEFAULT, overridable per step with `expect: 'error'` and per batch with `stopOn: 'never'`                | batching is the only way a sub-second race is reachable, and stopping avoids seven wasted steps after a broken one — but an adversarial step wants its failure, so the exception is per step rather than a looser batch                                                  |`

> line 1634: `| **`results { instance, run }` with no `step` and no `kind` returns that run's stored return** — index, shot list, `stoppedAt`              | the index and the `open: true` flags are produced by `run`, and a fixer never made the run. Without this it has to guess which kinds to query, which is the everything-query the index exists to prevent                                                                 |`

> line 1592: `| SCREENSHOTS are captured always, and the RUN lists every one with an `open: true` flag                                     | capturing is cheap and opening costs real context. Putting the policy in the response rather than in prompt text means no prompt carries it, no session remembers it, and "did I get a screenshot here?" is answered before it is asked                      |`

> lines 658–661:
> ```
> - **always capture** — the evidence trail is complete whether or not anyone looked
> - **report how much the picture CHANGED**, as one number against the previous capture
> - **the RUN lists every shot it took and flags which to open** — start, end, and anything the change number makes worth
>   a look. The policy lives in the tool, so no prompt has to carry it and no session has to remember it
> ```
> (the middle row — the change number — is chunk 3. The first and third are this chunk.)

> line 2840: `That is what makes the whole service work. **Read the index, then query only what it points at.**`

> line 1752: `| evidence is APPEND-ONLY and OUTLIVES its instance — no reset at any level removes a log line, a capture or a transcript entry, and `kill` removes none of them | …`

---

### W16 — The driver process (wave H, PARALLEL with W17)

**Creates**

- `packages/siegelense/src/state/driver-session/driver-session-state.ts` + `.proxy.ts` + `.test.ts` —
  holds the ONE lane this driver process owns, its run counter, and its last-activity timestamp. Methods:
  `set({ lane })`, `lane()`, `nextRunId()`, `touch()`, `lastActivityMs()`, `clear()`.
  **This REPLACES the unreferenced scaffold `src/state/siegelense/siegelense-state.ts`**, which is a
  key/value `Map` nothing imports and no barrel exports. Delete that folder and its three files.
- `packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ request }: { request: DriverRequest }): Promise<DriverResponse>`. Three kinds: `ping` answers ok;
  `run` parses the payload through `runRequestContract` and delegates to `runExecuteBroker`; `kill` delegates
  to `laneTeardownBroker`, marks the registry row through `instanceReleaseBroker`, and signals the idle loop
  to stop.
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId, guildId, lane }): Promise<AdapterResult>`. One beat: `heartbeatWriteBroker({ instanceId, pid, pgids, guildId })`.
  The TICKER is the startup file's `setInterval` at `instanceLifecycleStatics.heartbeat.intervalMs`.
- `packages/siegelense/src/flows/driver/driver-flow.ts` + `driver-flow.integration.test.ts` —
  `({ instanceId }: { instanceId: InstanceId }): Promise<AdapterResult>`. Reads the registry row, resolves the
  spec, boots the lane, stamps `bootedAtMs` / `pid` / `pgids` / `socketPath` on the row through
  `registryUpdateBroker`, releases the boot lock, starts the heartbeat ticker, listens on the socket, and
  returns when the idle deadline passes or a `kill` arrives.
- `packages/siegelense/src/startup/start-siegelense-driver.ts` + `.integration.test.ts` —
  `StartSiegelenseDriver({ instanceId }: { instanceId: string }): Promise<void>`. Parses the id, delegates to
  `DriverFlow`, and installs the `SIGINT`/`SIGTERM` handlers that tear the lane down.

**Edits**

- `packages/siegelense/src/startup/start-siegelense.ts` — replace the scaffold. `StartSiegelense` today is an
  OBJECT with a `.run({ input: string })` method that echoes a string; it becomes
  `StartSiegelense({ args }: { args: readonly string[] }): Promise<AdapterResult>` delegating to `SiegelenseFlow`.
- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` — replace the scaffold. It routes `driver` to
  `SiegelenseDriverResponder` and the bare invocation to `SiegelenseFleetResponder`. **A flow holds no
  branching logic of its own beyond the route table**, exactly as `CliFlow` does.
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts` — delete it and its two
  companions; it is the scaffold `SiegelenseRunResponder({ input: string })`.
- **Creates** `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.ts` + `.proxy.ts` + `.test.ts`
  and `packages/siegelense/src/responders/siegelense/fleet/siegelense-fleet-responder.ts` + `.proxy.ts` + `.test.ts`.
  The fleet responder reads the registry and writes a table to stdout through `process.stdout.write` —
  never `console.log`.
- `packages/siegelense/startup.ts` and `packages/siegelense/flows.ts` — add the new entry files.
- `packages/siegelense/state.ts` — NEW barrel, plus its `./state` entry in `package.json`'s `exports` map.

**The idle close is recursion with a deadline, not `while (true)`.** `siege-driver.ts`'s `pump`
(lines 153–171) is the shape and it is already in this repo.

**Depends on** W11, W12, W15, W10, chunk 1's registry and heartbeat brokers.

**Tests** the two `.integration.test.ts` files use `installTestbedCreateBroker` with a temp dir under the OS
`/tmp`. They drive the `dungeonmaster-headless` spec, never `dungeonmaster-web`, so a suite does not boot
Chromium to prove a socket answers. At minimum, against real files and a real socket:
`VALID: {driver boots} => the registry row carries bootedAtMs, a pid, at least one pgid and a socketPath` ·
`VALID: {ping} => answers ok over the socket` ·
`VALID: {heartbeat} => heartbeat.json exists under the evidence dir and its beatAtMs advances between two beats` ·
`VALID: {kill over the socket} => the driver returns, the home is gone, the evidence dir remains` ·
`VALID: {browser step against the headless lane} => the run's stoppedAt names the spec`.
Integration tests MAY use `beforeAll`/`afterAll` — `jest/no-hooks` is off for `*.integration.test.ts` — and
the testbed's `cleanup()` belongs in `afterAll`.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <every created and edited file>`

**Acceptance criteria, quoted**

> lines 45–47:
> ```
> start    → instance id
>   └─ the instance owns: an API server, a Vite server, a browser,
>      a throwaway home, and both server log files
> ```

> line 108: `change mid-pass would kill every live instance. The MCP tools are thin clients over a local socket to a driver that`
> line 109: `outlives them. The instance also already closes itself on an idle timeout, which is the right ownership and should not`
> line 110: `move.`

> line 1658: `| `kill` is mandatory and explicit                                                                                      | a session's final response does not reap an instance it did not parent. The idle timeout is a backstop, not the mechanism                                                                                          |`

> line 1672: `| Each instance keeps a HEARTBEAT FILE carrying its pid, instance id and every child's PROCESS-GROUP ID                 | after a SIGKILL nothing in memory holds those pgids, so without the file the orphans cannot be found, only guessed at                                                                                              |`

> line 1092: `**The vulnerability the current design names and does not solve** is in the driver's own comment:`
> line 1093: `servers are spawned detached "which also means **nothing reaps them if this process is interrupted**."`

> line 1824: `| the command        | `dungeonmaster siegelense`                                                                                                                                   |`

---

### W17 — `start`, `run` and `kill` as brokers (wave H, PARALLEL with W16)

**Creates** under `packages/siegelense/src/brokers/instance/`:

- `start/instance-start-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ specName, questId, guildId }: { specName: SpecName; questId: QuestId | null; guildId: GuildId | null }): Promise<InstanceManifest>`.
  In order: resolve the spec and hash it · count reservations for `aheadOfMe` · `instanceReserveBroker`
  (chunk 1) · `bootLockAcquireBroker({ instanceId })` (chunk 1), timing the wait for `queuedMs` · spawn
  `dungeonmaster siegelense driver --instance <id>` detached · poll the driver's socket with a `ping` until it
  answers or the boot deadline passes · read the row back for the ports and paths · resolve every returned
  path through `locationsRepoLinkPathFindBroker` · return the manifest. **The boot lock is released by the
  DRIVER**, not here, because the lock covers the boot and the boot finishes inside the driver.
- `run/instance-run-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId, steps, stopOn }: { instanceId: InstanceId; steps: readonly Step[]; stopOn: StopOn }): Promise<RunResult>`.
  Reads the row for `socketPath`, sends one `run` request, parses the response payload through
  `runResultContract`.
- `kill/instance-kill-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }: { instanceId: InstanceId }): Promise<KillResult>`. Sends `kill` down the socket. **On
  `DriverUnreachableError`, takes the ORPHAN REAP path instead**: read the instance's `heartbeat.json`,
  SIGTERM-then-SIGKILL every pgid it names, remove the throwaway home, mark the row `killed`, and return a
  `KillResult` whose `reapedPgids` says which groups it took. That path is the only recovery from a SIGKILLed
  driver, and `cleanup` will call the same broker in chunk 4.

**Depends on** W5, W6, W9, W10, W12, chunk 1's `instanceReserveBroker`, `instanceReleaseBroker`,
`bootLockAcquireBroker`, `registryReadBroker`, `locationsRepoLinkPathFindBroker`.

**Tests** unit, with the socket and process adapter proxies staging each case. At minimum:
`VALID: {start} => reserves, acquires the lock, spawns the driver command with the instance id, and returns a manifest whose evidence path is repo-local`
— assert the spawn call's complete argument object with `toStrictEqual`, including the `--instance` flag ·
`VALID: {start with two reservations ahead} => aheadOfMe is 2` ·
`VALID: {start where the lock was held 34s} => queuedMs is 34000` — stage `Date.now` through the proxy; never
construct the timestamp by hand ·
`ERROR: {driver never answers ping} => throws LaneBootFailedError` ·
`VALID: {run} => sends one run request and returns the parsed RunResult` ·
`VALID: {kill, driver answers} => returns stopped true and the socket got exactly one kill request` ·
`ERROR: {kill, socket refused} => reaps the heartbeat's pgids and returns them in reapedPgids` — assert the
kill-group calls with `toHaveBeenCalledWith` on the negated pgids. **This last one is the SIGKILLed-driver
path and it is the test most likely to be skipped**, because the happy path passes without it.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 1135: `- **Reaping on next contact.** Any instance whose heartbeat is older than a few beats is presumed dead: `start` and`
> line 1136: `  `capacity` sweep opportunistically, and `cleanup` does it explicitly. They kill its groups, remove its home, and SAY`
> line 1137: `  SO. That is the only recovery path there is.`

> line 1128: `| the DRIVER is SIGKILLed                                  | **no**                      | nothing of ours runs. Recovery is entirely what was already on disk                                                                  |`

> line 1463: `So `start` queues. It admits at most one boot at a time, and refuses past the pool size.`
> (the refusal half is chunk 3 — §1 says so)

> line 1465: `**A queued `start` BLOCKS, and says that it waited.** Blocking matches `run`, and the alternative — a handle to poll —`

> line 1699: `| A queued `start` BLOCKS and reports `queuedMs` and `aheadOfMe`                                                     | without them a 55-second start is indistinguishable from a hang, and a minion that decides the tool is broken reports a `wall` — halting a quest over a queue working as designed                                  |`

> line 2089: `| **Every path handed back is repo-local, through `<repoRoot>/.siegelense`**                                                    | a shot is only evidence if the reader's `Read` reaches it. Same reason `npm run prod` keeps its home inside this repo                                                                                  |`

---

### W18 — Register `siegelense-start`, `siegelense-run` and `siegelense-kill` (wave I, PARALLEL with W19)

**This is the ~29-file cascade `packages/mcp/CLAUDE.md` documents. Read that file before starting, and trace
`get-quest-summary` through it as the file instructs.** `ArchitectureFlow`
(`packages/mcp/src/flows/architecture/architecture-flow.ts`) is the registration template — six entries, one
handle responder, `zodToJsonSchema` over each input contract with `{ $refStrategy: 'none' }`.

**Creates** in `packages/mcp`:

- `src/contracts/siegelense-start-input/`, `src/contracts/siegelense-run-input/`,
  `src/contracts/siegelense-kill-input/` — each `-contract.ts` + `-contract.test.ts` + `.stub.ts`. Each is
  `.strict()`. `siegelenseRunInputContract`'s `steps` reuses `@dungeonmaster/siegelense/contracts`'
  `stepContract`; do not re-declare the union.
- `src/responders/siegelense/handle/siegelense-handle-responder.ts` + `.proxy.ts` + `.test.ts` — one responder,
  three branches, delegating to `@dungeonmaster/siegelense/brokers`' `instanceStartBroker`,
  `instanceRunBroker` and `instanceKillBroker`.
- `src/flows/siegelense/siegelense-flow.ts` + `siegelense-flow.integration.test.ts` — returns three
  `ToolRegistration`s.

**A separate flow and responder, never a branch in `QuestHandleResponder`.** `packages/mcp/CLAUDE.md`: that
function "sits AT the ceiling (`complexity: max 50`)".

**Edits — the tail that pins the tool list by full value, every one of which fails one red test at a time:**

- `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts` — three names appended, built as
  `` `${siegelenseToolsStatics.tools.prefix}${name}` `` values (`siegelense-start`, `siegelense-run`,
  `siegelense-kill`) — plus its full-value `toStrictEqual` test.
- `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` — three probe
  entries. Its test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names, so a missing entry
  is a hard fail.
- `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` — **all three names go in
  `TOOLS_EXEMPT_FROM_SIZE_CAP`**, because all three take required input and the size-cap suite invokes every
  non-exempt tool with `{}`. Plus one `describe('tools/call with <tool>')` block each.
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` — seven copies
  of the expected allow-list.
- `packages/mcp/src/flows/install/install-flow.integration.test.ts` — the eighth copy.
- `packages/mcp/src/transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts` — the
  ninth copy, and its test NAME carries the tool count.
- `packages/mcp/src/startup/start-mcp-server.ts` — register `SiegelenseFlow` beside the other four.
- `packages/mcp/brokers.ts` and `packages/mcp/testing.ts` — only if this work adds a broker of its own; it
  should not, because the responder reaches siegelense's brokers directly.
- `packages/mcp/package.json` — add `"@dungeonmaster/siegelense": "*"` to `dependencies`.

**NOT edited:** `packages/server/src/statics/dispatcher-mcp-tools/dispatcher-mcp-tools-statics.ts`. That list
is only for tools `/dumpster-launch` itself calls for orchestration control, and none of these is.

**Depends on** W5, W6, W17.

**Tests** `siegelense-flow.integration.test.ts` mirrors the owning-flow pattern: **four parallel hardcoded
arrays (names, handler types, descriptions, schema types) that stay index-aligned**, and a test NAME carrying
the registration count. Derive the names array from `siegelenseToolsStatics.tools.names` filtered to the three
this chunk registers, so a fourth tool cannot be added to the statics without this test noticing.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <every created and edited file>`

**Acceptance criteria, quoted**

> line 2096: `**Every tool below is registered as `siegelense-<name>`** — `siegelense-start`, `siegelense-run`, and so on. The`
> line 2097: `examples drop the prefix for readability; there is no bare `start` tool. **Steps are not tools**: `look`, `click`,`
> line 2098: ``health` and the rest are values inside `run`'s `steps` array, which is the whole point of the bounded-tool-surface`

> line 2101: `**Only `start`, `run` and `kill` need a live instance.** The other ten read the asset tree, the registry or the machine,`

> line 1610: `| The service IS a set of MCP tools — THIRTEEN of them. What was rejected is one tool per STEP, not MCP                                      | a file drop costs ~3 calls per command; a tool per step grows the tool surface with every verb AND forces each reading through a 50,000-char result ceiling. Steps are DATA inside `run` instead: the tool surface is bounded, the step surface is open                  |`

> line 1825: `| its MCP tools      | `siegelense-start`, `siegelense-run`, `siegelense-results`, `siegelense-cleanup`, … — **thirteen of them, and `look` is NOT one**: it is a step inside `run` |`

> line 104: `**Blocking is fine and there is precedent.** `run-ward` and `run-riftcarver` already block through MCP for minutes.`

---

### W19 — `dungeonmaster siegelense` (wave I, PARALLEL with W18)

**Creates** in `packages/cli`:

- `src/responders/cli/siegelense/cli-siegelense-responder.ts` + `.proxy.ts` + `.test.ts` —
  `({ args }: { args: readonly string[] }): Promise<AdapterResult>`. Reaches
  `@dungeonmaster/siegelense/startup`'s `StartSiegelense` through `runtimeDynamicImportAdapter` from
  `@dungeonmaster/shared/adapters`.

**Edits**

- `packages/cli/src/flows/cli/cli-flow.ts` — add `siegelense: 'siegelense'` to the `COMMANDS` object and one
  branch returning `CliSiegelenseResponder({ args })`. The branch sits above the `CliServeResponder` fallthrough.
- `packages/cli/src/flows/cli/cli-flow.integration.test.ts` — one case asserting the siegelense branch routes.
- `packages/cli/CLAUDE.md` — one row in the "Purpose" list naming the command and its two forms.
- `packages/cli/package.json` — do NOT add `@dungeonmaster/siegelense` to `dependencies`. The import is
  dynamic and the root `package.json` already ships the package; a static dependency here is what pulls
  Playwright into the esbuild bundle at `dist/bin/dungeonmaster.js`.

**Depends on** W16 (`StartSiegelense`'s new signature).

**Tests** the responder's proxy uses `runtimeDynamicImportAdapterProxy` from `@dungeonmaster/shared/testing`,
staged on the module specifier. Cases: `VALID: {args: ['driver','--instance','inst_7f3a']} => delegates with those args` ·
`VALID: {args: []} => delegates with an empty list` ·
`ERROR: {module not found} => the error names the package rather than the specifier`.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <the six files>`

**Acceptance criteria, quoted**

> lines 1821–1826, the three fixed names:
> ```
> | Thing              | Name                                                                                                                                                         |
> |--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
> | the tool's package | `packages/siegelense/`                                                                                                                                       |
> | the command        | `dungeonmaster siegelense`                                                                                                                                   |
> ```

> line 1819: `**Three fixed names, and they are conventions rather than configuration:**`

> line 2214: `**`driving` is the scope for a session nobody orchestrated, and it exists because this design already promised it.** The`
> (the `docs` scope is chunk 4; what this item delivers is the surface such a session can reach without an MCP client at all)

---

### W20 — The teardown suite, written red-first (wave J, alone)

**Creates**

- `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts` — spawns and tracks N real drivers
  against the `dungeonmaster-headless` spec, and reaps anything still up in `afterAll`. Harness files may
  import `node:fs`/`path`/`os`, contracts and stubs, and other harnesses; they may NOT import `.proxy.ts`
  files or contract VALUE imports.
- `packages/siegelense/src/flows/driver/driver-teardown.integration.test.ts` — the seven assertions.

**The `dungeonmaster-headless` spec is what makes this suite affordable, and that is why it exists in this
chunk.** Its subject is the process-group teardown, not the app: one `npm run` wrapper, its `sh -c` child and
the real listener grandchild, which is the exact mechanism every assertion below grades. Three of those boot
in seconds where three `dungeonmaster-web` instances would boot three Chromiums.

**The seven assertions, and the break each must catch.** The plan's table is the spec's own, at lines
1371–1379:

| Assertion | The break it must be SHOWN failing against |
|---|---|
| the port pair is free after `kill` | skip the SIGKILL pass |
| no process matching the instance remains | kill the child rather than the process group |
| the home directory is gone | skip the `rm` |
| **the evidence directory REMAINS** | remove the lane dir along with the home |
| snapshots are gone | *(no snapshots exist in this chunk — record the row as NOT APPLICABLE YET in the test file's own describe name, rather than writing a test that passes vacuously)* |
| a SIGKILLed driver's orphans are reaped by ANOTHER process's `cleanup` | SIGKILL the driver, then reap from a second process through `instanceKillBroker`'s orphan path |
| **killing one of three parallel instances leaves the other two untouched** | widen the group kill by one pid |

**Red first is a procedure, not a claim.** For each assertion the agent: writes it · breaks the teardown in
the named way, in the working tree · RUNS the suite and captures the failure output · restores the teardown ·
runs it again green. **The captured red output for all six live assertions goes in the handback, verbatim.**
An assertion never shown failing is not delivered.

**The sixth row cannot be faked.** Spec line 1378: "If this passes without a second process running, the test
is not testing anything." The harness must SIGKILL the driver — so its own idle timeout and its own signal
handlers die with it — and then reap from the jest process, which is the second process.

**The seventh row is the one everyone skips**, and it only fails under parallelism. Boot three, kill the
middle one, then assert the other two still answer a `ping` on their sockets AND that their pgids are still
alive — two checks, because a driver whose socket answers while its lane's processes are gone is exactly the
"partial teardown" row at spec line 1102.

**Depends on** everything.

**Tests** this item IS the tests. It writes no implementation. If an assertion cannot be made to fail against
its named break, that is a finding about the assertion and it goes in the handback rather than being papered
over — spec line 1366 records what a leak-guard that "passed for every tree and proved nothing" cost here.

**Ward** `npm run ward -- --only integration -- packages/siegelense/src/flows/driver/driver-teardown.integration.test.ts`
then, as the regression pass, `npm run ward -- -- packages/siegelense packages/siegelense-recipes packages/mcp packages/cli packages/shared`.

**Acceptance criteria, quoted**

> line 1355: `**This is a test suite for the TOOL, written when the tool is written, run by ward like any other.**`
> line 1356: `No quest runs it, no siegemaster runs it, no walk runs it. A pass that had to verify its own teardown would be a pass`
> line 1357: `that cannot trust the thing it is driving.`

> lines 1362–1366:
> ```
> **Teardown tests are the ones most likely to pass while proving nothing.** This repo has already measured that trap:
> `../../packages/orchestrator/CLAUDE.md` records a leak-guard attempt where "a `process.getActiveResourcesInfo()` Timeout
> count
> taken either side of the import comes back unchanged whether the spies are installed or not — measured both ways — so it
> passed for every tree and proved nothing about the mock it was written to protect."
> ```

> line 1368: `**So every teardown assertion has to be shown failing against broken teardown before it is trusted.**`

> line 1378: `| a SIGKILLed driver's orphans are reaped by ANOTHER process's `cleanup`     | kill the driver with SIGKILL — its own idle timeout dies with it, so nothing self-reaps. If this passes without a second process running, the test is not testing anything |`

> line 1379: `| **killing one of three parallel instances leaves the other two untouched** | widen the group kill by one pid                                                                                                                                            |`

> lines 1381–1382:
> ```
> That last row is the one that gets skipped and the one that bites, because it only fails under parallelism — which is
> exactly the shape the two-phase pass introduces.
> ```

> line 1683: `| The parallel case is tested explicitly: killing one of three instances leaves the other two untouched                 | it only fails under parallelism, which is the shape the two-phase pass introduces, and it is the row everyone skips                                                                                                |`

---

## 5. What is deliberately NOT built yet, and why that is safe

**No `results`, and therefore no way to query a run except the return `run` already handed back.** This is
safe for exactly one reason and it is the one this chunk went out of its way to secure: the run's stored
return is ALREADY on disk at `runs/run_N.json`, its transcript at `runs/run_N.jsonl`, its shots under
`runs/run_N/`, and both server logs beside them. Spec line 1634 says `results { instance, run }` with no
`step` and no `kind` must answer with "that run's stored return" — the file is written here, so chunk 3's
`results` is a reader over a real tree rather than a shape it has to invent. What a chunk-2 session cannot do
is read ANOTHER session's run. It reads its own, because `run` returned it.

**No `pixelChange` and no `blank`, and the fields are ABSENT rather than null.** Both need a pixel differ this
package does not depend on. Capture-always, the shot list and the `open:` flags land here because those are
the halves that change what a session READS; the number that routes attention arrives in chunk 3. An absent
field is honest (spec 1585); a `pixelChange: null` on every row would read as "the first capture, every
time", which is precisely the manufactured no-change finding line 1596 forbids.

**No settle detector, and this is the one deferral with a live cost.** Spec 1754 makes settle-based stepping a
determinism guarantee, and chunk 2 has a ceiling instead. Under contention two runs of one batch can read
differently, with nothing in the record saying why. It is deferred rather than faked because a half-settle —
network idle without the repeating-request discount — HANGS on every page this app polls (spec 753–757), which
is worse than a ceiling: a hang reads as a tool failure where a ceiling reports what it was waiting on.

**No refs and no key, so every targeting step takes a selector.** That is not a degraded mode: spec line 2027
calls testId-plus-`within` the DURABLE handle and a ref "no, and fragile". A chunk-2 walk writes exactly what
a saved batch or a round record would have had to write anyway. What it costs is discovery — without `look`, a
session has to know the testId it wants. The zero-match error names the near misses on the page (W3), which is
the cheapest substitute and is itself a spec requirement rather than a consolation.

**No recipes, so an instance boots against an EMPTY throwaway home.** That is the honest state of
`packages/siegelense-recipes/`, which holds one statics and no recipes. `start`'s return omits `seeded`
rather than returning an empty object — the same absent-versus-empty rule. A walk therefore drives the real
dungeonmaster UI from its zero state, which is a real screen with real controls, and creates whatever it needs
through `click` and `type`.

**Ten of the thirteen tools stay unregistered.** §3 says why, and the one that matters is `docs`: it is the
call that teaches the surface, and a manual for ten calls that do not exist is worse than no manual. The three
that ARE registered all work.

**Neither local lint rule.** The `.first()` rule's subject — `packages/siegelense/src/brokers/step/**` —
exists after this chunk and not before it, so chunk 3 is the first chunk where the rule can be SHOWN firing
against a real violation. The spec's own caution stands: "a rule people over-trust is worse than none"
(line 2013). The package `CLAUDE.md` carries both rules as prose, which is where the `querySelector` half
lives permanently.

**The lane spec is still this repo's.** `laneSpecStatics` names `@dungeonmaster/server` and
`@dungeonmaster/web`, so a consumer repo installing this package gets a tool that cannot boot its app. That is
Part 7 item 17's second half and it is last by the spec's own ordering. What this chunk removes is the
structural half — "exactly two processes against one port pair" (line 1939) is gone, the spec is data with N
processes and a declared browser flag, and `REPO_ROOT` resolved four directories up is gone with it. **And
lint gives no help here**: spec line 1949 measured that `siege-lane.ts` passes `no-hardcoded-package-names`
today while hardcoding two package names, because `packageNameLiteralStatics` only matches a role-bearing name
after a workspace directory segment. A green lint on `laneSpecStatics` means nothing.

---

## 6. What a person can DO once this lands

Everything below is a real command a person types, with what they should see. The coordinator's build (§4,
item 2) must have run and the MCP must have been reconnected.

### Through the terminal, with no MCP client at all

```bash
dungeonmaster siegelense
```

A table of every instance in the registry — id, state, spec, ports, last beat, evidence dir — including
instances this session did not start. Immediately after a fresh install it is empty, and an empty table is the
correct answer rather than an error.

### Through the MCP tools, which is how an agent drives it

```
siegelense-start { spec: 'dungeonmaster-web' }
```

Blocks for roughly twenty seconds and returns:

```
{ instance: 'inst_<hex>', baseUrl: 'http://127.0.0.1:<apiPort>',
  home: '/tmp/dm-siege-…',
  evidence: { path: '<repoRoot>/.siegelense/unowned/instances/inst_<hex>/', linkPresent: true },
  logs: { api: '…/api-server.log', web: '…/web-server.log' },
  queuedMs: 0, aheadOfMe: 0, bootMs: ~20000 }
```

**The person opens `http://127.0.0.1:<webPort>` in a real browser at this point** and sees the dungeonmaster
web UI, running against an empty throwaway home — its own guild list, its own port, nothing shared with
`npm run dev` or `npm run prod`. That is the web-UI half of the verification bar, and it is available for the
whole life of the instance.

```
siegelense-run {
  instance: 'inst_<hex>',
  stopOn: 'error',
  steps: [
    { step: 'goto',       path: '/' },
    { step: 'waitFor',    target: '[data-testid="GUILD_LIST"]', state: 'visible', node: 'home-rendered' },
    { step: 'screenshot', name: 'home.png' },
    { step: 'eval',       source: 'document.title' },
  ],
}
```

Returns a STATUS, never a payload:

```
{ instance, run: 'run_1', status: 'done', stepsRun: 4,
  index: { console: { errors: 0, warnings: 2 }, server: { errors: 0 }, network: { exchanges: 14, non2xx: 0 } },
  shots: [ { step: 1, path: '<repoRoot>/.siegelense/…/runs/run_1/step1.png', open: true, why: 'start', node: null },
           { step: 3, path: '…/run_1/step3.png', open: true, why: 'end', node: null } ] }
```

**The person `Read`s the two shots whose `open` is `true`** — the paths are repo-local absolute, so `Read`
reaches them — and sees the page the walk saw. That is the shot-list policy doing the job spec line 660 gives
it, with no prompt text carrying it.

Then, the thing that proves the no-pick rule rather than describing it:

```
siegelense-run { instance, steps: [ { step: 'click', target: '[data-testid="PIXEL_BTN"]' } ] }
```

`PIXEL_BTN` is on several controls at once on this app's home screen, so this returns `status: 'failed'` with
`stoppedAt` naming step 1, the verb, and every candidate with the `within` that would disambiguate it. Repeat
it with that `within` and it proceeds. **That round trip is the single best manual check in this chunk**: it
is the failure `.first()` hides, made visible and then recovered from, in two calls.

A second `siegelense-run` on the same instance returns `run: 'run_2'` whose steps start at 1 again and whose
shots land under `runs/run_2/`, and whose index counts only run 2's console lines. Both are visible in the
return and both are on disk.

```
siegelense-kill { instance: 'inst_<hex>' }
```

Returns `{ stopped: true, portsReleased: [...], homeRemoved: true, evidenceKept: {...}, reapedPgids: [...] }`.
Afterwards: `/tmp/dm-siege-…` is gone, `<repoRoot>/.siegelense/unowned/instances/inst_<hex>/` is still there
with both logs, both runs' transcripts and every shot, and `dungeonmaster siegelense` shows the row as
`killed` rather than dropping it.

### What a person CANNOT do yet, and should not be surprised by

Query another session's run (`results` is chunk 3). Read a `pixelChange`. Ask what the machine can take
(`capacity`). Seed a state (`recipes`). Read the tool's own manual (`docs`). List the ten unregistered tools —
they are not there, which is the intended answer rather than a gap in the build.

---

## 7. Risks this plan is taking on purpose

**Three real servers and a Chromium per instance, inside a jest integration run.** W16's and W20's integration
tests drive `dungeonmaster-headless` specifically to keep this to one API server per instance. No integration
test in this chunk boots `dungeonmaster-web`. The browser path is covered by unit tests against
`BrowserSessionStub` and by the manual drive in §6 — which is the user's stated bar for the browser half
anyway.

**A driver that boots inside a worktree is not hermetic.** `<dungeonmaster-worktrees>`: a worktree sits under
the main checkout and node's walk-up escapes it. A driver spawning `npm run dev:no-watch --workspace=@dungeonmaster/server`
with `cwd` set to the worktree will resolve the worktree's own `packages/server` — but a missing compiled
output resolves to the MAIN checkout's, silently. If an instance in this worktree serves behaviour the
worktree's source does not have, that is the cause.

**The MCP cascade is a red-test treadmill.** W18's nine allow-list copies and four index-aligned arrays each
fail separately. The agent should expect to run the scoped ward five or six times and fix one file per run;
that is the shape `packages/mcp/CLAUDE.md` documents, not a sign anything is wrong.

**`dungeonmaster siegelense driver` runs COMPILED output.** Every siegelense source change after the wave-I
build needs another `npm run build --workspace=@dungeonmaster/siegelense` before the next manual drive.
Nothing in ward tells you this, because ward reads source.

---

## 8. Ledger rows this chunk expects to move

`build-ledger.md` is owned by another agent this round. These are the rows this plan covers and the status
each should carry once chunk 2 is planned:

| Ledger section | Row | Expected status |
|---|---|---|
| Part 1 | Decision: an INSTANCE service, reached over MCP (11) | `PLANNED chunk 2 (part)` — three of the thirteen registered |
| Part 1 | The shape (42) | `PLANNED chunk 2 (part)` — `start`/`run`/`kill`; `results` stays open |
| Part 1 | An instance is a TIMELINE of runs (63) | `PLANNED chunk 2 (part)` — run ids, per-run numbering, namespaced shots, continuous buffers with per-run windows; the retention window stays open |
| Part 1 | What a batch buys beyond call count (293) | `PLANNED chunk 2` |
| Part 2 | Teardown: the failure that is silent (1077) | `PLANNED chunk 2` |
| Part 2 | When it dies without warning (1111) | `PLANNED chunk 2 (part)` — adds the ticker and the orphan reap to chunk 1's writer; `status`, `likelyCause`, OOM evidence and disk checks stay open |
| Part 2 | Testing teardown — ONCE, as the tool's own suite (1353) | `PLANNED chunk 2 (part)` — six of seven assertions; the snapshots row has no subject until chunk 4 |
| Part 3 | The TOOL staggers (1456) | `PLANNED chunk 2 (part)` — `boot.lock` blocking plus `queuedMs`/`aheadOfMe`; the pool refusal stays open |
| Part 4A | The service: instances, runs, batches (1606) | `PLANNED chunk 2 (part)` — adds 1610, 1613, 1616, 1627, 1629, 1630, 1631, 1635, 1638, 1639, 1640 to chunk 1's rows |
| Part 4A | Perception: shots, pixelChange, animation (1587) | `PLANNED chunk 2 (part)` — 1591, 1592, 1593, 1601; `pixelChange` and `blank` stay open |
| Part 4A | Teardown and crash recovery (1654) | `PLANNED chunk 2 (part)` — adds 1658, 1659, 1660, 1676, 1680, 1681, 1682, 1683 |
| Part 5 | What the TOOLING must guarantee (1743) | `PLANNED chunk 2 (part)` — adds the append-only/flush row (1752) and the per-run numbering row (1753) as enforced rather than only typed |
| Part 6 | The tool is `siegelense` (1817) | `PLANNED chunk 2 (part)` — adds `dungeonmaster siegelense` |
| Part 7 | 2 (1911) | `PLANNED chunk 2 (part)` — start/run/kill/the driver; capacity, profile, status, cleanup, docs, RSS stay open |
| Part 7 | 2b (1913) | `PLANNED chunk 2` |
| Part 7 | 6 (1921) | `PLANNED chunk 2 (part)` — capture-always, the shot list, the `open:` flags and frozen capture; the change number stays open |
| Part 7 | 16 (1938) | note that chunk 2 CREATES the `.first()` rule's subject, so the rule moves to chunk 3 rather than "the chunks that create their targets" |
| Part 7 | 17 (1939) | `PLANNED chunk 2 (part)` — the N-process spec as data; moving it where consumers get it stays open |
| Part 8 | The rule that governs every targeting step (1961) | `PLANNED chunk 2 (part)` — all three outcomes; the `ref` in the candidate rows arrives with `look` |
| Part 8 | Steps that exist today and are kept (2365) | `PLANNED chunk 2 (part)` — six of thirteen |
| Part 8 | What every acting step returns (2564) | `PLANNED chunk 2 (part)` — `shot` only |
| Part 8 | A worked batch (2577) | `PLANNED chunk 2 (part)` — `stopOn` and `expect: 'error'`; `as`/`{name.field}` needs `seed` |
| Part 8 | Cycles — run, snapshot, collect, repeat (2747) | `PLANNED chunk 2 (part)` — the three return shapes; `compare`, `snapshot` and `reset` stay open |
| Thirteen calls | `start` (2104) | `PLANNED chunk 2 (part)` — `seeded` and the queue refusal stay open |
| Thirteen calls | `run` (2151) | `PLANNED chunk 2` |
| Thirteen calls | `kill` (2356) | `PLANNED chunk 2` |
