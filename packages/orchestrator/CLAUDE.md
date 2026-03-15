# @dungeonmaster/orchestrator

## Callouts
- Don't read stuff in .claude/agents and .claude/commands if you're looking for orchestrator prompts. Those are just copied from the statics folder.

## Quest Pipeline

```
/quest (ChaosWhisperer)
  ├─ Explore agents ────── codebase research (read-only)
  ├─ quest-gap-reviewer ── spec validation (read-only)
  │
  ├─ Phase 1: Discovery ──────── explore codebase, interview user → status: explore_flows
  ├─ Phase 2: Flow Mapping ────── mermaid diagrams (mandatory) → status: review_flows
  ├─ Phase 3: Gate #1 ─────────── user approves flows → status: flows_approved
  ├─ Phase 4: Observables ─────── embedded in flow nodes → status: explore_observables → review_observables
  ├─ Phase 5: Gate #2 ─────────── user approves observables + contracts → status: approved
  │
  ▼
/quest:start ──► start-quest MCP
  │
  ▼
PathSeeker (1) ◄── retry (max 3, on verify failure)
  ├─ verify-quest ──── 11 integrity checks
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
pending ──┐
           ▼
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► in_progress ──► complete
                                    │                                                          │                   │              │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)    ├──► blocked ──► in_progress
                                                                                                                   │              │         └──► abandoned
                                                                                                                   │              └──► abandoned
                                                                                                                   ▼
                                                                                                            explore_design ──► review_design ──► design_approved ──► in_progress
                                                                                                                                      │
                                                                                                                                      └──► explore_design (back)
```

| Status                | Set By                                                    | Gate                                                      |
|-----------------------|-----------------------------------------------------------|-----------------------------------------------------------|
| `created`             | `add-quest`                                               | ChaosWhisperer starting up                                |
| `explore_flows`       | ChaosWhisperer (Phase 1 exit)                             | Can add: flows, designDecisions                           |
| `review_flows`        | ChaosWhisperer (Phase 2 exit)                             | User reviews flows, APPROVE button visible                |
| `flows_approved`      | User approves flows (Gate #1)                             | Can add: observables (in flow nodes), contracts, tooling  |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                            | Can add: observables, contracts, tooling                  |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                             | User reviews observables, APPROVE button visible          |
| `approved`            | User approves observables (Gate #2)                       | Spec locked. `start-quest` or `explore_design` allowed.   |
| `explore_design`      | Glyphsmith starts design work                             | Create prototypes, iterate on designs                     |
| `review_design`       | Glyphsmith ready for design review                        | User reviews designs, APPROVE button visible              |
| `design_approved`     | User approves designs                                     | Design locked. `start-quest` allowed.                     |
| `in_progress`         | `start-quest`                                             | Steps can be added/modified                               |
| `blocked`             | Pipeline blocker                                          | Execution paused                                          |
| `complete`            | All phases pass                                           | Terminal                                                  |
| `abandoned`           | User abandons                                             | Terminal                                                  |

## Flows (Mermaid Diagrams)

Flows are mermaid diagrams that force the LLM to think through connected state transitions BEFORE writing observables.
Every node must have an entry and exit — this surfaces missing "glue" (loading states, error recovery, navigation
transitions) that isolated requirements miss.

- Flows come FIRST, observables are embedded directly in flow nodes
- No type enum — the mermaid syntax itself encodes the diagram style (`graph TD`, `sequenceDiagram`, etc.)
- Flows have `nodes: FlowNode[]` and `edges: FlowEdge[]`; each node has optional `observables: FlowObservable[]`
- Flows are mandatory — every quest must have flows before observables can be defined
- The `quest-has-flow-coverage` guard is hard (blocks verification on failure)

## Observables (GIVEN/WHEN/THEN)

Observables are embedded directly in flow nodes at `flows[].nodes[].observables[]`. Each uses a BDD-style format:

```
{
  id: "observable-uuid",
  given: "user is on /login page with empty form",
  when: "user submits valid credentials",
  then: [
    { type: "api-call", description: "POST /api/auth/login called with credentials" },
    { type: "ui-state", description: "redirected to /dashboard" }
  ]
}
```

Three consumers read different parts:

- **User** reads given/when/then as a human-readable acceptance criteria checklist
- **PathSeeker** reads `then[].type` tags (file planning: ui-state -> widgets, api-call -> responders)
- **Siegemaster** uses the full observable to create integration tests

## Quest Stages

| Stage            | Sections Included                                         |
|------------------|-----------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling |
| `spec-flows`     | flows (nodes/edges only, no observables), designDecisions, contracts, tooling |
| `spec-obs`       | flows (observables only), contracts, tooling              |
| `implementation` | steps, contracts, tooling                                 |

Use `?stage=spec-flows` to get flow structure without observables. Use `?stage=spec-obs` to get observables without flow structure.

## Agent Roles

| Role         | Phase         | Spawned By                        | Signals                                           |
|--------------|---------------|-----------------------------------|---------------------------------------------------|
| Glyphsmith   | design        | startDesignChat                   | N/A (design prototype)                            |
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

## Quest Event Notification (Two-Tier Model)

Quest mutations use a **file outbox** for cross-process notification. Transient chat events stay on the in-memory bus.

| Tier | Events | Mechanism |
|------|--------|-----------|
| **Persistent mutations** | quest-modified, quest-created | File outbox (`event-outbox.jsonl`) — automatic via `questPersistBroker` |
| **Transient streams** | chat-output, chat-complete, clarification-request, quest-session-linked, etc. | In-memory `orchestrationEventsState` bus |

**How it works:**
- All 4 quest mutation brokers write through `questPersistBroker` (file write + outbox append)
- `questOutboxWatchBroker` tails the outbox file and fires callbacks on new lines
- Server starts the watcher at init and broadcasts `quest-modified` WS messages

**Rules:**
- NEVER emit `quest-modified` or `quest-created` on `orchestrationEventsState` — those go through the outbox only
- NEVER call `fsWriteFileAdapter` directly for quest files — always use `questPersistBroker`
- Transient chat events stay on in-memory bus (single-process, high-frequency)

## User-Invoked Skills

| Skill          | Purpose                                                            |
|----------------|--------------------------------------------------------------------|
| `/quest`       | ChaosWhisperer — BDD spec creation with two human approval gates   |
| `/quest:start` | Start execution, poll progress                                     |
| `/test`        | Write unit tests for existing code                                 |
| `/tegrity`     | Fix lint + type errors iteratively                                 |
| `/document`    | Update project standards docs                                      |

## Sub-Agents

| Agent                 | Spawned By          | Purpose                                      |
|-----------------------|---------------------|----------------------------------------------|
| quest-gap-reviewer    | ChaosWhisperer      | Validate spec completeness before execution  |
| finalizer-quest-agent | PathSeeker pipeline | Verify + semantic review after steps created |
