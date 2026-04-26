import { locationsClaudeSessionsDirFindBrokerProxy } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeSessionFilePathFindBrokerProxy = (): {
  setupSessionFilePath: (params: { userHome: string; sessionFilePath: FilePath }) => void;
} => {
  const sessionsDirProxy = locationsClaudeSessionsDirFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupSessionFilePath: ({
      userHome,
      sessionFilePath,
    }: {
      userHome: string;
      sessionFilePath: FilePath;
    }): void => {
      sessionsDirProxy.setupSessionsDir({ userHome });
      pathJoinProxy.returns({ result: sessionFilePath });
    },
  };
};
