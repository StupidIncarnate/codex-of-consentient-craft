import { usageLedgerScanFlightStateContract } from '../../contracts/usage-ledger-scan-flight-state/usage-ledger-scan-flight-state-contract';
import type { UsageLedgerScanFlightState } from '../../contracts/usage-ledger-scan-flight-state/usage-ledger-scan-flight-state-contract';
/**
 * PURPOSE: Records whether this process has a usage-ledger scan running, so the rate-limits poller
 *   starts at most one at a time. The poller ticks every 5s and a scan's throttle stamp lands only
 *   when the scan finishes, so without this flag every tick during a slow scan starts another one,
 *   the overlapping scans slow each other down, and the pile-up grows for the life of the process.
 *
 * USAGE:
 * usageLedgerScanFlightState.start();
 * usageLedgerScanFlightState.isInFlight();
 * // Returns true until finish() is called
 * usageLedgerScanFlightState.finish();
 */

const state: UsageLedgerScanFlightState = usageLedgerScanFlightStateContract.parse({ inFlight: false });

export const usageLedgerScanFlightState = {
  isInFlight: (): boolean => state.inFlight,

  start: (): void => {
    state.inFlight = true;
  },

  finish: (): void => {
    state.inFlight = false;
  },
};
