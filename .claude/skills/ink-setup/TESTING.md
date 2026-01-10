# Testing Patterns

## Local ink-test-render Utility

Instead of `ink-testing-library` (which is ESM-only in v4+), use a local CJS-compatible render utility.

### ink-test-render.ts

```typescript
// src/adapters/ink-testing-library/render/ink-test-render.ts
/**
 * PURPOSE: CJS-compatible ink testing render utility (replaces ink-testing-library)
 *
 * USAGE:
 * const { lastFrame, stdin } = inkTestRender(<MyComponent />);
 * expect(lastFrame()).toMatch(/expected/);
 */
import {EventEmitter} from 'node:events';
import type {ReactElement} from 'react';

import {render as inkRender} from 'ink';

class MockStdout extends EventEmitter {
    frames: string[] = [];
    private _lastFrame: string | undefined;

    get columns(): number {
        return 100;
    }

    write = (frame: string): void => {
        this.frames.push(frame);
        this._lastFrame = frame;
    };

    lastFrame = (): string | undefined => this._lastFrame;
}

class MockStderr extends EventEmitter {
    frames: string[] = [];
    private _lastFrame: string | undefined;

    write = (frame: string): void => {
        this.frames.push(frame);
        this._lastFrame = frame;
    };

    lastFrame = (): string | undefined => this._lastFrame;
}

class MockStdin extends EventEmitter {
    isTTY = true;
    private data: string | null = null;

    write = (data: string): void => {
        this.data = data;
        this.emit('readable');
        this.emit('data', data);
    };

    setEncoding(): void { /* No-op */
    }

    setRawMode(): void { /* No-op */
    }

    resume(): void { /* No-op */
    }

    pause(): void { /* No-op */
    }

    ref(): void { /* No-op */
    }

    unref(): void { /* No-op */
    }

    read = (): string | null => {
        const {data} = this;
        this.data = null;
        return data;
    };
}

type InkInstance = ReturnType<typeof inkRender>;

const instances: InkInstance[] = [];

export type InkTestRenderResult = {
    rerender: InkInstance['rerender'];
    unmount: InkInstance['unmount'];
    cleanup: InkInstance['cleanup'];
    stdout: MockStdout;
    stderr: MockStderr;
    stdin: MockStdin;
    frames: string[];
    lastFrame: () => string | undefined;
};

export const inkTestRender = (tree: ReactElement): InkTestRenderResult => {
    const stdout = new MockStdout();
    const stderr = new MockStderr();
    const stdin = new MockStdin();

    const instance = inkRender(tree, {
        stdout: stdout as unknown as NodeJS.WriteStream,
        stderr: stderr as unknown as NodeJS.WriteStream,
        stdin: stdin as unknown as NodeJS.ReadStream,
        debug: true,
        exitOnCtrlC: false,
        patchConsole: false,
    });

    instances.push(instance);

    return {
        rerender: instance.rerender,
        unmount: instance.unmount,
        cleanup: instance.cleanup,
        stdout,
        stderr,
        stdin,
        frames: stdout.frames,
        lastFrame: stdout.lastFrame,
    };
};

export const inkTestCleanup = (): void => {
    for (const instance of instances) {
        instance.unmount();
        instance.cleanup();
    }
    instances.length = 0;
};
```

## Widget Tests

Widget tests use the local `inkTestRender` utility with manual cleanup.

```typescript
// src/widgets/my-app/my-app-widget.test.tsx
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import React from 'react';

import {inkTestRender as render} from '../../adapters/ink-testing-library/render/ink-test-render';

import {MyAppWidget} from './my-app-widget';

describe('MyAppWidget', () => {
    let unmountFn: (() => void) | null = null;

    afterEach(() => {
        if (unmountFn) {
            unmountFn();
            unmountFn = null;
        }
    });

    describe('screen routing', () => {
        it('VALID: {initialScreen: menu} => renders menu screen', () => {
            const {lastFrame, unmount} = render(
                <MyAppWidget initialScreen = "menu"
            onExit = {jest.fn()}
            />,
        )
            ;
            unmountFn = unmount;

            expect(lastFrame()).toMatch(/Menu/u);
        });

        it('VALID: {initialScreen: help} => renders help screen', () => {
            const {lastFrame, unmount} = render(
                <MyAppWidget initialScreen = "help"
            onExit = {jest.fn()}
            />,
        )
            ;
            unmountFn = unmount;

            expect(lastFrame()).toMatch(/Help/u);
        });
    });

    describe('widget structure', () => {
        it('VALID: {onExit callback} => accepts callback', () => {
            const onExit = jest.fn();

            const {unmount} = render(
                <MyAppWidget initialScreen = "menu"
            onExit = {onExit}
            />,
        )
            ;
            unmountFn = unmount;

            expect(onExit).toBeDefined();
        });
    });
});
```

### Test Pattern Rules

1. **Import render as alias**: `import { inkTestRender as render }`
2. **Manual cleanup**: Track `unmountFn` in `afterEach` hook
3. **JSX syntax**: Test files are `.test.tsx` and use JSX directly
4. **Regex assertions**: Use `toMatch(/pattern/u)` for frame content
5. **jest.fn() for callbacks**: Use `jest.fn()` from `@jest/globals`

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

// Real ink components are used for testing via ink-test-render
// No mocking needed - this proxy exists for API compatibility
export const inkBoxAdapterProxy = (): Record<PropertyKey, never> => ({});
```

This differs from other adapters where we mock the npm package. For ink:

- Real ink components render correctly in tests via `ink-test-render`
- No mocking is needed because ink v3.2.0 works with Jest's CJS mode
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
            const result = inkTestingLibraryRenderAdapter({element});

            expect(result.lastFrame()).toMatch(/Hello/u);
        });

        it('VALID: {element: Ink element} => returns render result with stdin', () => {
            inkTestingLibraryRenderAdapterProxy();

            const element = React.createElement(Text, null, 'Hello');
            const result = inkTestingLibraryRenderAdapter({element});

            expect(result.stdin).toBeDefined();
            expect(typeof result.stdin.write).toBe('function');
        });
    });
});
```

## Key Testing Rules

1. **Widget tests**: Use local `inkTestRender`, manual unmount cleanup
2. **No proxy mocking for ink**: Real ink components work in tests
3. **TTY limitation**: Ink requires TTY for input - e2e tests expect raw mode error
4. **JSX in tests**: Use `.test.tsx` extension for widget tests
