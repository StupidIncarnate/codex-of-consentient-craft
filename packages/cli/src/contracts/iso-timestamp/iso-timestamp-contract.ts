/**
 * PURPOSE: Provides iso-timestamp contract from orchestrator
 *
 * USAGE:
 * isoTimestampContract.parse('2024-01-15T10:00:00.000Z');
 * // Returns: IsoTimestamp branded string
 */

import {
  isoTimestampContract as orcIsoTimestampContract,
  type IsoTimestamp as OrcIsoTimestamp,
} from '@dungeonmaster/orchestrator';

export const isoTimestampContract = orcIsoTimestampContract;

export type IsoTimestamp = OrcIsoTimestamp;
