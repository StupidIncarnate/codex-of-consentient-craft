import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const checkGatewaySubpathExistsLayerBrokerProxy = (): {
  setupBarrelExists: (args: { barrelPath: string }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();

  // No single path to key on: every subpath computes a different candidate barrel path, so the
  // honest catch-all is "nothing exists" and each test stages the one that does.
  existsProxy.setupFileSystem(() => false);

  return {
    setupBarrelExists: ({ barrelPath }: { barrelPath: string }): void => {
      existsProxy.returns({ filePath: FilePathStub({ value: barrelPath }), exists: true });
    },
  };
};
