/**
 * PURPOSE: Compiles the files the sync is about to copy for one dependency, in memory and before
 * anything is written, exactly where they will land in the consumer's npm gateway — so a wrapper
 * built against an API the consumer's installed version lacks is caught while there is still nothing
 * to clean up. `files` holds every file this run plans to write (earlier dependencies' copies and
 * passthroughs too, so a cross-folder import sees them); only `checkedPaths` have their diagnostics
 * counted. Options match `npmModuleEsmOnlyBroker` and the consumer's root tsconfig — node16 with
 * the `source` condition, under the gateway's own CommonJS package.json — plus `strict`, with the
 * consumer's installed `@types` as the type roots the gateway package template sets. `#gateway/<kind>/<sub>`
 * resolves to that gateway package's `src/` the way its `exports` map does, without needing the
 * workspace symlinks `npm install` makes; an npm-gateway folder nobody has written yet resolves to
 * dungeonmaster's own copy of it. Reach for `npmModuleEsmOnlyBroker` to ask about one specifier;
 * this compiles whole files.
 *
 * USAGE:
 * copyCompileLayerBroker({ repoRoot: '/repo', ownSrcRoot, files: new Map([['/repo/packages/@gateway/npm/src/zod/zod.ts', "export * from 'zod';\n"]]), checkedPaths: ['/repo/packages/@gateway/npm/src/zod/zod.ts'] });
 * // Returns [] when every checked file compiles, else one 'packages/@gateway/npm/src/zod/zod.ts(1): TS2307: ...' line per diagnostic
 */

import * as ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';

const GATEWAY_PREFIX = `${gatewayLocationsStatics.importPrefix}/`;
const PATH_SEPARATOR = '/';

export const copyCompileLayerBroker = ({
  repoRoot,
  ownSrcRoot,
  files,
  checkedPaths,
}: {
  repoRoot: string;
  ownSrcRoot: string;
  files: ReadonlyMap<string, string>;
  checkedPaths: readonly string[];
}): string[] => {
  const { consumerGateway, sourceExtensions, gatewayFileExportSuffixes } = gatewayNpmSyncStatics;
  const npmPackageRoot = join(repoRoot, consumerGateway.packageDirectory);
  const gatewayGroupRoot = join(
    repoRoot,
    consumerGateway.packagesDirectory,
    consumerGateway.gatewayGroupDirectory,
  );

  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    target: ts.ScriptTarget.ES2022,
    customConditions: [...gatewayPackageTemplateStatics.rootCompilerOptions.customConditions],
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    noEmit: true,
    typeRoots: gatewayPackageTemplateStatics.typeRoots.map((typeRoot) =>
      join(npmPackageRoot, typeRoot),
    ),
  };

  const plannedDirectories = new Set<string>();
  for (const filePath of files.keys()) {
    const segments = filePath.split(PATH_SEPARATOR).slice(0, -1);
    segments.forEach((_segment, index) => {
      plannedDirectories.add(segments.slice(0, index + 1).join(PATH_SEPARATOR));
    });
  }

  const host = ts.createCompilerHost(compilerOptions);
  const realGetSourceFile = host.getSourceFile.bind(host);
  const realReadFile = host.readFile.bind(host);
  const realFileExists = host.fileExists.bind(host);
  const realDirectoryExists = host.directoryExists?.bind(host);

  host.getSourceFile = (fileName, languageVersion, ...rest) => {
    const planned = files.get(fileName);
    return planned === undefined
      ? realGetSourceFile(fileName, languageVersion, ...rest)
      : ts.createSourceFile(fileName, planned, languageVersion, true);
  };
  host.readFile = (fileName) => files.get(fileName) ?? realReadFile(fileName);
  host.fileExists = (fileName) => files.has(fileName) || realFileExists(fileName);
  host.directoryExists = (directoryName) =>
    plannedDirectories.has(directoryName) || (realDirectoryExists?.(directoryName) ?? true);

  host.resolveModuleNameLiterals = (
    moduleLiterals,
    containingFile,
    redirectedReference,
    options,
    containingSourceFile,
  ) =>
    moduleLiterals.map((literal) => {
      const specifier = literal.text;
      if (specifier.startsWith(GATEWAY_PREFIX)) {
        const [kind = '', ...subSegments] = specifier
          .slice(GATEWAY_PREFIX.length)
          .split(PATH_SEPARATOR);
        const sub = subSegments.join(PATH_SEPARATOR);
        const fileStem = gatewayFileExportSuffixes.some((suffix) => sub.endsWith(suffix))
          ? sub
          : `${sub}${PATH_SEPARATOR}${sub}`;
        const roots = [
          join(gatewayGroupRoot, kind, consumerGateway.sourceDirectory),
          ...(kind === gatewayLocationsStatics.folders.npm ? [ownSrcRoot] : []),
        ];
        const resolvedFileName = roots
          .flatMap((root) =>
            sourceExtensions.map((extension) => join(root, `${fileStem}${extension}`)),
          )
          .find((candidate) => host.fileExists(candidate));
        if (resolvedFileName !== undefined) {
          return {
            resolvedModule: {
              resolvedFileName,
              extension: resolvedFileName.endsWith(ts.Extension.Tsx)
                ? ts.Extension.Tsx
                : ts.Extension.Ts,
              isExternalLibraryImport: false,
            },
          };
        }
      }
      return ts.resolveModuleName(
        specifier,
        containingFile,
        options,
        host,
        undefined,
        redirectedReference,
        ts.getModeForUsageLocation(containingSourceFile, literal, options),
      );
    });

  const program = ts.createProgram([...checkedPaths], compilerOptions, host);

  return checkedPaths.flatMap((checkedPath) => {
    const sourceFile = program.getSourceFile(checkedPath);
    if (sourceFile === undefined) {
      throw new Error(`copyCompileLayerBroker: program has no source file for ${checkedPath}`);
    }
    return [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ].map((diagnostic) => {
      const line =
        diagnostic.start === undefined
          ? 0
          : sourceFile.getLineAndCharacterOfPosition(diagnostic.start).line + 1;
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      return `${checkedPath.slice(repoRoot.length + 1)}(${String(line)}): TS${String(diagnostic.code)}: ${message}`;
    });
  });
};
