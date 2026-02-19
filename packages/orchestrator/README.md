# @dungeonmaster/orchestrator

The orchestrator is the brain of Dungeonmaster's quest system. It manages the full lifecycle of a quest — from a user's
initial request through spec creation, implementation planning, code generation, and verification.

## Core Concepts

### Quests

A quest is a structured specification that guides LLM agents through building a feature. It starts as a user request
("I want auth with email/password") and gets progressively refined into a machine-executable plan.

The quest data structure accumulates layers as the spec matures:

```
Quest
  ├─ flows[]              ← mermaid diagrams showing state transitions
  ├─ requirements[]       ← what needs to be built (derived from flows)
  ├─ designDecisions[]    ← architectural choices made during spec
  ├─ contexts[]           ← where things happen (pages, endpoints, sections)
  ├─ observables[]        ← testable behaviors with verification steps
  ├─ contracts[]          ← data shapes the feature needs
  ├─ toolingRequirements  ← npm packages, config changes
  └─ steps[]              ← file-level implementation plan (PathSeeker generates)
```

### Why Flows Come First

When a user says "I want a modal to create a widget," an LLM naturally generates isolated requirements and jumps
straight to test cases. This misses the connective tissue — what button opens the modal? After success, does the list
refresh? What loading state appears during submission? If the user navigates away mid-form, what happens?

Flows solve this by forcing the LLM to draw **connected state transition diagrams** before anything else. Every node in
a flow must have an entry and exit. Error paths must loop back somewhere. If a transition is missing, it's visible in
the
diagram.

```
/widgets page ──► clicks Add Widget ──► Modal opens ──► fills form ──► clicks Submit
                                                                           │
                                                              ┌────────────┼────────────┐
                                                              ▼            ▼            ▼
                                                           valid       name empty     server error
                                                              │            │            │
                                                              ▼            ▼            ▼
                                                         Spinner      "Required"    Toast error
                                                              │          error         │
                                                              ▼            │           ▼
                                                        Modal closes       └──► Form editable
                                                              │
                                                              ▼
                                                        List refetches
                                                              │
                                                              ▼
                                                     New widget visible + Toast
```

The flow surfaces every "glue" interaction that isolated requirements miss. Requirements then fall out naturally — you
look at the flow and extract what needs to be built.

Flows use mermaid syntax with no type constraint. The LLM picks whatever diagram style fits — `graph TD` for state
machines, `sequenceDiagram` for API interactions, whatever communicates the journey. A single quest can mix styles.

Flows are recommended but not mandatory. Simple quests (bug fixes, config changes) can skip them.

### Why Verification Steps Replace Outcomes

The original observable format had an `outcomes` array — abstract descriptions like "session cookie is set" or "error
banner shows message." This created two problems:

1. **No verification plan.** After implementation, the agent had to improvise what to check. There was no spec-time
   artifact saying "navigate here, click this, assert that."

2. **Duplication risk.** A separate "scenarios" or "playbook" layer would say the same thing as outcomes in a different
   format.

The fix: merge them. Each observable now carries a `verification` array — a single ordered sequence that serves as both
the behavioral description AND the executable test plan.

```json
{
  "trigger": "User submits valid widget creation form",
  "verification": [
    { "action": "navigate", "target": "/widgets" },
    { "action": "click", "target": "'Add Widget' button" },
    { "action": "fill", "target": "Name field", "value": "Test Widget" },
    { "action": "click", "target": "Submit button" },
    { "action": "assert", "condition": "Spinner on Submit button", "type": "ui-state" },
    { "action": "assert", "condition": "POST /api/widgets called", "type": "api-call" },
    { "action": "assert", "condition": "Modal closes", "type": "ui-state" },
    { "action": "assert", "condition": "'Test Widget' in widget list", "type": "ui-state" }
  ]
}
```

One data structure, three consumers:

| Consumer        | Reads                       | Purpose                                                         |
|-----------------|-----------------------------|-----------------------------------------------------------------|
| **User**        | trigger + assert conditions | Human-readable QA checklist ("do this, expect that")            |
| **PathSeeker**  | assert `type` tags          | File categorization (ui-state = widgets, api-call = responders) |
| **Siegemaster** | full sequence               | Automated browser/API verification                              |

The `outcomes` field is preserved during transition. ChaosWhisperer generates both `verification` (primary) and
`outcomes` (backward compat) until all downstream agents are migrated.

### Quest Status Lifecycle

Quests move through a defined status progression with two human approval gates:

```
created ──► requirements_approved ──► approved ──► in_progress ──► complete
                                                       │
                                                       ├──► blocked
                                                       └──► abandoned
```

| Status                  | What Happened                                   | What's Allowed Next                           |
|-------------------------|-------------------------------------------------|-----------------------------------------------|
| `created`               | Quest exists, discovery in progress             | Add flows, requirements, design decisions     |
| `requirements_approved` | User approved flows + requirements (Gate #1)    | Add contexts, observables, contracts, tooling |
| `approved`              | User approved observables + contracts (Gate #2) | Spec is locked. Execution can start.          |
| `in_progress`           | `start-quest` triggered, agents are working     | Steps added/modified by PathSeeker            |
| `complete`              | All phases passed                               | Terminal state                                |
| `blocked`               | Pipeline hit a blocker                          | Awaiting resolution                           |
| `abandoned`             | User abandoned the quest                        | Terminal state                                |

The gates exist because LLMs rubber-stamp their own output. By splitting spec creation into two approval points, the
user reviews flows + requirements (the "what") separately from observables + contracts (the "how"). Each gate is a
meaningful checkpoint, not a formality.

Status transitions are currently enforced by prompt logic in ChaosWhisperer, not by a hard guard. This is intentional —
adding a transition guard is a future hardening step once the workflow stabilizes.

### Quest Stages (Filtered Views)

Quests contain a lot of data. Stages let you request a filtered slice:

| Stage        | Returns                                         | Use Case                |
|--------------|-------------------------------------------------|-------------------------|
| `spec`       | requirements, designDecisions, flows, contracts | Reviewing the full spec |
| `spec-flows` | requirements, designDecisions, flows, contracts | Flow-focused review     |
| `full`       | everything                                      | Complete quest data     |

Query with `GET /api/quest/:id?stage=spec-flows`.

Stages are defined in `quest-stage-mapping-statics.ts`. Each stage maps to a list of quest sections. The
`quest-section-filter-transformer` zeros out sections not in the requested stage.

### Verification Guards

Before execution starts, `verify-quest` runs integrity checks on the quest data. Two guards validate flows:

| Guard                       | Check                                                    | Behavior          |
|-----------------------------|----------------------------------------------------------|-------------------|
| `quest-has-valid-flow-refs` | All flow `requirementIds` point to existing requirements | Hard fail         |
| `quest-has-flow-coverage`   | Every approved requirement is referenced by a flow       | Soft (warns only) |

Flow coverage is soft because simple quests can legitimately have zero flows. Invalid refs are always a data integrity
error, so that guard is hard.

## ChaosWhisperer Workflow

ChaosWhisperer is the spec-creation agent. It runs when the user invokes `/quest`. The workflow has seven phases:

```
Phase 1: Discovery
  └─ Explore codebase, interview user, understand what exists

Phase 2: Flow Mapping
  └─ Draw mermaid flow diagrams based on user request
  └─ Every node needs entry + exit — forces glue discovery
  └─ Design decisions recorded as they emerge

Phase 3: Requirements
  └─ Extract requirements from flow nodes/paths
  └─ "Looking at these flows, here's what needs to be built..."

Phase 4: Flows + Requirements Approval (Gate #1)
  └─ Present flows (visual) + requirements (list) together
  └─ User approves/defers requirements, confirms flows
  └─ Status → 'requirements_approved'

Phase 5: Observables + Contracts
  └─ Derive observables from flow paths
  └─ Each observable carries verification steps
  └─ Lock down tangible values (routes, endpoints, error messages)
  └─ Declare contracts from observable details

Phase 6: Observables Approval (Gate #2)
  └─ Present observables with verification steps, contracts
  └─ User approves
  └─ Status → 'approved'

Phase 7: Gap Review + Handoff
  └─ Spawn quest-gap-reviewer for final validation
  └─ Address any gaps, produce summary
```

## Execution Pipeline

After spec approval, `/quest:start` triggers the execution pipeline:

| Phase       | Agent       | What It Does                                               |
|-------------|-------------|------------------------------------------------------------|
| PathSeeker  | PathSeeker  | Plans file-level implementation steps from the spec        |
| Codeweaver  | Codeweaver  | Writes code for each step (3 concurrent, DAG-ordered)      |
| Ward        | Ward        | Runs lint + typecheck + tests; Spiritmender fixes failures |
| Siegemaster | Siegemaster | Verifies each observable using its verification steps      |
| Lawbringer  | Lawbringer  | Final code quality review per file pair                    |

Agents communicate via `signal-back` MCP tool with three signal types:

- **`complete`** — done, release slot, dispatch next step
- **`partially-complete`** — respawn with continuation context
- **`needs-role-followup`** — spawn a followup agent (usually Spiritmender), depth-limited to prevent infinite loops

## Key Files

| File                                   | Purpose                                                                  |
|----------------------------------------|--------------------------------------------------------------------------|
| `contracts/modify-quest-input/`        | Schema for PATCH operations on quests (flows, status, observables, etc.) |
| `brokers/quest/modify/`                | Processes PATCH operations — upserts arrays, writes status               |
| `brokers/quest/add/`                   | Creates new quests with `status: 'created'`                              |
| `transformers/quest-verify/`           | Runs all integrity checks before execution                               |
| `transformers/work-unit-to-arguments/` | Feeds observable data (outcomes + verification) to agents                |
| `transformers/quest-section-filter/`   | Filters quest data by stage                                              |
| `statics/quest-stage-mapping/`         | Maps stage names to section lists                                        |
| `statics/chaoswhisperer-prompt/`       | The full ChaosWhisperer system prompt                                    |
| `guards/quest-has-valid-flow-refs/`    | Validates flow → requirement references                                  |
| `guards/quest-has-flow-coverage/`      | Warns when approved requirements lack flow coverage                      |
