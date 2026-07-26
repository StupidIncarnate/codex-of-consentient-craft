import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

const GLOB_WILDCARD = '*';

export const globFindAdapterProxy = (): {
  returns: (params: {
    pattern: GlobPattern;
    cwd?: PathSegment;
    includeDirectories?: boolean;
    files: readonly PathSegment[];
  }) => void;
  returnsOnce: (params: {
    pattern: GlobPattern;
    cwd?: PathSegment;
    includeDirectories?: boolean;
    files: readonly PathSegment[];
  }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockResolvedValue([]);

  // globFindAdapter calls glob(pattern, { cwd, absolute, nodir, ignore }), so a staged answer is
  // addressed by three things:
  //
  // - `pattern` — callers stage the glob they asked discover for, but a broker prefixes it with
  //   the directory it scans from (and may append `/**/*`) before it reaches glob. The whole
  //   string is therefore not reconstructible at staging time; the wildcard tail is, so the
  //   pattern is matched on that.
  // - `cwd` — the root the scan runs from. fileScannerBroker scans the project root and, for a
  //   broad glob, also scans @dungeonmaster/shared from its own root, so the root is part of the
  //   address rather than an incidental option.
  // - `includeDirectories` — the adapter turns it into `nodir`, which is what separates a file
  //   scan from a directory probe over the very same pattern.
  const matchesGlobTail = ({
    staged,
    candidate,
  }: {
    staged: GlobPattern;
    candidate: unknown;
  }): boolean => {
    const candidateValue = String(candidate);
    const stagedValue = String(staged);
    const candidateStart = candidateValue.indexOf(GLOB_WILDCARD);
    const stagedStart = stagedValue.indexOf(GLOB_WILDCARD);
    const candidateTail = candidateValue.slice(candidateStart < 0 ? 0 : candidateStart);
    const stagedTail = stagedValue.slice(stagedStart < 0 ? 0 : stagedStart);

    return candidateTail.startsWith(stagedTail) || stagedTail.startsWith(candidateTail);
  };

  return {
    returns: ({
      pattern,
      cwd,
      includeDirectories,
      files,
    }: {
      pattern: GlobPattern;
      cwd?: PathSegment;
      includeDirectories?: boolean;
      files: readonly PathSegment[];
    }): void => {
      handle
        .calledWith([
          (candidate: unknown): boolean => matchesGlobTail({ staged: pattern, candidate }),
          {
            nodir: includeDirectories !== true,
            ...(cwd === undefined ? {} : { cwd: String(cwd) }),
          },
        ])
        .resolves([...files]);
    },

    // One-shot, for when two glob calls are argument-identical and must answer differently.
    returnsOnce: ({
      pattern,
      cwd,
      includeDirectories,
      files,
    }: {
      pattern: GlobPattern;
      cwd?: PathSegment;
      includeDirectories?: boolean;
      files: readonly PathSegment[];
    }): void => {
      handle
        .onceFor([
          (candidate: unknown): boolean => matchesGlobTail({ staged: pattern, candidate }),
          {
            nodir: includeDirectories !== true,
            ...(cwd === undefined ? {} : { cwd: String(cwd) }),
          },
        ])
        .resolves([...files]);
    },

    throws: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      handle
        .calledWith([
          (candidate: unknown): boolean => matchesGlobTail({ staged: pattern, candidate }),
        ])
        .rejects(error);
    },
  };
};
