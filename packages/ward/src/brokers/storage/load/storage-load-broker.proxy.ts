import {
  filePathContract,
  type AbsoluteFilePath,
  type FileContents,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const storageLoadBrokerProxy = (): {
  setupRunById: (params: { rootPath: AbsoluteFilePath; runId: RunId; content: string }) => void;
  setupLatestRun: (params: {
    rootPath: AbsoluteFilePath;
    entries: string[];
    latestEntry: string;
    content: string;
  }) => void;
  setupLatestRunByPath: (params: {
    rootPath: AbsoluteFilePath;
    entries: string[];
    contents: Record<FilePath, FileContents>;
  }) => void;
  setupEmptyDir: (params: { rootPath: AbsoluteFilePath }) => void;
  setupReadFail: (params: { rootPath: AbsoluteFilePath; runId: RunId; error: Error }) => void;
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();

  const wardDirFor = ({ rootPath }: { rootPath: AbsoluteFilePath }): FilePath =>
    filePathContract.parse(`${rootPath}/.ward`);

  return {
    setupRunById: ({
      rootPath,
      runId,
      content,
    }: {
      rootPath: AbsoluteFilePath;
      runId: RunId;
      content: string;
    }): void => {
      const filePath = filePathContract.parse(`${wardDirFor({ rootPath })}/run-${runId}.json`);
      readFileProxy.returns({ filePath, content });
    },

    setupLatestRun: ({
      rootPath,
      entries,
      latestEntry,
      content,
    }: {
      rootPath: AbsoluteFilePath;
      entries: string[];
      latestEntry: string;
      content: string;
    }): void => {
      const dirPath = wardDirFor({ rootPath });
      readdirProxy.returns({ dirPath, entries });
      const filePath = filePathContract.parse(`${dirPath}/${latestEntry}`);
      readFileProxy.returns({ filePath, content });
    },

    setupLatestRunByPath: ({
      rootPath,
      entries,
      contents,
    }: {
      rootPath: AbsoluteFilePath;
      entries: string[];
      contents: Record<FilePath, FileContents>;
    }): void => {
      const dirPath = wardDirFor({ rootPath });
      readdirProxy.returns({ dirPath, entries });
      for (const [filePath, content] of Object.entries(contents)) {
        readFileProxy.returns({ filePath: filePathContract.parse(filePath), content });
      }
    },

    setupEmptyDir: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ dirPath: wardDirFor({ rootPath }), entries: [] });
    },

    setupReadFail: ({
      rootPath,
      runId,
      error,
    }: {
      rootPath: AbsoluteFilePath;
      runId: RunId;
      error: Error;
    }): void => {
      const filePath = filePathContract.parse(`${wardDirFor({ rootPath })}/run-${runId}.json`);
      readFileProxy.throws({ filePath, error });
    },

    setupReaddirFail: ({ rootPath, error }: { rootPath: AbsoluteFilePath; error: Error }): void => {
      readdirProxy.throws({ dirPath: wardDirFor({ rootPath }), error });
    },
  };
};
