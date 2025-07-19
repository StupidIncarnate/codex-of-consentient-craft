# Testing Standards

**Core Principle: DAMP (Descriptive And Meaningful Phrases)** - Each test should be readable from top to bottom without needing to look at other functions. Prefer clarity and readability over DRY (Don't Repeat Yourself) in test code.

## Test Philosophy
- Write tests that describe [behavior, not implementation](#behavior-vs-implementation). Implementation details change, behavior contracts do not change
- Keep each test self-contained and readable. DAMP principle ensures that tests which fail are then readable (see [Test Structure Patterns](#test-structure-patterns)) 
- [Isolate tests](#test-isolation) from each other. Independent tests can run in any order without side effects - no shared state, no test depending on another test's execution
- When doing unit and integration tests, [co-locate test files](#test-file-organization) with source code. Use .test.ts or .test.tsx suffix for easy discovery

### Behavior vs Implementation

Test what your code does, not how it does it. Internal implementation can change without breaking behavior.

**Example using Jest:**
```typescript
// ✅ CORRECT - Tests behavior
it('calculates total price including tax', () => {
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, taxRate: 0.1 });
  expect(cart.getTotal()).toBe(110);
});

// ❌ WRONG - Tests implementation
it('calls calculateTax method', () => {
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
it('creates user', () => {
  const user = createUser({ name: 'John' });
  expect(user.id).toBeDefined();
});

it('updates user', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user.id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});

// ❌ WRONG - Tests depend on shared state
let user: User;

it('creates user', () => {
  user = createUser({ name: 'John' });
  expect(user.id).toBeDefined();
});

it('updates user', () => {
  // This fails if previous test didn't run!
  updateUser(user.id, { name: 'Jane' });
  expect(user.name).toBe('Jane');
});
```

### Test File Organization

Keep tests close to the code they test for easy discovery and maintenance.

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx    ✅ Co-located
  utils/
    validators.ts
    validators.test.ts   ✅ Co-located
    
tests/
  Button.test.tsx        ❌ Separated from source
```


## Test Structure Patterns

### Test Organization Hierarchy
- Use one root-level describe block per test file (matches the class/module being tested)
- Nest describe blocks to build context: class/module → method → condition
- Each describe adds one piece of context (when X, with Y, given Z)
- `it` statements describe the outcome simply: "returns user", "throws Error", "emits event"
- Use arrow notation (`→`) only within `it` descriptions when showing specific input/output mappings
- Group tests by their most specific shared condition
- Describe blocks should read naturally when Jest outputs them: "UserService › createUser() › when email is new › returns {id, name, created}"

```typescript
describe('UserService', () => {
  describe('createUser()', () => {
    describe('when email is new', () => {
      it('returns {id, name, created}', () => {});
      it('sends welcome email', () => {});
    });
    
    describe('when email already exists', () => {
      it('throws DuplicateUserError', () => {});
    });
    
    describe('when data is invalid', () => {
      it('email === "" → throws ValidationError', () => {});
      it('email !== valid format → throws ValidationError', () => {});
      it('age < 0 → throws RangeError', () => {});
    });
  });
  
  describe('updateUser()', () => {
    describe('when user exists', () => {
      it('returns updated user', () => {});
      it('emits UserUpdated event', () => {});
    });
    
    describe('when user not found', () => {
      it('throws NotFoundError', () => {});
    });
  });
});
```

### Arrange-Act-Assert Pattern
The Arrange-Act-Assert pattern helps organize complex tests with multiple setup steps. Use it when tests have significant setup, not for simple assertions.

**When to use AAA - Complex setup example using Jest:**
```typescript
it('processes order with multiple discounts and shipping rules', () => {
  // Arrange - Multiple setup steps with readable data
  const goldCustomer = createCustomer({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    membershipLevel: 'gold',
    address: { country: 'US', state: 'CA' }
  });
  const orderItems = [
    createOrderItem({ sku: 'WIDGET-1', price: 50, quantity: 2 }),
    createOrderItem({ sku: 'GADGET-2', price: 30, quantity: 1 })
  ];
  const activePromotions = ['SUMMER20', 'GOLD_MEMBER'];
  
  // Act - The one action we're testing
  const order = processOrder({
    customer: goldCustomer,
    items: orderItems,
    promotions: activePromotions,
  });
  
  // Assert - Test whole object to catch property bleedthrough
  expect(order).toStrictEqual({
    subtotal: 130,
    discount: 26,      // 20% off
    tax: 13.5,
    shipping: 0,       // Free for gold members
    total: 117.5
  });
});
```

**When NOT to use AAA - Simple tests:**
```typescript
// ✅ CORRECT - Simple assertions don't need AAA
it('empty email → returns null', () => {
  expect(parseUser({ email: '' })).toBeNull();
});

it('validates email format', () => {
  expect(isValidEmail({ email: 'test@example.com' })).toBe(true);
});

// ❌ WRONG - AAA adds noise to simple tests
it('empty email → returns null', () => {
  // Arrange
  const options = { email: '' };
  
  // Act
  const result = parseUser(options);
  
  // Assert
  expect(result).toBeNull();
});
```

## Coverage Requirements
- Achieve [100% branch coverage](#branch-coverage) for conditional logic. This includes if/else, switch, ternary, optional chaining, try/catch
- Focus on [dynamic behavior and computed values](#dynamic-vs-static-testing). Static props and hardcoded text provide no value to test
- Test all code paths including [error cases](#error-path-testing). Both positive and negative cases reveal different bugs

### Branch Coverage

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
    it('amount <= 0 → throws Error', () => {
      expect(() => processPayment({ amount: 0 })).toThrow('Invalid amount');
    });
  });
  
  describe('when amount is valid', () => {
    describe('with discount', () => {
      describe('when total < 100', () => {
        it('applies 10% discount and charges shipping', () => {
          expect(processPayment({ amount: 50, hasDiscount: true }))
            .toStrictEqual({ total: 45, shipping: 10 });
        });
      });
      
      describe('when total > 100', () => {
        it('applies 10% discount and free shipping', () => {
          expect(processPayment({ amount: 120, hasDiscount: true }))
            .toStrictEqual({ total: 108, shipping: 0 });
        });
      });
    });
    
    describe('without discount', () => {
      describe('when total < 100', () => {
        it('charges full price and shipping', () => {
          expect(processPayment({ amount: 50, hasDiscount: false }))
            .toStrictEqual({ total: 50, shipping: 10 });
        });
      });
      
      describe('when total > 100', () => {
        it('charges full price with free shipping', () => {
          expect(processPayment({ amount: 150 }))
            .toStrictEqual({ total: 150, shipping: 0 });
        });
      });
    });
  });
});
```

### Dynamic vs Static Testing

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

### Error Path Testing

Test both success and failure cases. Error handling often has the most bugs.

**Example using Jest:**
```typescript
// ✅ CORRECT - Tests both paths
describe('fetchUser()', () => {
  it('valid ID → returns user', async () => {
    const user = await fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(user).toStrictEqual({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'John' });
  });
  
  it('invalid ID → throws NotFoundError', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow('User not found');
  });
  
  it('network error → throws NetworkError', async () => {
    mockNetworkError();
    await expect(fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).rejects.toThrow('Network error');
  });
});

// ❌ WRONG - Only happy path
it('fetches user', async () => {
  const user = await fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  expect(user.name).toBe('John');
});
```

## Test Quality
- Use async/await for asynchronous operations. Callbacks and promise chains act poorly in tests
- Extract complex setup to helper functions. But keep the test body self-contained
- Every test must have assertions. Tests without assertions are not testing anything and defeat the purpose of testing

**Example using Jest:**
```typescript
// ✅ CORRECT - Clean async/await
it('fetches user data', async () => {
  const user = await fetchUser({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
  expect(user.name).toBe('John');
});

// ✅ CORRECT - Helper function but test remains readable
function createTestUser(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}

it('updates user email', () => {
  const user = createTestUser({ email: 'old@example.com' });
  const updated = updateEmail(user, 'new@example.com');
  expect(updated.email).toBe('new@example.com');
});

// ❌ WRONG - Promise chains are harder to read
it('fetches user data', () => {
  return fetchUser('a1b2c3d4-e5f6-7890-abcd-ef1234567890').then(user => {
    expect(user.name).toBe('John');
  });
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
// ✅ SAFE - Strict equality
const user = createUser({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John' });
expect(user).toStrictEqual({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John', password: null });
// PASSES - validates exact structure

// ❌ DANGEROUS - Property bleedthrough
const userWithPassword = createUser({ id: 'b5d6e7f8-9abc-def0-1234-567890abcdef', name: 'John', password: 'secret123' });
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

## Test Data Patterns
- Create type-safe stubs for all data types. This maintains parity with production type safety
- Use UUID format for IDs. Simple strings like 'user-123' don't match production data
- Provide explicit values in test data. Relying on default stub values creates brittle tests
- Keep test data minimal but realistic. Only include properties relevant to the test

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
it('email: "test@example.com" → sends welcome email', () => {
  const user = UserStub({ email: 'test@example.com' });
  const result = sendWelcomeEmail(user);
  expect(result).toStrictEqual({
    to: 'test@example.com',
    subject: 'Welcome to our platform',
    template: 'welcome-email'
  });
});

const formatUserDisplay(user: Pick<User, 'name', 'email'>) => {
  return {
    displayName: "Display: " + user.name,
    email: user.email
  };
}

// ✅ CORRECT - Minimal stub overrides, complete object assertion
it('user with firstName and lastName → returns formatted user', () => {
  const user = UserStub({ name: 'Mick Robberts', email: 'johnny@gmail.com' });
  expect(formatUser(user)).toStrictEqual({
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
it('formats user display name', () => {
  const user = {
    id: 'd7e8f9a0-1bcd-ef23-4567-89012abcdef3',
    name: 'Mick Robberts',
    email: 'johnny@example.com',  // Not needed for name formatting
    age: 30,                     // Not needed for name formatting
    address: { street: '123 Main St' }  // Not needed for name formatting
  };
  expect(formatUserDisplay(user)).toStrictEqual({
    displayName: "Display: Mick Robberts",
    email: 'johnny@gmail.com'
  }) 
});
```

## Element Selection
- Use data-test attributes for element queries. CSS classes and text content change with UI updates
- Select by test ID exclusively. This survives refactoring better than any other selector

**Example using React Testing Library:**
```tsx
// ✅ CORRECT - Using data-test attribute
<button data-test="SUBMIT_BUTTON" onClick={handleSubmit}>
  Submit
</button>

const button = screen.getByTestId('SUBMIT_BUTTON');

// ❌ WRONG - Using CSS classes
<button className="btn btn-primary" onClick={handleSubmit}>
  Submit
</button>

const button = document.querySelector('.btn-primary'); // Breaks when styles change

// ❌ WRONG - Using text content
<button onClick={handleSubmit}>
  {loading ? 'Submitting...' : 'Submit'}
</button>

const button = screen.getByText('Submit'); // Breaks when text changes
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

## Jest Framework Syntax

### Syntax Preferences
- Use `describe`/`it` syntax over `describe`/`test` for consistency
- `it` reads more naturally: "it should do something"
- Place all setup/teardown hooks at the top of their describe block: `beforeAll`, `beforeEach`, `afterEach`, `afterAll` (in that order)

### Test Organization
```typescript
describe('MathUtils', () => {
  
  beforeEach(() => { /*...*/})
  
  describe('calculateTotal()', () => {
    it('sums positive numbers', () => {
      expect(calculateTotal([1, 2, 3])).toBe(6);
    });
    
    it('handles empty array → returns 0', () => {
      expect(calculateTotal([])).toBe(0);
    });
    
    describe('with negative numbers', () => {
      it('sums correctly', () => {
        expect(calculateTotal([-1, 2, -3])).toBe(-2);
      });
    });
  });
  
  describe('formatCurrency()', () => {
    it('adds $ prefix', () => {
      expect(formatCurrency(42.5)).toBe('$42.50');
    });
    
    it('rounds to 2 decimals', () => {
      expect(formatCurrency(42.999)).toBe('$43.00');
    });
  });
});
```

### Assertion Methods

#### toStrictEqual vs toBe vs toEqual
```typescript
// ✅ CORRECT - Use toStrictEqual for ALL objects and arrays
expect(result).toStrictEqual({ id: 'e8f9a0b1-2cde-f345-6789-0123abcdef45', name: 'John' });
expect(items).toStrictEqual(['apple', 'banana']);

// ✅ CORRECT - Test the whole object to catch property bleedthrough
expect(result.current).toStrictEqual({
  isLoading: true,
  count: 5,
  error: null
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

// ❌ NEVER use these - they allow property bleedthrough
expect(user).toEqual(expect.objectContaining({ id: 'a0b1c2d3-4e5f-6789-0abc-def123456789' }));
expect(items).toEqual(expect.arrayContaining(['apple']));
```

#### Other Assertions
```typescript
// Specific matchers communicate intent better
expect(items).toHaveLength(3);     // Better than expect(items.length).toBe(3)
expect(error).toBeNull();          // Better than expect(error).toBe(null)
expect(value).toBeUndefined();       // Better than expect(value === undefined).toBe(true)

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

### Parameterized Tests with .each

Use `it.each` and `describe.each` to reduce boilerplate when testing multiple scenarios with similar structure.

#### it.each for Similar Test Cases
```typescript
// ✅ CORRECT - Use it.each for repetitive test cases
describe('validateEmail()', () => {
  it.each([
    ['valid@email.com', true],
    ['also.valid+tag@domain.co.uk', true],
    ['invalid.email', false],
    ['@invalid.com', false],
    ['invalid@', false],
    ['', false],
  ])('email: "%s" → returns %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});

// ❌ WRONG - Repetitive individual tests
describe('validateEmail()', () => {
  it('valid@email.com → returns true', () => {
    expect(validateEmail('valid@email.com')).toBe(true);
  });
  
  it('invalid.email → returns false', () => {
    expect(validateEmail('invalid.email')).toBe(false);
  });
  // ... many more repetitive tests
});
```

#### it.each with Objects for Complex Cases
```typescript
// ✅ CORRECT - Named parameters for clarity
describe('calculateShipping()', () => {
  it.each([
    { shipping: { weight: 1, distance: 100, express: false }, expected: 5.99 },
    { shipping: { weight: 1, distance: 100, express: true }, expected: 12.99 },
    { shipping: { weight: 5, distance: 500, express: false }, expected: 15.99 },
    { shipping: { weight: 5, distance: 500, express: true }, expected: 29.99 },
  ])('testing with %j → costs $%expected', 
    ({ shipping, expected }) => {
      expect(calculateShipping(shipping)).toBe(expected);
    }
  );
});
```

#### describe.each for Multiple Test Suites
```typescript
// ✅ CORRECT - Test multiple implementations with same behavior
describe.each([
  ['ArrayStack', ArrayStack],
  ['LinkedListStack', LinkedListStack],
])('%s', (name, StackImplementation) => {
  let stack: Stack<number>;
  
  beforeEach(() => {
    stack = new StackImplementation<number>();
  });
  
  it('starts empty', () => {
    expect(stack.isEmpty()).toBe(true);
  });
  
  it('push then pop returns same value', () => {
    stack.push(42);
    expect(stack.pop()).toBe(42);
  });
  
  it('throws when popping empty stack', () => {
    expect(() => stack.pop()).toThrow('Stack is empty');
  });
});
```

#### When NOT to Use .each
```typescript
// ❌ WRONG - Using .each obscures important differences
it.each([
  [{ role: 'admin' }, true, false],
  [{ role: 'user' }, false, true],
])('user %p can edit: %s, can delete: %s', (user, canEdit, canDelete) => {
  expect(permissions.canEdit(user)).toBe(canEdit);
  expect(permissions.canDelete(user)).toBe(canDelete);
});

// ✅ CORRECT - Explicit tests for different behaviors
describe('permissions', () => {
  describe('when user is admin', () => {
    it('can edit', () => {
      expect(permissions.canEdit({ role: 'admin' })).toBe(true);
    });
    
    it('cannot delete', () => {
      expect(permissions.canDelete({ role: 'admin' })).toBe(false);
    });
  });
  
  describe('when user is regular user', () => {
    it('cannot edit', () => {
      expect(permissions.canEdit({ role: 'user' })).toBe(false);
    });
    
    it('can delete own items', () => {
      expect(permissions.canDelete({ role: 'user' })).toBe(true);
    });
  });
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
import { userEvent } from '@testing-library/react';

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
expect(screen.getByTestId('USER_GREETING')).toBeDefined();
```

### Test Data Standards
```typescript
// ✅ CORRECT - Use UUID format for all IDs
const user = UserStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
expect(onEdit).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// ❌ WRONG - Simple string IDs don't match production
const user = UserStub({ id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890' });
expect(onEdit).toHaveBeenCalledWith('1a2b3c4d-5e6f-7890-abcd-ef1234567890');

// ✅ CORRECT - Provide explicit test values in stubs
renderComponent({ 
  product: ProductStub({ productName: "Donut Lover" })
});
expect(screen.getByTestId("NAME")).toHaveTextContent(/^Donut Lover$/);

// ❌ WRONG - Relying on default stub values (flaky!)
renderComponent({ product: ProductStub() });
expect(screen.getByTestId("NAME")).toHaveTextContent(/^Donut Lover$/);
```

