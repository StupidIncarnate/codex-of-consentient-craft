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
    // `__SCOPE__/node` is the gateway package the scaffolded playwright.config.ts imports
    // (`#gateway/node/fs`, ...): `gateway-dependency-declared` requires the importing package.json
    // to list it.
    dependencies: {
      '__SCOPE__/node': '*',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.2.3',
    },
    // `jest-environment-jsdom` is what testEnvironment: 'jsdom' resolves — this package's own
    // guarantee, not left to npm-workspace hoisting. `undici` is not declared here: the jsdom
    // polyfill file this scaffold's jest config points at (`@dungeonmaster/testing/jsdom-polyfills`)
    // lives in, and requires `undici` from, `@dungeonmaster/testing`'s own dependencies.
    devDependencies: {
      'jest-environment-jsdom': '^30.0.0',
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
    ],
  },
  'frontend-ink': {
    barrel: {
      fileName: 'widgets.ts',
      exportPaths: ['./src/widgets/__NAME__-panel/__NAME__-panel-widget'],
    },
    // `ink` is declared, never imported: a consumer's `@gateway/npm` starts empty, so a seed that
    // imported it through `#gateway/npm/ink` would fail lint and typecheck until someone wrote that
    // wrapper. The detector reads the declared dependency beside the widgets folder.
    dependencies: {
      '__SCOPE__/node': '*',
      ink: '^5.0.0',
      react: '^19.0.0',
      '@types/react': '^19.0.0',
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
        path: 'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        contents: `/**
 * PURPOSE: Starting point for this package's ink UI, wired into the root widgets.ts barrel. It
 * returns a bare fragment because ink's \`Text\` is an npm value and a consumer's \`@gateway/npm\`
 * starts empty: write \`packages/@gateway/npm/src/ink/ink.ts\`, then wrap this content in
 * \`<Text>\` imported from \`#gateway/npm/ink\`. The package already declares \`ink\`.
 *
 * USAGE:
 * <__PASCAL__PanelWidget />
 * // Renders a fragment holding the package name
 */

export const __PASCAL__PanelWidget = (): React.JSX.Element => <>__NAME__</>;
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
  it('VALID: {} => builds a fragment whose only child is the package name', () => {
    __PASCAL__PanelWidgetProxy();

    const element = __PASCAL__PanelWidget();

    expect(element.props).toStrictEqual({ children: '__NAME__' });
  });
});
`,
      },
    ],
  },
} as const;
