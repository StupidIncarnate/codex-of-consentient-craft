/**
 * PURPOSE: Assembles the census from a repo's layout and its source files, with no I/O of its own.
 * It parses every file once, indexes the gateway, resolves who imports each adapter and proxy, and
 * groups one record per adapter under its package. `packageFilter` keeps one package, matched by
 * name, folder, or folder name (`siegelense`).
 *
 * USAGE:
 * const census = adapterCensusBuildBroker({ layout, sources });
 * // Returns { scope, packages: [{ name, dir, adapters: [...] }], totals }
 */
import { adapterCensusContract } from '../../../contracts/adapter-census/adapter-census-contract';
import { isAdapterEntryFileGuard } from '../../../guards/is-adapter-entry-file/is-adapter-entry-file-guard';
import { adapterCensusTotalsTransformer } from '../../../transformers/adapter-census-totals/adapter-census-totals-transformer';
import { censusFileKindTransformer } from '../../../transformers/census-file-kind/census-file-kind-transformer';
import { censusPackageOfFileTransformer } from '../../../transformers/census-package-of-file/census-package-of-file-transformer';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import { sourceFactsExtractBroker } from '../../source-facts/extract/source-facts-extract-broker';
import { adapterCensusBuildGatewayLayerBroker } from './adapter-census-build-gateway-layer-broker';
import { adapterCensusBuildImportersLayerBroker } from './adapter-census-build-importers-layer-broker';
import { adapterCensusBuildRecordsLayerBroker } from './adapter-census-build-records-layer-broker';
import type { AdapterCensus } from '../../../contracts/adapter-census/adapter-census-contract';
import type { CensusRepoLayout } from '../../../contracts/census-repo-layout/census-repo-layout-contract';
import type { CensusSourceEntry } from '../../../contracts/census-source-entry/census-source-entry-contract';

export const adapterCensusBuildBroker = ({
  layout,
  sources,
  packageFilter,
}: {
  layout: CensusRepoLayout;
  sources: readonly CensusSourceEntry[];
  packageFilter?: string;
}): AdapterCensus => {
  const knownFiles = new Set(sources.map(({ file }) => file));
  const textByFile = new Map(sources.map(({ file, text }) => [file, text] as const));
  const kindByFile = new Map(
    sources.map(({ file }) => [file, censusFileKindTransformer({ file })] as const),
  );
  const factsByFile = new Map(
    sources
      .filter(({ file }) =>
        ['production', 'proxy', 'test', 'barrel'].includes(kindByFile.get(file) ?? ''),
      )
      .map(({ file, text }) => [file, sourceFactsExtractBroker({ file, text })] as const),
  );

  const gatewayPrefix = `${censusLayoutStatics.gatewayRoot}/`;
  const adapterFiles = sources
    .map(({ file }) => file)
    .filter(
      (file) =>
        isAdapterEntryFileGuard({ file }) &&
        kindByFile.get(file) === 'production' &&
        !file.startsWith(gatewayPrefix),
    );

  const implementations = adapterCensusBuildGatewayLayerBroker({
    sources,
    factsByFile,
    textByFile,
    knownFiles,
    layout,
  });
  const importers = adapterCensusBuildImportersLayerBroker({
    sources,
    factsByFile,
    kindByFile,
    knownFiles,
    layout,
    adapterFiles: new Set(adapterFiles),
  });
  const records = adapterCensusBuildRecordsLayerBroker({
    adapterFiles,
    importers,
    kindByFile,
    factsByFile,
    textByFile,
    knownFiles,
    implementations,
    layout,
  });

  const packages = layout.packages
    .filter(
      (pkg) =>
        packageFilter === undefined ||
        pkg.name === packageFilter ||
        pkg.dir === packageFilter ||
        pkg.dir.endsWith(`/${packageFilter}`),
    )
    .map((pkg) => ({
      ...pkg,
      adapters: records.filter(
        (record) =>
          censusPackageOfFileTransformer({ file: record.file, packages: layout.packages })?.dir ===
          pkg.dir,
      ),
    }))
    .filter((pkg) => pkg.adapters.length > 0);

  return adapterCensusContract.parse({
    scope: layout.scope,
    packages,
    totals: adapterCensusTotalsTransformer({ packages }),
  });
};
