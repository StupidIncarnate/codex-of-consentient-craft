import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const sessionQueryRouteBrokerProxy = (): {
  succeeds: ({
    sessionsDir,
    fileNames,
    lineCountByFileName,
  }: {
    sessionsDir: string;
    fileNames: readonly string[];
    lineCountByFileName: Readonly<Record<string, number>>;
  }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const readFileProxy = readFileSyncProxy();

  return {
    succeeds: ({
      sessionsDir,
      fileNames,
      lineCountByFileName,
    }: {
      sessionsDir: string;
      fileNames: readonly string[];
      lineCountByFileName: Readonly<Record<string, number>>;
    }): void => {
      readdirProxy.returns({
        path: sessionsDir,
        entries: fileNames.map((name) => ({ name, kind: 'file' as const })),
      });
      fileNames.forEach((name) => {
        const lineCount = lineCountByFileName[name] ?? 0;
        const contents = Array.from(
          { length: lineCount },
          (_unused, index) => `{"line":${index}}`,
        ).join('\n');
        readFileProxy.returns({
          path: `${sessionsDir}/${name}`,
          contents,
        });
      });
    },
  };
};
