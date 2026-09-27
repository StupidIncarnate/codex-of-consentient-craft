import { usageLedgerScanFlightState } from './usage-ledger-scan-flight-state';
import { usageLedgerScanFlightStateProxy } from './usage-ledger-scan-flight-state.proxy';

describe('usageLedgerScanFlightState', () => {
  it('EMPTY: {fresh} => isInFlight returns false', () => {
    const proxy = usageLedgerScanFlightStateProxy();
    proxy.reset();

    expect(usageLedgerScanFlightState.isInFlight()).toBe(false);
  });

  it('VALID: {start} => isInFlight returns true', () => {
    const proxy = usageLedgerScanFlightStateProxy();
    proxy.reset();

    usageLedgerScanFlightState.start();

    expect(usageLedgerScanFlightState.isInFlight()).toBe(true);
  });

  it('VALID: {start then finish} => isInFlight returns false', () => {
    const proxy = usageLedgerScanFlightStateProxy();
    proxy.reset();

    usageLedgerScanFlightState.start();
    usageLedgerScanFlightState.finish();

    expect(usageLedgerScanFlightState.isInFlight()).toBe(false);
  });
});
