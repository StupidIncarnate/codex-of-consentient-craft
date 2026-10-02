import { commonDirProxy } from '#gateway/bin/git/common-dir/common-dir.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';

export const historyRootFindBrokerProxy = (): {
  setupCommonDirFound: (params: { commonDir: string }) => void;
  setupGitMissing: () => void;
  setupCommonDirNull: () => void;
  setupNotRepo: () => void;
} => {
  const common = commonDirProxy();
  GitNotInstalledErrorProxy();

  return {
    setupCommonDirFound: ({ commonDir }: { commonDir: string }): void => {
      common.setupResult({ exitCode: 0, output: commonDir });
    },

    setupGitMissing: (): void => {
      common.setupNotFound();
    },

    setupCommonDirNull: (): void => {
      common.setupResult({ exitCode: 128, output: '' });
    },

    setupNotRepo: (): void => {
      common.setupResult({ exitCode: 128, output: '' });
    },
  };
};
