import {
  fsReadFileSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
} from '@dungeonmaster/shared/testing';

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
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const readFileProxy = fsReadFileSyncAdapterProxy();

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
        filePath: parentFilePath as never,
        content: parentContents as never,
      });
      readdirProxy.returns({
        dirPath: subagentsDirPath as never,
        entries: fileNames.map((name) => ({ name, isFile: () => true }) as never) as never,
      });
      fileNames.forEach((name) => {
        readFileProxy.returns({
          filePath: `${subagentsDirPath}/${name}` as never,
          content: '{"line":0}' as never,
        });
      });
    },
  };
};
