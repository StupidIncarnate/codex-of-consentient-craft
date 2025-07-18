CONTEXT_MARKER: test7_pathseeker

## Test 7 Pathseeker Context
This CLAUDE.md contains standards that should guide pathseeker behavior.

## Project Testing Standards
- All tests must use describe("ClassName", () => { format
- No mocking - use real database connections
- Test files go in same directory as source: src/foo.ts → src/foo.test.ts
- Integration tests preferred over unit tests

## Architecture Patterns
- Clean architecture with layers
- Repository pattern for data access
- Domain events for cross-cutting concerns
- No circular dependencies allowed

## Code Style
- Functional programming preferred
- Async/await over promises
- No classes except for entities
- TypeScript strict mode required

## Project Info
- Test scenario: Real pathseeker agent with standards context
- Location: sub-agent/test7/
- Purpose: Check if CLAUDE.md interferes with pathseeker's core functionality
- Expected: Pathseeker should incorporate standards while maintaining its role