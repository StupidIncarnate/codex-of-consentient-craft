import { adapterCensusBuildBroker } from './adapter-census-build-broker';
import { adapterCensusBuildBrokerProxy } from './adapter-census-build-broker.proxy';
import { CensusRepoLayoutStub } from '../../../contracts/census-repo-layout/census-repo-layout.stub';
import { CensusPackageStub } from '../../../contracts/census-package/census-package.stub';
import { AdapterRecordStub } from '../../../contracts/adapter-record/adapter-record.stub';
import { CensusSourceEntryStub } from '../../../contracts/census-source-entry/census-source-entry.stub';

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

const sources = [
  source({
    file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    lines: [
      "import { readFile } from 'fs/promises';",
      "export const fsReadFileAdapter = ({ path }: { path: string }) => readFile(path, 'utf8');",
    ],
  }),
  source({
    file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
    lines: [
      "import { registerMock } from '@acme/testing/register-mock';",
      'export const fsReadFileAdapterProxy = () => {',
      '  registerMock({ fn: run }).calledWith([]).returns(1);',
      '  return {};',
      '};',
    ],
  }),
  source({
    file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.test.ts',
    lines: ["import { fsReadFileAdapter } from './fs-read-file-adapter';"],
  }),
  source({
    file: 'packages/app/src/brokers/x/y/x-y-broker.ts',
    lines: [
      "import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';",
      'export const xYBroker = () => fsReadFileAdapter({ path: "a" });',
    ],
  }),
  source({
    file: 'packages/app/src/brokers/x/y/x-y-broker.proxy.ts',
    lines: [
      "import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';",
      'export const xYBrokerProxy = () => fsReadFileAdapterProxy();',
    ],
  }),
  source({
    file: 'packages/app/src/responders/r/z/r-z-responder.ts',
    lines: [
      "import { xYBroker } from '../../../brokers/x/y/x-y-broker';",
      'export const RZResponder = () => xYBroker();',
    ],
  }),
  source({
    file: 'packages/app/src/responders/r/z/r-z-responder.proxy.ts',
    lines: [
      "import { xYBrokerProxy } from '../../../brokers/x/y/x-y-broker.proxy';",
      'export const RZResponderProxy = () => {',
      '  handle.onceFor([() => true]).returns(1);',
      '  return xYBrokerProxy();',
      '};',
    ],
  }),
  source({
    file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
    lines: [
      "import { createServer } from 'net';",
      'export const netCheckAdapter = () => {',
      '  try {',
      '    return createServer();',
      '  } catch (error) {',
      '    throw error;',
      '  }',
      '};',
    ],
  }),
  source({
    file: 'packages/lib/adapters.ts',
    lines: ["export * from './src/adapters/net/check/net-check-adapter';"],
  }),
  source({
    file: 'packages/app/src/brokers/z/w/z-w-broker.ts',
    lines: [
      "import { netCheckAdapter } from '@acme/lib/adapters';",
      'export const zWBroker = () => netCheckAdapter();',
    ],
  }),
  source({
    file: 'packages/@gateway/node/src/fs__promises/fs__promises.ts',
    lines: ["export * from 'fs/promises';", "export { readFile } from './read-file/read-file';"],
  }),
  source({
    file: 'packages/@gateway/node/src/fs__promises/read-file/read-file.ts',
    lines: [
      "import { readFile as read } from 'fs/promises';",
      "export const readFile = (path: string) => read(path, 'utf8');",
    ],
  }),
];

const readFileRecord = AdapterRecordStub({
  file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
  exportNames: ['fsReadFileAdapter'],
  shape: 'pass-through',
  reasons: [],
  outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
  gateway: [{ importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' }],
  productionCallers: [
    {
      file: 'packages/app/src/brokers/x/y/x-y-broker.ts',
      proxyFile: 'packages/app/src/brokers/x/y/x-y-broker.proxy.ts',
      composedBy: ['packages/app/src/responders/r/z/r-z-responder.proxy.ts'],
      catchAll: [
        {
          file: 'packages/app/src/responders/r/z/r-z-responder.proxy.ts',
          sites: [
            { line: 3, kind: 'accept-all-predicate', snippet: 'handle.onceFor([() => true])' },
          ],
        },
      ],
    },
  ],
  testFiles: ['packages/app/src/adapters/fs/read-file/fs-read-file-adapter.test.ts'],
  proxyFiles: [],
  adapterProxy: {
    file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
    catchAll: [
      {
        line: 3,
        kind: 'empty-address',
        snippet: 'registerMock({ fn: run }).calledWith([])',
      },
    ],
    composedBy: ['packages/app/src/brokers/x/y/x-y-broker.proxy.ts'],
  },
});

const netCheckRecord = AdapterRecordStub({
  file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
  exportNames: ['netCheckAdapter'],
  shape: 'logic',
  reasons: ['no-gateway-export', 'try-catch'],
  outsideCalls: [{ module: 'net', name: 'createServer' }],
  gateway: [],
  productionCallers: [
    {
      file: 'packages/app/src/brokers/z/w/z-w-broker.ts',
      proxyFile: null,
      composedBy: [],
      catchAll: [],
    },
  ],
  testFiles: [],
  proxyFiles: [],
  adapterProxy: null,
});

describe('adapterCensusBuildBroker', () => {
  it('VALID: {a repo with a pass-through and a logic adapter} => one record each, grouped by package, with totals', () => {
    adapterCensusBuildBrokerProxy();

    const result = adapterCensusBuildBroker({ layout, sources });

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [
        { name: '@acme/app', dir: 'packages/app', adapters: [readFileRecord] },
        { name: '@acme/lib', dir: 'packages/lib', adapters: [netCheckRecord] },
      ],
      totals: {
        adapters: 2,
        passThrough: 1,
        logic: 1,
        productionCallers: 2,
        composingProxies: 1,
        catchAllProxies: 1,
      },
    });
  });

  it.each(['@acme/lib', 'packages/lib', 'lib'])(
    'VALID: {packageFilter: %s} => only that package is reported',
    (packageFilter) => {
      adapterCensusBuildBrokerProxy();

      const result = adapterCensusBuildBroker({ layout, sources, packageFilter });

      expect(result.packages.map((pkg) => pkg.name)).toStrictEqual(['@acme/lib']);
    },
  );

  it('EMPTY: {packageFilter naming no package} => no packages and zero totals', () => {
    adapterCensusBuildBrokerProxy();

    const result = adapterCensusBuildBroker({ layout, sources, packageFilter: 'nothing' });

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [],
      totals: {
        adapters: 0,
        passThrough: 0,
        logic: 0,
        productionCallers: 0,
        composingProxies: 0,
        catchAllProxies: 0,
      },
    });
  });

  it('EMPTY: {no sources} => an empty census', () => {
    adapterCensusBuildBrokerProxy();

    const result = adapterCensusBuildBroker({ layout, sources: [] });

    expect(result.packages).toStrictEqual([]);
  });
});
