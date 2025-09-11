# Coding Principles

## Architecture Principles

- Design components/modules with single, clear responsibilities
- Consolidate similar functionality - avoid multiple solutions for one problem
- Complete all aspects of a task: passing tests, no TypeScript errors, no linting warnings
- **Verify frequently**: Run `npm run lint` and `npm run typecheck` after each significant change to catch issues early
- Handle edge cases and error conditions appropriately for the context

## TypeScript & Type Safety

### Core Principles

- Use existing types from the codebase when available. Make new types when needed
- For uncertain data (including catch variables), use `unknown` and prove its shape through guards
- Fix type errors at their source. Never suppress with `@ts-ignore` or `@ts-expect-error`
- Let TypeScript infer types when values are clear. Add explicit types for:
    - Empty arrays and objects
    - Ambiguous values

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
  export function getConfig(): Config {
    return {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      timeout: 5000
    };
  }
  
  // ✅ CORRECT - Let inference work for complex return shapes
  export function processUser({ user }: { user: User }) {
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
  export function getStatus({ user }: { user: User }) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    return 'inactive';
  }
  
  // ❌ AVOID - Missing return path
  export function getStatus({ user }: { user: User }) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    // TypeScript error: Not all code paths return a value
  }
  ```
- Always use named exports, never default exports
- One primary export per file: one component (React), one utility function/object (utils), or one class
- Supporting types specific to that export may be co-exported
  ```typescript
  // ✅ CORRECT - React component with its types
  export type UserProps = { /* ... */ };
  export function UserProfile({ name, age }: UserProps ) { /* ... */ }
  
  // ✅ CORRECT - Utility functions grouped as object
  export const UserUtils = {
    formatName: ({ user }: { user: User }) => `${user.firstName} ${user.lastName}`,
    validateEmail: ({ email }: { email: string }) => email.includes('@')
  };
  
  // ✅ CORRECT - Single utility function with its types
  export type Config = { /* ... */ };
  export function loadConfig(): Config { /* ... */ }
  
  // ✅ CORRECT - Class with its types
  export type ServiceOptions = { /* ... */ };
  export class UserService { /* ... */ }
  
  // ❌ AVOID - Multiple primary exports
  export function UserProfile() { /* ... */ }
  export function ProductList() { /* ... */ }
  
  // ❌ AVOID - Multiple classes
  export class UserService { /* ... */ }
  export class ProductService { /* ... */ }
  ```
- Naming conventions:
  - React Components: `PascalCase` (e.g., `UserProfile.tsx`, `ShoppingCart.tsx`)
  - React Hooks: `camelCase` (e.g., `useAuth.ts`, `useLocalStorage.ts`)
  - All other code files: `kebab-case` (e.g., `user-service.ts`, `api-client.ts`, `format-utils.ts`)
  - Constants: `UPPER_SNAKE_CASE` for configuration values and magic numbers (avoid inline literals)

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