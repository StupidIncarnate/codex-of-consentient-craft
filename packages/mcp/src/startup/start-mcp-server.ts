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
import {
  filePathContract,
  questIdContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import { orchestratorAddQuestAdapter } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { orchestratorGetQuestAdapter } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { orchestratorListQuestsAdapter } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorModifyQuestAdapter } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { architectureFolderDetailBroker } from '../brokers/architecture/folder-detail/architecture-folder-detail-broker';
import { architectureSyntaxRulesBroker } from '../brokers/architecture/syntax-rules/architecture-syntax-rules-broker';
import { architectureTestingPatternsBroker } from '../brokers/architecture/testing-patterns/architecture-testing-patterns-broker';
import { mcpDiscoverBroker } from '../brokers/mcp/discover/mcp-discover-broker';
import { folderConstraintsInitBroker } from '../brokers/folder-constraints/init/folder-constraints-init-broker';
import { folderConstraintsState } from '../state/folder-constraints/folder-constraints-state';
import { signalBackBroker } from '../brokers/signal/back/signal-back-broker';
import { addQuestInputContract } from '../contracts/add-quest-input/add-quest-input-contract';
import { discoverInputContract } from '../contracts/discover-input/discover-input-contract';
import { folderDetailInputContract } from '../contracts/folder-detail-input/folder-detail-input-contract';
import { getQuestInputContract } from '../contracts/get-quest-input/get-quest-input-contract';
import { modifyQuestInputContract } from '../contracts/modify-quest-input/modify-quest-input-contract';
import { signalBackInputContract } from '../contracts/signal-back-input/signal-back-input-contract';
import { startQuestInputContract } from '../contracts/start-quest-input/start-quest-input-contract';
import { getQuestStatusInputContract } from '../contracts/get-quest-status-input/get-quest-status-input-contract';
import { listQuestsInputContract } from '../contracts/list-quests-input/list-quests-input-contract';

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
      {
        name: 'get-quest',
        description: 'Retrieves a quest by its ID',
        inputSchema: zodToJsonSchema(getQuestInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'modify-quest',
        description: 'Modifies an existing quest using upsert semantics',
        inputSchema: zodToJsonSchema(modifyQuestInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'signal-back',
        description:
          'Signals the CLI with step completion status, progress, or blocking conditions',
        inputSchema: zodToJsonSchema(signalBackInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'start-quest',
        description:
          'Starts orchestration for a quest by its ID. Returns a process ID for tracking.',
        inputSchema: zodToJsonSchema(startQuestInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'get-quest-status',
        description: 'Gets the current status of an orchestration process by its process ID.',
        inputSchema: zodToJsonSchema(getQuestStatusInputContract, { $refStrategy: 'none' }),
      },
      {
        name: 'list-quests',
        description: 'Lists all quests in the .dungeonmaster-quests folder.',
        inputSchema: zodToJsonSchema(listQuestsInputContract, { $refStrategy: 'none' }),
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
      const args = request.params.arguments as never;
      const titleRaw: unknown = Reflect.get(args, 'title');
      const userRequestRaw: unknown = Reflect.get(args, 'userRequest');
      const startPathRaw: unknown = Reflect.get(args, 'startPath');
      const title = String(titleRaw);
      const userRequest = String(userRequestRaw);
      const startPath = filePathContract.parse(startPathRaw ?? process.cwd());

      try {
        const result = await orchestratorAddQuestAdapter({ title, userRequest, startPath });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    if (request.params.name === 'get-quest') {
      const args = request.params.arguments as never;
      const questIdRaw: unknown = Reflect.get(args, 'questId');
      const startPathRaw: unknown = Reflect.get(args, 'startPath');
      const questId = String(questIdRaw);
      const startPath = filePathContract.parse(startPathRaw ?? process.cwd());

      try {
        const result = await orchestratorGetQuestAdapter({ questId, startPath });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    if (request.params.name === 'modify-quest') {
      const args = request.params.arguments as never;
      const questIdRaw: unknown = Reflect.get(args, 'questId');
      const startPathRaw: unknown = Reflect.get(args, 'startPath');
      const questId = String(questIdRaw);
      const startPath = filePathContract.parse(startPathRaw ?? process.cwd());

      try {
        const result = await orchestratorModifyQuestAdapter({
          questId,
          input: args,
          startPath,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    if (request.params.name === 'signal-back') {
      const result = signalBackBroker({
        input: request.params.arguments,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, JSON_INDENT_SPACES) }],
      };
    }

    if (request.params.name === 'start-quest') {
      const args = request.params.arguments as never;
      const questIdRaw: unknown = Reflect.get(args, 'questId');
      const startPathRaw: unknown = Reflect.get(args, 'startPath');
      const questId = questIdContract.parse(questIdRaw);
      const startPath = filePathContract.parse(startPathRaw ?? process.cwd());

      try {
        const processId = await orchestratorStartQuestAdapter({ questId, startPath });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, processId }, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    if (request.params.name === 'get-quest-status') {
      const args = request.params.arguments as never;
      const processIdRaw: unknown = Reflect.get(args, 'processId');
      const processId = processIdContract.parse(processIdRaw);

      try {
        const status = await orchestratorGetQuestStatusAdapter({ processId });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, status }, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    if (request.params.name === 'list-quests') {
      const args = request.params.arguments as never;
      const startPathRaw: unknown = Reflect.get(args, 'startPath');
      const startPath = filePathContract.parse(startPathRaw ?? process.cwd());

      try {
        const quests = await orchestratorListQuestsAdapter({ startPath });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, quests }, null, JSON_INDENT_SPACES),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: errorMessage },
                null,
                JSON_INDENT_SPACES,
              ),
            },
          ],
        };
      }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
