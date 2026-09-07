import { globSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsGlobSyncAdapterProxy = (): {
  returnsForPattern: (params: { pattern: string; files: string[] }) => void;
  // The bundle hash globs the SAME patterns in several package directories at once, so the pattern
  // alone is not an address there — keying on it would answer one package's file list for every
  // package in the closure.
  returnsForPatternInDir: (params: {
    pattern: string;
    cwd: AbsoluteFilePath;
    files: string[];
  }) => void;
  // The broker calls globSync once PER discovery pattern — often a dozen calls per check
  // type (one per extension x root combination from checkCommandsStatics). Callers that only
  // assert on the aggregated discoveredFiles union, not which specific pattern produced which
  // file, describe every pattern with one predicate instead of enumerating each static pattern
  // string by hand.
  returnsForAnyPattern: (params: { files: string[] }) => void;
} => {
  const mock = registerMock({ fn: globSync });

  return {
    returnsForPattern: ({ pattern, files }: { pattern: string; files: string[] }): void => {
      mock.calledWith([pattern]).returns(files);
    },
    returnsForPatternInDir: ({
      pattern,
      cwd,
      files,
    }: {
      pattern: string;
      cwd: AbsoluteFilePath;
      files: string[];
    }): void => {
      mock.calledWith([pattern, { cwd }]).returns(files);
    },
    returnsForAnyPattern: ({ files }: { files: string[] }): void => {
      mock.calledWith([(pattern: unknown) => typeof pattern === 'string']).returns(files);
    },
  };
};
