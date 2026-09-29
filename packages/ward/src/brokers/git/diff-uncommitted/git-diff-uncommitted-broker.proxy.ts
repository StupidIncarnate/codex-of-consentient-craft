import { diffFilesProxy } from '#gateway/bin/git/diff-files/diff-files.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';
import { untrackedFilesProxy } from '#gateway/bin/git/untracked-files/untracked-files.proxy';

// The tracked reading is `git diff HEAD --name-only --diff-filter=d` and the untracked one is
// `git ls-files --others --exclude-standard`, each staged by its exact args through the gateway's
// own proxy.
export const gitDiffUncommittedBrokerProxy = (): {
  setupWorkingTree: (params: { trackedOutput: string; untrackedOutput: string }) => void;
  setupGitNotFound: () => void;
  getDiffCalls: () => readonly unknown[][];
  getUntrackedCalls: () => readonly unknown[][];
} => {
  const diffFiles = diffFilesProxy();
  const untrackedFiles = untrackedFilesProxy();
  // Created but unstaged: GitNotInstalledError is a plain class with nothing to mock.
  GitNotInstalledErrorProxy();

  return {
    setupWorkingTree: ({
      trackedOutput,
      untrackedOutput,
    }: {
      trackedOutput: string;
      untrackedOutput: string;
    }): void => {
      diffFiles.setupResult({
        revisionArg: 'HEAD',
        excludeDeleted: true,
        exitCode: 0,
        output: trackedOutput,
      });
      untrackedFiles.setupResult({ exitCode: 0, output: untrackedOutput });
    },

    // git itself is missing: the first reading fails to start, the second is never attempted, and
    // the broker folds that into an empty reading.
    setupGitNotFound: (): void => {
      diffFiles.setupNotFound({ revisionArg: 'HEAD', excludeDeleted: true });
    },

    getDiffCalls: (): readonly unknown[][] =>
      diffFiles.getCallsFor({ revisionArg: 'HEAD', excludeDeleted: true }),

    getUntrackedCalls: (): readonly unknown[][] => untrackedFiles.getCallsFor(),
  };
};
