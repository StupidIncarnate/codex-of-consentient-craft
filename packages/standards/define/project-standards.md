# Project Standards

## Universal File Rules

**File Naming:**

- All filenames must use kebab-case (e.g., `user-fetch-broker.ts`, `format-date-transformer.ts`)

**Function Exports:**

- All functions must use `export const` with arrow function syntax
- Exception: Error classes use `export class`
- **Always use named exports** - never use `export default` unless it's the index file and only if it's connecting to a
  system that requires it.

**Single Responsibility Per File:**

- Each file must contain and export exactly one primary piece of functionality
- Supporting types and interfaces directly related to that functionality may be co-exported
- No additional functions, classes, or unrelated exports allowed

**File Metadata Documentation:**

Every implementation file must have structured metadata comments at the very top (before imports):

- **Required format:**
  ```typescript
  /**
   * PURPOSE: [One-line description of what the file does]
   *
   * USAGE:
   * [Code example showing how to use it]
   * // [Comment explaining what it returns]
   */
  ```
- **Required for:** All implementation files (`-adapter.ts`, `-broker.ts`, `-guard.ts`, `-transformer.ts`,
  `-contract.ts`, `-statics.ts`, etc.)
- **Not required for:** Test files (`.test.ts`), proxy files (`.proxy.ts`), stub files (`.stub.ts`)
- **Position:** Must be at the very top of the file, before any imports
- **Enforcement:** Validated by `@questmaestro/enforce-file-metadata` ESLint rule

**Optional fields:**

- `WHEN-TO-USE:` - Guidance on when to use this utility
- `WHEN-NOT-TO-USE:` - Anti-guidance (when NOT to use it)

**Example:**

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

**Function Parameters:**

- **All app code functions must use object destructuring with inline types**
- Exception: Only when integrating with external APIs that require specific signatures
- **Pass complete objects** to preserve type relationships
- When you need just an ID, extract it with `Type['id']` notation

```tsx
// ✅ CORRECT - Object destructuring with Zod contract types
const updateUser = ({user, companyId}: { user: User; companyId: CompanyId }): Promise<User> => {
}

// ❌ AVOID - Positional parameters
const updateUser = (user: User, companyId: string) => {
}

// ✅ CORRECT - Complete objects preserve type relationships using contracts
const processOrder = ({user, companyId}: { user: User; companyId: CompanyId }): Promise<Order> => {
    // Type safety maintained - companyId is CompanyId branded type, not raw string
}

// ❌ AVOID - Individual properties using raw primitives
const processOrder = ({userName, userEmail, companyId}: {
    userName: string;     // Use UserName contract
    userEmail: string;    // Use EmailAddress contract
    companyId: string;    // Use CompanyId contract
}): Promise<Order> => {
}
```

**Import Rules:**

- **All imports at top of file** - No inline imports, requires, or dynamic imports
- **Use ES6 imports** - Prefer `import` over `require()`
- **Group imports logically** - External packages, then internal modules, then types

**Type Export Rules:**

- **All files except index.ts**: Only define types with `export type Name = { ... }`
- **index.ts files only**: Only re-export with `export type { Name } from './types'`
- **Never anywhere**: `export { type Name }` (forbidden inline syntax)

**TypeScript & Type Safety:**

- **Strict typing required** - No type suppression allowed
- **Use Zod contracts instead of primitives** - All `string`/`number` parameters must use branded Zod types
- **Explicit return types required** - All exported functions must have explicit return types using Zod contracts
- **Use existing types** from codebase or create new ones
- **For uncertain data** (external inputs, API responses, catch variables, JSON.parse): Use `unknown` and validate
  through contracts
- **Fix at source** - Never suppress errors with `@ts-ignore` or `@ts-expect-error`
- **Type inference** - Let TypeScript infer when values are clear, be explicit for:
    - Empty arrays and objects
    - Ambiguous values
  - ALL exported functions (explicit return types mandatory)
- **Type assertions vs satisfies**
    - Use `satisfies` to validate object structure while preserving inference
    - Use `as` only when you have information compiler lacks (JSON.parse, external data)
    - Never use `as` to bypass type errors - fix the type instead

```tsx
// ✅ CORRECT - satisfies validates without widening type
const config = {
    apiUrl: 'http://localhost',
    port: 3000,
} satisfies Partial<Config>;  // Validates structure, keeps literal types

// ✅ CORRECT - as for external data where you have guarantees
const data = JSON.parse(response) as ApiResponse;

// ❌ WRONG - as to bypass type errors
const broken = {} as ComplexType;  // Hides missing properties

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

// ✅ CORRECT - Explicit types for empty values
const users: User[] = [];  // Clear intent
const config: Record<UserId, User> = {};  // Use branded types in generics

// ✅ CORRECT - Type inference for clear values
const userId = user.id;  // Inferred from user type (already branded)
const names = users.map(u => u.name);  // Inferred from array (already branded)

// ❌ WRONG - Using 'any' type
const data: any = response.data;  // Loses all type safety
const processItem = (item: any) => {
};  // Dangerous

// ❌ WRONG - Using raw primitives in function signatures
export const badFunction = ({userId, name}: { userId: string; name: string }) => {
    // Use UserId and UserName contracts instead
};

// ❌ WRONG - Suppressing TypeScript errors
// @ts-ignore
const result = dangerousOperation();

// @ts-expect-error
const value = user.nonExistentProperty;

// ❌ WRONG - Disabling lint
/* eslint-disable */
const badCode = () => {
};  // Bypasses critical checks

// ✅ CORRECT - Create proper Zod contracts instead
export const apiResponseContract = z.object({
    data: z.array(userContract),
    meta: z.object({total: z.number().int().brand<'TotalCount'>()})
});
export type ApiResponse = z.infer<typeof apiResponseContract>;

// Function Arguments vs Return Types
// ban-primitives rule: Inputs allow primitives, returns require branded types
export type SomeService = {
    // ✅ CORRECT - Input args can use raw primitives (inline object types)
    doSomething: (params: { name: string; count: number }) => Result;

    // ✅ CORRECT - Return types must use branded types/contracts
    getUser: () => User;
    getConfig: () => { apiKey: ApiKey; timeout: Milliseconds };
};

export const processItem = ({item}: { item: User }): ProcessedUser => {
    return processedUserContract.parse({...item, processed: true});
};

// ✅ CORRECT - Type assertion when you have info compiler lacks
const data = JSON.parse(response) as ApiResponse;

// ❌ AVOID - Fighting TypeScript's inference
const count = (items.length as number) + 1;  // TypeScript already knows this

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

**Promise Handling:**

- **Always use async/await** over `.then()` chains for readability
- **Handle errors at appropriate level** - Not every async call needs try/catch
- **Use `Promise.all()`** for parallel operations when independent
- **Await sequentially** only when operations are dependent

**Loop Control:**

- **Use recursion for indeterminate loops** - Never use `while (true)` or loops with unchanging conditions
- **Recursion with early returns** for tree traversal, file system walking, config resolution

```tsx
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

**Error Handling:**

- **Handle errors explicitly** for every operation that can fail
- **Never silently swallow errors** - Always log, throw, or handle appropriately
- **Provide context** in error messages with relevant data

```tsx
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

**Performance & Code Cleanup:**

- **Default to efficient algorithms** - Dataset sizes are unknown; use Map/Set for lookups over nested array searches
- **Remove dead code** - Unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log
  statements
- **Use Reflect.deleteProperty()** - Never use `delete obj[key]` with computed keys (lint error)
- **Use Reflect.get()** - For accessing properties on objects when TypeScript narrows to `object` type (avoids unsafe
  type assertions from `object` to `Record<PropertyKey, unknown>`)

```tsx
// ✅ CORRECT - O(n) using Map for lookups
const userMap = new Map(users.map(user => [user.id, user]));
const targetUser = userMap.get(targetId);

// ❌ AVOID - O(n²) nested loops
const activeUsers = users.filter(user => {
    return otherUsers.find(other => other.id === user.id)?.isActive;
});

// ✅ CORRECT - Reflect.deleteProperty for computed keys
Reflect.deleteProperty(require.cache, resolvedPath);

// ❌ AVOID - delete with computed key
delete require.cache[resolvedPath];  // Lint error

// ✅ CORRECT - Reflect.get() to avoid unsafe type assertions
export const hasStringProperty = (params: {
  obj: unknown;
  property: string;
}): params is { obj: Record<PropertyKey, string>; property: string } => {
  const { obj, property } = params;
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

**CLI Output:**

- **Use process.stdout/stderr** - Never use `console.log()` or `console.error()` in CLI implementations
- **Standard output:** `process.stdout.write()` for normal output
- **Error output:** `process.stderr.write()` for errors
- **Include newlines:** Append `\n` explicitly to output strings

```tsx
// ✅ CORRECT - CLI output using process streams
process.stdout.write(`Processing ${count} files...\n`);
process.stderr.write(`Error: ${errorMessage}\n`);

// ❌ WRONG - console methods trigger lint errors
console.log(`Processing ${count} files...`);
console.error(`Error: ${errorMessage}`);
```

### Lint Enforcement

Layer files are validated by:

- `@questmaestro/enforce-project-structure` - validates folder allows layers
- `@questmaestro/enforce-implementation-colocation` - validates layer has parent in same directory
- File suffix rules - validates `-layer-` appears before folder suffix

See `packages/eslint-plugin/src/statics/folder-config/folder-config-statics.ts` for `allowsLayerFiles` configuration.

## Critical Context: Why This Structure Exists

LLMs instinctively "squirrel away" code based on semantic linking from training data. This creates organizational chaos,
especially with folders like "utils/", "lib/", and "helpers/". This structure forces deterministic organization by:

1. Eliminating ambiguous folders (utils, lib, helpers, common)
2. Using unconventional terms to bypass LLM training patterns
3. Providing explicit import rules that are mechanically enforced

**IMPORTANT:** If you think "this should go in utils/", refer to the mapping table below to find the correct location.

## Universal Project Structure

### The Only Allowed Folders

```
@types/             Typescript *.d.ts files
src/
├── statics/        # Immutable values (constants, enums, configs)
├── contracts/      # Zod schemas, types, and stubs ONLY
├── guards/         # Pure boolean functions (type guards)
├── transformers/   # Pure data transformation
├── errors/         # Error classes
├── flows/          # Route definitions and entry points
├── adapters/       # External package configuration/policy
├── middleware/     # Infrastructure orchestration (combines adapters)
├── brokers/        # Business operations and orchestration
├── bindings/       # Reactive connections (React hooks, watchers)
├── state/          # Data storage and memory management
├── responders/     # Route handlers
├── widgets/        # UI components (when UI exists)
├── startup/        # Application bootstrap
├── assets/         # Static files
├── migrations/     # Version upgrades
```


### Forbidden Folders - Where Code Actually Goes

| ❌ FORBIDDEN   | ✅ USE INSTEAD              | WHY                                                            |
|---------------|----------------------------|----------------------------------------------------------------|
| utils/        | adapters/ or transformers/ | Based on whether it wraps external packages or transforms data |
| lib/          | adapters/                  | External package wrappers only                                 |
| helpers/      | guards/ or transformers/   | Boolean functions → guards/, others → transformers/            |
| common/       | Distribute by function     | No catch-all folders allowed                                   |
| shared/       | Distribute by function     | No catch-all folders allowed                                   |
| core/         | brokers/                   | Business logic operations                                      |
| services/     | brokers/                   | Business operations                                            |
| repositories/ | brokers/                   | Data access operations                                         |
| models/       | contracts/                 | Data definitions and validation                                |
| types/        | contracts/                 | All types and interfaces                                       |
| interfaces/   | contracts/                 | Type definitions                                               |
| validators/   | contracts/                 | Validation schemas only                                        |
| constants/    | statics/                   | Immutable values, enums, config objects                        |
| config/       | statics/                   | Static configuration values                                    |
| enums/        | statics/                   | Enumerations                                                   |
| formatters/   | transformers/              | Data formatting                                                |
| mappers/      | transformers/              | Data mapping                                                   |
| converters/   | transformers/              | Data conversion                                                |

## Import Rules - What Can Import What

See `packages/eslint-plugin/src/statics/folder-config/folder-config-statics.ts` for full import mapping rules.

## Folder Definitions, Constraints, and Examples




## Frontend-Specific Rules

### Data Flow Architecture

**Critical Rules:**

1. **Widgets get data through bindings, never brokers**
    - ✅ Render phase: Call bindings only
    - ✅ Event handlers: Call brokers only
    - ❌ Never call brokers in render phase
    - ❌ Never call bindings in event handlers (React will error)

2. **Bindings call single brokers only (no orchestration)**
    - If you write `await` twice in a binding, move to brokers/
    - Multi-broker coordination = orchestration broker
    - Bindings manage state around ONE broker call

3. **Bindings return {data, loading, error} pattern**
    - Widgets just display these states
    - No try/catch in widgets - bindings handle errors

4. **Extend bindings with options, don't create variants**
    - ✅ One `useUserDataBinding` with options
    - ❌ Don't create `useUserWithRoleBinding`, `useUserWithCompanyBinding`

**Example:**

```tsx
// ✅ CORRECT - Simple binding wrapping one broker
// bindings/use-user-data/use-user-data-binding.ts
export const useUserDataBinding = ({userId}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        userFetchBroker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error};
};

// ✅ CORRECT - Widget using binding (not broker!)
// widgets/user-card/user-card-widget.tsx
export const UserCardWidget = ({userId}) => {
    const {data: user, loading, error} = useUserDataBinding({userId});
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error</div>;
    return <div>{user?.name}</div>;
};

// ❌ WRONG - Widget calling broker directly
export const UserCardWidget = ({userId}) => {
    const [user, setUser] = useState(null);
    useEffect(() => {
        userFetchBroker({userId}).then(setUser);  // Wrong layer!
    }, [userId]);
    return <div>{user?.name}</div>;
};

// ❌ WRONG - Binding with multiple brokers (orchestration)
export const useUserDataBinding = ({userId}) => {
    useEffect(() => {
        const user = await userFetchBroker({userId});  // First await
        const company = await companyFetchBroker({companyId: user.companyId});  // Second await - orchestration!
        setData({user, company});
    }, [userId]);
};

// ✅ CORRECT - Create orchestration broker, then extend binding with option
// brokers/user/fetch-with-company/user-fetch-with-company-broker.ts
export const userFetchWithCompanyBroker = async ({userId}) => {
    const user = await userFetchBroker({userId});
    const company = await companyFetchBroker({companyId: user.companyId});
    return {user, company};
};

// bindings/use-user-data/use-user-data-binding.ts (EXTEND existing file)
export const useUserDataBinding = ({
                                       userId,
                                       includeCompany = false
                                   }: {
    userId: string;
    includeCompany?: boolean;
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const broker = includeCompany ? userFetchWithCompanyBroker : userFetchBroker;
        broker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId, includeCompany]);

    return {data, loading, error};
};

// widgets/user-profile/user-profile-widget.tsx
export const UserProfileWidget = ({userId}) => {
    const {data, loading, error} = useUserDataBinding({userId, includeCompany: true});
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error</div>;
    return <div>{data.user.name} works at {data.company.name}</div>;
};
```

## Backend-Specific Rules


## File Discovery and Extension Rules

### Extension Over Creation

**Rule:** If a domain file exists, extend it with options - never create variant files.

**Search for existing domain files using MCP discovery:**

```typescript
// 1. Search for specific domain files
mcp__questmaestro__discover({type: "files", fileType: "broker", search: "user"})
mcp__questmaestro__discover({type: "files", fileType: "binding", search: "user-data"})

// 2. Get all files in a folder
mcp__questmaestro__discover({type: "files", path: "packages/eslint-plugin/src/brokers"})
mcp__questmaestro__discover({type: "files", path: "packages/eslint-plugin/src/bindings"})
```

**If domain exists → MUST extend existing files, not create new ones**

### Examples by Folder Type

**Bindings (extend with options):**

```tsx
// ✅ CORRECT - Extend existing binding with options
// bindings/use-user-data/use-user-data-binding.ts
export const useUserDataBinding = ({
                                       userId,
                                       includeCompany = false,
                                       includeRoles = false
                                   }: {
    userId: string;
    includeCompany?: boolean;
    includeRoles?: boolean;
}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const broker = includeCompany
            ? userFetchWithCompanyBroker
            : userFetchBroker;

        broker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId, includeCompany, includeRoles]);

    return {data, loading, error};
};

// ❌ WRONG - Creating variant files
// bindings/use-user-with-company/use-user-with-company-binding.ts  // DON'T CREATE!
// bindings/use-user-with-roles/use-user-with-roles-binding.ts      // DON'T CREATE!
```

**Brokers (create orchestration brokers for complex operations):**

```tsx
// ✅ CORRECT - Extend through orchestration broker
// brokers/user/fetch-with-company/user-fetch-with-company-broker.ts
export const userFetchWithCompanyBroker = async ({userId}: { userId: string }) => {
    const user = await userFetchBroker({userId});
    const company = await companyFetchBroker({companyId: user.companyId});
    return {user, company};
};

// Then use in binding:
// bindings/use-user-data/use-user-data-binding.ts (extended with option)
```


**Widgets (extend with props, not new files):**

```tsx
// ✅ CORRECT - Extend existing widget with props
// widgets/user-card/user-card-widget.tsx
export type UserCardWidgetProps = {
    userId: string;
    showCompany?: boolean;  // Add new prop
    showRoles?: boolean;    // Add new prop
};

export const UserCardWidget = ({userId, showCompany, showRoles}: UserCardWidgetProps) => {
    const {data: user, loading, error} = useUserDataBinding({
        userId,
        includeCompany: showCompany,
        includeRoles: showRoles
    });
    // Render logic with conditional display
};

// ❌ WRONG - Creating variant widgets
// widgets/user-card-with-company/user-card-with-company-widget.tsx  // DON'T CREATE!
```

### When to Create New Files

**DO create new files when:**

1. **New domain** - First time handling this domain (e.g., first payment broker)
2. **New action** - New business operation (e.g., `user-delete-broker.ts` when only `user-fetch-broker.ts` exists)
3. **Different folder type** - Same domain, different layer (e.g., `user-contract.ts`, `user-fetch-broker.ts`,
   `use-user-data-binding.ts`)
4. **Single responsibility violation** - Existing file does something fundamentally different

**DON'T create new files when:**

1. **Adding optional behavior** - Extend with options/props instead (e.g., `includeCompany`, `includeRoles`)
2. **Adding filters** - Extend with filter options instead (e.g., `{status?: 'active' | 'inactive'}`)
3. **Adding joins/relations** - Extend with include options instead (e.g., `{includeCompany?: boolean}`)
4. **Composing existing operations** - Create orchestration broker, then extend binding with option

**Examples of extending vs creating:**

```tsx
// ✅ EXTEND - Filtering is an option, not new action
export const userListBroker = async ({
                                         companyId,
                                         status
                                     }: {
    companyId: CompanyId;
    status?: UserStatus;  // Filter option using branded type
}): Promise<User[]> => {
    const url = `/api/companies/${companyId}/users` as Url;
    const response = await axiosGet({url});
    const users = z.array(userContract).parse(response.data);
    return status ? users.filter(u => u.status === status) : users;
};

// ❌ DON'T CREATE - user-fetch-active-broker.ts (this is a filter variant!)

// ✅ EXTEND - Lookup method is an option with proper types
export const userFetchBroker = async ({
                                          userId,
                                          email
                                      }: {
    userId?: UserId;
    email?: EmailAddress;
}): Promise<User> => {
    if (userId) {
        const url = `/api/users/${userId}` as Url;
        const response = await axiosGet({url});
        return userContract.parse(response.data);
    }
    if (email) {
        const url = `/api/users?email=${email}` as Url;
        const response = await axiosGet({url});
        return userContract.parse(response.data);
    }
    throw new Error('Must provide userId or email');
};

// ❌ DON'T CREATE - user-fetch-by-email-broker.ts (this is a lookup variant!)
```

