import { contractIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/contract-index/build/contract-index-build-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

export const layerContractCheckLayerBrokerProxy = (): {
  setupProject: ({
    root,
    contracts,
  }: {
    root: string;
    contracts: readonly { folder: string; file: string; text: string }[];
  }) => void;
  setupMissingFile: ({ filePath }: { filePath: string }) => void;
} => {
  const indexProxy = contractIndexBuildBrokerProxy();
  const readProxy = readFileSyncIfExistsProxy();

  return {
    // One package, `alpha`, holding the given contract files. The index is built once per root and
    // then read back, so every scenario in a test file uses a root of its own.
    setupProject: ({ root, contracts }): void => {
      const packageDir = AbsoluteFilePathStub({ value: `${root}/packages/alpha` });
      const contractsDir = `${packageDir}/src/contracts`;
      const folders = [...new Set(contracts.map(({ folder }) => folder))];

      indexProxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: `${root}/packages` }),
        folders: ['alpha'],
      });
      indexProxy.setupPackageJson({ packageDir, json: '{"name":"@project/alpha"}' });
      indexProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
      indexProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${packageDir}/src` }),
        folders: ['contracts'],
        files: [],
      });
      indexProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: contractsDir }),
        folders,
        files: [],
      });

      for (const folder of folders) {
        indexProxy.setupWalkedFolder({
          dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/${folder}` }),
          folders: [],
          files: contracts.filter((contract) => contract.folder === folder).map(({ file }) => file),
        });
      }

      for (const { folder, file, text } of contracts) {
        indexProxy.setupSourceText({
          filePath: AbsoluteFilePathStub({ value: `${contractsDir}/${folder}/${file}` }),
          text,
        });
      }
    },

    setupMissingFile: ({ filePath }): void => {
      readProxy.missing({ path: filePath });
    },
  };
};
