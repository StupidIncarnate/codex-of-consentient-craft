# Testing Standards

## Core Principles

Tests Should Be DAMP (Descriptive And Meaningful Phrases), Not DRY. Never conflate production code with test code.

**100% Branch Coverage Required:**

- All if/else branches
- All switch cases
- All input combinations
- Ternary operators
- Optional chaining (?.)
- Try/catch blocks
- Dynamic values in JSX
- Conditional rendering in JSX
- Event handling: onClick, onChange, form submissions

**Example needing 3 tests:**

```typescript
function processUser(user: User | null): string {
  if (!user) return 'No user'; // Test 1
  if (user.isAdmin) return 'Admin'; // Test 2
  return user.name; // Test 3
}
```

## Coding Standards

### NEVER

- NEVER use mocks, no matter if the test is unit, integration or e2e.
- NEVER skip tests; You need to THINK through why it's broken.
- NEVER mock console.\* to get rid of console output. You need to THINK through why it's doing that and fix properly.

### ALWAYS

- ALWAYS use describe / it structure
