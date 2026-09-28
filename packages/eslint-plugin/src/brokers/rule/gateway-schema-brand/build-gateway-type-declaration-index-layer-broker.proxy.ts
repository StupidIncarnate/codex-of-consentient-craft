import { fileContentsContract, type FilePath } from '@dungeonmaster/shared/contracts';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { collectGatewayTypeDeclarationNamesLayerBrokerProxy } from './collect-gateway-type-declaration-names-layer-broker.proxy';

export const buildGatewayTypeDeclarationIndexLayerBrokerProxy = (): {
  setupSrcDirMissing: (args: { srcDir: FilePath }) => void;
  setupSrcDirWithDeclaration: (args: {
    srcDir: FilePath;
    fileName: FileName;
    filePath: FilePath;
    sourceText: string;
  }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const collectProxy = collectGatewayTypeDeclarationNamesLayerBrokerProxy();
  // Real passthrough default: pathJoinAdapter only joins the srcDir strings this proxy's callers
  // already stage exact matches for, so no staging of its own is needed here.
  pathJoinAdapterProxy();

  return {
    setupSrcDirMissing: ({ srcDir }: { srcDir: FilePath }): void => {
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
      srcDir: FilePath;
      fileName: FileName;
      filePath: FilePath;
      sourceText: string;
    }): void => {
      existsProxy.returns({ path: srcDir, exists: true });
      collectProxy.fsReaddirSync.returns({
        dirPath: srcDir,
        entries: [{ name: fileName, isDirectory: false }],
      });
      collectProxy.fsReadFileSync.returns({
        filePath,
        contents: fileContentsContract.parse(sourceText),
      });
    },
  };
};
