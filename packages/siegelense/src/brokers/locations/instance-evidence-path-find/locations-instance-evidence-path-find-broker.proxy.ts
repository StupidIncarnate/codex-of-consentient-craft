import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsInstanceEvidencePathFindBrokerProxy = (): {
  setupInstanceEvidencePath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupInstanceEvidencePath: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      pathJoinProxy.returns({ result: evidencePath });
    },
  };
};
