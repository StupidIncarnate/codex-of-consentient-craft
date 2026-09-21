# 20 — the four handlers, and `args`

```
GOAL      A step whose work is running code, not thinking, runs code. Committing,
          warding, carving and sweeping stop being a session's job.
AFTER     05 (the graphs name these handlers) · 13 (the four words they classify into)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## There is no handler mechanism today. Building it is most of this story

**Search the tree for one and you find nothing** — no handler registry, no `kind: 'deterministic'`, no
`handler` field. What exists is a narrower thing with a different shape, and reading it as "the same
idea, already built" is the trap:

| Today | Where |
|---|---|
| a work item whose `spawnerType` is `'command'` | `quest-advance-broker.ts:73` — `spawnerType: isCommandWorkItemRoleGuard({ role: nextOperation.role }) ? 'command' : 'agent',` |
| exactly TWO command roles, by data | `workItemRoleStatics.command` = `['ward', 'riftcarver']`, matched by `isCommandWorkItemRoleGuard` |
| two `NextStep` variants, hand-written per role | `next-step-contract.ts:29` `type: z.literal('run-ward')` and `:38` `type: z.literal('run-riftcarver')` |
| two brokers that RUN the command **and** mutate the ledger | `quest-run-ward-broker.ts`, `quest-run-riftcarver-broker.ts` |

Three things follow, and each is a decision this story makes:

1. **A third and fourth command role cannot be added the old way.** `commit` and `cleanup` are not
   roles at all under the step engine — a step's `kind` decides, not the work item's role name. Story
   24 retires `isCommandWorkItemRoleGuard` for exactly this reason.
2. **The existing brokers do FOUR jobs each**, and only the first two are a handler's: run the
   command, classify the exit, mutate the ledger, advance the relay. `questRunWardBroker` finishes on
   `questAdvanceBroker({ questId })` at `:325` and splices a spiritmender at `:311–316`. **The
   handlers this story builds do the first two jobs and nothing else** — routing is the router's
   (story 15) and the ledger write is story 22's.
3. **A handler's outcome is the `Outcome` union story 13 built.** It does not invent a word.

### BUILD — the mechanism

New folders in `packages/orchestrator/src`. Every folder is `<name>.ts` + `<name>.test.ts` + a
`.proxy.ts` where it touches I/O, per this package's own conventions.

| Path | What |
|---|---|
| `contracts/step-handler-name/step-handler-name-contract.ts` | `z.enum(['ward', 'riftcarver', 'commit', 'cleanup'])`. This is the CLOSED set — unlike a step id (story 03), a handler name names code, so an unknown one is a build error rather than a load-time one |
| `contracts/step-handler-result/step-handler-result-contract.ts` | `{ outcome: Outcome, detail: ContentText, resultRef?: RelatedDataItem }`. `detail` is what a `repair` step is handed; `resultRef` is the `wardResults/<id>` / `riftcarverResults/<id>` back-link the execution panel resolves a row's detail through |
| `brokers/step-handler/run/step-handler-run-broker.ts` | THE ENTRY POINT. `{ handler, args, questId, workItemId, onLine } → Promise<StepHandlerResult>` |
| `brokers/step-handler/ward/step-handler-ward-broker.ts` | one per handler, same signature minus `handler` |
| `brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts` | |
| `brokers/step-handler/commit/step-handler-commit-broker.ts` | |
| `brokers/step-handler/cleanup/step-handler-cleanup-broker.ts` | |
| `adapters/git/add-all/git-add-all-adapter.ts` | `git add -A`. No adapter for this exists; `adapters/git/` holds `branch-delete`, `checkout`, `current-branch`, `diff-files`, `head-sha`, `push`, `untracked-files`, `upstream-sha`, `verify-ref`, `worktree-add`, `worktree-prune`, `worktree-remove` and nothing else |
| `adapters/git/commit/git-commit-adapter.ts` | `git commit -m <message>`, plus `--allow-empty`. Reports the exit code, never throws — the same shape `gitPushAdapter` already sets |

**`stepHandlerRunBroker` dispatches through a TABLE, not a switch**, and the table carries
`satisfies Record<StepHandlerName, StepHandler>`. That is the same mechanism
`agentNameToPromptTransformer` uses for prompts: a handler named in story 05's `agentFlowStatics`
with no implementation behind it fails the build, rather than throwing on the one quest that reaches
that step.

**`onLine` is REQUIRED on every one of the five signatures.** Not a preference — `packages/shared/CLAUDE.md`
§ "Streaming Adapters: the output callback is REQUIRED, never optional" states why, and names the
regression: ward ran for minutes with a dead panel in both dispatch modes because the callback was
optional and nobody reviewed an argument that was not there. A deterministic step has no `sessionId`,
so no JSONL watcher can tail it and this callback is the only route its output has to a UI. Route
every emit through `commandChatOutputEmitTransformer` — the one construction all four existing emit
sites share — with the **work item id as the `processId`**, because that is the key the execution
panel's `workItemEntries` lookup groups rows by.

### How the router invokes one

The router (story 15) is pure: it returns a decision, it does not perform one. So the wiring is three
hops, and only the first is this story's:

```
stepHandlerRunBroker            ← this story. Runs code, returns an Outcome.
  ↑ called by the dispatch path ← story 22
  ↑ decided by the router        ← story 15
```

**Wire nothing into `nextStepContract` here.** Story 22 decides whether a deterministic step becomes a
new `NextStep` variant or subsumes the two existing ones; doing it now breaks the live path in an
additive story. Test `stepHandlerRunBroker` directly.

---

## `args: string[]` replaces `wardMode`, and it generalises

A deterministic step declares the flags its handler runs with. `['--committed', '--uncommitted']` is
the branch gate; `[]` is the full one. Three things follow that a mode enum could never give:

| | |
|---|---|
| a new ward scope is a CONFIG EDIT | `['--only', 'lint,typecheck']` as a cheap early gate needs no enum member and no broker branch |
| it generalises past ward | `riftcarver` takes `args: []` today and can take flags tomorrow |
| `wardMode` leaves the operation item too | the step carries the args, so the field the registry, the contract, advance and both splices copy around has nothing left to say |

**That third row is a CLAIM about story 24, and story 24 carries an OPEN against it.** `wardMode` is
also what tells a `wardFull` scope from a committed-ward one on the ledger today. Nothing in THIS
story depends on the field being gone — `args` works beside it — so build `args` and leave `wardMode`
where it is. Story 24's OPEN decides whether it survives.

**`args` comes off the STEP, verbatim, and the handler never rewrites it.** Today the flag list is
computed from the mode inside the broker:

```
quest-run-ward-broker.ts:139
  const args = mode === 'committed' ? ['run', '--committed'] : ['run'];
```

Note what that line also carries: `run` is ward's SUBCOMMAND, not a flag, and the step's `args` never
contains it. So the handler spawns `[...wardSubcommand, ...step.args]`, where the subcommand is the
handler's own constant. Passing `step.args` straight through with no `run` in front gives
`dungeonmaster-ward --committed`, and ward exits 1 on an unrouted subcommand deliberately
(`packages/ward/CLAUDE.md`: "A subcommand `ward-flow` does not route exits 1").

**`['--committed', '--uncommitted']` is WIDER than today's branch gate**, which passes `--committed`
alone. That is intended — it is the pair ward documents as "the whole branch" — and it is why the
gate now sees the untracked half. Do not narrow it back to match the current line.

---

## The four handlers

### `ward`

Spawns ward with the step's `args`, classifies the exit into one of the four words. Reuse what
`questRunWardBroker` already does for the parts that are not routing:

| Step | Reuse |
|---|---|
| resolve the cwd | `questCwdResolveBroker({ questId })` — `questRunWardBroker.ts:89`. A `missing-worktree` resolution throws; that is a `wall` at the handler boundary, not a ward verdict |
| spawn | `childProcessSpawnStreamLinesAdapter({ command: process.env.WARD_CLI_PATH ?? 'dungeonmaster-ward', args, cwd, onLine })` — `:141` |
| find the run id | `wardOutputToRunIdTransformer({ output })` — returns `FileName \| null` |
| persist the detail blob | `wardDetailBroker({ startPath, runId })` then the `ward-results/<id>.json` write at `:156–168`, and the `wardResults` ref append at `:171–184` |

**Do NOT reuse `:198–320`** — the `questOperationsUpdateBroker` block. Terminal work-item status, the
operation-item completion, the spiritmender splice and the `questAdvanceBroker` call at `:325` are all
routing, and the router owns routing now.

**The classification, and every value in it is real:**

| Exit | `wardExitCodeStatics.exitCodes` | Extra condition | Word |
|---|---|---|---|
| 0 | `pass` | `wardOutputToRunIdTransformer` returned a run id | `done` |
| 0 | `pass` | it returned **`null`** | `empty` |
| 1 | `failing` | — | `unmet` |
| 2 | `crash` | — | see the OPEN below |

**A 0-file scope is `empty`, not green, and `runId === null` is how you tell.** `commandRunBroker`
prints `fileScopeEmptyStatics.message` — *"ward: the file scope resolved to 0 source files, so NO
checks ran … This is an EMPTY run, not a green one."* — and **returns before any check runs, saving no
result**, so no `run: <id>` line is ever printed and the transformer's regex finds nothing. That is a
machine-readable signal; do not string-match the message.

**Exit 1 with a run id is `unmet`, not `wall`.** A deterministic step exits green, red or empty; only
the `repair` step it routes to can wall.

**OPEN — exit code 2 (`crash`) has no word, and nobody has decided which.** Ward could not run a
check at all, so there is no failing file for a spiritmender. Today `questRunWardBroker` blocks the
quest on the spot (`blockedOnWardCrash.value = true` at `:252`, then `questBlockOnFailureBroker` at
`:323`). Under story 05's config the `ward` step declares `routes: { done, empty, unmet }` and **no
`wall` route**, so classifying a crash `wall` routes nowhere, and classifying it `unmet` dispatches a
spiritmender at a ward that never graded a line. **The plan author decides**: either add
`wall: '@blocked'` to `CLOSE_OUT.ward` and `wardFull.gate` in story 05, or state that a crash is
`unmet`. Do not pick one silently.

### `commit`

**And it PUSHES.** Today each reviewer ends on a bare `git push`; deleting the reviewer's git takes
that with it, leaving every commit after the carve local and
`get-blight-checklist({ scope: 'unpushed' })` reading `@{upstream}..HEAD` as the whole branch forever.
So: commit, then push — **bare, no `-u`**.

**The `-u` is already spent at carve time, and here is the proof:**

```
quest-run-riftcarver-broker.ts:283
  const pushResult = await gitPushAdapter({ cwd: worktreePath, setUpstream: { branchName } });
```

with its own done-check either side — `gitUpstreamShaAdapter({ cwd: worktreePath })` at `:280`, and
`stream.emit('— skip push: ${branchName} already tracks an upstream —')` at `:297` when a prior
attempt already pushed. `gitPushAdapter` takes `setUpstream` as optional and its header spells the
contract out: *"Riftcarver pushes once with `setUpstream` while carving, so every later push is the
bare form and no session ever has to decide whether `-u` is needed."* The commit handler calls
`gitPushAdapter({ cwd })` with no second argument.

**It does not throw on a failed push**, by design (`git-push-adapter.ts:19`). The handler decides: a
push that fails leaves every commit in the worktree, so it is `done` with the failure in `detail` —
never a `wall` that halts a quest over a network blip. That is the same judgement riftcarver already
makes, where a failed push classifies `repairable` rather than `git-state`.

**The sequence, and every verb is an adapter call:**

1. `gitAddAllAdapter({ cwd })` — `git add -A`
2. `gitCommitAdapter({ cwd, message, allowEmpty: true })` — `--allow-empty`, because a pass that
   legitimately changed nothing still has to leave a commit for the next step to stand on
3. `gitPushAdapter({ cwd })`

**Serialize on the per-quest lock.** Run the three inside `questWithModifyLockBroker({ questId, run })`
— the same lock `questModifyBroker` and `questOperationsUpdateBroker` take. That is the whole answer to
the `index.lock` collision the design measures (twelve concurrent sub-agent commits, three landed,
nine died), and it costs one wrapper.

**A handler writes no prose, so the message is DERIVED from the work item:**

```
<family>/<step>: <the scope — package and flow, or just flow>

met       <unit-id> · <unit-id> · …
cant-meet <unit-id> — <its toSettle>
unmet     <unit-id> — <what is left>
work items: <the ids whose observations this commit covers>
```

Every field in that template is a real one:

| Template slot | Reads |
|---|---|
| `<family>/<step>` | the work item's `step` (story 02) and its family |
| the scope | the linked operation item's `text`, whose suffix is already `— package: <name> · flow: <id>`, minted by `relayTailFanOutTransformer` at `relay-tail-fan-out-transformer.ts:254` |
| `met` / `cant-meet` / `unmet` | `workItem.observations[]` (story 02), grouped by `mark` — the three values of `unitMarkContract` (story 01) |
| `<unit-id>` | `observation.unitId`. **The real shape is `<flowId>:<kind>:<localId>`** — `qa-unit-enumerate-transformer.ts` is the single enumeration, and it mints `:54` `${flowId}:terminal:${nodeId}`, `:67` `${flowId}:branch:${edgeId}`, `:81` `${flowId}:observable:${observableId}`, `:97` `${flowId}:off-map:${family}`. Note `off-map` is HYPHENATED. Build the fixture from that, not from a bare observable id |
| `<its toSettle>` | `observation.toSettle`, which story 01's refinement makes **required on `cant-meet` and refused on the other two** — so the `unmet` line carries `observation.evidence` instead, which story 01 defines as "what is left, and what this session already learned" |
| `work items:` | the ids of every work item at this step whose observations the commit covers |

Strictly more checkable than the prose it replaces — every line is a value off the record rather than a
claim a session made about itself. Where a commit covers no marks at all (a `repair`, warpgate's own
worktree commits), the subject carries the step and the body carries the work item id alone.

**`empty` is a clean tree**: every piece marked `cant-meet`, or a review-only pass. Measure it with
`gitWorkingTreeFilesBroker` (`brokers/git/working-tree-files/`), which unions `git diff HEAD
--name-only` with `git ls-files --others --exclude-standard` — a bare diff reports TRACKED paths only,
so the net-new files a worker just wrote would be invisible and a dirty tree would read as clean. It
still routes to `ward`, because the branch may be red from an earlier scope.

### `riftcarver`

Classifies its existing failure classes without loss. `worktreePrepareStepStatics` holds **seven steps
and two classes**, and the classification map is keyed by the step's own VALUE — the thing
`WorktreePrepareError` carries — so a caught error routes with no second key to translate through:

| `steps` key | value | `classifications[value]` | Becomes |
|---|---|---|---|
| `create` | `'create'` | `'git-state'` | `wall` |
| `baseBranch` | `'base_branch'` | `'git-state'` | `wall` |
| `push` | `'push'` | `'repairable'` | `unmet` |
| `nodeModules` | `locationsStatics.repoRoot.nodeModules` | `'repairable'` | `unmet` |
| `seedDist` | `'seed-dist'` | `'git-state'` | `wall` |
| `verifyLinks` | `'verify-links'` | `'git-state'` | `wall` |
| `typecheck` | `'typecheck'` | `'repairable'` | `unmet` |
| *(any step)* | — | `isPermissionDeniedErrorGuard` matched | `wall` |

**`nodeModules` is not the literal `'node_modules'` in the source** — it is
`locationsStatics.repoRoot.nodeModules`, and the map's key is a computed property
(`[locationsStatics.repoRoot.nodeModules]: 'repairable'` at `worktree-prepare-step-statics.ts:39`). A
test that enumerates literal keys misses it. Derive the table from
`Object.entries(worktreePrepareStepStatics.classifications)` instead, so a step added later has no
word and fails loudly.

**`isPermissionDeniedErrorGuard` is checked FIRST and overrides whatever class the step carries** — no
fresh session of any role talks an operator's filesystem out of saying no. That ordering exists in
`questRunRiftcarverBroker` today; keep it.

**This is the ONE deterministic step that can wall**, and mapping `git-state` to `wall` is *more*
correct than today: a git-state red genuinely is a wall, with no worktree to send a repair into.

### `cleanup`

`siegelense cleanup`, at both ends of the siegemaster graph — `sweepIn` and `sweepOut`. The first makes
the first `capacity` reading honest; the last catches what the pass leaked. They are ledger rows, so a
leak is visible rather than inferred.

**`cleanupRunBroker` takes NO arguments**, so `args` is `[]` on both steps and there is nothing to pass
through. It returns a `CleanupAnswer`:

```ts
{ reaped, portsReleased, lockReleased, assetsAged: { instances, freedMB }, leftAlone }
```

(`packages/siegelense/src/contracts/cleanup-answer/cleanup-answer-contract.ts`, `.strict()`.)

| Word | When |
|---|---|
| `done` | anything was touched — `reaped.length > 0`, `portsReleased.length > 0`, `lockReleased`, or `assetsAged.instances > 0` |
| `empty` | none of those. Nothing was stale and nothing leaked, which is the normal `sweepIn` on a clean machine |
| `wall` | the call threw |

`leftAlone` never decides the word: a live instance somebody else owns is not this pass's business.

**The orchestrator CANNOT import `@dungeonmaster/siegelense`, and it is a cycle rather than a
preference.** `packages/siegelense/package.json` lists `@dungeonmaster/cli` in `dependencies`, and
`packages/cli/package.json` lists `@dungeonmaster/orchestrator`. So `orchestrator → siegelense → cli →
orchestrator`. Two routes exist, and the CLI already uses the first:

| Route | How | Cost |
|---|---|---|
| runtime dynamic import | `require.resolve('@dungeonmaster/siegelense/startup')` then `runtimeDynamicImportAdapter({ path })`, exactly as `cli-siegelense-responder.ts:35–44` does — and note `@dungeonmaster/siegelense` is NOT in the CLI's `dependencies` either, for the same reason | resolves at runtime; an absent package is an error the caller must phrase |
| spawn the CLI | `childProcessSpawnStreamLinesAdapter` on `dungeonmaster siegelense cleanup`, which is a routed call (`siegelense-flow.ts:109`) | one process, and `onLine` is satisfied for free |

**Pick the SPAWN route for this handler**, and say so in the file header: it gives `onLine` its lines
for nothing, and the handler is already a "run a command, classify the exit" shape. Story 23 needs the
STRUCTURED answers from `capacity` and `start`, so it reaches for the dynamic-import route instead —
that split is deliberate, not an inconsistency.

---

## Why committing moved off sessions at all — three holes, one change

| | |
|---|---|
| **siege has no committer** | its reviewers are the two walkers and both are categorically forbidden to commit — `[NOTHING IS COMMITTED] … You commit nothing, ever` (`siegemaster-verifier-statics.ts:159`) and `[NO COMMIT]` (`siegemaster-stress-statics.ts:134`). The session that committed siege's pass was `siegemaster-reviewer`, which story 24 deletes |
| **codeweaver has too many** | "the reviewer commits" fixes parallel workers inside one cell and says nothing about parallel CELLS. Nine cells means nine reviewers, one worktree, one `index.lock` |
| **nothing commits after a `repair`, in any family** | including `riftcarver` and `wardFull`, which get no `CLOSE_OUT` and so declare their own `commit` step in story 05's config. Without it a spiritmender's fix reaches `@complete` uncommitted and warpgate's `git merge --squash` drops it |

**One carve-out, and it has to be written down or someone takes it away.** `warpgate` runs
`git merge --squash` plus a commit on the base branch at the repo root. It is a family with one step
and no `CLOSE_OUT`, so there is no deterministic `commit` step to collide with it, and the rule "no
session runs git" does not reach it.

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your paths>` exits 0, and:

| Assert | |
|---|---|
| the handler table `satisfies Record<StepHandlerName, StepHandler>` | delete one entry and the build fails. That is the assertion |
| each handler is invoked with the step's `args` **VERBATIM** | assert the spawned argv is `['run', '--committed', '--uncommitted']` for the branch gate and `['run']` for `args: []`. That is now the ONLY thing between a branch ward and a full one |
| a ward exit 0 whose output carries NO `run: <id>` line classifies `empty` | build the fixture from `fileScopeEmptyStatics.message` plus exit 0. Not `done` |
| a ward exit 0 WITH a `run: <id>` line classifies `done` | the pair that proves the rule is the run id and not the message |
| a ward exit 1 classifies `unmet`, and nothing classifies `wall` | |
| **each of the seven `worktreePrepareStepStatics.classifications` entries maps to its word**, derived over `Object.entries` rather than listed | a listed table goes stale the day an eighth step lands |
| a permission-denied error classifies `wall` whatever the step's own class says | drive it through the `typecheck` step, whose class is `repairable` |
| the commit message is built from the work item's observations | assert the RENDERED string, byte for byte, for a fixture with one `met`, one `cant-meet` carrying a `toSettle`, and one `unmet` |
| `commit` pushes with `gitPushAdapter({ cwd })` and no `setUpstream` | assert the adapter's argument object has no `setUpstream` key — asserting the argv would test the adapter, which already has its own test |
| a commit covering no marks still produces a valid message | the `repair` case: subject carries the step, body carries the work item id alone |
| a clean tree classifies `empty` and a tree carrying only UNTRACKED files does not | `gitWorkingTreeFilesBroker` is what makes the second true; a bare `git diff HEAD` would call it clean |
| a `cleanup` answer with every field at zero classifies `empty`, and one `reaped` entry classifies `done` | |
| every handler streams through `onLine` | assert a line reached the callback DURING the run, not that a callback was passed |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete `wardMode` from the operation item | story 24. Add `args` beside it; remove it there |
| delete or shrink `questRunWardBroker` / `questRunRiftcarverBroker` | story 22 decides what is left of them once routing moves. They stay live and green through this story |
| add a `NextStep` variant, or touch `next-step-contract.ts` | story 22 |
| wire a handler into dispatch | story 22 |
| start or kill an instance, or read `capacity` | story 23 |
| route an outcome anywhere | story 15 — this story CLASSIFIES; that one routes |
