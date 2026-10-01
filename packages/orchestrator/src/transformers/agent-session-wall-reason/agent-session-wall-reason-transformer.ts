/**
 * PURPOSE: Reads one raw stdout line of a dispatched Claude CLI child and returns why the session hit
 * a wall it cannot report itself, or undefined. Two lines carry one: the `system/init` line naming
 * the dungeonmaster MCP server with a status that never connects (`failed`, `needs-auth`,
 * `disabled` — never `pending`, which is a server still starting), and the final `result` line whose
 * text holds a `DUNGEONMASTER-WALL: <reason>` line. Reach for this over isRateLimitRejectedLineGuard
 * and isApiOverloadLineGuard, which match an upstream API death: this matches a session alive but
 * cut off from `quest-work`, whose own `wall` outcome is therefore unreachable.
 *
 * USAGE:
 * agentSessionWallReasonTransformer({ line: '{"type":"system","subtype":"init","mcp_servers":[{"name":"dungeonmaster","status":"failed"}]}' });
 * // Returns 'the dungeonmaster MCP server did not connect in this session (status: failed) — …'
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type { WorkItem } from '@dungeonmaster/shared/contracts';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import { mcpServerStatusInitLineContract } from '../../contracts/mcp-server-status-init-line/mcp-server-status-init-line-contract';
import { sessionResultTextLineContract } from '../../contracts/session-result-text-line/session-result-text-line-contract';
import { agentSessionWallStatics } from '../../statics/agent-session-wall/agent-session-wall-statics';

export const agentSessionWallReasonTransformer = ({
  line,
}: {
  line: string;
}): WorkItem['declaredReason'] => {
  const parsed = safeJsonParseTransformer({ value: line });

  if (!parsed.ok) {
    return undefined;
  }

  const init = mcpServerStatusInitLineContract.safeParse(parsed.value);

  if (init.success) {
    const { serverName, wallStatuses } = agentSessionWallStatics.mcp;
    // A server missing from the list is left alone: a fake CLI or an unconfigured repo reports none,
    // and nothing on this line says the session ever needed it.
    const server = init.data.mcp_servers.find((entry) => entry.name === serverName);

    if (server === undefined || !wallStatuses.some((status) => status === server.status)) {
      return undefined;
    }

    return workItemContract.shape.declaredReason
      .unwrap()
      .parse(
        `the ${serverName} MCP server did not connect in this session (status: ${server.status}), so it had no get-agent-prompt, quest-work or signal-back tool — run the server's command from .mcp.json by hand in this session's working directory to see why it fails`,
      );
  }

  const result = sessionResultTextLineContract.safeParse(parsed.value);

  if (!result.success) {
    return undefined;
  }

  const { text: marker } = agentSessionWallStatics.marker;
  const markerLine = result.data.result
    .split('\n')
    .map((textLine) => textLine.trim())
    .find((textLine) => textLine.startsWith(marker));

  if (markerLine === undefined) {
    return undefined;
  }

  const reason = markerLine.slice(marker.length).trim();

  return workItemContract.shape.declaredReason
    .unwrap()
    .parse(reason.length === 0 ? 'the session declared a wall and gave no reason' : reason);
};
