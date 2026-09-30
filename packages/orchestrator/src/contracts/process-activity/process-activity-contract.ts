/**
 * PURPOSE: Activity telemetry shape stored in `orchestrationProcessesState`'s parallel activity map. `lastActivityAt` ticks every line through `recordActivity`; `osPid` is set after `agentSpawnUnifiedBroker` forks the child; `sessionJsonlPath` is set once Claude CLI's system/init resolves the sessionId.
 *
 * USAGE:
 * const activity: ProcessActivity = { lastActivityAt: new Date() };
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';


export const processActivityContract = z.object({
  lastActivityAt: z.date(),
  osPid: z.number().int().positive().brand<'ProcessActivityOsPid'>().optional(),
  sessionJsonlPath: absoluteFilePathContract.optional(),
});

export type ProcessActivity = z.infer<typeof processActivityContract>;
