/**
 * PURPOSE: Defines the shape of the active-monitor-session.json file written by the MCP server at startup and read by the HTTP server's reactor to start the JSONL watcher
 *
 * USAGE:
 * activeMonitorSessionContract.parse({ parentSessionId, projectDir, registeredAt });
 * // Returns: ActiveMonitorSession — the announce-time snapshot
 */

import { z } from 'zod';

export const activeMonitorSessionContract = z.object({
  parentSessionId: z.string().min(1).brand<'ParentSessionId'>(),
  projectDir: z.string().min(1).brand<'ProjectDir'>(),
  registeredAt: z.string().min(1).brand<'IsoTimestampField'>(),
});

export type ActiveMonitorSession = z.infer<typeof activeMonitorSessionContract>;
