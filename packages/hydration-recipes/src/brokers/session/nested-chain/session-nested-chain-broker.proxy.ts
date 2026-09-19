import { subagentWriteRouteBrokerProxy } from '../../subagent/write-route/subagent-write-route-broker.proxy';

export const sessionNestedChainBrokerProxy = (): {
  succeeds: ({
    subagentFilePaths,
    parentFilePath,
  }: {
    subagentFilePaths: readonly string[];
    parentFilePath: string;
  }) => void;
} => {
  const writeProxy = subagentWriteRouteBrokerProxy();

  return {
    succeeds: ({
      subagentFilePaths,
      parentFilePath,
    }: {
      subagentFilePaths: readonly string[];
      parentFilePath: string;
    }): void => {
      subagentFilePaths.forEach((subagentFilePath) => {
        writeProxy.succeeds({ subagentFilePath, parentFilePath });
      });
    },
  };
};
