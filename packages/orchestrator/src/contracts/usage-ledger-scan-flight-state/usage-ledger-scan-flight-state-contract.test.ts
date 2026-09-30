import { UsageLedgerScanFlightStateStub } from './usage-ledger-scan-flight-state.stub';
import { usageLedgerScanFlightStateContract } from './usage-ledger-scan-flight-state-contract';

describe('usageLedgerScanFlightStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UsageLedgerScanFlightStateStub();

      expect(usageLedgerScanFlightStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {inFlight: wrong type} => throws', () => {
      expect(() =>
        usageLedgerScanFlightStateContract.parse({
          ...UsageLedgerScanFlightStateStub(),
          inFlight: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
