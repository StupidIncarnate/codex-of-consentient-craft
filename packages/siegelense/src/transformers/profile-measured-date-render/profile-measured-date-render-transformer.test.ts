import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';

import { profileMeasuredDateRenderTransformer } from './profile-measured-date-render-transformer';

describe('profileMeasuredDateRenderTransformer', () => {
  describe('valid epochs', () => {
    it('VALID: {measuredAtMs: 2025-09-14T00:00:00Z} => returns "2025-09-14"', () => {
      const measuredAtMs = EpochMsStub({ value: Date.UTC(2025, 8, 14, 0, 0, 0) });

      expect(profileMeasuredDateRenderTransformer({ measuredAtMs })).toBe('2025-09-14');
    });

    it('EDGE: {measuredAtMs: 2025-09-14T23:59:59Z} => stays on the same UTC day', () => {
      const measuredAtMs = EpochMsStub({ value: Date.UTC(2025, 8, 14, 23, 59, 59) });

      expect(profileMeasuredDateRenderTransformer({ measuredAtMs })).toBe('2025-09-14');
    });

    it('EDGE: {measuredAtMs: 0} => returns the epoch date "1970-01-01"', () => {
      const measuredAtMs = EpochMsStub({ value: 0 });

      expect(profileMeasuredDateRenderTransformer({ measuredAtMs })).toBe('1970-01-01');
    });

    it('EDGE: {measuredAtMs: a leap day} => returns "2024-02-29"', () => {
      const measuredAtMs = EpochMsStub({ value: Date.UTC(2024, 1, 29, 12, 0, 0) });

      expect(profileMeasuredDateRenderTransformer({ measuredAtMs })).toBe('2024-02-29');
    });
  });
});
