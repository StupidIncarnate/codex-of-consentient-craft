import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

export const startSubagentTailLayerBrokerProxy = (): {
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
