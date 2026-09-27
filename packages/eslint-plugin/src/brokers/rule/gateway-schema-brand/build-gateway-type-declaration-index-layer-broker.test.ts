import { FilePathStub, IdentifierStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { buildGatewayTypeDeclarationIndexLayerBroker } from './build-gateway-type-declaration-index-layer-broker';
import { buildGatewayTypeDeclarationIndexLayerBrokerProxy } from './build-gateway-type-declaration-index-layer-broker.proxy';

describe('buildGatewayTypeDeclarationIndexLayerBroker', () => {
  describe('a real gateway package src root', () => {
    it('VALID: {node package src has one declaration file} => indexes it under the type name', () => {
      const proxy = buildGatewayTypeDeclarationIndexLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo/' });
      const srcDir = FilePathStub({ value: '/repo/packages/@gateway/node/src/' });
      const filePath = FilePathStub({
        value: '/repo/packages/@gateway/node/src/walked-file.ts',
      });

      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/npm/src/' }),
      });
      proxy.setupSrcDirWithDeclaration({
        srcDir,
        fileName: FileNameStub({ value: 'walked-file.ts' }),
        filePath,
        sourceText: 'export interface WalkedFile {\n  path: unknown;\n}\n',
      });
      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/browser/src/' }),
      });
      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/bin/src/' }),
      });

      const index = buildGatewayTypeDeclarationIndexLayerBroker({ rootDir });

      expect(index.get(IdentifierStub({ value: 'WalkedFile' }))).toStrictEqual([filePath]);
    });
  });

  describe('a gateway package with no src/ yet', () => {
    it('EMPTY: {src/ missing for every gateway package} => returns an empty index', () => {
      const proxy = buildGatewayTypeDeclarationIndexLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo/' });

      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/npm/src/' }),
      });
      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/node/src/' }),
      });
      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/browser/src/' }),
      });
      proxy.setupSrcDirMissing({
        srcDir: FilePathStub({ value: '/repo/packages/@gateway/bin/src/' }),
      });

      const index = buildGatewayTypeDeclarationIndexLayerBroker({ rootDir });

      expect(Array.from(index.entries())).toStrictEqual([]);
    });
  });
});
