# Coding Standards

*This document contains universal principles that apply to all projects. For project-specific guidance, also read the
appropriate document:*

- **Frontend Projects**: [frontend-standards.md](frontend-standards.md)
- **Backend Projects**: [backend-standards.md](backend-standards.md)
- **NPM Packages**: [npm-package-standards.md](npm-package-standards.md)

**Precedence Rule**: When project-specific documents conflict with this document, the project-specific guidance takes
precedence.

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
const getUsername = ({user}: { user: User | null }): string => {
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
- Type files follow pattern: `domain-type.ts` (e.g., `user-type.ts`, `hook-type.ts`, `api-type.ts`)
- Keep function parameter types inline where they're used, not in `src/types`
- **Type export syntax**:
    - **All files except index.ts**: Only define new types with `export type User = { ... }`
    - **index.ts files only**: Only re-export existing types with `export type { User } from './types'`
    - **Never anywhere**: `export { type User }` (forbidden inline type syntax)

```typescript
// types/user-type.ts - Type definition
export type User = { id: string; name: string }

// components/UserCard.tsx - Only supporting types, never re-exports
export type UserCardProps = { user: User; onClick: () => void }  // Definition only
// ❌ NEVER: export type { User } from '../types/user-type'  // Don't re-export!

// index.ts - ONLY place for re-exports
export type {User, Config} from './types/public-api-type'
```
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

const increment = async () => {
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
const loadConfig = async ({path}: { path: string }) => {
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

// App code: Always use object destructuring
const createClient = ({apiKey}: { apiKey: string }) => {
    if (!apiKey) throw new Error('API key required');
}

// 3rd party integration: Use required signature
app.use((req: Request, res: Response, next: NextFunction) => {
    // Express requires this signature
})
```

## Function Parameters

- **All app code function parameters must use object destructuring with inline types**. This provides better semantic
  context and maintainability, especially for AI-assisted development
- **Exception**: Only when integrating with external code (anything not created by your app) that requires specific
  signatures (e.g., Express middleware `(req, res, next)`, Node.js APIs `fs.readFile(path, callback)`, NPM packages)
  ```typescript
  // ✅ CORRECT - Object destructuring with inline types
  const updateUser = ({ user, companyId }: { user: User; companyId: Company['id'] }) => { }

  const calculateArea = ({ width, height }: { width: number; height: number }) => {
    return width * height;
  }

  const processPayment = ({ amount, method }: { amount: number; method: PaymentMethod }) => { }
  
  // ❌ AVOID - Positional parameters
  const updateUser = (user: User, companyId: Company['id']) => { }
  const calculateArea = (width: number, height: number) => { }
  const processPayment = (amount: number, method: PaymentMethod) => { }
  ```
- Pass complete objects to preserve type relationships. When you need just an ID, extract it with `Type['id']` rather than passing individual properties
  ```typescript
  type Company = { id: string; name: string; industry: string };
  
  // ✅ CORRECT - Complete objects with extracted types
  const updateUser = ({ user, companyId }: { user: User; companyId: Company['id'] }) => { }
  
  // ❌ AVOID - Individual properties lose type relationships
  const updateUser = ({ userName, userEmail, userRole, companyId }: {
    userName: string;
    userEmail: string;
    userRole: string;
    companyId: string;
  }) => { }
  ```

## Return Type Inference

- For exported functions returning a defined type from `src/types`, add explicit return type annotation
- For functions returning new shapes or internal functions, let TypeScript infer
  ```typescript
  type Config = { apiUrl: string; timeout: number };
  
  // ✅ CORRECT - Explicit type for exported function returning known type
  const getConfig = (): Config => {
    return {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      timeout: 5000
    };
  }
  
  // ✅ CORRECT - Let inference work for complex return shapes
  const processUser = ({ user }: { user: User }) => {
    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      isActive: user.status === 'active'
    };
  }
  
  // ✅ CORRECT - Internal functions use inference
  const isEven = ({ n }: { n: number }) => {
    return n % 2 === 0; // TypeScript infers boolean
  }
  ```

## Code Organization
- Keep functions focused and under 100 lines. Break larger functions into smaller, single-purpose helpers
- Keep implementation AND test files under 500 lines
- Ensure all code paths in functions return a value
  ```typescript
  // ✅ CORRECT - All paths return
  const getStatus = ({ user }: { user: User }) => {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    return 'inactive';
  }
  
  // ❌ AVOID - Missing return path
  const getStatus = ({ user }: { user: User }) => {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    // TypeScript error: Not all code paths return a value
  }
  ```

### Export Rules by File Type

**Always use named exports, never default exports.** Each file type has specific export patterns:

### Export Pattern Rules

**Object Exports** (multiple related operations with semantic discoverability):

- Categories: `-controller`, `-api`, `-service`, `-repository`, `-util`, `-formatter`, `-validator`
- Always use folder pattern (see Folder Pattern section below)
- Pattern: `export const CategoryName = { method1, method2, ... }`
- Usage: `UserController.get()`, `StringUtil.capitalize()` - immediately clear what category

**Single Exports** (one conceptual unit per file):

- React Components: `export const ComponentName = () => {}`
- React Hooks: `export const useHookName = () => {}`
- Single Functions: `export const functionName = () => {}`
- Schemas: `export const SchemaName = z.object()`
- Classes: `export class ClassName {}` (only exception - must use class syntax)
- Middleware: `export const middlewareName = (req, res, next) => {}`

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

- **Always use folder pattern** for utils
- See "Folder Pattern for Object Exports" section below

#### Folder Pattern for Object Exports

All object export categories (`-util`, `-controller`, `-api`, `-service`, `-repository`, `-formatter`, `-validator`)
must use the folder pattern:

**Structure:**

```
utils/
  eslint/
    eslint-util.ts                      # Main export aggregator (only importable file)
    eslint-util-parse-output.ts         # Individual method implementation
    eslint-util-parse-output.test.ts    # Individual method test
    eslint-util-is-message.ts           # Another method
    eslint-util-is-message.test.ts      # Its test
```

**Main Export File Pattern:**

```typescript
// utils/eslint/eslint-util.ts
import {eslintUtilParseOutput} from './eslint-util-parse-output';
import {eslintUtilIsMessage} from './eslint-util-is-message';

export const EslintUtil = {
    parseOutput: eslintUtilParseOutput,
    isMessage: eslintUtilIsMessage,
    // All methods aggregated here with semantic names
};
```

**Naming Convention:**

- Folder: Category name (e.g., `eslint/`)
- Main file: `[category]-[type].ts` (e.g., `eslint-util.ts`)
- Child files: `[category]-[type]-[method].ts` (e.g., `eslint-util-parse-output.ts`)
- Test files: `[category]-[type]-[method].test.ts`

**Rules:**

1. Only the main export file can be imported by other modules
2. Each child file contains ONE exported function
3. Each child file has its own test file
4. Main export file only aggregates, no logic
5. **Export name must match the complete filename** (folder pattern only): `eslint-util-parse-output.ts` exports
   `eslintUtilParseOutput`, `eslint-util-is-message.ts` exports `eslintUtilIsMessage` (camelCase conversion of the
   entire kebab-case filename)

**External Consumption**: For code consumed by other projects (NPM packages), different patterns apply.
See [npm-package-standards.md](npm-package-standards.md) for external consumption patterns.

#### Stub Files (Testing)

- **One stub function export** (primary)
- Supporting types specific to that stub may be co-exported
  ```typescript
  // ✅ CORRECT - Stub file
  export type UserStubOptions = Partial<User>;
  export const UserStub = ({ options = {} }: { options?: UserStubOptions }): User => {
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

### Universal Naming Conventions

- **Default**: All code files use `kebab-case` (e.g., `user-type.ts`, `auth-service.ts`) and are single
  case instead of plural case
- **Export objects**: Use `PascalCase` without acronym caps (e.g., `UserApi` not `UserAPI`, `FileUtil` not `FileUtils`)
- **Constants**: `UPPER_SNAKE_CASE` for configuration values and magic numbers (avoid inline literals)

**Export Name to Filename Mapping**:

- **React Components**: `PascalCase` export, `PascalCase` filename (e.g., `UserProfile.tsx`, `export const UserProfile`)
- **React Hooks**: `camelCase` export, `kebab-case` filename (e.g., `use-user.ts`, `export const useUser`)
- **Classes**: `PascalCase` export, `kebab-case` filename (e.g., `user-service.ts`, `export class UserService`)
- **Functions**: `camelCase` export, `kebab-case` filename (e.g., `format-user.ts`, `export const formatUser`)
- **Folder Pattern Utils**: `camelCase` export matching full filename (e.g., `eslint-util-parse-output.ts`,
  `export const eslintUtilParseOutput`)

## Project Structure & Module Boundaries

### Universal Principles

**All projects follow a Directed Acyclic Graph (DAG) of dependencies** to prevent circular imports and maintain clear
separation of concerns. Each layer can only import from layers below it:

```
        [Project-Specific Top Layer]
                       ↑
        [Project-Specific Mid Layers]
                       ↑
        ──────── PURITY BOUNDARY ────────
                       ↑
                     utils
                       ↑
                     types
```

*See project-specific principles documents for complete layer definitions. The universal layers (below purity boundary)
apply to all projects.*

**Critical Rules:**

- **Layer Boundary**: Types are pure definitions, utils are reusable tools (pure or impure), modules orchestrate
  features
- **Utils Classification**: Utils are classified by reusability, not purity. FileUtil with I/O is still a util if
  multiple modules use it
- **One-Way Dependencies**: Higher layers orchestrate lower layers, never the reverse
- **Flat Structure**: Keep folder depth minimal (max 3-4 levels) for LLM findability

### Project-Specific Structures

*For detailed project structures, see the appropriate principles document:*

- **Frontend Projects**: See [frontend-standards.md](frontend-standards.md)
- **Backend Projects**: See [backend-standards.md](backend-standards.md)
- **NPM Packages**: See [npm-package-standards.md](npm-package-standards.md)

### Module Boundary Rules

**Single Entry Point**: Each feature module exposes only one public interface

```typescript
// ✅ CORRECT - Import from component file directly
import {UserProfile} from '../components/UserProfile/UserProfile'

// ❌ AVOID - Direct import of module internals
import {formatUserData} from '../components/UserProfile/use-user-profile'
```

**Category-Based Naming**: Files should encode their category and domain

```typescript
// ✅ CORRECT - Category and domain in filename
user - api.ts         // API calls for user domain
user - util.ts       // Utilities for user domain
payment - service.ts  // Service for payment domain

// ❌ AVOID - Generic names requiring folder context
api.ts             // Which domain? What API?
helpers.ts         // What kind of helpers?
service.ts         // Which service?
```

### Universal Dependency Flow Rules

**Always Valid Import Patterns:**

- `types/` → `types/` (type composition)
- `utils/` → `types/`, `utils/` (pure functions)

**Critical Violations to Always Prevent:**

```typescript
// ❌ PURITY VIOLATIONS
// utils/ importing any impure layers
import {fetchUser} from '../api/user-api'  // Utils must stay pure
import {useAuth} from '../hooks/use-auth'  // Utils must stay pure

// ❌ LATERAL VIOLATIONS
// Direct module-to-module imports without public interface
import {validatePassword} from '../UserAuth/password-validator'  // Bypass public interface

// ❌ CIRCULAR DEPENDENCIES
// Two modules importing each other's internals
```

*For project-specific dependency rules, see the appropriate principles document.*

### Universal File Placement Rules

**Always ask these questions first:**

1. **"Is this a type definition?"** → `types/domain-type.ts`
2. **"Is this a utility function?"** → `utils/category/category-util.ts`

**File Placement Anti-Patterns:**

- **Never** create files in project root beyond entry points
- **Never** mix categories in one folder (`api-and-utils/`)
- **Never** create god modules (`user-everything.ts`)
- **Never** create individual function exports in object export categories (use folder pattern instead)

*For project-specific file placement rules, see the appropriate principles document.*

### Universal Orchestration Principles

**Core Principle**: Each layer has ONE responsibility. When you need to do multiple things, move DOWN the layer stack,
never up.

**Universal Layer Rules:**

- **utils/**: Reusable tools (can have side effects like file I/O, network calls)
- **types/**: Type definitions only (no implementation)

**Utils Classification Examples:**

```typescript
// ✅ CORRECT - Utils can have side effects if they're reusable tools
// utils/file/file-util.ts
const readConfig = async () => {
    return await fs.readFile('config.json')  // Side effect is OK in utils!
}

// utils/lint-runner/lint-runner-util.ts
const runLint = async () => {
    const eslint = new ESLint()  // Side effect is OK in utils!
    return await eslint.lintText(content)
}

// ✅ CORRECT - Pure utils are also utils
// utils/string/string-util.ts
const capitalize = ({str}: { str: string }) => {
    return str.charAt(0).toUpperCase() + str.slice(1)  // Pure function
}

// ❌ WRONG - Business orchestration belongs in modules
// utils/user-registration.ts
const registerUser = async ({data}: { data: UserData }) => {
    await validateEmail(data.email)     // Orchestrating
    await checkDuplicate(data.email)    // multiple
    await createUser(data)               // operations
    await sendWelcomeEmail(data.email)  // = MODULE not util!
}
```

**Key Distinction**: Utils are TOOLS (pure or impure). Modules are ORCHESTRATORS.

*For project-specific orchestration patterns and layer responsibilities, see the appropriate principles document.*

### File Discovery and Extension Rules

**Before creating any new file, always explore first:**

#### 1. Domain Check

```bash
# Search for existing domain files
fd user src/hooks     # Check if user hooks exist
fd user src/api       # Check if user API exists
fd user src/services  # Check if user services exist
```

**If domain exists → MUST extend existing files, not create new ones**

#### 2. Pattern Check

```bash
# Search for similar patterns
rg "export const use" src/hooks    # Find existing hooks
rg "fetch.*User" src/api          # Find existing API patterns
rg "async.*User" src/services     # Find existing services
```

**If pattern exists → Follow the established pattern**

#### 3. Extension Over Creation

```typescript
// ✅ CORRECT - Extend existing hook
// hooks/use-user.ts
export const useUser = (
    id: string,
    options?: {
        includeCompany?: boolean,
        includeRoles?: boolean  // Add new option
    }
) => {
    // Extended functionality
}

// ❌ AVOID - Create variant hooks
// hooks/use-user-with-roles.ts  // Don't create this!
// hooks/use-user-extended.ts    // Don't create this!
```

#### 4. Single File Per Domain Concept

```
src/
  hooks/
    use-user.ts         # User hook logic (single exports)
    use-auth.ts         # Auth hook logic (single exports)
    use-payment.ts      # Payment hook logic (single exports)

  api/
    user/
      user-api.ts       # Main export aggregator
      user-api-get.ts   # Individual method files
      user-api-create.ts
    auth/
      auth-api.ts       # Main export aggregator
      auth-api-login.ts # Individual method files
      auth-api-logout.ts
```

**Rule**: Single exports use one file per domain. Object exports use folder pattern.

#### 5. README-Driven Extension

For complex domains, add guidance comments:

```typescript
// hooks/use-user.ts
// EXTEND THIS FILE - DO NOT create use-user-with-X.ts variants
export const useUser = (options?: UserOptions) => {
    // Add new capabilities here
}
```

## Import Guidelines

- **All imports at top of file** - No inline imports, requires, or dynamic imports except for performance/lazy loading
- **Use ES6 imports** - Prefer `import` over `require()`
- **Group imports logically** - External packages, then internal modules, then types
- **Never import child implementation files** - When using folder pattern, only import from the main export file:
  ```typescript
  // ✅ CORRECT
  import { EslintUtil } from '../utils/eslint/eslint-util';

  // ❌ INCORRECT - Never import child files directly
  import { parseOutput } from '../utils/eslint/eslint-util-parse-output';
  ```

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