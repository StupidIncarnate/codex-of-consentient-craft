# Claude Code Hooks

This package contains hooks that integrate with Claude Code to provide automated code quality guardrails and safety
checks during development.

## Overview

Hooks are scripts that run automatically when certain Claude Code operations occur. They can inspect, validate, and
potentially block operations to maintain code quality and safety standards.

## Available Hooks

### Pre-Edit Lint Guardrail

**Location:** `src/pre-edit-lint/`

A pre-edit hook that prevents code changes from introducing specific ESLint violations. This guardrail runs before
Write, Edit, and MultiEdit operations to ensure code quality standards are maintained.

**Key Features:**

- ✅ **Configurable Rules** - Specify which ESLint rules to enforce via `.questmaestro-hooks.config.js`
- ✅ **New Violations Only** - Only blocks new violations, allows fixing existing ones
- ✅ **Multi-Tool Support** - Works with Write, Edit, and MultiEdit operations
- ✅ **Performance Optimized** - Config caching and fallback strategies
- ✅ **Project Integration** - Uses your project's existing ESLint configuration

**Default Enforced Rules:**

- `@typescript-eslint/no-explicit-any` - Prevents use of `any` type
- `@typescript-eslint/ban-ts-comment` - Blocks `@ts-ignore` and `@ts-expect-error` comments
- `eslint-comments/no-use` - Prevents `eslint-disable` comments

**Configuration:**
Create `.questmaestro-hooks.config.js` in your project root:

```javascript
module.exports = {
  preEditLint: {
    rules: [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-ts-comment',
      'eslint-comments/no-use',
      // Add more rules as needed
    ],
  },
};
```

**Performance:**

- First run: ~2-3 seconds (ESLint initialization)
- Cached runs: Near-instant within same process
- Each hook invocation spawns new process (no cross-operation caching)

## ESLint Rule Types

Understanding rule types is crucial for hook performance and compatibility:

### Syntax-Only Rules ✅

**Work without TypeScript type information - Fast & Reliable**

- Only need AST parsing, no `tsconfig.json` required
- Check code patterns, syntax, comments, literal values
- Compatible with fallback parsing (when files don't exist on disk)

**Examples:**

- `@typescript-eslint/no-explicit-any` - Looks for `any` keyword
- `@typescript-eslint/ban-ts-comment` - Scans for comment patterns
- `eslint-comments/no-use` - Detects eslint-disable comments
- `@typescript-eslint/prefer-const` - Analyzes variable declarations
- `@typescript-eslint/no-unused-vars` - Checks identifier usage

### Type-Aware Rules ⚠️

**Require TypeScript type information - Slower & Complex**

- Need `parserOptions.project` and full TypeScript compilation
- Perform cross-file type inference and type compatibility checking
- May fail for non-existent files (Write operations)

**Examples:**

- `@typescript-eslint/no-unsafe-call` - Requires callable type analysis
- `@typescript-eslint/no-unsafe-assignment` - Needs type compatibility
- `@typescript-eslint/prefer-nullish-coalescing` - Requires null/undefined analysis
- `@typescript-eslint/no-floating-promises` - Needs Promise type detection

### Rule Type Identification

1. **Check rule documentation** at https://typescript-eslint.io/rules/
2. **Look for "Requires type information" badge** in the docs
3. **Test without `parserOptions.project`** - type-aware rules will fail

### Hook Compatibility

- ✅ **Syntax-only rules** work reliably in hooks
- ⚠️ **Type-aware rules** may require special handling or project setup
- 🔄 **Fallback logic** removes type information for compatibility when needed

## Testing

**Unit Tests:**

```bash
npm test
```

**Integration Tests:**

```bash
npm test -- pre-edit-lint.integration.test.ts
```

**Manual Testing:**
See `src/pre-edit-lint/TEST-CASES.md` for comprehensive manual test procedures.

**Performance Tests:**
Integration tests include performance benchmarks to ensure hooks remain responsive:

- Typical files: < 3 seconds
- Large files: < 3 seconds
- Violation detection: < 3 seconds
