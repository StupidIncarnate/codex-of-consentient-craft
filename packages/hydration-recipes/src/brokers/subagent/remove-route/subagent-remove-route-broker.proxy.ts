import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';

export const subagentRemoveRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
} => {
  const proxy = rmProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      proxy.succeeds({ path: filePath });
    },
  };
};
