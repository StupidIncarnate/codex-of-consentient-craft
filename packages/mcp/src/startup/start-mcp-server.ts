/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts MCP server listening on stdio, registers discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns tools
 */

import type { FolderType } from '@dungeonmaster/shared/contracts';
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { architectureOverviewBroker } from '@dungeonmaster/shared/brokers';
import { architectureFolderDetailBroker } from '../brokers/architecture/folder-detail/architecture-folder-detail-broker.js';
import { architectureSyntaxRulesBroker } from '../brokers/architecture/syntax-rules/architecture-syntax-rules-broker.js';
import { architectureTestingPatternsBroker } from '../brokers/architecture/testing-patterns/architecture-testing-patterns-broker.js';
import { mcpDiscoverBroker } from '../brokers/mcp/discover/mcp-discover-broker.js';
import { folderConstraintsInitBroker } from '../brokers/folder-constraints/init/folder-constraints-init-broker.js';
import { folderConstraintsState } from '../state/folder-constraints/folder-constraints-state.js';
import { questAddBroker } from '../brokers/quest/add/quest-add-broker.js';
import { addQuestInputContract } from '../contracts/add-quest-input/add-quest-input-contract.js';
import { discoverInputContract } from '../contracts/discover-input/discover-input-contract.js';
import { folderDetailInputContract } from '../contracts/folder-detail-input/folder-detail-input-contract.js';

const emptyInputSchema = z.object({});

const JSON_INDENT_SPACES = 2;

export const StartMcpServer = async (): Promise<void> => {
  // Load folder constraints into memory at startup
  const { folderConstraints } = await folderConstraintsInitBroker();
  for (const [folderType, content] of folderConstraints) {
    folderConstraintsState.set({ folderType, content });
  }

  const server = new Server(
    {
      name: '@dungeonmaster/mcp',
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
      {
        name: 'discover',
        description: 'Discover utilities, brokers, and files across the codebase',
        inputSchema: zodToJsonSchema(discoverInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'get-architecture',
        description: 'Returns complete architecture overview',
        inputSchema: zodToJsonSchema(emptyInputSchema, { $refStrategy: 'none' }),
      },
      {
        name: 'get-folder-detail',
        description: 'Returns detailed information about a specific folder type',
        inputSchema: zodToJsonSchema(folderDetailInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'get-syntax-rules',
        description: 'Returns universal syntax rules',
        inputSchema: zodToJsonSchema(emptyInputSchema, { $refStrategy: 'none' }),
      },
      {
        name: 'get-testing-patterns',
        description: 'Returns testing patterns and philosophy for writing tests and proxies',
        inputSchema: zodToJsonSchema(emptyInputSchema, { $refStrategy: 'none' }),
      },
      {
        name: 'add-quest',
        description:
          'Creates a new quest with tasks and saves it to the .dungeonmaster-quests folder',
        inputSchema: zodToJsonSchema(addQuestInputContract, { $refStrategy: 'none' }),
      },
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
      const supplementalConstraints = folderConstraintsState.get({ folderType });

      const result = architectureFolderDetailBroker({
        folderType,
        ...(supplementalConstraints && { supplementalConstraints }),
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

    if (request.params.name === 'get-testing-patterns') {
      const result = architectureTestingPatternsBroker();

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    if (request.params.name === 'add-quest') {
      const result = await questAddBroker({
        input: request.params.arguments as never,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, JSON_INDENT_SPACES) }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
