# Frontend Code Standards

*Read this document alongside [coding-standards.md](coding-standards.md) for universal development standards.*

**Note**: This document extends and sometimes overrides universal principles for React development patterns.

## Frontend Application Structure

```
src/
  types/              # Shared type definitions
    user-type.ts
    api-type.ts
  errors/             # Error classes (one per file)
    api-error.ts
    validation-error.ts
  utils/              # Pure functions (folder pattern - can import: types, other utils)
    date/
      date-util.ts
      format.ts
      parse.ts
    validation/
      validation-util.ts
      email.ts
      phone.ts
  api/                # External API calls (folder pattern - can import: types, utils, errors)
    user/
      user-api.ts
      user-api-get.ts
      user-api-create.ts
    payment/
      payment-api.ts
      payment-api-process.ts
      payment-api-refund.ts
  hooks/              # React state logic (can import: types, utils, api, errors)
    use-user.ts
    use-auth.ts
  components/         # UI components (can import: types, utils, hooks, api)
    UserProfile/
      UserProfile.tsx       # Public exports only
      UserProfileCard.tsx   # Only importable by things in the UserProfile folder
  pages/              # Route components (can import: components, hooks, api)
    UserPage.tsx
    DashboardPage.tsx
```

## Frontend-Specific Layer Responsibilities

```
pages (route handling)
    ↑
components (UI rendering only)
    ↑
hooks (state management, single Api/service call)
    ↑
api (external calls, endpoint orchestration)
    ↑
PURITY BOUNDARY
    ↑
errors (error classes, no side effects)
    ↑
utils (pure functions, no side effects)
    ↑
types (type definitions only)
```

## React Component Export Patterns

#### Component Files

- **One functional component export** (primary)
- Supporting types (props, etc.) specific to that component may be co-exported
- Always use `export const` arrow functions

```typescript
// ✅ CORRECT - Component file (arrow function syntax)
export type UserCardProps = { user: User; onClick: ({user}: { user: User }) => void };
export const UserCard = ({user, onClick}: UserCardProps) => {
    return <div onClick = {()
=>
    onClick({user})
}>
    {
        user.name
    }
    </div>
}
```

#### Component Module Structure

Each component gets its own folder with direct imports:

```typescript
// components/UserProfile/UserProfile.tsx
export const UserProfile = ({userId}: { userId: string }) => {
    const {user, loading} = useUser(userId)
    if (loading) return <div>Loading
...
    </div>
    return <div>{user?.name
}
    </div>
}

// Import directly from component file - no index.ts files
import {UserProfile} from './components/UserProfile/UserProfile'
// Never export internal files like UserProfileCard.tsx
```

## Frontend Naming Conventions

- **React Components**: `PascalCase` (e.g., `UserProfile.tsx`, `ShoppingCart.tsx`)
- **React Hooks**: `camelCase` (e.g., `useAuth.ts`, `useLocalStorage.ts`)
- **All other files**: `kebab-case` (e.g., `user-api.ts`, `date-formatter.ts`)

## Data Fetching Patterns

### All Data Through Hooks (Mandatory)

**Rule**: Components never call APIs directly - they get data through hooks.

```typescript
// ❌ AVOID - Direct Api calls in components
const UserProfile = ({userId}: { userId: string }) => {
    const [user, setUser] = useState(null)

    useEffect(() => {
        UserApi.getUser(userId).then(setUser)  // Wrong layer!
    }, [userId])

    return <div>{user?.name
}
    </div>
}

// ❌ AVOID - Inline fetch calls
const UserProfile = ({userId}: { userId: string }) => {
    const [user, setUser] = useState(null)

    useEffect(() => {
        fetch(`/api/users/${userId}`)  // Never do this!
            .then(r => r.json())
            .then(setUser)
    }, [userId])

    return <div>{user?.name
}
    </div>
}
```

## Hook Orchestration Boundaries

### Hooks: The API-Calling Layer for Components

**Key Principle**: Hooks ARE the API-calling layer. Hooks manage both the API calls AND the state around those calls.

```typescript
// ✅ CORRECT - Hook with complete error handling and options
export const useUser = (
    id: string,
    options?: {
        includeCompany?: boolean;
        includeRoles?: boolean;
        refreshInterval?: number;
    }
) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const fetchData = options?.includeCompany
            ? UserApi.getUserWithCompany(id)  // Single Api call
            : UserApi.getUser(id)

        fetchData
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false))
    }, [id, options])

    return {data, loading, error}
}

// ❌ AVOID - Hook orchestrating multiple Apis
export const useUserWithCompany = ({id}: { id: string }) => {
    const [user, setUser] = useState(null)
    const [company, setCompany] = useState(null)

    useEffect(() => {
        // Hook doing orchestration - wrong layer!
        fetchUser(id).then(userData => {
            setUser(userData)
            fetchCompany(userData.companyId).then(setCompany)
        })
    }, [id])

    return {user, company}
}
```

**Critical Rule**: If you write `await` twice in a hook, you're in the wrong layer.

### Api Layer: Endpoint Orchestration

```typescript
// api/user/user-api.ts - Handles multiple endpoint coordination
export const UserApi = {
    getUser: ({id}: { id: string }) => fetch(`/api/users/${id}`).then(r => r.json()),

    getUserWithCompany: async ({id}: { id: string }) => {
        const user = await fetch(`/api/users/${id}`).then(r => r.json())
        const company = await fetch(`/api/companies/${user.companyId}`).then(r => r.json())
        return {user, company}
    }
}
```

## Folder Pattern for Object Exports

All object export categories (`-util`, `-api`) must use the folder pattern.
See [coding-standards.md](coding-standards.md) for complete folder pattern specification.

**Frontend-Specific Structure:**

```
utils/
  date/
    date-util.ts                    # Main export aggregator (only importable file)
    format.ts             # Individual method implementation
    format.test.ts        # Individual method test
    parse.ts              # Another method
    parse.test.ts         # Its test

api/
  user/
    user-api.ts                     # Main export aggregator
    get.ts                 # Individual method implementation
    get.test.ts            # Individual method test
    create.ts              # Another method
    create.test.ts         # Its test
```

**Rules:**

1. Only the main export file can be imported by other modules
2. Each child file contains ONE exported function
3. Each child file has its own test file
4. Import only from main export: `import { UserApi } from '../api/user/user-api'`

## React State Management Anti-Patterns

```typescript
// 🚨 RED FLAGS - Fix these violations:

// Component with business logic
const UserProfile = () => {
    const calculateUserScore = ({user}: { user: User }) => {
        // Complex business logic in component! // Wrong layer!
    }
}

// Hook with complex orchestration
const useUserDashboard = () => {
    const user = await fetchUser()      // Multiple
    const company = await fetchCompany(user.companyId)  // Api calls
    const metrics = await calculateMetrics(user, company)  // Business logic
    // Hook doing too much!
}

// Component with direct state mutations
const UserForm = () => {
    const updateGlobalUserCache = () => {
        // Directly mutating app state from component! // Wrong layer!
    }
}
```

## File Organization Principles

### Extension Over Creation

**Rule**: Extend existing hooks with options instead of creating variants.

```typescript
// ❌ AVOID - Create variant hooks
// hooks/use-user-with-role.ts     // Don't create this!
// hooks/use-user-with-company.ts   // Don't create this!
// hooks/use-user-refreshing.ts     // Don't create this!
```

## React-Specific Dependency Rules

**Valid Import Patterns for Frontend:**

- `types/` → `types/` (type composition)
- `utils/[category]/[category]-util.ts` → `types/`, other `utils/` (pure functions)
- `api/[category]/[category]-api.ts` → `types/`, `utils/` (external calls)
- `hooks/` → `types/`, `utils/`, `api/` (React state)
- `components/` → `types/`, `utils/`, `hooks/`, `api/` (UI rendering)
- `pages/` → `types/`, `utils/`, `hooks/`, `api/`, `components/` (route handling)

**Critical Violations to Prevent:**

```typescript
// ❌ PURITY VIOLATIONS
// utils/ importing React hooks
import {useUser} from '../hooks/use-user'  // Utils must stay pure

// ❌ UPWARD DEPENDENCIES
// api/ importing React hooks
import {useAuth} from '../hooks/use-auth'  // Api doesn't use React state

// ❌ LATERAL VIOLATIONS
// Component importing another component's internals
import {formatUserData} from '../UserProfile/UserProfile.utils'  // Bypass public interface
```

## Component Architecture Patterns

### Container vs Presentation Pattern

**⚠️ WARNING: This pattern is usually overkill.** Most components should just use hooks directly.

**Only split when:**

- Complex reusable UI that needs multiple data sources
- Heavy business logic mixed with presentation
- Component needs extensive isolated testing

```typescript
// ✅ PREFERRED - Single component with hooks (most cases)
export const UserCard = ({userId}: { userId: User["id"] }) => {
    const {user, loading} = useUser(userId)
    const {editUser} = useUserActions()

    if (loading) return <div>Loading
...
    </div>

    return (
        <div>
            <h2>{user.name} < /h2>
        < button
    onClick = {()
=>
    editUser({user})
}>
    Edit < /button>
    < /div>
)
}

// ❌ OVERKILL - Split pattern (rare cases only)
export const UserCardView = ({user, onEdit}: {
    user: User;
    onEdit: ({user}: { user: User }) => void
}) => {
    return (
        <div>
            <h2>{user.name} < /h2>
        < button
    onClick = {()
=>
    onEdit({user})
}>
    Edit < /button>
    < /div>
)
}

export const UserCard = ({userId}: { userId: User["id"] }) => {
    const {user, loading} = useUser(userId)
    const {editUser} = useUserActions()

    if (loading) return <div>Loading
...
    </div>
    return <UserCardView user = {user}
    onEdit = {editUser}
    />
}
```

### Route Component Patterns

```typescript
// pages/UserPage.tsx - Route components coordinate, don't implement
export const UserPage = () => {
    const {userId} = useParams()
    const {user, loading, error} = useUser({userId})

    if (loading) return <PageLoader / >
    if (error) return <ErrorMessage error = {error}
    />
    if (!user) return <NotFound / >

    return (
        <PageLayout>
            <UserProfile userId = {userId}
    />
    < UserActions
    userId = {userId}
    />
    < /PageLayout>
)
}
```

## Frontend Error Handling

**Rule**: Hooks handle errors centrally, components just display error states.

```typescript
// ✅ CORRECT - Component displays error state from hook
export const UserProfile = ({userId}: { userId: string }) => {
    const {user, loading, error} = useUser(userId)

    if (loading) return <div>Loading
...
    </div>
    if (error) return <ErrorMessage error = {error}
    />  /
    / Presentation only
    return <div>{user?.name
}
    </div>
}
```