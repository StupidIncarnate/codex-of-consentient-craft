import { detectDefaultBranchProxy } from '#gateway/bin/git/detect-default-branch/detect-default-branch.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';

// The gateway's own detectDefaultBranchProxy stages the rev-parse results; a missing `git` is
// staged through the same proxy's setupNotFound.
export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
  setupGitNotFound: () => void;
} => {
  const detect = detectDefaultBranchProxy();
  // Created but unstaged: GitNotInstalledError is a plain class with nothing to mock.
  GitNotInstalledErrorProxy();

  return {
    setupMainExists: (): void => {
      detect.setupMainExists();
    },

    setupMasterExists: (): void => {
      detect.setupMasterExists();
    },

    setupNeitherExists: (): void => {
      detect.setupNeitherExists();
    },

    setupGitNotFound: (): void => {
      detect.setupNotFound();
    },
  };
};
