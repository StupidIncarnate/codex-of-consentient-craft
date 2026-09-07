/**
 * PURPOSE: The integrating transformer behind `dungeonmaster create-package` — the ONLY place that
 * decides which files land in a freshly scaffolded package directory. Being pure (no filesystem
 * access) is what lets `--dry-run` print exactly what a real run would write and lets its own
 * tests assert file bodies without touching disk.
 *
 * USAGE:
 * packageScaffoldFilesTransformer({ request: CreatePackageRequestStub() });
 * // Returns the ordered ScaffoldFile[] for that request's packageType, every relativePath relative
 * // to the new package's own root
 */
import { packageSeedContract } from '../../contracts/package-seed/package-seed-contract';
import { scaffoldFileContract } from '../../contracts/scaffold-file/scaffold-file-contract';
import type { ScaffoldFile } from '../../contracts/scaffold-file/scaffold-file-contract';
import type { CreatePackageRequest } from '../../contracts/create-package-request/create-package-request-contract';
import { packageSeedPlainStatics } from '../../statics/package-seed-plain/package-seed-plain-statics';
import { packageSeedServiceStatics } from '../../statics/package-seed-service/package-seed-service-statics';
import { packageSeedFrontendStatics } from '../../statics/package-seed-frontend/package-seed-frontend-statics';
import { packageScaffoldConfigStatics } from '../../statics/package-scaffold-config/package-scaffold-config-statics';
import { playwrightConfigTemplateStatics } from '../../statics/playwright-config-template/playwright-config-template-statics';
import { pathSegmentContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { kebabCaseVariantsTransformer } from '../kebab-case-variants/kebab-case-variants-transformer';

// No `satisfies Record<string, PackageSeed>` here: the seeds' `as const` literals are readonly
// and unbranded, which can never structurally satisfy PackageSeed's mutable branded zod-inferred
// shape. `packageSeedContract.parse()` below is what actually proves each entry is a valid seed.
const SEED_TABLE = {
  ...packageSeedPlainStatics,
  ...packageSeedServiceStatics,
  ...packageSeedFrontendStatics,
};

export const packageScaffoldFilesTransformer = ({
  request,
}: {
  request: CreatePackageRequest;
}): readonly ScaffoldFile[] => {
  // `PackageType` carries zod's phantom brand, which TypeScript refuses as an index into a
  // literal-keyed object — matched over entries instead, same workaround as
  // packageChipAccentTransformer in @dungeonmaster/web.
  const matchedSeedEntry = Object.entries(SEED_TABLE).find(
    ([kind]) => kind === String(request.packageType),
  );
  if (matchedSeedEntry === undefined) {
    throw new Error(
      `packageScaffoldFilesTransformer: no seed registered for packageType "${String(request.packageType)}"`,
    );
  }
  const seed = packageSeedContract.parse(matchedSeedEntry[1]);

  const { directoryName } = request;
  const { camel, pascal, testId } = kebabCaseVariantsTransformer({ kebab: directoryName });
  // A seed reaches the workspace's shared contracts through this, because the alternative is raw
  // `string` types and `@dungeonmaster/ban-primitives` rejects those. An unscoped repo substitutes
  // an empty string, which turns the import into a bare 'shared/...' specifier — so a seed that
  // needs shared contracts also declares '__SCOPE__/shared' among its dependencies, and an
  // unscoped repo has to supply that package itself.
  const scope = String(request.packageName).startsWith('@')
    ? String(request.packageName).split('/')[0]
    : '';
  // No explicit tuple-array type here: `String(...)` unbrands every value up front so every pair
  // is a plain [string, string] and TypeScript infers the array shape on its own — an explicit
  // annotation would have to spell the word "string", which `@dungeonmaster/ban-primitives` bans
  // outside a function's own parameter/return position.
  const PLACEHOLDER_PAIRS = [
    ['__NAME__', String(directoryName)] as const,
    ['__CAMEL__', String(camel)] as const,
    ['__PASCAL__', String(pascal)] as const,
    ['__TESTID__', String(testId)] as const,
    ['__SCOPE__', scope ?? ''] as const,
  ];

  const barrelStem = seed.barrel === null ? null : seed.barrel.fileName.replace(/\.ts$/u, '');
  const barrelBlock =
    seed.barrel !== null && barrelStem !== null
      ? {
          source: `./${seed.barrel.fileName}`,
          import: `./dist/${barrelStem}.js`,
          require: `./dist/${barrelStem}.js`,
          types: `./dist/${barrelStem}.d.ts`,
        }
      : null;

  // Only cli-tool and eslint-plugin ever set exportsDot; buildRootDir tells the two apart
  // (null keeps the src/ prefix, './src' strips it) rather than a second branch on packageType.
  const dotSourcePath =
    request.packageType === 'cli-tool'
      ? `./src/startup/start-${directoryName}.ts`
      : './src/index.ts';
  const dotSourceRelative = dotSourcePath.replace(/^\.\//u, '');
  const dotDistRelative =
    seed.buildRootDir === './src' ? dotSourceRelative.replace(/^src\//u, '') : dotSourceRelative;
  const dotDistJsPath = `./dist/${dotDistRelative.replace(/\.ts$/u, '.js')}`;
  const dotBlock = seed.exportsDot
    ? {
        source: dotSourcePath,
        import: dotDistJsPath,
        require: dotDistJsPath,
        types: dotDistJsPath.replace(/\.js$/u, '.d.ts'),
      }
    : null;

  const exportsEntries = [
    ...(barrelStem !== null && barrelBlock !== null
      ? [[`./${barrelStem}`, barrelBlock] as const]
      : []),
    ...(dotBlock === null ? [] : [['.', dotBlock] as const]),
  ];
  const exportsField = exportsEntries.length > 0 ? Object.fromEntries(exportsEntries) : null;

  const binHasEntries = Object.keys(seed.bin).length > 0;
  const substitutedBin = Object.fromEntries(
    Object.entries(seed.bin).map(([key, value]) => [
      PLACEHOLDER_PAIRS.reduce((acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub), key),
      PLACEHOLDER_PAIRS.reduce(
        (acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub),
        String(value),
      ),
    ]),
  );
  const dependenciesHasEntries = Object.keys(seed.dependencies).length > 0;
  const substitutedDependencies = Object.fromEntries(
    Object.entries(seed.dependencies).map(([key, value]) => [
      PLACEHOLDER_PAIRS.reduce((acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub), key),
      String(value),
    ]),
  );

  const scriptsField = {
    ...packageScaffoldConfigStatics.scripts,
    ...(binHasEntries ? { postbuild: packageScaffoldConfigStatics.binPostbuildScript } : {}),
  };

  const packageJsonObject = {
    name: request.packageName,
    version: packageScaffoldConfigStatics.packageVersion,
    description: request.description,
    ...(exportsField === null ? {} : { exports: exportsField }),
    files: packageScaffoldConfigStatics.files,
    ...(binHasEntries ? { bin: substitutedBin } : {}),
    scripts: scriptsField,
    ...(dependenciesHasEntries ? { dependencies: substitutedDependencies } : {}),
    devDependencies: packageScaffoldConfigStatics.devDependencies,
    publishConfig: packageScaffoldConfigStatics.publishConfig,
  };

  const tsconfigObject = {
    extends: packageScaffoldConfigStatics.tsconfigExtends,
    compilerOptions: {
      typeRoots: packageScaffoldConfigStatics.typeRoots,
      ...seed.compilerOptions,
    },
    include: [...packageScaffoldConfigStatics.baseInclude, ...seed.extraInclude],
  };

  const tsconfigBuildObject = {
    extends: packageScaffoldConfigStatics.buildTsconfigExtends,
    compilerOptions: {
      ...packageScaffoldConfigStatics.buildCompilerOptions,
      rootDir: seed.buildRootDir ?? packageScaffoldConfigStatics.buildCompilerOptions.rootDir,
    },
    exclude: packageScaffoldConfigStatics.buildExclude,
  };

  const jestTemplate =
    seed.jestKind === 'node'
      ? packageScaffoldConfigStatics.jestConfigNode
      : packageScaffoldConfigStatics.jestConfigTsx;
  const jestRootsValue = binHasEntries
    ? `${packageScaffoldConfigStatics.jestRootSrc}, ${packageScaffoldConfigStatics.jestRootBin}`
    : packageScaffoldConfigStatics.jestRootSrc;
  const jestTestEnvironmentValue =
    seed.jestKind === 'tsx-jsdom'
      ? packageScaffoldConfigStatics.jestEnvironmentJsdom
      : packageScaffoldConfigStatics.jestEnvironmentNode;
  const jestConfigContents = jestTemplate
    .replaceAll(packageScaffoldConfigStatics.jestRootsPlaceholder, jestRootsValue)
    .replaceAll(
      packageScaffoldConfigStatics.jestTestEnvironmentPlaceholder,
      jestTestEnvironmentValue,
    );

  const barrelContents =
    seed.barrel !== null && barrelStem !== null
      ? `/**
 * PURPOSE: Public entry point for this package's ${barrelStem} surface — every downstream import
 * of '${request.packageName}/${barrelStem}' resolves through this file.
 *
 * USAGE:
 * import { ... } from '${request.packageName}/${barrelStem}';
 */

${seed.barrel.exportPaths
  .map(
    (exportPath) =>
      `export * from '${PLACEHOLDER_PAIRS.reduce((acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub), String(exportPath))}';`,
  )
  .join('\n')}
`
      : null;

  return [
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse('package.json'),
      contents: fileContentsContract.parse(
        `${JSON.stringify(packageJsonObject, null, packageScaffoldConfigStatics.jsonIndentSpaces)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(locationsStatics.repoRoot.tsconfig),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigObject, null, packageScaffoldConfigStatics.jsonIndentSpaces)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(packageScaffoldConfigStatics.buildTsconfigFileName),
      contents: fileContentsContract.parse(
        `${JSON.stringify(tsconfigBuildObject, null, packageScaffoldConfigStatics.jsonIndentSpaces)}\n`,
      ),
    }),
    scaffoldFileContract.parse({
      relativePath: pathSegmentContract.parse(packageScaffoldConfigStatics.jestConfigFileName),
      contents: fileContentsContract.parse(jestConfigContents),
    }),
    ...(seed.e2eEligible
      ? [
          scaffoldFileContract.parse({
            relativePath: pathSegmentContract.parse(
              packageScaffoldConfigStatics.playwrightConfigFileName,
            ),
            contents: fileContentsContract.parse(playwrightConfigTemplateStatics.content),
          }),
        ]
      : []),
    ...(seed.barrel !== null && barrelContents !== null
      ? [
          scaffoldFileContract.parse({
            relativePath: pathSegmentContract.parse(seed.barrel.fileName),
            contents: fileContentsContract.parse(barrelContents),
          }),
        ]
      : []),
    ...seed.files.map(({ path, contents }) =>
      scaffoldFileContract.parse({
        relativePath: pathSegmentContract.parse(
          PLACEHOLDER_PAIRS.reduce(
            (acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub),
            String(path),
          ),
        ),
        contents: fileContentsContract.parse(
          PLACEHOLDER_PAIRS.reduce(
            (acc, [placeholder, sub]) => acc.replaceAll(placeholder, sub),
            String(contents),
          ),
        ),
      }),
    ),
  ];
};
