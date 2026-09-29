import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dynamicImport } from './dynamic-import';

// `import()` cannot be mocked from outside, so the wrapper itself is the seam a caller's test
// stages. Nothing is staged until a test calls a method; an unstaged path returns undefined, never
// a real load. The colocated test drives the real wrapper without this proxy.
export const dynamicImportProxy = (): {
  returns: (params: { path: string; module: unknown }) => void;
  rejects: (params: { path: string; error: Error }) => void;
  getCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: dynamicImport });

  return {
    returns: ({ path, module }: { path: string; module: unknown }): void => {
      handle.calledWith([{ path }]).resolves(module);
    },
    rejects: ({ path, error }: { path: string; error: Error }): void => {
      handle.calledWith([{ path }]).rejects(error);
    },
    getCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      handle.callsMatching([{ path }]),
  };
};
