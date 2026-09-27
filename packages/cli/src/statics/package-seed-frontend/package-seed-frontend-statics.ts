/**
 * PURPOSE: The two seeds `dungeonmaster create-package` writes for the types whose entry point
 * renders a component — `frontend-react` and `frontend-ink`. Reach for `packageSeedPlainStatics` /
 * `packageSeedServiceStatics` for every other package type; this file owns only the pair whose
 * detector and seed both center on `src/widgets/`.
 *
 * USAGE:
 * packageSeedFrontendStatics['frontend-react'].files;
 * // Returns the ordered list of {path, contents} entries create-package writes for that type
 */

export const packageSeedFrontendStatics = {
  'frontend-react': {
    barrel: {
      fileName: 'widgets.ts',
      exportPaths: ['./src/widgets/__NAME__-panel/__NAME__-panel-widget'],
    },
    // `@types/react` and `@types/react-dom` are runtime-shaped devDependencies but declared here in
    // `dependencies` anyway: without them a scaffolded package neither typechecks (no
    // `React.JSX.Element` global) nor builds (`tsc` reports the same gap in `dist`).
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.2.3',
    },
    // `jest-environment-jsdom` and `undici` back the __mocks__/jsdom-polyfills.cjs file below —
    // declared here rather than left to npm-workspace hoisting from the copied @gateway/browser
    // package, which happens to carry the same pair today but is not this package's own guarantee.
    devDependencies: {
      'jest-environment-jsdom': '^30.0.0',
      undici: '^7.21.0',
    },
    bin: {},
    compilerOptions: {
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    },
    extraInclude: ['playwright.config.ts'],
    buildRootDir: null,
    jestKind: 'tsx-jsdom',
    e2eEligible: true,
    exportsDot: false,
    needsMswTransform: false,
    files: [
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        contents: `/**
 * PURPOSE: Starting point for this package's public widget surface, wired into the root widgets.ts
 * barrel so a fresh frontend-react package already renders something real. Replace the markup with
 * the package's actual UI once one exists.
 *
 * USAGE:
 * <__PASCAL__PanelWidget />
 * // Renders <div data-testid="__TESTID___PANEL">__NAME__</div>
 */

export const __PASCAL__PanelWidget = (): React.JSX.Element => (
  <div data-testid="__TESTID___PANEL">__NAME__</div>
);
`,
      },
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.proxy.tsx',
        contents: `export const __PASCAL__PanelWidgetProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.test.tsx',
        contents: `import { __PASCAL__PanelWidget } from './__NAME__-panel-widget';
import { __PASCAL__PanelWidgetProxy } from './__NAME__-panel-widget.proxy';

describe('__PASCAL__PanelWidget', () => {
  it('VALID: {} => builds a div element carrying the panel testid and the package name', () => {
    __PASCAL__PanelWidgetProxy();

    const element = __PASCAL__PanelWidget();

    expect({ type: element.type, props: element.props }).toStrictEqual({
      type: 'div',
      props: { 'data-testid': '__TESTID___PANEL', children: '__NAME__' },
    });
  });
});
`,
      },
      {
        // jest-environment-jsdom provides no Request/Response/fetch globals at all (they are
        // Node-only globals jest-environment-jsdom does not forward into the jsdom sandbox), so
        // @dungeonmaster/testing's unconditional MSW setup (setupFilesAfterEnv, every package)
        // throws "ReferenceError: Request is not defined" the moment ANY test file in a
        // scaffolded frontend-react package runs — confirmed directly against a real
        // packed-and-installed consumer (item G27). This mirrors packages/@gateway/browser's own
        // __mocks__/jsdom-polyfills.cjs in this repo.
        path: '__mocks__/jsdom-polyfills.cjs',
        contents: `// jsdom does not implement ResizeObserver — the pass-through module still needs a real
// function to export.
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// jest-environment-jsdom does not put Node's setImmediate/clearImmediate on globalThis.
// @dungeonmaster/testing's open-handle leak tracker (jest.setup.js) reads
// \`globalThis.setImmediate.__promisify__\` while wiring its own watcher, and an undefined
// setImmediate throws before a single test in this package runs.
const { setImmediate, clearImmediate } = require('node:timers');
if (typeof global.setImmediate === 'undefined') global.setImmediate = setImmediate;
if (typeof global.clearImmediate === 'undefined') global.clearImmediate = clearImmediate;

// undici references TextEncoder/TextDecoder/ReadableStream at module load, none of which
// jest-environment-jsdom provides.
const { TextEncoder, TextDecoder } = require('node:util');
const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
const { MessageChannel, MessagePort, BroadcastChannel } = require('node:worker_threads');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
if (typeof global.ReadableStream === 'undefined') global.ReadableStream = ReadableStream;
if (typeof global.WritableStream === 'undefined') global.WritableStream = WritableStream;
if (typeof global.TransformStream === 'undefined') global.TransformStream = TransformStream;
if (typeof global.MessageChannel === 'undefined') global.MessageChannel = MessageChannel;
if (typeof global.MessagePort === 'undefined') global.MessagePort = MessagePort;
if (typeof global.BroadcastChannel === 'undefined') global.BroadcastChannel = BroadcastChannel;

// jest-environment-jsdom defines no \`fetch\` at all (not even as an undefined property), and
// MSW's module-scope setup references Request/Response/Headers/fetch directly.
const undici = require('undici');
if (typeof global.Response === 'undefined') global.Response = undici.Response;
if (typeof global.Request === 'undefined') global.Request = undici.Request;
if (typeof global.Headers === 'undefined') global.Headers = undici.Headers;
if (typeof global.fetch === 'undefined') global.fetch = undici.fetch;
`,
      },
    ],
  },
  'frontend-ink': {
    barrel: {
      fileName: 'widgets.ts',
      exportPaths: ['./src/widgets/__NAME__-panel/__NAME__-panel-widget'],
    },
    dependencies: {
      ink: '^5.0.0',
      react: '^19.0.0',
    },
    devDependencies: {},
    bin: {},
    compilerOptions: {
      jsx: 'react-jsx',
    },
    extraInclude: ['playwright.config.ts'],
    buildRootDir: null,
    jestKind: 'tsx-node',
    e2eEligible: true,
    exportsDot: false,
    needsMswTransform: false,
    files: [
      {
        path: 'src/adapters/ink/render/ink-render-adapter.ts',
        contents: `/**
 * PURPOSE: Starting point wrapping ink's render behind this package's own adapter boundary, so
 * callers unmount through a semantic handle instead of reaching into ink's Instance directly.
 * Replace with the package's real ink usage once one exists.
 *
 * USAGE:
 * const { unmount } = inkRenderAdapter({ node: <SomePanelWidget /> });
 * unmount();
 */

import { render } from 'ink';

export const inkRenderAdapter = ({
  node,
}: {
  node: React.ReactElement;
}): { unmount: () => void } => {
  const instance = render(node);
  return {
    unmount: (): void => {
      instance.unmount();
    },
  };
};
`,
      },
      {
        path: 'src/adapters/ink/render/ink-render-adapter.proxy.ts',
        contents: `export const inkRenderAdapterProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/adapters/ink/render/ink-render-adapter.test.ts',
        contents: `import { createElement } from 'react';
import { Text } from 'ink';

import { inkRenderAdapter } from './ink-render-adapter';
import { inkRenderAdapterProxy } from './ink-render-adapter.proxy';

describe('inkRenderAdapter', () => {
  it('VALID: {node} => returns an object exposing an unmount function', () => {
    inkRenderAdapterProxy();

    const result = inkRenderAdapter({ node: createElement(Text, {}, '__NAME__') });

    expect(result).toStrictEqual({ unmount: expect.any(Function) });
  });
});
`,
      },
      {
        path: 'src/adapters/ink/text/ink-text-adapter.ts',
        contents: `/**
 * PURPOSE: Provides ink's Text component behind this package's own adapter boundary. widgets/ may
 * import react directly but not ink, so every ink primitive a widget renders needs its own adapter
 * wrapper here, one per component, following the same shape as inkRenderAdapter.
 *
 * USAGE:
 * const Text = inkTextAdapter();
 * <Text>Hello</Text>
 */

import { Text } from 'ink';

export const inkTextAdapter = (): typeof Text => Text;
`,
      },
      {
        path: 'src/adapters/ink/text/ink-text-adapter.proxy.ts',
        contents: `export const inkTextAdapterProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/adapters/ink/text/ink-text-adapter.test.ts',
        contents: `import { Text } from 'ink';

import { inkTextAdapter } from './ink-text-adapter';
import { inkTextAdapterProxy } from './ink-text-adapter.proxy';

describe('inkTextAdapter', () => {
  it('VALID: {} => returns the ink Text component', () => {
    inkTextAdapterProxy();

    expect(inkTextAdapter()).toBe(Text);
  });
});
`,
      },
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        contents: `/**
 * PURPOSE: Starting point for this package's ink UI, wired into the root widgets.ts barrel so a
 * fresh frontend-ink package already renders something real in a terminal. Replace with the
 * package's real ink screen once one exists.
 *
 * USAGE:
 * <__PASCAL__PanelWidget />
 * // Renders an ink Text node
 */

import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';

export const __PASCAL__PanelWidget = (): React.JSX.Element => {
  const Text = inkTextAdapter();
  return <Text>__NAME__</Text>;
};
`,
      },
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.proxy.tsx',
        contents: `import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';

export const __PASCAL__PanelWidgetProxy = (): Record<PropertyKey, never> => {
  inkTextAdapterProxy();
  return {};
};
`,
      },
      {
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.test.tsx',
        contents: `import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';

import { __PASCAL__PanelWidget } from './__NAME__-panel-widget';
import { __PASCAL__PanelWidgetProxy } from './__NAME__-panel-widget.proxy';

describe('__PASCAL__PanelWidget', () => {
  it('VALID: {} => builds an ink Text element wrapping the package name', () => {
    __PASCAL__PanelWidgetProxy();

    const element = __PASCAL__PanelWidget();

    expect({ type: element.type, props: element.props }).toStrictEqual({
      type: inkTextAdapter(),
      props: { children: '__NAME__' },
    });
  });
});
`,
      },
    ],
  },
} as const;
