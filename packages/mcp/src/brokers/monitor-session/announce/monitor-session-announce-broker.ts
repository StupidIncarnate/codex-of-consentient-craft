/**
 * PURPOSE: Writes `<DUNGEONMASTER_HOME>/active-monitor-session.json` so the HTTP server's
 * MonitorSessionWatchResponder reactor starts (or restarts) its JSONL watcher against the
 * named parent Claude Code session.
 *
 * USAGE:
 * await monitorSessionAnnounceBroker({
 *   parentSessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
 *   projectDir: process.cwd(),
 *   nowIso: new Date().toISOString(),
 *   homeDir: '/home/user/.dungeonmaster',
 * });
 * // Returns: AdapterResult — { success: true } when the announce file is written, or
 * // { success: true } no-op when parentSessionId is undefined.
 *
 * WHEN-TO-USE: From ResolveSubagentIdentityLayerResponder on the first successful
 *   sub-agent identity resolution per MCP process. The toolUseId-based scan
 *   (claudeCodeParentSessionFindByToolUseIdBroker) has already proved which session is
 *   the legitimate /dumpster-launch parent — the announce is just persistence for the
 *   cross-process file-watcher.
 * WHEN-NOT-TO-USE: At MCP boot. Boot-time announce is gone — it raced against unrelated
 *   Claude sessions in the same cwd via mtime resolution and hijacked the watcher.
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
