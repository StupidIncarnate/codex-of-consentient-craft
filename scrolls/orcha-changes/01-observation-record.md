# 01 — the observation record

```
GOAL      A unit can be marked `met`, `cant-meet` or `unmet` with evidence, and the mark
          knows which unit it is about.
AFTER     nothing. This is the first story.
BEFORE    02 (the work item holds an array of these) · 10 · 17
PACKAGE   @dungeonmaster/shared
MODEL     sonnet
```

**Why this is first.** Every later story reads or writes one of these. Get the shape wrong and
stories 10, 14, 15, 17 and 18 all carry the mistake.

---

## The idea, in two paragraphs

A **unit** is the atom of verification on a quest. It is one of four things: an observable, a terminal
node, a labelled edge out of a decision node, or an off-map probe family. Today those four are signed
in three different places under three different field names. After this change they all get marked the
same way, and that is what makes the orchestrator's loop generic.

A session that is assigned units **must mark every one of them** before it may signal. `met` and
`cant-meet` settle a unit; `unmet` means real work remains, and the orchestrator answers it by minting
a fresh session scoped to exactly those units. That one rule replaces the rework loop, the
continuation chain and the three sign-off tracks. This story builds the record it writes into.

---

## BUILD

Two new contract folders in `packages/shared/src/contracts/` (a third, off-map-family, already
exists and is reused — see below). Each new folder holds three files: `<name>-contract.ts`,
`<name>.stub.ts`, `<name>-contract.test.ts`. The `.stub.ts` pattern is five lines — mirror
`packages/shared/src/contracts/work-item-status/work-item-status.stub.ts:1-5` exactly:

```ts
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { <name>Contract } from './<name>-contract';
import type { <Name> } from './<name>-contract';

export const <Name>Stub = ({ ...props }: StubArgument<<Name>> = {}): <Name> =>
  <name>Contract.parse({ /* one plausible default per required field */, ...props });
```

(For a bare `z.enum`/`z.string().brand` contract with no object fields, the stub instead takes
`{ value }` and defaults it — mirror `WorkItemStatusStub` at the same path: `({ value }: { value?:
WorkItemStatus } = {}): WorkItemStatus => workItemStatusContract.parse(value ?? 'pending')`.)

Export every new contract and its stub from **`packages/shared/contracts.ts`** (the barrel is at
the package ROOT, not `src/contracts.ts` — confirmed by reading that file directly, e.g. its line 370:
`export * from './src/contracts/work-item/work-item-contract';`). Add one `export * from
'./src/contracts/<name>/<name>-contract'` plus one for the stub, per new contract, anywhere in the
file (it has no enforced ordering beyond loose topic grouping via comments).

### 1. `unit-id/` — REUSE the shape and the enum that already exist. Do not invent either.

**The four id shapes are not invented here — they are already produced, byte for byte, by
`qaUnitEnumerateTransformer`** (`packages/orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts`).
Read that file before writing this contract:

| Kind | Shape | Source line |
|---|---|---|
| terminal | `` `${flowId}:terminal:${nodeId}` `` | `qa-unit-enumerate-transformer.ts:54` |
| branch | `` `${flowId}:branch:${edgeId}` `` | `:67` |
| observable | `` `${flowId}:observable:${observableId}` `` | `:81` |
| off-map | `` `${flowId}:off-map:${family}` `` | `:97` — **hyphenated `off-map`, and FLOW-SCOPED.** There is no bare, flow-independent `offmap:<family>` form anywhere in the code; every off-map unit belongs to one flow, because `qaUnitEnumerateTransformer` emits one off-map unit per family PER FLOW it enumerates (`:91`, `qaOffMapFamilyContract.options.map(...)` inside `({ flow })`) |

`qa-unit-enumerate-transformer.ts:21-23` carries a load-bearing definition worth copying into this
contract's own header verbatim, because a reader who has not seen it will assume the node's `type`
field decides terminal-ness: *"A TERMINAL IS A NODE WITH NO OUTGOING EDGE, which is not the same set
as `type === 'terminal'`: a node an author typed `terminal` may still point onward, and a plain
`state` node may be where the flow stops."*

**A contract for exactly this shape already exists**, and validates it with a regex rather than a
bare brand: `packages/shared/src/contracts/qa-checklist-item-id/qa-checklist-item-id-contract.ts`.

```ts
const KEBAB_SEGMENT = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';
export const qaChecklistItemIdContract = z
  .string().min(1)
  .regex(new RegExp(`^${KEBAB_SEGMENT}:${KEBAB_SEGMENT}:${KEBAB_SEGMENT}$`, 'u'))
  .brand<'QaChecklistItemId'>();
```

**Build `unitIdContract` as a NEW brand with the IDENTICAL regex** (do not import or re-export
`qaChecklistItemIdContract` itself — its own machinery, `qaVerificationUnitContract` and everything
downstream of it, is the OLD sign-off system's, and this story's OUT OF SCOPE line below keeps this
change from touching it). Mirror the pattern:

```ts
export const unitIdContract = z
  .string().min(1)
  .regex(new RegExp(`^${KEBAB_SEGMENT}:${KEBAB_SEGMENT}:${KEBAB_SEGMENT}$`, 'u'))
  .brand<'UnitId'>();
```

**OPEN — for the conductor:** `qaChecklistItemIdContract` and this new `unitIdContract` will hold
byte-identical validation. Story 24/26 retire the sign-off machinery around
`qaChecklistItemIdContract` but neither currently names the contract itself for deletion or
consolidation (checked: `24-the-deletions.md` and `26-signoff-retirement.md` name `qa-checklist-build`,
`qa-checklist-to-text` and `qa-units-in-package-scope` as SURVIVING transformers; the id contract
itself is unmentioned). Decide, whenever that consolidation happens, whether `unitIdContract`
replaces it outright or the two stay parallel.

**Do not build an `offMapUnitId` / `offMapFamilyContract` helper.** No such builder exists for the
real shape either — every call site that needs one (`qa-unit-enumerate-transformer.ts:97`) just
writes the template literal inline, because it always has the `flowId` in scope already. Reuse
`qaOffMapFamilyContract` (`packages/shared/src/contracts/qa-off-map-family/qa-off-map-family-contract.ts:16-24`)
for the seven off-map families — it is ALREADY the closed `z.enum([...])` this story describes,
values identical to the table below, and it survives the sign-off retirement (its consumers,
`qa-checklist-item-contract` and `qa-unit-enumerate-transformer`, are both named as SURVIVING in
story 24). Building a second enum with the same seven values duplicates it for no reason.

The seven off-map families, closed: `re-entry`, `concurrency`, `interruption`, `staleness`,
`configuration`, `hostile-input`, `perf`.

### 2. `unit-mark/`

```ts
export const unitMarkContract = z.enum(['met', 'cant-meet', 'unmet']);
```

Three values, and no fourth is coming. The vocabulary this replaces used `confirmed` /
`unconfirmable` / `rework` / `pass` / `green` across different prompts; none of those words survives.

### 3. `unit-observation/`

**Export TWO contracts, not one — the bare object AND the refined one.** `z.object({...}).superRefine(...)`
returns a `ZodEffects` in zod 3 (this repo pins `^3.25.76`, confirmed in the root `package.json`),
and a `ZodEffects` has **no `.shape`, no `.omit`, no `.pick`, no `.extend`**. Story 17 needs
`.omit({ at: true })` on this shape (an inbound observation payload the caller has not yet timestamped);
story 18 needs `.shape.evidence` and `.shape.toSettle` (to serve their `.describe()` text without
re-typing it). Both are impossible against the refined export alone. The repo's own evidence this is
the working pattern: the only `.shape` read anywhere in the codebase today is
`questNoteContract.shape.detail` at `quest-reset-flow-signoffs-responder.ts:47`, and `questNoteContract`
(`packages/shared/src/contracts/quest-note/quest-note-contract.ts`) carries no refinement at all —
every contract this repo reads `.shape` off is a bare `z.object`, never a `ZodEffects`.

```ts
export const unitObservationFieldsContract = z.object({
  unitId: unitIdContract,
  mark: unitMarkContract,
  evidence: z
    .string()
    .min(1)
    .brand<'MarkEvidence'>()
    .describe(
      "What settles this mark. met: a test file:line and the wrong value that turns it red, or " +
        'the value measured off the running system. cant-meet: why this layer cannot reach it. ' +
        'unmet: what is left, and what this session already learned — that note reaches its successor.',
    ),
  toSettle: z
    .string()
    .min(1)
    .brand<'ToSettleInstruction'>()
    .optional()
    .describe(
      'The action that WOULD settle this unit. Required when mark is cant-meet; refused otherwise ' +
        '— an instruction, never a question, naming what to DO rather than what to answer.',
    ),
  // Inline-branded, not a shared `isoTimestampContract` — `shared` has none. Every timestamp field
  // in this package brands `z.string().datetime().brand<'IsoTimestamp'>()` at its own declaration
  // site; see `work-item-contract.ts:46,52,63` for three examples in one file. `packages/orchestrator`,
  // `packages/web`, `packages/server` and `packages/session-forensics` each keep their OWN local
  // `isoTimestampContract` for their own package's consumers — none of those is importable from
  // `shared` (shared is the base package; nothing above it may be depended on from here).
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export const unitObservationContract = unitObservationFieldsContract.superRefine((value, ctx) => {
  if (value.mark === 'cant-meet' && value.toSettle === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['toSettle'],
      message:
        "toSettle is required when mark is 'cant-meet' — it names the action that WOULD settle " +
        'this unit. Without one, cant-meet is a dead end with no owner.',
    });
  }
  if (value.mark !== 'cant-meet' && value.toSettle !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['toSettle'],
      message:
        "toSettle is only valid when mark is 'cant-meet'. 'met' has already settled the unit; " +
        "'unmet' means work remains, not that this layer gave up on it — either way, a toSettle " +
        'here reads as a claim this observation did not make.',
    });
  }
});

export type UnitObservation = z.infer<typeof unitObservationContract>;
```

Follow the message VOICE already in this repo's other refinements — state the rule, then the reason,
then (where there is one) how to fix it. Compare `copiesTargetContract`
(`packages/hydration/src/contracts/copies-target/copies-target-contract.ts:19-44`): *"copies: may not
contain '/'. Use a bare identifier naming in-repo production code (e.g. 'guildAddBroker'), or
'external:<name>' naming a producer outside the repo (e.g. 'external:claude-cli')."* and
`getQaChecklistInputContract` (`packages/mcp/src/contracts/get-qa-checklist-input/get-qa-checklist-input-contract.ts:65-77`),
which sets `path: ['flowId']` on its own single-field refusal the same way the block above sets
`path: ['toSettle']`.

**The refinement is the load-bearing part, and it goes both ways:**

| Mark | `toSettle` |
|---|---|
| `cant-meet` | **required** |
| `met` | refused |
| `unmet` | refused |

`cant-meet` means *nobody in this role could settle this at this layer*. Without a `toSettle` naming
the action that WOULD settle it, that is a dead end with no owner. And a `toSettle` on a `met` is a
session hedging a claim it already made.

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your two new folders>` exits 0, and these cases exist
and pass:

| Assert | Fails today because |
|---|---|
| `cant-meet` with no `toSettle` is REFUSED, message names `toSettle` as required | the contract does not exist |
| `cant-meet` with a `toSettle` parses | ditto |
| `met` carrying a `toSettle` is REFUSED | ditto |
| `unmet` carrying a `toSettle` is REFUSED | ditto |
| `unitIdContract.parse('send-flow:off-map:hostile-input')` parses | the real, flow-scoped, hyphenated shape — not `offmap:hostile-input` |
| `unitIdContract.parse('send-flow:observable:obs-3')` parses; a two-segment or non-kebab value throws | mirrors `qaChecklistItemIdContract`'s own regex cases |
| `qaOffMapFamilyContract.parse('security')` throws | the seven are closed — this is the EXISTING contract being reused, not a new one |
| a mark outside the three is refused, `'confirmed'` named as the case | that is the word this replaces |
| `unitObservationFieldsContract.omit({ at: true })` compiles and parses an `at`-less payload | proves the bare export is usable the way story 17 needs it |
| `unitObservationFieldsContract.shape.evidence` and `.shape.toSettle` are both readable | proves the bare export is usable the way story 18 needs it |

**Write each one at its FAILS IF value first and watch it fail.** A refinement test that passes
without ever having failed is proving nothing about the refinement.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch `workItemContract` | story 02 |
| touch the three sign-off fields on observables, nodes or edges | story 26. They keep working until then |
| touch `qaChecklistItemIdContract`, `qaOffMapFamilyContract`'s consumers, or anything else in the old QA-checklist machinery | it survives into `get-quest-work` (story 24). Only IMPORT `qaOffMapFamilyContract` — never edit it |
| write anything that READS an observation | stories 10 and 13 |
| add these to any barrel export beyond `packages/shared/contracts.ts` | one barrel, per the package's own rules |

**Nothing imports these when you are finished, and that is correct.** The tree is green because
nothing changed behaviour.
