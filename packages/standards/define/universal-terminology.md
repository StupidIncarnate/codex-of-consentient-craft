# Universal Terminology Standards

This document defines the approved folder structure terminology that works across all project types (frontend, backend,
and npm package types).

## Why????

LLM does not know where to put code, so it squirrels it away where ever its' semantic linking tells it best at that
point in time. Utils is immensely problematic from an organizational perspective. The only way to get LLM to organize
effectively is to force it into a dictated structure, and if we have to do this across multiple tech type projects, or a
monorepo with multiple types in it, we need consistent terminology.

Then we enforce it with lint, and then maybe, the eye-twitching will cease.

## Approved Universal Terminology

**IMPORTANT:** This mapping table serves as a translation guide from problematic traditional terms to our universal
terms.

**Why We Show Forbidden Patterns:** The table below intentionally includes forbidden folder names (like "utils/", "
lib/", etc.) to help LLMs and developers understand:

1. What traditional patterns they might be looking for
2. Where that functionality belongs in our universal structure
3. Why certain terms are problematic (they cause LLMs to "squirrel away" code incorrectly)

**How to Read This Table:**

- **Column 1 (Our Term):** The ONLY allowed folder name for this concept
- **Columns 2-5:** Traditional names developers use that we've REPLACED with our universal term
- **Red Flag Terms:** utils/, lib/, helpers/, common/ are ALL FORBIDDEN - use our universal terms instead

The traditional names shown are what you'll find in other codebases, NOT what's allowed here. When an LLM or developer
thinks "I need a utils folder", this table shows them to use "adapters/" or "transformers/" instead based on the actual
purpose.

| Our Term         | Frontend                                 | Backend                                      | Library Package         | CLI Package                   |
|------------------|------------------------------------------|----------------------------------------------|-------------------------|-------------------------------|
| **contracts**    | types/, interfaces/, validators/, forms/ | types/, models/, validators/, dto/           | types/, validators/     | types/, validators/, parsers/ |
| **transformers** | formatters/, serializers/                | mappers/, converters/                        | transformers/           | formatters/, processors/      |
| **errors**       | errors/                                  | errors/, exceptions/                         | errors/                 | errors/                       |
| **flows**        | routes/                                  | routes/, endpoints/                          | entries/                | commands/                     |
| **adapters**     | services/, lib/, utils/                  | services/, lib/, utils/                      | services/, lib/, utils/ | services/, lib/, utils/       |
| **middleware**   | telemetry/, instrumentation/             | telemetry/, instrumentation/, observability/ | -                       | telemetry/, instrumentation/  |
| **brokers**      | api/, repositories/, notifications/,     | repositories/, gateways/, notifications/,    | client/, sdk/,          | prompts/, fs-operations/,     |
|                  | actions/, operations/                    | procedures/, workflows/                      | procedures/, workflows/ | handlers/, processors/        |
| **bindings**     | hooks/ (React hooks)                     | listeners/, subscribers/                     | -                       | watchers/, listeners/         |
| **state**        | contexts/, stores/                       | cache/, session/, memory/                    | config/                 | config/, session/             |
| **responders**   | pages/                                   | controllers/, queue-processors/, schedulers/ | -                       | handlers/ (command handlers)  |
| **widgets**      | components/, forms/, modals/, layouts/   | views/, templates/, partials/                | -                       | displays/, output/            |
| **startup**      | index.tsx, app.tsx                       | index.ts, server.ts, workers/, jobs/         | -                       | bin/, cli.ts                  |

### Why reinvent the wheel on terminology?

Various terms in the above matrix have very loaded connotation which short-circuits LLM the most. Utils being one of
them, and "types" being another - LLMs immediately assume types/ is where all types go, ignoring validation logic
elsewhere.
By MOSTLY deviating from industry-standard terms, while also finding common-ground across tech architecture, we
can force LLM out of its trained responses, and get more determinist results from it.

**Why "contracts" instead of types/schemas?** The term "contracts" prevents LLMs from semantic short-circuiting. When
LLMs
see separate types/ and schemas/ folders, they often put types in types/ and forget about schemas/. By using "
contracts",
we force consideration of both data shape AND validation as a single concern - a contract defines what data must look
like,
whether that's just a TypeScript interface or a full Zod schema with runtime validation.

If someone is lost in a forest and has a map, they're more likely to just follow the map then trudge through the forest
blindly.
LLM is the same. By divorcing them from comfortable, trained-on terminology, they will more likely organize code based
on this doc rather than "confidence score" when listing files in project and making determinations from that.

## Import Whitelist Configuration

The `.importwhitelist.json` file controls which packages can be imported outside of adapters/. This provides centralized
control over external dependencies and makes the rules lintable via ESLint.

**Whitelist Criteria - Packages should be whitelisted when they are:**

1. **Pure computation functions** (lodash, ramda, date-fns)
2. **Type definitions** (@types/*)
3. **Validation schemas** (zod - for contracts/)
4. **Framework core** (react, express - limited to specific folders)
5. **Testing utilities** (jest, vitest, @testing-library/*)
6. **Build/compile time only** (typescript, webpack)

**Require Adapters - Packages need adapters when they:**

1. **Make network calls** (axios, fetch, request)
2. **Access databases** (mongoose, prisma, redis)
3. **Touch file system** (fs, fs-extra)
4. **Have state/configuration** (winston, morgan)
5. **Need project-specific setup** (bcrypt rounds, jwt secrets)
6. **Interface with external services** (stripe, twilio, aws-sdk)
7. **Could change behavior between environments** (email senders, payment processors)

**Example Configuration:**

```json
{
  "zod": ["contracts/**/*.ts"],
  "@types/*": ["contracts/**/*.ts"],
  "lodash": "any",
  "date-fns": "any",
  "uuid": "any",
  "react": ["widgets/**/*.tsx", "responders/**/*.tsx", "bindings/**/*.ts", "startup/**/*.tsx"],
  "react-dom": ["startup/**/*.tsx"],
  "react-router-dom": ["flows/**/*.tsx", "startup/**/*.tsx"],
  "styled-components": ["widgets/**/*.styles.tsx"],
  "@emotion/styled": ["widgets/**/*.styles.tsx"],
  "express": ["flows/**/*.ts", "startup/**/*.ts"],
  "@testing-library/*": ["**/*.test.ts", "**/*.test.tsx"],
  "jest": ["**/*.test.ts", "**/*.test.tsx", "jest.*.ts"],
  "vitest": ["**/*.test.ts", "**/*.test.tsx", "vitest.*.ts"]
}
```

**Configuration Values:**

- `["glob1", "glob2"]` - Package can only be imported in files matching these globs
- `"any"` - Package can be imported anywhere
- Not listed - Package can ONLY be imported in adapters/

**Common Patterns:**

- `"contracts/**/*.ts"` - Any file in contracts folder
- `"widgets/**/*.styles.tsx"` - Only style files in widgets
- `"**/*.test.ts"` - Only test files
- `"startup/**/index.ts"` - Only index files in startup

**Note:** Node.js built-ins (fs, path, crypto, etc.) are treated like any other external dependency - if not in the
whitelist, they must be wrapped in adapters/. This ensures consistent abstraction and testability.

**Enforcement:**

- ESLint rules enforce this configuration
- Any package not in the whitelist must be wrapped in adapters/
- This eliminates debates about what constitutes a "utility" library

## Critical Architecture Distinction: Adapters vs Brokers

**This is the most important distinction to understand for LLMs coding in this framework:**

### Adapters Layer (Configuration & Policy)

- **Purpose:** Add project-wide policies to external packages
- **Knowledge:** Knows NOTHING about business logic, endpoints, or domain
- **Examples of what adapters add:**
    - Authentication headers to all HTTP requests
    - Timeout and retry policies
    - Connection pooling
    - Error standardization
    - Audit logging
    - Rate limiting
- **Example:** `adapters/axios/get/get.ts` adds auth cookie and timeout to ANY HTTP GET

### Brokers Layer (Business Operations)

- **Purpose:** Implement specific business operations using configured adapters, or orchestrate other brokers
- **Knowledge:** Knows specific endpoints, database tables, queue names, and business workflows
- **Can be either:**
    - **Atomic brokers:** Single operations (call API, query DB, send notification)
    - **Orchestration brokers:** Coordinate multiple brokers for complex workflows
- **Examples of what brokers do:**
    - Call specific API endpoints
    - Transform external data to domain objects
    - Handle business-specific errors
    - Implement domain validation
    - Orchestrate multiple operations in sequence
- **Example:** `brokers/user/fetch/fetch.ts` calls `/api/v1/users/:id` endpoint using configured axios
- **Example:** `brokers/user/registration/registration.ts` orchestrates user creation, team setup, and email sending

### The Flow:
```
External Package → ADAPTER → BROKER → Business Logic
     (npm)       (configure) (specify)  (orchestrate)

Example:
    axios     →  adds auth  → calls API  → user registration
              →  adds retry → endpoint   → process
```

### Key Decision Points for LLMs:

**When you need to make an external call:**

1. **Check if adapter exists:** `ls src/adapters/[package-name]/`
2. **If no adapter exists:**
    - First usage? → Import package directly in your broker
    - Lint error about duplicate? → Create adapter and refactor all usages
3. **Whitelisted packages:** Can be imported directly in specified folders (see `.importwhitelist.json`)
4. **Create/use broker:** Never call adapters from business logic directly

**What goes where:**

- **Adapter:** "I need HTTP POST with auth headers" → `adapters/axios/post/post.ts`
- **Atomic Broker:** "I need to create a user via API" → `brokers/user/create/create.ts`
- **Orchestration Broker:** "I need to create user AND send email" → `brokers/user/registration/registration.ts`

## Import Hierarchy (What Each Layer Can Import)

**Why Two Different Hierarchies?**
Projects with UI elements (whether React components, server-rendered views, or CLI terminal interfaces) need additional
layers for display logic. Projects without any UI (pure APIs, headless services) don't have these layers. The import
rules reflect what actually exists in each type of project.

### With UI (Frontend web apps, Backend with server-rendered views, Interactive CLIs)

**When to use this hierarchy:**

- Frontend: React/Vue/Angular apps with components
- Backend: Server-side rendered views (EJS, Handlebars)
- CLI: Interactive terminals with tables, progress bars, prompts (blessed, ink, inquirer)

```
startup/ (bootstrap entry point)
  ├─→ flows/ (sets up routes)
  ├─→ state/ (initializes stores/pools)
  ├─→ middleware/ (configures infrastructure bundles)
  ├─→ bindings/ (sets up providers/watchers)
  └─→ brokers/ (health checks/warm-up)

flows/
  └─→ responders/ (ONLY)

responders/
  ├─→ widgets/
  ├─→ brokers/
  ├─→ bindings/
  ├─→ transformers/
  ├─→ state/
  ├─→ contracts/
  └─→ errors/

widgets/
  ├─→ bindings/ (render phase only)
  ├─→ brokers/ (event handlers only)
  ├─→ transformers/ (for formatting display)
  ├─→ state/
  ├─→ contracts/
  └─→ errors/

bindings/
  ├─→ brokers/
  ├─→ state/
  ├─→ contracts/
  └─→ errors/

brokers/
  ├─→ brokers/ (orchestration can call other brokers)
  ├─→ adapters/
  ├─→ contracts/
  └─→ errors/

middleware/
  ├─→ adapters/ (combines multiple adapters)
  └─→ middleware/ (can use other middleware)

adapters/
  ├─→ node_modules (external packages)
  └─→ middleware/ (ONLY when required by couplings config - e.g., HTTP adapters must call telemetry)

transformers/
  ├─→ contracts/
  └─→ errors/

state/ (pure storage - imports contracts/ and errors/ only)
contracts/ (data contracts - imports errors only)
transformers/ (pure functions - imports contracts/ and errors/)
assets/ (static files - no executable code)
migrations/ (version upgrades - imports contracts/transformers)
errors/ (error classes - no imports, foundational layer)
```

### Without UI (Pure APIs, Library packages, Headless services)

**When to use this hierarchy:**

- Backend: REST/GraphQL APIs that only return JSON
- Libraries: NPM packages that export functions
- Services: Queue processors, data pipelines, cron jobs
- CLI: Non-interactive scripts that just run and exit

**Key difference:** No widgets/ layer (nothing to display) and potentially no bindings/ (no reactive UI)

```
startup/ (bootstrap entry point)
  ├─→ flows/ (sets up commands/entries)
  ├─→ state/ (initializes config)
  ├─→ middleware/ (configures infrastructure bundles)
  └─→ brokers/ (initial setup)

flows/ (entries or commands)
  └─→ responders/ (command handlers, API functions)

responders/
  ├─→ brokers/
  ├─→ transformers/
  ├─→ state/
  ├─→ contracts/
  └─→ errors/

brokers/
  ├─→ brokers/ (orchestration can call other brokers)
  ├─→ adapters/
  ├─→ contracts/
  └─→ errors/

middleware/
  ├─→ adapters/ (combines multiple adapters)
  └─→ middleware/ (can use other middleware)

adapters/
  ├─→ node_modules (external packages)
  └─→ middleware/ (ONLY when required by couplings config - e.g., HTTP adapters must call telemetry)

transformers/
  ├─→ contracts/
  └─→ errors/

state/ (pure storage - imports contracts/ and errors/ only)
contracts/ (data contracts - imports errors only)
transformers/ (pure functions - imports contracts/ and errors/)
assets/ (static files - no executable code)
migrations/ (version upgrades - imports contracts/transformers)
errors/ (error classes - no imports, foundational layer)
```

**Key Rules:**

1. Dependencies flow upward only (no circular imports)
2. adapters/ is the ONLY place to import node_modules (except direct-source)
3. middleware/ combines multiple adapters for infrastructure concerns only
4. adapters/ can import middleware/ ONLY when required by couplings config (enforces consistent telemetry/logging)
5. brokers/ CANNOT import middleware/ directly - middleware is for adapters only
6. brokers/ can be either atomic operations OR orchestrate other brokers
7. bindings/ are React hooks for data binding (render phase only)
8. state/ is pure data storage - no side effects or external calls
9. widgets/ use bindings in render, brokers in event handlers
10. responders/ can call bindings or brokers based on need

## Universal Terms - Definitions, Constraints, and Examples

### contracts/

**Purpose:** Complete data contract enforcement - defining, validating, and enforcing data agreements

**Folder Structure:**

```
contracts/
  user-contract/
    user-contract.ts
    user-contract.test.ts
  stripe-webhook-contract/
    stripe-webhook-contract.ts
    stripe-webhook-contract.test.ts
  email-validation/
    email-validation.ts
    email-validation.test.ts
  has-permission/
    has-permission.ts
    has-permission.test.ts
```

**Constraints:**

- **CAN** export pure TypeScript types/interfaces (for external APIs, library types)
- **CAN** export validation schemas (Zod) with inferred types
- **CAN** export pure functions that return booleans (validation, type guards, checks)
- **RULE:** If a pure function returns a boolean, it MUST be in contracts/ (not transformers/ or elsewhere)
- **Must** have explicit return types on all exported functions (for linting)
- **Should** prefer validation schemas when data comes from external sources
- **CAN** import from errors/ only

**Export Naming Conventions:**

- **Types/Interfaces:** PascalCase (e.g., `User`, `StripeWebhookEvent`)
- **Enums:** SCREAMING_SNAKE_CASE (e.g., `USER_ROLE`, `STATUS_CODE`)
- **Schemas:** Must end with `Contract` (e.g., `userContract`, `emailContract`, `configContract`)
- **Boolean functions:** Must start with:
    - `is` - type checks/guards (e.g., `isValidEmail`, `isEslintMessage`, `isAuthenticated`)
    - `has` - existence/possession checks (e.g., `hasPermission`, `hasAccess`, `hasFeature`)
    - `can` - capability/permission checks (e.g., `canEdit`, `canDelete`, `canPublish`)
    - `should` - conditional logic checks (e.g., `shouldRetry`, `shouldCache`, `shouldNotify`)
    - `will` - future state checks (e.g., `willExpire`, `willTimeout`, `willConflict`)
    - `was` - past state checks (e.g., `wasModified`, `wasDeleted`, `wasCached`)
- **Parse functions:** Must start with `parse` (e.g., `parseUser`, `parseConfig`)
- **Validate functions:** Must start with `validate` (e.g., `validateEmail`, `validatePhone`)

**Key Rules:**

- All pure functions that return booleans MUST go in contracts/, not in transformers/ or elsewhere
- **Exception for Parse Functions:** Parse functions (e.g., `parseUser`) are the ONLY non-boolean functions allowed in
  contracts/
    - Why: They enforce contracts by validating AND transforming in one atomic operation
    - They throw validation errors on invalid data (contract enforcement)
    - They return typed, validated data on success (transformation is secondary to validation)
    - Splitting parse into validate (contracts/) + transform (transformers/) would duplicate validation logic

**CRITICAL Distinction - Pure vs External Boolean Functions:**

- **contracts/** = Boolean functions determinable from input alone (in-memory computation)
    - `isValidEmail({email})` - regex check ✅
    - `hasPermission({user, action})` - checking user object ✅
    - `isExpired({date})` - date comparison ✅
- **brokers/** = Boolean functions requiring external systems (even if returning boolean!)
    - `userExists({email})` - database query ❌ (goes in brokers/)
    - `isTokenBlacklisted({token})` - redis check ❌ (goes in brokers/)
    - `isEmailDeliverable({email})` - external API check ❌ (goes in brokers/)

The key is NOT the return type, but whether the function needs external resources. If it needs database, redis, API
calls, file system, etc., it's a broker, not a contract.

**Acknowledging the Parse Function Exception:**
Yes, parse functions (like `zod.parse()`) return non-boolean values, which technically breaks our "contracts are for
booleans" rule. This is a deliberate exception because:

1. **Zod schemas inherently combine validation + transformation** - Separating them is artificial
2. **The transformation is inseparable from validation** - You can't validate without parsing
3. **TypeScript type inference depends on this** - `z.infer<typeof contract>` needs the schema
4. **Splitting would create worse problems:**
    - Duplicate validation logic
    - Loss of type safety
    - Increased complexity for no benefit

So yes, parse functions are an exception to our rules, but it's a principled exception based on how validation libraries
actually work.

**Example Implementations:**

```typescript
// contracts/user-contract/user-contract.ts
import { z } from 'zod';

export const userContract = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.date()
});

export type User = z.infer<typeof userContract>;

// contracts/validate-user/validate-user.ts
export const validateUser = ({data}: { data: unknown }): User => userContract.parse(data);

// contracts/stripe-webhook-contract/stripe-webhook-contract.ts
// Pure type for external API we don't validate
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

// contracts/has-permission/has-permission.ts
import { User } from '../user-contract/user-contract';

export const hasPermission = ({user, action}: {user: User; action: string}): boolean => {
  return user.permissions.includes(action);
};

// contracts/is-valid-email/is-valid-email.ts
export const isValidEmail = ({email}: {email: string}): boolean => {
  return z.string().email().safeParse(email).success;
};
```

### transformers/

**Purpose:** Pure data transformation functions (non-boolean returns only)

**Folder Structure:**

```
transformers/
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

**Constraints:**

- **Must** be pure functions (no side effects)
- **Must** return non-boolean values
- **Must** have explicit return types on all exported functions (for linting)
- **CAN** import from contracts/ and errors/
- **Export naming:** camelCase functions describing the transformation

**Key Rule:** If it's a pure function returning non-boolean, it belongs here

**Example Implementations:**

```typescript
// transformers/format-date/format-date.ts
export const formatDate = ({date, format = 'MM/DD/YYYY'}: {date: Date; format?: string}): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('YYYY', String(year));
};

// transformers/user-to-dto/user-to-dto.ts
import { User } from '../../contracts/user-contract/user-contract';
import { UserDTO } from '../../contracts/user-dto-contract/user-dto-contract';

export const userToDTO = ({user}: {user: User}): UserDTO => {
  return {
    id: user.id,
    displayName: user.name,
    emailAddress: user.email,
    accountRole: user.role,
    joinDate: user.createdAt.toISOString()
  };
};
```

**IMPORTANT:** Pure functions that return booleans go in contracts/, not here
**NOTE:** Parse functions are the exception - they live in contracts/ despite returning non-boolean values

### errors/

**Purpose:** Error classes and exception handling

**Folder Structure:**

```
errors/
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

**Constraints:**

- **Must** extend Error class
- **Export naming:** Must end with `Error` (e.g., `ValidationError`, `NetworkError`)
- **Must** have `message` property
- **Must NOT** import from contracts/ (one-way dependency: contracts can import errors, not vice versa)
- **Rationale:** Errors are foundational - contracts use them for validation/guards, but errors should be self-contained

**Example Implementation:**

```typescript
// errors/validation-error/validation-error.ts
export class ValidationError extends Error {
    public constructor({
    message,
    field,
    value
  }: {
    message: string;
    field?: string;
    value?: unknown;
  }) {
    super(message);
    this.field = field;
    this.value = value;
    this.name = 'ValidationError';
  }
}
```

### flows/

**Purpose:** Route definitions and entry points

**Folder Structure:**

```
flows/
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

**Constraints:**

- **Frontend:** Must import react-router-dom, must use Route/Routes
- **Backend:** Must import express.Router, must call .get()/.post()/.put()/.delete()
- **Package:** Entry files that compose and export public API
- **CAN ONLY** import from: responders/ (flows only go to responders)
- **Must** define paths/routes as constants
- **Export naming:** Must end with `Flow` (e.g., `userFlow`, `checkoutFlow`, `adminFlow`)

**Example Implementations:**

```typescript
// flows/user-flow/user-flow.tsx (Frontend)
import { Route } from 'react-router-dom';
import { UserProfileResponder } from '../../responders/user-profile/user-profile';
import { UserSettingsResponder } from '../../responders/user-settings/user-settings';

export const UserFlow = (
  <Route path="/users">
    <Route path=":id" element={<UserProfileResponder />} />
    <Route path=":id/settings" element={<UserSettingsResponder />} />
  </Route>
);

// flows/comment-flow/comment-flow.ts (Backend)
import { Router } from 'express';
import { createController } from '../../responders/comment-create-controller/comment-create-controller';
import { updateController } from '../../responders/comment-update-controller/comment-update-controller';
import { deleteController } from '../../responders/comment-delete-controller/comment-delete-controller';
import { getByPostController } from '../../responders/comments-get-by-post-controller/comments-get-by-post-controller';
import { moderateController } from '../../responders/comment-moderate-controller/comment-moderate-controller';

const router = Router();

// Define routes - flows adapt Express (req, res) to responder object arguments
router.post('/posts/:postId/comments', async (req, res, next) => {
  try {
    await createResponder({ req, res });
  } catch (error) {
    next(error);
  }
});

router.put('/comments/:id', async (req, res, next) => {
  try {
    await updateResponder({ req, res });
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:id', async (req, res, next) => {
  try {
    await deleteResponder({ req, res });
  } catch (error) {
    next(error);
  }
});

router.get('/posts/:postId/comments', async (req, res, next) => {
  try {
    await getByPostResponder({ req, res });
  } catch (error) {
    next(error);
  }
});

router.post('/comments/:id/moderate', async (req, res, next) => {
  try {
    await moderateResponder({ req, res });
  } catch (error) {
    next(error);
  }
});

export const commentFlow = router;

// flows/api-flow/api-flow.ts (Backend - composing flows)
import { Router } from 'express';
import { userFlow } from '../user-flow/user-flow';
import { commentFlow } from '../comment-flow/comment-flow';
import { authFlow } from '../auth-flow/auth-flow';

const router = Router();

// Compose all flows into main API - flows adapt Express args to object arguments
router.use('/api/v1', (req, res, next) => userFlow({ req, res, next }));
router.use('/api/v1', (req, res, next) => commentFlow({ req, res, next }));
router.use('/api/v1/auth', (req, res, next) => authFlow({ req, res, next }));

export const apiFlow = router;
```

### adapters/

**Purpose:** Configuration and policy enforcement for external packages

**CRITICAL FOR LLMs:** Adapters are NOT just thin wrappers! They are where you:

- Add project-wide defaults (timeouts, retries, headers)
- Enforce authentication (cookies, tokens, API keys)
- Standardize error handling and transformation
- Add logging, metrics, and audit trails
- Implement circuit breakers and rate limiting
- Add Testing Helpers for a specific package

**Folder Structure:**

```
adapters/
  axios/
    get/
      get.ts                    // Adds auth, retry, timeout to axios.get
      get.test.ts
    post/
      post.ts                   // Adds auth, no-retry to axios.post
      post.test.ts
  mongoose/
    connect/
      connect.ts                // Adds connection pooling, retry logic
      connect.test.ts
    find/
      find.ts                   // Adds query timeout, cursor management
      find.test.ts
  fs/
    write-file/
      write-file.ts             // Adds atomic writes, audit logging
      write-file.test.ts
```

**Constraints:**

- **EVOLUTION RULE:** Adapters are created on-demand when lint detects duplicate package usage:
    - First import of a package in any broker → Direct import allowed
    - Second import of same package → Lint error triggers adapter creation
    - This prevents premature abstraction and ensures adapters are based on real usage patterns
- **Structure:** adapters/[package-name]/[function-name]/[function-name].ts
- **One package per folder:** adapters/axios/\*, adapters/mongoose/\*, etc.
- **One function per file** (different operations may need different policies)
- **Must** add project-specific configuration and policies
- **Must** know NOTHING about business logic (no endpoints, no domain concepts)
- **CAN NOT** import from flows/, widgets/, brokers/, or other business logic
- **Import Whitelist Rule:**
    - Packages in whitelist → Can be imported in their specified folders
    - Packages NOT in whitelist → Can be imported directly UNTIL second usage triggers adapter creation
    - See `.importwhitelist.json` for allowed direct imports

**Example Implementations (showing real value added):**

```typescript
// adapters/axios/get/get.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthToken } from '../../state/auth-state/auth-state';
import { NetworkError } from '../../errors/network-error/network-error';

export const get = async ({url, config}: {url: string; config?: AxiosRequestConfig}): Promise<AxiosResponse> => {
  const token = getAuthToken();

  try {
    const response = await axios.get(url, {
      ...config,
      headers: {
        ...config?.headers,
        'Authorization': token ? `Bearer ${token}` : undefined,
        'X-Request-ID': crypto.randomUUID(),
        'X-Client-Version': process.env.APP_VERSION
      },
      timeout: config?.timeout || 10000, // Default 10s timeout
      withCredentials: true // Always send cookies
    });

    // Log successful external calls for monitoring
    console.log(`[HTTP] GET ${url} - ${response.status}`);

    return response;
  } catch (error) {
    // Standardize error format
    if (axios.isAxiosError(error)) {
      throw new NetworkError({
        message: error.message,
        status: error.response?.status,
        url,
        method: 'GET'
      });
    }
    throw error;
  }
};

// adapters/mongoose/find/find.ts
import { Model, Document, FilterQuery, QueryOptions } from 'mongoose';
import { DatabaseError } from '../../errors/database-error/database-error';

export const find = async <T extends Document>({
  model,
  filter,
  options
}: {
  model: Model<T>;
  filter: FilterQuery<T>;
  options?: QueryOptions<T>;
}): Promise<T[]> => {
  try {
    // Add default timeout to prevent hanging queries
    const queryOptions = {
      maxTimeMS: 5000, // 5 second query timeout
      ...options
    };

    const result = await model.find(filter, null, queryOptions);

    // Log slow queries for optimization
    if (queryOptions.maxTimeMS && result.length > 1000) {
      console.warn(`[DB] Slow query detected: ${model.modelName} returned ${result.length} records`);
    }

    return result;
  } catch (error) {
    throw new DatabaseError({
      message: `Query failed on ${model.modelName}`,
      operation: 'find',
      filter
    });
  }
};

// adapters/fs/write-file/write-file.ts
import { promises as fs } from 'fs';
import * as path from 'path';

export const writeFile = async ({filePath, content, encoding = 'utf8'}: {
  filePath: string;
  content: string | Buffer;
  encoding?: BufferEncoding;
}): Promise<void> => {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Atomic write: write to temp file then rename
  const tempPath = `${filePath}.tmp.${Date.now()}`;

  try {
    await fs.writeFile(tempPath, content, encoding);
    await fs.rename(tempPath, filePath);

    // Audit log all file writes
    console.log(`[FS] Wrote file: ${filePath}`);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {} // Ignore cleanup errors
    throw error;
  }
};

// adapters/bcrypt/hash/hash.ts
import bcrypt from 'bcrypt';
import { WeakPasswordError } from '../../errors/weak-password-error/weak-password-error';

export const hash = async ({password}: {
  password: string;
}): Promise<string> => {
  // Enforce password policy
  if (password.length < 12) {
    throw new WeakPasswordError({
      message: 'Password must be at least 12 characters'
    });
  }

  // Use project-standard rounds (never less than 12)
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const safeRounds = Math.max(12, rounds);

  const hashed = await bcrypt.hash(password, safeRounds);

  // Security audit log
  console.log(`[SECURITY] Password hashed with ${safeRounds} rounds`);

  return hashed;
};
```

**Adapter-Middleware Coupling:**
Adapters can import middleware ONLY when the couplings configuration requires it. This enforces consistent
infrastructure observability across all external operations. For example, if the config says all axios adapters must use
http-telemetry, then they MUST import and call it:

```typescript
// adapters/axios/get/get.ts (with middleware coupling)
import axios from 'axios';
import { httpTelemetry } from '../../../middleware/http-telemetry/http-telemetry';

const start = Date.now();
const response = await axios.get(url);
await httpTelemetry({ method: 'GET', url, statusCode: response.status, duration: Date.now() - start });
```

### middleware/

**Purpose:** Infrastructure orchestration - combining multiple infrastructure adapters into cohesive bundles

**CRITICAL FOR LLMs:** Middleware is NOT for business logic! It's exclusively for infrastructure concerns:

- Combines multiple infrastructure adapters (logging + metrics + tracing)
- Provides pre-configured infrastructure bundles
- Only used when you need coordinated infrastructure functionality
- Examples: HTTP telemetry, error tracking, request tracing

**Folder Structure:**

```
middleware/
  http-telemetry/
    http-telemetry.ts           // Combines logging + metrics for HTTP
    http-telemetry.test.ts
  error-tracking/
    error-tracking.ts           // Combines logging + sentry for errors
    error-tracking.test.ts
  request-tracing/
    request-tracing.ts          // Combines logging + distributed tracing
    request-tracing.test.ts
```

**Constraints:**

- **ONLY** for infrastructure concerns (telemetry, observability, monitoring)
- **NOT** for business logic (user operations, data processing)
- **Structure:** middleware/[infrastructure-concern]/[infrastructure-concern].ts
- **CAN** import from adapters/ and other middleware/
- **CAN** be imported by adapters/ ONLY when required by couplings config
- **CAN NOT** import from brokers/, flows/, widgets/, or any business logic
- **Pattern:** Combines 2+ infrastructure adapters into a cohesive unit

**When to Use Middleware vs Adapters:**

- **Single infrastructure tool** → adapters/ (e.g., adapters/winston/log/)
- **Combined infrastructure** → middleware/ (e.g., middleware/http-telemetry/ uses winston + prometheus)

**Example Implementations:**

```typescript
// middleware/http-telemetry/http-telemetry.ts
import { log } from '../../adapters/winston/log/log';
import { incrementCounter } from '../../adapters/prometheus/increment-counter/increment-counter';
import { recordHistogram } from '../../adapters/prometheus/record-histogram/record-histogram';

export const httpTelemetry = async ({
  method,
  url,
  statusCode,
  duration
}: {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
}): Promise<void> => {
  // Log the request
  await log({
    level: statusCode >= 400 ? 'error' : 'info',
    message: `${method} ${url} - ${statusCode}`,
    metadata: { method, url, statusCode, duration }
  });

  // Record metrics
  await incrementCounter({
    name: 'http_requests_total',
    labels: { method, status: String(statusCode) }
  });

  await recordHistogram({
    name: 'http_request_duration_ms',
    value: duration,
    labels: { method, status: String(statusCode) }
  });
};

// middleware/error-tracking/error-tracking.ts
import { log } from '../../adapters/winston/log/log';
import { captureException } from '../../adapters/sentry/capture-exception/capture-exception';

export const errorTracking = async ({
  error,
  context
}: {
  error: Error;
  context?: Record<string, unknown>;
}): Promise<void> => {
  // Log locally
  await log({
    level: 'error',
    message: error.message,
    metadata: {
      stack: error.stack,
      ...context
    }
  });

  // Send to error tracking service
  await captureException({
    error,
    tags: context
  });
};

// middleware/request-tracing/request-tracing.ts
import { log } from '../../adapters/winston/log/log';
import { startSpan } from '../../adapters/opentelemetry/start-span/start-span';
import { endSpan } from '../../adapters/opentelemetry/end-span/end-span';

export const requestTracing = async ({
  operation,
  metadata,
  fn
}: {
  operation: string;
  metadata?: Record<string, unknown>;
  fn: () => Promise<unknown>;
}): Promise<unknown> => {
  const span = await startSpan({ name: operation, attributes: metadata });

  await log({
    level: 'debug',
    message: `Starting ${operation}`,
    metadata: { traceId: span.traceId, ...metadata }
  });

  try {
    const result = await fn();
    await endSpan({ span, status: 'ok' });
    return result;
  } catch (error) {
    await endSpan({ span, status: 'error', error });
    throw error;
  }
};
```

### brokers/

**Purpose:** Business-specific operations - either atomic operations using configured adapters, or orchestration of
other brokers

**Two Types of Brokers:**

1. **Atomic Brokers:** Single, focused operations
    - Call one API endpoint
    - Execute one database query
    - Send one notification
    - Transform one piece of data
    - Example: `brokers/user/fetch/fetch.ts` - only fetches user data

2. **Orchestration Brokers:** Coordinate multiple brokers for complex workflows
    - Combine multiple atomic operations
    - Implement business processes
    - Handle multi-step workflows
    - Manage transaction-like operations
    - Example: `brokers/user/registration/registration.ts` - creates user + sets up team + sends welcome email

**CRITICAL FOR LLMs:** Brokers are where business logic meets the external world:

- Brokers know about specific API endpoints, database tables, queue names, and workflows
- Brokers use adapters (which provide configured HTTP/DB/etc. operations)
- Brokers transform between external data formats and domain objects
- Think of brokers as your "internal API" - the functions your business logic actually calls
- **Decision:** Single operation? → Atomic broker. Multiple operations? → Orchestration broker

**Adapter Creation Lifecycle:**

The framework uses an evolution-based approach for creating adapters, triggered by lint rules:

```typescript
// Day 1: First usage (direct import allowed)
// brokers/payment/charge/charge.ts
import Stripe from 'stripe';  // ✅ Direct import - first usage
const stripe = new Stripe(process.env.STRIPE_KEY);
await stripe.charges.create({...});

// Day 10: Second usage triggers adapter creation
// brokers/customer/create/create.ts
import Stripe from 'stripe';  // ❌ LINT ERROR!
// "Package 'stripe' imported in multiple brokers:
//   - brokers/payment/charge/charge.ts
//   - brokers/customer/create/create.ts
//  Create adapter at adapters/stripe/"

// LLM creates adapter and refactors BOTH brokers to use it
// adapters/stripe/client/client.ts - handles initialization
// adapters/stripe/charge-create/charge-create.ts
// adapters/stripe/customer-create/customer-create.ts
```

**Benefits of Evolution-Based Adapters:**

1. **No premature abstraction** - Adapters only created when actually needed
2. **Evidence-based design** - LLM has concrete usage examples when creating adapter
3. **Deterministic trigger** - Lint error removes guesswork about when to create adapter
4. **Progressive complexity** - Codebase complexity grows with actual usage patterns

**Folder Structure:**

```
brokers/
  user/
    create/
      create.ts                 // Atomic: creates user via API
      create.test.ts
    fetch/
      fetch.ts                  // Atomic: fetches user data
      fetch.test.ts
    registration/
      registration.ts           // Orchestration: user creation + team setup + email
      registration.test.ts
  email/
    send/
      send.ts                   // Atomic: sends email
      send.test.ts
  comment/
    create/
      create.ts                 // Atomic: creates comment
      create.test.ts
  
  # Infrastructure Brokers
  logger/
    info/
      info.ts                     # Atomic: winston.info
    error/
      error.ts                    # Atomic: winston.error
    warn/
      warn.ts                     # Atomic: winston.warn
    debug/
      debug.ts                    # Atomic: winston.debug

  metrics/
    increment/
      increment.ts                # Atomic: metrics counter
    gauge/
      gauge.ts                    # Atomic: metrics gauge
    histogram/
      histogram.ts                # Atomic: metrics histogram

  auth/
    token-validate/
      token-validate.ts           # Atomic: JWT verify
    token-generate/
      token-generate.ts           # Atomic: JWT sign
    permission-check/
      permission-check.ts         # Atomic: checks user permissions
    auth-flow/
      auth-flow.ts                # Orchestrates: validate + permission + audit
```

**Constraints:**

- **Atomic brokers:** Wrap a single adapter operation with business context
- **Orchestration brokers:** Coordinate multiple other brokers for complex workflows
- **Provides** the internal API that business logic uses for external communication
- **CAN** call other brokers for orchestration (but avoid circular dependencies - A→B→A)
    - Trust LLMs to handle this intelligently in the moment
    - If you're importing broker B from broker A, broker B shouldn't import A back
    - Keep orchestration flowing in one direction: orchestrators call atomic brokers, not vice versa
- **CAN** import from brokers/, adapters/, contracts/, errors/
- **CAN NOT** import from widgets/, flows/, state/, or bindings/
- **Must** handle error cases from adapters and transform them to domain errors
- **Pattern:** brokers/[domain]/[action]/[action].ts
- **Domain Organization:**
    - Maximum nesting: domain/action only (no sub-domains like user/profile/fetch)
    - Actions are atomic operations or orchestrations within a domain
    - Cross-domain imports are allowed and explicit (e.g., email broker importing user broker)
    - Orchestration brokers live alongside atomic brokers in the same domain
- **Export naming:** Action word matching folder name (e.g., `fetch`, `send`, `registration`)
- **Import paths:**
    - Same domain: `'../create/create'` (relative within domain)
    - Cross-domain: `'../../email/send/send'` (explicit cross-domain)

**Example Implementations:**

```typescript
// brokers/user/fetch/fetch.ts
// KNOWS the specific endpoint and data format
import { get } from '../../../adapters/axios/get/get';
import { parseUser } from '../../../contracts/user-contract/user-contract';
import { UserNotFoundError } from '../../../errors/user-not-found-error/user-not-found-error';

const API_BASE = process.env.API_BASE_URL || 'https://api.example.com';

export const fetch = async ({userId}: {userId: string}) => {
  try {
    // Broker knows the endpoint
    const response = await get({url: `${API_BASE}/api/v1/users/${userId}`});

    // Broker transforms external format to domain object
    return parseUser({data: response.data});
  } catch (error) {
    if (error.status === 404) {
      throw new UserNotFoundError({message: `User ${userId} not found`});
    }
    throw error;
  }
};

// ATOMIC BROKER EXAMPLE:
// brokers/comment/create/create.ts
// ATOMIC: Only creates the comment, nothing else
import { insert } from '../../../adapters/mongoose/insert/insert';
import { Comment } from '../../../contracts/comment-contract/comment-contract';

export const create = async ({content, postId, userId}: {
  content: string;
  postId: string;
  userId: string;
}): Promise<Comment> => {
  return await insert({
    model: 'Comment',
    data: { content, postId, userId, createdAt: new Date() }
  });
};

// brokers/post/comment-count-increment/comment-count-increment.ts
// ATOMIC: Only increments the count, separate from comment creation
import { incrementField } from '../../../adapters/mongoose/increment-field/increment-field';

export const commentCountIncrement = async ({postId}: {postId: string}): Promise<void> => {
  await incrementField({
    model: 'Post',
    id: postId,
    field: 'commentCount',
    amount: 1
  });
};

// brokers/notification/send/send.ts
// ATOMIC: Only sends notification, doesn't know about comments
import { publish } from '../../../adapters/redis/publish/publish';

export const send = async ({userId, type, data}: {
  userId: string;
  type: string;
  data: Record<string, unknown>;
}): Promise<void> => {
  await publish({
    channel: `user:${userId}:notifications`,
    message: { type, data, timestamp: Date.now() }
  });
};

// ORCHESTRATION BROKER EXAMPLE:
// brokers/comment/create-process/create-process.ts
// ORCHESTRATION: Coordinates multiple brokers for comment creation workflow
import { create } from '../create/create';  // Same domain: relative path
import { commentCountIncrement } from '../../post/comment-count-increment/comment-count-increment';  // Cross-domain: explicit path
import { send } from '../../notification/send/send';  // Cross-domain: explicit path
import { check } from '../../spam/check/check';  // Cross-domain: explicit path
import { isValidContent } from '../../../contracts/is-valid-content/is-valid-content';
import { ValidationError } from '../../../errors/validation-error/validation-error';

export const createProcess = async ({content, postId, userId, authorId}: {
  content: string;
  postId: string;
  userId: string;
  authorId: string;
}) => {
  // Validation using contracts
  if (!isValidContent({content})) {
    throw new ValidationError({message: 'Invalid comment content'});
  }

  // Check spam
  const spamScore = await check({content});
  if (spamScore > 0.8) {
    throw new ValidationError({message: 'Comment appears to be spam'});
  }

  // Orchestrate multiple brokers
  const comment = await create({content, postId, userId});
  await commentCountIncrement({postId});

  if (authorId !== userId) {
    await send({
      userId: authorId,
      type: 'new_comment',
      data: {commentId: comment.id, postId}
    });
  }

  return comment;
};
```

### bindings/

**Purpose:** Reactive connections that watch for changes

**Folder Structure:**

```
bindings/
  use-user-data/                // Frontend
    use-user-data.ts
    use-user-data.test.ts
  use-cart-items/                // Frontend
    use-cart-items.ts
    use-cart-items.test.ts
  use-file-watcher/              // CLI
    use-file-watcher.ts
    use-file-watcher.test.ts
  use-process-monitor/           // CLI
    use-process-monitor.ts
    use-process-monitor.test.ts
```

**Constraints:**

- **Frontend:** React hooks that bind data to components (must start with `use`)
- **Backend:** Not applicable
- **Library Package:** Not applicable
- **CLI Package:** Reactive watchers and monitors (must start with `use` for consistency)
- **Frontend CAN use:** useState, useEffect, useCallback, useMemo, useContext, useReducer
- **CLI External Access Flow:** External packages (fs, process) → adapters/ → brokers/ → bindings/
    - First usage: External package can be imported directly in broker (evolution pattern)
    - Second usage: Lint triggers adapter creation
    - Example: fs.watch → adapters/fs/watch/ → brokers/file/watch/ → bindings/use-file-watcher/
- **Pattern:** bindings/use-[resource]/use-[resource].ts (enforced `use` prefix for all)
- **CAN** import from brokers/, state/, contracts/, errors/

**CRITICAL FOR FRONTEND:** Bindings vs Brokers usage:

- **Bindings** = React hooks with useEffect for data binding (render phase only)
- **Brokers** = Pure async functions for operations (event handlers)

**Example Implementations:**

```jsx
// Frontend: widgets/user-dashboard/user-dashboard.tsx
export const UserDashboard = () => {
  // ✅ BINDINGS in render phase
  const userData = useUserData(userId);        // bindings/use-user-data/
  const cartItems = useCartItems();            // bindings/use-cart-items/

  const handleCheckout = async () => {
    // ✅ BROKERS in event handlers
    await process(cartItems);          // brokers/checkout/process/
    // ❌ const data = useUserData();          // ERROR! Can't call bindings here
  };

  return <button onClick={handleCheckout}>Checkout</button>;
};

// CLI: bindings/use-file-watcher/use-file-watcher.ts
import { watch } from '../../brokers/file/watch/watch';  // Uses broker, not fs directly!

export const useFileWatcher = ({path, callback}: {path: string; callback: (event: string, filename: string) => void}) => {
  // Binding uses broker, which uses adapter (if exists), which wraps fs.watch
  const watcher = watch({path, callback});

  const stop = () => {
    watcher.stop();
  };

  return {watcher, stop};
};

// The flow: fs.watch → adapters/fs/watch/ → brokers/file/watch/ → here

// CLI: bindings/use-process-monitor/use-process-monitor.ts
import { metricsGet } from '../../brokers/process/metrics-get/metrics-get';

export const useProcessMonitor = ({interval = 5000}: {interval?: number}) => {
  let monitor: NodeJS.Timeout;

  const start = () => {
    monitor = setInterval(async () => {
      const metrics = await metricsGet();
      console.log('Process metrics:', metrics);
    }, interval);
  };

  const stop = () => {
    if (monitor) clearInterval(monitor);
  };

  const getMetrics = () => metricsGet();

  return {start, stop, getMetrics};
};
```

**Note:** All orchestration happens in brokers/, not in bindings. See the brokers/ section for details on atomic vs
orchestration brokers.

### state/

**Purpose:** Data storage and memory management (NOT orchestration)

**Folder Structure:**

```
state/
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

**Constraints:**

- **Frontend:** React contexts, Zustand/Redux stores
- **Backend:** Caches, session stores, connection pools
- **Must** manage data lifecycle (storage, retrieval, cleanup)
- **CAN** import from contracts/ and errors/ only
- **CAN NOT** import from widgets/, flows/
- **Pure storage:** No side effects, no external calls
- **Note on configuration:**
    - Dynamic/runtime config lives in state/
    - Example: state/app-config/, state/feature-flags/

**Example Implementation:**

```typescript
// state/user-cache/user-cache.ts
import { User } from '../../contracts/user-contract/user-contract';

const cache = new Map<string, User>();
const TTL = 5 * 60 * 1000; // 5 minutes

export const getUserFromCache = ({id}: {id: string}): User | undefined => {
  return cache.get(id);
};

export const setUserInCache = ({id, user}: {id: string; user: User}): void => {
  cache.set(id, user);
  setTimeout(() => cache.delete(id), TTL);
};
```

### responders/

**Purpose:** Route handlers that orchestrate responses to flows

**Folder Structure:**

```
responders/
  user-profile-responder/
    user-profile-responder.tsx       // Frontend page responder
    user-profile-responder.test.tsx
  user-get-responder/
    user-get-responder.ts      // Backend controller responder
    user-get-responder.test.ts
  process-email-queue/
    process-email-queue.ts      // Queue processor
    process-email-queue.test.ts
```

**Constraints:**

- **Frontend (pages):** Must return JSX.Element for rendering
- **Backend (controllers):** Must accept {req, res} object and call res methods
- **Backend (queue processors):** Process queue jobs when they arrive
- **Backend (scheduled tasks):** Execute when time conditions are met
- **One export per file:** Each responder is a single function
- **With UI CAN** import from: widgets/, brokers/, bindings/, state/, contracts/, errors/
- **Without UI CAN** import from: brokers/, state/, contracts/, errors/
- **Orchestration rules:**
    - **CAN** call brokers directly - use atomic brokers for single operations, orchestration brokers for complex
      workflows
- **CAN NOT** import from other responders/ or flows/
- **CAN ONLY** be imported by flows/
- **Pattern:** responders/[descriptive-name]/[descriptive-name].ts
- **Examples by type:**
    - HTTP: responders/user-get-controller/, responders/login-page/
    - Queue: responders/process-email-queue/, responders/resize-image-handler/
    - Scheduled: responders/generate-daily-report/, responders/cleanup-old-data/
- **Note:** Temporal responders (queue/scheduled) are registered in startup/ files that run as separate processes

**Example Implementations:**

```typescript
// responders/user-profile-page/user-profile-page.tsx (Frontend)
import { useParams } from 'react-router-dom';
import { useUserData } from '../../bindings/use-user-data/use-user-data';
import { updateProcess } from '../../brokers/user/update-process/update-process';
import { ProfileLayout } from '../../widgets/profile-layout/profile-layout';
import { ProfileHeader } from '../../widgets/profile-header/profile-header';
import { ProfileContent } from '../../widgets/profile-content/profile-content';

export const UserProfilePage = () => {
  const { userId } = useParams();
  const userData = useUserData({userId});  // bindings/

  const handleEdit = async () => {
    await updateProcess({userData});  // brokers/
  };

  return (
    <ProfileLayout>
      <ProfileHeader user={userData} />
      <ProfileContent user={userData} onEdit={handleEdit} />
    </ProfileLayout>
  );
};

// responders/comment-create-controller/comment-create-controller.ts (Backend)
import { createProcess } from '../../brokers/comment/create-process/create-process';
import { NotFoundError } from '../../errors/not-found-error/not-found-error';
import { ValidationError } from '../../errors/validation-error/validation-error';
import { ForbiddenError } from '../../errors/forbidden-error/forbidden-error';
import { HttpRequest, HttpResponse } from '../../contracts/http-contract/http-contract';

export const commentCreateController = async ({req, res}: {req: HttpRequest; res: HttpResponse}) => {
  try {
    const { postId, content, parentId } = req.body;

    // Call orchestration broker (coordinates multiple brokers)
    const comment = await createProcess({
      postId,
      content,
      parentId,
      userId: req.user.id,
      authorId: req.params.authorId
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// responders/user-get-controller/user-get-controller.ts (Backend - Simple)
import { fetch } from '../../brokers/user/fetch/fetch';
import { NotFoundError } from '../../errors/not-found-error/not-found-error';

export const userGetController = async ({req, res}: {req: any; res: any}) => {
  try {
    const { id } = req.params;

    // Direct atomic broker call (only 1 operation)
    const user = await fetch({userId: id});

    res.json(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
```

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

**Folder Structure:**

```
widgets/
  user-card/
    user-card.tsx               // User profile display component
    user-card.test.tsx
    user-card.styles.tsx        // Styled-components styles
    avatar.tsx                  // Sub-component for user avatar
    status-badge.tsx            // Sub-component for status indicator
  login-form/
    login-form.tsx              // Login form component
    login-form.test.tsx
    password-field.tsx          // Sub-component for password input
```

**Constraints:**

- **Frontend:** Must return JSX.Element, must import React
- **Backend:** Template/view rendering functions
- **Export naming:** PascalCase for components
- **CAN** import from bindings/, brokers/, state/, contracts/, transformers/, errors/
- **MUST** use bindings for reactive data (in render phase)
- **MUST** use brokers for imperative operations (in event handlers)
- **CAN** use React's useState for component-local UI state (show/hide, form inputs)
- **Note:** React's useState is for component state only. Application state goes in state/
- **CAN NOT** call bindings in event handlers (React will error!)
- **CAN NOT** import from adapters/ (except styling libraries like MUI, styled-components)
- **CAN NOT** import from flows/ or responders/

**Example Implementations:**

```jsx
// widgets/user-form/user-form.tsx
export const UserForm = () => {
    // ✅ Bindings in render phase
    const userData = useUserData(id);  // bindings/

    const handleSubmit = async () => {
        // ✅ Brokers in event handlers
        await updateProcess(data);  // brokers/
        // ❌ const data = useUserData(id);  // ERROR! Can't call bindings here
    };

    return <form onSubmit={handleSubmit}>...</form>;
};

// widgets/user-card/user-card.tsx
import { useState } from 'react';
import { useUserActions } from '../../bindings/use-user-actions/use-user-actions';
import { Avatar } from './avatar';
import { StatusBadge } from './status-badge';

export const UserCard = ({ userId }: { userId: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);  // Local UI state
    const { followUser, unfollowUser } = useUserActions();  // bindings/

    const handleFollow = async () => {
        await followUser({userId});  // Broker in event handler
    };

    return (
        <div className="user-card">
            <Avatar userId={userId} />
            <StatusBadge userId={userId} />
            <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Less' : 'More'}
            </button>
            <button onClick={handleFollow}>Follow</button>  {/* brokers/ in event handler */}
        </div>
    );
};
```

### startup/

**Purpose:** Application bootstrap and initialization

**Folder Structure:**

```
startup/
  app.tsx                     // Frontend app bootstrap
  server.ts                   // Backend server initialization
  queue-worker.ts             // Queue processor bootstrap
  scheduler-service.ts        // Scheduled tasks bootstrap
  cli.ts                      // CLI entry point
```

**Constraints:**

- **Frontend:** Root component mounting, provider setup
- **Backend:** Server initialization, middleware setup, queue workers, scheduler services
- **Package:** CLI initialization logic
- **CAN** import from ALL folders - **BUT this is not breaking the architecture, here's why:**
    - Startup files are pure orchestration - they wire everything together but contain NO business logic
    - Like a `main()` function, they must see everything to bootstrap the application
    - They only import to initialize, configure, and connect - never to implement features
    - This is a one-way dependency: startup imports everything, but nothing imports startup
    - Without this privilege, there would be no way to actually start the application
- **Typical imports and their purpose:**
    - flows/ → Mount routes on the server
    - state/ → Initialize connection pools and caches
    - middleware/ → Configure error handlers and logging
    - adapters/ → Set up external service connections
    - bindings/ → Initialize providers and contexts
    - brokers/ → Run health checks at startup
    - responders/ → Register queue workers and cron jobs
- **Should** handle graceful shutdown and cleanup
- **Must NOT** contain business logic - only initialization and wiring
- **Note on Queue/Scheduler processes:**
    - Queue workers are separate startup entries (e.g., startup/queue-worker.ts)
    - Scheduler services are separate startup entries (e.g., startup/scheduler-service.ts)
    - These are launched by OS/orchestrator as independent processes
    - They import responders that handle queue/time events instead of HTTP
- **Note on static configuration:**
    - Static config constants can live directly in startup/
    - Environment variable loading happens here
    - Config transformation can use transformers/

**Example Implementation (showing why startup needs to import everything):**

```typescript
// startup/server.ts - Backend example showing necessary imports
import express from 'express';
import { apiFlow } from '../flows/api-flow/api-flow';              // Need flows to mount routes
import { initDbPool } from '../state/db-pool/db-pool';             // Need state to init connections
import { errorTracking } from '../middleware/error-tracking/error-tracking'; // Need middleware for errors
import { connectDb } from '../adapters/mongoose/connect/connect';  // Need adapters for external services
import { healthCheck } from '../brokers/health/check/check';       // Need brokers for health checks
import { emailQueueProcessor } from '../responders/process-email-queue/process-email-queue'; // Need responders for queues

export const startServer = async () => {
  const app = express();

  // Initialize everything (this is WHY startup needs all imports)
  await connectDb();           // Set up database
  await initDbPool();          // Initialize connection pool

  app.use(errorTracking);      // Configure middleware
  app.use('/api', apiFlow);    // Mount all routes
  app.get('/health', healthCheck); // Health endpoint

  // Start background processors
  emailQueueProcessor.start();

  app.listen(3000, () => console.log('Server started'));
};

// startup/app.tsx - Frontend example
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '../flows/app-routes/app-routes';        // Routes
import { initializeStores } from '../state/app-store/app-store';   // Global state
import { UserProvider } from '../bindings/use-user-context/use-user-context'; // Context providers

export const startApp = async () => {
  await initializeStores();  // Initialize stores

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <UserProvider>           {/* Set up providers */}
      <BrowserRouter>
        <AppRoutes />        {/* Mount all routes */}
      </BrowserRouter>
    </UserProvider>
  );
};
```

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/app.tsx`
- **Backend:** `index.js` → imports from `startup/server.ts`
- **Package:** `bin/cli.js` → imports from `startup/cli.ts`

The thin entry files just point to startup/ where the real initialization lives.

## Important Note on Code Organization

**EVERY piece of code MUST fit into our existing universal terms.** There are no exceptions:

- No "utils/" folder - utility functions are distributed based on their actual purpose:
    - Pure data transformation → **transformers/**
    - Boolean validation/checks → **contracts/**
    - Business operations → **brokers/**
    - External package wrapping → **adapters/** (NOT for internal utilities!)
- No "core/" folder - domain logic goes in **brokers/** (operations/orchestration) or **transformers/** (computation)
- No "helpers/" folder - these are just utilities by another name
- No "lib/" folder - these are just utilities by another name
- No "common/" folder - distribute to appropriate categories based on what the code actually does
- No "shared/" folder - distribute to appropriate categories based on what the code actually does

If code doesn't seem to fit any category, that means you need to:

1. Break it down further into smaller, single-purpose functions
2. Reconsider what the code is actually doing:
    - Pure function returning boolean? → **contracts/**
    - Pure function transforming data (non-boolean)? → **transformers/**
    - Single external operation? → **brokers/** (atomic)
    - Orchestrates multiple operations? → **brokers/** (orchestration)
    - Wraps external npm package? → **adapters/** (ONLY for external packages!)
    - Internal "utility" that doesn't fit above? → You're not breaking it down enough
3. Question if the code is necessary at all

**The universal terms are exhaustive** - they cover every possible type of code:

- Type definitions, validation, and boolean checks → **contracts/**
- Pure transformation functions (non-boolean) → **transformers/**
- External package wrappers → **adapters/**
- Infrastructure orchestration → **middleware/**
- Business operations → **brokers/**
- UI → **widgets/**
- Route handling → **responders/**
- Data storage → **state/**
- Static resources → **assets/**
- Version upgrades → **migrations/**

## Non-Deterministic Evolution Paths

### The Genesis Moment Problem

When an LLM encounters the first need for variation, two equally valid patterns can emerge:

#### Path A: Semantic Brokers

```typescript
// brokers/input/text/text.tsx
export const text = (props) => <TextField {...props} />;

// brokers/input/password/password.tsx
export const password = (props) => <TextField type="password" {...props} />;

// brokers/input/email/email.tsx
export const email = (props) => <TextField type="email" {...props} />;
```

#### Path B: Parameterized Broker

```typescript
// brokers/input/field/field.tsx
export const field = ({type = 'text', ...props}) => {
  return <TextField type={type} {...props} />;
};

// Usage:
import { field } from '../../brokers/input/field/field';
field({type: 'text'})
field({type: 'password'})
field({type: 'email'})
```

**Both patterns are architecturally valid** as long as they maintain the same return type. The non-determinism occurs
only at genesis - once a pattern is established, future LLMs will pattern-match and maintain consistency.

### Implications:

- **Local consistency > Global determinism** - Each project remains internally consistent
- **Pattern reinforcement** - More examples make the pattern clearer for future LLMs
- **Both approaches valid** - Semantic brokers provide clarity, parameterized brokers reduce file count

## Complexity Linting for Broker Evolution

### The Problem: Parameter Creep

Parameterized brokers can evolve into god functions through gradual parameter addition:

```typescript
// Day 1: Simple
export const input = ({value, onChange}) => { /* ... */ }

// Day 30: Growing
export const input = ({value, onChange, type, variant, size}) => { /* ... */ }

// Day 90: God function
export const input = ({
  value, onChange, type, variant, size, error, disabled,
  autoComplete, placeholder, helperText, startAdornment,
  endAdornment, multiline, rows, maxRows, ...props
}) => {
  // Complex conditional logic based on parameters
  if (type === 'password' && !autoComplete) { /* ... */ }
  if (multiline && type !== 'text') { /* ... */ }
  // etc...
}
```

### Recommended Lint Rules

#### 1. **Parameter Count Limit**

```javascript
{
  'max-broker-parameters': {
    max: 5,
    message: 'Broker has {{count}} parameters. Consider splitting into semantic brokers.'
  }
}
```

#### 2. **Cyclomatic Complexity**

```javascript
{
  'max-broker-complexity': {
    maxComplexity: 3,  // Maximum if/else branches
    message: 'Broker complexity score: {{score}}. Too much conditional logic.'
  }
}
```

#### 3. **Parameter Interdependencies**

```javascript
{
  'no-parameter-interdependencies': {
    detect: ['if (params.x && params.y)', 'params.x ? params.y : params.z'],
    message: 'Parameters depend on each other. Sign of multiple concerns in one broker.'
  }
}
```

#### 4. **Type Union Complexity**

```javascript
{
  'max-union-types': {
    max: 4,
    message: 'Parameter "{{param}}" has {{count}} type options. Split into semantic brokers.'
  }
}
```

### Recommended Thresholds:

Based on our analysis, a broker should be refactored to semantic brokers when:

- **Parameters > 5** - Too many configuration options
- **Conditional branches > 3** - Too much logic
- **Parameter affects other parameters** - Coupled concerns
- **Type union > 4 options** - Too many variants

### Refactoring Pattern:

When complexity threshold is exceeded:

```
❌ Lint Error: 'field' broker complexity exceeded

Suggested refactoring based on parameter 'type' having 5+ variants:
- Create brokers/input/text/text.tsx
- Create brokers/input/password/password.tsx
- Create brokers/input/email/email.tsx
- Create brokers/input/number/number.tsx
- Create brokers/input/date/date.tsx
```

## Configuration Files

### .architecture.config.json

This configuration file centralizes all architectural rules and constraints, making them mechanically enforceable via
linting.

```json
{
  // Packages whose adapters can be used anywhere in the application
  "appWide": {
    "lodash": true,           // Pure computation - adapters/lodash/* available everywhere
    "date-fns": true,         // Pure date functions - adapters/date-fns/* available everywhere
    "ramda": true,            // Pure functional utilities - adapters/ramda/* available everywhere
    "uuid": true              // Pure ID generation - adapters/uuid/* available everywhere
  },

  // Packages whose adapters are restricted to specific architectural layers
  "restrictedToLayers": {
    "mongoose": ["brokers"],  // Database operations only in brokers/
    "axios": ["brokers"],     // HTTP calls only in brokers/
    "redis": ["brokers"],     // Cache operations only in brokers/
    "fs": ["brokers"],        // File system only in brokers/
    "stripe": ["brokers"],    // Payment processing only in brokers/
    "twilio": ["brokers"],    // SMS/phone only in brokers/
    "aws-sdk": ["brokers"],   // AWS services only in brokers/
    "react": ["widgets", "responders", "bindings", "startup"]  // UI rendering restrictions
  },

  // Infrastructure coupling rules: when adapter X is used, middleware Y must be called
  // This ensures consistent observability and logging across external operations
  "couplings": {
    "adapters/axios/*/": {
      "mustCall": ["middleware/http-telemetry/http-telemetry"],
      "reason": "All HTTP calls must log metrics for monitoring"
    },
    "adapters/mongoose/*/": {
      "mustCall": ["middleware/db-telemetry/db-telemetry"],
      "reason": "All database operations must log query performance"
    },
    "adapters/stripe/*/": {
      "mustCall": ["middleware/payment-logging/payment-logging"],
      "reason": "All payment operations must be audited for compliance"
    }
  },

  // Forbidden patterns with their approved replacements
  // Guides developers away from anti-patterns toward proper abstractions
  "forbidden": {
    "axios": {
      "message": "Don't import axios directly. Use adapters/axios/* for configured HTTP",
      "replacement": "adapters/axios/get/get or adapters/axios/post/post"
    },
    "mongoose.connect": {
      "message": "Don't use mongoose.connect directly. Use configured adapter",
      "replacement": "adapters/mongoose/connect/connect"
    },
    "fs.writeFile": {
      "message": "Don't use fs.writeFile directly. Use adapter with atomic writes",
      "replacement": "adapters/fs/write-file/write-file"
    },
    "bcrypt.hash": {
      "message": "Don't use bcrypt.hash directly. Use adapter with project password policy",
      "replacement": "adapters/bcrypt/hash/hash"
    }
  },

  // Complexity thresholds that trigger broker refactoring from parameterized to semantic
  "complexityLimits": {
    "maxBrokerParameters": 5,           // Max parameters before split required
    "maxConditionalBranches": 3,        // Max if/else complexity before split
    "maxUnionTypes": 4,                 // Max type variants before split
    "maxParameterDependencies": 0       // No parameter should affect another
  },

  // AsyncLocalStorage context configuration for request tracking
  "contextConfig": {
    "enabled": true,
    "storageKey": "requestContext",
    "trackedFields": [
      "requestId",              // Unique request identifier
      "userId",                 // Authenticated user
      "traceId",                // Distributed tracing ID
      "timestamp"               // Request start time
    ]
  },

  // Mechanical enforcement rules for ESLint
  "lintRules": {
    "enforce-import-whitelist": "error",           // Block non-whitelisted imports outside adapters/
    "enforce-layer-restrictions": "error",         // Enforce restrictedToLayers configuration
    "enforce-adapter-couplings": "error",          // Ensure coupled middleware is called
    "enforce-forbidden-patterns": "error",         // Block forbidden direct imports
    "max-broker-complexity": "error",              // Enforce complexity limits
    "enforce-boolean-location": "error",           // Boolean functions must be in contracts/
    "enforce-pure-transformer": "error",           // Non-boolean pure functions in transformers/
    "no-business-logic-in-adapters": "error",      // Adapters can't know endpoints/domain
    "no-external-calls-in-contracts": "error",     // Contracts must be pure, in-memory
    "enforce-broker-atomic-or-orchestration": "error"  // Brokers are single-op or multi-broker coordination
  }
}
```

### Configuration Examples

#### Example 1: App-Wide vs Restricted Adapters

```typescript
// ✅ ALLOWED: lodash is appWide
// contracts/is-empty-array/is-empty-array.ts
import { isEmpty } from '../../../adapters/lodash/is-empty/is-empty';

export const isEmptyArray = ({arr}: {arr: unknown[]}): boolean => {
  return isEmpty({value: arr});
};

// ✅ ALLOWED: lodash is appWide
// transformers/format-name/format-name.ts
import { capitalize } from '../../../adapters/lodash/capitalize/capitalize';

export const formatName = ({name}: {name: string}): string => {
  return capitalize({str: name});
};

// ❌ FORBIDDEN: mongoose restricted to brokers/
// transformers/user-dto/user-dto.ts
import { find } from '../../../adapters/mongoose/find/find';  // LINT ERROR!
// Error: "mongoose adapters restricted to brokers/ layer only"

// ✅ ALLOWED: mongoose in brokers/
// brokers/user/fetch/fetch.ts
import { find } from '../../../adapters/mongoose/find/find';
export const fetch = async ({userId}: {userId: string}) => {
  return await find({model: User, filter: {id: userId}});
};
```

#### Example 2: Couplings Enforcement

```typescript
// ❌ FORBIDDEN: HTTP call without telemetry
// adapters/axios/get/get.ts
import axios from 'axios';

export const get = async ({url}: {url: string}) => {
  return await axios.get(url);  // LINT ERROR!
  // "axios adapter must call middleware/http-telemetry per coupling rules"
};

// ✅ ALLOWED: HTTP call with required telemetry
// adapters/axios/get/get.ts
import axios from 'axios';
import { httpTelemetry } from '../../../middleware/http-telemetry/http-telemetry';

export const get = async ({url}: {url: string}) => {
  const start = Date.now();
  const response = await axios.get(url);

  // Coupling enforced: telemetry must be called
  await httpTelemetry({
    method: 'GET',
    url,
    statusCode: response.status,
    duration: Date.now() - start
  });

  return response;
};
```

#### Example 3: Forbidden Patterns with Guidance

```typescript
// ❌ FORBIDDEN: Direct import
// brokers/user/fetch/fetch.ts
import axios from 'axios';  // LINT ERROR!
// "Don't import axios directly. Use adapters/axios/* for configured HTTP"
// Replacement: "adapters/axios/get/get or adapters/axios/post/post"

export const fetch = async ({userId}: {userId: string}) => {
  const response = await axios.get(`/users/${userId}`);
  return response.data;
};

// ✅ ALLOWED: Using configured adapter
// brokers/user/fetch/fetch.ts
import { get } from '../../../adapters/axios/get/get';

export const fetch = async ({userId}: {userId: string}) => {
  const response = await get({url: `/users/${userId}`});
  return response.data;
};
```

### Key Benefits of Centralized Configuration

1. **Single Source of Truth**: All architectural rules in one file
2. **Mechanical Enforcement**: Rules are linted, not just documented
3. **Clear Guidance**: Forbidden patterns show the correct alternative
4. **Infrastructure Consistency**: Couplings ensure logging/metrics are always applied
5. **Evolution Path**: Complexity limits guide when to refactor parameterized brokers

## Open Questions

1. **Data Access Layer** - What to call the layer between actions and adapters for data operations
2. **Backend Processing Components** - Whether backend needs a term for reusable processing pieces
3. **Mapping Tech-Specific Concepts** - How backend/package-specific folders relate to universal terms

## Usage Guidelines

- Use universal terms wherever possible across all project types
- Only use tech-specific folders when the concept doesn't exist in other stacks
- Maintain consistency: same term should mean the same thing across projects