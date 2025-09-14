# Coding Principles

## Architecture Principles

- Design components/modules with single, clear responsibilities
- Consolidate similar functionality - avoid multiple solutions for one problem
- Complete all aspects of a task: passing tests, no TypeScript errors, no linting warnings
- **Verify frequently**: Run `npm run lint` and `npm run typecheck` after each significant change to catch issues early
- Handle edge cases and error conditions appropriately for the context

## TypeScript & Type Safety

### Core Principles

- This repo and all typescript files, both implementation and testing, MUST be strictly typed. The following usages
  violates that principle:
    - `as any` / `var: any`: There is always a type you can use in place of `any`
    - `@ts-ignore` / `@ts-expect-error`: These suppress typescript and jeopardizes the integrity of the codebase
    - `eslint-disabled`: Lint is as critical as typescript types and must be followed
- Use existing types from the codebase when available. Make new types when needed
- For uncertain data (including catch variables), use `unknown` and prove its shape through guards
- Fix type errors at their source. Never suppress with `@ts-ignore` or `@ts-expect-error`
- Let TypeScript infer types when values are clear. Add explicit types for:
    - Empty arrays and objects
    - Ambiguous values

For any conflicts between lint/typescript and successful implementation, notify the user to make a decision call.

### Type Guards & Validation

```typescript
// Handle unknown data safely
try {
    await apiCall();
} catch (error: unknown) {
    if (error instanceof Error) {
        // Backend: use logger.error(error.message)
        // Frontend: console.error or error service
        // Library: throw/return, let consumer handle
        console.error(error.message);
    }
}

// Check array/object access
if (users[index]) {
    return users[index].name;
}

// Handle null/undefined explicitly
function getUsername({user}: { user: User | null }): string {
    if (!user) return 'Anonymous';
    return `${user.firstName} ${user.lastName}`;
}
```

### Type Assertions

Use type assertions only when you have information the compiler lacks:

```typescript
// ✅ CORRECT - You know the type from external source
const data = JSON.parse(response) as ApiResponse;

// ❌ AVOID - Fighting TypeScript's inference
const count = (items.length as number) + 1;
```

### Type Patterns

- Store all data structures (types and interfaces) in `src/types` - these are shapes passed between modules
- Keep function parameter types inline where they're used, not in `src/types`
- Use `type` for function arguments, unions, intersections, and utility type operations
- Use `interface` when you need to extend/implement contracts or for public API boundaries
- Use TypeScript utility types (`Pick`, `Omit`, `Partial`, etc.) instead of redefining:

```typescript
type User = { id: string; firstName: string; lastName: string; email: string };
type UserSummary = Pick<User, 'id' | 'firstName' | 'lastName'>;
type PublicUser = Omit<User, 'email'>;
type UserUpdate = Partial<User>;
```

## Async/Await & Concurrency

### Promise Handling

- Always use async/await over `.then()` chains for readability
- Handle errors at the appropriate level - not every async call needs try/catch
- Use `Promise.all()` for parallel operations, await sequentially only when dependent

```typescript
// ✅ CORRECT - Parallel when independent
const [user, config, permissions] = await Promise.all([
    fetchUser(id),
    loadConfig(),
    getPermissions(id)
]);

// ❌ AVOID - Sequential when could be parallel
const user = await fetchUser(id);
const config = await loadConfig();
const permissions = await getPermissions(id);
```

### Avoiding Race Conditions

- Never mutate shared state from async operations without proper synchronization
- Use local variables or immutable updates in concurrent code
- Be explicit about operation order when it matters

```typescript
// ✅ CORRECT - Atomic operations or proper state management
const results = await Promise.all(items.map(async (item) => {
    const processed = await processItem(item);
    return {id: item.id, result: processed};
}));
// Then update state once with all results
setState(results); // React example - backend would persist to DB

// ❌ AVOID - Race condition with shared state
let counter = 0;

async function increment() {
    const current = counter;
    await someAsyncOp();
    counter = current + 1; // Another call may have changed counter
}
```

## Error Handling & Security

### Error Handling
- Handle errors explicitly for every operation that can fail
- Never silently swallow errors - always log, throw, or handle appropriately
- Provide context in error messages:

```typescript
// Backend example - file system access
async function loadConfig({path}: { path: string }) {
    try {
        const content = await readFile(path, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to load config from ${path}: ${error}`);
    }
}

// Frontend would fetch from API or import JSON directly
```

### Security
- Validate all user input before processing
- Backend: Use Node.js APIs instead of shell commands to avoid injection
- Never hardcode secrets - use environment variables:

```typescript
// Backend: Direct process.env access
const apiKey = process.env.API_KEY;

// Frontend: Build-time replacement (REACT_APP_*, VITE_*, etc.)
const apiKey = process.env.REACT_APP_API_KEY;

// Library: Accept config as parameter
function createClient({apiKey}: { apiKey: string }) {
    if (!apiKey) throw new Error('API key required');
}
```

## Function Parameters
- **All function parameters must use object destructuring with inline types**. This provides better semantic context and maintainability, especially for AI-assisted development
  ```typescript
  // ✅ CORRECT - Object destructuring with inline types
  function updateUser({ user, companyId }: { user: User; companyId: Company['id'] }) { }
  
  function calculateArea({ width, height }: { width: number; height: number }) {
    return width * height;
  }
  
  function processPayment({ amount, method }: { amount: number; method: PaymentMethod }) { }
  
  // ❌ AVOID - Positional parameters
  function updateUser(user: User, companyId: Company['id']) { }
  function calculateArea(width: number, height: number) { }
  function processPayment(amount: number, method: PaymentMethod) { }
  ```
- Pass complete objects to preserve type relationships. When you need just an ID, extract it with `Type['id']` rather than passing individual properties
  ```typescript
  type Company = { id: string; name: string; industry: string };
  
  // ✅ CORRECT - Complete objects with extracted types
  function updateUser({ user, companyId }: { user: User; companyId: Company['id'] }) { }
  
  // ❌ AVOID - Individual properties lose type relationships
  function updateUser({ userName, userEmail, userRole, companyId }: { 
    userName: string; 
    userEmail: string; 
    userRole: string; 
    companyId: string;
  }) { }
  ```

## Return Type Inference

- For exported functions returning a defined type from `src/types`, add explicit return type annotation
- For functions returning new shapes or internal functions, let TypeScript infer
  ```typescript
  type Config = { apiUrl: string; timeout: number };
  
  // ✅ CORRECT - Explicit type for exported function returning known type
  function getConfig(): Config {
    return {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      timeout: 5000
    };
  }
  
  // ✅ CORRECT - Let inference work for complex return shapes
  function processUser({ user }: { user: User }) {
    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      isActive: user.status === 'active'
    };
  }
  
  // ✅ CORRECT - Internal functions use inference
  function isEven({ n }: { n: number }) {
    return n % 2 === 0; // TypeScript infers boolean
  }
  ```

## Code Organization
- Keep functions focused and under 100 lines. Break larger functions into smaller, single-purpose helpers
- Keep implementation files under 500 lines. Consider splitting larger files into focused modules
- Ensure all code paths in functions return a value
  ```typescript
  // ✅ CORRECT - All paths return
  function getStatus({ user }: { user: User }) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    return 'inactive';
  }
  
  // ❌ AVOID - Missing return path
  function getStatus({ user }: { user: User }) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    // TypeScript error: Not all code paths return a value
  }
  ```

### Export Rules by File Type

**Always use named exports, never default exports.** Each file type has specific export patterns:

#### Class Files

- **One class export** (primary)
- Supporting types specific to that class may be co-exported
  ```typescript
  // ✅ CORRECT - Class file
  export type ServiceOptions = { apiKey: string; timeout: number };
  export class UserService {
    constructor({ apiKey, timeout }: ServiceOptions) { /* ... */ }
  }
  ```

#### Component Files (React)

- **One functional component export** (primary)
- Supporting types (props, etc.) specific to that component may be co-exported
  ```typescript
  // ✅ CORRECT - Component file
  export type UserCardProps = { user: User; onClick: (user: User) => void };
  export function UserCard({ user, onClick }: UserCardProps) { /* ... */ }
  ```

#### Schema Files

- **One Zod schema export** (primary)
- Supporting types derived from that schema may be co-exported
  ```typescript
  // ✅ CORRECT - Schema file
  export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  });
  export type User = z.infer<typeof UserSchema>;
  ```

#### Utils Files

- **One object export containing multiple related functions** (primary)
- Supporting types specific to those utilities may be co-exported
  ```typescript
  // ✅ CORRECT - Utils file
  export type ProcessResult = { code: number; stdout: string; stderr: string };
  export const FileUtils = {
    getExtension: ({ filePath }: { filePath: string }) => { /* ... */ },
    readContent: async ({ path }: { path: string }) => { /* ... */ },
    writeContent: async ({ path, content }: { path: string; content: string }) => { /* ... */ }
  };
  ```

#### Stub Files (Testing)

- **One stub function export** (primary)
- Supporting types specific to that stub may be co-exported
  ```typescript
  // ✅ CORRECT - Stub file
  export type UserStubOptions = Partial<User>;
  export function UserStub({ options = {} }: { options?: UserStubOptions }): User {
    return {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'John Doe',
      email: 'john@example.com',
      ...options,
    };
  }
  ```

#### Anti-Patterns to Avoid

  ```typescript
  // ❌ AVOID - Multiple primary exports (violates file type rules)
  export function UserProfile() { /* ... */ }
  export function ProductList() { /* ... */ }
  
  // ❌ AVOID - Multiple classes
  export class UserService { /* ... */ }
  export class ProductService { /* ... */ }

// ❌ AVOID - Individual function exports in utils files
export function getExtension() { /* ... */
}

export function readContent() { /* ... */
}

export function writeContent() { /* ... */
}
  ```

### Naming Conventions
  - React Components: `PascalCase` (e.g., `UserProfile.tsx`, `ShoppingCart.tsx`)
  - React Hooks: `camelCase` (e.g., `useAuth.ts`, `useLocalStorage.ts`)
- All other code files: `kebab-case` (e.g., `user-service.ts`, `api-client.ts`, `file-utils.ts`)
  - Constants: `UPPER_SNAKE_CASE` for configuration values and magic numbers (avoid inline literals)

## Import Guidelines

- **All imports at top of file** - No inline imports, requires, or dynamic imports except for performance/lazy loading
- **Use ES6 imports** - Prefer `import` over `require()`
- **Group imports logically** - External packages, then internal modules, then types

## Performance & Code Cleanup

- Default to efficient algorithms since dataset sizes are unknown. Use Map/Set for lookups instead of nested array
  searches
  ```typescript
  // ✅ CORRECT - O(n) using Map for lookups
  const userMap = new Map(users.map(user => [user.id, user]));
  const targetUser = userMap.get(targetId);
  
  // ❌ AVOID - Nested loops create O(n²) complexity
  const activeUsers = users.filter(user => {
    return otherUsers.find(other => other.id === user.id)?.isActive;
  });
  ```
- Remove: unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log statements

## Anti-Patterns to Avoid

- **God functions**: Break functions handling multiple responsibilities into focused, single-purpose functions
- **Complex string manipulation**: Use proper parsers (JSON.parse) instead of regex for structured data
- **Mixed concerns**: Separate data access from business logic