import { packageSeedContract } from './package-seed-contract';
import { PackageSeedStub } from './package-seed.stub';

describe('packageSeedContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full seed} => parses successfully', () => {
      const result = packageSeedContract.parse({
        barrel: {
          fileName: 'widgets.ts',
          exportPaths: ['./src/widgets/foo-panel/foo-panel-widget'],
        },
        dependencies: { react: '^18.3.1' },
        bin: { foo: './dist/bin/foo-entry.js' },
        compilerOptions: { jsx: 'react-jsx' },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: './src',
        jestKind: 'tsx-jsdom',
        e2eEligible: true,
        exportsDot: true,
        files: [
          {
            path: 'src/widgets/foo-panel/foo-panel-widget.tsx',
            contents: 'export const FooPanelWidget = () => null;\n',
          },
        ],
      });

      expect(result).toStrictEqual({
        barrel: {
          fileName: 'widgets.ts',
          exportPaths: ['./src/widgets/foo-panel/foo-panel-widget'],
        },
        dependencies: { react: '^18.3.1' },
        bin: { foo: './dist/bin/foo-entry.js' },
        compilerOptions: { jsx: 'react-jsx' },
        extraInclude: ['playwright.config.ts'],
        buildRootDir: './src',
        jestKind: 'tsx-jsdom',
        e2eEligible: true,
        exportsDot: true,
        files: [
          {
            path: 'src/widgets/foo-panel/foo-panel-widget.tsx',
            contents: 'export const FooPanelWidget = () => null;\n',
          },
        ],
      });
    });

    it('EDGE: {barrel: null} => parses successfully with a null barrel', () => {
      const result = packageSeedContract.parse({
        barrel: null,
        dependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        files: [],
      });

      expect(result.barrel).toBe(null);
    });

    it('EDGE: {buildRootDir: null} => parses successfully with a null buildRootDir', () => {
      const result = packageSeedContract.parse({
        barrel: { fileName: 'statics.ts', exportPaths: ['./src/statics/foo/foo-statics'] },
        dependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        files: [
          {
            path: 'src/statics/foo/foo-statics.ts',
            contents: 'export const fooStatics = {} as const;\n',
          },
        ],
      });

      expect(result.buildRootDir).toBe(null);
    });

    it('EMPTY: {files: []} => parses successfully with no seed files', () => {
      const result = packageSeedContract.parse({
        barrel: null,
        dependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        files: [],
      });

      expect(result.files).toStrictEqual([]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {jestKind: "browser"} => throws validation error', () => {
      expect(() => {
        return packageSeedContract.parse({
          barrel: null,
          dependencies: {},
          bin: {},
          compilerOptions: {},
          extraInclude: [],
          buildRootDir: null,
          jestKind: 'browser',
          e2eEligible: false,
          exportsDot: false,
          files: [],
        } as never);
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing dependencies} => throws validation error', () => {
      expect(() => {
        return packageSeedContract.parse({
          barrel: null,
          bin: {},
          compilerOptions: {},
          extraInclude: [],
          buildRootDir: null,
          jestKind: 'node',
          e2eEligible: false,
          exportsDot: false,
          files: [],
        } as never);
      }).toThrow(/Required/u);
    });
  });

  describe('PackageSeedStub', () => {
    it('VALID: {} => returns default stub', () => {
      const result = PackageSeedStub();

      expect(result).toStrictEqual({
        barrel: { fileName: 'statics.ts', exportPaths: ['./src/statics/thing/thing-statics'] },
        dependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        files: [
          {
            path: 'src/statics/thing/thing-statics.ts',
            contents: 'export const thingStatics = {} as const;\n',
          },
        ],
      });
    });
  });
});
