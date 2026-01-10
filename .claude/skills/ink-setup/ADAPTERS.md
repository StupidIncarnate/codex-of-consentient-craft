# Ink Adapters

Widgets use adapters to wrap ink components and hooks. React is imported directly (whitelisted in folder-config).

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

## Ink Testing Library Render Adapter

Wraps `ink-testing-library`'s render function:

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

## React Imports

Widgets import React directly - it's whitelisted in `folder-config-statics.ts`:

```typescript
// In widgets - React is whitelisted, no adapter needed
import React, {useState} from 'react';

export const MyWidget = (): React.JSX.Element => {
    const [value, setValue] = useState('initial');
    // ...
};
```

**Note:** Previous versions used `reactUseStateAdapter` and `reactModuleAdapter`. These have been removed - widgets now
import React directly.

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

// Real ink components are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
export const inkBoxAdapterProxy = (): Record<PropertyKey, never> => ({});
```

## Why Adapters for Ink?

1. **Architecture compliance**: Widgets don't directly import npm packages (except whitelisted ones like React)
2. **Consistency**: Same pattern as other I/O adapters (fs, axios, etc.)
3. **Metadata**: Each adapter has PURPOSE/USAGE comments for discoverability
4. **Testability**: Pattern allows mocking if needed (though ink uses real components)

## Why React is Direct Import?

React is whitelisted in `folder-config-statics.ts` for the `widgets/` folder:

```typescript
widgets: {
    allowedImports: [
        'adapters/',
        'bindings/',
        // ...
        'react',  // Whitelisted - direct import allowed
    ],
}
```

This allows widgets to use `useState`, `useEffect`, etc. directly without adapter wrappers.
