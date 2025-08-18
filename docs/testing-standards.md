# Testing Standards

**Core Principle: DAMP (Descriptive And Meaningful Phrases)** - Each test should be readable from top to bottom without needing to look at other functions. Prefer clarity and readability over DRY (Don't Repeat Yourself) in test code.

## Test Philosophy
- Write tests that describe [behavior, not implementation](#behavior-vs-implementation). Implementation details change, behavior contracts do not change
- Keep each test self-contained and readable. DAMP principle ensures that tests which fail are then readable (see [DAMP Coverage Standards](#damp-coverage-standards))
- [Isolate tests](#test-isolation) from each other. Independent tests can run in any order without side effects - no shared state, no test depending on another test's execution
- When doing unit and integration tests, [co-locate test files](#test-file-organization) with source code. Use .test.ts or .test.tsx suffix for easy discovery

### Behavior vs Implementation

Test what your code does, not how it does it. Internal implementation can change without breaking behavior.

**Example using Jest:**
```typescript
// ✅ CORRECT - Tests behavior
it('cart.getTotal() with tax => returns calculated total', () => {
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, taxRate: 0.1 });
  expect(cart.getTotal()).toBe(110);
});

// ❌ WRONG - Tests implementation
it('cart.getTotal() => calls _calculateTax()', () => {
  const spy = jest.spyOn(cart, '_calculateTax');
  cart.getTotal();
  expect(spy).toHaveBeenCalled(); // Testing internal method
});
```

### Test Isolation

Each test must be completely independent. No shared state, no order dependencies.

**Example using Jest:**
```typescript
// ✅ CORRECT - Each test is independent
it('createUser({name: "John"}) => returns user with ID', () => {
  const user = createUser({ name: 'John' });
  expect(user.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
});

it('updateUser() with valid ID => returns updated user', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user.id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});

// ❌ WRONG - Tests depend on shared state
let user: User;

it('createUser({name: "John"}) => sets shared user state', () => {
  user = createUser({ name: 'John' });
  expect(user.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
});

it('updateUser() using shared state => depends on previous test', () => {
  // This fails if previous test didn't run!
  updateUser(user.id, { name: 'Jane' });
  expect(user.name).toBe('Jane');
});
```

### Test Data Factory Functions

- When multiple tests use similar data structures with only minor variations, use factory functions to reduce redundancy and improve maintainability.
- Create type-safe stubs for all data types. This maintains parity with production type safety
- Use UUID format for IDs. Simple strings like 'user-123' don't match production data
- Provide explicit values in test data. Relying on default stub values creates brittle tests
- Keep test data minimal but realistic. Override only properties your assertions verify (reference the code to determine what's needed)

#### Naming Convention
Use the pattern `[Type]Stub` for factory function names:
```typescript
// GOOD: Clear, concise naming
const UserStub = (overrides: Partial<User> = {}) => ({ ... });
const PreToolUseHookStub = (overrides: Partial<HookData> = {}) => ({ ... });
const ErrorResponseStub = (overrides: Partial<ErrorResponse> = {}) => ({ ... });

// BAD: Redundant "create" prefix
const createUserStub = (overrides: Partial<User> = {}) => ({ ... });
```

#### Implementation Pattern

Import stubs from the central `/tests/stubs` folder:

```typescript
// In test file
import { PreToolUseHookStub } from '../../tests/stubs/hook-data.stub';

it('runHook() with valid TypeScript content => returns exit code 0', () => {
  const hookData = PreToolUseHookStub({
    cwd: projectDir,
    tool_input: {
      file_path: filePath,
      content: 'export function add(a: number, b: number): number { return a + b; }',
    },
  });
  
  const result = runHook(hookData);
  
  expect(result).toStrictEqual({
    exitCode: 0,
    stdout: '',
    stderr: ''
  });
});
```

**Example using Jest:**
```typescript
// ✅ CORRECT - Type-safe stub factory
export const UserStub = (props: Partial<User> = {}): User => ({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date('2023-01-01'),
  ...props,
});

// ✅ CORRECT - Test complete object with toStrictEqual
it('sendWelcomeEmail() with email: "test@example.com" => returns welcome email config', () => {
  const user = UserStub({ email: 'test@example.com' });
  const result = sendWelcomeEmail(user);
  expect(result).toStrictEqual({
    to: 'test@example.com',
    subject: 'Welcome to our platform',
    template: 'welcome-email'
  });
});

const formatUserDisplay = (user: Pick<User, 'name', 'email'>) => {
  return {
    displayName: "Display: " + user.name,
    email: user.email
  };
}

// ✅ CORRECT - Minimal stub overrides, complete object assertion
it('formatUserDisplay() with custom name and email => returns formatted display', () => {
  const user = UserStub({ name: 'Mick Robberts', email: 'johnny@gmail.com' });
  expect(formatUserDisplay(user)).toStrictEqual({
    displayName: "Display: Mick Robberts",
    email: 'johnny@gmail.com'
  });
});

// ❌ WRONG - Inline object without type safety
const user = {
  id: 'user-123',  // Not a valid UUID
  name: 'Test User',
  email: 'test@test.com'
  // Missing required fields - TypeScript won't catch this!
};

// ❌ WRONG - Includes irrelevant data in test setup
it('formatUserDisplay() with user data => returns formatted display', () => {
  const user = {
    id: 'd7e8f9a0-1bcd-ef23-4567-89012abcdef3',
    name: 'Mick Robberts',
    email: 'johnny@example.com',  // Not needed for name formatting
    age: 30,                     // Not needed for name formatting
    address: { street: '123 Main St' }  // Not needed for name formatting
  };
  expect(formatUserDisplay(user)).toStrictEqual({
    displayName: "Display: Mick Robberts",
    email: 'johnny@example.com'
  }); 
});
```

#### File Organization
Stub factories should be organized in a central `/tests/stubs` folder:

```
tests/
  stubs/
    hook-data.stub.ts         // Exports HookDataStub, PreToolUseHookStub, PostToolUseHookStub
    tool-input.stub.ts        // Exports WriteToolInputStub, EditToolInputStub, etc.
    user.stub.ts              // Exports UserStub, AdminUserStub, etc.
src/
  hooks/
    sanitation-hook.ts
    sanitation-hook.integration.test.ts
  models/
    user.ts
    user.test.ts
```

Each stub file should:
1. Export one primary stub and its variations
2. Be named after the type it stubs (e.g., `user.stub.ts` for `User` type)
3. Import types from the source files

Example stub file:
```typescript
// tests/stubs/hook-data.stub.ts
import type { HookData } from '../hooks/sanitation-hook';

export const HookDataStub = (overrides: Partial<HookData> = {}): HookData => ({
  session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  transcript_path: '/tmp/transcript.jsonl',
  cwd: process.cwd(),
  hook_event_name: 'PreToolUse',
  tool_name: 'Write',
  tool_input: {
    file_path: '/test/file.ts',
    content: '',
  },
  ...overrides,
});

export const PreToolUseHookStub = (overrides: Partial<HookData> = {}) => 
  HookDataStub({ hook_event_name: 'PreToolUse', ...overrides });

export const PostToolUseHookStub = (overrides: Partial<HookData> = {}) => 
  HookDataStub({ hook_event_name: 'PostToolUse', ...overrides });
```

#### Guidelines
1. **One stub file per type** - Keep related stubs together, but separate different types
2. **Use deep merging for nested objects** - Ensure partial overrides don't replace entire nested structures
3. **Generate unique IDs when needed** - Use a UUID generator for session IDs that must be unique
4. **Extract common values as constants** - File paths, content snippets, etc.
5. **Keep factories pure** - No side effects, just return data
6. **Use proper types** - Tests should be using Typescript types same as production code. Do not use `type any` or other escape hatch typings.

### Test File Organization

Keep tests close to the code they test for easy discovery and maintenance.

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx         ✅ Co-located unit/integration test
  utils/
    validators.ts
    validators.test.ts        ✅ Co-located unit test
    
tests/
  e2e/
    checkout-flow.test.ts     ✅ E2E tests cannot be co-located
  unit/
    Button.test.tsx           ❌ Separated unit tests from source
```

**Note**: Unit and integration tests should be co-located with source code. E2E tests live in a separate test directory since they test across multiple components/pages.

## DAMP Coverage Standards
Tests Should Be DAMP (Descriptive And Meaningful Phrases), Not DRY. Never conflate production code with test code.

**100% Branch Coverage Required:**

- All if/else branches
- All switch cases
- All input combinations
- Ternary operators
- Optional chaining (?.)
- Try/catch blocks
- Dynamic values in JSX
- Conditional rendering in JSX
- Event handling: onClick, onChange, form submissions

**Example needing 3 tests:**

```typescript
function processUser(user: User | null): string {
  if (!user) return 'No user'; // Test 1
  if (user.isAdmin) return 'Admin'; // Test 2
  return user.name; // Test 3
}
```

### Coverage Requirements
- Achieve [100% branch coverage](#branch-coverage) for conditional logic. This includes if/else, switch, ternary, optional chaining, try/catch
- Focus on [dynamic behavior and computed values](#dynamic-vs-static-testing). Static props and hardcoded text provide no value to test
- Test all code paths including [error cases](#error-path-testing). Both positive and negative cases reveal different bugs

#### Branch Coverage

Every conditional path must be tested. Missing branches often hide bugs.

**Example using Jest:**
```typescript
// Function requiring 100% branch coverage
function processPayment(options: {
  amount: number;
  hasDiscount?: boolean;
}) {
  if (options.amount <= 0) throw new Error('Invalid amount');
  
  const discount = options.hasDiscount ? 0.1 : 0;
  const total = options.amount * (1 - discount);
  
  return total > 100 ? { total, shipping: 0 } : { total, shipping: 10 };
}

// Tests needed for 100% coverage
describe('processPayment()', () => {
  describe('when amount is invalid', () => {
    it('processPayment({amount: 0}) => throws Error', () => {
      expect(() => processPayment({ amount: 0 })).toThrow('Invalid amount');
    });
  });
  
  describe('when amount is valid', () => {
    describe('with discount', () => {
      describe('when total < 100', () => {
        it('processPayment({amount: 50, hasDiscount: true}) => applies 10% discount and charges shipping', () => {
          expect(processPayment({ amount: 50, hasDiscount: true }))
            .toStrictEqual({ total: 45, shipping: 10 });
        });
      });
      
      describe('when total > 100', () => {
        it('processPayment({amount: 120, hasDiscount: true}) => applies 10% discount and free shipping', () => {
          expect(processPayment({ amount: 120, hasDiscount: true }))
            .toStrictEqual({ total: 108, shipping: 0 });
        });
      });
    });
    
    describe('without discount', () => {
      describe('when total < 100', () => {
        it('processPayment({amount: 50, hasDiscount: false}) => charges full price and shipping', () => {
          expect(processPayment({ amount: 50, hasDiscount: false }))
            .toStrictEqual({ total: 50, shipping: 10 });
        });
      });
      
      describe('when total > 100', () => {
        it('processPayment({amount: 150}) => charges full price with free shipping', () => {
          expect(processPayment({ amount: 150 }))
            .toStrictEqual({ total: 150, shipping: 0 });
        });
      });
    });
  });
});
```

#### Dynamic vs Static Testing

Test computed values and conditional logic. Skip hardcoded values that never change.

**Example using React Testing Library:**
```tsx
// ✅ TEST - Dynamic content from props
<Badge status={user.status}>{getStatusLabel(user.status)}</Badge>

// ✅ TEST - Conditional rendering
{isError && <ErrorMessage>{error.message}</ErrorMessage>}

// ✅ TEST - Computed values
<Total amount={calculateTotal(items)} />

// ❌ SKIP - Static text
<h1>Welcome to Our App</h1>

// ❌ SKIP - Hardcoded props
<Button color="primary" size="large">
```

#### Error Path Testing

Test both success and failure cases. Error handling often has the most bugs.

**Example using Jest:**
```typescript
// Mock setup
const mockNetworkError = () => {
  jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
};

// ✅ CORRECT - Tests both paths
describe('fetchUser()', () => {
  it('fetchUser() with valid ID => returns user', async () => {
    const user = await fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(user).toStrictEqual({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'John' });
  });
  
  it('fetchUser() with invalid ID => throws NotFoundError', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow('User not found');
  });
  
  it('fetchUser() with network error => throws NetworkError', async () => {
    mockNetworkError();
    await expect(fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).rejects.toThrow('Network error');
  });
});

// ❌ WRONG - Only happy path
it('fetchUser() with valid ID => returns user name', async () => {
  const user = await fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  expect(user.name).toBe('John');
});
```

## Test Description Format

### Action => Expectation Pattern

Test descriptions follow the `Action => Expectation` format using element monikers:

```typescript
// ✅ Good: Clear action and expected outcome with monikers
it('clicking [data-test="load-data-button"] => shows @progressbar', () => {
  const mocks = MockTemplate.successfulLoadMarketData();
  render(<VerificationDashboard />, { wrapper: WrapperTemplate.withProviders(mocks) });
  
  fireEvent.click(screen.getByTestId('load-data-button'));
  
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

// ❌ Bad: Verbose and unclear
it('clicking [data-test="load-data-button"] => shows loading spinner', () => {
  // ...
});
```

### Element Correlation Monikers (Unit/Component Tests Only)

Use standardized monikers for clear correlation between test descriptions and implementation elements.

#### Code Elements
- **Functions**: `functionName()`
- **Classes**: `class ClassName`
- **Variables/Constants**: `$variableName`
- **Methods**: `object.method()`
- **Properties**: `object.property`
- **Types/Interfaces**: `type TypeName`

#### UI Elements
- **data-testid**: `[data-test="element-name"]`
- **CSS classes**: `.className`
- **HTML elements**: `<elementName>`
- **ARIA roles**: `@role-name`

#### State/Logic
- **React hooks**: `useHookName()`
- **State variables**: `$stateName`
- **Refs**: `$refName.current`
- **Effects**: `useEffect[dependency]`

#### Examples in Test Descriptions

```typescript
// Functions and methods
'loadMarketData() => triggers $loading state'
'user.authenticate() with success => sets $isAuthenticated true'

// UI elements  
'clicking [data-test="submit-button"] => shows .loading-spinner'
'typing in [data-test="email-input"] => enables [data-test="login-button"]'

// State and logic
'$symbol change after $hasLoadedDataRef.current true => triggers loadMarketData()'
'useEffect[symbol, timeframe] dependency change => calls loadData()'

// Classes and types
'AuthService.login() with invalid credentials => returns type AuthError'

// Mixed elements
'[data-test="form"] submission with invalid $credentials => shows .error-message'
'$isLoading true => disables [data-test="submit-button"] and shows @progressbar'
```

#### Benefits
- **Direct correlation**: LLMs can map descriptions to exact code elements
- **Searchability**: Easy to find tests for specific functions/elements  
- **Consistency**: Same element always uses same moniker
- **Clarity**: Immediately obvious what type of element is being tested

### Test Organization by Feature

Organize tests by the feature or behavior being tested, with descriptive `describe` blocks:

```typescript
describe('processPayment()', () => {
  describe('input validation', () => {
    it('processPayment({amount: 0}) => returns error "Invalid payment amount"', () => {
      const result = processPayment({ amount: 0, method: 'credit_card' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid payment amount');
    });
    
    it('processPayment({method: "cryptocurrency"}) => returns error "Unsupported payment method"', () => {
      const result = processPayment({ amount: 100, method: 'cryptocurrency' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported payment method');
    });
  });
  
  describe('credit card processing', () => {
    beforeEach(() => {
      TestActions.setupSuccessfulCreditCard();
    });
    
    it('processPayment({method: "credit_card"}) => returns success with transactionId', async () => {
      const result = await processPayment({ amount: 100, method: 'credit_card' });
      
      expect(result.success).toBe(true);
      expect(result.data.transactionId).toBeDefined();
    });
  });
  
  describe('bank transfer processing', () => {
    it('processPayment({method: "bank_transfer"}) with network success => returns success', async () => {
      TestActions.setupSuccessfulBankTransfer();
      
      const result = await processPayment({ amount: 100, method: 'bank_transfer' });
      
      expect(result.success).toBe(true);
    });
    
    it('processPayment({method: "bank_transfer"}) with network error => returns "Bank transfer failed"', async () => {
      TestActions.setupFailedBankTransfer('Network timeout');
      
      const result = await processPayment({ amount: 100, method: 'bank_transfer' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank transfer failed');
    });
  });
});
```

### E2E/Integration Test Descriptions

E2E tests focus on user behavior and business outcomes, not implementation:

```typescript
// ✅ E2E: User behavior focused
it('User enters valid login credentials => navigates to dashboard', () => {
  // E2E test implementation
});

it('Admin creates new product => product appears in customer catalog', () => {
  // E2E test implementation  
});

it('Customer completes checkout => receives order confirmation email', () => {
  // E2E test implementation
});

// ❌ E2E: Don't use data-testids or implementation details
it('clicking login-button after valid form-input => dashboard-page renders', () => {
  // Wrong for E2E
});
```

## Assertion Discipline
- Use the strictest assertion for each situation. Loose matchers miss unexpected properties and allow incorrect data to pass, aka [property bleedthrough](#property-bleedthrough)
- Assert complete equality for objects and arrays. Partial matching hides bugs (see [toStrictEqual vs toBe vs toEqual](#tostrictequal-vs-tobe-vs-toequal))
- Test actual values, not just existence. Knowing something exists doesn't mean it's correct (see [Testing Values vs Existence](#testing-values-vs-existence))
- Verify content, not just count. Length alone doesn't prove correctness (see [Content vs Count Testing](#content-vs-count-testing))

### Property Bleedthrough
Property bleedthrough occurs when unexpected properties pass through your assertions undetected. This happens with partial matchers that only check for specific properties while ignoring others.

**Example using Jest:**
```typescript
// ✅ SAFE - Strict equality catches all properties
const user = { id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John' };
expect(user).toStrictEqual({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John' });
// PASSES - validates exact structure

// ❌ DANGEROUS - Property bleedthrough with partial matchers
const userWithPassword = { id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John', password: 'secret123' };
expect(userWithPassword).toEqual(expect.objectContaining({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John' }));
// PASSES - even though password leaked through!
```

**Array example using Jest:**
```typescript
// ✅ SAFE - Exact array matching
const items = ['apple', 'banana'];
expect(items).toStrictEqual(['apple', 'banana']);
// PASSES - validates exact contents

// ❌ DANGEROUS - Allows extra elements
const itemsWithExtras = ['apple', 'banana', 'orange', 'grape'];
expect(itemsWithExtras).toEqual(expect.arrayContaining(['apple', 'banana']));
// PASSES - despite extra unwanted items
```


#### toStrictEqual vs toBe vs toEqual
```typescript
// ✅ CORRECT - Use toStrictEqual for ALL objects and arrays
expect(result).toStrictEqual({ id: 'e8f9a0b1-2cde-f345-6789-0123abcdef45', name: 'John' });
expect(items).toStrictEqual(['apple', 'banana']);

// ✅ CORRECT - Test the whole object to catch property bleedthrough
expect(result).toStrictEqual({
  current: {
      isLoading: true,
      count: 5,
      error: null
  },
});

// ❌ WRONG - Testing object properties individually misses property bleedthrough
expect(result.current.isLoading).toBe(true); // Misses other properties!
expect(result.current.count).toEqual(5);     // Object might have unexpected props!

// ✅ CORRECT - toBe/toEqual ONLY for standalone scalars
const count = calculateTotal();
expect(count).toBe(42);              // Standalone number
expect(message).toEqual('Success');  // Standalone string

// ❌ WRONG - toEqual on objects allows property bleedthrough
const user = { id: 'f9a0b1c2-3def-4567-890a-bcdef1234567', name: 'John', password: 'secret' };
expect(user).toEqual({ id: 'f9a0b1c2-3def-4567-890a-bcdef1234567', name: 'John' }); // PASSES despite extra password!
```

#### Why toEqual is Dangerous for Objects
```typescript
// Example of what toEqual misses but toStrictEqual catches
const apiResponse = { 
  id: 'c6d7e8f9-0abc-def1-2345-678901abcdef', 
  name: 'Test User',
  sensitiveData: 'leaked-value' // Bug: this shouldn't be here!
};

// ✅ CORRECT - toStrictEqual fails, revealing the bug
expect(apiResponse).toStrictEqual({ id: 'c6d7e8f9-0abc-def1-2345-678901abcdef', name: 'Test User' }); // FAILS

// ❌ WRONG - toEqual passes, hiding the bug
expect(apiResponse).toEqual({ id: 'c6d7e8f9-0abc-def1-2345-678901abcdef', name: 'Test User' }); // PASSES
```

#### Never Use Partial Matchers
```typescript
// ✅ ALWAYS use strict equality instead
expect(user).toStrictEqual({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John' });
expect(items).toStrictEqual(['apple', 'banana']);
expect(errorMsg).toBe("Your error number is 3237. Make it better");

// ❌ NEVER use these - they allow property bleedthrough
expect(user).toEqual(expect.objectContaining({ id: 'a0b1c2d3-4e5f-6789-0abc-def123456789' }));
expect(items).toEqual(expect.arrayContaining(['apple']));
expect(errorMsg).toEqual(expect.stringContaining('Your error number'))
```

#### Other Assertions
```typescript
// Specific matchers communicate intent better
expect(items).toHaveLength(3);     // Better than expect(items.length).toBe(3)
expect(error).toBeNull();          // Better than expect(error).toBe(null)
expect(deletedUser).toBeUndefined(); // Better than expect(deletedUser === undefined).toBe(true)

// Async assertions
await expect(fetchData()).resolves.toStrictEqual({ data: 'value' });
await expect(failingCall()).rejects.toThrow('Error message');
```

#### Testing Values vs Existence
```typescript
// ✅ CORRECT - Test the actual value
const userId = generateUserId();
expect(userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
expect(config.timeout).toBe(5000);
expect(user.role).toBe('admin');
expect(user.isActive).toBe(false);

// ❌ WRONG - Only testing existence doesn't verify correctness
const userId = generateUserId();
expect(userId).toBeDefined(); // Could be any value!
expect(config.timeout).toBeDefined(); // Could be 1ms or 1 hour!
expect(user.role).toBeDefined(); // Could be 'guest' when you need 'admin'!
expect(user.isActive).toBeDefined(); // Could be true or false!
```

### Spying and Mocking
```typescript
// Only use jest.spyOn for system utilities
const cookieSpy = jest.spyOn(CookieUtil, 'get').mockReturnValue('token123');
const routerPush = jest.spyOn(Router, 'push').mockResolvedValue(true);

// Verify calls
expect(cookieSpy).toHaveBeenCalledWith('auth-token');
expect(routerPush).toHaveBeenCalledWith('/dashboard');
```

## Helper Patterns

All test files follow standardized patterns using Jest with helper functions for common operations:

### Data Templates
```typescript
const DataTemplate = {
  // Reusable data structures for test scenarios
  entityName: (overrides: Partial<EntityType> = {}) => ({
    id: 'default-id',
    name: 'Default Name',
    status: 'active',
    // ... default properties
    ...overrides,
  }),
};
```

### Mock Templates
```typescript
const MockTemplate = {
  // Reusable mock patterns for external dependencies
  successfulOperation: (customData?: EntityType) => ({
    success: true,
    data: customData || DataTemplate.entityName(),
  }),
  
  failedOperation: (errorMessage = 'Default error') => ({
    success: false,
    error: errorMessage,
  }),
  
  // Jest mock functions
  mockFunction: () => jest.fn(),
  mockDatabase: () => ({
    findUser: jest.fn(),
    saveUser: jest.fn(),
    deleteUser: jest.fn(),
  }),
};
```

### Test Helper Patterns
```typescript
// File-scoped helper functions for setup and common operations
const TestActions = {
  // Setup functions for common scenarios
  setupValidUser: () => {
    mockDatabase.findUser.mockReturnValue(DataTemplate.user({ email: 'test@example.com' }));
    mockDatabase.validatePassword.mockReturnValue(true);
  },
  
  setupInvalidCredentials: () => {
    mockDatabase.findUser.mockReturnValue(null);
  },
  
  // Complex interaction sequences
  performLogin: async (email: string, password: string) => {
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: email } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: password } });
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  },
};
```

### Helper Action Standards

Define when to create reusable helper actions for common state bootstrapping and complex interactions.

#### When to Create Helper Actions (Within Single Test File)

1. **Repetition threshold**: Action sequence appears **3+ times** within the same test file
2. **Complex state setup**: Multi-step process required to reach specific component state
3. **Common prerequisites**: Standard setup needed for multiple tests in this component
4. **Error-prone sequences**: Complex interactions that could be implemented incorrectly

#### When NOT to Create Helper Actions

1. **Simple single actions**: `fireEvent.click(button)` doesn't need abstraction
2. **Short sequences**: 2-3 line action sequences that are already clear
3. **Assertion combinations**: Keep test expectations explicit and visible
4. **Cross-file sharing**: Don't create helpers that span multiple test files (use shared utilities instead)

#### Helper Action Pattern (File-Scoped)

```typescript
// src/components/VerificationDashboard.test.tsx

// Helper actions declared above describe block - scoped to this component only
const TestActions = {
  // Bootstrap to "data loaded" state for VerificationDashboard
  loadMarketData: async () => {
    const loadButton = screen.getByTestId('load-data-button');
    fireEvent.click(loadButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('pivot-test-button')).toBeEnabled();
    });
  },

  // Bootstrap to "completed workflow" state for VerificationDashboard  
  completeFullWorkflow: async () => {
    await TestActions.loadMarketData();
    
    const pivotButton = screen.getByTestId('pivot-test-button');
    fireEvent.click(pivotButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('success-alert')).toBeInTheDocument();
    });
  },

  // Fill date range inputs - specific to this component
  setDateRange: async (startDate: string, endDate: string) => {
    fireEvent.change(screen.getByTestId('start-date-input'), { target: { value: startDate } });
    fireEvent.change(screen.getByTestId('end-date-input'), { target: { value: endDate } });
  },
};

describe('VerificationDashboard', () => {
  it('clicking [data-test="pivot-test-button"] after loadMarketData() => shows [data-test="success-alert"]', async () => {
    const mocks = MockTemplate.successfulPivotTest();
    render(<VerificationDashboard />, { wrapper: WrapperTemplate.withProviders(mocks) });
    
    await TestActions.loadMarketData(); // File-scoped helper
    fireEvent.click(screen.getByTestId('pivot-test-button'));
    
    expect(screen.getByTestId('success-alert')).toBeInTheDocument();
  });
});
```

#### Usage Examples

```typescript
// ✅ Good: File-scoped helper for complex prerequisite
it('changing $symbol after loadMarketData() => triggers auto reload with @progressbar', async () => {
  const mocks = MockTemplate.autoReloadMock();
  render(<VerificationDashboard />, { wrapper: WrapperTemplate.withProviders(mocks) });
  
  await TestActions.loadMarketData(); // File-scoped helper for complex setup
  fireEvent.change(screen.getByTestId('symbol-input'), { target: { value: 'AAPL' } });
  
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

// ✅ Good: Multiple file-scoped helpers  
it('completeFullWorkflow() with custom dates => shows [data-test="final-results"]', async () => {
  const mocks = MockTemplate.successfulWorkflow();
  render(<VerificationDashboard />, { wrapper: WrapperTemplate.withProviders(mocks) });
  
  TestActions.setDateRange('2023-01-01', '2023-12-31'); // File-scoped helper
  await TestActions.completeFullWorkflow(); // File-scoped helper
  
  expect(screen.getByTestId('final-results')).toBeInTheDocument();
});

// ❌ Bad: Over-abstraction of simple actions  
it('clicking [data-test="load-button"] => shows @progressbar', () => {
  TestActions.clickLoadButton(); // Unnecessary - just use fireEvent.click directly
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

// ❌ Bad: Cross-file helper usage (use shared utilities instead)
it('loadData() with authenticated user => returns success', () => {
  LoginTestActions.authenticateUser(); // Wrong - from different test file
  // ...
});
```

#### Helper Naming Conventions

- **State-focused**: `loadMarketData()`, `authenticateUser()`, `completeCheckout()`
- **Action-focused**: `fillLoginForm()`, `selectDateRange()`, `uploadFile()`
- **Outcome-focused**: `reachErrorState()`, `setupEmptyState()`, `prepareDataForTest()`

### Self-Contained Tests (Unit/Component)

Each unit/component test should be independently readable:

```typescript
// ✅ Good: Self-contained and descriptive
it('retrying [data-test="load-data-button"] after network error => clears [data-test="error-alert"]', async () => {
  const mocks = [
    MockTemplate.failedLoadData('Network timeout'),
    MockTemplate.successfulLoadData(),
  ];
  render(<VerificationDashboard />, { wrapper: WrapperTemplate.withProviders(mocks) });
  
  // First attempt fails
  fireEvent.click(screen.getByTestId('load-data-button'));
  await waitFor(() => screen.getByTestId('error-alert'));
  
  // Second attempt succeeds
  fireEvent.click(screen.getByTestId('load-data-button'));
  
  await waitFor(() => {
    expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
  });
});
```

### Usage Pattern

#### Using Helpers and Templates
```typescript
// In test files
import { DataTemplate, MockTemplate } from '@/tests/utils';

// Example usage for simple validation tests
it.each([
  ['user@example.com', true],
  ['invalid-email', false],
  ['', false],
  [null, false]
])('validateEmail("%s") => %s', (email, expected) => {
  const result = validateEmail(email);
  expect(result).toBe(expected);
});

// Example usage for complex scenarios
it('loginHandler() with valid credentials => returns success with token', async () => {
  mockAuthService.authenticate.mockResolvedValue({ success: true, token: 'abc123' });
  
  const result = await loginHandler('user@test.com', 'password123');
  
  expect(result.success).toBe(true);
  expect(result.data.token).toBe('abc123');
});
```

## Mocking Strategies
- Mock only external system interfaces. This includes cookies, routing, window, and time utilities
- Let the test framework handle cleanup. Manual restoration is error-prone and unnecessary

**Example using Jest:**
```typescript
// ✅ CORRECT - Mock system utilities only
beforeEach(() => {
  jest.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    href: 'https://test.com'
  });
});

// ✅ CORRECT - Mock external time
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2023-01-01'));
});

// ❌ WRONG - Mocking internal application code
beforeEach(() => {
  jest.spyOn(userService, 'validateEmail').mockReturnValue(true);
});

// ❌ WRONG - Manual cleanup
afterEach(() => {
  mockFn.mockRestore(); // Jest handles this automatically
});
```


## React Testing Library Syntax

### Element Selection
```typescript
import { render, screen } from '@testing-library/react';

// Primary selection method - data-test attributes
const button = screen.getByTestId('SUBMIT_BUTTON');
const input = await screen.findByTestId('EMAIL_INPUT'); // async elements

// Multiple elements
const items = screen.getAllByTestId('LIST_ITEM');
const cards = await screen.findAllByTestId('USER_CARD');
```

### User Interactions
```typescript
import userEvent from '@testing-library/user-event';

// Click events
await userEvent.click(screen.getByTestId('SUBMIT_BUTTON'));

// Type in inputs
await userEvent.type(screen.getByTestId('EMAIL_INPUT'), 'test@example.com');

// Clear and type
await userEvent.clear(screen.getByTestId('NAME_INPUT'));
await userEvent.type(screen.getByTestId('NAME_INPUT'), 'New Name');

// Select dropdown options
await userEvent.selectOptions(screen.getByTestId('ROLE_SELECT'), 'admin');

// Checkbox/radio
await userEvent.click(screen.getByTestId('AGREE_CHECKBOX'));
```

### Async Testing Patterns
```typescript
import { waitFor } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByTestId('LOADING_SPINNER')).not.toBeInTheDocument();
});

// Wait for async assertion
await waitFor(() => {
  expect(screen.getByTestId('USER_NAME')).toHaveTextContent(/^John Doe$/);
});

// Using findBy (includes waitFor internally)
const element = await screen.findByTestId('ASYNC_CONTENT');
expect(element).toBeInTheDocument();
```

### Text Content Assertions
```typescript
// ✅ CORRECT - Always use regex with ^ and $ for exact matching
expect(screen.getByTestId('USER_NAME')).toHaveTextContent(/^John Doe$/);
expect(screen.getByTestId('ERROR_MSG')).toHaveTextContent(/^Email is required$/);

// ❌ WRONG - String matching allows partial matches (dangerous!)
expect(screen.getByTestId('USER_NAME')).toHaveTextContent('John Doe');
// Would pass for "John Doe Smith" or "Mr. John Doe" - not what you want!
```

### Content vs Count Testing
```typescript
// ✅ CORRECT - Verify both count AND content for dynamic data
const badges = screen.getAllByTestId('BADGE');
expect(badges).toHaveLength(2);
expect(badges[0]).toHaveTextContent(/^Action Needed$/);
expect(badges[1]).toHaveTextContent(/^New$/);

// ❌ WRONG - Only testing count, not verifying correct content
expect(screen.getAllByTestId('BADGE')).toHaveLength(2);
// Could be rendering wrong badges!

// ✅ CORRECT - Test computed/dynamic values
expect(screen.getByTestId('TOTAL_PRICE')).toHaveTextContent(/^\$42\.99$/);
expect(screen.getByTestId('USER_GREETING')).toHaveTextContent(/^Welcome back, John!$/);

// ❌ WRONG - Testing existence without verifying correctness
expect(screen.getByTestId('TOTAL_PRICE')).toBeInTheDocument();
expect(screen.getByTestId('USER_GREETING')).toBeInTheDocument();
```

### Test Data Standards
```typescript
// ✅ CORRECT - Use UUID format for all IDs
const user = UserStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
expect(onEdit).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// ❌ WRONG - Simple string IDs don't match production
const user = UserStub({ id: 'user-123' });
expect(onEdit).toHaveBeenCalledWith('user-123');

// ✅ CORRECT - Provide explicit test values in stubs
renderComponent({ 
  product: ProductStub({ productName: "Donut Lover" })
});
expect(screen.getByTestId("NAME")).toHaveTextContent(/^Donut Lover$/);

// ❌ WRONG - Relying on default stub values (flaky!)
renderComponent({ product: ProductStub() });
expect(screen.getByTestId("NAME")).toHaveTextContent(/^Donut Lover$/);
```

## Enforcement

### Unit/Component Tests
- All new unit/component tests must use standard Jest patterns with helpers
- Code reviews should verify DAMP coverage compliance  
- Automated linting should check for proper test structure
- data-test correlation is required for UI elements  
- Element monikers should be used in test descriptions
- LLMs should reference this document when writing/maintaining unit tests

### E2E/Integration Tests
- Focus on user behavior and business outcomes in descriptions
- Cover critical user workflows and cross-system integration
- Use natural language that maps to business requirements

## Summary

**Unit/Component Tests**: Use standard Jest patterns with helper functions, data-testid correlation, and element monikers for maximum LLM efficiency and precise test targeting.

**E2E/Integration Tests**: Use user-behavior focused descriptions that emphasize business workflows and outcomes rather than implementation details.

This approach provides maximum LLM efficiency while ensuring comprehensive, maintainable test coverage across different testing levels.