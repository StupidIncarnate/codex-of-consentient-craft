# Testing Standards

## Purpose

Minimize tokens while maintaining clarity for LLMs and humans scanning test suites.

**Why so strict?** Loose tests pass when code is broken. Exact tests catch real bugs.

## Core Principles

### Type Safety Required

Tests MUST use proper TypeScript types. **Never use `any`, `as`, or `@ts-ignore`** - if types don't match, fix the code
or types, not the test.

### DAMP > DRY

Tests should be **Descriptive And Meaningful**, not DRY. Each test must be readable standalone without looking at
helpers.

### Test Behavior, Not Implementation
```typescript
// ✅ CORRECT
it("VALID: {price: 100, tax: 0.1} => returns 110")

// ❌ WRONG - Testing internals
it("VALID: {price: 100} => calls _calculateTax()")
```

### Test Isolation

Each test MUST be independent. No shared state, no order dependencies.

### 100% Branch Coverage

Every conditional path must have a test:

**Control Flow:**

- if/else branches
- switch cases
- ternary operators (? :)
- try/catch blocks

**Operators:**
- Optional chaining (?.)
- Nullish coalescing (??)

**Data Patterns:**

- Arrays: [], [single], [multiple]
- Strings: '', single char, multiple chars
- Loops: 0, 1, many iterations
- Pagination: first page, middle, last page
- Ranges: min boundary, within range, max boundary

**Async:**

- Immediate resolution
- Delayed resolution
- Rejected promises

**React/UI:**

- Dynamic JSX values
- Conditional rendering (&&, ternary)
- Event handlers (onClick, onChange, onSubmit)

```typescript
// Needs 3 tests:
const processUser = (user: User | null): string => {
    if (!user) return 'No user';        // Test 1
    if (user.isAdmin) return 'Admin';   // Test 2
    return user.name;                   // Test 3
}

// Arrays need 3 tests:
const formatList = (items: string[]): string => {
    if (items.length === 0) return 'No items';      // Test 1: []
    if (items.length === 1) return items[0];        // Test 2: ['apple']
    return items.join(', ');                        // Test 3: ['apple', 'banana']
}

// Strings need edge cases (even when typed as string):
const formatTitle = (title: string): string => {
    if (title === '') return 'Untitled';            // Test 1: ''
    if (title.length === 1) return title.toUpperCase(); // Test 2: 'a'
    return title.charAt(0).toUpperCase() + title.slice(1); // Test 3: 'hello'
}
```

## Core Pattern

```typescript
// Class Test
describe("ExportedClass", () => {
    describe("functionName()", () => {
        it("PREFIX: {input} => outcome")
    })
})
```

```typescript
describe("functionName", () => {
    it("PREFIX: {input} => outcome")
})

```

**Always use describe blocks - never comments for test organization.**

```typescript
// ✅ CORRECT - Nested describe blocks if testing a class with functions and code paths
describe("UserValidator", () => {
    describe("validateAge()", () => {
        describe("valid input", () => {
            it("VALID: {age: 18} => returns true")
            it("VALID: {age: 65} => returns true")
        })

        describe("invalid input", () => {
            it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")
            it("INVALID_AGE: {age: 'twenty'} => throws 'Must be number'")
        })

        describe("edge cases", () => {
            it("EDGE: {age: 150} => throws 'Unrealistic age'")
            it("EMPTY: {age: null} => throws 'Age required'")
        })
    })

    describe("createUser()", () => {
        describe("valid input", () => {
            it("VALID: {name: 'John', email: 'john@test.com'} => returns User object")
        })

        describe("validation errors", () => {
            it("INVALID_NAME: {name: ''} => throws 'Name required'")
            it("INVALID_EMAIL: {email: 'bad'} => throws 'Invalid email'")
            it("ERROR: {name: 'John', email: 'taken@test.com'} => throws 'Email exists'")
        })
    })
})

// ❌ WRONG - Using comments instead of describe blocks
describe("UserValidator", () => {
    // validateAge tests - valid cases
    it("VALID: {age: 18} => returns true")

    // validateAge tests - invalid cases
    it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")

    // createUser tests
    it("VALID: {name: 'John'} => returns User object")
})
```

### Why This Structure

- **describe(class)**: Groups all tests for an export
- **describe(function)**: Isolates function behavior
- **describe(code path)**: Groups related test scenarios (valid/invalid/edge cases)
- **PREFIX**: Immediately shows test category
- **{input} => outcome**: Pure data transformation visibility

## Prefixes (Required)

- `VALID:` - Expected success paths
- `INVALID_[FIELD]:` - Single field fails validation (e.g., `INVALID_AGE`)
- `INVALID_MULTIPLE:` - Multiple fields fail together
- `ERROR:` - Runtime/system errors (not validation)
- `EDGE:` - Boundary conditions
- `EMPTY:` - Null/undefined/empty inputs

### Complex Validation Patterns
```typescript
// Multiple field errors (when ALL errors collected)
it("INVALID_MULTIPLE: {name: '', email: ''} => throws 'Name required, Email required'")

// Interdependent fields
it("ERROR: {discount: 0.1, coupon: 'SAVE10'} => throws 'Cannot use both discount and coupon'")

// Optional fields (use ? in description when helpful)
it("VALID: {id: '123', name?: 'John'} => updates name only")
```

## Input/Output Format

**Inputs**:

- Objects: `{name: "John", age: 25}`
- Primitives: `42`, `"text"`, `true`, `null`
- Arrays: `[1, 2, 3]`
- No input: Start with `=>`

**Outputs** (action verbs required):

- Returns object: `=> returns user`, `=> returns transaction`
- Returns primitive: `=> returns true`, `=> returns 42`
- Throws: `=> throws 'Error message'`, `=> throws AuthError`
- Void actions: `=> sends email`, `=> updates cache`, `=> processes payment`

## Critical Assertions

### Always Use toStrictEqual for Objects/Arrays

**Property bleedthrough** = When unwanted properties slip through your tests undetected.

```typescript
// ✅ CORRECT - Tests complete object, catches ALL properties
expect(result).toStrictEqual({
    id: '123',
    name: 'John'
    // If result has extra properties, test FAILS (good!)
});

// ❌ WRONG - Testing individual properties = dangerous
expect(result.id).toBe('123');
expect(result.name).toBe('John');
// If result = {id: '123', name: 'John', password: 'leaked!'}, test PASSES (bad!)

// ❌ WRONG - Partial matching allows bleedthrough
expect(result).toMatchObject({id: '123'});
expect(result).toContain('John');
// Extra properties pass through undetected!
```

**Rule: ALWAYS test the complete object/array structure. Never test parts.**

### Test Values, Not Existence
```typescript
// ✅ CORRECT
expect(userId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// ❌ WRONG
expect(userId).toBeDefined(); // Could be any value!
```

### Test Content, Not Just Count
```typescript
// ✅ CORRECT - Verify complete array content
const items = getAllItems();
expect(items).toStrictEqual(['apple', 'banana']);

// ❌ WRONG - Count alone doesn't verify correctness
expect(getAllItems()).toHaveLength(2); // Could be wrong items!

// ❌ WRONG - Multiple assertions when one would work
expect(items[0]).toBe('apple');
expect(items[1]).toBe('banana'); // Use toStrictEqual instead!
```

### Mock Only External Systems (With Exact Values)
```typescript
// ✅ CORRECT - Mock external dependencies with predictable values
jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // Exact timestamp
jest.spyOn(window, 'fetch').mockResolvedValue(response);

// Then test the complete object with exact values
expect(result).toStrictEqual({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    timestamp: 1609459200000,
    // ALL other properties that result should have
});

// ❌ WRONG - Mocking internal application code
jest.spyOn(userService, 'validateEmail').mockReturnValue(true);
```

### Avoiding Conditionals in Mocks

**General Rule: Mocks are test smells.** They should be avoided whenever possible. Use them ONLY for external systems
you cannot control (APIs, file system, crypto, Date, etc.).

When you must use mocks, never use conditional logic inside mock implementations. Conditionals make tests brittle and
hard to debug.

```typescript
// ❌ WRONG - Conditional logic in mock creates test complexity
let callCount = 0;
mockESLint.mockImplementation((options) => {
    callCount++;
    if (callCount === 1) {
        return {lintText: mockFirstCall};
    } else {
        return {lintText: mockSecondCall};
    }
});

// ❌ WRONG - State tracking makes tests fragile
const mockInstances = [];
mockESLint.mockImplementation((options) => {
    const instance = mockInstances.length === 0 ? firstInstance : secondInstance;
    mockInstances.push(instance);
    return instance;
});

// ✅ CORRECT - Explicit call ordering without conditionals
mockESLint
    .mockImplementationOnce(() => ({lintText: mockFirstCall}))
    .mockImplementationOnce(() => ({lintText: mockSecondCall}));

// ✅ CORRECT - Verify specific calls with exact arguments
expect(mockESLint).toHaveBeenNthCalledWith(1, {
    cwd: '/expected/path',
    overrideConfig: [originalConfig]
});
expect(mockESLint).toHaveBeenNthCalledWith(2, {
    cwd: '/expected/path',
    overrideConfig: [simplifiedConfig]
});
```

**Why conditionals in mocks are bad:**

- Hide test intent - unclear what behavior is being tested
- Create debugging nightmares - failures don't show which path failed
- Introduce race conditions - call order becomes critical
- Make tests brittle - small changes break unrelated tests

**Better patterns:**

- Use `mockImplementationOnce()` for sequential calls
- Use `mockResolvedValueOnce()` for async sequential calls
- Verify exact call arguments with `toHaveBeenNthCalledWith()`
- Keep each test's mock setup isolated and explicit

### Test Mock Calls Completely
```typescript
// ✅ CORRECT - Test both count AND arguments
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('expectedArg', {id: '123'});

// ❌ WRONG - Only testing call count
expect(mockFn).toHaveBeenCalledTimes(1); // Called with what args?

// ❌ WRONG - Only testing arguments
expect(mockFn).toHaveBeenCalledWith('expectedArg'); // Called how many times?
```

### Async Testing
```typescript
// Async success
await expect(fetchData()).resolves.toStrictEqual({ data: 'value' });

// Async failure
await expect(failingCall()).rejects.toThrow('Error message');
```

## Common Anti-Patterns (Avoid These!)

1. **Property Bleedthrough**: Using partial matchers that miss extra properties
2. **Testing Implementation**: Spying on internal methods instead of outputs
3. **Shared Test State**: Tests depending on each other
4. **Existence-Only Checks**: Using toBeDefined() instead of actual values
5. **Count-Only Checks**: Testing length without verifying content
6. **Over-Mocking**: Mocking internal code instead of just external systems
7. **Conditional Mocking**: Using if/else logic inside mock implementations
8. **String IDs**: Using 'user-123' instead of proper UUIDs
9. **Comment Organization**: Using comments instead of describe blocks for test structure
10. **Manual Mock Cleanup**: Jest handles this automatically
11. **Type Escape Hatches**: Using `any`, `as`, `@ts-ignore` in tests

## Forbidden Jest Matchers

```tsx
// ❌ NEVER USE THESE - They allow bugs through
expect().toEqual()                     // → Use .toStrictEqual()
expect().toMatchObject()               // → Use .toStrictEqual()
expect().toContain()                   // → Use .toStrictEqual()
expect().toBeTruthy() / expect.toBeFalsy()   // → Use .toBe(true) / .toBe(false)
expect().toMatch('text')               // → Use .toMatch(/^exact text$/)
expect().toHaveProperty('key')         // → Test actual value with .toBe()
expect.objectContaining()      // → Test complete object
expect.arrayContaining()       // → Test complete array
expect.stringContaining()      // → Use regex /^.*substring.*$/
expect.any(String)             // → Test actual string value
expect.any(Number)             // → Test actual number
expect.any(Object)             // → Test complete object shape
// EXCEPTION: expect.any(Function) is OK - can't compare functions

// ✅ CORRECT ALTERNATIVES
expect(result).toStrictEqual({id: '123', name: 'John'})
expect(flag).toBe(true)  // Not toBeTruthy()
expect(text).toMatch(/^Error: Invalid input$/)  // Full message with anchors
expect(count).toBe(5)    // Exact value, not range
expect(['a', 'b', 'c']).toStrictEqual(['a', 'b', 'c'])  // Complete array
expect(error).toStrictEqual({
    name: 'ConnectionError',
    message: 'Connection failed',
    code: 'ECONNREFUSED'
    // ALL error properties
})
```

## Writing Tests (LLM Instructions)

### When Types Don't Match

If you encounter type errors, **ASK THE USER** - never use:

- `as any` or type assertions
- `@ts-ignore` or `@ts-expect-error`
- `.toEqual()` to avoid checking complete objects
- `expect.any()` to bypass exact value testing

The type mismatch indicates either a bug in the code or your test approach needs adjustment.

### Step 1: Write Stubs

First pass - structure only, no implementations:
```typescript
describe("Calculator", () => {
    describe("add()", () => {
        it("VALID: {a: 1, b: 2} => returns 3")
        it("VALID: {a: -1, b: 1} => returns 0")
        it("EDGE: {a: MAX_INT, b: 1} => throws 'Overflow'")
    })
})
```

### Step 2: Add Assertions
```typescript
it("VALID: {a: 1, b: 2} => returns 3", () => {
    expect(add(1, 2)).toBe(3);
})
```

### Key Rules

1. **Always use PREFIX** - Never write tests without category prefix
2. **Action verbs in outcomes** - `=> returns user` not `=> user`
3. **Specific over generic** - `INVALID_AGE` not just `ERROR`
4. **No filler words** - No "should", "when", "with", "given"
5. **Real error messages** - Use actual strings from code
6. **Group by prefix** - All VALID tests together, then INVALID_*, etc.

## Examples

```typescript
describe("UserValidator", () => {
    describe("validateAge()", () => {
        it("VALID: {age: 18} => returns true")
        it("VALID: {age: 65} => returns true")
        it("INVALID_AGE: {age: -1} => throws 'Age must be positive'")
        it("INVALID_AGE: {age: 'twenty'} => throws 'Must be number'")
        it("EDGE: {age: 150} => throws 'Unrealistic age'")
        it("EMPTY: {age: null} => throws 'Age required'")
    })

    describe("createUser()", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns User object")
        it("INVALID_NAME: {name: ''} => throws 'Name required'")
        it("INVALID_EMAIL: {email: 'bad'} => throws 'Invalid email'")
        it("ERROR: {name: 'John', email: 'taken@test.com'} => throws 'Email exists'")
    })

    describe("processPayment()", () => {
        it("VALID: {amount: 100, card: validCard} => processes transaction")
        it("EMPTY: {} => throws 'No payment data'")
        it("EDGE: {amount: 0.01} => processes transaction")
        it("ERROR: {amount: 100, card: expiredCard} => throws 'Card expired'")
    })
})
```

## Stub Factories & Test Helpers

### When to Create Factories/Helpers

- **Data factories**: When multiple tests use similar data with minor variations
- **Action helpers**: When same setup/action sequence appears 3+ times in a file
- **Complex state**: Multi-step process to reach specific test state
- **One stub function export** (primary)

### Stub Factory Pattern (Type-Safe)
```typescript
// tests/stubs/user-stub.ts
import type {User} from '../../src/types'; // Real types, not any!

export const UserStub = (props: Partial<User> = {}): User => ({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Always use UUIDs
    name: 'John Doe',
    email: 'john@example.com',
    ...props,
});

// ❌ WRONG - Never use any or type escapes
const BadStub = (props: any = {}): any => ({ // NO!
    ...props
});
```

### Usage (Always Provide Explicit Values)

```typescript
// ✅ CORRECT - Explicit values show what's being tested
it("VALID: {email: 'test@example.com'} => sends welcome email", () => {
    const user = UserStub({email: 'test@example.com'});
    expect(sendWelcomeEmail(user)).toStrictEqual({
        to: 'test@example.com',
        subject: 'Welcome',
        template: 'welcome'
    });
})

// ❌ WRONG - Relying on stub defaults = brittle/unclear
it("VALID: {} => sends welcome email", () => {
    const user = UserStub(); // What email is being tested?
    expect(sendWelcomeEmail(user)).toStrictEqual(/* ... */);
})
```

### Test Action Helpers (File-Scoped)
```typescript
// At top of test file, NOT exported
const TestActions = {
    createAuthenticatedUser: () => {
        const user = UserStub({role: 'admin'});
        mockAuth.login(user);
        return user;
  },

    setupPaymentFlow: async () => {
        // Complex multi-step setup
        await mockStripe.init();
        await mockDatabase.clearTransactions();
    }
};

// Usage in tests
it("VALID: authenticated admin => returns dashboard data", async () => {
    const user = TestActions.createAuthenticatedUser();
    const result = await getDashboard(user.id);
    expect(result).toStrictEqual({ /* ... */});
})
```

## Parameterized Tests

```typescript
it.each([
    [18, true],
    [65, true],
    [17, false]
])("VALID: {age: %i} => returns %s")

// Only test null/undefined if type allows it (string | null | undefined)
it.each(['', null, undefined])(
    "EMPTY: {name: %s} => throws 'Name required'"
)
```

## File Organization

```
src/
  user-validator.ts
  user-validator.test.ts  // Co-located unit tests
tests/
  stubs/                  // Shared test factories
  e2e/                    // End-to-end only
```

## Framework-Specific Patterns

### React Testing
```typescript
describe("UserCard", () => {
    describe("render()", () => {
        it("VALID: {user: activeUser} => renders name", () => {
            render(<UserCard user = {UserStub({name: 'John'})}
            />);
            expect(screen.getByTestId('user-name')).toHaveTextContent(/^John$/);
        })

        it("VALID: {onClick: handler} => calls handler on click", () => {
            const onClick = jest.fn();
            const user = UserStub({id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'John'});
            render(<UserCard user = {user}
            onClick = {onClick}
            />);
            fireEvent.click(screen.getByTestId('card-button'));
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick).toHaveBeenCalledWith({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John',
                email: 'john@example.com'  // Test complete object!
            });
        })

        it("EDGE: {user: null} => renders placeholder", () => {
            render(<UserCard user = {null}
            />);
            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        })
    })
})

// Use data-testid for element selection
screen.getByTestId('submit-button')
// Use regex for exact text matching
expect(element).toHaveTextContent(/^Exact Text$/);
```

### Node.js API Testing
```typescript
describe("UserController", () => {
    beforeEach(() => {
        // Mock ID generation for predictable tests
        jest.spyOn(crypto, 'randomUUID')
            .mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    describe("POST /users", () => {
        it("VALID: {name: 'John', email: 'john@test.com'} => returns 201", async () => {
            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'john@test.com'});
            expect(res.status).toBe(201);
            expect(res.body).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Exact mocked ID
                name: 'John',
                email: 'john@test.com'
                // Must test ALL properties to prevent bleedthrough
            });
        })

        it("INVALID_EMAIL: {email: 'bad'} => returns 400", async () => {
            const res = await request(app)
                .post('/users')
                .send({name: 'John', email: 'bad'});
            expect(res.status).toBe(400);
            expect(res.body).toStrictEqual({
                error: 'Invalid email',
                code: 'INVALID_EMAIL'
                // Test complete error object
            });
        })
    })
})
```

### CLI/NPX Library Testing
```typescript
describe("CLI", () => {
    describe("execute()", () => {
        it("VALID: ['--config', 'file.json'] => processes config", () => {
            const result = cli.execute(['--config', 'file.json']);
            expect(result).toStrictEqual({
                exitCode: 0,
                output: 'Config loaded from file.json',
                errors: []
                // Test complete result object
            });
        })

        it("ERROR: ['--invalid'] => returns help text", () => {
            const result = cli.execute(['--invalid']);
            expect(result).toStrictEqual({
                exitCode: 1,
                output: 'Usage: cli [options]\nOptions:\n  --config <file>',
                errors: ['Unknown option: --invalid']
            });
        })
    })
})
```