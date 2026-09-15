# Chunk 1 — the registry spine

The two workspace packages, the contract spine every later chunk is written against, the disk registry and
its races, the heartbeat that is the only defence against a SIGKILLed driver, and the `dungeonmaster init`
step that makes `<repoRoot>/.siegelense` and `packages/siegelense-recipes/` facts rather than aspirations.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/siegelense`.** Never the main checkout.

Coverage is tracked in `scrolls/seigelense/build-ledger.md`. Update it when this chunk is delivered.

---

## 1. Scope

### Delivered by this chunk

| Spec section | Line | What lands |
|---|---|---|
| Many sessions, one machine: a disk REGISTRY, not a master | 116 | the whole `<home>/.dungeonmaster/siegelense/` tree, its path resolvers, guild/`unowned` partitioning, and the `<repoRoot>/.siegelense` symlink |
| What the registry has to make safe | 179 | port claim before bind · `boot.lock` across processes · reservation before boot · assets under the minted id. **Not** the `profile writes` row (186) |
| When it dies without warning: OOM, SIGKILL, a full disk | 1111 | the heartbeat file — pid, instance id, every child's pgid, a timestamp — and stale-instance detection. **Not** `status`, `likelyCause`, the OOM evidence or the disk checks |
| 4A · Readings, and what a step may never do | 1546 | the package `CLAUDE.md` (line 1554) carrying all four rules. **Not** the lint rule |
| 4A · The service: instances, runs, batches | 1606 | rows 1617–1620, 1623, 1628, 1630 |
| 4A · Teardown and crash recovery | 1654 | rows 1666, 1667, 1670, 1672, 1673 |
| 4A · Recipes: what one is and what holds it | 1705 | rows 1710–1713, 1717 |
| What the TOOLING must guarantee | 1743 | the port-allocation row (1750), the one-boot-at-a-time row (1755), and the per-run step numbering row (1753) pinned in a contract |
| The tool is `siegelense`, and its recipes live beside it | 1817 | both packages, made with `dungeonmaster create-package`; `init` scaffolds the recipes one; an empty one is a real answer; subpath-importable barrels |
| The package needs a `../../CLAUDE.md`, and these are the entries | 2070 | all twelve entries |
| The thirteen calls | 2094 | the thirteen NAMES and the `siegelense-` prefix, pinned in a package-local statics |
| Part 7 items 2, 2a, 2b, 2c | 1911–1914 | in part — see the ledger's notes column for exactly which part of each |

### Deliberately deferred

| Deferred | To roughly | Why it is safe to wait |
|---|---|---|
| The driver process, `start`, `run`, `kill`, and the MCP tool registrations | chunk 2 | The driver is a lifetime decision (spec 1616), not a shape decision. Everything it writes — the reservation, the ports, the lock, the heartbeat, the evidence directory — is what this chunk builds, so chunk 2 composes rather than redesigns |
| `capacity`, `profile`, RSS sampling, the staggered boot QUEUE | chunk 3 | `capacity` reads the registry and the profiles dir; both exist after this chunk. The append-only sampler (spec 186, 1621) has no writer until an instance runs |
| `results`, `status`, `compare`, `snapshots`, retention and `prune` | chunk 4 | They read an evidence tree that has no writer yet. This chunk mints the directory and the `InstanceState` members (`pruned`, `unknown`) their answers depend on |
| Every STEP — `look`, `click`, `health`, `reset`, `seed`, `until`, `hold`, `video`, `request`, `resize`, `before` | chunks 5+ | Steps are DATA inside `run` (spec 26, 2097), so the tool surface does not grow with them and nothing here has to anticipate one |
| Both local lint rules (Part 7 item 16) | the chunks that create their targets | A `no-.first()` rule has no command implementations to grade and a `no-DOM-handle-in-a-recipe` rule has no recipes. Neither could be shown FIRING, and the spec's own caution (line 2011) is that "a rule people over-trust is worse than none". The package `CLAUDE.md` carries both rules as prose in the meantime, which is where the spec puts the `querySelector` half permanently (line 2015) |
| Registering the thirteen names in `mcpToolsStatics` | the chunk that registers the tools | `packages/mcp/CLAUDE.md` documents that one name is "one edit of roughly 29", including seven copies of the permissions allow-list and four index-aligned arrays in a flow's integration test. Paying that before there is a handler behind any name buys nothing and leaves thirteen tools answering errors |
| Recipe content, `produces:`, `fidelity`, `mirrors:`, the listing | chunk 3 or 4 | The PACKAGE is the convention (spec 1710); its contents are per-repo (spec 1876) |
| `siege-lane.ts`'s generalisation (Part 7 item 17) | last | "Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice." (line 1947). This chunk adds nothing to those files |

### Part 7's own ordering, and where this departs from it

The spec's order (line 1906) is: **1** gate the smoketest route · **2** the instance service · **2a** the evidence
read path · **2b** teardown and crash recovery · **2c** retention · **3** the recipe book.

**This chunk follows 2 → 2a → 2b and pulls the front half of each forward together, which is exactly what the
spec asks for.** 2a is "cheap while item 2 is being written, a rewrite afterwards" (line 1912) and 2b is
"shipped with item 2, never after it" (line 1913). Splitting the service into "the disk spine now, the driver
next" honours both: the symlink, the partitioning and the heartbeat all land before anything boots.

**Two departures, both stated plainly:**

**Item 1 is out of this build.** `POST /api/tooling/smoketest/run` is a pre-existing gap in a *different*
package — `packages/server/src/flows/tooling/tooling-flow.ts` — and the document itself calls it an
"Independent live finding" (line 1910). Its pattern already exists and works
(`packages/server/src/flows/quest/quest-flow.ts:198`, the `E2E_SIGNAL_BACK_HTTP` registration-time gate). It is
a one-file security fix with an absence test, it blocks nothing in siegelense, and coupling it to a new
package's foundation means a reviewer grading a server change against a siegelense plan. **Recommendation:
raise it as its own commit against `packages/server`, now, independently of this build.** It is logged in the
ledger as `NOT STARTED` with that reasoning so it is not lost.

**Part of item 3 comes forward into item 2's chunk.** The spec puts the recipe book after the service. But the
`packages/siegelense-recipes/` *package* is a convention `dungeonmaster init` must create (lines 1711, 1836,
1839), and `init` is the same install step that writes the `.siegelense` symlink item 2a asks for. Writing one
`StartInstall` that does both is one file; writing it twice is two. The recipe CONTENT stays where the spec
puts it.

---

## 2. The contract surface, up front

Zod contracts are the spine. **Every return is a branded contract; inputs may take a raw `string`** — the
asymmetry is deliberate and `ban-primitives` enforces it.

All of these live in `packages/siegelense/src/contracts/<domain>/`, as
`<domain>-contract.ts` + `<domain>-contract.test.ts` + `<domain>.stub.ts`.

### Branded primitives

| Contract | Brand | Schema | Owner |
|---|---|---|---|
| `epochMsContract` | `EpochMs` | `z.number().int().nonnegative()` | W3 |
| `instanceIdContract` | `InstanceId` | `z.string().regex(/^inst_[0-9a-f]{4,}$/u)` — minted, never chosen | W3 |
| `runIdContract` | `RunId` | `z.string().regex(/^run_[1-9][0-9]*$/u)` | W3 |
| `stepIndexContract` | `StepIndex` | `z.number().int().min(instanceLifecycleStatics.numbering.firstStep)` — restarts at 1 per run | W3 |
| `specNameContract` | `SpecName` | `z.string().min(1)` — e.g. `dungeonmaster-web`, `dungeonmaster-headless` | W4 |
| `specHashContract` | `SpecHash` | `z.string().regex(/^[0-9a-f]{8,64}$/u)` — the lane spec's content hash | W4 |
| `instanceStateContract` | `InstanceState` | `z.enum(['alive','killed','dead','pruned','unknown'])` | W4 |
| `instanceOwnerContract` | `InstanceOwner` | `z.string().min(1)` — the MCP child's own pid, rendered; see W12 | W4 |
| `processGroupIdContract` | `ProcessGroupId` | `z.number().int().positive()` — a pgid, distinct from a pid because it is the negated-kill target | W5 |

### Object contracts

| Contract | Fields | Owner |
|---|---|---|
| `portPairContract` | `{ api: NetworkPort; web: NetworkPort }` — `networkPortContract` comes from `@dungeonmaster/shared/contracts` | W5 |
| `repoLocalPathContract` | `{ path: AbsoluteFilePath; linkPresent: boolean }` — the answer to "where do I `Read` this", carrying whether the symlink resolved | W5 |
| `instanceHeartbeatContract` | `{ instanceId: InstanceId; pid: ProcessId; pgids: readonly ProcessGroupId[]; beatAtMs: EpochMs }` | W6 |
| `bootLockContract` | `{ heldBy: InstanceId; heldByPid: ProcessId; acquiredAtMs: EpochMs }` | W6 |
| `registryEntryContract` | `{ id: InstanceId; owner: InstanceOwner; questId: QuestId \| null; guildId: GuildId \| null; specName: SpecName; specHash: SpecHash; pid: ProcessId \| null; pgids: readonly ProcessGroupId[]; ports: PortPair; state: InstanceState; reservedAtMs: EpochMs; bootedAtMs: EpochMs \| null; lastBeatMs: EpochMs \| null; prunedAtMs: EpochMs \| null; prunedByRule: ContentText \| null }` | W6 |
| `registryContract` | `{ instances: readonly RegistryEntry[] }` — the whole `registry.json` | W6 |

`questIdContract`, `guildIdContract`, `processIdContract`, `networkPortContract`, `absoluteFilePathContract`,
`contentTextContract` and `fileContentsContract` all come from `@dungeonmaster/shared/contracts`. Do not
re-declare any of them.

### Three decisions inside those shapes, each of which a reviewer will otherwise question

**`.nullable()`, never `.optional()`, on every field that can be absent.** A registry row round-trips through
`JSON.stringify`, and under this repo's `exactOptionalPropertyTypes` an absent key and an `undefined` key are
different values. Writing explicit `null` means one shape on disk and one shape in memory.

**A reservation is a row with `bootedAtMs: null`, not a sixth `InstanceState`.** The five members of
`InstanceState` are the answers `results` returns (spec lines 2175–2181) and that set is closed. `capacity`
still "counts reservations, not just running instances" (line 185) because a reserved row is in the registry
and `isReservedRegistryEntryGuard` names it.

**`lastBeatMs` is on the row AND the heartbeat is its own per-instance file.** The spec asks for both — line
134 lists `lastBeat` as a `registry.json` column, and line 1132 asks for "a heartbeat file per instance … the
process-group ids of every child". `heartbeatWriteBroker` writes both in one call: the file is what a
post-mortem `Read`s after a SIGKILL, the row is what a fleet scan reads without opening N files.

### Errors

| Class | Carries | Thrown when | Owner |
|---|---|---|---|
| `BootLockHeldError` | `heldBy`, `waitedMs` | the boot lock is held by a live holder past the wait ceiling | W1 |
| `RegistryUnreadableError` | `registryPath`, `cause` | `registry.json` exists and does not parse — an unreadable registry must never read as an empty one | W1 |
| `PortClaimExhaustedError` | `attempts` | the free-port pair the OS handed back collided with a claimed pair on every attempt | W1 |

### Statics

| Statics | Holds | Owner |
|---|---|---|
| `locationsStatics.siegelense` + `locationsStatics.repoRoot.siegelenseLink` (**in `@dungeonmaster/shared`**) | every filename and dirname literal in the tree: `siegelense`, `registry.json`, `registry.json.tmp`, `boot.lock`, `profiles`, `guilds`, `instances`, `unowned`, `heartbeat.json`, and `.siegelense` at the repo root | W2 |
| `instanceLifecycleStatics` | `ids: { instancePrefix: 'inst_', runPrefix: 'run_', entropyBytes }` · `numbering: { firstStep: 1 }` · `heartbeat: { intervalMs, stalenessBeats }` · `bootLock: { ttlMs, waitCeilingMs, pollMs }` · `ports: { claimAttempts }` | W2 |
| `siegelenseToolsStatics` | `prefix: 'siegelense-'` · `names: [start, run, results, kill, capacity, profile, status, cleanup, prune, compare, snapshots, recipes, docs]` · `docsScopes: [operating, planning, walking, attacking, fixing, driving, operational]` | W2 |

---

## 3. Work items

**Maximum three agents at once.** Waves A and B run alone because everything downstream reads what they write.

| Wave | Items | Parallel? |
|---|---|---|
| A | W1 | alone — SEQUENCE |
| B | W2 | alone — SEQUENCE |
| C | W3 · W4 · W5 | PARALLEL |
| D | W6 · W7 · W8 | PARALLEL |
| E | W9 · W10 · W11 | PARALLEL |
| F | W12 · W13a · W13b | PARALLEL |
| G | W13c | alone — SEQUENCE |
| H | W14 | alone — SEQUENCE |

### Two orchestrator-owned builds, and a dispatched agent must never run either

`<dungeonmaster-buildDiscipline>`: a dispatched agent does not build. Two builds belong to the coordinator:

1. **Before W1**, if `dungeonmaster create-package` is not resolvable in the worktree:
   `npm run build && npm link --workspaces`.
2. **After W2, before any lint in waves C+**: `npm run build --workspace=@dungeonmaster/shared`. W2 changes
   `locationsStatics`, and this repo's own ESLint rules import `@dungeonmaster/shared/statics` at module load
   with no `source` condition — the root `CLAUDE.md` names this as one of four build cases this checkout owns.

---

### W1 — Scaffold the two workspace packages (wave A, alone)

**Creates**

- `packages/siegelense/` via `dungeonmaster create-package --name siegelense --type programmatic-service`
- `packages/siegelense-recipes/` via `dungeonmaster create-package --name siegelense-recipes --type library`
- `packages/siegelense/CLAUDE.md` — hand-written, all twelve entries from spec lines 2079–2090 (the twelve rows under the header at 2077), each with the
  measurement behind it, in the same shape as `packages/orchestrator/CLAUDE.md`
- `packages/siegelense/src/errors/boot-lock-held/boot-lock-held-error.ts` + `.test.ts`
- `packages/siegelense/src/errors/registry-unreadable/registry-unreadable-error.ts` + `.test.ts`
- `packages/siegelense/src/errors/port-claim-exhausted/port-claim-exhausted-error.ts` + `.test.ts`

**Edits** `packages/siegelense/package.json` — add `"@dungeonmaster/shared": "*"` and
`"@dungeonmaster/testing": "*"` to `dependencies` / `devDependencies` as the sibling packages do. Confirm the
command registered both packages in the ROOT `package.json` `dependencies` (not just `workspaces`) —
`packages/CLAUDE.md` says that field is what ships.

**Does not** hand-write `tsconfig.json`, `tsconfig.build.json` or `jest.config.js`, and does not copy them off
a sibling. If `dungeonmaster create-package` is unavailable, STOP and report — a hand-copy reliably loses the
`exclude` entries keeping `.stub.ts` and `.harness.ts` out of `dist` and the `incremental` pair `build:clean`
deletes.

**Depends on** nothing.

**Tests** the three error classes get colocated `.test.ts` asserting the complete error object
(`{ name, message, <context fields> }`) and `instanceof` both ways. No proxies — errors are thrown directly.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/errors/boot-lock-held/boot-lock-held-error.ts packages/siegelense/src/errors/boot-lock-held/boot-lock-held-error.test.ts` (and the same for the other two).

**Acceptance criteria, quoted**

> line 1710: `| The tool is `siegelense`: `packages/siegelense/`, `dungeonmaster siegelense`, MCP tools `siegelense-*`, recipes at `packages/siegelense-recipes/` |`

> line 1826: `| **its recipes**    | **`packages/siegelense-recipes/`** — this exact path, in every repo it runs in                                                                              |`

> line 1713: `| Recipes are a PACKAGE, not `.dungeonmaster-assets/`, because they are code that must be graded                                                    | being a workspace package is what gets them a ward run, and the ward run is the entire reason a recipe's test fires on the commit that breaks it. A dot-folder gets no ward, no tsconfig, no lint                                                             |`

> line 1865: `**Both are real workspace packages**, made the way every other one here is — `dungeonmaster`

> line 1554: `| The package carries a `../../CLAUDE.md` of invariants, each with its measurement                             | same pattern as `../../packages/orchestrator/CLAUDE.md` and `../../packages/web/CLAUDE.md`. Part 8 lists the minimum entries                                                                                                                                      |`

The twelve `CLAUDE.md` entries are the table at spec lines 2079–2090 (the twelve rows under the header at 2077). Every one of them must appear, with the
"why it earns a line" column as the entry's body.

---

### W2 — Statics, and the shared location literals (wave B, alone)

**Edits (in `@dungeonmaster/shared`, which is why this item runs alone)**

- `packages/shared/src/statics/locations/locations-statics.ts` — add `repoRoot.siegelenseLink: '.siegelense'`
  beside `worktreesDir`, and a `siegelense` group holding `dir: 'siegelense'`, `registry: 'registry.json'`,
  `registryTmp: 'registry.json.tmp'`, `bootLock: 'boot.lock'`, `profilesDir: 'profiles'`,
  `guildsDir: 'guilds'`, `instancesDir: 'instances'`, `unownedDir: 'unowned'`,
  `heartbeat: 'heartbeat.json'`, `apiLog: 'api-server.log'`, `webLog: 'web-server.log'`
- `packages/shared/src/statics/locations/locations-statics.test.ts` — extend the full-value assertion

**Why these go in shared and not in siegelense:** `locationsStatics`' own PURPOSE is "Single source of truth
for every filename and dirname literal that dungeonmaster code reaches on disk", and the repo's
`no-bare-location-literals` lint rule refuses a bare filename literal anywhere else. `.siegelense` in
particular is a repo-root literal the install responders write into `.gitignore`.

**Creates**

- `packages/siegelense/src/statics/instance-lifecycle/instance-lifecycle-statics.ts` + `.test.ts`
- `packages/siegelense/src/statics/siegelense-tools/siegelense-tools-statics.ts` + `.test.ts`

Both `as const`, no primitives at the root (every value nested in a named group), no conditionals.
`siegelenseToolsStatics.names` is exactly thirteen entries and `look` is not among them.

**Depends on** W1.

**Tests** `instance-lifecycle-statics.test.ts` asserts the complete object with `toStrictEqual`.
`siegelense-tools-statics.test.ts` asserts the complete `names` array with `toStrictEqual` (never
`toHaveLength`), asserts every name is reachable as `${prefix}${name}`, and asserts the complete `docsScopes`
array.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/statics/instance-lifecycle/instance-lifecycle-statics.ts packages/siegelense/src/statics/instance-lifecycle/instance-lifecycle-statics.test.ts packages/siegelense/src/statics/siegelense-tools/siegelense-tools-statics.ts packages/siegelense/src/statics/siegelense-tools/siegelense-tools-statics.test.ts packages/shared/src/statics/locations/locations-statics.ts packages/shared/src/statics/locations/locations-statics.test.ts`

**Acceptance criteria, quoted**

> lines 133–138:
> ```
> <home>/.dungeonmaster/siegelense/
>   registry.json        one entry per instance: id · owner · quest · pid · pgids · specHash · ports · state · lastBeat
>   boot.lock            held for the duration of one boot; staleness releases it
>   profiles/<hash>/     append-only samples per spec
>   guilds/<guildId>/instances/<id>/    that instance's logs, captures, video, transcript, snapshots
>   unowned/instances/<id>/             the same, for an instance no quest owns
> ```

> line 160: `<repoRoot>/.siegelense  →  <home>/.dungeonmaster/siegelense/`

> line 1628: `| Instance ids are minted, not chosen                                                                                                        | deletes the lane-name allocation section and its failure class                                                                                                                                                                                                           |`

> line 1630: `| Step numbers restart at 1 per run; screenshots are namespaced by run                                                                       | otherwise run 2 silently overwrites run 1's evidence and `stoppedAt: { step: 4 }` is ambiguous                                                                                                                                                                           |`

> line 1825: `| its MCP tools      | `siegelense-start`, `siegelense-run`, `siegelense-results`, `siegelense-cleanup`, … — **thirteen of them, and `look` is NOT one**: it is a step inside `run` |`

> line 2096: `**Every tool below is registered as `siegelense-<name>`** — `siegelense-start`, `siegelense-run`, and so on. The`

> line 1612: `| `docs { for: … }` has ONE SCOPE PER TOOL-USING ROLE — `operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`  | a stress tester reading the naming ladder in full is context spent on something it barely touches — the same reasoning as filtering `verifyByHuman` units                                                                                                                |`

---

### W3 — Identity contracts I (wave C, PARALLEL with W4 and W5)

**Creates**, each as `<domain>-contract.ts` + `<domain>-contract.test.ts` + `<domain>.stub.ts` under
`packages/siegelense/src/contracts/`:

- `epoch-ms/` — `EpochMs`. Millisecond epoch, not an ISO string, because staleness is arithmetic and `status`
  formats it for display.
- `instance-id/` — `InstanceId`, `inst_` prefix from `instanceLifecycleStatics.ids.instancePrefix`
- `run-id/` — `RunId`, `run_` prefix, `N` starting at 1
- `step-index/` — `StepIndex`, minimum from `instanceLifecycleStatics.numbering.firstStep`

**Depends on** W2 (the prefixes and the minimum come from statics — no magic numbers in a contract).

**Tests** `VALID:` for a well-formed value, `INVALID:` for each rejected shape (wrong prefix, uppercase hex,
zero, a negative, a float), `EDGE:` for the boundary (`run_1`, step `1`, epoch `0`). Tests import the
`.stub.ts`, never the `-contract.ts`; the stub imports the contract to parse with. Deliberately invalid input
uses `as never`, never `as string`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the twelve files>`

**Acceptance criteria, quoted**

> line 114: `because a human-chosen name can collide. A minted id deletes the section and its whole failure class.`

> line 1753 (the determinism table): `| step numbering, PER RUN, restarting at 1                                                                                                       | `stoppedAt: { step: 4 }` and `results { run, step: 4 }` must name the same thing, and an instance carries many runs                                                                     | a session reading another run's step 4 and drawing a conclusion from it |`

> line 77: `| step numbering restarts at 1 PER RUN                                      | `stoppedAt: { step: 4 }` then reads naturally inside its own run, and cannot be confused with another's                                       |`

---

### W4 — Identity contracts II (wave C, PARALLEL with W3 and W5)

**Creates** under `packages/siegelense/src/contracts/`:

- `spec-name/` — `SpecName`. A lane spec's name; `dungeonmaster-headless` is as first-class as
  `dungeonmaster-web`.
- `spec-hash/` — `SpecHash`. The lane spec's CONTENT hash: add a process to the spec and the hash changes,
  which is how a stale profile is detected by construction.
- `instance-state/` — `InstanceState`, exactly `alive | killed | dead | pruned | unknown`.
- `instance-owner/` — `InstanceOwner`. Identifies the session that started an instance, for the "no session
  may kill a live instance it does not own" rule.

**Depends on** W2.

**Tests** `instance-state-contract.test.ts` uses `it.each` over the enum's own `.options` — derive the case
list from the contract, never hardcode it, or a sixth member is silently skipped. Assert each member parses to
itself and that an unlisted string is `INVALID:`.

**Ward** as W3.

**Acceptance criteria, quoted**

> lines 2177–2181:
> ```
> | `alive`         | the driver is up and the buffers are still filling                                                        |
> | `killed`        | torn down cleanly. The evidence is complete                                                               |
> | `dead`          | the heartbeat stopped. The transcript ends at the last flushed step; after that is ABSENT, not uneventful |
> | `pruned`        | the assets were reclaimed. The answer says when and by which rule, and returns no rows                    |
> | `unknown`       | no instance by that id, ever. A mistyped or misremembered id, not a walk that found nothing               |
> ```

> line 2183: ``**`pruned` and `unknown` are real answers, not empty results.** A query that lands on reclaimed evidence and returns``

> line 1691: `| The profile is keyed by the lane spec's content HASH                                                               | add a process to the spec and the hash changes, the profile is stale, measurement restarts. The "I added a second server" case is handled by construction rather than by remembering                                                                               |`

> line 1613: `| **A BROWSERLESS lane spec is a first-class spec, and the browser steps error against it BY NAME**                                          | an operational flow has no screen, and a spec is keyed by content hash, so the cheaper spec profiles itself and `capacity` allows more of them. A `look` answering an empty key instead of an error is `count: 0` where a walk cannot recover from it                    |`

> line 190: `a cold heartbeat is a fact anyone can check. **No session may kill a live instance it does not own**, however`

---

### W5 — Registry primitive contracts (wave C, PARALLEL with W3 and W4)

**Creates** under `packages/siegelense/src/contracts/`:

- `process-group-id/` — `ProcessGroupId`. A positive integer. Its PURPOSE must say what distinguishes it from
  `ProcessId`: a pgid is the NEGATED-kill target, and it is the field that survives a SIGKILL in a file.
- `port-pair/` — `PortPair` = `{ api: NetworkPort; web: NetworkPort }`. A refine rejects `api === web`.
- `repo-local-path/` — `RepoLocalPath` = `{ path: AbsoluteFilePath; linkPresent: boolean }`.

**Depends on** W2, and `@dungeonmaster/shared/contracts` for `networkPortContract` and
`absoluteFilePathContract`.

**Tests** `port-pair-contract.test.ts` includes `INVALID: {api: 34173, web: 34173} => throws` — the same pair
on both halves is the shape that makes Playwright wait on one port while Vite binds another.
`repo-local-path-contract.test.ts` asserts both `linkPresent` branches, because the `false` branch is the whole
point of the contract.

**Ward** as W3.

**Acceptance criteria, quoted**

> line 1132: `- **A heartbeat file per instance** — pid, instance id, **the process-group ids of every child**, and a timestamp`

> line 1672: `| Each instance keeps a HEARTBEAT FILE carrying its pid, instance id and every child's PROCESS-GROUP ID                 | after a SIGKILL nothing in memory holds those pgids, so without the file the orphans cannot be found, only guessed at                                                                                              |`

> line 170: `**Where the link is absent — a repo where `init` has not run — the tool hands back the real path under the home and says`

> line 171 (the sentence that line completes): `the link is missing.** A path that silently stops resolving is the one failure worse than an inconvenient one.`

> line 1618: `| Ports are CLAIMED in the registry before they are bound                                                                                    | two sessions asking the OS for a free pair in the same moment can overlap, and two instances on one port reads as a walk measuring another walk's state                                                                                                                  |`

---

### W6 — The on-disk record contracts (wave D, PARALLEL with W7 and W8)

**Creates** under `packages/siegelense/src/contracts/`:

- `instance-heartbeat/` — `InstanceHeartbeat`
- `boot-lock/` — `BootLock`
- `registry-entry/` — `RegistryEntry`, with exactly the fields in §2 above
- `registry/` — `Registry` = `{ instances: readonly RegistryEntry[] }`, the whole `registry.json`

**Depends on** W3, W4, W5.

**Tests** `registry-entry-contract.test.ts` must cover, at minimum:
`VALID:` a booted row · `VALID:` a reserved row (`pid: null`, `bootedAtMs: null`, `lastBeatMs: null`) ·
`VALID:` an unowned row (`questId: null`, `guildId: null`) · `VALID:` a tombstone row (`state: 'pruned'`,
`prunedAtMs` and `prunedByRule` set) · `INVALID:` a row missing a required key. `registry-contract.test.ts`
asserts `EMPTY: {instances: []} => parses` — an empty registry is a real answer, never an error.

**Ward** as W3.

**Acceptance criteria, quoted**

> line 134: `  registry.json        one entry per instance: id · owner · quest · pid · pgids · specHash · ports · state · lastBeat`

> line 135: `  boot.lock            held for the duration of one boot; staleness releases it`

> line 1666: `| **A reaped or pruned instance leaves a TOMBSTONE; what is gone answers as gone, never as empty**                      | `pruned at 03:14, olderThan 7d` is an answer. An empty list reads as "that step produced nothing", which is the `count: 0` ambiguity landing where it does most damage: a fixer concluding the walk saw nothing    |`

> line 1668: `| **`start` records the quest id, and that is how `prune` and `cleanup` resolve "still referenced"**                    | both refusals are asserted all through this design with no mechanism. The quest id resolves to its `.quest-plans/`, the refusal names the citing file, and an instance with no quest ages out ordinarily           |`

> line 185: `| **capacity thundering herd** | three sessions each divide free memory by peak, each concludes it can start two, and six boot | RESERVE in the registry before booting. `capacity` counts reservations, not just running instances |`

---

### W7 — fs adapters (wave D, PARALLEL with W6 and W8)

**Creates** under `packages/siegelense/src/adapters/fs/`, each as
`<name>-adapter.ts` + `<name>-adapter.proxy.ts` + `<name>-adapter.test.ts`:

- `read-file/fs-read-file-adapter.ts` — `({ filePath }: { filePath: AbsoluteFilePath }): Promise<FileContents>`
- `write-file/fs-write-file-adapter.ts` — `({ filePath, contents }): Promise<void>`
- `rename/fs-rename-adapter.ts` — `({ fromPath, toPath }): Promise<void>`

These three are the tmp-then-rename pair a registry write needs, plus its read. `@dungeonmaster/shared/adapters`
already exports `fsMkdirAdapter`, `fsAccessAdapter`, `fsExistsSyncAdapter`, `pathJoinAdapter`,
`pathResolveAdapter`, `pathDirnameAdapter`, `osHomedirAdapter` and `netFreePortPairAdapter` — **reuse those,
do not write local copies.** Brokers may import another package's adapters directly.

**Depends on** W1 only. It uses `@dungeonmaster/shared/contracts` for `AbsoluteFilePath` and `FileContents`.

**Tests** each adapter's proxy mocks `node:fs/promises` via `registerMock`, keyed on the PATH (argument 0) —
never a constructor-level catch-all `calledWith([])` unless the adapter genuinely takes no address. The write
adapter's proxy exposes `getWrittenFor({ filePath })` reading `callsMatching([filePath]).at(-1)?.[1]`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 186: `| **profile writes**           | read-modify-write from three processes loses samples                                          | samples are APPEND-ONLY; steady and peak are computed on read. No lock needed                      |`

(The tmp-then-rename pair exists for the opposite case — the registry, where a read-modify-write is unavoidable
and must at least be atomic at the file level. The repo's precedent is
`locationsStatics.dungeonmasterHome.dispatchStateTmp` and its siblings.)

> line 1752 (the determinism table): `| evidence is APPEND-ONLY and OUTLIVES its instance — no reset at any level removes a log line, a capture or a transcript entry, and `kill` removes none of them | …`

---

### W8 — Locations resolvers I (wave D, PARALLEL with W6 and W7)

**Creates** under `packages/siegelense/src/brokers/locations/`, each as
`locations-<action>-broker.ts` + `.proxy.ts` + `.test.ts`:

- `root-path-find/locations-root-path-find-broker.ts` — `(): AbsoluteFilePath`, `<home>/.dungeonmaster/siegelense/`.
  Composes `dungeonmasterHomeFindBroker()` from `@dungeonmaster/shared/brokers` with
  `locationsStatics.siegelense.dir` via `pathJoinAdapter`. Mirror
  `packages/shared/src/brokers/locations/dispatch-state-path-find/locations-dispatch-state-path-find-broker.ts`
  exactly — it is the pattern.
- `registry-path-find/` — `<root>/registry.json`, and a second export is forbidden, so the `.tmp` sibling is
  derived by the registry write broker from `locationsStatics.siegelense.registryTmp`.
- `boot-lock-path-find/` — `<root>/boot.lock`

**Depends on** W2.

**Tests** each broker's proxy stages `dungeonmasterHomeFindBroker`'s answer, so the test asserts the exact
composed absolute string with `toBe`. No `toContain`.

**Ward** as W7.

**Acceptance criteria, quoted**

> line 127: `**Coordination is a SHARED REGISTRY ON DISK, and this repo already does exactly that.** Dispatch exclusivity between the`

> line 141: `**Per-instance drivers, one shared registry.** Every process can read it, it survives any single process dying, and`

> line 1617: `| Many sessions share ONE MACHINE through a disk REGISTRY — no daemon, no master, one driver per instance                                    | a daemon owning every instance is a single point of failure for N unrelated sessions and a lifecycle problem nobody wants. …`

---

### W9 — Locations resolvers II (wave E, PARALLEL with W10 and W11)

**Creates** under `packages/siegelense/src/brokers/locations/`:

- `instance-evidence-path-find/locations-instance-evidence-path-find-broker.ts` —
  `({ instanceId, guildId }: { instanceId: InstanceId; guildId: GuildId | null }): AbsoluteFilePath`.
  `<root>/guilds/<guildId>/instances/<id>/` when a guild is given, `<root>/unowned/instances/<id>/` when it is
  `null`. `unowned` is a real partition, not a fallback: it is the correct answer for a session no quest
  dispatched, and it must never be a guild id that no guild has.
- `profiles-path-find/` — `({ specHash }): AbsoluteFilePath` → `<root>/profiles/<hash>/`
- `repo-link-path-find/locations-repo-link-path-find-broker.ts` —
  `({ homePath }: { homePath: AbsoluteFilePath }): Promise<RepoLocalPath>`. Given an absolute path under the
  siegelense home, returns the `<repoRoot>/.siegelense/…` form with `linkPresent: true` when the symlink
  resolves to the siegelense root, and the real home path with `linkPresent: false` when it does not.

**Depends on** W3 (instance-id), W5 (repo-local-path), W8 (root-path-find), W7 is not needed.
Uses `cwdResolveBroker({ startPath, kind: 'repo-root' })` from `@dungeonmaster/shared/brokers` for the repo
root, and shared's `fsExistsSyncAdapter` / `fsAccessAdapter` for the link probe.

**Tests** `instance-evidence-path-find` needs both branches as separate tests — a guild id, and `null`.
`repo-link-path-find` needs both `linkPresent` branches, and a third test where the link exists but points
somewhere else, which must answer `linkPresent: false` rather than handing back a path that resolves to
another tree.

**Ward** as W7.

**Acceptance criteria, quoted**

> line 144: `**Assets are partitioned by the GUILD that owns the quest the instance was started for.** The key is the guild owning`

> line 145: `that QUEST — **never a guild a recipe seeded**, which is minted fresh inside the throwaway home on every run and would`

> line 152: `**`unowned/` is a real partition, not a fallback.** A session nobody orchestrated drives this tool too — the `docs` call`

> line 154: `wipe can take it and no quest reference protects it. An instance filed under a guild id that no guild has would be the`
> line 155: `worse answer: it reads as corruption where `unowned` reads as what it is.`

> line 157: `**Every path the tool hands back is inside the repo, through a symlink `dungeonmaster init` creates:**`

> line 170: `**Where the link is absent — a repo where `init` has not run — the tool hands back the real path under the home and says`

> line 1623: `| Assets live under the MINTED instance id                                                                                                   | unique by construction, so two instances cannot collide on a path                                                                                                                                                                                                        |`

> line 2089: `| **Every path handed back is repo-local, through `<repoRoot>/.siegelense`**                                                    | a shot is only evidence if the reader's `Read` reaches it. Same reason `npm run prod` keeps its home inside this repo                                                                                             |`

> line 2132: `**The `guildId` in `seeded` is NOT the one in the path.** The seeded guild lives in the throwaway home and is minted per`

---

### W10 — Registry read, write and update (wave E, PARALLEL with W9 and W11)

**Creates** under `packages/siegelense/src/brokers/registry/`:

- `read/registry-read-broker.ts` + `.proxy.ts` + `.test.ts` — `(): Promise<Registry>`. A MISSING
  `registry.json` returns `{ instances: [] }`. A PRESENT-but-unparseable one throws
  `RegistryUnreadableError` naming the path — an unreadable registry must never be indistinguishable from an
  empty one.
- `write/registry-write-broker.ts` + `.proxy.ts` + `.test.ts` — `({ registry }): Promise<void>`. Writes
  `registry.json.tmp`, then renames it over `registry.json`. `mkdir -p` on the root first.
- `update/registry-update-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ mutate }: { mutate: (current: Registry) => Registry }): Promise<Registry>`. Read, apply, write, return.
  **Every later writer goes through this**, so no caller assembles its own read/write pair.

**Depends on** W6, W7, W8, and W1's `RegistryUnreadableError`.

**Tests** unit only, with the fs adapter proxies staging each case.
`EMPTY: {no registry.json} => returns {instances: []}` · `ERROR: {malformed json} => throws RegistryUnreadableError`
· `VALID: {two rows} => returns both, parsed` · `VALID: {write} => writes the .tmp path then renames it` —
assert the rename's arguments, because writing straight to `registry.json` passes a content check and loses
the atomicity.

**Why unit and not integration:** this repo's check-type mapping puts `integration` on flows and startup files
only (root `CLAUDE.md`, "Which Checks Apply To A File Here"). The real-filesystem proof for this chunk lands in
W13c's `start-install.integration.test.ts`, which uses `installTestbedCreateBroker`. A reviewer should not
grade a missing `registry-read-broker.integration.test.ts` as a hole.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 141: `**Per-instance drivers, one shared registry.** Every process can read it, it survives any single process dying, and`

> line 142: `there is no election, no master and no split-brain.`

> line 288: `**What is GONE answers as gone, never as empty.** A reaped instance keeps its registry entry as a tombstone, and pruned`

---

### W11 — The boot lock and the heartbeat (wave E, PARALLEL with W9 and W10)

**Creates**

- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }): Promise<BootLock>`. Writes `boot.lock` when it is absent, or when the existing lock's
  `acquiredAtMs` is older than `instanceLifecycleStatics.bootLock.ttlMs`. Otherwise polls to the wait ceiling
  and then throws `BootLockHeldError` carrying `heldBy` and `waitedMs`. **Recursion with an early return, not
  `while (true)`** — the repo bans the loop outright; `siege-lane.ts`'s `waitForHttp` and `siege-driver.ts`'s
  `pump` are the shape to copy.
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }): Promise<void>`. Removes the lock only when it is still held by this instance; a lock
  another instance took over after a staleness release is left alone.
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId, pid, pgids }): Promise<InstanceHeartbeat>`. Writes `heartbeat.json` into that instance's
  evidence directory AND stamps `lastBeatMs` on its registry row, in one call, through
  `registryUpdateBroker`.

**Depends on** W6, W7, W8, W1's `BootLockHeldError`. `heartbeat/write` also needs W9's
`instance-evidence-path-find` and W10's `registry-update-broker` — **so if W9/W10 have not landed, the agent
building W11 writes the two boot-lock brokers first and reports the heartbeat one as blocked** rather than
inventing a path resolver of its own.

> **Scheduling note for the orchestrator:** the cleanest dispatch is W9 and W10 in one wave and W11 in the
> next. If all three go out together, hand W11 the boot-lock halves only and dispatch `heartbeat/write` as a
> follow-on.

**Tests** `boot-lock-acquire-broker.test.ts` needs four tests: no lock → acquires · a FRESH lock held by
another instance → throws `BootLockHeldError` after the ceiling · a STALE lock → acquires and says so ·
this instance's own lock → re-acquires idempotently. Mock `Date.now` through the proxy with `registerMock`;
never construct the timestamps by hand in the test.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> line 184: `| **the boot queue**           | "one boot at a time" cannot be enforced across processes that cannot see each other           | `boot.lock`, released by completion or by heartbeat staleness                                      |`

> line 1620: `| `boot.lock` enforces one boot at a time ACROSS processes, released by completion or by heartbeat staleness                                 | "the tool staggers" is unenforceable between processes that cannot see each other                                                                                                                                                                                        |`

> line 1755: `| ONE BOOT AT A TIME across every session, held by `boot.lock`                                                                                                   | a profile's PEAK is sampled during boot. Two instances booting together pollute each other's sample                                                                                     | a profile that reports a peak neither instance actually has                            |`

> line 1132: `- **A heartbeat file per instance** — pid, instance id, **the process-group ids of every child**, and a timestamp`

> line 1133: `  updated every few seconds. The pgids are the load-bearing part: after a SIGKILL there is nothing in memory holding`

---

### W12 — Reservation, release, and the two registry guards (wave F, PARALLEL with W13a and W13b)

**Creates**

- `packages/siegelense/src/guards/is-reserved-registry-entry/is-reserved-registry-entry-guard.ts` + `.test.ts`
  — `({ entry }): boolean`. True when `bootedAtMs === null`. No proxy: guards are pure and run real.
- `packages/siegelense/src/guards/is-stale-registry-entry/is-stale-registry-entry-guard.ts` + `.test.ts` —
  `({ entry, nowMs }): boolean`. True when `lastBeatMs` is older than
  `heartbeat.intervalMs × heartbeat.stalenessBeats`. `nowMs` is a parameter, not a `Date.now()` call, so the
  guard stays pure and the broker above it owns the clock.
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ specName, specHash, questId, guildId }): Promise<RegistryEntry>`. Mints the id, resolves the owner from
  `process.pid`, asks the OS for a free pair via `netFreePortPairAdapter`, and **re-rolls when the pair
  collides with any pair already claimed in the registry**, bounded by
  `instanceLifecycleStatics.ports.claimAttempts` and then throwing `PortClaimExhaustedError`. Writes the row
  through `registryUpdateBroker` with `state: 'alive'`, `pid: null`, `bootedAtMs: null` — a reservation —
  and mints the instance's evidence directory.
- `packages/siegelense/src/brokers/instance/release/instance-release-broker.ts` + `.proxy.ts` + `.test.ts` —
  `({ instanceId }): Promise<RegistryEntry>`. Marks the row `killed` and clears `pid`/`pgids`, **and never
  deletes it** — a reaped entry survives as a tombstone for as long as its evidence does.

**`owner` is the MCP child's pid, and that is checkable without the caller carrying anything.**
`packages/mcp/CLAUDE.md` records that there is **one MCP stdio child per parent Claude Code session**, shared
by every sub-agent that session dispatches. So `process.pid` inside the MCP process identifies "this session"
exactly, a later `kill` from the same child matches it, and a parent and its own minion correctly count as one
owner. Put the derivation inside `instance-reserve-broker` (mocking `process.pid` through the proxy); do not
ask the caller for it.

**Depends on** W6, W9, W10, W1's `PortClaimExhaustedError`, and `netFreePortPairAdapter` from
`@dungeonmaster/shared/adapters`.

**Tests** the port-claim race is proved at unit level: `INVALID: {registry already claims 34173/34174} =>
re-rolls and returns a different pair` — stage `netFreePortPairAdapter` with `onceFor` so the first call hands
back the colliding pair and the second a free one, then assert the returned `PortPair` with `toStrictEqual`.
Add `ERROR: {every attempt collides} => throws PortClaimExhaustedError`. Assert the WRITTEN row too, via the
registry proxy, not just the return value.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the ten files>`

**Acceptance criteria, quoted**

> line 183: `| **port allocation**          | two sessions ask the OS for a free pair in the same moment and can overlap                    | claim the pair in the registry BEFORE binding; re-roll on conflict                                 |`

> line 185: `| **capacity thundering herd** | three sessions each divide free memory by peak, each concludes it can start two, and six boot | RESERVE in the registry before booting. `capacity` counts reservations, not just running instances |`

> line 187: `| **asset collision**          | two instances writing to one path                                                             | assets live under the minted instance id, which is unique by construction                          |`

> line 189: `**Reaping is by STALENESS, never by ownership.** Any session may reap an instance whose heartbeat has gone cold, because`

> line 1134: `  them, so without a file the orphans cannot be found, only guessed at.`

> line 1666: `| **A reaped or pruned instance leaves a TOMBSTONE; what is gone answers as gone, never as empty**                      | …`

> line 1750 (the determinism table): `| port allocation across every session on the machine — CLAIMED in the registry before binding                                                                   | two sessions can ask the OS for a free pair in the same moment and overlap. Two instances on one port is two walks sharing a browser                                                    | a walk measuring another walk's state, which looks like a real defect                  |`

---

### W13a — The symlink adapters and the link-create responder (wave F, PARALLEL with W12 and W13b)

**Creates**

- `packages/siegelense/src/adapters/fs/symlink/fs-symlink-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ targetPath, linkPath }): Promise<void>`, `fs.symlink` with `type: 'dir'`.
- `packages/siegelense/src/adapters/fs/readlink/fs-readlink-adapter.ts` + `.proxy.ts` + `.test.ts` —
  `({ linkPath }): Promise<AbsoluteFilePath>`.
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.ts` + `.proxy.ts` +
  `.test.ts` — `({ context }: { context: InstallContext }): Promise<InstallResult>`. Creates
  `<repoRoot>/.siegelense → <home>/.dungeonmaster/siegelense/`, `mkdir -p`ing the target first so the link
  never dangles. **Idempotent:** a link already pointing at the right target is a no-op, and one pointing
  somewhere else is replaced.

**Depends on** W2, W8 (root-path-find), W7 is not needed. `InstallContext` / `InstallResult` come from
`@dungeonmaster/shared/contracts`.

**Tests** the responder's proxy delegates to the adapter proxies. Three tests: no link → creates · correct link
→ makes no `symlink` call (`toHaveBeenCalledTimes(0)` paired with what WAS called) · wrong target → replaces.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the nine files>`

**Acceptance criteria, quoted**

> lines 157–160:
> ```
> **Every path the tool hands back is inside the repo, through a symlink `dungeonmaster init` creates:**
>
> <repoRoot>/.siegelense  →  <home>/.dungeonmaster/siegelense/
> ```

> line 163: `**This is what makes a shot openable at all.** A shot is a PNG and the only way a model sees one is a `Read` of its`
> line 164: `path, so a path the reader's `Read` cannot reach is a path that hands back nothing. …`

> line 1670: `| **`dungeonmaster init` creates `<repoRoot>/.siegelense` and ignores it — in git AND in the check globs**              | a shot is only evidence if the reader's `Read` reaches it, and one path shape in every repo beats a home that moves. A symlinked tree of thousands of PNGs is also something lint and test globs walk into         |`

---

### W13b — The ignore and recipes-scaffold responders (wave F, PARALLEL with W12 and W13a)

**Creates**

- `packages/siegelense/src/responders/install/ignore-write/install-ignore-write-responder.ts` + `.proxy.ts` +
  `.test.ts` — adds `.siegelense` to `.gitignore`, **and to the check globs**, wherever `worktrees` is already
  excluded. Read `packages/orchestrator`'s own install responder for the `worktrees` precedent and follow it
  exactly; then extend to the non-git exclusions (`eslint.config.js` ignores, the root jest `testPathIgnorePatterns`,
  `tsconfig.json` `exclude`). Idempotent: an entry already present is not appended twice.
- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts` +
  `.proxy.ts` + `.test.ts` — creates `packages/siegelense-recipes/` in the target repo if it is absent, with
  its `src/` present and empty. **An existing one is left untouched** — the convention travels, the recipes do
  not.

**Depends on** W2. Uses shared's `fsMkdirAdapter`, `fsExistsSyncAdapter`, W7's `fs-read-file` / `fs-write-file`
if W7 has landed; otherwise shared's `fsReadFileSyncAdapter` plus W7's write adapter.

**Tests** the ignore responder: entry absent → appended once · entry present → file unchanged (assert the write
count is 0 paired with the read that happened) · file absent → created. The scaffold responder: folder absent
→ created with an empty `src/` · folder present with a recipe in it → nothing written.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

**Acceptance criteria, quoted**

> line 173: `**The link is gitignored by the same install step that writes it**, exactly as `@dungeonmaster/orchestrator` does for`

> lines 174–177: ``../../worktrees`. **And the ignore has to cover more than git**: a symlinked directory inside the repo is something lint, typecheck and test globs can walk into, and the evidence tree holds thousands of PNGs. Whoever builds this adds `.siegelense` wherever `../../worktrees` is already excluded, and an instance's assets are not a file tree anything grades.``

> line 1711: `| `packages/siegelense-recipes/` exists in EVERY repo siegelense is installed in, scaffolded by `dungeonmaster init`                                | a convention nothing creates is a convention half the repos will not have. Each package's `StartInstall` already writes what its own package needs; this is the same move                                                                                     |`

> line 1712: `| An EMPTY recipes package is a real answer where a MISSING one is not                                                                              | an empty folder says "no recipes yet"; an absent folder can only say "something is wrong", and the tool cannot tell "you have written none" from "you have not installed this". The `count: 0` ambiguity, one layer up again                                  |`

> line 1836: `**`packages/siegelense-recipes/` EXISTS IN EVERY REPO siegelense is installed in.** Not "wherever a repo chooses to put`

> line 1839: `**`dungeonmaster init` scaffolds it**, which is what makes that a fact rather than an aspiration. Each package's`

> line 1876: `**In a consumer repo the folder is there and the contents are theirs.** The convention travels; the recipes do not.`

---

### W13c — The install flow and `StartInstall` (wave G, alone)

**Creates**

- `packages/siegelense/src/flows/install/install-flow.ts` + `install-flow.integration.test.ts` — orchestrates
  the three install responders and returns one `InstallResult`.
- `packages/siegelense/src/startup/start-install.ts` + `start-install.integration.test.ts` —
  `StartInstall({ context })` delegating to `InstallFlow`. **Keep the install logic in the flow and the
  responders, not in brokers** — the root `CLAUDE.md` says the CLI orchestration layer owns discovery and
  execution, and each package's `startup/start-install.ts` is what it dynamically imports.

**Depends on** W13a, W13b.

**Tests — this is where the real filesystem is exercised.** `start-install.integration.test.ts` uses
`installTestbedCreateBroker` from `@dungeonmaster/testing` with a temp dir under the OS `/tmp` (never
`<repoRoot>/tmp`), and asserts, against real files:

1. `<testbed>/.siegelense` exists and resolves to the siegelense root under the testbed's home
2. `<testbed>/.gitignore` contains a `.siegelense` line, exactly once, after running install TWICE
3. `<testbed>/packages/siegelense-recipes/src/` exists and is empty — the empty-is-a-real-answer property
4. a second run leaves an existing recipes folder's contents untouched
5. every path the result hands back is absolute

Integration tests MAY use `beforeAll`/`afterEach` — `jest/no-hooks` is off for `*.integration.test.ts` — and
the testbed's `cleanup()` belongs in `afterAll`.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- packages/siegelense/src/flows/install/install-flow.ts packages/siegelense/src/flows/install/install-flow.integration.test.ts packages/siegelense/src/startup/start-install.ts packages/siegelense/src/startup/start-install.integration.test.ts`

**Acceptance criteria, quoted**

> line 1839 (second half): `Each package's`
> line 1840: ``StartInstall` already writes the config its own package needs; siegelense's creates the recipes package the same way. A``
> line 1841: `convention nothing creates is a convention half the repos will not have.`

> line 1843: `**And an EMPTY recipes package is a real answer where a missing one is not.** `siegelense-recipes {}``

> line 1670: `| **`dungeonmaster init` creates `<repoRoot>/.siegelense` and ignores it — in git AND in the check globs**              | …`

---

### W14 — The barrels and the exports map (wave H, alone)

**Creates** at `packages/siegelense/` root (outside `src/`, so `enforce-implementation-colocation` exempts
them and they need no `.test.ts`):

- `contracts.ts`, `statics.ts`, `errors.ts`, `guards.ts`, `adapters.ts`, `brokers.ts`, `startup.ts` — one
  `export *` line per entry file
- `packages/siegelense-recipes/` gets the same treatment for whatever `create-package` seeded

**Edits** both `package.json` `exports` maps: each subpath maps to `source` (`./contracts.ts`), `require` and
`import` (`./dist/contracts.js`) and `types` (`./dist/contracts.d.ts`), exactly as
`packages/shared/package.json` does.

**Why one owner and why last:** three agents editing one barrel in the same wave is a merge conflict class this
plan removes by construction. Nothing inside the package needs a barrel — local imports are relative — and the
CLI discovers `packages/*/dist/startup/start-install.js` by path, not through a barrel.

**Depends on** every other item.

**Tests** none of its own; the proof is that a scoped ward run typechecks and that a one-line smoke import from
another package resolves. Verify by hand that importing `@dungeonmaster/siegelense/contracts` from a scratch
file under `<repoRoot>/tmp/` typechecks and pulls no msw.

**Ward** `npm run ward -- -- packages/siegelense packages/siegelense-recipes` (the whole chunk, once, as the
regression pass).

**Acceptance criteria, quoted**

> line 1870: `**Each barrel must be SUBPATH-IMPORTABLE and must not pull msw behind it**, and this is measured rather than cautious.`

> lines 1871–1874: ``server-app.harness.ts:250` records that `@dungeonmaster/testing`'s root barrel is unreachable from server integration tests, because importing it drags msw's ESM into a jest run that does not transform it. A recipe carries a colocated integration test by design, so a barrel with that problem makes the recipe package's own tests unable to import it — the one consumer it cannot afford to lose.`

---

## 4. What is deliberately NOT built yet, and why that is safe

**No driver process, and therefore no browser, no port BINDING and no teardown of anything real.** Every race
this chunk makes safe is a race over the registry FILE, and a file race is provable without a process:
`instance-reserve-broker` re-rolls against a claimed pair whether that pair is bound or merely written down.
Chunk 2 adds the process that binds the ports it was handed; it changes no shape this chunk defines. The
teardown suite the spec demands (line 1353, seven assertions each shown failing first) belongs to the chunk
that owns the processes — asserting "no process matching the instance remains" when nothing spawns one is the
leak-guard that "passed for every tree and proved nothing" (line 1366), which is the exact trap that section
was written about.

**No MCP tool registrations.** Registering thirteen names that answer errors is worse than registering none:
`docs { for: 'driving' }` exists so a session outside a quest can learn the surface, and a surface that is
thirteen stubs teaches the wrong thing. The thirteen names are pinned NOW, in
`siegelenseToolsStatics`, so the chunk that registers them cannot invent a fourteenth or drop one.

**No `capacity` and no profile sampler.** `capacity` is a reading over the registry, the profiles tree and the
machine. Two of those three exist after this chunk; the third has no writer until an instance runs. Shipping
`capacity` now would mean shipping the no-profile default (`suggested: 2`, line 1442) as the only branch it
has, which is a safety net (line 1427) being presented as the mechanism.

**No evidence WRITER, only the directory and its resolvers.** `results`, `status`, `compare` and `prune` all
read a tree that nothing fills yet. What they need from this chunk is the path shape and the five
`InstanceState` answers, and both are here — so a later `results` that lands on a reclaimed instance answers
`pruned at …` rather than `[]`, which is the single failure the retention section exists to prevent (line 290).

**Neither local lint rule.** Both are Part 7 item 16 and both are deferred to the chunks that create their
subjects. A rule that cannot be shown firing against a real violation is a rule nobody can audit, and the spec
carries its own caution about exactly that: "**State the rule's scope in its own message**, per the caution
recorded in `siegelense-recipes.md`: this repo already has a rule that looks broader than it is, and a rule
people over-trust is worse than none." (lines 2011–2013). Both rules live as prose in the package `CLAUDE.md`
from this chunk onward, which is where the spec puts the `querySelector` half permanently.

**`POST /api/tooling/smoketest/run` stays ungated by this build.** See §1. It is a real finding and it should
be fixed — just not here, and not by an agent whose plan is a different package's foundation.
