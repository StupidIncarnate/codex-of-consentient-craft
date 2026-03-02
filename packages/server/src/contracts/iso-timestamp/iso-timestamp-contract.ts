/**
 * PURPOSE: Re-exports iso-timestamp contract from orchestrator package for use in server responders
 *
 * USAGE:
 * isoTimestampContract.parse(new Date().toISOString());
 * // Returns: IsoTimestamp branded string
 */

import {
  isoTimestampContract as orcIsoTimestampContract,
  type IsoTimestamp as OrcIsoTimestamp,
} from '@dungeonmaster/orchestrator';

export const isoTimestampContract = orcIsoTimestampContract;

export type IsoTimestamp = OrcIsoTimestamp;
