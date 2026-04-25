import { locationsClaudeSessionsDirFindBrokerProxy } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeSubagentSessionFilePathFindBrokerProxy = (): {
  setupSubagentSessionFilePath: (params: { userHome: string; subagentFilePath: FilePath }) => void;
} => {
  const sessionsDirProxy = locationsClaudeSessionsDirFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupSubagentSessionFilePath: ({
      userHome,
      subagentFilePath,
    }: {
      userHome: string;
      subagentFilePath: FilePath;
    }): void => {
      sessionsDirProxy.setupSessionsDir({ userHome });
      pathJoinProxy.returns({ result: subagentFilePath });
    },
  };
};
