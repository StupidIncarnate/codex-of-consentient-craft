# Coding Principles

## Development Workflow
1. Write empty test cases with descriptive names that define expected behavior
   ```typescript
   // Step 1: Empty test cases
   describe('UserService', () => {
     it('should create a new user with valid data');
     it('should reject duplicate email addresses');
     it('should hash passwords before storage');
   });
   ```
2. Fill in production code that aligns with expected behavior
3. Review production code for missing test coverage: functional groupings, edge cases, and error paths
   - **Functional groupings**: Related operations (e.g., all CRUD operations for a resource)
   - **Edge cases**: Boundary values, empty inputs, maximum limits
   - **Error paths**: Invalid inputs, network failures, permission denied
4. Fill in test cases with assertions that match their descriptions
   ```typescript
   // Step 4: Fill in the test
   it('should reject duplicate email addresses', async () => {
     await createUser({ email: 'test@example.com' });
     await expect(createUser({ email: 'test@example.com' }))
       .rejects.toThrow('Email already exists');
   });
   ```
5. Refactor for clarity, consolidate duplicated logic, simplify complex patterns, and verify all tests still pass

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
- Apply the same solution to the same problem throughout the codebase
  ```typescript
  // If you handle errors with try/catch in one place:
  try {
    await api.updateUser(data);
  } catch (error) {
    showErrorToast(error.message);
  }
  
  // Use the same pattern everywhere, not a different approach:
  api.updateProfile(data).catch(handleError); // Different pattern = confusion
  ```
- Follow existing patterns in the codebase. Introduce new patterns only after confirming current ones cannot solve the problem
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
      console.error(error.message);
    }
  }
  
  // ❌ AVOID
  catch (error: any) {
    console.error(error.message); // Unsafe access
  }
  ```
- Let TypeScript infer types when the value makes it clear. Add explicit types for empty arrays, ambiguous objects, and when you need tighter constraints
  ```typescript
  // ✅ CORRECT - Explicit types for ambiguous cases
  const items: string[] = []; // Empty array needs type
  const config: UserConfig = {}; // Empty object needs type
  const data = { name: 'John', age: 30 }; // Clear from values, no type needed
  
  // ❌ AVOID - Ambiguous without types
  // const items = []; // Type is any[]
  // const config = {}; // Type is {}
  ```
- Check array/object access for undefined before use
  ```typescript
  // ✅ CORRECT
  if (users[index]) {
    console.log(users[index].name);
  }
  
  const value = config.settings?.theme ?? 'light';
  
  // ❌ AVOID
  console.log(users[index].name); // May throw if index out of bounds
  ```
- Handle null/undefined values explicitly in your code to satisfy strict checking
  ```typescript
  // ✅ CORRECT
  function getUsername(user: User | null): string {
    if (!user) return 'Anonymous';
    return user.name;
  }
  
  // ❌ AVOID
  function getUsername(user: User | null): string {
    return user.name; // Error: Object is possibly 'null'
  }
  ```

## Type Discipline
- Fix type errors at their source. Suppressing with `@ts-ignore` or `@ts-expect-error` hides real problems
- Address linting violations directly. Disabling rules with eslint-disable comments accumulates technical debt
- Let types flow naturally through your code. Use type assertions (`as SomeType`) only when you have information the compiler lacks
  ```typescript
  // ✅ CORRECT - You know the type from API docs
  const data = JSON.parse(response) as { id: string; name: string };
  
  // ❌ AVOID - Fighting TypeScript's inference
  const count = (items.length as number) + 1; // TypeScript already knows it's a number
  ```

## Type Design Patterns
- Use `type` over `interface` in all cases
  ```typescript
  // ✅ CORRECT - type is more flexible
  type User = {
    id: string;
    name: string;
  };
  
  type UserWithRole = User & { role: 'admin' | 'user' };
  type UserId = User['id']; // Can extract properties
  type UserMap = Record<string, User>; // Works with utility types
  
  // ❌ AVOID - interface has limitations
  interface IUser {
    id: string;
    name: string;
  }
  // Cannot do: type UserId = IUser['id'] directly
  ```
- Utilize TypeScript utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)
  ```typescript
  // ✅ CORRECT - Effective utility type usage
  type User = { id: string; name: string; email: string; role: string };
  
  // Pick only what you need
  type UserSummary = Pick<User, 'id' | 'name'>;
  
  // Remove sensitive fields
  type PublicUser = Omit<User, 'email'>;
  
  // Make all fields optional for updates
  type UserUpdate = Partial<User>;
  
  // ❌ AVOID - Manually redefining types
  type UserSummaryManual = { id: string; name: string }; // Duplicates structure
  ```

## Function Parameters
- Pass complete objects to preserve type relationships. When you need just an ID, extract it with `Type['id']` rather than passing individual properties
  ```typescript
  // ✅ CORRECT
  function updateUser(user: User, companyId: Company['id']) {
    // user object maintains all type relationships
  }
  
  // ❌ AVOID
  function updateUser(userName: string, userEmail: string, userRole: string, companyId: string) {
    // Lost type safety and relationships
  }
  ```
- Use options objects with descriptive property names for functions with 3+ parameters or any optional parameters
  ```typescript
  // ✅ CORRECT - Options object for 3+ params
  function createUser(options: {
    name: string;
    email: string;
    role: string;
    department?: string;
  }) { /* ... */ }
  
  // ✅ CORRECT - Options object for optional params
  function search(options: {
    query: string;
    limit?: number;
  }) { /* ... */ }
  
  // ✅ CORRECT - 2 required params is OK positional
  function setPosition(x: number, y: number) { /* ... */ }
  
  // ❌ AVOID - Too many positional parameters
  function createUser(name: string, email: string, role: string, department?: string) { /* ... */ }
  ```
- Reserve positional parameters for single-argument functions and well-established patterns
  ```typescript
  // ✅ CORRECT - Well-established patterns
  array.map(item => item.id);
  array.filter(user => user.isActive);
  array.reduce((sum, n) => sum + n, 0);
  
  // ✅ CORRECT - Simple transforms
  function double(n: number): number { return n * 2; }
  function getId(user: User): string { return user.id; }
  
  // ❌ AVOID - Complex logic should use options
  users.filter((user, index, array, includeInactive, includePending) => { /* ... */ });
  ```

## Return Type Inference
- Let TypeScript infer return types from function implementations
- Add explicit return types only for exported functions that other modules consume or when TypeScript infers `any`
  ```typescript
  // ✅ CORRECT - Let inference work
  function processUser(user: User) {
    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      isActive: user.status === 'active'
    };
  }
  
  // ✅ CORRECT - Explicit type for exported module boundary
  export function getConfig(): Config {
    return loadConfigFromFile();
  }
  
  // ❌ AVOID - Unnecessary explicit return type
  function isEven(n: number): boolean {
    return n % 2 === 0; // TypeScript knows this returns boolean
  }
  ```

## Code Hygiene
- Follow all eslint and prettier rules in your configuration
- Ensure all code paths in functions return a value (let TypeScript infer the return type)
  ```typescript
  // ✅ CORRECT - All paths return, type inferred
  function getStatus(user: User) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    return 'inactive';
  }
  
  // ❌ AVOID - Missing return path
  function getStatus(user: User) {
    if (user.isActive) return 'active';
    if (user.isPending) return 'pending';
    // TypeScript error: Not all code paths return a value
  }
  ```
- One primary export per file
  ```typescript
  // ✅ CORRECT - Clear primary export with supporting types
  export type UserProps = { /* ... */ };
  export type UserState = { /* ... */ };
  export default function UserProfile(props: UserProps) { /* ... */ }
  
  // OR for non-default exports:
  export type Config = { /* ... */ };
  export function loadConfig(): Config { /* ... */ }
  
  // ❌ AVOID - Multiple unrelated exports
  export function UserProfile() { /* ... */ }
  export function ProductList() { /* ... */ }
  export function ShoppingCart() { /* ... */ }
  ```
- Remove unused local variables and function parameters
- Delete unreachable code
- Remove orphaned files and unused code
- Delete commented-out code blocks and TODO comments from completed work
- Remove console.log statements from production and test code (unless specifically testing console output)