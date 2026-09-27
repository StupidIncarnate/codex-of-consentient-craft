import { locationsClaudeSessionsDirFindBrokerProxy } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker.proxy';

export const locationsClaudeSessionFilePathFindBrokerProxy = (): {
  setupSessionFilePath: (params: { userHome: string }) => void;
} => {
  const sessionsDirProxy = locationsClaudeSessionsDirFindBrokerProxy();

  return {
    setupSessionFilePath: ({ userHome }: { userHome: string }): void => {
      sessionsDirProxy.setupSessionsDir({ userHome });
    },
  };
};
