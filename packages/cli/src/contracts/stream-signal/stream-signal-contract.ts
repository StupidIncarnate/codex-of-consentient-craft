/**
 * PURPOSE: Provides stream-signal contract from orchestrator
 *
 * USAGE:
 * streamSignalContract.parse({signal: 'complete', stepId, summary});
 * // Returns: StreamSignal object
 */

import {
  streamSignalContract as orcStreamSignalContract,
  type StreamSignal as OrcStreamSignal,
} from '@dungeonmaster/orchestrator';

export const streamSignalContract = orcStreamSignalContract;

export type StreamSignal = OrcStreamSignal;
