import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { collectGatewayTypeDeclarationNamesLayerBroker } from './collect-gateway-type-declaration-names-layer-broker';
import { collectGatewayTypeDeclarationNamesLayerBrokerProxy } from './collect-gateway-type-declaration-names-layer-broker.proxy';

describe('collectGatewayTypeDeclarationNamesLayerBroker', () => {
  describe('one directory, one declaration file', () => {
    it('VALID: {a wrapper folder with one type declaration} => indexes it under the file path', () => {
      const proxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();
      const subpathDirectory = '/repo/packages/@gateway/node/src/fs/';
      const wrapperDirectory = '/repo/packages/@gateway/node/src/fs/walk-files-sync/';
      const walkedFilePath = '/repo/packages/@gateway/node/src/fs/walk-files-sync/walked-file.ts';

      proxy.fsReaddirSync.returns({
        path: subpathDirectory,
        entries: [{ name: 'walk-files-sync', kind: 'directory' }],
      });
      proxy.fsReaddirSync.returns({
        path: wrapperDirectory,
        entries: [
          { name: 'walked-file.ts', kind: 'file' },
          { name: 'walked-file.test.ts', kind: 'file' },
        ],
      });
      proxy.fsReadFileSync.returns({
        path: walkedFilePath,
        contents: 'export interface WalkedFile {\n  path: unknown;\n}\n',
      });

      const index = collectGatewayTypeDeclarationNamesLayerBroker({
        dirPath: subpathDirectory,
        index: new Map(),
      });

      expect(index.get(IdentifierStub({ value: 'WalkedFile' }))).toStrictEqual([walkedFilePath]);
    });
  });

  describe('the same name declared in two files', () => {
    it('VALID: {two files each declaring "Stats"} => indexes both paths under the one name', () => {
      const proxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();
      const subpathDirectory = '/repo/packages/@gateway/node/src/fs/';
      const firstFile = '/repo/packages/@gateway/node/src/fs/stats-a.ts';
      const secondFile = '/repo/packages/@gateway/node/src/fs/stats-b.ts';

      proxy.fsReaddirSync.returns({
        path: subpathDirectory,
        entries: [
          { name: 'stats-a.ts', kind: 'file' },
          { name: 'stats-b.ts', kind: 'file' },
        ],
      });
      proxy.fsReadFileSync.returns({
        path: firstFile,
        contents: 'export interface Stats {\n  size: unknown;\n}\n',
      });
      proxy.fsReadFileSync.returns({
        path: secondFile,
        contents: 'export interface Stats {\n  size: unknown;\n}\n',
      });

      const index = collectGatewayTypeDeclarationNamesLayerBroker({
        dirPath: subpathDirectory,
        index: new Map(),
      });

      expect(index.get(IdentifierStub({ value: 'Stats' }))).toStrictEqual([firstFile, secondFile]);
    });
  });

  describe('test-support and declaration-less files', () => {
    it('EMPTY: {a folder with only a proxy and a plain function wrapper} => returns an empty index', () => {
      const proxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();
      const wrapperDirectory = '/repo/packages/@gateway/node/src/net/is-port-free/';
      const wrapperFile = '/repo/packages/@gateway/node/src/net/is-port-free/is-port-free.ts';

      proxy.fsReaddirSync.returns({
        path: wrapperDirectory,
        entries: [
          { name: 'is-port-free.ts', kind: 'file' },
          { name: 'is-port-free.proxy.ts', kind: 'file' },
          { name: 'is-port-free.test.ts', kind: 'file' },
        ],
      });
      proxy.fsReadFileSync.returns({
        path: wrapperFile,
        contents: 'export const isPortFree = async (): Promise<boolean> => true;\n',
      });

      const index = collectGatewayTypeDeclarationNamesLayerBroker({
        dirPath: wrapperDirectory,
        index: new Map(),
      });

      expect(Array.from(index.entries())).toStrictEqual([]);
    });
  });
});
