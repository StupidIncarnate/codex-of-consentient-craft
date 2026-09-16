# Chunk 3 — the read path, and the shot's own reading

Everything a session reads AFTER a run, and the two numbers that decide whether it opens a picture.
`results`, `status`, `compare` and `cleanup` registered as four more MCP tools, each resolving off DISK and
starting nothing; per-step attribution on every console, network, websocket and server-log entry;
`pixelChange` and `blank` on every capture; and two new operator subcommands on `dungeonmaster siegelense`.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/siegelense`.** Never the main checkout.

Coverage is tracked in `scrolls/seigelense/build-ledger.md`. **This plan does not edit that file** — §9 lists
the rows it expects to move and the ledger's owner moves them.

Chunk 1 is `plans/chunk-01-registry-spine.md`; chunk 2 is `plans/chunk-02-driver-and-batch.md`. Every
signature, field and line number quoted below was read off disk in this worktree after chunk 2 landed. Where
an earlier plan and the delivered code disagree, the code wins and this file carries the code's shape.

**Spec line numbers here are against the CURRENT `siegelense-tooling.md`, 2,972 lines.** The status markers
chunks 1 and 2 inserted shifted every line, so the ledger's numbers and this file's numbers are both
post-marker. Re-derive from heading text if they drift again.

---

## 1. Why this slice, and what it is

**`run` returns a status, never a payload — and nothing can read a payload yet.** That is the hole chunk 2
left on purpose. Six step verbs write their readings to `runs/run_N.jsonl`, every acting step captures a PNG,
both server logs accumulate, and the only call that can see any of it is the `run` that produced it, once, in
the session that submitted it. A fixer holding a run id has nothing. A second session has nothing. Even the
session that ran the batch cannot ask what step 4 actually read.

So this chunk is the other half of the founding split, `packages/siegelense/CLAUDE.md`'s own entry:

> ## `run` returns a status; `results` returns payloads

**It is also the chunk that makes every LATER step verb worth adding.** `look` returns a key; the key is a
reading; a reading is only reachable through `results { step: N }` (spec line 2596: "A step's own reading is
reached by `step: N` with no `kind`, and for a `look` that reading IS the key as it stood at that moment").
Ship `look` before `results` and the key is written to a file nobody can query. Ship `results` first and every
verb chunk 4 adds is readable the day it lands.

**And it sidesteps the one open bug rather than waiting on it.** The Jest-worker driver-spawn resolution
failure (`HANDOFF.md`, "The one open bug") blocks any integration test that boots a real driver. Every call in
this chunk resolves off disk. Its integration suite builds a real evidence tree with
`installTestbedCreateBroker` and reads it back through the real flow — **no driver, no browser, no port
pair** — so it is provable green today. That is not a workaround; it is the spec's own rule (line 1669)
arriving as a testing property.

### Delivered by this chunk

| Spec section | Line | What lands |
|---|---|---|
| Reading evidence starts nothing, and that is a SEPARATE PATH through the tool | 254 | The whole section except `prune`'s refusals and `snapshots`. `results` and `compare` read the asset tree; `status` and `cleanup` read the registry and the machine; every one starts nothing and answers for a dead instance |
| The crash a walker must NOT mistake for a defect | 1248 | `status` separating a driver death from a child death, and the `blank` flag that tells a blank screen caused by the tool from one caused by the app |
| Handing a defect to a fixer: what a walker must write down | 1267 | The tooling half: `results` answering for a killed instance, and the run id REQUIRED against a finished one rather than defaulted |
| What the operator owns after a crash | 1327 | Steps 1 and 2 of the four — `status`, then `cleanup`. Step 3 (`capacity`) is chunk 4 |
| `cleanup` — the operator's bookend | 1342 | Reaping by staleness, port release, lock release, `leftAlone`. **Not** `assetsAged` — §3.E says why |
| Perception: three artifacts, and they are not interchangeable | 641 | The `report how much the picture CHANGED` bullet, which chunk 2 left as the one unbuilt third of this section |
| `pixelChange` — an attention router, not a measurement | 686 | The whole section: one number per acting step, `null` on the first capture in an INSTANCE, `blank` checked FIRST with its colour, full-blank only. **Not** the element delta it pairs with |
| Baselines: promoting a walk's shots | 1051 | The mechanism half (1071–1084): `results { kind: 'screenshots' }` returning each shot with the `node` it was taken at, against the happy walk's instance, starting nothing |
| The honest limit | 1849 | Both rows: `pixelChange: 0%` is a strong signal never a verdict, and `blank` is the one exact exception |
| Animation is the one that conflicts with the product | 1819 | The two capture settings were chunk 2's; this chunk is what makes them load-bearing, since `pixelChange` is the number they exist to de-noise |
| 4A · Perception: shots, pixelChange, animation | 1619 | rows 1628, 1629, 1630, 1631, 1632, 1633, 1634. **Not** 1636/1637/1638 (`hold`, `video`, motion) |
| 4A · The service: instances, runs, batches | 1640 | rows 1669, 1670, 1671, 1672, 1675, 1678. **Not** 1649/1650 (`docs`), 1659 (profile samples), 1662/1663 (ageing), 1679/1680 (settle) |
| Part 5 · What the TOOLING must guarantee | 1787 | The retention row's READ half — evidence written append-only is now also readable per step |
| The thirteen calls | 2156 | Four more registered: `siegelense-results`, `siegelense-status`, `siegelense-compare`, `siegelense-cleanup`. Seven of thirteen live |
| `results` | 2219 | The whole call: query by run/step/kind, `where`, `fields`, `since: 'boot'`, `instanceState` on every answer, `pruned`/`unknown` as real answers, run id required against a finished instance |
| `status` | 2373 | The whole call: `monitored`, `machine`, one entry per instance; a dead one carrying last beat, last step, RSS, orphan pgids, evidence paths and `likelyCause`; never lists runs or evidence for an instance you did not name |
| `compare` | 2350 | The call, minus its `elements` field — §3.F says why |
| `cleanup` | 2336 | The call, minus `assetsAged` — §3.E says why |
| Results queries | 2591 | All six kinds — `console`, `network`, `ws`, `server`, `screenshots`, `steps` — with per-step attribution on every entry, `where` filtering and `fields` projection |
| What every acting step returns, on top of its own reading | 2632 | `pixelChange` joins `shot`. **Not** `elements` |
| A FIXER reading a finished instance | 2687 | Steps 1 to 4, verbatim, all four starting nothing. Steps 5–7 already work (chunk 2), except the recipe half of step 6 |
| Cycles — run, snapshot, collect, repeat | 2819 | `compare`, and the `pixelChange`/`blank` columns of the clean return's shot list (lines 2883–2891) |
| Part 7 items 2, 2a, 4, 6, 10, 13b | 1967, 1968, 1974, 1977, 1981, 1991 | in part — §9 says exactly which part |

### Built separately, outside this chunk

| Item | Spec | Who has it |
|---|---|---|
| The `.first()` / `.last()` local lint rule — Part 7 item 16's FIRST half, ledger row "Holding the no-pick rule mechanically" (line 2056) | 2056, 2065–2073, and item 16 at 1994 | **A separate agent is building it now, in `packages/local-eslint`.** It is not deferred and it is not this chunk's; no work item below touches `packages/local-eslint` or `eslint.config.js`, and the ledger pass afterwards should read that row as covered by that agent rather than as open |

### Deliberately deferred

| Deferred | To | Why it is safe to wait, and the row it belongs to |
|---|---|---|
| `prune`, retention, asset ageing, `cleanup`'s `assetsAged` | chunk 4 | Ledger Part 7 item 2c. **Ageing WITHOUT the citation resolver is the exact damage spec lines 241–244 describe**: "the operator's own `cleanup` at the start of the next phase ages them out. The attacker then arrives with no baseline for a path that passed." The resolver needs a `WALKED` citation, which needs Part 7 item 11g (a typed `walked` kind on `questNotes`), which is an orchestrator change. So chunk 3's `cleanup` reaps instances and ages nothing, and OMITS the field rather than reporting a zero — the same absent-is-honest rule chunk 2 applied to `pixelChange` |
| `snapshots`, `reset`, the `snapshot` step, the automatic `run_N:start`/`run_N:end` pair | chunk 4 | Ledger Part 7 item 14. `snapshots` lists what `reset level: 'state'` can return to; nothing mints a snapshot, so the call would answer an empty list for every instance — the `count: 0` ambiguity this design keeps refusing. It ships with the thing it lists |
| `capacity`, `profile`, RSS SAMPLING, append-only profile samples, the pool-size refusal on `start` | chunk 4 | Ledger Part 3 / Part 7 item 2. **This chunk builds the RSS READING and stops there**: `status` needs one number now (`rssMB`, `rssAtLastBeat`), and `machineRssByPgidBroker` is that number. What it does not build is the sampler that writes `profiles/<hash>/`, the steady/peak computation, or the ceiling arithmetic. `likelyCause` therefore says "rss 2980MB at last beat; no profile recorded for this spec" and upgrades itself the day chunk 4 writes one |
| The SETTLE detector | chunk 4, with `until` and `hold` | Chunk 2 deferred this here, and it moves one chunk further **for a reason, not by drift**: `until` (wait on a response, a file or a predicate — item 9) and `hold` (detect non-settlement — item 11) read the same network/paint/DOM-quiet signals with the same repeating-request discount. Building the detector now and rewiring it for those two is the double-work spec line 2003 warns about, arriving from inside. The per-step ceiling chunk 2 shipped still reports what it was waiting on, which is the actionable half of line 1679 |
| `elements` — the element delta on every acting step, and `compare`'s `elements` field | chunk 4, with `look` | Ledger Part 7 item 7. `+7 under GUILD_ADD_MODAL` is a delta SCOPED to a container, and the container tree is the key. A bare "total nodes changed by N" number would answer a different question and then have to be replaced. The field is ABSENT from `ShotListing`, `StepReading` and `CompareAnswer` rather than shipped null |
| `look`, refs, the key, `within`, the `dom` ladder, `box`, `key`, `paste`, `storage`, `file` | chunk 4 | Ledger Part 7 items 7 and 10, and Part 8 "Steps that exist today and are kept". The `network` half of item 10 (method/path filtering with field projection) lands HERE, because it is a `results` query; the `dom` half lands with the ladder it caps |
| `before`, `health`, `until`, `hold`, `video`, `request`, `resize`, `seed` | chunk 4+ | Ledger Part 8 "Steps that are new". Steps are DATA inside `run` (spec line 2163), so the tool surface does not grow when they arrive — `stepContract`'s union gains a member and `stepStatics.verbs.all` gains a name |
| Recipes, `recipes`, `produces:`, `fidelity`, `seed:` on `start` | chunk 4 | Ledger Part 7 items 3 / 3a. Unchanged from chunk 2's reasoning |
| `docs` and the seven scopes | the chunk that finishes the surface | After this chunk seven of thirteen calls exist. A manual describing six calls nothing can make is still the failure `docs` was invented to prevent. Chunk 2's argument is unchanged, only smaller |
| The DOM-handle-in-a-recipe lint rule — item 16's SECOND half | the chunk that lands recipes | This chunk lands no recipes, and `packages/siegelense-recipes/src/` holds none today, so the rule has nothing to fire against. Spec line 2071's caution is the reason that matters rather than a scheduling one: "a rule people over-trust is worse than none", and a rule nobody has watched fire is exactly that. It ships with the recipe book it grades |
| Moving the lane spec where CONSUMERS get it (item 17's second half) | last | Spec line 2003: "Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice." Unchanged |

### Where this departs from Part 7's order, and why

Part 7 orders `results` (inside item 2a) before item 6's change number and well before item 10's selectable
readings. **This chunk takes 2a, the remainder of 6, and the `network` half of 10 together**, because they are
one surface seen from three angles: item 10's `where`/`fields` are arguments to item 2a's call, and item 6's
`pixelChange` is a COLUMN of the answer item 2a's `kind: 'screenshots'` returns. Splitting them means shipping
`results` with a shot listing that has to be widened two chunks later, which is the rewrite line 1968 says 2a
exists to avoid.

It leaves item 5 (`before`) where Part 7 puts it even though the order says otherwise, because `before` is the
substrate for instrumentation and instrumentation is a WRITE concern. Nothing in this chunk writes to a page.

---

## 2. The contract surface, up front

**Every return is a branded contract; inputs may take a raw `string`.** All of these live in
`packages/siegelense/src/contracts/<domain>/` as `<domain>-contract.ts` + `<domain>-contract.test.ts` +
`<domain>.stub.ts`, and each one's barrel line goes in `packages/siegelense/contracts.ts`.

From `@dungeonmaster/shared/contracts`, already available, **do not re-declare**: `contentTextContract`,
`fileNameContract`, `absoluteFilePathContract`, `filePathContract`, `fileContentsContract`,
`networkPortContract`, `processIdContract`, `timeoutMsContract`, `guildIdContract`, `questIdContract`,
`adapterResultContract`, `arrayIndexContract`.

From chunks 1 and 2, in this package: `epochMsContract`, `instanceIdContract`, `runIdContract`,
`stepIndexContract`, `stepVerbContract`, `specNameContract`, `specHashContract`, `instanceStateContract`,
`instanceOwnerContract`, `processGroupIdContract`, `portPairContract`, `repoLocalPathContract`,
`registryEntryContract`, `registryContract`, `nodeLabelContract`, `readingCountContract`,
`stepReadingContract`, `shotListingContract`, `shotOpenReasonContract`, `runIndexContract`,
`runResultContract`, `stoppedAtContract`, `instanceHeartbeatContract`, `serverLogByteCountContract`.

### New branded primitives

| Contract | Brand | Schema | Owner |
|---|---|---|---|
| `resultKindContract` | `ResultKind` | `z.enum(resultsStatics.kinds.all)` — derived from the statics, never a second list | W2 |
| `resultFieldContract` | `ResultField` | `z.string().min(1)` — one projected field name in `fields: [...]` | W2 |
| `stepRangeContract` | `StepRange` | `z.string().regex(/^\d+-\d+$/u)` — the `'4-9'` form in `where: { steps }` | W2 |
| `logLevelContract` | `LogLevel` | `z.enum(['error','warn','info'])` — `where: { level }` | W2 |
| `httpMethodContract` | `HttpMethod` | `z.enum(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'])` | W2 |
| `sinceMarkerContract` | `SinceMarker` | `z.literal(resultsStatics.since.boot)` — the ONE legal value of `since`, so a typo is a parse error rather than a silent whole-timeline read | W2 |
| `pixelChangeContract` | `PixelChange` | `z.string().regex(/^\d{1,3}%$/u)` — the `'38%'` form the spec prints | W3 |
| `hexColourContract` | `HexColour` | `z.string().regex(/^#[0-9a-f]{6}$/u)` | W3 |
| `serverLogWindowContract` | `ServerLogWindow` | `z.object({ fromByte: ServerLogByteCount; toByte: ServerLogByteCount })` | W3 |
| `megabytesContract` | `Megabytes` | `z.number().int().nonnegative()` | W4 |
| `loadAverageContract` | `LoadAverage` | `z.tuple([z.number(), z.number(), z.number()])` — the 1/5/15-minute triple | W4 |
| `elapsedTextContract` | `ElapsedText` | `z.string().min(1)` — `'14m'`, `'2s ago'`, `'9h'`; a rendered duration, never a number a caller must format | W4 |
| `countDeltaContract` | `CountDelta` | `z.string().regex(/^[+-]\d+$/u)` — `compare`'s `'+2'` / `'-3'` | W5 |
| `monitoredMetricContract` | `MonitoredMetric` | `z.enum(machineStatics.monitored)` — derived from the statics | W4 |

### New object contracts

| Contract | Fields | Owner |
|---|---|---|
| `bufferEntryContract` | `{ runId: RunId \| null; step: StepIndex \| null; atMs: EpochMs; text: ContentText }` — one line of `console.jsonl` / `network.jsonl` / `ws.jsonl`. `runId`/`step` are BOTH null for an entry that arrived outside any run, which is a real answer rather than a guess | W2 |
| `resultWhereContract` | `{ path: ContentText \| null; method: HttpMethod \| null; nth: ArrayIndex \| null; level: LogLevel \| null; steps: StepRange \| null }` — `.strict()`, every member nullable | W2 |
| `resultsQueryContract` | `{ instanceId: InstanceId; runId: RunId \| null; step: StepIndex \| null; kind: ResultKind \| null; where: ResultWhere \| null; fields: readonly ResultField[] \| null; since: SinceMarker \| null }` | W2 |
| `resultsAnswerContract` | `{ instanceId: InstanceId; instanceState: InstanceState; runId: RunId \| null; kind: ResultKind \| null; step: StepIndex \| null; verb: StepVerb \| null; prunedAtMs: EpochMs \| null; prunedByRule: ContentText \| null; matched: ReadingCount; returned: ReadingCount; truncated: z.boolean(); rows: readonly ContentText[]; storedReturn: RunResult \| null }` — see §3.C | W2 |
| `blankReadingContract` | `{ blank: z.boolean(); colour: HexColour \| null }` — `colour` is non-null exactly when `blank` is true | W3 |
| `machineReadingContract` | `{ freeMemMB: Megabytes; totalMemMB: Megabytes; freeDiskMB: Megabytes \| null; cores: ReadingCount; loadAvg: LoadAverage; oomKillsSinceBoot: ReadingCount \| null; lastOomAt: ContentText \| null }` — the three nullables are "unavailable", never zero | W4 |
| `orphanReadingContract` | `{ pgid: ProcessGroupId; cmd: ContentText \| null; alive: z.boolean() }` | W4 |
| `lastStepReadingContract` | `{ run: RunId; step: StepIndex; verb: StepVerb }` | W4 |
| `instanceEvidenceListingContract` | `{ dir: RepoLocalPath; transcript: FileName \| null; logs: readonly FileName[]; lastShot: FileName \| null }` | W4 |
| `instanceStatusContract` | `{ id: InstanceId; state: InstanceState; specName: SpecName; uptime: ElapsedText \| null; lastBeat: ElapsedText \| null; runs: ReadingCount; rssMB: Megabytes \| null; rssAtLastBeat: Megabytes \| null; lastStep: LastStepReading \| null; orphans: readonly OrphanReading[]; evidence: InstanceEvidenceListing \| null; likelyCause: ContentText \| null }` — see §3.D for which fields are populated when | W4 |
| `statusAnswerContract` | `{ monitored: readonly MonitoredMetric[]; machine: MachineReading; instances: readonly InstanceStatus[] }` | W4 |
| `reapedInstanceContract` | `{ id: InstanceId; staleFor: ElapsedText; killed: readonly ProcessGroupId[]; homeRemoved: z.boolean() }` | W5 |
| `leftAloneContract` | `{ id: InstanceId; why: ContentText }` | W5 |
| `cleanupAnswerContract` | `{ reaped: readonly ReapedInstance[]; portsReleased: readonly NetworkPort[]; lockReleased: z.boolean(); leftAlone: readonly LeftAlone[] }` — **no `assetsAged`** | W5 |
| `compareAnswerContract` | `{ instanceId: InstanceId; runA: RunId; runB: RunId; console: { errors: CountDelta; new: readonly ContentText[] }; server: { errors: CountDelta; new: readonly ContentText[] }; network: { non2xx: CountDelta; new: readonly ContentText[] }; pixels: ContentText \| null }` — **no `elements`** | W5 |

### Three edits to chunk 2's shapes, and one work item owns all of them

`stepReadingContract` and `shotListingContract` each gain the same three perception fields plus, on the
reading, the server-log window. **W3 owns every one of these edits AND the null-wiring that keeps the tree
green**, because the fields ripple into four existing broker tests that assert a complete `StepReading` with
`toStrictEqual`. W11 later replaces W3's nulls with measured values. Both briefs say so.

**`stepReadingContract` gains:**

```
pixelChange: pixelChangeContract.nullable(),   // null on the first capture in an INSTANCE, and on a step with no shot
blank:       z.boolean().nullable(),           // null only when the step took no shot
blankColour: hexColourContract.nullable(),     // non-null exactly when blank is true
serverWindow: serverLogWindowContract,         // the byte range of api-server.log this step was inside
```

**`shotListingContract` gains** the first three of those, identically. It does not gain `serverWindow` — a
shot is a picture, and the server window belongs to the STEP.

**`shotOpenReasonContract` gains two members**: `'blank'` and `'changed'`. The enum becomes
`['blank','failed','start','end','changed']`, **in precedence order**, and W11's transformer reads that order
rather than re-encoding it.

**Why the colour is its own field and not prose in `why`.** The spec prints
`why: 'BLANK — single colour #0d0907 across the whole frame'`. `why` stays the machine-readable enum, because
the founding rule in `packages/siegelense/CLAUDE.md` is that a command returns a READING, and a rendered
English sentence is not one — a caller that wants that sentence builds it from `why` plus `blankColour`. The
colour is not lost; it is addressable.

### Errors

| Class | Carries | Thrown when | Owner |
|---|---|---|---|
| `RunIdRequiredError` | `instanceId`, `instanceState`, `runCount` | `results` was called against a finished instance with no `runId` and no `since: 'boot'`. The message names the state, the count, and says to name a run — it does NOT enumerate them (§3.C) | W2 |
| `ShotDimensionMismatchError` | `previousPath`, `currentPath`, `previousSize`, `currentSize` | two captures being compared have different pixel dimensions. **Never swallowed into a number** (§3.B) | W3 |
| `UnknownResultKindError` | `kind`, `known` | a `kind` outside the six. Names all six | W2 |

### Statics

| Statics | Holds | Owner |
|---|---|---|
| `locationsStatics.siegelense` (**in `@dungeonmaster/shared`**) — added keys | `consoleLog: 'console.jsonl'`, `networkLog: 'network.jsonl'`, `websocketLog: 'ws.jsonl'` | W1 |
| `resultsStatics` | `kinds: { all: ['console','network','ws','server','screenshots','steps'] }` · `since: { boot: 'boot' }` · `limits: { maxRows: 200 }` · `stepRange: { separator: '-' }` | W1 |
| `perceptionStatics` | `blank: { channelTolerance: 4, sampleStride: 7 }` · `pixelChange: { openThresholdPercent: 30, percentSuffix: '%' }` · `diff: { yiqThreshold: 0.1 }` | W1 |
| `machineStatics` | `monitored: [...the five metric names, verbatim from spec line 1170...]` · `procfs: { root: '/proc', vmstat: 'vmstat', stat: 'stat', statm: 'statm', cmdline: 'cmdline', oomKillKey: 'oom_kill', pageSizeBytes: 4096, pgrpField: 4, rssPagesField: 1 }` · `units: { bytesPerMegabyte: 1_048_576 }` | W1 |

**`perceptionStatics.pixelChange.openThresholdPercent` is 30 and the number is quotable**, from spec line 704:
`| large, 30%+ | a navigation, a modal, a collapse |`. It is not a taste call.

**`machineStatics.monitored` is asserted with `toStrictEqual` against the five names spec line 1170 prints**,
in that order. Spec line 1191: "`monitored` answers 'what can I even ask about'. Without it a session guesses
at metric names, and a guess that returns nothing reads exactly like a metric that is zero."

### Two npm dependencies, installed by the COORDINATOR

`pixelmatch` and `pngjs`, plus `@types/pixelmatch` and `@types/pngjs`. **No agent runs this**; it rewrites the
root lockfile and `node_modules`, which races every parallel agent.

```bash
npm install --save   --workspace=@dungeonmaster/siegelense pixelmatch@^5 pngjs@^6
npm install --save-dev --workspace=@dungeonmaster/siegelense @types/pixelmatch @types/pngjs
```

**Pin a CommonJS major.** `@dungeonmaster/siegelense` compiles to CJS and the driver runs `dist/`; an ESM-only
major turns into a `require()` of an ES module at runtime, which fails only when a real driver captures a real
shot — the furthest possible point from the install. The coordinator ran the check before installing, and it
matters: **`pixelmatch` latest is 7.2.0 and declares `type: "module"`.** `pixelmatch@5.3.0` declares no `type`
and its `main` is `index.js`; `pngjs@6.0.0` declares no `type` and its `main` is `./lib/png.js`. Both pinned
majors are CommonJS.

**`pngjs` is pinned to `^6`, not `^7`, for two measured reasons.** `pixelmatch@5.3.0` declares
`dependencies: { pngjs: '^6.0.0' }`, so a top-level `^7` installs a SECOND copy of pngjs rather than sharing
one. And `@types/pngjs` stops at 6.0.5 while `pngjs@7.0.0` bundles no types of its own, so a `^7` runtime
would be typed by a package describing `^6`. Version 7 only raised the Node engine floor, so nothing is given
up. `pixelmatch` takes raw RGBA `Uint8Array`s; `pngjs` is the decoder that produces them.

Both go in `dependencies`, not `peerDependencies` — unlike `@playwright/test`, a consumer never invokes them
and cannot supply them.

---

## 3. The six decisions this chunk has to make, and what it decides

### A. Per-step attribution, and where the buffers land

**The problem.** Spec line 1678 requires every console, network, websocket and server-log entry to carry the
step it fell inside. Chunk 2's console/network/websocket buffers live **only in the driver process's memory**,
behind `lane.browser.readConsoleSince({ fromIndex })`. Spec line 1669 requires every evidence read to resolve
off DISK. Those two are incompatible until something flushes.

**The decision.** Three append-only files per INSTANCE, at the instance evidence root beside `api-server.log`:

```
<evidence>/console.jsonl
<evidence>/network.jsonl
<evidence>/ws.jsonl
```

Each line is one `BufferEntry`: `{ runId, step, atMs, text }`. The run executor flushes after **every step**,
beside the transcript append it already does, tagging each new line with the run and step that just ran. This
is the same rule the transcript already obeys and for the same reason — spec line 1162: "The transcript is
flushed per step, never buffered. A buffered transcript loses the whole run on a crash."

**The flush cursor lives in `driverSessionState`, not in the run.** `state/driver-session/driver-session-state.ts`
is already the singleton holding the one lane a driver owns for its whole life. It gains
`flushCursor()` / `advanceFlushCursor({ consoleLines, networkLines, websocketLines })`. At a run's START, the
executor flushes everything between the stored cursor and `bufferLengths()` as `{ runId: null, step: null }` —
entries that arrived between two runs, which belong to neither. Without that, `since: 'boot'` (spec line 2226,
"the whole timeline, not one run") silently drops them, and a silent drop is the class of bug this build keeps
finding.

**The SERVER log is NOT copied.** It is already an append-only file on disk, and duplicating a multi-megabyte
log into a fourth jsonl is exactly the disk growth spec line 218 names. Instead each `StepReading` carries
`serverWindow: { fromByte, toByte }`, and `results { kind: 'server' }` slices the real log by that range.
`where: { steps: '6-8' }` unions the windows of steps 6 through 8.

**One error pattern, one place.** `runIndexComputeTransformer` already holds `SERVER_ERROR_PATTERN` and the
console-error pattern. W2 moves both into `resultsStatics.patterns` so `where: { level: 'error' }` and the run
index can never disagree about what an error line is, and W11 re-points the transformer at them.

### B. `pixelChange` and `blank`, and what they refuse to guess

**`pixelChange` is per INSTANCE, not per run.** Spec line 692: "the fraction of pixels differing between this
capture and the previous one, **wherever that was taken**." So the previous-shot path also lives in
`driverSessionState`, and the first capture of run 2 compares against the last capture of run 1. `null` is
returned only for the first capture in the whole instance — spec line 1630, "`pixelChange` is `null` on a
first capture, never `0`", and line 708, "Reporting `0` there would manufacture a no-change finding on the
opening step of every walk."

**`blank` is computed FIRST and does not depend on a predecessor.** Spec line 1631 and line 1856: "`blank` is
the one exception, and it is exact. One colour across the whole frame is not a comparison against a previous
state, so nothing about fonts, rasterisation or animation can perturb it." So the blank read runs on every
capture including the first, and its answer is never `null` for a step that captured.

**Full-blank only** (spec line 730). The reader samples every `perceptionStatics.blank.sampleStride`-th pixel
across the decoded frame and answers blank when every sample is within `channelTolerance` of the first. A page
showing chrome with an empty content area is NOT blank, by decision, and the key answers that one.

**A dimension mismatch THROWS rather than returning a number.** No `resize` step exists in this chunk and the
viewport is fixed, so two captures of one instance differing in size is a defect in this tool, not a reading.
`ShotDimensionMismatchError` names both sizes. When `resize` lands (Part 7 item 15) it gets the answer it
needs; inventing `'100%'` now would hide the bug and then have to be unwound.

### C. `results`, and the three things it refuses

**The run id is REQUIRED against a finished instance.** Spec line 1671, and line 2235: "that instance may hold
the prelude's proving run, the walk and a re-walk, and 'latest' would silently read whichever went last." So:

| Call | `instanceState` | Answer |
|---|---|---|
| no `run`, no `since` | `alive` | the latest run — the session driving it knows what latest is |
| no `run`, no `since` | `killed` / `dead` | `RunIdRequiredError` |
| no `run`, `since: 'boot'` | any | the whole timeline, deliberately |
| `run` named | any | that run |

**`RunIdRequiredError` names the COUNT, not the run ids.** Spec line 2380: "`status {}` lists instances and
their state. It never lists their RUNS." The caller holds this instance's id, so a count is already what
`status { instance }` gives it (spec line 2707: `{ state: 'killed cleanly', runs: 2, evidenceComplete: true }`)
— but enumerating ids in an error message is a list a session reads instead of reading its own record. The
message says the state, the count, and points at `status { instance }`.

**`instanceState` rides on EVERY answer**, resolved from the registry and the heartbeat, never from whether
files happened to be present:

| Registry row | Heartbeat | `instanceState` |
|---|---|---|
| absent | — | `unknown` — and `rows: []` with the state saying why |
| `state: 'pruned'` | — | `pruned`, with `prunedAtMs`/`prunedByRule`, `rows: []` |
| `state: 'killed'` | — | `killed` |
| `state: 'alive'` | fresh | `alive` |
| `state: 'alive'` | stale by `isStaleRegistryEntryGuard` | `dead` |

Spec line 2249: "`pruned` and `unknown` are real answers, not empty results."

**The cap self-reports.** `resultsStatics.limits.maxRows` is 200; the answer carries `matched` (how many the
query found), `returned` (how many came back) and `truncated`. Part 7 item 10 calls for exactly this on `dom`;
`network` has the same shape, and an answer that silently returns the first 200 of 900 exchanges is `.first()`
one more layer out.

### D. `status`, and what it will not say

**`status {}` never lists runs or evidence.** Spec line 2380. So `InstanceStatus.evidence` and
`InstanceStatus.lastStep` are `null` for every entry in a `status {}` answer, and populated only in a
`status { instance }` answer. That is a behaviour a test asserts by calling both forms against the same
registry and comparing the two shapes.

**`likelyCause` is a READING** (spec line 1193: "'rss 2980MB against a 2600MB profile peak, kernel OOM kill at
20:11:04' is evidence a session can weigh. 'It ran out of memory' is a claim it cannot"). With no profile
recorded — the state of this chunk — it renders the evidence it has and says the profile is missing rather
than reaching a conclusion:

```
rss 2980MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 2
rss unavailable at last beat; kernel OOM events unavailable
```

**It is `null`, not a sentence, for a live instance.** Nothing went wrong; a cause would be an invention.

**The machine block reads `/proc`, with no child process and no dependency.** `oomKillsSinceBoot` comes from
`/proc/vmstat`'s `oom_kill` counter — the kernel's own count since boot, readable without privileges on any
modern Linux. `lastOomAt` is `null`, because the journal it would come from needs privileges this process may
not have, and spec line 1204 is explicit: "Report it when it is there, say `unavailable` when it is not, and
**never infer a cause from its absence**." RSS per process group is summed from `/proc/<pid>/stat` (field
`pgrp`) and `/proc/<pid>/statm` (resident pages). Where `/proc` is absent, every field answers `null`.

### E. `cleanup` reaps and ages NOTHING, and the field is absent

Spec line 2340 prints `assetsAged: { instances: 3, freedMB: 1840 }`. This chunk omits it.

**The reason is the spec's own, at lines 241–244:** the `WALKED` row is "the one that gets left out, and
leaving it out unprotects a CLEAN happy walk's shots — precisely the evidence the adversarial phase is about
to read… The attacker then arrives with no baseline for a path that passed, on the phase that exists to
compare against one." A citation resolver that covers a `VERIFIED` prelude and an open issue but not a
`WALKED` line is buildable today; shipping ageing on top of it does exactly that damage. `WALKED` needs
Part 7 item 11g — a typed `walked` kind on `questNotes` in `packages/shared` and `packages/orchestrator` —
which is not this package's to write.

So `cleanup` in this chunk: reaps stale instances by staleness, kills their recorded pgids, removes their
throwaway homes, releases their ports, releases a STALE `boot.lock` or `registry.lock`, and reports
`leftAlone`. It never touches an asset. The absent field is the same honest-absence rule chunk 2 applied to
`pixelChange`, and the day the resolver lands the field appears rather than changing meaning.

**`leftAlone` has two real reasons in this chunk**, and both are tested:

- `live — last beat 2s ago` (spec line 1361)
- `reserved — booting, no beat yet` — `isStaleRegistryEntryGuard` already returns `false` for
  `lastBeatMs: null`, and its own header says why: "treating an unbeaten reservation as maximally stale would
  let a staleness reaper kill a boot in progress." That protection is real and `leftAlone` is where a caller
  sees it.

Spec line 1365: "**`leftAlone` is not padding.** A cleanup that reports only what it removed is
indistinguishable from one that removed the wrong thing."

### F. `compare` ships four of five fields

`elements` is absent, for the reason in §1's deferral table. `pixels: 'last capture differs 12%'` ships and is
computed by the same pixel broker `pixelChange` uses, against the two runs' last captures.

**There is no cross-instance form and the contract makes it unsayable** (spec line 282: "two runs of one
instance share a timeline, which is what an index delta means; two instances share nothing but a spec").
`compareQueryContract` takes one `instanceId` and two run ids, and the MCP input contract is `.strict()`, so
`{ instanceA, instanceB }` is a parse error naming the field. That is the assertion, rather than a runtime
check of a shape the types already forbid.

---

## 4. Registration, and the CLI's two new subcommands

### Four more tools, and the cascade is now cheap

Chunk 2 paid the places. `packages/mcp/CLAUDE.md` records the list — seven copies of an allow-list, an eighth
in the install flow's integration test, a ninth in the permissions transformer, four index-aligned arrays in
the owning flow's integration test, plus `smoketestProbeArgsStatics` and `TOOLS_EXEMPT_FROM_SIZE_CAP`. Adding
four names touches the same files with four entries each.

`siegelense-results`, `siegelense-status`, `siegelense-compare`, `siegelense-cleanup`.

**`siegelense-status` and `siegelense-cleanup` take NO required input**, so they stay OUT of
`TOOLS_EXEMPT_FROM_SIZE_CAP` and are invoked with `{}` by the size-cap suite — which is a real assertion, not
a formality: `status {}` is the documented no-argument form (spec line 2376) and `cleanup {}` is the only form
(line 2339). `siegelense-results` and `siegelense-compare` both require `instance`, so both go in the exempt
list, for the reason `packages/mcp/CLAUDE.md` states: "a tool with required input belongs here too… A
`.strict()` contract rejects `{}`."

All four register in `packages/mcp/src/flows/siegelense/siegelense-flow.ts` and are handled by
`SiegelenseHandleResponder`. **That responder is at seven branches after this chunk and each branch carries a
`safeParse`, a `try/catch` and a registry check.** `packages/mcp/CLAUDE.md` names `complexity: max 50` as the
ceiling that broke `QuestHandleResponder`. W17 therefore splits the four read tools into a colocated
`siegelense-read-layer-responder.ts` rather than adding four more branches to the existing file — the same
`<tool>-layer-responder.ts` remedy that file documents.

**`docs` still does not register.** §1's deferral table says why.

### `dungeonmaster siegelense` gains `status` and `cleanup`

The bare invocation prints the fleet (chunk 2). Two subcommands join it, and they are the two an OPERATOR
uses — spec line 2270: the `operating` scope "contains no step verbs at all. Its whole surface is fleet
management — `cleanup` at both ends of the pass, `capacity` before opening a pool, `status` after something
died."

| Invocation | Prints |
|---|---|
| `dungeonmaster siegelense status` | the machine block, the monitored list, and one line per instance |
| `dungeonmaster siegelense status --instance <id>` | that instance in full — last beat, last step, RSS, orphans, evidence paths, `likelyCause` |
| `dungeonmaster siegelense cleanup` | what was reaped, what was released, and what was left alone with its reason |

**Why a command and not only a tool**, the same argument chunk 2 made for the fleet table: a person at a
terminal after a crash has no MCP client, and `status` is the first of the four steps spec line 1331 gives the
operator. `results` and `compare` get NO subcommand — they answer with rows a session queries, not a table a
person scans, and their output belongs in an agent's context rather than a scrollback.

---

## 5. Work items

**Maximum three agents at once.** Waves A, E, H and I run alone because everything downstream reads what they
write, or because one item owns files nothing else may touch.

| Wave | Items | Parallel? |
|---|---|---|
| A | W1 | alone — SEQUENCE |
| B | W2 · W3 · W4 | PARALLEL |
| C | W5 · W6 · W7 | PARALLEL |
| D | W8 · W9 · W10 | PARALLEL |
| E | W11 | alone — SEQUENCE |
| F | W12 · W13 · W14 | PARALLEL |
| G | W15 · W16 | PARALLEL |
| H | W17 | alone — SEQUENCE |
| I | W18 | alone — SEQUENCE |

### Adding a required field to a contract breaks CALLERS that typecheck clean

W3 hit this and it will recur in W9, W10 and W11. `contract.parse()` takes `unknown`, so **TypeScript does not
flag a caller that builds an object missing a newly required key.** Zod rejects it at RUNTIME instead, and a
scoped `--only lint,typecheck` run stays green while the unit tests fail.

So when a work item adds a required field to `stepReadingContract`, `shotListingContract`, `runResultContract`
or any sibling, the file list is never just the contract, its stub and its test. W3's real list also had to
include `run-execute-broker.ts` (the SOURCE, which builds `rawShots`) and `run-result-contract.test.ts`, neither
of which the plan named. Find every construction site by searching for the contract's `.parse(` with a
`python3` walk, and run the unit tests — not only typecheck — before reporting done.

### Rules every work item respects

- **`discover`, `get-project-map` and `get-project-inventory` CANNOT SEE THIS WORKTREE. Never search with
  them here.** The MCP server is rooted at the main checkout, which sits on `master`, and
  `packages/siegelense` does not exist on `master` at all. Measured:
  `get-project-inventory({ packageName: 'siegelense' })` answers `## siegelense (0 files) (empty)`, and
  `discover({ glob: 'packages/siegelense/src/brokers/step/**' })` answers `count: 0`, for a directory holding
  eight broker folders. No rebuild fixes it — the tools point at a different tree.
  **The danger is that an empty answer reads exactly like a package with nothing in it**, which is how a
  session decides code is missing and writes a second copy of it. It also reaches beyond this package:
  `git diff master...siegelense` spans 75 files in `shared`, `testing`, `mcp`, `server`, `ward` and `cli`, so
  for those the tools return `master`'s version rather than the code you are editing.
  Use `Read` for contents, `ls -R` for structure, and a `python3 -c` one-liner over `os.walk` plus a regex to
  search — the root `CLAUDE.md` sanctions that one as the workaround for the blocked native search tools.
- **No agent builds.** `<dungeonmaster-buildDiscipline>`. Report that a build is needed; the coordinator runs it.
- **No agent dispatches a sub-agent.** `HANDOFF.md` records one work item corrupted that way.
- **No agent runs `npm install`.** §2's dependency note.
- **No work item touches `packages/local-eslint` or `eslint.config.js`.** A separate agent owns the
  `.first()`/`.last()` rule; an edit here collides with it.
- **Scoped ward only**, on exactly the files it touched: `npm run ward -- --only lint,typecheck,unit -- <files>`.
  Three agents work in parallel and a wider scope grades their half-written files. The root `CLAUDE.md`'s
  "Which Checks Apply To A File Here" is the reason `--only` is spelled out rather than omitted.
- **Tests assert BEHAVIOUR.** The value that came back, the file that got written, the signal that was sent.
  A test asserting that a callback was passed, that something "rendered", or that a function "was called" is a
  FALSE POSITIVE and is worse than no test. Every work item below names what each test must assert; if an
  assertion can pass while the feature is broken, it is the wrong assertion.
- **Unit and integration tests only. No e2e.**
- `export const` arrow, branded Zod contract on every return, purpose JSDoc above the imports, no `jest.mock`
  / `jest.spyOn` (`registerMock` through a `.proxy.ts`), no `beforeEach`/`afterEach` in a unit test,
  `toStrictEqual`/`toBe` only, tests import `.stub.ts` and never `-contract.ts`.
- **Rewrite the PURPOSE header after the file is real.** The pre-edit hook forces a header written against the
  plan; the one that ships must describe the body, and its second sentence must say when to reach for THIS
  file over its nearest sibling.

### Three coordinator-owned actions

1. **After W1, before any lint in wave B**: `npm run build --workspace=@dungeonmaster/shared`. W1 changes
   `locationsStatics`, and this repo's own ESLint rules import `@dungeonmaster/shared/statics` at module load
   with no `source` condition. The root `CLAUDE.md` names this as one of four build cases this checkout owns.
2. **Before wave C**: the `pixelmatch` / `pngjs` install in §2, with the CJS check.
3. **After W17, before the manual drive**: `npm run build && npm link --workspaces && npm run init`, then
   reconnect the MCP. The driver runs COMPILED output, the MCP child loads `packages/mcp/dist/src/index.js`,
   and `npm run init` is what regenerates `permissions.allow[]` for the four new tool names.

---

### W1 — Location literals and the four statics (wave A, alone)

**Edits (in `@dungeonmaster/shared`, which is why this item runs alone)**

- `packages/shared/src/statics/locations/locations-statics.ts` — add to the existing `siegelense` group, which
  currently ends at `wardQueueDir: 'ward-queue'`: `consoleLog: 'console.jsonl'`, `networkLog: 'network.jsonl'`,
  `websocketLog: 'ws.jsonl'`. **Complete filenames, never bare extensions** — the ledger's "Off-spec work
  delivered alongside chunk 2" records that four bare fragments in this file broke lint across nine packages,
  and `packages/local-eslint` now refuses one outright.
- `packages/shared/src/statics/locations/locations-statics.test.ts` — extend the full-value assertion.

**Creates**

- `packages/siegelense/src/statics/results/results-statics.ts` + `.test.ts`
- `packages/siegelense/src/statics/perception/perception-statics.ts` + `.test.ts`
- `packages/siegelense/src/statics/machine/machine-statics.ts` + `.test.ts`
- barrel lines in `packages/siegelense/statics.ts` for all three

Shapes exactly as §2's statics table. `resultsStatics` also takes `patterns: { consoleError, consoleWarning,
serverError, networkStatus }`, lifted verbatim from `run-index-compute-transformer.ts` lines 28–32 so the run
index and `where: { level }` cannot disagree (§3.A).

**Depends on** nothing.

**Tests**

- `results-statics.test.ts` — `VALID: {kinds.all} => is exactly the six kinds` with `toStrictEqual`, in the
  order spec line 2593 prints them. Asserts each pattern by RUNNING it against a real line: the
  `consoleError` pattern matched against the exact JSON shape `listenersLayerAdapter` writes
  (`{"at":1,"kind":"console","type":"error",…}`) returns true, and against the `"type":"warning"` shape
  returns false. **Asserting the regex source string is a wiring test; asserting what it matches is not.**
- `perception-statics.test.ts` — `VALID: {complete object} => toStrictEqual`, and one test asserting
  `openThresholdPercent` is `30` with the spec line in its name, since that number is quoted evidence.
- `machine-statics.test.ts` — `VALID: {monitored} => is exactly the five metric names` with `toStrictEqual`,
  in spec line 1170's order.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/locations/locations-statics.ts packages/shared/src/statics/locations/locations-statics.test.ts packages/siegelense/src/statics/results/results-statics.ts packages/siegelense/src/statics/results/results-statics.test.ts packages/siegelense/src/statics/perception/perception-statics.ts packages/siegelense/src/statics/perception/perception-statics.test.ts packages/siegelense/src/statics/machine/machine-statics.ts packages/siegelense/src/statics/machine/machine-statics.test.ts packages/siegelense/statics.ts`

**Acceptance criteria, quoted**

> line 1170: `→ monitored: ['rss per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events']`

> line 704: `| large, 30%+ | a navigation, a modal, a collapse                                                     | almost certainly wrong                      |`

> line 2593: `` `console` · `network` · `ws` · `server` (the server logs — the thing nothing surfaces today) · ``
> line 2594: `` `screenshots` · `steps` ``

> line 1191: `- **`monitored` answers "what can I even ask about".** Without it a session guesses at metric names, and a guess that`
> line 1192: `  returns nothing reads exactly like a metric that is zero — the `count: 0` problem again, one layer up.`

---

### W2 — The results query family (wave B, PARALLEL with W3 and W4)

**Creates** under `packages/siegelense/src/contracts/`, each as `<domain>-contract.ts` +
`<domain>-contract.test.ts` + `<domain>.stub.ts`:

`result-kind/`, `result-field/`, `step-range/`, `log-level/`, `http-method/`, `since-marker/`,
`buffer-entry/`, `result-where/`, `results-query/`, `results-answer/`.

**Creates** under `packages/siegelense/src/errors/`, each as `<name>-error.ts` + `<name>-error.test.ts`:

- `run-id-required/run-id-required-error.ts` —
  `({ instanceId, instanceState, runCount }: { instanceId: string; instanceState: string; runCount: number })`
- `unknown-result-kind/unknown-result-kind-error.ts` —
  `({ kind, known }: { kind: string; known: readonly string[] })`

Match chunk 1's and chunk 2's error shape exactly: `public constructor`, raw `string`/`number` params,
`super(...)` then `this.name`.

**Creates** `packages/siegelense/src/transformers/step-range-expand/step-range-expand-transformer.ts` + `.test.ts` —
`({ range }: { range: StepRange }): readonly StepIndex[]`. `'6-8'` becomes `[6, 7, 8]`.

**Edits** `packages/siegelense/contracts.ts` and `packages/siegelense/errors.ts` — barrel lines.

**Fields exactly as §2's tables.** `resultKindContract` is `z.enum(resultsStatics.kinds.all)` — **derived,
never a second list.** `resultWhereContract` and `resultsQueryContract` are both `.strict()`.

**Depends on** W1 (`resultsStatics`).

**Tests**

- `result-kind-contract.test.ts` uses `it.each` over `resultsStatics.kinds.all` — derive the case list from
  the statics, never hardcode it — asserting each parses to itself, plus one `INVALID:` for `'dom'`, which is
  a kind that deliberately does NOT exist yet.
- `step-range-contract.test.ts` — `VALID: {'4-9'}`, `VALID: {'7-7'}` (one step is a real range),
  `INVALID: {'4'}`, `INVALID: {'4-'}`, `INVALID: {'a-b'}`.
- `step-range-expand-transformer.test.ts` — `VALID: {'6-8'} => [6,7,8]` with `toStrictEqual`,
  `VALID: {'7-7'} => [7]`, `EDGE: {'9-6'} => []` (a reversed range expands to nothing rather than throwing,
  because a caller's typo should answer empty rather than crash a query — assert the empty array, not a throw).
- `buffer-entry-contract.test.ts` — `VALID:` a run-attributed entry, and `VALID: {runId: null, step: null}`
  for an entry that arrived between two runs. **Both branches, because the null branch is the between-runs
  case §3.A exists to preserve and a contract that only accepted the attributed form would silently make it
  unwritable.**
- `results-answer-contract.test.ts` — `VALID:` a `steps` answer carrying rows; `VALID: {instanceState:
  'pruned', rows: [], prunedAtMs, prunedByRule}` asserting the complete object with `toStrictEqual`, which is
  what proves a pruned answer is a real answer rather than an empty list; `VALID: {instanceState: 'unknown',
  rows: []}` the same; `VALID: {truncated: true, matched: 900, returned: 200}` asserting BOTH counts, since a
  cap that reports only what it returned is the `.first()` failure one layer out.
- `results-query-contract.test.ts` — `INVALID: {unknownField}` rejected by `.strict()`;
  `VALID: {instanceId only}` (every other member nullable).
- `run-id-required-error.test.ts` — asserts the complete error object (`{ name, message }` plus each context
  field) with `toStrictEqual` on the destructured shape, `instanceof` both ways, AND the rendered message
  against an anchored regex containing the state and the count but **not** any run id. The message is what a
  session reads; a test asserting only that it throws is the false positive this repo's bar refuses.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the thirty-four files>`

**Acceptance criteria, quoted**

> line 2235: `**Against a finished instance the run id is required and `results` refuses to guess**, because that instance may hold`

> line 2249: `**`pruned` and `unknown` are real answers, not empty results.** A query that lands on reclaimed evidence and returns`
> line 2250: `` `[]` reads as "that step produced nothing", which is the one conclusion a fixer must never draw from a missing file — ``

> line 2380: `**`status {}` lists instances and their state. It never lists their RUNS and never lists their evidence** — those appear`

> line 2226: `results { instance: 'inst_7f3a', kind: 'console', since: 'boot' }   // the whole timeline, not one run`

> line 1678: `| Every network, console, ws and log entry carries the STEP it fell inside`

---

### W3 — The step reading's second pass (wave B, PARALLEL with W2 and W4)

**This item owns every field added to `stepReadingContract` and `shotListingContract`, and the null-wiring
that keeps the tree green.** W11 replaces the nulls with measured values. Nothing else may edit these two
contracts in this chunk.

**Creates** under `packages/siegelense/src/contracts/`:

`pixel-change/`, `hex-colour/`, `server-log-window/`, `blank-reading/` — each with contract, test and stub.

**Creates** under `packages/siegelense/src/errors/`:

- `shot-dimension-mismatch/shot-dimension-mismatch-error.ts` + `.test.ts` —
  `({ previousPath, currentPath, previousSize, currentSize }: { previousPath: string; currentPath: string; previousSize: string; currentSize: string })`

**Edits**

- `packages/siegelense/src/contracts/shot-open-reason/shot-open-reason-contract.ts` — the enum becomes
  `['blank','failed','start','end','changed']`, **in precedence order**, and the PURPOSE says so: the order is
  data, and `shotOpenDecideTransformer` reads it rather than re-encoding it.
- `packages/siegelense/src/contracts/step-reading/step-reading-contract.ts` (+ stub, + test) — add
  `pixelChange`, `blank`, `blankColour`, `serverWindow` exactly as §2.
- `packages/siegelense/src/contracts/shot-listing/shot-listing-contract.ts` (+ stub, + test) — add
  `pixelChange`, `blank`, `blankColour`. **Its PURPOSE currently says these fields are deliberately absent;
  rewrite that paragraph to say what they now carry and that `elements` stays absent for the reason §1 gives.**
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` — both `stepReadingContract.parse`
  calls gain `pixelChange: null, blank: null, blankColour: null` and a `serverWindow` built from
  `lane.serverLogLength()` read before and after the verb runs. **The `serverWindow` is REAL from this item
  forward; the three perception fields are null placeholders W11 replaces.**
- Every existing test that asserts a complete `StepReading`, `ShotListing` or `RunResult` with `toStrictEqual`:
  `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.test.ts`,
  `packages/siegelense/src/brokers/run/execute/run-execute-broker.test.ts`,
  `packages/siegelense/src/brokers/run/execute/run-execute-step-layer-broker.test.ts`,
  `packages/siegelense/src/transformers/shot-open-decide/shot-open-decide-transformer.test.ts`,
  `packages/siegelense/src/brokers/run/transcript-append/run-transcript-append-broker.test.ts`.
  **Run each one first and read the real failure before editing it** — a mechanical key-add that guesses at
  the expected object is how an assertion stops asserting.
- `packages/siegelense/contracts.ts`, `packages/siegelense/errors.ts` — barrel lines.

**Depends on** W1 (`perceptionStatics`).

**Tests**

- `pixel-change-contract.test.ts` — `VALID: {'0%'}`, `VALID: {'38%'}`, `VALID: {'100%'}`,
  `INVALID: {'38'}`, `INVALID: {'0.5'}`, `INVALID: {'-1%'}`.
- `blank-reading-contract.test.ts` — `VALID: {blank: true, colour: '#0d0907'}` and
  `VALID: {blank: false, colour: null}`, both with `toStrictEqual` on the complete object. The colour in the
  first is spec line 723's own example and belongs in the test name.
- `step-reading-contract.test.ts` — `VALID:` a complete reading with a real `serverWindow` and a measured
  `pixelChange`; `EDGE: {shot: null} => pixelChange, blank and blankColour are all null` — a step that
  captured nothing measured nothing, and a `blank: false` there would be a claim about a frame nobody took.
- `shot-open-reason-contract.test.ts` — `VALID:` each member via `it.each` derived from `.options`, and one
  test asserting `.options` is the full array **in precedence order** with `toStrictEqual`, naming why the
  order is load-bearing.
- `shot-dimension-mismatch-error.test.ts` — complete error object, `instanceof` both ways, and the rendered
  message matched against an anchored regex containing BOTH sizes.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fourteen new files and the eleven edited files>`

**Acceptance criteria, quoted**

> line 1630: `| `pixelChange` is `null` on a first capture, never `0`                                                          | `0` would manufacture a no-change finding on the opening step of every walk`

> line 1632: `| A blank capture reports its COLOUR                                                                       | blank in the app's own background means the shell rendered and the content did not; blank white means the document died or never styled. Different bugs, different places to look`

> lines 2883–2891, the clean return's shot list, in particular:
> line 2889: `    { step: 5, path: 'run_2/step5.png', pixelChange: '0%',  blank: true,  open: true,`
> line 2890: `      why: 'BLANK — single colour #0d0907 across the whole frame' },`

> line 1631: `| Every capture carries `blank`, and it is checked BEFORE `pixelChange` is interpreted`

> line 2640: `| `elements`    | `+7 under GUILD_ADD_MODAL, -0, moved 2` — a delta, not a fresh key                      |`
> (absent in this chunk — the `toStrictEqual` on the complete `ShotListing` is what proves it)

---

### W4 — The status and machine contracts (wave B, PARALLEL with W2 and W3)

**Creates** under `packages/siegelense/src/contracts/`, each with contract, test and stub:

`megabytes/`, `load-average/`, `elapsed-text/`, `monitored-metric/`, `machine-reading/`, `orphan-reading/`,
`last-step-reading/`, `instance-evidence-listing/`, `instance-status/`, `status-answer/`, `status-query/`.

`statusQueryContract` is `{ instanceId: InstanceId | null }`, `.strict()` — the `status {}` and
`status { instance }` forms in one shape.

**Creates** `packages/siegelense/src/transformers/elapsed-render/elapsed-render-transformer.ts` + `.test.ts` —
`({ elapsedMs }: { elapsedMs: EpochMs }): ElapsedText`. `'2s'`, `'14m'`, `'9h'`, `'3d'` — the largest unit
that yields a whole number ≥ 1, never a compound.

**Edits** `packages/siegelense/contracts.ts` — barrel lines.

**Fields exactly as §2's tables.** `monitoredMetricContract` is `z.enum(machineStatics.monitored)` — derived.

**Depends on** W1 (`machineStatics`).

**Tests**

- `machine-reading-contract.test.ts` — `VALID:` the complete block from spec line 1171 with `toStrictEqual`;
  `VALID: {freeDiskMB: null, oomKillsSinceBoot: null, lastOomAt: null}` — the unavailable case, which is a
  real answer and is what spec line 1204 forbids inferring from. **A test that only covers the populated case
  lets a `0` ship where `null` belongs, which is the exact "a guess that returns nothing reads like a metric
  that is zero" failure.**
- `instance-status-contract.test.ts` — three cases with `toStrictEqual` on the complete object:
  `VALID:` a live instance (`lastStep`, `evidence`, `likelyCause`, `rssAtLastBeat` all `null`; `uptime`,
  `lastBeat`, `rssMB` populated); `VALID:` a dead instance carrying last beat, last step, `rssAtLastBeat`,
  orphans, evidence and `likelyCause`; `VALID:` a fleet-listing entry where `evidence` and `lastStep` are
  `null` **even though the instance is dead**, which is the no-browsing rule (§3.D) expressed in the shape.
- `elapsed-render-transformer.test.ts` — `it.each` over a derived boundary table: 1999ms → `'1s'`,
  59_000 → `'59s'`, 60_000 → `'1m'`, 3_599_000 → `'59m'`, 3_600_000 → `'1h'`, 86_400_000 → `'1d'`. Assert the
  returned string with `toBe`, never that it is defined.
- `orphan-reading-contract.test.ts` — `VALID: {pgid: 33812, cmd: 'npm run dev:no-watch', alive: true}`, spec
  line 1179's own row, plus `VALID: {cmd: null, alive: false}` — a pgid whose `/proc` entry is gone has no
  command line and that is the common case after a reap.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the thirty-five files>`

**Acceptance criteria, quoted**

> lines 1171–1183, the whole `status` return, in particular:
> line 1179: `      orphans:   [ { pgid: 33812, cmd: 'npm run dev:no-watch', alive: true } ],`
> line 1183: `      likelyCause: 'OOM — rss 2980MB at last beat against a 2600MB profile peak; kernel OOM kill at 20:11:04' } ]`

> line 1193: `- **`likelyCause` is a READING, not a verdict.** "rss 2980MB against a 2600MB profile peak, kernel OOM kill at 20:11:04"`

> line 1204: `it is not, and **never infer a cause from its absence** — a missing kernel line is not evidence of a clean death.`

> line 1195: `- **`orphans` carries pgids and whether each is still alive**, because that is what a session needs to decide whether to`

---

### W5 — The cleanup and compare contracts (wave C, PARALLEL with W6 and W7)

**Creates** under `packages/siegelense/src/contracts/`, each with contract, test and stub:

`count-delta/`, `reaped-instance/`, `left-alone/`, `cleanup-answer/`, `compare-query/`, `compare-answer/`.

`compareQueryContract` is `{ instanceId: InstanceId; runA: RunId; runB: RunId }`, `.strict()`.

**Creates** `packages/siegelense/src/transformers/count-delta-render/count-delta-render-transformer.ts` +
`.test.ts` — `({ before, after }: { before: ReadingCount; after: ReadingCount }): CountDelta`. Always signed:
`0` renders `'+0'`, never `'0'`, so a delta is never mistaken for a count.

**Edits** `packages/siegelense/contracts.ts` — barrel lines.

**Depends on** W1, W4 (`ElapsedText`).

**Tests**

- `count-delta-render-transformer.test.ts` — `VALID: {before: 0, after: 2} => '+2'`,
  `VALID: {before: 3, after: 0} => '-3'`, `EDGE: {before: 4, after: 4} => '+0'` with the reason in the name.
- `cleanup-answer-contract.test.ts` — `VALID:` the complete answer from spec line 1357 **minus `assetsAged`**,
  with `toStrictEqual`, which is what proves the field is absent rather than zero;
  `EMPTY: {reaped: [], leftAlone: []} => parses` — a clean machine is a real answer;
  `VALID: {reaped: [], leftAlone: [two entries]}` — the case that matters, where a cleanup removed nothing and
  says why for each.
- `compare-answer-contract.test.ts` — `VALID:` the complete answer from spec line 2857 **minus `elements`**,
  with `toStrictEqual`; `VALID: {pixels: null}` — two runs where one took no shot.
- `compare-query-contract.test.ts` — `INVALID: {instanceA, instanceB}` rejected by `.strict()`, with the
  message naming the unrecognized key. **That is the assertion that proves there is no cross-instance form**,
  and it belongs here rather than as a runtime check the types already forbid.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twenty files>`

**Acceptance criteria, quoted**

> lines 1357–1362, the whole `cleanup` return, in particular:
> line 1361: `    leftAlone: [ { id: 'inst_7f3a', why: 'live — last beat 2s ago' },`

> line 1365: `**`leftAlone` is not padding.** A cleanup that reports only what it removed is indistinguishable from one that removed`

> lines 2855–2861, the whole `compare` return.

> line 282: `**`compare` works within ONE instance, and there is no cross-instance form.** Two runs of one instance share a timeline,`

> line 2350: `**`compare`** — the index delta between two runs. A READING: a computed difference between measured values, never a`

---

### W6 — The pixel adapters (wave C, PARALLEL with W5 and W7)

**Creates** under `packages/siegelense/src/adapters/`:

- `pngjs/decode/pngjs-decode-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ bytes }: { bytes: FileContents }): DecodedFrame`. Wraps `PNG.sync.read`. Returns a `DecodedFrame`
  contract this item also creates: `{ width, height, pixels }` where `pixels` is a `Uint8Array` RGBA buffer.
- `pixelmatch/compare/pixelmatch-compare-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ before, after }: { before: DecodedFrame; after: DecodedFrame }): ReadingCount` — the count of differing
  pixels. Passes `{ threshold: perceptionStatics.diff.yiqThreshold, includeAA: false }`.

**Creates** `packages/siegelense/src/contracts/decoded-frame/` — contract, test, stub. `pixels` is typed as
`z.instanceof(Uint8Array)`; `width`/`height` are branded `PixelCount`.

**Edits** `packages/siegelense/adapters.ts`, `packages/siegelense/contracts.ts` — barrel lines.

**These two adapters are the ONLY files in the package that may import `pixelmatch` or `pngjs`.** An adapter
folder name is its package name; a decoded frame leaves as a contract, never as a `PNG` instance.

**Depends on** W1 (`perceptionStatics`), the coordinator's install.

**Tests**

- `pngjs-decode-adapter.test.ts` — the proxy mocks `PNG.sync.read` via `registerMock`.
  `VALID: {a 2x2 buffer} => returns width 2, height 2 and the exact RGBA bytes` asserted with `toStrictEqual`
  on the complete `DecodedFrame`. `ERROR: {not a PNG} => rejects with the decoder's own message` — the
  adapter adds context and rethrows, it never swallows.
- `pixelmatch-compare-adapter.test.ts` — the proxy mocks `pixelmatch`. `VALID: {two identical frames} =>
  returns 0`; `VALID: {frames differing in 3 pixels} => returns 3`; and one test asserting the OPTIONS object
  handed to `pixelmatch` with `toStrictEqual`, because "the differ was called" is the false positive this
  item exists to avoid and the threshold is what makes the number usable.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 691: `**What it is.** One number per acting step: the fraction of pixels differing between this capture and the previous one,`
> line 692: `wherever that was taken.`

> line 1851: `Determinism is a property of the whole stack, and some of it is outside this tool: font loading races, GPU rasterisation`

> line 752: `**It is noise on an animated page unless the capture is frozen.** That is not a caveat, it is a precondition:`

---

### W7 — The machine adapters (wave C, PARALLEL with W5 and W6)

**Creates** under `packages/siegelense/src/adapters/`:

- `fs/readdir/fs-readdir-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ dirPath }: { dirPath: AbsoluteFilePath }): Promise<readonly FileName[]>`. Answers `[]` for a missing
  directory (ENOENT only; anything else rethrows, mirroring `registry-lock-acquire-broker`'s own fix).
- `fs/stat/fs-stat-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ filePath }: { filePath: AbsoluteFilePath }): Promise<FileStat | null>` — `{ sizeBytes, modifiedAtMs }`,
  `null` on ENOENT.
- `fs/statfs/fs-statfs-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ dirPath }: { dirPath: AbsoluteFilePath }): Promise<Megabytes | null>` — free space, `null` where
  `fs.statfs` is unavailable.
- `os/info/os-info-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `(): { freeMemMB: Megabytes; totalMemMB: Megabytes; cores: ReadingCount; loadAvg: LoadAverage }`. Wraps
  `os.freemem`, `os.totalmem`, `os.cpus`, `os.loadavg`.

**Creates** `packages/siegelense/src/contracts/file-stat/` and `packages/siegelense/src/contracts/pixel-count/`
if W6 has not — coordinate by putting `pixel-count/` in W6 and `file-stat/` here.

**Edits** `packages/siegelense/adapters.ts`, `packages/siegelense/contracts.ts` — barrel lines.

**Depends on** W1 (`machineStatics.units`), W4 (`Megabytes`, `LoadAverage`).

**Tests**

Each adapter's proxy mocks its own npm/node module through `registerMock`, addressed by the path or with
`calledWith([])` for the no-argument `os` calls.

- `fs-readdir-adapter.test.ts` — `VALID: {dir with three files} => returns all three` with `toStrictEqual`;
  `EMPTY: {ENOENT} => returns []`; `ERROR: {EACCES} => rejects` — **the second and third must be separate
  tests, because a broad catch that answers `[]` for a permission error is how a status call reports an empty
  machine.**
- `fs-statfs-adapter.test.ts` — `VALID: {bavail 512000, bsize 4096} => returns 2000` asserting the computed
  megabytes with `toBe`, not that a number came back.
- `os-info-adapter.test.ts` — `VALID:` the complete object with `toStrictEqual`, built from staged
  `os.freemem`/`os.totalmem`/`os.cpus`/`os.loadavg` values, proving the byte→MB conversion rather than the
  call.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fifteen files>`

**Acceptance criteria, quoted**

> line 1214: `**Disk is checked before `start` AND before every large write.** A pre-flight check is necessary and not sufficient —`

> line 1171: `  machine:   { freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8,`
> line 1172: `               loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2, lastOomAt: '20:11:04' }`

---

### W8 — The evidence path resolvers and the buffer append broker (wave D, PARALLEL with W9 and W10)

**Creates** under `packages/siegelense/src/brokers/`:

- `locations/buffer-paths-find/locations-buffer-paths-find-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ evidencePath }: { evidencePath: AbsoluteFilePath }): { console: AbsoluteFilePath; network: AbsoluteFilePath; websocket: AbsoluteFilePath }`.
  Mirrors `locations-run-paths-find-broker.ts`'s shape exactly, reading the three new
  `locationsStatics.siegelense` keys.
- `buffer/append/buffer-append-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ bufferPath, entries }: { bufferPath: AbsoluteFilePath; entries: readonly BufferEntry[] }): Promise<AdapterResult>`.
  One `fsAppendFileAdapter` call carrying every entry as its own JSON line. Appends nothing and answers
  success for an empty array — a step that produced no console output is the common case and must not cost a
  write.

**Edits**

- `packages/siegelense/src/state/driver-session/driver-session-state.ts` + `.proxy.ts` + `.test.ts` — add
  `flushCursor(): { consoleLines: number; networkLines: number; websocketLines: number }`,
  `advanceFlushCursor({ consoleLines, networkLines, websocketLines }): void`,
  `lastShotPath(): AbsoluteFilePath | null`, `setLastShotPath({ path }): void`, and clear all four in
  `clear()`. §3.A and §3.B say why both live here rather than in a run.
- `packages/siegelense/brokers.ts` — barrel lines.

**Depends on** W1, W2 (`BufferEntry`).

**Tests**

- `locations-buffer-paths-find-broker.test.ts` — `VALID: {evidencePath} => the three exact absolute paths`
  with `toStrictEqual` on the complete object.
- `buffer-append-broker.test.ts` — `VALID: {two entries} => appends exactly two newline-terminated JSON
  lines`, asserting the WRITTEN STRING through the fs proxy's `getWrittenFor`, parsed back and compared with
  `toStrictEqual` to the two entries. **Asserting that the adapter was called proves nothing; asserting the
  bytes proves the file is readable by `results`.** `EMPTY: {entries: []} => the adapter is called 0 times`,
  paired with what WAS called in the non-empty case.
- `driver-session-state.test.ts` — `VALID: {advance then read} => the cursor carries forward`;
  `VALID: {clear} => the cursor is back to zero and lastShotPath is null`;
  `EDGE: {lastShotPath before any capture} => null` — the first-capture case `pixelChange` reads.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 1162: `- **The transcript is flushed per step, never buffered.** A buffered transcript loses the whole run on a crash —`

> line 1673: `| Buffers are continuous; a run records its WINDOW, and its index counts only that window`

> line 2226: `results { instance: 'inst_7f3a', kind: 'console', since: 'boot' }   // the whole timeline, not one run`

---

### W9 — The shot readings (wave D, PARALLEL with W8 and W10)

**Creates** under `packages/siegelense/src/brokers/shot/`:

- `blank-read/shot-blank-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ shotPath }: { shotPath: AbsoluteFilePath }): Promise<BlankReading>`. Reads the PNG, decodes it,
  samples every `perceptionStatics.blank.sampleStride`-th pixel, and answers
  `{ blank: true, colour: '#rrggbb' }` when every sample is within `channelTolerance` of the first, else
  `{ blank: false, colour: null }`.
- `change-read/shot-change-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ previousPath, currentPath }: { previousPath: AbsoluteFilePath | null; currentPath: AbsoluteFilePath }): Promise<PixelChange | null>`.
  `null` when `previousPath` is `null`. Throws `ShotDimensionMismatchError` on differing sizes. Otherwise
  `pixelmatchCompareAdapter`'s count over `width * height`, rendered as a whole-number percent.

**Creates** `packages/siegelense/src/transformers/rgba-to-hex/rgba-to-hex-transformer.ts` + `.test.ts` —
`({ red, green, blue }: { red: ColourChannel; green: ColourChannel; blue: ColourChannel }): HexColour`, and
`packages/siegelense/src/contracts/colour-channel/` beside it.

**Edits** `packages/siegelense/brokers.ts`, `packages/siegelense/contracts.ts`, `packages/siegelense/testing.ts`.

**Depends on** W3 (`BlankReading`, `PixelChange`, `HexColour`, `ShotDimensionMismatchError`), W6 (both adapters).

**Tests**

- `shot-blank-read-broker.test.ts` — the proxy stages `pngjsDecodeAdapter` with a real hand-built RGBA buffer.
  `VALID: {a frame that is entirely #0d0907} => { blank: true, colour: '#0d0907' }` asserted with
  `toStrictEqual` on the complete reading — that colour is spec line 723's own app-background case and belongs
  in the test name. `VALID: {a frame that is entirely #ffffff} => { blank: true, colour: '#ffffff' }` — the
  other half of line 724's table, a different bug in a different place.
  `VALID: {a frame with one differing pixel at a sampled offset} => { blank: false, colour: null }`.
  `EDGE: {a frame whose channels vary by less than channelTolerance} => blank: true` — "one colour, **or near
  enough**" (line 716), and this is the test that pins what "near enough" means.
- `shot-change-read-broker.test.ts` —
  `EDGE: {previousPath: null} => returns null` with the spec line in its name, because `0` there is the
  manufactured finding line 708 forbids.
  `VALID: {2 of 100 pixels differ} => '2%'` asserted with `toBe`.
  `VALID: {0 of 100 differ} => '0%'` — `'0%'` is a real reading and must not collapse to `null`.
  `VALID: {100 of 100 differ} => '100%'`.
  `ERROR: {frames of different sizes} => throws ShotDimensionMismatchError naming both sizes` — assert the
  complete error, not that it threw.
- `rgba-to-hex-transformer.test.ts` — `it.each` over a boundary table: `(0,0,0) => '#000000'`,
  `(255,255,255) => '#ffffff'`, `(13,9,7) => '#0d0907'`. Lower-case, always six digits — the contract's regex
  and this transformer must agree, and the `#0d0907` case is what proves zero-padding.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the eleven files>`

**Acceptance criteria, quoted**

> line 708: `**`null` is not `0%`.** The first capture in an instance has no predecessor. Reporting `0` there would manufacture a`
> line 709: `no-change finding on the opening step of every walk.`

> line 716: `So every capture carries `blank`, computed from the frame itself: one colour, or near enough, across the whole viewport.`
> line 717: `It is the cheapest check here and the most severe state it can report.`

> lines 721–724:
> ```
> | the app's own background — `#0d0907` here | the shell rendered and the content did not. React threw, an error boundary caught it and rendered nothing, a route matched nothing |
> | white, or an unstyled default             | the document died or never styled — a bundle that failed to load, a hard navigation to nothing                                     |
> ```

> line 730: `**Full-blank only.** A page showing its chrome and an empty content area is the same class of failure and a harder`

---

### W10 — Instance state and machine readings (wave D, PARALLEL with W8 and W9)

**Creates** under `packages/siegelense/src/brokers/`:

- `instance/state-resolve/instance-state-resolve-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }: { instanceId: InstanceId }): Promise<{ state: InstanceState; entry: RegistryEntry | null }>`.
  The five-way resolution in §3.C's table, reading the registry and `isStaleRegistryEntryGuard`.
- `machine/rss-by-pgid/machine-rss-by-pgid-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ pgids }: { pgids: readonly ProcessGroupId[] }): Promise<Megabytes | null>`. Walks `/proc`, reads each
  numeric entry's `stat` (field `pgrp`) and `statm` (resident pages), sums the pages whose pgrp is in `pgids`,
  and converts. `null` when `/proc` is absent.
- `machine/oom-count/machine-oom-count-broker.ts` + `.proxy.ts` + `.test.ts` —
  `(): Promise<ReadingCount | null>`. Reads `/proc/vmstat`, finds the `oom_kill` line, returns its value.
  `null` when the file or the key is absent.
- `machine/read/machine-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `(): Promise<MachineReading>`. Composes `osInfoAdapter`, `fsStatfsAdapter` over the siegelense root, and
  `machineOomCountBroker`. `lastOomAt` is always `null` in this chunk.
- `orphan/read/orphan-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ pgids }: { pgids: readonly ProcessGroupId[] }): Promise<readonly OrphanReading[]>`. For each pgid,
  `processIsAliveAdapter` (chunk 1) plus the first matching `/proc/<pid>/cmdline` for the command text;
  `cmd: null` where nothing in `/proc` carries that pgrp.

**Edits** `packages/siegelense/brokers.ts`, `packages/siegelense/testing.ts` — barrel lines.

**Depends on** W4 (`MachineReading`, `OrphanReading`, `Megabytes`), W7 (all four adapters), chunk 1
(`registryReadBroker`, `isStaleRegistryEntryGuard`, `processIsAliveAdapter`).

**Tests**

- `instance-state-resolve-broker.test.ts` — five tests, one per row of §3.C's table, each asserting the
  complete `{ state, entry }` with `toStrictEqual`. The `alive`-row-with-a-stale-heartbeat case is the one
  that matters: the registry says `alive` and the answer must be `dead`, because a row nobody updated after a
  SIGKILL is exactly what the heartbeat exists to catch.
- `machine-rss-by-pgid-broker.test.ts` — the proxy stages `fsReaddirAdapter` with a mixed `/proc` listing
  (numeric pids plus `vmstat`, `self`, `uptime`) and `fsReadFileAdapter` with real `stat`/`statm` line shapes.
  `VALID: {two pids in the pgid, one outside} => returns only the two summed` asserted with `toBe` on the
  computed megabytes. `EMPTY: {/proc absent} => returns null`. `EDGE: {pgids: []} => returns 0` — an instance
  with no recorded children costs no memory, which is a different answer from unavailable and must not
  collapse into it.
- `machine-oom-count-broker.test.ts` — `VALID: {vmstat containing 'oom_kill 2'} => returns 2` with `toBe`;
  `EMPTY: {vmstat without the key} => returns null`; `EMPTY: {file absent} => returns null`. **The two null
  cases are separate tests because they are different facts and a single catch-all would hide a parse bug
  behind a missing file.**
- `orphan-read-broker.test.ts` — `VALID: {one live pgid, one dead} => two rows with alive true and false`
  asserted with `toStrictEqual` on the complete array, the live one carrying its command text.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fifteen files>`

**Acceptance criteria, quoted**

> lines 2241–2247, the whole `instanceState` table, in particular:
> line 2245: `| `dead`          | the heartbeat stopped. The transcript ends at the last flushed step; after that is ABSENT, not uneventful |`

> line 1156: `- **A heartbeat file per instance** — pid, instance id, **the process-group ids of every child**, and a timestamp`

> line 1202: `**The OOM evidence is platform-specific and may simply be unavailable.** Kernel OOM kills are readable from the system`

> line 1660: `| Reaping is by STALENESS, never by ownership — no session kills a live instance it does not own`

---

### W11 — The run executor's second pass (wave E, alone)

**This item owns `run-execute-broker.ts`, `run-execute-step-layer-broker.ts`, `step-dispatch-broker.ts` and
`shot-open-decide-transformer.ts`. It runs alone because two separate features both land in those four
files** — per-step buffer flushing and per-capture perception — and splitting them across parallel agents is a
merge conflict by construction.

**Edits**

- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` + `.proxy.ts` + `.test.ts` —
  replace W3's three null placeholders with real values: after the capture, call `shotBlankReadBroker` and
  `shotChangeReadBroker` (the latter against `driverSessionState.lastShotPath()`), then
  `setLastShotPath`. A step with no shot keeps all three `null`. **Both the success and the
  `expect: 'error'` catch branch capture, so both must measure** — chunk 2's own commit history records a
  failed step that never captured as a defect found by code review.
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` + `.proxy.ts` + `.test.ts` —
  - at run start, flush the between-runs tail from `driverSessionState.flushCursor()` to `bufferLengths()` as
    `{ runId: null, step: null }`;
  - after each step's transcript append, flush that step's new console/network/websocket lines tagged with
    this run and step, and advance the cursor;
  - pass the run's own `pixelChange`/`blank`/`blankColour` through onto each `ShotListing`.
- `packages/siegelense/src/transformers/shot-open-decide/shot-open-decide-transformer.ts` + `.test.ts` —
  the signature gains nothing (the fields are already on each `ShotListing`); the policy becomes the five-way
  precedence `blank` → `failed` → `start` → `end` → `changed`, reading
  `shotOpenReasonContract.options` for the order rather than re-encoding it, and
  `perceptionStatics.pixelChange.openThresholdPercent` for `changed`.

**Depends on** W3, W8, W9.

**Tests**

- `step-dispatch-broker.test.ts` —
  `VALID: {a click whose capture is blank} => the reading carries blank true and the app background colour`,
  asserting the complete `StepReading` with `toStrictEqual`.
  `VALID: {the first capture in the instance} => pixelChange is null` — the state has no previous shot.
  `VALID: {a second capture} => pixelChange is the measured percent AND lastShotPath advanced to this shot`,
  asserting both, because a broker that measures correctly and never advances the cursor reports the same
  number forever.
  `VALID: {a step with expect: 'error' that failed} => still carries a measured blank and pixelChange`.
  `EDGE: {a waitFor with no shot} => pixelChange, blank and blankColour are all null and lastShotPath is
  unchanged`.
- `run-execute-broker.test.ts` —
  `VALID: {a two-step run} => console.jsonl received exactly the lines each step produced, each tagged with
  its own step`, asserting the parsed appended entries with `toStrictEqual`. **This is the assertion the whole
  read path rests on; a test that only checks the append broker was called would let an untagged flush ship.**
  `VALID: {lines arriving between two runs} => flushed at the second run's start with runId null and step
  null`, driving two `runExecuteBroker` calls against one lane.
  `VALID: {a run whose steps produce nothing} => no buffer write happens`, paired with the write that DOES
  happen in the first test.
  `VALID: {a run's shots} => each ShotListing carries the pixelChange and blank its step measured`.
- `shot-open-decide-transformer.test.ts` — one test per precedence pair, each naming both reasons:
  `VALID: {a blank shot that is also the failing step} => why is 'blank'`;
  `VALID: {a failing shot that is also the last} => why is 'failed'`;
  `VALID: {a middle shot at 38%} => open true, why 'changed'`;
  `VALID: {a middle shot at 29%} => open false, why null` — the threshold boundary, and the reason
  `openThresholdPercent` is a statics rather than a literal;
  `VALID: {a middle shot at 0%} => open false` — spec line 740's "nothing happened at all" is a finding a
  session reads off the number, not a reason to spend context on the picture.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the ten files>`

**Acceptance criteria, quoted**

> line 676: `- **always capture** — the evidence trail is complete whether or not anyone looked`
> line 677: `- **report how much the picture CHANGED**, as one number against the previous capture`
> line 678: `- **the RUN lists every shot it took and flags which to open** — start, end, and anything the change number makes worth`
> line 679: `  a look. The policy lives in the tool, so no prompt has to carry it and no session has to remember it`

> line 711: `**A BLANK screen is checked FIRST, before `pixelChange` is interpreted at all — and this is the trap it exists to`
> line 712: `stop.** Two consecutive blank frames produce `pixelChange: 0%`, which this design reads as a finding: *the control did`
> line 713: `nothing.* That is the wrong finding. The page is dead, not unresponsive, and a session handed "the button did nothing"`
> line 714: `will go looking at the button.`

> line 1678: `| Every network, console, ws and log entry carries the STEP it fell inside`

> lines 2883–2891, the clean return's shot list, now produced in full except `elements`.

---

### W12 — `results` (wave F, PARALLEL with W13 and W14)

**Creates** under `packages/siegelense/src/brokers/results/`:

- `read/results-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ query }: { query: ResultsQuery }): Promise<ResultsAnswer>`. The whole call.
- `read/transcript-read-layer-broker.ts` + `.proxy.ts` + `.test.ts` — parses `runs/run_N.jsonl` into
  `StepReading[]`, skipping a truncated final line rather than throwing, because a crashed driver leaves
  exactly that and spec line 1206 says everything up to the last flushed step is still queryable.
- `read/buffer-read-layer-layer-broker.ts` … **name it `buffer-read-layer-broker.ts`** + `.proxy.ts` +
  `.test.ts` — parses one of the three buffer files and applies `runId` / `step` / `where` filtering.
- `read/server-window-read-layer-broker.ts` + `.proxy.ts` + `.test.ts` — takes the step windows from the
  transcript, slices `api-server.log` by byte range, applies `where: { level }`.
- `read/run-list-layer-broker.ts` + `.proxy.ts` + `.test.ts` — counts the `runs/*.json` stored returns an
  instance holds, for the run count `RunIdRequiredError` and `status` both report. **Returns a COUNT and the
  latest id, never the list** — §3.C.

**Creates** `packages/siegelense/src/transformers/result-row-project/result-row-project-transformer.ts` +
`.test.ts` — `({ row, fields }: { row: ContentText; fields: readonly ResultField[] | null }): ContentText`.
With `fields: null` the row passes through; otherwise the row is parsed as JSON and reduced to the named keys.

**Edits** `packages/siegelense/brokers.ts`, `packages/siegelense/testing.ts`.

**The dispatch table `resultsReadBroker` implements:**

| `kind` | `step` | Reads | Answers |
|---|---|---|---|
| `null` | `null` | `runs/run_N.json` | the stored `RunResult` in `storedReturn`, `rows: []` |
| `null` | named | `runs/run_N.jsonl` | that step's own reading, with its `verb` |
| `steps` | either | `runs/run_N.jsonl` | every reading, or that step's |
| `console` / `network` / `ws` | either | the matching jsonl | the tagged entries, filtered and projected |
| `server` | either | the transcript's windows + `api-server.log` | the log window, filtered by level |
| `screenshots` | either | `runs/run_N.json` | each `ShotListing`, each carrying its `node` |

**Depends on** W2, W8, W10 (`instanceStateResolveBroker`).

**Tests** — all against a mocked fs through the proxy; the real-tree case is W18.

- `VALID: {no kind, no step, run named} => storedReturn carries the exact RunResult from disk`, asserted with
  `toStrictEqual` against the parsed file, `rows` empty.
- `VALID: {step: 7, no kind} => the reading, the verb and the shot path`, asserting the complete answer.
  This is spec line 2719's own call and its shape belongs in the test name.
- `VALID: {kind: 'network', step: 7} => only the entries tagged with step 7`, asserted with `toStrictEqual` on
  the complete rows array against a fixture holding steps 6, 7 and 8.
- `VALID: {kind: 'network', where: {path, method}} => only the matching exchange`.
- `VALID: {kind: 'network', fields: ['status','responseBody']} => each row reduced to those two keys`,
  asserted on the parsed row object.
- `VALID: {kind: 'server', where: {steps: '6-8', level: 'error'}} => the error lines inside those three steps'
  byte windows`, asserted with `toStrictEqual` against a fixture log whose error line sits inside step 7's
  window and whose other error sits outside it. **The out-of-window error must be ABSENT from the answer;
  that is the assertion, and a test with only one error line in the fixture proves nothing.**
- `VALID: {kind: 'screenshots'} => each shot with its node`, spec line 1077's own baseline-fetch call.
- `VALID: {kind: 'console', since: 'boot'} => entries from run_1 AND run_2 AND the untagged between-runs
  entry`, which is what makes `since: 'boot'` different from naming a run.
- `ERROR: {no run, instanceState killed} => throws RunIdRequiredError naming the state and the count`, and the
  complementary `VALID: {no run, instanceState alive} => reads the latest run`.
- `EMPTY: {unknown instance} => instanceState 'unknown', rows []`, asserting the complete answer — a bad id
  and a walk that found nothing must not read alike.
- `EMPTY: {pruned instance} => instanceState 'pruned' with prunedAtMs and prunedByRule, rows []`.
- `EDGE: {901 matching rows} => matched 901, returned 200, truncated true`, asserting all three.
- `EDGE: {a transcript whose last line is truncated} => the earlier readings still answer`, which is the
  crashed-driver case.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the seventeen files>`

**Acceptance criteria, quoted**

> lines 2222–2226, the five worked `results` calls.

> line 2229: `**With no `step` and no `kind` it returns the RUN's stored return** — the same index, shot list and `stoppedAt` that`

> lines 2719–2723:
> ```
> results { instance: 'inst_9b2c', run: 'run_2', step: 7 }
> → { verb: 'click', instanceState: 'killed',
>     reading: { before: { count: 1, text: 'EXECUTION_ROW_0' }, urlAfter: '/g/quest/abc' },
>     shot: '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_9b2c/run_2/step7.png',
>     pixelChange: '4%', blank: false }
> ```

> lines 2733–2735:
> ```
> results { instance: 'inst_9b2c', run: 'run_2', kind: 'server',
>           where: { steps: '6-8', level: 'error' } }
> → [ '20:11:03 ERROR questListBroker: skipped unreadable quest.json at guilds/…/q3/' ]
> ```

> lines 2617–2621, the per-step network attribution example.

> line 1206: `**A death at step 7 of run 2 does not lose runs 1 and 2.** Everything up to that step is on disk and still queryable`

---

### W13 — `status` (wave F, PARALLEL with W12 and W14)

**Creates** under `packages/siegelense/src/brokers/status/`:

- `read/status-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }: { instanceId: InstanceId | null }): Promise<StatusAnswer>`.
- `read/instance-entry-layer-broker.ts` + `.proxy.ts` + `.test.ts` — builds one `InstanceStatus` from a
  registry row, its heartbeat, and (only when the instance was NAMED) its transcript and evidence listing.
- `read/likely-cause-layer-broker.ts` + `.proxy.ts` + `.test.ts` — renders the evidence sentence from the RSS
  at last beat, the absence of a profile, and the OOM count. **`null` for a live instance.**

**Creates** `packages/siegelense/src/brokers/heartbeat/read/heartbeat-read-broker.ts` + `.proxy.ts` + `.test.ts` —
`({ instanceId, guildId }: { instanceId: InstanceId; guildId: GuildId | null }): Promise<InstanceHeartbeat | null>`.

**Edits**

- `packages/siegelense/src/contracts/instance-heartbeat/instance-heartbeat-contract.ts` (+ stub, + test) — add
  `rssMB: megabytesContract.nullable()`, so a dead instance's `rssAtLastBeat` is a recorded fact rather than a
  guess.
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.ts` (+ proxy, + test) — write it,
  sourced from `machineRssByPgidBroker` over the instance's own pgids.
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts` (+ test) — pass the
  pgids through.
- `packages/siegelense/brokers.ts`, `packages/siegelense/contracts.ts`, `packages/siegelense/testing.ts`.

**Depends on** W4, W10, W12 (`runListLayerBroker`).

**Tests**

- `status-read-broker.test.ts` —
  `VALID: {no instanceId, three registry rows} => one entry each, every evidence and lastStep null`, asserted
  with `toStrictEqual` on the complete answer. **The null evidence on a DEAD row is the assertion; an entry
  that carries its paths in the fleet listing is the no-browsing rule broken.**
  `VALID: {instanceId named, a dead instance} => evidence, lastStep, orphans, rssAtLastBeat and likelyCause
  all populated`, asserted on the complete entry.
  `VALID: {monitored} => exactly machineStatics.monitored` — the list a session reads to know what it may ask.
  `VALID: {a live instance} => likelyCause is null` with the reason in the name.
  `EMPTY: {empty registry} => instances [] and a real machine block` — a clean machine is a real answer, and
  spec line 1199 says calling `status` when nothing is wrong is how a session learns what normal looks like.
- `likely-cause-layer-broker.test.ts` —
  `VALID: {rss 2980, no profile, 2 oom kills} => a sentence naming all three`, asserted with `toBe` on the
  exact string. **Assert the string, not that one came back** — `likelyCause` is what a session weighs and a
  test that accepts any text lets an empty one ship.
  `VALID: {rss null, oom null} => a sentence saying both are unavailable and claiming nothing`.
- `heartbeat-write-broker.test.ts` — `VALID: {pgids with a measurable rss} => the written heartbeat carries
  rssMB`, asserting the parsed written JSON with `toStrictEqual`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nineteen files>`

**Acceptance criteria, quoted**

> lines 2376–2377:
> ```
> status {}                      → the machine, every instance alive or dead, and what is monitored
> status { instance: 'inst_9b2c' } → one instance: last beat, last step, orphans, evidence, likely cause
> ```

> line 1197: `- **`lastStep` is usually the whole answer.** What it was doing when it died. Reliable precisely because the transcript`

> line 1199: `- **It is worth calling when nothing is wrong.** That is how a session learns what normal looks like here, which is what`

> lines 1253–1257, the driver-versus-child table, which is what `status` has to make separable.

> line 2707: `→ { state: 'killed cleanly', runs: 2, evidenceComplete: true }`

---

### W14 — `compare` (wave F, PARALLEL with W12 and W13)

**Creates** under `packages/siegelense/src/brokers/compare/`:

- `read/compare-read-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ query }: { query: CompareQuery }): Promise<CompareAnswer>`. Reads both runs' stored returns for the
  index deltas, both runs' buffer entries for the `new:` lists, and both runs' last shots for `pixels`.
- `read/new-lines-layer-broker.ts` + `.proxy.ts` + `.test.ts` — the set difference: lines present in run B and
  not in run A, capped by `resultsStatics.limits.maxRows`.

**Edits** `packages/siegelense/brokers.ts`, `packages/siegelense/testing.ts`.

**Depends on** W5, W9 (`shotChangeReadBroker`), W12 (the buffer reader layer).

**Tests**

- `VALID: {runA 0 console errors, runB 2} => console.errors '+2' and new naming both messages`, asserted with
  `toStrictEqual` on the complete answer.
- `VALID: {runA 2 errors, runB 2, different messages} => console.errors '+0' and new naming the one that is
  only in B` — **this is the test that proves `compare` is a set difference and not arithmetic on a count**,
  and a suite that only covers a changing count would pass over a broker that never reads a message.
- `VALID: {both runs took shots} => pixels carries a percent`, asserted with `toBe` on the exact string.
- `EDGE: {runB took no shot} => pixels is null`.
- `EDGE: {runA and runB are the same run id} => every delta is '+0' and every new list is empty` — a
  degenerate call is a real reading, not an error.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the seven files>`

**Acceptance criteria, quoted**

> lines 2855–2861, the whole worked `compare`.

> line 2851: `**What is missing today is comparing two runs without doing it by hand.** The point of a cycle is usually the difference`
> line 2852: `between iterations, and a session currently queries both runs and diffs them in its own context — which is the blob`
> line 2853: `problem returning by a side route.`

> line 2864: `That is a READING by the founding rule — a computed difference between two measured values, not a verdict on a unit —`

---

### W15 — `cleanup` (wave G, PARALLEL with W16)

**Creates** under `packages/siegelense/src/brokers/cleanup/`:

- `run/cleanup-run-broker.ts` + `.proxy.ts` + `.test.ts` — `(): Promise<CleanupAnswer>`.
- `run/stale-reap-layer-broker.ts` + `.proxy.ts` + `.test.ts` — for one stale row: signal its recorded pgids,
  remove its home, release its ports, mark it `killed`. Reuses `laneTeardownBroker`'s process-group discipline
  by calling `instanceKillBroker`, which already carries the orphan-reap path for a driver that is gone.
- `run/lock-release-layer-layer-broker.ts` — **name it `lock-release-layer-broker.ts`** + `.proxy.ts` +
  `.test.ts` — releases `boot.lock` and `registry.lock` only when each is STALE by its own TTL, and reports
  whether either was.

**Edits** `packages/siegelense/brokers.ts`, `packages/siegelense/testing.ts`.

**Depends on** W5, W10, chunk 1 (`isStaleRegistryEntryGuard`, `bootLockReleaseBroker`,
`registryLockReleaseBroker`, `instanceReleaseBroker`), chunk 2 (`instanceKillBroker`).

**Tests**

- `VALID: {one live, one stale, one reserved} => only the stale one is reaped; the other two are in
  leftAlone with their own reasons`, asserted with `toStrictEqual` on the complete answer. **This single test
  is the whole item**, and it must assert the complete `leftAlone` array rather than its length, because a
  cleanup that reaped the live instance and reported nothing about it would pass a count check.
- `VALID: {a reaped instance} => its ports appear in portsReleased and its registry row survives as a
  tombstone`, asserting the row read back through the registry proxy — spec line 2385 requires the tombstone
  precisely so a fixer's first call does not answer "unknown instance".
- `VALID: {a fresh boot.lock} => lockReleased false`, and `VALID: {a boot.lock past its TTL} => lockReleased
  true`. Two tests, because a cleanup that always releases the lock breaks a boot in progress.
- `EMPTY: {empty registry} => every field empty, lockReleased false` — safe to run at any moment.
- `VALID: {a stale instance whose driver is already gone} => its recorded pgids are signalled anyway`, which
  is the SIGKILL case and the only recovery path there is.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the eleven files>`

**Acceptance criteria, quoted**

> line 1368: `**It is safe to run at any moment, including mid-pass**, because it only ever acts on staleness. The operator's own`
> line 1370: `**No cleanup kills a live instance, ever**, and none prunes evidence a`

> lines 1357–1362, the whole `cleanup` return — minus `assetsAged`, per §3.E.

> line 1159: `- **Reaping on next contact.** Any instance whose heartbeat is older than a few beats is presumed dead: `start` and`
> line 1160: `  `capacity` sweep opportunistically, and `cleanup` does it explicitly. They kill its groups, remove its home, and SAY`
> line 1161: `  SO. That is the only recovery path there is.`

> line 2385: `**A reaped entry survives as a tombstone for as long as its evidence does.** Otherwise `cleanup` — which any session may`

---

### W16 — `dungeonmaster siegelense status` and `cleanup` (wave G, PARALLEL with W15)

**Creates** under `packages/siegelense/src/responders/siegelense/`:

- `status/siegelense-status-responder.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }: { instanceId: InstanceId | null }): Promise<AdapterResult>`. Writes through
  `process.stdout.write`, never `console.log`, matching `SiegelenseFleetResponder`.
- `cleanup/siegelense-cleanup-responder.ts` + `.proxy.ts` + `.test.ts` — `(): Promise<AdapterResult>`.

**Creates** `packages/siegelense/src/transformers/status-answer-render/status-answer-render-transformer.ts` +
`.test.ts` and `packages/siegelense/src/transformers/cleanup-answer-render/cleanup-answer-render-transformer.ts` +
`.test.ts` — `({ answer }: { answer: StatusAnswer }): ContentText` and its sibling. **Pure rendering lives in
a transformer so it is provable without stdout**, which is the same split `registryEntryRowFormatTransformer`
already uses.

**Edits**

- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` + `.test.ts` — add `status` and `cleanup` to
  the `COMMANDS` table and route them. The flow keeps no branching logic beyond the route table.
- `packages/siegelense/src/startup/start-siegelense.ts` — its USAGE header gains the two new invocations.

**Depends on** W13, W15.

**Tests**

- `status-answer-render-transformer.test.ts` —
  `VALID: {a fleet answer with two instances} => the exact rendered text`, asserted with `toBe` on the whole
  string. A snapshot or a substring check is not an assertion here; the whole point is what a person reads.
  `VALID: {a named dead instance} => the text carries the orphan pgids, the evidence dir and likelyCause`,
  again as the whole string.
  `EMPTY: {no instances} => a plain sentence, never an error` — the same rule
  `SiegelenseFleetResponder` already follows.
- `cleanup-answer-render-transformer.test.ts` — `VALID: {one reaped, two left alone} => the exact text
  including both reasons`. `leftAlone` must be visible in the rendering, for spec line 1365's reason.
- `siegelense-status-responder.test.ts` — the proxy spies `process.stdout.write` with `registerSpyOn` and the
  test asserts the written text via `callsMatching`. `VALID: {no instance} => the fleet form`;
  `VALID: {--instance named} => the single form`.
- `siegelense-flow.test.ts` — `VALID: {args ['status']} => the status responder ran`;
  `VALID: {args ['status','--instance','inst_x']} => it ran with that id`;
  `VALID: {args ['cleanup']} => the cleanup responder ran`;
  `VALID: {args []} => the fleet responder still runs` — the existing route must survive.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fourteen files>`

**Acceptance criteria, quoted**

> line 1331: `1. `status` — what died, what is orphaned, what the machine looks like now.`
> line 1332: `2. `cleanup` — reap what has gone stale. Reaping is by STALENESS, so any session may do it; what makes this the`

> line 2270: `**One scope per tool-using role**, and `operating` is the odd one out in a way worth stating: **it contains no step`
> line 2271: `verbs at all.** The operator never submits a batch. Its whole surface is fleet management — `cleanup` at both ends of`

> line 1348: `**So the operator calls `cleanup` twice: once at the START of its pass, once at the END.**`

---

### W17 — Register the four tools (wave H, alone)

**This is one item because splitting nine copies of one allow-list across two agents is a merge conflict by
construction.** `packages/mcp/CLAUDE.md`'s "one edit of roughly 29" list is the checklist; read it before
starting and expect five or six scoped ward runs, each fixing one red file. That treadmill is the documented
shape, not a sign anything is wrong.

**Creates** under `packages/mcp/src/contracts/`, each with contract, test and stub:

`siegelense-results-input/`, `siegelense-status-input/`, `siegelense-compare-input/`,
`siegelense-cleanup-input/` — all `.strict()`.

- `siegelenseResultsInputContract` — `{ instanceId: string; runId?: string; step?: number; kind?: string; where?: {...}; fields?: string[]; since?: string }`
- `siegelenseStatusInputContract` — `{ instanceId?: string }`
- `siegelenseCompareInputContract` — `{ instanceId: string; runA: string; runB: string }`
- `siegelenseCleanupInputContract` — `z.object({}).strict()`

**Creates** `packages/mcp/src/responders/siegelense/handle/siegelense-read-layer-responder.ts` + `.proxy.ts` +
`.test.ts` — the four read tools, split out of `SiegelenseHandleResponder` for the `complexity: max 50` reason
§4 gives.

**Edits**

- `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts` + `.test.ts` — the four names.
- `packages/mcp/src/flows/siegelense/siegelense-flow.ts` + `.integration.test.ts` — four registrations, and
  the four index-aligned arrays in the integration test.
- `packages/mcp/src/responders/siegelense/handle/siegelense-handle-responder.ts` + `.proxy.ts` + `.test.ts` —
  delegate the four to the layer responder.
- `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` — four entries; its
  test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names.
- `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` — `siegelense-results` and
  `siegelense-compare` into `TOOLS_EXEMPT_FROM_SIZE_CAP`; `siegelense-status` and `siegelense-cleanup` stay
  OUT and are therefore invoked with `{}` by the size-cap suite, which is a real assertion (§4). Plus a
  `describe('tools/call with siegelense-<name>')` block per tool, driving the real stdio server.
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` — seven copies.
- `packages/mcp/src/flows/install/install-flow.integration.test.ts` — the eighth.
- `packages/mcp/src/transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts` — the
  ninth, whose test NAME carries the tool count.
- `packages/mcp/brokers.ts`, `packages/mcp/testing.ts` if any new broker is reached.

**Depends on** W12, W13, W14, W15.

**Tests**

- Each input contract: `INVALID: {unknown key}` rejected by `.strict()` naming the key;
  `INVALID: {}` for the three that require input; `VALID: {}` for `cleanup`.
- `siegelense-read-layer-responder.test.ts` — one test per tool asserting the returned `ToolResponse`'s parsed
  JSON with `toStrictEqual` against the broker's answer, and one per tool asserting the `isError: true` shape
  for a rejected parse. **Assert the parsed payload, not that a response came back.**
- `siegelense-flow.integration.test.ts` — the four registrations, with their descriptions and schema types
  index-aligned.
- `mcp-server-flow.integration.test.ts` — `tools/call` against the real stdio server for each of the four,
  asserting `response.error` is `undefined` and the parsed result carries the field that proves the call ran:
  `instanceState` for `results`, `monitored` for `status`, `leftAlone` for `cleanup`, `pixels` for `compare`.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <every touched file>`

**Acceptance criteria, quoted**

> line 2162: `**Every tool below is registered as `siegelense-<name>`** — `siegelense-start`, `siegelense-run`, and so on. The`

> line 2167: `**Only `start`, `run` and `kill` need a live instance.** The other ten read the asset tree, the registry or the machine,`
> line 2168: `so a session that only wants to read a finished walk starts nothing and holds no pool slot. Part 1 has the table.`

> lines 269–275, the whole "what each call needs" table.

---

### W18 — The read-path integration suite (wave I, alone)

**This suite is the reason this chunk is buildable today.** It proves the whole read path against a REAL
evidence tree on disk, with no driver, no browser and no port pair — so the open Jest-worker driver-spawn bug
does not touch it.

**Creates**

- `packages/siegelense/test/harnesses/evidence-tree/evidence-tree.harness.ts` — builds a complete instance
  evidence tree under an `installTestbedCreateBroker` temp dir: a `registry.json` holding a killed instance
  and a live one, a `heartbeat.json`, `runs/run_1.json`, `runs/run_1.jsonl`, `runs/run_2.json`,
  `runs/run_2.jsonl`, `runs/run_1/step1.png` and `runs/run_2/step1.png` as REAL PNGs (one solid-colour, one
  not), `console.jsonl`, `network.jsonl`, `ws.jsonl` and `api-server.log`. Exposes `beforeEach`/`afterEach`
  so the ts-jest transformer wires the lifecycle.
- `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts` — the suite.

**The PNGs must be real files, written by `pngjs`**, not fixtures copied in. A solid `#0d0907` frame and a
frame differing from it by a known pixel count are what make the `blank` and `pixelChange` assertions
meaningful rather than mocked.

**Depends on** every prior item.

**Tests** — each drives the real flow or the real broker against the real tree:

- `VALID: {results, run named, no kind} => the stored RunResult read back byte-for-byte`, asserted with
  `toStrictEqual` against the object the harness wrote.
- `VALID: {results, kind: 'console', step: 2} => only step 2's entries`, asserted on the complete rows array.
- `VALID: {results, kind: 'server', where steps and level} => the one error line inside the window`, with a
  second error line OUTSIDE the window in the fixture that must not appear.
- `VALID: {results, kind: 'screenshots'} => both shots with their node labels and their measured
  pixelChange and blank`, asserted with `toStrictEqual` — and the blank one must carry `#0d0907`, which is
  the whole `blank` mechanism proved end to end off real bytes.
- `ERROR: {results, killed instance, no run} => RunIdRequiredError`.
- `EMPTY: {results, an id the registry never held} => instanceState 'unknown', rows []`.
- `VALID: {compare run_1 against run_2} => the deltas and a real pixels percent`.
- `VALID: {status, no instance} => both rows, no evidence, no lastStep`.
- `VALID: {status, the killed instance named} => its evidence dir, its transcript name, its last shot and its
  last step`, all read off the real tree.
- `VALID: {cleanup} => the stale row reaped, the live row in leftAlone`, asserted on the complete answer and
  then on the registry file READ BACK FROM DISK, proving the tombstone survived.
- `VALID: {dungeonmaster siegelense status through SiegelenseFlow} => the rendered text`, driving the flow
  with `args: ['status']` and asserting the captured stdout.

**Every returned path in every assertion must be absolute and repo-local.** Spec line 2726: "That `shot` path
is absolute and inside the repo, so the next move is a plain `Read` of it. A path under someone's home
directory would hand back a filename the reader cannot open, which is the same as handing back nothing." One
test asserts exactly that, on the shot path `results { kind: 'screenshots' }` returns.

**Ward** `npm run ward -- --only lint,typecheck,integration -- packages/siegelense/test/harnesses/evidence-tree/evidence-tree.harness.ts packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts`

**Acceptance criteria, quoted**

> lines 2689–2692:
> ```
> **A fixer arrives after the walk is over and the instance is gone.** Its record carries an instance id, a run id, a
> failing step, the prelude and the evidence paths — and **steps 1 to 4 below start nothing**. They read the asset tree
> and the registry, cost no boot and no pool slot, and answer exactly as well for an instance killed an hour ago as for
> one still running.
> ```

> line 2726: `**That `shot` path is absolute and inside the repo**, so the next move is a plain `Read` of it. A path under someone's`

> line 265: `**So the rule is one rule, not a branch: every evidence read resolves off disk, whether the instance lives or not.** Not`

---

## 6. Dependency graph

```
                              W1  (statics + shared locations)
                               │
              ┌────────────────┼────────────────┐
             W2               W3               W4
    (results query)   (step reading 2nd pass) (status contracts)
              │                │                │
       ┌──────┴───┐       ┌────┴────┐      ┌────┴──────┐
       │          │       │         │      │           │
      W8         W12     W6        W9     W5          W7
  (buffer     (results   (pixel   (shot  (cleanup/  (machine
   paths +     read)      adapters) reads) compare    adapters)
   append)        ▲         │        ▲     contracts)     │
       │          │         └────────┘         │          │
       └──────────┼──────────────────┐         │          │
                  │                  │         │          ▼
                  │                 W11        │         W10
                  │           (run executor    │    (state + machine
                  │            second pass)    │       readings)
                  │                            │          │
                  └───────┬────────────────────┴──────────┘
                          │
              ┌───────────┼───────────┐
             W12         W13         W14          (wave F)
          (results)    (status)   (compare)
                  │       │        │
                  └───┬───┴────────┘
                      │
              ┌───────┴────────┐
             W15              W16                  (wave G)
          (cleanup)   (CLI status/cleanup)
                  │              │
                  └──────┬───────┘
                        W17                        (wave H)
                 (four registrations)
                         │
                        W18                        (wave I)
                (read-path integration)
```

| Wave | Items | Each item's blockers |
|---|---|---|
| A | W1 | — |
| B | W2 · W3 · W4 | all: W1 |
| C | W5 · W6 · W7 | W5: W4 · W6: W3 + the coordinator install · W7: W4 |
| D | W8 · W9 · W10 | W8: W2 · W9: W3, W6 · W10: W4, W7 |
| E | W11 | W3, W8, W9 |
| F | W12 · W13 · W14 | W12: W2, W8, W10 · W13: W4, W10, W12 · W14: W5, W9, W12 |
| G | W15 · W16 | W15: W5, W10 · W16: W13, W15 |
| H | W17 | W12, W13, W14, W15 |
| I | W18 | everything |

**Wave G runs two agents, not three, and the third slot stays empty on purpose.** The item that would have
filled it is the `.first()`/`.last()` lint rule, which a separate agent owns — see §1's "Built separately"
table. Nothing here may be pulled forward to fill the slot: every remaining item's blockers are real.

**W13 and W14 both depend on W12 and all three sit in wave F.** That is deliberate and it is the one place
this graph asks an agent to build against a sibling's in-flight file. It is safe because the dependency is on
`runListLayerBroker` and the buffer reader layer **as SIGNATURES, not as behaviour**: W12's brief writes both
before its own broker, and W13's and W14's proxies mock them. If the coordinator would rather not take that
risk, split wave F into `W12` alone then `W13 · W14` — one extra wave, no other change.

---

## 7. The manual-drive script

**Prerequisite: the coordinator's build (§5, action 3) has run and the MCP client has been reconnected.** The
driver runs compiled output and the MCP child loads `packages/mcp/dist/src/index.js`; without both, `status`
answers from chunk 2's binary and the four new tools are not there at all.

### 1 — The terminal, with no MCP client at all

```bash
dungeonmaster siegelense status
```

The machine block, the five monitored metric names, and one line per instance. On a clean machine: real
`freeMemMB` / `totalMemMB` / `cores` / `loadAvg` numbers, an `oomKillsSinceBoot` count (or `unavailable`), and
`No siegelense instances.` **That is the call worth making when nothing is wrong** — spec line 1199 — and it
is how you learn what normal looks like before anything dies.

```bash
dungeonmaster siegelense cleanup
```

On a clean machine: nothing reaped, nothing released, nothing left alone. Safe at any moment, by design.

### 2 — Stand an instance up and drive it (chunk 2's surface, unchanged)

```
siegelense-start { spec: 'dungeonmaster-web' }
```

Blocks ~20s and hands back the manifest. Keep the `instance` id and the `evidence` path — **there is no
lookup call and there will not be one** (spec line 2202).

```
siegelense-run {
  instance: '<id>', stopOn: 'error',
  steps: [
    { step: 'goto',       path: '/' },
    { step: 'waitFor',    target: '[data-testid="GUILD_LIST"]', state: 'visible', node: 'home-rendered' },
    { step: 'screenshot', name: 'home.png' },
    { step: 'eval',       source: 'document.title' },
  ],
}
```

**New in this chunk:** the returned `shots` array now carries `pixelChange` and `blank` on every row. The
first shot reads `pixelChange: null` — not `'0%'` — because it is the first capture in this instance.

### 3 — Read what the run actually saw. This is the chunk.

```
siegelense-results { instance: '<id>', run: 'run_1' }
```

The stored return, byte-identical to what `run` handed back — **including for a session that never made the
run.**

```
siegelense-results { instance: '<id>', run: 'run_1', step: 4 }
```

Step 4's own reading — the `document.title` the `eval` returned — with its verb, its shot path, its
`pixelChange` and its `blank`. **This is the call that did not exist an hour ago**, and it is the only way a
step's reading has ever been readable.

```
siegelense-results { instance: '<id>', run: 'run_1', kind: 'network' }
siegelense-results { instance: '<id>', run: 'run_1', kind: 'network', step: 1 }
```

The second returns only the exchanges that fell inside step 1 — the `goto`. Compare the two counts: that
difference is per-step attribution, working.

```
siegelense-results { instance: '<id>', run: 'run_1', kind: 'network',
                     where: { path: '/api/guilds', method: 'GET' },
                     fields: ['status', 'responseBody'] }
```

One exchange, projected to two fields.

```
siegelense-results { instance: '<id>', run: 'run_1', kind: 'server', where: { level: 'error' } }
siegelense-results { instance: '<id>', run: 'run_1', kind: 'screenshots' }
```

The second lists each shot with its `node` label — `home-rendered` on the `waitFor` — which is the baseline
fetch spec line 1077 defines, and the `Read` of those paths is a plain `Read`.

### 4 — Make a blank screen and watch the tool say so

```
siegelense-run { instance: '<id>', steps: [ { step: 'goto', path: '/this-route-does-not-exist' } ] }
```

The returned shot carries `blank: true`, a `blankColour` (the app's own background, or white if the document
never styled), `open: true` and `why: 'blank'`. **`blank` outranks every other open reason**, and the colour
is what tells "the shell rendered and the content did not" from "the document died" — spec lines 721–724. A
walk that sees this and checks `status` first does not write down a rendering bug that never existed.

### 5 — Compare two runs

```
siegelense-compare { instance: '<id>', runA: 'run_1', runB: 'run_2' }
```

Signed deltas for console, server and network, the messages that are new in run 2, and
`pixels: 'last capture differs N%'`. Try `{ instanceA: '<id>', instanceB: '<other>' }` — it is rejected by
name, because there is no cross-instance form.

### 6 — The post-mortem, for real

```
siegelense-status {}
siegelense-status { instance: '<id>' }
```

The first lists the instance with its state, uptime, last beat, run count and live RSS — and **no evidence
paths and no last step**, which is the no-browsing rule. The second adds all of them.

Now kill the driver the hard way, from a second terminal:

```bash
kill -9 $(pgrep -f 'siegelense driver --instance <id>')
```

Wait ~20 seconds, then:

```
siegelense-status { instance: '<id>' }
```

`state: 'dead'`, the last beat, the last STEP it ran, `rssAtLastBeat`, the surviving orphan pgids with
`alive: true`, the evidence paths, and a `likelyCause` that states evidence and claims nothing.

```
siegelense-results { instance: '<id>', run: 'run_1', step: 4 }
```

**Still answers, with `instanceState: 'dead'`.** The driver is gone; the evidence is not.

### 7 — Clean up and read the dead

```
dungeonmaster siegelense cleanup
```

The dead instance is reaped by staleness, its orphan pgids signalled, its home removed, its ports released.
Any instance still beating appears in `leftAlone` with `live — last beat Ns ago`.

```
siegelense-results { instance: '<id>', run: 'run_1', kind: 'screenshots' }
siegelense-status  { instance: '<id>' }
```

Both still answer. The registry row survived `cleanup` as a TOMBSTONE — spec line 2385 — so the fixer's first
call does not get "unknown instance" for a walk whose shots are sitting on disk.

Finally, the one that must NOT answer with an empty list:

```
siegelense-results { instance: 'inst_deadbeef', run: 'run_1' }
```

`instanceState: 'unknown'`, `rows: []`, and the state saying why. A mistyped id and a walk that found nothing
must never read alike.

### What a person still CANNOT do after this chunk

Ask what the machine can take (`capacity`). Read a spec's measured cost (`profile`). Reclaim disk (`prune`).
See what a `reset` could return to (`snapshots`). Seed a state (`recipes`). Read the tool's own manual
(`docs`). Run `look`, `health`, `until`, `hold`, `video`, `reset`, `snapshot`, `seed`, `request`, `resize`,
`before`, `key`, `paste`, `box`, `dom`, `storage` or `file`. Read an `elements` delta. **Each of those is
absent rather than broken, and that is the intended answer.**

---

## 8. Risks this plan is taking on purpose

**Two new runtime dependencies on a published package.** `pixelmatch` and `pngjs` ship to every consumer of
`dungeonmaster`. Both are small and dependency-free, and the alternative — hand-rolling PNG inflate and
filter reconstruction over `zlib` — is exactly the kind of code that passes its own tests and then decodes one
real Chromium screenshot wrong. The ESM hazard in §2 is the real risk and the `npm view` check is the guard.

**`/proc` makes the machine block Linux-only.** Every field answers `null` elsewhere, which is honest, but a
macOS developer sees an emptier `status` than this plan's screenshots suggest. Stated rather than discovered.
The spec already calls the OOM evidence "platform-specific and may simply be unavailable" (line 1202); this
extends the same treatment to RSS and free memory rather than inventing a second mechanism.

**The buffer flush writes three more files per instance, per step.** A forty-step run does 120 appends it did
not do before. Each is small and append-only, and the alternative is evidence that only the driver's memory
holds — which is the shape spec line 1669 forbids. If it measures badly, the fix is batching per RUN, and that
loses exactly the crash resilience line 1162 bought.

**`status`'s RSS reading arrives before the profile that gives it meaning.** `likelyCause` will say "no
profile recorded" on every death until chunk 4. That is a weaker sentence than spec line 1183's example, and
it is a true one. The alternative — holding `status` until `capacity` exists — leaves a walker with no way to
tell a tool death from an app defect, which is the trap spec line 1259 names.

**A separate agent is changing `eslint.config.js` while these waves run.** The `.first()`/`.last()` rule
lands in `packages/local-eslint` and is scoped to `packages/siegelense/src/brokers/step/**` and
`packages/siegelense/src/adapters/playwright/**` — which is W11's territory and W6's. If a scoped ward run in
wave C, D or E comes back red naming `no-locator-pick` on a file the agent did not write, the rule arrived
mid-wave; **the fix is to obey it, never to suppress it on a step broker**, and the coordinator should be told
rather than the config edited.

**The chunk does not touch the open driver-spawn bug and does not unblock the teardown suite.** That is
another agent's work, by instruction. If it lands mid-chunk, nothing here changes.

---

## 9. Ledger rows this chunk expects to move

`build-ledger.md` is owned by another agent. These are the rows this plan covers and the status each should
carry once chunk 3 is planned.

| Ledger section | Row (heading text) | Expected status |
|---|---|---|
| Part 1 | Decision: an INSTANCE service, reached over MCP | `PLANNED chunk 3 (part)` — seven of the thirteen registered |
| Part 1 | The shape | `PLANNED chunk 3` — `results` completes the four-call shape this row names |
| Part 1 | An instance is a TIMELINE of runs, and every run is addressable | `PLANNED chunk 3 (part)` — every run stays queryable and addressable by run id plus step; the retention window and refs stay open |
| Part 1 | Reading evidence starts nothing, and that is a SEPARATE PATH through the tool | `PLANNED chunk 3 (part)` — `results`, `compare`, `status` and `cleanup` all resolve off disk; `prune`'s refusals and `snapshots` stay open |
| Part 2 | Perception: three artifacts, and they are not interchangeable | `PLANNED chunk 3 (part)` — the shot and the key's separation plus the change number and the open policy; the MAP stays open by the spec's own ordering |
| Part 2 | `pixelChange` — an attention router, not a measurement | `PLANNED chunk 3` — the whole section except the element-delta pairing, which is noted as riding with `look` |
| Part 2 | Baselines: promoting a walk's shots | `PLANNED chunk 3 (part)` — the fetch mechanism (`results { kind: 'screenshots' }` per node against the happy walk's instance); the promotion rule itself is spec-side |
| Part 2 | When it dies without warning: OOM, SIGKILL, a full disk | `PLANNED chunk 3 (part)` — adds `status`, `likelyCause` and the OOM/RSS/disk readings; the disk pre-flight refusal on `start` stays open |
| Part 2 | The crash a walker must NOT mistake for a defect | `PLANNED chunk 3` (tooling half) — `status` separates a driver death from a child death and `blank` rides every capture; the ordering rule stays prompt text |
| Part 2 | Handing a defect to a fixer: what a walker must write down | `PLANNED chunk 3` (tooling half) — `results` answers for a killed instance and requires the run id against a finished one |
| Part 2 | What the operator owns after a crash | `PLANNED chunk 3 (part)` — steps 1 and 2 of four; step 3 (`capacity`) stays open |
| Part 2 | `cleanup` — the operator's bookend | `PLANNED chunk 3 (part)` — reaping, ports, lock and `leftAlone`; asset ageing stays open behind item 11g |
| Part 4A | Perception: shots, pixelChange, animation | `PLANNED chunk 3 (part)` — adds 1628, 1629, 1630, 1631, 1632, 1633, 1634; `hold`, `video` and the motion rows stay open |
| Part 4A | The service: instances, runs, batches | `PLANNED chunk 3 (part)` — adds 1669, 1670, 1671, 1672, 1675, 1678; `docs`, profile samples, ageing and settle stay open |
| Part 5 | What the TOOLING must guarantee | `PLANNED chunk 3 (part)` — the append-only evidence row now READABLE per step as well as written |
| Part 5 | Animation is the one that conflicts with the product | `PLANNED chunk 3 (part)` — the frozen-capture precondition is now load-bearing because `pixelChange` exists; the `before` lever for JS-driven motion stays open |
| Part 5 | The honest limit | `PLANNED chunk 3` — both rows |
| Part 7 | 2 | `PLANNED chunk 3 (part)` — adds `results`, `status`, `cleanup`; `capacity`, `profile`, `docs`, refs and RSS SAMPLING stay open |
| Part 7 | 2a | `PLANNED chunk 3` — the evidence read path, whole |
| Part 7 | 4 | `PLANNED chunk 3` — the transcript is written by the instance (chunk 2) and readable by anyone (chunk 3) |
| Part 7 | 6 | `PLANNED chunk 3` — the change number completes it |
| Part 7 | 10 | `PLANNED chunk 3 (part)` — the `network` half with `where` and `fields` plus a self-reporting cap; the `dom` half stays with the ladder |
| Part 7 | 13b | `PLANNED chunk 3 (part)` — `compare` minus its `elements` field |
| Part 7 | 16 | **not chunk 3's** — the `.first()`/`.last()` half is being built by a separate agent in `packages/local-eslint` and its status is that agent's to set; the DOM-handle half stays open and belongs with the recipe book. Chunk 3 plans neither |
| Part 8 | Holding the no-pick rule mechanically | **not chunk 3's** — same separate agent; do not mark this row against chunk 3 either way |
| Part 8 | The thirteen calls | `PLANNED chunk 3 (part)` — seven of thirteen |
| Part 8 | Results queries | `PLANNED chunk 3` — all six kinds, per-step attribution, filtering and projection |
| Part 8 | What every acting step returns, on top of its own reading | `PLANNED chunk 3 (part)` — `shot` and `pixelChange`; `elements` stays open |
| Part 8 | A FIXER reading a finished instance | `PLANNED chunk 3 (part)` — steps 1 to 4 whole, steps 5 and 7 already work, step 6's recipe half stays open |
| Part 8 | Cycles — run, snapshot, collect, repeat | `PLANNED chunk 3 (part)` — adds `compare` and the shot list's `pixelChange`/`blank` columns; the two cycle shapes need `snapshot`/`reset` |
| Thirteen calls | `results` | `PLANNED chunk 3` |
| Thirteen calls | `status` | `PLANNED chunk 3` |
| Thirteen calls | `compare` | `PLANNED chunk 3 (part)` — minus `elements` |
| Thirteen calls | `cleanup` | `PLANNED chunk 3 (part)` — minus `assetsAged` |
| Thirteen calls | `start` | unchanged — `seeded` and the pool refusal still open |
| Part 2 | Retention: assets outlive their instance, and something must prune them | unchanged — `NOT STARTED`, with a note that chunk 3 deliberately declined the ageing half and §3.E records why |
