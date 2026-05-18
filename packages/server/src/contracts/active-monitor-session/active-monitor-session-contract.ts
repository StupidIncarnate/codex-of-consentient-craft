/**
 * PURPOSE: Server-side shape of the `<DUNGEONMASTER_HOME>/active-monitor-session.json` file. The MCP server writes this at startup; the HTTP server's monitor-session-watch responder parses it on every change to decide whether to (re)start the JSONL watcher
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
export type ParentSessionId = ActiveMonitorSession['parentSessionId'];
export type ProjectDir = ActiveMonitorSession['projectDir'];
