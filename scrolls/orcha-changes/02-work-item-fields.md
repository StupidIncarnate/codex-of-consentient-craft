# 02 — four fields on the work item

```
GOAL      A work item can say which STEP it is, which units it marked, which planned
          piece it came from, and what its brief was.
AFTER     01 (it holds an array of unit observations)
BEFORE    10 · 15 · 17 · 18 · 21 · 22
PACKAGE   @dungeonmaster/shared
MODEL     sonnet
```

**This is an additive change to a file with 77 readers.** Every field is optional or defaulted, so
nothing existing changes shape and no reader needs touching. Keep it that way — the moment one of
these becomes required, this story grows by 77 files.

---

## Why the work item is not being split

`quest.workItems` is read in 77 non-test source files and written through 17 call sites that each
depend on one atomic rename being the commit point. Moving the array, or splitting it into a second
file, is expensive and buys nothing. **Adding four optional fields to it is cheap.** The planner's
forecast — which WOULD bloat `quest.json` without limit — goes to its own file instead, in story 07.

---

## BUILD

Edit `packages/shared/src/contracts/work-item/work-item-contract.ts`. Four fields.

### `step`

```ts
step: stepNameContract.optional(),
```

Which step of its family's graph this session is. A new branded string contract in
`packages/shared/src/contracts/step-name/` — **free-form, not an enum**, because prompts get swapped
in and out and a `quest.json` holding a work item whose step no longer exists must still LOAD. Dispatch
is where an unknown step fails, loudly, naming the step and the family. Families keep their enum: the
stable layer stays closed, the volatile layer opens.

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

The `id` of the planner's piece this session is executing, verbatim from the plan file. A new branded
string contract in `packages/shared/src/contracts/piece-id/`.

The pair `(the `operations/<id>` entry in `relatedDataItems`, `pieceId`)` is what addresses a piece —
the ref names the plan file, the id names the piece inside it.

**Optional, and three kinds of work item legitimately carry none:** one minted from another step's
`unmet` marks, one minted from a `request`, and every deterministic step.

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

## Also update

| File | Change |
|---|---|
| `packages/shared/src/contracts/work-item/work-item.stub.ts` | the four fields, with defaults that keep every existing caller's expectations true |
| the INVARIANT comment at `work-item-contract.ts:35–39` | it states strict 1:1 operation-item ↔ work-item, "never re-linked, never status-reverted". **That breaks in story 22.** Do not delete it yet — add one line saying which story retires it, so the next reader is not misled by a comment that is still true today |
| `contracts.ts` barrel | export the three new contracts and their stubs |

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your paths>` exits 0, and:

| Assert | Why it is the one that matters |
|---|---|
| **a `quest.json` fixture with NONE of the four fields parses** | 77 readers and every quest on disk. If this fails, the change is not additive and you have broken every existing quest |
| a work item with all four round-trips | the happy case |
| `observations` defaults to `[]` on an absent key | so a reader can iterate without a null check |
| `step: 'a-step-nobody-declared'` PARSES | story 03's rule, exercised here. Dispatch rejects it later; the contract must not |
| the stub still satisfies every existing caller | run the existing `work-item-contract.test.ts` unchanged and green |

**Run the whole `shared` unit suite before you signal.** This contract sits inside `questContract`'s
`workItems` array, so a rejection here fails the WHOLE `quest.json` parse rather than one row — the
same reason the existing `startedAt` field is `.nullish()` and not `.optional()`.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| make any of the four required | never. They stay optional |
| update any of the 77 readers | nothing needs it — that is the point |
| define the per-family payload shapes | story 07 |
| write the thing that READS `observations` | story 10 |
| touch `wardMode` | story 24 deletes it |
