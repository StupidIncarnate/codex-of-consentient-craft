/**
 * PURPOSE: Provides process-id contract from shared package
 *
 * USAGE:
 * processIdContract.parse('proc-12345');
 * // Returns: ProcessId branded string
 */

import {
  processIdContract as sharedProcessIdContract,
  type ProcessId as SharedProcessId,
} from '@dungeonmaster/shared/contracts';

export const processIdContract = sharedProcessIdContract;

export type ProcessId = SharedProcessId;
