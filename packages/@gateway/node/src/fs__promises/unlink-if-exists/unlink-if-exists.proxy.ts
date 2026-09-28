import { unlinkProxy } from '../unlink/unlink.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const unlinkIfExistsProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  missing: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const proxy = unlinkProxy();

  return {
    succeeds: ({ path }: { path: string }): void => {
      proxy.succeeds({ path });
    },
    missing: ({ path }: { path: string }): void => {
      proxy.rejects({ path, error: FsErrorStub({ code: 'ENOENT', path }) });
    },
    rejects: ({ path, error }: { path: string; error: FsError }): void => {
      proxy.rejects({ path, error });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      proxy.getCallsFor({ path }),
  };
};
