# @dungeonmaster/orchestrator

## Quest Pipeline

```
/quest (ChaosWhisperer)
  ├─ Explore agents ────── codebase research (read-only)
  ├─ quest-gap-reviewer ── spec validation (read-only)
  │
  ├─ Gate #1: User approves requirements
  ├─ Gate #2: User approves observables + contracts
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
Ward ──► npm run ward:all
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
created ──► requirements_approved ──► approved ──► in_progress ──► complete
                                                       │
                                                       ├──► blocked
                                                       └──► abandoned
```

| Status                  | Set By                                                   | Gate                                               |
|-------------------------|----------------------------------------------------------|----------------------------------------------------|
| `created`               | `add-quest`                                              | Can add: requirements, designDecisions             |
| `requirements_approved` | Auto when all requirements approved/deferred             | Can add: contexts, observables, contracts, tooling |
| `approved`              | ChaosWhisperer after user approves observables (Gate #2) | Spec locked. `start-quest` allowed.                |
| `in_progress`           | `start-quest`                                            | Steps can be added/modified                        |
| `blocked`               | Pipeline blocker                                         | Execution paused                                   |
| `complete`              | All phases pass                                          | Terminal                                           |
| `abandoned`             | User abandons                                            | Terminal                                           |

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

| Skill          | Purpose                                                          |
|----------------|------------------------------------------------------------------|
| `/quest`       | ChaosWhisperer — BDD spec creation with two human approval gates |
| `/quest:start` | Start execution, poll progress                                   |
| `/test`        | Write unit tests for existing code                               |
| `/tegrity`     | Fix lint + type errors iteratively                               |
| `/document`    | Update project standards docs                                    |

## Sub-Agents

| Agent                 | Spawned By          | Purpose                                      |
|-----------------------|---------------------|----------------------------------------------|
| quest-gap-reviewer    | ChaosWhisperer      | Validate spec completeness before execution  |
| finalizer-quest-agent | PathSeeker pipeline | Verify + semantic review after steps created |
