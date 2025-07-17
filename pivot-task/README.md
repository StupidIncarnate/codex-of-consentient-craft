# Questmaestro CLI Pivot Implementation Plan

This folder contains a comprehensive implementation plan for pivoting Questmaestro from a web-based interface to a CLI tool. The plan is designed to enable an AI to implement the entire pivot by following tasks sequentially.

## Overview

The Questmaestro CLI will orchestrate AI agents through file-based communication, managing quest workflows from discovery through implementation, testing, and review.

### Core Architecture Changes

1. **From Web to CLI**: Replace Express/WebSocket with a command-line interface
2. **File-Based Communication**: Agents communicate via JSON reports in the filesystem
3. **Sequential Execution**: One agent at a time with ward validation gates
4. **Simplified Agents**: Remove complex gate systems, focus on core purposes

### Directory Structure

```
questmaestro/
├── discovery/          # Voidpoker project discovery reports
├── active/             # Currently active quest folders
├── completed/          # Finished quest folders
├── abandoned/          # Stopped quest folders
├── retros/             # Quest retrospectives
└── lore/               # Accumulated wisdom and gotchas
```

## Task List

### Phase 1: Core CLI Setup
- [01-cli-setup.md](01-cli-setup.md) - Create CLI entry point and command parsing
- [02-project-structure.md](02-project-structure.md) - Set up questmaestro directory structure
- [03-config-management.md](03-config-management.md) - Implement .questmaestro config file

### Phase 2: Quest Management
- [04-quest-model.md](04-quest-model.md) - Create quest data model and storage
- [05-quest-commands.md](05-quest-commands.md) - Implement list, abandon, reorder commands
- [06-quest-execution.md](06-quest-execution.md) - Build main quest execution flow

### Phase 3: Agent Communication
- [07-agent-spawning.md](07-agent-spawning.md) - Implement agent spawning and monitoring
- [08-report-parsing.md](08-report-parsing.md) - Create report parsing and validation
- [09-agent-recovery.md](09-agent-recovery.md) - Handle agent failures and recovery

### Phase 4: Agent Updates
- [10-agent-prompts.md](10-agent-prompts.md) - Add output instructions to all agents
- [11-pathseeker-updates.md](11-pathseeker-updates.md) - Convert Pathseeker to task-based output
- [12-codeweaver-updates.md](12-codeweaver-updates.md) - Simplify Codeweaver for single tasks
- [13-other-agents.md](13-other-agents.md) - Update Siegemaster, Lawbringer, Spiritmender

### Phase 5: Project Discovery
- [14-voidpoker-integration.md](14-voidpoker-integration.md) - Auto-launch project discovery
- [15-discovery-validation.md](15-discovery-validation.md) - Verify ward commands and CLAUDE.md

### Phase 6: Ward Integration
- [16-ward-validation.md](16-ward-validation.md) - Implement ward:all validation gates
- [17-spiritmender-loop.md](17-spiritmender-loop.md) - Handle ward failures with Spiritmender

### Phase 7: Quest Completion
- [18-quest-completion.md](18-quest-completion.md) - Move quests to completed/abandoned
- [19-retrospectives.md](19-retrospectives.md) - Generate quest retrospectives
- [20-clean-command.md](20-clean-command.md) - Implement clean command

### Phase 8: Testing & Validation
- [21-unit-tests.md](21-unit-tests.md) - Unit tests for all modules
- [22-integration-tests.md](22-integration-tests.md) - End-to-end quest flow tests
- [23-validation-checklist.md](23-validation-checklist.md) - Final validation criteria

## Dependencies

Each task file includes specific dependencies on previous tasks. The implementation should follow the numbered sequence to ensure all prerequisites are met.

## Success Criteria

1. **CLI Functions**: All commands work as specified
2. **Agent Communication**: Agents write JSON reports successfully
3. **Quest Flow**: Complete quest from creation to completion
4. **Error Handling**: Graceful recovery from agent failures
5. **Ward Validation**: Automatic Spiritmender fixes for ward failures
6. **Test Coverage**: >80% unit test coverage
7. **Documentation**: Updated agent prompts and CLAUDE.md files

## Implementation Notes

- Start with Phase 1 to establish the CLI foundation
- Test each phase thoroughly before moving to the next
- Agent updates (Phase 4) can be done in parallel with quest management
- Keep the implementation simple - avoid over-engineering
- Focus on the happy path first, then add error handling

## File Naming Convention

- Implementation files: Use TypeScript (.ts)
- Test files: Use .test.ts suffix
- Config files: Use JSON format
- Agent reports: Use numbered JSON format (001-pathseeker-report.json)

Begin with [01-cli-setup.md](01-cli-setup.md) to start the implementation.