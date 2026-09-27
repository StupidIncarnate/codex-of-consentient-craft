import { join } from 'path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const installCheckBrokerProxy = (): {
  setupValid: (params: { projectRoot: string }) => void;
  setupMissingPackageJson: (params: { projectRoot: string }) => void;
  setupMissingClaudeDir: (params: { projectRoot: string }) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    setupValid: ({ projectRoot }: { projectRoot: string }) => {
      existsProxy.returns({ path: join(projectRoot, 'package.json'), exists: true });
      existsProxy.returns({
        path: join(projectRoot, locationsStatics.repoRoot.claude.dir),
        exists: true,
      });
    },

    setupMissingPackageJson: ({ projectRoot }: { projectRoot: string }) => {
      existsProxy.returns({ path: join(projectRoot, 'package.json'), exists: false });
    },

    setupMissingClaudeDir: ({ projectRoot }: { projectRoot: string }) => {
      existsProxy.returns({ path: join(projectRoot, 'package.json'), exists: true });
      existsProxy.returns({
        path: join(projectRoot, locationsStatics.repoRoot.claude.dir),
        exists: false,
      });
    },
  };
};
