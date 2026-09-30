/**
 * PURPOSE: Builds a valid UsageLedgerScanFlightState for tests
 *
 * USAGE:
 * UsageLedgerScanFlightStateStub();
 * // Returns a valid UsageLedgerScanFlightState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { usageLedgerScanFlightStateContract } from './usage-ledger-scan-flight-state-contract';
import type { UsageLedgerScanFlightState } from './usage-ledger-scan-flight-state-contract';

export const UsageLedgerScanFlightStateStub = ({
  ...props
}: StubArgument<UsageLedgerScanFlightState> = {}): UsageLedgerScanFlightState =>
  usageLedgerScanFlightStateContract.parse({ inFlight: false, ...props });
