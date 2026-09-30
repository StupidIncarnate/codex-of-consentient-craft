/**
 * PURPOSE: Builds the gateway index the census matches adapters against: every wrapper a gateway
 * barrel (`packages/@gateway/<kind>/src/<module>/<module>.ts`) exports by name, with the outside
 * calls its own file makes. `export *` lines are raw re-exports of a Node module, not wrappers, and
 * are skipped. A consumer's empty `npm` and `bin` gateways simply contribute nothing.
 *
 * USAGE:
 * adapterCensusBuildGatewayLayerBroker({ sources, factsByFile, textByFile, knownFiles, layout });
 * // Returns [{ importPath: '#gateway/node/fs__promises', name: 'readFile', moduleDir: 'fs__promises', outsideCalls }]
 */
import { adapterAnalysisAnalyzeBroker } from '../../adapter-analysis/analyze/adapter-analysis-analyze-broker';
import { gatewayBarrelImportPathTransformer } from '../../../transformers/gateway-barrel-import-path/gateway-barrel-import-path-transformer';
import { gatewayModuleDirTransformer } from '../../../transformers/gateway-module-dir/gateway-module-dir-transformer';
import { importTargetResolveTransformer } from '../../../transformers/import-target-resolve/import-target-resolve-transformer';
import type { CensusRepoLayout } from '../../../contracts/census-repo-layout/census-repo-layout-contract';
import type { CensusSourceEntry } from '../../../contracts/census-source-entry/census-source-entry-contract';
import { gatewayImplementationContract } from '../../../contracts/gateway-implementation/gateway-implementation-contract';
import type { GatewayImplementation } from '../../../contracts/gateway-implementation/gateway-implementation-contract';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';

export const adapterCensusBuildGatewayLayerBroker = ({
  sources,
  factsByFile,
  textByFile,
  knownFiles,
  layout,
}: {
  sources: readonly CensusSourceEntry[];
  factsByFile: ReadonlyMap<string, SourceFacts>;
  textByFile: ReadonlyMap<string, string>;
  knownFiles: ReadonlySet<string>;
  layout: CensusRepoLayout;
}): GatewayImplementation[] => {
  const implementations: GatewayImplementation[] = [];
  const workspacePackageNames = layout.packages.map((pkg) => pkg.name);

  for (const { file } of sources) {
    const importPath = gatewayBarrelImportPathTransformer({ file });
    if (importPath === null) {
      continue;
    }
    const moduleDir = gatewayModuleDirTransformer({
      specifier: importPath.slice(importPath.lastIndexOf('/') + 1),
    });

    for (const reExport of (factsByFile.get(file)?.reExports ?? []).filter(
      (entry) => !entry.isStar,
    )) {
      const target = importTargetResolveTransformer({
        fromFile: file,
        specifier: reExport.specifier,
        knownFiles,
        packages: layout.packages,
      });
      const text = target === null ? undefined : textByFile.get(target);
      const outsideCalls =
        target === null || text === undefined
          ? []
          : adapterAnalysisAnalyzeBroker({
              file: target,
              text,
              workspaceScope: layout.scope,
              workspacePackageNames,
            }).outsideCalls;

      for (const name of reExport.names) {
        implementations.push(
          gatewayImplementationContract.parse({ importPath, name, moduleDir, outsideCalls }),
        );
      }
    }
  }

  return implementations;
};
