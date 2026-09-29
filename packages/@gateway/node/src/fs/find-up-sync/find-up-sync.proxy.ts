import type { PathMatcher } from '../../gateway-test-support/path-matcher';
import { existsSyncProxy } from '../exists-sync/exists-sync.proxy';

export const findUpSyncProxy = (): {
  foundAt: ({ path }: { path: string }) => void;
  notFound: ({ path }: { path: string }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const proxy = existsSyncProxy();

  return {
    foundAt: ({ path }: { path: string }): void => {
      proxy.returns({ path, exists: true });
    },
    notFound: ({ path }: { path: string }): void => {
      proxy.returns({ path, exists: false });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      proxy.getCallsFor({ path }),
  };
};
