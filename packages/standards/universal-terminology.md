# Universal Terminology Standards

This document defines the approved folder structure terminology that works across all project types (frontend, backend,
npm packages).

## Why????

LLM does not know where to put code, so it squirrels it away where ever it's semantic linking tells it best at that
point in time. Utils is immensely problematic from an organizational perspective. The only way to get LLM to organize
effectively is to force it into a dictated structure, and if we have to do this across multiple tech type projects, or a
monorepo with multiple types in it, we need consistent terminology.

## Approved Universal Terminology

**Note:** The first column shows our universal term. Subsequent columns show traditional folder names used in each tech
stack that map to our universal term. These are what developers typically call these folders, NOT necessarily what we
allow. For example, we show "utils/" as a traditional name for adapters, but we forbid utils/ folders - everything must
use our universal terms.

| Our Term         | Frontend                               | Backend                                      | Library Package         | CLI Package                  |
|------------------|----------------------------------------|----------------------------------------------|-------------------------|------------------------------|
| **types**        | types/, interfaces/                    | types/, models/                              | types/                  | types/                       |
| **schemas**      | validators/, forms/                    | validators/, dto/                            | validators/             | validators/, parsers/        |
| **transformers** | formatters/, serializers/              | mappers/, converters/                        | transformers/           | formatters/, processors/     |
| **errors**       | errors/                                | errors/, exceptions/                         | errors/                 | errors/                      |
| **flows**        | routes/                                | routes/, endpoints/                          | entries/                | commands/                    |
| **adapters**     | services/, lib/, utils/                | services/, lib/, utils/                      | services/, lib/, utils/ | services/, lib/, utils/      |
| **brokers**      | api/, repositories/, notifications/    | repositories/, gateways/, notifications/     | client/, sdk/           | prompts/, fs-operations/     |
| **bindings**     | hooks/ (React hooks)                   | listeners/, subscribers/                     | -                       | watchers/, listeners/        |
| **triggers**     | actions/, operations/                  | procedures/, workflows/                      | procedures/, workflows/ | handlers/, processors/       |
| **state**        | contexts/, stores/                     | cache/, session/, memory/                    | config/                 | config/, session/            |
| **responders**   | pages/                                 | controllers/, queue-processors/, schedulers/ | -                       | handlers/ (command handlers) |
| **widgets**      | components/, forms/, modals/, layouts/ | views/, templates/, partials/                | -                       | displays/, output/           |
| **startup**      | index.tsx, app.tsx                     | index.ts, server.ts, workers/, jobs/         | -                       | bin/, cli.ts                 |

### Why reinvent the wheel on terminology?

Various terms in the above matrix have very loaded connotation which short-circuits LLM the most. Utils being one of
them. By MOSTLY deviating from industry-standard terms, while also finding common-ground across tech architecture, we
can force LLM out of its trained responses, and get more determinist results from it.

If someone is lost in a forest and has a map, they're more likely to just follow the map then trudge through the forest.
LLM is the same. By divorcing them from comfortable, trained on terminology, they will more likely organize code based
on this doc rather than "confidence score" when listing files in project and making determinations from that.

## Lintable Constraints for Universal Terms

### types/

**Purpose:** Data shapes and type definitions only

- **Must NOT** contain any runtime code (functions, classes with methods)
- **Must NOT** import from adapters/, widgets/, or flows/
- **CAN** only export: type, interface, enum, const enum
- **Export naming:** PascalCase for types/interfaces, SCREAMING_SNAKE_CASE for enums

### schemas/

**Purpose:** Runtime validation schemas and validation logic

- **Must** export schema objects (Zod, Yup, Joi, etc.) or validation functions
- **CAN** import from types/ and errors/ only
- **Must** provide parse/validate methods that return typed data
- **CAN** export validation utility functions (isEmail, isURL, etc.)
- **Export naming:** camelCase for schema objects and functions
- **Examples:** userSchema.parse(), validateEmail(), isValidPhone()

### errors/

**Purpose:** Error classes and exception handling

- **Must** extend Error class
- **Export naming:** Must end with `Error` (e.g., `ValidationError`, `NetworkError`)
- **Must** have `message` property
- **CAN** import from types/ only

### flows/

**Purpose:** Route definitions and entry points

- **Frontend:** Must import react-router-dom, must use Route/Routes
- **Backend:** Must import express.Router, must call .get()/.post()/.put()/.delete()
- **Package:** Entry files that compose and export public API
- **CAN ONLY** import from: responders/ (flows only go to responders)
- **Must** define paths/routes as constants

### adapters/

**Purpose:** External package wrappers - THE ONLY PLACE FOR NODE_MODULES

- **CRITICAL:** Only folder allowed to import node_modules (except direct-source packages)
- **Structure:** adapters/[package-name]/[function-name]/[function-name].ts
- **One package per folder:** adapters/axios/\*, adapters/mongoose/\*, etc.
- **One function per file**
- **Must** wrap external package functionality
- **CAN NOT** import from flows/, widgets/, or other business logic
- **Direct-source exceptions** (can be imported anywhere):
    - Pure utility libraries: lodash, date-fns, uuid, classnames, ramda
    - Node built-ins: fs, path, crypto, url, querystring
    - Testing libraries: jest, @testing-library/*, vitest
    - Note: These are language-level utilities, not domain packages. When in doubt, wrap in adapters/
- **Note on middleware packages:**
    - Express middleware (cors, body-parser, helmet) goes in adapters/
    - Example: adapters/cors/, adapters/body-parser/, adapters/auth0/

### brokers/

**Purpose:** Atomic operations against external systems (single responsibility)

- **Wraps** a single adapter operation with business context
- **Provides** the internal API that business logic uses for external communication
- **CANNOT** call other brokers (prevents chains)
- **CANNOT** call triggers (keeps them atomic)
- **CAN** import from adapters/, types/, errors/, schemas/
- **CAN NOT** import from widgets/, flows/, state/, or triggers/
- **Must** handle error cases from adapters and transform them to domain errors
- **Pattern:** brokers/[domain-operation]/[domain-operation].ts
- **Examples:** brokers/user-fetch/, brokers/email-send/, brokers/payment-process/

### bindings/

**Purpose:** Reactive connections that watch for changes

- **Frontend:** React hooks that bind data to components (must start with `use`)
- **Backend:** Not applicable
- **Library Package:** Not applicable
- **CLI Package:** File watchers, process monitors, event listeners
- **Frontend CAN use:** useState, useEffect, useCallback, useMemo, useContext, useReducer
- **CLI CAN use:** fs.watch, process.on, chokidar, etc.
- **Pattern:** bindings/[watch-resource]/[watch-resource].ts
- **Examples:**
    - Frontend: bindings/use-user-data/, bindings/use-cart-items/
    - CLI: bindings/watch-files/, bindings/listen-stdin/

### triggers/

**Purpose:** Pure orchestration functions (no React lifecycle constraints)

- **Frontend:** Async functions for event handlers and imperative flows
- **Backend:** Workflow functions that ensure operations happen consistently
- **Package:** Universal orchestration logic
- **CANNOT use:** React hooks (no useState, useEffect, etc.)
- **CAN** call multiple brokers to orchestrate operations
- **CAN** import from schemas/ for validation
- **CAN NOT** call other triggers or bindings (prevents chains)
- **CAN NOT** call adapters directly (must go through brokers)
- **Pattern:** triggers/[operation-flow]/[operation-flow].ts
- **Examples:** triggers/user-registration-flow/, triggers/checkout-process/
- **Note on custom middleware:**
    - Auth checks, validation, rate limiting logic goes in triggers/
    - Called by responders before main logic
    - Example: triggers/auth-validation-flow/, triggers/rate-limit-check/

### state/

**Purpose:** Data storage and memory management (NOT orchestration)

- **Frontend:** React contexts, Zustand/Redux stores
- **Backend:** Caches, session stores, connection pools
- **Must** manage data lifecycle (storage, retrieval, cleanup)
- **CAN** import from types/, errors/
- **CAN NOT** import from brokers/, triggers/, widgets/, or flows/
- **Pure storage:** No side effects, no external calls
- **Note on configuration:**
    - Dynamic/runtime config lives in state/
    - Example: state/app-config/, state/feature-flags/

### responders/

**Purpose:** Route handlers that orchestrate responses to flows

- **Frontend (pages):** Must return JSX.Element for rendering
- **Backend (controllers):** Must accept (req, res) and call res methods
- **Backend (queue processors):** Process queue jobs when they arrive
- **Backend (scheduled tasks):** Execute when time conditions are met
- **One export per file:** Each responder is a single function
- **With UI CAN** import from: widgets/, triggers/, brokers/, bindings/, state/, types/, errors/, schemas/
- **Without UI CAN** import from: triggers/, brokers/, state/, types/, errors/, schemas/
- **CAN** call brokers directly for simple operations
- **CAN** call triggers for complex workflows
- **CAN NOT** import from other responders/ or flows/
- **CAN ONLY** be imported by flows/
- **Pattern:** responders/[descriptive-name]/[descriptive-name].ts
- **Examples by type:**
    - HTTP: responders/user-get-controller/, responders/login-page/
    - Queue: responders/process-email-queue/, responders/resize-image-handler/
    - Scheduled: responders/generate-daily-report/, responders/cleanup-old-data/
- **Note:** Temporal responders (queue/scheduled) are registered in startup/ files that run as separate processes

**CRITICAL RULE:** If a route points to it, it's a responder - including React Router outlet content:

```jsx
// flows/app-routes.tsx
<Route path="/dashboard" element={<DashboardResponder/>}> // responder with <Outlet/>
    <Route index element={<DashboardHomeResponder/>}/> // responder
    <Route path="stats" element={<StatsResponder/>}/> // responder (not widget!)
    <Route path="users" element={<UserListResponder/>}/> // responder (not widget!)
</Route>

// responders/stats-section/stats-section.tsx
import {StatsChart} from '../../widgets/stats-chart/stats-chart';
import {StatsTable} from '../../widgets/stats-table/stats-table';

export const StatsSection = () => {
    return (
        <>
            <StatsChart/> // widgets used by responder
            <StatsTable/> // widgets used by responder
        </>
    );
};
```

### widgets/

**Purpose:** Display and presentation logic

- **Frontend:** Must return JSX.Element, must import React
- **Backend:** Template/view rendering functions
- **Export naming:** PascalCase for components
- **CAN** import from bindings/, triggers/, state/, types/, transformers/
- **MUST** use bindings for reactive data (in render phase)
- **MUST** use triggers for imperative operations (in event handlers)
- **CAN** use React's useState for component-local UI state (show/hide, form inputs)
- **Note:** React's useState is for component state only. Application state goes in state/
- **CAN NOT** call bindings in event handlers (React will error!)
- **CAN NOT** import from brokers/ directly
- **CAN NOT** import from adapters/ (except styling libraries like MUI, styled-components)
- **CAN NOT** import from flows/ or responders/

**Example:**

```jsx
export const UserForm = () => {
    // ✅ Bindings in render phase
    const userData = useUserData(id);  // bindings/

    const handleSubmit = async () => {
        // ✅ Triggers in event handlers
        await userUpdateFlow(data);  // triggers/
        // ❌ const data = useUserData(id);  // ERROR! Can't call bindings here
    };

    return <form onSubmit={handleSubmit}>...</form>;
};
```

### startup/

**Purpose:** Application bootstrap and initialization

- **Frontend:** Root component mounting, provider setup
- **Backend:** Server initialization, middleware setup, queue workers, scheduler services
- **Package:** CLI initialization logic
- **CAN** import from ALL folders (special bootstrap privilege)
- **Typically imports:**
    - flows/ (to set up routes/commands)
    - state/ (to initialize stores/pools/caches)
    - adapters/ (to configure external services)
    - bindings/ (to set up watchers/providers)
    - brokers/ (to run health checks/warm caches)
    - responders/ (to register queue processors and scheduled tasks)
- **Should** handle graceful shutdown and cleanup
- **Note on Queue/Scheduler processes:**
    - Queue workers are separate startup entries (e.g., startup/queue-worker.ts)
    - Scheduler services are separate startup entries (e.g., startup/scheduler-service.ts)
    - These are launched by OS/orchestrator as independent processes
    - They import responders that handle queue/time events instead of HTTP
- **Note on static configuration:**
    - Static config constants can live directly in startup/
    - Environment variable loading happens here
    - Config transformation can use transformers/

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/app.tsx`
- **Backend:** `index.js` → imports from `startup/server.ts`
- **Package:** `bin/cli.js` → imports from `startup/cli.ts`

The thin entry files just point to startup/ where the real initialization lives.

## Import Hierarchy (What Each Layer Can Import)

### With UI (Frontend, Backend with views, CLI with displays)

```
startup/ (bootstrap entry point)
  ├─→ flows/ (sets up routes)
  ├─→ state/ (initializes stores/pools)
  ├─→ adapters/ (configures services)
  ├─→ bindings/ (sets up providers/watchers)
  └─→ brokers/ (health checks/warm-up)

flows/
  └─→ responders/ (ONLY)

responders/
  ├─→ widgets/
  ├─→ triggers/
  ├─→ brokers/
  ├─→ bindings/
  ├─→ transformers/
  └─→ state/

widgets/
  ├─→ bindings/ (render phase only)
  ├─→ triggers/ (event handlers only)
  ├─→ transformers/ (for formatting display)
  └─→ state/

bindings/
  ├─→ brokers/
  └─→ state/

triggers/
  └─→ brokers/ (orchestrates multiple)

brokers/
  └─→ adapters/

adapters/
  └─→ node_modules (external packages)

state/ (pure storage - no imports except types/errors)
schemas/ (validation logic - imports types/errors only)
transformers/ (pure functions - imports types only)
assets/ (static files - no executable code)
migrations/ (version upgrades - imports types/schemas/transformers)
types/ (pure types - no imports)
errors/ (error classes - imports types only)
```

### Without UI (Library packages, headless CLIs)

```
startup/ (bootstrap entry point)
  ├─→ flows/ (sets up commands/entries)
  ├─→ state/ (initializes config)
  ├─→ adapters/ (configures services)
  └─→ brokers/ (initial setup)

flows/ (entries or commands)
  └─→ responders/ (command handlers, API functions)

responders/
  ├─→ triggers/
  ├─→ brokers/
  └─→ state/

triggers/
  └─→ brokers/ (orchestrates multiple)

brokers/
  └─→ adapters/

adapters/
  └─→ node_modules (external packages)

state/ (pure storage - no imports except types/errors)
schemas/ (validation logic - imports types/errors only)
transformers/ (pure functions - imports types only)
assets/ (static files - no executable code)
migrations/ (version upgrades - imports types/schemas/transformers)
types/ (pure types - no imports)
errors/ (error classes - imports types only)
```

**Key Rules:**

1. Dependencies flow upward only (no circular imports)
2. adapters/ is the ONLY place to import node_modules (except direct-source)
3. brokers/ are atomic operations - single responsibility per broker
4. bindings/ are React hooks for data binding (render phase only)
5. triggers/ are pure async functions for orchestration (event handlers)
6. state/ is pure data storage - no side effects or external calls
7. widgets/ use bindings in render, triggers in event handlers
8. responders/ can call bindings, triggers, or brokers based on need

## Term Definitions

### Universal Terms (All Project Types)

- **types/** - Data shapes and type definitions
  ```
  user-type/
    user-type.ts
    user-type.test.ts
  api-response-type/
    api-response-type.ts
    api-response-type.test.ts
  config-type/
    config-type.ts
    config-type.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // types/user-type/user-type.ts
  export interface UserType {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    createdAt: Date;
  }
  ```

- **schemas/** - Runtime validation and data parsing
  ```
  user-schema/
    user-schema.ts
    user-schema.test.ts
  email-schema/
    email-schema.ts
    email-schema.test.ts
  config-schema/
    config-schema.ts
    config-schema.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // schemas/user-schema/user-schema.ts
  import { z } from 'zod';
  import { UserType } from '../../types/user-type/user-type';

  export const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    role: z.enum(['admin', 'user', 'guest']),
    createdAt: z.date()
  }) satisfies z.ZodType<UserType>;

  export const parseUser = (data: unknown): UserType => {
    return userSchema.parse(data);
  };

  export const isValidEmail = (email: string): boolean => {
    return z.string().email().safeParse(email).success;
  };
  ```

- **transformers/** - Pure data transformation functions
  ```
  format-date/
    format-date.ts
    format-date.test.ts
  format-currency/
    format-currency.ts
    format-currency.test.ts
  user-to-dto/
    user-to-dto.ts
    user-to-dto.test.ts
  api-response-mapper/
    api-response-mapper.ts
    api-response-mapper.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // transformers/format-date/format-date.ts
  export const formatDate = (date: Date, format: string = 'MM/DD/YYYY'): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return format
      .replace('MM', month)
      .replace('DD', day)
      .replace('YYYY', String(year));
  };

  // transformers/user-to-dto/user-to-dto.ts
  import { UserType } from '../../types/user-type/user-type';
  import { UserDTOType } from '../../types/user-dto-type/user-dto-type';

  export const userToDTO = (user: UserType): UserDTOType => {
    return {
      id: user.id,
      displayName: user.name,
      emailAddress: user.email,
      accountRole: user.role,
      joinDate: user.createdAt.toISOString()
    };
  };
  ```

- **errors/** - Error classes and exception handling
  ```
  validation-error/
    validation-error.ts
    validation-error.test.ts
  network-error/
    network-error.ts
    network-error.test.ts
  auth-error/
    auth-error.ts
    auth-error.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // errors/validation-error/validation-error.ts
  export class ValidationError extends Error {
    constructor(
      message: string,
      public field?: string,
      public value?: unknown
    ) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  ```

- **flows/** - Routing and navigation logic
  ```
  user-flow/
    user-flow.ts                // /users/:id route handling
    user-flow.test.ts
  checkout-flow/
    checkout-flow.ts            // /checkout route handling
    checkout-flow.test.ts
  admin-flow/
    admin-flow.ts               // /admin/* route handling
    admin-flow.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // flows/user-flow/user-flow.tsx
  import { Route } from 'react-router-dom';
  import { UserProfileResponder } from '../../responders/user-profile/user-profile';
  import { UserSettingsResponder } from '../../responders/user-settings/user-settings';

  export const UserFlow = (
    <Route path="/users">
      <Route path=":id" element={<UserProfileResponder />} />
      <Route path=":id/settings" element={<UserSettingsResponder />} />
    </Route>
  );
  ```

- **adapters/** - External library wrappers (third-party integrations)
  ```
  axios/
    get/
      get.ts                    // Wraps axios.get
      get.test.ts
    post/
      post.ts                   // Wraps axios.post
      post.test.ts
  mongoose/
    connect/
      connect.ts                // Wraps mongoose.connect
      connect.test.ts
    find/
      find.ts                   // Wraps Model.find
      find.test.ts
  ```

- **bindings/** - Reactive data connections (React hooks with lifecycle)

  **CRITICAL FOR FRONTEND:** Bindings vs Triggers usage:
    - **Bindings** = React hooks with useEffect for data binding (render phase only)
    - **Triggers** = Pure async functions for orchestration (event handlers)

  ```jsx
  // widgets/user-dashboard/user-dashboard.tsx
  export const UserDashboard = () => {
    // ✅ BINDINGS in render phase
    const userData = useUserData(userId);        // bindings/use-user-data/
    const cartItems = useCartItems();            // bindings/use-cart-items/

    const handleCheckout = async () => {
      // ✅ TRIGGERS in event handlers
      await checkoutFlow(cartItems);             // triggers/checkout-flow/
      // ❌ const data = useUserData();          // ERROR! Can't call bindings here
    };

    return <button onClick={handleCheckout}>Checkout</button>;
  };
  ```

- **triggers/** - Pure orchestration workflows (no React lifecycle)

  **Universal orchestration logic:**
    - Frontend: Async functions for event handlers
    - Backend: Workflow procedures
    - Package: Exportable orchestration logic

  ```
  triggers/
    user-registration-flow/
      user-registration-flow.ts  // Validates, creates, emails
    checkout-flow/
      checkout-flow.ts           // Inventory, payment, confirmation
  ```

- **brokers/** - Atomic external operations

  **IMPORTANT FOR LLMs:** Brokers wrap single external operations. When implementing features:
    - Never call adapters directly from business logic
    - Create a broker that orchestrates the adapter calls
    - Brokers handle retries, error transformation, and data mapping
    - Think of brokers as "internal APIs" that hide external complexity

  ```
  user-fetch/
    user-fetch.ts               // Uses adapters/axios to fetch user data
    user-fetch.test.ts
  user-update/
    user-update.ts              // Orchestrates user update via adapters
    user-update.test.ts
  email-send/
    email-send.ts               // Uses adapters/sendgrid to send emails
    email-send.test.ts
  sms-send/
    sms-send.ts                 // Uses adapters/twilio to send SMS
    sms-send.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // brokers/user-fetch/user-fetch.ts
  import { get } from '../../adapters/axios/get/get';
  import { UserNotFoundError } from '../../errors/user-not-found-error/user-not-found-error';

  export const userFetch = async (userId: string) => {
    try {
      const response = await get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        throw new UserNotFoundError(userId);
      }
      throw error;
    }
  };
  ```

- **state/** - Stateful logic (caches, pools, stores, configuration)
  ```
  user-cache/
    user-cache.ts               // In-memory user cache
    user-cache.test.ts
  db-pool/
    db-pool.ts                  // Database connection pool
    db-pool.test.ts
  app-config/
    app-config.ts               // Application configuration state
    app-config.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // state/user-cache/user-cache.ts
  const cache = new Map<string, UserType>();
  const TTL = 5 * 60 * 1000; // 5 minutes

  export const getUserFromCache = (id: string): UserType | undefined => {
    return cache.get(id);
  };

  export const setUserInCache = (id: string, user: UserType): void => {
    cache.set(id, user);
    setTimeout(() => cache.delete(id), TTL);
  };
  ```

- **responders/** - Route handlers that respond to flows
  ```
  user-profile-page/
    user-profile-page.tsx       // Frontend page responder
    user-profile-page.test.tsx
  user-get-controller/
    user-get-controller.ts      // Backend controller responder
    user-get-controller.test.ts
  ```

  **Example Implementation:**
  ```typescript
  // responders/user-profile-page/user-profile-page.tsx
  export const UserProfilePage = () => {
    const { userId } = useParams();
    const userData = useUserData(userId);  // bindings/

    const handleEdit = async () => {
      await userUpdateFlow(userData);  // triggers/
    };

    return (
      <ProfileLayout>
        <ProfileHeader user={userData} />
        <ProfileContent user={userData} onEdit={handleEdit} />
      </ProfileLayout>
    );
  };
  ```

- **startup/** - Application bootstrap and initialization
  ```
  startup/
    app.tsx                     // Frontend app bootstrap
    server.ts                   // Backend server initialization
    cli.ts                      // CLI entry point
  ```

  **Example Implementation:**
  ```typescript
  // startup/app.tsx
  import { createRoot } from 'react-dom/client';
  import { BrowserRouter } from 'react-router-dom';
  import { AppRoutes } from '../flows/app-routes/app-routes';
  import { initializeStores } from '../state/app-store/app-store';
  import { setApiConfig } from '../state/api-config/api-config';
  import { UserProvider } from '../bindings/use-user-context/use-user-context';

  export const startApp = async () => {
    // Initialize state
    await initializeStores();

    // Configure API state
    await setApiConfig({ baseURL: process.env.API_URL });

    // Mount app with providers and flows
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    );
  };

  // Called from index.tsx
  startApp();
  ```

- **widgets/** - Display and view components (UI building blocks)
  ```
  user-card/
    user-card.tsx               // User profile display component
    user-card.test.tsx
    avatar.tsx                  // Sub-component for user avatar
    status-badge.tsx            // Sub-component for status indicator
  login-form/
    login-form.tsx              // Login form component
    login-form.test.tsx
    password-field.tsx          // Sub-component for password input
  checkout-summary/
    checkout-summary.tsx        // Order summary display
    checkout-summary.test.tsx
    line-item.tsx               // Sub-component for individual items
    total-section.tsx           // Sub-component for totals
  ```

  **Example Implementation:**
  ```typescript
  // widgets/user-card/user-card.tsx
  import { useState } from 'react';
  import { useUserActions } from '../../bindings/use-user-actions/use-user-actions';

  export const UserCard = ({ userId }: { userId: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);  // Local UI state
    const { followUser, unfollowUser } = useUserActions();  // bindings/

    const handleFollow = async () => {
      await followUser(userId);  // Triggers in event handler
    };

    return (
      <div className="user-card">
        <Avatar userId={userId} />
        <StatusBadge userId={userId} />
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Less' : 'More'}
        </button>
        <button onClick={handleFollow}>Follow</button>
      </div>
    );
  };
  ```

## Important Note on Code Organization

**EVERY piece of code MUST fit into our existing universal terms.** There are no exceptions:

- No "utils/" folder - utility functions go in **transformers/** (pure functions) or **adapters/** (external wrappers)
- No "core/" folder - domain logic goes in **triggers/** (orchestration), **transformers/** (computation), or **brokers/
  ** (external ops)
- No "helpers/" folder - same as utils
- No "lib/" folder - same as utils
- No "common/" folder - distribute to appropriate categories
- No "shared/" folder - distribute to appropriate categories

If code doesn't seem to fit any category, that means you need to:

1. Break it down further into smaller, single-purpose functions
2. Reconsider what the code is actually doing (transforming? orchestrating? wrapping?)
3. Question if the code is necessary at all

**The universal terms are exhaustive** - they cover every possible type of code:

- Pure functions → **transformers/** or **schemas/**
- External integrations → **adapters/** and **brokers/**
- Orchestration → **triggers/**
- UI → **widgets/**
- Route handling → **responders/**
- Data storage → **state/**
- Static resources → **assets/**
- Version upgrades → **migrations/**

## Open Questions

1. **Data Access Layer** - What to call the layer between actions and adapters for data operations
2. **Backend Processing Components** - Whether backend needs a term for reusable processing pieces
3. **Mapping Tech-Specific Concepts** - How backend/package-specific folders relate to universal terms

## Usage Guidelines

- Use universal terms wherever possible across all project types
- Only use tech-specific folders when the concept doesn't exist in other stacks
- Maintain consistency: same term should mean the same thing across projects