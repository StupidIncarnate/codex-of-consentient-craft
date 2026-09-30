import { globSyncProxy } from '#gateway/node/fs/glob-sync/glob-sync.proxy';

export const globDiscoverFilesBrokerProxy = (): {
  returnsForPattern: (params: { pattern: string; files: string[] }) => void;
  // The bundle hash globs the SAME patterns in several package directories at once, so the pattern
  // alone is not an address there — keying on it would answer one package's file list for every
  // package in the closure.
  returnsForPatternInDir: (params: { pattern: string; cwd: string; files: string[] }) => void;
  // The broker calls globSync once PER discovery pattern — often a dozen calls per check type
  // (one per extension x root combination). A caller that only cares about the aggregated
  // discoveredFiles union, not which specific pattern produced which file, stages every pattern in
  // the REAL list one production code will actually query (computed by the caller's own proxy from
  // the same transformer the broker calls) with the same result, rather than a predicate that would
  // match a pattern nothing ever asked for.
  returnsForPatterns: (params: { patterns: readonly string[]; files: string[] }) => void;
} => {
  const glob = globSyncProxy();

  return {
    returnsForPattern: ({ pattern, files }: { pattern: string; files: string[] }): void => {
      glob.returns({ patterns: pattern, matches: files });
    },
    returnsForPatternInDir: ({
      pattern,
      cwd,
      files,
    }: {
      pattern: string;
      cwd: string;
      files: string[];
    }): void => {
      glob.returns({ patterns: pattern, cwd, matches: files });
    },
    returnsForPatterns: ({
      patterns,
      files,
    }: {
      patterns: readonly string[];
      files: string[];
    }): void => {
      for (const pattern of patterns) {
        glob.returns({ patterns: pattern, matches: files });
      }
    },
  };
};
