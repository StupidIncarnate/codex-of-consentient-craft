import { adapterCensusBuildGatewayLayerBroker } from './adapter-census-build-gateway-layer-broker';
import { adapterCensusBuildGatewayLayerBrokerProxy } from './adapter-census-build-gateway-layer-broker.proxy';
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

describe('adapterCensusBuildGatewayLayerBroker', () => {
  it('VALID: {a barrel with a wrapper, an export * and an alias-importing wrapper file} => the wrapper with the outside calls of its own file', () => {
    adapterCensusBuildGatewayLayerBrokerProxy();
    const sources = [
      source({
        file: 'packages/@gateway/node/src/fs__promises/fs__promises.ts',
        lines: [
          "export * from 'fs/promises';",
          "export { readFile, readFileIfExists } from './read-file/read-file';",
        ],
      }),
      source({
        file: 'packages/@gateway/node/src/fs__promises/read-file/read-file.ts',
        lines: [
          "import { readFile as read } from 'fs/promises';",
          "export const readFile = (path: string) => read(path, 'utf8');",
          'export const readFileIfExists = (path: string) => path;',
        ],
      }),
    ];

    const result = adapterCensusBuildGatewayLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
    });

    expect(result).toStrictEqual([
      {
        importPath: '#gateway/node/fs__promises',
        name: 'readFile',
        moduleDir: 'fs__promises',
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
      },
      {
        importPath: '#gateway/node/fs__promises',
        name: 'readFileIfExists',
        moduleDir: 'fs__promises',
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
      },
    ]);
  });

  it('EDGE: {a barrel re-exporting a file that is not in the sources} => the wrapper with no outside calls', () => {
    adapterCensusBuildGatewayLayerBrokerProxy();
    const sources = [
      source({
        file: 'packages/@gateway/npm/src/glob/glob.ts',
        lines: ["export { glob } from './glob/glob';"],
      }),
    ];

    const result = adapterCensusBuildGatewayLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
    });

    expect(result).toStrictEqual([
      { importPath: '#gateway/npm/glob', name: 'glob', moduleDir: 'glob', outsideCalls: [] },
    ]);
  });

  it('EMPTY: {no gateway barrel among the sources} => no implementations', () => {
    adapterCensusBuildGatewayLayerBrokerProxy();
    const sources = [
      source({ file: 'packages/app/src/x/x-broker.ts', lines: ["export { a } from './a';"] }),
    ];

    const result = adapterCensusBuildGatewayLayerBroker({
      sources,
      ...prepare({ sources }),
      layout,
    });

    expect(result).toStrictEqual([]);
  });
});
