# Project Standards

## Universal File Rules

**File Naming:**

- All filenames must use kebab-case (e.g., `user-fetch-broker.ts`, `format-date-transformer.ts`)

**Function Exports:**

- All functions must use `export const` with arrow function syntax
- Exception: Error classes use `export class`
- **Always use named exports** - never use `export default`

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
// ✅ CORRECT - Object destructuring with type relationships
const updateUser = ({user, companyId}: { user: User; companyId: Company['id'] }) => {
}

// ❌ AVOID - Positional parameters
const updateUser = (user: User, companyId: string) => {
}

// ✅ CORRECT - Complete objects preserve type relationships
const processOrder = ({user, companyId}: { user: User; companyId: Company['id'] }) => {
    // Type safety maintained - companyId is Company['id'], not just string
}

// ❌ AVOID - Individual properties lose type relationships
const processOrder = ({userName, userEmail, companyId}: {
    userName: string;
    userEmail: string;
    companyId: string;  // Lost relationship to Company type
}) => {
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
- **Use existing types** from codebase or create new ones
- **For uncertain data** (including catch variables): Use `unknown` and prove shape through guards
- **Fix at source** - Never suppress errors with `@ts-ignore` or `@ts-expect-error`
- **Type inference** - Let TypeScript infer when values are clear, be explicit for:
    - Empty arrays and objects
    - Ambiguous values
    - Exported functions returning known types from contracts/
- **Type assertions** - Only use when you have information the compiler lacks (e.g., `JSON.parse`)

```typescript
// ✅ CORRECT - Strict typing with unknown
const handleError = ({error}: { error: unknown }) => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Unknown error';
};

// ✅ CORRECT - Explicit types for empty values
const users: User[] = [];  // Clear intent
const config: Record<string, string> = {};

// ✅ CORRECT - Type inference for clear values
const userId = user.id;  // Inferred from user type
const names = users.map(u => u.name);  // Inferred from array

// ❌ WRONG - Using 'any' type
const data: any = response.data;  // Loses all type safety
const processItem = (item: any) => {
};  // Dangerous

// ❌ WRONG - Suppressing TypeScript errors
// @ts-ignore
const result = dangerousOperation();

// @ts-expect-error
const value = user.nonExistentProperty;

// ❌ WRONG - Disabling lint
/* eslint-disable */
const badCode = () => {
};  // Bypasses critical checks

// ✅ CORRECT - Create proper types instead
type ApiResponse = {
    data: User[];
    meta: { total: number };
};
const processItem = ({item}: { item: User }) => {
};

// ✅ CORRECT - Type assertion when you have info compiler lacks
const data = JSON.parse(response) as ApiResponse;

// ❌ AVOID - Fighting TypeScript's inference
const count = (items.length as number) + 1;  // TypeScript already knows this

// ✅ CORRECT - Explicit return type for exported function returning known type
export const loadConfig = (): Config => {
    return {
        apiUrl: process.env.API_URL || 'http://localhost:3000',
        timeout: 5000
    };
};

// ✅ CORRECT - Let inference work for complex return shapes
const processUser = ({user}: { user: User }) => {
    return {
        ...user,
        displayName: `${user.firstName} ${user.lastName}`,
        isActive: user.status === 'active'
    };  // TypeScript infers complex shape automatically
};

// ✅ CORRECT - Internal functions use inference
const isEven = ({n}: { n: number }) => {
    return n % 2 === 0;  // TypeScript infers boolean
};
```

**Promise Handling:**

- **Always use async/await** over `.then()` chains for readability
- **Handle errors at appropriate level** - Not every async call needs try/catch
- **Use `Promise.all()`** for parallel operations when independent
- **Await sequentially** only when operations are dependent

```typescript
// ✅ CORRECT - Parallel when independent
const [user, config, permissions] = await Promise.all([
    fetchUser({id}),
    loadConfig(),
    getPermissions({id})
]);

// ❌ AVOID - Sequential when could be parallel
const user = await fetchUser({id});
const config = await loadConfig();
const permissions = await getPermissions({id});

// ✅ CORRECT - Sequential when dependent
const user = await fetchUser({id});
const company = await fetchCompany({companyId: user.companyId});  // Needs user first
```

**Error Handling:**

- **Handle errors explicitly** for every operation that can fail
- **Never silently swallow errors** - Always log, throw, or handle appropriately
- **Provide context** in error messages with relevant data

```typescript
// ✅ CORRECT - Error with context
const loadConfig = async ({path}: { path: string }) => {
    try {
        const content = await readFile(path, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to load config from ${path}: ${error}`);
    }
};

// ✅ CORRECT - Handle at appropriate level
const processUser = async ({userId}: { userId: string }) => {
    // Let broker throw, catch at responder level
    const user = await userFetchBroker({userId});
    return user;
};

// ❌ AVOID - Silent error swallowing
const loadConfig = async ({path}: { path: string }) => {
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        return {};  // Silent failure loses critical information!
    }
};

// ❌ AVOID - Generic error without context
throw new Error('Config load failed');  // What path? What error?
```

**Performance & Code Cleanup:**

- **Default to efficient algorithms** - Dataset sizes are unknown; use Map/Set for lookups over nested array searches
- **Remove dead code** - Unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log
  statements

```typescript
// ✅ CORRECT - O(n) using Map for lookups
const userMap = new Map(users.map(user => [user.id, user]));
const targetUser = userMap.get(targetId);

// ❌ AVOID - O(n²) nested loops
const activeUsers = users.filter(user => {
    return otherUsers.find(other => other.id === user.id)?.isActive;
});
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
src/
├── contracts/      # Types, schemas, validation, boolean functions
├── transformers/   # Pure data transformation (non-boolean returns)
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

| ❌ FORBIDDEN   | ✅ USE INSTEAD               | WHY                                                            |
|---------------|-----------------------------|----------------------------------------------------------------|
| utils/        | adapters/ or transformers/  | Based on whether it wraps external packages or transforms data |
| lib/          | adapters/                   | External package wrappers only                                 |
| helpers/      | contracts/ or transformers/ | Boolean functions → contracts/, others → transformers/         |
| common/       | Distribute by function      | No catch-all folders allowed                                   |
| shared/       | Distribute by function      | No catch-all folders allowed                                   |
| core/         | brokers/                    | Business logic operations                                      |
| services/     | brokers/                    | Business operations                                            |
| repositories/ | brokers/                    | Data access operations                                         |
| models/       | contracts/                  | Data definitions and validation                                |
| types/        | contracts/                  | All types and interfaces                                       |
| interfaces/   | contracts/                  | Type definitions                                               |
| validators/   | contracts/                  | Validation logic                                               |
| formatters/   | transformers/               | Data formatting                                                |
| mappers/      | transformers/               | Data mapping                                                   |
| converters/   | transformers/               | Data conversion                                                |

## Import Rules - What Can Import What

```
startup/ → ALL (bootstrap only, no business logic)
flows/ → responders/ (ONLY)
responders/ → widgets/ (UI only), brokers/, bindings/ (UI only), state/, contracts/, transformers/, errors/
widgets/ → bindings/, brokers/, state/, contracts/, transformers/, errors/ (UI only)
bindings/ → brokers/, state/, contracts/, errors/ (UI only)
brokers/ → brokers/, adapters/, contracts/, errors/
middleware/ → adapters/, middleware/
adapters/ → node_modules, middleware/ (when coupled)
transformers/ → contracts/, errors/
state/ → contracts/, errors/
contracts/ → errors/
errors/ → (no imports)
```

## Folder Definitions, Constraints, and Examples

### contracts/ - Data Contracts and Validation

**Purpose:** Complete data contract enforcement - types, validation, and pure boolean checks

**Folder Structure:**

```
contracts/
  user-contract/
    user-contract.ts
    user-contract.test.ts
  has-permission/
    has-permission.ts
    has-permission.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case (e.g., `user-contract.ts`, `is-valid-email.ts`)
- **Exports:**
    - Types/Interfaces: PascalCase (e.g., `User`, `StripeWebhookEvent`)
    - Enums: SCREAMING_SNAKE_CASE (e.g., `USER_ROLE`)
    - Schemas: camelCase ending with `Contract` (e.g., `userContract`, `emailContract`)
    - Boolean functions: camelCase starting with `is/has/can/should/will/was` (e.g., `isValidEmail`, `hasPermission`)
    - Validate functions: camelCase starting with `validate` (e.g., `validateUser`)

**Constraints:**

- **CAN** export TypeScript types/interfaces (all types go here)
- **CAN** export validation schemas (Zod, Yup, Joi)
- **CAN** export pure functions returning booleans (no external calls)
- **CAN** export validate functions (exception to boolean-only rule)
- **Must** have explicit return types on all exported boolean/validate functions
- **CAN** import errors/ only

**Example:**

```typescript
// contracts/user-contract/user-contract.ts
import {z} from 'zod';

export const userContract = z.object({
    id: z.string().uuid(),
    email: z.string().email()
});

export type User = z.infer<typeof userContract>;

// contracts/has-permission/has-permission.ts
export const hasPermission = ({user, action}: { user: User; action: string }) => {
    return user.permissions.includes(action);  // ✅ Pure, no external calls
};

// ❌ WRONG: Needs database, goes in brokers/
// export const userExists = async ({email}) => await db.find({email});
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
- **Must** have explicitly typed returns of non-boolean values
- **CAN** import contracts/ and errors/

**Example:**

```typescript
// transformers/format-date/format-date-transformer.ts
export const formatDateTransformer = ({date}: { date: Date }) => {
    return date.toISOString().split('T')[0];
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
    constructor({message, field}: { message: string; field?: string }) {
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
    axios-get.ts
    axios-get.test.ts
    axios-post.ts
    axios-post.test.ts
    axios-put.ts
    axios-put.test.ts
  aws-sdk-client-s3/
    aws-sdk-client-s3-upload.ts
    aws-sdk-client-s3-upload.test.ts
    aws-sdk-client-s3-download.ts
    aws-sdk-client-s3-download.test.ts
    aws-sdk-client-s3-delete.ts
    aws-sdk-client-s3-delete.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[package-name]-[function-name].ts` (e.g., `axios-get.ts`, `stripe-charges-create.ts`)
- **Export:** camelCase `[packageName][Function]` (e.g., `axiosGet`, `mongooseFind`, `stripeChargesCreate`)
- **Pattern:** adapters/[package-name]/[package-name]-[function-name].ts

**Constraints:**

- **CRITICAL: One export per file** - Each adapter file must export exactly one function
    - ✅ `adapters/axios/axios-get.ts` (single export: axiosGet)
    - ✅ `adapters/axios/axios-post.ts` (single export: axiosPost)
    - ❌ `adapters/axios/axios-requests.ts` with multiple exports (violates single responsibility)
- **EVOLUTION RULE:** Created on-demand when lint detects duplicate package usage
- **Naming:** Based on package's function names, NOT business domain
    - ✅ `adapters/stripe/stripe-charges-create.ts` (wraps stripe.charges.create)
    - ❌ `adapters/stripe/payment.ts` (business domain)
- **Must** add project-specific configuration (timeout, auth, retry)
- **Must** know NOTHING about business logic
- **CAN** import node_modules and middleware/ (when coupled)

**Example:**

```typescript
// adapters/axios/axios-get.ts
import axios from 'axios';

export const axiosGet = async ({url}: { url: string }) => {
    return await axios.get(url, {
        headers: {'Authorization': `Bearer ${getToken()}`},
        timeout: 10000
    });
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
import {winstonLog} from '../../adapters/winston/winston-log';
import {prometheusIncrementCounter} from '../../adapters/prometheus/prometheus-increment-counter';

export const httpTelemetryMiddleware = async ({method, url, statusCode, duration}) => {
    await winstonLog({level: 'info', message: `${method} ${url} - ${statusCode}`});
    await prometheusIncrementCounter({name: 'http_requests_total', labels: {method, status: String(statusCode)}});
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
import {axiosGet} from '../../../adapters/axios/axios-get';

export const userFetchBroker = async ({userId}: { userId: string }) => {
    const response = await axiosGet({url: `/api/users/${userId}`});
    return response.data;
};

// brokers/comment/create-process/comment-create-process-broker.ts (Orchestration)
import {commentCreateBroker} from '../create/comment-create-broker';
import {notificationSendBroker} from '../../notification/send/notification-send-broker';

export const commentCreateProcessBroker = async ({content, postId, userId}) => {
    const comment = await commentCreateBroker({content, postId, userId});
    await notificationSendBroker({userId, type: 'new_comment', data: {commentId: comment.id}});
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

export const useUserDataBinding = ({userId}: { userId: string }) => {
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
import {User} from '../../contracts/user-contract/user-contract';

const cache = new Map<string, User>();

export const userCacheState = {
    get: ({id}: { id: string }): User | undefined => {
        return cache.get(id);
    },
    set: ({id, user}: { id: string; user: User }): void => {
        cache.set(id, user);
    }
};

// state/app-config/app-config-state.ts
export const appConfigState = {
    apiUrl: process.env.API_URL || 'https://api.example.com',
    timeout: parseInt(process.env.TIMEOUT || '10000')
};

// state/user-context/user-context-state.ts (React Context example)
import {createContext, useContext} from 'react';
import {User} from '../../contracts/user-contract/user-contract';

const UserContext = createContext<User | null>(null);

export const userContextState = {
    context: UserContext,
    Provider: UserContext.Provider,
    useContext: () => {
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

export const UserGetResponder = async ({req, res}) => {
    const user = await userFetchBroker({userId: req.params.id});
    res.json(user);
};

// responders/email/process-queue/email-process-queue-responder.ts (Queue)
import {emailSendBroker} from '../../../brokers/email/send/email-send-broker';

export const EmailProcessQueueResponder = async ({job}) => {
    await emailSendBroker({to: job.data.email, subject: job.data.subject});
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

export type UserCardWidgetProps = {
    userId: string;
    onUpdate?: ({userId}: { userId: string }) => void;
};

export const UserCardWidget = ({userId, onUpdate}: UserCardWidgetProps) => {
    const {data: user, loading, error} = useUserDataBinding({userId});
    const handleUpdate = async () => {
        await userUpdateBroker({userId, data: user});
        onUpdate?.({userId});
    };

    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error < /div>;

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

```typescript
// ✅ CORRECT - Responder with validation
export const UserCreateResponder = async ({req, res}) => {
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

// ✅ CORRECT - Move orchestration to broker
// brokers/user/signup-process/user-signup-process-broker.ts
export const userSignupProcessBroker = async ({userData}) => {
    // Business validation
    if (userData.email.includes('@competitor.com')) {
        throw new ValidationError({message: 'Competitor emails not allowed'});
    }

    // Multi-step orchestration
    const user = await userCreateBroker({userData});
    if (userData.plan === 'premium') {
        await subscriptionCreateBroker({userId: user.id});
        await emailSendBroker({to: user.email, template: 'premium-welcome'});
    }

    return user;
};

// responders/user/signup/user-signup-responder.ts
export const UserSignupResponder = async ({req, res}) => {
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
// ✅ CORRECT - Each output shape is a separate transformer
// transformers/user-to-dto/user-to-dto-transformer.ts
export const userToDtoTransformer = ({user}: { user: User }) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email  // Public API response
    };
};

// transformers/user-to-summary/user-to-summary-transformer.ts
export const userToSummaryTransformer = ({user}: { user: User }) => {
    return {
        id: user.id,
        displayName: `${user.firstName} ${user.lastName}`  // Different output shape
    };
};

// transformers/user-to-admin-dto/user-to-admin-dto-transformer.ts
export const userToAdminDtoTransformer = ({user}: { user: User }) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash  // Admin-only fields
    };
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
export const userFetchBroker = async ({
                                          companyId,
                                          status
                                      }: {
    companyId: string;
    status?: 'active' | 'inactive';  // Filter option
}) => {
    const users = await axiosGet({url: `/api/companies/${companyId}/users`});
    return status ? users.filter(u => u.status === status) : users;
};

// ❌ DON'T CREATE - user-fetch-active-broker.ts (this is a filter variant!)

// ✅ EXTEND - Lookup method is an option
export const userFetchBroker = async ({
                                          userId,
                                          email
                                      }: {
    userId?: string;
    email?: string;
}) => {
    if (userId) return await axiosGet({url: `/api/users/${userId}`});
    if (email) return await axiosGet({url: `/api/users?email=${email}`});
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