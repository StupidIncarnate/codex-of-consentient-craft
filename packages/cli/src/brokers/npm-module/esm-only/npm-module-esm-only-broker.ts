/**
 * PURPOSE: Whether a module specifier is ESM-only from where the consumer's npm gateway imports it.
 * That gateway package is CommonJS and compiles under node16 resolution, so an `export * from` a
 * module TypeScript resolves to an ES module file is TS1479 there — `ink`, or an
 * `@modelcontextprotocol/sdk` subpath whose `types` condition points at its ESM build. It compiles
 * one in-memory probe file placed inside `packages/@gateway/npm/src/`, so the gateway's own
 * package.json decides the probe's module format exactly as it does for a real barrel, and reads
 * the probe's own diagnostics for that one code. A specifier that does not resolve at all is not
 * ESM-only; that is `npmModuleExportShapeBroker`'s `untyped`.
 *
 * USAGE:
 * npmModuleEsmOnlyBroker({ repoRoot: '/repo', specifier: 'ink' });
 * // Returns true when the CommonJS npm gateway could not `require` it
 */

import * as ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';

// Never written: the host below answers for it, and only its directory matters.
const PROBE_FILE_NAME = '__gateway-npm-sync-probe__.ts';

export const npmModuleEsmOnlyBroker = ({
  repoRoot,
  specifier,
}: {
  repoRoot: string;
  specifier: string;
}): boolean => {
  const { consumerGateway, esmProbe } = gatewayNpmSyncStatics;
  const probePath = join(
    repoRoot,
    consumerGateway.packageDirectory,
    consumerGateway.sourceDirectory,
    PROBE_FILE_NAME,
  );
  const probeText = `export * from '${specifier}';\n`;

  // node16 module and resolution plus the `source` condition: what `init` sets in the consumer's
  // root tsconfig (gatewayPackageTemplateStatics.rootCompilerOptions). noLib and no automatic
  // @types keep the probe to the one import it exists for.
  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    customConditions: [...gatewayPackageTemplateStatics.rootCompilerOptions.customConditions],
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    types: [],
  };

  const host = ts.createCompilerHost(compilerOptions);
  const realGetSourceFile = host.getSourceFile.bind(host);
  const realReadFile = host.readFile.bind(host);
  const realFileExists = host.fileExists.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === probePath
      ? ts.createSourceFile(fileName, probeText, languageVersion, true)
      : realGetSourceFile(fileName, languageVersion, ...rest);
  host.readFile = (fileName) => (fileName === probePath ? probeText : realReadFile(fileName));
  host.fileExists = (fileName) => fileName === probePath || realFileExists(fileName);

  const program = ts.createProgram([probePath], compilerOptions, host);
  const probe = program.getSourceFile(probePath);
  if (probe === undefined) {
    throw new Error(`npmModuleEsmOnlyBroker: program has no source file for ${probePath}`);
  }

  return program
    .getSemanticDiagnostics(probe)
    .some(({ code }) =>
      Object.values(esmProbe.diagnosticCodes).some((esmCode) => esmCode === code),
    );
};
