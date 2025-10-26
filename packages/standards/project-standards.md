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
  type assertions from `object` to `Record<PropertyKey, unknown>`)

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

```typescript
// ✅ CORRECT - CLI output using process streams
process.stdout.write(`Processing ${count} files...\n`);
process.stderr.write(`Error: ${errorMessage}\n`);

// ❌ WRONG - console methods trigger lint errors
console.log(`Processing ${count} files...`);
console.error(`Error: ${errorMessage}`);
```

## Layer Files - Decomposing Complex Components

### Purpose

When a parent file grows complex (>300 lines, >3 distinct responsibilities), **layer files** allow decomposition into
focused, testable units while maintaining the parent's domain context.

### The Pattern

**Naming:** `{descriptive-name}-layer-{folder-suffix}.{ext}`

**Structure:**

```
parent-domain/
  parent-name-broker.ts              # Parent - orchestrates layers
  parent-name-broker.proxy.ts
  parent-name-broker.test.ts

  validate-step-one-layer-broker.ts  # Layer - focused responsibility
  validate-step-one-layer-broker.proxy.ts  # Has own proxy if needed
  validate-step-one-layer-broker.test.ts

  validate-step-two-layer-broker.ts  # Layer - different responsibility
  validate-step-two-layer-broker.proxy.ts
  validate-step-two-layer-broker.test.ts
```

### Key Characteristics

**Layer files ARE:**

- ✅ Co-located with parent (same directory)
- ✅ Full entities (own `.proxy.ts` and `.test.ts` if complex)
- ✅ Independently testable with their own test suite
- ✅ Scoped to parent's domain (not reusable across codebase)
- ✅ Named with `-layer-` infix before folder suffix

**Layer files are NOT:**

- ❌ Utilities (those go in `transformers/` or `guards/`)
- ❌ Reusable across parents (those get their own folder)
- ❌ Separate domains (those are sibling folders)
- ❌ In subfolders (must be flat with parent)

### Allowed Folder Types

Only these folder types allow layer files (controlled by `allowsLayerFiles` in folder config):

- **brokers/** - Complex business logic can have validation layers
- **widgets/** - Complex UI can have sub-component layers
- **responders/** - Complex request handling can have processing layers

**Not allowed in:** statics, contracts, guards, transformers, errors, flows, adapters, middleware, bindings, state,
startup, assets, migrations (these should stay focused and simple)

### When to Create Layer Files

**✅ Create layer file when:**

1. Parent exceeds 300 lines
2. Layer calls different dependencies than parent (needs own proxy)
3. Layer has distinct validation/rendering/processing responsibility
4. Layer needs >10 test cases to cover its logic
5. Parent would have >3 conceptual sections without decomposition

**❌ Don't create layer file when:**

1. Logic is reusable across multiple parents → extract to `guards/` or `transformers/`
2. Logic is <50 lines → keep inline in parent
3. Logic is pure and doesn't need mocking → might be a pure function in `guards/` or `transformers/`
4. Folder type doesn't allow layers (see `allowsLayerFiles` in folder config)

### Examples by Folder Type

#### Broker Layers

```typescript
// brokers/rule/enforce-project-structure/
//   rule-enforce-project-structure-broker.ts (528 lines - too complex!)

// Decompose into layers:
brokers / rule / enforce - project - structure /
rule - enforce - project - structure - broker.ts
#
Parent - orchestrates
validation
rule - enforce - project - structure - broker.proxy.ts
rule - enforce - project - structure - broker.test.ts

validate - folder - location - layer - broker.ts
#
Layer - Level
1
validation
validate - folder - location - layer - broker.proxy.ts
validate - folder - location - layer - broker.test.ts

validate - folder - depth - layer - broker.ts
#
Layer - Level
2
validation
validate - folder - depth - layer - broker.proxy.ts
validate - folder - depth - layer - broker.test.ts

validate - filename - pattern - layer - broker.ts
#
Layer - Level
3
validation
validate - filename - pattern - layer - broker.proxy.ts
validate - filename - pattern - layer - broker.test.ts

validate -
export
-structure - layer - broker.ts
#
Layer - Level
4
validation
validate -
export
-structure - layer - broker.proxy.ts
validate -
export
-structure - layer - broker.test.ts
```

**Parent orchestrates:**

```typescript
// rule-enforce-project-structure-broker.ts
import {validateFolderLocationLayerBroker} from './validate-folder-location-layer-broker';
import {validateFolderDepthLayerBroker} from './validate-folder-depth-layer-broker';
import {validateFilenamePatternLayerBroker} from './validate-filename-pattern-layer-broker';
import {validateExportStructureLayerBroker} from './validate-export-structure-layer-broker';

export const ruleEnforceProjectStructureBroker = (): EslintRule => ({
    create: (context: unknown) => {
        const ctx = context as EslintContext;

        return {
            Program: (node: Tsestree): void => {
                // Level 1: Folder location
                if (!validateFolderLocationLayerBroker({node, context: ctx})) {
                    return; // Stop early if folder is wrong
                }

                // Level 2: Folder depth
                if (!validateFolderDepthLayerBroker({node, context: ctx})) {
                    return; // Stop early if depth is wrong
                }

                // Level 3: Filename pattern
                if (!validateFilenamePatternLayerBroker({node, context: ctx})) {
                    return; // Stop early if filename is wrong
                }

                // Level 4: Export structure
                validateExportStructureLayerBroker({node, context: ctx});
            }
        };
    }
});
```

#### Widget Layers

```typescript
// widgets/user-card/user-card-widget.tsx (Parent)
import {AvatarLayerWidget} from './avatar-layer-widget';
import {UserMetaLayerWidget} from './user-meta-layer-widget';

export const UserCardWidget = ({userId}: UserCardWidgetProps) => {
    const {data: user} = useUserDataBinding({userId});  // Parent's binding

    return (
        <div>
            <AvatarLayerWidget userId = {userId}
    />  {/ * Layer - different
    binding * /}
    < h1 > {user.name} < /h1>
    < UserMetaLayerWidget
    userId = {userId}
    />  {/ * Layer - different
    binding * /}
    < /div>
)
    ;
};

// avatar-layer-widget.tsx (Layer - calls different broker)
export const AvatarLayerWidget = ({userId}: AvatarLayerWidgetProps) => {
    const {data: avatar} = useAvatarDataBinding({userId});  // Different binding!

    return <img src = {avatar.url}
    alt = {avatar.alt}
    />;
};

// avatar-layer-widget.proxy.ts (Layer has own proxy for different dependency)
export const avatarLayerWidgetProxy = () => {
    const avatarBindingProxy = useAvatarDataBindingProxy();  // Different dependency

    return {
        setupAvatar: ({userId, avatar}) => {
            avatarBindingProxy.setupAvatar({userId, avatar});
        }
    };
};
```

**Why this is a layer:**

- Calls different broker (`useAvatarDataBinding` vs parent's `useUserDataBinding`)
- Needs own proxy to set up avatar mocking
- Has focused rendering responsibility (avatar only)
- Co-located with parent widget (same directory)

#### Responder Layers

```typescript
// responders/user/create/user-create-responder.ts (Parent)
import {validateRequestLayerResponder} from './validate-request-layer-responder';
import {processUserCreationLayerResponder} from './process-user-creation-layer-responder';

export const UserCreateResponder = async ({req, res}: ResponderParams) => {
    // Layer 1: Validate request
    const userData = validateRequestLayerResponder({req, res});
    if (!userData) return; // Layer sent error response

    // Layer 2: Process creation
    const user = await processUserCreationLayerResponder({userData, res});

    res.status(201).json(user);
};
```

### Testing Layer Files

**Each layer has its own test file** following standard proxy pattern:

```typescript
// validate-folder-depth-layer-broker.test.ts
import {ruleTester} from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import {validateFolderDepthLayerBroker} from './validate-folder-depth-layer-broker';

ruleTester.run('validate-folder-depth-layer', validateFolderDepthLayerBroker(), {
    valid: [
        {code: '...', filename: 'src/brokers/user/fetch/user-fetch-broker.ts'},
    ],
    invalid: [
        {
            code: '...',
            filename: 'src/brokers/user-fetch-broker.ts',
            errors: [{messageId: 'invalidFolderDepth'}]
        }
    ]
});
```

**If layer needs proxy (has dependencies to mock):**

```typescript
// avatar-layer-widget.test.tsx
import {render, screen} from '@testing-library/react';
import {AvatarLayerWidget} from './avatar-layer-widget';
import {avatarLayerWidgetProxy} from './avatar-layer-widget.proxy';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {AvatarStub} from '../../contracts/avatar/avatar.stub';

it('VALID: {avatar url} => renders avatar image', async () => {
    const proxy = avatarLayerWidgetProxy();
    const userId = UserIdStub('user-1');
    const avatar = AvatarStub({url: 'https://example.com/avatar.jpg'});

    proxy.setupAvatar({userId, avatar});

    render(<AvatarLayerWidget userId = {userId}
    />);

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
});
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

See `packages/eslint-plugin/src/statics/folder-config/folder-config-statics.ts` for full import mapping rules.

### Domain Folder Import Rules

**Same-folder imports:** Files within the same domain folder can import each other

- `adapters/fs/fs-exists-sync-adapter.test.ts` → `./fs-exists-sync-adapter` ✅
- `contracts/user/user.stub.ts` → `./user-contract` ✅

**Cross-folder imports:** Only entry files can be imported across domain folders

- Entry files = files matching folder's suffix pattern (`-adapter.ts`, `-contract.ts`, `-broker.ts`, etc.)
- `guards/auth/auth-guard.ts` → `../../contracts/user/user-contract` ✅ (entry file)
- `guards/auth/auth-guard.ts` → `../../contracts/user/helper` ❌ (not entry file)

**Multi-dot files cannot be imported cross-folder:**

- `.stub.ts`, `.mock.ts`, `.test.ts` files are same-folder only
- Test files can import stubs/mocks from same folder only

## Folder Definitions, Constraints, and Examples

### statics/ - Immutable Values

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
    user-id.stub.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-contract.ts` (e.g., `user-contract.ts`, `email-contract.ts`)
- **Exports:**
    - Schemas: camelCase ending with `Contract` (e.g., `userContract`, `emailContract`)
  - Types: PascalCase (e.g., `User`, `EmailAddress`)
- **Stubs:** kebab-case with `.stub.ts` extension (e.g., `user.stub.ts`)
- **Proxies:** kebab-case with `.proxy.ts` extension (e.g., `user-contract.proxy.ts`)

**Constraints:**

- **ONLY ALLOWED:**
    - Zod schemas (or configured validation library)
    - TypeScript types inferred from schemas: `export type User = z.infer<typeof userContract>`
    - Stub files (`.stub.ts`) for testing
- **MUST** use `.brand<'TypeName'>()` on all Zod string/number schemas (no raw primitives)

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
import type {StubArgument} from '@questmaestro/shared/@types';

export const UserStub = ({...props}: StubArgument<User> = {}): User => {
  return userContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'john@example.com',
    name: 'John Doe',
    ...props,
  });
};
```

**Stub Patterns:**

Stubs follow strict patterns enforced by `@questmaestro/enforce-stub-patterns` rule:

1. **Object Stubs (complex types with data properties only)**: Use spread operator with `StubArgument<Type>`
   ```typescript
   import type {StubArgument} from '@questmaestro/shared/@types';

   export const UserStub = ({ ...props }: StubArgument<User> = {}): User =>
     userContract.parse({
       id: '123',
       name: 'John',
       ...props,
     });
   ```

2. **Branded String Stubs (primitives)**: Use single `value` property
   ```typescript
   export const FilePathStub = (
     { value }: { value: string } = { value: '/test/file.ts' }
   ): FilePath => filePathContract.parse(value);
   ```

3. **Mixed Data + Function Stubs (types with both data and functions)**:
   ```typescript
   import type {StubArgument} from '@questmaestro/shared/@types';
   import {z} from 'zod';

   // Contract defines ONLY data properties (no z.function())
   export const eslintContextContract = z.object({
       filename: z.string().brand<'Filename'>().optional(),
   });

   // Type adds functions via intersection
   export type EslintContext = z.infer<typeof eslintContextContract> & {
       report: (...args: unknown[]) => unknown;
       getFilename?: () => string & z.BRAND<'Filename'>;
   };

   const filenameContract = z.string().brand<'Filename'>();

   export const EslintContextStub = ({
       ...props
   }: StubArgument<EslintContext> = {}): EslintContext => {
       // Separate function props from data props
       const {report, getFilename, ...dataProps} = props;

       // Return: validated data + functions (preserved references)
       return {
           // Data properties validated through contract
           ...eslintContextContract.parse({
               filename: filenameContract.parse('/test/file.ts'),
               ...dataProps,
           }),
           // Function properties preserved (not parsed to maintain references)
           report: report ?? ((..._args: unknown[]): unknown => true),
           getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> =>
               filenameContract.parse('/test/file.ts')),
       };
   };
   ```

4. **All stubs MUST**:
    - Use object destructuring parameters
   - Data properties MUST be validated through `contract.parse()`
   - Function properties MUST be preserved outside parse (maintains references for `jest.fn()`)
    - Import colocated contract from same directory

```

### guards/ - Type Guards and Boolean Checks

**Purpose:** Pure boolean functions for type guards and business logic checks

**Folder Structure:**

```
guards/
  has-permission/
    has-permission-guard.ts
    has-permission-guard.proxy.ts  # Test helper for data building
    has-permission-guard.test.ts
  is-valid-email/
    is-valid-email-guard.ts
    is-valid-email-guard.proxy.ts
    is-valid-email-guard.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-guard.ts` (e.g., `has-permission-guard.ts`, `is-admin-guard.ts`)
- **Export:** camelCase ending with `Guard`, starting with `is/has/can/should/will/was` (e.g., `hasPermissionGuard`,
  `isValidEmailGuard`)
- **Proxy:** kebab-case ending with `-guard.proxy.ts`, export `[name]GuardProxy` (e.g., `hasPermissionGuardProxy`)

**Constraints:**

- **MUST be pure functions** (no external calls, no side effects)
- **MUST return boolean**
- **MUST have explicit return types**
- **MUST use optional parameters** (enforced by `@questmaestro/enforce-optional-guard-params` rule)
- **MUST validate parameters exist** before using them

**Example:**

```typescript
// guards/has-permission/has-permission-guard.ts
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

// guards/is-admin/is-admin-guard.ts
import type {User} from '../../contracts/user/user-contract';
import {userStatics} from '../../statics/user/user-statics';

export const isAdminGuard = ({user}: { user?: User }): boolean => {
  if (!user) {
    return false;
  }
  return user.role === userStatics.roles.ADMIN;
};

// guards/can-edit-post/can-edit-post-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {Post} from '../../contracts/post/post-contract';

export const canEditPostGuard = ({user, post}: {
  user?: User;
  post?: Post;
}): boolean => {
  if (!user || !post) {
    return false;
  }
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
    format-date-transformer.proxy.ts  # Test helper (usually minimal)
    format-date-transformer.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-transformer.ts` (e.g., `format-date-transformer.ts`)
- **Export:** camelCase ending with `Transformer` (e.g., `formatDateTransformer`, `userToDtoTransformer`)
- **Proxy:** kebab-case ending with `-transformer.proxy.ts`, export `[name]TransformerProxy` (e.g.,
  `formatDateTransformerProxy`)

**Constraints:**

- **Must** be pure functions (no side effects)
- **Must** have explicit return types using Zod contracts (no raw primitives)
- **Must** validate output using appropriate contract before returning

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
    user-flow.integration.test.ts    # Integration test - wires routes to responders
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-flow.ts` or `-flow.tsx` (e.g., `user-flow.tsx`)
- **Export:** PascalCase ending with `Flow` (e.g., `UserFlow`, `CheckoutFlow`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
- **Pattern:** flows/[domain]/[domain]-flow.ts(x)

**Constraints:**

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

### adapters/ - External Package Boundary Translation

**Purpose:** Translate between external package APIs and application contracts

**Folder Structure:**

```
adapters/
  axios/
    get/
      axios-get-adapter.ts
      axios-get-adapter.proxy.ts       # Mocks axios npm package
      axios-get-adapter.test.ts
    post/
      axios-post-adapter.ts
      axios-post-adapter.proxy.ts
      axios-post-adapter.test.ts
  fs/
    read-file/
      fs-read-file-adapter.ts
      fs-read-file-adapter.proxy.ts    # Mocks fs/promises npm package
      fs-read-file-adapter.test.ts
    ensure-write/
      fs-ensure-write-adapter.ts       # Composes mkdir + writeFile
      fs-ensure-write-adapter.proxy.ts
      fs-ensure-write-adapter.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[package-name]-[operation]-adapter.ts`
- **Export:** camelCase ending with `Adapter` (e.g., `axiosGetAdapter`, `fsEnsureWriteAdapter`)
- **Proxy:** kebab-case ending with `-adapter.proxy.ts`, export `[name]AdapterProxy` (e.g., `httpAdapterProxy`)
- **Pattern:** adapters/[package-name]/[operation]/[package-name]-[operation]-adapter.ts

**Constraints:**

- **CRITICAL: One export per file** - Each adapter file exports exactly one arrow function
- **MUST be arrow function** - `export const x = () => {}` NOT `export function x() {}` or re-exports
- **ALL inputs MUST use contracts** - No raw `string`, `number`, etc.
- **ALL outputs MUST use contracts** - No returning npm package types
- **Every contract MUST have a stub** - For type-safe testing
- **Contracts don't need to match npm types** - Adapter translates app contracts ↔ npm types
- **Type only what you use** - Expand contracts incrementally as needed
- **Can compose multiple package functions** - If they accomplish one app operation **from the same npm package only**
- **CANNOT import other adapters** - Adapters only call functions from their associated npm package (folder name =
  package name)
- **Package name prefixes filename** - `axios-get-adapter.ts` not `http-get-adapter.ts`
- **Brands on primitives** - Brand `string`/`number`, not objects
- **Must** add project-specific configuration (timeout, auth, retry, logging)
- **Must** know NOTHING about business logic

**Translation Pattern:**

```typescript
// App uses our contracts
FilePath → Adapter
translates → string(
for fs.readFile)
    Adapter
translates ← Buffer(from
fs.readFile
)
FileContents ← Result

// Adapter is the boundary translator
export const fsReadFileAdapter = async ({
                                            filePath
                                        }: {
    filePath: FilePath;  // Input: our contract
}): Promise<FileContents> => {  // Output: our contract
    // Translate contract → npm type
    const rawPath: string = filePath; // FilePath is branded string

    // Call npm package with its types
    const buffer = await readFile(rawPath);

    // Translate npm type → contract
    return fileContentsContract.parse(buffer.toString('utf8'));
};
```

**Composition Example:**

One adapter can use multiple functions from the same package:

```typescript
// adapters/fs/ensure-write/fs-ensure-write-adapter.ts
import {mkdir, writeFile} from 'fs/promises';
import {dirname} from 'path';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../../contracts/file-contents/file-contents-contract';

export const fsEnsureWriteAdapter = async ({
  filePath,
  content
}: {
  filePath: FilePath;
  content: FileContents;
}): Promise<void> => {
  const dir = dirname(filePath);
  await mkdir(dir, {recursive: true});  // fs.mkdir
  await writeFile(filePath, content);     // fs.writeFile
  // Both accomplish one app operation: "safely write file"
};
```

**Contract Requirements:**

Every contract needs a corresponding stub for type-safe testing:

```typescript
// contracts/http-response/http-response-contract.ts
export const httpResponseContract = z.object({
  body: z.unknown(),
  statusCode: z.number().int().min(100).max(599).brand<'StatusCode'>(),  // Brand on primitive
  headers: z.record(z.string()),
});
export type HttpResponse = z.infer<typeof httpResponseContract>;

// contracts/http-response/http-response.stub.ts
import type {StubArgument} from '@questmaestro/shared/@types';

export const HttpResponseStub = ({...props}: StubArgument<HttpResponse> = {}): HttpResponse =>
    httpResponseContract.parse({
        body: {},
        statusCode: 200,
        headers: {},
        ...props,
    });

// contracts/file-path/file-path-contract.ts
export const filePathContract = z.string().brand<'FilePath'>();  // Brand on primitive
export type FilePath = z.infer<typeof filePathContract>;

// contracts/file-path/file-path.stub.ts
export const FilePathStub = ({value}: { value: string } = {value: '/test/file.ts'}): FilePath =>
  filePathContract.parse(value);
```

**Incremental Contract Expansion:**

Don't type everything upfront - type only what you use:

```typescript
// V1: Only need body and status
export const httpResponseContract = z.object({
  body: z.unknown(),
  statusCode: z.number().int().brand<'StatusCode'>(),
});

// V2: Later, need headers too
export const httpResponseContract = z.object({
  body: z.unknown(),
  statusCode: z.number().int().brand<'StatusCode'>(),
  headers: z.record(z.string()),  // Added
});

// V3: Even later, need cookies
export const httpResponseContract = z.object({
  body: z.unknown(),
  statusCode: z.number().int().brand<'StatusCode'>(),
  headers: z.record(z.string()),
  cookies: z.record(z.string().brand<'CookieValue'>()),  // Added with branded values
});
```

**Complex Types (Functions, Classes):**

When types include functions alongside data properties, split the contract and type:

```typescript
// contracts/eslint-context/eslint-context-contract.ts
import {z} from 'zod';

// Contract defines ONLY data properties (no z.function())
export const eslintContextContract = z.object({
    filename: z.string().brand<'Filename'>().optional(),
});

// TypeScript type adds function methods via intersection
export type EslintContext = z.infer<typeof eslintContextContract> & {
    report: (...args: unknown[]) => unknown;
    getFilename?: () => string & z.BRAND<'Filename'>;
    getScope?: () => unknown;
    getSourceCode?: () => unknown;
};
```

**Why split contract and type?**

- Zod's `z.function()` breaks TypeScript type inference (functions infer as `{}`)
- `StubArgument<T>` utility type now preserves function signatures
- Contract validates data, TypeScript enforces function signatures

**Stub for tests:**

```typescript
// contracts/eslint-context/eslint-context.stub.ts
import type {StubArgument} from '@questmaestro/shared/@types';

const filenameContract = z.string().brand<'Filename'>();

export const EslintContextStub = ({
                                      ...props
                                  }: StubArgument<EslintContext> = {}): EslintContext => {
    // Separate function props from data props
    const {report, getFilename, getScope, getSourceCode, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...eslintContextContract.parse({
            filename: filenameContract.parse('/test/file.ts'),
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        report: report ?? ((..._args: unknown[]): unknown => true),
        getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> =>
            filenameContract.parse('/test/file.ts')),
        getScope: getScope ?? ((): unknown => ({})),
        getSourceCode: getSourceCode ?? ((): unknown => ({})),
    };
};
```

**Key Points:**

- Contract validates data only
- Type intersection adds functions
- Stub separates functions from data
- Functions preserved outside `contract.parse()` to maintain references for `jest.fn()`

**Examples:**

```typescript
// Pattern 1: Simple translation
// adapters/fs/read-file/fs-read-file-adapter.ts
import {readFile} from 'fs/promises';
import {fileContentsContract} from '../../../contracts/file-contents/file-contents-contract';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({
  filePath
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  const buffer = await readFile(filePath);
  return fileContentsContract.parse(buffer.toString('utf8'));
};

// Pattern 2: Complex translation
// adapters/axios/get/axios-get-adapter.ts
import axios from 'axios';
import {httpResponseContract} from '../../../contracts/http-response/http-response-contract';
import type {Url} from '../../../contracts/url/url-contract';
import type {HttpResponse} from '../../../contracts/http-response/http-response-contract';

export const axiosGetAdapter = async ({
  url
}: {
  url: Url;
}): Promise<HttpResponse> => {
  // axios.get returns AxiosResponse with its own types
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {'Authorization': `Bearer ${getToken()}`},
  });

  // Translate to our contract (only what we need)
  return httpResponseContract.parse({
    body: response.data,
    statusCode: response.status,
    headers: response.headers,
  });
};

// Pattern 3: Composition of package functions
// adapters/fs/copy-file/fs-copy-file-adapter.ts
import {readFile, writeFile, mkdir} from 'fs/promises';
import {dirname} from 'path';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';

export const fsCopyFileAdapter = async ({
  source,
  destination
}: {
  source: FilePath;
  destination: FilePath;
}): Promise<void> => {
  const content = await readFile(source);           // fs.readFile
  const dir = dirname(destination);
  await mkdir(dir, {recursive: true});            // fs.mkdir
  await writeFile(destination, content);            // fs.writeFile
  // Multiple fs functions, one app operation: "copy file safely"
};
```

**Testing:**

Adapter tests use adapter proxies to mock npm dependencies.
See [Testing Standards - Proxy Architecture](testing-standards.md#proxy-architecture) for complete details.

```typescript
// adapters/fs/read-file/fs-read-file-adapter.test.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {fsReadFileAdapterProxy} from './fs-read-file-adapter.proxy';
import {FilePathStub} from '../../../contracts/file-path/file-path.stub';
import {FileContentsStub} from '../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
  it('VALID: {filePath: "/config.json"} => returns file contents', async () => {
      // Create proxy (mocks fs/promises npm package)
      const adapterProxy = fsReadFileAdapterProxy();

      const filePath = FilePathStub('/config.json');
    const expected = FileContentsStub('{"key": "value"}');

      adapterProxy.returns({filePath, contents: expected});

    const result = await fsReadFileAdapter({filePath});

    expect(result).toStrictEqual(expected);
  });
});
```

### middleware/ - Infrastructure Orchestration

**Purpose:** Combine multiple infrastructure adapters into cohesive bundles

**Folder Structure:**

```
middleware/
  http-telemetry/
    http-telemetry-middleware.ts
    http-telemetry-middleware.proxy.ts  # Delegates to adapter proxies
    http-telemetry-middleware.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-middleware.ts` (e.g., `http-telemetry-middleware.ts`)
- **Export:** camelCase ending with `Middleware` (e.g., `httpTelemetryMiddleware`, `errorTrackingMiddleware`)
- **Proxy:** kebab-case ending with `-middleware.proxy.ts`, export `[name]MiddlewareProxy` (e.g.,
  `httpTelemetryMiddlewareProxy`)
- **Pattern:** middleware/[name]/[name]-middleware.ts

**Constraints:**

- **ONLY** for infrastructure concerns (telemetry, observability, monitoring)
- **NOT** for business logic
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
      user-fetch-broker.proxy.ts       # Setup helper + global mocks
      user-fetch-broker.test.ts
  comment/
    create-process/
      comment-create-process-broker.ts
      comment-create-process-broker.proxy.ts
      comment-create-process-broker.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-broker.ts` (e.g., `user-fetch-broker.ts`, `email-send-broker.ts`)
- **Export:** camelCase `[domain][Action]Broker` (e.g., `userFetchBroker`, `emailSendBroker`,
  `commentCreateProcessBroker`)
- **Proxy:** kebab-case ending with `-broker.proxy.ts`, export `[name]BrokerProxy` (e.g., `userFetchBrokerProxy`)
- **Pattern:** brokers/[domain]/[action]/[domain]-[action]-broker.ts

**Constraints:**

- **Two Types:**
    - **Atomic:** Single operations (call one API, query one table)
    - **Orchestration:** Coordinate multiple brokers for workflows
- **Knows** endpoints, database tables, queue names, workflows
- **Max 2 levels:** brokers/[domain]/[action]/ (no deeper nesting)
    - ❌ `brokers/product/inventory/stock/check/`
    - ✅ `brokers/product/check-inventory-stock/`
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
    use-user-data-binding.proxy.ts  # Delegates to broker proxy
    use-user-data-binding.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `use-` and ending with `-binding.ts` (e.g., `use-user-data-binding.ts`)
- **Export:** camelCase starting with `use` and ending with `Binding` (e.g., `useUserDataBinding`,
  `useFileWatcherBinding`)
- **Proxy:** kebab-case ending with `-binding.proxy.ts`, export `[name]BindingProxy` (e.g., `useUserDataBindingProxy`)
- **Pattern:** bindings/use-[resource]/use-[resource]-binding.ts

**Constraints:**

- **Frontend:** React hooks for data binding (must start with `use`)
- **CLI:** Reactive watchers and monitors (must start with `use`)
- **Backend:** Not applicable
- **Must** return `{data, loading, error}` pattern for async operations
- **Must** wrap single broker calls only (no orchestration)

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
    user-cache-state.proxy.ts    # Jest spies + cleanup
    user-cache-state.test.ts
  redis-client/
    redis-client-state.ts
    redis-client-state.proxy.ts  # Mocks Redis → in-memory
    redis-client-state.test.ts
  app-config/
    app-config-state.ts
    app-config-state.proxy.ts    # Simple proxy for direct access
    app-config-state.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-state.ts` (e.g., `user-cache-state.ts`, `app-config-state.ts`)
- **Export:** camelCase ending with `State` (e.g., `userCacheState`, `appConfigState`)
- **Proxy:** kebab-case ending with `-state.proxy.ts`, export `[name]StateProxy` (e.g., `userCacheStateProxy`)
- **Pattern:** state/[name]/[name]-state.ts

**Constraints:**

- **Frontend:** React contexts, Zustand/Redux stores
- **Backend:** Caches, session stores, connection pools
- **Pure storage:** In-memory only (Maps, Sets, objects) OR external systems (Redis, DB pools)
- **Configuration:** App-wide constants, feature flags, API base URLs live here
- **Must** export as objects with methods/properties (not individual functions)
- **Proxy required for:** Stateful data that persists between tests or external systems (Redis, DB)
- **Proxy optional for:** Simple configuration that rarely changes

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
    },
    clear: (): void => {
        cache.clear();
    }
};

// state/app-config/app-config-state.ts
import {urlContract} from '../../contracts/url/url-contract';
import type {Url} from '../../contracts/url/url-contract';

export const appConfigState = {
    apiUrl: urlContract.parse(process.env.API_URL || 'https://api.example.com')
} satisfies { apiUrl: Url };
```

**Proxy Implementation:** See [Testing Standards - Proxy Architecture](testing-standards.md#proxy-architecture) for
complete proxy patterns and examples.

### responders/ - Route Handlers

**Purpose:** Handle requests from flows (HTTP, queue, scheduled, WebSocket)

**Folder Structure:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.proxy.ts      # Delegates to broker proxy
      user-get-responder.test.ts
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.proxy.ts
      email-process-queue-responder.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-responder.ts` (e.g., `user-get-responder.ts`,
  `email-process-queue-responder.ts`)
- **Export:** PascalCase `[Domain][Action]Responder` (e.g., `UserGetResponder`, `EmailProcessQueueResponder`)
- **Proxy:** kebab-case ending with `-responder.proxy.ts`, export `[name]ResponderProxy` (e.g., `userGetResponderProxy`)
- **Pattern:** responders/[domain]/[action]/[domain]-[action]-responder.ts

**Constraints:**

- **Frontend pages:** Return JSX.Element
- **Backend controllers:** Accept {req, res}, call res methods
- **Queue processors:** Process queue jobs
- **Scheduled tasks:** Execute on time conditions
- **One export per file**
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
    user-card-widget.proxy.ts   # Setup + triggers + selectors
    user-card-widget.test.tsx
    avatar-widget.tsx
    avatar-widget.proxy.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-widget.tsx` (e.g., `user-card-widget.tsx`, `avatar-widget.tsx`)
- **Export:** PascalCase ending with `Widget` (e.g., `UserCardWidget`, `AvatarWidget`)
- **Proxy:** kebab-case ending with `-widget.proxy.ts`, export `[name]WidgetProxy` (e.g., `userCardWidgetProxy`)
- **Pattern:** widgets/[name]/[name]-widget.tsx

**Constraints:**

- **Must** return JSX.Element
- **Must** export prop types as `[WidgetName]Props` (e.g., `UserCardWidgetProps`)
- **Sub-components:** Live in same folder, no separate folders
- **CAN** use bindings in render phase
- **CAN** use brokers in event handlers
- **CANNOT** use bindings in event handlers (React will error)
- **CAN** use React useState for component-local UI state

**Example:**

```tsx
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

    if (loading) return <div>Loading</div>;
    if (error) return <div>Error: { error.message }</div>;
    if (!user) return <div>No user found </div>;

    return (
        <div>
            <AvatarWidget userId = {userId} />
            <button onClick = {handleUpdate} > Update < /button>
        </div>
    );
};
```

### startup/ - Application Bootstrap

**Purpose:** Application initialization and wiring (no business logic)

**Folder Structure (depending on project type):**

```
startup/
  start-app.tsx                     // Frontend app bootstrap
  start-app.integration.test.tsx    // Integration test - wires up entire app
  start-server.ts                   // Backend server initialization
  start-server.integration.test.ts  // Integration test - wires up entire server
  start-queue-worker.ts             // Queue processor bootstrap
  start-queue-worker.integration.test.ts
  start-scheduler-service.ts        // Scheduled tasks bootstrap
  start-scheduler-service.integration.test.ts
  start-cli.ts                      // CLI entry point
  start-cli.integration.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `start-` (e.g., `start-server.ts`, `start-app.tsx`, `start-cli.ts`)
- **Export:** PascalCase starting with `Start` (e.g., `StartServer`, `StartApp`, `StartCli`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
- **Pattern:** startup/start-[name].ts

**Constraints:**

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
