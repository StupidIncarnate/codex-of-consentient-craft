# Dungeonmaster Agent Framework

A practical orchestration system for reliable code generation using specialized AI agents with observable outcomes and empirical learning.

## Theoretical Foundation

LLMs excel at implementing specific behaviors but fail at:
- Making architectural decisions across multiple contexts
- Managing context accumulation over conversations
- Learning from their own mistakes
- Maintaining consistent interpretations

The solution: **Orchestrated fresh-context agents** where each agent operates as a semantic compiler for single responsibilities, coordinated by a stateless orchestration engine that learns optimal task boundaries through controlled failure.

## The Dungeonmaster System

**Dungeonmaster (Node CLI)**:
- Maintains quest state in JSON files
- Spawns fresh Claude instances with specialized roles
- Handles input/output coordination between agents
- Manages escape hatch mechanisms and re-spawning logic

**The Fellowship** (Specialized Agents):
- **Pathseeker**: Discovers observable atomic actions through user dialogue
- **Codeweaver**: Implements single components with fresh context
- **Lawbringer**: Reviews all implementations for consistency
- **Siegemaster**: Creates integration tests for workflows
- **Spiritmender**: Fixes build errors and failed tests

Each agent operates in **fresh context windows** with **single responsibilities** and **escape hatch mechanisms**.

## Core Process: Discovery Through Dialogue and Empirical Learning

```
User Request → Pathseeker Dialogue → Observable Atomic Actions
    ↓
Task Decomposition → Fresh Agent Spawning → Implementation
    ↓
Success → Continue | Failure → Escape Hatch → Re-decomposition
    ↓
System Learning Through Controlled Failure Cycles
```

### What's an Observable Atomic Action?

An **observable atomic action** is a user behavior that:
- Can be demonstrated working or not working
- Cannot be subdivided without losing meaning
- Has clear acceptance criteria
- Maps to minimal implementation scope

**Examples**:
- "User can login with valid credentials"
- "User sees error message for invalid email"  
- "User stays logged in after page refresh"

**Not Examples**:
- "Authentication system" (too broad)
- "JWT token generation" (technical, not user-observable)
- "Good user experience" (subjective, not verifiable)

## The Fail-Fast Learning Architecture

### Agent Escape Hatches

Every agent can report:
```json
{
  "status": "blocked",
  "reason": "task_too_complex",
  "recommendation": "split_into_smaller_tasks",
  "retro": "Discovered JWT integration needs separate exploration"
}
```

This triggers **fresh Pathseeker spawn** with failure context to re-decompose the quest.

### Empirical Boundary Discovery

The system learns optimal task boundaries through cycles:

1. **Initial Decomposition**: Pathseeker's best guess based on user dialogue
2. **Implementation Attempt**: Fresh agents try to execute
3. **Failure Signal**: Agent reports complexity/context limits
4. **Re-decomposition**: Fresh Pathseeker with failure context splits further
5. **Success**: System remembers working boundaries

**No pre-defined "concern" rules needed** - boundaries emerge through controlled experimentation.

### Sub-Agent Spawning

Agents can spawn sub-agents for parallel analysis:
- **Trigger**: Complexity assessment at context window start
- **Depth Limit**: One level deep (sub-agents cannot spawn sub-agents)
- **Coordination**: Parent agent synthesizes sub-agent outputs

Decision made upfront: "Can I handle this myself or need delegation?"

## Framework Documents

1. **[process-architecture.md](./process-architecture.md)** - User dialogue to working implementation
2. **[task-decomposition.md](./task-decomposition.md)** - Observable actions to implementable tasks
3. **[agent-coordination.md](./agent-coordination.md)** - How agents collaborate without conflicts
4. **[failure-learning.md](./failure-learning.md)** - Escape hatches and re-decomposition cycles
5. **[observable-behaviors.md](./observable-behaviors.md)** - Defining verifiable user outcomes
6. **[orchestration-patterns.md](./orchestration-patterns.md)** - Common quest coordination patterns
7. **[validation-pipeline.md](./validation-pipeline.md)** - Continuous verification and healing
8. **[success-criteria.md](./success-criteria.md)** - When tasks and quests are complete

## Key Principles

### 1. Observable Over Abstract
- ❌ "Good authentication system"
- ✅ "User can login and sees dashboard within 2 seconds"

### 2. Dialogue-Driven Decomposition
- ❌ Apply abstract "concern" rules to break down features
- ✅ Talk with user until observable atomic actions are clear

### 3. Fresh Context Per Agent
- ❌ Accumulating conversation context across implementations
- ✅ Each agent spawn gets clean context with specific objective

### 4. Fail-Fast Learning
- ❌ Try to prevent all failures through better planning
- ✅ Make failures productive through escape hatches and re-decomposition

### 5. Empirical Boundary Discovery
- ❌ Pre-define optimal task sizes
- ✅ Let system learn boundaries through controlled failure cycles

## What Changed From Abstract Framework

**Abandoned**:
- Generic "semantic compiler" patterns
- Abstract "concern" identification rules
- Theoretical instruction templates
- Manual context management

**Solidified Into**:

- Dungeonmaster orchestration engine
- Specialized agent roles with escape hatches
- Observable atomic action decomposition
- Empirical learning through failure cycles

## Quick Start

1. **User describes what they want** (however they express it)
2. **Pathseeker dialogue** until observable atomic actions are clear  
3. **Agent spawning** with fresh context for each action
4. **Fail-fast loops** when agents hit complexity limits
5. **System learning** improves decomposition over time

Each cycle produces **working, verified code** while the system learns better task boundaries.

## The Reality

This framework acknowledges:
- Perfect task decomposition is impossible upfront
- LLMs will fail at complex tasks regardless of prompting
- Context accumulation dooms conversational coding
- Learning happens through controlled failure, not prevention

But leverages:
- Fresh context per specialized agent
- User dialogue to discover natural boundaries
- Escape hatches to prevent death spirals
- Orchestration to coordinate without conflicts
- Empirical learning to improve over time

The goal isn't eliminating uncertainty but building systems that **learn and adapt** through controlled experimentation while delivering working software continuously.