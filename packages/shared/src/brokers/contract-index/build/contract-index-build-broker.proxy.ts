import { contractIndexAssembleBrokerProxy } from '../assemble/contract-index-assemble-broker.proxy';

export const contractIndexBuildBrokerProxy = (): {
  setupSubfolders: ({ dirPath, folders }: { dirPath: string; folders: readonly string[] }) => void;
  setupPackageJson: ({ packageDir, json }: { packageDir: string; json: string }) => void;
  setupWalkedFolder: ({
    dirPath,
    folders,
    files,
  }: {
    dirPath: string;
    folders: readonly string[];
    files: readonly string[];
  }) => void;
  setupSourceText: ({ filePath, text }: { filePath: string; text: string }) => void;
} => {
  const assembleProxy = contractIndexAssembleBrokerProxy();

  return {
    setupSubfolders: assembleProxy.setupSubfolders,
    setupPackageJson: assembleProxy.setupPackageJson,
    setupWalkedFolder: assembleProxy.setupWalkedFolder,
    setupSourceText: assembleProxy.setupSourceText,
  };
};
