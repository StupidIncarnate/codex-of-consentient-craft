/**
 * PURPOSE: Activity telemetry shape stored in `orchestrationProcessesState`'s parallel activity map. `lastActivityAt` ticks every line through `recordActivity`; `osPid` is set after `agentSpawnUnifiedBroker` forks the child; `sessionJsonlPath` is set once Claude CLI's system/init resolves the sessionId.
 *
 * USAGE:
 * const activity: ProcessActivity = { lastActivityAt: new Date() };
 */

import { z } from '#gateway/npm/zod';



export const processActivityContract = z.object({
  lastActivityAt: z.date(),
  osPid: z.number().int().positive().brand<'ProcessActivityOsPid'>().optional(),
  sessionJsonlPath: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'ProcessActivitySessionJsonlPath'>().optional(),
}).brand<'ProcessActivity'>();

export type ProcessActivity = z.infer<typeof processActivityContract>;
