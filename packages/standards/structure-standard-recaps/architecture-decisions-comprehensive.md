# Comprehensive Architecture Decisions - Full Discussion Record

## Part 1: Broker Evolution Discovery

### The Initial Question

How do brokers evolve into triggers when they need to orchestrate multiple operations?

### Discovery: Two Distinct Evolution Patterns

#### Enhancement Pattern (Main Action Remains Central)

```typescript
// Initial broker
export const copyClipboard = async ({text}) => {
  await navigator.clipboard.writeText(text);
};

// Evolution: Same core action, wrapped with concerns
export const copyWithFeedback = async ({text}) => {
  await copyClipboard(text);        // MAIN ACTION still central
  await toastSuccess('Copied!');    // Enhancement
  await analyticsTrack('copy');     // Enhancement
};
```

#### Sequential Workflow Pattern (Distinct Business Steps)

```typescript
// Not enhancement, but distinct operations
export const paymentProcess = async (data) => {
  await stripeCharge(data);         // Step 1
  await orderStatusUpdate(data);    // Step 2 (different operation)
  await receiptEmailSend(data);     // Step 3 (different operation)
  await inventoryDecrement(data);   // Step 4 (different operation)
};
```

### The Key Revelation

**Brokers don't actually evolve - our understanding of the system does.**

Some brokers are complete operations (`copyClipboard`), others are fragments of workflows we haven't fully understood
yet (`userCreate` without email/audit).

## Part 2: The Discoverability Problem

### What LLM Sees with `ls brokers/`

```
brokers/
  user-create/          # Fragment or complete?
  user-fetch/           # Complete operation
  email-send/           # Fragment or complete?
  welcome-email-send/   # Definitely fragment
  cache-user-set/       # Fragment (for user-fetch-cached)
  comment-create/       # Fragment or complete?
```

**The Problem:** LLM can't tell which brokers are meant to be called directly vs which are parts of workflows.

### Rejected Solutions

#### 1. Broker-to-Broker Calls

```typescript
// Idea: Let orchestrator brokers call other brokers
brokers/user-registration/  // Calls user-create, email-send, etc.
```

**Rejected:** This just reinvents triggers with a different name.

#### 2. Nested Broker Folders

```
brokers/
  user-registration/
    user-registration.ts
    user-create/          # Nested fragment
    welcome-email/        # Nested fragment
```

**Rejected:** Migration nightmare when brokers need to be shared.

#### 3. Mechanical Naming from Broker Sequence

```
triggers/
  user-create-welcome-email-send-audit-log-create-process/
```

**Rejected:** Unreadable, breaks with conditionals.

### Accepted Solution: Enhanced `codex-ls` Tool

```bash
$ codex-ls brokers/
user-create/
  calls-adapters: [mongoose/insert]
  called-by-triggers: [user-registration-process, user-import-process]
  called-by-responders: []  # Never called directly

user-fetch/
  calls-adapters: [mongoose/find-one]
  called-by-triggers: [user-fetch-cached-process]
  called-by-responders: [simple-user-get-controller]  # Sometimes direct
```

## Part 3: Infrastructure Cross-Cutting Concerns

### The Logging Enforcement Problem

**Requirement:** Every axios call must have logging.

#### In Normal Codebase (LLM's Natural Behavior)

```javascript
// First instinct: Just add console.log
router.get('/users/:id', async (req, res) => {
  console.log('Fetching user');  // Easy!
  const user = await User.findById(req.params.id);
});

// When asked for "real logging", creates random locations:
// utils/logger.js (one session)
// lib/logger.js (another session)
// services/logging.js (third session)
```

#### In Our Architecture (The Friction)

```typescript
// Controller wants to add logging
export const userController = async ({req, res}) => {
  await loggerInfo('Fetching user');        // Broker 1
  await userFetchCached(req.params.id);     // Trigger
  await loggerInfo('User fetched');         // Broker 2
  // LINT ERROR: Controller calling 3 operations!
};
```

### Solution: Middleware Layer for Infrastructure

```typescript
// middleware/http-telemetry/http-telemetry.ts
export const httpTelemetry = async ({method, url, status, duration}) => {
  await log({level: 'info', message: `HTTP ${method} ${url}`});
  await metricsIncrement({metric: 'http_requests_total'});
  await metricsHistogram({metric: 'http_duration', value: duration});
};

// adapters/axios/get/get.ts
import { httpTelemetry } from '../../middleware/http-telemetry/http-telemetry';

export const get = async ({url, config}) => {
  const start = Date.now();
  const response = await axios.get(url, config);
  await httpTelemetry({
    method: 'GET',
    url,
    status: response.status,
    duration: Date.now() - start
  });
  return response;
};
```

### Configuration for Couplings

```json
{
  "couplings": {
    "adapters/axios/**": ["middleware/http-telemetry"],
    "adapters/stripe/**": ["middleware/http-telemetry", "middleware/error-tracking"]
  }
}
```

## Part 4: The Universal Adapter Decision

### Initial Thinking

```json
{
  "appWide": ["lodash", "react"],  // Direct imports allowed
  "requiresAdapter": ["axios", "mongoose"]
}
```

### The Testing Revelation

**Even lodash needs an adapter for testing!**

```typescript
// adapters/lodash/debounce/debounce.ts
import { debounce as _debounce } from 'lodash';

export const debounce = (func, wait) => {
  if (process.env.NODE_ENV === 'test') {
    testObserver.track('lodash.debounce', {wait});
    return func;  // No delay in tests!
  }
  return _debounce(func, wait);
};
```

### Final Decision: Everything Through Adapters

```json
{
  "appWide": ["lodash", "react"],  // Can use ADAPTERS anywhere
  "restrictedToLayers": {
    "mongoose": ["brokers"],      // Adapter only in brokers
    "express": ["flows", "startup"]
  }
}
```

## Part 5: Transaction Context Pattern

### The Problem

```typescript
// Multiple brokers need same transaction
await orderCreate(data);      // Needs tx
await inventoryDecrement(data); // Needs same tx
await paymentCapture(data);    // Needs same tx
```

### Solution: AsyncLocalStorage

```typescript
// state/transaction-context/transaction-context.ts
import { AsyncLocalStorage } from 'async_hooks';
export const transactionContext = new AsyncLocalStorage();

// triggers/order-complete-process/order-complete-process.ts
const tx = await dbTransactionStart();
await transactionContext.run(tx, async () => {
  await orderCreate(data);        // Sees tx automatically
  await inventoryDecrement(data);  // Sees tx automatically
  await paymentCapture(data);     // Sees tx automatically
});
```

## Part 6: Business vs Infrastructure Cross-Cutting

### Infrastructure Cross-Cutting (ALLOWED)

```typescript
// middleware/http-telemetry/ - Observability doesn't change business state
// Every HTTP call gets logging/metrics automatically
```

### Business Cross-Cutting (DANGEROUS)

```typescript
// WRONG: Hidden business side effects
"brokers/customer-*": ["middleware/discount-apply"]
// Would mean customer updates invisibly trigger discount recalculation

// RIGHT: Explicit in triggers
export const customerUpdateProcess = async (data) => {
  const customer = await customerUpdate(data);
  const discount = await discountRecalculate(customer);  // Visible!
  await orderTotalsUpdate(customer, discount);
};
```

## Part 7: Forbidden Patterns with Replacements

### Problem: Just Forbidding Isn't Enough

```typescript
console.log('test');
// LINT ERROR: console.log forbidden
// LLM: "...now what?"
```

### Solution: Replacement Mapping

```json
{
  "forbidden": {
    "console": {
      "message": "Use logger brokers instead",
      "replacements": {
        "console.log": "brokers/logger-info",
        "console.error": "brokers/logger-error"
      }
    }
  }
}
```

### Lint Provides Instructions

```
LINT ERROR: console.log is forbidden.
Use brokers/logger-info instead.
Import: import { loggerInfo } from '../../brokers/logger-info/logger-info';
Usage: await loggerInfo({message: 'test'});
```

## Part 8: Widget Event Handler Rules

### The Pattern for Frontend Event Handlers

Widgets have specific rules for what they can call in event handlers:

#### Single Broker Calls (Allowed)

```tsx
// widgets/theme-toggle/theme-toggle.tsx
export const ThemeToggle = () => {
  const handleToggle = async () => {
    await localStorageSet({key: 'theme', value: 'dark'});  // ✅ Single broker OK
  };

  return <button onClick={handleToggle}>Toggle</button>;
};
```

#### Trigger Calls (Preferred for Multiple Operations)

```tsx
// widgets/copy-button/copy-button.tsx
export const CopyButton = ({text}: {text: string}) => {
  const handleCopy = async () => {
    await copyWithFeedback({text});  // ✅ Trigger orchestrates multiple brokers
  };

  return <button onClick={handleCopy}>Copy</button>;
};
```

#### What NOT to Do

```tsx
// widgets/bad-button/bad-button.tsx
export const BadButton = ({text}: {text: string}) => {
  const handleClick = async () => {
    await clipboardCopy({text});      // ❌ Multiple brokers
    await toastSuccess('Copied!');    // ❌ Need trigger instead
    await analyticsTrack('copy');     // ❌
  };
};
```

### The Rule

- **Can call ONE broker directly** for truly atomic operations
- **Must use trigger** if calling 2+ brokers
- **Bindings (hooks) only in render phase**, never in event handlers

## Part 9: Trigger Naming and Proliferation

### The Pattern We Settled On

```
triggers/
  user-self-registration-process/      # User signs themselves up
  user-oauth-google-registration-process/  # Via Google
  user-admin-creation-process/         # Admin creates user
  user-trial-registration-process/     # Trial signup
```

**Decision:** Many specific triggers > Few parameterized triggers

**Why:** LLMs excel at pattern matching. Specific names eliminate guesswork.

## Part 10: The Non-Deterministic Genesis Problem

### The Issue

When an LLM first encounters a need for variation, it might create different patterns:

#### Path A: Semantic Brokers

```typescript
// brokers/text-input/text-input.tsx
export const textInput = (props) => <TextField {...props} />;

// brokers/password-input/password-input.tsx
export const passwordInput = (props) => <TextField type="password" {...props} />;

// brokers/email-input/email-input.tsx
export const emailInput = (props) => <TextField type="email" {...props} />;
```

#### Path B: Parameterized Broker

```typescript
// brokers/input/input.tsx
export const input = ({type = 'text', ...props}) => {
  return <TextField type={type} {...props} />;
};

// Usage:
input({type: 'password'})
input({type: 'email'})
```

### The Resolution

**Both patterns are architecturally valid** as long as:

- They maintain the same return type
- Local consistency is preserved within the project
- Complexity limits aren't exceeded

### Complexity Linting Rules

Brokers should be refactored to semantic variants when:

- Parameters > 5
- Conditional branches > 3
- Parameter interdependencies exist
- Type union > 4 options

## Part 11: Node.js Transaction Patterns Exploration

### What We Explored Before Choosing AsyncLocalStorage

#### Option 1: Connection/Transaction as Parameter

```typescript
// Most ORMs pass transaction as parameter
// Prisma:
await prisma.$transaction(async (tx) => {
  await tx.user.create({data});
  await tx.order.create({data});
});

// Sequelize:
await sequelize.transaction(async (t) => {
  await User.create(data, {transaction: t});
  await Order.create(data, {transaction: t});
});

// Knex:
await knex.transaction(async (trx) => {
  await trx('users').insert(data);
  await trx('orders').insert(data);
});
```

**Problem:** Every broker would need optional tx parameter, coupling to implementation.

#### Option 2: CLS (Continuation Local Storage)

```typescript
// Pre-AsyncLocalStorage solution
const cls = require('cls-hooked');
const session = cls.createNamespace('my-app');
```

**Problem:** Older pattern, AsyncLocalStorage is Node native.

#### Option 3: AsyncLocalStorage (Chosen Solution)

```typescript
import { AsyncLocalStorage } from 'async_hooks';
const transactionContext = new AsyncLocalStorage();

// Clean, native, no parameter threading
```

## Part 12: Import Hierarchy (The DAG)

### The Strict Directed Acyclic Graph

```
errors → contracts → transformers
              ↓
       adapters → brokers → triggers → responders → flows
                      ↓        ↓           ↑
                 bindings → widgets -------┘
                      ↓        ↓
                   state ------┘

middleware (NEW)
  ├─→ adapters (can import multiple)
  └─→ other middleware (can compose)
```

### Key Import Rules

- **Lower layers cannot import from higher layers**
- **Brokers CANNOT call other brokers** (maintains atomicity)
- **Triggers CANNOT call other triggers** (prevents chains)
- **Only brokers can import from adapters** (except infrastructure middleware)
- **Widgets can call triggers** (for event handlers)
- **Adapters can call middleware** (for infrastructure bundles)

### Who Can Import What

```typescript
// errors/: No imports (foundational)
// contracts/: Can import errors
// transformers/: Can import contracts, errors
// adapters/: Can import npm packages, middleware
// middleware/: Can import adapters, other middleware
// brokers/: Can import adapters, contracts, errors
// bindings/: Can import brokers, state, contracts, errors
// triggers/: Can import brokers, contracts, errors
// state/: Can import contracts, errors
// widgets/: Can import bindings (render), triggers (events), transformers, state, contracts, errors
// responders/: Can import widgets, triggers, brokers, bindings, transformers, state, contracts, errors
// flows/: Can import responders ONLY
// startup/: Can import from ALL (special bootstrap privilege)
```

## Part 13: Frontend Component Brokers Clarification

### The Ambiguity Problem

```typescript
brokers/
  primary-button/     // Is this a fragment? Complete?
  user-create/        // Clearly a fragment (used in triggers)
  clipboard-copy/     // Complete operation
```

### The Solution: File Extension Signals Intent

```bash
brokers/
  primary-button/
    primary-button.tsx    # .tsx = UI component, meant for direct widget use
  user-create/
    user-create.ts        # .ts = business operation
```

### UI Component Brokers Are Special

```typescript
// brokers/primary-button/primary-button.tsx
export const primaryButton = ({label, onClick}) =>
  <Button variant="contained" color="primary">{label}</Button>;

// These are NOT fragments waiting for orchestration
// They ARE complete UI building blocks for widgets
```

### The Pattern

- **`.tsx` brokers** → UI components for direct use in widgets
- **`.ts` brokers** → Business operations, check usage patterns
- **Called by triggers** → Probably part of a workflow
- **Called by widgets/responders** → Can be used directly

## Part 14: Detailed Evolution Examples

### Frontend Evolution: Form Submission

#### Stage 1: Simple Form Submit

```typescript
// brokers/form-submit/form-submit.ts
export const formSubmit = async ({data}: {data: FormData}) => {
  return await post({url: '/api/v1/forms/contact', data});
};
```

#### Stage 2: Business Needs Analytics and Feedback

```typescript
// ❌ Can't add to broker (would be 3 operations)
export const formSubmit = async ({data}) => {
  const result = await post({url: '/api/v1/forms/contact', data});
  await analyticsTrack('form_submitted');  // Different package!
  await toastSuccess('Submitted!');         // Different package!
};
```

#### Stage 3: Create Trigger

```typescript
// triggers/form-submit-process/form-submit-process.ts
export const formSubmitProcess = async ({data}: {data: FormData}) => {
  const result = await formSubmit({data});
  await analyticsTrack({event: 'form_submitted', properties: {formId: result.id}});
  await toastSuccess({message: 'Form submitted successfully!'});
  return result;
};
```

### Backend Evolution: Comment Creation

#### Stage 1: Simple Comment Creation

```typescript
// brokers/comment-create/comment-create.ts
export const commentCreate = async ({content, postId, userId}) => {
  return await insert({
    model: CommentModel,
    data: {content, postId, userId, createdAt: new Date()}
  });
};
```

#### Stage 2: Business Needs Count Updates and Notifications

Requirements grow:

- Need to increment post comment count
- Need to notify post author
- Need to check for spam

#### Stage 3: Create Additional Brokers and Trigger

```typescript
// brokers/post-comment-count-increment/post-comment-count-increment.ts
export const postCommentCountIncrement = async ({postId}) => {
  return await incrementField({
    model: PostModel,
    id: postId,
    field: 'commentCount',
    amount: 1
  });
};

// brokers/notification-send/notification-send.ts
export const notificationSend = async ({userId, type, data}) => {
  return await publish({
    channel: `user:${userId}:notifications`,
    message: {type, data, timestamp: Date.now()}
  });
};

// triggers/comment-creation-process/comment-creation-process.ts
export const commentCreationProcess = async ({content, postId, userId, authorId}) => {
  // Check spam first
  const spamScore = await spamCheck({content});
  if (spamScore > 0.8) {
    throw new ValidationError({message: 'Comment appears to be spam'});
  }

  // Create comment
  const comment = await commentCreate({content, postId, userId});

  // Update post count
  await postCommentCountIncrement({postId});

  // Notify author if different from commenter
  if (authorId !== userId) {
    await notificationSend({
      userId: authorId,
      type: 'new_comment',
      data: {commentId: comment.id, postId}
    });
  }

  return comment;
};
```

### CLI Evolution: Markdown Processing

#### Stage 1: Simple Markdown Parse

```typescript
// brokers/markdown-parse/markdown-parse.ts
export const markdownParse = async ({file}: {file: string}) => {
  const content = await readFile({path: file});
  return markdownParser({content});
};
```

#### Stage 2: Business Needs Full Pipeline

Requirements grow:

- Add syntax highlighting
- Generate table of contents
- Export to HTML
- Export to PDF
- Track processing stats

#### Stage 3: Create Pipeline Trigger

```typescript
// Additional brokers needed
// brokers/syntax-highlight/syntax-highlight.ts
// brokers/toc-generate/toc-generate.ts
// brokers/html-write/html-write.ts
// brokers/pdf-generate/pdf-generate.ts

// triggers/markdown-full-process/markdown-full-process.ts
export const markdownFullProcess = async ({inputFile, outputDir, options}) => {
  // Read and parse
  const content = await fileRead({path: inputFile});
  const parsed = await markdownParse({content});

  // Apply transformations
  const highlighted = await syntaxHighlight({content: parsed});

  let final = highlighted;
  if (options?.toc) {
    final = await tocGenerate({content: highlighted});
  }

  // Generate outputs
  const htmlPath = path.join(outputDir, 'output.html');
  await fileWrite({path: htmlPath, content: final});

  if (options?.pdf) {
    const pdfPath = path.join(outputDir, 'output.pdf');
    await pdfGenerate({html: final, outputPath: pdfPath});
  }

  // Log stats
  await logInfo({
    message: 'Markdown processed',
    stats: {
      inputFile,
      outputDir,
      hasToC: options?.toc,
      hasPdf: options?.pdf
    }
  });

  return {htmlPath, pdfPath: options?.pdf ? path.join(outputDir, 'output.pdf') : null};
};
```

### The Pattern Across All Examples

1. **Start with atomic broker** (single operation, single package)
2. **Business requirements grow** (need multiple operations)
3. **Can't add to broker** (would violate one-package rule)
4. **Create trigger** (orchestrates multiple brokers)
5. **Original broker remains atomic** (reusable in other triggers)

## Decisions Summary

### Definitely Decided ✅

1. **Everything through adapters** - No direct npm imports
2. **Middleware layer exists** - For infrastructure orchestration
3. **AsyncLocalStorage for context** - Transaction and execution context
4. **Enhanced tooling required** - `codex-ls` with metadata
5. **Replacement mappings** - Every forbidden pattern has alternative
6. **Trigger proliferation is good** - Specific > parameterized
7. **Config controls adapter usage** - appWide vs restricted

### Still Open Questions 🟡

1. **Shared sequences in triggers** - Accept duplication? Context pattern?
2. **Bootstrap complexity** - How to ease first-time setup?
3. **Infrastructure in business logic** - Can triggers ever call middleware?

### Key Trade-Off Accepted

**We traded easy modification for deterministic placement.** This is worth it for LLM-only codebases because discovery
is harder than following complex patterns.

## Part 15: Complete Configuration Reference

### The Synthesized Configuration File

Based on all our discussions, here's what a complete configuration would look like:

```json
{
  // Packages that can use their ADAPTERS anywhere in the codebase
  // These still need adapters for testability, but the adapters can be imported everywhere
  "appWide": [
    "lodash",      // Utility functions used throughout
    "react",       // Framework code needed in widgets/responders
    "date-fns"     // Date utilities used everywhere
  ],

  // Packages whose ADAPTERS are restricted to specific layers
  // Prevents database code in UI, HTTP in wrong places, etc.
  "restrictedToLayers": {
    "mongoose": ["brokers"],           // Database only in brokers
    "redis": ["brokers"],              // Cache only in brokers
    "stripe": ["brokers"],             // Payment processing only in brokers
    "express": ["flows", "startup"],   // Web framework only in routes/startup
    "axios": ["brokers"],              // HTTP calls only in brokers
    "sendgrid": ["brokers"],           // Email only in brokers
    "@mui/material": ["widgets", "brokers"]  // UI components in UI layers
  },

  // Infrastructure couplings - when adapter X is used, middleware Y must be called
  // Enforces cross-cutting concerns like logging, metrics, error tracking
  "couplings": {
    "adapters/axios/**": [
      "middleware/http-telemetry"      // All HTTP calls get logged/metered
    ],
    "adapters/stripe/**": [
      "middleware/payment-telemetry",   // Payment calls get special tracking
      "middleware/error-recovery"       // Payment errors need recovery logic
    ],
    "adapters/mongoose/**": [
      "middleware/db-telemetry"         // Database calls get performance tracking
    ]
  },

  // Forbidden patterns with their replacements
  // Guides LLM to use proper abstractions instead of raw operations
  "forbidden": {
    "console": {
      "message": "Use logger brokers for consistent logging",
      "replacements": {
        "console.log": "brokers/logger-info",
        "console.error": "brokers/logger-error",
        "console.warn": "brokers/logger-warn",
        "console.debug": "brokers/logger-debug"
      }
    },
    "process.exit": {
      "message": "Use graceful shutdown broker",
      "replacements": {
        "process.exit": "brokers/process-shutdown"
      }
    },
    "Math.random": {
      "message": "Use seedable random for testability",
      "replacements": {
        "Math.random": "brokers/random-generate"
      }
    },
    "Date.now": {
      "message": "Use mockable time source for testing",
      "replacements": {
        "Date.now": "brokers/timestamp-get"
      }
    },
    "fs": {
      "message": "Use file operation brokers for consistency",
      "replacements": {
        "fs.readFile": "brokers/file-read",
        "fs.writeFile": "brokers/file-write",
        "fs.unlink": "brokers/file-delete"
      }
    }
  },

  // Complexity thresholds that trigger refactoring
  // When brokers exceed these, lint suggests splitting into semantic variants
  "complexityLimits": {
    "maxBrokerParameters": 5,          // Too many params = split to variants
    "maxBrokerBranches": 3,            // Too much logic = split to variants
    "maxTypeUnionOptions": 4           // Too many types = split to variants
  },

  // Transaction and context configuration
  // Defines how context propagation works in the system
  "contextConfig": {
    "useAsyncLocalStorage": true,      // Enable Node's AsyncLocalStorage
    "contextTypes": [
      "transaction",                   // Database transactions
      "user",                          // User context for auth
      "requestId",                     // Tracing through system
      "logger"                         // Contextual logging
    ]
  },

  // Lint rule configuration
  "lintRules": {
    "enforceOnePackagePerAdapter": true,     // Adapters wrap single package
    "enforceNoBrokerToBroker": true,         // Brokers can't call brokers
    "enforceNoTriggerToTrigger": true,       // Triggers can't call triggers
    "maxOperationsInResponder": 2,           // Responders orchestration limit
    "requireExplicitReturnTypes": true,      // All functions need return types
    "enforceCouplingsOnAdapterUse": true,    // Couplings are mandatory
    "detectMultiPackageImports": true        // Triggers adapter creation
  },

  // Special bootstrap configuration
  // First-time setup helpers for common infrastructure
  "bootstrapTemplates": {
    "logging": {
      "createAdapters": ["winston"],
      "createBrokers": ["logger-info", "logger-error", "logger-warn"],
      "createMiddleware": ["logging-telemetry"]
    },
    "database": {
      "createAdapters": ["mongoose"],
      "createBrokers": ["db-connect", "db-disconnect"],
      "createMiddleware": ["db-telemetry"]
    }
  }
}
```

### What Each Section Means

**`appWide`**: These packages still need adapters (for testing/mocking), but their adapters can be imported anywhere.
Without being listed here, adapters can only be imported where `restrictedToLayers` allows.

**`restrictedToLayers`**: Controls where non-appWide adapters can be used. Prevents business logic leaking into wrong
layers (e.g., database calls in UI components).

**`couplings`**: Enforces infrastructure bundles. When an adapter is used, it MUST call the specified middleware. Lint
error if not. Prevents forgetting logging, metrics, etc.

**`forbidden`**: Patterns that can't be used directly, with their required replacements. Makes lint errors instructive
rather than just restrictive.

**`complexityLimits`**: Mechanical thresholds that trigger refactoring. Prevents god brokers from emerging.

**`contextConfig`**: Defines what context types flow through AsyncLocalStorage, enabling transaction support and
execution context.

**`lintRules`**: The mechanical rules that enforce the architecture. These are all deterministic and don't require
semantic understanding.

**`bootstrapTemplates`**: Helps with initial setup pain by providing templates for common infrastructure patterns.

### Competing/Overlapping Concerns

Some of these configurations might conflict or overlap:

1. **`appWide` vs `restrictedToLayers`**: A package can't be both. If it's appWide, it can be used anywhere. If it's
   restricted, only in specified layers.

2. **`couplings` vs broker atomicity**: Couplings might force adapters to call multiple things (middleware), which seems
   to violate "one package per adapter" - but middleware is the exception for infrastructure orchestration.

3. **`forbidden` replacements might not exist yet**: The config says "use brokers/logger-info" but that broker might not
   exist. Lint should detect this and guide creation.

4. **`complexityLimits` vs business requirements**: Sometimes a broker genuinely needs 6 parameters. The limits are
   guidelines that trigger review, not hard stops.

5. **`bootstrapTemplates` vs manual creation**: Templates help with setup but might create unnecessary infrastructure if
   project doesn't need it all.