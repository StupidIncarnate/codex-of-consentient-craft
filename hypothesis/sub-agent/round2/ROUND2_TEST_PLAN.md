# Round 2 Testing - Follow-up Edge Cases

## Purpose
Test the assumptions and edge cases identified from Round 1 empirical research.

## Test Cases to Implement

### Test 9: Dynamic Working Directory Switching
**Question**: When an agent changes working directories mid-execution, which CLAUDE.md files are loaded?

**Setup**:
```
test9/
  dirA/
    CLAUDE.md          # "CONTEXT_MARKER: dirA_context"
  dirB/
    CLAUDE.md          # "CONTEXT_MARKER: dirB_context"  
  .claude/commands/
    orchestrator.md    # Spawns worker in dirA, then tells it to switch to dirB
    worker.md          # Reports context at each step
```

**Test Flow**:
1. Worker starts in dirA (should see dirA_context)
2. Worker reports initial context
3. Worker is instructed to switch to dirB
4. Worker reports context after switch
5. Determine: dirA only, dirB only, both, or neither?

### Test 10: Large CLAUDE.md Files (500+ Lines)
**Question**: Are there line-based truncation limits for CLAUDE.md files?

**Setup**:
```
test10/
  CLAUDE.md          # 600+ lines with test marker buried at line 550
  .claude/commands/
    orchestrator.md    # Spawns worker
    worker.md          # Reports if it can find the deep marker
```

**Test Flow**:
1. Create CLAUDE.md with 600+ lines
2. Place test marker at line 550
3. Worker reports if it can see the deep marker
4. Determine: full file read, truncated, or performance issues?

## Additional Edge Cases to Add

### Test 11: Implicit Context Standards Pickup
**Question**: Do agents naturally follow different describe formats without explicit instruction?

**Setup**:
```
test11/
  dirA/
    CLAUDE.md          # "All describe text must begin with 'MobileApp'"
    src/
  dirB/
    CLAUDE.md          # "All describe text must begin with 'APIEndpoint'"
    src/
  .claude/commands/
    orchestrator.md    # Spawns worker to create functions in both dirs
    worker.md          # Creates add functions + tests naturally
```

**Test Flow**:
1. Worker creates function + test in dirA (should use "MobileApp" format naturally)
2. Worker creates function + test in dirB (should use "APIEndpoint" format naturally)
3. Worker never told about format requirements explicitly
4. Determine: Does implicit context pickup work without instruction?

### Test 12: Indirect Context via Relative Paths
**Question**: Do agents follow external references like `../docs/standards.md`?

**Setup**:
```
test12/
  dirA/
    CLAUDE.md          # "Follow standards in ../docs/dirA/coding-standards.md"
    src/
  dirB/
    CLAUDE.md          # "Follow standards in ../docs/dirB/coding-standards.md"
    src/
  docs/
    dirA/
      coding-standards.md  # "All describe text must begin with 'InventoryModule'"
    dirB/
      coding-standards.md  # "All describe text must begin with 'OrderService'"
  .claude/commands/
    orchestrator.md    # Spawns worker to implement in both dirs
    worker.md          # Follows discovered standards naturally
```

**Test Flow**:
1. Worker reads CLAUDE.md in dirA, finds reference to external doc
2. Worker reads external doc, discovers "InventoryModule" format
3. Worker implements function using discovered format
4. Same process for dirB with "OrderService" format
5. Determine: Do relative path references work for context inheritance?

### Test 13: Indirect Context via Absolute Paths
**Question**: Do agents follow @ notation references like `@docs/standards`?

**Setup**:
```
test13/
  dirA/
    CLAUDE.md          # "Follow standards in @docs/dirA/coding-standards"
    src/
  dirB/
    CLAUDE.md          # "Follow standards in @docs/dirB/coding-standards"
    src/
  docs/
    dirA/
      coding-standards.md  # "All describe text must begin with 'DashboardWidget'"
    dirB/
      coding-standards.md  # "All describe text must begin with 'ReportModule'"
  .claude/commands/
    orchestrator.md    # Spawns worker to implement in both dirs
    worker.md          # Follows @ notation references naturally
```

**Test Flow**:
1. Worker encounters @ notation absolute path references
2. Worker attempts to resolve @docs/dirA/coding-standards
3. Worker discovers different format requirements via @ notation
4. Determine: Does @ notation work for context references?

### Test 14: Conflicting Context Sources
**Question**: What happens if CLAUDE.md conflicts with ESLint rules?

**Setup**:
```
test14/
  src/
  CLAUDE.md          # "Use toBeCalled() for simple mock assertions"
  .eslintrc.json     # "jest/prefer-called-with": "error" (requires toBeCalledWith)
  package.json       # ESLint + Jest configuration
  .claude/commands/
    orchestrator.md    # Spawns worker to create function with tests
    worker.md          # Creates calculator with mock tests naturally
```

**Test Flow**:
1. Worker creates function that needs mocking (e.g., calculator with logger)
2. Worker writes test with mock assertions
3. Worker naturally chooses between toBeCalled() vs toBeCalledWith()
4. Worker unaware of the conflict between CLAUDE.md and ESLint
5. Determine: Which context source takes precedence naturally?

### Test 15: Nested Context Hierarchy
**Question**: Does 3-level hierarchy work (Root → API → V2 precedence)?

**Setup**:
```
test15/
  Root/
    CLAUDE.md          # "All describe text must begin with 'Platform'"
    src/
    packages/
      api/
        CLAUDE.md      # "All describe text must begin with 'APIService'"
        src/
        v2/
          CLAUDE.md    # "All describe text must begin with 'V2Endpoint'"
          src/
  .claude/commands/
    orchestrator.md    # Spawns worker to work at all 3 levels
    worker.md          # Creates functions at root, api, and v2 levels
```

**Test Flow**:
1. Worker works in Root/ (should use "Platform" format)
2. Worker works in Root/packages/api/ (should use "APIService" format)
3. Worker works in Root/packages/api/v2/ (should use "V2Endpoint" format)
4. Determine: Do deeper levels override higher levels in hierarchy?

### Test 16: Context Accumulation vs Replacement
**Question**: Do contexts accumulate as agents move or switch cleanly?

**Setup**:
```
test16/
  dirA/
    CLAUDE.md          # "All describe text must begin with 'AuthModule'"
    src/
  dirB/
    CLAUDE.md          # "All describe text must begin with 'ValidationService'"
    src/
  dirC/
    CLAUDE.md          # "All describe text must begin with 'NotificationHandler'"
    src/
  .claude/commands/
    orchestrator.md    # Spawns worker for multi-directory sequence
    worker.md          # Works in dirA → dirB → dirC → dirA sequence
```

**Test Flow**:
1. Worker works in dirA (should see "AuthModule" context)
2. Worker works in dirB (should see "ValidationService" context only?)
3. Worker works in dirC (should see "NotificationHandler" context only?)
4. Worker returns to dirA (should see "AuthModule" again or accumulated?)
5. Determine: Does context accumulate or get replaced cleanly?

### Test 17: Malformed CLAUDE.md Error Handling
**Question**: How does system handle corrupted, malformed, or syntactically broken CLAUDE.md files?

**Setup**:
```
test17/
  src/
  CLAUDE.md          # Intentionally malformed with broken markdown syntax
  .claude/commands/
    orchestrator.md    # Spawns worker to work with malformed context
    worker.md          # Implements function despite context issues
```

**Test Flow**:
1. CLAUDE.md contains broken markdown (unclosed code blocks, invalid syntax)
2. Worker attempts to parse malformed context
3. Worker implements functionality despite parsing issues
4. Determine: How gracefully are malformed files handled? Fallback behavior?

### Test 18: Agent Identity Preservation
**Question**: Do specialized agents maintain identity when faced with heavy CLAUDE.md context?

**Setup**:
```
test18/
  src/
  CLAUDE.md          # Extremely verbose enterprise context (heavy requirements)
  .claude/commands/
    orchestrator.md    # Spawns pathseeker agent with security analysis task
    worker.md          # Pathseeker agent with heavy context pressure
```

**Test Flow**:
1. Spawn pathseeker agent with strong identity (structured analysis, clear formatting)
2. Heavy CLAUDE.md context with extensive enterprise requirements
3. Pathseeker performs typical analysis task
4. Determine: Does agent maintain distinctive identity or get diluted by context?

### Test 19: Context Size Limits
**Question**: Where are the actual practical limits for context size processing?

**Setup**:
```
test19/
  src/
  CLAUDE.md          # Extremely large context (1000+ lines)
  .claude/commands/
    orchestrator.md    # Spawns worker with massive context
    worker.md          # Implements function with comprehensive requirements
```

**Test Flow**:
1. CLAUDE.md contains 1000+ lines of comprehensive enterprise documentation
2. Worker processes extremely large context file
3. Worker implements functionality following extensive requirements
4. Determine: Performance impact? Truncation? Memory issues? Processing limits?

## Implementation Priority
1. **Test 9**: Dynamic directory switching (immediate need for questmaestro)
2. **Test 10**: 500+ line files (line-based truncation hypothesis)
3. **Test 11**: Context accumulation behavior
4. **Test 13**: Real agent integration testing
5. **Tests 12, 14-16**: Edge case resilience

## Success Criteria
Each test should provide definitive answers to replace assumptions with empirical data.