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

---

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
