# Recipes seeding survey — what the real callers need

> Read-only research for the ingredients the recipe book (`scrolls/seigelense/siegelense-recipes.md`,
> Part 5) is about to design. No code changed, no tests written. Every figure attributed to a scan is
> anchored to a scan of this branch on 2026-09-16 — re-run `python3 scrolls/tools/seed-census.py` (and
> the Python scans this document describes) rather than trusting a number here as inventory.

## How this was gathered

`python3 scrolls/tools/seed-census.py` for the conversion-target list and headline call-site counts;
`Read` on `packages/web/test/harnesses/{guild,quest,session,navigation,environment}/*.harness.ts` in
full; `Read` on `guild-add-broker.ts`, `quest-hydrate-broker.ts`, `name-to-url-slug-transformer.ts`,
and all 16 Jest integration conversion targets (their imports and first setup block); a `python3`
scan of every `packages/web/**/*.e2e.ts` file that extracts, per harness method, the top-level object
keys actually passed at each call site (a brace-depth walk, not a full TS parser — good enough to
tell "always" from "sometimes" from "never").

---

## 1–5: `guildHarness`

**File:** `packages/web/test/harnesses/guild/guild.harness.ts` (70 lines).

### Methods, verbatim signatures

```ts
beforeEach: () => Promise<void>;
cleanGuilds: () => Promise<void>;
createGuild: (params: { name: string; path: string }) => Promise<GuildRecord>;
extractGuildId: (params: { guild: GuildRecord }) => GuildId;
extractUrlSlug: (params: { guild: GuildRecord }) => UrlSlug;
```
(`packages/web/test/harnesses/guild/guild.harness.ts:20-26`, `GuildRecord = Record<PropertyKey, unknown>` at `:14`)

### What each creates, and by what mechanism

- **`createGuild`** — `POST /api/guilds` with `{ name, path }` (`guild.harness.ts:49-51`), parses the
  JSON body back as `GuildRecord` with no contract validation at all — the harness trusts the server's
  shape verbatim rather than parsing it through `guildContract`.
- **`cleanGuilds`** — `GET /api/guilds`, then `DELETE /api/guilds/:id` for every guild returned
  (`guild.harness.ts:27-29,31-40`). `beforeEach` is this same function (`:64`).
- **`extractGuildId`** / **`extractUrlSlug`** — pure, no I/O; they just narrow/re-derive fields off an
  already-fetched record (see Finding 1 below for `extractUrlSlug`).

On the server side, `POST /api/guilds` routes to `guildAddBroker`, which **touches no server call
itself** — see the confirm/refute section.

### Fields callers actually pass

Every `createGuild` call in the e2e tree passes exactly `{ name, path }` — nothing else exists on the
signature, and nothing else could be passed. `cleanGuilds`, `extractGuildId`, `extractUrlSlug` take no
caller-supplied fields beyond an already-held `guild` record.

### What it hands back

`createGuild`'s `GuildRecord` is untyped (`Record<PropertyKey, unknown>`), so **whatever the server
returns is what a caller can reach** — `guild.id`, `guild.urlSlug`, `guild.name`, `guild.path`,
`guild.createdAt` per `guildContract` (confirmed in `guild-add-broker.ts:45-51`, ingredient's `record`
contract candidate: `id`, `name`, `path`, `urlSlug`, `createdAt` — `id` and `urlSlug` are server-minted
and absent from `fields`).

### Cleanup and ordering

```ts
// Sequential deletes: concurrent DELETEs corrupt config.json (race on read-modify-write)
await guilds.reduce(async (prev, guild) => {
  await prev;
  await deleteGuild({ guild });
}, Promise.resolve());
```
`guild.harness.ts:35-39`. This is the rule the specification already quotes (Part 5, "sad paths"
table). **No sibling ordering rule was found in `quest.harness.ts` or `session.harness.ts`** — every
quest and session write targets its OWN file (`<questFolder>/quest.json`, `<sessionId>.jsonl`), so two
concurrent quest/session writes don't collide the way two concurrent guild deletes collide on the one
shared `config.json`. The race is specific to guild's config file, not a general property of "delete."

### What the chain cannot express

See Finding 1 (slug re-derivation) below. Otherwise `guildHarness` is the cleanest fit of the three —
five methods, all mapping onto `add` (createGuild), cleanup-is-implicit (cleanGuilds → the framework's
own teardown, not a per-recipe verb), and two field readers that a typed `record` makes unnecessary.

---

## 1–5: `questHarness`

**File:** `packages/web/test/harnesses/quest/quest.harness.ts` (732 lines).

### Methods, verbatim signatures

```ts
createQuest: (params: {
  guildId: string;
  title: string;
  userRequest: string;
}) => Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath; success: boolean }>;

writeQuestFile: (params: {
  questId: string; questFolder: string; questFilePath: string;
  title?: string; status: string; questType?: string;
  workItems: { id: string; role: string; sessionId?: string; agentId?: string; status?: string;
    spawnerType?: string; dependsOn?: string[]; relatedDataItems?: string[]; insertedBy?: string;
    createdAt?: string; completedAt?: string; attempt?: number; maxAttempts?: number;
    wardMode?: string; }[];
  steps?: { id: string; name: string }[];
  userRequest?: string; planningNotes?: PlanningNotesInput; flows?: FlowInput[];
  packagesAffected?: PackageEntryInput[]; contracts?: ContractEntryInput[];
  comments?: CommentInput[];
  wardResults?: { id: string; exitCode: number; wardMode?: string; runId?: string; createdAt?: string }[];
  operations?: { id: string; role: string; text: string; status: string; locked?: boolean;
    wardMode?: string; packageNames?: string[] }[];
  sessions?: QuestSessionInput[];
  worktreePath?: string; branchName?: string; baseBranch?: string;
}) => void;

writeUnparseableQuestFile: (params: { questId: string; questFolder: string; questFilePath: string }) => void;
writeWardResultDetail: (params: { questFilePath: string; wardResultId: string; detail: Record<PropertyKey, unknown> }) => void;
patchQuestStatus: (params: { questId: string; status: string }) => Promise<void>;
rewindQuestStatus: (params: { questFilePath: string; status: string }) => void;
questFolderExists: (params: { questFilePath: string }) => boolean;
buildQuestJson: (params: { questId, questFolder, status, workItems, operations? }) => Record<PropertyKey, unknown>;
seedInProgressWithOperations: (params: {
  questId, questFolder, questFilePath, title?, operations,
  firstWorkItemId, firstWorkItemStatus?, firstWorkItemSessionId?,
  flowriderScopeSignedOff?, worktreePath?
}) => void;
```
(`quest.harness.ts:128-236`)

### What each creates, and by what mechanism

- **`createQuest`** — `POST /api/quests` (`quest.harness.ts:247-249`), response parsed through
  `addQuestResultContract.parse` (`:250`) — the ONE questHarness method that validates the server's
  shape at all.
- **`writeQuestFile`** — a **direct `fs.writeFileSync`** of a hand-assembled quest object
  (`quest.harness.ts:350-440`), THEN an **outbox append**:
  ```ts
  // Append a quest-modified event to the outbox so the HTTP server's quest-driven
  // watcher reactor reconciles immediately, just like questPersistBroker does in
  // production.
  ```
  (`quest.harness.ts:442-452`) — this is a `write` route imitating `questPersistBroker`'s two
  effects (file write + outbox line), and its own comment says so. It is the harness's only
  `copies:`-shaped method.
- **`writeUnparseableQuestFile`** — writes a quest.json `questContract` REJECTS (`quest.harness.ts:469-495`) —
  a deliberately-invalid record, for proving one bad file doesn't take a whole guild's quest list down.
- **`writeWardResultDetail`** — writes a SIBLING file, `<questFolder>/ward-results/<wardResultId>.json`
  (`quest.harness.ts:511-516`) — see Finding 3.
- **`patchQuestStatus`** — `PATCH /api/quests/:questId` (`quest.harness.ts:526-528`) — the one method
  that walks the REAL status-transition gates, because it hits the real route.
  `writeQuestFile`/`rewindQuestStatus` both bypass every gate.
- **`rewindQuestStatus`** — reads the quest.json already on disk, rewrites ONLY `status`, preserves
  every other byte, re-appends the outbox line (`quest.harness.ts:538-554`). See Finding 2.
- **`questFolderExists`** — `fs.existsSync(dirname(questFilePath))` (`quest.harness.ts:559-560`).
- **`buildQuestJson`** — returns a quest object; **never called anywhere except its own definition**
  (confirmed via `discover({grep: 'buildQuestJson'})` — only hits are the interface, the impl, and the
  return statement). Dead code today.
- **`seedInProgressWithOperations`** — calls `writeQuestFile` internally with a synthesized single
  work item 1:1-linked to the first operation (`quest.harness.ts:696-718`) — a convenience wrapper, not
  a separate mechanism.

### Which fields callers actually pass (scanned across every `*.e2e.ts`)

- `createQuest`: **always** all three — `guildId`, `title`, `userRequest`. Nothing else exists to pass.
- `writeQuestFile`: **always** `questId`, `questFolder`, `questFilePath`, `workItems`, and (on all but
  one observed call) `status`. **Roughly a third** of calls also pass `operations`. A small minority
  pass `title` (used where the default `'E2E Quest'` isn't distinctive enough for the assertion) or
  `userRequest`. Single-digit occurrences each of `questType`, `steps`, `wardResults`, `worktreePath`,
  `flows`, `sessions`, `planningNotes`, `comments` — every one of those is a real call site, not noise,
  but each is rare enough that a `fields` contract built only from what's "common" would miss it.
- `patchQuestStatus`: **always** both `questId` and `status`.
- `rewindQuestStatus`, `writeUnparseableQuestFile`, `writeWardResultDetail`: every declared param is
  passed at every call site (small sample — 1, 3, and 2 calls respectively).
- `seedInProgressWithOperations` and `buildQuestJson`: **zero direct calls in any `*.e2e.ts` file.**
  `seedInProgressWithOperations` is called exactly once, from
  `packages/web/test/harnesses/dispatch/dispatch.harness.ts:218-229` — a harness calling a harness, not
  a spec calling a harness. `buildQuestJson` has no caller at all. Both are still real surface (the
  census's raw call-site count for `questHarness` includes call sites inside OTHER harness files, not
  only inside `*.e2e.ts`), but the evidence for what fields real specs pass through them is `dispatch.harness.ts`'s
  own call, not a spec.

### What it hands back

`createQuest`'s return is fully typed: `{ questId, questFolder, filePath, success }`
(`quest.harness.ts:132`), where `questId`/`questFolder`/`filePath` are server-minted (the POST route
mints the id and derives the folder/path) — none of them are inputs. `writeQuestFile` and its siblings
return `void` — the caller already has every id it needs from `createQuest`, since the write methods
build the on-disk quest AROUND an id the caller supplies, not one the write mints. **This is the
opposite arrangement from `guildHarness`**: a guild's `record` is minted server-side by the SAME call
that creates it; a quest's identity is minted by `createQuest`, and every subsequent `writeQuestFile`
call is really `set()`/`setRaw()` on a row whose id the ingredient's `add` already assigned.

### Cleanup

No `cleanQuests`/`cleanup` method exists on `questHarness` at all. Cleanup for quests rides on
`guildHarness.cleanGuilds` (deleting a guild recursively deletes its `quests/` folder) — there is no
independent quest-cleanup ordering rule to find.

### What the chain cannot express

Findings 2, 3, 6 below are all rooted in `questHarness`.

---

## 1–5: `sessionHarness`

**File:** `packages/web/test/harnesses/session/session.harness.ts` (1138 lines). Mechanism throughout:
**direct `fs` writes of JSONL lines** into `claudePathSlugEncoderTransformer({homeDir, projectPath: guildPath})`'s
directory (`session.harness.ts:254-258`) — never an HTTP call. Every line is built from
`@dungeonmaster/shared/contracts` stream-line stubs (`UserTextStringStreamLineStub`,
`AssistantTaskToolUseStreamLineStub`, `TaskToolResultStreamLineStub`, etc.), never raw JSON.

### Methods, verbatim signatures (20 total)

```ts
beforeEach: () => void;                       // = cleanSessionDirectory
afterEach: () => void;                        // = cleanSessionDirectory
createSessionFile: (params: { sessionId: string; userMessage: string }) => void;
createMultiEntrySessionFile: (params: { sessionId: string; lines: string[] }) => void;
createSubagentSessionFiles: (params: { sessionId, agentId, toolUseId, userMessage, mainAssistantText, subagentText }) => void;
createInFlightSubagentSessionFiles: (params: { sessionId, agentId, toolUseId, userMessage, taskDescription, taskPrompt, subagentText }) => void;
createMultiSubagentSessionFiles: (params: { sessionId, userMessage, subagents: readonly {agentId, toolUseId, taskDescription, taskPrompt, subagentText, completed: boolean}[] }) => void;
createSubagentSessionWithInternalTool: (params: { sessionId, agentId, taskToolUseId, internalToolUseId, userMessage, taskDescription, subagentToolName, subagentToolInput, subagentToolResult }) => void;
createBackgroundAgentSession: (params: { sessionId, agentId, taskToolUseId, userMessage, taskDescription, notificationSummary, notificationResult }) => void;
createNestedSubagentSessionFiles: (params: { sessionId, parentRealAgentId, nestedRealAgentId, parentToolUseId, nestedToolUseId, userMessage, parentDescription, nestedDescription, parentText, nestedText }) => void;
createSubagentTailOnly: (params: { sessionId, agentId, assistantText }) => void;
createSubagentTailMultiEntry: (params: { sessionId, agentId, lines: string[] }) => void;
appendSubagentLine: (params: { sessionId, agentId, line }) => void;
appendMainSessionLine: (params: { sessionId, line }) => void;
createSessionWithRedactedThinking: (params: { sessionId, assistantText }) => void;
cleanSessionFiles: () => void;
cleanSessionDirectory: () => void;
createSessionWithAssistantText: (params: { sessionId, text }) => void;
createAnsweredClarificationSession: (params: { sessionId }) => void;
createSessionFileForQuest: (params: { sessionId }) => void;
sessionFileExists: (params: { sessionId }) => boolean;
```
(`session.harness.ts:124-252`)

### Which fields callers actually pass

All 20 methods take EVERY declared field at EVERY observed call site — no method has an optional
field a caller sometimes omits, because the harness has no optional params at all (every field is
required on every method's signature). The `notification`/`outerNotification`/`innerNotification`
optional objects on `subagentDurationHarness` — a sibling, non-`session.harness.ts` file — are the
exception in this family; see below.

### What it hands back

Every method returns `void`. There is no `record` at all in the sense `guildHarness`/`questHarness`
have one — a caller who needs to read a session back (`sessionFileExists`) gets a boolean, never a
parsed shape. **This is the sharpest asymmetry among the three harnesses**: guild and quest each hand
back a server-minted record; session hands back nothing, because nothing server-side ever mints a
session id in these tests — the CALLER always supplies `sessionId`/`agentId`/`toolUseId` up front, as a
literal string it invented (`'e2e-subagent-duration-001'`, etc.), not as something the write returns.

### Cleanup

`cleanSessionFiles` deletes only `*.jsonl` files directly in the session dir (`session.harness.ts:1055-1065`,
swallows a missing-directory error). `cleanSessionDirectory` (`:1067-1070`) removes the whole directory
recursively — this is what `beforeEach`/`afterEach` actually use. No ordering rule — every session's
JSONL lives under its own `sessionId`-keyed path, so there is nothing to race the way `config.json`
races.

### What the chain cannot express

Finding 2 (again — `appendMainSessionLine`/`appendSubagentLine` operate on a bare id with no ancestor)
is the load-bearing one here. See also Finding 4 (`rate-limits`), which is adjacent but not a session
concern, and Findings 8/9 in the "other seeding harnesses" section below, which are built entirely on
top of `sessionHarness`.

---

## Confirm-or-refute: the two claims the specification makes

### Claim 1 — every entity in this repo has a write route; `guildAddBroker` mints the id and slug, touching no server

**CONFIRMED**, read in full at `packages/orchestrator/src/brokers/guild/add/guild-add-broker.ts`:

```ts
const { guildsPath } = await dungeonmasterHomeEnsureBroker();
const id = crypto.randomUUID();                              // guild-add-broker.ts:35
...
const urlSlug = nameToUrlSlugTransformer({ name });           // guild-add-broker.ts:43
```

The whole function (`guild-add-broker.ts:19-58`) only calls `guildConfigReadBroker`,
`dungeonmasterHomeEnsureBroker`, `fsMkdirAdapter`, `pathJoinAdapter`, `guildContract.parse`, and
`guildConfigWriteBroker` — every one of those is a local fs/config operation. **No HTTP client, no
adapter that reaches a network socket, appears anywhere in the file.** The quest ingredient's own
`copies: 'questPersistBroker'` example in the specification is the same shape one level over — see
`quest-hydrate-broker.ts:169`, `import { questPersistBroker } from '../persist/quest-persist-broker'`.

### Claim 2 — the five test-classification calls (one excluded, four ordinary targets)

**ALL FIVE CONFIRMED**, by opening each file and reading its `describe()`:

| File | `describe()` (verbatim) | Classification |
|---|---|---|
| `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.integration.test.ts:11` | `describe('questHydrateBroker', () => {` | **EXCLUDED** — subject IS `questHydrateBroker`, the broker the quest ingredient's `write` route calls |
| `packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.integration.test.ts:44,230,307` | `describe('questModifyBroker (integration — real disk, real concurrency)'` (+2 siblings, all naming `questModifyBroker`) | ordinary target — `questHydrateBroker` appears only as setup (`:63,116,175,249,326`, always `const { questId } = await questHydrateBroker(...)`) |
| `packages/orchestrator/src/brokers/quest/pause/quest-pause-broker.integration.test.ts:50` | `describe('questPauseBroker (integration — real disk, real concurrency)'` | ordinary target — same setup-only usage (`:69,145`) |
| `packages/orchestrator/src/brokers/quest/node-dispatch-loop/pre-stamp-in-progress-layer-broker.integration.test.ts:43` | `describe('preStampInProgressLayerBroker (integration — real disk, real concurrency)'` | ordinary target — setup-only (`:62`) |
| `packages/orchestrator/src/brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker.integration.test.ts:12` | `describe('smoketestClearPriorQuestsBroker', () => {` | ordinary target — setup-only, 5 separate `questHydrateBroker` calls building distinct quests to prove selective delete (`:38,43,92,138,143`) |

The specification's rule — "mentioning the broker is not the test; `describe()` naming it is" — holds
cleanly across all five: every non-excluded file's `describe()` names its OWN subject, never
`questHydrateBroker`.

---

## 7–8: The sixteen Jest integration conversion targets

The census (`python3 scrolls/tools/seed-census.py`, run 2026-09-16) lists 16 targets across 3 packages.
What each seeds, and the mechanism:

| File | Seeds (one line) | Mechanism |
|---|---|---|
| `orchestrator/.../quest-hydrate-broker.integration.test.ts` | *(excluded — see above)* | — |
| `orchestrator/.../quest-modify-broker.integration.test.ts` | a guild + a hydrated in-progress quest, then concurrent `questModifyBroker` calls against it | `guildAddBroker` + `questHydrateBroker`, direct function calls |
| `orchestrator/.../quest-pause-broker.integration.test.ts` | same guild+quest shape, then racing `questPauseBroker` calls | same |
| `orchestrator/.../pre-stamp-in-progress-layer-broker.integration.test.ts` | same guild+quest shape, racing pause vs. pre-stamp | same |
| `orchestrator/.../smoketest-clear-prior-quests-broker.integration.test.ts` | a repo-root guild + several hydrated quests tagged with different `questSource` values | `smoketestEnsureGuildBroker` + `questHydrateBroker` ×N |
| `orchestrator/.../worktree-ensure-quest-branch-broker.integration.test.ts` | a **real git repo + worktree + branches**, no guild/quest at all | `gitWorktreeFixtureHarness` (real `git init`/`worktree add`/checkout) — see Finding 6 |
| `orchestrator/.../agent-prompt-flow.integration.test.ts` | a bare quest object with one operation + one linked work item, written straight to disk | `questSeedHarness.seed({tempDir, quest: QuestStub(...)})` — raw `fs.writeFileSync`, no broker at all — see Finding 8 |
| `orchestrator/.../chat-start-flow.integration.test.ts` | a guild + quest (via in-process responders) plus flows/comments/workItems on it | `orchestrationQuestHarness.createGuildAndQuest` + `.seedFlowsAndComments` (in-process `GuildAddResponder`/`QuestUserAddResponder` calls, not HTTP) |
| `orchestrator/.../comment-batch-flow.integration.test.ts` | a guild + quest, then a flow with a node carrying an observable, then a batch of comments | same `orchestrationQuestHarness`, plus `CommentBatchFlow` itself as the thing under test |
| `orchestrator/.../quest-flow.integration.test.ts` | a guild + quest with flows/notes/signoffs for the `getSummary` verification-coverage computation | same `orchestrationQuestHarness` |
| `orchestrator/.../orchestration-start-responder.integration.test.ts` | a bare quest object at each non-startable status (raw write), plus a real git worktree for the startable case | `questSeedHarness` **and** `gitWorktreeFixtureHarness` together — see Finding 6 |
| `orchestrator/.../quest-handle-signal-back-responder.integration.test.ts` | a guild + quest plus a REAL git worktree with real commits, to prove review-coverage against actual diffs | `orchestrationQuestHarness` + `gitWorktreeFixtureHarness` — see Finding 6 |
| `server/.../design-flow.integration.test.ts` | nothing — every case asserts a 400/404 from an unseeded route | `serverAppHarness` (env-only) |
| `server/.../guild-flow.integration.test.ts` | nothing but an empty home; asserts list/404/400 shapes | `serverAppHarness` (env-only) |
| `server/.../quest-flow.integration.test.ts` | a quest with flows + two differently-anchored comments, written directly for a raw HTTP GET assertion | inline `fs`-adjacent write via test-local setup + `serverAppHarness` |
| `server/.../session-flow.integration.test.ts` | nothing — asserts the "guild not found" error shape | `serverAppHarness` (env-only) |
| `mcp/.../mcp-server-flow.integration.test.ts` | **no persisted domain state** — a real MCP stdio server subprocess is driven over JSON-RPC, with `QuestStub`/`WorkItemStub`/etc. built purely as inline tool-CALL arguments | `mcpServerHarness` (protocol driver) — see Finding 9 |

**Grouping (question 7):** ten of the sixteen reduce to "a guild plus a quest, seeded either through
`guildAddBroker`+`questHydrateBroker` directly, or through `orchestrationQuestHarness`'s in-process
responder calls, or through a raw `questSeedHarness` write" — the same shape the web `guildHarness`/
`questHarness` cover, just reached through a different vocabulary (direct broker/responder calls
instead of HTTP, matching the specification's own "four vocabularies" table). Three files
(`worktree-ensure-quest-branch-broker`, `orchestration-start-responder`, `quest-handle-signal-back-responder`)
additionally seed real git state. Four files (`design-flow`, `guild-flow`, `session-flow`, and half of
`guild-flow`'s siblings) seed nothing beyond an empty home — they are error-path tests with no
domain row to convert. One file (`mcp-server-flow`) seeds no persisted row at all.

**Which seed something the three ingredients would not cover (question 8):**

1. **Git repo/worktree/branch state** — `worktree-ensure-quest-branch-broker.integration.test.ts`,
   `orchestration-start-responder.integration.test.ts`, `quest-handle-signal-back-responder.integration.test.ts`,
   all via `packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts`
   (real `git init -b main`, `git worktree add`, branch checkout, real commits). No guild, quest, or
   session ingredient has anywhere to put "a real git ref."
2. **Repo file-tree scaffolding for packages/contracts** — `quest-modify-broker`, `quest-pause-broker`,
   `pre-stamp-in-progress-layer-broker`, and `smoketest-clear-prior-quests-broker` all call
   `orchestrationEnvironmentHarness.seedQuestRepoPackages({repoRoot, locations, sources})`
   (`packages/orchestrator/test/harnesses/orchestration-environment/orchestration-environment.harness.ts:139-167`),
   which `mkdir`s a directory per `packagesAffected[].location` and touches an empty file per
   `contracts[].source` — real files on disk that a quest's OWN fields merely point at. This is
   filesystem state the quest record references, not filesystem state a quest ingredient's `fields`/
   `record` contract could hold.
3. **MCP protocol payloads, not rows** — `mcp-server-flow.integration.test.ts` builds
   `QuestStub`/`WorkItemStub`/`OperationItemStub`/etc. as literal tool-call arguments sent over
   JSON-RPC to a live stdio server; nothing is ever written to disk by the test itself, so there is no
   record for an ingredient's `write` or `api` route to produce.

---

## Findings — what a caller does that the chain (as specified) cannot express

1. **`guildHarness.extractUrlSlug` re-derives the slug with a NARROWER rule than production, instead of
   reading `urlSlug` off the record `createGuild` already returned.**
   `guild.harness.ts:58-61`:
   ```ts
   const extractUrlSlug = ({ guild }: { guild: GuildRecord }): UrlSlug =>
     String(guild.urlSlug ?? guild.name)
       .toLowerCase()
       .replace(/\s+/gu, '-') as UrlSlug;
   ```
   only collapses WHITESPACE runs to a hyphen. Production's `nameToUrlSlugTransformer`
   (`packages/shared/src/transformers/name-to-url-slug/name-to-url-slug-transformer.ts:14-21`) collapses
   every run of non-alphanumeric characters and strips leading/trailing hyphens:
   ```ts
   const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu;
   const LEADING_TRAILING_HYPHENS_PATTERN = /^-+|-+$/gu;
   ```
   The two only agree today because every e2e guild name is plain words separated by spaces. A guild
   ingredient's `record` contract should simply expose the real `urlSlug` field (already present on
   the create response — `guild-add-broker.ts:43-51`); nothing in the chain as specified needs a
   caller-side re-derivation helper at all, and this one is a latent drift waiting for a guild name
   with punctuation in it.

2. **Several methods mutate a record by a bare, caller-supplied id/path, with no ancestor chain and no
   `saveRecordAs` behind it — including ids the LIVE APPLICATION minted, not this recipe.** Concretely:
   `quest.harness.rewindQuestStatus` (`quest.harness.ts:538-554`, reads-modifies-writes a `questFilePath`
   that may be a quest the real server wrote), `session.harness.appendMainSessionLine`/
   `appendSubagentLine` (`session.harness.ts:996-1028`, appends a line to a `sessionId`/`agentId`
   pair the caller already knows about), and `subagentDurationHarness.appendNotification`
   (`packages/web/test/harnesses/subagent-duration/subagent-duration.harness.ts:122-128`, whose own
   usage comment says the append happens "mid-test, after the chain already rendered live," i.e.
   against a session a real dispatched agent may have produced). The chain's only ways to reach a row
   are `add` (mint it here), `filter` (match rows this ingredient's target already holds), `fromSaved`
   (a name `saveRecordAs` saved earlier IN THIS PLAN), and `under` (a link supplied as a recipe INPUT).
   None of them is "here is a raw id from outside this plan entirely — set/append onto it." A caller
   that wants to keep driving a live page while appending to a session the dispatcher itself spawned
   has no verb for that today.

3. **One logical entity spans two storage locations, and no single ingredient route covers both.**
   `quest.harness.writeWardResultDetail` (`quest.harness.ts:500-517`) writes a ward result's full
   detail blob to a SIBLING file, `<questFolder>/ward-results/<wardResultId>.json` — while that SAME
   ward result's summary (`id`, `exitCode`, `createdAt`, optional `runId`/`wardMode`) is a plain array
   element inside `quest.json`'s own `wardResults[]`, written by `writeQuestFile`'s `wardResults`
   param (`quest.harness.ts:418-424`). A `wardResults` child ingredient's `write` route would need to
   write to TWO different files for one row — the ingredient-per-entity model as specified assumes one
   route produces one record.

4. **`dispatchHarness` composes domain seeding with two mock PROCESS QUEUES, not domain state.**
   `packages/web/test/harnesses/dispatch/dispatch.harness.ts:128-134` builds `claudeMockHarness` and
   `wardMockHarness` alongside `questHarness`; its `queueScript` (`:153-187`) loads a FIFO of canned
   future subprocess responses (`SimpleTextResponseStub`/`WardQueueResponseStub`, each carrying a
   monotonically-unique `sessionId`/`runId` from a module-scoped counter at `:55-59`) that a REAL,
   already-running dispatcher consumes only once `playAndDrive` fires `POST
   /api/orchestration/dispatch/play` (`:241-246`). "Seeding" here means "arm two queues in FIFO order,
   then trigger a live process" — the chain's verbs are all about rows and links between them; there
   is no verb for "the next N times something asks for a subprocess result, answer with these, in this
   order."

5. **`rate-limits.harness.ts` seeds three files with no guild/quest/session shape at all.**
   `packages/web/test/harnesses/rate-limits/rate-limits.harness.ts` writes `usage-ledger.json`
   (`:67-97`), `rate-limits.json` (`:116-120`), and clears `dispatch-state.json` (`:99-109`) directly —
   a rate-limit-accounting domain the census does not attribute to any of the three converting
   harnesses (it isn't `guildHarness`/`questHarness`/`sessionHarness` call sites at all — it is its own
   harness, outside the conversion's stated scope). If the plan is genuinely "three ingredients," this
   file's specs either keep hand-rolled fixtures forever or the plan needs a fourth ingredient nobody
   has named yet.

6. **Git repo/worktree/branch fixtures recur across three of the sixteen Jest targets and have no
   ingredient today.** `packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts`
   runs real `git init`, `git worktree add`, branch creation/checkout, and real commits — used by
   `worktree-ensure-quest-branch-broker.integration.test.ts`, `orchestration-start-responder.integration.test.ts`,
   and `quest-handle-signal-back-responder.integration.test.ts`. This is the same category of gap as
   Finding 8 in the "16 targets" section above, called out here because it recurs (three targets, not
   one) and is squarely a candidate for a fourth ingredient if the migration reaches these files.

7. **The chain has no vocabulary for a whole-record read-modify-write against fields the harness's own
   creator hardcodes to empty, so a caller reaches for `fs` directly instead.**
   `packages/web/test/harnesses/quest-spec-readonly/quest-spec-readonly.harness.ts:30-43`
   (`seedDesignDecisionsAndTooling`) exists ONLY because `writeQuestFile` hardcodes `designDecisions`
   and `toolingRequirements` to `[]` with no override params (confirmed: neither appears anywhere in
   `writeQuestFile`'s signature at `quest.harness.ts:133-183`) — so a caller who needs non-empty values
   parses the already-written `quest.json` back with `JSON.parse`, mutates two keys, and rewrites it.
   In chain terms this is exactly `q[0].set({ designDecisions, toolingRequirements })` on a row created
   earlier in the SAME recipe — the gap isn't in the chain's model, it's that `writeQuestFile`'s own
   parameter list is narrower than `questContract`, which the ingredient's `fields` contract must not
   repeat.

8. **`questSeedHarness` (Jest-side) and `quest.harness.writeQuestFile` (Playwright-side) already
   disagree about whether "write a quest" fires the production side effect the specification's own
   example commits to.** `packages/orchestrator/test/harnesses/quest-seed/quest-seed.harness.ts:26-41`
   does a bare `fs.writeFileSync` of a whole `QuestStub` — no atomic temp+rename, no
   `event-outbox.jsonl` append. `quest.harness.ts:442-452` deliberately appends that outbox line,
   commenting that it does so "just like `questPersistBroker` does in production." The specification's
   own example ingredient declares `copies: 'questPersistBroker'` for exactly this write route — which
   commits to the outbox side effect. A quest ingredient with ONE `write` route has to pick one of
   these two existing behaviors; the Jest-side callers (in-process flow/responder tests with no outbox
   watcher ever installed) may not care about the outbox line, but they would now pay its cost, and the
   Playwright-side callers that assert against a live watcher (`quest.harness.ts:445-446` names a real
   race this fixes) cannot lose it.

9. **A conversion target that seeds no row at all.** `mcp-server-flow.integration.test.ts` (see
   question 8 above) drives a live MCP subprocess with inline `Stub` objects as JSON-RPC tool-call
   arguments — there is no `write`/`api` route outcome to assert against, because nothing is ever
   persisted by the test. This is worth a planner's attention before scheduling it as a "convert this
   file" unit of work: the census counts it as one of the sixteen, but it may not need a recipe at all.
