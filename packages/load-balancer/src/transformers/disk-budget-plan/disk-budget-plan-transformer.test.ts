import { DiskItemStub } from '../../contracts/disk-item/disk-item.stub';
import { diskStoresStatics } from '../../statics/disk-stores/disk-stores-statics';
import { diskBudgetPlanTransformer } from './disk-budget-plan-transformer';

const BYTES_PER_MEGABYTE = 1_048_576;
const NOW_MS = 2_000_000_000_000;

describe('diskBudgetPlanTransformer', () => {
  describe('under cap', () => {
    it('VALID: {items under cap} => returns empty deletions and zero shortfall', () => {
      const item1 = DiskItemStub({
        bytes: 1_000_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });
      const item2 = DiskItemStub({
        bytes: 2_000_000,
        mtimeMs: NOW_MS - 2_000_000,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [item1, item2],
        maxDiskMB: 10,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [],
        totalBytes: 3_000_000,
        remainingBytes: 3_000_000,
        capBytes: 10 * BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });

    it('EDGE: {exact cap boundary} => returns empty deletions and zero shortfall', () => {
      const item = DiskItemStub({
        bytes: BYTES_PER_MEGABYTE,
        mtimeMs: NOW_MS - 2_000_000,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [item],
        maxDiskMB: 1,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [],
        totalBytes: BYTES_PER_MEGABYTE,
        remainingBytes: BYTES_PER_MEGABYTE,
        capBytes: BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });

    it('EMPTY: {empty items list} => returns zero counts and empty deletions', () => {
      const result = diskBudgetPlanTransformer({
        items: [],
        maxDiskMB: 4,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [],
        totalBytes: 0,
        remainingBytes: 0,
        capBytes: 4 * BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });
  });

  describe('over cap', () => {
    it('VALID: {items over cap} => deletes oldest eligible items first across stores until under cap', () => {
      const itemOldest = DiskItemStub({
        storeId: 'ward-run-results',
        path: '/repo/.ward/run-oldest.json',
        bytes: 1_000_000,
        mtimeMs: NOW_MS - 3_000_000,
        protectedReason: null,
      });
      const itemMiddle = DiskItemStub({
        storeId: 'jest-transform-cache',
        path: '/tmp/jest_user/middle',
        bytes: 1_000_000,
        mtimeMs: NOW_MS - 2_000_000,
        protectedReason: null,
      });
      const itemNewest = DiskItemStub({
        storeId: 'ward-bundle-cache',
        path: '/repo/packages/web/.ward/bundle/newest',
        bytes: 1_000_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [itemNewest, itemOldest, itemMiddle],
        maxDiskMB: 2,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [itemOldest],
        totalBytes: 3_000_000,
        remainingBytes: 2_000_000,
        capBytes: 2 * BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });

    it('EDGE: {tied mtimeMs} => sorts stably by path ascending', () => {
      const itemZ = DiskItemStub({
        path: '/repo/store/z-item.json',
        bytes: 600_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });
      const itemA = DiskItemStub({
        path: '/repo/store/a-item.json',
        bytes: 600_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [itemZ, itemA],
        maxDiskMB: 1,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [itemA],
        totalBytes: 1_200_000,
        remainingBytes: 600_000,
        capBytes: BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });

    it('VALID: {default nowMs} => uses Date.now() when nowMs is omitted', () => {
      const item = DiskItemStub({
        bytes: 2_000_000,
        mtimeMs: 0,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [item],
        maxDiskMB: 1,
      });

      expect(result).toStrictEqual({
        deletions: [item],
        totalBytes: 2_000_000,
        remainingBytes: 0,
        capBytes: BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });
  });

  describe('protection and age exclusions', () => {
    it('VALID: {protected items} => never includes protected items in deletions even if ancient', () => {
      const itemAncientProtected = DiskItemStub({
        path: '/tmp/dm-e2e-1234',
        bytes: 1_000_000,
        mtimeMs: NOW_MS - 100_000_000,
        protectedReason: 'pid-alive:1234',
      });
      const itemEligible = DiskItemStub({
        path: '/repo/.ward/run-old.json',
        bytes: 500_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [itemAncientProtected, itemEligible],
        maxDiskMB: 1,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [itemEligible],
        totalBytes: 1_500_000,
        remainingBytes: 1_000_000,
        capBytes: BYTES_PER_MEGABYTE,
        shortfallBytes: 0,
      });
    });

    it('VALID: {young items} => never includes items younger than minAgeMs in deletions', () => {
      const itemYoung = DiskItemStub({
        path: '/repo/.ward/run-young.json',
        bytes: 2_000_000,
        mtimeMs: NOW_MS - (diskStoresStatics.minAgeMs - 1_000),
        protectedReason: null,
      });

      const result = diskBudgetPlanTransformer({
        items: [itemYoung],
        maxDiskMB: 1,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [],
        totalBytes: 2_000_000,
        remainingBytes: 2_000_000,
        capBytes: BYTES_PER_MEGABYTE,
        shortfallBytes: 2_000_000 - BYTES_PER_MEGABYTE,
      });
    });
  });

  describe('shortfall handling', () => {
    it('VALID: {eligible items exhausted} => reports shortfallBytes > 0 without throwing', () => {
      const itemEligible = DiskItemStub({
        path: '/repo/.ward/run-old.json',
        bytes: 500_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });
      const itemProtected = DiskItemStub({
        path: '/tmp/dm-e2e-5678',
        bytes: 2_000_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: 'pid-alive:5678',
      });

      const result = diskBudgetPlanTransformer({
        items: [itemEligible, itemProtected],
        maxDiskMB: 1,
        nowMs: NOW_MS,
      });

      const expectedCap = BYTES_PER_MEGABYTE;
      const expectedRemaining = 2_000_000;
      const expectedShortfall = expectedRemaining - expectedCap;

      expect(result).toStrictEqual({
        deletions: [itemEligible],
        totalBytes: 2_500_000,
        remainingBytes: expectedRemaining,
        capBytes: expectedCap,
        shortfallBytes: expectedShortfall,
      });
    });

    it('VALID: {mode: all} => targets all unprotected items regardless of budget or age', () => {
      const itemYoung = DiskItemStub({
        path: '/repo/.ward/run-young.json',
        bytes: 500_000,
        mtimeMs: NOW_MS - 10_000, // young
        protectedReason: null,
      });
      const itemOld = DiskItemStub({
        path: '/repo/.ward/run-old.json',
        bytes: 500_000,
        mtimeMs: NOW_MS - 1_000_000,
        protectedReason: null,
      });
      const itemProtected = DiskItemStub({
        path: '/tmp/dm-e2e-1234',
        bytes: 2_000_000,
        mtimeMs: NOW_MS - 2_000_000,
        protectedReason: 'pid-alive:1234',
      });

      const result = diskBudgetPlanTransformer({
        items: [itemYoung, itemOld, itemProtected],
        maxDiskMB: 16384, // plenty of budget, but mode: 'all' cleans all unprotected
        mode: 'all',
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        deletions: [itemOld, itemYoung],
        totalBytes: 3_000_000,
        remainingBytes: 2_000_000,
        capBytes: 0,
        shortfallBytes: 2_000_000,
      });
    });
  });
});
