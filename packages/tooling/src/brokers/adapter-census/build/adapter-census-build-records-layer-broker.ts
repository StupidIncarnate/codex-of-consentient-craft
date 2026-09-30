/**
 * PURPOSE: Builds one record per adapter: its shape (from its own parse and the gateway index), the
 * production files, tests and proxies that import it, and for each production caller the chain of
 * proxies a migration has to edit with it, marking which of them stage a catch-all. A caller's
 * proxy chain is its sibling proxy plus every proxy that composes that proxy, transitively.
 *
 * USAGE:
 * adapterCensusBuildRecordsLayerBroker({ adapterFiles, importers, kindByFile, factsByFile, textByFile, knownFiles, implementations, layout });
 * // Returns one AdapterRecord per adapter file, in the order given
 */
import { adapterAnalysisAnalyzeBroker } from '../../adapter-analysis/analyze/adapter-analysis-analyze-broker';
import { adapterRecordContract } from '../../../contracts/adapter-record/adapter-record-contract';
import { adapterShapeClassifyTransformer } from '../../../transformers/adapter-shape-classify/adapter-shape-classify-transformer';
import { gatewayMatchFindTransformer } from '../../../transformers/gateway-match-find/gateway-match-find-transformer';
import { proxyComposersCollectTransformer } from '../../../transformers/proxy-composers-collect/proxy-composers-collect-transformer';
import { proxySiblingFileTransformer } from '../../../transformers/proxy-sibling-file/proxy-sibling-file-transformer';
import type { AdapterCaller } from '../../../contracts/adapter-caller/adapter-caller-contract';
import type { AdapterRecord } from '../../../contracts/adapter-record/adapter-record-contract';
import type { CensusFileKind } from '../../../contracts/census-file-kind/census-file-kind-contract';
import type { CensusPath } from '../../../contracts/census-path/census-path-contract';
import type { CensusRepoLayout } from '../../../contracts/census-repo-layout/census-repo-layout-contract';
import type { GatewayImplementation } from '../../../contracts/gateway-implementation/gateway-implementation-contract';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';

export const adapterCensusBuildRecordsLayerBroker = ({
  adapterFiles,
  importers,
  kindByFile,
  factsByFile,
  textByFile,
  knownFiles,
  implementations,
  layout,
}: {
  adapterFiles: readonly CensusPath[];
  importers: ReadonlyMap<CensusPath, readonly CensusPath[]>;
  kindByFile: ReadonlyMap<CensusPath, CensusFileKind>;
  factsByFile: ReadonlyMap<CensusPath, SourceFacts>;
  textByFile: ReadonlyMap<CensusPath, string>;
  knownFiles: ReadonlySet<CensusPath>;
  implementations: readonly GatewayImplementation[];
  layout: CensusRepoLayout;
}): AdapterRecord[] => {
  const composersByProxy = new Map<CensusPath, CensusPath[]>();
  for (const [target, files] of importers) {
    if (kindByFile.get(target) === 'proxy') {
      composersByProxy.set(
        target,
        files.filter((file) => kindByFile.get(file) === 'proxy'),
      );
    }
  }
  const workspacePackageNames = layout.packages.map((pkg) => pkg.name);

  return adapterFiles.flatMap((file) => {
    const text = textByFile.get(file);
    if (text === undefined) {
      return [];
    }
    const analysis = adapterAnalysisAnalyzeBroker({
      file,
      text,
      workspaceScope: layout.scope,
      workspacePackageNames,
    });
    const gateway = gatewayMatchFindTransformer({
      outsideCalls: analysis.outsideCalls,
      implementations,
    });
    const { shape, reasons } = adapterShapeClassifyTransformer({ analysis, gateway });

    const importedBy = importers.get(file) ?? [];
    const productionCallers = importedBy
      .filter((caller) => kindByFile.get(caller) === 'production')
      .map((caller): AdapterCaller => {
        const sibling = proxySiblingFileTransformer({ file: caller });
        const proxyFile = knownFiles.has(sibling) ? sibling : null;
        const composedBy =
          proxyFile === null
            ? []
            : proxyComposersCollectTransformer({ proxyFile, composersByProxy });
        return {
          file: caller,
          proxyFile,
          composedBy,
          catchAll: (proxyFile === null ? [] : [proxyFile, ...composedBy])
            .map((proxy) => ({ file: proxy, sites: factsByFile.get(proxy)?.catchAllSites ?? [] }))
            .filter((entry) => entry.sites.length > 0),
        };
      });

    const adapterProxyFile = proxySiblingFileTransformer({ file });
    const adapterProxy = knownFiles.has(adapterProxyFile)
      ? {
          file: adapterProxyFile,
          catchAll: factsByFile.get(adapterProxyFile)?.catchAllSites ?? [],
          composedBy: composersByProxy.get(adapterProxyFile) ?? [],
        }
      : null;

    return [
      adapterRecordContract.parse({
        file,
        exportNames: factsByFile.get(file)?.exportNames ?? [],
        shape,
        reasons,
        outsideCalls: analysis.outsideCalls,
        gateway,
        productionCallers,
        testFiles: importedBy.filter((caller) => kindByFile.get(caller) === 'test'),
        proxyFiles: importedBy.filter(
          (caller) => kindByFile.get(caller) === 'proxy' && caller !== adapterProxyFile,
        ),
        adapterProxy,
      }),
    ];
  });
};
