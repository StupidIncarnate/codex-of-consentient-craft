/**
 * PURPOSE: The pure file-building half of scaffolding ONE gateway workspace package —
 * `packages/@gateway/<folder>` — matching what `packages/@gateway/{npm,node,browser,bin}` carry in
 * this repo, parameterized by scope and folder: the package.json with its `imports`, `exports` (`./package.json`
 * and three pattern keys — `./*.proxy` to `./src/*.proxy.ts`, `./*.stub` to `./src/*.stub.ts`, and the barrel key `./*`
 * to `./src/*\/*.ts`, each led by `<folder>-own-source` then `gateway-dist`; there is no `_test_` key,
 * since a test imports each stub and proxy from its own file) and `sideEffects: false`, both
 * tsconfigs, and a Jest config. node and browser get their source copied in afterwards
 * (`gatewaySourceCopyBroker`); npm and bin start with no subpath, so they get the placeholder
 * `src/index.d.ts` that keeps an empty package compiling.
 *
 * `<folder>-own-source` (e.g. `npm-own-source`) is unique to this package and listed first in its OWN
 * exports only, and only this package's own tsconfig.build.json activates it. Without it, a
 * devDependency chain that loops back into this SAME package during its own build (a proxy's
 * `registerMock` reaching `@dungeonmaster/shared`, which imports `#gateway/<folder>/<subpath>`) would
 * resolve through `gateway-dist` to this package's own already-built `dist/*.d.ts`, which collides with
 * the build's own output (TS5055) on a second, warm build. A different gateway's build never activates
 * this folder's condition, so it still resolves this package's exports through `gateway-dist`.
 *
 * USAGE:
 * gatewayPackageScaffoldFilesTransformer({ scope: PathSegmentStub({value: '@acme'}), folder: 'npm' });
 * // Returns the ScaffoldFile entries for packages/@gateway/npm, relative to that package's own root
 */

import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayImportsFieldTransformer } from '@dungeonmaster/shared/transformers';
import { scaffoldFileContract } from '../../contracts/scaffold-file/scaffold-file-contract';
import type { ScaffoldFile } from '../../contracts/scaffold-file/scaffold-file-contract';
import {
  gatewayFoldersStatics,
  type GatewayFolder,
} from '../../statics/gateway-folders/gateway-folders-statics';
import { gatewayPackageTemplateStatics } from '../../statics/gateway-package-template/gateway-package-template-statics';
import { gatewaySourceCopyStatics } from '../../statics/gateway-source-copy/gateway-source-copy-statics';

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
  const ownSourceCondition = `${folder}-own-source`;

  const packageJsonObject = {
    name: packageName,
    version: gatewayPackageTemplateStatics.packageVersion,
    description: gatewayFoldersStatics.descriptions[folder],
    sideEffects: false,
    imports: gatewayImportsFieldTransformer({ scope }),
    exports: {
      './package.json': './package.json',
      './*.proxy': {
        [ownSourceCondition]: './src/*.proxy.ts',
        'gateway-dist': './dist/*.proxy.d.ts',
        source: './src/*.proxy.ts',
        types: './dist/*.proxy.d.ts',
        import: './dist/*.proxy.js',
        require: './dist/*.proxy.js',
      },
      './*.stub': {
        [ownSourceCondition]: './src/*.stub.ts',
        'gateway-dist': './dist/*.stub.d.ts',
        source: './src/*.stub.ts',
        types: './dist/*.stub.d.ts',
        import: './dist/*.stub.js',
        require: './dist/*.stub.js',
      },
      './*': {
        [ownSourceCondition]: './src/*/*.ts',
        'gateway-dist': './dist/*/*.d.ts',
        source: './src/*/*.ts',
        types: './dist/*/*.d.ts',
        import: './dist/*/*.js',
        require: './dist/*/*.js',
      },
    },
    files: gatewayPackageTemplateStatics.files,
    scripts: gatewayPackageTemplateStatics.scripts,
    // browser's own copied source cross-imports node's stub (fetch-json.proxy.ts, for the
    // realistic connection-refused error fetch can reject with) — `gateway-dependency-declared`
    // requires the importing package.json to list the real target package name in `dependencies`,
    // exactly as this repo's OWN packages/@gateway/browser/package.json already does.
    ...(folder === 'browser' ? { dependencies: { [`${String(scope)}/node`]: '*' } } : {}),
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
      customConditions: [
        ownSourceCondition,
        ...gatewayPackageTemplateStatics.buildCustomConditions,
      ],
    },
    exclude: gatewayPackageTemplateStatics.buildExclude,
  };

  return [
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('package.json'),
      contents: `${JSON.stringify(packageJsonObject, null, JSON_INDENT)}\n`,
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(locationsStatics.repoRoot.tsconfig),
      contents: `${JSON.stringify(tsconfigObject, null, JSON_INDENT)}\n`,
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('tsconfig.build.json'),
      contents: `${JSON.stringify(tsconfigBuildObject, null, JSON_INDENT)}\n`,
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('jest.config.js'),
      contents: (folder === 'browser'
          ? gatewayPackageTemplateStatics.browserJestConfigContent
          : gatewayPackageTemplateStatics.jestConfigContent),
    }),
    ...(receivesCopiedSource
      ? []
      : [
          scaffoldFileContract.parse({
            relativePath: pathSegmentContract.parse(gatewayPackageTemplateStatics.placeholderPath),
            contents: gatewayPackageTemplateStatics.placeholderContent,
          }),
        ]),
  ];
};
