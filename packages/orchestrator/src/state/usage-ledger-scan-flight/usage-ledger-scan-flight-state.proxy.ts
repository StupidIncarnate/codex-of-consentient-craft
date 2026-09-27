import { usageLedgerScanFlightState } from './usage-ledger-scan-flight-state';

export const usageLedgerScanFlightStateProxy = (): {
  reset: () => void;
} => ({
  reset: (): void => {
    usageLedgerScanFlightState.finish();
  },
});
