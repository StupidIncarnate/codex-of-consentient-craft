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

Three new contract folders in `packages/shared/src/contracts/`. Each folder holds three files:
`<name>-contract.ts`, `<name>.stub.ts`, `<name>-contract.test.ts`.

### 1. `unit-id/`

A branded string naming one unit. Four shapes are legal, and the fourth is why this is its own
contract rather than a reused id type:

| Shape | Example | Why |
|---|---|---|
| an observable id | `scan-finds-every-path` | the common case |
| a terminal node id | `forward-unchanged` | a terminal signs on the NODE |
| a labelled edge id | `copy-failed` | a branch signs on the EDGE |
| `offmap:<family>` | `offmap:hostile-input` | an off-map probe family hangs on no node and no edge, so it has nothing to borrow an id from |

The seven off-map families, and the enum is closed: `re-entry`, `concurrency`, `interruption`,
`staleness`, `configuration`, `hostile-input`, `perf`.

```ts
export const unitIdContract = z.string().min(1).brand<'UnitId'>();
```

Plus a companion that parses the off-map form, so the `offmap:` prefix is spelled in exactly one
place and a typo is a compile error rather than a silently unmatched unit:

```ts
export const offMapFamilyContract = z.enum([...]);          // the seven above
export const offMapUnitId = ({ family }: { family: OffMapFamily }): UnitId => …
```

### 2. `unit-mark/`

```ts
export const unitMarkContract = z.enum(['met', 'cant-meet', 'unmet']);
```

Three values, and no fourth is coming. The vocabulary this replaces used `confirmed` /
`unconfirmable` / `rework` / `pass` / `green` across different prompts; none of those words survives.

### 3. `unit-observation/`

```ts
export const unitObservationContract = z
  .object({
    unitId: unitIdContract,
    mark: unitMarkContract,
    evidence: z.string().min(1).brand<'MarkEvidence'>(),
    toSettle: z.string().min(1).brand<'ToSettleInstruction'>().optional(),
    at: z.string().datetime().brand<'IsoTimestamp'>(),
  })
  .superRefine(…);
```

**The refinement is the load-bearing part, and it goes both ways:**

| Mark | `toSettle` |
|---|---|
| `cant-meet` | **required** |
| `met` | refused |
| `unmet` | refused |

`cant-meet` means *nobody in this role could settle this at this layer*. Without a `toSettle` naming
the action that WOULD settle it, that is a dead end with no owner. And a `toSettle` on a `met` is a
session hedging a claim it already made.

**`evidence` is required on all three**, and the three carry different things — that difference is
prompt text later, not a contract rule, but write it into the `.describe()` so the next reader has it:

| Mark | Evidence carries |
|---|---|
| `met` | a test `file:line` and the wrong value that turns it red, or the value measured off the running system |
| `cant-meet` | why this layer cannot reach it |
| `unmet` | what is left, and what this session already learned. That note reaches its successor |

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your three folders>` exits 0, and these cases exist
and pass:

| Assert | Fails today because |
|---|---|
| `cant-meet` with no `toSettle` is REFUSED | the contract does not exist |
| `cant-meet` with a `toSettle` parses | ditto |
| `met` carrying a `toSettle` is REFUSED | ditto |
| `unmet` carrying a `toSettle` is REFUSED | ditto |
| `offMapUnitId({ family: 'hostile-input' })` returns `offmap:hostile-input` | ditto |
| `offMapFamilyContract.parse('security')` throws | the seven are closed |
| a mark outside the three is refused, `'confirmed'` named as the case | that is the word this replaces |

**Write each one at its FAILS IF value first and watch it fail.** A refinement test that passes
without ever having failed is proving nothing about the refinement.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch `workItemContract` | story 02 |
| touch the three sign-off fields on observables, nodes or edges | story 26. They keep working until then |
| write anything that READS an observation | stories 10 and 13 |
| add these to any barrel export beyond `contracts.ts` | one barrel, per the package's own rules |

**Nothing imports these when you are finished, and that is correct.** The tree is green because
nothing changed behaviour.
