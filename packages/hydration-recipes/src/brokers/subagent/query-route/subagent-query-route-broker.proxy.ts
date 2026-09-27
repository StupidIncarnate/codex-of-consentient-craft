import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const subagentQueryRouteBrokerProxy = (): {
  succeeds: ({
    parentFilePath,
    parentContents,
    subagentsDirPath,
    fileNames,
  }: {
    parentFilePath: string;
    parentContents: string;
    subagentsDirPath: string;
    fileNames: readonly string[];
  }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const readFileProxy = readFileSyncProxy();

  return {
    succeeds: ({
      parentFilePath,
      parentContents,
      subagentsDirPath,
      fileNames,
    }: {
      parentFilePath: string;
      parentContents: string;
      subagentsDirPath: string;
      fileNames: readonly string[];
    }): void => {
      readFileProxy.returns({
        path: parentFilePath,
        contents: parentContents,
      });
      readdirProxy.returns({
        path: subagentsDirPath,
        entries: fileNames.map((name) => ({ name, kind: 'file' as const })),
      });
      fileNames.forEach((name) => {
        readFileProxy.returns({
          path: `${subagentsDirPath}/${name}`,
          contents: '{"line":0}',
        });
      });
    },
  };
};
