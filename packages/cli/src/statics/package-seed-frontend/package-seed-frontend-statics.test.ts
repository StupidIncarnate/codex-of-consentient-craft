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
        dependencies: {
          '__SCOPE__/node': '*',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.2.3',
        },
        devDependencies: {
          'jest-environment-jsdom': '^30.0.0',
        },
        bin: {},
        compilerOptions: { jsx: 'react-jsx', lib: ['ES2022', 'DOM', 'DOM.Iterable'] },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: null,
        jestKind: 'tsx-jsdom',
        e2eEligible: true,
        exportsDot: false,
        needsMswTransform: false,
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
        dependencies: {
          '__SCOPE__/node': '*',
          ink: '^5.0.0',
          react: '^19.0.0',
          '@types/react': '^19.0.0',
        },
        devDependencies: {},
        bin: {},
        compilerOptions: { jsx: 'react-jsx' },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: null,
        jestKind: 'tsx-node',
        e2eEligible: true,
        exportsDot: false,
        needsMswTransform: false,
      });
    });

    it('VALID: {type: frontend-ink} => seeds exactly the panel widget trio', () => {
      expect(files.map((file) => file.path)).toStrictEqual([
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.proxy.tsx',
        'src/widgets/__NAME__-panel/__NAME__-panel-widget.test.tsx',
      ]);
    });

    it('VALID: {type: frontend-ink} => no seeded file lives under an adapters folder', () => {
      const adapterPaths = files
        .map((file) => file.path)
        .filter((path) => path.includes('adapters/'));

      expect(adapterPaths).toStrictEqual([]);
    });

    it('VALID: {type: frontend-ink} => no seeded file imports ink', () => {
      const importingPaths = files
        .filter((file) => file.contents.includes("from 'ink'"))
        .map((file) => file.path);

      expect(importingPaths).toStrictEqual([]);
    });
  });
});
