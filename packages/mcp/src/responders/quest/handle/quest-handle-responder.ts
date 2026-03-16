/**
 * PURPOSE: Handles quest-related MCP tool calls (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, verify-quest)
 *
 * USAGE:
 * const result = await QuestHandleResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 * // Returns ToolResponse with quest data
 */

import {
  questIdContract,
  processIdContract,
  guildIdContract,
} from '@dungeonmaster/shared/contracts';
import { questToTextDisplayTransformer } from '@dungeonmaster/shared/transformers';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorListGuildsAdapter } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter';
import { orchestratorVerifyQuestAdapter } from '../../../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

const JSON_INDENT_SPACES = 2;

export const QuestHandleResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === 'get-quest') {
    const questIdRaw: unknown = Reflect.get(args, 'questId');
    const stageRaw: unknown = Reflect.get(args, 'stage');
    const formatRaw: unknown = Reflect.get(args, 'format');
    const questId = String(questIdRaw);
    const stage = typeof stageRaw === 'string' ? stageRaw : undefined;
    const format = formatRaw === 'json' ? 'json' : 'text';

    try {
      const result = await orchestratorGetQuestAdapter({
        questId,
        ...(stage && { stage }),
      });

      if (format === 'text' && result.success && result.quest) {
        return {
          content: [
            {
              type: 'text',
              text: questToTextDisplayTransformer({ quest: result.quest }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
          },
        ],
        ...(!result.success && { isError: true }),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'modify-quest') {
    const questIdRaw: unknown = Reflect.get(args, 'questId');
    const questId = questIdContract.parse(questIdRaw);

    // Sanitize: strip server-only fields that agents must not set via MCP
    const sanitized = { ...args };
    Reflect.deleteProperty(sanitized, 'workItems');
    Reflect.deleteProperty(sanitized, 'wardResults');

    try {
      const result = await orchestratorModifyQuestAdapter({
        questId,
        input: sanitized as never,
      });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
          },
        ],
        ...(!result.success && { isError: true }),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'start-quest') {
    const questIdRaw: unknown = Reflect.get(args, 'questId');
    const questId = questIdContract.parse(questIdRaw);

    try {
      const processId = await orchestratorStartQuestAdapter({ questId });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: true, processId }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'get-quest-status') {
    const processIdRaw: unknown = Reflect.get(args, 'processId');
    const processId = processIdContract.parse(processIdRaw);

    try {
      const status = orchestratorGetQuestStatusAdapter({ processId });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: true, status }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'verify-quest') {
    const questIdRaw: unknown = Reflect.get(args, 'questId');
    const questId = String(questIdRaw);

    try {
      const result = await orchestratorVerifyQuestAdapter({ questId });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
          },
        ],
        ...(!result.success && { isError: true }),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'list-quests') {
    const guildIdRaw: unknown = Reflect.get(args, 'guildId');
    const guildId = guildIdContract.parse(guildIdRaw);

    try {
      const quests = await orchestratorListQuestsAdapter({ guildId });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: true, quests }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  if (tool === 'list-guilds') {
    try {
      const guilds = await orchestratorListGuildsAdapter();
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: true, guilds }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
            ),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown quest tool: ${String(tool)}`);
};
