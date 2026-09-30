/**
 * PURPOSE: Creates MCP server, registers tools from registrations array, and connects transport
 *
 * USAGE:
 * await McpServerFlow({ registrations });
 * // Creates server, sets up ListTools and CallTool handlers, connects StdioServerTransport
 */

import { McpServer } from '#gateway/npm/modelcontextprotocol__sdk__server__mcp';
import { StdioServerTransport } from '#gateway/npm/modelcontextprotocol__sdk__server__stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '#gateway/npm/modelcontextprotocol__sdk__types';

import { ServerInitResponder } from '../../responders/server/init/server-init-responder';
import { toolRegistrationContract } from '../../contracts/tool-registration/tool-registration-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { toolCallCallerLiftTransformer } from '../../transformers/tool-call-caller-lift/tool-call-caller-lift-transformer';

export const McpServerFlow = async ({
  registrations,
}: {
  registrations: ToolRegistration[];
}): Promise<void> => {
  await ServerInitResponder();

  // The SDK's own docs on McpServer point custom-request-handler callers at this exact shape:
  // "For advanced usage (like sending notifications or setting custom request handlers), use the
  // underlying Server instance available via the `server` property." The bare low-level `Server`
  // constructor is marked `@deprecated` in the SDK's own types (`node_modules/@modelcontextprotocol/sdk`),
  // so constructing it directly trips `@typescript-eslint/no-deprecated`; going through `McpServer`
  // reaches the identical `Server` instance (its constructor is just `this.server = new Server(serverInfo, options)`)
  // without ever registering a tool/resource/prompt, so nothing but this manual setRequestHandler
  // dispatch below ever touches ListToolsRequestSchema/CallToolRequestSchema.
  const { server } = new McpServer(
    { name: '@dungeonmaster/mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  const handlerMap = new Map(registrations.map((reg) => [reg.name, reg.handler]));

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: registrations.map((reg) => toolRegistrationContract.parse(reg)),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const handler = handlerMap.get(request.params.name);
    if (!handler) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
    // `params._meta` is a loose record. Claude Code surfaces `claudecode/toolUseId` here on
    // every call, which identifies the calling sub-agent's OWN MCP call (NOT the parent
    // Task() dispatch id — the two are distinct, verified empirically). The lift moves the
    // caller context the pre-MCP-caller hook stamped onto the arguments into `meta` beside it,
    // before any tool's input contract sees the arguments. Handlers that don't need either
    // ignore the param.
    const { args, meta } = toolCallCallerLiftTransformer({
      args: request.params.arguments ?? {},
      ...(request.params._meta !== undefined && { meta: request.params._meta }),
    });
    return handler({ args, ...(meta !== undefined && { meta }) });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
};
