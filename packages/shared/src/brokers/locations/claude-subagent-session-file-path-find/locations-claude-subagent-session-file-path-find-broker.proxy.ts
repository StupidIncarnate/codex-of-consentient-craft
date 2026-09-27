import { locationsClaudeSessionsDirFindBrokerProxy } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker.proxy';

export const locationsClaudeSubagentSessionFilePathFindBrokerProxy = (): {
  setupSubagentSessionFilePath: (params: { userHome: string }) => void;
} => {
  const sessionsDirProxy = locationsClaudeSessionsDirFindBrokerProxy();

  return {
    setupSubagentSessionFilePath: ({ userHome }: { userHome: string }): void => {
      sessionsDirProxy.setupSessionsDir({ userHome });
    },
  };
};
