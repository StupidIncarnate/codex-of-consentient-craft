# Coding Principles

## Development Workflow
1. Write empty test cases with descriptive names that define expected behavior
2. Fill in production code that aligns with expected behavior
3. Review production code for missing test coverage: functional groupings, edge cases, and error paths
4. Fill in test cases with assertions that match their descriptions
5. Refactor for clarity, consolidate duplicated logic, simplify complex patterns, and verify all tests still pass

## Architecture Principles
- Design components with single, clear responsibilities. If you need to explain why something exists, reconsider its design
- Consolidate components that serve the same purpose. Having multiple solutions for one problem creates confusion
- Apply the same solution to the same problem throughout the codebase
- Follow existing patterns in the codebase. Introduce new patterns only after confirming current ones cannot solve the problem
- Complete all aspects of a task: passing tests, no TypeScript errors, no linting warnings, no test output spam, and no loose ends

## Type Safety Boundaries
- Use existing types from the codebase when available. Make new types when needed. For uncertain data (including catch variables), use `unknown` and prove its shape through guards. This eliminates the need for `any`
- Let TypeScript infer types when the value makes it clear. Add explicit types for empty arrays, ambiguous objects, and when you need tighter constraints
- Check array/object access for undefined before use
- Handle null/undefined values explicitly in your code to satisfy strict checking

## Type Discipline
- Fix type errors at their source. Suppressing with `@ts-ignore` or `@ts-expect-error` hides real problems
- Address linting violations directly. Disabling rules with eslint-disable comments accumulates technical debt
- Let types flow naturally through your code. Use type assertions (`as SomeType`) only when you have information the compiler lacks

## Type Design Patterns
- Use `type` over `interface` in all cases
- Utilize TypeScript utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)

## Function Parameters
- Pass complete objects to preserve type relationships. When you need just an ID, extract it with `Type['id']` rather than passing individual properties
- Use options objects with descriptive property names for functions with multiple parameters or optional parameters
- Reserve positional parameters for single-argument functions and well-established patterns (map, filter, reduce)

## Return Type Inference
- Let TypeScript infer return types from function implementations
- Add explicit return types only for exported functions that other modules consume or when TypeScript infers `any`

## Code Hygiene
- Follow all eslint and prettier rules in your configuration
- Ensure all code paths in functions return a value (implicit return type preferred)
- One primary export per file
- Remove unused local variables and function parameters
- Delete unreachable code
- Remove orphaned files and unused code
- Delete commented-out code blocks and TODO comments from completed work
- Remove console.log statements from production and test code (unless specifically testing console output)
