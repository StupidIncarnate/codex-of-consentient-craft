# statics/ - Immutable Values

**Purpose:** Immutable configuration values, constants, and enums

**Folder Structure:**

```
statics/
  user/
    user-statics.ts
    user-statics.test.ts
  eslint/
    eslint-statics.ts
    eslint-statics.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-statics.ts` (e.g., `user-statics.ts`, `api-statics.ts`)
- **Export:** camelCase ending with `Statics` (e.g., `userStatics`, `apiStatics`)

**Constraints:**

- **One export per file:** Single object with `Statics` suffix
- **Root must contain only objects or arrays** (no primitives at root level - enforced by lint)
- **Always use `as const`** for readonly enforcement
- **No conditionals in statics** (pure data only)
- **No proxy needed** — statics are immutable with no dependencies to mock

**Example:**

```tsx
/**
 * PURPOSE: Defines immutable configuration values for user management
 *
 * USAGE:
 * userStatics.roles.admin;
 * // Returns 'admin' role constant
 */
// statics/user/user-statics.ts
export const userStatics = {
        roles: {
            admin: 'admin',
            user: 'user',
            guest: 'guest'
        },
        limits: {
            maxLoginAttempts: 5,
            sessionTimeout: 3600
        }
    } as const;

/**
 * PURPOSE: Defines immutable ESLint rule configuration values
 *
 * USAGE:
 * eslintStatics.rules.maxDepth;
 * // Returns 4 (maximum nesting depth)
 */
// statics/eslint/eslint-statics.ts
export const eslintStatics = {
    rules: {
        maxDepth: 4,
        maxNestedCallbacks: 4
    },
    config: {
        ignorePatterns: ['node_modules', 'dist']
    }
} as const;
```

## Testing

Statics require colocated unit tests. No proxy file needed — statics are pure immutable data with no dependencies to mock. Import the static directly and assert against its real values using `toStrictEqual`.

### Approach

Statics tests verify the **complete shape and exact values** of the exported object. This catches accidental deletions, typos, and structural drift. Since statics are `as const`, the test is a contract that the data hasn't changed unexpectedly.

### Structure

One `describe` per top-level group. Assert the full group object with `toStrictEqual` — not individual keys, not existence checks, not length checks.

```typescript
// statics/user/user-statics.test.ts
import { userStatics } from './user-statics';

describe('userStatics', () => {
  describe('roles', () => {
    it('VALID: roles => contains all role constants', () => {
      expect(userStatics.roles).toStrictEqual({
        admin: 'admin',
        user: 'user',
        guest: 'guest',
      });
    });
  });

  describe('limits', () => {
    it('VALID: limits => contains login and session constraints', () => {
      expect(userStatics.limits).toStrictEqual({
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
      });
    });
  });
});
```

For flat mapping statics (key→value dictionaries), assert the entire object in a single test:

```typescript
// statics/folder-constraints/folder-constraints-statics.test.ts
import { folderConstraintsStatics } from './folder-constraints-statics';

describe('folderConstraintsStatics', () => {
  it('VALID: all folder types => maps to constraint filenames', () => {
    expect(folderConstraintsStatics).toStrictEqual({
      adapters: 'adapters-constraints.md',
      bindings: 'bindings-constraints.md',
      brokers: 'brokers-constraints.md',
      contracts: 'contracts-constraints.md',
      errors: 'errors-constraints.md',
      flows: 'flows-constraints.md',
      guards: 'guards-constraints.md',
      middleware: 'middleware-constraints.md',
      responders: 'responders-constraints.md',
      state: 'state-constraints.md',
      statics: 'statics-constraints.md',
      startup: 'startup-constraints.md',
      transformers: 'transformers-constraints.md',
      widgets: 'widgets-constraints.md',
    });
  });
});
```

### Rules

- **No proxy, no mocking** — import the real static and assert against it directly
- **Use `toStrictEqual` on groups or the full object** — catches extra/missing properties
- **Assert exact values, not existence** — `toBe('admin')` not `toBeDefined()`
- **No `beforeEach`/`afterEach` hooks** — each test is self-contained
- **Use assertion prefixes** — `VALID:` for expected shape, `EDGE:` for boundary values
- **No snapshots** — snapshots are brittle and don't communicate intent; write explicit assertions
- **Large statics with many groups** — one `describe` + one `toStrictEqual` per top-level group
- **Small/flat statics** — one `toStrictEqual` on the entire object is sufficient
