# 23 — the router owns siegelense instances

```
GOAL      How many instances may run is MEASURED, not declared — and the same code that
          reads the number spends it.
AFTER     22
BEFORE    25
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**Read `scrolls/seigelense/remaining-build-items.md` first.** Siegelense is not finished, and this
story depends on the parts that are. Two of its sections are the ones that matter here: § 23
"Already built — do not build these" (the table that stops you rebuilding what ships) and § 18
"Delete `packages/web/test/siege-driver/` and move every caller to siegelense", whose own ordering
note — *"Cut the prompts and the lane spec over together"* — is why story 25 sits after this one.

---

## The surface, call by call

Everything this story spends is built and routed. `siegelenseCallStatics.calls.names`
(`siegelense-call-statics.ts:18–32`) holds all thirteen, and `siegelense-flow.ts` routes each to a
responder in `packages/siegelense/src/responders/siegelense/<call>/`.

| Call | Programmatic | Takes | Returns |
|---|---|---|---|
| `capacity` | `capacityReadBroker` | `{ specName: SpecName, poolSize: ProfilePoolSize \| null }` | `CapacityAnswer` |
| `start` | `instanceStartBroker` | `{ specName, questId: QuestId \| null, guildId: GuildId \| null, seed: RecipeName \| null, idleTimeoutMs? }` | `InstanceManifest` |
| `kill` | `instanceKillBroker` | `{ instanceId: InstanceId }` | `KillResult` |
| `cleanup` | `cleanupRunBroker` | **nothing** | `CleanupAnswer` — story 20's handler owns this one |

**`poolSize: null` means "the policy ceiling"**, and the broker says so at `capacity-read-broker.ts:57`:

```ts
const resolvedPoolSize = poolSize ?? profilePoolSizeContract.parse(capacityStatics.policy.ceiling);
```

Its comment is the reason to pass `null`: *"a peak measured solo is optimistic for a pool of three,
and computing against the optimistic figure is the expensive mistake."* **Pass `null`.**

---

## Capacity is a reading, not a guess

`capacityAnswerContract` is `.strict()` and holds exactly five keys:

```ts
{ suggested, ceiling, why, measured, profile }
```

| Key | What |
|---|---|
| `suggested` | how many instances this machine can run right now. **This is the number the router spends** |
| `ceiling` | the policy cap `suggested` is never above — `capacityStatics.policy.ceiling`, which is **`3`, at `capacity-statics.ts:26`**, with its own comment calling it *"a knob, three here, not a fact about anything"* |
| `why` | a sentence |
| `measured` | `{ freeMemMB, cores, loadAvg1, siegeInstances, diskFreeMB }` — `capacityMeasuredContract`, `.strict()` |
| `profile` | `.nullable()`. A spec nothing has ever run is a real answer, not a failure |

**With no profile it answers 2** — `capacityStatics.noProfile.suggested` at `:40`, commented *"A fresh
spec has no numbers, so the first pair runs and profiles itself."* So the first pair runs and profiles
itself, and nothing has to special-case a cold machine.

**It counts instances this session did not start.** `measured.siegeInstances` comes from the registry,
and a RESERVATION counts too — that is the thundering-herd cure. A cold-heartbeat row is EXCLUDED
rather than reaped, because a read that quietly killed things would make "ask before opening a pool" a
mutation.

**Which spec.** `laneSpecStatics.specs` holds two built-ins, `dungeonmaster-stack` (api + web +
Chromium) and `dungeonmaster-api` (browserless). `capacityStatics.defaults.specName` reads the first,
*"the browsered spec, and the more expensive of the two built-ins, so a bare `capacity` with no
`--spec` answers conservatively."* A siege walker drives a browser, so it is `dungeonmaster-stack`.
Read the name off `laneSpecStatics` rather than typing it — the statics does that itself at `:46`, so a
renamed spec moves every reference at once.

So a step that needs one declares `needsLane: true` and **no number at all**. Both siege walkers draw
on that one pool — the shared budget two per-step numbers could never express.

---

## Reaching siegelense from the orchestrator

**The orchestrator cannot import `@dungeonmaster/siegelense` through `dependencies`: it is a cycle.**
Story 20 states the cycle and the two routes. **This story takes the other route from story 20's** —
it needs the STRUCTURED answers, not a stream of lines, so it resolves the package at runtime the way
`cli-siegelense-responder.ts:35–44` does:

```ts
const siegelensePath = filePathContract.parse(require.resolve(SIEGELENSE_MODULE_NAME));
const siegelenseModule = await runtimeDynamicImportAdapter<{ … }>({ path: siegelensePath })
```

**Two things are missing from siegelense's public barrels, and this story is blocked on them:**

| Missing | Barrel | Present today |
|---|---|---|
| `capacityReadBroker` | `packages/siegelense/brokers.ts` | `instanceStartBroker`, `instanceKillBroker`, `cleanupRunBroker` are all exported. **`capacity` is not** |
| `capacityAnswerContract` + `capacityMeasuredContract` + `capacityProfileContract` | `packages/siegelense/contracts.ts` | `instanceManifestContract`, `killResultContract`, `cleanupAnswerContract`, `instanceIdContract`, `specNameContract` are all exported. **None of the capacity three is** |

**OPEN — who adds those exports.** This story's OUT OF SCOPE says "build nothing in the siegelense tool
itself", and `packages/shared/CLAUDE.md` § "Adding New Exports" makes a barrel entry a four-step change
inside that package. It is two `export *` lines and no new behaviour, so it is arguably not "building".
**The plan author decides**: either add the two lines here and say so in the commit, or add an item to
`scrolls/seigelense/remaining-build-items.md` and make this story `AFTER` it. Do not work around it by
reaching into `packages/siegelense/src/**` past the barrel — every other consumer in this repo is held
to the subpath exports.

**The fallback, if the barrels stay closed**, is the CLI with `--json`:
`SiegelenseCapacityResponder` writes `JSON.stringify(answer, …)` when `isJson` is true
(`siegelense-capacity-responder.ts:39–43`), and `capacityArgsContract` carries `isJson` with a
`.default(false)`. Spawn `dungeonmaster siegelense capacity --spec <name> --json`, parse the stdout.
It works, and it costs a process per reading.

---

## And because the router reads capacity, the router SPENDS it

**A reader that does not also spend is a split the two halves drift across.**

| `needsLane: true` means the router | Instead of |
|---|---|
| calls `start` before dispatching the work item, and waits for the manifest | the session running `start` as its own step 2 |
| substitutes the **instance id** into the prompt, beside the quest, work item, operation item and step ids | the session naming its own lane |
| serves the manifest — `baseUrl` and every address — through `get-quest-work` | the session reading a manifest file it started |
| calls `kill` when the work item records, **whatever the outcome** | the session closing the lane last, which a crashed session never reaches |

**What `start` hands back**, and two fields will catch you out:

```ts
{ instanceId, specName, baseUrl, home, evidence, logs: { api, web }, seeded, queuedMs, aheadOfMe, bootMs }
```

- **`baseUrl` is `.nullable()`**, and `null` means *"this spec never claimed a web surface"* — a
  browserless spec binds no `web` port. It does NOT mean the surface failed to come up; that is
  `LaneBootFailedError`. A router that renders `baseUrl` into a prompt without checking hands a walker
  a URL nothing answers.
- **`queuedMs` and `aheadOfMe`** are why a slow boot and a hang read differently. A 55-second `start`
  is indistinguishable from one that will never return without them.

**Pass `questId`** on every `start`: the instance's evidence directory is keyed by the PARTITION guild
— the one that owns the quest — and that is what puts a shot somewhere a later fixer's `Read` can
reach it.

**`workItemToPromptTransformer` substitutes a FIFTH value on a `needsLane` step, and nothing on any
other.** It serves four ids today — quest, work item, operation item, and the operation item's text,
at `work-item-to-prompt-transformer.ts:117–124` — plus two conditional extras. The instance id is a
third conditional extra, on the same pattern as warpgate's `Base branch` at `:133–138`. Trace the
DEGENERATE case: a step with `needsLane` whose `start` returned `baseUrl: null`.

**Three things this fixes that the session-owned version could not.** A session that dies mid-walk
strands an API server, a Vite server and a browser, and nothing notices — reaping is tied to the work
item RECORDING rather than to a prompt step running. The pool count stops being something two sessions
could believe differently. And `suggested` cannot drift from the number actually started.

**`kill` is idempotent by construction and safe to call on a dead instance.** It looks the row up in
the registry, tolerates its absence (`const guildId = entry?.guildId ?? null` at
`instance-kill-broker.ts:47`), and reaps orphans either way. It removes the throwaway home and **never
the evidence directory** — logs, captures and the transcript outlive the instance, which is what a
later fixer reads. So "kill on record, whatever the outcome" costs nothing on the path where the
session already exited cleanly.

**One case needs a route rather than a rule.** The antagonist deliberately breaks its instance. Today
its prompt says restart as `-2`, then `-3`, and record which points ran either side. Under router-owned
instances it cannot restart anything — so **a dead instance is an `unmet` mark carrying the `status`
output and the points not yet driven**, and the router mints the continuation on a fresh instance. Same
behaviour, and the restarts are visible in the ledger instead of buried in one transcript.

**The `operating` docs scope describes the router now**, not a session. It is one of the seven in
`siegelenseCallStatics.docs.scopes` (`siegelense-call-statics.ts:36`), and it addresses "the session
that opens and closes a pool of instances and assigns tasks to other agents", which is this code. It
keeps the scope and loses its prompt reader; its rules become the router's spec.

---

## Flowrider's browser cap is a DIFFERENT budget

Its walks run under ward's Playwright, not as siegelense instances, so `capacity` cannot see them in
`measured.siegeInstances` and its answer does not bound them. `maxConcurrent: { limit: 4, counts:
'browser-pieces' }` stays on that step — story 15 enforces it.

**Ward already isolates concurrent browser runs**, which is why four is a machine-load cap rather than
a correctness one: each run gets its own port pair from `netFreePortPairAdapter`, its own
`.ward-playwright-report-<serverPort>.json`, and its own `outputDir`.

**Fixers are unbounded in both families.** They touch no lane and no browser.

---

## DONE WHEN

| Assert | |
|---|---|
| `start` ran before dispatching each `needsLane` work item | assert the ORDER: the `start` call resolved before the spawn instruction was built |
| `start` was called with the quest's id and `specName` read off `laneSpecStatics` | not a string literal |
| the instance id reached the RENDERED prompt | assert the rendered string contains it — not just the return object |
| a `needsLane` step whose `start` returned `baseUrl: null` renders without the literal `"null"` | the degenerate case `workItemToPromptTransformer`'s own rule 4 demands |
| **`kill` ran when the work item recorded, INCLUDING when it recorded `wall`** | the case a session-owned close could never reach, and the whole reason this moved |
| `kill` ran exactly ONCE per instance across a re-mint | a continuation gets a FRESH instance (story 15: an inherited payload carries no instance id), so the dead one must not be killed twice |
| a batch of lane steps is bounded by `suggested`, not by a constant | drive it with a stubbed `CapacityAnswer` of `suggested: 1` and assert one dispatch, then `suggested: 3` and assert three |
| with `profile: null` the bound is **2** | `capacityStatics.noProfile.suggested`. Read it, do not type it |
| `suggested` is never exceeded even when the step's pieces number more | the cap, not the batch size |
| flowrider's four browser walks are bounded separately, and siege's pool does not see them | two budgets. Assert a flowrider batch of four dispatches while `suggested` is 1 |
| `sweepIn` and `sweepOut` both appear as work items, first before `plan` and last after `ward` | |
| an all-operational quest that routes `plan → empty` STILL reaches `sweepOut` | the leak case. `siege-planner`'s `empty` route is `sweepOut`, not `@done` |
| a dead-instance `unmet` mints a continuation on a NEW `instanceId` | the antagonist's restart, now in the ledger |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write a walker prompt | story 25 |
| build anything in the siegelense tool itself | `scrolls/seigelense/remaining-build-items.md` — except possibly two barrel lines; see the OPEN above |
| delete `packages/web/test/siege-driver/` | item 18 of that document, which cuts over with story 25 |
| write the `cleanup` handler | story 20 |
| classify a handler's exit code | story 20 |
