# Chunk 7 — this repo's own ingredients and recipes, in `packages/siegelense-recipes/`

> **Every chunk before this one builds a framework nothing has used. This is the first that proves it
> against real state, and chunk 9 and chunk 10 convert roughly nine hundred real call sites onto what
> it designs.** So every ingredient below is designed from
> `scrolls/seigelense/plans/recipes-seeding-survey.md` and from the contracts on disk, not from the
> specification's examples. Where the specification's example and this repo's code disagree, §11 says
> so by name.
>
> Written against the tree on **2026-09-16**, file by file. Five agents have each found a plan wrong
> about something, so nothing below is quoted from another plan without being opened.
>
> **The package is `siegelense-recipes` on disk.** It becomes `hydration-recipes` in the separate
> rename step the specification describes under *"The rename is its own step, and it is bigger than
> the folder"*. Nothing here renames anything.

---

## 0. What is on disk, and what this plan is written against

### The package today — an empty scaffold, and one violation

```
packages/siegelense-recipes/
  package.json · tsconfig.json · tsconfig.build.json · jest.config.js · statics.ts
  src/statics/siegelense-recipes/siegelense-recipes-statics{.ts,.test.ts}
```

`siegelenseRecipesStatics` holds one key, `packageName: 'siegelense-recipes'`. The package declares
**no dependencies at all**, carries `"publishConfig": { "access": "public" }` and `"files": ["dist/**/*"]`,
and is **listed in the root `package.json` `dependencies`** as `"@dungeonmaster/siegelense-recipes": "*"`.
§7 closes that last one.

### The four rulings this plan designs against, none of which is on disk

Read file by file on 2026-09-16. Chunk 4's §5 says they are *"one edit pass … made ONCE, before group
R1 starts"*. **They have not been made.**

| Ruled | On disk today | Where |
|---|---|---|
| `routes` gains optional `query`, `update`, `remove` | `hydrationRoutesContract` is `{ api?, write?, recording? }` with a `.refine` over `hydrationRouteContract.options` | `packages/hydration/src/contracts/hydration-routes/hydration-routes-contract.ts` |
| an `extras` entry is `{ args, apply }` | nothing declares `extras` yet — `ingredient-config-contract.ts` is **not written** | A2c is listed as missing in chunk 4's §0 and still is |
| `reach` also receives the `record` | `ReachFn<TTarget, TValue>` is `({ from, to, target }) => unknown` | `transition-spec-contract.ts`, and **nothing imports it** |
| a link gains an optional `from` | `linkSpecContract` is `z.object({ of, as })`; `LinkSpecFor` is `{ of, as }` | `link-spec-contract.ts` |

**Two ingredients here cannot be written at all without `from`** — §3.4's `{ of: 'guild', as: 'cwd', from: 'path' }`
and §3.5's `{ of: 'session', as: 'sessionId', from: 'sessionId' }` — which is why GATE A is a hard stop
rather than a note.

### Five things the code says that the specification does not

Each was read, and each changes a design decision below.

| Found in | What is true |
|---|---|
| `packages/orchestrator/CLAUDE.md` | *"**NEVER call `fsWriteFileAdapter` directly for quest files — always use `questPersistBroker`**"*, and *"All 4 quest mutation brokers write through `questPersistBroker` (file write + outbox append)"*. **This is what decides §6**, and it makes the Jest-side seeder a violation rather than an alternative |
| `quest-blueprint-contract.ts:28-46` | `questBlueprintContract` carries **no `workItems` key and no `status` key** — only `targetStatus`. So `questHydrateBroker` cannot be the `write` route the 259 `writeQuestFile` call sites need, whatever Part 5's migration section says |
| `packages/server/src/flows/guild/guild-flow.integration.test.ts:13-15` | an `api`-route test costs **milliseconds, not 20 seconds** — `const app = GuildFlow();` … `await app.request('/api/guilds')`, an in-process Hono object with no port and no process. §4 |
| `session.harness.ts:256` and `playwright.config.ts:34` | the session directory resolves against `os.homedir()`, and only Playwright's own config makes that safe by setting `process.env.HOME`. **Nothing sets it for a Jest run**, so `DmTarget` carries `claudeHome` — §3.0 |
| `install-testbed-contract.ts:17-40` | the testbed's temp-dir property is **`guildPath`**. The repo-root `CLAUDE.md` says `testbed.projectPath`; that field does not exist |

### What jest here can and cannot share

- **No jest `globalSetup` or `globalTeardown` exists anywhere in this repo.** The only ones are
  Playwright's, at `packages/web/playwright.config.ts:57-58`.
- Each test FILE runs in its own worker with its own module registry, at `--maxWorkers=25%`.
- So *"`api` routes share ONE instance for the whole suite"* can only mean **one per test file, via
  `beforeAll`** — which `jest/no-hooks` permits in `*.integration.test.ts` and `*.harness.ts` and
  nowhere else. §4 is built on that.

---

## 0b. What group P0 found, which later groups build on

**Every agent reads this before writing a file.** Where it disagrees with the plan text below, this
section is what shipped.

| Found by | What is true |
|---|---|
| P0-β | Every field contract is derived with `.pick()`, `.omit()` and `.extend()` off a real repo contract, so the never-restate-a-type rule holds structurally rather than by care. **Follow it** |
| P0-β | **`questContract` carries no `guildId`.** A quest's parent is its FOLDER PATH. The link writes `guildId` into a quest's FIELDS, and the quest RECORD can never confirm it landed — so nothing downstream may read a parent id back off a quest record |
| P0-β | **`ban-primitives` rejects a bare `number` even in a type-only position**, and does NOT special-case the branded-intersection idiom for `number` the way it does for `string`. Brand a numeric field through a zod contract, never in a bare type alias |
| P0-β | `HttpRequestFn` returns `Promise<unknown>`. A raw response is `unknown` until the calling route's own contract parses it, and P1-0 and the api-route brokers own the real envelope |
| P0-γ | **A session links to its guild as `{ of: 'guild', as: 'cwd', from: 'path' }`** — the child's field is not an id and the parent's field is not `id`. This is the case the optional `from` exists for, and without it the link is unexpressible |
| P0-γ | **No whole session or sub-agent entity contract exists in this repo.** The four contracts are assembled field by field from real leaf contracts, because there is nothing to derive from. That is the exception to P0-β's rule, and it is narrow |
| P0-γ | `toolUseIdContract` lives in `@dungeonmaster/orchestrator` and is NOT re-exported from its barrel, and this package may not depend on `@dungeonmaster/mcp`. One small shared contract carries it rather than two inline restatements |

### What P0-α found, and the two lint rules nobody owns

| Found | What is true |
|---|---|
| **The absence test in §7 asserts a key that cannot exist.** It reads `dependencies[siegelenseRecipesStatics.packageName]`, which is `'siegelense-recipes'`; the real entry is `'@dungeonmaster/siegelense-recipes'` | **As written it could never go red.** It ships building the scoped key and was proven red-then-green both ways. This is why a test guarding a rule gets its failure proven, not assumed |
| **The §7 eslint entry names a rule that does not exist.** `@dungeonmaster/no-nondeterministic-source` is nowhere in the plugin | **An unregistered rule ID is a FATAL config error, not a no-op.** Adding it crashed lint for every file in the package. No entry was added |
| A test may live in `statics/` | **It may not.** A file under `statics/` imports only `statics/` and no external package at all, Node's own `fs` included. The absence test is a loose `.integration.test.ts` under `src/`, following `packages/eslint-plugin`'s own sanctioned precedent |
| a test can parse a contract inline | **It cannot.** A test file imports stubs, never contracts, and may not call another package's brokers or adapters without a proxy. The logic lives in a broker and a guard this package owns |
| — | **The package now also declares `"private": true`**, so npm refuses to publish it even if the root entry returns. That is a second, independent guard on the same rule, and both halves are proven able to fail |

### The two lint rules now EXIST, and they only fire on a filename

**Both rules ship in `@dungeonmaster/eslint-plugin`, are registered, and were proven firing against
real ESLint.** One bans a DOM handle in an ingredient; one bans a clock or a random source.

**They scope by FILENAME: a file ending `-ingredient.ts` or `-ingredient.tsx`.** There is no
ingredient folder type in the architecture, and no real ingredient existed when the rules were
written — so that convention is a bet, and this plan is what makes it true.

> **Every ingredient this chunk writes is named `<name>-ingredient.ts`.** An ingredient under any
> other name is invisible to both rules, and the determinism guarantee silently stops being enforced
> for it.

**What each rule does NOT catch**, so nobody reads a clean lint as proof:

| Rule | Blind to |
|---|---|
| the DOM-handle rule | a namespaced ref call rather than a bare one; a handle reached through a wrapper file; bare property access with no call; a UI toolkit outside its watchlist |
| the determinism rule | a destructured import of the same function called bare; other sources of variation the specification does not name; **a helper in another file that calls one of the three** |

**Both rules read ONE file's own syntax and never its call graph.** That is the template's own admitted
blind spot, carried across deliberately. **An ingredient stays deterministic because its author meant
it to**, and the rule catches the careless case rather than the determined one.

**One thing left open:** the pre-edit hook may read a compiled snapshot rather than source, so these
two rules may not block an edit until `@dungeonmaster/hooks` is rebuilt. Ward's own lint does fire
them from source. Confirm it when an ingredient first exists.

### What each rule holds, in the specification's own words

Both live in `@dungeonmaster/eslint-plugin`, which SHIPS. The specification is explicit that a
repo-only rule would hold the constraint here and nowhere else, and the constraint binds every repo
that writes an ingredient.

| Rule | What it holds |
|---|---|
| an ingredient holds no DOM handle | *"An ingredient touches STATE, never a screen"* — an ingredient carrying a selector is a design error, not a stale value: it says the ingredient is doing a walk's job |
| an ingredient calls no clock and no random source | *"the enforcement is one lint rule over one folder rather than a convention repeated in every recipe"*. With the index supplied by the chain, reaching for one of those is the ONLY way left to break determinism |

**A config entry names a rule only once that rule is registered.** An entry naming an unregistered
rule is a FATAL config error that takes down linting for the whole package, not a harmless no-op.

### The session ingredient's `copies:` has no valid target, and that is a finding

**Nothing in this repo writes a session transcript.** P0-γ checked: every in-repo path that touches
the shape READS it. The Claude CLI writes it, and the only in-repo artifact that emits it is a test
fixture, not production code.

`copies:` is defined as *the production code whose output that route imitates*, and **a `write` route
must declare one.** So the rule assumes an in-repo counterpart that here does not exist.

**This goes back into `siegelense-recipes.md` beside *"A `write` route must declare `copies:`"*.** The
question it has to answer: what does `copies:` name when the thing being imitated is an external
tool's output? Until it is answered, the session ingredient cannot honestly declare a `write` route —
and it is the ingredient behind a large share of the conversion's call sites.

---

## 1. Build order, with the parallel groups marked

Three agents work from this at once. A group may be written in parallel; a group waits for every
group above it. **A gate is a hard stop — starting past one produces files that do not compile.**

### Group P0 — startable TODAY, three agents in parallel, gated on nothing

**Nothing in P0 imports `@dungeonmaster/hydration` at all.** This is the whole reason chunk 7 is not
idle until chunk 6 lands.

| Agent | Files |
|---|---|
| **P0-α** | the package's own rules — root `package.json` edit · `packages/siegelense-recipes/package.json` · the root-dependency absence test · `tsconfig.build.json` / `jest.config.js` edits · the `eslint.config.js` entry |
| **P0-β** | `contracts/dm-target/` · `contracts/guild-fields/` · `contracts/quest-fields/` · `contracts/operation-fields/` |
| **P0-γ** | `contracts/session-record/` · `contracts/session-fields/` · `contracts/subagent-record/` · `contracts/subagent-fields/` · the three extra-args contracts |

> **GATE A — the four chunk-4 rulings have landed on `packages/hydration`'s contracts.**
> `hydrationRoutesContract` carries `query`/`update`/`remove`; an `extras` value is `{ args, apply }`;
> `ReachFn` receives `record`; `linkSpecContract` carries an optional `from`. **None of the four is on
> disk today** — §0 has the evidence. Every ingredient below is designed against the RULED shape, and
> writing one against today's shape produces a file that must be rewritten.

> **GATE B — chunk 3's D4 has landed.** `ingredient`, `registry`, `recipe` and `createHydration` are
> exported from `@dungeonmaster/hydration`'s barrels. Until then nothing in P1 compiles.

### Group P1-0 — ONE agent, sequential, first

One file and its two adapters. Every ingredient imports it, so it cannot be written in parallel with
them.

| Files |
|---|
| `brokers/hydration/create/recipes-hydration-create-broker.ts` — this repo's single `createHydration<DmTarget>()` call · `adapters/http/request/dm-http-request-adapter.ts` · `adapters/jsonl/append/dm-jsonl-append-adapter.ts` |

### Group P1 — the declarations, three agents in parallel

| Agent | Files |
|---|---|
| **P1-α** | `brokers/guild/{write,api,query,remove}/` → `brokers/guild/ingredient/` |
| **P1-β** | `brokers/quest/{write,api,update,query,remove}/` → `brokers/quest/ingredient/` · `brokers/operation/{write,query,update,remove}/` → `brokers/operation/ingredient/` |
| **P1-γ** | `brokers/session/{write,query,remove}/` → `brokers/session/ingredient/` · `brokers/subagent/{write,query,remove}/` → `brokers/subagent/ingredient/` |

Inside each agent the arrows are sequential (an ingredient imports its own route brokers); across the
three agents nothing is shared but P1-0.

### Group P2 — ONE agent, after P1

| Files |
|---|
| `brokers/registry/dm-registry-broker.ts` — the one file naming all five ingredients. It is written once, by one agent, because `registry()` is where a duplicate name and a dangling `links.of` are caught |

> **GATE C — chunk 4's runner has landed.** `run(plan, target)` is exported and its own integration
> tests are green. Nothing in P3 onward can be RUN before this.

### Group P3 — the cheap-tier tests, three agents in parallel

| Agent | Files |
|---|---|
| **P3-α** | `test/harnesses/file-target/file-target.harness.ts` · `brokers/guild/ingredient/guild-ingredient-broker.integration.test.ts` (write half only) |
| **P3-β** | `brokers/session/ingredient/…integration.test.ts` · `brokers/subagent/ingredient/…integration.test.ts` |
| **P3-γ** | `brokers/operation/ingredient/…integration.test.ts` |

> **GATE D — chunk 5 (`transitions` and `reach`) has landed.**

### Group P4 — ONE agent, after GATE D

| Files |
|---|
| `brokers/quest/reach/quest-reach-route-broker.ts` · `brokers/quest/ingredient/…integration.test.ts` (write half, including the transition cases) |

> **GATE E — chunk 6 (`filter` reading live state, `fromSaved`) has landed.**

### Group P5 — two agents in parallel, after GATE E

| Agent | Files |
|---|---|
| **P5-α** | `test/harnesses/api-target/api-target.harness.ts` — the shared-app mechanism of §4 |
| **P5-β** | the `filter` cases added to the operation ingredient's test — a `filter` over rows the quest's `in_progress` transition minted |

### Group P6 — ONE agent, after P5-α

| Files |
|---|
| the `api` halves and the two-route comparison, added to the guild and quest ingredient tests. **One file, one `beforeAll`, one app** — §4 |

### Group P7 — two agents in parallel, after P6

| Agent | Files |
|---|---|
| **P7-α** | `brokers/recipe/guild-mid-execution/` · `brokers/recipe/session-with-nested-chain/` · `brokers/recipe/quest-advances-one-step/` and their tests |
| **P7-β** | `index.ts` (the manifest chunk 8 globs) · `CLAUDE.md` · `brokers.ts` / `contracts.ts` barrels |

### The whole order, numbered

1. P0-α, P0-β, P0-γ — parallel, today
2. **GATE A**, **GATE B**
3. P1-0 — one agent
4. P1-α, P1-β, P1-γ — parallel
5. P2 — one agent
6. **GATE C**
7. P3-α, P3-β, P3-γ — parallel
8. **GATE D**
9. P4 — one agent
10. **GATE E**
11. P5-α, P5-β — parallel
12. P6 — one agent
13. P7-α, P7-β — parallel

---

## 2. Every harness method, against the ingredient that replaces it

**This is what chunks 9 and 10 work from.** A harness method with no ingredient is a conversion that
will stall, so every method in the survey has a row — including the ones whose row reads
`NOT CONVERTED`.

Call-site counts are the specification's own, from `python3 scrolls/tools/seed-census.py` on
2026-09-16. Re-run it rather than trusting a number here.

### `guildHarness` — 510 call sites (`packages/web/test/harnesses/guild/guild.harness.ts`)

| Method | Becomes | Note |
|---|---|---|
| `createGuild({ name, path })` | `dm.guilds.add(1, (g) => [g[0].set({ name, path })])` | `path` may be omitted; the route derives it from the target — §5 |
| `cleanGuilds()` / `beforeEach` | **not an ingredient verb.** The target's own teardown: a testbed `cleanup()`, or the api-target harness's `afterAll` | The sequential-delete rule survives as a comment on that teardown — §4 |
| `extractGuildId({ guild })` | `g[0].saveRecordAs({ name: 'guild' })`, then `out.guild.id` | the record carries it |
| `extractUrlSlug({ guild })` | `out.guild.urlSlug` | **deleted, not converted** — survey finding 1: the harness re-derives the slug with a narrower rule than `nameToUrlSlugTransformer`. The record already holds the real one |

### `questHarness` — 259 call sites (`packages/web/test/harnesses/quest/quest.harness.ts`)

| Method | Becomes | Note |
|---|---|---|
| `createQuest({ guildId, title, userRequest })` | `g[0].quests.add(1, (q) => [q[0].set({ title, userRequest })])` against an `api` target | the `api` route |
| `writeQuestFile({ … })` | the same call against a `write` target, plus `q[0].set({ status, workItems, operations, … })` | the `write` route. §6 decides what it does |
| `writeUnparseableQuestFile({ … })` | `q[0].corruptToLegacySchema({})` — a quest **extra** | an ingredient parses its route's return through `record`; a deliberately invalid row cannot come back through that parse, so it is an extra that writes AFTER the create — §3.2 |
| `writeWardResultDetail({ … })` | `q[0].withWardResultDetail({ wardResultId, detail })` — a quest **extra** | survey finding 3: one logical entity across two files. §11 Q7-8 |
| `patchQuestStatus({ questId, status })` | `q[0].set({ status })` | the transition, walked. On an `api` target `reach` is `PATCH /api/quests/:id`; on a `write` target it is `questModifyBroker` |
| `rewindQuestStatus({ questFilePath, status })` | `q[0].setRaw({ status })` | **only where this plan minted the quest.** Against a quest the live server wrote it is survey finding 2 and stays hand-rolled |
| `questFolderExists({ questFilePath })` | **stays in the spec.** An assertion, not seeding | *"A converted test keeps its assertions, exactly. Only its setup changes."* |
| `buildQuestJson({ … })` | **deleted.** Dead code — the survey found no caller | |
| `seedInProgressWithOperations({ … })` | a RECIPE, not an ingredient — `quest-advances-one-step` | §8 |

### `sessionHarness` — 147 call sites (`packages/web/test/harnesses/session/session.harness.ts`)

| Method | Becomes |
|---|---|
| `createSessionFile({ sessionId, userMessage })` | `g[0].sessions.add(1, (s) => [s[0].set({ sessionId, lines: [userText(userMessage)] })])` |
| `createMultiEntrySessionFile({ sessionId, lines })` | `s[0].set({ sessionId, lines })` |
| `createSessionWithAssistantText` · `createSessionWithRedactedThinking` · `createAnsweredClarificationSession` · `createSessionFileForQuest` | the same `set({ lines })`, with the lines the caller already builds from `@dungeonmaster/shared/contracts` stubs |
| `appendMainSessionLine({ sessionId, line })` | `s[0].set({ lines: [...] })` where this plan minted the session; otherwise survey finding 2 — **NOT CONVERTED** |
| `createSubagentSessionFiles` · `createInFlightSubagentSessionFiles` · `createSubagentSessionWithInternalTool` · `createBackgroundAgentSession` · `createSubagentTailOnly` · `createSubagentTailMultiEntry` | `s[0].subagents.add(n, (a) => [a[0].set({ agentId, toolUseId, lines })])` |
| `createMultiSubagentSessionFiles({ subagents: [...] })` | `s[0].subagents.add(n, (a, all) => [...])` — one `add`, `defaults(index)` doing the per-row variation |
| `createNestedSubagentSessionFiles({ … })` | `s[0].subagents.add(1, (a) => [a[0].subagents.add(1, …)])`, or `s[0].withNestedChain({ depth: 2 })` — the extra the specification's own example names |
| `appendSubagentLine({ sessionId, agentId, line })` | `a[0].set({ lines })` where this plan minted it; otherwise finding 2 — **NOT CONVERTED** |
| `cleanSessionFiles()` · `cleanSessionDirectory()` · `beforeEach` / `afterEach` | **not ingredient verbs.** The target's `claudeHome` is a temp dir the caller discards |
| `sessionFileExists({ sessionId })` | **stays in the spec.** An assertion |

### What no ingredient in this chunk covers

| Survey finding | What it seeds | Why it is out |
|---|---|---|
| 4 | `dispatchHarness`'s two mock subprocess QUEUES | *"arm two queues in FIFO order, then trigger a live process"* is not a row. The chain has no verb for it and inventing one for a single user is the failure the specification spends its rules avoiding |
| 5 | `rate-limits.harness.ts` — `usage-ledger.json`, `rate-limits.json`, `dispatch-state.json` | a fourth domain, outside the three harnesses the conversion names. §11 Q7-9 recommends it as the SECOND candidate for a sixth ingredient |
| 6 | `gitWorktreeFixtureHarness` — real `git init`, `worktree add`, branches, commits | recurs across THREE of the sixteen integration targets. §11 Q7-9 recommends it as the FIRST candidate for a sixth ingredient, in a later chunk |
| 9 | `mcp-server-flow.integration.test.ts` — nothing persisted at all | no `write` or `api` route has anything to produce. Not a conversion target; the census counts it and should not |
| 2 | a row the LIVE APPLICATION minted, reached by a bare id | the chain has no verb. Named in Part 5 under *"Every chainable, with an example"* already; chunk 7 does not close it |

---

## 3. The ingredients

**Five.** `guild`, `quest`, `session` absorb almost the whole conversion; `operation` is required by the
specification's own worked example; `subagent` is required by the `from:` link the specification
itself writes out. §11 Q7-1 says why `workItem` is NOT one, which is the decision chunks 9 and 10 feel
most.

### 3.0 — the shared floor

**`brokers/hydration/create/recipes-hydration-create-broker.ts`**

| | |
|---|---|
| export | `recipesHydrationCreateBroker` — the object `createHydration<DmTarget>()` returns, destructured by every file below as `{ ingredient, registry, run }` |
| PURPOSE | Instantiates the framework once for THIS repo's target. Reach for this over calling `createHydration` again anywhere else — a second instantiation makes a second registry, and a `links.of` resolved against the wrong one fails at `registry()` with a message about a name that is right there. |
| depends on | `@dungeonmaster/hydration/brokers`, `contracts/dm-target` |
| its test asserts | `typeof recipesHydrationCreateBroker.ingredient === 'function'` is NOT the assertion. It asserts the object's complete key set with `toStrictEqual` against `{ ingredient: expect.any(Function), registry: expect.any(Function), run: expect.any(Function) }` — `expect.any(Function)` being the one exemption the testing rules allow |
| delivers | *"a repo now instantiates the framework once — `createHydration<SqlTarget>()` — and the framework names neither files nor SQL"* |

**`contracts/dm-target/dm-target-contract.ts`**

| | |
|---|---|
| export | `dmTargetContract`, and `type DmTarget` |
| PURPOSE | This repo's own target: where dungeonmaster's state goes, where CLAUDE's transcripts go, and how an `api` route reaches the server. Reach for `claudeHome` rather than `os.homedir()` anywhere a session file is written — `claudePathSlugEncoderTransformer` resolves against whatever home it is handed, and a route that reads the real one writes a transcript into the developer's own `~/.claude` during a `npm run ward`. |
| shape | `{ home: AbsoluteFilePath; claudeHome: AbsoluteFilePath; baseUrl?: Url; request?: HttpRequestFn }`, with a `zod.refine` rejecting `request` present while `baseUrl` is absent |
| depends on | `zod`, `@dungeonmaster/shared/contracts` |
| its test asserts | `dmTargetContract.parse({ home: '/tmp/a', claudeHome: '/tmp/a' })` → `toStrictEqual({ home: '/tmp/a', claudeHome: '/tmp/a' })` · a relative `home` throws `/Path must be absolute/u` · `{ home, claudeHome, request: fn }` with no `baseUrl` throws `/a request function needs a baseUrl/u` |
| delivers | *"the framework names neither files nor SQL, and a repo instantiates it once with its own TARGET type"* |

**`claudeHome` is the evidence-driven half of that contract.** `packages/web/test/harnesses/session/session.harness.ts:256` reads `os.homedir()`, and `packages/web/playwright.config.ts:34` sets `process.env.HOME = TEST_HOME` to make that safe. **Nothing sets `HOME` for a Jest run**, so an ingredient that copied the harness would write into the developer's real home. The target carries it instead.

**The two adapters**

| Path | Export | PURPOSE | Test asserts |
|---|---|---|---|
| `adapters/http/request/dm-http-request-adapter.ts` | `dmHttpRequestAdapter` | Sends one request to the app under test, through `target.request` when the caller supplied one and `fetch` against `target.baseUrl` otherwise. Reach for this rather than `fetch` directly in a route: it is the seam that lets an ingredient test drive the real handler in process without a port. | a target carrying `request` routes through it — `callsMatching` shows exactly one call with `{ method: 'POST', path: '/api/guilds' }` and `fetch` was called `toHaveBeenCalledTimes(0)` |
| `adapters/jsonl/append/dm-jsonl-append-adapter.ts` | `dmJsonlAppendAdapter` | Appends newline-terminated JSON lines to a file, creating the parent directory. Reach for this over `fsAppendFileAdapter` where the parent may not exist — a Claude transcript directory is named by an encoding, not by anything that has been `mkdir`ed. | writing two lines into a path whose directory does not exist produces a file whose contents are `toBe('{"a":1}\n{"a":2}\n')` |

---

### 3.1 — `guild`

| Property | Value |
|---|---|
| `name` | `'guild'` |
| `description` | `'one guild registered against a directory on disk, with its url slug derived from its name'` |
| `fields` | `guildFieldsContract` = `guildContract.pick({ name: true, path: true })` |
| `record` | `guildContract` — `@dungeonmaster/shared/contracts`, unchanged |
| `links` | none. A guild is the root |
| `transitions` | none. A guild has no lifecycle |
| `defaults` | `(index) => ({ name: \`Guild ${index + 1}\` })`. **`path` is NOT defaulted** — see below |
| `routes` | `api`, `write`, `query`, `remove` |
| `copies` | `'guildAddBroker'` |
| `extras` | none |

**`fields` is a `.pick()` off `record`, never a hand-typed shape.** `guildContract` is
`{ id, name, path, urlSlug?, createdAt }` at
`packages/shared/src/contracts/guild/guild-contract.ts:16-22`; `id`, `urlSlug` and `createdAt` are all
minted inside `guildAddBroker`, so `fields` is exactly the two the caller supplies. **There is no
`guildAddContract` in this repo** — the nearest input surface is `guildAddBodyContract` in
`packages/server`, which is the same two keys. Deriving rather than importing keeps `fields` and
`record` provably the same entity.

> *"`fields` and `record` are two different contracts, and collapsing them is a mistake. `fields` is
> what a caller may supply; `record` is what came back. A guild's id and `urlSlug` are on the record
> and not on the fields, because the server mints them — and that difference is exactly what makes
> `saveRecordAs` worth having."*

**`path` is filled by the ROUTE, not by `defaults`, and that is a finding.** `guildAddBroker` throws
on a duplicate path (`guild-add-broker.ts:28-31`), so two guilds in one plan need two paths — and a
path must be a real directory under the target's own home, because the server spawns the fake CLI
with `cwd: guildPath`. **`defaults(index)` receives only the index and cannot see the target**, so it
cannot produce one. Both routes call one shared transformer,
`transformers/guild-path-derive/guild-path-derive-transformer.ts`
(`({ target, index }) => \`${target.home}/guilds-under-test/guild-${index + 1}\``), so the two routes
cannot disagree — which the two-route comparison would otherwise catch as a diff. §11 Q7-3.

| Route | Path | Export | Calls | Test asserts |
|---|---|---|---|---|
| `write` | `brokers/guild/write/guild-write-route-broker.ts` | `guildWriteRouteBroker` | `fsMkdirAdapter` on the derived path, then `guildAddBroker({ name, path })` | the returned record's `name` is `toBe('Guild 1')`, its `urlSlug` is `toBe('guild-1')`, and `<home>/config.json` parsed back holds exactly one guild whose `path` `toBe` the derived path |
| `api` | `brokers/guild/api/guild-api-route-broker.ts` | `guildApiRouteBroker` | `dmHttpRequestAdapter` — `POST /api/guilds` with `{ name, path }` | the response status is `toBe(201)` and the parsed body's `urlSlug` is `toBe('guild-1')` |
| `query` | `brokers/guild/query/guild-query-route-broker.ts` | `guildQueryRouteBroker` | `guildListBroker` (write) or `GET /api/guilds` (api) | a home holding two guilds returns both, `toStrictEqual` on the complete two-element array of names |
| `remove` | `brokers/guild/remove/guild-remove-route-broker.ts` | `guildRemoveRouteBroker` | `guildRemoveBroker` (write) or `DELETE /api/guilds/:id` (api) | after removing the first of two, `guildQueryRouteBroker` returns exactly `['Guild 2']` |

**`remove` is where the specification's only quoted concurrency rule lands.** The route broker carries
the comment verbatim: *"Sequential deletes: concurrent DELETEs corrupt config.json (race on
read-modify-write)"* (`guild.harness.ts:35`). It needs no loop of its own — the runner is serial, which
Part 5 makes *"a requirement, not an implementation detail"* — and the comment records why nobody may
parallelise it later.

> *"In THIS repo every entity has a write route, and that was checked rather than assumed.
> `guildAddBroker` mints the id with `crypto.randomUUID()` and the slug with `nameToUrlSlugTransformer`,
> and it touches no server — so the guild ingredient declares `write` with `copies: 'guildAddBroker'`.
> **Do not write an api-only guild ingredient.**"*

---

### 3.2 — `quest`

| Property | Value |
|---|---|
| `name` | `'quest'` |
| `description` | `'one quest under a guild, at whatever status you set it to, holding whatever work items and ledger you gave it'` |
| `fields` | `questFieldsContract` = `questContract.omit({ id: true, folder: true, createdAt: true, updatedAt: true })` |
| `record` | `questContract` — `@dungeonmaster/shared/contracts`, unchanged |
| `links` | `[{ of: 'guild', as: 'guildId' }]` |
| `transitions` | `{ field: 'status', to: ['created', 'approved', 'in_progress', 'complete'], reach: questReachRouteBroker }` |
| `defaults` | `(index) => ({ title: \`Quest ${index + 1}\`, userRequest: \`seeded quest ${index + 1}\` })` |
| `routes` | `api`, `write`, `update`, `query`, `remove` |
| `copies` | `'questPersistBroker'` |
| `extras` | `corruptToLegacySchema`, `withWardResultDetail` |

**`guildId` is not a field on `questContract`, and that is deliberate.** A quest's parent is its
FOLDER — `<home>/guilds/<guildId>/quests/<folder>/quest.json`. So `questFieldsContract` `.extend`s one
key the record does not carry, `guildId: guildIdContract`, purely so `links` has somewhere to write
it. That extension is the ONE place `fields` is wider than `record`, and its own test pins the reason.

**`transitions.to` is four values and `questStatusContract` holds a dozen.** That narrowing is the
point: `blocked`, `abandoned`, `paused`, `merging`, `merged` and every spec-phase status are reached by
something other than a caller asking, so `set({ status: 'blocked' })` does not compile.
`setRaw({ status: 'blocked' })` still writes it, which is what an adversarial walk wants.

> *"**`to` being narrower is the point.** `blocked` is a real `QuestStatus` that nothing reaches by
> asking, so it is off the list and `set({ status: 'blocked' })` does not compile. Leave a value off
> whenever reaching it means something other than a caller asking."*

| Route | Path / export | Calls | Test asserts |
|---|---|---|---|
| `write` | `brokers/quest/write/quest-write-route-broker.ts` · `questWriteRouteBroker` | assemble the quest object · `questContract.parse` · `fsMkdirAdapter` on the quest folder · `questPersistBroker({ questFilePath, contents, questId })` | the quest.json parsed back `toStrictEqual`s the returned record, AND `<home>/event-outbox.jsonl` holds exactly one line whose `questId` `toBe`s the minted id — §6 |
| `api` | `brokers/quest/api/quest-api-route-broker.ts` · `questApiRouteBroker` | `POST /api/quests` with `{ guildId, title, userRequest }`, parsed through `addQuestResultContract`, then `GET /api/quests/:id` for the record | `success` is `toBe(true)` and the fetched record's `status` `toBe('created')` |
| `update` | `brokers/quest/update/quest-update-route-broker.ts` · `questUpdateRouteBroker` | `questModifyBroker` (write) or `PATCH /api/quests/:id` (api) | after `set({ title: 'renamed' })` on a row a filter matched, the reloaded record's `title` `toBe('renamed')` |
| `query` | `brokers/quest/query/quest-query-route-broker.ts` · `questQueryRouteBroker` | `questListBroker` (write) or `GET /api/guilds/:guildId/quests` (api) | a guild holding three quests returns their titles `toStrictEqual(['Quest 1','Quest 2','Quest 3'])` |
| `remove` | `brokers/quest/remove/quest-remove-route-broker.ts` · `questRemoveRouteBroker` | `questDeleteBroker` (write) or `DELETE /api/quests/:id` (api) | after removing the second of three, `questQueryRouteBroker` returns exactly `['Quest 1','Quest 3']` |
| `reach` | `brokers/quest/reach/quest-reach-route-broker.ts` · `questReachRouteBroker` | `questModifyBroker` per hop along `questHydrateStrategyStatics.walkPath` (write); `PATCH /api/quests/:id` then `POST /api/quests/:id/start` for `in_progress` (api) | walking `created → in_progress` leaves the record's `status` `toBe('in_progress')` AND its `operations` non-empty with the first item's `status` `toBe('in_progress')` — the relay really seeded |

**`reach` for `in_progress` must go through the START route, not a status write, and that is measured
in this repo already.** `packages/testing/CLAUDE.md` states it: *"Starting a quest directly at
`in_progress` via `writeQuestFile` will NOT seed the operations relay: the relay seed + status flip
happen in `orchestration-start-responder`."* A `reach` that only wrote the field would satisfy every
assertion about `status` and leave `q[0].operations.filter(…)` matching nothing — the exact silent
failure the specification's *"A transition is not free"* paragraph is about.

**The extras, each `{ args, apply }`:**

```ts
extras: {
  corruptToLegacySchema: {
    args: corruptSchemaArgsContract,          // {}
    apply: ({ target, record }) => corruptQuestSchema({ target, record }),
  },
  withWardResultDetail: {
    args: wardResultDetailArgsContract,       // { wardResultId, detail }
    apply: ({ target, record, args }) => writeWardResultDetail({ target, record, args }),
  },
}
```

**Both earn `extras` under the specification's own bar** — *"Reach for an extra only when no second
ingredient would ever want the verb"*. Nothing but a quest has a legacy quest.json schema, and nothing
but a quest has a `ward-results/` sibling directory.

`corruptToLegacySchema` exists because an ingredient cannot MAKE an invalid row: the runner parses
every route's return through `record` (chunk 4's D3), so `questContract` refuses the file
`writeUnparseableQuestFile` writes. An extra runs AFTER the create, against a record that already
parsed, and its `apply` returns nothing the runner re-parses. Its test asserts the file on disk parsed
with `questContract.safeParse` has `success` `toBe(false)` and its first issue's `path`
`toStrictEqual(['workItems', 0, 'role'])`.

---

### 3.3 — `operation`

| Property | Value |
|---|---|
| `name` | `'operation'` |
| `description` | `'one item on a quest\'s operations ledger, at whatever status you set it to'` |
| `fields` | `operationFieldsContract` = `operationItemContract.omit({ id: true }).extend({ questId: questIdContract, guildId: guildIdContract })` — the two extensions exist only so `links` has somewhere to write, exactly as `quest`'s `guildId` does |
| `record` | `operationItemContract` — `@dungeonmaster/shared/contracts`, unchanged |
| `links` | `[{ of: 'quest', as: 'questId' }, { of: 'guild', as: 'guildId' }]` |
| `transitions` | `{ field: 'status', to: ['pending', 'in_progress', 'complete'], reach: operationReachRouteBroker }` |
| `defaults` | `(index) => ({ text: \`Seeded operation ${index + 1}\`, role: 'codeweaver', status: 'pending' })` |
| `routes` | `write`, `query`, `update`, `remove`. **No `api` route** |
| `copies` | `'questOperationsUpdateBroker'` |
| `extras` | none |

**It links to BOTH `quest` and `guild`, which is what puts its accessor on `q[0]` and not on `g[0]`** —
a guild alone cannot supply a `questId`. That is the specification's own worked case, and this
ingredient is what makes it real rather than an example.

> *"So `operations` — which links to both `quest` and `guild` — appears on `q[0]` and NOT on `g[0]`,
> because a guild alone cannot supply a `questId`."*

**It has no `api` route, and that is a fact about the app, not an omission.**
`packages/orchestrator/CLAUDE.md` states it: *"`operations` — off the allowlist entirely, at every
status. No agent writes the ledger anywhere"*, and *"`questOperationsUpdateBroker` (the ONLY runtime
ledger writer)"*. So `dm.operations` in a plan makes that plan `needs a server: —` false and
`runs serverless` true; it is the ingredient that proves the ALL-not-ANY rule the other way round,
because a plan holding a guild, a quest and an operation runs serverless only if every one of the
three has a `write` route, and all three do.

| Route | Path / export | Calls | Test asserts |
|---|---|---|---|
| `write` | `brokers/operation/write/operation-write-route-broker.ts` · `operationWriteRouteBroker` | `questOperationsUpdateBroker`, appending one `operationItemContract.parse`d item | after `q[0].operations.add(2, …)`, the quest.json's `operations` `toStrictEqual` a complete two-element array with `text` `'Seeded operation 1'` and `'Seeded operation 2'` |
| `query` | `…/operation-query-route-broker.ts` | `questLoadBroker`, returning `quest.operations` filtered to the scope's quest | a filter on `{ role: 'riftcarver' }` over a quest hydrated to `in_progress` returns exactly one row |
| `update` | `…/operation-update-route-broker.ts` | `questOperationsUpdateBroker`, replacing the matched item | `filter({ where: { role: 'ward' } }).set({ text: 'noop' })` leaves that row's `text` `toBe('noop')` and every other row's text unchanged, asserted as the complete array |
| `remove` | `…/operation-remove-route-broker.ts` | `questOperationsUpdateBroker`, dropping the matched item | `filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()` leaves the ledger's complete role list `toStrictEqual(['codeweaver','ward','flowrider','siegemaster','ward'])` |

**That last row is the specification's own headline example, asserted in values:**

> *"`q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()`"*

and it is the only test in this chunk that proves *"`filter` reads live state, not the plan"* against
rows a transition minted rather than rows an `add` made.

---

### 3.4 — `session`

| Property | Value |
|---|---|
| `name` | `'session'` |
| `description` | `'one Claude transcript on disk for a guild\'s directory, holding the JSONL lines you gave it'` |
| `fields` | `sessionFieldsContract` — `{ sessionId, cwd, lines }` |
| `record` | `sessionRecordContract` — `{ sessionId, cwd, filePath, lineCount }`. **New in this package** |
| `links` | `[{ of: 'guild', as: 'cwd', from: 'path' }]` |
| `transitions` | none |
| `defaults` | `(index) => ({ sessionId: \`seed-session-${index + 1}\` })` |
| `routes` | `write`, `query`, `remove`. **No `api` route** |
| `copies` | see §11 Q7-2 — **this is the open question this ingredient raises** |
| `extras` | `withNestedChain` |

**`links: [{ of: 'guild', as: 'cwd', from: 'path' }]` is the `from:` ruling doing real work, twice
over.** The child's own field is `cwd`, not `guildId`; the parent's field it comes from is `path`, not
`id`. Without the ruling neither half is expressible, and the specification's own worked example of
`from` is a session. `claudePathSlugEncoderTransformer({ homeDir: target.claudeHome, projectPath: cwd })`
turns it into the directory.

**`cwd` rather than `guildId` is also what makes a worktree session expressible.**
`packages/orchestrator/CLAUDE.md`: *"a carved quest's transcripts are split across TWO directories"*, and
`quest.harness.ts:335-339` says the same. A caller seeding a post-carve session passes
`set({ cwd: worktreePath })`, and chunk 4's D5 — *"an explicit field beats an ancestor-derived link
value"* — is what lets it win over the guild's path.

**There is no whole-session contract in this repo**, confirmed by reading: `questSessionContract` is a
ROW on `quest.sessions[]` recording a cwd; `sessionListItemContract` is a UI list row; the six
`*-stream-line` contracts are per-LINE. So `sessionRecordContract` is written here, in this package —
the one ingredient whose `record` is not an existing contract. Its own PURPOSE line says why, and §11
Q7-2 carries the consequence for `copies:`.

| Route | Path / export | Calls | Test asserts |
|---|---|---|---|
| `write` | `brokers/session/write/session-write-route-broker.ts` · `sessionWriteRouteBroker` | `claudePathSlugEncoderTransformer`, then `dmJsonlAppendAdapter` | the file at `<claudeHome>/.claude/projects/<encoded>/seed-session-1.jsonl` read back and split on `\n` has a first line whose `JSON.parse(...).message.content` `toBe('hello')`, and `lineCount` `toBe(1)` |
| `query` | `…/session-query-route-broker.ts` | `fsReaddirAdapter` over the encoded directory | two sessions under one guild return their ids `toStrictEqual(['seed-session-1','seed-session-2'])` |
| `remove` | `…/session-remove-route-broker.ts` | `fsRmAdapter` | after removing the first, `query` returns exactly `['seed-session-2']` |

**`withNestedChain({ depth })`** is the specification's own named extra and it earns the bar: nothing
but a session has a sub-agent chain to nest. `apply` calls `subagentWriteRouteBroker` recursively,
`depth` times. Its test asserts `depth: 2` produces exactly two `subagents/agent-*.jsonl` files whose
basenames `toStrictEqual(['agent-seed-agent-1.jsonl','agent-seed-agent-1-1.jsonl'])`.

---

### 3.5 — `subagent`

| Property | Value |
|---|---|
| `name` | `'subagent'` |
| `description` | `'one sub-agent transcript beside a session, linked to the Task tool use that spawned it'` |
| `fields` | `subagentFieldsContract` — `{ agentId, toolUseId, taskDescription, taskPrompt, lines, completed, sessionId, cwd }`. The last two are the link fields |
| `record` | `subagentRecordContract` — `{ agentId, toolUseId, filePath, lineCount }`. **New in this package** |
| `links` | `[{ of: 'session', as: 'sessionId', from: 'sessionId' }, { of: 'guild', as: 'cwd', from: 'path' }]` |
| `transitions` | none |
| `defaults` | `(index) => ({ agentId: \`seed-agent-${index + 1}\`, toolUseId: \`toolu_seed${index + 1}\`, taskDescription: \`Seeded task ${index + 1}\`, completed: true })` |
| `routes` | `write`, `query`, `remove` |
| `copies` | same open question as `session` — §11 Q7-2 |
| `extras` | none |

**This is the ingredient whose write route has a rule nothing else in the chunk has, and it comes
straight off a measurement already in the repo.** `session.harness.ts:309-313` carries it verbatim:

> *"Stable per-line uuid + timestamp so the orchestrator's dedup-by-uuid stays correct when
> subscribe-quest triggers replay more than once. Real Claude CLI writes both fields on every JSONL
> line; the harness must too or the web binding sees two distinct entries per replay (different
> crypto.randomUUID() per pass) and renders duplicates."*

The `write` route derives both from the row's own identity — `uuid: \`${agentId}-${lineIndex}\`` and a
timestamp off a fixed epoch plus `lineIndex` seconds — so the determinism rule and the app's dedup
invariant are the same rule. Its test asserts the same plan run twice produces byte-identical files:
`toBe` on the two reads of the file's full contents.

**It also writes the CORRELATION pair the orchestrator's convergence needs**, which the survey does
not cover and `packages/orchestrator/CLAUDE.md` does: the main session's completion `user` line
carries `toolUseResult.agentId` alongside the content item's `tool_use_id`, *"the ONLY place where
`toolUseId` (Task's id) and `agentId` (real internal id) co-occur"*. The `write` route appends that
line to the PARENT session when `completed` is true, and omits it when false — which is what makes the
in-flight case (`createInFlightSubagentSessionFiles`, pass-1b) expressible. The test asserts the
parent file's last line's `toolUseResult.agentId` `toBe('seed-agent-1')` with `completed: true`, and
that the parent file has exactly two lines with `completed: false`.

---

## 4. The tests — three tiers, and the shared instance

### Which tier each ingredient gets, and why

> *"So ingredient tests come in three costs, not two … **Narrow a claim to the cheapest tier that is
> still honest**."*

| Ingredient | Tier | Why that tier and not a cheaper one, or a dearer one |
|---|---|---|
| `guild` | **files + a shared app** | It declares both routes, so *"An ingredient declaring both routes runs both and compares them"* is not optional. The `write` half needs a temp dir only |
| `quest` | **files + a shared app** | Same. Its transition is the sharpest case: `reach` for `in_progress` goes through the START route, which only exists on the server |
| `operation` | **files only** | No `api` route exists to compare against, because `operations` is off the modify-quest allowlist at every status. A server would prove nothing this temp dir does not |
| `session` | **files only** | Its whole claim is bytes in a directory. Nothing server-side ever mints a session id in these tests — the caller supplies it |
| `subagent` | **files only** | Same, plus the byte-identity claim, which a server cannot make truer |
| any | **browser** | **NONE. Zero browser-tier tests in this chunk** — see below |

**Zero browser-tier tests, deliberately.** The one claim that would need a page is *"a URL that renders
the nested chain"*, and the specification rules on it directly:

> *"**The practical effect is that a browser-asserted ingredient test is expensive enough to be
> deliberate.** Where a claim can be narrowed to 'this file exists with this shape', narrow it — and
> let the prelude's own `VERIFIED` run cover whether the URL then renders. The prelude is already
> proven by running, so an ingredient test that re-proves the rendering is paying twice for one fact."*

`withNestedChain`'s honest claim is *"two sub-agent transcripts exist, correlated to their Task tool
uses"*, and that is a file claim. Whether the chain then RENDERS is the prelude's, and
`packages/web/src/flows/quest-chat/chat-replay-subagent-grouping.spec.ts` already proves it. **Saying
this out loud is the deliverable** — a reviewer must not read the absence as an oversight. The one
figure that would change the answer: a real browser lane costs ~20-21s to boot
(`instance-lifecycle-statics.ts:39-41`) and boots are globally serialised behind a 120s wait ceiling,
so five ingredient tests at that tier is a suite nobody runs, which is the outcome the specification's
own cost paragraph exists to prevent.

### The shared-instance mechanism, concretely

**Part 5 assumes the `api` tier costs a 20-second instance boot. In this repo it does not, and that is
a finding.** The measurement:

| What | Cost | Evidence |
|---|---|---|
| a real siegelense lane (`dungeonmaster-web`: API + Vite + Chromium) | **~20-21s**, one boot at a time, 180s failure ceiling | `packages/siegelense/src/statics/instance-lifecycle/instance-lifecycle-statics.ts:39-41`; `driver-statics.ts:58` |
| a real API-only lane (`dungeonmaster-headless`) | still an OS process under a detached driver, still ~20s | `lane-spec-statics.ts:75-82` |
| **the server package's own Hono sub-app** | **milliseconds. No port, no process, no `serve()`** | `packages/server/src/flows/guild/guild-flow.integration.test.ts:13-15` — `const app = GuildFlow();` … `const response = await app.request('/api/guilds');` |

`serverAppHarness` builds nothing and boots nothing — its `setupTestHome` sets
`process.env.DUNGEONMASTER_HOME` to a temp dir and seeds `config.json`
(`server-app.harness.ts:173-178`). The app is an in-process object the test calls directly. **Every
byte of the real path runs: the route, the body contract, the responder, the broker, the contracts, the
filesystem.** The only thing absent is the socket.

**So the mechanism is:**

`packages/siegelense-recipes/test/harnesses/api-target/api-target.harness.ts`

```
export const apiTargetHarness = (): {
  start: () => Promise<DmTarget>;   // called from the ONE suite's beforeAll
  stop:  () => Promise<void>;       // called from its afterAll
  target: () => DmTarget;
}
```

`start()` does four things, once:

1. `installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'recipes-api' }) })` — **the property
   is `testbed.guildPath`, not `projectPath`**; the repo-root CLAUDE.md is wrong about that name and
   `install-testbed-contract.ts:17-40` is right.
2. sets `process.env.DUNGEONMASTER_HOME` to `testbed.guildPath`, saving the prior value for `stop()`.
3. builds each Hono sub-app ONCE — `GuildFlow()`, `QuestFlow()` — and keeps a prefix→app map.
4. returns a `DmTarget` carrying `home`, `claudeHome`, `baseUrl: 'http://app.in-process'` and a
   `request` function that dispatches into that map.

`stop()` restores the env var and calls `testbed.cleanup()`.

**The fake `baseUrl` is the honest part, not a cheat.** Route selection (chunk 4's D2) keys on
`baseUrl` being present, which means *"a server is reachable"*. Through `request` it is. The
`dmTargetContract` refine — `request` present requires `baseUrl` present — is what stops anyone
constructing a target that claims a server and cannot reach one.

**Sharing is per test FILE, and that is a hard constraint, not a choice.**

- There is **no jest `globalSetup` or `globalTeardown` anywhere in this repo** — the only ones are
  Playwright's, at `packages/web/playwright.config.ts:57-58`.
- Jest runs each test file in its own worker with its own module registry, and ward's integration
  branch runs `--maxWorkers=25%`.
- `DUNGEONMASTER_HOME` is process-global env, so two files sharing one home would race.

So **the two-route comparisons for `guild` and `quest` live in ONE file**, not two:
`brokers/registry/dm-registry-broker.integration.test.ts`, whose `beforeAll` calls
`apiTargetHarness().start()` once and whose `afterAll` calls `stop()`. Its `describe` blocks are per
ingredient. Each ingredient's own colocated `.integration.test.ts` keeps the `write`-route half, on a
temp dir of its own, so a broken `guildAddBroker` still fails next to the guild ingredient's diff.

**`beforeAll` is permitted here and only here**, and the cost lands where ward does not grade it:

- `jest/no-hooks` is off for `*.integration.test.ts`, `*.e2e.test.ts`, `*.e2e.ts` and `*.harness.ts`,
  and nowhere else.
- ward's `integrationTestWarnMs` is **6000ms, measured on the SLOWEST SINGLE TEST, never the sum and
  never wall time** (`slow-file-threshold-statics.ts:38`;
  `slow-file-timings-transformer.ts:6`). Jest brackets `beforeEach`/`afterEach` inside the
  `test_start..test_done` window and leaves `beforeAll` outside it — measured in this repo at 7ms
  charged from `beforeAll` against 502ms from `beforeEach`.
- **There is no slow-file allowlist to fall back on.** `slowFileThresholdStatics` exports only
  `threshold`, its own test pins that with `toStrictEqual`, and
  `slow-file-timings-transformer.ts:71-73` is a bare threshold filter with no exemption set. The
  documented `allowed` key does not exist. So the `beforeAll` shape is not a preference — it is the
  only shape that stays green.

**The precedent is real and was opened.** `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts:5-6`:
*"OPTIMIZATION: Uses a single shared server process for all tests to avoid repeated subprocess spawn +
2s startup delay per test (16 tests x 2s = 32s saved)"*, with `beforeAll`/`afterAll` at `:48-54`.

### The two-route comparison, and the volatile-field projection

> *"**An ingredient declaring both routes runs both and compares them.** … A snapshot pins the
> ingredient to a shape somebody typed; a two-route comparison pins it to what production emits and
> fails the moment they diverge."*

Each comparison runs the SAME plan twice, against two SEPARATE homes (a shared home would make
`guildAddBroker` throw on the duplicate path), and compares the records with `toStrictEqual` after one
projection:

```
const project = ({ record, volatile }) => ({
  ...record,
  ...Object.fromEntries(volatile.map((key) => [key, '<volatile>'])),
});
expect(project({ record: viaWrite.guild, volatile: GUILD_VOLATILE }))
  .toStrictEqual(project({ record: viaApi.guild, volatile: GUILD_VOLATILE }));
```

**The `volatile` list is the deliverable, not a convenience.** It is an exported const per ingredient,
and every entry on it is a value production mints that the ingredient cannot override — which is
exactly a Known-gaps row, expressed in code where it fails loudly instead of in prose where it rots. A
second test asserts the list itself with `toStrictEqual`, so shrinking it is a deliberate edit and
growing it is visible in a diff.

| Ingredient | `volatile` | Why |
|---|---|---|
| `guild` | `['id', 'createdAt', 'path']` | `guild-add-broker.ts:35` mints the id with `crypto.randomUUID()` and `:50` the timestamp with `new Date()`, with no override seam. `path` varies because `installTestbedCreateBroker` names its temp dir off `cryptoRandomBytesAdapter` |
| `quest` | `['id', 'folder', 'createdAt', 'updatedAt', 'path']` | see §5 |
| others | `[]` — asserted empty | a files-only ingredient supplies every value it writes |

**A `volatile` list that is empty where it should not be is the failure this catches**, and a list
that grows is a finding about a production override nobody added.

---

## 5. Determinism — how each ingredient stays deterministic, and where it cannot

> *"**An ingredient must not call `Date.now()`, `Math.random()` or `crypto.randomUUID()` for anything
> that reaches a screen.** With the index supplied, the only way to break determinism is to reach for
> one of those."*

**No ingredient below calls any of the three.** But every one of them calls production code that does,
and Part 5's Known gaps already names the consequence: *"Each painted value needs an override in
production, or it is an observable against the app."* Here is the answer, per minted value, read off
the code rather than assumed.

| Minted where | Line | Override seam | This chunk's answer |
|---|---|---|---|
| `guildAddBroker` mints the guild id | `guild-add-broker.ts:35` — `const id = crypto.randomUUID();` | **none** | **observable against the app.** The id does not paint: the URL carries `urlSlug`, which `nameToUrlSlugTransformer` derives purely from `name`. It reaches the screen only as a DOM attribute, so a baseline byte comparison never sees it. It is on `guild`'s `volatile` list |
| `guildAddBroker` mints `createdAt` | `guild-add-broker.ts:50` — `createdAt: new Date().toISOString(),` | **none** | **needs a production override**, and this chunk does not add one. It is on `volatile`, and §11 Q7-4 recommends the one-line change |
| `questHydrateBroker` mints the quest id | `quest-hydrate-broker.ts:53` — `blueprint.fixedQuestId ?? questIdContract.parse(crypto.randomUUID())` | **`fixedQuestId`** | **supplied.** The quest ingredient's `defaults(index)` gives a derived id in the shape the existing harnesses already hand-write — `e2e00000-0000-4000-8000-0000000000ff` at `quest.harness.ts:484`. `questIdContract` is `z.string().min(1)`, not `.uuid()`, so any stable string is legal |
| `questHydrateBroker` stamps `now` | `quest-hydrate-broker.ts:88` — `new Date().toISOString()` | **none** | on `volatile` |
| `questHydrateBroker` mints work item ids | `quest-hydrate-broker.ts:131` — `crypto.randomUUID()` | **none** | on `volatile` |
| `questOutboxAppendBroker` stamps the outbox line | `quest-outbox-append-broker.ts:31` — `timestamp: new Date().toISOString(),` | **none** | **not volatile and not a gap.** The outbox is a side channel the watcher tails; no record carries it and no walk compares it. Named here so the next reader does not add it to a list |
| `questInputServerTimestampsTransformer` REPLACES every caller timestamp | `packages/orchestrator/CLAUDE.md` — *"Every timestamp a modify-quest payload writes is REPLACED with the server's clock, and the caller's value is discarded"* | **by design, none** | **a hard limit**, and the sharpest one here: it means a sign-off's `at` and a note's `at` can never be seeded deterministically through ANY route that goes through modify-quest. §11 Q7-4 |

**The pattern the existing harnesses already found, formalised.**
`session.harness.ts:314-316` builds its timestamps off a fixed epoch —
`new Date('2026-04-29T20:00:00.000Z').getTime()` plus an offset — and its uuids off the row's own id.
`quest.harness.ts:368` does the same shape but starts from `Date.now()`, which is the one clock the
ingredient drops. **So `defaults(index)` is not inventing a convention; it is making the strictest of
the existing harnesses the only one.** `statics/seed-epoch/seed-epoch-statics.ts` holds that epoch,
and its test pins the value, so two ingredients cannot drift apart on it.

---

## 6. The write-route disagreement, decided

**Survey finding 8: two existing seeders disagree about what a quest's write route does.**
`quest.harness.ts:442-452` appends the `event-outbox.jsonl` line, commenting that it does so *"just
like questPersistBroker does in production"*. `packages/orchestrator/test/harnesses/quest-seed/quest-seed.harness.ts:26-41`
does a bare `fs.writeFileSync` and appends nothing.

### The decision

> **The quest ingredient's one `write` route goes through `questPersistBroker`, so it APPENDS the
> outbox line. `copies: 'questPersistBroker'`.**

### Why, and it is not a judgement call

**`packages/orchestrator/CLAUDE.md` makes it a package invariant, in two lines:**

> *"All 4 quest mutation brokers write through `questPersistBroker` (file write + outbox append)"*
>
> *"**NEVER call `fsWriteFileAdapter` directly for quest files — always use `questPersistBroker`**"*

So the Jest-side seeder is not an alternative behaviour to weigh against the Playwright-side one. It
is a violation of the invariant that happens to be inside a test harness. Choosing it would write the
violation into the ingredient that replaces both.

Three further reasons, in the order they matter:

1. **The cost of getting it wrong is asymmetric.** `quest.harness.ts:445-446` names the real race the
   append fixes: without it *"the reactor depends on its 3s fallback poll to notice the new
   workItem.sessionId stamp — racing the LIVE_MARKER assertion's 10s visibility timeout"*. A converted
   e2e spec that lost the append would go intermittently red, and the conversion rule — *"If a
   converted test needs a different assertion to pass, the ingredient is wrong, not the test"* — would
   point at the test rather than at this decision. The Jest-side callers install no outbox watcher, so
   what they gain is one unread file in a temp dir and one `appendFile` per quest.
2. **It is the route with no drift to have.** `questPersistBroker` is three lines —
   `fsWriteFileAdapter` to a `.tmp`, `fsRenameAdapter`, `questOutboxAppendBroker`
   (`quest-persist-broker.ts:34-36`) — and the route CALLS it rather than imitating it. The atomic
   temp-then-rename comes along for free, which the Jest seeder also lacks and which
   `serverAppHarness`'s own `makeQuestDirectoryReadOnly` comment says is load-bearing.
3. **It is what the specification's own example already says.** `copies: 'questPersistBroker'` appears
   twice in Part 5.

### What `copies:` therefore points at, and the contradiction it resolves

`copies: 'questPersistBroker'` — the broker the route calls, at
`packages/orchestrator/src/brokers/quest/persist/quest-persist-broker.ts`.

**Part 5 contradicts itself here, and this plan picks the half that survives contact with the
evidence.** Its migration section says *"the quest ingredient's `write` route IS `questHydrateBroker`"*.
It cannot be, and the reason is `questBlueprintContract`
(`packages/orchestrator/src/contracts/quest-blueprint/quest-blueprint-contract.ts:28-46`): it is a
`.pick()` of eight quest keys plus four of its own, and **it carries no `workItems` key and no `status`
key at all**. `questHydrateBroker` DERIVES work items from `targetStatus`/`skipRoles` and mints their
ids with `crypto.randomUUID()` (`:131`). Every one of the 259 `writeQuestFile` call sites supplies its
own work items with literal ids its assertions reference. A `write` route that cannot accept them
cannot serve the conversion.

**The exclusion that sentence exists to justify still stands, on its own footing.**
`quest-hydrate-broker.integration.test.ts` is not a conversion target because its `describe()` names
`questHydrateBroker` as its SUBJECT — the survey confirmed that rule holds across all five files —
not because the ingredient's route happens to be that broker. Nothing is lost.

**And `questHydrateBroker` keeps a home**: it is what `reach` calls on a `write` target to walk a quest
to `in_progress`, because it is the only in-process path that seeds the relay. That is §3.2's `reach`
row, and it is where `fixedQuestId` earns its place in §5.

**The counterpart a diagnosing agent needs**, which is the whole job of `copies:`:
`questSeedHarness`'s bare write is the behaviour the ingredient does NOT have, and
`packages/siegelense-recipes/CLAUDE.md` says so by name, so the first session to find a quest fixture
behaving differently has the diff pointed out for it.

---

## 7. The package's own rules

### It must NOT ship, and a test pins that

**It is in the field right now.** `package.json`'s `dependencies` reads
`"@dungeonmaster/siegelense-recipes": "*"`, alongside every other workspace package. That is the
violation this chunk closes.

> *"**`packages/hydration-recipes` must not appear in the root `package.json` `dependencies`.** That
> field is what ships … `dungeonmaster create-package` adds that entry automatically, so the package
> needs a colocated test pinning its absence; otherwise the next scaffold run puts it back and nothing
> says so."*

**Three edits and one test:**

| File | Edit |
|---|---|
| root `package.json` | delete the `"@dungeonmaster/siegelense-recipes": "*"` line from `dependencies`. `workspaces: ['packages/*']` keeps the symlink |
| `package-lock.json` | regenerate with `npm install`; never hand-edit |
| `packages/siegelense-recipes/package.json` | add `"private": true`; delete `publishConfig` and `files`. Belt and braces — npm refuses to publish a private package whatever anyone does to the root |

**The test extends the file the scaffold already wrote** rather than adding a new one:
`src/statics/siegelense-recipes/siegelense-recipes-statics.test.ts`.

| | |
|---|---|
| what it reads | the root `package.json`, resolved by walking UP from `__dirname` — never from `process.cwd()`. **Ward runs each package's jest with `cwd` set to the PACKAGE directory**, so a `cwd`-relative path resolves nowhere under a real ward run |
| assertion 1 | `Object.keys(rootPackageJson.dependencies)` does not hold the name — asserted as `expect(rootPackageJson.dependencies[siegelenseRecipesStatics.packageName]).toBe(undefined)` |
| assertion 2 | `ownPackageJson.private` `toBe(true)` |
| why a file read in a test is right here | the repo's own precedent is `packages/eslint-plugin`'s RuleTester suites, named `.test.ts` and running the real external system, because the SUBJECT is the external artifact. A mocked `package.json` would assert the mock |
| delivers | *"a colocated test pins its absence … otherwise the next scaffold run puts it back and nothing says so"* |

### The import fence

> *"`packages/hydration-recipes` … May import: `@dungeonmaster/hydration`, plus orchestrator, shared,
> server — whatever a state needs. **Not `web`**: it has no `main` and no `exports` and builds through
> `vite build`, so an import of it resolves to nothing at run time."*

`packages/siegelense-recipes/package.json` `dependencies` gains exactly:
`@dungeonmaster/hydration`, `@dungeonmaster/orchestrator`, `@dungeonmaster/shared`,
`@dungeonmaster/server`, `zod`; and `devDependencies` gains `@dungeonmaster/testing`.
**`@dungeonmaster/web` appears in neither**, and the CLAUDE.md entry says why in the words above so
nobody adds it to reach a harness.

### `eslint.config.js`

One entry, with its reason inline, beside the `packages/hydration/src/**` entry that already exists:

```js
// An ingredient is a factory, and a factory that reaches for a clock or a random source breaks the
// byte-identity every baseline comparison depends on. The chain supplies each row's index; that is
// the only variation an ingredient may have.
{
  files: ['packages/siegelense-recipes/src/**'],
  rules: { '@dungeonmaster/no-nondeterministic-source': 'error' },
},
```

**That rule does not exist yet.** Part 5 puts it in `@dungeonmaster/eslint-plugin`, which ships,
*"because the constraint binds every repo that writes an ingredient"* — so it is its own piece of
work, not chunk 7's. §11 Q7-7 says what chunk 7 does in the meantime.

### `CLAUDE.md`

> *"`hydration-recipes` | this repo's own states — which ingredients exist, what each one `copies:`,
> and the root-`dependencies` rule that keeps the package unpublished"*

Six headings, and each carries the measurement behind it rather than the rule alone:

1. **The five ingredients, and what each one copies** — the table from §3, one row each, with the
   `copies:` target as a path.
2. **This package is NOT in the root `package.json` `dependencies`, and a test pins it** — naming
   `dungeonmaster create-package` as the thing that puts it back.
3. **Build before a listing is honest.** *"It reads COMPILED output, which means the recipes package
   must be built before a listing is honest … it belongs in the package's own `CLAUDE.md` where a
   session editing a recipe will read it."* `npm run build --workspace=@dungeonmaster/siegelense-recipes`
   before `recipes {}` prints anything true.
4. **It may not import `web`** — and why an import would resolve to nothing at run time.
5. **A quest's `write` route appends the outbox line** — §6's decision, and the counterpart
   (`questSeedHarness`) it diverges from, so a diagnosis starts there.
6. **An ingredient never calls a clock or a random source, and the values production mints are on a
   `volatile` list** — pointing at §5's table so the next reader knows which gap is which.

### The manifest chunk 8 reads

> *"1. glob `packages/hydration-recipes/dist/index.js` 2. dynamically import it 3. read the manifest it
> exports — every recipe's `name`, `description`, input contract, and the routes its ingredients
> declare"*

`packages/siegelense-recipes/index.ts` — a root barrel, outside `src/`, exempt from colocation like
every other root barrel — exports one const, `recipesManifest`, built by mapping every recipe through
`@dungeonmaster/hydration`'s own manifest transformer. `package.json` `exports` gains a `"."` entry
mapping `source` → `./index.ts` and `import`/`require` → `./dist/index.js`.

**Its test asserts the manifest's complete shape in values** — the three recipe names
`toStrictEqual(['guild-mid-execution', 'quest-advances-one-step', 'session-with-nested-chain'])`, and
`guild-mid-execution`'s `runs` `toBe('serverless')`, which is the ALL-not-ANY rule asserted against a
plan whose ingredients all happen to be writable.

---

## 8. The recipes

Three, and each one is a worked example the specification already writes out, so none of them is
invented here.

| Path / export | `name` · `description` | `inputs` | What it proves that an ingredient test cannot |
|---|---|---|---|
| `brokers/recipe/guild-mid-execution/guild-mid-execution-recipe-broker.ts` | `guild-mid-execution` · *"one guild holding three quests, the first running with its riftcarver item dropped"* | none | composition: a guild, three quests under it, a transition on one, and a `filter(…).remove()` over rows that transition minted. Its test asserts the surviving ledger roles `toStrictEqual` a complete array, and that the other two quests' `operations` are `toStrictEqual([])` — the scope rule, which a single-quest plan cannot catch |
| `brokers/recipe/session-with-nested-chain/…` | `session-with-nested-chain` · *"one session under an existing guild, holding a nested sub-agent chain"* | `z.object({ guildId: guildIdContract })` | `under({ guildId })` — a parent the recipe did not create, supplied as a recipe INPUT. Its test asserts the written directory is the one `claudePathSlugEncoderTransformer` names for that guild's own path, not for the target's home |
| `brokers/recipe/quest-advances-one-step/…` | `quest-advances-one-step` · *"one quest one operation further along than it was"* | `z.object({ questId: questIdContract })` | the mid-batch seed case the specification's own worked batch uses. Its test asserts the ledger's `in_progress` index moved from 0 to 1 and the work item count went from 1 to 2 |

**`guild-mid-execution` is also where the `defaults(index)` claim gets asserted as a claim.** Its test
reads all three quests back and asserts their titles `toStrictEqual(['Quest 1', 'Quest 2', 'Quest 3'])`
— because *"One row makes 'the right one' and 'the first one' the same value"*, and three identical
rows would pass every other assertion in this chunk.

---

## 9. The survey's nine findings, each answered or named

**Re-read against the designs above. A finding the survey paid to discover and this plan silently
dropped would be worse than one nobody found.**

| # | Finding | Answered by |
|---|---|---|
| 1 | `extractUrlSlug` re-derives the slug with a NARROWER rule than production | **design decision.** `guild`'s `record` IS `guildContract`, which carries the real `urlSlug`. No re-derivation helper exists to drift. The method is deleted, not converted — §2 |
| 2 | Several methods mutate a row by a bare caller-supplied id, including ids the LIVE APPLICATION minted | **named as open, not closed.** §11 Q7-6. Part 5 already records it under *"Every chainable"*; chunk 7 adds the conversion consequence — `rewindQuestStatus`, `appendMainSessionLine`, `appendSubagentLine` and `subagentDurationHarness.appendNotification` stay hand-rolled and are counted as un-converted call sites |
| 3 | One logical entity spans two storage locations — `wardResults[]` on quest.json plus a sibling detail file | **design decision.** `wardResults` stays a field on `quest`'s `fields` (it is a real `questContract` key); the sibling file is a quest **extra**, `withWardResultDetail` — §3.2. §11 Q7-8 records the alternative that loses |
| 4 | `dispatchHarness` composes domain seeding with two mock PROCESS QUEUES | **named as out of scope** — §2's remainder table and §11 Q7-9 |
| 5 | `rate-limits.harness.ts` seeds three files with no guild/quest/session shape | **named as out of scope**, and as the SECOND candidate for a sixth ingredient — §11 Q7-9 |
| 6 | Git repo/worktree/branch fixtures recur across three of the sixteen Jest targets | **named as out of scope**, and as the FIRST candidate for a sixth ingredient. Three targets, one existing harness, and nothing else can seed a git ref — §11 Q7-9 |
| 7 | `writeQuestFile` hardcodes `designDecisions` and `toolingRequirements` to `[]` with no override | **answered by design, and it disappears.** `quest`'s `fields` is `questContract.omit(...)`, so it is wider than `writeQuestFile`'s parameter list by construction. `q[0].set({ designDecisions, toolingRequirements })` just works, and `questSpecReadonlyHarness.seedDesignDecisionsAndTooling` needs no ingredient because it needs to exist no longer |
| 8 | The two seeders disagree about the write route's side effects | **decided** — §6. The route goes through `questPersistBroker` and appends |
| 9 | `mcp-server-flow.integration.test.ts` seeds no row at all | **named.** Not a conversion target; the census counts it as one of the sixteen and should not. §11 Q7-9 |

**And the two claims the survey confirmed rather than refuted** — `guildAddBroker` touching no server,
and the five test classifications — are both load-bearing here and both stand: §3.1's write route
depends on the first, and §6's exclusion argument on the second.

---

## 10. Part 5 coverage check

| Part 5 heading | This chunk delivers |
|---|---|
| *"Every property on an ingredient, and what goes in it"* | all ten properties, five times over — §3 |
| *"Every ingredient carries a test, and a two-route ingredient tests its routes against each other"* | §4 — five colocated integration tests, two of them two-route comparisons |
| *"An ingredient with only one route, and what it costs"* | §3.3, §3.4, §3.5 — three write-only ingredients, and §7's manifest test asserting `runs: 'serverless'` off the ALL rule |
| *"Some claims can only be asserted in a BROWSER"* | §4 — the tier table, and the explicit zero |
| *"Three packages, and what may cross between them"* | §7 — the root-dependency removal, the test, the import fence |
| *"Routes: how an ingredient makes its state"* | §6 — the write-route decision and what `copies:` points at |
| *"Determinism is structural, not a rule to remember"* | §5 — every minted value, its seam, and this chunk's answer |
| *"Linking a child to its parent"* | §3.4, §3.5 — two links using the `from:` ruling, one of them twice |
| *"`filter` selects rows that only exist at RUN time"* | §3.3 — a filter over rows the `in_progress` transition minted |
| *"A recipe takes typed inputs"* | §8 — two of the three recipes declare `inputs` |
| *"Each package needs a `CLAUDE.md`, and these are the entries"* | §7 — six headings |
| *"How siegelense finds recipes without importing them"* | §7 — `index.ts`, the manifest, the build-first rule in CLAUDE.md |
| **NOT delivered here** | the `@dungeonmaster/eslint-plugin` rule for *"An ingredient touches STATE, never a screen"* — §11 Q7-7 |

---

## 11. Open questions — none picked silently

**Each carries a recommendation a build agent follows until someone overrules it, and says in the
commit that it did.**

### Q7-1 — are `workItem` and `operation` ingredients, or fields on `quest`?

The survey says every `writeQuestFile` call site passes `workItems` and roughly a third pass
`operations`. Part 5 says a transition *"mints operation items and work items"* and that *"`filter` and
`remove` take the extras back out"*. Both cannot be served the same way.

**Recommendation: `operation` IS an ingredient; `workItem` is NOT, and BOTH arrays stay on `quest`'s
`fields`.**

- `operation` must be one: `q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()`
  is a worked example in Part 5, `makes: … operation (varies)` is in the `recipes {}` listing, and
  rows a transition minted cannot be reached any other way.
- `workItem` must not be, and the reason is a framework limit rather than a preference. A work item's
  foreign key is `relatedDataItems: ['operations/<id>']` — a PREFIXED string inside an ARRAY. `linkSpec`
  as ruled is `{ of, as, from }`: `from` makes the SOURCE field configurable and nothing makes the
  SHAPE configurable, so the runner would write a bare id where `related-data-item-contract`'s regex
  `^(operations|wardResults|flows)/[a-z0-9-]+$` demands a prefix. **`fromSaved` does not rescue it
  either** — a `SavedRef` resolves at the top level of a field's value, and this one would have to
  resolve inside an array element.
- Keeping both arrays on `fields` is also what keeps 259 call sites a mechanical conversion: today's
  callers pass an operation and its 1:1 work item together, with matching literal ids they invented,
  and `q[0].set({ operations, workItems })` is that same data unchanged.
- **The precedence rule chunks 9 and 10 need, stated once:** `set({ operations })` writes the array
  wholesale as part of the row's create call (chunk 4's D4 fold); `q[0].operations.add(n, …)` APPENDS
  afterwards. The runner is serial and depth-first, so the order is the declaration order and nothing
  is ambiguous.

**This is a finding for Part 5**, beside *"`links` — the foreign keys, named by parent NAME"*: **a
foreign key that is a prefixed value inside an array is not expressible.** If it is wanted, the
smallest change is an optional `write` fold on `linkSpec` —
`(args: { parent, fields }) => FieldValues`, defaulting to `{ ...fields, [as]: parent[from] }` —
which lives on the ingredient where functions already live and keeps the plan printable. **Chunk 7
does not implement it.**

### Q7-2 — what does the `session` ingredient `copies:`?

`copies:` is required wherever a `write` route exists, and it names *"the production code whose output
that route imitates"*. **Nothing in this repo writes a Claude session JSONL. The Claude CLI does.**
There is no session record contract either — confirmed by reading: `questSessionContract` is a row on
a quest, `sessionListItemContract` is a UI row, and the six `*-stream-line` contracts are per-line.

**Recommendation: `copies: 'claude-mock/bin/claude'`** — the fake CLI at
`packages/web/test/harnesses/claude-mock/bin/claude`, which is the only artifact in this repo whose
job is to emit that shape, and which already *"writes a JSONL session file to
`~/.claude/projects/{encodedPath}/` (just like the real CLI would)"*. A diagnosing agent sent there
finds the thing the route is a copy of. The alternative — pointing at
`packages/shared/src/contracts/*-stream-line/` — names the shape authority but not a WRITER, and
`copies:` exists to end a hunt rather than start a different one.

**This is a finding for Part 5**, beside *"A `write` route must declare `copies:`"*: **`copies:`
presumes the imitated writer is in-repo production code, and for an artifact an external tool produces
it is not.** Two ingredients here are in that position.

### Q7-3 — `defaults(index)` cannot see the target, and a guild's `path` needs it

A guild's `path` must be a real directory under the target's home, and `guildAddBroker` throws on a
duplicate. `defaults(index)` receives only the index.

**Recommendation: the ROUTE fills it**, through one shared transformer both routes call, so the
two-route comparison cannot see a difference the derivation invented. Do not widen `defaults` —
`defaults(index)` being index-only is what makes determinism structural, and handing it the target
opens the door the lint rule closes.

**Finding for Part 5**, beside *"`defaults` — per-row values from the index"*: a field whose value must
be derived from the target is the route's, not `defaults`'.

### Q7-4 — three production mints have no override, and one is by design

`guild-add-broker.ts:35` and `:50`, and `quest-hydrate-broker.ts:88` and `:131`, have no seam.
`questInputServerTimestampsTransformer` has no seam ON PURPOSE — it exists because *"An LLM has no
reliable clock: one audited quest carried 27 sign-offs sharing a single fabricated timestamp"*.

**Recommendation: add ONE override, and accept the rest as observables.** `guildAddBroker` gaining an
optional `createdAt` is a two-line change with a clear caller, and `createdAt` paints (a quest list
sorts by recency). The two inside `questHydrateBroker` stay on `volatile` — that broker's whole job is
fabricating a hydrated quest, and threading two more overrides through it for a seeding path is more
change than the gap costs. **`questInputServerTimestampsTransformer` is not a gap at all and must not
be given a seam** — say so in the CLAUDE.md entry, or someone will read the `volatile` list and add
one.

### Q7-5 — does `siegelense-recipes` reach the server's Hono flows, and does an ingredient live in `brokers/`?

Two lint questions this plan cannot answer from reading, and both would cost five files if guessed
wrong.

1. **Can a `.harness.ts` in this package import `@dungeonmaster/server`'s `flows`?** The architecture
   says another package's `flows/` is importable only from a `flows/` file; the harness import rules
   say a harness may import *"contracts/stubs, other harnesses, test framework APIs"*. The api-target
   harness of §4 needs `GuildFlow()`.
2. **Where does an ingredient DECLARATION live?** There is no `ingredients/` folder type, and the
   value `ingredient({...})` returns is an object holding functions, not a function.

**Recommendation for (1): try the Hono sub-app first; fall back to the responders.**
`orchestrationQuestHarness` already calls `GuildAddResponder`/`QuestUserAddResponder` in process, so
the fallback is a proven shape — it costs the HTTP body contract and the status code, which the api
route's own assertions would then drop.

**Recommendation for (2): `brokers/<entity>/ingredient/<entity>-ingredient-broker.ts`.** It matches
Part 5's own map, which puts `ingredient`, `registry` and `recipe` in `brokers/`, and an ingredient
composes route brokers, which is what a broker does. Fall back to `statics/` if
`enforce-project-structure` refuses a non-function broker export.

**Both are P0-α's first job, established against a real `npm run ward -- --only lint -- <one file>`
run before P1 writes anything on top of a guess** — which is the same instruction chunk 1–3's group E
was given, for the same reason.

### Q7-6 — the four call sites that reach a row from outside the plan

`rewindQuestStatus` against a quest the server wrote, `appendMainSessionLine`, `appendSubagentLine`,
and `subagentDurationHarness.appendNotification` — whose own comment says the append happens *"mid-test,
after the chain already rendered live"*.

**Recommendation: chunk 7 closes none of them, and chunks 9 and 10 count them as un-converted rather
than working around them.** Part 5 already records the hole. What chunk 7 adds is the number: these are
the call sites `--progress` will not move, and a batch that reports zero remaining without them is
reporting wrong. If a verb is wanted later it is `attach({ id })` on a collection, and the reason it is
not free is that every other verb's row reference is one the runner minted.

### Q7-7 — the two lint rules Part 5 names, and which is chunk 7's

Part 5 wants an `@dungeonmaster/eslint-plugin` rule for *"An ingredient touches STATE, never a
screen"*, and a determinism rule over the ingredient folder.

**Recommendation: chunk 7 writes the eslint.config.js ENTRY and neither RULE.** A published-plugin rule
binds every consumer repo and is its own piece of work with its own tests; writing it inside a chunk
whose subject is five ingredients is how a rule ships without the mutation testing that proves it can
go red. **Until it exists, the determinism claim is held by the `volatile` lists of §4**, which fail
loudly and in values. Say that in the CLAUDE.md so the absence is not read as coverage — the same move
chunk 4's Q7 ruling made for `recording`.

### Q7-8 — `wardResult`: a field plus an extra, or a sixth ingredient?

Survey finding 3: the summary is an array element in quest.json and the detail is
`<questFolder>/ward-results/<id>.json`.

**Recommendation: a field plus an extra.** A `wardResult` ingredient's `write` route would have to
write TWO files for one row, and *"the ingredient-per-entity model as specified assumes one route
produces one record"*. Two call sites do not buy a framework change. **This stays a finding rather
than being resolved**, because the shape recurs: `riftcarverResults` is the same arrangement one
directory over.

### Q7-9 — the fourth, fifth and sixth domains no ingredient covers

**Recommendation: none of them is chunk 7's, and they are ranked rather than lumped.**

| Rank | Domain | Why that rank |
|---|---|---|
| 1 | git worktree / branch / commit state | THREE of the sixteen integration targets need it, one harness already does it, and it is a clean entity with a real `write` route (`git init`, `worktree add`). The strongest candidate for a sixth ingredient |
| 2 | rate-limit accounting (`usage-ledger.json`, `rate-limits.json`, `dispatch-state.json`) | three files, one harness, a real domain with real contracts. A candidate, but outside the conversion's stated scope |
| 3 | dispatch mock queues | not a row at all. *"arm two queues in FIFO order, then trigger a live process"* has no place in a model whose verbs are rows and links |
| 4 | the MCP protocol driver | persists nothing. **It should be removed from the census's sixteen**, not converted |

### Q7-10 — `recording` stays unexercised, and a session is the one that could

A session transcript is literally *"something captured from a real run"*, which is what `recording`
means, and Part 5's Known gaps says *"no ingredient in the prototype uses it, so nothing about it has
been proven"*.

**Recommendation: leave the gap open.** The existing harnesses build every line from
`@dungeonmaster/shared/contracts` stubs, which are parsed through the real stream-line contracts, so
the shape cannot drift — a recording would buy nothing today and would need a capture mechanism
nothing has. Named here so a reviewer does not read the silence as a decision, and so the next
planner knows which ingredient is the natural first user.

---

## 12. What a build agent reports back rather than working around

**Five things, and each is a finding rather than a task.**

1. **A `volatile` list that has to grow.** Every entry is a value production mints that no ingredient
   can supply. A new one means a seam closed or a broker changed — report it; do not quietly widen the
   projection.
2. **A converted assertion that has to change.** *"If a converted test needs a different assertion to
   pass, the ingredient is wrong, not the test."* That rule binds this chunk's own tests too, where
   they assert what an existing harness asserts.
3. **A route that cannot be written without a production change.** §5 names two; a third is news.
4. **An ingredient property this repo cannot fill.** `session`'s `copies:` is one already (Q7-2). A
   second one is the shape of a Part 5 change, not of a workaround.
5. **A lint rule that refuses the file layout.** Q7-5 names the two this plan could not settle by
   reading. Establish them with a real ward run and write the answer back into this document — a build
   agent that silently picks the other folder leaves the next three agents guessing.

**And the standing one:** the four chunk-4 rulings of GATE A are not on disk. A build agent that finds
them still absent when P1 starts **stops and says so** rather than writing an ingredient against
today's `hydrationRoutesContract` — every `query`, `update` and `remove` route in §3 depends on that
edit having been made once, before this chunk, exactly as chunk 4's §5 says.
