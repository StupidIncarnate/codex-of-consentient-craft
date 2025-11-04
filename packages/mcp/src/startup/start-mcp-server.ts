/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts MCP server listening on stdio, registers discover, get-architecture, get-folder-detail, get-syntax-rules tools
 */

import type { FolderType } from '@questmaestro/eslint-plugin/dist/contracts/folder-type/folder-type-contract';
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types';
import { architectureOverviewBroker } from '../brokers/architecture/overview/architecture-overview-broker.js';
import { architectureFolderDetailBroker } from '../brokers/architecture/folder-detail/architecture-folder-detail-broker.js';
import { architectureSyntaxRulesBroker } from '../brokers/architecture/syntax-rules/architecture-syntax-rules-broker.js';
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
    tools: [
      mcpToolSchemaStatics.discover,
      mcpToolSchemaStatics['get-architecture'],
      mcpToolSchemaStatics['get-folder-detail'],
      mcpToolSchemaStatics['get-syntax-rules'],
    ],
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

    if (request.params.name === 'get-architecture') {
      const result = architectureOverviewBroker();

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    if (request.params.name === 'get-folder-detail') {
      const args = request.params.arguments as never;
      const folderType = Reflect.get(args, 'folderType') as FolderType;
      const result = architectureFolderDetailBroker({
        folderType,
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    if (request.params.name === 'get-syntax-rules') {
      const result = architectureSyntaxRulesBroker();

      return {
        content: [
          {
            type: 'text',
            text: result,
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
