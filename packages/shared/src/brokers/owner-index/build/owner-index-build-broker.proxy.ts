import { ownerIndexAssembleBrokerProxy } from '../assemble/owner-index-assemble-broker.proxy';

export const ownerIndexBuildBrokerProxy = (): {
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
  const assembleProxy = ownerIndexAssembleBrokerProxy();

  return {
    setupSubfolders: assembleProxy.setupSubfolders,
    setupPackageJson: assembleProxy.setupPackageJson,
    setupWalkedFolder: assembleProxy.setupWalkedFolder,
    setupSourceText: assembleProxy.setupSourceText,
  };
};
