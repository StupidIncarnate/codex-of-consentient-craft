# Questmaestro CLI Pivot Implementation Plan

## Current Project Structure Analysis

### 1. **What subdirectories exist:**
   - `src/commands/` - Contains markdown-based command definitions
     - `questmaestro.md` - Main orchestrator command
     - `quest/` subdirectory with agent commands (codeweaver, lawbringer, pathseeker, siegemaster, spiritmender, voidpoker)
   - `src/templates/` - Contains project templates
     - Quest templates (JSON)
     - Lore templates (markdown)
     - Configuration templates

### 2. **What types of files are already there:**
   - **Markdown files** (`.md`) - Agent command definitions and templates
   - **JSON files** - Quest and configuration templates
   - **No TypeScript/JavaScript source code** in the src directory currently

### 3. **Overall organization pattern:**
   - The project follows a documentation-driven approach where agent behaviors are defined in markdown files
   - Templates are separated for different purposes (quests, lore, configuration)
   - The actual TypeScript implementation code is in `bin/` and `tests/` directories
   - Core logic appears to be in test utilities that could be promoted to src

### 4. **Existing TypeScript code:**
   - Main entry point: `bin/install.ts` - Handles installation of quest commands
   - Test utilities in `tests/utils/`:
     - `quest-state-machine.ts` - Quest state management (will need significant updates)
     - `quest-state-builder.ts` - Test helper for building quest states
     - `claude-runner.ts` - E2E test runner for Claude
     - `project-bootstrapper.ts` - Test project setup
   - Integration and E2E tests demonstrate the expected functionality

### 5. **Key entry points:**
   - `bin/install.ts` - The CLI entry point that copies command files to `.claude/commands/`
   - The project is designed as an npm package that installs quest commands for Claude

### 6. **Important existing resources:**
   - `spike/claude-interactive/` - Contains working file-watcher implementation proving the pattern works
   - `cli-pivot.md` - The actual design document for the CLI transformation

## What Is Questmaestro and How It's Used

### Overview
Questmaestro is an **NPM package** that users install via `npx questmaestro` to add quest-themed slash commands to their Claude setup. It transforms development tasks into epic quests with a fellowship of specialized AI agents.

### Current State (Pre-CLI Pivot)
- **Installation**: Users run `npx questmaestro` which copies markdown command files to `.claude/commands/`
- **Usage**: Users type slash commands like `/questmaestro` or `/quest:pathseeker` in Claude
- **Purpose**: Orchestrates multiple AI agents to work on development tasks efficiently

### Planned State (Post-CLI Pivot)
- **Installation**: Same `npx questmaestro` but now installs a CLI tool
- **Usage**: `questmaestro` becomes a CLI command that spawns Claude agents programmatically
- **Purpose**: Automates agent orchestration with file-based communication and recovery

### The Agent Fellowship
1. **Voidpoker** - Project discovery (runs first if needed)
2. **Pathseeker** - Task discovery and planning
3. **Codeweaver** - Implementation (can run in parallel)
4. **Lawbringer** - Code review and standards
5. **Spiritmender** - Error fixing

### Key Innovation
The CLI pivot solves critical pain points:
- Agents can't modify their own prompts while running
- Sub-agents can't spawn more sub-agents
- No communication with agents while working
- Performance degrades with large context

The solution uses file-based signaling where agents write JSON reports to indicate completion, allowing the CLI to manage their lifecycle automatically.

## Proposed Implementation Plan

### Phase 1: Core Module Structure
Create the following TypeScript modules in `src/`:

1. **`src/core/`** - Core business logic
   - `quest-manager.ts` - Quest file management and state transitions
     - Create/load/save quest.json files in questmaestro/active/[quest-folder]/
     - Track quest status, phases, tasks, and execution history
     - Implement task dependency validation and ordering
     - Validate dependency chains and detect circular dependencies
     - Track task completion and execution order
   - `config-manager.ts` - .questmaestro configuration handling
     - Define config schema with discoveryComplete flag, ward commands
     - Load and validate user configuration
     - Default config: `{ questFolder: "questmaestro", discoveryComplete: false }`
   - `file-system.ts` - File operations wrapper
     - Create questmaestro folder structure (active/, completed/, abandoned/, retros/, lore/, discovery/)
     - Safe file operations with error handling
     - Support for moving quest folders between states

2. **`src/models/`** - TypeScript interfaces and types
   - `quest.ts` - Quest, Phase, Task interfaces
     - Task structure: id, name, type, description, dependencies, filesToCreate, filesToEdit, status
     - Quest phases: discovery, implementation, testing, review
     - Quest status: in_progress, blocked, complete, abandoned
   - `config.ts` - Configuration interfaces
   - `agent.ts` - Agent report interfaces
     - Base report: status, agentType, report, retrospectiveNotes
     - Agent-specific report structures for each agent type

3. **`src/agents/`** - Agent spawning and report parsing
   - `agent-spawner.ts` - Generic agent spawning logic
     - Read agent markdown from src/commands/quest/
     - Replace $ARGUMENTS with formatted context (see Context Templates section for exact formats)
     - Spawn claude process in interactive mode: 
       ```javascript
       const claudeProcess = spawn(claudePath, [agentRole], {
         stdio: 'inherit',
         env: process.env
       });
       ```
       Where `claudePath` is the path to claude CLI and `agentRole` is the agent markdown content
     - Monitor for report file creation every 200ms
     - Handle process lifecycle and timeouts (default 2 min, max 10 min)
     - Detect unexpected exits and trigger recovery
   - `report-parser.ts` - Parse agent outputs
     - Parse JSON reports and validate required fields: status, agentType, report
     - Extract data based on agentType
     - Validate report structure matches expected schema
   - Individual report handlers for each agent type

4. **`src/commands/`** - Command execution logic  
   - `command-router.ts` - Route questmaestro commands
     - Parse arguments to detect command type
     - Route to appropriate handler
   - `quest-commands.ts` - Implement commands
     - list: Display quests organized by status
     - abandon: Move quest to abandoned folder
     - start: Jump to specific quest by name/id
     - clean: Remove old completed/abandoned quests
     - default: Create new quest or resume existing

5. **`src/utils/`** - Utility functions
   - `logger.ts` - Colored console output with quest theming
   - `validators.ts` - Validation logic for quests, tasks, configs

### Phase 2: Refactor Existing Code
- Replace installer functionality with CLI
  - bin/install.ts becomes setup command that creates initial structure
  - Main CLI entry point handles quest orchestration
- Extract useful patterns from test utilities
  - File monitoring from spike/claude-interactive/joke-file-watcher.js
  - State validation concepts from quest-state-machine.ts
  - Quest state types and interfaces already defined
- Update agent markdown files - **CRITICAL CHANGES**:
  - Add JSON output instructions to END of each agent markdown
  - Convert Pathseeker from "Components Found" to "tasks" array format
  - Remove complex gate systems from all agents
  - Change from text reports (`=== AGENT REPORT ===`) to JSON file writes
  - Add Write tool usage: `Write("questmaestro/active/[quest]/[num]-[agent]-report.json", JSON.stringify(report))`
  - Exception: Voidpoker writes to `questmaestro/discovery/` folder

### Phase 3: CLI Enhancement
- Create main CLI executable
  - `src/cli.ts` as entry point
  - Update package.json:
    ```json
    {
      "bin": {
        "questmaestro": "./dist/cli.js"
      }
    }
    ```
- Implement quest execution engine
  - Auto-launch Voidpoker if discoveryComplete=false
  - Sequential phase execution: discovery → implementation → testing → review
  - Ward validation gates between agents
  - Spiritmender retry loop for failures
  - Agent recovery for crashed processes
  - No agent timeouts - agents run until completion or user kills them
- Quest lifecycle management
  - Create quest folders with proper structure
  - Generate quest IDs: slugify title to Windows-compatible filename
  - Move completed quests with retrospectives
  - Track execution history in quest.json

### Additional Implementation Details

**File Structure Patterns:**
- Quest folders: `{number}-{quest-title-slug}/` (e.g., `001-add-authentication/`)
- Agent reports: `{number}-{agent-type}-report.json` (e.g., `002-codeweaver-report.json`)
- Sequential numbering: 001, 002, 003... (padded to 3 digits for both quests and reports)
- Discovery reports: `questmaestro/discovery/voidpoker-{timestamp}-{package-name}-report.json`

**Agent Context Format:**
- Each agent receives context through $ARGUMENTS replacement
- Context includes quest info, task details, previous reports
- Agents write completion signal as JSON report
- See "Context Templates" section below for exact replacement formats

**Recovery Mechanisms:**
- If agent exits without report, spawn recovery agent
- For Codeweaver: Spawn Pathseeker in "recovery_assessment" mode to check partial work
- For other agents: Simply respawn with recovery context
- Track recovery attempts in quest execution log
- Recovery philosophy: The actual code files ARE the progress

**Ward Validation:**
- Run after each agent except Pathseeker/Voidpoker
- Execute: `npm run ward:all` (or configured ward commands)
- Parse ward output to detect failures
- Spawn Spiritmender on failure (max 3 attempts)
- Block quest if Spiritmender can't fix after 3 attempts
- Save unresolved errors to `ward-errors-unresolved.txt`

### CLI Command Structure

**Main Commands:**
- `questmaestro` - Resume first active quest or create new
- `questmaestro list` - Show all quests organized by status
- `questmaestro abandon` - Abandon current quest
- `questmaestro start <quest-name>` - Jump to specific quest
- `questmaestro clean` - Remove old completed/abandoned quests
- `questmaestro <description>` - Create new quest or find existing

**Command Detection (without AI):**
```javascript
const COMMANDS = {
  'list': showQuestList,
  'abandon': abandonCurrentQuest,
  'start': (args) => startSpecificQuest(args),
  'clean': cleanOldQuests,
  default: (args) => handleQuestOrCreate(args)
};
```

### Context Templates

**Pathseeker Context:**
```
User request: [original request]
Working directory: [cwd]
Quest folder: 001-add-authentication
Report number: 001
Quest mode: creation | validation | recovery_assessment
[For validation mode, include previous task list with statuses]
```

**Codeweaver Context:**
```
Quest: [quest title]
Quest folder: 001-add-authentication
Report number: 002
Task: {
  "id": "create-auth-service",
  "name": "CreateAuthService",
  "description": "Create authentication service with JWT handling",
  "filesToCreate": ["src/auth/auth-service.ts", "src/auth/auth-service.test.ts"],
  "filesToEdit": []
}
Ward commands: npm run ward:all
```

**Spiritmender Context:**
```
Quest: [quest title]
Quest folder: 001-add-authentication
Report number: 006
Ward errors: [full error output from ward:all]
Error type: lint | typecheck | test | build
Failed files: [files with errors]
Attempt number: [1-3]
Previous attempts: [array of previous spiritmender reports if any]
```

### Quest Execution Flow

**Sequential Only** - One agent at a time (no parallel execution in MVP)

1. **Auto-launch Voidpoker** if discoveryComplete=false
2. **Parse command** and route to appropriate handler
3. **Execute quest phases** in order:
   - Discovery (Pathseeker)
   - Implementation (Codeweaver - one task at a time)
   - Testing (Siegemaster)
   - Review (Lawbringer)
4. **Ward validation** after each agent (except Pathseeker/Voidpoker)
5. **Spiritmender** if ward fails (max 3 attempts)
6. **Complete quest** when all phases done and ward passes

### Agent Report JSON Formats

**Base Report Structure (all agents):**
```json
{
  "status": "complete | blocked | error",
  "blockReason": "if blocked, describe what you need",
  "agentType": "pathseeker | codeweaver | siegemaster | lawbringer | spiritmender",
  "taskId": "[task-id-if-applicable]",
  "report": { /* agent-specific data */ },
  "retrospectiveNotes": [
    {
      "category": "what_worked_well",
      "note": "Description of what went smoothly"
    }
  ]
}
```

**Pathseeker Task Format:**
```json
{
  "id": "create-auth-service",
  "name": "CreateAuthService", 
  "type": "implementation",
  "description": "Create authentication service with JWT handling",
  "dependencies": ["create-auth-interface"],
  "filesToCreate": ["src/auth/auth-service.ts"],
  "filesToEdit": ["src/app.ts"],
  "testTechnology": "jest" // if type is "testing"
}
```

**Quest.json Structure:**
```json
{
  "id": "add-authentication",
  "folder": "001-add-authentication",
  "title": "Add User Authentication",
  "status": "in_progress",
  "createdAt": "2024-03-15T10:00:00Z",
  "phases": {
    "discovery": { "status": "complete", "report": "001-pathseeker-report.json" },
    "implementation": { "status": "in_progress", "progress": "2/4" },
    "testing": { "status": "pending" },
    "review": { "status": "pending" }
  },
  "executionLog": [
    { "report": "001-pathseeker-report.json", "taskId": null, "timestamp": "..." }
  ],
  "tasks": [
    {
      "id": "create-auth-interface",
      "name": "CreateAuthInterface",
      "type": "implementation",
      "status": "complete",
      "dependencies": [],
      "completedBy": "002-codeweaver-report.json"
    }
  ]
}
```

### Post-MVP Features

These features are documented but will be implemented after MVP:

**Concurrent Quest Prevention:**
- Lock file mechanism to prevent multiple CLI instances
- Write PID to `.questmaestro/questmaestro.lock`
- Check if process still alive before refusing to start

**Parallel Agent Execution:**
- Run multiple independent Codeweavers simultaneously
- Requires careful file locking to prevent conflicts
- Could significantly speed up large quests

**Git Integration:**
- Auto-commit after successful ward validation
- Branch management for quests
- PR creation from completed quests

### Additional Notes

**Config File Location:**
- Handled by install.ts - creates .questmaestro in project root
- Creates questmaestro/ folder structure on install

**Lore Organization:**
- Agents write to `questmaestro/lore/` for discovered patterns
- Filename format: `[category]-[description].md`
- Categories: architecture, integration, discovery, etc.

**Claude CLI Detection:**
- install.ts should check for .claude folder existence
- If present, user has already used Claude and is logged in
- Claude path found via system PATH

**Unit Testing:**
- Focus on unit tests with mocks for MVP
- Integration and E2E tests deferred post-MVP

This approach will:
- Create a standalone CLI tool for quest orchestration
- Enable automatic agent chaining without manual intervention
- Provide robust error handling and recovery
- Maintain the fun quest theming throughout