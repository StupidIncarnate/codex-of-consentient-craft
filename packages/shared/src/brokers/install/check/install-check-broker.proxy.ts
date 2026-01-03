import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const installCheckBrokerProxy = (): {
  setupValid: (params: { projectRoot: string }) => void;
  setupMissingPackageJson: (params: { projectRoot: string }) => void;
  setupMissingClaudeDir: (params: { projectRoot: string }) => void;
} => {
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupValid: ({ projectRoot }: { projectRoot: string }) => {
      pathJoinProxy.returns({ result: `${projectRoot}/package.json` as never });
      fsExistsSyncProxy.returns({ result: true });
      pathJoinProxy.returns({ result: `${projectRoot}/.claude` as never });
      fsExistsSyncProxy.returns({ result: true });
    },

    setupMissingPackageJson: ({ projectRoot }: { projectRoot: string }) => {
      pathJoinProxy.returns({ result: `${projectRoot}/package.json` as never });
      fsExistsSyncProxy.returns({ result: false });
    },

    setupMissingClaudeDir: ({ projectRoot }: { projectRoot: string }) => {
      pathJoinProxy.returns({ result: `${projectRoot}/package.json` as never });
      fsExistsSyncProxy.returns({ result: true });
      pathJoinProxy.returns({ result: `${projectRoot}/.claude` as never });
      fsExistsSyncProxy.returns({ result: false });
    },
  };
};
