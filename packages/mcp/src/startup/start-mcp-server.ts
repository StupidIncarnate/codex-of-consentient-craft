/**
 * PURPOSE: Initialize MCP server and register the discover tool for code/standards discovery
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts MCP server listening on stdio, registers discover tool
 *
 * RELATED: mcp-discover-broker
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types';
import { mcpDiscoverBroker } from '../brokers/mcp/discover/mcp-discover-broker.js';
import { mcpToolSchemaStatics } from '../statics/mcp-tool-schema/mcp-tool-schema-statics.js';

const JSON_INDENT_SPACES = 2;

export const StartMcpServer = async (): Promise<void> => {
  const server = new Server(
    {
      name: '@questmaestro/mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [mcpToolSchemaStatics.discover],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    if (request.params.name === 'discover') {
      const result = await mcpDiscoverBroker({
        input: request.params.arguments as never,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, JSON_INDENT_SPACES),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
