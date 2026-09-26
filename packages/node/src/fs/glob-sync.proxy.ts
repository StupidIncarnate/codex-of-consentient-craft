import { globSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const globSyncProxy = (): {
  returns: (params: { patterns: string | string[]; cwd?: string; matches: string[] }) => void;
  throws: (params: {
    patterns: string | string[];
    cwd?: string;
    error: NodeJS.ErrnoException;
  }) => void;
} => {
  const handle = registerMock({ fn: globSync });

  return {
    // `exclude` is never part of the match address: a staged function is invoked by the mock
    // framework as its own matcher against the real call's value at that key, which breaks when
    // both sides hold the SAME caller-supplied predicate. Matching on patterns and cwd alone still
    // addresses the call uniquely — "objects compare only on the keys you write".
    returns: ({
      patterns,
      cwd,
      matches,
    }: {
      patterns: string | string[];
      cwd?: string;
      matches: string[];
    }): void => {
      handle.calledWith([patterns, { ...(cwd === undefined ? {} : { cwd }) }]).returns(matches);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({
      patterns,
      cwd,
      error,
    }: {
      patterns: string | string[];
      cwd?: string;
      error: NodeJS.ErrnoException;
    }): void => {
      handle
        .calledWith([patterns, { ...(cwd === undefined ? {} : { cwd }) }])
        .implement((): never => {
          throw error;
        });
    },
  };
};
