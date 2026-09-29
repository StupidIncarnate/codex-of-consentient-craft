import { detectOriginDefaultBranchProxy } from '#gateway/bin/git/detect-origin-default-branch/detect-origin-default-branch.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';

// The gateway's own detectOriginDefaultBranchProxy stages the rev-parse results; a missing `git`
// is staged through the same proxy's setupNotFound.
export const gitDetectOriginDefaultBranchBrokerProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNoOriginRefs: () => void;
  setupGitNotFound: () => void;
  getSpawnedCalls: () => readonly unknown[][];
} => {
  const detect = detectOriginDefaultBranchProxy();
  // Created but unstaged: GitNotInstalledError is a plain class with nothing to mock.
  GitNotInstalledErrorProxy();

  return {
    setupOriginMainExists: (): void => {
      detect.setupOriginMainExists();
    },

    setupOriginMasterExists: (): void => {
      detect.setupOriginMasterExists();
    },

    setupNoOriginRefs: (): void => {
      detect.setupNeitherExists();
    },

    setupGitNotFound: (): void => {
      detect.setupNotFound();
    },

    getSpawnedCalls: (): readonly unknown[][] => detect.getCallsFor(),
  };
};
