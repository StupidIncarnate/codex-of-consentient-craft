import { userInfo } from '#gateway/node/os';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { realpathProxy } from '#gateway/node/fs__promises/realpath/realpath.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { tmpdirFindBrokerProxy } from '../../tmpdir/find/tmpdir-find-broker.proxy';

// uid 1000 in base 36 is 'rs', so the default cache directory is /tmp/jest_rs.
const DEFAULT_UID = 1000;
const DEFAULT_CACHE_DIR = '/tmp/jest_rs';

// Ages are read off the clock at staging time, so a caller that pins Date.now (the run-id proxies do)
// gets ages relative to the pinned value and one that does not gets a few milliseconds of drift.
export const jestCachePruneBrokerProxy = (): {
  setupUid: (params: { uid: number }) => void;
  setupRealTmp: (params: { tmp: string; resolved: string }) => void;
  setupRealpathMissing: (params: { tmp: string }) => void;
  setupEntries: (params: { cacheDir: string; entries: string[] }) => void;
  setupCacheMissing: (params: { cacheDir: string }) => void;
  setupAge: (params: { path: string; ageMs: number }) => void;
  setupRemovable: (params: { path: string }) => void;
  setupRemoveFails: (params: { path: string }) => void;
  getRemoveCalls: () => readonly unknown[][];
  getRemovedPaths: () => readonly unknown[];
  getStderrText: () => unknown;
} => {
  const tmpProxy = tmpdirFindBrokerProxy();
  const userHandle = registerMock({ fn: userInfo });
  const realpathFsProxy = realpathProxy();
  const readdirProxy = readdirIfExistsProxy();
  const statProxy = statIfExistsProxy();
  const rm = rmProxy();
  const stderr = stderrProxy();

  userHandle.calledWith([]).returns({
    uid: DEFAULT_UID,
    gid: DEFAULT_UID,
    username: 'ward',
    homedir: '/home/ward',
    shell: null,
  });
  tmpProxy.returns({ path: '/tmp' });
  realpathFsProxy.returns({ path: '/tmp', resolved: '/tmp' });
  readdirProxy.returns({ path: DEFAULT_CACHE_DIR, names: [] });

  return {
    setupUid: ({ uid }): void => {
      userHandle.calledWith([]).returns({
        uid,
        gid: uid,
        username: 'ward',
        homedir: '/home/ward',
        shell: null,
      });
    },
    setupRealTmp: ({ tmp, resolved }): void => {
      tmpProxy.returns({ path: tmp });
      realpathFsProxy.returns({ path: tmp, resolved });
    },
    setupRealpathMissing: ({ tmp }): void => {
      tmpProxy.returns({ path: tmp });
      realpathFsProxy.missing({ path: tmp });
    },
    setupEntries: ({ cacheDir, entries }): void => {
      readdirProxy.returns({ path: cacheDir, names: entries });
    },
    setupCacheMissing: ({ cacheDir }): void => {
      readdirProxy.missing({ path: cacheDir });
    },
    setupAge: ({ path, ageMs }): void => {
      statProxy.returnsFile({ path, sizeBytes: 1024, modifiedAtMs: Date.now() - ageMs });
    },
    setupRemovable: ({ path }): void => {
      rm.succeeds({ path });
    },
    setupRemoveFails: ({ path }): void => {
      rm.rejects({ path, error: FsErrorStub({ code: 'ENOTEMPTY', syscall: 'rm', path }) });
    },
    getRemoveCalls: (): readonly unknown[][] => rm.getCallsFor({ path: () => true }),
    getRemovedPaths: (): readonly unknown[] =>
      rm.getCallsFor({ path: () => true }).map((call) => call[0]),
    getStderrText: (): unknown => stderr.getWrittenText(),
  };
};
