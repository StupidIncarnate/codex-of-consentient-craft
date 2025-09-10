# Coding Principles

## Architecture Principles
- Design components with single, clear responsibilities. If you need to explain why something exists, reconsider its design
  ```tsx
  // ✅ CORRECT - Clear single responsibility
  function UserAvatar({ userId }: { userId: string }) {
    // Only responsible for displaying user avatar
  }
  
  // ❌ AVOID - Mixed responsibilities
  function UserAvatarAndNotificationBadge({ userId }: { userId: string }) {
    // Handles avatar display AND notification state - should be separate
  }
  ```
- Consolidate components that serve the same purpose. Having multiple solutions for one problem creates confusion
  ```tsx
  // ✅ CORRECT: One component for displaying user images
  <UserAvatar userId={id} size="large" />
  
  // ❌ AVOID: Two components doing the same thing
  <UserAvatar userId={id} size="large" />
  <ProfilePicture user={user} dimensions={60} />
  ```
- Complete all aspects of a task: passing tests, no TypeScript errors, no linting warnings, no test output spam, and no loose ends
  - **Loose ends include**: Unhandled error cases, missing test coverage, incomplete documentation, hardcoded values that should be configurable, accessibility attributes, loading states

## Type Safety Boundaries
- Use existing types from the codebase when available. Make new types when needed. For uncertain data (including catch variables), use `unknown` and prove its shape through guards. This eliminates the need for `any`
  ```typescript
  // ✅ CORRECT
  try {
    await apiCall();
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Do something with error
    }
  }
  
  // ❌ AVOID
  catch (error: any) {
    return error.message; // Unsafe access
  }
  ```
- Let TypeScript infer types when the value makes it clear. Add explicit types for empty arrays, ambiguous objects, and when you need tighter constraints
  ```typescript
  // ✅ CORRECT - Explicit types for ambiguous cases
  type UserConfig = { theme: string; language: string; notifications: boolean };
  
  const items: string[] = []; // Empty array needs type
  const config: UserConfig = {}; // Empty object needs type
  const data = { firstName: 'John', lastName: 'Doe', age: 30 }; // Clear from values, no type needed
  
  // ❌ AVOID - Ambiguous without types
  // const items = []; // Type is any[]
  // const config = {}; // Type is {}
  ```
- Check array/object access for undefined before use
  ```typescript
  // ✅ CORRECT
  if (users[index]) {
    return users[index].name;
  }
  
  const value = config.settings?.theme ?? 'light';
  
  // ❌ AVOID
  return users[index].name; // May throw if index out of bounds
  ```
- Handle null/undefined values explicitly in your code to satisfy strict checking
  ```typescript
  // ✅ CORRECT
  function getUsername({ user }: { user: User | null }): string {
    if (!user) return 'Anonymous';
    return `${user.firstName} ${user.lastName}`;
  }
  
  // ❌ AVOID
  function getUsername({ user }: { user: User | null }): string {
    return `${user.firstName} ${user.lastName}`; // Error: Object is possibly 'null'
  }
  ```

## Type Discipline
- Fix type errors at their source. Suppressing with `@ts-ignore` or `@ts-expect-error` hides real problems
- Address linting violations directly. Disabling rules with eslint-disable comments accumulates technical debt
- Let types flow naturally through your code. Use type assertions (`as SomeType`) only when you have information the compiler lacks
  ```typescript
  // ✅ CORRECT - You know the type from API docs
  const data = JSON.parse(response) as SomeResponseType;
  
  // ❌ AVOID - Fighting TypeScript's inference
  const count = (items.length as number) + 1; // TypeScript already knows it's a number
  ```

## Security & Safety 
- Avoid shell injection by using Node.js APIs instead of shell commands when possible
  ```typescript
  // ✅ CORRECT - Use Node.js APIs
  import { readFile } from 'fs/promises';
  const content = await readFile(filePath, 'utf8');
  
  // ❌ AVOID - Shell command injection risk
  exec(`cat ${filePath}`, callback);
  ```
- Validate and sanitize all user input before processing
  ```typescript
  // ✅ CORRECT - Input validation
  function processUserId({ userId }: { userId: unknown }): string {
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error('Invalid user ID');
    }
    return userId.trim();
  }
  
  // ❌ AVOID - Direct usage without validation
  function processUserId({ userId }: { userId: any }) {
    return userId.toUpperCase(); // Unsafe
  }
  ```
- Handle errors explicitly for every operation that can fail
  ```typescript
  // ✅ CORRECT - Explicit error handling
  async function loadConfig({ path }: { path: string }) {
    try {
      const content = await readFile(path, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config from ${path}: ${error}`);
    }
  }
  
  // ❌ AVOID - Silent failure
  async function loadConfig({ path }: { path: string }) {
    const content = await readFile(path, 'utf8'); // May throw
    return JSON.parse(content); // May throw
  }
  ```
- Never hardcode secrets or sensitive data. Use environment variables
  ```typescript
  // ✅ CORRECT - Environment variables
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }
  
  // ❌ AVOID - Hardcoded secrets
  const apiKey = 'sk-1234567890abcdef'; // Never do this
  ```

## Type Design Patterns
- Store all type definitions in `src/types` directory rather than inline with implementation files. This centralizes type definitions and prevents circular dependencies
- Prefer `type` over `interface`, especially for function arguments and simple object shapes
  ```typescript
  // ✅ CORRECT - type is more flexible
  type User = {
    id: string;
    firstName: string;
    lastName: string;
  };
  
  type UserWithRole = User & { role: 'admin' | 'user' };
  type UserId = User['id']; // Can extract properties
  type UserMap = Record<string, User>; // Works with utility types
  
  // ❌ AVOID - interface has limitations
  interface IUser {
    id: string;
    firstName: string;
    lastName: string;
  }
  // Note: You CAN do type UserId = IUser['id'], but prefer type aliases for consistency
  ```
- Utilize TypeScript utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)
  ```typescript
  // ✅ CORRECT - Effective utility type usage
  type User = { id: string; firstName: string; lastName: string; email: string; role: string; status: string; isActive: boolean; isPending: boolean };
  type UserSummary = Pick<User, 'id' | 'firstName' | 'lastName'>;
  type PublicUser = Omit<User, 'email'>;
  type UserUpdate = Partial<User>;
  
  // ❌ AVOID - Manually redefining types
  type UserSummaryManual = { id: string; firstName: string; lastName: string }; // Duplicates structure
  ```

## Function Parameters
- **All function parameters must use object destructuring with inline types**. This provides better semantic context and maintainability, especially for AI-assisted development
  ```typescript
  // ✅ CORRECT - Object destructuring with inline types
  function updateUser({ user, companyId }: { user: User; companyId: Company['id'] }) {
    // Clear parameter names and preserved type relationships
  }
  
  function calculateArea({ width, height }: { width: number; height: number }) {
    return width * height;
  }
  
  function processPayment({ amount, method }: { amount: number; method: PaymentMethod }) {
    // Even simple functions benefit from semantic parameter names
  }
  
  // ❌ AVOID - Positional parameters
  function updateUser(user: User, companyId: Company['id']) { /* ... */ }
  function calculateArea(width: number, height: number) { /* ... */ }
  function processPayment(amount: number, method: PaymentMethod) { /* ... */ }
  ```
- Pass complete objects to preserve type relationships. When you need just an ID, extract it with `Type['id']` rather than passing individual properties
  ```typescript
  type Company = { id: string; name: string; industry: string };
  
  // ✅ CORRECT - Complete objects with extracted types
  function updateUser({ user, companyId }: { user: User; companyId: Company['id'] }) {
    // user object maintains all type relationships
  }
  
  // ❌ AVOID - Individual properties lose type relationships
  function updateUser({ userName, userEmail, userRole, companyId }: { 
    userName: string; 
    userEmail: string; 
    userRole: string; 
    companyId: string;
  }) {
    // Lost type safety and relationships
  }
  ```

## Return Type Inference
- Let TypeScript infer return types from function implementations
- Add explicit return types only for exported functions that other modules consume or when TypeScript infers `any`
  ```typescript
  // ✅ CORRECT - Let inference work
  function processUser({ user }: { user: User }) {
    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      isActive: user.status === 'active'
    };
  }
  
  type Config = { apiUrl: string; timeout: number };
  
  // ✅ CORRECT - Explicit type for exported module boundary
  export function getConfig(): Config {
    return {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      timeout: 5000
    };
  }
  
  // ❌ AVOID - Unnecessary explicit return type
  function isEven({ n }: { n: number }): boolean {
    return n % 2 === 0; // TypeScript knows this returns boolean
  }
  ```

## Code Hygiene
- Keep functions focused and under 100 lines. Break larger functions into smaller, single-purpose helpers
- Keep implementation files under 500 lines. Consider splitting larger files into focused modules
- Ensure all code paths in functions return a value (let TypeScript infer the return type)
  ```typescript
  // ✅ CORRECT - All paths return, type inferred
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
- One main export per file (supporting types, interfaces, and constants may be co-exported)
  ```typescript
  // ✅ CORRECT - Clear primary export with supporting types
  export type UserProps = { /* ... */ };
  export type UserState = { /* ... */ };
  export function UserProfile({ props }: { props: UserProps }) { /* ... */ }
  
  // OR for non-default exports:
  export type Config = { /* ... */ };
  export function loadConfig(): Config { /* ... */ }
  
  // ❌ AVOID - Multiple unrelated exports
  export function UserProfile() { /* ... */ }
  export function ProductList() { /* ... */ }
  export function ShoppingCart() { /* ... */ }
  
  // ❌ AVOID - Multiple classes
  export abstract class BaseSomeClass { /* ... */ }
  export class SomeClass extends BaseSomeClass { /* ... */ }
  export class SomeOtherClass extends BaseSomeClass { /* ... */ }
  ```
- Naming conventions:
  - React Components: `PascalCase` (e.g., `UserProfile.tsx`, `ShoppingCart.tsx`)
  - React Hooks: `camelCase` (e.g., `useAuth.ts`, `useLocalStorage.ts`)
  - All other code files: `kebab-case` (e.g., `user-service.ts`, `api-client.ts`, `format-utils.ts`)
  - Constants: `UPPER_SNAKE_CASE` for configuration values and magic numbers
    ```typescript
    // ✅ CORRECT - Named constants
    const MAX_RETRY_ATTEMPTS = 3;
    const DEFAULT_TIMEOUT_MS = 5000;
    const API_VERSION = 'v2';
    
    if (attempts > MAX_RETRY_ATTEMPTS) {
      throw new Error('Max retries exceeded');
    }
    
    // ❌ AVOID - Magic numbers
    if (attempts > 3) {
      throw new Error('Max retries exceeded');
    }
    ```
- Be mindful of performance: read files efficiently, avoid O(n²) algorithms when O(n) or O(n log n) solutions exist
  ```typescript
  // ✅ CORRECT - O(n) lookup using Map
  const userMap = new Map(users.map(user => [user.id, user]));
  const targetUser = userMap.get(targetId);
  
  // ❌ AVOID - O(n) lookup in O(n) loop = O(n²)
  const activeUsers = users.filter(user => {
    return otherUsers.find(other => other.id === user.id)?.isActive;
  });
  ```
- Remove unused local variables and function parameters
- Delete unreachable code
- Remove orphaned files and unused code
- Delete commented-out code blocks and TODO comments from completed work
- Remove console.log statements from production and test code (unless specifically testing console output)

## Anti-Patterns to Avoid
- **God functions**: Functions that handle multiple unrelated responsibilities. Break them into focused, single-purpose functions
  ```typescript
  // ❌ AVOID - God function doing too many things
  function processUserData({ userData }: { userData: unknown }) {
    // Validates input
    if (!userData || typeof userData !== 'object') throw new Error('Invalid data');
    
    // Transforms data
    const normalized = normalizeUserData({ userData });
    
    // Saves to database
    database.save(normalized);
    
    // Sends email notification
    emailService.sendWelcome(normalized.email);
    
    // Logs analytics
    analytics.track('user_created', normalized.id);
    
    return normalized;
  }
  
  // ✅ CORRECT - Separate functions for each concern
  function validateUserData({ userData }: { userData: unknown }): UserData { /* ... */ }
  function normalizeUserData({ userData }: { userData: UserData }): NormalizedUser { /* ... */ }
  function saveUser({ user }: { user: NormalizedUser }): Promise<void> { /* ... */ }
  function sendWelcomeEmail({ email }: { email: string }): Promise<void> { /* ... */ }
  function trackUserCreation({ userId }: { userId: string }): void { /* ... */ }
  ```
- **Complex string manipulation**: Avoid regex for parsing structured data. Use proper parsers or APIs
  ```typescript
  // ✅ CORRECT - Use proper JSON parsing
  function parseConfig({ configString }: { configString: string }) {
    return JSON.parse(configString);
  }
  
  // ❌ AVOID - Complex regex for structured data
  function parseConfig({ configString }: { configString: string }) {
    const match = configString.match(/key:\s*"([^"]*)".*value:\s*"([^"]*)"/);
    return { key: match?.[1], value: match?.[2] };
  }
  ```
- **Silent failures**: Always handle or propagate errors explicitly. Never ignore failures
  ```typescript
  // ✅ CORRECT - Explicit error handling
  async function loadUserProfile({ userId }: { userId: string }) {
    try {
      const profile = await api.getUser(userId);
      return profile;
    } catch (error) {
      logger.error(`Failed to load profile for user ${userId}:`, error);
      throw new Error(`Profile not available for user ${userId}`);
    }
  }
  
  // ❌ AVOID - Silent failure
  async function loadUserProfile({ userId }: { userId: string }) {
    try {
      return await api.getUser(userId);
    } catch {
      return null; // Silently fails without indication
    }
  }
  ```
- **Mixed concerns**: Don't mix business logic with I/O operations. Separate data access from business rules
  ```typescript
  // ✅ CORRECT - Separated concerns
  async function calculateUserDiscount({ userId, getUserData }: { userId: string; getUserData: (id: string) => Promise<User> }) {
    const user = await getUserData(userId);
    return user.isPremium ? 0.2 : 0.1;
  }
  
  // ❌ AVOID - Mixed concerns
  async function calculateUserDiscount({ userId }: { userId: string }) {
    const user = await database.users.findById(userId); // I/O mixed with logic
    return user.isPremium ? 0.2 : 0.1;
  }
  ```