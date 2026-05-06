import { chatMainSessionTailBrokerProxy } from '../../chat/main-session-tail/chat-main-session-tail-broker.proxy';

type GuildParams = Parameters<ReturnType<typeof chatMainSessionTailBrokerProxy>['setupGuild']>[0];

export const startMainTailLayerBrokerProxy = (): {
  setupGuild: (params: GuildParams) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  const tailProxy = chatMainSessionTailBrokerProxy();
  return {
    setupGuild: (params: GuildParams): void => {
      tailProxy.setupGuild(params);
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
