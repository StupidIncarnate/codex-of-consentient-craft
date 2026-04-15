/**
 * PURPOSE: Handles quest-related MCP tool calls (get-quest, modify-quest, start-quest, get-quest-status, list-quests, list-guilds, get-planning-notes)
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
    Reflect.deleteProperty(sanitized, 'designPort');

    try {
      const result = await orchestratorModifyQuestAdapter({
        questId,
        input: sanitized as never,
      });
      const jsonPayload = JSON.stringify(result, null, JSON_INDENT_SPACES);
      const failedChecks = result.failedChecks ?? [];
      const text =
        failedChecks.length > 0
          ? `${[
              'Structural validation failed:',
              ...failedChecks.map(
                (check) => `- [FAIL] ${String(check.name)}: ${String(check.details)}`,
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

  if (tool === 'get-planning-notes') {
    const questIdRaw: unknown = Reflect.get(args, 'questId');
    const sectionRaw: unknown = Reflect.get(args, 'section');
    const questId = String(questIdRaw);
    const parsed = getPlanningNotesInputContract.safeParse({
      questId,
      ...(sectionRaw !== undefined && { section: sectionRaw }),
    });
    const section = parsed.success ? parsed.data.section : undefined;

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
