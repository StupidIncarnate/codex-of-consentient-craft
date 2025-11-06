# statics/ - Immutable Values

**Purpose:** Immutable configuration values, constants, and enums

**Folder Structure:**

```
statics/
  user/
    user-statics.ts
    user-statics.proxy.ts    # Overrides for tests
    user-statics.test.ts
  eslint/
    eslint-statics.ts
    eslint-statics.proxy.ts
    eslint-statics.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-statics.ts` (e.g., `user-statics.ts`, `api-statics.ts`)
- **Export:** camelCase ending with `Statics` (e.g., `userStatics`, `apiStatics`)
- **Proxy:** kebab-case ending with `-statics.proxy.ts`, export `[name]StaticsProxy` (e.g., `userStaticsProxy`)

**Constraints:**

- **One export per file:** Single object with `Statics` suffix
- **Root must contain only objects or arrays** (no primitives at root level - enforced by lint)
- **Always use `as const`** for readonly enforcement
- **No conditionals in statics** - Use proxy to override values for tests (dev/prod/test envs)
- **Proxy required** - Every statics file needs a proxy for test value overrides

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
