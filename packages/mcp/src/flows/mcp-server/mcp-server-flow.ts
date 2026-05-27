/**
 * PURPOSE: Creates MCP server, registers tools from registrations array, and connects transport
 *
 * USAGE:
 * await McpServerFlow({ registrations });
 * // Creates server, sets up ListTools and CallTool handlers, connects StdioServerTransport
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { ServerInitResponder } from '../../responders/server/init/server-init-responder';
import { MonitorSessionAnnounceResponder } from '../../responders/monitor-session/announce/monitor-session-announce-responder';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';

export const McpServerFlow = async ({
  registrations,
}: {
  registrations: ToolRegistration[];
}): Promise<AdapterResult> => {
  await ServerInitResponder();

  const server = new Server(
    { name: '@dungeonmaster/mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  const handlerMap = new Map(registrations.map((reg) => [reg.name, reg.handler]));

  let announcedOnFirstCall = false;

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: registrations.map((reg) => ({
      name: reg.name,
      description: reg.description,
      inputSchema: reg.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    // First-tool-call announce: by the time any tool fires, Claude Code has written the
    // user prompt line to its session JSONL, so the filesystem-based session resolver in
    // MonitorSessionAnnounceResponder can find the parent session. Startup-time announce
    // (in StartMcpServer) is best-effort but unreliable because the JSONL may not exist
    // yet when stdio MCP children boot, so we retry here once per process.
    if (!announcedOnFirstCall) {
      announcedOnFirstCall = true;
      await MonitorSessionAnnounceResponder();
    }

    const handler = handlerMap.get(request.params.name as never);
    if (!handler) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
    // `params._meta` is a loose record. Claude Code surfaces `claudecode/toolUseId` here
    // on every call, which identifies the calling sub-agent's parent `Task()` tool use.
    // Handlers that don't need it ignore the param.
    return handler({
      args: (request.params.arguments ?? {}) as never,
      ...(request.params._meta !== undefined && { meta: request.params._meta as never }),
    });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return adapterResultContract.parse({ success: true });
};
