# Testing Patterns

## ink-testing-library Adapter

Widget tests use `ink-testing-library` through an adapter:

```typescript
// src/adapters/ink-testing-library/render/ink-testing-library-render-adapter.ts
/**
 * PURPOSE: Wraps ink-testing-library render function for testing CLI widgets
 *
 * USAGE:
 * const { lastFrame, stdin } = inkTestingLibraryRenderAdapter({ element: <MyWidget /> });
 * stdin.write('q');
 * expect(lastFrame()).toMatch(/expected text/u);
 */
import type {ReactElement} from 'react';
import {render} from 'ink-testing-library';

export type InkRenderResult = ReturnType<typeof render>;

export const inkTestingLibraryRenderAdapter = ({
                                                   element,
                                               }: {
    element: ReactElement;
}): InkRenderResult => render(element);
```

## Widget Tests

Widget tests use the adapter with inline cleanup (no `afterEach` hooks):

```typescript
// src/widgets/my-app/my-app-widget.test.tsx
import React from 'react';

import {
    inkTestingLibraryRenderAdapter
} from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import {MyAppWidget} from './my-app-widget';
import {MyAppWidgetProxy} from './my-app-widget.proxy';

describe('MyAppWidget', () => {
    describe('screen routing', () => {
        it('VALID: {initialScreen: menu} => renders menu screen', () => {
            MyAppWidgetProxy();

            const {lastFrame, unmount} = inkTestingLibraryRenderAdapter({
                element: <MyAppWidget initialScreen = "menu" onExit = {()
        =>
            {
            }
        }
            />,
        })
            ;

            expect(lastFrame()).toMatch(/Menu/u);

            unmount(); // Inline cleanup
        });

        it('VALID: {initialScreen: help} => renders help screen', () => {
            MyAppWidgetProxy();

            const {lastFrame, unmount} = inkTestingLibraryRenderAdapter({
                element: <MyAppWidget initialScreen = "help" onExit = {()
        =>
            {
            }
        }
            />,
        })
            ;

            expect(lastFrame()).toMatch(/Help/u);

            unmount(); // Inline cleanup
        });
    });
});
```

### Test Pattern Rules

1. **Import adapter**:
   `import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter'`
2. **Call proxy first**: `MyAppWidgetProxy();` before rendering
3. **Wrap element**: `inkTestingLibraryRenderAdapter({ element: <Component /> })`
4. **Inline cleanup**: Call `unmount()` at end of each test (NO `afterEach` hooks)
5. **JSX syntax**: Test files are `.test.tsx` and use JSX directly
6. **Regex assertions**: Use `toMatch(/pattern/u)` for frame content
7. **No `@jest/globals`**: Jest globals work automatically in CommonJS mode

## Ink Adapter Proxies

Ink component proxies are **no-ops** since real ink is used for testing:

```typescript
// src/adapters/ink/box/ink-box-adapter.proxy.ts
/**
 * PURPOSE: Proxy for ink Box adapter - no-op since real ink is used
 *
 * USAGE:
 * inkBoxAdapterProxy(); // Sets up nothing - real Box component is used
 */

// Real ink components are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
export const inkBoxAdapterProxy = (): Record<PropertyKey, never> => ({});
```

This differs from other adapters where we mock the npm package. For ink:

- Real ink components render correctly in tests via `ink-testing-library`
- No mocking is needed because ink v3.2.0 works with Jest's CommonJS mode
- Proxies exist only for pattern consistency

## Adapter Tests

Adapter tests verify the ink wrappers work correctly:

```typescript
// src/adapters/ink-testing-library/render/ink-testing-library-render-adapter.test.ts
import {Text} from 'ink';
import React from 'react';

import {inkTestingLibraryRenderAdapter} from './ink-testing-library-render-adapter';
import {inkTestingLibraryRenderAdapterProxy} from './ink-testing-library-render-adapter.proxy';

describe('inkTestingLibraryRenderAdapter', () => {
    describe('rendering', () => {
        it('VALID: {element: Ink element} => returns render result with lastFrame', () => {
            inkTestingLibraryRenderAdapterProxy();

            const element = React.createElement(Text, null, 'Hello');
            const {lastFrame, unmount} = inkTestingLibraryRenderAdapter({element});

            expect(lastFrame()).toMatch(/Hello/u);

            unmount();
        });

        it('VALID: {element: Ink element} => returns render result with stdin', () => {
            inkTestingLibraryRenderAdapterProxy();

            const element = React.createElement(Text, null, 'Hello');
            const {stdin, unmount} = inkTestingLibraryRenderAdapter({element});

            expect(stdin).toBeDefined();
            expect(typeof stdin.write).toBe('function');

            unmount();
        });
    });
});
```

## Key Testing Rules

1. **Widget tests**: Use `inkTestingLibraryRenderAdapter`, inline `unmount()` cleanup
2. **No `afterEach` hooks**: All cleanup must be inline per codebase standards
3. **No proxy mocking for ink**: Real ink components work in tests
4. **JSX in tests**: Use `.test.tsx` extension for widget tests
5. **Call proxy before render**: Initialize proxy before calling adapter
6. **No `@jest/globals` import**: Jest globals are automatic in CommonJS mode
