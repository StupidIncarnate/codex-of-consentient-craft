import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { chatSubagentTailBrokerProxy } from '../subagent-tail/chat-subagent-tail-broker.proxy';

type GuildConfig = Parameters<
  ReturnType<typeof chatSubagentTailBrokerProxy>['setupGuild']
>[0]['config'];

export const chatStreamProcessHandleBrokerProxy = (): {
  setupSubagentGuild: (params: { config: GuildConfig; homeDir: string }) => void;
  setupSubagentLines: (params: { lines: readonly string[] }) => void;
  triggerSubagentChange: () => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const subagentTailProxy = chatSubagentTailBrokerProxy();

  const uuidMock: SpyOnHandle = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const dateMock: SpyOnHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });

  return {
    setupSubagentGuild: ({ config, homeDir }: { config: GuildConfig; homeDir: string }): void => {
      subagentTailProxy.setupGuild({ config, homeDir });
    },
    setupSubagentLines: ({ lines }: { lines: readonly string[] }): void => {
      subagentTailProxy.setupLines({ lines });
    },
    triggerSubagentChange: (): void => {
      subagentTailProxy.triggerChange();
    },
    setupUuids: ({
      uuids,
    }: {
      uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const uuid of uuids) {
        uuidMock.mockReturnValueOnce(uuid);
      }
    },
    setupTimestamps: ({ timestamps }: { timestamps: readonly string[] }): void => {
      for (const timestamp of timestamps) {
        dateMock.mockReturnValueOnce(timestamp);
      }
    },
  };
};
