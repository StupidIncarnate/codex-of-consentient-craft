import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const checkGatewaySubpathExistsLayerBrokerProxy = (): {
  setupBarrelExists: (args: { barrelPath: string }) => void;
  setupBarrelMissing: (args: { barrelPath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    setupBarrelExists: ({ barrelPath }: { barrelPath: string }): void => {
      existsProxy.returns({ path: FilePathStub({ value: barrelPath }), exists: true });
    },

    setupBarrelMissing: ({ barrelPath }: { barrelPath: string }): void => {
      existsProxy.returns({ path: FilePathStub({ value: barrelPath }), exists: false });
    },
  };
};
