import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';
import { tailFileProxy } from '#gateway/node/fs/tail-file/tail-file.proxy';

export const startSubagentTailLayerBrokerProxy = (): {
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  triggerChange: (params: { path: string }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const tailProxy = tailFileProxy();

  return {
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
    },
    triggerChange: ({ path }: { path: string }): void => {
      tailProxy.triggerChange({ path });
    },
  };
};
