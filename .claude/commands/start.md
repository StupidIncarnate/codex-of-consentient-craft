# Welcome to Questmaestro 🗡️

You're working on Questmaestro, a fun quest-driven orchestration system that helps AI agents work together efficiently on coding tasks.

## IMPORTANT: DO NOT MAKE ASSUMPTIONS

When this command runs:
- DO NOT run any tests
- DO NOT create todo lists unless asked
- DO NOT execute any commands unless explicitly requested
- Just acknowledge the context and wait for specific instructions

This is a context file only. Wait for the user to tell you what they need.

## When doing requests for user

- Do exactly what the user asks you to do. DO NOT get ahead of yourself because you will make more work for both you and the user.
- If a request is ambiguous, ASK for clarification. DO NOT assume anything.

## Quick Context

This is an **npm package** that users install via `npx questmaestro` to add quest-themed slash commands to their Claude setup. It transforms development tasks into epic quests with a fellowship of specialized AI agents.

## Project Goal

Create a delightful, easy-to-use orchestration system that:
- Makes AI coding sessions 3x more efficient through parallel agent execution
- Feels fun and engaging with medieval quest theming
- Works with any project type through flexible configuration
- Builds up knowledge over time in the "lore" system

## Key Concepts

### The Quest System
- **Quests** = Development tasks (bugs, features, etc.)
- **Quest Tracker** = JSON file managing quest backlog and progress
- **Quest Log** = Real-time markdown updates from agents
- **Lore** = Accumulated wisdom from past quests (errors, patterns, gotchas)

### The Fellowship
- **Questmaestro** - Main orchestrator that manages quests
- **Pathseeker** - Explores and maps dependencies
- **Codeweaver** - Implements services/components (can work in parallel!)
- **Lawbringer** - Reviews code quality
- **Siegemaster** - Creates integration tests
- **Spiritmender** - Fixes build errors
- **Taskweaver** - Creates quest definitions from user requests

### Ward Commands
- `ward` = Lint/typecheck a single file (protection spell)
- `ward:all` = Validate entire codebase
- Users configure these in `.questmaestro` for their project

## Project Structure

```
/src/
  /commands/        # Agent prompt templates
    questmaestro.md
    /quest/
      *.md         # Sub-agent prompts
  /templates/      # Files copied during installation
/bin/
  install.js       # NPX installation script
```

## Current State

We've recently:
- Simplified from complex task system to flexible quest system
- Replaced hardcoded commands (atomtegrity/tegrity) with configurable ward commands
- Created templates for quest tracking and lore accumulation
- Built npx installer that sets up everything

## When Working on This Project

1. **Read the README.md** - Understand the user-facing functionality
2. **Check /src/commands/questmaestro.md** - See how orchestration works
3. **Review quest agent prompts** - Understand each agent's role
4. **Test changes** - Ensure npx installation still works correctly

## Key Principles

1. **Keep it Fun** - Medieval quest theme throughout
2. **Keep it Simple** - Users just run `npx questmaestro`
3. **Keep it Flexible** - Works with any project structure
4. **Natural Language** - No rigid command formats
5. **Parallel When Possible** - Multiple agents working simultaneously

## Common Tasks

### Adding New Features
1. Consider if it fits the quest metaphor
2. Update relevant agent prompts
3. Update installation script if needed
4. Test the full flow

### Fixing Issues
1. Check if it's a prompt issue or structural issue
2. Update terminology to stay consistent
3. Ensure backward compatibility

### Testing
```bash
# Test installation locally
node bin/install.js

# Check created structure
ls -la .claude/commands/
ls -la questmaestro/
```

## CRITICAL: Writing Tests for Questmaestro

When writing integration or E2E tests for questmaestro functionality, you MUST use the Quest State Machine system. This ensures tests accurately reflect real quest states and are maintainable.

### Why Use the State Machine?

1. **Realistic Test Environments**: Manually creating quest JSON objects often results in invalid or unrealistic states
2. **Organic State Flow**: Real quests go through phases in order - the state machine enforces this
3. **Type Safety**: TypeScript enums and interfaces prevent invalid configurations
4. **Consistency**: All tests use the same patterns and structures

### The Quest State Machine System

Located in `tests/utils/`:
- **quest-state-machine.ts** - Core types, enums, state transitions, and validation
- **quest-state-options.ts** - Templates for components, agent reports, and file generation
- **quest-state-builder.ts** - Main builder class that creates test environments

### How to Write Tests

1. **Import the State Machine:**
```typescript
import { QuestStateBuilder } from '../utils/quest-state-builder';
import { PhaseStatus, ComponentStatus, QuestStatus } from '../utils/quest-state-machine';
```

2. **Create Test Environment:**
```typescript
test('questmaestro spawns Lawbringer after implementation', async () => {
  // Create project
  project = await bootstrapper.createSimpleProject('test-name');
  
  // Use state builder to set up quest
  const builder = new QuestStateBuilder(project.rootDir, 'Review Feature');
  await builder
    .inCodeweaverState(PhaseStatus.COMPLETE)  // Automatically creates all previous states!
    .prepareTestEnvironment();
  
  // Now test questmaestro behavior
  const result = await runner.executeCommand('/questmaestro', '', {
    killOnMatch: 'Lawbringer'
  });
  
  expect(result.stdout).toContain('Lawbringer');
});
```

### Key Concept: Organic State Buildup

When you call `.inLawbringerState()`, the builder automatically:
1. Creates a quest via Taskweaver
2. Runs discovery via Pathseeker  
3. Implements components via Codeweaver
4. THEN sets up for Lawbringer

This mirrors how quests actually progress!

### State Builder Methods

Each method configures a specific phase:
- `inTaskweaverState(status)` - Quest creation
- `inPathseekerState(status, options)` - Discovery phase
- `inCodeweaverState(status, options)` - Implementation 
- `inLawbringerState(status, options)` - Code review
- `inSiegemasterState(status, options)` - Testing
- `inSpiritMenderState(resolved, options)` - Error fixing
- `inCompletedState()` - Quest completion
- `inAbandonedState(reason)` - Quest abandonment

### Configuration Options

```typescript
// Test partial implementation
.inCodeweaverState(PhaseStatus.IN_PROGRESS, {
  partialOnly: true  // Only implements components without dependencies
})

// Test error scenarios
.inLawbringerState(PhaseStatus.COMPLETE, {
  withErrors: true,  // Injects review issues
  reviewIssues: [
    { severity: 'major', file: 'src/api.ts', message: 'Type error' }
  ]
})

// Test custom components
.inPathseekerState(PhaseStatus.COMPLETE, {
  customComponents: [
    { name: 'auth', description: 'authentication service' },
    { name: 'database', description: 'database layer', dependencies: ['auth'] }
  ]
})
```

### What Gets Created

The state builder creates:
- Quest JSON files in proper directory structure
- Agent report history (as if agents really ran)
- TypeScript implementation files with actual code
- Test files where appropriate
- Proper quest-tracker.json
- Activity logs with timestamps

### Example: Testing Parallel Execution

```typescript
test('spawns parallel Codeweavers for independent components', async () => {
  const builder = new QuestStateBuilder(project.rootDir, 'Create Services');
  
  // Set up quest with multiple independent components
  await builder
    .inPathseekerState(PhaseStatus.COMPLETE, {
      customComponents: [
        { name: 'userService', description: 'user management' },
        { name: 'productService', description: 'product catalog' },
        { name: 'orderService', description: 'order processing' }
      ]
    })
    .prepareTestEnvironment();
  
  const result = await runner.executeCommand('/questmaestro', '', {
    killOnMatch: 'parallel'
  });
  
  expect(result.stdout).toContain('multiple Codeweavers');
});
```

### Common Mistakes to Avoid

❌ **DON'T** manually create quest objects:
```typescript
// BAD - This creates unrealistic state
const quest = {
  phases: { implementation: { status: 'complete' } }
};
```

✅ **DO** use the state builder:
```typescript
// GOOD - Creates valid, complete state
await builder.inCodeweaverState(PhaseStatus.COMPLETE).prepareTestEnvironment();
```

❌ **DON'T** write files directly:
```typescript
// BAD - Doesn't include proper quest tracking
fs.writeFileSync('src/api.ts', 'export function api() {}');
```

✅ **DO** let the builder handle files:
```typescript
// GOOD - Creates files with proper quest association
await builder.inCodeweaverState(PhaseStatus.COMPLETE).prepareTestEnvironment();
// Files are automatically created with realistic content
```

### Testing Different Scenarios

**Blocked Quest:**
```typescript
.inSiegemasterState(PhaseStatus.BLOCKED, {
  errorMessage: 'Tests failing: Cannot connect to database'
})
```

**Partial Implementation:**
```typescript
.inCodeweaverState(PhaseStatus.IN_PROGRESS, {
  partialOnly: true  // Only non-dependent components done
})
```

**Quest with Dependencies:**
```typescript
.inPathseekerState(PhaseStatus.COMPLETE, {
  customComponents: [
    { name: 'config', description: 'configuration' },
    { name: 'logger', description: 'logging', dependencies: ['config'] }
  ]
})
```

### Remember

- All files are TypeScript (`.ts` extension)
- States build organically (can't skip phases)
- Agent reports are included automatically
- The builder validates state transitions
- Use `killOnMatch` to stop tests early

This system ensures your tests accurately reflect how questmaestro works in production!

## Important Notes

- We use `$ARGUMENTS` in agent prompts for Questmaestro to inject context
- The system is file-based (no databases or external services)
- Agents are "one-and-done" - they execute once and terminate
- Quest tracking happens through JSON files in the questmaestro/ folder

## Need Help?

- Check `/info/ORCHESTRATION-GUIDE.md` for system overview
- Review example quests in `/src/templates/quest-tracker.json`
- Look at lore categories in `/src/templates/lore-categories.md`

Welcome to the fellowship! May your quests be swift and your builds always green! ⚔️✨