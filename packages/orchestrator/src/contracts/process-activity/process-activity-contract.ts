/**
 * PURPOSE: Activity telemetry shape stored in `orchestrationProcessesState`'s parallel activity map. `lastActivityAt` ticks every line through `recordActivity`; `osPid` is set after `agentSpawnUnifiedBroker` forks the child; `sessionJsonlPath` is set once Claude CLI's system/init resolves the sessionId.
 *
 * USAGE:
 * const activity: ProcessActivity = { lastActivityAt: new Date() };
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { processPidContract } from '../process-pid/process-pid-contract';

export const processActivityContract = z.object({
  lastActivityAt: z.date(),
  osPid: processPidContract.optional(),
  sessionJsonlPath: absoluteFilePathContract.optional(),
});

export type ProcessActivity = z.infer<typeof processActivityContract>;
