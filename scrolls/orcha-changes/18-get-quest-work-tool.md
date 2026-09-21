# 18 — `get-quest-work`, the one startup call

```
GOAL      Every role's first tool call, returning everything that session needs to start.
          `get-qa-checklist` is replaced by it.
AFTER     02 · 07 · 09 · 10 · 11 · 12
BEFORE    25 — nineteen prompts all begin with this call and none can be written until
          its return shape is fixed
PACKAGE   @dungeonmaster/orchestrator (responder) + @dungeonmaster/mcp (tool)
MODEL     opus — the return shape is a contract on nineteen prompts
```

**After this story lands: `npm run build --workspace=@dungeonmaster/mcp` and reconnect the MCP.** This
and story 17 are the only compiled-output dependency in the whole chain.

**Story 17 carries the shared mechanics and this story does not repeat them.** Read its "Where the
responder lives, and the six hops to reach it", "Registering the NAME" and "`.claude/settings.json` is
GENERATED" sections before starting — the six files an MCP tool travels through, the ten tests that pin
the tool-name list, and the reason a permission row is never hand-edited are identical here. Only the
names change:

| | |
|---|---|
| tool name | `get-quest-work` |
| MCP layer responder | `packages/mcp/src/responders/quest/handle/get-quest-work-layer-responder.ts` |
| adapter | `packages/mcp/src/adapters/orchestrator/get-quest-work/orchestrator-get-quest-work-adapter.ts` |
| orchestrator responder | `packages/orchestrator/src/responders/quest/get-quest-work/quest-get-quest-work-responder.ts` |
| input contract | `packages/mcp/src/contracts/get-quest-work-input/`, alongside `get-qa-checklist-input/` |
| return contract | `packages/orchestrator/src/contracts/quest-work-view/quest-work-view-contract.ts` |

**This tool belongs in `TOOLS_EXEMPT_FROM_SIZE_CAP`** (`mcp-server-flow.integration.test.ts:1866`) for
both reasons at once: its input is required, and its output is the largest thing this repo serves.

---

## Why "a prompt carries IDs" forces this

`mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's prompts already run 43,000–48,000. There
is no room to inject a piece's files, facts, fences, units and surfaces into a served prompt. **Over
the ceiling the MCP layer spills the result to a file and hands the agent an error stub** — the session
then holds a path instead of its instructions, and nothing reports a failure.

So `workItemToPromptTransformer` keeps substituting ids and nothing else, and the agent fetches its own
work. **A prompt of ids cannot make its first call without this**: every step's first substantive call
needs `flowId` and `packageName`, and both live in the operation item's TEXT — the line ending
`— package: <name> · flow: <id>` (`work-item-to-prompt-transformer.ts:112-124`). "IDs only" drops that
text, so all three families are dead on their first tool call.

---

## Two call shapes

| Called with | Returns |
|---|---|
| `{ questId, operationItemId }` | the whole plan as MARKDOWN — a planner's review-before-signing read |
| `{ questId, workItemId }` | everything this session needs to start |

The input contract is `.strict()` and refuses BOTH ids in one call, with the message shaped on
`getQaChecklistInputContract`'s own `superRefine` (`get-qa-checklist-input-contract.ts:65-78`) — a
hard rejection rather than a precedence rule, because letting one win silently answers a question the
caller did not ask. It also refuses NEITHER: there is no whole-quest browse form here.

---

## The return contract

**Nothing in it is `.optional()`. Every absent value is `.nullable()` and present as `null`.**
`JSON.stringify` drops an `undefined` key entirely, so an `.optional()` field that happens to be unset
vanishes from the served text — and to a session an absent key reads as a failed fetch, which is a
`wall`. That is the whole reason the design writes `piece: null` in bold; the rule is the same for
every field, not just that one.

**Nothing is a discriminated union either.** `baseBranch` matters only to `warpgate` and the instance
manifest only on a `needsLane` step, but a return whose SHAPE changes per family means nineteen prompts
each have to know which variant they were handed, and a variant is a branch a prompt cannot test. One
shape, `null` where a family has no use for a row.

**Unit ids carry the shape story 17 spells out** — `<flowId>:<kind>:<localId>`, hyphenated `off-map`,
minted only by `qaUnitEnumerateTransformer`. Every fixture and assertion in this story uses that form;
an id that does not round-trip through that transformer is a unit nobody can join to.

**Work-item status is read through a GUARD, never compared to a literal.** `workItemStatusContract`
holds six values — `pending`, `queued`, `in_progress`, `complete`, `failed`, `skipped` — and
`rule-ban-quest-status-literals-broker.ts:34` refuses the comparison outright: *"Do not compare .status
to the work-item-status literal '{{literal}}'. Use the appropriate shared guard (e.g.,
isActiveWorkItemStatusGuard, isCompleteWorkItemStatusGuard, isTerminalWorkItemStatusGuard, etc.)"*, and
`:42` bans building an inline set or array of them too. Code that spells them cannot pass ward. Tests,
contracts, guards, statics, stubs and proxies are allowlisted, so a `.test.ts` asserting
`expect(item.status).toBe('in_progress')` is fine; production code is not.

**The guard for "a session is still live" is `!isTerminalWorkItemStatusGuard({ status })`, not
`isActiveWorkItemStatusGuard`.** `workItemStatusMetadataStatics` gives `isActive: true` to `queued` and
`in_progress` only — `pending` is `isActive: false` — so the active guard alone drops a work item the
router has minted but not yet dispatched, which is exactly the unit-claimed-by-nobody case story 12's
second qualifier exists to prevent.

### The envelope

```ts
export const questWorkViewContract = z.object({
  questId:    questIdContract,
  workItemId: questWorkItemIdContract,
  family:     agentFamilyContract,                       // story 04
  step:       stepNameContract,                          // story 02 / 03
  role:       z.enum(['planner', 'worker', 'reviewer']),  // story 05
  scope:      questWorkScopeContract,
  assignedUnits:     z.array(questWorkUnitContract).default([]),
  inScopeUnits:      z.array(questWorkUnitContract).default([]),
  flows:             z.array(questWorkFlowContract).default([]),
  walkPaths:         z.array(qaWalkPathContract).default([]),
  pathsTruncated:    z.boolean().default(false),
  piece:             questWorkPieceContract.nullable(),
  plannerNotes:      z.array(z.string().min(1).brand<'PlannerNote'>()).default([]),
  sessionNotes:      z.array(questNoteContract).default([]),
  mintingObservation: unitObservationContract.nullable(),
  recipes:           z.array(questWorkRecipeContract).default([]),
  uncommittedPaths:  z.array(repoRelativePathContract).default([]),
  committedPaths:    z.array(questWorkCommitContract).default([]),
  ward:              questWorkWardContract.nullable(),
  riftcarverLogPath: filePathContract.nullable(),
  git:               questWorkGitContract,
  instance:          questWorkInstanceContract.nullable(),
  baseline:          questWorkBaselineContract.nullable(),
  truncated:         z.array(questWorkTruncationContract).default([]),
});
```

Every row of the seventeen the design lists maps onto one of those keys. The sections below give the
sub-shapes.

`family` is the key set of story 05's `agentFlowStatics` — a closed `z.enum`, per story 02's rule that
families keep their enum while steps do not.

**Five of the leaf contracts named below do not exist and this story creates them**, in
`packages/orchestrator/src/contracts/`, each with its `.stub.ts` and `.test.ts`:

| Contract | Why it is new |
|---|---|
| `commit-sha/` | nothing in this repo has ever needed one — `gitHeadShaAdapter` returns a bare branded string local to its own use |
| `ward-check-type/` | ward's check types reach here as strings off the detail blob; see the ward OPEN below |
| `recipe-name/` | one exists at `packages/hydration-recipes/src/contracts/recipe-name/`, and the orchestrator cannot import it — its `package.json` dependencies are `@dungeonmaster/config`, `@dungeonmaster/shared` and `zod` |
| `piece-context/` · `planner-note/` | brands for two free-form strings on the piece |

`recipeIdContract` comes from story 07's plan contract. `unitIdContract`, `unitMarkContract` and
`unitObservationContract` come from story 01, `stepNameContract` and `pieceIdContract` from story 02.
Everything else already exists in `@dungeonmaster/shared/contracts`.

### `scope` — without it every family is dead on its first call

```ts
questWorkScopeContract = z.object({
  flowId:            flowIdContract.nullable(),
  packageNames:      z.array(packageNameContract).default([]),
  operationItemId:   operationItemIdContract,
  operationItemText: operationItemContract.shape.text,
})
```

`flowId` is **singular and nullable**, not the operation item's `flowIds` array. Every fan-out mints
one item per flow — codeweaver per `(package, flow)` cell, flowrider and siegemaster per flow — so an
item carries exactly one. The `null` case is real and is exactly one item: the codeweaver contracts
cell, which belongs to a package that owns a contract by `source` and tags no node anywhere. `shared`
routinely is that package. A non-nullable `flowId` drops the only session those contracts have.

### `assignedUnits` and `inScopeUnits` — the same shape, two different sets

```ts
questWorkUnitContract = z.object({
  unitId:          unitIdContract,                 // story 01
  kind:            qaChecklistKindContract,        // terminal | branch | observable | off-map
  text:            qaChecklistItemContract.shape.label,       // VERBATIM, never a paraphrase
  surface:         qaChecklistItemContract.shape.checkSurface,
  nodeId:          flowNodeIdContract.nullable(),
  edgeId:          flowEdgeIdContract.nullable(),
  observableType:  outcomeTypeContract.nullable(),
  verifyByReading: z.boolean().default(false),
  mark:            unitMarkContract.nullable(),    // story 10's CURRENT mark. null = outstanding
  evidence:        unitObservationFieldsContract.shape.evidence.nullable(),
  toSettle:        unitObservationFieldsContract.shape.toSettle.unwrap().nullable(),
  markedBy:        questWorkItemIdContract.nullable(),
  markedAt:        unitObservationFieldsContract.shape.at.nullable(),
})
```

**`unitObservationFieldsContract`, not `unitObservationContract`.** Story 01's contract ends in a
`.superRefine`, which makes it a `ZodEffects` — and in zod 3 (this repo is on `3.25.76`) a `ZodEffects`
has no `.shape`, `.omit`, `.pick` or `.extend`. Story 17 spells the same constraint out in full under
"`.omit()` does not exist on a refined contract"; the fix is the same, and it is story 01's to make:
export the bare `z.object` beside the refined one. `qaChecklistItemContract`, `questContract`,
`wardResultContract` and `questNoteContract` all carry no refinement, so `.shape` on those is fine —
`quest-reset-flow-signoffs-responder.ts:47` already reads `questNoteContract.shape.detail` exactly that
way.

`nodeId` is the antagonist's row — it fetches the baseline of the node it is attacking.
**The value already exists and nothing renders it**: `qaChecklistItemContract` carries `nodeId` and
`qaUnitEnumerateTransformer` populates it on terminals (`:56`) and observables (`:83`); only the text
renderer drops it — `qa-checklist-to-text-transformer.ts:237` returns
`` `${mark} ${String(item.id)}${type}${readCheck}\n    ${String(item.label)}${arrival}` `` and
interpolates no node. Serving it as a field costs nothing but the key.

**`inScopeUnits` is the step-scoped in-scope set from story 12, `assignedUnits` is what the router gave
this session.** They differ by construction for a `role: 'reviewer'` step, whose assignment IS the
whole in-scope set, and for a worker, whose assignment is one piece's slice of it. The in-scope gate
has no denominator without the second array, and the assigned set is by definition the wrong one —
the point is catching a unit no piece claimed.

**`assignedUnits` is built from `workItem.assignedUnitIds`, NOT from the piece.** Story 02 puts
`assignedUnitIds: z.array(unitIdContract).default([])` on the work item for exactly this reason: the
piece's own list is INTENT, and the router re-filters it at dispatch to what is still unsettled
(story 07, "`assignedUnitIds` is INTENT, and the router decides what is actually assigned"). Serving
the piece's list instead hands a session units its predecessor already settled, and the signal gate
then counts a denominator the router never assigned. Read the field.

### `surface` — one source, and it is NOT the outcome type

Take it from the built `QaChecklistItem.checkSurface` and never re-derive it.

**The trap is `qaCheckSurfaceStatics.byOutcomeType[unit.observableType]`**, which story 07's
`"surface": "<FILLED SERVER-SIDE …>"` note invites. `observableType` is `.optional()` on
`qaChecklistItemContract` and is present on the `observable` kind ALONE, so that route yields
`undefined` for terminals, labelled edges and off-map families — three of the four kinds, silently.

`qaChecklistBuildTransformer` already does this correctly and is what to reuse. It fills `checkSurface`
for all four kinds from two different halves of the same statics:

| Line | Kind | Source |
|---|---|---|
| `:88` | terminal | `qaCheckSurfaceStatics.byKind.terminal` |
| `:96` | branch | `qaCheckSurfaceStatics.byKind.branch` |
| `:104` | off-map | `qaCheckSurfaceStatics.byKind['off-map']` |
| `:120-123` | observable | `qaCheckSurfaceStatics.readCheck` when `verifyByReading`, else `byOutcomeType[observableType]` |

`qaCheckSurfaceStatics` (`packages/shared/src/statics/qa-check-surface/qa-check-surface-statics.ts`)
holds three things, and `byKind` is the one this story needs:

- `byOutcomeType` — one sentence per `outcomeTypeContract` option (twelve of them: `api-call`,
  `file-exists`, `environment`, `log-output`, `process-state`, `performance`, `ui-state`,
  `cache-state`, `db-query`, `queue-message`, `external-api`, `custom`). Its keys must stay 1:1 with
  that contract; the colocated test asserts it, so a new outcome type without a surface fails the
  build rather than shipping blank.
- `readCheck` — sits OUTSIDE `byOutcomeType` deliberately, because it is selected by an observable's
  `verifyByReading` flag rather than by its type, and every type can carry the flag.
- `byKind` — four keys, `terminal`, `branch`, `observable`, `off-map`. `observable` is the
  indirection `'the surface named by this observable type'`; the other three are the real sentences.
  `terminal` is the load-bearing one:

  > `'the end state itself — the values the flow says this terminal has, AND its side-effect surface: no orphaned row, no half-written file, the transaction rolled back, the message not silently consumed, no stuck spinner. A clean-looking error that corrupted state is still a defect'`

### `piece`, `plannerNotes` and `sessionNotes`

```ts
questWorkPieceContract = z.object({
  pieceId:         pieceIdContract,                // story 02
  step:            stepNameContract,
  context:         z.string().min(1).brand<'PieceContext'>(),
  recipeId:        recipeIdContract.nullable(),
  baselineFor:     pieceIdContract.nullable(),
  contextUnitIds:  z.array(unitIdContract).default([]),
  payload:         z.record(z.unknown()),          // the per-family typed half, story 07
})
```

`piece: null` for a planner, **explicitly**, per the rule at the top of this section.

**"Notes from previous sessions" is two different things and both are served, labelled.**

| Field | Written by | Source |
|---|---|---|
| `plannerNotes` | a PLANNER, at plan time | the piece's own `notes: ["trap: …"]` (story 07) |
| `sessionNotes` | a RUNNING SESSION | `quest.planningNotes.questNotes[]`, filtered |

Only the second is written by a session. `questNoteContract` already carries the keys that make the
filter possible — `role`, `workItemId`, `flowId?`, `unitId?`
(`packages/shared/src/contracts/quest-note/quest-note-contract.ts`) — so serve every note whose
`flowId` matches this scope's flow or whose `unitId` is in `inScopeUnits`, plus every quest-wide note
(both absent). A note NEVER closes a unit; only a mark does.

### `mintingObservation` — the mark that caused this session to exist

`unitObservationContract.nullable()` (story 01). Every fixer reads it: a siege fixer's brief quotes the
walker's measured block verbatim, and that block lives on the observation, not on the piece. `null` on
any work item the router minted from a plan batch rather than from a mark.

**Resolve it through `workItem.mintedBy`** — story 02's `mintedBy: questWorkItemIdContract.optional()`,
the field naming the work item whose `unmet` caused this session to exist. Follow it to that work
item's `observations[]` and take the entries for the units this session was assigned.

**`insertedBy` is NOT that field, and reaching for it serves the wrong record.** It means "a retry was
spliced for this failed item" — `work-items-to-quest-status-transformer.ts:74-78` reads it exactly that
way: *"A failed item is resolved once a later retry was spliced for it — i.e. some work item carries
`insertedBy === failedItem.id`."* A fixer handed the observation off an `insertedBy` link quotes a ward
red where it needed a walker's measured block.

### `recipes` — each name with the run id that proved it

```ts
questWorkRecipeContract = z.object({
  name:         recipeNameContract,
  provenRunId:  siegeRunIdContract.nullable(),   // null = recorded but unproven
})
```

A seed with no proving run is a path no walk may be sent down — an unproven recipe does not fail
loudly, it manufactures a defect that does not exist and sends a fixer hunting in working code. Serve
the `null` rather than omitting the row, so the walker can see the gap.

**OPEN — `quest.flows[].recipes[]` does not exist.** `flowContract`
(`packages/shared/src/contracts/flow/flow-contract.ts:25-33`) carries `id`, `name`, `flowType`,
`scope`, `entryPoint`, `exitPoints`, `nodes`, `edges`, `offMapSignoffs` and nothing else. Story 08
validates against that field, story 27 renders it, this story serves it, and **no story in the chain
adds it.** Somebody must add it to `flowContract` before story 08. The design author decides which
story owns that edit; this story cannot serve a field the contract has no room for.

### The git rows

```ts
questWorkGitContract = z.object({
  baseBranch:   questContract.shape.baseBranch.unwrap().nullable(),
  worktreePath: questContract.shape.worktreePath.unwrap().nullable(),
  baseRef:      questContract.shape.baseRef.unwrap().nullable(),
})

questWorkCommitContract = z.object({
  sha:     commitShaContract,
  scope:   z.string().min(1).brand<'CommitScope'>(),   // see the OPEN below
  subject: z.string().min(1).brand<'CommitSubject'>(),
  paths:   z.array(repoRelativePathContract).default([]),
})
```

`.unwrap().nullable()` rather than re-declaring the branch types is the pattern
`gitWorkingTreeFilesBroker` already uses on this same contract:
`questContract.shape.baseRef.unwrap().parse('HEAD')`
(`packages/orchestrator/src/brokers/git/working-tree-files/git-working-tree-files-broker.ts:35`).

`warpgate` is the only reader of `baseBranch` and `worktreePath`, and its prompt forbids both
alternatives outright — never probe for the default branch, never `git fetch`.

**OPEN — how `committedPaths[].scope` is keyed.** No adapter reads `git log --name-only` at all:
`packages/orchestrator/src/adapters/git/` holds `branch-delete`, `checkout`, `current-branch`,
`diff-files`, `head-sha`, `push`, `untracked-files`, `upstream-sha`, `verify-ref`, `worktree-add`,
`worktree-prune`, `worktree-remove` — and nothing else. So this story adds
`adapters/git/log-name-only/git-log-name-only-adapter.ts`, returning `{ sha, subject, paths[] }` per
commit in `<baseRef>..HEAD`. What it cannot decide is the GROUPING KEY: commits already on a branch
today carry `<role>: <what this pass made true>` subjects written by each operator's reviewer, and
story 20's `commit` handler writes `<family>/<step>: <the scope>` instead. Both are on the same branch
during the transition. The design author decides whether `scope` is parsed off the subject (and which
grammar), or read off the `work items: <ids>` body line story 20 adds.

### `ward` and `riftcarverLogPath` — `spiritmender`'s two inputs, one per graph

```ts
questWorkWardContract = z.object({
  wardResultId:      wardResultContract.shape.id,
  runId:             wardResultContract.shape.runId.unwrap().nullable(),
  blobPath:          filePathContract,        // <questFolder>/ward-results/<id>.json
  failingCheckTypes: z.array(wardCheckTypeContract).default([]),
  failingPaths:      z.array(repoRelativePathContract).default([]),
})
```

`spiritmender` reads the blob, then builds `--only <checks>` from the types. **Handed files alone it
guesses the check set.** The types come out of the blob's own structure: `checks[].checkType` where
`checks[].status === 'fail'`, and the paths from `checks[].projectResults[].errors[].filePath`. That
shape is already written down — `packages/web/src/contracts/ward-detail/ward-detail-contract.ts:66-79`
— with every nested object `.passthrough()` so unread ward fields survive validation.

`riftcarverLogPath` is `<questFolder>/riftcarver-results/<id>.log`, non-null when the failure that
minted this repair sits in the riftcarver graph. Same session, different graph — **a carve-only
failure produces no ward blob at all**, so a repair that reads only `ward` gets `null` and has nothing
to work from.

**OPEN — where the ward-detail READ contract lives.** The only copy is in `packages/web`, and the
orchestrator has none. `wardPersistResultBroker` takes the blob as an opaque `ErrorMessage` string
(`brokers/ward/persist-result/ward-persist-result-broker.ts:30`), so nothing on the write side is
typed either. Moving it to `@dungeonmaster/shared/contracts/ward-detail/` and having `web` import it is
one option; a second orchestrator-local copy is the other. The design author decides — this story
needs the shape, not a second source of truth for it.

### `instance` — on a `needsLane` step, and the router put it there

```ts
questWorkInstanceContract = z.object({
  instanceId: siegeInstanceIdContract,
  baseUrl:    z.string().min(1).brand<'InstanceBaseUrl'>().nullable(),
  apiUrl:     z.string().min(1).brand<'InstanceApiUrl'>().nullable(),
  home:       absoluteFilePathContract,
  logs:       z.object({ api: filePathContract, web: filePathContract }),
})
```

**Field names are copied verbatim from siegelense's own
`packages/siegelense/src/contracts/instance-manifest/instance-manifest-contract.ts`**, so story 23 can
record across without a rename. The orchestrator cannot import that contract — its `package.json`
dependencies are `@dungeonmaster/config`, `@dungeonmaster/shared` and `zod`, and siegelense is not
among them — so this is a deliberate restatement of the subset a walker uses.

**Keep `baseUrl` nullable.** Its own header says why: a `dungeonmaster-api` spec binds no `web` port,
so `null` means "this spec never claimed a web surface", never "the surface failed to come up" — and a
caller that only checks presence before opening it would get a URL nothing answers with nothing saying
why. Do not "fix" it to non-nullable.

`null` on every step that does not declare `needsLane: true`. The router starts the instance (story 23)
and records it; **this story serves what is recorded and starts nothing.**

### `baseline` — the antagonist's only evidence

```ts
questWorkBaselineContract = z.object({
  pieceId:    pieceIdContract,               // the happyWalk piece, from payload.baselineFor
  workItemId: questWorkItemIdContract,
  instanceId: siegeInstanceIdContract,
  runId:      siegeRunIdContract,
})
```

Resolved from the piece's `baselineFor` through story 15's phase rule: every happy piece has recorded
before the first attack is minted, so the ids exist by the time this is served. An attack is an
ABSENCE claim, and an absence is only evidence against a known-good reading taken first.

---

## The git reads move here, and the rule becomes flat

**No session runs git at all after this, read or write — except `warpgate`.**

| Read | Who wanted it | Now |
|---|---|---|
| `git diff HEAD` + untracked | both reviewers — it IS their pass | `uncommittedPaths` |
| `git log --name-only` | the codeweaver planner | `committedPaths` |
| `git log` | `spiritmender`, for context on a red | same field |
| `git status` | anyone before signalling | `uncommittedPaths` again |

**Measure `uncommittedPaths` with `gitWorkingTreeFilesBroker`** —
`packages/orchestrator/src/brokers/git/working-tree-files/git-working-tree-files-broker.ts`. It already
unions `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`, and **the union is
the whole point**: a bare diff reports TRACKED paths only, so the net-new files a worker just wrote —
the ones most likely to carry the defect — would be invisible. It also de-duplicates on first
appearance, because an intent-to-add (`git add -N`) legitimately appears in both readings.
**Reuse it. Do not write a second git call that gets it subtly wrong.**

**Resolve the cwd with `questCwdResolveBroker({ questId })`**, which is what the commit gate resolves
with today. It returns a tagged `kind`, and the branches are not interchangeable:

| `kind` | What it means | What this tool does |
|---|---|---|
| `worktree` | the quest's own worktree, and it is reachable | measure there |
| `repo-root` | the quest predates worktrees, or none was recorded | **empty list** |
| `missing-worktree` | a path was recorded and is gone | **empty list**, not a throw |
| `session` | only returned when a `sessionId` is passed | never — **do not pass one**. It answers "where did this session already run", a different question |

**A quest with no worktree yet returns an EMPTY LIST rather than an error.** A hydrated quest is a real
state, not a violation — the same rule today's commit gate already follows.

**The exception is `warpgate` and it is not a loose end.** Driving git IS its job: an intake merge, a
squash onto base, a commit. It is a one-step family with no `commit` step to collide with.

---

## The derivation brokers that SURVIVE as internals

Story 24 deletes `get-qa-checklist`; the derivation underneath it is correct and is reused whole. Read
these before writing a line, and do not move them — story 12 already depends on the same chain:

| File | What it gives you |
|---|---|
| `brokers/quest/get-qa-checklist/quest-get-qa-checklist-broker.ts` | the entry point: quest → scope → per-flow checklists. `:74-101` is the `operationItemId` branch |
| `transformers/operation-signoff-scope/operation-signoff-scope-transformer.ts` | ONE operation item → its exact scope. **It reads `signoffTrackEligibilityStatics` by TRACK today** — story 11's step-keyed statics replaces that read |
| `transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts` | the real enumerator, shared with the quest summary. One enumerator is why the ids this tool prints are the ids every other reader names |
| `transformers/qa-checklist-build/qa-checklist-build-transformer.ts` | adds `label` and `checkSurface` on top of the enumerator, and applies `qaChecklistLimitsStatics.maxPaths` (200) with `pathsTruncated` |
| `transformers/qa-units-in-package-scope/qa-units-in-package-scope-transformer.ts` | the two package narrowings |
| `transformers/qa-walk-paths/qa-walk-paths-transformer.ts` | `walkPaths`, with their force labels |

`transformers/qa-checklist-to-text/qa-checklist-to-text-transformer.ts` is **not** one of them. It
renders the old three-track checklist and reads `signoffTrackEligibilityStatics.byTrack[track].signoffField`
(`:108`); it stays live for `get-qa-checklist` until story 24 and this tool calls it never.

---

## The markdown render

`{ questId, operationItemId }` returns the plan as markdown: batches as headings, pieces as rows, each
piece's units with what the record already says about them. Two things it must show that JSON does not:

| | |
|---|---|
| **coverage** | every in-scope unit and which piece claims it. **A unit claimed by no piece is the defect a planner most needs to see, and in JSON an absence is invisible by construction** |
| **ordering** | the sequence as it will actually execute, not nested `mode` fields the reader has to simulate |

This is an existing pattern — `qa-checklist-to-text-transformer`, `blight-checklist-to-text-transformer`,
`flow-graph-to-text-transformer` and `quest-summary-build-transformer` all render structures to text for
agents. The new `work-plan-to-text-transformer` sits beside them, at
`packages/orchestrator/src/transformers/work-plan-to-text/work-plan-to-text-transformer.ts`.

**Return the markdown as raw text, not JSON-wrapped.** `QaChecklistLayerResponder` says why at
`qa-checklist-layer-responder.ts:35-37`: JSON-stringifying already-rendered text escapes every newline
and roughly doubles a payload whose whole value is being cheap enough to read.

---

## The size ceiling, and what gets cut when it bites

`mcpToolResultStatics.maxVerbatimChars` is **50,000**
(`packages/shared/src/statics/mcp-tool-result/mcp-tool-result-statics.ts:32`). Three things follow, and
all three are checkable offline:

**1. What overflow actually does.** Claude Code weighs every MCP tool result before handing it to the
model. Over `maxOutputTokens` (25,000, its `MAX_MCP_OUTPUT_TOKENS` default) the content is NOT
delivered: it is written to `<projectDir>/tool-results/<toolUseId>.json` and the agent receives an
error stub telling it to go read the file in chunks. **Nothing reports a failure.** `maxVerbatimChars`
is Claude Code's own cheap early-out (`maxOutputTokens × verbatimTokenFactor × estimatedCharsPerToken`
= `25_000 × 0.5 × 4`) expressed in characters, and it is the bound worth holding because it is
deterministic and clears the real ceiling with room for the tokenizer to disagree.

**2. Measure the SERIALIZED string, not the object.** `mcpToolResultStatics.jsonIndentSpaces` is `2`
and is in that statics for exactly this reason — "the measured length is the length AFTER
serialization: the budget and the serializer have to agree, or a size check is measuring a string the
protocol never sees." So the check is `JSON.stringify(view, null, 2).length`.

**3. The flow render alone can eat two thirds of the budget.**
`questFlowSliceLimitsStatics.maxRenderChars` is **48,000**, and its own header records the measurement
at `quest-flow-slice-limits-statics.ts:19-20`: *"MEASURED AGAINST THE LARGEST FLOW OF A REAL QUEST: 18
nodes, 19 edges, 47 observables, 12 contracts and 33 design decisions render at roughly 32,000
characters."* Add 47 units carrying verbatim text, a surface
sentence, a mark, evidence and a `toSettle` each, plus the piece and two path lists, and this return is
over the ceiling on a real quest. **Budget this before writing the render, not after.**

### The cut order, and the one thing that is never cut

A new statics, `packages/orchestrator/src/statics/quest-work-limits/quest-work-limits-statics.ts`,
holds the per-section caps. Sections are dropped in this order until the serialized string fits, and
**every cut appends an entry to `truncated[]` naming the section and the exact dropped count** —

```ts
questWorkTruncationContract = z.object({
  section: z.enum(['flows', 'committedPaths', 'sessionNotes', 'walkPaths']),
  dropped: z.number().int().nonnegative().brand<'DroppedCount'>(),
})
```

| Order | Section | Why it is safe to cut |
|---|---|---|
| 1 | `flows` | `get-quest({ questId, flowId, packageName })` serves exactly this text as its own call, so a session that loses it has a fetch it can still make. `questFlowSliceLimitsStatics`' own header states the rule: *"TRUNCATING IS SAFE. The slice is a spec READ, never a gate"* |
| 2 | `committedPaths` | context for the codeweaver planner, not a denominator |
| 3 | `sessionNotes` | a note never closes a unit |
| 4 | `walkPaths` | `pathsTruncated` already exists on the checklist for the same reason and is the flag to raise |

**`assignedUnits`, `inScopeUnits`, `piece`, `scope` and `uncommittedPaths` are NEVER cut.** The first
two are the gate's denominator — a session measuring itself against fewer units than the gate counts is
the exact failure this whole surface exists to remove. `piece` and `scope` are the brief. And
`uncommittedPaths` IS the reviewer's pass: a truncated one is a file nobody opens, and no session runs
`git status` any more to recover it.

**OPEN — the `flows` field may not belong here at all.** The design says both things: §8's endpoint
list has this tool returning "the **flows** the scope names, rendered", while §5's two-call table
(`scrolls/orchestrator-step-engine-plan.md:1529-1533`) still has the agent calling `get-quest` for its
flow. Serving both spends the same 32,000 characters twice across two budgets. The cut order above
survives either answer; whether the field ships at all is the design author's call.

---

## DONE WHEN

| Assert | |
|---|---|
| `scope` comes back with all four fields | without it every family is dead on its first call |
| `scope.flowId` is `null` — not absent, not `''` — for a contracts-only codeweaver cell | the one flow-less item, and it belongs to `shared` on this repo |
| `piece: null` EXPLICITLY for a planner | `expect('piece' in view).toBe(true)` AND `expect(view.piece).toBeNull()`. An omitted key is a `wall` |
| **an in-scope unit claimed by no piece is visible in the RENDERED TEXT** | assert on the string, not the object. This is what the render is for |
| `uncommittedPaths` includes an UNTRACKED file | the union. A fixture with only tracked changes passes against a bare diff |
| a quest whose `questCwdResolveBroker` returns `missing-worktree` gets `uncommittedPaths: []` | not a throw |
| `inScopeUnits` and `assignedUnits` are BOTH returned, and differ for a reviewer | build the reviewer fixture: a piece claims 3 of 5 in-scope units, the reviewer is assigned all 5 |
| **`assignedUnits` follows `workItem.assignedUnitIds`, not the piece** | the fixture that catches it: a piece with `assignedUnitIds: [a, b, c]` and a work item the router filtered to `[b, c]`. Serving three is the bug |
| **`mintingObservation` resolves through `mintedBy`** | and a work item carrying `insertedBy` but no `mintedBy` returns `null`, rather than following the retry-splice link |
| an off-map unit's id comes back as `<flowId>:off-map:<family>` | hyphenated and flow-scoped. `offmap:hostile-input` joins to nothing |
| a `terminal` unit's `surface` is the `byKind.terminal` sentence, byte for byte | the one that fills empty if you derive from `observableType` |
| a `branch` and an `off-map` unit's `surface` are non-empty too | three kinds break together, so test all three |
| an observable carrying `verifyByReading` gets `qaCheckSurfaceStatics.readCheck`, not its type's sentence | the override at `qa-checklist-build-transformer.ts:120-123` |
| every unit carries `nodeId` or `edgeId`, never both `null` on a terminal/branch/observable | the antagonist's row. An off-map family hangs on neither and is the exception |
| `ward.failingCheckTypes` is non-empty for a blob whose `checks[]` holds a `status: 'fail'` entry | files alone make spiritmender guess |
| `instance` is `null` on a step that does not declare `needsLane` and populated on one that does | the conditional row, typed as a null rather than as a variant |
| `instance.baseUrl` survives as `null` for a browserless spec | do not tighten it |
| **`JSON.stringify(view, null, 2).length` is under 50,000 for a realistic quest** | build the fixture at the measured worst case: 18 nodes, 19 edges, 47 observables. This tool can blow the same ceiling the prompts do |
| a return that WOULD exceed it comes back with `flows` cut and `truncated: [{ section: 'flows', dropped: n }]` | assert the exact `n`, not that the array is non-empty |
| `{ questId, operationItemId, workItemId }` — all three — is REFUSED | `.strict()` plus the refinement |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete `get-qa-checklist` | story 24. Its DERIVATION BROKERS survive and become this tool's internals — read them, reuse them, do not move them |
| edit `qa-checklist-to-text-transformer` | story 24. It stays live for the old tool |
| start an instance to get a manifest | story 23. Serve what the router recorded |
| add `recipes[]` to `flowContract` | see the OPEN. It is somebody's story and it is not this one |
| write a prompt | story 25 |
