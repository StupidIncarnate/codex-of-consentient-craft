import {
  fsReadFileSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
} from '@dungeonmaster/shared/testing';

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
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const readFileProxy = fsReadFileSyncAdapterProxy();

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
        dirPath: sessionsDir as never,
        entries: fileNames.map((name) => ({ name, isFile: () => true }) as never) as never,
      });
      fileNames.forEach((name) => {
        const lineCount = lineCountByFileName[name] ?? 0;
        const content = Array.from(
          { length: lineCount },
          (_unused, index) => `{"line":${index}}`,
        ).join('\n');
        readFileProxy.returns({
          filePath: `${sessionsDir}/${name}` as never,
          content: content as never,
        });
      });
    },
  };
};
