import { isStaleReservationRegistryEntryGuard } from './is-stale-reservation-registry-entry-guard';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

describe('isStaleReservationRegistryEntryGuard', () => {
  describe('a reservation past its own staleAfterMs window', () => {
    it('VALID: {bootedAtMs: null, reservedAtMs older than staleAfterMs} => returns true', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({
        bootedAtMs: null,
        reservedAtMs: nowMs - instanceLifecycleStatics.reservation.staleAfterMs - 1,
      });

      const result = isStaleReservationRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(true);
    });
  });

  describe('a reservation still inside its boot window', () => {
    it('INVALID: {bootedAtMs: null, reservedAtMs seconds ago} => returns false', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({
        bootedAtMs: null,
        reservedAtMs: nowMs - 5000,
      });

      const result = isStaleReservationRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(false);
    });
  });

  describe('an instance that already booted', () => {
    it('INVALID: {bootedAtMs set, reservedAtMs older than staleAfterMs} => returns false — not a reservation any more', () => {
      const nowMs = 1_700_000_000_000;
      const entry = RegistryEntryStub({
        bootedAtMs: nowMs - 1000,
        reservedAtMs: nowMs - instanceLifecycleStatics.reservation.staleAfterMs - 1,
      });

      const result = isStaleReservationRegistryEntryGuard({ entry, nowMs });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      const result = isStaleReservationRegistryEntryGuard({ nowMs: 1 });

      expect(result).toBe(false);
    });

    it('EMPTY: {nowMs: undefined} => returns false', () => {
      const entry = RegistryEntryStub({ bootedAtMs: null });

      const result = isStaleReservationRegistryEntryGuard({ entry });

      expect(result).toBe(false);
    });
  });
});
