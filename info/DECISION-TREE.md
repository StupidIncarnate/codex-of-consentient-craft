# Orchestration Decision Tree

Visual decision guide for Dungeonmaster to determine optimal orchestration strategy.

```
START: New Task Received
│
├─Q: Is this a continuation of interrupted work?
│  ├─YES: Read checkpoint.json
│  │      └─Resume from current_phase
│  └─NO: Continue ↓
│
├─Q: Is this a trivial task (<3 files, no unknowns)?
│  ├─YES: Skip to simple flow
│  │      └─Spawn Coder → Tegrity → Done
│  └─NO: Continue ↓
│
├─ALWAYS: Spawn Discovery Agent
│         └─Wait for discovery.json
│
├─Q: Does discovery.json show schema changes?
│  ├─YES: Spawn SchemaAgent
│  │      └─Run migrations after completion
│  └─NO: Skip schema phase
│
├─Q: Does discovery.json show new types needed?
│  ├─YES: Spawn TypesAgent
│  │      └─Wait for completion
│  └─NO: Skip types phase
│
├─Q: How many independent services/components?
│  ├─1: Spawn single Coder
│  ├─2-3: Spawn parallel Coders
│  │      └─Wait for ALL to complete
│  └─4+: Consider batching (max 3 parallel)
│
├─ALWAYS: Spawn CodeReviewer
│         └─Reviews ALL implementations
│
├─Q: Does task need integration tests?
│  ├─YES: How many test scenarios?
│  │      ├─1: Spawn single TestAgent
│  │      └─2+: Spawn parallel TestAgents
│  └─NO: Skip test phase
│
├─ALWAYS: Run npm run tegrity
│  ├─PASS: Update project-status.md → DONE
│  └─FAIL: Spawn Fixer
│          └─After fix → DONE
│
END
```

## Detailed Decision Logic

### Trivial Task Detection

```
Trivial = ALL of:
- Modifies < 3 files
- No database changes
- No type changes
- No "Known Unknowns"
- Clear requirements
- No integration tests needed

Examples:
- Fix typo
- Update comment
- Add single validation
- Change error message
```

### Parallel Coder Rules

```
CAN parallelize when:
- Different services
- Different domains
- No shared files
- Independent functionality

CANNOT parallelize when:
- Shared utility files
- Common types modifications
- Service dependencies
- Same test file updates
```

### Test Parallelization

```
ALWAYS safe to parallelize:
- Different test files
- Different service tests
- Different scenarios

Group by:
- Service boundary
- Feature boundary
- Workflow type
```

### Batching Strategy for Many Components

```
If components > 3:
  Batch 1: Most independent components
  Wait for completion
  Batch 2: Components that might depend on Batch 1

Example with 6 services:
  Batch 1: [UserService, ProductService, OrderService]
  Batch 2: [AuthService, PaymentService, NotificationService]
```

## Quick Decision Examples

### Scenario: "Fix user authentication bug"

```
Path: Trivial? → Maybe → Discovery First
Discovery reveals: 5 files affected, security implications
Decision: Full orchestration flow
```

### Scenario: "Add new product catalog system"

```
Path: Trivial? → No → Discovery
Discovery reveals: New tables, 3 services, GraphQL
Decision: Schema → Types → 3 Parallel Coders → Review → Tests
```

### Scenario: "Update README.md"

```
Path: Trivial? → Yes
Decision: Direct Coder spawn
```

### Scenario: "Refactor payment processing"

```
Path: Trivial? → No → Discovery
Discovery reveals: 8 services affected
Decision: Batch parallel execution
```

## Phase Skip Conditions

### Skip Discovery When

- Single file change
- No unknowns listed
- Requirements crystal clear
- No integration points

### Skip Schema When

- No database changes
- No migration files in discovery.json
- Types only task

### Skip Types When

- No new data structures
- No API contract changes
- Implementation only task

### Skip Tests When

- Documentation only
- Config changes only
- Pure refactoring (rare)

## Error Recovery Decisions

### If Discovery Fails

```
├─Timeout: Create manual discovery.json
├─Unclear: Ask for clarification
└─Error: Fall back to sequential
```

### If Parallel Coder Fails

```
├─One fails: Others continue, fix failed one
├─All fail: Check discovery.json accuracy
└─Conflicts: Spawn Fixer for resolution
```

### If Tegrity Fails

```
├─Simple errors: Tasklord fixes directly
├─Complex errors: Spawn Fixer
└─Systematic errors: Review discovery.json
```

## Time Optimization Rules

### When to Investment in Discovery

```
Worth Discovery if:
  Estimated task time > 2 hours
  OR Files touched > 3
  OR Unknown count > 1
  OR Integration points > 2
```

### When to Parallelize

```
Parallelize if:
  Independent work time > 1 hour each
  AND No shared dependencies
  AND Clear boundaries
```

### When to Batch

```
Batch if:
  Total agents > 3
  OR Context window concerns
  OR Resource constraints
```

## Quick Reference Card

```
No Discovery: <3 files, no unknowns
Discovery: Everything else
Parallel: Independent services/tests
Sequential: Dependent work
Batch: >3 parallel agents
Fix Forward: Never rollback
State First: Check checkpoint.json
Structure: Trust discovery.json
```

This decision tree enables rapid, correct orchestration decisions while maintaining system efficiency.
