import { adapterCensusBuildRecordsLayerBroker } from './adapter-census-build-records-layer-broker';
import { adapterCensusBuildRecordsLayerBrokerProxy } from './adapter-census-build-records-layer-broker.proxy';
import { GatewayImplementationStub } from '../../../contracts/gateway-implementation/gateway-implementation.stub';
import { CensusPackageStub } from '../../../contracts/census-package/census-package.stub';
import { CensusRepoLayoutStub } from '../../../contracts/census-repo-layout/census-repo-layout.stub';
import { CensusSourceEntryStub } from '../../../contracts/census-source-entry/census-source-entry.stub';
import { censusFileKindTransformer } from '../../../transformers/census-file-kind/census-file-kind-transformer';
import { sourceFactsExtractBroker } from '../../source-facts/extract/source-facts-extract-broker';

const layout = CensusRepoLayoutStub({
  scope: '@acme' as never,
  packages: [
    CensusPackageStub({ name: '@acme/app' as never, dir: 'packages/app' as never }),
    CensusPackageStub({ name: '@acme/lib' as never, dir: 'packages/lib' as never }),
    CensusPackageStub({ name: '@acme/node' as never, dir: 'packages/@gateway/node' as never }),
  ],
});

const source = ({
  file,
  lines,
}: {
  file: string;
  lines: readonly string[];
}): ReturnType<typeof CensusSourceEntryStub> =>
  CensusSourceEntryStub({ file: file as never, text: lines.join('\n') as never });

const prepare = ({ sources }: { sources: readonly ReturnType<typeof CensusSourceEntryStub>[] }) => {
  const knownFiles = new Set(sources.map(({ file }) => file));
  const textByFile = new Map(sources.map(({ file, text }) => [file, text] as const));
  const kindByFile = new Map(
    sources.map(({ file }) => [file, censusFileKindTransformer({ file })] as const),
  );
  const factsByFile = new Map(
    sources.map(({ file, text }) => [file, sourceFactsExtractBroker({ file, text })] as const),
  );
  return { knownFiles, textByFile, kindByFile, factsByFile };
};

describe('adapterCensusBuildRecordsLayerBroker', () => {
  it('VALID: {a pass-through adapter with a matching gateway wrapper and no callers} => a pass-through record with the gateway match', () => {
    adapterCensusBuildRecordsLayerBrokerProxy();
    const adapter = source({
      file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
      lines: [
        "import { readFile } from 'fs/promises';",
        'export const fsReadFileAdapter = (path: string) => readFile(path);',
      ],
    });

    const result = adapterCensusBuildRecordsLayerBroker({
      adapterFiles: [adapter.file],
      importers: new Map(),
      ...prepare({ sources: [adapter] }),
      implementations: [GatewayImplementationStub()],
      layout,
    });

    expect(result).toStrictEqual([
      {
        file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
        exportNames: ['fsReadFileAdapter'],
        shape: 'pass-through',
        reasons: [],
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
        gateway: [{ importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' }],
        productionCallers: [],
        testFiles: [],
        proxyFiles: [],
        adapterProxy: null,
      },
    ]);
  });

  it('VALID: {a proxy that imports the adapter itself} => listed under proxyFiles, not as the adapter proxy', () => {
    adapterCensusBuildRecordsLayerBrokerProxy();
    const adapter = source({
      file: 'packages/app/src/adapters/x/x-adapter.ts',
      lines: ['export const xAdapter = () => 1;'],
    });
    const rawProxy = source({
      file: 'packages/app/src/brokers/a/b/a-b-broker.proxy.ts',
      lines: ["import { xAdapter } from '../../../adapters/x/x-adapter';"],
    });
    const adapterProxy = source({
      file: 'packages/app/src/adapters/x/x-adapter.proxy.ts',
      lines: ['export const xAdapterProxy = () => ({});'],
    });
    const sources = [adapter, rawProxy, adapterProxy];

    const result = adapterCensusBuildRecordsLayerBroker({
      adapterFiles: [adapter.file],
      importers: new Map([[adapter.file, [rawProxy.file, adapterProxy.file]]]),
      ...prepare({ sources }),
      implementations: [],
      layout,
    });

    expect(result.map((record) => [record.proxyFiles, record.adapterProxy])).toStrictEqual([
      [
        ['packages/app/src/brokers/a/b/a-b-broker.proxy.ts'],
        {
          file: 'packages/app/src/adapters/x/x-adapter.proxy.ts',
          catchAll: [],
          composedBy: [],
        },
      ],
    ]);
  });

  it('EMPTY: {an adapter file with no text among the sources} => no record', () => {
    adapterCensusBuildRecordsLayerBrokerProxy();

    const result = adapterCensusBuildRecordsLayerBroker({
      adapterFiles: [source({ file: 'packages/app/src/adapters/x/x-adapter.ts', lines: [] }).file],
      importers: new Map(),
      ...prepare({ sources: [] }),
      implementations: [],
      layout,
    });

    expect(result).toStrictEqual([]);
  });
});
