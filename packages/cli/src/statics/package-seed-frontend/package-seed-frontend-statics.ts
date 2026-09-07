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
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
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
    bin: {},
    compilerOptions: {
      jsx: 'react-jsx',
    },
    extraInclude: ['playwright.config.ts'],
    buildRootDir: null,
    jestKind: 'tsx-node',
    e2eEligible: true,
    exportsDot: false,
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
