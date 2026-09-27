/**
 * Proves the exact command `.mcp.json` writes really boots a working MCP server from the consumer's
 * install — local resolution (scenario 3) or the `npm root -g` fallback (scenario 4) — by spawning
 * it for real and speaking the MCP JSON-RPC handshake (`initialize` -> `notifications/initialized`
 * -> `tools/list`), never by inspecting the written file or a bare `require.resolve` alone. A bare
 * resolve check would pass even if the server's OWN request handling were broken; the handshake is
 * what "answers a tool list that includes discover" (this item's own wording) actually requires.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { probeMcpToolList } from '../mcp-probe.mjs';

export const runMcpResolutionAssertion = async ({ report, consumerRoot, gt, mode, env }) => {
  const mcpConfig = JSON.parse(readFileSync(join(consumerRoot, '.mcp.json'), 'utf8'));
  const entry = mcpConfig.mcpServers?.dungeonmaster;
  if (!entry) {
    report.check(`MCP server starts from the consumer's config (${mode})`, false, 'no .mcp.json entry');
    return;
  }

  try {
    const { toolsResponse, stderr } = await probeMcpToolList({
      command: entry.command,
      args: entry.args,
      cwd: consumerRoot,
      env,
    });
    const toolNames = (toolsResponse.result?.tools ?? []).map((tool) => tool.name);
    const hasDiscover = toolNames.includes('discover');
    report.check(
      `MCP server starts from the consumer's config and answers tools/list including "discover" (${mode})`,
      hasDiscover,
      hasDiscover ? '' : `tools: ${JSON.stringify(toolNames)}; stderr: ${stderr.slice(-500)}`,
    );
  } catch (error) {
    report.check(
      `MCP server starts from the consumer's config and answers tools/list including "discover" (${mode})`,
      false,
      String(error),
    );
  }
};
