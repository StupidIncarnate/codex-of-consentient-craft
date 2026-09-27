import { FilePathStub, IdentifierStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { collectGatewayTypeDeclarationNamesLayerBroker } from './collect-gateway-type-declaration-names-layer-broker';
import { collectGatewayTypeDeclarationNamesLayerBrokerProxy } from './collect-gateway-type-declaration-names-layer-broker.proxy';

describe('collectGatewayTypeDeclarationNamesLayerBroker', () => {
  describe('one directory, one declaration file', () => {
    it('VALID: {a wrapper folder with one type declaration} => indexes it under the file path', () => {
      const proxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();
      const subpathDirectory = FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/',
      });
      const wrapperDirectory = FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/walk-files-sync/',
      });
      const walkedFilePath = FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/walk-files-sync/walked-file.ts',
      });

      proxy.fsReaddirSync.returns({
        dirPath: subpathDirectory,
        entries: [{ name: FileNameStub({ value: 'walk-files-sync' }), isDirectory: true }],
      });
      proxy.fsReaddirSync.returns({
        dirPath: wrapperDirectory,
        entries: [
          { name: FileNameStub({ value: 'walked-file.ts' }), isDirectory: false },
          { name: FileNameStub({ value: 'walked-file.test.ts' }), isDirectory: false },
        ],
      });
      proxy.fsReadFileSync.returns({
        filePath: walkedFilePath,
        contents: FileContentsStub({
          value: 'export interface WalkedFile {\n  path: unknown;\n}\n',
        }),
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
      const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/' });
      const firstFile = FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/stats-a.ts',
      });
      const secondFile = FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/stats-b.ts',
      });

      proxy.fsReaddirSync.returns({
        dirPath: subpathDirectory,
        entries: [
          { name: FileNameStub({ value: 'stats-a.ts' }), isDirectory: false },
          { name: FileNameStub({ value: 'stats-b.ts' }), isDirectory: false },
        ],
      });
      proxy.fsReadFileSync.returns({
        filePath: firstFile,
        contents: FileContentsStub({ value: 'export interface Stats {\n  size: unknown;\n}\n' }),
      });
      proxy.fsReadFileSync.returns({
        filePath: secondFile,
        contents: FileContentsStub({ value: 'export interface Stats {\n  size: unknown;\n}\n' }),
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
      const wrapperDirectory = FilePathStub({
        value: '/repo/packages/@gateway/node/src/net/is-port-free/',
      });
      const wrapperFile = FilePathStub({
        value: '/repo/packages/@gateway/node/src/net/is-port-free/is-port-free.ts',
      });

      proxy.fsReaddirSync.returns({
        dirPath: wrapperDirectory,
        entries: [
          { name: FileNameStub({ value: 'is-port-free.ts' }), isDirectory: false },
          { name: FileNameStub({ value: 'is-port-free.proxy.ts' }), isDirectory: false },
          { name: FileNameStub({ value: 'is-port-free.test.ts' }), isDirectory: false },
        ],
      });
      proxy.fsReadFileSync.returns({
        filePath: wrapperFile,
        contents: FileContentsStub({
          value: 'export const isPortFree = async (): Promise<boolean> => true;\n',
        }),
      });

      const index = collectGatewayTypeDeclarationNamesLayerBroker({
        dirPath: wrapperDirectory,
        index: new Map(),
      });

      expect(Array.from(index.entries())).toStrictEqual([]);
    });
  });
});
