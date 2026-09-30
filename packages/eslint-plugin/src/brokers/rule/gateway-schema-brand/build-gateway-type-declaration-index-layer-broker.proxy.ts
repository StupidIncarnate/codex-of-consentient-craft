import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { collectGatewayTypeDeclarationNamesLayerBrokerProxy } from './collect-gateway-type-declaration-names-layer-broker.proxy';

export const buildGatewayTypeDeclarationIndexLayerBrokerProxy = (): {
  setupSrcDirMissing: (args: { srcDir: string }) => void;
  setupSrcDirWithDeclaration: (args: {
    srcDir: string;
    fileName: FileName;
    filePath: string;
    sourceText: string;
  }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const collectProxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();

  return {
    setupSrcDirMissing: ({ srcDir }: { srcDir: string }): void => {
      existsProxy.returns({ path: srcDir, exists: false });
    },

    // One declaration file directly inside `srcDir` — enough to prove the index walk fires for a
    // real gateway package's src root without restating the recursive-walk cases already covered
    // by collect-gateway-type-declaration-names-layer-broker's own test.
    setupSrcDirWithDeclaration: ({
      srcDir,
      fileName,
      filePath,
      sourceText,
    }: {
      srcDir: string;
      fileName: FileName;
      filePath: string;
      sourceText: string;
    }): void => {
      existsProxy.returns({ path: srcDir, exists: true });
      collectProxy.fsReaddirSync.returns({
        path: srcDir,
        entries: [{ name: fileName, kind: 'file' }],
      });
      collectProxy.fsReadFileSync.returns({
        path: filePath,
        contents: sourceText,
      });
    },
  };
};
