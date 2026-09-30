import { walkGatewayCrossingsLayerBroker } from './walk-gateway-crossings-layer-broker';
import { walkGatewayCrossingsLayerBrokerProxy } from './walk-gateway-crossings-layer-broker.proxy';
import { GatewayPackageNameStub } from '../../../contracts/gateway-package-name/gateway-package-name.stub';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

describe('walkGatewayCrossingsLayerBroker', () => {
  describe('direct crossing', () => {
    it('VALID: {entry file imports the gateway directly} => reports one chain of one hop', async () => {
      walkGatewayCrossingsLayerBrokerProxy();
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { readFile } from '@dungeonmaster/node/fs';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([['@dungeonmaster/node/fs']]);
    });

    it('VALID: {entry file imports "#gateway/node/fs" directly} => reports one chain naming the real package', async () => {
      walkGatewayCrossingsLayerBrokerProxy();
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { readFile } from '#gateway/node/fs';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [
          ProjectFolderStub({ name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node' }),
        ],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([['@dungeonmaster/node/fs']]);
    });

    it('EMPTY: {entry file imports "#gateway/browser/localStorage", browser is not forbidden} => reports no chains', async () => {
      const proxy = walkGatewayCrossingsLayerBrokerProxy();
      const targetPath = '/repo/packages/@gateway/browser/src/localStorage';
      proxy.setupMissing({ filePath: `${targetPath}.ts` });
      proxy.setupMissing({ filePath: `${targetPath}.tsx` });
      proxy.setupMissing({ filePath: `${targetPath}/index.ts` });
      proxy.setupMissing({ filePath: `${targetPath}/index.tsx` });
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { getItem } from '#gateway/browser/localStorage';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [
          ProjectFolderStub({
            name: '@dungeonmaster/browser',
            path: '/repo/packages/@gateway/browser',
          }),
        ],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry file imports nothing forbidden} => reports no chains', async () => {
      walkGatewayCrossingsLayerBrokerProxy();
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { z } from 'zod';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multi-hop crossing through a relative file', () => {
    it('VALID: {entry imports a helper that imports the gateway} => reports the two-hop chain', async () => {
      const proxy = walkGatewayCrossingsLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/helper.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const helper = () => readFile();",
      });
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { helper } from './helper';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([['./helper', '@dungeonmaster/node/fs']]);
    });
  });

  describe('barrel narrowing', () => {
    it("VALID: {named import through a barrel reaches only the requested export's crossing} => reports only that one chain", async () => {
      const proxy = walkGatewayCrossingsLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/brokers.ts',
        content: "export * from './user-fetch-broker';\nexport * from './other-broker';",
      });
      proxy.setupFile({
        filePath: '/repo/user-fetch-broker.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const userFetchBroker = () => readFile();",
      });
      proxy.setupFile({
        filePath: '/repo/other-broker.ts',
        content:
          "import { fetchOther } from '@dungeonmaster/node/fetch-other';\nexport const otherBroker = () => fetchOther();",
      });
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { userFetchBroker } from './brokers';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([
        ['./brokers', './user-fetch-broker', '@dungeonmaster/node/fs'],
      ]);
    });
  });

  describe('cycle guard', () => {
    it('EDGE: {two files import each other, neither crosses the gateway} => reports no chains and terminates', async () => {
      const proxy = walkGatewayCrossingsLayerBrokerProxy();
      const entryPath = '/repo/a.ts';
      const entryContent = "import { b } from './b';\nexport const a = 1;";
      // The walk re-reads a file's content when checking whether following an edge back to it
      // would be a cycle, even though it then discards the read and skips recursing — so the
      // entry's own content must be staged too, not only handed to the top-level call.
      proxy.setupFile({ filePath: entryPath, content: entryContent });
      proxy.setupFile({
        filePath: '/repo/b.ts',
        content: "import { a } from './a';\nexport const b = () => a;",
      });

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: entryContent,
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('diamond', () => {
    it('VALID: {two files both import the same shared file that crosses the gateway} => reports one chain per incoming path and terminates', async () => {
      const proxy = walkGatewayCrossingsLayerBrokerProxy();
      proxy.setupFile({
        filePath: '/repo/a.ts',
        content: "import { shared } from './shared';\nexport const a = () => shared();",
      });
      proxy.setupFile({
        filePath: '/repo/b.ts',
        content: "import { shared } from './shared';\nexport const b = () => shared();",
      });
      proxy.setupFile({
        filePath: '/repo/shared.ts',
        content:
          "import { readFile } from '@dungeonmaster/node/fs';\nexport const shared = () => readFile();",
      });
      const entryPath = '/repo/entry.ts';

      const result = await walkGatewayCrossingsLayerBroker({
        filePath: entryPath,
        content: "import { a } from './a';\nimport { b } from './b';",
        requestedNames: 'all',
        pathHistory: [entryPath],
        chainLabels: [],
        knownPackages: [],
        forbiddenPackageNames: [GatewayPackageNameStub()],
      });

      expect(result).toStrictEqual([
        ['./a', './shared', '@dungeonmaster/node/fs'],
        ['./b', './shared', '@dungeonmaster/node/fs'],
      ]);
    });
  });
});
