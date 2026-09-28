import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { resolve } from '#gateway/node/path';

export const guildDirectoryEnsureBrokerProxy = (): {
  setupDirectoryCreation: ({ path }: { path: string }) => void;
  pathsTouched: () => readonly unknown[];
} => {
  const ensureDir = ensureDirProxy();

  return {
    setupDirectoryCreation: ({ path }: { path: string }): void => {
      ensureDir.succeeds({ path: resolve(path) });
    },
    // Every filesystem path this broker reached — the one directory it makes, and nothing else.
    pathsTouched: (): readonly unknown[] =>
      ensureDir.getCallsFor({ path: (_value: unknown): boolean => true }).map((call) => call[0]),
  };
};
