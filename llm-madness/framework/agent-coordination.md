# Agent Coordination

How specialized agents collaborate without conflicts through stateless orchestration and fresh context isolation.

## Theoretical Foundation

**The LLM Coordination Problem**: Multiple LLMs working on the same codebase tend to:
- Make incompatible assumptions about architecture
- Override each other's implementation decisions  
- Create integration conflicts when merging work
- Accumulate context that leads to confused state

**The Solution**: **Stateless orchestration** where agents never directly communicate but coordinate through:
- JSON reports to the orchestration engine
- Fresh context per agent spawn
- Explicit dependency chains
- Non-overlapping file ownership

## The Questmaestro Coordination Model

### Orchestration Engine (Questmaestro Node CLI)

**Role**: Stateless coordinator that:
- Maintains quest state in JSON files
- Spawns fresh Claude instances with specific roles
- Routes outputs between agents without context accumulation
- Manages parallel agent execution and dependencies
- Handles escape hatch triggers and re-spawning

**Key Insight**: The orchestrator has **no AI intelligence** - it's pure state management and agent lifecycle control.

### Agent Communication Pattern

```
Agent A (Fresh Context) → JSON Report → Questmaestro → Agent B (Fresh Context)
```

**Never**:
```
Agent A ←→ Agent B (Direct Communication)
Agent A → Agent B → Agent C (Context Chain)
```

### Specialized Agent Roles

**Pathseeker (Discovery)**:
- **Input**: User request + quest context
- **Output**: Observable atomic actions + task decomposition
- **File Ownership**: Read-only analysis, writes discovery JSON

**Codeweaver (Implementation)**:
- **Input**: Single task definition + project context
- **Output**: Implementation + test files
- **File Ownership**: Exclusive write access to assigned files

**Lawbringer (Review)**:
- **Input**: All parallel implementation outputs
- **Output**: Consistency fixes + quality improvements  
- **File Ownership**: Can modify any file for quality/consistency

**Siegemaster (Integration)**:
- **Input**: Completed implementations
- **Output**: Integration test files
- **File Ownership**: Creates new test files only

**Spiritmender (Healing)**:
- **Input**: Build/test failures + error context
- **Output**: Fixed code + healing report
- **File Ownership**: Can modify any file to fix errors

## Parallel Execution Strategy

### Safe Parallelization

**Codeweaver agents can run simultaneously when**:
- Working on different files (no write conflicts)
- Implementing independent observable actions
- Have clear interface contracts from Pathseeker

**Example**:
```json
{
  "codeweaver-1": {
    "task": "User can register with email",
    "files": ["src/auth/registration.ts", "src/auth/registration.test.ts"]
  },
  "codeweaver-2": {
    "task": "User can reset password", 
    "files": ["src/auth/password-reset.ts", "src/auth/password-reset.test.ts"]
  }
}
```

### Preventing Conflicts

**1. File Ownership Assignment**
- Pathseeker assigns exclusive file ownership per task
- No two agents can write to the same file simultaneously
- Questmaestro enforces this through task scheduling

**2. Interface Contracts**
- Pathseeker defines shared interfaces/types needed between tasks
- Agents implement to contracts, not by discovery
- Reduces assumption mismatches

**3. Dependency Sequencing**  
- Tasks with dependencies run sequentially
- Parallel tasks have zero dependencies
- Questmaestro manages execution order

### Integration Points

**Shared Dependencies**:
```json
{
  "sharedTypes": {
    "User interface": "defined by Pathseeker",
    "AuthResult type": "defined by Pathseeker"
  },
  "integrationPoints": {
    "auth routes": "registration + login both modify routes/auth.ts",
    "user service": "multiple features depend on user-service.ts"
  }
}
```

**Resolution**: Sequential execution for shared files, parallel for independent files.

## Agent Lifecycle Management

### Fresh Context Spawning

Each agent spawn gets:
```json
{
  "role": "codeweaver",
  "task": "specific_task_definition",
  "projectContext": "relevant_files_and_patterns",
  "constraints": "file_ownership_and_dependencies",
  "escapeHatch": "failure_reporting_mechanism"
}
```

**Critical**: No conversation history, no previous agent context, no accumulated state.

### Agent Completion

Agent completes by writing JSON report:
```json
{
  "status": "complete|blocked|failed",
  "output": "files_created_or_modified",
  "report": "what_was_accomplished",
  "nextSteps": "dependencies_or_blockers",
  "retro": "insights_for_system_learning"
}
```

Agent process **dies immediately** after report. No state preservation.

### Escape Hatch Mechanisms

**Triggers for Agent Escape**:
- Context window approaching limits
- Task complexity exceeds agent capability
- Unexpected dependencies discovered
- Integration conflicts detected
- Repeated failure cycles

**Escape Process**:
1. Agent stops work immediately
2. Reports current state + failure analysis
3. Agent process terminates
4. Questmaestro spawns fresh Pathseeker with failure context
5. Re-decomposition cycle begins

## Sub-Agent Coordination

### When Parent Agents Spawn Sub-Agents

**Decision Point**: At start of context window
- **Self-Execute**: Task fits within agent capability
- **Delegate**: Task needs parallel analysis or decomposition

**Sub-Agent Spawning Pattern**:
```json
{
  "decision": "delegate",
  "subAgents": [
    {
      "task": "analyze_existing_auth_patterns",
      "scope": "discovery_only"
    },
    {
      "task": "identify_integration_points", 
      "scope": "discovery_only"
    }
  ]
}
```

### Sub-Agent Limitations

**One Level Deep**: Sub-agents cannot spawn their own sub-agents
**Specialized Scope**: Sub-agents do discovery/analysis only, no implementation
**Parent Synthesis**: Parent agent synthesizes sub-agent outputs

### Coordination Example

```
Pathseeker Assessment:
├── Can I map this quest myself? NO
├── Spawn Sub-Agents:
│   ├── Sub-Agent 1: Analyze existing auth code
│   ├── Sub-Agent 2: Research integration patterns  
│   └── Sub-Agent 3: Identify technical dependencies
├── Synthesize Results: Combine findings
└── Output: Complete task decomposition
```

## Failure Recovery Patterns

### Agent Failure Categories

**1. Task Complexity Failure**
- Agent realizes task is too large
- Reports decomposition recommendations
- Triggers fresh Pathseeker spawn

**2. Integration Conflict**
- Agent discovers incompatible assumptions
- Reports specific conflict details
- May trigger architecture review

**3. Context Exhaustion**
- Agent approaching context limits
- Reports partial progress + stopping point
- Triggers task splitting

### Recovery Coordination

**Failed Agent Process**:
1. Agent reports failure + context
2. Agent process terminates
3. Questmaestro preserves failure report
4. Fresh agent spawned with failure context
5. No contaminated context carries forward

**Parallel Agent Impact**:
- Failing agent doesn't affect parallel agents
- Successful agents continue to completion
- Failed work doesn't block independent progress

## Communication Protocols

### JSON Report Standards

**All agents output structured reports**:
```json
{
  "agentType": "codeweaver|pathseeker|lawbringer|siegemaster|spiritmender",
  "status": "complete|blocked|failed",
  "task": "original_task_definition",
  "output": {
    "filesCreated": ["file1.ts", "file2.test.ts"],
    "filesModified": ["existing.ts"],
    "interfaces": ["defined_types"],
    "integrationPoints": ["identified_connections"]
  },
  "report": "narrative_of_work_completed",
  "blockers": "specific_issues_preventing_completion",
  "recommendations": "suggested_next_steps",
  "retro": "insights_for_system_improvement"
}
```

### No Direct Agent Communication

**Forbidden Patterns**:
- Agent A calling Agent B directly
- Shared state between agents
- Context inheritance across agent spawns
- Agent memory of previous interactions

**Required Pattern**:
- Agent → JSON Report → Questmaestro → Next Agent
- Fresh context per spawn
- State maintained only in quest JSON files

## Quality Assurance Through Coordination

### Multi-Agent Review Process

**Implementation → Review → Integration → Validation**:

1. **Parallel Codeweaver**: Implement independent features
2. **Lawbringer Review**: Check all implementations for consistency
3. **Siegemaster Integration**: Test feature interactions  
4. **Spiritmender Healing**: Fix any conflicts or errors

Each phase uses **fresh agents** with **specific scopes** to avoid context contamination.

### Continuous Integration Points

**After Each Phase**:
- Ward:all validation (automated checks)
- Integration conflict detection
- Quality gate enforcement
- Progress state updates

**Failure Recovery**:
- Isolated agent failure doesn't cascade
- Fresh agent spawns for retry attempts
- System learns from failure patterns

The coordination model ensures **agents collaborate effectively** while **never sharing corrupted context**, enabling reliable parallel development with systematic quality assurance.