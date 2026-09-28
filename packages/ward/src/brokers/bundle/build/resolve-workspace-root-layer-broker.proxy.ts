import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const resolveWorkspaceRootLayerBrokerProxy = (): {
  declaresWorkspaces: (params: { dirPath: AbsoluteFilePath; patterns: string[] }) => void;
  isAPlainPackage: (params: { dirPath: AbsoluteFilePath; name: string }) => void;
  hasNoManifest: (params: { dirPath: AbsoluteFilePath }) => void;
  hasAnUnparseableManifest: (params: { dirPath: AbsoluteFilePath }) => void;
} => {
  const readProxy = readFileProxy();

  const manifestPathFor = ({
    dirPath,
  }: {
    dirPath: AbsoluteFilePath;
  }): ReturnType<typeof filePathContract.parse> =>
    filePathContract.parse(`${String(dirPath)}/package.json`);

  return {
    declaresWorkspaces: ({
      dirPath,
      patterns,
    }: {
      dirPath: AbsoluteFilePath;
      patterns: string[];
    }): void => {
      readProxy.returns({
        path: manifestPathFor({ dirPath }),
        contents: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
    },
    isAPlainPackage: ({ dirPath, name }: { dirPath: AbsoluteFilePath; name: string }): void => {
      readProxy.returns({
        path: manifestPathFor({ dirPath }),
        contents: JSON.stringify({ name }),
      });
    },
    hasNoManifest: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readProxy.missing({ path: manifestPathFor({ dirPath }) });
    },
    hasAnUnparseableManifest: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readProxy.returns({ path: manifestPathFor({ dirPath }), contents: '{ not json' });
    },
  };
};
