# Orchestrating Codebase Migration to Standards

## Your Role

You are the **orchestrator**. You will NOT do the actual migration work. You will:

1. Analyze what needs to be done
2. Launch sub-agents to do the work
3. Verify the results
4. Handle any errors

## Prerequisites - DO THESE FIRST

1. Read `packages/standards/project-standards.md`
2. Read `packages/standards/testing-standards.md`
3. Ask user: "What directory should I migrate?" (e.g., `src/utils`, `src/pre-edit-lint`)

---

## Step-by-Step Orchestration Flow

### STEP 1: Launch Analysis Agent

**YOUR ACTION:** Launch ONE agent to analyze the target directory.

**Agent Prompt:**

```
Analyze the codebase directory to prepare for standards migration.

TARGET DIRECTORY: [user-specified-path]

Read packages/standards/project-standards.md and packages/standards/testing-standards.md first.

Then analyze EVERY file in the target directory:

1. List all .ts/.tsx/.js files using: fd . [target-directory] -t f -e ts -e tsx -e js

2. For EACH file found, read it completely and answer:

   **What does this file export?**
   - List all: export const, export class, export type, export function

   **For each export, classify it by BEHAVIOR (not name):**

   A. Is it a CONTRACT?
      - Returns boolean → YES
      - Type guard (value is Type) → YES
      - Zod schema (z.object) → YES
      - Validation function with no I/O → YES
      - Otherwise → NO

   B. Is it a TRANSFORMER?
      - Pure function (no I/O, no external calls) → CHECK NEXT
      - Non-boolean return → YES
      - Boolean return → NO (it's a contract)
      - Has side effects (console.log, fs, http) → NO (it's adapter/broker)

   C. Is it an ADAPTER?
      - Imports from node_modules → CHECK NEXT
      - Wraps external package (axios, fs, child_process) → YES
      - Adds policies (timeout, retry, auth) → YES
      - Contains business logic → NO (it's a broker)

   D. Is it a BROKER?
      - Calls multiple other functions → CHECK NEXT
      - Makes business decisions → YES
      - Coordinates adapters/transformers → YES
      - Just wraps one external package → NO (it's adapter)

   E. Is it a RESPONDER?
      - Accepts req/res or job parameters → YES
      - Returns JSX.Element for pages → YES
      - Otherwise → NO

   F. Is it a WIDGET?
      - Returns JSX.Element for components → YES
      - Otherwise → NO

   G. Is it a FLOW?
      - Defines routes (Router, Routes) → YES
      - Otherwise → NO

   H. Is it STATE?
      - In-memory storage only → YES
      - React context/store → YES
      - Otherwise → NO

3. For each file, map dependencies:
   - What files from target directory does it import?
   - What files import this one (consumers)?
   - Dependency level:
     * Level 0: No imports from target directory
     * Level 1: Only imports from Level 0 files
     * Level 2: Imports from Level 0-1 files
     * Level 3+: Imports from Level 0-2+ files

4. Determine new names following standards:
   - contracts/: is*, has*, can* (keep if already named this way)
   - transformers/: [purpose]Transformer (e.g., regexEscapeTransformer)
   - adapters/: [package][Export] (e.g., childProcessSpawnPromise)
   - brokers/: [domain][Action]Broker (e.g., eslintLintContentBroker)
   - responders/: [Domain][Action]Responder (PascalCase)
   - widgets/: [Name]Widget (PascalCase)

5. Determine new paths:
   - contracts/[kebab-name]/[kebab-name].ts
   - transformers/[kebab-name]/[kebab-name]-transformer.ts
   - adapters/[package]/[package]-[export].ts
   - brokers/[domain]/[action]/[domain]-[action]-broker.ts
   - responders/[domain]/[action]/[domain]-[action]-responder.ts
   - widgets/[name]/[name]-widget.tsx

6. Create migration phases:
   - Phase 1: All Level 0 files (can parallelize)
   - Phase 2: All Level 1 files (can parallelize after Phase 1)
   - Phase 3: All Level 2 files (can parallelize after Phase 2)
   - Phase N: All Level N-1 files

RETURN JSON:
{
  "summary": {
    "totalFiles": 24,
    "contracts": 5,
    "transformers": 10,
    "adapters": 1,
    "brokers": 8
  },
  "files": [
    {
      "currentPath": "src/folder/file.ts",
      "currentName": "functionName",
      "category": "transformers",
      "newPath": "src/transformers/purpose/purpose-transformer.ts",
      "newName": "purposeTransformer",
      "dependencyLevel": 0,
      "dependencies": [],
      "consumers": ["src/other.ts"],
      "reasoning": "Pure data transformation - no I/O, no side effects"
    }
  ],
  "phases": [
    {
      "phase": 1,
      "level": 0,
      "files": ["src/folder/file1.ts", "src/folder/file2.ts"],
      "canParallelize": true
    }
  ],
  "barrelFiles": ["src/folder/index.ts", "src/folder/util.ts"]
}
```

**AFTER AGENT COMPLETES:**

- Review the JSON
- Ask user: "Analysis complete. Found [N] files to migrate in [M] phases. Proceed with migration? (yes/no)"
- If user says no, STOP
- If user says yes, continue to STEP 2

---

### STEP 2: Decide Parallelization Strategy

**YOUR ACTION:** Look at the analysis JSON and decide:

**IF total files < 10:**

- Run 1 agent for all phases sequentially

**IF total files 10-30:**

- Run 2-3 agents in parallel per phase
- Split files evenly within each phase

**IF total files > 30:**

- Run 3-5 agents in parallel per phase
- Split files evenly within each phase

**IMPORTANT:** Never parallelize files from different phases (Level 0 must complete before Level 1)

---

### STEP 3: Execute Migration Phases

**FOR EACH PHASE in the analysis:**

**YOUR ACTION:** Launch migration agent(s) with this prompt:

```
Migrate files to standards-compliant structure.

FILES TO MIGRATE: [list of file paths from this phase]
CATEGORIZATION: [provide the JSON entries for these files]

Read packages/standards/project-standards.md for detailed requirements.

FOR EACH FILE:

1. CREATE NEW DIRECTORY AND FILE:
   - Use the newPath from categorization JSON
   - Create parent directories if needed

2. READ ORIGINAL FILE and UPDATE TO STANDARDS:

   JAVASCRIPT TO TYPESCRIPT CONVERSION (if source file is .js or .jsx):
   - Change file extension: .js → .ts (or .jsx → .tsx)
   - Add TypeScript type annotations to all parameters
   - Add explicit return types to all functions
   - Convert CommonJS (require/module.exports) to ES modules if present:
     * require() → import
     * module.exports → export

   REQUIRED CHANGES (for both .js and .ts files):
   - Use object destructuring: ({param1, param2}: {param1: Type; param2: Type})
   - Add explicit return type: ): ReturnType =>
   - Rename function to newName from JSON
   - Update imports to reference already-migrated dependencies

   EXCEPTION:
   - Type predicates CANNOT use destructuring:
     export const isType = (value: unknown): value is Type => { ... }

3. MOVE/EXTRACT TEST FILE:

   IF original file has ONE export (entire file being migrated):
   - Find [original-name].test.ts or [original-name].test.js
   - Convert .test.js → .test.ts if needed
   - Move entire test file to same directory as new file
   - Rename to [new-name].test.ts
   - Update all imports in test file
   - Update function name references in tests
   - Add TypeScript types to test if converting from .js

   IF original file has MULTIPLE exports (extracting one function):
   - Find [original-name].test.ts
   - Locate the describe block for THIS function only
   - Extract that describe block to new test file: [new-name].test.ts
   - Place new test file in same directory as new implementation file
   - Update imports in new test file to reference new location
   - Update function name in new test file
   - Leave other describe blocks in original test file (for functions not yet migrated)
   - Add note comment in original test: "// [functionName] migrated to [new-path]"

4. UPDATE ALL CONSUMERS:
   - Use grep to find: rg "import.*${currentName}" --type ts
   - For each consumer file:
     * Update import path to newPath
     * Update import name to newName
     * Update all call sites (function calls)

5. REMOVE FROM BARREL EXPORTS (if applicable):
   - Check if file is re-exported from index.ts or *-util.ts
   - Remove that export line
   - Note: Don't delete barrel file yet

6. DELETE ORIGINAL FILES:
   - Delete original implementation file
   - Delete original test file

RETURN:
- List of new files created (paths)
- List of consumer files updated (paths)
- List of original files deleted (paths)
- Any errors encountered

CRITICAL RULES:
- Do NOT proceed if any step fails
- Do NOT skip updating consumers
- Do NOT leave files in old location
- Run tests after migration: npm test -- [test-file-path]
```

**AFTER EACH AGENT COMPLETES:**

1. Review the agent's output
2. Check for errors
3. **IF ERRORS:** Stop and report to user: "Migration failed: [error]. How should I proceed?"
4. **IF SUCCESS:** Continue to next phase

**WAIT** for all agents in current phase to complete before starting next phase

---

### STEP 4: Cleanup Barrel Files

**YOUR ACTION:** After ALL migration phases complete, launch cleanup agent:

```
Finalize migration by removing barrel files.

BARREL FILES: [list from analysis JSON]

FOR EACH barrel file:

1. CHECK IF STILL NEEDED:
   - Use grep: rg "from ['\"]\\..*${barrelFileName}" --type ts
   - If NO imports found → Delete it
   - If imports found → Update them

2. IF IMPORTS FOUND, UPDATE CONSUMERS:
   - For each import of the barrel:
     * Replace with direct import from new location
     * Example:
       OLD: import { FooUtil } from './utils/foo-util';
            FooUtil.bar();
       NEW: import { fooBarBroker } from './brokers/foo/bar/foo-bar-broker';
            fooBarBroker();

3. DELETE BARREL FILE after consumers updated

4. DELETE EMPTY DIRECTORIES:
   - Check if parent directory is now empty
   - Delete if empty

5. UPDATE PUBLIC API (if package has index.ts at root):
   - Keep the file
   - Update exports to use new locations
   - Export individual functions with descriptive names

RETURN:
- Barrel files deleted
- Consumers updated
- Directories deleted
```

---

### STEP 5: Verification

**YOUR ACTION:** Launch verification agent:

```
Verify migration succeeded.

RUN THESE COMMANDS:

1. Tests: npm test
   - If failures → Report which tests failed
   - If success → Continue

2. Typecheck: npm run typecheck
   - If errors → Report type errors
   - If success → Continue

3. Lint: npm run lint -- --fix
   - Auto-fix formatting issues
   - If remaining errors → Report them
   - If success → Continue

IF ANY FAILURES:
- Analyze the errors
- Fix them
- Re-run the failing check
- Repeat until all pass

RETURN:
- Test results (pass/fail, count)
- Type errors (if any)
- Lint errors (if any)
- Summary of fixes applied
```

**AFTER VERIFICATION AGENT COMPLETES:**

- If all checks pass → Report success to user
- If checks fail → Report to user: "Verification found issues: [details]"

---

### STEP 6: Final Report to User

**YOUR ACTION:** Summarize the migration:

```markdown
## Migration Complete ✅

**Directory migrated:** [target-directory]
**Files processed:** [N] files

**Breakdown:**
- Contracts: [N] files
- Transformers: [N] files
- Adapters: [N] files
- Brokers: [N] files
- Other: [N] files

**Results:**
- ✅ Tests: [N] passing
- ✅ Typecheck: Clean
- ✅ Lint: Clean

**New structure:**
[Show directory tree of new folders]

**Original directory:** [Deleted/Updated]
```

---

## Decision Trees for Common Scenarios

### Scenario: Agent Reports Error

**IF** agent says "Type error in migrated file":

1. Launch new agent to fix the specific file
2. Don't continue to next phase until fixed

**IF** agent says "Couldn't find consumer file":

1. Agent might have used wrong grep pattern
2. Launch new agent with corrected search

**IF** agent says "Tests failing after migration":

1. Launch new agent to analyze test failures
2. Likely issues:
    - Mocking patterns need updating
    - Import paths incorrect
    - Function names not updated in tests

### Scenario: User Asks "Can I see the plan first?"

**DO THIS:**

1. Run STEP 1 (analysis agent)
2. Show user the JSON
3. Ask: "Approve this plan?"
4. Wait for confirmation
5. Then run STEPS 2-6

### Scenario: Context Running Low

**IF** you're approaching context limits:

- Prioritize launching agents over reading files yourself
- Each agent works in fresh context
- Use agents for ALL file reading/writing

### Scenario: Large Migration (50+ files)

**DO THIS:**

1. Break into smaller batches (10-15 files per agent)
2. Run phases sequentially (never parallelize across dependency levels)
3. Within each phase, run 3-5 agents in parallel
4. Check in with user after each phase: "Phase N complete. Continue? (yes/no)"

---

## Common Categorization Edge Cases

### "Function name starts with 'is' but makes HTTP calls"

**ANSWER:** Broker (not contract)
**REASON:** Contracts must be pure, no I/O

### "Function transforms data BUT also logs to console"

**ANSWER:** Broker (not transformer)
**REASON:** console.log is a side effect

### "Function wraps axios BUT also retries and formats errors"

**ANSWER:** Adapter
**REASON:** Retry and error formatting are infrastructure policies, not business logic

### "Function calls 3 other brokers and makes business decisions"

**ANSWER:** Orchestration Broker
**REASON:** Coordinates multiple operations with business logic

### "Function returns boolean but takes 5 parameters"

**ANSWER:** Still a contract, but needs refactoring
**REASON:** Will need object destructuring per standards

### "Class with multiple methods"

**ANSWER:** Check each method individually
**REASON:** Might need to split into multiple files (one export per file)

---

## Verification Checklist

After ALL agents complete, verify:

- [ ] Original directory deleted or empty
- [ ] All files in standards-compliant folders
- [ ] No files in utils/, lib/, helpers/, common/, shared/
- [ ] All tests passing (npm test)
- [ ] No type errors (npm run typecheck)
- [ ] No lint errors (npm run lint)
- [ ] Each file has exactly one export
- [ ] All functions use object destructuring (except type predicates)
- [ ] All functions have explicit return types

---

## Example Orchestration Session

```
USER: Migrate src/utils

YOU: [Launch analysis agent with target: src/utils]

AGENT RETURNS: {summary: {totalFiles: 24, ...}, phases: [...]}

YOU: Analysis complete. Found 24 files in 4 phases:
     - Phase 1: 9 files (zero dependencies)
     - Phase 2: 7 files
     - Phase 3: 5 files
     - Phase 4: 3 files
     Proceed? (yes/no)

USER: yes

YOU: [Launch 3 parallel agents for Phase 1, files 1-3, 4-6, 7-9]

AGENTS COMPLETE: All successful

YOU: Phase 1 complete. [Launch 2 agents for Phase 2]

AGENTS COMPLETE: All successful

YOU: Phase 2 complete. [Continue through phases...]

YOU: All phases complete. [Launch cleanup agent]

CLEANUP COMPLETE: Deleted 5 barrel files

YOU: [Launch verification agent]

VERIFICATION: All tests pass ✅

YOU: Migration complete! [Show summary to user]
```

---

## Critical Reminders

1. **NEVER do the migration yourself** - Always use agents (to avoid context limits)
2. **ALWAYS wait for phase to complete** before starting next phase
3. **ALWAYS verify after each agent** - Don't continue if there are errors
4. **READ the implementation** - Don't trust file names for categorization
5. **ONE EXPORT PER FILE** - If a file has multiple exports, each needs its own file
6. **TESTS MOVE WITH CODE** - Never migrate code without its tests
7. **UPDATE ALL CONSUMERS** - Grep is your friend: `rg "import.*functionName"`
8. **SEQUENTIAL PHASES** - Level N+1 depends on Level N being done first
