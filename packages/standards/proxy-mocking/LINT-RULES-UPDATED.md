# ESLint Rules for Create-Per-Test Proxy Pattern

## Implementation Status

### ✅ Fully Implemented

### 🔧 Additional Proxy Rules Implemented (not in this doc)

- **`enforce-implementation-testing`**: Proxy filename must follow pattern `[baseName]-[folderType].proxy.ts`
- **`enforce-project-structure`**: Proxy export must be arrow function + match pattern `[baseName]Proxy`
- **`enforce-jest-mocked-usage`**: Must use `jest.mocked()` when using `jest.mock()` + `jest.spyOn()` only for globals
- **`enforce-proxy-patterns`**: `jest.mock()` calls must be at module level (outside functions)

---

---


### Rule 15: Proxy Instances Must Be Exported Const at Module Level

**Rule:** `test-proxy-must-be-exported-const`

**What it checks:**

- Only applies to `.test.ts` and `.test.tsx` files
- Detects proxy creation calls (`*Proxy()`)
- Verifies proxies are declared with `const` (not `let` or `var`)
- Ensures proxies are exported at module level
- Prevents proxy creation inside describe/it blocks

**Detection logic:**

1. Scans VariableDeclaration nodes in test files
2. Identifies declarations where init is a CallExpression with name ending with `Proxy`
3. Checks if declaration kind is `const`
4. Checks if parent node is ExportNamedDeclaration
5. Walks up ancestor tree to verify not inside `describe`, `it`, or `test` blocks

**Violations:**

- Proxy instance not exported: `const widgetProxy = widgetProxy()`
- Using `let` or `var`: `export let widgetProxy = WidgetProxy()`
- Creating proxy inside describe/it block

**Messages:**

- `'Proxy instance {{name}} must be exported with "export const" at module level (before describe blocks).'`
- `'Proxy instance {{name}} must use "const", not "let" or "var".'`
- `'Proxy instance {{name}} must be created at module level, not inside describe/it blocks.'`

**Why This Rule Matters:**

For linting to work correctly (before transformation), proxy instances must be explicitly created and exported:

```typescript
// ❌ BAD - Not exported
const widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be exported

// ❌ BAD - Using let/var
export let widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be const

// ❌ BAD - Inside describe block
describe('Widget', () => {
    export const widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be at module level
});

// ✅ GOOD - Exported const at module level
export const widgetProxy = createWidgetProxy();

describe('Widget', () => {
    it('test', () => {
        widgetProxy.configure({...});  // Lint sees this variable
    });
});
```

**Key insights:**

1. **Export required**: Lint sees the variable, no "undefined" errors
2. **Const required**: Proxy instances should never be reassigned
3. **Module level required**: Transformer injects bootstrap at module level, needs to find the instance

---

### Rule 17: Adapter Proxies Must Setup Mocks in Constructor

> **⚠️ PARTIAL COVERAGE**: The `enforce-proxy-patterns` rule validates that returned objects cannot have a `bootstrap`
> method. However, it does NOT validate that `mock.mockImplementation()` is called in the constructor. Only the "no
> bootstrap" check is enforced.

**Rule:** `adapter-proxy-must-setup-in-constructor`

**What it checks:**

- Only applies to `-adapter.proxy.ts` files
- Verifies that mocks are configured in the constructor (before return statement)
- Ensures no `bootstrap()` method exists in the returned object

**Detection logic:**

1. Identifies the exported `create*Proxy` function
2. Finds the return object and checks its properties for `bootstrap` method
3. Scans statements before the return statement for mock setup calls (e.g., `mock.mockImplementation()`)
4. Reports violations if:
    - `bootstrap()` method exists in return object
    - No mock setup found before return statement

**Violations:**

- Having a `bootstrap()` method in the returned object
- Not calling `mock.mockImplementation()` or similar setup in constructor

**Messages:**

- `'Adapter proxy must call mock.mockImplementation() in constructor (before return statement).'`
- `'Adapter proxy should not have a bootstrap() method. Setup mocks in constructor instead.'`

**Why This Rule Matters:**

```typescript
// ❌ BAD - Has bootstrap method
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    return {
        bootstrap: () => {  // ❌ Don't use bootstrap!
            mock.mockImplementation(async () => ({data: {}, status: 200}));
        },
        returns: ({url, response}) => { ...
        }
    };
};

// ✅ GOOD - Mocks setup in constructor
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    // ✅ Setup mocks HERE (runs when proxy created)
    mock.mockImplementation(async () => ({
        data: {},
        status: 200,
        statusText: 'OK'
    }));

    return {
        returns: ({url, response}) => { ...
        }
    };
};
```

---

### Rule 18: Non-Adapter Proxies Must Create Child Proxies in Constructor

> **⚠️ PARTIAL COVERAGE**: The `enforce-proxy-patterns` rule validates that returned objects cannot have a `bootstrap`
> method. However, it does NOT validate that child proxies are created before the return statement (in constructor vs
> inside methods). Only the "no bootstrap" check is enforced.

**Rule:** `proxy-must-create-children-in-constructor`

**What it checks:**

- Applies to all `.proxy.ts` files EXCEPT `-adapter.proxy.ts` files
- Ensures child proxies are created in constructor (before return statement)
- Ensures no `bootstrap()` method exists

**Detection logic:**

1. Finds the exported `create*Proxy` function
2. Checks returned object for `bootstrap` method property
3. Finds all child proxy creation calls (`create*Proxy()`) in function body
4. Locates the return statement
5. Verifies each child proxy creation occurs before the return statement

**Violations:**

- Having a `bootstrap()` method in the returned object
- Creating child proxies inside methods (after return statement) instead of in constructor

**Messages:**

- `'Child proxy {{proxyName}} must be created in constructor (before return statement), not inside methods.'`
- `'Proxy should not have a bootstrap() method. Create child proxies in constructor instead.'`

**Why This Rule Matters:**

```typescript
// ❌ BAD - Child proxy created inside method
export const createBrokerProxy = () => {
    return {
        bootstrap: () => {  // ❌ Don't use bootstrap!
            const httpProxy = createHttpAdapterProxy();  // ❌ Too late!
            httpProxy.bootstrap();
        }
    };
};

// ✅ GOOD - Child proxy created in constructor
export const createBrokerProxy = () => {
    // ✅ Create child proxy HERE (runs when parent proxy created)
    const httpProxy = createHttpAdapterProxy();

    return {
        setupUser: ({userId, user}) => {
            httpProxy.returns({...});  // Child already created
        }
    };
};
```

---

### Rule 19: Tests Must Create Proxy Inside Test (Not Module-Level)

**Rule:** `test-proxy-must-be-per-test`

**What it checks:**

- Only applies to `.test.ts` and `.test.tsx` files
- Detects proxy creation calls (`create*Proxy()`)
- Ensures proxies are created inside `it` or `test` blocks, not at module level
- Prevents exporting proxy instances from test files

**Detection logic:**

1. Scans VariableDeclaration nodes in test files
2. Identifies declarations where init is CallExpression with name pattern `create*Proxy`
3. Walks up ancestor tree to check if inside `it` or `test` block
4. Reports violation if proxy created at module level (not inside test block)
5. Reports violation if proxy is exported

**Violations:**

- Creating proxy at module level: `const brokerProxy = createUserProfileBrokerProxy()` (outside test blocks)
- Exporting proxy instance: `export const brokerProxy = ...`

**Messages:**

-
`'Proxy instance {{name}} must be created inside each test (it/test block), not at module level. Use: const {{name}} = create{{proxyName}}Proxy() inside the test.'`
- `'Do not export proxy instances from test files. Create proxies fresh in each test instead.'`

**Why This Rule Matters:**

```typescript
// ❌ BAD - Module-level proxy (old pattern)
export const brokerProxy = createUserProfileBrokerProxy();  // ❌ Created once

it('test 1', () => {
    brokerProxy.setupUser({userId, user});
});

it('test 2', () => {
    brokerProxy.setupUser({userId, user});  // ❌ Reusing same proxy
});

// ✅ GOOD - Per-test proxy (new pattern)
it('test 1', () => {
    const brokerProxy = createUserProfileBrokerProxy();  // ✅ Fresh proxy
    brokerProxy.setupUser({userId, user});
});

it('test 2', () => {
    const brokerProxy = createUserProfileBrokerProxy();  // ✅ Fresh proxy
    brokerProxy.setupUser({userId, user});
});
```

**Key insights:**

1. Each test gets fresh proxy with fresh mocks
2. Perfect test isolation
3. No beforeEach needed
4. No exported proxy instances

---

### Rule 20: Proxy Constructors Cannot Have Side Effects Beyond Mock Setup

**Rule:** `proxy-constructor-no-side-effects`

**What it checks:**

- Only applies to `.proxy.ts` files
- Scans proxy constructor (statements before return) for side effects
- Allows only: child proxy creation, mock setup, global function mocking
- Forbids: file system operations, console logging, database calls, network requests

**Detection logic:**

1. Finds the exported `create*Proxy` function
2. Identifies the function body and return statement
3. Traverses statements before return statement
4. For each ExpressionStatement:
    - Checks if expression is a CallExpression
    - If callee is MemberExpression, checks object name
    - Reports violation if object is I/O-related (fs, console, db, prisma, database)

**Allowed in constructor:**

- `const childProxy = create*Proxy()` - child proxy creation
- `const mock = jest.mocked(package)` - mock creation
- `jest.spyOn(Date, 'now').mockReturnValue(...)` - global mocking

**Forbidden in constructor:**

- `fs.writeFileSync(...)` - file system operations
- `console.log(...)` - console operations
- `db.query(...)` - database operations
- `prisma.user.create(...)` - ORM operations
- Any actual I/O that has real side effects

**Messages:**

-
`'Proxy constructor must only create child proxies and setup mocks. Found side effect: {{type}}. Move to setup methods instead.'`
- Info: `'Allowed: const childProxy = create...(), jest.mocked(...), jest.spyOn(...)'`

**Why This Rule Matters:**

```typescript
// ❌ BAD - Side effects in constructor
export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fsAdapter);

    // ❌ DON'T do actual I/O in constructor!
    fs.mkdirSync('/tmp/test');  // ❌ Side effect
    fs.writeFileSync('/tmp/test/file.txt', 'data');  // ❌ Side effect
    console.log('Setting up proxy');  // ❌ Side effect

    mock.mockImplementation(async () => ({...}));

    return {...};
};

// ✅ GOOD - Only mock setup in constructor
export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fsAdapter);

    // ✅ Only mock setup (no side effects)
    mock.mockImplementation(async () => ({
        contents: FileContentsStub('default')
    }));

    return {
        setupFile: ({path, contents}) => {
            // ✅ Side effects go in setup methods
            mock.mockResolvedValueOnce({contents});
        }
    };
};

// ✅ GOOD - Global mocks allowed in constructor
export const createBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Child proxy creation

    // ✅ Global function mocking is allowed
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-123');

    return {...};
};
```

**Key insights:**

1. Constructor = structural setup only (proxies + mocks)
2. No actual I/O (file system, network, console)
3. Setup methods handle scenario-specific configuration
4. Global function mocking is allowed (Date.now, crypto, etc.)

---
