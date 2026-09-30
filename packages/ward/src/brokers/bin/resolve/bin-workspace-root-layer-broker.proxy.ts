import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { join } from '#gateway/node/path';

export const binWorkspaceRootLayerBrokerProxy = (): {
  setupWorkspaceRoot: (params: { dir: string }) => void;
  setupPlainPackage: (params: { dir: string }) => void;
  setupMalformedPackageJson: (params: { dir: string }) => void;
  setupNoPackageJson: (params: { dir: string }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  return {
    setupWorkspaceRoot: ({ dir }: { dir: string }): void => {
      readProxy.returns({
        path: join(dir, 'package.json'),
        contents: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      });
    },

    setupPlainPackage: ({ dir }: { dir: string }): void => {
      readProxy.returns({
        path: join(dir, 'package.json'),
        contents: JSON.stringify({ name: 'leaf' }),
      });
    },

    setupMalformedPackageJson: ({ dir }: { dir: string }): void => {
      readProxy.returns({ path: join(dir, 'package.json'), contents: '{ not json' });
    },

    setupNoPackageJson: ({ dir }: { dir: string }): void => {
      readProxy.missing({ path: join(dir, 'package.json') });
    },
  };
};
