# Folder-Specific ESLint Rules Guide

This document explains the **11 folder-specific rules** that enforce unique patterns for each Dungeonmaster folder type.
These rules cannot be generalized into the shared config because they require custom AST analysis.

---

## Overview

**What's shared vs. what's unique:**

### ✅ **Shared Config (`folderConfigStatics`)** handles:

- File naming patterns (`-broker.ts`, `-transformer.ts`)
- Export naming patterns (`Broker`, `Transformer`)
- Folder depth (1 level vs 2 levels)
- Import restrictions (dependency graph)

### 🔧 **Folder-Specific Rules** handle:

- Library-specific patterns (Zod `.brand()`, React hooks)
- Type checking requirements (boolean returns, JSX.Element)
- Architectural patterns (multi-broker detection, orchestration)
- Purity enforcement (no async, no external calls)

---

## 1. `enforce-contracts-specific`

**Folder:** `src/contracts/`

**Purpose:** Ensure type-safe, validated data contracts using Zod schemas

### Rules Enforced:

#### ✅ **Must use `.brand<'Type'>()` on primitives**

Prevents primitive obsession, creates nominal types.

```typescript
// ❌ WRONG: Raw string/number (structural typing escape hatch)
export const emailContract = z.string().email();
export const ageContract = z.number().int();

// ✅ CORRECT: Branded types (nominal typing)
export const emailContract = z.string().email().brand<'EmailAddress'>();
export const ageContract = z.number().int().brand<'Age'>();
```

**Why?** Prevents `string` from being assignable to `EmailAddress` - compile-time safety.

---

#### ✅ **Stubs must validate with `.parse()`**

Test data must pass contract validation.

```typescript
// ❌ WRONG: Type assertion (bypasses validation)
export const UserStub = (props: Partial<User> = {}): User => {
    return {id: 'test-id' as UserId, ...props}; // Type escape hatch!
};

// ✅ CORRECT: Contract validation (runtime safety)
export const UserStub = (props: Partial<User> = {}): User => {
    return userContract.parse({
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        ...props
    });
};
```

**Why?** Ensures test data is valid and conforms to actual schema.

---

#### ✅ **Stub naming: PascalCase + `Stub`**

```typescript
// ❌ WRONG
export const userStub = () => {
}; // camelCase
export const UserFactory = () => {
}; // Wrong suffix
export const createUser = () => {
}; // Wrong pattern

// ✅ CORRECT
export const UserStub = (props: Partial<User> = {}): User => {
    return userContract.parse({ /* ... */});
};
```

**Why?** Distinguishes stubs from contracts, follows naming convention.

---

### Implementation Details:

**AST Checks Required:**

- Detect Zod `.brand()` method calls
- Detect `.parse()` method calls in stub functions
- Validate stub naming pattern: `^[A-Z][a-zA-Z0-9]*Stub$`

**Can't use shared config because:** Requires library-specific API detection (Zod methods).

---

## 2. `enforce-guards-specific`

**Folder:** `src/guards/`

**Purpose:** Ensure pure, boolean-returning guard functions

### Rules Enforced:

#### ✅ **Must return boolean**

```typescript
// ❌ WRONG: No return type
export const hasPermissionGuard = ({user}) => {
    return user.role === 'admin';
};

// ❌ WRONG: Returns string
export const hasPermissionGuard = ({user}: { user: User }): string => {
    return user.role;
};

// ✅ CORRECT: Explicit boolean
export const hasPermissionGuard = ({user}: { user: User }): boolean => {
    return user.role === 'admin';
};
```

**Why?** Guards are decision functions - must return yes/no.

---

#### ✅ **No async functions (purity enforcement)**

```typescript
// ❌ WRONG: Async guard (impure!)
export const hasPermissionGuard = async ({user}: { user: User }): Promise<boolean> => {
    const perms = await fetchPermissions(user.id); // Side effect!
    return perms.includes('admin');
};

// ✅ CORRECT: Pure, synchronous
export const hasPermissionGuard = ({user}: { user: User }): boolean => {
    return user.permissions.includes('admin'); // Pure logic only
};
```

**Why?** Guards must be predictable - same input = same output, no side effects.

---

#### ✅ **Name must start with is/has/can/should/will/was**

```typescript
// ❌ WRONG: Doesn't start with boolean prefix
export const checkPermissionGuard = (): boolean => {
};
export const permissionGuard = (): boolean => {
};
export const validatePermission = (): boolean => {
};

// ✅ CORRECT: Boolean prefixes
export const hasPermissionGuard = (): boolean => {
};
export const isAdminGuard = (): boolean => {
};
export const canEditGuard = (): boolean => {
};
export const shouldShowGuard = (): boolean => {
};
export const willExpireGuard = (): boolean => {
};
export const wasDeletedGuard = (): boolean => {
};
```

**Why?** Self-documenting - name indicates boolean return.

---

### Implementation Details:

**AST Checks Required:**

- TypeScript type checker to validate return type is `boolean`
- Detect `async` keyword on function declarations
- Regex pattern matching: `^(is|has|can|should|will|was)[A-Z][a-zA-Z0-9]*Guard$`

**Can't use shared config because:** Requires TypeScript type analysis for return types.

---

## 3. `enforce-transformers-specific`

**Folder:** `src/transformers/`

**Purpose:** Ensure pure data transformation functions

### Rules Enforced:

#### ✅ **Cannot return boolean**

```typescript
// ❌ WRONG: Boolean return (should be in guards/)
export const isValidTransformer = ({email}: { email: string }): boolean => {
    return /^[^\s@]+@/.test(email);
};

// ✅ CORRECT: Non-boolean transformation
export const formatEmailTransformer = ({email}: { email: string }): EmailAddress => {
    return emailContract.parse(email.toLowerCase());
};

export const emailToDomainTransformer = ({email}: { email: string }): string => {
    return email.split('@')[1];
};
```

**Why?** Separates concerns - transformers transform data, guards check conditions.

---

#### ✅ **No async functions (purity enforcement)**

```typescript
// ❌ WRONG: Async (should be in brokers/)
export const userToDtoTransformer = async ({user}: { user: User }): Promise<UserDto> => {
    const avatar = await fetchAvatar(user.id); // Side effect!
    return {...user, avatar};
};

// ✅ CORRECT: Pure, synchronous
export const userToDtoTransformer = ({user}: { user: User }): UserDto => {
    return userDtoContract.parse({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl // Use existing data
    });
};
```

**Why?** Transformers must be predictable and testable - no I/O.

---

#### ✅ **Must have explicit return type**

```typescript
// ❌ WRONG: No return type (type inference can mislead)
export const formatDateTransformer = ({date}) => {
    return date.toISOString();
};

// ✅ CORRECT: Explicit return type
export const formatDateTransformer = ({date}: { date: Date }): DateString => {
    return dateStringContract.parse(date.toISOString());
};
```

**Why?** Transformers are about type conversion - be explicit about output.

---

### Implementation Details:

**AST Checks Required:**

- TypeScript type checker to validate return type is NOT `boolean`
- Detect `async` keyword on function declarations
- Check for explicit return type annotation on exports

**Can't use shared config because:** Requires TypeScript type analysis + boolean exclusion.

---

## 4. `enforce-errors-specific`

**Folder:** `src/errors/`

**Purpose:** Ensure proper Error class patterns

### Rules Enforced:

#### ✅ **Must extend Error**

```typescript
// ❌ WRONG: Doesn't extend Error
export class ValidationError {
    constructor({message}: { message: string }) {
        this.message = message;
    }
}

// ✅ CORRECT: Extends Error
export class ValidationError extends Error {
    public field?: string;

    constructor({message, field}: { message: string; field?: string }) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}
```

**Why?** Error detection (`instanceof Error`) and stack traces require inheritance.

---

#### ✅ **Must use `export class` (not `export const`)**

```typescript
// ❌ WRONG: Using const (anti-pattern)
export const ValidationError = class extends Error {
    constructor({message}: { message: string }) {
        super(message);
    }
};

// ✅ CORRECT: Using class declaration
export class ValidationError extends Error {
    constructor({message}: { message: string }) {
        super(message);
        this.name = 'ValidationError';
    }
}
```

**Why?** Class declarations are clearer and support proper hoisting.

---

#### ✅ **Constructor must use object destructuring**

```typescript
// ❌ WRONG: Positional parameters
export class ValidationError extends Error {
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

// ✅ CORRECT: Object destructuring
export class ValidationError extends Error {
  public field?: string;

  constructor({message, field}: {message: string; field?: string}) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

**Why?** Consistency with project standard - all functions use object params.

---

#### ✅ **Must set `this.name` property**

```typescript
// ❌ WRONG: Missing this.name
export class ValidationError extends Error {
  constructor({message}: {message: string}) {
    super(message);
  }
}

// ✅ CORRECT: Sets this.name
export class ValidationError extends Error {
  constructor({message}: {message: string}) {
    super(message);
    this.name = 'ValidationError'; // ← Required!
  }
}
```

**Why?** Error name appears in stack traces and error messages - must be explicit.

---

### Implementation Details:

**AST Checks Required:**

- Detect class heritage clause (`extends Error`)
- Detect `export class` vs `export const`
- Check constructor parameters are ObjectPattern
- Detect `this.name =` assignment in constructor body

**Can't use shared config because:** Requires class hierarchy and constructor body analysis.

---

## 5. `enforce-widgets-specific`

**Folder:** `src/widgets/` (React components)

**Purpose:** Ensure React component best practices

### Rules Enforced:

#### ✅ **Must use `.tsx` extension**

```typescript
// ❌ WRONG: user-card-widget.ts (no JSX support)
export const UserCardWidget = () => {
    return <div>Card < /div>; /
    / TypeScript error!
};

// ✅ CORRECT: user-card-widget.tsx
export const UserCardWidget = (): JSX.Element => {
    return <div>Card < /div>;
};
```

**Why?** TypeScript requires `.tsx` for JSX syntax.

---

#### ✅ **Must return JSX.Element**

```typescript
// ❌ WRONG: Returns string
export const UserCardWidget = (): string => {
    return 'Hello';
};

// ❌ WRONG: No return type
export const UserCardWidget = () => {
    return <div>Hello < /div>;
};

// ✅ CORRECT: Returns JSX.Element
export const UserCardWidget = (): JSX.Element => {
    return <div>Hello < /div>;
};
```

**Why?** Widgets are UI components - must return renderable JSX.

---

#### ✅ **Must export `[Name]WidgetProps` type**

```typescript
// ❌ WRONG: No props type export
export const UserCardWidget = ({userId}: {userId: string}): JSX.Element => {
  return <div>{userId}</div>;
};

// ❌ WRONG: Wrong naming
export type UserCardProps = { userId: string };
export type Props = { userId: string };

// ✅ CORRECT: Exports props type with correct name
export type UserCardWidgetProps = {
  userId: string;
  onEdit?: () => void;
};

export const UserCardWidget = ({userId, onEdit}: UserCardWidgetProps): JSX.Element => {
  return <div>{userId}</div>;
};
```

**Why?** Props types can be reused by parent components for type safety.

---

#### ✅ **No bindings (hooks) in event handlers**

```typescript
// ❌ WRONG: Hook in event handler (React violation!)
export const UserCardWidget = (): JSX.Element => {
    const handleClick = () => {
        const {data} = useUserDataBinding({id: '123'}); // Breaks rules of hooks!
    };

    return <button onClick = {handleClick} > Click < /button>;
};

// ✅ CORRECT: Hooks in render phase only
export const UserCardWidget = (): JSX.Element => {
    const {data} = useUserDataBinding({id: '123'}); // Render phase ✓

    const handleClick = () => {
        console.log(data); // Use hook data ✓
    };

    return <button onClick = {handleClick} > Click < /button>;
};
```

**Why?** React hooks must be called unconditionally at top level of component.

---

#### ✅ **No brokers in render phase**

```typescript
// ❌ WRONG: Broker in render (side effect!)
export const UserCardWidget = (): JSX.Element => {
    const user = userFetchBroker({id: '123'}); // Side effect in render!
    return <div>{user.name} < /div>;
};

// ✅ CORRECT: Broker in event handler or useEffect
export const UserCardWidget = (): JSX.Element => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        userFetchBroker({id: '123'}).then(setUser); // useEffect ✓
    }, []);

    const handleRefresh = async () => {
        const data = await userFetchBroker({id: '123'}); // Event handler ✓
        setUser(data);
    };

    return (
        <div>
            {user?.name
}
    <button onClick = {handleRefresh} > Refresh < /button>
        < /div>
)
    ;
};
```

**Why?** Render phase must be pure - side effects belong in useEffect or handlers.

---

#### ✅ **Sub-component import restrictions**

```typescript
// widgets/user-card/user-card-widget.tsx
export const UserCardWidget = (): JSX.Element => { /* ... */
};

// widgets/user-card/avatar-widget.tsx (sub-component)
export const AvatarWidget = ({url}: { url: string }): JSX.Element => { /* ... */
};

// ❌ WRONG: Importing sub-component from outside folder
// In widgets/profile/profile-widget.tsx:
import {AvatarWidget} from '../user-card/avatar-widget'; // Private to user-card!

// ✅ CORRECT: Import main widget only
// In widgets/profile/profile-widget.tsx:
import {UserCardWidget} from '../user-card/user-card-widget'; // Public API

// ✅ CORRECT: Import sub-component within same folder
// In widgets/user-card/user-card-widget.tsx:
import {AvatarWidget} from './avatar-widget'; // Same folder ✓
```

**Why?** Sub-components are implementation details - only main widget is public.

---

### Implementation Details:

**AST Checks Required:**

- File extension validation (`.tsx`)
- TypeScript type checker for JSX.Element return type
- Check for exported type matching `^[A-Z][a-zA-Z0-9]*WidgetProps$`
- Detect hook calls (`use*`) inside function declarations within component
- Detect broker calls (ending with `Broker`) in component body (not in handlers/useEffect)
- Import path analysis for sub-component restrictions

**Can't use shared config because:** React-specific patterns, JSX validation, complex hook rules.

---

## 6. `enforce-responders-specific`

**Folder:** `src/responders/`

**Purpose:** Ensure responders orchestrate properly without business logic duplication

### Rules Enforced:

#### ✅ **Cannot call multiple brokers (orchestration detection)**

```typescript
// ❌ WRONG: Multiple broker calls (orchestration belongs in brokers/)
export const UserCreateResponder = async ({req, res}: { req: Request; res: Response }) => {
    const user = await userCreateBroker({data: req.body}); // Broker 1
    await emailSendBroker({to: user.email, template: 'welcome'}); // Broker 2
    await analyticsTrackBroker({event: 'user_created'}); // Broker 3
    res.json(user);
};

// ✅ CORRECT: Single broker call (orchestration moved to broker layer)
export const UserCreateResponder = async ({req, res}: { req: Request; res: Response }) => {
    const user = await userSignupProcessBroker({data: req.body}); // Orchestration broker
    res.json(user);
};
```

**Why?** Business logic orchestration belongs in brokers/, responders just wire to routes.

---

#### ✅ **Can only be imported by flows/**

```typescript
// ❌ WRONG: Imported from brokers/
// In brokers/user/create/user-create-broker.ts:
import {UserCreateResponder} from '../../../responders/user/create/user-create-responder';

// ❌ WRONG: Imported from widgets/
// In widgets/user-form/user-form-widget.tsx:
import {UserCreateResponder} from '../../../responders/user/create/user-create-responder';

// ✅ CORRECT: Imported from flows/
// In flows/user/user-flow.ts:
import {UserCreateResponder} from '../../responders/user/create/user-create-responder';

app.post('/users', UserCreateResponder);
```

**Why?** Responders are route handlers - only flows/ should wire them to routes.

---

#### ✅ **Framework-specific signatures**

```typescript
// For Express backend:
// ❌ WRONG: No framework parameters
export const UserGetResponder = (userId: string) => {
};

// ❌ WRONG: Positional parameters
export const UserGetResponder = (req: Request, res: Response) => {
};

// ✅ CORRECT: Express signature with object destructuring
export const UserGetResponder = async ({req, res}: { req: Request; res: Response }) => {
    const userId = req.params.id;
    const user = await userFetchBroker({userId});
    res.json(user);
};

// For React frontend:
// ❌ WRONG: No return type
export const UserProfileResponder = () => {
    return <div>Profile < /div>;
};

// ✅ CORRECT: React signature (returns JSX.Element)
export const UserProfileResponder = (): JSX.Element => {
    return <div>Profile < /div>;
};
```

**Why?** Framework determines responder signature - must match conventions.

---

### Implementation Details:

**AST Checks Required:**

- Count broker function calls (functions ending with `Broker`) - max 1
- Analyze all imports of responder files - must originate from `flows/` folder
- Framework detection (from config) to validate signature patterns

**Can't use shared config because:** Requires function call counting and cross-file import analysis.

---

## 7. `enforce-bindings-specific`

**Folder:** `src/bindings/` (React hooks)

**Purpose:** Ensure bindings (hooks) follow single-responsibility and React patterns

### Rules Enforced:

#### ✅ **Maximum 1 await expression**

```typescript
// ❌ WRONG: Multiple awaits (orchestration belongs in brokers/)
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const user = await userFetchBroker({userId}); // Await 1
            const company = await companyFetchBroker({companyId: user.companyId}); // Await 2
            setData({user, company});
            setLoading(false);
        };
        load();
    }, [userId]);

    return {data, loading};
};

// ✅ CORRECT: Single await (or call orchestration broker)
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userFetchBroker({userId}) // Single broker call
            .then(setData)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading};
};

// ✅ ALSO CORRECT: Call orchestration broker
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userWithCompanyFetchBroker({userId}) // Orchestration broker (1 await)
            .then(setData)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading};
};
```

**Why?** Multiple async operations = orchestration. Bindings should be thin wrappers.

---

#### ✅ **Must return `{data, loading, error}` for async**

```typescript
// ❌ WRONG: Returns only data
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        userFetchBroker({userId}).then(setData);
    }, [userId]);

    return data; // Missing loading, error states
};

// ❌ WRONG: Different pattern
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    return {user, isLoading}; // Inconsistent naming
};

// ✅ CORRECT: Standard async pattern
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        userFetchBroker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error}; // Complete async pattern
};
```

**Why?** Consistent pattern makes bindings predictable and composable.

---

#### ✅ **Name must start with `use`**

```typescript
// ❌ WRONG: Doesn't start with 'use' (not a hook)
export const userDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);
    // ...
};

export const getUserData = ({userId}: { userId: string }) => {
    // ...
};

// ✅ CORRECT: Hook naming convention
export const useUserDataBinding = ({userId}: { userId: string }) => {
    const [data, setData] = useState(null);
    // ...
    return {data, loading, error};
};
```

**Why?** React requires hooks to start with `use` for rules of hooks linting.

---

### Implementation Details:

**AST Checks Required:**

- Count `AwaitExpression` nodes within binding function - max 1
- Validate return statement has object with `data`, `loading`, `error` properties
- Check function name pattern: `^use[A-Z][a-zA-Z0-9]*Binding$`

**Can't use shared config because:** Requires AST traversal for await count and return shape analysis.

---

## 8. `enforce-state-specific`

**Folder:** `src/state/`

**Purpose:** Ensure state is pure, in-memory storage with no side effects

### Rules Enforced:

#### ✅ **Must export as object or class instance (not standalone function)**

```typescript
// ❌ WRONG: Standalone function (this is a utility, not state!)
export const userCacheState = (id: string): User | null => {
    return cache.get(id);
};

// ❌ WRONG: Exported function that creates state
export const userCacheState = () => {
    return {
        cache: new Map(),
        get: (id: string) => {
        }
    };
};

// ✅ CORRECT: Object with methods (singleton state)
export const userCacheState = {
    cache: new Map<string, User>(),
    get: ({id}: { id: string }): User | null => {
        return userCacheState.cache.get(id) ?? null;
    },
    set: ({id, user}: { id: string; user: User }): void => {
        userCacheState.cache.set(id, user);
    },
    clear: (): void => {
        userCacheState.cache.clear();
    }
};

// ✅ ALSO CORRECT: Class instance
class UserCache {
    private cache = new Map<string, User>();

    public get({id}: { id: string }): User | null {
        return this.cache.get(id) ?? null;
    }

    public set({id, user}: { id: string; user: User }): void {
        this.cache.set(id, user);
    }
}

export const userCacheState = new UserCache();
```

**Why?** State should be a persistent object/instance, not a function call.

---

#### ✅ **No external calls (fetch, db, etc.)**

```typescript
// ❌ WRONG: External API call (should be in brokers/)
export const userCacheState = {
    async get({id}: { id: string }): Promise<User> {
        return await fetch(`/api/users/${id}`); // I/O operation!
    }
};

// ❌ WRONG: Database access (should be in brokers/)
export const userCacheState = {
    async get({id}: { id: string }): Promise<User> {
        return await db.users.findById(id); // Database call!
    }
};

// ✅ CORRECT: Pure in-memory operations
export const userCacheState = {
    cache: new Map<string, User>(),
    get: ({id}: { id: string }): User | null => {
        return userCacheState.cache.get(id) ?? null; // Memory only ✓
    }
};
```

**Why?** State is for storage, not business logic. I/O belongs in brokers/.

---

#### ✅ **Pure in-memory only**

```typescript
// ❌ WRONG: File system access (should be in adapters/)
export const configState = {
    load: (): Config => {
        return JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    }
};

// ❌ WRONG: localStorage access (should be in adapters/)
export const sessionState = {
    get: (): Session => {
        return JSON.parse(localStorage.getItem('session'));
    }
};

// ✅ CORRECT: In-memory storage only
export const configState = {
    data: {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 3
    },
    get: (): Config => {
        return configState.data;
    },
    update: ({config}: { config: Partial<Config> }): void => {
        configState.data = {...configState.data, ...config};
    }
};
```

**Why?** State/ is for pure storage. External storage (files, localStorage) goes through adapters/.

---

### Implementation Details:

**AST Checks Required:**

- Validate export is ObjectExpression or NewExpression (class instance), not ArrowFunctionExpression
- Detect external calls: `fetch()`, `axios.*`, `fs.*`, `localStorage.*`, `db.*`
- Detect `async` keyword or `AwaitExpression` nodes

**Can't use shared config because:** Requires detecting I/O patterns and export shape analysis.

---

## 9. `enforce-statics-specific`

**Folder:** `src/statics/`

**Purpose:** Ensure statics are immutable, foundational configuration

### Rules Enforced:

#### ✅ **Root object structure (no primitives at root level)**

```typescript
// ❌ WRONG: Primitives at root level (flat structure)
export const userStatics = {
    maxAge: 100,      // Primitive at root!
    minAge: 18,       // Primitive at root!
    defaultRole: 'user' // Primitive at root!
} as const;

// ✅ CORRECT: Objects at root (organized structure)
export const userStatics = {
    limits: {          // Object wrapper ✓
        maxAge: 100,
        minAge: 18
    },
    roles: {           // Object wrapper ✓
        default: 'user',
        admin: 'admin'
    },
    validation: {      // Object wrapper ✓
        minPasswordLength: 8,
        maxLoginAttempts: 3
    }
} as const;
```

**Why?** Enforces organization - statics should be categorized, not flat.

---

#### ✅ **Must use `as const`**

```typescript
// ❌ WRONG: Missing as const (values are mutable)
export const userStatics = {
    roles: {
        admin: 'admin',
        user: 'user'
    }
};

// Type is: { roles: { admin: string; user: string } }
// Values can change at runtime!

// ✅ CORRECT: as const assertion (readonly, literal types)
export const userStatics = {
    roles: {
        admin: 'admin',
        user: 'user'
    }
} as const;

// Type is: { readonly roles: { readonly admin: 'admin'; readonly user: 'user' } }
// Values are literal types - compile-time constants!
```

**Why?** Statics must be immutable - `as const` provides compile-time guarantees.

---

#### ✅ **No imports allowed**

```typescript
// ❌ WRONG: Importing from other modules
import {DEFAULT_TIMEOUT} from '../config/timeout-config';
import {API_URL} from '../config/api-config';

export const apiStatics = {
    config: {
        timeout: DEFAULT_TIMEOUT,
        url: API_URL
    }
} as const;

// ✅ CORRECT: Self-contained (no dependencies)
export const apiStatics = {
    config: {
        timeout: 5000,
        url: 'https://api.example.com'
    },
    endpoints: {
        users: '/users',
        posts: '/posts'
    }
} as const;
```

**Why?** Statics are foundational layer - no dependencies allowed (circular dep prevention).

---

### Implementation Details:

**AST Checks Required:**

- Traverse object properties - ensure root values are ObjectExpression or ArrayExpression (not Literal)
- Check for `as const` TSAsExpression
- Detect any ImportDeclaration nodes in file

**Can't use shared config because:** Requires object shape analysis and import detection.

---

## 10. `enforce-adapters-specific`

**Folder:** `src/adapters/`

**Purpose:** Ensure adapters wrap external packages consistently

### Rules Enforced:

#### ✅ **Must import at least one external package**

```typescript
// ❌ WRONG: No external package import
// In adapters/axios/axios-get.ts
import {httpConfig} from '../../config/http-config'; // Internal only!

export const axiosGet = ({url}: { url: string }) => {
    return fetch(url); // Not wrapping axios!
};

// ✅ CORRECT: Wraps external package
// In adapters/axios/axios-get.ts
import axios from 'axios'; // ← External package ✓

export const axiosGet = ({url}: { url: string }) => {
    return axios.get(url, {timeout: 5000});
};
```

**Why?** Adapters exist to wrap external packages - must import at least one.

---

#### ✅ **Naming must match package API (not business domain)**

```typescript
// ❌ WRONG: Business domain naming
// adapters/stripe/payment.ts  ← Business term!
import Stripe from 'stripe';

export const payment = ({amount}: { amount: number }) => {
    return stripe.charges.create({amount});
};

// ❌ WRONG: Generic naming
// adapters/stripe/create.ts  ← Too generic!
export const create = ({amount}: { amount: number }) => {
    return stripe.charges.create({amount});
};

// ✅ CORRECT: Package API naming
// adapters/stripe/stripe-charges-create.ts  ← Stripe's API ✓
import Stripe from 'stripe';

export const stripeChargesCreate = ({
                                        amount,
                                        currency
                                    }: {
    amount: number;
    currency: string;
}) => {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    return stripe.charges.create({amount, currency});
};
```

**Why?** Adapters mirror external APIs - naming should reflect package, not domain.

---

#### ✅ **Folder naming for scoped packages**

```typescript
// ❌ WRONG: Invalid folder name (can't have @ in path)
// adapters/@aws-sdk/client-s3/s3-upload.ts
import {S3Client} from '@aws-sdk/client-s3';

// ❌ WRONG: Using slashes
// adapters/@aws-sdk/client-s3/upload.ts

// ✅ CORRECT: Transform @ and / to hyphens
// adapters/aws-sdk-client-s3/aws-sdk-client-s3-upload.ts
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';

export const awsSdkClientS3Upload = ({
                                         bucket,
                                         key,
                                         body
                                     }: {
    bucket: string;
    key: string;
    body: Buffer;
}) => {
    const client = new S3Client({region: 'us-east-1'});
    return client.send(new PutObjectCommand({Bucket: bucket, Key: key, Body: body}));
};
```

**Transformation rules:**

- `@aws-sdk/client-s3` → `aws-sdk-client-s3/`
- `@stripe/stripe-js` → `stripe-stripe-js/`
- `lodash.debounce` → `lodash-debounce/`

**Why?** File systems don't allow `@` in paths - normalize to kebab-case.

---

### Implementation Details:

**AST Checks Required:**

- Check for at least one ImportDeclaration from external package (not starting with `./` or `../`)
- Validate export name correlates with package name (requires package.json lookup)
- Validate folder name matches transformed package name

**Can't use shared config because:** Requires import source analysis and package name correlation.

---

## 11. `enforce-middleware-specific`

**Folder:** `src/middleware/`

**Purpose:** Ensure middleware orchestrates multiple adapters (infrastructure concern)

### Rules Enforced:

#### ✅ **Must import 2+ adapters (orchestration pattern)**

```typescript
// ❌ WRONG: Only 1 adapter (should be in adapters/ instead)
import {winstonLog} from '../../adapters/winston/winston-log';

export const loggingMiddleware = async ({
                                            message
                                        }: {
    message: string;
}): Promise<void> => {
    await winstonLog({level: 'info', message});
};

// ✅ CORRECT: Combines 2+ adapters (infrastructure orchestration)
import {winstonLog} from '../../adapters/winston/winston-log';
import {prometheusIncrementCounter} from '../../adapters/prometheus/prometheus-increment-counter';

export const httpTelemetryMiddleware = async ({
                                                  method,
                                                  url,
                                                  statusCode
                                              }: {
    method: string;
    url: string;
    statusCode: number;
}): Promise<void> => {
    // Orchestrate multiple infrastructure concerns
    await winstonLog({
        level: 'info',
        message: `${method} ${url} - ${statusCode}`
    });

    await prometheusIncrementCounter({
        name: 'http_requests_total',
        labels: {method, status: statusCode.toString()}
    });
};
```

**Why?** Middleware is for infrastructure orchestration. Single adapter = should be adapter itself.

---

### Real-World Examples:

```typescript
// ✅ Authentication middleware (JWT + Session + Logging)
import {jwtVerify} from '../../adapters/jsonwebtoken/jsonwebtoken-verify';
import {redisGet} from '../../adapters/redis/redis-get';
import {winstonLog} from '../../adapters/winston/winston-log';

export const authMiddleware = async ({token}: { token: string }) => {
    const payload = await jwtVerify({token, secret: process.env.JWT_SECRET});
    const session = await redisGet({key: `session:${payload.userId}`});
    await winstonLog({level: 'info', message: `Auth: ${payload.userId}`});

    return {userId: payload.userId, session};
};

// ✅ Rate limiting middleware (Redis + Metrics + Logging)
import {redisIncrementExpire} from '../../adapters/redis/redis-increment-expire';
import {prometheusIncrementCounter} from '../../adapters/prometheus/prometheus-increment-counter';
import {winstonLog} from '../../adapters/winston/winston-log';

export const rateLimitMiddleware = async ({ip}: { ip: string }) => {
    const count = await redisIncrementExpire({key: `rate:${ip}`, ttl: 60});
    await prometheusIncrementCounter({name: 'rate_limit_checks'});

    if (count > 100) {
        await winstonLog({level: 'warn', message: `Rate limit exceeded: ${ip}`});
        throw new Error('Rate limit exceeded');
    }
};
```

---

### Implementation Details:

**AST Checks Required:**

- Count ImportDeclaration nodes where source path matches `adapters/` - must be >= 2

**Can't use shared config because:** Requires import counting from specific folder.

---

## Summary Table: Why These Rules Can't Be Generalized

| Rule             | Unique Check                | Requires Custom AST Analysis For...               |
|------------------|-----------------------------|---------------------------------------------------|
| **contracts**    | `.brand<>()` detection      | Zod-specific API usage (method chaining)          |
| **guards**       | Must return boolean         | TypeScript type checking (return type validation) |
| **transformers** | Cannot return boolean       | TypeScript type checking (return type exclusion)  |
| **errors**       | Must extend Error           | Class heritage clause analysis                    |
| **widgets**      | React-specific (hooks, JSX) | Framework-specific patterns (JSX, hook rules)     |
| **responders**   | Multi-broker detection      | Function call counting (broker invocations)       |
| **bindings**     | Max 1 await                 | AST traversal for AwaitExpression count           |
| **state**        | No external calls           | I/O pattern detection (fetch, db, fs)             |
| **statics**      | Root structure analysis     | Object shape inspection (nested depth)            |
| **adapters**     | External package detection  | Import source analysis (node_modules vs relative) |
| **middleware**   | 2+ adapter count            | Import counting from specific folder              |

---

## Testing Strategy for Folder-Specific Rules

Each rule should have comprehensive test coverage:

### Valid Cases (Should Pass)

```typescript
describe('enforce-contracts-specific', () => {
    const ruleTester = new RuleTester({
        parser: require.resolve('@typescript-eslint/parser'),
    });

    ruleTester.run('enforce-contracts-specific', rule, {
        valid: [
            {
                code: `
          export const emailContract = z.string().email().brand<'EmailAddress'>();
        `,
                filename: 'src/contracts/email/email-contract.ts',
            },
            {
                code: `
          export const UserStub = (props: Partial<User> = {}): User => {
            return userContract.parse({ id: 'test', ...props });
          };
        `,
                filename: 'src/contracts/user/user.stub.ts',
            },
        ],
        // ...
    });
});
```

### Invalid Cases (Should Fail)

```typescript
invalid: [
    {
        code: `
      export const emailContract = z.string().email(); // Missing .brand()
    `,
        filename: 'src/contracts/email/email-contract.ts',
        errors: [{
            messageId: 'missingBrand',
            data: {schema: 'emailContract'}
        }],
    },
    {
        code: `
      export const UserStub = (): User => {
        return { id: 'test' as UserId }; // Type assertion instead of .parse()
      };
    `,
        filename: 'src/contracts/user/user.stub.ts',
        errors: [{
            messageId: 'stubMustUseParse',
            data: {stub: 'UserStub'}
        }],
    },
]
```

---

## Performance Considerations

**Early Exit Pattern:**
All folder-specific rules should exit early if not in target folder:

```typescript
export const enforceContractsSpecificRuleBroker = (): Rule.RuleModule => ({
    meta: { /* ... */},
    create: (context: Rule.RuleContext) => {
        const folderType = getCachedFolderType(context.filename); // Memoized!

        // ✅ Early exit - zero overhead for other folders
        if (folderType !== 'contracts') {
            return {}; // No AST visitors registered
        }

        // Only run expensive checks for contracts/
        return {
            CallExpression: (node) => {
                // Check for .brand() usage...
            }
        };
    }
});
```

**Performance Impact:**

- **In target folder:** Full AST traversal (necessary)
- **In other folders:** ~0ms overhead (early exit)
- **Result:** Folder-specific rules are "free" for 13/14 folder types

---

## Conclusion

These 11 folder-specific rules enforce architectural patterns that **cannot be expressed in simple configuration**. They
require:

- Library-specific API detection (Zod, React)
- TypeScript type analysis (return types, JSX)
- Complex AST patterns (function call counting, import analysis)
- Cross-file validation (import restrictions)

Together with the universal config-driven rules, they provide comprehensive enforcement of the Dungeonmaster
architecture.
