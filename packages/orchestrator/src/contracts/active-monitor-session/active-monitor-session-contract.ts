/**
 * PURPOSE: Defines the shape of the currently-registered /dumpster-launch monitor session tracked in monitorSessionState
 *
 * USAGE:
 * activeMonitorSessionContract.parse({ projectDir, sessionFilePath, registeredAt });
 * // Returns: ActiveMonitorSession — captured at register-monitor-session time, read by the JSONL watcher
 */

import { z } from 'zod';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const activeMonitorSessionContract = z.object({
  projectDir: filePathContract,
  sessionFilePath: filePathContract,
  registeredAt: isoTimestampContract,
});

export type ActiveMonitorSession = z.infer<typeof activeMonitorSessionContract>;
