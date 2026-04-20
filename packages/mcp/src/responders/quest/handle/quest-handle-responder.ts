/**
 * PURPOSE: Handles quest-related MCP tool calls (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-planning-notes)
 *
 * USAGE:
 * const result = await QuestHandleResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 * // Returns ToolResponse with quest data
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import { questToTextDisplayTransformer } from '@dungeonmaster/shared/transformers';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorGetPlanningNotesAdapter } from '../../../adapters/orchestrator/get-planning-notes/orchestrator-get-planning-notes-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorListGuildsAdapter } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { getPlanningNotesInputContract } from '../../../contracts/get-planning-notes-input/get-planning-notes-input-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestStatusInputContract } from '../../../contracts/get-quest-status-input/get-quest-status-input-contract';
import { listQuestsInputContract } from '../../../contracts/list-quests-input/list-quests-input-contract';
import { startQuestInputContract } from '../../../contracts/start-quest-input/start-quest-input-contract';

const JSON_INDENT_SPACES = 2;

export const QuestHandleResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === 'get-quest') {
    const { questId, stage, format } = getQuestInputContract.parse(args);

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
    Reflect.deleteProperty(sanitized, 'designPort');
    Reflect.deleteProperty(sanitized, 'pausedAtStatus');

    try {
      const result = await orchestratorModifyQuestAdapter({
        questId,
        input: sanitized as never,
      });
      const jsonPayload = JSON.stringify(result, null, JSON_INDENT_SPACES);
      const failedChecks = result.failedChecks ?? [];
      const hasFailures = failedChecks.some((check) => !check.passed);
      const header = hasFailures
        ? 'Structural validation failed:'
        : 'Transition succeeded with non-blocking warnings:';
      const text =
        failedChecks.length > 0
          ? `${[
              header,
              ...failedChecks.map(
                (check) =>
                  `- [${check.passed ? 'INFO' : 'FAIL'}] ${String(check.name)}: ${String(check.details)}`,
              ),
            ].join('\n')}\n\n${jsonPayload}`
          : jsonPayload;
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(text),
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
    const { questId } = startQuestInputContract.parse(args);

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
    const { processId } = getQuestStatusInputContract.parse(args);

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

  if (tool === 'list-quests') {
    const { guildId } = listQuestsInputContract.parse(args);

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

  if (tool === 'get-planning-notes') {
    const { questId, section } = getPlanningNotesInputContract.parse(args);

    try {
      const notes = await orchestratorGetPlanningNotesAdapter({
        questId,
        ...(section !== undefined && { section }),
      });
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(notes, null, JSON_INDENT_SPACES)),
          },
        ],
        ...(!notes.success && { isError: true }),
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
