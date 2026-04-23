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
    const handler = handlerMap.get(request.params.name as never);
    if (!handler) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
    return handler({ args: (request.params.arguments ?? {}) as never });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return adapterResultContract.parse({ success: true });
};
