import { pathJoinAdapterProxy, projectRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import type { ExitCode, FilePath } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';

export const claudeSpawnBrokerProxy = (): {
  setupSuccess: (params: { projectRoot: FilePath; exitCode: ExitCode }) => void;
  setupError: (params: { projectRoot: FilePath; error: Error }) => void;
} => {
  const childProcessProxy = childProcessSpawnAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const projectRootProxy = projectRootFindBrokerProxy();

  return {
    setupSuccess: ({ projectRoot, exitCode }: { projectRoot: FilePath; exitCode: ExitCode }) => {
      // Mock project root finding
      projectRootProxy.setupProjectRootFound({
        startPath: projectRoot,
        projectRootPath: projectRoot,
      });

      // Mock path joining for claude binary path
      const claudePath = `${projectRoot}/node_modules/.bin/claude`;
      pathJoinProxy.returns({ result: claudePath as never });

      // Mock successful spawn
      childProcessProxy.setupSuccess({ exitCode });
    },

    setupError: ({ projectRoot, error }: { projectRoot: FilePath; error: Error }) => {
      // Mock project root finding
      projectRootProxy.setupProjectRootFound({
        startPath: projectRoot,
        projectRootPath: projectRoot,
      });

      // Mock path joining for claude binary path
      const claudePath = `${projectRoot}/node_modules/.bin/claude`;
      pathJoinProxy.returns({ result: claudePath as never });

      // Mock spawn error
      childProcessProxy.setupError({ error });
    },
  };
};
