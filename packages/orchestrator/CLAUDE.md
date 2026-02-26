# @dungeonmaster/orchestrator

## Quest Pipeline

```
/quest (ChaosWhisperer)
  ├─ Explore agents ────── codebase research (read-only)
  ├─ quest-gap-reviewer ── spec validation (read-only)
  │
  ├─ Phase 1: Discovery ──────── explore codebase, interview user
  ├─ Phase 2: Flow Mapping ────── mermaid diagrams (mandatory)
  ├─ Gate #1: User approves flows
  ├─ Phase 4: Requirements ────── derived FROM approved flows
  ├─ Gate #2: User approves requirements
  ├─ Phase 6: Observables ─────── derived from flow paths, with verification steps
  ├─ Gate #3: User approves observables + contracts
  │
  ▼
/quest:start ──► start-quest MCP
  │
  ▼
PathSeeker (1) ◄── retry (max 3, on verify failure)
  ├─ verify-quest ──── 13 integrity checks
  ├─ finalizer-quest-agent ── semantic review
  │
  ▼
Codeweaver (x3 concurrent, 600s timeout)
  │  dependency-aware DAG scheduling
  │
  ▼
Ward ──► npm run ward
  │  └─ Spiritmender (x3) on failure ◄── retry (max 3)
  │
  ▼
Siegemaster (x3 concurrent, 300s, 2 retries)
  │  one agent per observable
  │  └─ Spiritmender via needs-role-followup (depth 3)
  │
  ▼
Lawbringer (x3 concurrent, 300s, 2 retries)
  │  one agent per file pair
  │  └─ Spiritmender via needs-role-followup (depth 3)
  │
  ▼
Complete
```

## Quest Status Lifecycle

```
created ──► flows_approved ──► requirements_approved ──► approved ──► in_progress ──► complete
                                                                          │
                                                                          ├──► blocked
                                                                          └──► abandoned
```

| Status                  | Set By                                                    | Gate                                               |
|-------------------------|-----------------------------------------------------------|----------------------------------------------------|
| `created`               | `add-quest`                                               | Can add: flows, designDecisions                    |
| `flows_approved`        | ChaosWhisperer after user approves flows (Gate #1)        | Can add: requirements                              |
| `requirements_approved` | ChaosWhisperer after user approves requirements (Gate #2) | Can add: contexts, observables, contracts, tooling |
| `approved`              | ChaosWhisperer after user approves observables (Gate #3)  | Spec locked. `start-quest` allowed.                |
| `in_progress`           | `start-quest`                                             | Steps can be added/modified                        |
| `blocked`               | Pipeline blocker                                          | Execution paused                                   |
| `complete`              | All phases pass                                           | Terminal                                           |
| `abandoned`             | User abandons                                             | Terminal                                           |

## Flows (Mermaid Diagrams)

Flows are mermaid diagrams that force the LLM to think through connected state transitions BEFORE writing observables.
Every node must have an entry and exit — this surfaces missing "glue" (loading states, error recovery, navigation
transitions) that isolated requirements miss.

- Flows come FIRST, requirements are derived FROM them
- No type enum — the mermaid syntax itself encodes the diagram style (`graph TD`, `sequenceDiagram`, etc.)
- `requirementIds` defaults to `[]` because flows are created before requirements exist; backfilled later
- Flows are mandatory — every quest must have flows before requirements can be extracted
- The `quest-has-flow-coverage` guard is hard (blocks verification on failure)

## Enhanced Observables (Verification Steps)

Each observable carries a `verification` array — an ordered sequence of steps that serves as BOTH the description of
what should happen AND the executable verification plan. No separate scenarios or playbook layers.

```
verification: [
  { action: "navigate", target: "/page" },        ← setup
  { action: "click",    target: "Button" },        ← setup
  { action: "fill",     target: "Name field", value: "Test" },  ← setup
  { action: "click",    target: "Submit" },        ← trigger
  { action: "assert",   condition: "Spinner visible", type: "ui-state" },  ← assert
  { action: "assert",   condition: "POST /api/x called", type: "api-call" },  ← assert
]
```

Three consumers read different parts:

- **User** reads trigger + assert conditions (human-readable QA checklist)
- **PathSeeker** reads assert `type` tags (file planning: ui-state → widgets, api-call → responders)
- **Siegemaster** executes the full sequence (automated verification)

During transition, ChaosWhisperer generates BOTH `verification` (primary) and `outcomes` (backward compat).
The `workUnitToArgumentsTransformer` reads both when feeding agents.

## Quest Stages

| Stage        | Sections Included                               |
|--------------|-------------------------------------------------|
| `spec`       | requirements, designDecisions, flows, contracts |
| `spec-flows` | requirements, designDecisions, flows, contracts |
| `full`       | all sections                                    |

Use `?stage=spec-flows` to get flow-focused filtered view of a quest.

## Agent Roles

| Role         | Phase         | Spawned By                        | Signals                                           |
|--------------|---------------|-----------------------------------|---------------------------------------------------|
| PathSeeker   | pathseeker    | start-quest                       | N/A (process exit)                                |
| Codeweaver   | codeweaver    | slot manager                      | complete, partially-complete, needs-role-followup |
| Spiritmender | ward / nested | ward phase or needs-role-followup | complete, needs-role-followup                     |
| Siegemaster  | siegemaster   | parallel runner                   | complete, partially-complete, needs-role-followup |
| Lawbringer   | lawbringer    | parallel runner                   | complete, needs-role-followup                     |

## Signal System

Agents communicate via `signal-back` MCP tool:

- **`complete`** — step done, release slot, dispatch next
- **`partially-complete`** — respawn with `continuationPoint` context
- **`needs-role-followup`** — spawn `targetRole` agent (usually spiritmender), depth-limited

## User-Invoked Skills

| Skill          | Purpose                                                            |
|----------------|--------------------------------------------------------------------|
| `/quest`       | ChaosWhisperer — BDD spec creation with three human approval gates |
| `/quest:start` | Start execution, poll progress                                     |
| `/test`        | Write unit tests for existing code                                 |
| `/tegrity`     | Fix lint + type errors iteratively                                 |
| `/document`    | Update project standards docs                                      |

## Sub-Agents

| Agent                 | Spawned By          | Purpose                                      |
|-----------------------|---------------------|----------------------------------------------|
| quest-gap-reviewer    | ChaosWhisperer      | Validate spec completeness before execution  |
| finalizer-quest-agent | PathSeeker pipeline | Verify + semantic review after steps created |
