import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

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
      proxy.setupReaddirFail({ rootPath, error: new Error('ENOENT: no such file or directory') });

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
    it('VALID: {run-<expired-timestamp>-a1b2.json, no stat staged} => deletes based on the filename without consulting mtime', async () => {
      const now = 1739629200000;
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const expiredTimestamp = now - ttlStatics.runResultTtl - 1000;
      const name = `run-${expiredTimestamp}-a1b2.json`;

      const proxy = storagePruneBrokerProxy();
      // No mtimes/statNullFor entry for `name` — fsStatAdapter is never staged for it, so a call
      // to it would throw "nothing set up" and the whole sweep would abort with zero deletions.
      // The file still getting deleted proves the timestamp branch decided without consulting stat.
      proxy.setupWithFiles({ rootPath, entries: [name], now });

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
});
