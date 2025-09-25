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
- **Must** have explicit return types on all exported functions
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
- **Must** return non-boolean values
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

- **Filename:** kebab-case ending with `-flow.ts` (e.g., `user-flow.ts`)
- **Export:** camelCase ending with `Flow` (e.g., `userFlow`, `checkoutFlow`)
- **Pattern:** flows/[domain]/[domain]-flow.ts

**Constraints:**

- **CAN ONLY** import responders/
- **Frontend:** Use react-router-dom Route/Routes
- **Backend:** Use express.Router
- **Package:** Entry files that compose public API

**Example:**

```typescript
// flows/user/user-flow.tsx (Frontend)
import {Route} from 'react-router-dom';
import {UserProfileResponder} from '../../responders/user/profile/user-profile-responder';

export const userFlow = (
    <Route path = "/users" >
    <Route path = ":id"
element = { < UserProfileResponder / >
}
/>
< /Route>
)
;

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

export const userFlow = router;
```

### adapters/ - External Package Configuration

**Purpose:** Add project-wide policies to external packages (auth, timeout, retry, logging)

**Folder Structure:**

```
adapters/
  axios/
    axios-get.ts
    axios-get.test.ts
  mongoose/
    mongoose-find.ts
    mongoose-find.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[package-name]-[function-name].ts` (e.g., `axios-get.ts`, `stripe-charges-create.ts`)
- **Export:** camelCase `[packageName][Function]` (e.g., `axiosGet`, `mongooseFind`, `stripeChargesCreate`)
- **Pattern:** adapters/[package-name]/[package-name]-[function-name].ts

**Constraints:**

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
    const [user, setUser] = useState(null);
    useEffect(() => {
        userFetchBroker({userId}).then(setUser);
    }, [userId]);
    return user;
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
- **Pure storage:** No side effects, no external calls
- **Configuration:** Dynamic/runtime config lives here
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
    const userData = useUserDataBinding({userId});
    const handleUpdate = async () => {
        await userUpdateBroker({userId, data});
        onUpdate?.({userId});
    };
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
export const useUserWithCompanyBinding = ({userId}) => {
    useEffect(() => {
        const user = await userFetchBroker({userId});  // First await
        const company = await companyFetchBroker({companyId: user.companyId});  // Second await - orchestration!
        setData({user, company});
    }, [userId]);
};

// ✅ CORRECT - Move orchestration to broker
// brokers/user/fetch-with-company/user-fetch-with-company-broker.ts
export const userFetchWithCompanyBroker = async ({userId}) => {
    const user = await userFetchBroker({userId});
    const company = await companyFetchBroker({companyId: user.companyId});
    return {user, company};
};

// bindings/use-user-with-company/use-user-with-company-binding.ts
export const useUserWithCompanyBinding = ({userId}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        userFetchWithCompanyBroker({userId})  // Single broker call
            .then(setData)  // data = {user, company}
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error};  // data.user, data.company accessible in widget
};

// widgets/user-profile/user-profile-widget.tsx
export const UserProfileWidget = ({userId}) => {
    const {data, loading, error} = useUserWithCompanyBinding({userId});
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