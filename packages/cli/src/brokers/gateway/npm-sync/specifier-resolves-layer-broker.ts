/**
 * PURPOSE: Whether one module specifier resolves from the consumer's npm gateway at all — a package
 * root or one of its subpaths, as either a `require` or an `import`, to declarations or to plain
 * JavaScript. node16 resolution with the `source` condition, the same resolution
 * `copyCompileLayerBroker` and `npmModuleEsmOnlyBroker` use, so a passthrough barrel is only written
 * for a specifier its own compile can find: `export * from '@modelcontextprotocol/sdk'` against a
 * package with no `.` export is TS2307 in the consumer's build. Reach for `npmModuleEsmOnlyBroker`
 * to ask how it resolves; this asks only whether.
 *
 * USAGE:
 * specifierResolvesLayerBroker({ repoRoot: '/repo', specifier: '@modelcontextprotocol/sdk/server/mcp.js' });
 * // Returns true when the consumer's install resolves it
 */

import * as ts from '#gateway/npm/typescript';
import { join } from '#gateway/node/path';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';

// Never read: resolution only needs a file inside the gateway's src/ to walk node_modules up from.
const PROBE_FILE_NAME = '__gateway-npm-sync-probe__.ts';

export const specifierResolvesLayerBroker = ({
  repoRoot,
  specifier,
}: {
  repoRoot: string;
  specifier: string;
}): boolean => {
  const { consumerGateway } = gatewayNpmSyncStatics;
  const probePath = join(
    repoRoot,
    consumerGateway.packageDirectory,
    consumerGateway.sourceDirectory,
    PROBE_FILE_NAME,
  );
  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    customConditions: [...gatewayPackageTemplateStatics.rootCompilerOptions.customConditions],
    allowJs: true,
  };

  return ([ts.ModuleKind.CommonJS, ts.ModuleKind.ESNext] as const).some(
    (mode) =>
      ts.resolveModuleName(
        specifier,
        probePath,
        compilerOptions,
        ts.sys,
        undefined,
        undefined,
        mode,
      ).resolvedModule !== undefined,
  );
};
