import { join, relative, sep } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const gatewayModuleMockMapBrokerProxy = (): {
  setupNpmGateway: (params: {
    rootDir: string;
    repoRoot: string;
    folders: readonly { name: string; hasMock: boolean; barrelText: string | null }[];
  }) => void;
  setupNoNpmGateway: (params: { rootDir: string }) => void;
} => {
  const findUp = findUpSyncProxy();
  const exists = existsSyncProxy();
  const readFile = readFileSyncIfExistsProxy();
  const readdir = readdirEntriesSyncProxy();
  const npmGatewayDir = 'packages/@gateway/npm';

  return {
    // findUpSync walks from rootDir upward; every directory below repoRoot misses, repoRoot hits.
    setupNpmGateway: ({ rootDir, repoRoot, folders }): void => {
      const segments = relative(repoRoot, rootDir)
        .split(sep)
        .filter((segment) => segment !== '');
      segments.forEach((_segment, index) => {
        findUp.notFound({
          path: join(repoRoot, ...segments.slice(0, index + 1), npmGatewayDir),
        });
      });
      findUp.foundAt({ path: join(repoRoot, npmGatewayDir) });

      const srcDir = join(repoRoot, npmGatewayDir, 'src');
      exists.returns({ path: srcDir, exists: true });
      readdir.returns({
        path: srcDir,
        entries: [
          ...folders.map(({ name }) => ({ name, kind: 'directory' as const })),
          { name: 'gateway-npm-package-dependencies.integration.test.ts', kind: 'file' as const },
        ],
      });
      folders.forEach(({ name, hasMock, barrelText }) => {
        exists.returns({ path: join(srcDir, name, `${name}.jest-mock.cjs`), exists: hasMock });
        const barrelPath = join(srcDir, name, `${name}.ts`);
        if (barrelText === null) {
          readFile.missing({ path: barrelPath });
          return;
        }
        readFile.returns({ path: barrelPath, contents: barrelText });
      });
    },
    // findUpSync walks from rootDir all the way to the filesystem root and finds nothing.
    setupNoNpmGateway: ({ rootDir }): void => {
      const segments = relative(sep, rootDir)
        .split(sep)
        .filter((segment) => segment !== '');
      findUp.notFound({ path: join(sep, npmGatewayDir) });
      segments.forEach((_segment, index) => {
        findUp.notFound({ path: join(sep, ...segments.slice(0, index + 1), npmGatewayDir) });
      });
    },
  };
};
