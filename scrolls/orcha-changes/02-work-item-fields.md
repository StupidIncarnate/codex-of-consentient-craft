# 02 — six fields on the work item, and one on the flow

```
GOAL      A work item can say which STEP it is, which units it was ASSIGNED, which units
          it marked, which planned piece it came from, what its brief was, and which work
          item minted it. A flow can record which seed recipes a planner proved for it.
AFTER     01 (it holds an array of unit observations)
BEFORE    10 · 14 · 15 · 17 · 18 · 21 · 22
PACKAGE   @dungeonmaster/shared
MODEL     sonnet
```

**This is an additive change to a file with 98 readers**, plus one field on `flowContract`. Every
field is optional or defaulted, so nothing existing changes shape and no reader needs touching. Keep
it that way — the moment one of these becomes required, this story grows by 98 files.

**Two fields below were not in the original cut of this story — `assignedUnitIds` and `mintedBy`.**
Stories 14 and 15 each independently need a field `workItemContract` does not have and neither can
derive one from what story 02 originally gave them; both said so explicitly in their own text
("this story needs a FIFTH field... the conductor decides whether 02 is amended or this story adds
it"). They land here instead, so 14 and 15 read a settled contract rather than repeating the same
open question. The **flow's `recipes[]` field** was also missing entirely — nothing in phase A–C
created it, though story 08 validates it, story 18 serves it and story 27 renders it. It lands here
too, because this is the only story in phase A already editing a shared contract, and it is the same
kind of change: additive, optional, nothing reads it yet.

---

## The 98 is measured, and it corrects the design doc

The design plan reports 77 non-test source files for `quest.workItems` **and 77 for sign-offs** — the
same figure for two different surfaces, which was suspicious rather than impossible. It was a
copy-paste. Measured independently, twice:

| Surface | Real | Plan said |
|---|---|---|
| `quest.workItems` readers | **98** | 77 |
| the three sign-off FIELDS — what story 26 deletes | **39** | 77 |
| sign-off VOCABULARY, the wider rename surface | 76 | 77 |

**So the plan's conclusion is backwards.** It calls the sign-off retirement "the larger unknown of the
two". It is half the size of the work-item surface, not larger.

## Why the work item is not being split

`quest.workItems` is read in **98** non-test source files and written through 17 call sites that each
depend on one atomic rename being the commit point. Moving the array, or splitting it into a second
file, is expensive and buys nothing. **Adding six optional fields to it is cheap.** The planner's
forecast — which WOULD bloat `quest.json` without limit — goes to its own file instead, in story 07.

---

## BUILD

Edit `packages/shared/src/contracts/work-item/work-item-contract.ts`. Six fields. Two of them need a
NEW contract folder each — neither `step-name/` nor `piece-id/` exists yet (checked: `discover` on
both globs returns nothing). Build each the same three-file way story 01 does:
`<name>-contract.ts`, `<name>.stub.ts`, `<name>-contract.test.ts`, exported from
`packages/shared/contracts.ts` (package root, not `src/contracts.ts`).

### `step`

```ts
step: stepNameContract.optional(),
```

Which STEP of its family's graph this session is — a key into `agentFlowStatics[family].steps`, e.g.
`'plan'`, `'work'`, `'review'`, `'commit'`, `'happyWalk'` (see story 05's `agentFlowStatics` for the
full key set). **This is NOT the same vocabulary as `agentPromptNameContract`** (story 03) — a step
key like `'work'` and the prompt it dispatches, `'codeweaver-worker'`, are two different strings, and
confusing them is an easy mistake because both contracts open the same way for the same reason.

New folder: `packages/shared/src/contracts/step-name/step-name-contract.ts`:

```ts
export const stepNameContract = z.string().min(1).brand<'StepName'>();
```

**Free-form, not an enum**, because steps get added, removed and renamed as families evolve (story
05's own example turns `planner → worker → reviewer` into `planner → recipe → worker → reviewer` as
a config edit) and a `quest.json` holding a work item whose step no longer exists must still LOAD.
Dispatch (story 15) is where an unknown step fails, loudly, naming the step and the family — see
story 15's own two owned messages for the exact wording. Families keep their enum (story 04's
`questFlowStatics` family keys, and `workItemRoleContract`): the stable layer stays closed, the
volatile layer opens.

Optional because a chat role — `chaoswhisperer`, `bughunt`, `tavernkeeper` — has no step graph at all.

### `observations`

```ts
observations: z.array(unitObservationContract).default([]),
```

**One entry per unit this work item was ASSIGNED.** Not a shared log that sessions append to — each
session gets a fresh, complete set, and that set freezes when the step signals. A re-mint writes its
own set of the same units from scratch; it does not amend its predecessor's.

That is what makes the record readable afterwards. Codeweaver marks `obs-3` unmet, a second codeweaver
marks it met, its reviewer marks it unmet again, a third gets it met: four work items, four complete
records, and the sequence is legible without reconstructing anything.

### `pieceId`

```ts
pieceId: pieceIdContract.optional(),
```

The `id` of the planner's piece this session is executing, verbatim from the plan file (story 07's
example: `"id": "pc-1"`). New folder: `packages/shared/src/contracts/piece-id/piece-id-contract.ts`:

```ts
export const pieceIdContract = z.string().min(1).brand<'PieceId'>();
```

**Do not reuse or model this on `operationPlanPieceIdContract`**
(`packages/shared/src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts`) — that
one is `z.string().uuid().brand<'OperationPlanPieceId'>()`, a strict UUID, for the OLD `operation-plan`
system's pieces. The new plan file's piece ids are short mnemonic strings a planner writes by hand —
`"pc-1"`, `"pc-walk-1"` (story 07's `baselineFor` example) — never a UUID, so a `.uuid()` contract
would reject every real value.

The pair `(the `operations/<id>` entry in `relatedDataItems`, `pieceId`)` is what addresses a piece —
the ref names the plan file, the id names the piece inside it.

**Optional, and three kinds of work item legitimately carry none:** one minted from another step's
`unmet` marks, one minted from a `request`, and every deterministic step.

### `assignedUnitIds` — story 14's field, settled here

```ts
assignedUnitIds: z.array(unitIdContract).default([]),
```

**What this work item was ASSIGNED, as distinct from what it MARKED (`observations`).** Story 14's
signal gate reads this field and refuses to let a session signal while any id in it has no matching
`observations[].unitId`. It cannot be derived from anything else that exists, and story 14 spells out
all three failed readings — carry the reasoning, not just the field, since the next reader will
otherwise try to derive it again:

| Candidate carrier | Fails because |
|---|---|
| the piece's own `assignedUnitIds`, via `workItem.pieceId` | story 07: *"`assignedUnitIds` is INTENT, and the router decides what is actually assigned… the router re-filters against the record at dispatch and hands the session only what is still unsettled."* The piece's list and the session's actual assignment are deliberately different |
| `payload.units[]` | siegemaster's payload has no `units` key at all — story 07's siege payload is `{ path: { nodeIds, branchLabels }, offMapFamily }`. Every siege walker and both fixers would read as assigned nothing, and the gate would pass every one of them regardless of what they left unmarked |
| re-deriving a reviewer's in-scope set at signal time | it is a different set from the one at dispatch time — an observable a reviewer added mid-pass is in-scope for the scope that added it, so re-deriving would refuse a session over a unit that did not exist when it was briefed |

So the router (story 15) WRITES this field onto every work item it mints; story 14's gate READS it
and nothing else. One field, one writer, one reader. Defaulted to `[]`, exactly like `observations`,
so the additive property below still holds.

### `mintedBy` — story 15's field, settled here

```ts
mintedBy: questWorkItemIdContract.optional(),
```

**The return edge.** Which work item's `unmet` marks or `request` caused this one to exist. The router
(story 15) knows the minter at CREATION time and nothing records it, so at READ time — deciding where
a mark-minted step's undeclared `done` route goes — there is nothing to look up without it. A step
that is only ever mark-minted (e.g. `fixHappy`) declares no `done` route at all; an undeclared outcome
returns to whichever work item's `mintedBy` points at it.

**Do not reuse `insertedBy` for this — it already means something else, and reusing it breaks quest
completion.** Verified at
`packages/orchestrator/src/transformers/work-items-to-quest-status/work-items-to-quest-status-transformer.ts:74-78`:

```ts
// A failed item is resolved once a later retry was spliced for it — i.e. some work item carries
// insertedBy === failedItem.id.
const supersededIds = new Set(
  derivationWorkItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
);
```

`insertedBy` marks "this work item SUPERSEDES a failed one" for the `pt N` continuation chain. Reusing
it for `mintedBy` would make every ordinary mark-minted work item (a rework loop, not a failure retry)
read as superseding its minter, and `work-items-to-quest-status-transformer` would then treat a quest
with a perfectly healthy `unmet` → re-mint loop as having resolved a failure and derive `complete`
while real work is still running.

### `payload`

```ts
payload: z.record(z.unknown()).optional(),
```

The typed, per-family half of a brief — flowrider's per-unit `surface` and `layer`, siege's off-map
family and `baselineFor`, codeweaver's file list. **`z.record(z.unknown())` here deliberately**: the
per-family shapes live on the plan-file contract in story 07, and duplicating them into
`workItemContract` would make `shared` depend on a shape only the orchestrator cares about.

**A work item with no piece still needs a brief**, which is why this field exists at all: the router
COPIES the originating piece's payload onto what it mints. Storing the copy rather than a pointer is
deliberate — a later amendment to the plan then cannot rewrite what a session already ran against,
which is the same reason an observation set freezes at signal.

---

## Also build: `flowContract` gains `recipes[]`

Edit `packages/shared/src/contracts/flow/flow-contract.ts` — read it first
(`flow-contract.ts:24-34`: `id`, `name`, `flowType`, `scope`, `entryPoint`, `exitPoints`, `nodes`,
`edges`, `offMapSignoffs`; **there is no `recipes` field today**). Add one:

```ts
recipes: z.array(flowRecipeContract).default([]),
```

**Why this lands here rather than in a later story.** Nothing in phase A–C creates this field, but
three later stories need it already written: story 08 validates *"every `recipeId` a piece names is
recorded on that flow AND carries the run id that proved it"*, story 18 serves a piece's resolved
recipes, and story 27 renders them on the SPEC tab. This is the only story in phase A that already
edits a shared contract, and this is the same category of change.

New contract folder `packages/shared/src/contracts/flow-recipe/flow-recipe-contract.ts`:

```ts
export const flowRecipeContract = z.object({
  id: flowRecipeNameContract,        // the recipe's own name, doubling as the upsert key — see below
  instanceId: siegeInstanceIdContract,
  runId: siegeRunIdContract,
});
```

**The field is named `id`, not `name`, on purpose.** `flow.recipes[]` is an ID-BEARING ARRAY exactly
like `flow.offMapSignoffs[]` (`flow-off-map-signoff-contract.ts:19-24` — the deep merge,
`questItemDeepMergeTransformer`, recurses only into arrays whose items carry a literal `id` field;
confirmed at `quest-item-deep-merge-transformer.ts:16,50` via `isArrayOfItemsWithIdGuard`/`ItemWithId`
— anything else is replaced WHOLESALE on every write). A recipe's name is already its unique key in
the recipe book, so reusing it as `id` is the same move `flowOffMapSignoffContract` makes reusing the
family as its own `id`.

**`flowRecipeNameContract` is a NEW, separate branded string — do not import the real one.** A recipe
name contract already exists at
`packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts` (kebab-case regex,
brand `RecipeName`), but `shared` cannot import it: `hydration-recipes`' own `package.json`
dependencies are `@dungeonmaster/config`, `@dungeonmaster/shared` and `zod` (confirmed in story 18's
own text), so an import the other way is a dependency cycle. This is the identical situation
`siegeInstanceIdContract` and `siegeRunIdContract` already solve one folder over — read
`packages/shared/src/contracts/siege-run-id/siege-run-id-contract.ts:1-9` for the reasoning stated in
full. Mirror it:

```ts
export const flowRecipeNameContract = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Recipe name must be kebab-case …')
  .brand<'FlowRecipeName'>();
```

**`instanceId` + `runId`, not a bare run id.** A run id alone is not resolvable — it is scoped to the
instance whose timeline it numbers. This is the SAME pair `quest-note-contract`'s `walked` note
already carries for the identical "which run proved this claim" citation
(`packages/shared/src/contracts/quest-note/quest-note-contract.ts:64-76`), reused rather than
invented. It also matches the actual mechanism: `recipeSeedRunBroker` proving a seed through a real
`run` step (not the `--seed` boot-time shortcut, which explicitly does NOT mint a run id —
`instance-start-broker.ts:363-366`: *"routing it through `run` instead would burn a run id... for
something that is not a step"*) burns a real `run_N` id inside a throwaway siegelense instance, and
that instance's evidence outlives its teardown (siegelense's own rule: *"`kill` removes the throwaway
home and never the evidence directory"*).

---

## Also update

| File | Change |
|---|---|
| `packages/shared/src/contracts/work-item/work-item.stub.ts` | **no change needed.** Read it: `WorkItemStub` takes `StubArgument<WorkItem> = {}` and spreads `...props` last, so every one of the six new optional/defaulted fields is already settable by a caller that wants one and silently absent for every caller that doesn't. Confirm this by running the existing `work-item-contract.test.ts` unchanged — it stays green |
| the INVARIANT comment at `work-item-contract.ts:35–39` | it states strict 1:1 operation-item ↔ work-item, "never re-linked, never status-reverted". **That breaks in story 22.** Do not delete it yet — add one line saying which story retires it, so the next reader is not misled by a comment that is still true today |
| `packages/shared/contracts.ts` barrel | export the four new contracts (`step-name`, `piece-id`, `flow-recipe`, `flow-recipe-name`) and their stubs |

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your paths>` exits 0, and:

| Assert | Why it is the one that matters |
|---|---|
| **a `quest.json` fixture with NONE of the six fields parses** | 98 readers and every quest on disk. If this fails, the change is not additive and you have broken every existing quest |
| a work item with all six round-trips | the happy case |
| `observations` and `assignedUnitIds` both default to `[]` on an absent key | so a reader can iterate without a null check |
| `step: 'a-step-nobody-declared'` PARSES | story 03's rule, exercised here. Dispatch rejects it later; the contract must not |
| `mintedBy` accepts a `questWorkItemIdContract`-shaped id and round-trips; absent by default | story 15's return edge |
| the stub still satisfies every existing caller | run the existing `work-item-contract.test.ts` unchanged and green |
| **a `flow` fixture with no `recipes` key still parses** | the same additive property, on the flow side |
| a flow with one `recipes[]` entry round-trips, keyed by its `id` | the happy case for the new array |
| a parsed `FlowRecipe` carries an `id` key | proves the merge-upsert precondition (a literal `id` field) holds for this field. `isArrayOfItemsWithIdGuard` and `questItemDeepMergeTransformer` both live in `@dungeonmaster/orchestrator` (relative-imported there, not exported from `shared`), and this story's PACKAGE is `shared` only — actually driving a merge through them is that package's own test suite's job, already covered generically and unchanged by this story |

**Run the whole `shared` unit suite before you signal.** Both contracts sit inside `questContract`'s
arrays (`workItems`, `flows`), so a rejection here fails the WHOLE `quest.json` parse rather than one
row — the same reason the existing `startedAt` field is `.nullish()` and not `.optional()`.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| make any of the six work-item fields, or `flow.recipes`, required | never. They stay optional/defaulted |
| update any of the 98 readers | nothing needs it — that is the point |
| define the per-family payload shapes | story 07 |
| write the thing that READS `observations` or `assignedUnitIds` | stories 10 and 14 |
| write the router that WRITES `assignedUnitIds` / `mintedBy` | story 15 |
| validate that a `recipeId` a piece names resolves to a `flow.recipes[]` entry | story 08 |
| run a recipe, or resolve one by name | `packages/hydration-recipes` / `packages/siegelense`, unchanged |
| touch `wardMode` | story 24 deletes it |
