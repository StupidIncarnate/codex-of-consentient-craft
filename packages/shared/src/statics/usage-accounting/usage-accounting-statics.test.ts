import { usageAccountingStatics } from './usage-accounting-statics';

describe('usageAccountingStatics', () => {
  it('VALID: full statics => contains the weights, window lengths and bucket size', () => {
    expect(usageAccountingStatics).toStrictEqual({
      weights: {
        input: 1,
        cacheCreation: 1.25,
        cacheRead: 0.1,
        output: 5,
      },
      windows: {
        fiveHourMs: 18_000_000,
        sevenDayMs: 604_800_000,
      },
      bucket: {
        durationMs: 3_600_000,
      },
      scan: {
        batchSize: 16,
        minIntervalMs: 60_000,
      },
    });
  });

  it('VALID: windows.fiveHourMs => is five hours in milliseconds', () => {
    expect(usageAccountingStatics.windows.fiveHourMs / 3_600_000).toBe(5);
  });

  it('VALID: windows.sevenDayMs => is seven days in milliseconds', () => {
    expect(usageAccountingStatics.windows.sevenDayMs / 86_400_000).toBe(7);
  });

  it('VALID: bucket.durationMs => divides both windows exactly, so no bucket straddles an edge', () => {
    expect([
      usageAccountingStatics.windows.fiveHourMs % usageAccountingStatics.bucket.durationMs,
      usageAccountingStatics.windows.sevenDayMs % usageAccountingStatics.bucket.durationMs,
    ]).toStrictEqual([0, 0]);
  });
});
