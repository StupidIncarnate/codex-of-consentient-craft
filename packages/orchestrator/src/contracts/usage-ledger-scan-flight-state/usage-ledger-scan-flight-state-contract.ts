/**
 * PURPOSE: Defines the data held by `state` in usage-ledger-scan-flight-state
 *
 * USAGE:
 * usageLedgerScanFlightStateContract.parse(value);
 * // Returns validated UsageLedgerScanFlightState
 */
import { z } from '#gateway/npm/zod';

export const usageLedgerScanFlightStateContract = z
  .object({ inFlight: z.boolean() })
  .brand<'UsageLedgerScanFlightState'>();

export type UsageLedgerScanFlightState = z.infer<typeof usageLedgerScanFlightStateContract>;
