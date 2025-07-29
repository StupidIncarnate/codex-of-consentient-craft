# Questmaestro Orchestration Flows

Complete visualization of all agent communication flows, failure handling, and recovery mechanisms in the Questmaestro system.

## Core Principles

1. **All communication goes through Questmaestro** - No direct agent-to-agent communication
2. **Fresh context for each spawn** - Agents receive only their specific task, no conversation history
3. **JSON reports only** - Agents communicate through structured JSON reports
4. **Escape hatches prevent death spirals** - Any agent can escape when hitting limits

## 1. Main Quest Flow

The standard flow from user request to completed implementation:

```mermaid
flowchart TD
    User[User Request] --> QM1{Questmaestro}
    QM1 -->|Fresh Context + Request| PS[Pathseeker]
    
    PS -->|User Dialogue| User
    User -->|Clarifications| PS
    
    PS -->|Observable Actions + Tasks JSON| QM2{Questmaestro}
    
    QM2 -->|Task 1| CW1[Codeweaver 1]
    QM2 -->|Task 2| CW2[Codeweaver 2]
    QM2 -->|Task 3| CW3[Codeweaver 3]
    
    CW1 -->|Implementation JSON| QM3{Questmaestro}
    CW2 -->|Implementation JSON| QM3
    CW3 -->|Implementation JSON| QM3
    
    QM3 -->|All Implementations| SM[Siegemaster]
    SM -->|Integration Tests JSON| QM4{Questmaestro}
    
    QM4 -->|Tested Code| LB[Lawbringer]
    LB -->|Review JSON| QM5{Questmaestro}
    
    QM5 -->|If Failures| SP[Spiritmender]
    SP -->|Fixes JSON| QM6{Questmaestro}
    
    QM6 -->|Quest Complete| User
    
    style QM1 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM2 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM3 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM4 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM5 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM6 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

## 2. Escape Hatch Flows

Any agent can trigger an escape hatch when hitting limits:

```mermaid
flowchart TD
    subgraph EscapeTriggers[Escape Triggers]
        ET1[Task Too Complex]
        ET2[Context Exhaustion]
        ET3[Unexpected Dependencies]
        ET4[Integration Conflicts]
        ET5[Repeated Failures]
    end
    
    Agent[Any Agent] --> Check{Check Limits}
    Check -->|Hitting Limit| Escape[Generate Escape Report]
    
    Escape -->|Escape JSON| QM{Questmaestro}
    
    QM -->|Fresh Context + Failure Analysis| PS[Fresh Pathseeker]
    
    PS -->|Re-decomposition| QM2{Questmaestro}
    
    QM2 -->|New Tasks| NewAgents[New Agent Spawns]
    
    ET1 --> Check
    ET2 --> Check
    ET3 --> Check
    ET4 --> Check
    ET5 --> Check
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM2 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

### Escape Report Format

```json
{
  "status": "blocked",
  "reason": "task_too_complex",
  "analysis": "Task requires 5 different integrations exceeding agent scope",
  "recommendation": "split_into_discovery_plus_implementation",
  "retro": "Authentication tasks typically need 4-5 subtasks",
  "partialWork": "Completed interface definitions before hitting complexity"
}
```

## 3. Sub-Agent Spawning Flow

Agents can spawn sub-agents for parallel analysis (one level deep only):

```mermaid
flowchart TD
    PA[Parent Agent] -->|Assess at Start| Dec{Can I handle this?}
    
    Dec -->|No - Too Complex| Spawn[Spawn Sub-Agents]
    Dec -->|Yes| Execute[Execute Task]
    
    Spawn -->|Sub-Task 1| SA1[Sub-Agent 1]
    Spawn -->|Sub-Task 2| SA2[Sub-Agent 2]
    Spawn -->|Sub-Task 3| SA3[Sub-Agent 3]
    
    SA1 -->|Analysis JSON| Collect[Parent Collects Results]
    SA2 -->|Analysis JSON| Collect
    SA3 -->|Analysis JSON| Collect
    
    Collect --> Synthesize[Parent Synthesizes]
    
    Execute -->|Result JSON| QM{Questmaestro}
    Synthesize -->|Combined JSON| QM
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

### Sub-Agent Constraints

- **One Level Deep**: Sub-agents cannot spawn their own sub-agents
- **Discovery Only**: Sub-agents analyze and report, don't implement
- **Parallel Analysis**: Multiple sub-agents can work simultaneously
- **Parent Synthesis**: Parent must combine findings into cohesive output

## 4. Parallel Codeweaver Execution

Multiple Codeweavers work on independent tasks simultaneously:

```mermaid
flowchart TD
    QM{Questmaestro} -->|Check Dependencies| Sched[Task Scheduler]
    
    Sched -->|No Dependencies| Para[Parallel Execution]
    Sched -->|Has Dependencies| Seq[Sequential Execution]
    
    Para -->|Task A: auth-service.ts| CW1[Codeweaver 1]
    Para -->|Task B: user-model.ts| CW2[Codeweaver 2]
    Para -->|Task C: validation.ts| CW3[Codeweaver 3]
    
    CW1 -->|Implementation JSON| QM2{Questmaestro}
    CW2 -->|Implementation JSON| QM2
    CW3 -->|Implementation JSON| QM2
    
    QM2 -->|All Complete| Testing[Next: Testing Phase]
    
    subgraph FileOwnership[File Ownership]
        FO1[CW1 owns auth-service.ts]
        FO2[CW2 owns user-model.ts]
        FO3[CW3 owns validation.ts]
    end
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM2 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

## 5. Integration Conflict Resolution

When parallel agents create conflicts:

```mermaid
flowchart TD
    CW1[Codeweaver 1] -->|User Interface v1| QM{Questmaestro}
    CW2[Codeweaver 2] -->|User Interface v2| QM
    
    QM -->|Both Implementations| LB[Lawbringer]
    
    LB -->|Detect Conflict| Conflict[Interface Mismatch]
    
    Conflict -->|Conflict Report| QM2{Questmaestro}
    
    QM2 -->|Two Options| Choice{Resolution Strategy}
    
    Choice -->|Minor Conflict| Fix[Lawbringer Fixes]
    Choice -->|Major Conflict| Escalate[Spawn Fresh Pathseeker]
    
    Fix -->|Standardized Code| QM3{Questmaestro}
    
    Escalate -->|Architectural Review| PS[Fresh Pathseeker]
    PS -->|New Decomposition| QM3
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM2 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM3 fill:#f9f,stroke:#333,stroke-width:4px
```

## 6. Learning Cycle Flow

How the system learns from failures and successes:

```mermaid
flowchart TD
    Agent[Any Agent] -->|Retro in JSON| QM{Questmaestro}
    
    QM -->|Collect Patterns| LP[Learning Processor]
    
    LP --> Pat1[Task Size Patterns]
    LP --> Pat2[Failure Patterns]
    LP --> Pat3[Success Patterns]
    LP --> Pat4[Integration Patterns]
    
    Pat1 -->|Update| KB[Knowledge Base]
    Pat2 -->|Update| KB
    Pat3 -->|Update| KB
    Pat4 -->|Update| KB
    
    KB -->|Apply Learning| NextPS[Next Pathseeker Spawn]
    
    NextPS -->|Better Decomposition| Better[Improved Task Boundaries]
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

### Learning Categories

```json
{
  "retrospectiveNotes": [
    {
      "category": "task_boundary_learning",
      "note": "Auth tasks in this codebase need ~100 lines per task"
    },
    {
      "category": "pattern_recognition",
      "note": "Always separate validators from business logic"
    },
    {
      "category": "failure_insights",
      "note": "Context exhausted at 300 lines of implementation"
    }
  ]
}
```

## 7. Complete Quest Lifecycle with Failures

Showing a realistic flow with escapes and recovery:

```mermaid
flowchart TD
    User[User: Add authentication] --> QM1{QM}
    
    QM1 -->|Discovery| PS1[Pathseeker]
    PS1 -->|5 tasks defined| QM2{QM}
    
    QM2 -->|Task: auth-service| CW1[Codeweaver 1]
    
    CW1 -->|ESCAPE: too_complex| QM3{QM}
    
    QM3 -->|Re-decompose| PS2[Fresh Pathseeker]
    PS2 -->|Split into 3 subtasks| QM4{QM}
    
    QM4 -->|Subtask 1| CW2[Codeweaver 2]
    QM4 -->|Subtask 2| CW3[Codeweaver 3]
    QM4 -->|Subtask 3| CW4[Codeweaver 4]
    
    CW2 -->|Complete| QM5{QM}
    CW3 -->|Complete| QM5
    CW4 -->|Complete| QM5
    
    QM5 -->|Test implementations| SM[Siegemaster]
    SM -->|Tests created| QM6{QM}
    
    QM6 -->|Review all| LB[Lawbringer]
    LB -->|Found inconsistencies| QM7{QM}
    
    QM7 -->|Fix issues| SP[Spiritmender]
    SP -->|Fixed| QM8{QM}
    
    QM8 -->|Quest Complete| User2[User: Working Auth!]
    
    style QM1 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM2 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM3 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM4 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM5 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM6 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM7 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
    style QM8 fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

## 8. Observable Action Discovery Flow

How Pathseeker discovers atomic actions through dialogue:

```mermaid
flowchart TD
    User[User: I need search] --> PS{Pathseeker}
    
    PS -->|What happens when searching?| User2[User]
    User2 -->|Type and see results| PS
    
    PS -->|What if no results?| User3[User]
    User3 -->|Show No results found| PS
    
    PS -->|How fast should results appear?| User4[User]
    User4 -->|As they type with delay| PS
    
    PS --> OA1[Observable Action 1:<br/>User sees results as they type]
    PS --> OA2[Observable Action 2:<br/>User sees No results message]
    PS --> OA3[Observable Action 3:<br/>Results appear within 300ms]
    
    OA1 --> Tasks[Task Decomposition]
    OA2 --> Tasks
    OA3 --> Tasks
    
    Tasks -->|JSON Report| QM{Questmaestro}
    
    style QM fill:#4a90e2,stroke:#333,stroke-width:4px,color:#fff
```

## Key Communication Rules

1. **No Direct Communication**: Agents never talk to each other directly
2. **JSON Only**: All communication is structured JSON reports
3. **Fresh Context**: Each spawn gets clean context, no history
4. **Escape Early**: Better to escape than get stuck
5. **Learn Always**: Every interaction provides learning data

## Failure Recovery Patterns

### Pattern 1: Task Too Complex
```
Agent realizes task is too big → Escape → Fresh Pathseeker → Smaller tasks → Success
```

### Pattern 2: Integration Conflict
```
Parallel agents conflict → Lawbringer detects → Spiritmender fixes OR Pathseeker re-architects
```

### Pattern 3: Context Exhaustion
```
Agent approaching limit → Escape with partial work → Continue from stopping point
```

### Pattern 4: Repeated Failures
```
Fix attempts fail → Escape → Pathseeker recognizes pattern → Different approach
```

## Success Indicators

- Agents complete without escaping (task size was right)
- Parallel agents integrate smoothly (good interface contracts)
- Observable actions demonstrated working (user value delivered)
- Learning improves future decomposition (fewer escapes over time)