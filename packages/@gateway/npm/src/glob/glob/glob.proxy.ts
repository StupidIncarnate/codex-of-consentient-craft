import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface GlobOptions {
  cwd?: string;
  nodir?: boolean;
  ignore: readonly string[];
}
type GlobPartialOptions = Partial<{ cwd: string; nodir: boolean; ignore: readonly string[] }>;

const resolvedOptions = ({
  cwd,
  nodir,
  ignore,
}: GlobOptions): { cwd?: string; absolute: true; nodir: boolean; ignore: string[] } => ({
  ...(cwd === undefined ? {} : { cwd }),
  absolute: true,
  nodir: nodir ?? true,
  ignore: [...ignore],
});

const GLOB_WILDCARD = '*';

// Mirrors the retired mcp adapter proxy's `matchesGlobTail`: compares only from each side's first
// wildcard character onward, so a caller staging the glob it asked discover for still matches the
// real call after a broker prefixes it with a cwd (mocked or real) the staging never saw.
const patternTail = (value: string | string[]): string => {
  const joined = Array.isArray(value) ? value.join(',') : value;
  const start = joined.indexOf(GLOB_WILDCARD);
  return joined.slice(start < 0 ? 0 : start);
};

const matchesPatternTail = ({
  staged,
  candidate,
}: {
  staged: string | string[];
  candidate: unknown;
}): boolean => {
  const candidateTail = patternTail(String(candidate));
  const stagedTail = patternTail(staged);
  return candidateTail.startsWith(stagedTail) || stagedTail.startsWith(candidateTail);
};

const tailPredicate =
  (pattern: string | string[]) =>
  (candidate: unknown): boolean =>
    matchesPatternTail({ staged: pattern, candidate });

export const globProxy = (): {
  returns: (params: {
    pattern: string | string[];
    options: { cwd?: string; nodir?: boolean; ignore: readonly string[] };
    matches: string[];
  }) => void;
  throws: (params: {
    pattern: string | string[];
    options: { cwd?: string; nodir?: boolean; ignore: readonly string[] };
    error: Error;
  }) => void;
  returnsMatchingTail: (params: {
    pattern: string | string[];
    options?: GlobPartialOptions;
    matches: string[];
  }) => void;
  throwsMatchingTail: (params: {
    pattern: string | string[];
    options?: GlobPartialOptions;
    error: Error;
  }) => void;
  getOptionsFor: (params: { pattern: string | string[] }) => unknown;
  getCallsFor: (params: { pattern: string | string[] }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: glob });

  return {
    returns: ({ pattern, options, matches }): void => {
      handle.calledWith([pattern, resolvedOptions(options)]).resolves([...matches]);
    },
    throws: ({ pattern, options, error }): void => {
      handle.calledWith([pattern, resolvedOptions(options)]).rejects(error);
    },

    // Tolerant address: the real call's pattern is matched by TAIL (so a staging built from one
    // cwd convention — a mocked root, a real one — still answers a call built from another), and,
    // when `options` is given, only the keys it names are checked — never the fully resolved
    // object `returns` requires — so a caller unable to reproduce the broker's own ignore-list
    // computation can still stage the scan without duplicating that computation into its own proxy.
    returnsMatchingTail: ({ pattern, options, matches }): void => {
      const address =
        options === undefined ? [tailPredicate(pattern)] : [tailPredicate(pattern), options];
      handle.calledWith(address).resolves([...matches]);
    },
    throwsMatchingTail: ({ pattern, options, error }): void => {
      const address =
        options === undefined ? [tailPredicate(pattern)] : [tailPredicate(pattern), options];
      handle.calledWith(address).rejects(error);
    },

    // Call inspection: which pattern (tail-matched) glob was really given, and with what options —
    // the only place a caller can see what a broker actually asked for, since neither the real cwd
    // nor the ignore list it computed is knowable at staging time.
    getOptionsFor: ({ pattern }): unknown =>
      handle.callsMatching([tailPredicate(pattern)]).at(-1)?.[1],
    getCallsFor: ({ pattern }): readonly unknown[][] =>
      handle.callsMatching([tailPredicate(pattern)]),
  };
};
