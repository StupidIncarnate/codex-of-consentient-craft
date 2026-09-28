import { chatMainSessionTailBrokerProxy } from '../../chat/main-session-tail/chat-main-session-tail-broker.proxy';

type HomeDirParams = Parameters<
  ReturnType<typeof chatMainSessionTailBrokerProxy>['setupHomeDir']
>[0];

export const startMainTailLayerBrokerProxy = (): {
  setupHomeDir: (params: HomeDirParams) => void;
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
} => {
  const tailProxy = chatMainSessionTailBrokerProxy();
  return {
    setupHomeDir: (params: HomeDirParams): void => {
      tailProxy.setupHomeDir(params);
    },
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
    },
  };
};
