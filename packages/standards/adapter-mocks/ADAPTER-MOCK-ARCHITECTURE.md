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

1. **bootstrap()** - Setup dependencies with safe defaults so code doesn't crash
2. **trigger methods** - Encapsulate interactions (clicking buttons, calling functions) without exposing internals

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
import {createWidgetBProxy} from './widget-b.proxy';

// TRANSFORMER AUTO-INJECTED (developer doesn't write this):
import {createWidgetAProxy} from './widget-a.proxy';

beforeAll(() => {
    createWidgetAProxy().bootstrap();  // ONE call - chains automatically!
});
// END AUTO-INJECTION

describe('WidgetA', () => {
    it('handles button click from WidgetB', async () => {
        const consoleSpy = jest.spyOn(console, 'log');

        // Create proxy BEFORE render
        const widgetBProxy = createWidgetBProxy();

        // Just render - bootstrap already set defaults, won't crash
        render(<WidgetA / >);

        // Trigger WidgetB's button via proxy (don't know its testId)
        await widgetBProxy.triggerSubmit();

        // Test WidgetA's responsibility: handling the event
        expect(consoleSpy).toHaveBeenCalledWith('Submitted!');
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

- Only adapters use `jest.mock()`
- Other proxies chain to their dependency proxies' bootstrap()
- Bootstrap is idempotent (calling multiple times is safe)
- Bootstrap uses `mockImplementation` (fallback for all calls)

### Adapter Bootstrap (Only Place jest.mock() Exists)

```typescript
// httpAdapter.proxy.ts
let bootstrapped = false;

export const createHttpAdapterProxy = () => {
    return {
        bootstrap: (config?: Record<string, unknown>) => {
            if (!bootstrapped) {
                bootstrapped = true;

                // ONLY adapters use jest.mock()
                jest.mock('./http-adapter');
                const mock = jest.mocked(httpAdapter);

                // Set fallback for ALL calls
                mock.mockImplementation((url) => {
                    // Safe defaults that won't crash
                    if (url.includes('/api/items')) return Promise.resolve({items: []});
                    if (url.includes('/api/users')) return Promise.resolve({users: []});
                    return Promise.resolve({data: {}});  // Generic fallback
                });
            }

            // Apply config overrides (idempotent - can be called multiple times)
            if (config) {
                const mock = jest.mocked(httpAdapter);
                Object.entries(config).forEach(([url, data]) => {
                    mock.mockResolvedValueOnce(data);
                });
            }
        }
    };
};
```

**Key insight:** Bootstrap can be called multiple times (idempotent). First call sets up mock, subsequent calls apply
config overrides.

### Broker Bootstrap (Chains to Adapter)

```typescript
// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            // Broker knows the URL mapping
            if (config?.items) {
                httpProxy.bootstrap({
                    '/api/items': {items: config.items}
                });
            } else {
                httpProxy.bootstrap();  // Use adapter's safe defaults
            }
        }
    };
};
```

**BrokerA doesn't use jest.mock()** - it just chains to httpProxy.bootstrap() and translates config.

### Widget Bootstrap (Chains to Broker)

```typescript
// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            // Just pass config to broker
            brokerAProxy.bootstrap(config);  // Broker knows what to do with it
        },

        triggerSubmit: async () => {
            const button = screen.queryByTestId('SUBMIT_BUTTON');
            if (!button) {
                throw new Error(
                    'WidgetB submit button not visible.\n' +
                    'Button requires items from API.\n' +
                    'Override in test: widgetBProxy.bootstrap({ items: [...] })'
                );
            }
            await userEvent.click(button);
        }
    };
};
```

**Bootstrap chain:** WidgetB → BrokerA → httpAdapter → `jest.mock()` + `mockImplementation`

**Config flows:** `{ items }` → `{ items }` → `{ '/api/items': { items } }` → mockResolvedValueOnce

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

**Transformer injects ONE bootstrap call:**

```typescript
// WidgetA.test.tsx (after transformation)
import {WidgetA} from './widget-a';

// TRANSFORMER FINDS:
// - File being tested: widget-a.ts
// - Corresponding proxy: widget-a.proxy.ts
//
// TRANSFORMER INJECTS:
import {createWidgetAProxy} from './widget-a.proxy';

beforeAll(() => {
    createWidgetAProxy().bootstrap();  // That's it! Bootstrap chain handles the rest
});

// Now tests run with everything bootstrapped
describe('WidgetA', () => {
    it('renders', () => {
        render(<WidgetA / >);  // Won't crash - HTTP returns safe defaults
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

### Transformer Simplification: Why No Recursive Scanning?

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
    return {
        bootstrap: () => {
            jest.mock('./http-adapter');  // Only adapters use jest.mock()
            // ... setup mockImplementation
        }
    };
};
```

**The chain executes automatically:**

```
Transformer injects:
  createWidgetAProxy().bootstrap()
    ↓ (manually calls - enforced by lint)
  createWidgetBProxy().bootstrap()
    ↓ (manually calls - enforced by lint)
  createBrokerAProxy().bootstrap()
    ↓ (manually calls - enforced by lint)
  createHttpAdapterProxy().bootstrap()
    ↓ (terminal - jest.mock())
  jest.mock() + mockImplementation
```

**Benefits of simplified transformer:**

- ✅ **No recursive import scanning** - Transformer doesn't walk the dependency tree
- ✅ **No complex AST analysis** - Just find file being tested, inject one call
- ✅ **Lint enforces correctness** - Rule 6 ensures chains are complete
- ✅ **Simple to implement** - ~50 lines of code vs ~500 lines for recursive scanner
- ✅ **Fast** - No deep tree traversal, just string replacement
- ✅ **Debuggable** - If bootstrap fails, error shows which proxy broke the chain

### Overriding Bootstrap Defaults via Configuration

**Key principle:** Tests pass configuration to the proxy they're testing. Each proxy passes config down to its direct
child only.

```typescript
// WidgetA.test.tsx
import {WidgetA} from './widget-a';
import {createWidgetAProxy} from './widget-a.proxy';

// Transformer auto-bootstraps with NO config (safe defaults)

describe('WidgetA', () => {
    it('shows items', () => {
        // Pass config to WidgetA's proxy
        const widgetAProxy = createWidgetAProxy();
        widgetAProxy.bootstrap({
            items: [{id: 1, name: 'Item 1'}]  // WidgetA doesn't know this becomes HTTP call!
        });

        render(<WidgetA / >);

        expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
});
```

**How config flows down:**

```typescript
// WidgetA.proxy.ts
export const createWidgetAProxy = () => {
    const widgetBProxy = createWidgetBProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            // Pass config to direct child (WidgetB)
            widgetBProxy.bootstrap(config);  // WidgetB decides what to do with it
        }
    };
};

// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            // Pass config to direct child (BrokerA)
            brokerAProxy.bootstrap(config);  // BrokerA decides what to do with it
        }
    };
};

// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            // BrokerA knows it fetches from /api/items
            if (config?.items) {
                httpProxy.bootstrap({
                    '/api/items': {items: config.items}
                });
            } else {
                httpProxy.bootstrap();  // Use defaults
            }
        }
    };
};
```

**Key insight:**

- WidgetA test knows: "I need items"
- WidgetA proxy: passes config to WidgetB
- WidgetB proxy: passes config to BrokerA
- BrokerA proxy: translates `{ items }` → `{ '/api/items': { items } }` (knows the URL!)
- httpAdapter proxy: sets up the mock

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
        bootstrap: (config?: { items?: Item[] }) => {
            brokerAProxy.bootstrap(config);  // Pass config down
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
                    '   → widgetBProxy.bootstrap({ items: [...] })\n\n' +
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
                    `Ensure widgetBProxy.bootstrap({ items: [{ id: ${itemId}, ... }] })`
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
            '   → widgetBProxy.bootstrap({ items: [...] })'
        );
    }

    await userEvent.click(button);
}
```

**Test handles parent state:**

```typescript
it('handles submit in edit mode', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    // Setup data via WidgetA's proxy (BEFORE render)
    const widgetAProxy = createWidgetAProxy();
    widgetAProxy.bootstrap({items: [{id: 1}]});  // Flows down to HTTP layer

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
- Test controls data (via widgetAProxy.bootstrap, flows down through layers)
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
        bootstrap: (config?: { items?: Item[] }) => {
            brokerAProxy.bootstrap(config);  // Pass config down
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
    return {
        bootstrap: () => {
            jest.mock('./http-adapter');
            const mock = jest.mocked(httpAdapter);
            mock.mockImplementation((url) => {
                // Safe defaults
                return Promise.resolve({data: {}});
            });
        },

        returns: (url, data) => {
            const mock = jest.mocked(httpAdapter);
            mock.mockResolvedValueOnce({data});
        }
    };
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
let bootstrapped = false;

export const createHttpAdapterProxy = () => {
    return {
        bootstrap: (config?: Record<string, unknown>) => {
            if (!bootstrapped) {
                bootstrapped = true;

                jest.mock('./http-adapter');
                const mock = jest.mocked(httpAdapter);

                mock.mockImplementation((url) => {
                    if (url === '/api/items') return Promise.resolve({items: []});
                    return Promise.resolve({data: {}});
                });
            }

            // Apply config overrides
            if (config) {
                const mock = jest.mocked(httpAdapter);
                Object.entries(config).forEach(([url, data]) => {
                    mock.mockResolvedValueOnce(data);
                });
            }
        },

        returns: (url: string, data: unknown) => {
            const mock = jest.mocked(httpAdapter);
            mock.mockResolvedValueOnce(data);
        }
    };
};

// BrokerA.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            if (config?.items) {
                httpProxy.bootstrap({
                    '/api/items': {items: config.items}
                });
            } else {
                httpProxy.bootstrap();
            }
        }
    };
};

// WidgetB.proxy.ts
export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: (config?: { items?: Item[] }) => {
            brokerAProxy.bootstrap(config);  // Pass config down
        },

        triggerSubmit: async () => {
            const button = screen.queryByTestId('SUBMIT_BUTTON');

            if (!button) {
                throw new Error(
                    'WidgetB submit button not visible.\n\n' +
                    'Requirements:\n' +
                    '1. mode="edit" prop must be passed to WidgetB\n' +
                    '2. Items loaded (widgetBProxy.bootstrap({ items: [...] }))'
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
        bootstrap: (config?: { items?: Item[] }) => {
            widgetBProxy.bootstrap(config);  // Pass config down
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
// import { createWidgetAProxy } from './widget-a.proxy';
// beforeAll(() => {
//   createWidgetAProxy().bootstrap();  // ONE call - chains to all dependencies
// });

describe('WidgetA', () => {
    it('renders with default data', () => {
        // Bootstrap already ran - won't crash
        render(<WidgetA / >);

        // WidgetB loads with empty items (bootstrap default)
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles submit in edit mode', async () => {
        const consoleSpy = jest.spyOn(console, 'log');

        // Setup specific data via WidgetA's proxy (BEFORE render)
        const widgetAProxy = createWidgetAProxy();
        widgetAProxy.bootstrap({
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

### Key Insight: Universal Proxies with Two Responsibilities

**"Proxy"** = Test control layer with two responsibilities:

1. **bootstrap()** - Setup dependencies with safe defaults
2. **trigger methods** - Encapsulate interactions without exposing internals

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
3. **Transformer injects ONE bootstrap call** in beforeAll
4. **Bootstrap chains execute** from widgets → brokers → adapters → jest.mock()
5. **Tests run** with everything already bootstrapped (won't crash)
6. **Tests override specific data** via proxy methods when needed
7. **Tests trigger child interactions** via proxy trigger methods
8. **Tests assert parent behavior** without knowing child internals

**Developer Experience:**

```typescript
// What developer writes:
import {WidgetA} from './widget-a';
import {createWidgetBProxy} from '../widget-b/widget-b.proxy';

it('test', async () => {
    // Create proxy BEFORE render
    const widgetBProxy = createWidgetBProxy();

    render(<WidgetA / >);  // Just works (bootstrap ran)

    await widgetBProxy.triggerSubmit();  // Don't know testId

    expect(result).toBe(expected);  // Test parent behavior
});

// What transformer adds (invisible - ONE line!):
import {createWidgetAProxy} from './widget-a.proxy';

beforeAll(() => {
    createWidgetAProxy().bootstrap();  // Chains automatically!
});
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

### Solution: Proxy Does the Mocking

**Key insight:** The proxy factory itself can call `jest.mock()` when it's created for adapter proxies.

```typescript
// In the proxy factory
export const createFsReadFileProxy = () => {
    // Proxy handles jest.mock() internally
    jest.mock('./fs-read-file-adapter');
    const mockAdapter = jest.mocked(fsReadFileAdapter);

    return {
        returns: (path, contents) => mockAdapter.mockResolvedValue(contents),
        throws: (path, error) => mockAdapter.mockRejectedValue(error),
        getCallCount: () => mockAdapter.mock.calls.length
    };
};
```

**This eliminates:**

- `jest.mock()` in test files
- `jest.mocked()` wrapper in test files
- Understanding what to mock (adapter vs npm package)
- Buffer handling, type assertions, mock setup
- Knowing when to use `mockResolvedValue` vs `mockReturnValue` vs `mockImplementation`

LLMs just call `createFsReadFileProxy()` and use the simple API.

### System Proxy Factory (Per-Adapter Decision)

**Key Insight:** Each adapter decides whether to mock or use real implementation.

```typescript
// packages/testing/src/create-adapter-proxy.ts

/**
 * REMOVED: Tests must use stubs directly, not contracts
 *
 * ALL values in tests must be created via stubs (branded types required):
 * ✅ const url = UrlStub('https://example.com');
 * ❌ const url = 'https://example.com';  // Raw string not allowed
 * ❌ const url = urlContract.parse('https://example.com');  // No contracts in tests
 *
 * Proxies accept branded types only (no raw values, no auto-stubbing):
 * ✅ httpProxy.returns(UrlStub('https://example.com'), data);
 * ❌ httpProxy.returns('https://example.com', data); // Type error - not branded
 *
 * Lint rules enforce:
 * - No contract imports in test files (only type imports and stubs)
 * - No type assertions (const x = {} as Type)
 * - Proxy files can only import types from contracts
 */

/**
 * System-level adapter proxy factory
 * Each adapter decides: mock or real implementation
 */
export const createAdapterProxy = <TNpmModule>(
    npmModule: TNpmModule,
    config: {
        useMock: boolean;
    }
) => {
    return <THelpers>(
        createHelpers: (moduleOrMock: TNpmModule | jest.Mocked<TNpmModule>) => THelpers
    ): THelpers => {
        if (config.useMock) {
            // Decision: Use jest mock
            const mocked = jest.mocked(npmModule);
            return createHelpers(mocked);
        } else {
            // Decision: Use real implementation
            // Note: Helpers can still control environment (temp dirs, etc)
            return createHelpers(npmModule);
        }
    };
};
```

#### 3. Example Proxy Implementations

**Example 1: HTTP Adapter (Mocked)**

```typescript
// adapters/axios/axios-get-adapter.proxy.ts
import axios from 'axios';
import {createAdapterProxy} from '@questmaestro/testing';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';

export const createAxiosGetProxy = () => {
    return createAdapterProxy(axios, {useMock: true})((axiosOrMock) => {
        // ✅ useMock: true = axiosOrMock is jest.Mocked<typeof axios>
        const mockAxios = axiosOrMock as jest.Mocked<typeof axios>;

        return {
            // Helpers accept branded types only (created via stubs in tests)
            returns: (url: Url, data: unknown): void => {
                mockAxios.get.mockResolvedValue({
                    data,
                    status: 200,
                    headers: {},
                    statusText: 'OK',
                    config: {}
                });
            },

            throws: (url: Url, error: Error): void => {
                mockAxios.get.mockRejectedValue(error);
            },

            // Getter helpers - return data for assertions (NO expect() in proxy!)
            getCallCount: (): number => {
                return mockAxios.get.mock.calls.length;
            },

            getLastCallArgs: (): [Url, any] | undefined => {
                const calls = mockAxios.get.mock.calls;
                return calls[calls.length - 1] as [Url, any] | undefined;
            }
        };
    });
};
```

**Example 2: File System Adapter (Uses Jest mocks)**

```typescript
// adapters/fs/fs-read-file-adapter.proxy.ts
import {createAdapterProxy} from '@questmaestro/testing';
import {fsReadFileAdapter} from './fs-read-file-adapter';
import type {FilePath} from '../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../contracts/file-contents/file-contents-contract';

export const createFsReadFileProxy = () => {
    // Proxy mocks the adapter internally
    jest.mock('./fs-read-file-adapter');
    const mockAdapter = jest.mocked(fsReadFileAdapter);

    return {
        // Setup helpers - control what adapter returns
        returns(filePath: FilePath, contents: FileContents): void {
            mockAdapter.mockResolvedValueOnce(contents);
        },

        throws(filePath: FilePath, error: Error): void {
            mockAdapter.mockRejectedValueOnce(error);
        },

        // Getter helpers - return data for assertions (NO expect() in proxy!)
        getCallCount(): number {
            return mockAdapter.mock.calls.length;
        },

        getCallArgs(index: number): { filePath: FilePath } | undefined {
            return mockAdapter.mock.calls[index]?.[0];
        },

        wasCalledWith(filePath: FilePath): boolean {
            return mockAdapter.mock.calls.some(
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

**Example 3: ESLint Adapter (Real ESLint)**

```typescript
// adapters/eslint/eslint-lint-adapter.proxy.ts
import {ESLint} from 'eslint';
import {createAdapterProxy} from '@questmaestro/testing';
import {writeFile, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';

export const createEslintLintProxy = () => {
    return createAdapterProxy(ESLint, {useMock: false})((ESLintClass) => {
        // ✅ useMock: false = REAL ESLint (validates selectors against real AST!)
        const testDir = join(tmpdir(), `eslint-test-${Date.now()}`);

        return {
            testDir,

            // Setup REAL ESLint instance
            async createEslint(config: unknown): Promise<ESLint> {
                return new ESLintClass({
                    cwd: testDir,
                    overrideConfig: config,
                    useEslintrc: false
                });
            },

            // Lint REAL code
            async lintCode(code: string): Promise<unknown> {
                const eslint = await this.createEslint({/* config */});
                return eslint.lintText(code);
            },

            async cleanup(): Promise<void> {
                await rm(testDir, {recursive: true, force: true});
            }
        };
    });
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

### ESLint Rules (8 Total)

**Rule 1: Adapters Must Have Proxy and Test Files**

```typescript
// packages/eslint-plugin/src/rules/adapter-must-have-proxy.ts
export const adapterMustHaveProxy = {
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (filename.endsWith('-adapter.ts')) {
                    const proxyFile = filename.replace('-adapter.ts', '-adapter.proxy.ts');
                    const testFile = filename.replace('-adapter.ts', '-adapter.test.ts');

                    if (!fs.existsSync(proxyFile)) {
                        context.report({node, message: `Missing ${proxyFile}`});
                    }
                    if (!fs.existsSync(testFile)) {
                        context.report({node, message: `Missing ${testFile}`});
                    }
                }
            }
        };
    }
};
```

**Rule 2: Tests Must Use Stubs, Not Contracts**

```typescript
// packages/eslint-plugin/src/rules/test-no-contracts.ts
export const testNoContracts = {
    meta: {
        messages: {
            noContracts: 'Tests must use stubs, not contracts. Import from {{stubPath}} instead.'
        }
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                const importPath = node.source.value;
                // Forbid: import { contract } from './thing-contract'
                // Allow: import type { Type } from './thing-contract'
                // Allow: import { Stub } from './thing.stub'

                if (importPath.includes('-contract') && !node.importKind === 'type') {
                    const stubPath = importPath.replace('-contract', '.stub');
                    context.report({
                        node,
                        messageId: 'noContracts',
                        data: {stubPath}
                    });
                }
            }
        };
    }
};
```

**Rule 3: No Type Assertions in Tests**

```typescript
// packages/eslint-plugin/src/rules/test-no-type-assertions.ts
export const testNoTypeAssertions = {
    meta: {
        messages: {
            noTypeAssertion: 'Use stubs to create typed values, not type assertions. Use {{stubName}} instead.'
        }
    },
    create(context) {
        return {
            TSAsExpression(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Forbid: const obj = { prop: value } as Type
                // Allow: const fn = mockFn as jest.MockedFunction<...> (only for jest types)

                const isJestType = node.typeAnnotation.typeName?.getText().includes('jest');
                if (!isJestType) {
                    context.report({
                        node,
                        messageId: 'noTypeAssertion',
                        data: {
                            stubName: `${node.typeAnnotation.typeName}Stub`
                        }
                    });
                }
            }
        };
    }
};
```

**Rule 4: Proxy Files Must Only Import Types from Contracts**

```typescript
// packages/eslint-plugin/src/rules/proxy-no-contract-values.ts
export const proxyNoContractValues = {
    meta: {
        messages: {
            typeOnly: 'Proxy files must only import types from contracts, not the contract itself.'
        }
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                const importPath = node.source.value;
                // Forbid: import { contract } from './thing-contract'
                // Allow: import type { Type } from './thing-contract'

                if (importPath.includes('-contract') && node.importKind !== 'type') {
                    context.report({
                        node,
                        messageId: 'typeOnly'
                    });
                }
            }
        };
    }
};
```

**Rule 5: Proxy Helpers Cannot Use "mock" in Names**

```typescript
// packages/eslint-plugin/src/rules/proxy-no-mock-in-names.ts
export const proxyNoMockInNames = {
    meta: {
        messages: {
            noMock: 'Proxy helper "{{name}}" uses forbidden word "mock". Use "returns", "throws", or describe the action instead. Proxies abstract implementation (real vs mock).'
        }
    },
    create(context) {
        return {
            Property(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                // Check if this is a method/property in the proxy return object
                if (node.key && node.key.type === 'Identifier') {
                    const name = node.key.name;

                    // Forbid: mockSuccess, mockError, mockAnything
                    // Allow: returns, throws, expectCalled, setupFile
                    if (name.toLowerCase().includes('mock')) {
                        context.report({
                            node,
                            messageId: 'noMock',
                            data: {name}
                        });
                    }
                }
            }
        };
    }
};
```

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

**Rule 6: Proxies Must Call All Child Bootstraps**

```typescript
// packages/eslint-plugin/src/rules/proxy-must-call-child-bootstraps.ts
export const proxyMustCallChildBootstraps = {
    meta: {
        messages: {
            missingBootstrapCall: 'Proxy imports {{implementationName}} but does not call {{proxyName}}.bootstrap() in its bootstrap() method.',
            missingProxyImport: 'Proxy imports {{implementationName}} but does not import its corresponding proxy {{proxyPath}}.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                const sourceCode = context.getSourceCode();
                const implementationImports = [];
                const proxyImports = [];
                const bootstrapCalls = [];

                // Collect all imports
                node.body.forEach(statement => {
                    if (statement.type === 'ImportDeclaration') {
                        const importPath = statement.source.value;

                        // Skip contract type imports
                        if (importPath.includes('-contract') && statement.importKind === 'type') {
                            return;
                        }

                        // Track implementation imports (adapters, brokers, widgets)
                        if (importPath.match(/\/(adapter|broker|widget|responder)s?\//)) {
                            if (!importPath.includes('.proxy')) {
                                implementationImports.push({
                                    path: importPath,
                                    specifiers: statement.specifiers
                                });
                            } else {
                                proxyImports.push({
                                    path: importPath,
                                    specifiers: statement.specifiers
                                });
                            }
                        }
                    }
                });

                // Find bootstrap() method and collect .bootstrap() calls within it
                node.body.forEach(statement => {
                    if (statement.type === 'ExportNamedDeclaration' &&
                        statement.declaration?.type === 'VariableDeclaration') {

                        statement.declaration.declarations.forEach(declarator => {
                            if (declarator.init?.type === 'ArrowFunctionExpression' ||
                                declarator.init?.type === 'FunctionExpression') {

                                // Look for bootstrap method in returned object
                                const returnStatement = declarator.init.body.properties?.find(
                                    prop => prop.key?.name === 'bootstrap'
                                );

                                if (returnStatement) {
                                    // Scan bootstrap method for .bootstrap() calls
                                    const bootstrapBody = returnStatement.value.body;

                                    // Find all CallExpressions that are *.bootstrap()
                                    traverseNode(bootstrapBody, (node) => {
                                        if (node.type === 'CallExpression' &&
                                            node.callee.type === 'MemberExpression' &&
                                            node.callee.property.name === 'bootstrap') {

                                            const objectName = node.callee.object.name;
                                            bootstrapCalls.push(objectName);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });

                // Verify each implementation import has corresponding proxy import + bootstrap call
                implementationImports.forEach(({path: implPath, specifiers}) => {
                    const implName = specifiers[0]?.local.name;

                    // Derive expected proxy path and name
                    const proxyPath = implPath.replace(/(\-adapter|\-broker|\-widget|\-responder)(\.ts)?$/, '$1.proxy');
                    const expectedProxyName = `create${capitalize(implName)}Proxy`;

                    // Check if proxy is imported
                    const proxyImport = proxyImports.find(p => p.path === proxyPath);

                    if (!proxyImport) {
                        context.report({
                            node: specifiers[0],
                            messageId: 'missingProxyImport',
                            data: {
                                implementationName: implName,
                                proxyPath
                            }
                        });
                        return;
                    }

                    // Check if proxy's bootstrap is called
                    const proxyVarName = proxyImport.specifiers.find(
                        spec => spec.local.name.includes('Proxy')
                    )?.local.name.replace(/^create|Proxy$/g, '').toLowerCase() + 'Proxy';

                    if (!bootstrapCalls.includes(proxyVarName)) {
                        context.report({
                            node: proxyImport.specifiers[0],
                            messageId: 'missingBootstrapCall',
                            data: {
                                implementationName: implName,
                                proxyName: proxyVarName
                            }
                        });
                    }
                });
            }
        };
    }
};

function traverseNode(node, callback) {
    callback(node);
    Object.keys(node).forEach(key => {
        if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverseNode(child, callback));
            } else {
                traverseNode(node[key], callback);
            }
        }
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**Why This Rule Matters:**

This rule is CRITICAL for transformer simplification. By enforcing complete bootstrap chains at the proxy level, the
transformer doesn't need to recursively scan imports - it only needs to inject ONE bootstrap call for the file being
tested.

The bootstrap chain MUST be complete. If WidgetB imports BrokerA, it must also import and call BrokerA's proxy's
bootstrap():

```typescript
// ❌ BAD - Missing bootstrap call
// WidgetB.proxy.ts
import {brokerA} from '../../brokers/broker-a/broker-a';
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    return {
        bootstrap: () => {
            // Missing: brokerAProxy.bootstrap()
        }
    };
};

// ✅ GOOD - Complete bootstrap chain
// WidgetB.proxy.ts
import {brokerA} from '../../brokers/broker-a/broker-a';
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();  // ✅ Chain complete
        }
    };
};
```

**Key insight:** Every implementation dependency must have its proxy's bootstrap called. This ensures the transformer
doesn't need to track transitive dependencies - the proxy chain handles it.

**Rule 7: Proxy Cannot Bootstrap Dependencies Not Used by Implementation**

```typescript
// packages/eslint-plugin/src/rules/proxy-no-phantom-dependencies.ts
export const proxyNoPhantomDependencies = {
    meta: {
        messages: {
            phantomDependency: 'Proxy calls {{proxyName}}.bootstrap() but {{implementationFile}} does not import {{implementationName}}. Remove the phantom bootstrap call or add the import to the implementation.',
            missingImplementationImport: 'Proxy imports {{implementationName}} but {{implementationFile}} does not. Proxies must only bootstrap dependencies that the implementation actually uses.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                // Find corresponding implementation file
                const implementationFile = filename.replace('.proxy.ts', '.ts');
                if (!fs.existsSync(implementationFile)) {
                    return;  // No implementation file found
                }

                // Read implementation file and parse imports
                const implementationSource = fs.readFileSync(implementationFile, 'utf-8');
                const implementationImports = extractImports(implementationSource);

                // Track what proxy imports and bootstraps
                const proxyImports = [];
                const bootstrapCalls = [];

                // Collect proxy's implementation imports
                node.body.forEach(statement => {
                    if (statement.type === 'ImportDeclaration') {
                        const importPath = statement.source.value;

                        // Skip contract type imports
                        if (importPath.includes('-contract') && statement.importKind === 'type') {
                            return;
                        }

                        // Track implementation imports (adapters, brokers, widgets)
                        if (importPath.match(/\/(adapter|broker|widget|responder)s?\//)) {
                            if (!importPath.includes('.proxy')) {
                                proxyImports.push({
                                    path: importPath,
                                    name: statement.specifiers[0]?.local.name,
                                    node: statement
                                });
                            }
                        }
                    }
                });

                // Find bootstrap() method and collect .bootstrap() calls
                node.body.forEach(statement => {
                    if (statement.type === 'ExportNamedDeclaration' &&
                        statement.declaration?.type === 'VariableDeclaration') {

                        statement.declaration.declarations.forEach(declarator => {
                            if (declarator.init?.type === 'ArrowFunctionExpression' ||
                                declarator.init?.type === 'FunctionExpression') {

                                // Look for bootstrap method in returned object
                                const returnStatement = declarator.init.body.properties?.find(
                                    prop => prop.key?.name === 'bootstrap'
                                );

                                if (returnStatement) {
                                    // Scan bootstrap method for .bootstrap() calls
                                    const bootstrapBody = returnStatement.value.body;

                                    traverseNode(bootstrapBody, (node) => {
                                        if (node.type === 'CallExpression' &&
                                            node.callee.type === 'MemberExpression' &&
                                            node.callee.property.name === 'bootstrap') {

                                            const proxyVarName = node.callee.object.name;
                                            bootstrapCalls.push({
                                                proxyVarName,
                                                node
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });

                // Verify: For each implementation import in proxy, check if implementation file imports it
                proxyImports.forEach(({path: proxyImportPath, name: proxyImportName, node: importNode}) => {
                    // Derive what the implementation would import
                    const expectedImplPath = proxyImportPath;

                    // Check if implementation file imports this
                    const implementationHasImport = implementationImports.some(
                        implImport => implImport.path === expectedImplPath ||
                            implImport.path.includes(proxyImportPath)
                    );

                    if (!implementationHasImport) {
                        context.report({
                            node: importNode,
                            messageId: 'missingImplementationImport',
                            data: {
                                implementationName: proxyImportName,
                                implementationFile: implementationFile.split('/').pop()
                            }
                        });
                    }
                });

                // Verify: For each bootstrap call, ensure implementation uses that dependency
                bootstrapCalls.forEach(({proxyVarName, node: callNode}) => {
                    // Derive implementation name from proxy variable
                    // e.g., brokerAProxy -> brokerA
                    const implName = proxyVarName.replace(/Proxy$/, '');

                    // Find the import for this proxy
                    const proxyImport = proxyImports.find(imp =>
                        imp.name.toLowerCase() === implName.toLowerCase()
                    );

                    if (!proxyImport) {
                        return;  // No corresponding import found (will be caught by Rule 6)
                    }

                    // Check if implementation file imports this
                    const implementationHasImport = implementationImports.some(
                        implImport => implImport.name.toLowerCase() === implName.toLowerCase()
                    );

                    if (!implementationHasImport) {
                        context.report({
                            node: callNode,
                            messageId: 'phantomDependency',
                            data: {
                                proxyName: proxyVarName,
                                implementationName: implName,
                                implementationFile: implementationFile.split('/').pop()
                            }
                        });
                    }
                });
            }
        };
    }
};

function extractImports(source) {
    const imports = [];
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const namedImportRegex = /import\s+{([^}]+)}\s+from/;
    const defaultImportRegex = /import\s+(\w+)\s+from/;

    let match;
    while ((match = importRegex.exec(source)) !== null) {
        const importPath = match[1];
        const fullMatch = match[0];

        let importName = null;

        // Extract named import
        const namedMatch = namedImportRegex.exec(fullMatch);
        if (namedMatch) {
            importName = namedMatch[1].split(',')[0].trim();
        }

        // Extract default import
        const defaultMatch = defaultImportRegex.exec(fullMatch);
        if (defaultMatch) {
            importName = defaultMatch[1];
        }

        imports.push({
            path: importPath,
            name: importName
        });
    }

    return imports;
}

function traverseNode(node, callback) {
    if (!node || typeof node !== 'object') return;

    callback(node);
    Object.keys(node).forEach(key => {
        if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverseNode(child, callback));
            } else {
                traverseNode(node[key], callback);
            }
        }
    });
}
```

**Why This Rule Matters:**

Proxies must mirror the implementation's actual dependencies. If the proxy bootstraps dependencies the implementation
doesn't use, the bootstrap chain is incorrect.

```typescript
// widget-b.ts (implementation)
import {useState} from 'react';
import {brokerA} from '../../brokers/broker-a/broker-a';

export const WidgetB = () => {
    const data = useFetch(brokerA);
    return <div>{data} < /div>;
};

// ❌ BAD - Proxy bootstraps phantom dependency
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';
import {createBrokerBProxy} from '../../brokers/broker-b/broker-b.proxy';  // ❌ WidgetB doesn't use BrokerB!

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();
    const brokerBProxy = createBrokerBProxy();  // ❌ Phantom dependency

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();
            brokerBProxy.bootstrap();  // ❌ ERROR: widget-b.ts doesn't import brokerB
        }
    };
};

// ✅ GOOD - Proxy only bootstraps what implementation uses
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();

    return {
        bootstrap: () => {
            brokerAProxy.bootstrap();  // ✅ widget-b.ts imports brokerA
        }
    };
};
```

**Key insight:** This ensures the bootstrap chain perfectly mirrors the actual dependency graph. No phantom
dependencies, no missing dependencies.

**Rule 8: No jest.mock() on Adapters (Use Proxy Instead)**

```typescript
// packages/eslint-plugin/src/rules/test-no-adapter-mocking.ts
export const testNoAdapterMocking = {
    meta: {
        messages: {
            useProxy: 'Do not mock adapters with jest.mock(). Import and use the proxy instead: {{proxyImport}}'
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                const filename = context.getFilename();

                // Only check test files
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Check if this is jest.mock() call
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'jest' &&
                    node.callee.property.name === 'mock'
                ) {
                    const mockPath = node.arguments[0]?.value;

                    // Check if mocking an adapter
                    if (mockPath && mockPath.includes('-adapter')) {
                        // Only allow if this IS the adapter's own test file
                        const adapterTestFile = mockPath.replace(/.*\/([^/]+)-adapter$/, '$1-adapter.test.ts');

                        if (!filename.endsWith(adapterTestFile)) {
                            const proxyImport = mockPath.replace('-adapter', '-adapter.proxy');
                            context.report({
                                node,
                                messageId: 'useProxy',
                                data: {
                                    proxyImport: `import { create...Proxy } from '${proxyImport}'`
                                }
                            });
                        }
                    }
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

Adapters should ONLY be mocked in their own test file. Everywhere else, use the proxy:

```typescript
// ❌ BAD - Manually mocking adapter in broker test
// broker.test.ts
jest.mock('../../adapters/fs/fs-read-file-adapter');
const mockFsAdapter = jest.mocked(fsReadFileAdapter);
mockFsAdapter.mockResolvedValue(FileContentsStub('data'));

// ✅ GOOD - Use proxy in broker test
// broker.test.ts
import {createFsReadFileProxy} from '../../adapters/fs/fs-read-file-adapter.proxy';

const fsProxy = createFsReadFileProxy();
fsProxy.returns(FilePathStub('/path'), FileContentsStub('data'));
```

**Exceptions (allowed):**

```typescript
// ✅ ALLOWED - Adapter's own test file
// fs-read-file-adapter.test.ts
jest.mock('fs/promises');  // Mocking npm package, not adapter
// Transformer auto-mocks the adapter for proxy usage
```

**Key insight:** Proxies provide:

- Consistent API across all tests
- Abstraction over mock vs real implementation
- Automatic cleanup
- Better error messages
- LLM-friendly pattern

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
2. `-adapter.proxy.ts` - Proxy with `createAdapterProxy(npmModule, { useMock: true/false })`
3. `-adapter.test.ts` - Tests using proxy

**Decision: `useMock: true` or `false`?**

- **true**: HTTP, external APIs → Jest mocks (fast)
- **false**: fs, ESLint, DB → Real in controlled env (validates real behavior)

### Quick Reference

```typescript
// 1. Implementation
export const myAdapter = async ({input}: { input: Input }): Promise<Output> => {
    return npmPackage.method(input);
};

// 2. Proxy (per-adapter decision!)
// ✅ Only import types from contracts
import type {Input} from '../../contracts/input/input-contract';

export const createMyAdapterProxy = () => {
    return createAdapterProxy(npmPackage, {useMock: true})((mock) => {
        // Auto-cleanup if needed
        afterAll(async () => {
            await cleanup();
        });

        return {
            // Helpers accept branded types only
            returns: (input: Input): void => {
                mock.method.mockResolvedValue(input);
            }
        };
    });
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

        proxy.returns(input);              // Pass branded type

        const result = await myAdapter({input});
        expect(result).toStrictEqual(expected);
    });
});
```

### Architecture Wins

**✅ Solved:**

1. **No Jest confusion** - LLMs use simple proxy API instead of fighting Jest internals
2. **No manual `jest.mock()`** - Proxy handles mocking internally
3. **No manual `jest.mocked()`** - Proxy handles it
4. **No mode switching** - Per-adapter decision (useMock: true/false) internal to proxy
5. **No manual cleanup** - Proxy registers afterAll() automatically
6. **No raw values** - Lint enforces stubs only (type-safe branded values)
7. **No type assertions** - Lint forbids `as Type` in tests
8. **No contract imports** - Lint enforces type-only imports from contracts
9. **No "mock" in names** - Lint forbids `mockSuccess()`, requires `returns()` (abstracts implementation)
10. **No jest.mock() on adapters in tests** - Lint forbids mocking adapters, enforces proxy usage instead
11. **No assertions in proxy** - Proxies return data (getters), tests do `expect()` - keeps proxies clean
12. **One API everywhere** - Same proxy helpers whether testing adapter or code using adapter

**🎯 Key Wins:**

- **LLM-friendly**: Clear 3-file pattern (adapter + proxy + test)
- **Type-safe**: Branded types enforced via stubs + lint rules
- **Resilient**: npm changes isolated to ONE test file per adapter
- **Simple**: One decision per adapter (useMock: true/false), then forget
- **Clean**: Zero Jest boilerplate in tests
- **Abstraction**: Proxy helpers hide implementation (real vs mock)
- **Zero setup**: Adapters work automatically, just use assertion helpers
- **Separation of concerns**: Proxies return data, tests do assertions
- **Enforced**: 8 lint rules ensure patterns are followed (no escape hatches!)
