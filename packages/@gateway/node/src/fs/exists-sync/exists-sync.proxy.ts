import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const existsSyncProxy = (): {
  returns: ({ path, exists }: { path: string; exists: boolean }) => void;
  returnsMatchingPath: ({ path, exists }: { path: PathMatcher; exists: boolean }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: existsSync });

  return {
    returns: ({ path, exists }: { path: string; exists: boolean }): void => {
      handle.calledWith([path]).returns(exists);
    },
    returnsMatchingPath: ({ path, exists }: { path: PathMatcher; exists: boolean }): void => {
      handle.calledWith([path]).returns(exists);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
