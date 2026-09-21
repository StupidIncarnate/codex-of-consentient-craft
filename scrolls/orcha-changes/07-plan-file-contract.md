# 07 — the plan file

```
GOAL      A planner's forecast has a shape: batches of pieces, each piece naming its step,
          its units and its brief.
AFTER     01 (units) · 02 (a work item links back by pieceId)
BEFORE    08 (which validates it) · 09 · 15 · 17
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — three families' payloads and one envelope
```

---

## "Work item" was doing two jobs

| | **PIECE** | **WORK ITEM** |
|---|---|---|
| Lives in | `<questFolder>/planned-work/<operationItemId>.json` | `quest.json` → `quest.workItems[]` |
| Is | the planner's FORECAST — what it intends | the RECORD — a session that ran |
| Written by | one planner, once, then amended | the orchestrator, as the router decides |
| Count | all of them, up front | only what has been reached |

**They are deliberately not 1:1.** A piece whose units come back `unmet` produces a second work item. A
piece the run never reaches produces none. The gap between the two files is the useful thing to look at
when a quest goes wrong.

**A piece has no size ceiling; a prompt does.** That is the real reason the plan is a file rather than
prompt text, and it belongs in the contract's own header so nobody later "simplifies" it back into the
prompt. `mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's prompts already run 43,000–48,000.

---

## BUILD

New contract folder in `packages/orchestrator/src/contracts/work-plan/`. **This is the whole file, not
an excerpt — it IS the contract:**

```jsonc
{
  "operationItemId": "op-7",
  "family": "codeweaver",
  "flowId": "flow-send",              // the scope, copied so the file reads alone
  "packageNames": ["web"],
  "writtenBy": "wi-planner-1",        // the work item whose planner wrote it
  "writtenAt": "2026-…",
  "batches": [
    {
      "mode": "sequential",           // sequential | parallel
      "pieces": [
        {
          "id": "pc-1",               // work items link back by this
          "step": "work",             // must exist in THIS family's step graph
          "assignedUnitIds": ["obs-3", "obs-7"],   // must mark. The gate counts these
          "contextUnitIds": ["obs-9"],             // must read and build against. May NOT mark
          "recipeId": "rcp-…",        // the seed this piece starts from, off the flow. Optional
          "baselineFor": "pc-walk-1", // adversarial pieces only — see below
          "context": "free-form brief: what this piece is and how to do it",
          "notes": ["trap: the send path double-fires under a stale token"],
          "payload": { }              // per-family, typed — the three shapes below
        }
      ]
    }
  ],
  "plannerMarks": [ ]                 // `cant-meet` ONLY, on units no piece claims
}
```

### The two unit arrays are two different jobs

`assignedUnitIds` is what this session must MARK. `contextUnitIds` is what it must READ and build
against and may NOT mark — which is how a seam's far half stays visible to the cell that does not own
it. **The in-scope check binds `assignedUnitIds` only**: a context unit is by definition a unit from
somewhere else, and checking it against this scope would reject exactly the case it exists for.

### `assignedUnitIds` is INTENT, and the router decides what is actually assigned

The plan is a forecast, so the router re-filters against the record at dispatch and hands the session
only what is still unsettled. Living in a directory called `planned-work` is what marks it as intent —
the field name does not need to.

### `plannerMarks` is the planner's ONE mark authority

A planner gets no units. The single exception: a siege planner with fewer rounds than off-map families
must record the families it is not covering, or `hostile-input` and `perf` — the quest's only security
and performance coverage anywhere — are silently dropped.

**It may write `cant-meet`, only `cant-meet`, and only for a unit it is simultaneously putting on no
piece.** That does not break "never mark a unit you did not settle": the planner genuinely settled the
question *no session this pass will reach this*, which is exactly what a `cant-meet` plus a `toSettle`
records.

### The three per-family payloads

**Codeweaver — the unit is a FILE GROUP.**

```jsonc
"payload": {
  "files": [ { "path": "…", "change": "new|edit", "in": "…", "out": "…", "proves": ["obs-3"] } ],
  "facts": ["…"], "fences": ["…"], "traps": ["…"], "doNotTouch": ["…"],
  "units": [ { "unitId": "…", "kind": "observable|terminal|branch", "text": "…",
               "assert": "…", "failsIf": "…" } ]
}
```

**Flowrider — the unit is a TEST FILE, the decisions are per UNIT.**

```jsonc
"payload": {
  "specPath": "…", "mode": "new|extend", "harnesses": [ … ],
  "walk": { "shape": "journey|matrix",
            "paths": [ { "nodeIds": [...], "forceLabels": [...] } ],
            "pathsTruncated": false },
  "units": [ { "unitId": "…", "kind": "…", "layer": "browser|below-browser",
               "surface": "<FILLED SERVER-SIDE — a planner writes no surface>",
               "observableTarget": { "target": "observable|node|edge", "nodeId"|"edgeId": "…" },
               "assert": "…", "failsIf": "…" } ],
  "facts": [], "fences": [], "traps": [], "doNotTouch": []
}
```

**`surface` is filled by the orchestrator, never typed by a planner.** It is already a real per-unit
field — `qaChecklistItemContract.checkSurface` — and only the text renderer drops it. A planner that
types one is transcribing a verbatim string through a model, which is the one hop worth deleting.

**Siegemaster — the unit is a PATH WALK, and half the plan is policy.**

```jsonc
"payload": {
  "path": { "nodeIds": [...], "forceLabels": [...] },
  "offMapFamily": "hostile-input" | null
}
```

**No lane or instance names.** The router starts each instance and serves its id (story 23).

### `baselineFor`, and why it exists

An `adversarial` piece names the `happyWalk` piece it measures against. The router resolves it to that
piece's work item and serves its instance id and run id. **An attack is an ABSENCE claim** — I attacked
this and it did not fall over — and an absence is only evidence against a known-good reading taken
first. Without this field the antagonist has nothing behind its claim.

---

## DONE WHEN

| Assert | |
|---|---|
| the whole example above round-trips | the envelope |
| a piece with `assignedUnitIds: []` PARSES | a codeweaver contracts piece legitimately carries zero units — contracts are proved by the code that reads them |
| `plannerMarks` rejects a `met` | the planner's authority is bounded to one mark |
| `plannerMarks` rejects a `cant-meet` with no `toSettle` | inherited from story 01's refinement — assert it reaches here |
| `payload.units[]` is 1:1 with `assignedUnitIds`, and a mismatch is REFUSED | a dropped terminal is invisible otherwise. This catches it at write time, before a session exists |
| `payload.units` is an ARRAY keyed by `unitId`, never a map keyed by observable TYPE | terminals and labelled edges carry no type tag, so a type-keyed map loses two whole kinds silently |
| `offMapFamily` accepts only the seven | a repeated or invented family destroys a round's coverage |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write the cross-referencing checks — "this unit exists on this quest", "this step exists in this family" | story 08. This story is the SHAPE; that one is the graph of references |
| read or write the file | story 09 |
| build the MCP tool that accepts a plan | story 17 |
