import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { DiskItemStub } from '../../../contracts/disk-item/disk-item.stub';
import { diskStoresStatics } from '../../../statics/disk-stores/disk-stores-statics';
import { diskBudgetEnforceBroker } from './disk-budget-enforce-broker';
import { diskBudgetEnforceBrokerProxy } from './disk-budget-enforce-broker.proxy';

describe('diskBudgetEnforceBroker', () => {
  describe('rate limiting', () => {
    it('VALID: {lastRunMs inside runEveryMs, mode: default} => returns ran: false and does not scan or delete', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;
      const lastRunMs = currentTime - (diskStoresStatics.runEveryMs - 1000);

      proxy.setLastRunMs({ lastRunMs });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: false,
        deletedBytes: 0,
        deletedCount: 0,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [],
        deletedItems: [],
      });
      expect(proxy.getLastRunMs()).toBe(lastRunMs);
    });

    it('VALID: {lastRunMs older than runEveryMs, mode: default} => runs, updates lastRunMs timestamp, and returns results', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;
      const lastRunMs = currentTime - (diskStoresStatics.runEveryMs + 1000);

      proxy.setLastRunMs({ lastRunMs });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });
      proxy.setupReaddir({ path: `${currentRepoRoot}/.ward`, names: [] });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 0,
        deletedCount: 0,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [],
        deletedItems: [],
      });
      expect(proxy.getLastRunMs()).toBe(currentTime);
    });

    it('EMPTY: {no prior run in meta table} => runs, sets initial lastRunMs, and returns results', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_000_000;

      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });
      proxy.setupReaddir({ path: `${currentRepoRoot}/.ward`, names: [] });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 0,
        deletedCount: 0,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [],
        deletedItems: [],
      });
      expect(proxy.getLastRunMs()).toBe(currentTime);
    });
  });

  describe('mode: all', () => {
    it('VALID: {mode: all} => bypasses rate limit even when called immediately after prior run', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;
      const lastRunMs = currentTime - 5000;

      proxy.setLastRunMs({ lastRunMs });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });
      proxy.setupReaddir({ path: `${currentRepoRoot}/.ward`, names: [] });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'all',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 0,
        deletedCount: 0,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [],
        deletedItems: [],
      });
      expect(proxy.getLastRunMs()).toBe(currentTime);
    });
  });

  describe('deletions and path safety', () => {
    it('VALID: {items exceeding maxDiskMB cap} => plans deletions, verifies realpath safety, and deletes with rm', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;

      proxy.setupLimits({ maxDiskMB: 1024 });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });

      const run1 = `${currentRepoRoot}/.ward/run-1.json`;
      const run2 = `${currentRepoRoot}/.ward/run-2.json`;
      const run3 = `${currentRepoRoot}/.ward/run-3.json`;

      proxy.setupReaddir({
        path: `${currentRepoRoot}/.ward`,
        names: ['run-1.json', 'run-2.json', 'run-3.json'],
      });
      const oldTime = currentTime - diskStoresStatics.minAgeMs - 100_000;
      proxy.setupLstatFile({ path: run1, sizeBytes: 1_000_000_000, mtimeMs: oldTime });
      proxy.setupLstatFile({ path: run2, sizeBytes: 1_000_000_000, mtimeMs: oldTime + 1000 });
      proxy.setupLstatFile({ path: run3, sizeBytes: 1_000_000_000, mtimeMs: oldTime + 2000 });

      proxy.setupSafeRealpath({ path: run1 });
      proxy.setupSafeRealpath({ path: run2 });
      proxy.setupRm({ path: run1 });
      proxy.setupRm({ path: run2 });

      const item1 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run1,
        bytes: 1_000_000_000,
        mtimeMs: oldTime,
        protectedReason: null,
      });
      const item2 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run2,
        bytes: 1_000_000_000,
        mtimeMs: oldTime + 1000,
        protectedReason: null,
      });
      const item3 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run3,
        bytes: 1_000_000_000,
        mtimeMs: oldTime + 2000,
        protectedReason: 'newest-per-repo',
      });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 2_000_000_000,
        deletedCount: 2,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [item1, item2, item3],
        deletedItems: [item1, item2],
      });
      expect(proxy.getRmCallsFor({ path: run1 })).toStrictEqual([
        [run1, { recursive: true, force: true }],
      ]);
      expect(proxy.getRmCallsFor({ path: run2 })).toStrictEqual([
        [run2, { recursive: true, force: true }],
      ]);
    });

    it('EDGE: {item symlink resolves outside store root} => skips deletion of the item', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;

      proxy.setupLimits({ maxDiskMB: 1024 });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });

      const run1 = `${currentRepoRoot}/.ward/run-1.json`;
      const run2 = `${currentRepoRoot}/.ward/run-2.json`;

      proxy.setupReaddir({
        path: `${currentRepoRoot}/.ward`,
        names: ['run-1.json', 'run-2.json'],
      });
      const oldTime = currentTime - diskStoresStatics.minAgeMs - 100_000;
      proxy.setupLstatFile({ path: run1, sizeBytes: 2_000_000_000, mtimeMs: oldTime });
      proxy.setupLstatFile({ path: run2, sizeBytes: 1_000_000_000, mtimeMs: oldTime + 1000 });

      proxy.setupUnsafeRealpath({ path: run1, targetPath: '/outside/important.txt' });

      const item1 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run1,
        bytes: 2_000_000_000,
        mtimeMs: oldTime,
        protectedReason: null,
      });
      const item2 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run2,
        bytes: 1_000_000_000,
        mtimeMs: oldTime + 1000,
        protectedReason: 'newest-per-repo',
      });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 2_000_000_000,
        deletedCount: 1,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [item1, item2],
        deletedItems: [item1],
      });
      expect(proxy.getRmCallsFor({ path: run1 })).toStrictEqual([]);
    });

    it('EDGE: {rm throws ENOENT} => treats as already removed and completes without error', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;

      proxy.setupLimits({ maxDiskMB: 1024 });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });

      const run1 = `${currentRepoRoot}/.ward/run-1.json`;
      const run2 = `${currentRepoRoot}/.ward/run-2.json`;

      proxy.setupReaddir({
        path: `${currentRepoRoot}/.ward`,
        names: ['run-1.json', 'run-2.json'],
      });
      const oldTime = currentTime - diskStoresStatics.minAgeMs - 100_000;
      proxy.setupLstatFile({ path: run1, sizeBytes: 2_000_000_000, mtimeMs: oldTime });
      proxy.setupLstatFile({ path: run2, sizeBytes: 1_000_000_000, mtimeMs: oldTime + 1000 });

      proxy.setupSafeRealpath({ path: run1 });
      proxy.setupRmError({ path: run1, error: FsErrorStub({ code: 'ENOENT', path: run1 }) });

      const item1 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run1,
        bytes: 2_000_000_000,
        mtimeMs: oldTime,
        protectedReason: null,
      });
      const item2 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run2,
        bytes: 1_000_000_000,
        mtimeMs: oldTime + 1000,
        protectedReason: 'newest-per-repo',
      });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 2_000_000_000,
        deletedCount: 1,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [item1, item2],
        deletedItems: [item1],
      });
    });

    it('ERROR: {rm throws other error like EACCES} => catches and skips without throwing', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;

      proxy.setupLimits({ maxDiskMB: 1024 });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });

      const run1 = `${currentRepoRoot}/.ward/run-1.json`;
      const run2 = `${currentRepoRoot}/.ward/run-2.json`;

      proxy.setupReaddir({
        path: `${currentRepoRoot}/.ward`,
        names: ['run-1.json', 'run-2.json'],
      });
      const oldTime = currentTime - diskStoresStatics.minAgeMs - 100_000;
      proxy.setupLstatFile({ path: run1, sizeBytes: 2_000_000_000, mtimeMs: oldTime });
      proxy.setupLstatFile({ path: run2, sizeBytes: 1_000_000_000, mtimeMs: oldTime + 1000 });

      proxy.setupSafeRealpath({ path: run1 });
      proxy.setupRmError({ path: run1, error: FsErrorStub({ code: 'EACCES', path: run1 }) });

      const item1 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run1,
        bytes: 2_000_000_000,
        mtimeMs: oldTime,
        protectedReason: null,
      });
      const item2 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run2,
        bytes: 1_000_000_000,
        mtimeMs: oldTime + 1000,
        protectedReason: 'newest-per-repo',
      });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 2_000_000_000,
        deletedCount: 1,
        shortfallBytes: 0,
        skipped: 0,
        scannedItems: [item1, item2],
        deletedItems: [item1],
      });
    });
  });

  describe('shortfall reporting', () => {
    it('EDGE: {cap cannot be met due to protected items} => reports positive shortfallBytes', async () => {
      const proxy = diskBudgetEnforceBrokerProxy();
      const currentRepoRoot = '/test-repo';
      const currentTime = 1_700_000_600_000;

      proxy.setupLimits({ maxDiskMB: 1024 });
      proxy.setupRepoRoot({ path: currentRepoRoot, exists: true });
      proxy.setupReaddir({ path: `${currentRepoRoot}/packages`, names: [] });

      const run1 = `${currentRepoRoot}/.ward/run-1.json`;

      proxy.setupReaddir({
        path: `${currentRepoRoot}/.ward`,
        names: ['run-1.json'],
      });
      proxy.setupLstatFile({ path: run1, sizeBytes: 2_000_000_000, mtimeMs: 1000 });

      const item1 = DiskItemStub({
        storeId: 'ward-run-results',
        path: run1,
        bytes: 2_000_000_000,
        mtimeMs: 1000,
        protectedReason: 'newest-per-repo',
      });

      const result = await diskBudgetEnforceBroker({
        currentRepoRoot,
        mode: 'default',
        nowMs: currentTime,
      });

      expect(result).toStrictEqual({
        ran: true,
        deletedBytes: 0,
        deletedCount: 0,
        shortfallBytes: 926_258_176,
        skipped: 0,
        scannedItems: [item1],
        deletedItems: [],
      });
    });
  });
});
