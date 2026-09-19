import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';

export const subagentRemoveRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
} => {
  const rmProxy = fsRmAdapterProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      rmProxy.succeeds({ filePath });
    },
  };
};
