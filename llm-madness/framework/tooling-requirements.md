# Tooling Requirements

## Essential Tools Only

The framework needs minimal tooling focused on immediate verification and clear feedback.

## Core Requirements

### 1. Standard Development Tools

**What you already have:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "prettier": "^3.0.0"
  }
}
```

**Why these matter:**
- **TypeScript**: Catches type errors, provides semantic feedback
- **ESLint**: Enforces patterns, catches common mistakes
- **Jest**: Verifies observable behaviors
- **Prettier**: Reduces noise in code reviews

### 2. Validation Commands

**Simple shell scripts or npm scripts:**
```json
{
  "scripts": {
    "validate": "npm run typecheck && npm run lint && npm test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --fix",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Use these after each concern implementation.**

### 3. AI Interaction Pattern

**Not a complex tool, just a pattern:**

```bash
# 1. Generate code for specific concern
# 2. Save to file
# 3. Run validation
npm run validate

# 4. If errors, feed back to AI
"Fix these TypeScript errors: [error output]"

# 5. Repeat until validation passes
```

## What You DON'T Need

### Over-Engineered Systems
- ❌ Complex session managers
- ❌ Task orchestration frameworks
- ❌ Custom validation pipelines
- ❌ AI-specific tooling

### Why Not?
- Adds complexity without proportional value
- Standard tools provide sufficient feedback
- Simple patterns are more maintainable
- Focus should be on building, not tooling

## Helpful Additions (Optional)

### 1. Error Formatting

Make errors more readable for AI:
```bash
# error-format.js
const output = process.argv[2];
// Parse TypeScript/ESLint output
// Format as clear instructions
console.log(formatted);
```

### 2. Quick Verification

Single command to check current work:
```bash
# verify.sh
#!/bin/bash
echo "🔍 Checking types..."
npm run typecheck || exit 1
echo "✨ Checking style..."
npm run lint || exit 1
echo "🧪 Running tests..."
npm test || exit 1
echo "✅ All checks passed!"
```

### 3. Context Templates

Simple markdown templates for common concerns:
```markdown
# validation-task.md
## Task: [Specific validation concern]

**Observable Behavior:**
- Given: [input]
- When: [action]
- Then: [expected output]

**Context:**
- Use existing types from: [file]
- Follow pattern from: [example]
- Return errors as: {valid: boolean, error?: string}
```

## The Real Requirements

### What Actually Matters

1. **Immediate feedback** - Know if code works within seconds
2. **Clear errors** - Understand what's wrong
3. **Observable verification** - Can see behavior, not just "tests pass"
4. **Low friction** - Easy to run after each change

### The Workflow That Works

```
1. Write observable behavior
2. AI implements concern
3. Run standard validation
4. Fix based on feedback
5. Verify behavior manually
6. Commit working code
```

## Integration With Existing Projects

**This framework requires zero new tools for most projects.**

If you have:
- A way to compile/check code
- A way to run tests
- A way to verify behavior

You have everything needed.

## Key Insight

The best tooling is **invisible tooling**. Use what you already have, focus on the pattern:
- Small concerns
- Immediate verification
- Clear feedback
- Observable outcomes

Tools should enhance this pattern, not complicate it.

## Summary

**Required**: TypeScript, a test runner, a linter
**Recommended**: Simple validation scripts
**Avoid**: Complex orchestration systems

The power is in the approach (concern-based development with immediate verification), not in sophisticated tooling.