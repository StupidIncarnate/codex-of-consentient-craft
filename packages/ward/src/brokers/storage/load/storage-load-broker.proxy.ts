import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FileContents,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageLoadBrokerProxy = (): {
  setupRunById: (params: { rootPath: AbsoluteFilePath; runId: WardResult['runId']; content: string }) => void;
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
  setupReadFail: (params: { rootPath: AbsoluteFilePath; runId: WardResult['runId'] }) => void;
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath }) => void;
} => {
  const readProxy = readFileProxy();
  const readdirProxy = readdirIfExistsProxy();

  const wardDirFor = ({ rootPath }: { rootPath: AbsoluteFilePath }): FilePath =>
    filePathContract.parse(`${rootPath}/.ward`);

  return {
    setupRunById: ({
      rootPath,
      runId,
      content,
    }: {
      rootPath: AbsoluteFilePath;
      runId: WardResult['runId'];
      content: string;
    }): void => {
      const path = filePathContract.parse(`${wardDirFor({ rootPath })}/run-${runId}.json`);
      readProxy.returns({ path, contents: content });
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
      readdirProxy.returns({ path: String(dirPath), names: entries });
      const path = filePathContract.parse(`${dirPath}/${latestEntry}`);
      readProxy.returns({ path, contents: content });
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
      readdirProxy.returns({ path: String(dirPath), names: entries });
      for (const [filePath, content] of Object.entries(contents)) {
        readProxy.returns({ path: filePathContract.parse(filePath), contents: content });
      }
    },

    setupEmptyDir: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: [] });
    },

    setupReadFail: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: WardResult['runId'] }): void => {
      const path = filePathContract.parse(`${wardDirFor({ rootPath })}/run-${runId}.json`);
      readProxy.missing({ path });
    },

    setupReaddirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.missing({ path: String(wardDirFor({ rootPath })) });
    },
  };
};
