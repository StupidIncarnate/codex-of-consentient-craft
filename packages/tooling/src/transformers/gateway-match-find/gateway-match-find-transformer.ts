/**
 * PURPOSE: Finds the gateway exports that already do an adapter's outside calls. A call the adapter
 * makes through `#gateway/*` is its own exact match. A call into `fs/promises` matches the gateway
 * module `fs__promises`: `exact` when that module exports the same name, `related` when a wrapper
 * there calls the same function (`statIfExists` for `stat`). `exact` matches list first.
 *
 * USAGE:
 * gatewayMatchFindTransformer({ outsideCalls, implementations });
 * // Returns [{ importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' }]
 */
import { gatewayExportContract } from '../../contracts/gateway-export/gateway-export-contract';
import { gatewayModuleDirTransformer } from '../gateway-module-dir/gateway-module-dir-transformer';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { GatewayExport } from '../../contracts/gateway-export/gateway-export-contract';
import type { GatewayImplementation } from '../../contracts/gateway-implementation/gateway-implementation-contract';
import type { OutsideCall } from '../../contracts/outside-call/outside-call-contract';

export const gatewayMatchFindTransformer = ({
  outsideCalls,
  implementations,
}: {
  outsideCalls: readonly OutsideCall[];
  implementations: readonly GatewayImplementation[];
}): GatewayExport[] => {
  const found: GatewayExport[] = [];
  const gatewayPrefix = `${censusLayoutStatics.gatewayImportPrefix}/`;

  for (const call of outsideCalls) {
    if (call.module.startsWith(gatewayPrefix)) {
      if (!found.some((entry) => entry.importPath === call.module && entry.name === call.name)) {
        found.push(
          gatewayExportContract.parse({ importPath: call.module, name: call.name, match: 'exact' }),
        );
      }
      continue;
    }

    const moduleDir = gatewayModuleDirTransformer({ specifier: call.module });
    for (const implementation of implementations.filter((impl) => impl.moduleDir === moduleDir)) {
      const { importPath, name } = implementation;
      const callsSame = implementation.outsideCalls.some(
        (inner) =>
          inner.name === call.name &&
          gatewayModuleDirTransformer({ specifier: inner.module }) === moduleDir,
      );
      const alreadyFound = found.some(
        (entry) => entry.importPath === importPath && entry.name === name,
      );
      if (!alreadyFound && (name === call.name || callsSame)) {
        found.push(
          gatewayExportContract.parse({
            importPath,
            name,
            match: name === call.name ? 'exact' : 'related',
          }),
        );
      }
    }
  }

  return found.sort(
    (a, b) =>
      Number(b.match === 'exact') - Number(a.match === 'exact') ||
      `${a.importPath}#${a.name}`.localeCompare(`${b.importPath}#${b.name}`),
  );
};
