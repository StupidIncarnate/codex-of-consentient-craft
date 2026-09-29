import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { storageBudgetStatics } from '../../../statics/storage-budget/storage-budget-statics';
import { ttlStatics } from '../../../statics/ttl/ttl-statics';
import { storagePruneBroker } from './storage-prune-broker';
import { storagePruneBrokerProxy } from './storage-prune-broker.proxy';

describe('storagePruneBroker', () => {
  describe('expired files', () => {
    // Derived from ttlStatics.runResultTtl, never a fixed offset. This test spent its life staging
    // a file 3,700,000ms old — an hour, chosen when the TTL was an hour — and asserting only that
    // the broker resolved `{success: true}`, which it returns unconditionally. So it passed while
    // the file it called expired was well INSIDE a 48-hour window and was correctly never deleted,
    // and it would have kept passing had prune deleted nothing at all, ever.
    it('VALID: {run files older than TTL} => deletes expired files', async () => {
      const now = 1739629200000;
      const expiredTimestamp = now - ttlStatics.runResultTtl - 1000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const name = `run-${expiredTimestamp}-a3f1.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [name],
        now,
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${name}`]);
    });
  });

  describe('fresh files', () => {
    it('VALID: {run files within TTL} => keeps fresh files', async () => {
      const now = 1739629200000;
      const freshTimestamp = now - 1000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [`run-${freshTimestamp}-b4e2.json`],
        now,
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {no run files} => completes without error', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const proxy = storagePruneBrokerProxy();
      proxy.setupEmpty({ rootPath });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });
    });
  });

  describe('non-run files', () => {
    it('VALID: {non-run files in directory} => ignores non-run files', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: ['config.json', 'readme.md'],
        now,
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('missing directory', () => {
    it('ERROR: {.ward directory does not exist} => silently ignores error', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const proxy = storagePruneBrokerProxy();
      proxy.setupReaddirFail({ rootPath });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });
    });
  });

  describe('non-timestamped filename, mtime past the TTL', () => {
    it('VALID: {run-e2e-dispatch-ward-5.json with mtime older than TTL} => deletes the file', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const name = 'run-e2e-dispatch-ward-5.json';
      const expiredMtime = now - ttlStatics.runResultTtl - 1000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [name],
        now,
        mtimes: { [name]: expiredMtime },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${name}`]);
    });
  });

  describe('non-timestamped filename, mtime within the TTL', () => {
    it('VALID: {run-e2e-dispatch-ward-5.json with mtime within TTL} => keeps the file', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const name = 'run-e2e-dispatch-ward-5.json';
      const freshMtime = now - 1000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [name],
        now,
        mtimes: { [name]: freshMtime },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('timestamped filename decides on the name alone', () => {
    it('VALID: {run-<expired-timestamp>-a1b2.json whose mtime reads fresh} => deletes it on the filename, not the mtime', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const expiredTimestamp = now - ttlStatics.runResultTtl - 1000;
      const name = `run-${expiredTimestamp}-a1b2.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({ rootPath, entries: [name], now, mtimes: { [name]: now } });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${name}`]);
    });
  });

  describe('stat races another sweep and the file is already gone', () => {
    it('EDGE: {non-timestamped file, stat resolves null} => keeps the file without throwing', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const name = 'run-e2e-dispatch-ward-5.json';

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({ rootPath, entries: [name], now, statNullFor: [name] });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('mixed sweep of timestamped and mtime-fallback files', () => {
    it('VALID: {timestamped-expired, timestamped-fresh, mtime-expired, mtime-fresh} => deletes only the expired files', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const expiredTimestamp = now - ttlStatics.runResultTtl - 1000;
      const freshTimestamp = now - 1000;
      const timestampedExpiredName = `run-${expiredTimestamp}-c3d4.json`;
      const timestampedFreshName = `run-${freshTimestamp}-e5f6.json`;
      const mtimeExpiredName = 'run-e2e-dispatch-ward-5.json';
      const mtimeFreshName = 'run-e2e-dispatch-ward-9.json';
      const expiredMtime = now - ttlStatics.runResultTtl - 1000;
      const freshMtime = now - 1000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [timestampedExpiredName, timestampedFreshName, mtimeExpiredName, mtimeFreshName],
        now,
        mtimes: { [mtimeExpiredName]: expiredMtime, [mtimeFreshName]: freshMtime },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([
        `${rootPath}/.ward/${timestampedExpiredName}`,
        `${rootPath}/.ward/${mtimeExpiredName}`,
      ]);
    });
  });

  describe('size budget', () => {
    const budget = storageBudgetStatics.limits.runResultsPerFolderBytes;
    const now = 1739629200000;
    const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
    const minute = 60000;

    it('VALID: {files all fit the budget exactly} => deletes nothing', async () => {
      const newest = `run-${now - minute}-aaaa.json`;
      const older = `run-${now - 2 * minute}-bbbb.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [newest, older],
        now,
        mtimes: { [newest]: now - minute, [older]: now - 2 * minute },
        sizes: { [newest]: budget - 10, [older]: 10 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });

    it('VALID: {newest fills the budget, two older files behind it} => deletes both older files, oldest last', async () => {
      const newest = `run-${now - minute}-aaaa.json`;
      const middle = `run-${now - 2 * minute}-bbbb.json`;
      const oldest = `run-${now - 3 * minute}-cccc.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [oldest, newest, middle],
        now,
        mtimes: { [newest]: now - minute, [middle]: now - 2 * minute, [oldest]: now - 3 * minute },
        sizes: { [newest]: budget, [middle]: 1, [oldest]: 1 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([
        `${rootPath}/.ward/${middle}`,
        `${rootPath}/.ward/${oldest}`,
      ]);
    });

    it('VALID: {a small file sits behind the file that crossed the budget} => deletes the small one too', async () => {
      const newest = `run-${now - minute}-aaaa.json`;
      const big = `run-${now - 2 * minute}-bbbb.json`;
      const small = `run-${now - 3 * minute}-cccc.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [newest, big, small],
        now,
        mtimes: { [newest]: now - minute, [big]: now - 2 * minute, [small]: now - 3 * minute },
        sizes: { [newest]: 100, [big]: budget, [small]: 1 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([
        `${rootPath}/.ward/${big}`,
        `${rootPath}/.ward/${small}`,
      ]);
    });

    it('EDGE: {the only file is larger than the whole budget} => keeps it, being the newest', async () => {
      const only = `run-${now - minute}-aaaa.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [only],
        now,
        mtimes: { [only]: now - minute },
        sizes: { [only]: budget * 2 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });

    it('VALID: {newest is oversized, one older file} => keeps the newest and deletes the older', async () => {
      const newest = `run-${now - minute}-aaaa.json`;
      const older = `run-${now - 2 * minute}-bbbb.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [older, newest],
        now,
        mtimes: { [newest]: now - minute, [older]: now - 2 * minute },
        sizes: { [newest]: budget * 2, [older]: 1 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${older}`]);
    });

    it('VALID: {non-timestamped name newest by mtime, timestamped names older} => ranks by mtime and deletes the oldest beyond budget', async () => {
      const dispatch = 'run-e2e-dispatch-ward-5.json';
      const stamped = `run-${now - 5 * minute}-aaaa.json`;
      const stampedOlder = `run-${now - 9 * minute}-bbbb.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [stampedOlder, stamped, dispatch],
        now,
        mtimes: {
          [dispatch]: now - minute,
          [stamped]: now - 5 * minute,
          [stampedOlder]: now - 9 * minute,
        },
        sizes: { [dispatch]: budget - 5, [stamped]: 5, [stampedOlder]: 1 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${stampedOlder}`]);
    });

    it('VALID: {expired file plus an over-budget file} => deletes the expired one first, then the over-budget one', async () => {
      const expired = `run-${now - ttlStatics.runResultTtl - minute}-dddd.json`;
      const newest = `run-${now - minute}-aaaa.json`;
      const older = `run-${now - 2 * minute}-bbbb.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [expired, newest, older],
        now,
        mtimes: { [newest]: now - minute, [older]: now - 2 * minute },
        sizes: { [newest]: budget, [older]: 1 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([
        `${rootPath}/.ward/${expired}`,
        `${rootPath}/.ward/${older}`,
      ]);
    });

    it('VALID: {two files with the same mtime} => keeps the one whose name sorts last, deletes the other', async () => {
      const first = `run-${now - minute}-aaaa.json`;
      const second = `run-${now - minute}-zzzz.json`;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: [first, second],
        now,
        mtimes: { [first]: now - minute, [second]: now - minute },
        sizes: { [first]: budget, [second]: budget },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([`${rootPath}/.ward/${first}`]);
    });

    it('VALID: {non-run files hold the space} => ignores them, deleting nothing', async () => {
      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        rootPath,
        entries: ['config.json', `run-${now - minute}-aaaa.json`],
        now,
        sizes: { 'config.json': budget * 2 },
      });

      await expect(storagePruneBroker({ rootPath })).resolves.toStrictEqual({ success: true });

      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });
});
