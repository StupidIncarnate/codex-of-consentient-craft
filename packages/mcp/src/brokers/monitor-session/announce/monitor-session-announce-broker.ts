/**
 * PURPOSE: Announces the parent Claude Code session at MCP server startup by writing `<DUNGEONMASTER_HOME>/active-monitor-session.json`. The HTTP server reactor watches that file and starts the JSONL watcher against the announced session
 *
 * USAGE:
 * await monitorSessionAnnounceBroker({
 *   parentSessionId: process.env.CLAUDE_CODE_SESSION_ID,
 *   projectDir: process.cwd(),
 *   nowIso: new Date().toISOString(),
 *   homeDir: '/home/user/.dungeonmaster',
 * });
 * // Returns: AdapterResult — { success: true } when the announce file is written, or
 * // { success: true } no-op when parentSessionId is undefined (MCP invoked outside
 * // Claude Code context — e.g. integration tests or direct-call clients).
 *
 * WHY: Sub-agents launched via Task() inherit the parent's CLAUDE_CODE_SESSION_ID env var,
 *   so they cannot self-identify. The MCP server spawned by Claude Code does see the
 *   parent's id at boot and is the only process that can announce it server-side.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { fileContentsContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { activeMonitorSessionContract } from '../../../contracts/active-monitor-session/active-monitor-session-contract';

const JSON_INDENT_SPACES = 2;

export const monitorSessionAnnounceBroker = async ({
  parentSessionId,
  projectDir,
  nowIso,
  homeDir,
}: {
  parentSessionId: string | undefined;
  projectDir: string;
  nowIso: string;
  homeDir: string;
}): Promise<AdapterResult> => {
  if (parentSessionId === undefined || parentSessionId === '') {
    // MCP server invoked outside Claude Code context (integration tests, direct-call
    // clients). Skip the announce so the file isn't written with stale data — the HTTP
    // server reactor stays idle, the MCP tool surface remains fully functional.
    return { success: true as const };
  }

  const body = activeMonitorSessionContract.parse({
    parentSessionId,
    projectDir,
    registeredAt: nowIso,
  });

  await fsMkdirAdapter({ filepath: pathSegmentContract.parse(homeDir) });

  const filePath = pathSegmentContract.parse(
    `${homeDir}/${locationsStatics.dungeonmasterHome.activeMonitorSession}`,
  );
  await fsWriteFileAdapter({
    filepath: filePath,
    contents: fileContentsContract.parse(JSON.stringify(body, null, JSON_INDENT_SPACES)),
  });

  return { success: true as const };
};
