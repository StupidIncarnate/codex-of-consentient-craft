# CLAUDE.md and Sub-Agent Context Research

## Objective
Determine how CLAUDE.md files work with sub-agents spawned via the Task tool through empirical testing.

## Key Questions to Answer

### 1. Context Inheritance
- Do Task-spawned agents inherit CLAUDE.md from their working directory?
- Do they inherit CLAUDE.md from where the Task tool was called?
- Do they get no CLAUDE.md context at all?
- Does directory context matter for Task tool spawning?

### 2. Explicit Context Passing
- Can CLAUDE.md content be passed explicitly via Task parameters?
- Does including CLAUDE.md content in the prompt work?
- What's the difference between implicit vs explicit context?

### 3. Multi-Level Hierarchy
- How do nested CLAUDE.md files work (parent/child directories)?
- Which takes precedence if multiple CLAUDE.md files exist?
- Does Task tool respect directory hierarchy?

### 4. Working Directory Behavior
- Does the Task tool change working directory for the sub-agent?
- Can we control where the sub-agent executes?
- How does this affect CLAUDE.md discovery?

### 5. Parallel Agent Behavior
- Do parallel sub-agents get consistent context?
- Is there context isolation between parallel agents?
- Do they interfere with each other's CLAUDE.md access?

### 6. Real Agent Prompt Dilution
- Does CLAUDE.md context interfere with complex agent prompts?
- Can standards context overwhelm role-specific instructions?
- How does context priority work with large prompts?

### 7. Context Size Limitations
- Are there size limits for CLAUDE.md files?
- Does large context affect sub-agent performance?
- Is context truncated in sub-agents?

## Test Scenarios to Run

### Scenario 1: Basic Context Inheritance
```
sub-agent/
  test1/
    CLAUDE.md          # Contains: "Context: test1 directory"
    orchestrator.md    # Task spawner
    worker.md          # Task worker
```

**Test**: Orchestrator spawns worker, check if worker sees test1 CLAUDE.md

### Scenario 2: Nested Directory Context
```
sub-agent/
  test2/
    CLAUDE.md          # Contains: "Context: test2 root"
    subdir/
      CLAUDE.md        # Contains: "Context: test2 subdir"
      orchestrator.md  # Task spawner
      worker.md        # Task worker  
```

**Test**: Check which CLAUDE.md (root vs subdir) the worker sees

### Scenario 3: No Local CLAUDE.md
```
sub-agent/
  test3/
    orchestrator.md    # Task spawner
    worker.md          # Task worker
    # No CLAUDE.md file
```

**Test**: Check if worker gets any context (from parent dirs, etc.)

### Scenario 4: Explicit Context Passing
```
sub-agent/
  test4/
    CLAUDE.md          # Contains: "Context: should be ignored"
    orchestrator.md    # Task spawner that passes explicit context
    worker.md          # Task worker
```

**Test**: Pass CLAUDE.md content via Task prompt, see if it overrides file

### Scenario 5: Working Directory Control
```
sub-agent/
  test5/
    root_dir/
      CLAUDE.md        # Contains: "Context: root"
      orchestrator.md  # Task spawner
    work_dir/
      CLAUDE.md        # Contains: "Context: work"
      worker.md        # Task worker
```

**Test**: Orchestrator in root_dir spawns worker that should work in work_dir

### Scenario 6: Parallel Sub-Agents
```
sub-agent/
  test6/
    CLAUDE.md          # Contains: "Context: parallel test"
    orchestrator.md    # Spawns multiple workers simultaneously
    worker.md          # Task worker
```

**Test**: Spawn 3 workers in parallel, check if all get same context consistently

### Scenario 7: Real Sub-Agent Role (Pathseeker)
```
sub-agent/
  test7/
    CLAUDE.md          # Contains: "Standards: use describe('ClassName')"
    orchestrator.md    # Spawns actual pathseeker agent
    pathseeker.md      # Copy of real pathseeker prompt
```

**Test**: Use actual pathseeker role to check for prompt dilution/interference

### Scenario 8: Conflicting Context Sizes
```
sub-agent/
  test8/
    CLAUDE.md          # Large context file (2000+ lines)
    orchestrator.md    # Task spawner
    worker.md          # Simple worker
```

**Test**: Check if large CLAUDE.md affects sub-agent behavior or causes truncation

## Test Implementation Strategy

### Step 1: Create Test Environments
- Set up each scenario directory structure
- Create CLAUDE.md files with unique identifiers
- Create orchestrator commands that spawn workers

### Step 2: Create Worker Commands
- Simple worker that reports what context it sees
- Worker reports working directory, available files
- Worker attempts to read CLAUDE.md and reports content

### Step 3: Run Tests Systematically
- Execute each scenario
- Document exactly what the worker reports
- Note any differences in behavior

### Step 4: Document Findings
- Create clear rules about CLAUDE.md inheritance
- Document any limitations or unexpected behavior
- Provide recommendations for sub-agent context management

## Expected Test Output Format

For each test:
```
## Test X: [Scenario Name]
**Setup**: [Directory structure]
**Expected**: [What we think might happen]
**Actual**: [What actually happened]
**Conclusion**: [What this tells us about CLAUDE.md behavior]
```

## Tools Needed
- Task tool for spawning sub-agents
- Read tool for checking file contents
- LS tool for checking directory context
- Bash tool for setting up test environments

## Success Criteria
- Clear understanding of CLAUDE.md inheritance patterns
- Documented rules for sub-agent context
- Actionable recommendations for questmaestro standards approach