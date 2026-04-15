/**
 * PURPOSE: Returns ToolRegistration[] for quest-related MCP tools (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, verify-quest)
 *
 * USAGE:
 * const registrations = QuestFlow();
 * // Returns 7 ToolRegistration objects that delegate to QuestHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { getQuestInputContract } from '../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestStatusInputContract } from '../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { listQuestsInputContract } from '../../contracts/list-quests-input/list-quests-input-contract';
import { modifyQuestInputContract } from '../../contracts/modify-quest-input/modify-quest-input-contract';
import { startQuestInputContract } from '../../contracts/start-quest-input/start-quest-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { verifyQuestInputContract } from '../../contracts/verify-quest-input/verify-quest-input-contract';
import { QuestHandleResponder } from '../../responders/quest/handle/quest-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const getQuestSchema = zodToJsonSchema(getQuestInputContract as never, jsonSchemaOptions);
const modifyQuestSchema = zodToJsonSchema(modifyQuestInputContract as never, jsonSchemaOptions);
const startQuestSchema = zodToJsonSchema(startQuestInputContract as never, jsonSchemaOptions);
const getQuestStatusSchema = zodToJsonSchema(
  getQuestStatusInputContract as never,
  jsonSchemaOptions,
);
const listQuestsSchema = zodToJsonSchema(listQuestsInputContract as never, jsonSchemaOptions);
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const verifyQuestSchema = zodToJsonSchema(verifyQuestInputContract as never, jsonSchemaOptions);

export const QuestFlow = (): ToolRegistration[] => [
  {
    name: 'get-quest' as never,
    description: 'Retrieves a quest by its ID' as never,
    inputSchema: getQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }),
  },
  {
    name: 'modify-quest' as never,
    description: 'Modifies an existing quest using upsert semantics' as never,
    inputSchema: modifyQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'modify-quest' as never, args }),
  },
  {
    name: 'start-quest' as never,
    description:
      'Starts orchestration for a quest by its ID. Returns a process ID for tracking.' as never,
    inputSchema: startQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'start-quest' as never, args }),
  },
  {
    name: 'get-quest-status' as never,
    description: 'Gets the current status of an orchestration process by its process ID.' as never,
    inputSchema: getQuestStatusSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest-status' as never, args }),
  },
  {
    name: 'list-quests' as never,
    description: 'Lists all quests in the .dungeonmaster-quests folder.' as never,
    inputSchema: listQuestsSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-quests' as never, args }),
  },
  {
    name: 'list-guilds' as never,
    description:
      'Lists all registered guilds with their IDs, names, paths, and quest counts.' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'list-guilds' as never, args }),
  },
  {
    name: 'verify-quest' as never,
    description:
      'Validates quest structure integrity (dependency graph, observable coverage, file companions, etc.)' as never,
    inputSchema: verifyQuestSchema as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'verify-quest' as never, args }),
  },
];
