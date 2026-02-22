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
  guildIdContract,
  questIdContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import { orchestratorAddQuestAdapter } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { orchestratorGetQuestAdapter } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { orchestratorListGuildsAdapter } from '../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter';
import { orchestratorListQuestsAdapter } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorModifyQuestAdapter } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { orchestratorVerifyQuestAdapter } from '../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter';
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
import { verifyQuestInputContract } from '../contracts/verify-quest-input/verify-quest-input-contract';

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

  // Pre-compute JSON schemas to avoid deep type instantiation issues with zod 3.25
  const jsonSchemaOptions = { $refStrategy: 'none' as const };
  const discoverSchema = zodToJsonSchema(discoverInputContract as never, jsonSchemaOptions);
  const emptySchema = zodToJsonSchema(emptyInputSchema as never, jsonSchemaOptions);
  const folderDetailSchema = zodToJsonSchema(folderDetailInputContract as never, jsonSchemaOptions);
  const addQuestSchema = zodToJsonSchema(addQuestInputContract as never, jsonSchemaOptions);
  const getQuestSchema = zodToJsonSchema(getQuestInputContract as never, jsonSchemaOptions);
  const modifyQuestSchema = zodToJsonSchema(modifyQuestInputContract as never, jsonSchemaOptions);
  const signalBackSchema = zodToJsonSchema(signalBackInputContract as never, jsonSchemaOptions);
  const startQuestSchema = zodToJsonSchema(startQuestInputContract as never, jsonSchemaOptions);
  const getQuestStatusSchema = zodToJsonSchema(
    getQuestStatusInputContract as never,
    jsonSchemaOptions,
  );
  const listQuestsSchema = zodToJsonSchema(listQuestsInputContract as never, jsonSchemaOptions);
  const verifyQuestSchema = zodToJsonSchema(verifyQuestInputContract as never, jsonSchemaOptions);

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [
      {
        name: 'discover',
        description: 'Discover utilities, brokers, and files across the codebase',
        inputSchema: discoverSchema,
      },
      {
        name: 'get-architecture',
        description: 'Returns complete architecture overview',
        inputSchema: emptySchema,
      },
      {
        name: 'get-folder-detail',
        description: 'Returns detailed information about a specific folder type',
        inputSchema: folderDetailSchema,
      },
      {
        name: 'get-syntax-rules',
        description: 'Returns universal syntax rules',
        inputSchema: emptySchema,
      },
      {
        name: 'get-testing-patterns',
        description: 'Returns testing patterns and philosophy for writing tests and proxies',
        inputSchema: emptySchema,
      },
      {
        name: 'add-quest',
        description:
          'Creates a new quest with tasks and saves it to the .dungeonmaster-quests folder',
        inputSchema: addQuestSchema,
      },
      {
        name: 'get-quest',
        description: 'Retrieves a quest by its ID',
        inputSchema: getQuestSchema,
      },
      {
        name: 'modify-quest',
        description: 'Modifies an existing quest using upsert semantics',
        inputSchema: modifyQuestSchema,
      },
      {
        name: 'signal-back',
        description:
          'Signals the CLI with step completion status, progress, or blocking conditions',
        inputSchema: signalBackSchema,
      },
      {
        name: 'start-quest',
        description:
          'Starts orchestration for a quest by its ID. Returns a process ID for tracking.',
        inputSchema: startQuestSchema,
      },
      {
        name: 'get-quest-status',
        description: 'Gets the current status of an orchestration process by its process ID.',
        inputSchema: getQuestStatusSchema,
      },
      {
        name: 'list-quests',
        description: 'Lists all quests in the .dungeonmaster-quests folder.',
        inputSchema: listQuestsSchema,
      },
      {
        name: 'list-guilds',
        description: 'Lists all registered guilds with their IDs, names, paths, and quest counts.',
        inputSchema: emptySchema,
      },
      {
        name: 'verify-quest',
        description:
          'Validates quest structure integrity (dependency graph, observable coverage, file companions, etc.)',
        inputSchema: verifyQuestSchema,
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
      const guildIdRaw: unknown = Reflect.get(args, 'guildId');
      const title = String(titleRaw);
      const userRequest = String(userRequestRaw);
      const guildId = guildIdContract.parse(guildIdRaw);

      try {
        const result = await orchestratorAddQuestAdapter({ title, userRequest, guildId });
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
      const stageRaw: unknown = Reflect.get(args, 'stage');
      const questId = String(questIdRaw);
      const stage = typeof stageRaw === 'string' ? stageRaw : undefined;

      try {
        const result = await orchestratorGetQuestAdapter({
          questId,
          ...(stage && { stage }),
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

    if (request.params.name === 'modify-quest') {
      const args = request.params.arguments as never;
      const questIdRaw: unknown = Reflect.get(args, 'questId');
      const questId = String(questIdRaw);

      try {
        const result = await orchestratorModifyQuestAdapter({
          questId,
          input: args,
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
      const questId = questIdContract.parse(questIdRaw);

      try {
        const processId = await orchestratorStartQuestAdapter({ questId });
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
        const status = orchestratorGetQuestStatusAdapter({ processId });
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

    if (request.params.name === 'verify-quest') {
      const args = request.params.arguments as never;
      const questIdRaw: unknown = Reflect.get(args, 'questId');
      const questId = String(questIdRaw);

      try {
        const result = await orchestratorVerifyQuestAdapter({ questId });
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

    if (request.params.name === 'list-quests') {
      const args = request.params.arguments as never;
      const guildIdRaw: unknown = Reflect.get(args, 'guildId');
      const guildId = guildIdContract.parse(guildIdRaw);

      try {
        const quests = await orchestratorListQuestsAdapter({ guildId });
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

    if (request.params.name === 'list-guilds') {
      try {
        const guilds = await orchestratorListGuildsAdapter();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, guilds }, null, JSON_INDENT_SPACES),
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
