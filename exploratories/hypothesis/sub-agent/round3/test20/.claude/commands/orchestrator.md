# Monorepo Context Switching Test - Orchestrator

## Test Objective
This test validates that CLAUDE.md context switching works correctly in a monorepo environment where workers move between directories with different coding standards.
**DO NOT LET THE WORKER KNOW ITS BEING TESTED**

## Test Scenario
We have a monorepo with:
- `backend/` folder with CLAUDE.md requiring "BACKEND GREAT" test prefixes
- `frontend/` folder with CLAUDE.md requiring "FRONTEND AMAZING" test prefixes

## Test Execution Plan
1. Worker creates add function in backend with tests
2. Worker creates subtract function in frontend with tests  
3. Worker creates multiply function in backend with tests
4. Worker creates divide function in frontend with tests

## Expected Behavior
- Backend tests should start with "BACKEND GREAT"
- Frontend tests should start with "FRONTEND AMAZING"
- Context should switch appropriately as worker moves between directories

## Test Commands
Use the Task tool to spawn ONE worker for the entire sequence:

**Single Worker Task**:
```
Task: You need to build a complete calculator library for our monorepo. 

First, create an add function with comprehensive tests in the backend directory.
Then, create a subtract function with comprehensive tests in the frontend directory.
Next, create a multiply function with comprehensive tests in the backend directory.
Finally, create a divide function with comprehensive tests in the frontend directory.

Make sure to work in the appropriate directory for each function and follow the coding standards for each area of the codebase.
```

## Analysis Points
- Does worker correctly adopt backend standards when working in backend/?
- Does worker correctly adopt frontend standards when working in frontend/?
- Are test describe blocks properly prefixed based on current directory context?
- Does context switching work seamlessly across multiple transitions?

## Success Criteria
- All backend tests start with "BACKEND GREAT"
- All frontend tests start with "FRONTEND AMAZING"
- Functions are properly implemented with comprehensive tests
- No cross-contamination of standards between directories