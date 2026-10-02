import { LeaseStub } from '../../contracts/lease/lease.stub';
import { MachineReadingStub } from '../../contracts/machine-reading/machine-reading.stub';
import { capacitySuggestTransformer } from './capacity-suggest-transformer';

const BASE_NOW_MS = 1_700_000_100_000;
const OLD_LEASE_MS = BASE_NOW_MS - 65_000;
const RECENT_LEASE_MS = BASE_NOW_MS - 30_000;

describe('capacitySuggestTransformer', () => {
  describe('resource limits and binding', () => {
    it('VALID: {high memory, constrained cores} => CPU binds', () => {
      const machine = MachineReadingStub({
        cores: 4,
        loadAvg: [2.0, 1.0, 1.0],
        freeMemMB: 8000,
        totalMemMB: 16_000,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 2,
        cpuLimit: 2,
        freeMemoryLimit: 14,
        capMemoryLimit: 25,
      });
    });

    it('VALID: {ample CPU, constrained free memory} => free memory binds', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 1512,
        totalMemMB: 16_000,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 2,
        cpuLimit: 8,
        freeMemoryLimit: 2,
        capMemoryLimit: 25,
      });
    });

    it('VALID: {ample free memory, constrained cap} => cap binds while free memory is plentiful', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 8000,
        totalMemMB: 4000,
      });
      const lease = LeaseStub({
        state: 'running',
        currentRssMB: 2000,
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 2,
        cpuLimit: 8,
        freeMemoryLimit: 14,
        capMemoryLimit: 2,
      });
    });

    it('VALID: {starting lease present} => starting lease peak is debited from free memory', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 2512,
        totalMemMB: 16_000,
      });
      const lease = LeaseStub({
        state: 'starting',
        expectedPeakMB: 1000,
        currentRssMB: null,
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 2,
        cpuLimit: 8,
        freeMemoryLimit: 2,
        capMemoryLimit: 23,
      });
    });

    it('VALID: {running lease with RSS} => running lease current RSS is counted against cap', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 10_000,
        totalMemMB: 10_000,
      });
      const lease = LeaseStub({
        state: 'running',
        currentRssMB: 6500,
        expectedPeakMB: 1000,
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 3,
        cpuLimit: 8,
        freeMemoryLimit: 18,
        capMemoryLimit: 3,
      });
    });
  });

  describe('no job peak', () => {
    it('VALID: {job.peakMB is null} => memory limits are null, CPU binds', () => {
      const machine = MachineReadingStub({
        cores: 4,
        loadAvg: [1.0, 1.0, 1.0],
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [],
        job: { peakMB: null },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 3,
        cpuLimit: 3,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });

    it('VALID: {job.peakMB is 0} => memory limits are null, CPU binds', () => {
      const machine = MachineReadingStub({
        cores: 4,
        loadAvg: [1.0, 1.0, 1.0],
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [],
        job: { peakMB: 0 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 3,
        cpuLimit: 3,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });
  });

  describe('lease age and CPU limit', () => {
    it('VALID: {lease age < 60s} => leases younger than 60s reduce CPU limit', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
      });
      const recentLease = LeaseStub({
        startedAtMs: RECENT_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [recentLease],
        job: { peakMB: null },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 7,
        cpuLimit: 7,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });

    it('VALID: {lease age >= 60s} => leases older than 60s do not reduce CPU limit', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
      });
      const oldLease = LeaseStub({
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [oldLease],
        job: { peakMB: null },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 8,
        cpuLimit: 8,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });
  });

  describe('negative results clamping', () => {
    it('VALID: {recent leases exceed cores} => negative CPU limit clamped to 0', () => {
      const machine = MachineReadingStub({
        cores: 1,
        loadAvg: [5.0, 5.0, 5.0],
      });
      const lease1 = LeaseStub({
        leaseId: 'lease-1',
        startedAtMs: RECENT_LEASE_MS,
      });
      const lease2 = LeaseStub({
        leaseId: 'lease-2',
        startedAtMs: RECENT_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease1, lease2],
        job: { peakMB: null },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 0,
        cpuLimit: 0,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });

    it('VALID: {negative available free memory} => negative free memory limit clamped to 0', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 200,
        totalMemMB: 16_000,
      });
      const lease = LeaseStub({
        state: 'starting',
        expectedPeakMB: 500,
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 0,
        cpuLimit: 8,
        freeMemoryLimit: 0,
        capMemoryLimit: 24,
      });
    });

    it('VALID: {negative available cap memory} => negative cap memory limit clamped to 0', () => {
      const machine = MachineReadingStub({
        cores: 8,
        loadAvg: [0.0, 0.0, 0.0],
        freeMemMB: 8000,
        totalMemMB: 1000,
      });
      const lease = LeaseStub({
        state: 'running',
        currentRssMB: 900,
        startedAtMs: OLD_LEASE_MS,
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [lease],
        job: { peakMB: 500 },
        maxMemoryPercent: 80,
        nowMs: BASE_NOW_MS,
      });

      expect(result).toStrictEqual({
        suggestion: 0,
        cpuLimit: 8,
        freeMemoryLimit: 14,
        capMemoryLimit: 0,
      });
    });

    it('VALID: {nowMs omitted} => defaults to current timestamp without error', () => {
      const machine = MachineReadingStub({
        cores: 4,
        loadAvg: [1.0, 1.0, 1.0],
      });

      const result = capacitySuggestTransformer({
        machine,
        liveLeases: [],
        job: { peakMB: null },
        maxMemoryPercent: 80,
      });

      expect(result).toStrictEqual({
        suggestion: 3,
        cpuLimit: 3,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });
  });
});
