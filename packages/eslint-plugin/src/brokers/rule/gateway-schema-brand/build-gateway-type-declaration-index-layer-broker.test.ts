import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { buildGatewayTypeDeclarationIndexLayerBroker } from './build-gateway-type-declaration-index-layer-broker';
import { buildGatewayTypeDeclarationIndexLayerBrokerProxy } from './build-gateway-type-declaration-index-layer-broker.proxy';

describe('buildGatewayTypeDeclarationIndexLayerBroker', () => {
  describe('a real gateway package src root', () => {
    it('VALID: {node package src has one declaration file} => indexes it under the type name', () => {
      const proxy = buildGatewayTypeDeclarationIndexLayerBrokerProxy();
      const rootDir = '/repo/';
      const srcDir = '/repo/packages/@gateway/node/src/';
      const filePath = '/repo/packages/@gateway/node/src/walked-file.ts';

      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/npm/src/',
      });
      proxy.setupSrcDirWithDeclaration({
        srcDir,
        fileName: FileNameStub({ value: 'walked-file.ts' }),
        filePath,
        sourceText: 'export interface WalkedFile {\n  path: unknown;\n}\n',
      });
      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/browser/src/',
      });
      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/bin/src/',
      });

      const index = buildGatewayTypeDeclarationIndexLayerBroker({ rootDir });

      expect(index.get(IdentifierStub({ value: 'WalkedFile' }))).toStrictEqual([filePath]);
    });
  });

  describe('a gateway package with no src/ yet', () => {
    it('EMPTY: {src/ missing for every gateway package} => returns an empty index', () => {
      const proxy = buildGatewayTypeDeclarationIndexLayerBrokerProxy();
      const rootDir = '/repo/';

      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/npm/src/',
      });
      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/node/src/',
      });
      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/browser/src/',
      });
      proxy.setupSrcDirMissing({
        srcDir: '/repo/packages/@gateway/bin/src/',
      });

      const index = buildGatewayTypeDeclarationIndexLayerBroker({ rootDir });

      expect(Array.from(index.entries())).toStrictEqual([]);
    });
  });
});
