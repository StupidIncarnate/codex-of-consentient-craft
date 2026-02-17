# Quest Orchestration Guide

This guide explains how the Quest system orchestrates specialized AI agents to complete development quests efficiently.

## System Overview

The Quest system introduces:

1. **Discovery-First Architecture**: Analyze before implementing
2. **Specialized Quest Agents**: Each agent has a focused role
3. **Parallel Execution**: Multiple agents work simultaneously where safe
4. **Quest-Based Coordination**: JSON files track quest progress
5. **Flexible Testing**: Configure your preferred test framework

## The Fellowship

### Pathseeker (Discovery)

- **Role**: Maps quest dependencies and plans the journey
- **Output**: `discovery.json` with components and dependencies
- **Key Value**: Resolves unknowns and enables parallelization

### Codeweaver

- **Role**: Implements one specific service/component
- **Scope**: Service file + its tests
- **Key Value**: Can work in parallel with other Codeweaver

### Lawbringer (Review)

- **Role**: Reviews ALL implementations for quality
- **Scope**: Can modify any code file to fix issues
- **Key Value**: Ensures consistency across parallel work

### Siegemaster (Testing)

- **Role**: Creates integration tests
- **Scope**: Test files that verify workflows
- **Key Value**: Tests real scenarios

### Spiritmender (Healing)

- **Role**: Fixes build errors and failed tests
- **Scope**: Any file causing ward failures
- **Key Value**: Heals the codebase

### Taskweaver

- **Role**: Creates quest definitions for new work
- **Scope**: Quest descriptions and requirements
- **Key Value**: Transforms ideas into actionable quests

## Quest Execution Flow

### Phase 1: Discovery

```
Dungeonmaster → Pathseeker → discovery.json
```

- Always run first (except for trivial quests)
- Maps out the journey
- Identifies what can be done in parallel

### Phase 2: Implementation (PARALLEL)

```
Dungeonmaster → Codeweaver-1 → Service A + tests
            → Codeweaver-2 → Service B + tests
            → Codeweaver-3 → Service C + tests
```

- Multiple Codeweaver work simultaneously
- Each owns one component completely
- No file collisions possible

### Phase 3: Review

```
Dungeonmaster → Lawbringer → Review all code
```

- Reviews all parallel work
- Ensures code quality standards
- Fixes any issues found

### Phase 4: Integration Tests

```
Dungeonmaster → Siegemaster → Integration tests
```

- Tests workflows across services
- Verifies the quest requirements

### Phase 5: Validation

```
Dungeonmaster → ward
            → Spiritmender (if errors)
```

- Final validation with configured commands
- Heal any remaining issues

## Quest Structure

### Quest Files

```
/dungeonmaster/
├── active/                # Currently active quests (alphabetical order)
│   └── [quest-name]-[date].json
├── completed/             # Finished quests (local only)
│   └── [quest-name]-[date].json
├── abandoned/             # Stopped quests (local only)
│   └── [quest-name]-[date].json
├── retros/                # Retrospectives and learnings (shared via git)
│   └── [date]-[topic].md
└── lore/                  # Accumulated wisdom (shared via git)
    └── [category]-[description].md
```

### Key Files

**File-Based Quest Management**: No central tracker needed
- Quests are managed by file location in active/, completed/, abandoned/ folders
- Quest ordering is alphabetical by filename
- Session-based quest selection overrides alphabetical order

**Quest Files**: Self-contained JSON with everything
- Quest details and requirements
- All agent activity logs
- Current progress and phase
- Pathseeker's discoveries
- Decisions and blockers

## Parallelization Strategy

### Safe Parallelization

- Different services can be built simultaneously
- Independent components have separate Codeweaver
- Each agent owns specific files exclusively

### Required Sequencing

- Discovery → Implementation → Review → Test → Validate
- Each phase must complete before the next
- Ward checks between phases ensure quality

## Example Quest: User Authentication

1. **Pathseeker**: Identifies auth service, user model, JWT handling
2. **Codeweaver** (PARALLEL):
   - Codeweaver-1: AuthService + tests
   - Codeweaver-2: UserModel + tests
   - Codeweaver-3: JWTMiddleware + tests
3. **Lawbringer**: Reviews all implementations
4. **Siegemaster**: Creates auth flow integration tests
5. **Validation**: Run ward, fix if needed

## Benefits of Quest System

1. **Natural Language**: No rigid task formats
2. **Flexible Organization**: Quests adapt to your workflow
3. **Knowledge Building**: Lore accumulates wisdom
4. **Clear Progress**: Always know quest status
5. **Fun Theme**: Makes development feel epic

## Common Patterns

### Simple Quests (Skip Discovery)

- Single file changes
- Documentation updates
- Simple bug fixes
- Clear implementation path

### Complex Quests (Need Discovery)

- Multi-service features
- Architecture changes
- Integration work
- Unclear requirements

### Quest Completion

- All phases complete
- Ward:all passes
- Retrospective written
- Lore updated with learnings

## Configuration

The system adapts to your project through `.dungeonmaster`:
- Configure ward commands for your linting/testing
- Set paths for quest storage
- Define project-specific settings

This quest system maximizes efficiency while making development feel like an epic adventure!