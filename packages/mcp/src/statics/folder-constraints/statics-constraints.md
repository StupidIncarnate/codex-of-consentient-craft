**FOLDER STRUCTURE:**

```
statics/
  user/
    user-statics.ts
    user-statics.test.ts
  api/
    api-statics.ts
    api-statics.test.ts
```

**CRITICAL RULES:**

1. **Always use `as const`** - Enforces readonly at compile time
2. **No primitives at root** - Root must contain only objects or arrays (enforced by
   `@dungeonmaster/enforce-grouped-statics`)
3. **No conditionals** - No if/else, ternaries, or logic in statics (pure data only)
4. **One export per file** - Single object with `Statics` suffix

**WHY NO ROOT PRIMITIVES:**

Forces better organization and prevents flat constant dumps:

```typescript
// ❌ WRONG - primitives at root
export const userStatics = {
    maxLoginAttempts: 5,        // Too flat
    sessionTimeout: 3600,       // Hard to find related values
    passwordMinLength: 8        // No grouping
} as const;

// ✅ CORRECT - primitives nested in meaningful groups
export const userStatics = {
    limits: {                   // Grouped by purpose
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        passwordMinLength: 8
    }
} as const;
```

**EXAMPLES:**

```typescript
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
            sessionTimeout: 3600,
            passwordMinLength: 8
        },
        defaults: {
            avatarUrl: 'https://example.com/default-avatar.png',
            locale: 'en-US'
        }
    } as const;

/**
 * PURPOSE: Defines immutable API configuration values and timeouts
 *
 * USAGE:
 * apiStatics.endpoints.users;
 * // Returns '/api/users' endpoint constant
 */
// statics/api/api-statics.ts
export const apiStatics = {
    endpoints: {
        users: '/api/users',
        auth: '/api/auth',
        posts: '/api/posts'
    },
    timeout: {
        default: 5000,
        long: 30000
    },
    retries: {
        maxAttempts: 3,
        backoffMs: 1000
    }
} as const;

/**
 * PURPOSE: Defines immutable validation rules and patterns for user input
 *
 * USAGE:
 * validationStatics.email.pattern;
 * // Returns email validation regex pattern
 */
// statics/validation/validation-statics.ts
export const validationStatics = {
    email: {
        maxLength: 255,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
    },
    password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireNumber: true
    },
    username: {
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/u
    }
} as const;
```

**WHY NO ROOT PRIMITIVES:**

```typescript
// ❌ WRONG - primitives at root
export const userStatics = {
    maxLoginAttempts: 5,  // Primitive at root
    sessionTimeout: 3600   // Primitive at root
} as const;

// ✅ CORRECT - primitives nested in objects
export const userStatics = {
    limits: {
        maxLoginAttempts: 5,
        sessionTimeout: 3600
    }
} as const;
```

This enforces better organization and makes statics more maintainable.
