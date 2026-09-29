import { adapterCensusBuildImportersLayerBroker } from './adapter-census-build-importers-layer-broker';
import { adapterCensusBuildImportersLayerBrokerProxy } from './adapter-census-build-importers-layer-broker.proxy';
import { CensusPackageStub } from '../../../contracts/census-package/census-package.stub';
import { CensusRepoLayoutStub } from '../../../contracts/census-repo-layout/census-repo-layout.stub';
import { CensusSourceEntryStub } from '../../../contracts/census-source-entry/census-source-entry.stub';
import { censusFileKindTransformer } from '../../../transformers/census-file-kind/census-file-kind-transformer';
import { sourceFactsExtractBroker } from '../../source-facts/extract/source-facts-extract-broker';

const layout = CensusRepoLayoutStub({
  scope: '@acme',
  packages: [
    CensusPackageStub({ name: '@acme/app', dir: 'packages/app' }),
    CensusPackageStub({ name: '@acme/lib', dir: 'packages/lib' }),
    CensusPackageStub({ name: '@acme/node', dir: 'packages/@gateway/node' }),
  ],
});

const source = ({
  file,
  lines,
}: {
  file: string;
  lines: readonly string[];
}): ReturnType<typeof CensusSourceEntryStub> =>
  CensusSourceEntryStub({ file, text: lines.join('\n') });

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

describe('adapterCensusBuildImportersLayerBroker', () => {
  it('VALID: {a relative import, a barrel import, a proxy import and a barrel name that is not an adapter} => each importer listed under the file that defines the name, the other left out', () => {
    adapterCensusBuildImportersLayerBrokerProxy();
    const sources = [
      source({
        file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
        lines: ['export const netCheckAdapter = () => 1;'],
      }),
      source({
        file: 'packages/lib/src/adapters/net/check/net-check-adapter.proxy.ts',
        lines: ['export const netCheckAdapterProxy = () => ({});'],
      }),
      source({
        file: 'packages/lib/adapters.ts',
        lines: ["export * from './src/adapters/net/check/net-check-adapter';"],
      }),
      source({
        file: 'packages/app/src/brokers/a/b/a-b-broker.ts',
        lines: ["import { netCheckAdapter } from '@acme/lib/adapters';"],
      }),
      source({
        file: 'packages/lib/src/adapters/net/check/net-check-adapter.test.ts',
        lines: ["import { netCheckAdapter } from './net-check-adapter';"],
      }),
      source({
        file: 'packages/app/src/brokers/a/b/a-b-broker.proxy.ts',
        lines: [
          "import { netCheckAdapterProxy } from '@acme/lib/src/adapters/net/check/net-check-adapter.proxy';",
        ],
      }),
      source({
        file: 'packages/app/src/brokers/a/c/a-c-broker.ts',
        lines: ["import { somethingElse } from '@acme/lib/adapters';"],
      }),
    ];
    const adapter = source({
      file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
      lines: [],
    }).file;

    const result = adapterCensusBuildImportersLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
      adapterFiles: new Set([adapter]),
    });

    expect([...result.entries()]).toStrictEqual([
      [
        'packages/lib/src/adapters/net/check/net-check-adapter.ts',
        [
          'packages/app/src/brokers/a/b/a-b-broker.ts',
          'packages/lib/src/adapters/net/check/net-check-adapter.test.ts',
        ],
      ],
      [
        'packages/lib/src/adapters/net/check/net-check-adapter.proxy.ts',
        ['packages/app/src/brokers/a/b/a-b-broker.proxy.ts'],
      ],
    ]);
  });

  it('EDGE: {two adapters with the same file stem in different packages} => importers are not merged', () => {
    adapterCensusBuildImportersLayerBrokerProxy();
    const sources = [
      source({
        file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
        lines: ['export const fsReadFileAdapter = () => 1;'],
      }),
      source({
        file: 'packages/lib/src/adapters/fs/read-file/fs-read-file-adapter.ts',
        lines: ['export const fsReadFileAdapter = () => 2;'],
      }),
      source({
        file: 'packages/lib/src/brokers/x/y/x-y-broker.ts',
        lines: [
          "import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';",
        ],
      }),
    ];
    const adapters = sources.slice(0, 2).map(({ file }) => file);

    const result = adapterCensusBuildImportersLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
      adapterFiles: new Set(adapters),
    });

    expect([...result.entries()]).toStrictEqual([
      [
        'packages/lib/src/adapters/fs/read-file/fs-read-file-adapter.ts',
        ['packages/lib/src/brokers/x/y/x-y-broker.ts'],
      ],
    ]);
  });

  it('EMPTY: {an import of an unrelated file} => no entries', () => {
    adapterCensusBuildImportersLayerBrokerProxy();
    const sources = [
      source({ file: 'packages/app/src/x/x-broker.ts', lines: ["import { y } from './y';"] }),
      source({ file: 'packages/app/src/x/y.ts', lines: ['export const y = 1;'] }),
    ];

    const result = adapterCensusBuildImportersLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
      adapterFiles: new Set(),
    });

    expect([...result.entries()]).toStrictEqual([]);
  });
});
