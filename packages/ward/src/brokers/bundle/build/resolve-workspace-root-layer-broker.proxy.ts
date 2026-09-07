import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const resolveWorkspaceRootLayerBrokerProxy = (): {
  declaresWorkspaces: (params: { dirPath: AbsoluteFilePath; patterns: string[] }) => void;
  isAPlainPackage: (params: { dirPath: AbsoluteFilePath; name: string }) => void;
  hasNoManifest: (params: { dirPath: AbsoluteFilePath }) => void;
  hasAnUnparseableManifest: (params: { dirPath: AbsoluteFilePath }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

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
        filePath: manifestPathFor({ dirPath }),
        content: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
    },
    isAPlainPackage: ({ dirPath, name }: { dirPath: AbsoluteFilePath; name: string }): void => {
      readProxy.returns({
        filePath: manifestPathFor({ dirPath }),
        content: JSON.stringify({ name }),
      });
    },
    hasNoManifest: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readProxy.throws({
        filePath: manifestPathFor({ dirPath }),
        error: new Error('ENOENT: no such file or directory'),
      });
    },
    hasAnUnparseableManifest: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readProxy.returns({ filePath: manifestPathFor({ dirPath }), content: '{ not json' });
    },
  };
};
