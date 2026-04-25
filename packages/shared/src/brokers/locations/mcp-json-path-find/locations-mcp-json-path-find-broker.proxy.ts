import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsMcpJsonPathFindBrokerProxy = (): {
  setupMcpJsonPath: (params: {
    startPath: string;
    configRootPath: string;
    mcpJsonPath: FilePath;
  }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupMcpJsonPath: ({
      startPath,
      configRootPath,
      mcpJsonPath,
    }: {
      startPath: string;
      configRootPath: string;
      mcpJsonPath: FilePath;
    }): void => {
      configRootProxy.setupConfigRootFound({ startPath, configRootPath });
      pathJoinProxy.returns({ result: mcpJsonPath });
    },
  };
};
