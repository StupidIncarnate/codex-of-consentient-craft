import { usageLedgerDefaultStatics } from './usage-ledger-default-statics';

describe('usageLedgerDefaultStatics', () => {
  it('VALID: full statics => is an unmeasured, uncalibrated ledger stamped at the epoch', () => {
    expect(usageLedgerDefaultStatics).toStrictEqual({
      empty: {
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: null, sevenDay: null },
        updatedAt: '1970-01-01T00:00:00.000Z',
      },
    });
  });

  it('VALID: empty.ceilings => are null rather than zero, so nothing reads as a calibrated denominator', () => {
    expect(usageLedgerDefaultStatics.empty.ceilings).toStrictEqual({
      fiveHour: null,
      sevenDay: null,
    });
  });
});
