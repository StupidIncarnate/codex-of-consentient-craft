import { isStaleRegistryEntryGuard } from './is-stale-registry-entry-guard';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

const STALENESS_THRESHOLD_MS =
  instanceLifecycleStatics.heartbeat.intervalMs * instanceLifecycleStatics.heartbeat.stalenessBeats;

describe('isStaleRegistryEntryGuard', () => {
  describe('a heartbeat that went cold', () => {
    it('VALID: {lastBeatMs older than the threshold} => returns true', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({
        lastBeatMs: nowMs - STALENESS_THRESHOLD_MS - 1,
      });

      const result = isStaleRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(true);
    });
  });

  describe('a heartbeat still within the window', () => {
    it('INVALID: {lastBeatMs within the threshold} => returns false', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({
        lastBeatMs: nowMs - STALENESS_THRESHOLD_MS + 1,
      });

      const result = isStaleRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(false);
    });
  });

  describe('a reservation that has never beaten', () => {
    it('EDGE: {lastBeatMs: null} => returns false — never-beaten is not the same as gone-cold', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({ lastBeatMs: null });

      const result = isStaleRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      const result = isStaleRegistryEntryGuard({ nowMs: 1 });

      expect(result).toBe(false);
    });

    it('EMPTY: {nowMs: undefined} => returns false', () => {
      const entry = RegistryEntryStub({ lastBeatMs: 0 });

      const result = isStaleRegistryEntryGuard({ entry });

      expect(result).toBe(false);
    });
  });
});
