# ESLint Rules for Create-Per-Test Proxy Pattern

### Rule 4: Proxy Files Must Only Import Types from Contracts

**Rule:** `proxy-no-contract-values`

**What it checks:**

- Only applies to `.proxy.ts` files
- Inspects all import statements that reference files containing `-contract` in the path
- Verifies that imports from contract files use `import type` syntax

**Violations:**

- Using regular imports from contract files: `import { userContract } from './user-contract'`
- Importing contract values (not types) from contract files

**Valid patterns:**

- `import type { User } from './user-contract'`
- `import type { UserId } from '../user-id/user-id-contract'`

**Message:** `'Proxy files must only import types from contracts, not the contract itself.'`

---

### Rule 5: Proxy Helpers Cannot Use "mock" in Names

Proxy helper "{{name}}" uses forbidden word "mock". Use "returns", "throws", or describe the action instead. Proxies
abstract implementation (real vs mock)

**Why This Rule Matters:**

The word "mock" reveals implementation details that proxies intentionally hide:

```typescript
// ❌ BAD - "mock" reveals we're using Jest mocks
fsProxy.mockSuccess(filePath, contents);
fsProxy.mockError(filePath, error);

// ✅ GOOD - Describes action, not implementation
fsProxy.returns(filePath, contents);  // "Adapter will return this"
fsProxy.throws(filePath, error);      // "Adapter will throw this"
```

**Key insight:** Tomorrow the proxy might switch from mocks to real fs in temp dir. Test code shouldn't change. Helper
names describe the adapter's behavior, not how we simulate it.

---

### Rule 6: Proxies Must Create All Child Proxies Based on Implementation Imports

**Rule:** `proxy-must-create-child-proxies`

**What it checks:**

- Only applies to `.proxy.ts` files
- Analyzes implementation file imports to identify dependencies on adapters, brokers, widgets, responders, transformers,
  guards, bindings, flows, and routes
- Verifies that for each implementation dependency:
    1. The corresponding proxy is imported (e.g., if implementation imports `brokerA`, proxy must import
       `createBrokerAProxy`)
    2. The proxy creation function is called in the constructor (before the return statement)
- Skips contract type imports

**Detection logic:**

1. Scans imports in the proxy file and categorizes them as:
    - Implementation imports (actual adapters, brokers, etc.)
    - Proxy imports (ending in `.proxy`)
    - Contract type imports (skipped)
2. Finds the exported `create*Proxy` function
3. Traverses the function body to find all `create*Proxy()` calls
4. For each implementation import, derives the expected proxy import path and creation function name
5. Reports violations if proxy import is missing or proxy creation call is missing

**Violations:**

- Importing an implementation file without importing its corresponding proxy
- Importing a proxy but not creating it in the constructor

**Messages:**

- `'Proxy imports {{implementationName}} but does not create {{proxyName}} in constructor.'`
- `'Proxy imports {{implementationName}} but does not import its corresponding proxy {{proxyPath}}.'`

**Why This Rule Matters:**

Every implementation dependency must have its proxy created in the constructor. This ensures the proxy chain is
complete.

```typescript
// Implementation file
// widget-b.ts
import {brokerA} from '../../brokers/broker-a/broker-a';

export const WidgetB = () => {
    const data = brokerA.fetch();
    return <div>{data} < /div>;
};

// ❌ BAD - Missing proxy creation
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    // ❌ ERROR: Should create brokerAProxy here!

    return {
        setupData: ({data}) => {
            // Can't setup broker - proxy wasn't created!
        }
    };
};

// ✅ GOOD - Proxy created in constructor
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    // ✅ Create child proxy (sets up axios mock automatically)
    const brokerAProxy = createBrokerAProxy();

    return {
        setupData: ({data}) => {
            brokerAProxy.returns({url, response: data});
        }
    };
};
```

**Key insight:** Every implementation dependency must have its proxy created. This ensures:

1. All mocks are set up automatically (cascade down the chain)
2. Setup methods have access to child proxies
3. No manual mock management needed

---

### Rule 7: Proxy Cannot Create Child Proxies Not Used by Implementation

**Rule:** `proxy-no-phantom-dependencies`

**What it checks:**

- Only applies to `.proxy.ts` files
- Reads the corresponding implementation file (`.ts` without `.proxy`)
- Compares dependencies:
    1. What the proxy imports/creates
    2. What the implementation actually uses
- Ensures proxies only create child proxies for dependencies the implementation actually imports

**Detection logic:**

1. Locates the corresponding implementation file by removing `.proxy` from filename
2. Parses implementation file imports using regex to extract all import statements
3. Collects all implementation imports and proxy creations in the proxy file
4. For each implementation import in the proxy: verifies implementation file also imports it
5. For each proxy creation call: derives the implementation name and verifies it exists in implementation imports

**Violations:**

- Proxy imports an implementation file that the actual implementation doesn't use
- Proxy creates a child proxy for a dependency the implementation doesn't import

**Messages:**

-
`'Proxy creates {{proxyName}} but {{implementationFile}} does not import {{implementationName}}. Remove the phantom proxy creation or add the import to the implementation.'`
-
`'Proxy imports {{implementationName}} but {{implementationFile}} does not. Proxies must only create proxies for dependencies that the implementation actually uses.'`

**Why This Rule Matters:**

Proxies must mirror the implementation's actual dependencies. If the proxy creates child proxies the implementation
doesn't use, the dependency chain is incorrect.

```typescript
// widget-b.ts (implementation)
import {brokerA} from '../../brokers/broker-a/broker-a';

export const WidgetB = () => {
    const data = brokerA.fetch();
    return <div>{data} < /div>;
};

// ❌ BAD - Proxy creates phantom dependency
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';
import {createBrokerBProxy} from '../../brokers/broker-b/broker-b.proxy';  // ❌ WidgetB doesn't use BrokerB!

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();
    const brokerBProxy = createBrokerBProxy();  // ❌ ERROR: widget-b.ts doesn't import brokerB

    return {...};
};

// ✅ GOOD - Proxy only creates what implementation uses
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();  // ✅ widget-b.ts imports brokerA

    return {...};
};
```

**Key insight:** This ensures the proxy chain perfectly mirrors the actual dependency graph. No phantom dependencies, no
missing dependencies.

---

### Rule 8: No jest.mock() on Implementation Files (Use Proxy Instead)

**Rule:** `test-no-implementation-mocking`

**What it checks:**

- Only applies to `.test.ts` and `.test.tsx` files
- Detects all `jest.mock()` calls
- Verifies that mocked paths don't reference implementation files (adapters, brokers, transformers, guards, bindings,
  widgets, responders, flows, routes)
- Verifies that npm packages aren't mocked directly (should use adapter proxies)

**Detection logic:**

1. Identifies `jest.mock()` calls by checking for MemberExpression with `jest` object and `mock` property
2. Extracts the mock path from first argument
3. Checks if path contains any layer suffix (-adapter, -broker, etc.)
4. Derives expected test filename from mock path
5. **Exception:** Allows mocking if current file IS the implementation's own test file
6. For npm packages (axios, fs, etc.), reports violation suggesting adapter proxy use

**Violations:**

- Using `jest.mock()` on implementation files (brokers, widgets, responders, etc.) from other test files
- Using `jest.mock()` on npm packages directly instead of using adapter proxies

**Valid patterns:**

- File can mock itself (e.g., `http-adapter.test.ts` can contain proxy that mocks axios)
- Using `jest.spyOn()` for global objects (Date, crypto, console)

**Messages:**

- `'Do not mock {{layerType}} with jest.mock(). Import and use the proxy instead: {{proxyImport}}'`
- `'Do not mock npm packages directly. The adapter proxy handles this. Use: {{proxyImport}}'`

**Why This Rule Matters:**

**NEVER mock implementation files directly. Always use their proxy.**

```typescript
// ❌ BAD - Manually mocking broker in widget test
// user-card-widget.test.tsx
jest.mock('../../brokers/user/user-broker');  // ❌ ERROR!
const mockUserBroker = jest.mocked(userBroker);
mockUserBroker.fetch.mockResolvedValue(UserStub('Jane'));

render(<UserCardWidget / >);

// ✅ GOOD - Use broker proxy in widget test
// user-card-widget.test.tsx
import {createUserBrokerProxy} from '../../brokers/user/user-broker.proxy';

it('test', () => {
    const userBrokerProxy = createUserBrokerProxy();  // ✅ Use proxy
    userBrokerProxy.setupUser({userId, user});

    render(<UserCardWidget / >);
});

// ❌ BAD - Mocking npm package directly
// broker.test.ts
jest.mock('axios');  // ❌ ERROR: Use adapter proxy instead!
const mockAxios = jest.mocked(axios);

// ✅ GOOD - Use adapter proxy
// broker.test.ts
import {createHttpAdapterProxy} from '../../adapters/http/http-adapter.proxy';

it('test', () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Proxy handles axios mock
    httpProxy.returns({url, response: data});
});
```

**Exceptions (allowed):**

```typescript
// ✅ ALLOWED - File's own test mocking npm package via proxy
// http-adapter.test.ts
import {createHttpAdapterProxy} from './http-adapter.proxy';
// Proxy file contains: jest.mock('axios')

const httpProxy = createHttpAdapterProxy();  // ✅ Allowed

// ✅ ALLOWED - Mocking globals (not implementation files)
it('test', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456);  // ✅ Allowed
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('abc');  // ✅ Allowed
});
```

**Key insights:**

1. **Never** `jest.mock()` implementation files (adapters, brokers, widgets, etc.)
2. **Never** `jest.mock()` npm packages directly (use adapter proxies)
3. **Always** use proxies - they provide semantic helpers and abstraction
4. **Exception:** Globals like `Date.now()` can be mocked with `jest.spyOn()`

---

### Rule 9: Proxy Must Return Object with Helper Methods

**Rule:** `proxy-must-return-object`

**What it checks:**

- Only applies to `.proxy.ts` files
- Finds the exported `create*Proxy` function
- Verifies the function returns an object literal
- Ensures the returned object has at least one property/method

**Detection logic:**

1. Scans for exported named declaration with VariableDeclaration
2. Finds declarator with name starting with `create` and ending with `Proxy`
3. Analyzes the function's return:
    - For arrow functions: checks if body is ObjectExpression (implicit return)
    - For regular functions: finds explicit ReturnStatement in BlockStatement
4. Verifies return value type is ObjectExpression
5. Counts properties in the returned object

**Violations:**

- Proxy function doesn't return anything
- Proxy function returns non-object (null, undefined, primitive, etc.)
- Proxy function returns empty object with no methods/properties

**Messages:**

- `'Proxy must return an object with helper methods (e.g., returns, throws, setupX, etc.).'`
- `'Proxy returns empty object. Add at least one helper method (e.g., returns, setupUser, etc.).'`

**Why This Rule Matters:**

All proxies must return an object with helper methods. Even pure functions (transformers, guards) need proxies to
provide semantic setup helpers for higher-layer tests.

```typescript
// ❌ BAD - Not returning an object
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();
    return null;  // ❌ ERROR: Must return object
};

// ❌ BAD - Returning empty object
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();
    return {};  // ❌ ERROR: Must have at least one method
};

// ✅ GOOD - Returns object with helper methods
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        setupUser: ({userId, user}) => {
            httpProxy.returns({url, response: {data: user}});
        },
        setupError: ({userId, error}) => {
            httpProxy.throws({url, error});
        }
    };
};

// ✅ GOOD - Even transformers need proxies (for semantic helpers)
export const createFormatNameTransformerProxy = () => {
    // Transformer is pure, but proxy provides semantic helpers
    return {
        setupLongName: () => {
            // Helper to create test data that exercises "long name" path
            return UserStub({firstName: 'A'.repeat(100)});
        }
    };
};

// ✅ GOOD - Adapter proxy
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        },
        throws: ({url, error}) => {
            mock.mockRejectedValueOnce(error);
        }
    };
};
```

**Key insight:**

- Proxies are NOT optional - every testable file needs one
- Proxies must provide helper methods (setup, returns, throws, etc.)
- Even pure functions need proxies for semantic test data builders
- Empty proxies are not allowed - if you can't think of helpers, you need to redesign

---

### Rule 10: Non-Adapter Proxies Cannot Use jest.mocked()

**Rule:** `non-adapter-no-jest-mocked`

**What it checks:**

- Only applies to `.proxy.ts` files that are NOT adapter proxies
- Detects any use of `jest.mocked()` in non-adapter proxies
- Enforces that only adapter proxies (I/O boundaries) can mock dependencies

**Detection logic:**

1. Checks if filename ends with `.proxy.ts`
2. Skips check if filename includes `-adapter.proxy.ts`
3. For remaining proxy files, scans for CallExpression nodes
4. Identifies `jest.mocked()` calls by checking:
    - Callee is MemberExpression
    - Object is `jest`
    - Property is `mocked`

**Violations:**

- Any `jest.mocked()` call in broker, widget, responder, transformer, guard, binding, middleware, or state proxies

**Messages:**

-
`'Non-adapter proxies cannot use jest.mocked(). Only adapters (I/O boundaries) should be mocked. Brokers, widgets, and responders must run real code.'`

**Why This Rule Matters:**

**Critical principle: Only I/O boundaries (adapters) are mocked. Business logic runs for real.**

```typescript
// ❌ BAD - Mocking a broker
// broker-a.proxy.ts
export const createBrokerAProxy = () => {
    const mock = jest.mocked(brokerA);  // ❌ ERROR: Brokers are never mocked!
    return {...};
};

// ✅ GOOD - Broker runs real code, only mocks its adapter dependency
// broker-a.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Adapter is mocked

    return {
        bootstrap: () => {
            httpProxy.bootstrap();  // Real broker code calls mocked adapter
        }
    };
};
```

---

### Rule 11: jest.mocked() Must Import What It Mocks

**Rule:** `jest-mocked-must-import`

**What it checks:**

- Only applies to `.proxy.ts` files
- Finds all `jest.mocked()` calls
- Verifies that the argument passed to `jest.mocked()` is imported at the top of the file

**Detection logic:**

1. Extracts all import statements and their specifiers
2. Recursively traverses the AST to find `jest.mocked()` calls
3. For each `jest.mocked()` call, extracts the argument name
4. Checks if argument name exists in the list of imported specifiers
5. Determines appropriate import syntax (default import for npm packages, named import otherwise)

**Violations:**

- Using `jest.mocked(packageName)` without importing `packageName`
- Typos in the argument name that don't match any import

**Messages:**

- `'jest.mocked({{name}}) requires importing {{name}}. Add: import {{importStatement}}'`

**Why This Rule Matters:**

Adapter proxies mock **npm packages**, not adapters. This rule ensures you import what you're mocking.

```typescript
// ❌ BAD - Using jest.mocked() without importing
// http-adapter.proxy.ts
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ❌ ERROR: axios not imported!
    return {...};
};

// ✅ GOOD - Import npm package before mocking
// http-adapter.proxy.ts
import axios from 'axios';  // ✅ Import npm package

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ✅ Mocking npm package

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        }
    };
};

// ❌ BAD - Typo in package name
import axios from 'axios';

const mock = jest.mocked(axois);  // ❌ ERROR: axois (typo!) not imported

// ✅ GOOD - Correct package name
import axios from 'axios';

const mock = jest.mocked(axios);  // ✅ Matches import
```

**Key insight:** This catches typos and ensures `jest.mocked()` wraps something that actually exists.

---

### Rule 12: jest.mocked() Argument Must Be npm Package (Adapter Proxies Only)

**Rule:** `jest-mocked-npm-package-only`

**What it checks:**

- Only applies to `-adapter.proxy.ts` files
- Verifies that `jest.mocked()` is only used to mock npm packages
- Prevents mocking the adapter itself or business logic

**Detection logic:**

1. Checks if filename ends with `-adapter.proxy.ts`
2. Finds all `jest.mocked()` CallExpression nodes
3. Extracts the argument name from `jest.mocked(argumentName)`
4. Checks if argument name ends with "Adapter" (attempting to mock the adapter itself)
5. Validates argument against list of known npm packages (axios, fs, path, crypto, os, child_process, http, https, net,
   stream, util, zlib)

**Violations:**

- Mocking the adapter itself: `jest.mocked(httpAdapter)`
- Mocking business logic: `jest.mocked(userBroker)`
- Mocking unknown/non-npm packages

**Messages:**

-
`'jest.mocked({{name}}) - In adapter proxies, only mock npm packages (axios, fs, etc.), not adapters or business logic.'`
-
`'jest.mocked({{name}}) - Do not mock the adapter itself. Mock the npm package it uses instead (e.g., mock axios, not httpAdapter).'`

**Why This Rule Matters:**

Adapter proxies mock the **npm package** (I/O boundary), not the adapter itself.

```typescript
// ❌ BAD - Mocking the adapter
// http-adapter.proxy.ts
import {httpAdapter} from './http-adapter';

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(httpAdapter);  // ❌ ERROR: Don't mock the adapter!
    return {...};
};

// ❌ BAD - Mocking business logic
// http-adapter.proxy.ts
import {userBroker} from '../../brokers/user-broker';

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(userBroker);  // ❌ ERROR: Not an npm package!
    return {...};
};

// ✅ GOOD - Mocking npm package
// http-adapter.proxy.ts
import axios from 'axios';  // ✅ npm package

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ✅ Mocking I/O boundary

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        }
    };
};

// ✅ GOOD - Mocking fs
// fs-adapter.proxy.ts
import fs from 'fs/promises';  // ✅ npm package

export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fs);  // ✅ Mocking I/O boundary

    mock.readFile.mockResolvedValue('default content');

    return {
        returns: ({path, contents}) => {
            mock.readFile.mockResolvedValueOnce(contents);
        }
    };
};
```

**Key insight:**

- **Adapter proxies** = Mock npm packages (axios, fs, etc.)
- **Other proxies** = Create child proxies, never use `jest.mocked()`
- This maintains "mock at I/O boundary" principle

---

### Rule 13: No Mutable State Inside Proxy Factory

**Rule:** `proxy-no-mutable-state`

**What it checks:**

- Only applies to `.proxy.ts` files
- Finds exported `create*Proxy` function declarations
- Scans function body for `let` or `var` declarations
- Allows `jest.mocked()` and child proxy creation, but forbids other mutable state

**Detection logic:**

1. Identifies ExportNamedDeclaration with VariableDeclaration
2. Checks if declarator name starts with `create` and ends with `Proxy`
3. Recursively traverses the factory function body
4. For each VariableDeclaration found:
    - Checks if kind is `let` or `var`
    - Examines the initializer to determine if it's allowed:
        - **Allowed:** `jest.mocked(...)` calls
        - **Allowed:** `create*Proxy()` calls (child proxies)
        - **Forbidden:** All other mutable state

**Violations:**

- Using `let` or `var` for non-mock, non-proxy variables inside the proxy factory
- Mutable state that should be at module level or in setup methods

**Messages:**

- `'Proxy factory cannot contain mutable state (let/var). Use module-level state or jest.mocked() references instead.'`
- Suggestion: `'Move mutable state outside the factory function to module level.'`

---

### Rule 15: Proxy Instances Must Be Exported Const at Module Level

**Rule:** `test-proxy-must-be-exported-const`

**What it checks:**

- Only applies to `.test.ts` and `.test.tsx` files
- Detects proxy creation calls (`create*Proxy()`)
- Verifies proxies are declared with `const` (not `let` or `var`)
- Ensures proxies are exported at module level
- Prevents proxy creation inside describe/it blocks

**Detection logic:**

1. Scans VariableDeclaration nodes in test files
2. Identifies declarations where init is a CallExpression with name starting with `create` and ending with `Proxy`
3. Checks if declaration kind is `const`
4. Checks if parent node is ExportNamedDeclaration
5. Walks up ancestor tree to verify not inside `describe`, `it`, or `test` blocks

**Violations:**

- Proxy instance not exported: `const widgetProxy = createWidgetProxy()`
- Using `let` or `var`: `export let widgetProxy = createWidgetProxy()`
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
