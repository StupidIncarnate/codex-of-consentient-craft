# Ink Adapters

Widgets never import ink directly. Create adapters to wrap ink components and hooks.

## Box Adapter

```typescript
// src/adapters/ink/box/ink-box-adapter.ts
/**
 * PURPOSE: Provides Ink's Box component for use in widgets
 *
 * USAGE:
 * const Box = inkBoxAdapter();
 * <Box flexDirection="column">{children}</Box>
 */
import {Box} from 'ink';

export const inkBoxAdapter = (): typeof Box => Box;
```

## Text Adapter

```typescript
// src/adapters/ink/text/ink-text-adapter.ts
/**
 * PURPOSE: Provides Ink's Text component for use in widgets
 *
 * USAGE:
 * const Text = inkTextAdapter();
 * <Text bold>Hello World</Text>
 */
import {Text} from 'ink';

export const inkTextAdapter = (): typeof Text => Text;
```

## useInput Adapter

```typescript
// src/adapters/ink/use-input/ink-use-input-adapter.ts
/**
 * PURPOSE: Wraps ink's useInput hook for keyboard input handling in CLI widgets
 *
 * USAGE:
 * inkUseInputAdapter({handler: ({key}) => {
 *     if (key.upArrow) { // handle up arrow }
 * }});
 * // Registers keyboard handler in Ink React component
 */
import {useInput, type Key} from 'ink';

export type InkKey = Key;

export type InkInputHandler = ({input, key}: { input: string; key: InkKey }) => void;

export const inkUseInputAdapter = ({handler}: { handler: InkInputHandler }): void => {
    useInput((input: string, key: Key) => {
        handler({input, key});
    });
};
```

## React Module Adapter

Re-exports React for JSX namespace access in widgets:

```typescript
// src/adapters/react/module/react-module-adapter.ts
/**
 * PURPOSE: Re-exports React for use in widgets that need JSX support
 *
 * USAGE:
 * import { reactModuleAdapter } from '../../adapters/react/module/react-module-adapter';
 * const React = reactModuleAdapter();
 * // Use in component for JSX namespace: React.JSX.Element
 */
import React from 'react';

export const reactModuleAdapter = (): typeof React => React;
```

## React useState Adapter

```typescript
// src/adapters/react/use-state/react-use-state-adapter.ts
/**
 * PURPOSE: Wraps React's useState hook for mockability in tests
 *
 * USAGE:
 * const [value, setValue] = reactUseStateAdapter({initialValue: 'initial'});
 * // Returns tuple of [state, setState] just like React.useState
 */
import type React from 'react';
import {useState} from 'react';

export const reactUseStateAdapter = <T>({
                                            initialValue,
                                        }: {
    initialValue: T | (() => T);
}): [T, React.Dispatch<React.SetStateAction<T>>] => useState<T>(initialValue);
```

## Ink Testing Library Render Adapter

Wraps the local `ink-test-render` utility:

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

import {inkTestRender, type InkTestRenderResult} from './ink-test-render';

export type InkRenderResult = InkTestRenderResult;

export const inkTestingLibraryRenderAdapter = ({
                                                   element,
                                               }: {
    element: ReactElement;
}): InkRenderResult => inkTestRender(element);
```

## Adapter Proxies

Ink adapter proxies are **no-ops** because real ink components are used in tests:

```typescript
// src/adapters/ink/box/ink-box-adapter.proxy.ts
/**
 * PURPOSE: Proxy for ink Box adapter - no-op since real ink is used
 *
 * USAGE:
 * inkBoxAdapterProxy(); // Sets up nothing - real Box component is used
 */

// Real ink components are used for testing via ink-test-render
// No mocking needed - this proxy exists for API compatibility
export const inkBoxAdapterProxy = (): Record<PropertyKey, never> => ({});
```

## Why Adapters?

1. **Testability**: Can mock adapters in tests (though ink adapters use real components)
2. **Architecture compliance**: Widgets don't directly import npm packages
3. **Consistency**: Same pattern as other I/O adapters (fs, axios, etc.)
4. **Metadata**: Each adapter has PURPOSE/USAGE comments for discoverability
