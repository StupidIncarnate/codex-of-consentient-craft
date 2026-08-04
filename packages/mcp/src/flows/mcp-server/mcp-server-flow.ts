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
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { toolNameContract } from '../../contracts/tool-name/tool-name-contract';

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

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: registrations.map((reg) => ({
      name: reg.name,
      description: reg.description,
      inputSchema: reg.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const handler = handlerMap.get(toolNameContract.parse(request.params.name));
    if (!handler) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
    // `params._meta` is a loose record. Claude Code surfaces `claudecode/toolUseId` here on
    // every call, which identifies the calling sub-agent's OWN MCP call (NOT the parent
    // Task() dispatch id — the two are distinct, verified empirically). Handlers that don't
    // need it ignore the param.
    return handler({
      args: request.params.arguments ?? {},
      ...(request.params._meta !== undefined && { meta: request.params._meta }),
    });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return adapterResultContract.parse({ success: true });
};
