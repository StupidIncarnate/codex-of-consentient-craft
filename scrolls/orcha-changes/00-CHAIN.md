# The orchestrator step engine — the chain

**One PR, in one worktree, built as a chain.** Each story below is one dispatched session. It names
what it builds, in enough detail to write without guessing, and what test proves it. A session is
handed a story number and nothing else.

**Every story leaves the tree green.** That is what makes the chain work: the next session can tell
its own breakage from what it inherited.

---

## What problem this solves, in four sentences

Today one session runs a whole family's scope — codeweaver, flowrider, siegemaster — and loops
internally: it reads code, briefs generic sub-agents, summons one reviewer, and repeats until the
reviewer passes. None of that inner activity is a work item, so the orchestrator cannot see it, and
changing the loop means rewriting a 46 KB prompt. **The goal: the orchestrator runs the loop.** Each
step becomes its own dispatched session with its own prompt, and what runs next is decided from
recorded state off a config table.

---

## The vocabulary, once

Every story uses these as if you know them.

| Word | Means |
|---|---|
| **family** | one of six role stages a quest passes through: `riftcarver`, `codeweaver`, `flowrider`, `siegemaster`, `wardFull`, `warpgate`. The stable layer |
| **scope** | one family's slice of one quest — *"codeweaver, package web, flow send"*. This is today's `quest.operations[]` item, unchanged |
| **step** | one stage INSIDE a family — `plan`, `work`, `review`, `commit`, `ward`. Each is its own dispatched session with its own prompt. New, and the volatile layer |
| **work item** | one dispatched agent run. Today's `quest.workItems[]` entry. Many per scope after this change, one per scope before it |
| **unit** | the atom of verification: an observable, a terminal node, a labelled edge, or an off-map probe family. A work item is ASSIGNED units and must mark every one before it may signal |
| **piece** | one line in a planner's forecast file. Not a work item — a piece is what a planner INTENDS, a work item is a session that RAN |
| **lane / instance** | one `siegelense` instance: a headless browser, an API server and a Vite server, driven by a siege walker |

**Three marks a session writes on a unit:**

| Mark | Means | What the orchestrator does |
|---|---|---|
| `met` | proved, with evidence | nothing — settled |
| `cant-meet` | unsettleable at this layer; carries `toSettle`, the action that WOULD settle it | nothing — settled as unsettleable |
| `unmet` | not done | mint a fresh session scoped to exactly these units |

**Four outcome words, everywhere, no synonyms:** `done` (every assigned unit `met` or `cant-meet`) ·
`unmet` (at least one still `unmet`) · `empty` (nothing was in scope to act on — never "there was work
and I cut none") · `wall` (an environment wall no fresh session could pass). Ordered worst first:
`wall` > `unmet` > `done` > `empty`.

---

## The chain

Build inner to outer. Nothing reads the new shapes until story 15; nothing dispatches against them
until story 22.

### Phase A — the record can hold the new shape (stories 1–6)

Everything additive. No existing code changes behaviour.

| # | Story | Unlocks |
|---|---|---|
| [01](01-observation-record.md) | the observation record — `unitId`, three marks, `toSettle` | 02, 10, 17 |
| [02](02-work-item-fields.md) | four fields on `workItemContract` | 10, 15, 17, 18 |
| [03](03-step-name-contract.md) | `agentPromptNameContract` opens to free strings | 05 |
| [04](04-family-graph.md) | `questFlowStatics` — which family runs next | 06, 16, 22 |
| [05](05-step-graph.md) | `agentFlowStatics` — what happens inside one family | 06, 13, 15, 20 |
| [06](06-graph-reachability.md) | the check that a graph is sound, as lint AND at load | — |

### Phase B — the plan file (stories 7–9)

| # | Story | Unlocks |
|---|---|---|
| [07](07-plan-file-contract.md) | the piece, batch and plannerMarks shapes | 08, 09, 15, 17 |
| [08](08-plan-validation.md) | the 19 checks a submitted plan must pass | 17 |
| [09](09-planned-work-store.md) | reading and writing `planned-work/<id>.json` | 15, 17, 18 |

### Phase C — pure derivations (stories 10–13)

No I/O, no wiring. Each is a transformer over shapes phases A and B built.

| # | Story | Unlocks |
|---|---|---|
| [10](10-unit-current-mark.md) | a unit's current mark, and the churn walk behind it | 12, 14, 15, 18 |
| [11](11-step-scope.md) | which units a step is measured over | 12, 14, 18 |
| [12](12-in-scope-set.md) | the in-scope set for a scope, and what "outstanding" means | 14, 15, 18 |
| [13](13-outcome-derivation.md) | marks → one of the four words, and the batch fold | 15 |

### Phase D — the engine (stories 14–16)

| # | Story | Unlocks |
|---|---|---|
| [14](14-signal-gate.md) | no session signals with an assigned unit unmarked | 19 |
| [15](15-router.md) | the four questions, the return edge, the phase rule | 16, 21, 22 |
| [16](16-lazy-scopes-and-completion.md) | scopes minted when their family is routed to; `complete` off the graph | 22 |

### Phase E — the tools (stories 17–19)

| # | Story | Unlocks |
|---|---|---|
| [17](17-quest-work-tool.md) | `quest-work` — six write payloads | 19, 25 |
| [18](18-get-quest-work-tool.md) | `get-quest-work` — the one startup call for every role | 25 |
| [19](19-signal-back.md) | `signal-back` keeps two jobs, loses one, gains one | 22 |

### Phase F — wiring the live path (stories 20–24)

**This is the cutover.** Before story 20 nothing new is reachable from a running quest; after story 24
the old path is gone.

| # | Story | Unlocks |
|---|---|---|
| [20](20-deterministic-handlers.md) | `commit`, `ward`, `riftcarver`, `cleanup` as handlers, with `args` | 22 |
| [21](21-parallel-selector.md) | the selector returns a batch instead of one item | 22 |
| [22](22-advance-onto-the-graph.md) | advance, start and the fan-out read the graphs | 23, 24 |
| [23](23-instances-and-capacity.md) | the router starts and kills siegelense instances | 25 |
| [24](24-the-deletions.md) | remove what the new path replaced | 25, 26 |

### Phase G — the sets (stories 25–28)

These are fan-outs, not single sessions. Each file holds a template plus the list.

| # | Set | Size |
|---|---|---|
| [25](25-prompts.md) | nineteen prompts, one session each | 19 sessions |
| [26](26-signoff-retirement.md) | retire three fields across every reader | ~12 sessions |
| [27](27-ui.md) | row identity, the projection, seven broken surfaces | ~7 sessions |
| [28](28-independent.md) | `glyphsmith`, six defects, `verifyByHuman` | ~9 sessions |

**25 can be WRITTEN as soon as 18 is green**, before the cutover lands — a prompt is text. What it
cannot do is run before the steps exist. **26 must merge with 24**, because 24 deletes the tools that
write the fields 26 deletes. **27 and 28 are free.**

---

## Where this runs

**One worktree, carved once, before story 01:**

```
mcp__dungeonmaster__create-worktree({ name: "<something>" })
```

That is the only tool that makes one. Claude Code's own worktree command is refused by a hook naming
this tool, and a hand-assembled `git worktree add` gives a tree where nothing resolves — no
`node_modules`, no binaries, so ward cannot start. Every session runs inside that path.

**Never `npm rebuild` inside it.** `node_modules` is hardlinked, so node-gyp writes through the
existing path and the build lands in the main checkout and every other worktree at once.

**One build in the whole chain, and it is after story 18.** `get-quest-work` and `quest-work` are MCP
tools, and MCP executes compiled output — this worktree's own `packages/mcp/dist/src/index.js`. So
after 18 lands: build `@dungeonmaster/mcp`, reconnect the MCP. Nothing else needs a build; ward, the
dev server and every test read TypeScript source.

---

## How a session runs a story

1. **Read your story file. It is complete.** If it sends you somewhere else for something you need to
   write, that is a defect in the story — say so rather than going to look.
2. **Call `get-architecture` and `get-testing-patterns` once**, then `get-folder-detail({ folderType })`
   once per folder type you will write into. These override your training data.
3. **Search in this order**: `get-project-map` or `get-project-inventory` for the package, THEN
   `discover` with a glob into what those named, THEN `Read`. Reach for `discover` first and a wrong
   glob returns nothing, which reads exactly like a package that holds nothing.
4. **Write the test at its FAILS IF value first and watch it fail for the right reason**, then correct
   it and go green. A suite that never ran has produced no red.
5. **`npm run ward -- -- <your paths>`**, `timeout: 600000`. Never bare, never `--committed`, never
   `--uncommitted` — those grade work you did not do.
6. **Signal with the paths you touched.** You do not commit and you run no git.

## House rules these stories assume

You will get these from `get-architecture` too, but they are the ones most often got wrong here:

- `export const` arrow functions. **No `export default`**, ever. `export class` only for errors
- Purpose JSDoc goes **above the imports**, not above the function
- A function takes **one object parameter**, destructured
- **Returns are branded Zod contracts**; inputs MAY take a raw `string`. The asymmetry is deliberate
- On a brand mismatch, **re-parse** — `unitIdContract.parse(raw)` — never `as unknown as`
- **No `jest.mock` / `jest.spyOn`** — use the `registerMock` proxy pattern
- **No `beforeEach` / `afterEach`** — inline setup per test
- **No `toEqual` / `toMatchObject` / `toContain`** — `toStrictEqual` and `toBe`
- Tests import the **`.stub.ts`**, never the `-contract.ts`. Stubs import the contract to parse with
- No silent catch. `catch { return {} }` and `.catch(() => {})` are lint errors
- No `while (true)` — use recursion
- Every contract folder holds three files: `x-contract.ts`, `x.stub.ts`, `x-contract.test.ts`

## Who does what

| | |
|---|---|
| **the conductor** | carves the worktree, dispatches stories in order, runs `npm run ward -- --committed --uncommitted` after each one, commits when it is green, and runs one bare `npm run ward` at the end. It is the only session that commits, builds, or runs a git-scoped ward |
| **a story session** | one story. Writes code, wards its own paths, signals. Runs no git |
| **a set session** (25–28) | one item out of a set's list, under that set's template |

**Nothing below the conductor runs git at all** — not a write, not a read. One worktree has one
`index.lock`; twelve concurrent sub-agent commits were measured in this repo with three landing and
nine dying on `Unable to create index.lock`.

## Open questions the conductor owns

Each blocks one story. A session that answers one itself has invented a design decision.

| Question | Blocks |
|---|---|
| Who writes a hydration INGREDIENT — its own step, or a sub-agent of `recipe-maker`? And how does one `request` mint three at once? | 25, the `recipe-maker` prompt |
| Does an all-operational quest get ONE whole-quest off-map item, or does siege just close `empty`? | 25, `siege-planner` and the antagonist |
| Is "only ChaosWhisperer and BugHunt may set this flag" prompt text, or a real mechanism? Today `verifyByReading` has no guard behind it | 28, `verifyByHuman` |
| Re-measure the two blast radii before scheduling 26 | 26 |
