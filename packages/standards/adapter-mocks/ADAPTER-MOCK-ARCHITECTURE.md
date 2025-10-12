# Universal Proxy Architecture

**Status:** Conceptual design - not yet implemented. This document explores how proxy-based testing would work if
implemented.

## The Core Problem

When LLMs write tests, they face several challenges:

1. **Dependency explosion**: Testing ComponentA requires knowing what adapters ComponentB uses 3 layers down
2. **LLM Jest confusion**: LLMs struggle with Jest mocking patterns, especially with fs, buffers, and complex npm
   package types
3. **Breaking encapsulation**: Parent tests shouldn't know child component internals (button testIds, API endpoints)
4. **Cascading test failures**: When ComponentB changes its dependencies, ComponentA's tests break
5. **Setup complexity**: Every test needs to manually setup all transitive dependencies
6. **Integration vs isolation tension**: Want to test real integration, but need to mock I/O boundaries

## The Solution: Universal Proxy Pattern

**Every file gets a proxy** - Not just adapters. Widgets, brokers, adapters, everything.

**Two proxy responsibilities:**

1. **bootstrap()** - Setup dependencies with safe defaults so code doesn't crash (called once automatically, no args)
2. **configure()** - Override defaults with test-specific data (called by tests when needed, takes config args)
3. **trigger methods** - Encapsulate interactions (clicking buttons, calling functions) without exposing internals

**Core Benefits:**

1. **Auto-setup** - Transformer scans imports, auto-calls bootstrap(), tests work by default
2. **Encapsulation** - Parent tests don't know child internals (testIds, API endpoints, state logic)
3. **Helpful errors** - Proxies throw clear errors when required state is missing
4. **Integration testing** - Real code runs, only I/O boundaries mocked
5. **Override only what matters** - Bootstrap sets defaults, tests override specific data
6. **Separation of concerns** - Each proxy knows only its own dependencies

## How It Works: Complete Explanation

### The Component Tree

```
WidgetA (being tested)
  └─> WidgetB (renders inside WidgetA)
       └─> BrokerA (fetches data)
            └─> httpAdapter (makes API call to /api/items)
```

### Without Proxies (The Problem)

```typescript
// WidgetA.test.tsx - TRADITIONAL APPROACH
import {WidgetA} from './widget-a';

// Need to know WidgetB uses BrokerA uses httpAdapter 3 layers down!
jest.mock('../../../adapters/http/http-adapter');
const mockHttp = jest.mocked(httpAdapter);

it('renders', () => {
    // Must setup HTTP or WidgetB crashes
    mockHttp.mockResolvedValue({data: {items: []}});

    render(<WidgetA / >);

    // Want to test WidgetA's response to WidgetB's button click
    // But need to know WidgetB's internal testId...
    const button = screen.getByTestId('WIDGETB_SUBMIT_BUTTON');  // BAD: knows child internals
    fireEvent.click(button);
});
```

**Problems:**

- ❌ WidgetA test knows about httpAdapter (3 layers deep)
- ❌ WidgetA test knows WidgetB's testId (child internals)
- ❌ If WidgetB changes from HTTP to FS, WidgetA test breaks

### With Proxies (The Solution)

```typescript
// WidgetA.test.tsx - PROXY APPROACH
import {WidgetA} from './widget-a';

// TRANSFORMER AUTO-INJECTED (developer doesn't write this):
import {createWidgetAProxy} from './widget-a.proxy';

const widgetAProxy = createWidgetAProxy();  // Create instance
widgetAProxy.bootstrap();                   // Bootstrap it - chains automatically! NO ARGS!
// END AUTO-INJECTION

describe('WidgetA', () => {
    it('renders', () => {
        // Just render - bootstrap already set defaults, won't crash
        render(<WidgetA / >);

        expect(screen.getByText('Widget A')).toBeInTheDocument();
    });
});
```

**Benefits:**

- ✅ WidgetA test doesn't know about httpAdapter
- ✅ WidgetA test doesn't know WidgetB's testId
- ✅ If WidgetB changes to FS, WidgetA test still works (bootstrap handles it)
- ✅ Transformer only needs to inject ONE call (bootstrap chain does the rest)

---

## Pattern 1: The Bootstrap Pattern

### What is Bootstrap?

**bootstrap()** = "Setup my dependencies with safe defaults so I don't crash"

- **NEVER takes arguments** - called once automatically by transformer
- **NO jest.mock() in proxies** - Transformer injects it at test file top
- All proxies chain to their dependency proxies' bootstrap()
- Bootstrap is idempotent (calling multiple times is safe)
- Bootstrap uses `mockImplementation` (fallback for all calls)

**configure(config)** = "Override defaults with test-specific data"

- **Takes configuration arguments** - called by tests when they need specific setup
- Tests use configure() to override bootstrap's safe defaults
- Configure can be called multiple times per test (idempotent)

### Adapter Bootstrap (Transformer Detects jest.mocked())

**Adapters are mocked by default** - They are I/O boundaries (HTTP, FS, DB, etc.)

```typescript
// httpAdapter.proxy.ts
import {httpAdapter} from './http-adapter';
import type {Url} from '../../contracts/url/url-contract';

export const createHttpAdapterProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(httpAdapter);

    return {
        bootstrap: () => {
            // NO jest.mock() here - transformer already did it!
            // Just setup mockImplementation (idempotent - safe to call multiple times)
            mock.mockImplementation((url) => {
                // Safe defaults that won't crash
                if (url.includes('/api/items')) return Promise.resolve({items: []});
                if (url.includes('/api/users')) return Promise.resolve({users: []});
                return Promise.resolve({data: {}});  // Generic fallback
            });
        },

        configure: (config: Record<string, unknown>) => {
            Object.entries(config).forEach(([url, data]) => {
                mock.mockResolvedValueOnce(data);
            });
        },

        returns: (url: Url, data: unknown): void => {
            mock.mockResolvedValueOnce(data);
        }
    };
};
```

**Special case - Real adapter (ESLint only):**

```typescript
// eslint-adapter.proxy.ts
import {eslintAdapter} from './eslint-adapter';
import type {SourceCode} from '../../contracts/source-code/source-code-contract';

export const createEslintProxy = () => {
    // NO jest.mocked() - transformer won't inject jest.mock()
    // Uses REAL ESLint to validate selectors against real AST

    return {
        bootstrap: () => {
            // Setup real ESLint in temp directory
        },

        lintCode: (code: SourceCode) => {
            // Call REAL eslintAdapter (which uses real ESLint)
            return eslintAdapter({code});
        }
    };
};
```

**Key insights:**

- `bootstrap()` takes NO args and is called once automatically
- `configure(config)` takes args and is called by tests to override defaults
- **NO jest.mock() in proxy** - transformer injects it when it sees `jest.mocked()`
- **Presence of `jest.mocked()` is the signal** - tells transformer to inject jest.mock()
- **No helper needed** - Direct pattern for all proxies

### Broker Bootstrap (Chains to Adapter)

**Brokers are NEVER mocked** - They contain business logic that runs for real

```typescript
// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: () => {
            // Chain to adapter's bootstrap (no args)
            httpProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            // Broker knows the URL mapping - translate config to adapter's format
            if (config.items) {
                httpProxy.configure({
                    '/api/items': {items: config.items}
                });
            }
        }
    };
};
```

**Key insights:**

- **NO jest.mocked() here** - Brokers are never mocked (Lint Rule 10 enforces this)
- Broker code runs for REAL
- Only the adapter it calls is mocked

### Widget Bootstrap (Chains to Broker)

**Widgets are NEVER mocked** - They are React components that render for real

```typescript
// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            // Chain to broker's bootstrap (no args)
            brokerAProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            // Pass config to broker's configure
            brokerAProxy.configure(config);
        },

        triggerSubmit: async () => {
            const button = screen.queryByTestId('SUBMIT_BUTTON');
            if (!button) {
                throw new Error(
                    'WidgetB submit button not visible.\n' +
                    'Button requires items from API.\n' +
                    'Override in test: widgetBProxy.configure({ items: [...] })'
                );
            }
            await userEvent.click(button);
        }
    };
};
```

**Key insights:**

- **NO jest.mocked() here** - Widgets are never mocked (Lint Rule 10 enforces this)
- Widget code runs for REAL (actual React rendering)
- Only the adapters at the end of the chain are mocked

**Bootstrap chain:** WidgetB → BrokerA → httpAdapter → `jest.mocked()` detected → `jest.mock()` injected +
`mockImplementation` (NO ARGS)

**Config flows via configure():** `{ items }` → `{ items }` → `{ '/api/items': { items } }` → mockResolvedValueOnce

### The Transformer Auto-Calls Bootstrap

```typescript
// WidgetA.test.tsx (what developer writes)
import {WidgetA} from './widget-a';

describe('WidgetA', () => {
    it('renders', () => {
        render(<WidgetA / >);  // Just works!
    });
});
```

**Transformer creates instance and bootstraps at module level:**

```typescript
// WidgetA.test.tsx (after transformation)
import {WidgetA} from './widget-a';

// TRANSFORMER FINDS:
// - File being tested: widget-a.ts
// - Corresponding proxy: widget-a.proxy.ts
//
// TRANSFORMER INJECTS:
import {createWidgetAProxy} from './widget-a.proxy';

const widgetAProxy = createWidgetAProxy();  // Create instance once
widgetAProxy.bootstrap();                   // Bootstrap it - chain handles the rest

// Now tests run with everything bootstrapped
describe('WidgetA', () => {
    it('renders', () => {
        render(<WidgetA / >);  // Won't crash - HTTP returns safe defaults
    });

    it('with custom data', () => {
        widgetAProxy.configure({items: [...]});  // Use same instance!
        render(<WidgetA / >);
    });
});
```

**How bootstrap chaining works:**

```typescript
createWidgetAProxy().bootstrap()
  → calls
widgetBProxy.bootstrap()      // WidgetA imports WidgetB
→ calls
brokerAProxy.bootstrap()    // WidgetB imports BrokerA
→ calls
httpProxy.bootstrap()     // BrokerA imports httpAdapter
→ jest.mock() + mockImplementation
```

**Key insight:** Transformer doesn't need to recursively scan imports! It only needs to:

1. Find the file being tested (`widget-a.ts`)
2. Find its proxy (`widget-a.proxy.ts`)
3. Inject ONE call: `createWidgetAProxy().bootstrap()`
4. The bootstrap chain executes automatically (enforced by Lint Rule 6)

**Developer never writes bootstrap calls** - transformer does it automatically.

## How the Transformer Works

### Phase 1: Injecting jest.mock() Calls

**The transformer scans the dependency tree to find ALL adapters that need mocking:**

```typescript
function transformTestFile(testFilePath) {
    // 1. Find the main file being tested
    const mainFile = findMainImport(testFilePath);  // 'widget-a.ts'
    const mainProxy = mainFile.replace('.ts', '.proxy.ts');

    // 2. Recursively scan the ENTIRE dependency tree for adapter proxies
    const adapterProxies = scanDependencyTree(mainProxy);

    // 3. For each adapter proxy, check if it needs mocking
    const mocksToInject = [];
    for (const adapterProxyFile of adapterProxies) {
        const needsMock = checkIfNeedsMock(adapterProxyFile);
        const adapterPath = extractAdapterPath(adapterProxyFile);

        if (needsMock) {
            mocksToInject.push(adapterPath);
        }
    }

    // 4. Inject ALL jest.mock() calls at the very top of the test file
    mocksToInject.forEach(adapterPath => {
        injectAtVeryTop(`jest.mock('${adapterPath}');`);
    });

    // 5. Inject instance creation and bootstrap at module level
    const proxyName = `${mainFile}Proxy`;
    injectAfterImports(`const ${proxyName} = create${capitalize(mainFile)}Proxy();`);
    injectAfterImports(`${proxyName}.bootstrap();`);
}

function scanDependencyTree(proxyFile) {
    const adapters = [];
    const visited = new Set();

    function visit(proxyPath) {
        if (visited.has(proxyPath)) return;
        visited.add(proxyPath);

        // If this is an adapter proxy, add it
        if (proxyPath.includes('-adapter.proxy')) {
            adapters.push(proxyPath);
            return; // Adapters are leaf nodes
        }

        // Otherwise, find child proxy imports and recurse
        const childProxies = extractProxyImports(proxyPath);
        childProxies.forEach(visit);
    }

    visit(proxyFile);
    return adapters;
}

function checkIfNeedsMock(proxyFile) {
    const content = fs.readFileSync(proxyFile, 'utf-8');

    // Look for jest.mocked() usage - this is the signal!
    return content.includes('jest.mocked(');
}
```

**Example transformation:**

```typescript
// widget-a.test.ts (BEFORE transformation)
import {WidgetA} from './widget-a';

describe('WidgetA', () => {
    it('renders', () => {
        render(<WidgetA / >);
    });
});

// widget-a.test.ts (AFTER transformation)
// ← Transformer injected these at the very top (ALL mocks for entire dependency tree)
jest.mock('../../../adapters/http/http-adapter');
jest.mock('../../../adapters/fs/fs-adapter');

import {WidgetA} from './widget-a';
import {createWidgetAProxy} from './widget-a.proxy';

const widgetAProxy = createWidgetAProxy();  // ← Transformer injected instance creation
widgetAProxy.bootstrap();                   // ← Transformer injected bootstrap call

describe('WidgetA', () => {
    it('renders', () => {
        render(<WidgetA / >);
    });
});
```

### Phase 2: Bootstrap Chain Execution

**After all jest.mock() calls are in place, the bootstrap chain runs:**

```
Test file loads
  ↓
jest.mock() calls execute (hoisted by Jest to run FIRST)
  ↓
All imports execute with mocked modules
  ↓
Module-level code executes:
  const widgetAProxy = createWidgetAProxy()
  widgetAProxy.bootstrap()
  ↓
Bootstrap chain executes:
  widgetAProxy.bootstrap()
    → widgetBProxy.bootstrap()
      → brokerAProxy.bootstrap()
        → httpAdapterProxy.bootstrap()
          → jest.mocked(httpAdapter).mockImplementation(...)
```

**Key insight:**

- **Phase 1 (jest.mock)**: Happens at module top-level (before any code runs)
- **Phase 2 (bootstrap)**: Happens at module level (sets up mockImplementation)

### Why Two Phases?

Jest's `jest.mock()` MUST be hoisted (run before imports). The transformer:

1. Scans entire dependency tree to find all adapters needing mocks
2. Injects ALL `jest.mock()` calls at test file top
3. Injects instance creation and ONE `bootstrap()` call at module level
4. Bootstrap chain configures the mocks (mockImplementation)

### Transformer Simplification: Why No Recursive Scanning for Bootstrap?

**Key insight:** Lint Rule 6 enforces that every proxy calls its child proxies' bootstraps. This means the transformer
doesn't need to be smart!

**Simple transformer logic:**

```typescript
// Transformer algorithm (simplified)
function transformTestFile(filePath) {
    // 1. Find what's being tested
    const importedFile = findMainImport(filePath);  // 'widget-a.ts'

    // 2. Check if proxy exists
    const proxyFile = importedFile.replace('.ts', '.proxy.ts');
    if (!fs.existsSync(proxyFile)) return;  // No proxy, skip

    // 3. Inject ONE import + ONE bootstrap call
    injectAtTop(`import { createWidgetAProxy } from './widget-a.proxy';`);
    injectBeforeAll(`createWidgetAProxy().bootstrap();`);

    // Done! No recursive scanning needed.
}
```

**Why this works:**

```typescript
// WidgetA.proxy.ts - MUST call child bootstrap (enforced by lint)
export const createWidgetAProxy = () => {
    const widgetBProxy = createWidgetBProxy();  // Lint: import exists

    return {
        bootstrap: () => {
            widgetBProxy.bootstrap();  // Lint: MUST call this
        }
    };
};

// WidgetB.proxy.ts - MUST call child bootstrap (enforced by lint)
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();  // Lint: import exists

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();  // Lint: MUST call this
        }
    };
};

// BrokerA.proxy.ts - MUST call child bootstrap (enforced by lint)
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();  // Lint: import exists

    return {
        bootstrap: () => {
            httpProxy.bootstrap();  // Lint: MUST call this
        }
    };
};

// httpAdapter.proxy.ts - Terminal node (adapter)
export const createHttpAdapterProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(httpAdapter);

    return {
        bootstrap: () => {
            // NO jest.mock() here - transformer already did it!
            // Just setup mockImplementation
            mock.mockImplementation((url) => {
                return Promise.resolve({data: {}});
            });
        }
    };
};
```

**The chain executes automatically:**

```
Phase 1 (BEFORE any code runs - jest.mock hoisting):
  jest.mock('./http-adapter')  // Transformer injected at test file top
  jest.mock('./fs-adapter')     // All mocks for entire dependency tree

Phase 2 (Module-level - bootstrap chain):
  Transformer injects:
    const widgetAProxy = createWidgetAProxy()
    widgetAProxy.bootstrap()
      ↓ (chains to child - enforced by lint)
    widgetBProxy.bootstrap()
      ↓ (manually calls - enforced by lint)
    createBrokerAProxy().bootstrap()
      ↓ (manually calls - enforced by lint)
    createHttpAdapterProxy().bootstrap()
      ↓ (mocks already set up by Phase 1!)
    jest.mocked(httpAdapter).mockImplementation(...)
```

**Benefits of simplified transformer:**

- ✅ **No recursive import scanning** - Transformer doesn't walk the dependency tree
- ✅ **No complex AST analysis** - Just find file being tested, inject one call
- ✅ **Lint enforces correctness** - Rule 6 ensures chains are complete
- ✅ **Simple to implement** - ~50 lines of code vs ~500 lines for recursive scanner
- ✅ **Fast** - No deep tree traversal, just string replacement
- ✅ **Debuggable** - If bootstrap fails, error shows which proxy broke the chain

### Overriding Bootstrap Defaults via Configure

**Key principle:** Tests call `configure()` on the proxy they're testing. Each proxy passes config down to its direct
child only via configure().

```typescript
// WidgetA.test.tsx
import {WidgetA} from './widget-a';
import {createWidgetAProxy} from './widget-a.proxy';

// Transformer auto-calls bootstrap() with NO args (safe defaults setup once)

describe('WidgetA', () => {
    it('shows items', () => {
        // Create proxy and configure with test-specific data
        const widgetAProxy = createWidgetAProxy();
        widgetAProxy.configure({
            items: [{id: 1, name: 'Item 1'}]  // WidgetA doesn't know this becomes HTTP call!
        });

        render(<WidgetA / >);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
});
```

**How config flows down via configure():**

```typescript
// WidgetA.proxy.ts
export const createWidgetAProxy = () => {
    const widgetBProxy = createWidgetBProxy();

    return {
        bootstrap: () => {
            // Chain bootstrap (no args)
            widgetBProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            // Pass config to direct child's configure (WidgetB)
            widgetBProxy.configure(config);
        }
    };
};

// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            // Chain bootstrap (no args)
            brokerAProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            // Pass config to direct child's configure (BrokerA)
            brokerAProxy.configure(config);
        }
    };
};

// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: () => {
            // Chain bootstrap (no args)
            httpProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            // BrokerA knows it fetches from /api/items - translate config
            if (config.items) {
                httpProxy.configure({
                    '/api/items': {items: config.items}
                });
            }
        }
    };
};
```

**Key insight:**

- WidgetA test knows: "I need items"
- WidgetA proxy: passes config to WidgetB via configure()
- WidgetB proxy: passes config to BrokerA via configure()
- BrokerA proxy: translates `{ items }` → `{ '/api/items': { items } }` via configure() (knows the URL!)
- httpAdapter proxy: sets up the mock via configure()

**Each layer only knows about its direct child, never skips layers.**

---

## Pattern 2: The Trigger Pattern

### What are Triggers?

**Triggers** = Methods that encapsulate interactions with a component without exposing internals.

**Examples:**

- `widgetBProxy.triggerSubmit()` - Clicks WidgetB's submit button (test doesn't know testId)
- `widgetBProxy.triggerItemSelect({ itemId })` - Selects an item (test doesn't know how)
- `brokerAProxy.call({ input })` - Calls broker function

### Why Triggers?

**Without triggers (bad):**

```typescript
// WidgetA.test.tsx
render(<WidgetA / >);

// WidgetA test knows WidgetB's internal testId
const button = screen.getByTestId('WIDGETB_SUBMIT_BUTTON');  // BAD
fireEvent.click(button);
```

**With triggers (good):**

```typescript
// WidgetA.test.tsx
// Create proxy BEFORE render
const widgetBProxy = createWidgetBProxy();

render(<WidgetA / >);

// WidgetA test doesn't know WidgetB's internals
await widgetBProxy.triggerSubmit();  // GOOD
```

**If WidgetB changes its testId, WidgetA test doesn't break.**

### Trigger Implementation

```typescript
// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();  // Create at factory level

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            brokerAProxy.configure(config);
        },

        triggerSubmit: async () => {
            // Try to find button
            const button = screen.queryByTestId('SUBMIT_BUTTON');

            // If not found, throw helpful error
            if (!button) {
                throw new Error(
                    'WidgetB submit button not visible.\n\n' +
                    'Common causes:\n' +
                    '1. Button requires items from API\n' +
                    '   → widgetBProxy.configure({ items: [...] })\n\n' +
                    '2. Button only shows in edit mode\n' +
                    '   → Ensure mode="edit" prop is passed to WidgetB\n' +
                    '   → Parent test must set up the correct mode'
                );
            }

            // Click button
            await userEvent.click(button);
        },

        triggerItemSelect: async ({itemId}: { itemId: number }) => {
            const item = screen.queryByTestId(`ITEM_${itemId}`);

            if (!item) {
                throw new Error(
                    `Item ${itemId} not found in WidgetB.\n` +
                    `Ensure widgetBProxy.configure({ items: [{ id: ${itemId}, ... }] })`
                );
            }

            await userEvent.click(item);
        }
    };
};
```

**Helpful errors** tell test author exactly what's missing.

### Trigger with Parent State Dependencies

```typescript
const WidgetB = ({mode, onSubmit}) => {
    const items = useFetchItems();  // Calls BrokerA → httpAdapter

    // Button only visible in 'edit' mode AND when items loaded
    const showButton = mode === 'edit' && items.length > 0;

    return showButton ? (
        <button data - testid = "SUBMIT_BUTTON" onClick = {onSubmit} >
        Submit
        < /button>
) :
    null;
};

// WidgetB.proxy.ts
triggerSubmit: async () => {
    const button = screen.queryByTestId('SUBMIT_BUTTON');

    if (!button) {
        throw new Error(
            'WidgetB submit button not visible.\n\n' +
            'Requirements:\n' +
            '1. WidgetB requires mode="edit" prop\n' +
            '2. Items must be loaded from API\n\n' +
            'Solutions:\n' +
            '1. Parent test must set mode:\n' +
            '   → Depends on parent component\'s UI/props\n' +
            '2. Setup API data:\n' +
            '   → widgetBProxy.configure({ items: [...] })'
        );
    }

    await userEvent.click(button);
}
```

**Test handles parent state:**

```typescript
it('handles submit in edit mode', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    // Configure data via WidgetA's proxy (AFTER bootstrap, BEFORE render)
    const widgetAProxy = createWidgetAProxy();
    widgetAProxy.configure({items: [{id: 1}]});  // Flows down to HTTP layer

    // Create WidgetB proxy BEFORE render
    const widgetBProxy = createWidgetBProxy();

    render(<WidgetA / >);

    // Change WidgetA's mode (WidgetA's UI)
    await userEvent.click(screen.getByRole('button', {name: 'Edit Mode'}));

    // Trigger WidgetB's submit (via proxy created before render)
    await widgetBProxy.triggerSubmit();

    // Assert WidgetA's behavior
    expect(consoleSpy).toHaveBeenCalledWith('Submitted!');
});
```

**Separation:**

- Test controls WidgetA's state (via WidgetA's UI)
- Test controls data (via widgetAProxy.configure, flows down through layers)
- Proxy encapsulates WidgetB's interaction (trigger doesn't know testId)

---

## Pattern 3: Separation of Responsibilities

### What Tests Know

**WidgetA test knows:**

- ✅ WidgetA's UI (buttons, inputs, state controls)
- ✅ WidgetA's props (can pass initialMode, etc)
- ✅ What WidgetA should do when events happen
- ❌ WidgetB's internals (testIds, API endpoints)
- ❌ What adapters WidgetB uses

**WidgetA test example:**

```typescript
it('handles submit from WidgetB', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    // Create proxy BEFORE render
    const widgetBProxy = createWidgetBProxy();

    render(<WidgetA / >);

    // WidgetA controls its own mode
    await userEvent.click(screen.getByRole('button', {name: 'Edit'}));

    // Trigger WidgetB via proxy (don't know its internals)
    await widgetBProxy.triggerSubmit();

    // Test WidgetA's response
    expect(consoleSpy).toHaveBeenCalledWith('Submitted!');
});
```

### What Proxies Know

**WidgetB proxy knows:**

- ✅ WidgetB's testIds
- ✅ WidgetB's dependencies (BrokerA)
- ✅ What conditions make WidgetB's button visible
- ❌ WidgetA's state or UI
- ❌ How parent components work

**WidgetB proxy example:**

```typescript
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            brokerAProxy.configure(config);
        },

        triggerSubmit: async () => {
            const button = screen.queryByTestId('SUBMIT_BUTTON');
            if (!button) {
                throw new Error('Button requires: mode="edit" and items from API');
            }
            await userEvent.click(button);
        }
    };
};
```

### What Adapters Know

**httpAdapter proxy knows:**

- ✅ How to mock HTTP calls
- ✅ Default responses for common endpoints
- ❌ What widgets/brokers use it
- ❌ Application business logic

**httpAdapter proxy example:**

```typescript
export const createHttpAdapterProxy = () => {
    return createAdapterProxy(httpAdapter, {useMock: true})((mockedAdapter) => {
        // Transformer injects jest.mock() at test file top based on useMock: true

        return {
            bootstrap: () => {
                // NO jest.mock() here - just setup mockImplementation
                mockedAdapter.mockImplementation((url) => {
                    // Safe defaults
                    return Promise.resolve({data: {}});
                });
            },

            returns: (url, data) => {
                mockedAdapter.mockResolvedValueOnce({data});
            }
        };
    });
};
```

---

## Complete Example: Full Stack

### The Code

```typescript
// httpAdapter.ts
export const httpAdapter = async (url: string) => {
    const response = await fetch(url);
    return response.json();
};

// BrokerA.ts
export const brokerA = async () => {
    const data = await httpAdapter('/api/items');
    return data;
};

// WidgetB.tsx
export const WidgetB = ({mode, onSubmit}: { mode: string; onSubmit: () => void }) => {
    const {data, loading} = useFetch(brokerA);

    const showButton = mode === 'edit' && !loading && data?.items.length > 0;

    return showButton ? (
        <button data - testid = "SUBMIT_BUTTON" onClick = {onSubmit} >
        Submit
        < /button>
) :
    loading ? (
        <div>Loading
...
    </div>
) :
    null;
};

// WidgetA.tsx
export const WidgetA = () => {
    const [mode, setMode] = useState('view');

    const handleSubmit = () => {
        console.log('Submitted!');
    };

    return (
        <div>
            <button onClick = {()
=>
    setMode('edit')
}>
    Edit
    Mode < /button>
    < WidgetB
    mode = {mode}
    onSubmit = {handleSubmit}
    />
    < /div>
)
    ;
};
```

### The Proxies

```typescript
// httpAdapter.proxy.ts
import {httpAdapter} from './http-adapter';
import type {Url} from '../../contracts/url/url-contract';

export const createHttpAdapterProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(httpAdapter);

    return {
        bootstrap: () => {
            // NO jest.mock() here - transformer already did it!
            // Just setup mockImplementation (idempotent - safe to call multiple times)
            mock.mockImplementation((url) => {
                if (url === '/api/items') return Promise.resolve({items: []});
                return Promise.resolve({data: {}});
            });
        },

        configure: (config: Record<string, unknown>) => {
            Object.entries(config).forEach(([url, data]) => {
                mock.mockResolvedValueOnce(data);
            });
        },

        returns: (url: Url, data: unknown) => {
            mock.mockResolvedValueOnce(data);
        }
    };
};

// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: () => {
            httpProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            if (config.items) {
                httpProxy.configure({
                    '/api/items': {items: config.items}
                });
            }
        }
    };
};

// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            brokerAProxy.configure(config);
        },

        triggerSubmit: async () => {
            const button = screen.queryByTestId('SUBMIT_BUTTON');

            if (!button) {
                throw new Error(
                    'WidgetB submit button not visible.\n\n' +
                    'Requirements:\n' +
                    '1. mode="edit" prop must be passed to WidgetB\n' +
                    '2. Items loaded (widgetBProxy.configure({ items: [...] }))'
                );
            }

            await userEvent.click(button);
        }
    };
};

// WidgetA.proxy.ts
export const createWidgetAProxy = () => {
    const widgetBProxy = createWidgetBProxy();

    return {
        bootstrap: () => {
            widgetBProxy.bootstrap();
        },

        configure: (config: { items?: Item[] }) => {
            widgetBProxy.configure(config);
        }
    };
};
```

### The Test

```typescript
// WidgetA.test.tsx
import {WidgetA} from './widget-a';
import {createWidgetAProxy} from './widget-a.proxy';
import {createWidgetBProxy} from '../widget-b/widget-b.proxy';

// TRANSFORMER AUTO-INJECTED:
// const widgetAProxy = createWidgetAProxy();  // Create instance
// widgetAProxy.bootstrap();                   // Bootstrap - chains to all dependencies

describe('WidgetA', () => {
    it('renders with default data', () => {
        // Bootstrap already ran - won't crash
        render(<WidgetA / >);

        // WidgetB loads with empty items (bootstrap default)
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles submit in edit mode', async () => {
        const consoleSpy = jest.spyOn(console, 'log');

        // Configure with specific data via WidgetA's proxy (AFTER bootstrap, BEFORE render)
        const widgetAProxy = createWidgetAProxy();
        widgetAProxy.configure({
            items: [{id: 1, name: 'Item 1'}]  // Flows down through layers
        });

        // Create WidgetB proxy BEFORE render (for triggers)
        const widgetBProxy = createWidgetBProxy();

        render(<WidgetA / >);

        // Use WidgetA's UI to change mode
        await userEvent.click(screen.getByRole('button', {name: 'Edit Mode'}));

        // Wait for items to load
        await screen.findByText('Item 1');

        // Trigger WidgetB's submit (proxy already created before render)
        await widgetBProxy.triggerSubmit();

        // Assert WidgetA's behavior
        expect(consoleSpy).toHaveBeenCalledWith('Submitted!');
    });

});
```

**What this test demonstrates:**

- ✅ No manual jest.mock() calls (transformer handles it)
- ✅ No knowledge of testIds (proxy encapsulates)
- ✅ No knowledge of HTTP endpoints (config flows down through layers)
- ✅ Tests WidgetA's actual behavior
- ✅ Helpful errors when setup is wrong
- ✅ Override only what matters (specific items via config)

---

**Critical Rules (Lint-Enforced):**

1. **ALL values in tests use stubs** - Even strings! `FilePathStub('/path')` ✅ | `'/path'` ❌ (branded types required)
2. **Tests ONLY use stubs** - `UrlStub('value')` ✅ | `urlContract.parse('value')` ❌
3. **No type assertions** - `const x = { } as Type` ❌ | Use stubs ✅
4. **Proxies ONLY import types from contracts** - `import type { Url }` ✅ | `import { urlContract }` ❌
5. **No manual cleanup** - Proxy registers `afterAll()` internally
6. **No "mock" in proxy helpers** - `returns()` ✅ | `mockSuccess()` ❌ (abstracts implementation)
7. **Proxies return data, NO assertions** - `getCallCount()` ✅ | `expectCalled()` ❌ (tests do expect())
8. **Every file has a proxy** - Widgets, brokers, adapters, etc all have `.proxy.ts` files
9. **Only adapters use jest.mock()** - Everything else chains bootstrap() to dependencies
10. **Triggers don't know parent state** - Parent test controls parent, trigger controls child interaction
11. **Proxies must call all child bootstraps** - If proxy imports implementation, must import + call its proxy's
    bootstrap()
12. **Proxies cannot bootstrap phantom dependencies** - Proxy can only bootstrap dependencies that the implementation
    file actually imports

### File Structure

**EVERY file gets a proxy** - co-located with the implementation (same folder as `.stub.ts` and `.test.ts` files):

```
adapters/
  http/
    http-adapter.ts          # Implementation (entry file)
    http-adapter.proxy.ts    # Proxy (NOT entry file - same-folder only)
    http-adapter.test.ts     # Test (NOT entry file - same-folder only)

brokers/
  broker-a/
    broker-a.ts              # Implementation (entry file)
    broker-a.proxy.ts        # Proxy (NOT entry file - same-folder only)
    broker-a.test.ts         # Test (NOT entry file - same-folder only)

widgets/
  widget-b/
    widget-b.tsx             # Implementation (entry file)
    widget-b.proxy.ts        # Proxy (NOT entry file - same-folder only)
    widget-b.test.tsx        # Test (NOT entry file - same-folder only)
```

**Import Rules:**

- `.proxy.ts` files follow same rules as `.test.ts` - same-folder imports only
- Only main implementation files (`-adapter.ts`, `-broker.ts`, `-widget.tsx`) are entry files that can be imported
  cross-folder
- Tests import both the implementation and its proxy from same folder
- Proxies import their dependencies' proxies (for bootstrap chaining)

### Key Insight: Universal Proxies with Three Responsibilities

**"Proxy"** = Test control layer with three responsibilities:

1. **bootstrap()** - Setup dependencies with safe defaults (called once automatically, NO ARGS)
2. **configure()** - Override defaults with test-specific data (called by tests, TAKES ARGS)
3. **trigger methods** - Encapsulate interactions without exposing internals

**Every file gets a proxy:**

- **Adapters** - Only place `jest.mock()` exists, provides returns/throws/getters
- **Brokers** - Chains bootstrap to adapters, can provide call() method
- **Widgets** - Chains bootstrap through brokers, provides trigger methods (triggerSubmit, etc)
- **Responders** - Chains bootstrap through brokers, provides call() method

**Why "proxy" not "mock"?**

- Proxy implies encapsulation and control, not necessarily faking
- Some adapter proxies use Jest mocks (HTTP, FS)
- Some adapter proxies might use real systems in temp environments (ESLint, DB against test instance)
- Widget/broker proxies don't mock at all - they just encapsulate

**Why no "mock" in helper names?**

- Helper names describe WHAT they do (behavior), not HOW (implementation)
- `returns(data)` - adapter will return this data
- `throws(error)` - adapter will throw this error
- `triggerSubmit()` - clicks the submit button
- `bootstrap()` - setup with safe defaults
- ❌ `mockSuccess()`, `mockClick()` - reveals implementation details

### Summary: How Everything Fits Together

**The Flow:**

1. **Developer writes test file** importing only what they're testing
2. **Transformer finds the file's proxy** (e.g., `widget-a.ts` → `widget-a.proxy.ts`)
3. **Transformer injects instance creation and ONE bootstrap call (NO ARGS)** at module level
4. **Bootstrap chains execute** from widgets → brokers → adapters → jest.mock() (NO ARGS)
5. **Tests run** with everything already bootstrapped (won't crash)
6. **Tests configure specific data** via `proxy.configure()` when needed
7. **Tests trigger child interactions** via proxy trigger methods
8. **Tests assert parent behavior** without knowing child internals

**Developer Experience:**

```typescript
// What developer writes:
import {WidgetA} from './widget-a';
import {createWidgetBProxy} from '../widget-b/widget-b.proxy';

it('test', async () => {
    // Create proxy and configure if needed
    const widgetBProxy = createWidgetBProxy();
    widgetBProxy.configure({items: [...]}); // Override defaults when needed

    render(<WidgetA / >);  // Just works (bootstrap ran with safe defaults)

    await widgetBProxy.triggerSubmit();  // Don't know testId

    expect(result).toBe(expected);  // Test parent behavior
});

// What transformer adds (invisible - TWO lines!):
import {createWidgetAProxy} from './widget-a.proxy';

const widgetAProxy = createWidgetAProxy();  // Create instance
widgetAProxy.bootstrap();                   // Chains automatically! NO ARGS!
```

**Key Benefits:**

✅ **No jest.mock() in tests** - Transformer + proxies handle it
✅ **No knowing transitive dependencies** - Bootstrap chains handle it
✅ **No exposing child internals** - Triggers encapsulate it
✅ **No manual setup boilerplate** - Bootstrap provides defaults
✅ **Integration testing** - Real code runs, only I/O mocked
✅ **Helpful errors** - Proxies explain what's missing
✅ **Override only what matters** - Bootstrap defaults, specific overrides

**The Magic:**

- Bootstrap makes everything work by default
- Triggers hide implementation details
- Tests focus on behavior, not setup
- Changes to children don't break parent tests
- LLMs write simple tests without Jest knowledge

## Pattern 1: Proxy Handles Mocking Internally

### The Boilerplate Problem

```typescript
// ❌ OLD: Every test has manual boilerplate
jest.mock('fs/promises');                    // 1. Manual hoisting
import {readFile} from 'fs/promises';

const mockReadFile = jest.mocked(readFile);   // 2. Manual jest.mocked()

it('test', async () => {
    const filePath = FilePathStub('/path');     // 3. Manual stubbing
    const contents = FileContentsStub('data');  // 4. Need to know Buffer details
    mockReadFile.mockResolvedValue(Buffer.from('data')); // 5. Buffer complexity

    const result = await someFunction({filePath});
    expect(result).toStrictEqual(contents);
});
```

### Solution: Transformer Handles jest.mock(), Proxy Uses jest.mocked()

**Key insight:** Transformer injects `jest.mock()` at test file top based on `useMock: true`. Proxies just use
`jest.mocked()` assuming it's already set up.

```typescript
// Proxy factory (NO jest.mock() call!)
export const createFsReadFileProxy = () => {
    return createAdapterProxy(fsReadFileAdapter, {useMock: true})((mockedAdapter) => {
        // Transformer already called jest.mock() at test file top
        // mockedAdapter is jest.Mocked<typeof fsReadFileAdapter>

        return {
            returns: (path, contents) => mockedAdapter.mockResolvedValue(contents),
            throws: (path, error) => mockedAdapter.mockRejectedValue(error),
            getCallCount: () => mockedAdapter.mock.calls.length
        };
    });
};
```

**Transformer behavior:**

```typescript
// Test file (BEFORE transformation)
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {createFsReadFileProxy} from './fs-read-file-adapter.proxy';

// Test file (AFTER transformation)
jest.mock('./fs-read-file-adapter');  // ← Transformer injected this!

import {fsReadFileAdapter} from './fs-read-file-adapter';
import {createFsReadFileProxy} from './fs-read-file-adapter.proxy';
```

**This eliminates:**

- `jest.mock()` in test files
- `jest.mock()` in proxy files
- `jest.mocked()` wrapper in test files
- Understanding what to mock (adapter vs npm package)
- Buffer handling, type assertions, mock setup
- Knowing when to use `mockResolvedValue` vs `mockReturnValue` vs `mockImplementation`

LLMs just call `createFsReadFileProxy()` and use the simple API. Transformer handles all jest.mock() injection.

### Proxy Pattern Consistency

**Key Insight:** All proxies use the same direct pattern. No helper needed.

**Important principles:**

- Tests must use stubs directly, not contracts
- ALL values in tests must be created via stubs (branded types required)
- Proxies accept branded types only (no raw values)
- Lint rules enforce these patterns

**Example 1: HTTP Adapter (Mocked)**

```typescript
// adapters/http/http-adapter.proxy.ts
import {httpAdapter} from './http-adapter';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';

export const createHttpAdapterProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(httpAdapter);

    return {
        // Helpers accept branded types only (created via stubs in tests)
        returns: (url: Url, data: unknown): void => {
            mock.mockResolvedValue({
                data,
                status: 200,
                headers: {},
                statusText: 'OK',
                config: {}
            });
        },

        throws: (url: Url, error: Error): void => {
            mock.mockRejectedValue(error);
        },

        // Getter helpers - return data for assertions (NO expect() in proxy!)
        getCallCount: (): number => {
            return mock.mock.calls.length;
        },

        getLastCallArgs: (): [Url, any] | undefined => {
            const calls = mock.mock.calls;
            return calls[calls.length - 1] as [Url, any] | undefined;
        }
    };
};
```

**Example 2: File System Adapter (Uses Jest mocks)**

```typescript
// adapters/fs/fs-read-file-adapter.proxy.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import type {FilePath} from '../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../contracts/file-contents/file-contents-contract';

export const createFsReadFileProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(fsReadFileAdapter);

    return {
        // Setup helpers - control what adapter returns
        returns(filePath: FilePath, contents: FileContents): void {
            mock.mockResolvedValueOnce(contents);
        },

        throws(filePath: FilePath, error: Error): void {
            mock.mockRejectedValueOnce(error);
        },

        // Getter helpers - return data for assertions (NO expect() in proxy!)
        getCallCount(): number {
            return mock.mock.calls.length;
        },

        getCallArgs(index: number): { filePath: FilePath } | undefined {
            return mock.mock.calls[index]?.[0];
        },

        wasCalledWith(filePath: FilePath): boolean {
            return mock.mock.calls.some(
                call => call[0]?.filePath === filePath
            );
        }
    };
};
```

**Key Insight:** One consistent proxy API

- **Setup helpers** (`returns`, `throws`) - Control adapter behavior
- **Getter helpers** (`getCallCount`, `wasCalledWith`) - Return data for assertions

**IMPORTANT:** Proxies provide GETTERS, not assertions!

- ❌ **Bad**: `expectCalled()` - Does `expect()` inside proxy
- ✅ **Good**: `getCallCount()` - Returns number, test does `expect()`
- **Why**: Avoids importing Jest's `expect()` in proxy - keeps proxies clean and flexible!

**Example 3: ESLint Adapter (Real ESLint - Not Mocked)**

```typescript
// adapters/eslint/eslint-adapter.proxy.ts
import {eslintAdapter} from './eslint-adapter';
import type {SourceCode} from '../../contracts/source-code/source-code-contract';
import {writeFile, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';

export const createEslintProxy = () => {
    // NO jest.mocked() - transformer won't inject jest.mock()
    // Uses REAL ESLint to validate selectors against real AST
    const testDir = join(tmpdir(), `eslint-test-${Date.now()}`);

    return {
        testDir,

        bootstrap: () => {
            // Setup real ESLint environment (temp directory, config, etc)
        },

        // Lint REAL code using real adapter
        async lintCode(code: SourceCode): Promise<unknown> {
            return eslintAdapter({code, config: {/* ... */}});
        },

        async cleanup(): Promise<void> {
            await rm(testDir, {recursive: true, force: true});
        }
    };
};
```

### Usage in Tests (Transparent Proxies)

**Example 1: HTTP Adapter Test (uses mocked axios internally)**

```typescript
// adapters/axios/axios-get-adapter.test.ts
import {axiosGetAdapter} from './axios-get-adapter';
import {createAxiosGetProxy} from './axios-get-adapter.proxy';
import {HttpResponseStub} from '../../contracts/http-response/http-response.stub';
import {UrlStub} from '../../contracts/url/url.stub';

describe('axiosGetAdapter', () => {
    const httpProxy = createAxiosGetProxy();  // Proxy handles jest.mock() internally

    it('VALID: {url: "https://api.example.com/users"} => returns data', async () => {
        const url = UrlStub('https://api.example.com/users');
        const expected = HttpResponseStub({data: {users: []}});

        // ✅ Simple API - proxy uses jest mock internally (useMock: true)
        httpProxy.returns(url, {users: []});

        const result = await axiosGetAdapter({url});

        expect(result).toStrictEqual(expected);

        // ✅ Use getter - test does assertions
        expect(httpProxy.getCallCount()).toBe(1);
        expect(httpProxy.getLastCallArgs()?.[0]).toBe(url);
    });
});
```

**Example 2: File System Adapter Test (uses Jest mocks internally)**

```typescript
// adapters/fs/fs-read-file-adapter.test.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {createFsReadFileProxy} from './fs-read-file-adapter.proxy';
import {FileContentsStub} from '../../contracts/file-contents/file-contents.stub';
import {FilePathStub} from '../../contracts/file-path/file-path.stub';

describe('fsReadFileAdapter', () => {
    const fsProxy = createFsReadFileProxy();  // Proxy handles jest.mock() internally

    it('VALID: {filePath: "/config.json"} => returns file contents', async () => {
        const filePath = FilePathStub('/config.json');
        const contents = FileContentsStub('{"key": "value"}');
        const expected = FileContentsStub('{"key": "value"}');

        // ✅ Simple API - proxy uses jest mock internally
        fsProxy.returns(filePath, contents);

        const result = await fsReadFileAdapter({filePath});

        expect(result).toStrictEqual(expected);
        expect(fsProxy.getCallCount()).toBe(1);
    });
});
```

**Example 3: Sequential/Multiple Calls**

```typescript
it('VALID: multiple file reads in one test', async () => {
    const path1 = FilePathStub('/config.json');
    const path2 = FilePathStub('/data.json');
    const contents1 = FileContentsStub('{"config": true}');
    const contents2 = FileContentsStub('{"data": []}');

    // ✅ Use mockResolvedValueOnce for sequential calls
    fsProxy.returns(path1, contents1);  // First call
    fsProxy.returns(path2, contents2);  // Second call

    const result1 = await fsReadFileAdapter({filePath: path1});
    const result2 = await fsReadFileAdapter({filePath: path2});

    expect(result1).toStrictEqual(contents1);
    expect(result2).toStrictEqual(contents2);
    expect(fsProxy.getCallCount()).toBe(2);
});
```

**Key Insight:** Tests don't know if proxy uses mocks or real implementation!

- HTTP proxy: Uses Jest mocks internally → Fast tests
- FS proxy: Uses Jest mocks internally → Fast, isolated tests
- ESLint proxy: Uses REAL ESLint internally → Validates against real AST

**Benefits:**

- ✅ **NO jest.mock() in tests** - Proxy handles it internally
- ✅ **NO manual cleanup** - Proxy registers afterAll() automatically
- ✅ **NO mode switching** - Each adapter decides once (in proxy)
- ✅ **Same test API** - Proxies hide implementation (mock vs real)
- ✅ **Type-safe** - Branded types everywhere (TypeScript catches raw strings at compile time)
- ✅ **Lint enforced** - No contracts in tests, no type assertions, types-only in proxies

## Pattern 2: Enforcement & Registry

SEE: [LINT-RULES.md](LINT-RULES.md)

### Auto-Generated Registry

```typescript
// adapters/adapter-proxy-registry.ts (auto-generated)
export const adapterProxies = {
    'fs-read-file': () => import('./fs/fs-read-file-adapter.proxy'),
    'axios-get': () => import('./axios/axios-get-adapter.proxy'),
    'eslint-lint': () => import('./eslint/eslint-lint-adapter.proxy'),
} as const;
```

## Pattern 3: Use Proxy, Not jest.mock()

```typescript
// ❌ BAD: Mock npm packages in broker
// broker.test.ts
jest.mock('fs/promises');
const mockFs = jest.mocked(readFile);

// ❌ BAD: Manually mock adapter in broker
// broker.test.ts
jest.mock('../../../adapters/fs/fs-read-file-adapter');
const mockFsAdapter = jest.mocked(fsReadFileAdapter);
mockFsAdapter.mockResolvedValue(FileContentsStub('data'));

// ✅ GOOD: Use proxy in broker
// broker.test.ts
import {createFsReadFileProxy} from '../../../adapters/fs/fs-read-file-adapter.proxy';

const fsProxy = createFsReadFileProxy();
fsProxy.returns(FilePathStub('/path'), FileContentsStub('data'));
```

**Why:**

- If fs API changes → Only adapter + proxy change
- Lint forbids `jest.mock()` on adapters (enforces proxy usage)
- Consistent API across ALL tests
- Zero Jest boilerplate

## Pattern 4: Three Testing Levels

```
┌─────────────────────────────────────┐
│ 3. End-to-End Tests                  │
│ Full system, real processes          │
│ Example: Hook integration tests      │
│ NO proxies - just run the real thing │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 2. Adapter Tests                     │
│ Use proxy (mock or real per-adapter) │
│ Example: fsReadFileAdapter tests     │
│ Proxy decision: Real fs in temp dir  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 1. Unit Tests (Brokers/Responders)   │
│ Use proxy (NOT jest.mock on adapter) │
│ Example: Broker/responder tests      │
│ Fast, isolated, simple API           │
└─────────────────────────────────────┘
```

**Key difference from traditional mocking:**

- ❌ **Old way**: `jest.mock()` adapters → Manual setup, Jest boilerplate
- ✅ **Proxy way**: Import proxy, use helpers → Zero boilerplate, consistent API

## Summary: LLM Workflow

### When Creating an Adapter

LLM must create **3 files**:

1. `-adapter.ts` - Implementation
2. `-adapter.proxy.ts` - Proxy using `jest.mocked()` (or not for real implementations)
3. `-adapter.test.ts` - Tests using proxy

**Decision: Mock or Real?**

- **Mocked (default)**: HTTP, FS, DB, external APIs → Use `jest.mocked(adapter)` (transformer injects jest.mock())
- **Real (special case)**: ESLint only → Don't use `jest.mocked()` (runs real implementation)

### Quick Reference

```typescript
// 1. Implementation
export const myAdapter = async ({input}: { input: Input }): Promise<Output> => {
    return npmPackage.method(input);
};

// 2. Proxy (mocked by default)
// ✅ Only import types from contracts
import type {Input} from '../../contracts/input/input-contract';

export const createMyAdapterProxy = () => {
    // Transformer sees jest.mocked() and injects jest.mock() at test file top
    const mock = jest.mocked(myAdapter);

    // Auto-cleanup if needed
    afterAll(async () => {
        await cleanup();
    });

    return {
        bootstrap: () => {
            // Setup mockImplementation with safe defaults
            mock.mockImplementation((input) => {
                return Promise.resolve(OutputStub('default'));
            });
        },

        // Helpers accept branded types only
        returns: (input: Input, output: Output): void => {
            mock.mockResolvedValueOnce(output);
        }
    };
};

// 3. Test
// ✅ Use stubs to create branded types
import {InputStub} from '../../contracts/input/input.stub';
import {OutputStub} from '../../contracts/output/output.stub';

describe('myAdapter', () => {
    const proxy = createMyAdapterProxy();

    it('VALID: {input: "value"} => returns output', async () => {
        const input = InputStub('value');      // Explicit stub usage
        const expected = OutputStub('result'); // Expected value via stub

        proxy.returns(input, expected);    // Pass branded types

        const result = await myAdapter({input});
        expect(result).toStrictEqual(expected);
    });
});
```

### Architecture Wins

**✅ Solved:**

1. **No Jest confusion** - LLMs use simple proxy API instead of fighting Jest internals
2. **No manual `jest.mock()` in tests** - Transformer handles it automatically
3. **No manual `jest.mock()` in proxies** - Transformer detects `jest.mocked()` and injects at test file top
4. **No helper needed** - Direct pattern for all proxies (adapters, brokers, widgets)
5. **Clear signal** - Presence of `jest.mocked()` tells transformer to inject mocking
6. **No manual cleanup** - Proxy registers afterAll() automatically
7. **No raw values** - Lint enforces stubs only (type-safe branded values)
8. **No type assertions** - Lint forbids `as Type` in tests
9. **No contract imports** - Lint enforces type-only imports from contracts
10. **No "mock" in names** - Lint forbids `mockSuccess()`, requires `returns()` (abstracts implementation)
11. **No jest.mock() on adapters in tests** - Lint forbids mocking adapters, enforces proxy usage instead
12. **No assertions in proxy** - Proxies return data (getters), tests do `expect()` - keeps proxies clean
13. **Only adapters mocked** - Lint enforces: brokers/widgets/responders never use `jest.mocked()`
14. **Consistent pattern** - All proxies return object with `bootstrap()` method
15. **One API everywhere** - Same proxy helpers whether testing adapter or code using adapter

**🎯 Key Wins:**

- **LLM-friendly**: Clear 3-file pattern (adapter + proxy + test)
- **Type-safe**: Branded types enforced via stubs + lint rules
- **Resilient**: npm changes isolated to ONE test file per adapter
- **Simple**: Use `jest.mocked()` in adapter proxies (transformer handles the rest)
- **Clear signal**: `jest.mocked()` presence tells transformer what to mock
- **Clean**: Zero Jest boilerplate in tests or proxies
- **Consistent**: Same direct pattern for all proxies (no helper needed)
- **Abstraction**: Proxy helpers hide implementation (real vs mock)
- **Zero setup**: Adapters work automatically, just use assertion helpers
- **Separation of concerns**: Proxies return data, tests do assertions
- **Only boundaries mocked**: Adapters are mocked, business logic (brokers/widgets) runs real
- **Enforced**: 12 lint rules ensure patterns are followed (no escape hatches!)
