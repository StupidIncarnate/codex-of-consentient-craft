/**
 * PURPOSE: Provides timeout-ms contract from orchestrator
 *
 * USAGE:
 * timeoutMsContract.parse(60000);
 * // Returns: TimeoutMs branded number
 */

import {
  timeoutMsContract as orcTimeoutMsContract,
  type TimeoutMs as OrcTimeoutMs,
} from '@dungeonmaster/orchestrator';

export const timeoutMsContract = orcTimeoutMsContract;

export type TimeoutMs = OrcTimeoutMs;
