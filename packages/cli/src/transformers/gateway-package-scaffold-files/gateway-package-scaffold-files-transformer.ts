/**
 * PURPOSE: The pure file-building half of scaffolding ONE gateway workspace package —
 * `packages/@gateway/<folder>` — matching what `packages/@gateway/{npm,node,browser,bin}` carry in
 * this repo, parameterized by scope and folder: the package.json with its `imports`, `exports`
 * (`./*` to `./src/*\/*.ts`, `./_test_/*` to `./src/*\/*.proxy.ts`, each led by `gateway-dist`) and
 * `sideEffects: false`, both tsconfigs, and a Jest config. node and browser get their source copied
 * in afterwards (`gatewaySourceCopyBroker`); npm and bin start with no subpath, so they get the
 * placeholder `src/index.d.ts` that keeps an empty package compiling.
 *
 * USAGE:
 * gatewayPackageScaffoldFilesTransformer({ scope: PathSegmentStub({value: '@acme'}), folder: 'npm' });
 * // Returns the ScaffoldFile entries for packages/@gateway/npm, relative to that package's own root
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
import { gatewaySourceCopyStatics } from '../../statics/gateway-source-copy/gateway-source-copy-statics';
import { gatewayImportsFieldTransformer } from '../gateway-imports-field/gateway-imports-field-transformer';

const JSON_INDENT = gatewayPackageTemplateStatics.jsonIndentSpaces;

export const gatewayPackageScaffoldFilesTransformer = ({
  scope,
  folder,
}: {
  scope: PathSegment;
  folder: GatewayFolder;
}): readonly ScaffoldFile[] => {
  const packageName = `${String(scope)}/${folder}`;
  const receivesCopiedSource = Object.hasOwn(gatewaySourceCopyStatics.sources, folder);

  const packageJsonObject = {
    name: packageName,
    version: gatewayPackageTemplateStatics.packageVersion,
    description: gatewayFoldersStatics.descriptions[folder],
    sideEffects: false,
    imports: gatewayImportsFieldTransformer({ scope }),
    exports: {
      './_test_/*': {
        'gateway-dist': './dist/*/*.proxy.d.ts',
        source: './src/*/*.proxy.ts',
        import: './dist/*/*.proxy.js',
        require: './dist/*/*.proxy.js',
        types: './dist/*/*.proxy.d.ts',
      },
      './*': {
        'gateway-dist': './dist/*/*.d.ts',
        source: './src/*/*.ts',
        import: './dist/*/*.js',
        require: './dist/*/*.js',
        types: './dist/*/*.d.ts',
      },
    },
    files: gatewayPackageTemplateStatics.files,
    scripts: gatewayPackageTemplateStatics.scripts,
    devDependencies:
      folder === 'browser'
        ? {
            ...gatewayPackageTemplateStatics.devDependencies,
            ...gatewaySourceCopyStatics.browserDevDependencies,
          }
        : gatewayPackageTemplateStatics.devDependencies,
    publishConfig: gatewayPackageTemplateStatics.publishConfig,
  };

  const tsconfigObject = {
    compilerOptions: {
      typeRoots: gatewayPackageTemplateStatics.typeRoots,
    },
    include: gatewayPackageTemplateStatics.include,
    exclude: gatewayPackageTemplateStatics.exclude,
    extends: gatewayPackageTemplateStatics.tsconfigExtends,
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
      customConditions: gatewayPackageTemplateStatics.buildCustomConditions,
    },
    exclude: gatewayPackageTemplateStatics.buildExclude,
  };

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
      contents: fileContentsContract.parse(
        folder === 'browser'
          ? gatewayPackageTemplateStatics.browserJestConfigContent
          : gatewayPackageTemplateStatics.jestConfigContent,
      ),
    }),
    ...(receivesCopiedSource
      ? []
      : [
          scaffoldFileContract.parse({
            relativePath: pathSegmentContract.parse(gatewayPackageTemplateStatics.placeholderPath),
            contents: fileContentsContract.parse(gatewayPackageTemplateStatics.placeholderContent),
          }),
        ]),
  ];
};
