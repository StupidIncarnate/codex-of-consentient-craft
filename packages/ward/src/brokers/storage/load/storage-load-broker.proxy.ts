import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { type AbsoluteFilePath, type FileContents } from '@dungeonmaster/shared/contracts';

import type { WardRunResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageLoadBrokerProxy = (): {
  setupRunById: (params: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId']; content: string }) => void;
  setupLatestRun: (params: {
    rootPath: AbsoluteFilePath;
    entries: string[];
    latestEntry: string;
    content: string;
  }) => void;
  setupLatestRunByPath: (params: {
    rootPath: AbsoluteFilePath;
    entries: string[];
    contents: Record<string, FileContents>;
  }) => void;
  setupEmptyDir: (params: { rootPath: AbsoluteFilePath }) => void;
  setupReadFail: (params: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }) => void;
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath }) => void;
} => {
  const readProxy = readFileProxy();
  const readdirProxy = readdirIfExistsProxy();

  const wardDirFor = ({ rootPath }: { rootPath: AbsoluteFilePath }): string =>
    `${rootPath}/.ward`;

  return {
    setupRunById: ({
      rootPath,
      runId,
      content,
    }: {
      rootPath: AbsoluteFilePath;
      runId: WardRunResult['runId'];
      content: string;
    }): void => {
      const path = `${wardDirFor({ rootPath })}/run-${runId}.json`;
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
      const path = `${dirPath}/${latestEntry}`;
      readProxy.returns({ path, contents: content });
    },

    setupLatestRunByPath: ({
      rootPath,
      entries,
      contents,
    }: {
      rootPath: AbsoluteFilePath;
      entries: string[];
      contents: Record<string, FileContents>;
    }): void => {
      const dirPath = wardDirFor({ rootPath });
      readdirProxy.returns({ path: String(dirPath), names: entries });
      for (const [filePath, content] of Object.entries(contents)) {
        readProxy.returns({ path: filePath, contents: content });
      }
    },

    setupEmptyDir: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: [] });
    },

    setupReadFail: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }): void => {
      const path = `${wardDirFor({ rootPath })}/run-${runId}.json`;
      readProxy.missing({ path });
    },

    setupReaddirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.missing({ path: String(wardDirFor({ rootPath })) });
    },
  };
};
