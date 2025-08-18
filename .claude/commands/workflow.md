# Development Workflow

Execute the development workflow in focused, iterative chunks based on the `## Task to Complete` information down below. Complete each step before moving to the next.

## Step 0: Review Standards and Types
- Read `docs/coding-principles.md`
- Read `docs/typescript-standards.md`
- Read `docs/testing-standards.md`
- Note key patterns to follow
- Review existing types in `src/types`

## Step 1: Understand Task
- Restate the task in one sentence
- If unclear, list interpretations and ask user

## Step 2: Parallel Exploration and Planning
Launch multiple Task agents concurrently to explore different aspects:

```
Task 1: "Find all files related to [feature/component name]"
Task 2: "Search for existing patterns and conventions for [task type]"
Task 3: "Identify test files and testing patterns for similar features"
```

Wait for all agents to complete, then synthesize findings:
- List of 3-5 most relevant files
- Key patterns and conventions to follow
- Existing test examples to reference

Based on exploration, think hard and plan the implementation:
- What components/files need to be created or modified?
- What are the dependencies between components? Be specific:
  - Does component A import/use component B?
  - Does component A need data from component B?
  - Can components be tested independently?
- What edge cases and error scenarios need handling?
- What existing patterns should be followed?
- Identify parallel work opportunities:
  - Components with NO dependencies can be built in parallel
  - Components that import each other must be built sequentially
  - Example: If UserService imports AuthService, build AuthService first

If you need to store your findings in a doc for referencing later, write it to `/tasks/YYYY-MM-DD-task-name.md` (e.g., `/tasks/2024-03-15-user-authentication.md`)

## Step 3: Create any new types
Before coding, make sure any types you need are created in `src/types`

## Step 4: Create TODO List
Use TodoWrite to break down the task following the 7-step TDD process from `docs/coding-principles.md#development-workflow-mandatory-for-production-code`:

**Single Component Example:**
```
1. STUB-TESTS: UserService (Step 1: Write Empty Test Cases)
2. CODE: UserService (Step 2: Implement Production Code)
3. GAP-REVIEW: UserServer (Step 3: Review for Missing Coverage)
4. TEST: UserServer (Step 4: Fill in Test Assertions)
5. TEGRITY: Tests (Step 5: Run Tests and Fix Failures)
6. REFACTOR: UserService (Step 6: Refactor for Clarity)
7. TEGRITY: Lint+Types (Step 7: Final Verification)
```

**Multiple Components Example:**
```
# AuthService (complete before moving to next)
1. STUB-TESTS: AuthService (Step 1: Write Empty Test Cases)
2. CODE: AuthService (Step 2: Implement Production Code)
3. GAP-REVIEW: AuthService (Step 3: Review for Missing Coverage)
4. TEST: AuthService (Step 4: Fill in Test Assertions)
5. TEGRITY: AuthService Tests (Step 5: Run Tests and Fix Failures)

# UserService (depends on AuthService)
6. STUB-TESTS: UserService (Step 1: Write Empty Test Cases)
7. CODE: UserService (Step 2: Implement Production Code)
8. GAP-REVIEW: UserService (Step 3: Review for Missing Coverage)
9. TEST: UserService (Step 4: Fill in Test Assertions)
10. TEGRITY: UserService Tests (Step 5: Run Tests and Fix Failures)

# TokenService
11. STUB-TESTS: TokenService (Step 1: Write Empty Test Cases)
12. CODE: TokenService (Step 2: Implement Production Code)
13. GAP-REVIEW: TokenService (Step 3: Review for Missing Coverage)
14. TEST: TokenService (Step 4: Fill in Test Assertions)
15. TEGRITY: TokenService Tests (Step 5: Run Tests and Fix Failures)

# Final verification
16. REFACTOR: All Components (Step 6: Refactor for Clarity)
17. TEGRITY: All Tests
18. TEGRITY: Lint+Types (Step 7: Final Verification)
```

**Parallel Work Opportunity:**
When components are truly independent:
```
[PARALLEL GROUP 1]
- STUB-TESTS: PaymentService (Step 1: Write Empty Test Cases)
- CODE: PaymentService (Step 2: Implement Production Code)
- GAP-REVIEW: PaymentService (Step 3: Review for Missing Coverage)
- TEST: PaymentService (Step 4: Fill in Test Assertions)
- TEGRITY: PaymentService Tests (Step 5: Run Tests and Fix Failures)

[PARALLEL GROUP 2]
- STUB-TESTS: NotificationService (Step 1: Write Empty Test Cases)
- CODE: NotificationService (Step 2: Implement Production Code)
- GAP-REVIEW: NotificationService (Step 3: Review for Missing Coverage)
- TEST: NotificationService (Step 4: Fill in Test Assertions)
- TEGRITY: NotificationService Tests (Step 5: Run Tests and Fix Failures)

[SEQUENTIAL]
- REFACTOR: All Components (Step 6: Refactor for Clarity)
- TEGRITY: All Tests
- TEGRITY: Lint+Types (Step 7: Final Verification)
```

Keep each TODO focused and achievable. Group related work but maintain clear boundaries.

## Step 5: Iterative Implementation
For EACH TODO item:

### 5a. Mark TODO as in_progress

### 5b. Execute the TODO:
- Follow the specific step indicated in the TODO (e.g., "Step 1: Write Empty Test Cases")
- Use relevant sections from standards docs as guidance

### 5c. Verify and complete:
- Run relevant tests
- Fix any failures
- Only mark TODO as completed when lint, tests and typecheck pass
- Move to next TODO

## Step 6: Final Verification
After ALL TODOs complete:
- Run full test suite
- Run linting/typecheck
- Report results

## STOP Points
Stop and ask user if:
- Task interpretation unclear
- Missing critical context
- Tests failing after 2 fix attempts

## Key Reminders
- One TODO at a time
- Follow standards docs for TDD approach
- Small, focused changes
- Verify before marking complete

## Task to Complete
$ARGUMENTS