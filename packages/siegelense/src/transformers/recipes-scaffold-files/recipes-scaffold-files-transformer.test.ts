import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import { locationsStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { recipesScaffoldFilesTransformer } from './recipes-scaffold-files-transformer';

const findContents = ({
  files,
  relativePath,
}: {
  files: ReturnType<typeof recipesScaffoldFilesTransformer>;
  relativePath: string;
}): ReturnType<typeof recipesScaffoldFilesTransformer>[0]['contents'] => {
  const found = files.find((file) => String(file.relativePath) === relativePath);
  if (found === undefined) {
    throw new Error(`recipesScaffoldFilesTransformer did not write ${relativePath}`);
  }
  return found.contents;
};

describe('recipesScaffoldFilesTransformer', () => {
  describe('the file list', () => {
    it('VALID: {packageName: "@acme/hydration-recipes"} => returns every path enforce-hydration-recipes-structure and the recipes convention both require', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const result = recipesScaffoldFilesTransformer({ packageName });

      expect(result.map((file) => file.relativePath).sort()).toStrictEqual(
        [
          'package.json',
          locationsStatics.repoRoot.tsconfig,
          'tsconfig.build.json',
          'jest.config.js',
          'src/responders/responders.ts',
          'src/index.ts',
          'src/index.integration.test.ts',
          'src/startup/start-hydration-recipes.ts',
          'src/startup/start-hydration-recipes.integration.test.ts',
          'src/flows/recipes/recipes-flow.ts',
          'src/flows/recipes/recipes-flow.integration.test.ts',
          'src/responders/recipes/listing/recipes-listing-responder.ts',
          'src/responders/recipes/listing/recipes-listing-responder.proxy.ts',
          'src/responders/recipes/listing/recipes-listing-responder.test.ts',
          'src/responders/recipes/seed/recipes-seed-responder.ts',
          'src/responders/recipes/seed/recipes-seed-responder.proxy.ts',
          'src/responders/recipes/seed/recipes-seed-responder.test.ts',
        ].sort(),
      );
    });
  });

  describe('package.json', () => {
    it('VALID: {packageName: "@acme/hydration-recipes"} => a buildable package.json naming that scope', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(findContents({ files, relativePath: 'package.json' }))).toStrictEqual({
        name: '@acme/hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });

    it('VALID: {packageName: "hydration-recipes", no scope} => an unscoped package.json with no imports field at all', () => {
      const packageName = PackageNameStub({ value: 'hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(JSON.parse(findContents({ files, relativePath: 'package.json' }))).toStrictEqual({
        name: 'hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });

    it('VALID: {packageName: "@acme/hydration-recipes", scope: "@acme"} => the package.json carries the four #gateway/* imports entries, scoped to match', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });
      const scope = '@acme';

      const files = recipesScaffoldFilesTransformer({ packageName, scope });

      expect(JSON.parse(findContents({ files, relativePath: 'package.json' }))).toStrictEqual({
        name: '@acme/hydration-recipes',
        version: '0.1.0',
        description: 'hydration-recipes package',
        private: true,
        imports: {
          '#gateway/npm/*': '@acme/npm/*',
          '#gateway/node/*': '@acme/node/*',
          '#gateway/browser/*': '@acme/browser/*',
          '#gateway/bin/*': '@acme/bin/*',
        },
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
          './package.json': './package.json',
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './responders': {
            source: './src/responders/responders.ts',
            types: './dist/responders/responders.d.ts',
            import: './dist/responders/responders.js',
            require: './dist/responders/responders.js',
          },
        },
        scripts: {
          build: 'tsc -p tsconfig.build.json',
          'build:clean': 'rm -rf dist .ward/build.tsbuildinfo && npm run build',
          test: 'dungeonmaster-ward --only test',
          typecheck: 'dungeonmaster-ward --only typecheck',
          lint: 'dungeonmaster-ward --only lint',
          ward: 'dungeonmaster-ward',
        },
        devDependencies: {
          '@types/node': '^20.11.0',
          typescript: '^5.3.3',
        },
      });
    });
  });

  describe('tsconfig.json', () => {
    it('VALID: {} => extends the repo root tsconfig and includes src/ alone, which holds the responders barrel', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(
        JSON.parse(findContents({ files, relativePath: locationsStatics.repoRoot.tsconfig })),
      ).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: {
          typeRoots: ['../../node_modules/@types', '../../@types'],
        },
        include: ['src/**/*'],
      });
    });
  });

  describe('tsconfig.build.json', () => {
    it('VALID: {} => compiles src/index.ts down to dist/index.js, and emits the responders barrel beside it', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(
        JSON.parse(findContents({ files, relativePath: 'tsconfig.build.json' })),
      ).toStrictEqual({
        extends: './tsconfig.json',
        compilerOptions: {
          noEmit: false,
          rootDir: './src',
          outDir: './dist',
          declaration: true,
          declarationMap: true,
          incremental: true,
          tsBuildInfoFile: './.ward/build.tsbuildinfo',
        },
        exclude: [
          '**/*.test.ts',
          '**/*.integration.test.ts',
          '**/*.proxy.ts',
          '**/*.stub.ts',
          '**/*.harness.ts',
          'src/.test-tmp/**',
          'src/_lint-testbed/**',
        ],
      });
    });
  });

  describe('jest.config.js', () => {
    it('VALID: {} => requires the published testing base', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(findContents({ files, relativePath: 'jest.config.js' })).toBe(
        `const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  roots: ['<rootDir>/src'],
};
`,
      );
    });
  });

  describe('src/responders/responders.ts', () => {
    it('VALID: {} => re-exports both responders', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(findContents({ files, relativePath: 'src/responders/responders.ts' })).toMatch(
        /^export \* from '\.\/recipes\/listing\/recipes-listing-responder';$/mu,
      );
      expect(findContents({ files, relativePath: 'src/responders/responders.ts' })).toMatch(
        /^export \* from '\.\/recipes\/seed\/recipes-seed-responder';$/mu,
      );
    });
  });

  describe('src/responders/recipes/listing/recipes-listing-responder.ts', () => {
    it(`VALID: {} => exports ${recipesConventionStatics.exports.listing}, returning an empty array`, () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(
        findContents({
          files,
          relativePath: 'src/responders/recipes/listing/recipes-listing-responder.ts',
        }),
      ).toMatch(
        new RegExp(
          `^export const ${recipesConventionStatics.exports.listing} = \\(\\): readonly never\\[\\] => \\[\\];$`,
          'mu',
        ),
      );
    });
  });

  describe('src/responders/recipes/seed/recipes-seed-responder.ts', () => {
    it(`VALID: {} => exports ${recipesConventionStatics.exports.seed}, throwing "no recipes defined yet"`, () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      expect(
        findContents({
          files,
          relativePath: 'src/responders/recipes/seed/recipes-seed-responder.ts',
        }),
      ).toMatch(
        /^ {2}'no recipes defined yet — add one under packages\/hydration-recipes\/src\/recipes-<name>\/';$/mu,
      );
    });
  });

  describe('src/index.ts', () => {
    it('VALID: {} => exports the three names recipesConventionStatics.exports requires, delegating to StartHydrationRecipes', () => {
      const packageName = PackageNameStub({ value: '@acme/hydration-recipes' });

      const files = recipesScaffoldFilesTransformer({ packageName });

      const indexTs = findContents({ files, relativePath: 'src/index.ts' });

      expect(indexTs).toMatch(
        /^import \{ StartHydrationRecipes \} from '\.\/startup\/start-hydration-recipes';$/mu,
      );
      expect(indexTs).toMatch(
        new RegExp(`^export const ${recipesConventionStatics.exports.listing} = `, 'mu'),
      );
      expect(indexTs).toMatch(
        new RegExp(`^export const ${recipesConventionStatics.exports.seed} = `, 'mu'),
      );
      expect(indexTs).toMatch(
        new RegExp(
          `^export const ${recipesConventionStatics.exports.manifest}: readonly never\\[\\] = \\[\\];$`,
          'mu',
        ),
      );
    });
  });
});
