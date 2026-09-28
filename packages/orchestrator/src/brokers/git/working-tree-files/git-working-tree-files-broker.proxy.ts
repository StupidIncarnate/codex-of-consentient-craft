/**
 * PURPOSE: Test proxy for gitWorkingTreeFilesBroker that composes diffFilesProxy and gitUntrackedFilesAdapterProxy
 *
 * USAGE:
 * const proxy = gitWorkingTreeFilesBrokerProxy();
 * proxy.setupWorkingTree({ trackedFiles: ['file1.ts'], untrackedFiles: ['file2.ts'] });
 */

import { diffFilesProxy } from '#gateway/bin/git/diff-files/diff-files.proxy';

import { gitUntrackedFilesAdapterProxy } from '../../../adapters/git/untracked-files/git-untracked-files-adapter.proxy';

const extractArgs = (calls: readonly unknown[][]): readonly unknown[] => {
  const firstCall = calls.at(0);
  if (firstCall === undefined) {
    return [];
  }
  const item = firstCall.at(0);
  if (typeof item === 'object' && item !== null && 'args' in item) {
    return Array.isArray(item.args) ? item.args : [];
  }
  return [];
};

export const gitWorkingTreeFilesBrokerProxy = (): {
  setupWorkingTree: (params: {
    trackedFiles: readonly string[];
    untrackedFiles: readonly string[];
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const diffProxy = diffFilesProxy();
  const untrackedProxy = gitUntrackedFilesAdapterProxy();

  return {
    setupWorkingTree: ({
      trackedFiles,
      untrackedFiles,
    }: {
      trackedFiles: readonly string[];
      untrackedFiles: readonly string[];
    }): void => {
      diffProxy.setupResult({
        revisionArg: 'HEAD',
        exitCode: 0,
        output: trackedFiles.join('\n'),
      });
      untrackedProxy.setupUntrackedOutput({
        output: untrackedFiles.join('\n'),
      });
    },

    getSpawnedArgsList: (): readonly unknown[] => {
      const diffArgs = extractArgs(diffProxy.getCallsFor({ revisionArg: 'HEAD' }));
      return [diffArgs, untrackedProxy.getSpawnedArgs()];
    },
  };
};
