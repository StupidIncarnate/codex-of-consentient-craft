import { chatMainSessionTailBrokerProxy } from '../../chat/main-session-tail/chat-main-session-tail-broker.proxy';

type HomeDirParams = Parameters<
  ReturnType<typeof chatMainSessionTailBrokerProxy>['setupHomeDir']
>[0];

export const startMainTailLayerBrokerProxy = (): {
  setupHomeDir: (params: HomeDirParams) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  lastWatchedPath: () => unknown;
} => {
  const tailProxy = chatMainSessionTailBrokerProxy();
  return {
    setupHomeDir: (params: HomeDirParams): void => {
      tailProxy.setupHomeDir(params);
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
    lastWatchedPath: (): unknown => tailProxy.lastWatchedPath(),
  };
};
