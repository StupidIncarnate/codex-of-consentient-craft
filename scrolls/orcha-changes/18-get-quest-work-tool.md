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

**After this story lands: build `@dungeonmaster/mcp` and reconnect the MCP.** This and story 17 are the
only compiled-output dependency in the whole chain.

---

## Why "a prompt carries IDs" forces this

`mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's prompts already run 43,000–48,000. There
is no room to inject a piece's files, facts, fences, units and surfaces into a served prompt. **Over
the ceiling the MCP layer spills the result to a file and hands the agent an error stub** — the session
then holds a path instead of its instructions, and nothing reports a failure.

So `workItemToPromptTransformer` keeps substituting ids and nothing else, and the agent fetches its own
work. **A prompt of ids cannot make its first call without this**: every step's first substantive call
needs `flowId` and `packageName`, and both live in the operation item's TEXT — the line ending
`— package: <name> · flow: <id>`. "IDs only" drops that text, so all three families are dead on their
first tool call.

---

## Two call shapes

| Called with | Returns |
|---|---|
| `{ questId, operationItemId }` | the whole plan as MARKDOWN — a planner's review-before-signing read |
| `{ questId, workItemId }` | everything this session needs to start |

---

## What `{ questId, workItemId }` must return

**This is the complete list. Anything missing is a session that cannot do step one.**

| It returns | Who dies without it |
|---|---|
| the typed scope — `flowId`, `packageNames`, `operationItemText` | all three families, on their first call |
| the **assigned** unit set, with each unit's current mark and reasoning | every worker |
| the step-scoped **in-scope** set, beside the assigned one | both reviewers and the happy walker. The in-scope gate has no denominator otherwise — and the assigned set is by definition the wrong one, since the point is catching a unit no piece claimed |
| the **flows** the scope names, rendered | a walk needs the path; a worker needs the unit text verbatim |
| the piece — `context`, `notes`, typed `payload` — or explicit **`piece: null`** | a planner has no piece, and an omitted key reads as a failed fetch and a `wall` |
| the **walk paths** with their force labels and `pathsTruncated` | the siege planner takes them as given; the flowrider planner copies them into `payload.walk` |
| **notes from previous sessions** on the same work | a re-mint reads what its predecessor found instead of rediscovering it |
| the **uncommitted file list** — `git diff HEAD` unioned with untracked | no session commits now, so nobody discovers the pass by staging it |
| the paths **committed on this branch since `baseRef`**, grouped by the scope that committed them | the codeweaver planner, so it does not re-brief work already on the branch. `spiritmender` reads the same field |
| the failing **ward run id and its blob path**, plus the failing CHECK TYPES and file list | `spiritmender`. It reads the blob, then builds `--only <checks>` from the types. Handed files alone it guesses the check set |
| the **riftcarver `.log` path** when the repair sits in that graph | same session, different graph — a carve-only failure produces no ward blob at all |
| **`baseBranch`** and **`worktreePath`** | `warpgate`. Its prompt forbids both alternatives outright: never probe for the default branch, never `git fetch` |
| the **minting observation** — the mark and evidence that caused this session to exist | every fixer. A siege fixer's brief quotes the walker's measured block verbatim, and that block lives on the observation, not on the piece |
| the piece's **recipes, resolved** — each name with the run id that proved it | both walkers and any browser-layer flowrider worker |
| each unit's **owning node id** | the antagonist, which fetches the baseline of the node it is attacking. `qa-checklist-to-text-transformer.ts:237` renders a unit row and interpolates no node today |
| the running instance's **id and manifest** — `baseUrl` and every address — on a `needsLane` step | both walkers. The router starts the instance (story 23), so the session has no manifest file of its own |
| the **baseline**: the happy run's instance id and run id for the path this piece attacks | the antagonist. Resolved from the piece's `baselineFor` |

---

## Two shape questions this story has to ANSWER, not dodge

**`surface` needs a second source.** Filling it from `qaChecklistItemContract.checkSurface` works for
observables. **Terminals and labelled edges carry no type tag** and appear in no `CHECK SURFACES` row —
their sentence is in `qaCheckSurfaceStatics.byKind`. Read one source only and every terminal's surface
fills empty.

**"Notes from previous sessions" is two different things.** The plan's per-piece `notes: ["trap: …"]`
written by a PLANNER, and `quest.planningNotes.questNotes[]` keyed `{role, workItemId, flowId?,
unitId?}` written by a RUNNING SESSION. Serve both, labelled. Only the second is written by a session.

---

## The git reads move here, and the rule becomes flat

**No session runs git at all after this, read or write — except `warpgate`.**

| Read | Who wanted it | Now |
|---|---|---|
| `git diff HEAD` + untracked | both reviewers — it IS their pass | the uncommitted list |
| `git log --name-only` | the codeweaver planner | the committed-paths field |
| `git log` | `spiritmender`, for context on a red | same field |
| `git status` | anyone before signalling | the uncommitted list again |

**Measure the uncommitted list with `gitWorkingTreeFilesBroker`** —
`packages/orchestrator/src/brokers/git/working-tree-files/`. It already unions `git diff HEAD
--name-only` with `git ls-files --others --exclude-standard`, and **the union is the whole point**: a
bare diff reports TRACKED paths only, so the net-new files a worker just wrote — the ones most likely
to carry the defect — would be invisible. **Reuse it. Do not write a second git call that gets it
subtly wrong.**

**The exception is `warpgate` and it is not a loose end.** Driving git IS its job: an intake merge, a
squash onto base, a commit. It is a one-step family with no `commit` step to collide with.

**One consequence:** the list is of the quest's own worktree, and a quest with no worktree yet returns
an EMPTY LIST rather than an error. A hydrated quest is a real state, not a violation.

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
agents. The new `work-plan-to-text-transformer` sits beside them.

---

## DONE WHEN

| Assert | |
|---|---|
| the typed scope comes back, all three fields | without it every family is dead on its first call |
| `piece: null` EXPLICITLY for a planner | not an omitted key |
| **an in-scope unit claimed by no piece is visible in the RENDERED TEXT** | assert on the string, not the object. This is what the render is for |
| the uncommitted list includes an UNTRACKED file | the union. A test with only tracked changes passes against a bare diff |
| the in-scope set and the assigned set are BOTH returned, and differ for a reviewer | |
| a terminal's `surface` is non-empty | the `byKind` source — the one that fills empty if you read one source |
| the whole return is under `maxVerbatimChars` for a realistic quest | measure it. This tool can blow the same ceiling the prompts do |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete `get-qa-checklist` | story 24. Its DERIVATION BROKERS survive and become this tool's internals — read them, reuse them, do not move them |
| start an instance to get a manifest | story 23. Serve what the router recorded |
| write a prompt | story 25 |
