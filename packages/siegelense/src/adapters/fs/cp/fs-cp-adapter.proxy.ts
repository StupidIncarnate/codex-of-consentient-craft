import { cp, readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsCpAdapterProxy = (): {
  setupSourceEntries: (params: {
    sourcePath: AbsoluteFilePath;
    entries: readonly string[];
  }) => void;
  succeeds: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly string[];
  }) => void;
  throws: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly string[];
    error: Error;
  }) => void;
  getCopiedPairs: () => unknown[][];
  getOptionsFor: (params: { sourceEntryPath: AbsoluteFilePath }) => unknown;
} => {
  const readdirMock: MockHandle = registerMock({ fn: readdir });
  const cpMock: MockHandle = registerMock({ fn: cp });

  return {
    // What the source directory holds. The adapter reads this before copying anything, so a test
    // that does not stage it gets a "nothing set up" throw rather than a silently empty copy.
    setupSourceEntries: ({
      sourcePath,
      entries,
    }: {
      sourcePath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirMock.calledWith([sourcePath]).resolves(entries);
    },

    // Stages the listing AND one per-child copy for each entry — addressed by the child's own source
    // and destination paths, so two entries can never be paired by call order.
    succeeds: ({
      sourcePath,
      destinationPath,
      entries,
    }: {
      sourcePath: AbsoluteFilePath;
      destinationPath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirMock.calledWith([sourcePath]).resolves(entries);
      entries.forEach((entry) => {
        cpMock
          .calledWith([`${String(sourcePath)}/${entry}`, `${String(destinationPath)}/${entry}`])
          .resolves(undefined);
      });
    },

    throws: ({
      sourcePath,
      destinationPath,
      entries,
      error,
    }: {
      sourcePath: AbsoluteFilePath;
      destinationPath: AbsoluteFilePath;
      entries: readonly string[];
      error: Error;
    }): void => {
      readdirMock.calledWith([sourcePath]).resolves(entries);
      entries.forEach((entry) => {
        cpMock
          .calledWith([`${String(sourcePath)}/${entry}`, `${String(destinationPath)}/${entry}`])
          .rejects(error);
      });
    },

    // Every (source, destination) child pair copied, in call order — an excluded entry is absent
    // from this list, which is how a test proves the exclusion rather than inspecting a predicate.
    getCopiedPairs: (): unknown[][] => cpMock.callsMatching([]).map((call) => [call[0], call[1]]),

    // Confirms { recursive, force } reached fs.cp for one child.
    getOptionsFor: ({ sourceEntryPath }: { sourceEntryPath: AbsoluteFilePath }): unknown =>
      cpMock.callsMatching([sourceEntryPath]).at(-1)?.[2],
  };
};
