import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { join } from '#gateway/node/path';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const binWorkspaceRootLayerBrokerProxy = (): {
  setupWorkspaceRoot: (params: { dir: AbsoluteFilePath }) => void;
  setupPlainPackage: (params: { dir: AbsoluteFilePath }) => void;
  setupMalformedPackageJson: (params: { dir: AbsoluteFilePath }) => void;
  setupNoPackageJson: (params: { dir: AbsoluteFilePath }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  return {
    setupWorkspaceRoot: ({ dir }: { dir: AbsoluteFilePath }): void => {
      readProxy.returns({
        path: join(dir, 'package.json'),
        contents: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      });
    },

    setupPlainPackage: ({ dir }: { dir: AbsoluteFilePath }): void => {
      readProxy.returns({
        path: join(dir, 'package.json'),
        contents: JSON.stringify({ name: 'leaf' }),
      });
    },

    setupMalformedPackageJson: ({ dir }: { dir: AbsoluteFilePath }): void => {
      readProxy.returns({ path: join(dir, 'package.json'), contents: '{ not json' });
    },

    setupNoPackageJson: ({ dir }: { dir: AbsoluteFilePath }): void => {
      readProxy.missing({ path: join(dir, 'package.json') });
    },
  };
};
