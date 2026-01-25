# State Machine Workflow Plan

## Context

Designing a state machine for agent orchestration. The CLI spawns Claude Code agents as child processes, monitors them,
and routes based on their signals.

### Parallel Task Execution (Slot Model)

- CLI maintains N slots (default 3) for concurrent agent execution
- Each slot runs one agent working on one step
- When a slot's agent completes, CLI assigns next available step to that slot
- Steps have dependencies - CLI only assigns steps whose dependencies are met

### Signal-Based IPC

- Agents signal via single MCP tool:
  `signal-back({ type: 'complete' | 'partially-complete' | 'needs-user-input' | 'needs-role-followup', ... })`
- CLI watches for MCP signals from agents
- When CLI receives signal, it updates the quest file and routes accordingly; Based on non-complete signals, it will
  have to kill agent session to query user or launch something else.
- Quest file is the source of truth for all state (step status, session IDs, history, etc.)

### Session Resumption

- CLI spawns agents with: `claude -p "<prompt>" --output-format stream-json`
- CLI captures `session_id` from JSON output
- When resuming (after user input or role followup):
  `claude -p "<new context>" --resume <session_id> --output-format stream-json`
- Session preserves full conversation history - agent continues where it left off

### Process Monitoring (Failure Detection)

- CLI reads agent stdout as newline-delimited JSON (`stream-json` format)
- CLI detects: activity (agent working), completion (stream ends), errors (in stream)
- If process exits WITHOUT signal file → CLI treats as crash/error
- If no output for X minutes → CLI treats as stuck, can kill and surface to user
- These are CLI-side concerns, separate from agent signals

---

## Signal Types

Four universal signals that all agents use:

| Signal                | Description                             | CLI Action                                       |
|-----------------------|-----------------------------------------|--------------------------------------------------|
| `complete`            | Step finished successfully              | Move to next phase                               |
| `partially-complete`  | Ran out of context window               | Spawn same agent type to continue where left off |
| `needs-user-input`    | Blocked in a way only human can resolve | Prompt user, resume session with answer          |
| `needs-role-followup` | Needs different role to act first       | Spawn specified role, then resume                |

### Signal Payloads

**`complete`**

```typescript
{
    signal: 'complete',
        stepId
:
    string,
        summary
:
    string  // What was accomplished
}
```

**`partially-complete`**

```typescript
{
    signal: 'partially-complete',
        stepId
:
    string,
        progress
:
    string,      // What was done
        continuationPoint
:
    string  // Where to pick up
}
```

**`needs-user-input`**

```typescript
{
    signal: 'needs-user-input',
        stepId
:
    string,
        question
:
    string,
        context
:
    string
    // Always resumes after user responds - no flag needed
}
```

**`needs-role-followup`**

```typescript
{
    signal: 'needs-role-followup',
        stepId
:
    string,
        targetRole
:
    'pathseeker' | 'codeweaver' | 'siegemaster' | 'lawbringer' | 'spiritmender',
        reason
:
    string,
        context
:
    string,
        resume
:
    boolean  // true = resume this session after target role completes, false = don't resume
}
```

The `resume` flag creates dependency chains:

- `resume: true` → CLI kills current agent, handles the need, then resumes this session with `--resume <session_id>`
- `resume: false` → CLI kills current agent, handles the need, then continues flow without resuming (e.g., Lawbringer
  hands off to Spiritmender and doesn't need to come back)

---

## Agent Roles

### ChaosWhisperer - BDD Requirements Architect

- **Owns:** BDD requirements, contexts, observables
- **Spawns after:** User request
- **Rarely revisited** - requirements are locked down upfront
- **Can signal:** `complete`, `needs-user-input`

### PathSeeker - File Mapper / Step Generator

- **Owns:** File mapping, step breakdown
- **Spawns after:** ChaosWhisperer completes OR when other agents need step restructuring
- **Primary routing target** - most things route back here, not ChaosWhisperer
- **Can signal:** `complete`, `partially-complete`, `needs-user-input`, `needs-role-followup`

### Codeweaver - Implementation

- **Owns:** Writing code, unit tests
- **Spawns after:** PathSeeker completes
- **Has minion capabilities** for minor fixes or exploratories
- **Can signal:** `complete`, `partially-complete`, `needs-user-input`, `needs-role-followup`
- **Common followups:** PathSeeker (step split), Spiritmender (lint errors)

### Siegemaster - Edge Case Testing

- **Owns:** Edge case coverage, stress testing, manual BDD runs
- **Spawns after:** Codeweaver completes + Ward passes
- **Can signal:** `complete`, `partially-complete`, `needs-role-followup`
- **Common followups:** Codeweaver (implementation gaps)

### Lawbringer - Code Review

- **Owns:** Code quality, architectural compliance
- **Spawns after:** Siegemaster completes
- **Can signal:** `complete`, `needs-role-followup`
- **Common followups:** Spiritmender (issues found)

### Spiritmender - Error Recovery

- **Owns:** Fixing lint/typecheck/test errors from Ward
- **Spawns after:** Ward fails OR Lawbringer requests
- **Can signal:** `complete`, `partially-complete`, `needs-user-input`, `needs-role-followup`
- **Common followups:** Codeweaver (needs larger refactor)

---

## Minions (Sub Agents)

Agents can spawn minions for small tasks without signaling CLI:

- Codeweaver spawns explorer minion to understand a file
- Lawbringer spawns fixer minion for trivial issues
- Spiritmender spawns analyzer minion to understand error context

Only signal CLI when:

- Step is complete
- Context is exhausted
- Need user input
- Need a full role change (not just a quick minion step)

---

## Flow Routing

```
User Request
    ↓
ChaosWhisperer (lock BDD requirements)
    ↓
PathSeeker (map files → steps)
    ↓
┌─────────────────────────────────────┐
│  Per-Step Loop (parallel slots)     │
│                                     │
│  Codeweaver → Ward → Siegemaster    │
│       ↓              ↓              │
│  (on fail)      (on gaps)           │
│       ↓              ↓              │
│  Spiritmender ← ← ← ←               │
│       ↓                             │
│  (on larger issues)                 │
│       ↓                             │
│  PathSeeker (re-split steps)        │
└─────────────────────────────────────┘
    ↓
Lawbringer (final review)
    ↓
Complete
```
