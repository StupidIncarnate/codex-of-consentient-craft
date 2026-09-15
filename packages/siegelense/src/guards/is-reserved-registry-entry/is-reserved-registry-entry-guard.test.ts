import { isReservedRegistryEntryGuard } from './is-reserved-registry-entry-guard';
import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';

describe('isReservedRegistryEntryGuard', () => {
  describe('a reservation row', () => {
    it('VALID: {entry: bootedAtMs null} => returns true', () => {
      const entry = RegistryEntryStub({ bootedAtMs: null });

      const result = isReservedRegistryEntryGuard({ entry });

      expect(result).toBe(true);
    });
  });

  describe('a booted row', () => {
    it('INVALID: {entry: bootedAtMs set} => returns false', () => {
      const entry = RegistryEntryStub({ bootedAtMs: EpochMsStub() });

      const result = isReservedRegistryEntryGuard({ entry });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      const result = isReservedRegistryEntryGuard({});

      expect(result).toBe(false);
    });
  });
});
