# Universal Standards

These standards apply to **all code** regardless of folder type.

## File Naming

**All filenames must use kebab-case:**

- ✅ `user-fetch-broker.ts`
- ✅ `format-date-transformer.ts`
- ❌ `userFetchBroker.ts`
- ❌ `format_date_transformer.ts`

## Function Exports

**All functions must use `export const` with arrow function syntax:**

```typescript
// ✅ CORRECT
export const userFetchBroker = async ({userId}: {userId: UserId}): Promise<User> => {
  // implementation
};

// ❌ WRONG
export function userFetchBroker(userId: UserId): Promise<User> {
  // implementation
}
```

**Exception:** Error classes use `export class`

```typescript
// ✅ CORRECT - Error classes
export class ValidationError extends Error {
    // implementation
}
```

**Always use named exports:**

- ✅ `export const userFetchBroker = ...`
- ❌ `export default function ...` (forbidden except index files connecting to systems that require it)

## Single Responsibility Per File

**Each file must contain and export exactly one primary piece of functionality:**

- Supporting types and interfaces directly related to that functionality may be co-exported
- No additional functions, classes, or unrelated exports allowed

```typescript
// ✅ CORRECT - One primary export with supporting types
export type UserFetchParams = {
    userId: UserId;
};

export const userFetchBroker = async ({userId}: UserFetchParams): Promise<User> => {
    // implementation
};

// ❌ WRONG - Multiple unrelated exports
export const userFetchBroker = async ({userId}: { userId: UserId }): Promise<User> => {
};
export const userCreateBroker = async ({data}: { data: UserData }): Promise<User> => {
};
export const userDeleteBroker = async ({userId}: { userId: UserId }): Promise<void> => {
};
```

## File Metadata Documentation

**Every implementation file must have structured metadata comments at the very top (before imports):**

### Required Format

```typescript
/**
 * PURPOSE: [One-line description of what the file does]
 *
 * USAGE:
 * [Code example showing how to use it]
 * // [Comment explaining what it returns]
 */
```

### Requirements

- **Required for:** All implementation files (`-adapter.ts`, `-broker.ts`, `-guard.ts`, `-transformer.ts`,
  `-contract.ts`, `-statics.ts`, etc.)
- **Not required for:** Test files (`.test.ts`), proxy files (`.proxy.ts`), stub files (`.stub.ts`)
- **Position:** Must be at the very top of the file, before any imports
- **Enforcement:** Validated by `@dungeonmaster/enforce-file-metadata` ESLint rule

### Optional Fields

- `WHEN-TO-USE:` - Guidance on when to use this utility
- `WHEN-NOT-TO-USE:` - Anti-guidance (when NOT to use it)

### Example

```typescript
/**
 * PURPOSE: Validates if a user has permission to perform an action
 *
 * USAGE:
 * hasPermissionGuard({user, permission: 'admin:delete'});
 * // Returns true if user has permission, false otherwise
 *
 * WHEN-TO-USE: Before executing privileged operations
 * WHEN-NOT-TO-USE: For public endpoints that don't require authorization
 */
import type {User} from '../../contracts/user/user-contract';
import type {Permission} from '../../contracts/permission/permission-contract';

export const hasPermissionGuard = ({user, permission}: {
    user?: User;
    permission?: Permission;
}): boolean => {
    if (!user || !permission) {
        return false;
    }
    return user.permissions.includes(permission);
};
```

## Function Parameters

**All app code functions must use object destructuring with inline types:**

```typescript
// ✅ CORRECT - Object destructuring with Zod contract types
export const updateUser = ({user, companyId}: { user: User; companyId: CompanyId }): Promise<User> => {
    // implementation
};

// ❌ AVOID - Positional parameters
export const updateUser = (user: User, companyId: string) => {
    // implementation
};
```

**Exception:** Only when integrating with external APIs that require specific signatures

**Pass complete objects to preserve type relationships:**

```typescript
// ✅ CORRECT - Complete objects preserve type relationships using contracts
export const processOrder = ({user, companyId}: { user: User; companyId: CompanyId }): Promise<Order> => {
    // Type safety maintained - companyId is CompanyId branded type, not raw string
};

// ❌ AVOID - Individual properties using raw primitives
export const processOrder = ({userName, userEmail, companyId}: {
    userName: string;     // Use UserName contract
    userEmail: string;    // Use EmailAddress contract
    companyId: string;    // Use CompanyId contract
}): Promise<Order> => {
    // implementation
};
```

**When you need just an ID, extract it with `Type['id']` notation**

## Import Rules

**All imports at top of file:**

- No inline imports, requires, or dynamic imports
- Use ES6 imports - Prefer `import` over `require()`
- Group imports logically - External packages, then internal modules, then types

```typescript
// ✅ CORRECT - All imports at top, grouped logically
import {readFile} from 'fs/promises';
import axios from 'axios';

import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker';
import {formatDateTransformer} from '../../transformers/format-date/format-date-transformer';

import type {User} from '../../contracts/user/user-contract';
import type {DateString} from '../../contracts/date-string/date-string-contract';

// ❌ WRONG - Inline imports
const loadUser = async () => {
    const {userFetchBroker} = await import('../../brokers/user/fetch/user-fetch-broker');
};
```

## Type Export Rules

**All files except index.ts:**

- Only define types with `export type Name = { ... }`

**index.ts files only:**

- Only re-export with `export type { Name } from './types'`

**Never anywhere:**

- `export { type Name }` (forbidden inline syntax)

```typescript
// ✅ CORRECT - Regular file
export type User = {
    id: UserId;
    name: UserName;
};

// ✅ CORRECT - index.ts re-export
export type {User} from './user-contract';

// ❌ WRONG - Forbidden inline syntax
export {type User} from './user-contract';
```

## TypeScript & Type Safety

### Strict Typing Required

- **No type suppression allowed** - Never use `@ts-ignore` or `@ts-expect-error`
- **Use Zod contracts instead of primitives** - All `string`/`number` parameters must use branded Zod types
- **Explicit return types required** - All exported functions must have explicit return types using Zod contracts
- **Use existing types** from codebase or create new ones

### For Uncertain Data

**External inputs, API responses, catch variables, JSON.parse:**

- Use `unknown` and validate through contracts

```typescript
// ✅ CORRECT - Strict typing with unknown and explicit return type
export const handleError = ({error}: { error: unknown }): ErrorMessage => {
    if (error instanceof Error) {
        return errorMessageContract.parse(error.message);
    }
    if (typeof error === 'string') {
        return errorMessageContract.parse(error);
    }
    return errorMessageContract.parse('Unknown error');
};
```

### Fix at Source

**Never suppress errors:**

```typescript
// ❌ WRONG - Suppressing TypeScript errors
// @ts-ignore
const result = dangerousOperation();

// @ts-expect-error
const value = user.nonExistentProperty;

// ❌ WRONG - Disabling lint
/* eslint-disable */
const badCode = () => {
};

// ✅ CORRECT - Create proper Zod contracts instead
export const apiResponseContract = z.object({
    data: z.array(userContract),
    meta: z.object({total: z.number().int().brand<'TotalCount'>()})
});
export type ApiResponse = z.infer<typeof apiResponseContract>;
```

### Type Inference

**Let TypeScript infer when values are clear, be explicit for:**

- Empty arrays and objects
- Ambiguous values
- **ALL exported functions** (explicit return types mandatory)

```typescript
// ✅ CORRECT - Explicit types for empty values
const users: User[] = [];
const config: Record<UserId, User> = {};

// ✅ CORRECT - Type inference for clear values
const userId = user.id;  // Inferred from user type (already branded)
const names = users.map(u => u.name);  // Inferred from array (already branded)

// ❌ WRONG - Using 'any' type
const data: any = response.data;  // Loses all type safety
```

### Type Assertions vs Satisfies

**Use `satisfies` to validate object structure while preserving inference:**

```typescript
// ✅ CORRECT - satisfies validates without widening type
const config = {
    apiUrl: 'http://localhost',
    port: 3000,
} satisfies Partial<Config>;  // Validates structure, keeps literal types
```

**Use `as` only when you have information compiler lacks:**

```typescript
// ✅ CORRECT - as for external data where you have guarantees
const data = JSON.parse(response) as ApiResponse;

// ❌ WRONG - as to bypass type errors
const broken = {} as ComplexType;  // Hides missing properties
```

**Never use `as` to bypass type errors - fix the type instead**

### Function Arguments vs Return Types

**ban-primitives rule: Inputs allow primitives, returns require branded types**

```typescript
export type SomeService = {
    // ✅ CORRECT - Input args can use raw primitives (inline object types)
    doSomething: (params: { name: string; count: number }) => Result;

    // ✅ CORRECT - Return types must use branded types/contracts
    getUser: () => User;
    getConfig: () => { apiKey: ApiKey; timeout: Milliseconds };
};

// ✅ CORRECT - Explicit return type for exported function using contracts
export const loadConfig = (): Config => {
    return configContract.parse({
        apiUrl: process.env.API_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.TIMEOUT || '5000')
    });
};

// ✅ CORRECT - Exported functions must have explicit return type
export const processUser = ({user}: { user: User }): ProcessedUser => {
    return processedUserContract.parse({
        ...user,
        displayName: `${user.firstName} ${user.lastName}`,
        isActive: user.status === 'active'
    });
};

// ✅ CORRECT - Internal functions can use inference
const isEven = ({n}: { n: PositiveNumber }) => {
    return n % 2 === 0;  // TypeScript infers boolean
};
```

### No Raw Primitives

```typescript
// ❌ WRONG - Using raw primitives in function signatures
export const badFunction = ({userId, name}: { userId: string; name: string }) => {
    // Use UserId and UserName contracts instead
};

// ✅ CORRECT - Use branded types from contracts
export const goodFunction = ({userId, name}: { userId: UserId; name: UserName }): Result => {
    // implementation
};
```

## Promise Handling

**Always use async/await over `.then()` chains for readability:**

```typescript
// ✅ CORRECT - Parallel when independent with explicit types
const [user, config, permissions] = await Promise.all([
    fetchUser({id: userId}),     // userId is UserId branded type
    loadConfig(),                // Returns Config contract
    getPermissions({id: userId}) // userId is UserId branded type
]);

// ❌ AVOID - Sequential when could be parallel
const user = await fetchUser({id: userId});
const config = await loadConfig();
const permissions = await getPermissions({id: userId});

// ✅ CORRECT - Sequential when dependent with branded types
const user = await fetchUser({id: userId});
const company = await fetchCompany({companyId: user.companyId});  // companyId is CompanyId branded type
```

**Handle errors at appropriate level:**

- Not every async call needs try/catch
- Use `Promise.all()` for parallel operations when independent
- Await sequentially only when operations are dependent

## Loop Control

**Use recursion for indeterminate loops:**

- Never use `while (true)` or loops with unchanging conditions
- Recursion with early returns for tree traversal, file system walking, config resolution

```typescript
// ✅ CORRECT - Recursion for indeterminate loops
const findConfig = async ({path}: { path: string }): Promise<string> => {
    try {
        const config = await loadConfig({path});
        return config;
    } catch {
        const parent = getParent({path});
        return await findConfig({path: parent});  // Recurse with early return
    }
};

// ❌ AVOID - while (true) triggers lint errors
while (true) {
    const config = await loadConfig({path});  // Lint: await in loop, unnecessary condition
    if (config) break;
    path = getParent({path});
}
```

**Regular loops are fine:**

- `for` loops over arrays
- `.forEach()`, `.map()`, `.filter()`
- Loops with clear termination conditions

## Error Handling

**Handle errors explicitly for every operation that can fail:**

```typescript
// ✅ CORRECT - Error with context using path contracts and explicit return type
export const loadConfig = async ({path}: { path: AbsoluteFilePath }): Promise<Config> => {
    try {
        const content = await readFile(path, 'utf8');
        return configContract.parse(JSON.parse(content));
    } catch (error) {
        throw new Error(`Failed to load config from ${path}: ${error}`);
    }
};

// ✅ CORRECT - Handle at appropriate level with branded types and explicit return type
export const processUser = async ({userId}: { userId: UserId }): Promise<User> => {
    // Let broker throw, catch at responder level
    const user = await userFetchBroker({userId});
    return user;
};
```

**Never silently swallow errors:**

```typescript
// ❌ AVOID - Silent error swallowing
const loadConfig = async ({path}: { path: string }) => {  // Use AbsoluteFilePath
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        return {};  // Silent failure loses critical information!
    }
};

// ❌ AVOID - Generic error without context and raw string path
throw new Error('Config load failed');  // What path? What error?
```

**Always:**

- Log, throw, or handle appropriately
- Provide context in error messages with relevant data

## Performance & Code Cleanup

### Default to Efficient Algorithms

**Dataset sizes are unknown - use Map/Set for lookups over nested array searches:**

```typescript
// ✅ CORRECT - O(n) using Map for lookups
const userMap = new Map(users.map(user => [user.id, user]));
const targetUser = userMap.get(targetId);

// ❌ AVOID - O(n²) nested loops
const activeUsers = users.filter(user => {
    return otherUsers.find(other => other.id === user.id)?.isActive;
});
```

### Remove Dead Code

**Delete:**

- Unused variables/parameters
- Unreachable code
- Orphaned files
- Commented-out code
- console.log statements

### Use Reflect Methods

**Use Reflect.deleteProperty() - Never use `delete obj[key]` with computed keys:**

```typescript
// ✅ CORRECT - Reflect.deleteProperty for computed keys
Reflect.deleteProperty(require.cache, resolvedPath);

// ❌ AVOID - delete with computed key
delete require.cache[resolvedPath];  // Lint error
```

**Use Reflect.get() - For accessing properties on objects when TypeScript narrows to `object` type:**

```typescript
// ✅ CORRECT - Reflect.get() to avoid unsafe type assertions
export const hasStringProperty = (params: {
    obj: unknown;
    property: string;
}): params is { obj: Record<PropertyKey, string>; property: string } => {
    const {obj, property} = params;
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    // After narrowing, obj is type `object` (broad: arrays, functions, classes, plain objects)
    // Reflect.get() safely accesses properties without asserting to Record<PropertyKey, unknown>
    return property in obj && typeof Reflect.get(obj, property) === 'string';
};

// ❌ AVOID - Type assertion from object to Record
const record = obj as Record<string, unknown>;  // Lint error: unsafe type assertion
return typeof record[property] === 'string';
```

## CLI Output

**Use process.stdout/stderr - Never use `console.log()` or `console.error()` in CLI implementations:**

```typescript
// ✅ CORRECT - CLI output using process streams
process.stdout.write(`Processing ${count} files...\n`);
process.stderr.write(`Error: ${errorMessage}\n`);

// ❌ WRONG - console methods trigger lint errors
console.log(`Processing ${count} files...`);
console.error(`Error: ${errorMessage}`);
```

**Rules:**

- **Standard output:** `process.stdout.write()` for normal output
- **Error output:** `process.stderr.write()` for errors
- **Include newlines:** Append `\n` explicitly to output strings

## Summary Checklist

Before committing any code, verify:

- [ ] File uses kebab-case naming
- [ ] Function uses `export const` with arrow syntax
- [ ] File has PURPOSE/USAGE metadata comment at top
- [ ] Function parameters use object destructuring
- [ ] All imports are at the top of the file
- [ ] Exported function has explicit return type using contracts
- [ ] No `any`, `@ts-ignore`, or type suppressions
- [ ] All string/number types are branded through Zod contracts
- [ ] Error handling provides context
- [ ] No `console.log` in production code
- [ ] No `while (true)` loops (use recursion)
- [ ] Efficient algorithms (Map/Set for lookups)
- [ ] No dead code or commented-out code
