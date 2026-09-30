import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

import type { WardRunResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageLoadBrokerProxy = (): {
  setupRunById: (params: { rootPath: string; runId: WardRunResult['runId']; content: string }) => void;
  setupLatestRun: (params: {
    rootPath: string;
    entries: string[];
    latestEntry: string;
    content: string;
  }) => void;
  setupLatestRunByPath: (params: {
    rootPath: string;
    entries: string[];
    contents: Record<string, string>;
  }) => void;
  setupEmptyDir: (params: { rootPath: string }) => void;
  setupReadFail: (params: { rootPath: string; runId: WardRunResult['runId'] }) => void;
  setupReaddirFail: (params: { rootPath: string }) => void;
} => {
  const readProxy = readFileProxy();
  const readdirProxy = readdirIfExistsProxy();

  const wardDirFor = ({ rootPath }: { rootPath: string }): string =>
    `${rootPath}/.ward`;

  return {
    setupRunById: ({
      rootPath,
      runId,
      content,
    }: {
      rootPath: string;
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
      rootPath: string;
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
      rootPath: string;
      entries: string[];
      contents: Record<string, string>;
    }): void => {
      const dirPath = wardDirFor({ rootPath });
      readdirProxy.returns({ path: String(dirPath), names: entries });
      for (const [filePath, content] of Object.entries(contents)) {
        readProxy.returns({ path: filePath, contents: content });
      }
    },

    setupEmptyDir: ({ rootPath }: { rootPath: string }): void => {
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: [] });
    },

    setupReadFail: ({ rootPath, runId }: { rootPath: string; runId: WardRunResult['runId'] }): void => {
      const path = `${wardDirFor({ rootPath })}/run-${runId}.json`;
      readProxy.missing({ path });
    },

    setupReaddirFail: ({ rootPath }: { rootPath: string }): void => {
      readdirProxy.missing({ path: String(wardDirFor({ rootPath })) });
    },
  };
};
