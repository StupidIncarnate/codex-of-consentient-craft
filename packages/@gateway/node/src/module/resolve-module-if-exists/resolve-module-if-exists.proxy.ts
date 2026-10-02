import { registerMock } from '@dungeonmaster/testing/register-mock';
import { resolveModuleIfExists } from './resolve-module-if-exists';

// `require.resolve` is a per-file CommonJS binding that cannot be mocked from outside, so the
// wrapper itself is the seam a caller's test stages. Each answer is addressed by specifier and
// starting directory; an unstaged call throws. The colocated test drives the real wrapper
// without this proxy.
export const resolveModuleIfExistsProxy = (): {
  returns: (params: { specifier: string; fromDir?: string; path: string }) => void;
  missing: (params: { specifier: string; fromDir?: string }) => void;
  getCallsFor: (params: { specifier: string; fromDir?: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: resolveModuleIfExists });

  return {
    returns: ({
      specifier,
      fromDir,
      path,
    }: {
      specifier: string;
      fromDir?: string;
      path: string;
    }): void => {
      handle
        .calledWith([fromDir === undefined ? { specifier } : { specifier, fromDir }])
        .returns(path);
    },
    missing: ({ specifier, fromDir }: { specifier: string; fromDir?: string }): void => {
      handle
        .calledWith([fromDir === undefined ? { specifier } : { specifier, fromDir }])
        .returns(null);
    },
    getCallsFor: ({
      specifier,
      fromDir,
    }: {
      specifier: string;
      fromDir?: string;
    }): readonly unknown[][] =>
      handle.callsMatching([fromDir === undefined ? { specifier } : { specifier, fromDir }]),
  };
};
