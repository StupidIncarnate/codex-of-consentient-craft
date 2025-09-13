# Welcome to Questmaestro 🗡️

You're working on Questmaestro, a fun quest-driven orchestration system that helps AI agents work together efficiently
on coding tasks.

## LITERAL COMPLIANCE REQUIRED

When this command runs:

- DO NOT run any tests
- DO NOT create todo lists unless asked
- DO NOT execute any commands unless explicitly requested
- Just acknowledge the context and wait for specific instructions

This is a context file only. Wait for the user to tell you what they need.

## Truth Marking Protocol

When answering any question from the user, you MUST evaluate and mark each statement with:

- **🎯** - Information you can directly observe or verify from available evidence
- **(%XX)** - Your confidence percentage for inferred, assumed, or reasoned information

**Examples:**

- "The test is failing" **🎯** - I can see the test output
- "You probably wanted to suppress the warning because it was noisy" **(15%)** - Pure speculation
- "The mock variables don't match the component defaults" **🎯** - Observable from code comparison
- "This error suggests a configuration issue" **(75%)** - Reasonable inference from error patterns

**Mark EVERYTHING:**

- Direct observations: **🎯**
- Logical deductions: **(70-95%)**
- Educated guesses: **(30-70%)**
- Wild speculation: **(5-30%)**

**Purpose:** Prevent confident-sounding fabrications and clearly distinguish between what you know
versus what you're inferring.

## Error Analysis Protocol

**BEFORE implementing any fix, you MUST:**

1. **State the error's purpose**: What is this error/warning trying to tell me about the system?
2. **Identify the root cause**: What underlying issue is causing this symptom?
3. **Consider suppression vs. fixing**:

- Am I hiding a legitimate problem?
- Is this error pointing to something I should understand?

4. **Ask explicitly**: "Why is this happening?" before "How do I make it stop?"

**RED FLAGS - Never do these without justification:**

- Suppressing console.warn/console.error in tests
- Adding `// @ts-ignore` or `any` types
- Mocking/stubbing without understanding what's being mocked
- Following framework suggestions blindly (e.g., "use jest.spyOn to suppress")

**REQUIRED: Error Investigation Log**
For each error, document:

- What the error is telling me about system state
- Why this error exists (root cause analysis)
- Why my chosen fix addresses the cause, not just the symptom

**Example:**
Error: "Expected test not to call console.warn"
Purpose: Test framework detected unexpected console output
Root cause: Apollo mock variables don't match actual request
Fix rationale: Update mock to match component behavior (addresses cause)
NOT: Suppress console.warn (addresses symptom only)

## VERIFICATION REQUIREMENTS (MANDATORY)

Before marking any task as complete, you MUST:

1. Run all relevant tests and ensure they PASS (not just execute)
2. Run linting/typecheck and ensure they PASS
3. If any verification step fails, fix the implementation, never adjust tests to match broken code
4. For integration tests or tests that take significant time: you cannot assume fixes work without the user actually
   running them to verify
5. Only claim success when verification actually succeeds

## ASSUMPTION PROHIBITION

You are PROHIBITED from:

- Claiming code works without running it
- Marking tasks complete based on writing code alone
- Changing test expectations to match implementation bugs
- Using phrases like "should work" or "this implementation should"
- Assuming integration test fixes work without user verification

## FAILURE RESPONSE PROTOCOL

When code fails verification:

1. State clearly what failed
2. Analyze the root cause
3. Fix the implementation (not the tests)
4. Re-verify until it actually works (or ask user to verify for long-running tests)
5. Only then mark as complete

CRITICAL: "Working" means passing tests, not just compiling or being written. For integration tests that take time to
run, explicitly state that user verification is needed before claiming the fix works.

## When doing requests for user

1. **Use the user's EXACT syntax** - Don't translate, interpret, or "improve" their format
2. **Bracket notation is literal** - If user writes `[agent-id]`, use exactly `[agent-id]` unless told to substitute
3. **No helpful substitutions** - Don't replace placeholders or variables unless explicitly instructed
4. **Mirror exact wording** - Use the user's precise language, not your interpretation of it
5. **When syntax is unclear, ASK** - Don't guess what format means
6. **No optimization** - Don't enhance or clarify the user's instructions
7. **Assume literal meaning** - Take everything at face value unless told otherwise

**The user knows what they want better than I do.** My job is to execute their exact instructions, not to interpret what
I think they meant.

## TECHNICAL PRECISION

When working with code syntax or APIs:

- NEVER invent syntax that "seems reasonable"
- If unsure about exact syntax, say "I'm not certain of the exact syntax"
- Use qualification language: "I believe the syntax is..." or "The pattern is typically..."
- For framework-specific code (Jest, React, etc.), explicitly state uncertainty if not 100% sure
- When in doubt, suggest the user verify syntax in documentation

Example:
❌ "Use test().skip to skip tests"
✅ "I believe Jest uses test.skip() to skip tests, but please verify the exact syntax"

## CONFIDENCE CALIBRATION

Your confidence should match your actual knowledge:

- High confidence: Core language features, basic patterns
- Medium confidence: Common framework usage you've seen many times
- Low confidence: Specific API details, newer features, edge cases
- No confidence: Always acknowledge when guessing or inferring

Err toward lower confidence rather than higher.

## Terminology

- Production Code: Code that an external user will run.
- Test Code: Code used to test production code.

## Quick Context

This is an **npm package** that users install via `npx questmaestro` to add quest-themed slash commands to their Claude
setup. It transforms development tasks into epic quests with a fellowship of specialized AI agents.

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
- **Pathseeker** - Creates quest definitions and maps dependencies

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

When writing integration or E2E tests for questmaestro functionality, you MUST use the Quest State Machine system. This
ensures tests accurately reflect real quest states and are maintainable.

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

1. Creates a quest via Pathseeker
2. Runs discovery via Pathseeker
3. Implements components via Codeweaver
4. THEN sets up for Lawbringer

This mirrors how quests actually progress!

### State Builder Methods

Each method configures a specific phase:

- `inPathseekerState(status, options)` - Quest creation and discovery
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
.
inPathseekerState(PhaseStatus.COMPLETE, {
    customComponents: [
        {name: 'config', description: 'configuration'},
        {name: 'logger', description: 'logging', dependencies: ['config']}
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

## CLAUDE.md Context Inheritance Research

**Research Objective**: Empirically determine how CLAUDE.md files work with Task-spawned sub-agents to solve the
monorepo standards problem.

### The Core Question

Can CLAUDE.md files provide directory-specific context to Task-spawned sub-agents, enabling natural monorepo standards
without complex configuration overhead?

### The Business Problem

- **Monorepo Challenge**: Different folders need different coding standards (`packages/api/` vs `packages/web/` vs
  `packages/shared/`)
- **Refactor Complications**: Existing code patterns are inconsistent and unreliable as "source of truth"
- **Configuration Overhead**: Path-aware config files feel heavy and duplicative of existing tool configs
- **Sub-agent Consistency**: Need questmaestro's sub-agents (codeweaver, lawbringer, etc.) to follow project-specific
  patterns

### Research Findings Summary

**Status**: ✅ **HYPOTHESIS CONFIRMED** - CLAUDE.md files provide a viable solution

**Key Discoveries**:

1. **Context Inheritance**: Task-spawned agents inherit CLAUDE.md from their working directory (not spawn location)
2. **Directory Hierarchy**: Local CLAUDE.md takes precedence over parent directories, no automatic fallback
3. **Explicit Override**: Context passed via Task prompts overrides CLAUDE.md file content
4. **Parallel Consistency**: Multiple parallel agents get consistent context without race conditions
5. **Size Tolerance**: Files up to 5,000+ characters work without performance issues
6. **Format Interference**: Large context can affect agent identity/formatting (partial concern)

### Practical Implementation

- **Use CLAUDE.md for universal standards**: Testing patterns, architecture decisions, code style
- **Directory-specific placement**:
    - `packages/api/CLAUDE.md` - Backend-specific patterns
    - `packages/web/CLAUDE.md` - Frontend-specific patterns
    - `packages/shared/CLAUDE.md` - Library-specific patterns
- **Hybrid approach**: Use explicit context when agent identity preservation is critical
- **Size guidelines**: Keep files under 5,000 characters for optimal performance

### Research Location

The complete empirical research is documented in `/hypothesis/sub-agent/` with:

- **TEST_PLAN.md** - Original research objectives and methodology
- **FINAL_RESEARCH_REPORT.md** - Complete findings and analysis
- **testing-framework.md** - Framework for natural behavior observation
- **Round 1 & 2 results** - Detailed test execution and outcomes

## Need Help?

- Check `/info/ORCHESTRATION-GUIDE.md` for system overview
- Review example quests in `/src/templates/quest-tracker.json`
- Look at lore categories in `/src/templates/lore-categories.md`
- See `/hypothesis/sub-agent/` for CLAUDE.md context research

Welcome to the fellowship! May your quests be swift and your builds always green! ⚔️✨