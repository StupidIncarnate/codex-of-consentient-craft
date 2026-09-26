/**
 * PURPOSE: The pure file-building half of scaffolding ONE gateway workspace package —
 * `packages/@gateway/<folder>` — matching what `packages/@gateway/{npm,node,browser,bin}` already
 * carry in this repo byte-for-byte, parameterized by scope and folder. No wrapper modules: a fresh
 * gateway package holds only its configs and an empty `_test_` proxy barrel, exactly like
 * `packages/@gateway/node` before its first wrapped module existed.
 *
 * USAGE:
 * gatewayPackageScaffoldFilesTransformer({ scope: PathSegmentStub({value: '@acme'}), folder: 'npm' });
 * // Returns the five ScaffoldFile entries for packages/@gateway/npm, relative to that package's own root
 */

import { pathSegmentContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { scaffoldFileContract } from '../../contracts/scaffold-file/scaffold-file-contract';
import type { ScaffoldFile } from '../../contracts/scaffold-file/scaffold-file-contract';
import {
  gatewayFoldersStatics,
  type GatewayFolder,
} from '../../statics/gateway-folders/gateway-folders-statics';
import { gatewayPackageTemplateStatics } from '../../statics/gateway-package-template/gateway-package-template-statics';
import { gatewayImportsFieldTransformer } from '../gateway-imports-field/gateway-imports-field-transformer';
import { gatewayTsconfigPathsDeclarationValuesTransformer } from '../gateway-tsconfig-paths-declaration-values/gateway-tsconfig-paths-declaration-values-transformer';

const JSON_INDENT = gatewayPackageTemplateStatics.jsonIndentSpaces;

export const gatewayPackageScaffoldFilesTransformer = ({
  scope,
  folder,
}: {
  scope: PathSegment;
  folder: GatewayFolder;
}): readonly ScaffoldFile[] => {
  const packageName = `${String(scope)}/${folder}`;

  const packageJsonObject = {
    name: packageName,
    version: gatewayPackageTemplateStatics.packageVersion,
    description: gatewayFoldersStatics.descriptions[folder],
    imports: gatewayImportsFieldTransformer({ scope }),
    exports: {
      './_test_': {
        source: './src/_test_/index.ts',
        import: './dist/_test_/index.js',
        require: './dist/_test_/index.js',
        types: './dist/_test_/index.d.ts',
      },
      './*': {
        source: './src/*/index.ts',
        import: './dist/*/index.js',
        require: './dist/*/index.js',
        types: './dist/*/index.d.ts',
      },
    },
    typesVersions: {
      '*': {
        '*': ['src/*/index.ts', 'src/*'],
      },
    },
    files: gatewayPackageTemplateStatics.files,
    scripts: gatewayPackageTemplateStatics.scripts,
    devDependencies: gatewayPackageTemplateStatics.devDependencies,
    publishConfig: gatewayPackageTemplateStatics.publishConfig,
  };

  const tsconfigObject = {
    compilerOptions: {
      typeRoots: gatewayPackageTemplateStatics.typeRoots,
    },
    include: gatewayPackageTemplateStatics.include,
    extends: gatewayPackageTemplateStatics.tsconfigExtends,
  };

  // Every SIBLING folder points at its emitted declaration; this package's OWN entry points at its
  // own source instead — pointing it at `./dist` would be a chicken-and-egg 5055/2307 on a clean
  // build, since that dist is this same compilation's own not-yet-written output. Written as a
  // literal (not built from `gatewayFoldersStatics.folders` via `Object.fromEntries`) so its type is
  // the exact four-key `Record<GatewayFolder, string>` the values transformer expects, with no cast.
  const siblingDeclarationPaths = gatewayTsconfigPathsDeclarationValuesTransformer({
    relativeToGatewayFolders: {
      npm: '../npm',
      node: '../node',
      browser: '../browser',
      bin: '../bin',
    },
  });
  const buildPaths = {
    ...siblingDeclarationPaths,
    [`#gateway/${folder}/*`]: ['./src/*/index.ts'],
  };

  const tsconfigBuildObject = {
    extends: './tsconfig.json',
    compilerOptions: {
      noEmit: false,
      rootDir: './src',
      outDir: './dist',
      declarationMap: true,
      declaration: true,
      incremental: true,
      tsBuildInfoFile: './.ward/build.tsbuildinfo',
      paths: buildPaths,
    },
    exclude: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.proxy.ts',
      '**/*.stub.ts',
      '**/*.harness.ts',
      '@types/**/*',
      'dist',
    ],
  };

  const testBarrelContents = `/**
 * PURPOSE: Caller-facing proxy surface for ${packageName}'s wrapped modules. Empty until
 * a wrapped (non-pass-through) module needs a proxy a caller can import.
 *
 * USAGE:
 * import { exampleProxy } from '${packageName}/_test_';
 */
`;

  return [
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('package.json'),
      contents: fileContentsContract.parse(
        `${JSON.stringify(packageJsonObject, null, JSON_INDENT)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(locationsStatics.repoRoot.tsconfig),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigObject, null, JSON_INDENT)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('tsconfig.build.json'),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigBuildObject, null, JSON_INDENT)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('jest.config.js'),
      contents: fileContentsContract.parse(gatewayPackageTemplateStatics.jestConfigContent),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('src/_test_/index.ts'),
      contents: fileContentsContract.parse(testBarrelContents),
    }),
  ];
};
