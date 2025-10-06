# Project Standards

## Universal File Rules

**File Naming:**

- All filenames must use kebab-case (e.g., `user-fetch-broker.ts`, `format-date-transformer.ts`)

**Function Exports:**

- All functions must use `export const` with arrow function syntax
- Exception: Error classes use `export class`
- **Always use named exports** - never use `export default` unless it's the index file and only if its connecting to a
  system that requires it.

**Single Responsibility Per File:**

- Each file must contain and export exactly one primary piece of functionality
- Supporting types and interfaces directly related to that functionality may be co-exported
- No additional functions, classes, or unrelated exports allowed

**Function Parameters:**

- **All app code functions must use object destructuring with inline types**
- Exception: Only when integrating with external APIs that require specific signatures
- **Pass complete objects** to preserve type relationships
- When you need just an ID, extract it with `Type['id']` notation

```typescript
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

- **All imports at top of file** - No inline imports, requires, or dynamic imports except for performance/lazy loading
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

```typescript
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

**Error Handling:**

- **Handle errors explicitly** for every operation that can fail
- **Never silently swallow errors** - Always log, throw, or handle appropriately
- **Provide context** in error messages with relevant data

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
  type assertions from `object` to `Record<string, unknown>`)

```typescript
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
}): params is { obj: Record<string, string>; property: string } => {
  const { obj, property } = params;
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  // After narrowing, obj is type `object` (broad: arrays, functions, classes, plain objects)
  // Reflect.get() safely accesses properties without asserting to Record<string, unknown>
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

**Special Case: Global Type Declarations**

The `@types/` folder is allowed **at package root only** (not in `src/`) for global TypeScript type augmentations:

```
package-root/
├── @types/
│   └── error-cause.d.ts     # Global type augmentations (e.g., extending Error)
├── src/
│   └── contracts/           # Application contracts (NOT @types or types/)
└── package.json
```

- **Use for:** Extending built-in JavaScript/TypeScript types (`Error`, `Window`, etc.)
- **Do NOT use for:** Application types (those go in `src/contracts/`)
- **Files:** Only `.d.ts` declaration files allowed

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

```
startup/ → ALL (bootstrap only, no business logic)
flows/ → responders/ (ONLY)
responders/ → widgets/ (UI only), brokers/, bindings/ (UI only), state/, contracts/, transformers/, guards/, statics/, errors/
widgets/ → bindings/, brokers/, state/, contracts/, transformers/, guards/, statics/, errors/ (UI only)
bindings/ → brokers/, state/, contracts/, statics/, errors/ (UI only)
brokers/ → brokers/, adapters/, contracts/, statics/, errors/
middleware/ → adapters/, middleware/, statics/
adapters/ → node_modules, middleware/, statics/ (when coupled)
transformers/ → contracts/, statics/, errors/
guards/ → contracts/, statics/, errors/
state/ → contracts/, statics/, errors/
contracts/ → statics/, errors/, validation-library-only (zod)
statics/ → (no imports)
errors/ → (no imports)
```

## Folder Definitions, Constraints, and Examples

### statics/ - Immutable Values

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
- **CAN import:** Nothing (foundational layer)

**Example:**

```typescript
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

// statics/api/api-statics.ts
export const apiStatics = {
  timeout: {
    default: 5000,
    long: 30000
  },
  endpoints: {
    users: '/api/users',
    posts: '/api/posts'
  }
} as const;
```

### contracts/ - Data Contracts

**Purpose:** Zod schemas, inferred types, and test stubs

**Folder Structure:**

```
contracts/
  user/
    user-contract.ts
    user-contract.test.ts
    user.stub.ts
  user-id/
    user-id-contract.ts
    user-id-contract.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-contract.ts` (e.g., `user-contract.ts`, `email-contract.ts`)
- **Exports:**
    - Schemas: camelCase ending with `Contract` (e.g., `userContract`, `emailContract`)
  - Types: PascalCase (e.g., `User`, `EmailAddress`)
- **Stubs:** kebab-case with `.stub.ts` extension (e.g., `user.stub.ts`)

**Constraints:**

- **ONLY ALLOWED:**
    - Zod schemas (or configured validation library)
    - TypeScript types inferred from schemas: `export type User = z.infer<typeof userContract>`
    - Stub files (`.stub.ts`) for testing
- **MUST** use `.brand<'TypeName'>()` on all Zod string/number schemas (no raw primitives)
- **CAN** import statics/, errors/, and validation library (zod) ONLY

**Example:**

```typescript
// contracts/user-id/user-id-contract.ts
import {z} from 'zod';

export const userIdContract = z.string()
    .uuid()
    .brand<'UserId'>();
export type UserId = z.infer<typeof userIdContract>;

// contracts/email-address/email-address-contract.ts
import {z} from 'zod';

export const emailAddressContract = z.string()
    .email()
    .brand<'EmailAddress'>();
export type EmailAddress = z.infer<typeof emailAddressContract>;

// contracts/user/user-contract.ts
import {z} from 'zod';
import {userIdContract} from '../user-id/user-id-contract';
import {emailAddressContract} from '../email-address/email-address-contract';

export const userContract = z.object({
    id: userIdContract,
    email: emailAddressContract,
    name: z.string().min(1).brand<'UserName'>()
});

export type User = z.infer<typeof userContract>;

// contracts/user/user.stub.ts
import {userContract} from './user-contract';
import type {User} from './user-contract';

export const UserStub = (props: Partial<User> = {}): User => {
  return userContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'john@example.com',
    name: 'John Doe',
    ...props,
  });
};
```

### guards/ - Type Guards and Boolean Checks

**Purpose:** Pure boolean functions for type guards and business logic checks

**Folder Structure:**

```
guards/
  has-permission/
    has-permission-guard.ts
    has-permission-guard.test.ts
  is-valid-email/
    is-valid-email-guard.ts
    is-valid-email-guard.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-guard.ts` (e.g., `has-permission-guard.ts`, `is-admin-guard.ts`)
- **Export:** camelCase ending with `Guard`, starting with `is/has/can/should/will/was` (e.g., `hasPermissionGuard`,
  `isValidEmailGuard`)

**Constraints:**

- **MUST be pure functions** (no external calls, no side effects)
- **MUST return boolean**
- **MUST have explicit return types**
- **CAN** import contracts/ (types only), statics/, errors/

**Example:**

```typescript
// guards/has-permission/has-permission-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {Permission} from '../../contracts/permission/permission-contract';

export const hasPermissionGuard = ({user, permission}: {
  user: User;
  permission: Permission;
}): boolean => {
  return user.permissions.includes(permission);
};

// guards/is-admin/is-admin-guard.ts
import type {User} from '../../contracts/user/user-contract';
import {userStatics} from '../../statics/user/user-statics';

export const isAdminGuard = ({user}: { user: User }): boolean => {
  return user.role === userStatics.roles.ADMIN;
};

// guards/can-edit-post/can-edit-post-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {Post} from '../../contracts/post/post-contract';

export const canEditPostGuard = ({user, post}: {
  user: User;
  post: Post;
}): boolean => {
  return user.id === post.authorId || user.role === 'admin';
};
```

### transformers/ - Pure Data Transformation

**Purpose:** Pure functions that transform data (non-boolean returns only)

**Folder Structure:**

```
transformers/
  format-date/
    format-date-transformer.ts
    format-date-transformer.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-transformer.ts` (e.g., `format-date-transformer.ts`)
- **Export:** camelCase ending with `Transformer` (e.g., `formatDateTransformer`, `userToDtoTransformer`)

**Constraints:**

- **Must** be pure functions (no side effects)
- **Must** have explicit return types using Zod contracts (no raw primitives)
- **Must** validate output using appropriate contract before returning
- **CAN** import contracts/ and errors/

**Example:**

```typescript
// transformers/format-date/format-date-transformer.ts
import {dateStringContract} from '../../contracts/date-string/date-string-contract';
import type {DateString} from '../../contracts/date-string/date-string-contract';

export const formatDateTransformer = ({date}: { date: Date }): DateString => {
    const formatted = date.toISOString().split('T')[0];
    return dateStringContract.parse(formatted);
};
```

### errors/ - Error Classes

**Purpose:** Error classes and exception handling

**Folder Structure:**

```
errors/
  validation/
    validation-error.ts
    validation-error.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-error.ts` (e.g., `validation-error.ts`)
- **Export:** PascalCase ending with `Error` (e.g., `ValidationError`, `NetworkError`)

**Constraints:**

- **Must** extend Error class
- **No imports** (foundational layer)

**Example:**

```typescript
// errors/validation/validation-error.ts
export class ValidationError extends Error {
    public constructor({message, field}: { message: string; field?: string }) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
```

### flows/ - Route Definitions

**Purpose:** Route definitions and entry points (maps paths to responders)

**Folder Structure:**

```
flows/
  user/
    user-flow.ts
    user-flow.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-flow.ts` or `-flow.tsx` (e.g., `user-flow.tsx`)
- **Export:** PascalCase ending with `Flow` (e.g., `UserFlow`, `CheckoutFlow`)
- **Pattern:** flows/[domain]/[domain]-flow.ts(x)

**Constraints:**

- **CAN ONLY** import responders/
- **Frontend:** Use react-router-dom Route/Routes
- **Backend:** Use express.Router
- **Package:** Entry files that compose public API

**Example:**

```tsx
// flows/user/user-flow.tsx (Frontend)
import {Route} from 'react-router-dom';
import {UserProfileResponder} from '../../responders/user/profile/user-profile-responder';

export const UserFlow = () => (
    <Route path="/users">
        <Route path=":id" element={<UserProfileResponder />} />
    </Route>
);

// flows/user/user-flow.ts (Backend)
import {Router} from 'express';
import {UserGetResponder} from '../../responders/user/get/user-get-responder';

const router = Router();
router.get('/users/:id', async (req, res, next) => {
    try {
        await UserGetResponder({req, res});
    } catch (error) {
        next(error);
    }
});

export const UserFlow = router;
```

### adapters/ - External Package Configuration

**Purpose:** Add project-wide policies to external packages (auth, timeout, retry, logging)

**Folder Structure:**

```
adapters/
  axios/
    axios-get-adapter.ts
    axios-get-adapter.test.ts
    axios-post-adapter.ts
    axios-post-adapter.test.ts
    axios-put-adapter.ts
    axios-put-adapter.test.ts
  aws-sdk-client-s3/
    aws-sdk-client-s3-upload-adapter.ts
    aws-sdk-client-s3-upload-adapter.test.ts
    aws-sdk-client-s3-download-adapter.ts
    aws-sdk-client-s3-download-adapter.test.ts
    aws-sdk-client-s3-delete-adapter.ts
    aws-sdk-client-s3-delete-adapter.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[package-name]-[export-name]-adapter.ts` (ALL adapters require -adapter.ts suffix)
- **Export:**
    - **Value adapters:** camelCase ending with `Adapter` (e.g., `axiosGetAdapter`, `fsReadFileAdapter`)
    - **Type re-exports:** Re-exported with alias ending in `Adapter` (e.g.,
      `export { RuleTester as eslintRuleTesterAdapter }`)
    - **Type-only re-exports:** Can skip export name validation but MUST have -adapter.ts file suffix
- **Pattern:** adapters/[package-name]/[package-name]-[export-name]-adapter.ts (ALL files require -adapter.ts)
- **Discovery:** `ls adapters/[package]/` shows all available exports from that package

**Constraints:**

- **CRITICAL: One export per file** - Each adapter file must export exactly one function, type, or class
    - ✅ `adapters/axios/axios-get-adapter.ts` (single export: `axiosGetAdapter`)
    - ✅ `adapters/eslint/eslint-rule-adapter.ts` (type re-export: `export type { Rule } from "eslint"`)
    - ✅ `adapters/eslint/eslint-rule-tester-adapter.ts` (class re-export:
      `export { RuleTester as eslintRuleTesterAdapter } from "eslint"`)
    - ❌ `adapters/axios/axios-requests-adapter.ts` with multiple exports (violates single responsibility)
- **EVOLUTION RULE:** Created on-demand when lint detects duplicate package usage
- **Naming:** Based on package's function names, NOT business domain
    - ✅ `adapters/stripe/stripe-charges-create-adapter.ts` (wraps stripe.charges.create, exports
      `stripeChargesCreateAdapter`)
    - ❌ `adapters/stripe/payment-adapter.ts` (business domain)
- **Must** add project-specific configuration (timeout, auth, retry)
- **Must** know NOTHING about business logic
- **Must** use Zod contract types for all parameters (inputs)
- **Return types** - Choose based on consumer needs:

| Consumer Needs                              | Return Type   | Re-export | Example                  |
|---------------------------------------------|---------------|-----------|--------------------------|
| Library features (status, headers, methods) | npm type      | Yes       | `Promise<AxiosResponse>` |
| Primitives or simple data only              | Contract type | No        | `Promise<FileContents>`  |

- **Must** re-export npm types when using them as return types
- **Must** validate and brand primitive returns through contracts before returning
- **CAN** import node_modules and middleware/ (when coupled)

**Examples:**

```typescript
// Pattern 1: Return npm type (broker needs library features)
// adapters/axios/axios-get-adapter.ts
import axios, {type AxiosResponse} from 'axios';
import type {Url} from '../../contracts/url/url-contract';

export type {AxiosResponse};

export const axiosGetAdapter = async ({url}: { url: Url }): Promise<AxiosResponse> => {
    return await axios.get(url, {
        headers: {'Authorization': `Bearer ${getToken()}`},
        timeout: 10000
    });
};
```

```typescript
// Pattern 2: Return contract (broker only needs data)
// adapters/fs/fs-read-file-adapter.ts
import {readFile} from 'fs/promises';
import {fileContentsContract} from '../../contracts/file-contents/file-contents-contract';
import type {FilePath} from '../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({filePath}: { filePath: FilePath }): Promise<FileContents> => {
    try {
        const content = await readFile(filePath, 'utf8');
        return fileContentsContract.parse(content);
    } catch (error) {
        throw new Error(`Failed to read file at ${filePath}: ${error}`);
    }
};
```

### middleware/ - Infrastructure Orchestration

**Purpose:** Combine multiple infrastructure adapters into cohesive bundles

**Folder Structure:**

```
middleware/
  http-telemetry/
    http-telemetry-middleware.ts
    http-telemetry-middleware.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-middleware.ts` (e.g., `http-telemetry-middleware.ts`)
- **Export:** camelCase ending with `Middleware` (e.g., `httpTelemetryMiddleware`, `errorTrackingMiddleware`)
- **Pattern:** middleware/[name]/[name]-middleware.ts

**Constraints:**

- **ONLY** for infrastructure concerns (telemetry, observability, monitoring)
- **NOT** for business logic
- **CAN** import adapters/ and middleware/
- **CAN** be imported by adapters/ (when coupled)
- **Pattern:** Combines 2+ infrastructure adapters

**Example:**

```typescript
// middleware/http-telemetry/http-telemetry-middleware.ts
import {winstonLogAdapter} from '../../adapters/winston/winston-log-adapter';
import {prometheusIncrementCounterAdapter} from '../../adapters/prometheus/prometheus-increment-counter-adapter';

export const httpTelemetryMiddleware = async ({method, url, statusCode, duration}) => {
    await winstonLogAdapter({level: 'info', message: `${method} ${url} - ${statusCode}`});
    await prometheusIncrementCounterAdapter({
        name: 'http_requests_total',
        labels: {method, status: String(statusCode)}
    });
};
```

### brokers/ - Business Operations

**Purpose:** Business-specific operations using adapters, or orchestrating other brokers

**Folder Structure:**

```
brokers/
  user/
    fetch/
      user-fetch-broker.ts
      user-fetch-broker.test.ts
  comment/
    create-process/
      comment-create-process-broker.ts
      comment-create-process-broker.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-broker.ts` (e.g., `user-fetch-broker.ts`, `email-send-broker.ts`)
- **Export:** camelCase `[domain][Action]Broker` (e.g., `userFetchBroker`, `emailSendBroker`,
  `commentCreateProcessBroker`)
- **Pattern:** brokers/[domain]/[action]/[domain]-[action]-broker.ts

**Constraints:**

- **Two Types:**
    - **Atomic:** Single operations (call one API, query one table)
    - **Orchestration:** Coordinate multiple brokers for workflows
- **Knows** endpoints, database tables, queue names, workflows
- **Max 2 levels:** brokers/[domain]/[action]/ (no deeper nesting)
    - ❌ `brokers/product/inventory/stock/check/`
    - ✅ `brokers/product/check-inventory-stock/`
- **CAN** import brokers/, adapters/, contracts/, errors/
- **Import patterns:**
    - Same domain: `../create/user-create-broker` (relative)
    - Cross-domain: `../../email/send/email-send-broker` (explicit)

**Example:**

```typescript
// brokers/user/fetch/user-fetch-broker.ts (Atomic)
import {axiosGetAdapter} from '../../../adapters/axios/axios-get-adapter';
import type {UserId, User} from '../../../contracts/user/user-contract';
import type {Url} from '../../../contracts/url/url-contract';

export const userFetchBroker = async ({userId}: { userId: UserId }): Promise<User> => {
    const url = `/api/users/${userId}` as Url;
    const response = await axiosGetAdapter({url});
    return userContract.parse(response.data);
};

// brokers/comment/create-process/comment-create-process-broker.ts (Orchestration)
import {commentCreateBroker} from '../create/comment-create-broker';
import {notificationSendBroker} from '../../notification/send/notification-send-broker';
import type {CommentContent, PostId, UserId, Comment} from '../../../contracts';

export const commentCreateProcessBroker = async ({
                                                     content,
                                                     postId,
                                                     userId
                                                 }: {
    content: CommentContent;
    postId: PostId;
    userId: UserId;
}): Promise<Comment> => {
    const comment = await commentCreateBroker({content, postId, userId});
    await notificationSendBroker({
        userId,
        type: 'new_comment',
        data: {commentId: comment.id}
    });
    return comment;
};
```

### bindings/ - Reactive Connections

**Purpose:** Reactive connections that watch for changes (React hooks, file watchers)

**Folder Structure:**

```
bindings/
  use-user-data/
    use-user-data-binding.ts
    use-user-data-binding.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `use-` and ending with `-binding.ts` (e.g., `use-user-data-binding.ts`)
- **Export:** camelCase starting with `use` and ending with `Binding` (e.g., `useUserDataBinding`,
  `useFileWatcherBinding`)
- **Pattern:** bindings/use-[resource]/use-[resource]-binding.ts

**Constraints:**

- **Frontend:** React hooks for data binding (must start with `use`)
- **CLI:** Reactive watchers and monitors (must start with `use`)
- **Backend:** Not applicable
- **Must** return `{data, loading, error}` pattern for async operations
- **Must** wrap single broker calls only (no orchestration)
- **CAN** import brokers/, state/, contracts/, errors/

**Example:**

```typescript
// bindings/use-user-data/use-user-data-binding.ts
import {useState, useEffect} from 'react';
import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker';
import type {UserId, User} from '../../contracts/user/user-contract';

export const useUserDataBinding = ({userId}: { userId: UserId }): {
    data: User | null;
    loading: boolean;
    error: Error | null;
} => {
    const [data, setData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        userFetchBroker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error};
};
```

### state/ - Data Storage and Memory

**Purpose:** Pure in-memory data storage and lifecycle management

**Folder Structure:**

```
state/
  user-cache/
    user-cache-state.ts
    user-cache-state.test.ts
  app-config/
    app-config-state.ts
    app-config-state.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-state.ts` (e.g., `user-cache-state.ts`, `app-config-state.ts`)
- **Export:** camelCase ending with `State` (e.g., `userCacheState`, `appConfigState`)
- **Pattern:** state/[name]/[name]-state.ts

**Constraints:**

- **Frontend:** React contexts, Zustand/Redux stores
- **Backend:** Caches, session stores, connection pools
- **Pure storage:** In-memory only, no external API calls or database operations
- **Configuration:** App-wide constants, feature flags, API base URLs live here
- **Must** export as objects with methods/properties (not individual functions)
- **CAN** import contracts/ and errors/ only

**Example:**

```typescript
// state/user-cache/user-cache-state.ts
import type {User, UserId} from '../../contracts/user/user-contract';

const cache = new Map<UserId, User>();

export const userCacheState = {
    get: ({id}: { id: UserId }): User | undefined => {
        return cache.get(id);
    },
    set: ({id, user}: { id: UserId; user: User }): void => {
        cache.set(id, user);
    }
};

// state/app-config/app-config-state.ts
import {urlContract} from '../../contracts/url/url-contract';
import {timeoutMsContract} from '../../contracts/timeout-ms/timeout-ms-contract';
import type {Url} from '../../contracts/url/url-contract';
import type {TimeoutMs} from '../../contracts/timeout-ms/timeout-ms-contract';

export const appConfigState = {
    apiUrl: urlContract.parse(process.env.API_URL || 'https://api.example.com'),
    timeout: timeoutMsContract.parse(parseInt(process.env.TIMEOUT || '10000'))
} satisfies { apiUrl: Url; timeout: TimeoutMs };

// state/user-context/user-context-state.ts (React Context example)
import {createContext, useContext} from 'react';
import type {User} from '../../contracts/user/user-contract';

const UserContext = createContext<User | null>(null);

export const userContextState = {
    context: UserContext,
    Provider: UserContext.Provider,
    useContext: (): User => {
        const context = useContext(UserContext);
        if (!context) throw new Error('UserContext not found');
        return context;
    }
};
```

### responders/ - Route Handlers

**Purpose:** Handle requests from flows (HTTP, queue, scheduled, WebSocket)

**Folder Structure:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.test.ts
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-responder.ts` (e.g., `user-get-responder.ts`,
  `email-process-queue-responder.ts`)
- **Export:** PascalCase `[Domain][Action]Responder` (e.g., `UserGetResponder`, `EmailProcessQueueResponder`)
- **Pattern:** responders/[domain]/[action]/[domain]-[action]-responder.ts

**Constraints:**

- **Frontend pages:** Return JSX.Element
- **Backend controllers:** Accept {req, res}, call res methods
- **Queue processors:** Process queue jobs
- **Scheduled tasks:** Execute on time conditions
- **One export per file**
- **With UI:** Import widgets/, brokers/, bindings/, state/, contracts/, transformers/, errors/
- **Without UI:** Import brokers/, state/, contracts/, transformers/, errors/
- **CAN ONLY** be imported by flows/
- **If route points to it:** It's a responder, not a widget

**Example:**

```typescript
// responders/user/get/user-get-responder.ts
import {userFetchBroker} from '../../../brokers/user/fetch/user-fetch-broker';
import {userToDtoTransformer} from '../../../transformers/user-to-dto/user-to-dto-transformer';
import type {UserId} from '../../../contracts/user/user-contract';
import type {Request, Response} from 'express';

export const UserGetResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const userId = req.params.id as UserId;
    const user = await userFetchBroker({userId});
    const userDto = userToDtoTransformer({user});
    res.json(userDto);
};

// responders/email/process-queue/email-process-queue-responder.ts (Queue)
import {emailSendBroker} from '../../../brokers/email/send/email-send-broker';
import type {EmailAddress, EmailSubject} from '../../../contracts';

export const EmailProcessQueueResponder = async ({job}: {
    job: { data: { email: EmailAddress; subject: EmailSubject } };
}): Promise<void> => {
    await emailSendBroker({
        to: job.data.email,
        subject: job.data.subject
    });
};
```

### widgets/ - UI Components

**Purpose:** Display and presentation logic

**Folder Structure:**

```
widgets/
  user-card/
    user-card-widget.tsx
    user-card-widget.test.tsx
    avatar-widget.tsx
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-widget.tsx` (e.g., `user-card-widget.tsx`, `avatar-widget.tsx`)
- **Export:** PascalCase ending with `Widget` (e.g., `UserCardWidget`, `AvatarWidget`)
- **Pattern:** widgets/[name]/[name]-widget.tsx

**Constraints:**

- **Must** return JSX.Element
- **Must** export prop types as `[WidgetName]Props` (e.g., `UserCardWidgetProps`)
- **Sub-components:** Live in same folder, no separate folders
- **CAN** use bindings in render phase
- **CAN** use brokers in event handlers
- **CANNOT** use bindings in event handlers (React will error)
- **CAN** use React useState for component-local UI state
- **CAN** import bindings/, brokers/, state/, contracts/, transformers/, errors/
- **CAN NOT** import adapters/, flows/, responders/

**Example:**

```typescript
// widgets/user-card/user-card-widget.tsx
import {useState} from 'react';
import {useUserDataBinding} from '../../bindings/use-user-data/use-user-data-binding';
import {userUpdateBroker} from '../../brokers/user/update/user-update-broker';
import {AvatarWidget} from './avatar-widget';
import type {UserId} from '../../contracts/user/user-contract';

export type UserCardWidgetProps = {
    userId: UserId;
    onUpdate?: ({userId}: { userId: UserId }) => void;
};

export const UserCardWidget = ({userId, onUpdate}: UserCardWidgetProps): JSX.Element => {
    const {data: user, loading, error} = useUserDataBinding({userId});

    const handleUpdate = async (): Promise<void> => {
        if (user) {
            await userUpdateBroker({userId, data: user});
            onUpdate?.({userId});
        }
    };

    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error
:
    {
        error.message
    }
    </div>;
    if (!user) return <div>No
    user
    found < /div>;

    return (
        <div>
            <AvatarWidget userId = {userId}
    />
    < button
    onClick = {handleUpdate} > Update < /button>
        < /div>
)
    ;
};
```

### startup/ - Application Bootstrap

**Purpose:** Application initialization and wiring (no business logic)

**Folder Structure (depending on project type):**

```
startup/
  start-app.tsx                     // Frontend app bootstrap
  start-server.ts                   // Backend server initialization
  start-queue-worker.ts             // Queue processor bootstrap
  start-scheduler-service.ts        // Scheduled tasks bootstrap
  start-cli.ts                      // CLI entry point
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `start-` (e.g., `start-server.ts`, `start-app.tsx`, `start-cli.ts`)
- **Export:** PascalCase starting with `Start` (e.g., `StartServer`, `StartApp`, `StartCli`)
- **Pattern:** startup/start-[name].ts

**Constraints:**

- **CAN** import ALL folders (unique privilege for bootstrap)
- **Must NOT** contain business logic (only wiring)
- **Static constants:** Can live here (e.g., `const PORT = 3000`)
- **Environment loading:** Happens here
- **Queue/Scheduled registration:** Register responders here
- **Note:** Entry files (index.tsx, index.js) just import from startup/

**Example:**

```typescript
// startup/start-server.ts
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {dbPoolState} from '../state/db-pool/db-pool-state';
import {errorTrackingMiddleware} from '../middleware/error-tracking/error-tracking-middleware';

export const StartServer = async () => {
    const app = express();
    await dbPoolState.init();
    app.use((req, res, next) => errorTrackingMiddleware({req, res, next}));
    app.use('/api', userFlow);
    app.listen(3000);
};
```

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/start-app.tsx`
- **Backend:** `index.js` → imports from `startup/start-server.ts`
- **Package:** `bin/cli.js` → imports from `startup/start-cli.ts`

The thin entry files just point to startup/ where the real initialization lives.

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

```typescript
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
    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error < /div>;
    return <div>{user?.name
}
    </div>;
};

// ❌ WRONG - Widget calling broker directly
export const UserCardWidget = ({userId}) => {
    const [user, setUser] = useState(null);
    useEffect(() => {
        userFetchBroker({userId}).then(setUser);  // Wrong layer!
    }, [userId]);
    return <div>{user?.name
}
    </div>;
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
    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error < /div>;
    return <div>{data.user.name}
    works
    at
    {
        data.company.name
    }
    </div>;
};
```

## Backend-Specific Rules

### Transaction Boundaries

**Rule:** Orchestration brokers handle transaction boundaries, not atomic brokers.

```typescript
// ✅ CORRECT - Orchestration broker with transaction
// brokers/user/create-with-team/user-create-with-team-broker.ts
export const userCreateWithTeamBroker = async ({userData, teamData}) => {
    return await db.transaction(async (tx) => {
        const user = await userCreateBroker({userData, tx});
        const team = await teamCreateBroker({teamData: {...teamData, ownerId: user.id}, tx});
        await userAddToTeamBroker({userId: user.id, teamId: team.id, tx});
        return {user, team};
    });
};

// ❌ WRONG - Atomic broker with transaction
export const userCreateBroker = async ({userData}) => {
    return await db.transaction(async (tx) => {  // Too low level!
        return await db.users.create({data: userData, tx});
    });
};
```

### Data Transfer Pattern

**Rule:** Responders never return raw broker data - always transform through transformers/ or return specific fields.

```typescript
// ✅ CORRECT - Responder uses transformer
// responders/user/get/user-get-responder.ts
import {userFetchBroker} from '../../../brokers/user/fetch/user-fetch-broker';
import {userToDtoTransformer} from '../../../transformers/user-to-dto/user-to-dto-transformer';

export const UserGetResponder = async ({req, res}) => {
    const user = await userFetchBroker({userId: req.params.id});
    const userDto = userToDtoTransformer({user});  // Transform before sending
    res.json(userDto);
};

// ❌ WRONG - Responder returns raw entity
export const UserGetResponder = async ({req, res}) => {
    const user = await userFetchBroker({userId: req.params.id});
    res.json(user);  // Exposes internal fields like password, timestamps, etc!
};
```

### Responder Responsibilities

**Rule:** Responders handle ONLY: input validation/parsing, calling brokers, output formatting, HTTP status codes.

**Critical:** ALL responder inputs must be validated/sanitized through contracts before use.

**Boundary Function Input Types:**

Functions that receive data from external sources MUST accept `unknown` and validate immediately:

**External Sources:**

- stdin/stdout handlers (hook responders, CLI processors)
- HTTP request handlers (`req.body`, `req.params`, `req.query`)
- File parsers (JSON.parse results, CSV rows)
- Message queue processors (job.data)
- WebSocket message handlers
- React Router params (useParams(), useSearchParams())
- Browser storage (localStorage, sessionStorage)

**Pattern:**

```typescript
// Backend boundary
export const BoundaryResponder = async ({
  req,
  res
}: {
  req: Request;
  res: Response;
}): Promise<void> => {
  const body: unknown = req.body;  // Explicit unknown
  const validated = requestContract.safeParse(body);
  if (!validated.success) {
    return res.status(400).json({ error: validated.error });
  }
  // Use validated.data with full type safety
};

// Frontend boundary
export const RouteResponder = (): JSX.Element => {
  const params = useParams();  // External source
  const validated = paramsContract.safeParse(params.id);
  if (!validated.success) {
    return <ErrorWidget message="Invalid ID" />;
  }
  // Use validated.data with full type safety
};

// Hook/CLI boundary
export const HookResponder = async ({
  input
}: {
  input: unknown;  // stdin is always unknown
}): Promise<Result> => {
  const validated = hookDataContract.safeParse(input);
  if (!validated.success) {
    throw new Error(`Invalid input: ${validated.error}`);
  }
  // Use validated.data with full type safety
};
```

**See [Boundary Validation Enforcement](../../lint/boundary-validation.md) for complete validation patterns and lint
rules.**

```typescript
// ✅ CORRECT - Responder with validation using contracts
export const UserCreateResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const userData = userCreateContract.parse(req.body);  // MUST validate first
    const user = await userCreateBroker({userData});
    const userDto = userToDtoTransformer({user});
    res.status(201).json(userDto);
};

// ❌ WRONG - No validation
export const UserCreateResponder = async ({req, res}) => {
    const userData = req.body;  // Using raw input - DANGEROUS!
    const user = await userCreateBroker({userData});
    res.json(user);
};

// ❌ WRONG - Responder with business logic
export const UserCreateResponder = async ({req, res}) => {
    const userData = userCreateContract.parse(req.body);

    // Business validation in responder!
    if (userData.email.includes('@competitor.com')) {
        return res.status(400).json({error: 'Competitor emails not allowed'});
    }

    // Multi-step orchestration in responder!
    const user = await userCreateBroker({userData});
    if (userData.plan === 'premium') {
        await subscriptionCreateBroker({userId: user.id});
        await emailSendBroker({to: user.email, template: 'premium-welcome'});
    }

    res.json(user);
};

// ✅ CORRECT - Move orchestration to broker with proper types
// brokers/user/signup-process/user-signup-process-broker.ts
export const userSignupProcessBroker = async ({
                                                  userData
                                              }: {
    userData: UserCreateData;
}): Promise<User> => {
    // Business validation using branded types
    if (userData.email.includes('@competitor.com')) {
        throw new ValidationError({message: 'Competitor emails not allowed'});
    }

    // Multi-step orchestration
    const user = await userCreateBroker({userData});
    if (userData.plan === 'premium') {
        await subscriptionCreateBroker({userId: user.id});
        await emailSendBroker({
            to: user.email,
            template: 'premium-welcome'
        });
    }

    return user;
};

// responders/user/signup/user-signup-responder.ts
export const UserSignupResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const userData = userSignupContract.parse(req.body);
    const user = await userSignupProcessBroker({userData});
    const userDto = userToDtoTransformer({user});
    res.status(201).json(userDto);
};
```

## File Discovery and Extension Rules

**CRITICAL: Before creating any new file, you MUST explore first to prevent file proliferation.**

### Extension Over Creation

**Rule:** If a domain file exists, extend it with options - never create variant files.

```bash
# 1. Search for existing domain files
rg -l "userFetchBroker" src/brokers/
rg -l "useUserDataBinding" src/bindings/

# 2. Search for similar patterns
rg "export const.*Broker" src/brokers/user/
rg "export const use.*Binding" src/bindings/
```

**If domain exists → MUST extend existing files, not create new ones**

### Examples by Folder Type

**Bindings (extend with options):**

```typescript
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

```typescript
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

**Transformers (create variants, never use options):**

```typescript
// ✅ CORRECT - Each output shape is a separate transformer with contracts
// transformers/user-to-dto/user-to-dto-transformer.ts
export const userToDtoTransformer = ({user}: { user: User }): UserDto => {
    return userDtoContract.parse({
        id: user.id,
        name: user.name,
        email: user.email  // Public API response - validated
    });
};

// transformers/user-to-summary/user-to-summary-transformer.ts
export const userToSummaryTransformer = ({user}: { user: User }): UserSummary => {
    return userSummaryContract.parse({
        id: user.id,
        displayName: `${user.firstName} ${user.lastName}`
    });
};

// transformers/user-to-admin-dto/user-to-admin-dto-transformer.ts
export const userToAdminDtoTransformer = ({user}: { user: User }): UserAdminDto => {
    return userAdminDtoContract.parse({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash  // Admin-only fields - validated
    });
};

// ❌ WRONG - Using options for security-sensitive transformations
export const userToDtoTransformer = ({user, includePassword}: { user: User; includePassword?: boolean }) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        ...(includePassword && {passwordHash: user.passwordHash})  // DANGEROUS!
    };
};

// ❌ WRONG - Multiple transformations in one file
// transformers/user-transformer/user-transformer.ts
// export const userToDtoTransformer = ...
// export const userToSummaryTransformer = ...  // Violates single responsibility!
```

**Rule:** Each distinct output shape = separate transformer file. Never use options to conditionally include/exclude
fields (security risk).

**Widgets (extend with props, not new files):**

```typescript
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

```typescript
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

### Discovery Checklist

Before creating any file, ask:

1. ✅ Does a file for this domain already exist in this folder?
2. ✅ Can I add an option/parameter to the existing file?
3. ✅ Can I create an orchestration broker and extend the binding?
4. ✅ Is this truly a new domain/action, not a variant?

**Only create new files after confirming all NO answers.**

## Lint-Enforced Rules

Some architectural rules are enforced by lint rather than documented here, as they require dynamic analysis:

### Responder Multi-Broker Calls

**Rule:** Responders calling multiple brokers will be caught and flagged by lint.

- If responder needs data from multiple sources, lint will detect multiple broker calls
- Lint will suggest creating an orchestration broker instead
- This ensures responders remain thin and orchestration stays in brokers/

**Why lint instead of docs:** Whether a responder "needs" multiple brokers depends on runtime business logic, not file
structure. Lint can analyze actual calls dynamically.