import { packageSeedFrontendStatics } from './package-seed-frontend-statics';

describe('packageSeedFrontendStatics', () => {
  describe('frontend-react', () => {
    const { files, ...rest } = packageSeedFrontendStatics['frontend-react'];

    it('VALID: {type: frontend-react} => carries the exact non-file scaffold fields', () => {
      expect(rest).toStrictEqual({
        barrel: {
          fileName: 'widgets.ts',
          exportPaths: ['./src/widgets/__NAME__-panel/__NAME__-panel-widget'],
        },
        dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
        bin: {},
        compilerOptions: { jsx: 'react-jsx', lib: ['ES2022', 'DOM', 'DOM.Iterable'] },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: null,
        jestKind: 'tsx-jsdom',
        e2eEligible: true,
        exportsDot: false,
      });
    });

    it('VALID: {type: frontend-react} => seeds exactly the panel widget trio', () => {
      expect(files.map((file) => file.path)).toStrictEqual([
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.proxy.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.test.tsx',
      ]);
    });

    it('VALID: {type: frontend-react} => the first seeded file is under src/widgets/, which the detector keys on alongside dependencies.react', () => {
      expect(files[0].path).toBe('src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx');
    });
  });

  describe('frontend-ink', () => {
    const { files, ...rest } = packageSeedFrontendStatics['frontend-ink'];

    it('VALID: {type: frontend-ink} => carries the exact non-file scaffold fields', () => {
      expect(rest).toStrictEqual({
        barrel: {
          fileName: 'widgets.ts',
          exportPaths: ['./src/widgets/__NAME__-panel/__NAME__-panel-widget'],
        },
        dependencies: { ink: '^5.0.0', react: '^19.0.0' },
        bin: {},
        compilerOptions: { jsx: 'react-jsx' },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: null,
        jestKind: 'tsx-node',
        e2eEligible: true,
        exportsDot: false,
      });
    });

    it('VALID: {type: frontend-ink} => seeds exactly the ink render adapter trio, the ink text adapter trio, then the panel widget trio', () => {
      expect(files.map((file) => file.path)).toStrictEqual([
        'src/adapters/ink/render/ink-render-adapter.ts',
        'src/adapters/ink/render/ink-render-adapter.proxy.ts',
        'src/adapters/ink/render/ink-render-adapter.test.ts',
        'src/adapters/ink/text/ink-text-adapter.ts',
        'src/adapters/ink/text/ink-text-adapter.proxy.ts',
        'src/adapters/ink/text/ink-text-adapter.test.ts',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.proxy.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.test.tsx',
      ]);
    });

    it('VALID: {type: frontend-ink} => the first seeded file is under src/adapters/ink/, which the detector keys on ahead of react', () => {
      expect(files[0].path).toBe('src/adapters/ink/render/ink-render-adapter.ts');
    });
  });
});
