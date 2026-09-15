/**
 * PURPOSE: Handles the three siegelense MCP tool calls that need a live instance —
 * `siegelense-start`, `siegelense-run` and `siegelense-kill` — parsing each call's raw args through
 * its own `.strict()` contract via `safeParse` and delegating straight to
 * `@dungeonmaster/siegelense/brokers`' instance brokers. `run` and `kill` read the registry FIRST and
 * answer "unknown instance" on a miss, rather than calling the broker: both brokers fall back to a
 * deterministic socket path for an id the registry never held, so without this check a typo answers
 * as `DriverUnreachableError` — a driver problem — instead of what it actually is
 * (siegelense-tooling.md line 2207: "no instance by that id, ever. A mistyped or misremembered id,
 * not a walk that found nothing").
 *
 * USAGE:
 * const response = await SiegelenseHandleResponder({ tool: 'siegelense-start' as ToolName, args: { specName: 'dungeonmaster-web' } });
 * // Returns a ToolResponse carrying the manifest JSON, or the {success:false, error} shape with isError
 */

import {
  instanceKillBroker,
  instanceRunBroker,
  instanceStartBroker,
  registryReadBroker,
} from '@dungeonmaster/siegelense/brokers';
import { siegelenseToolsStatics } from '@dungeonmaster/siegelense/statics';

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { siegelenseKillInputContract } from '../../../contracts/siegelense-kill-input/siegelense-kill-input-contract';
import { siegelenseRunInputContract } from '../../../contracts/siegelense-run-input/siegelense-run-input-contract';
import { siegelenseStartInputContract } from '../../../contracts/siegelense-start-input/siegelense-start-input-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;
const { prefix } = siegelenseToolsStatics.tools;

export const SiegelenseHandleResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === `${prefix}start`) {
    const parsed = siegelenseStartInputContract.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify(
                { success: false, error: parsed.error.message },
                null,
                JSON_INDENT_SPACES,
              ),
            ),
          },
        ],
        isError: true,
      };
    }

    const { specName, questId, guildId } = parsed.data;

    try {
      const manifest = await instanceStartBroker({
        specName,
        questId: questId ?? null,
        guildId: guildId ?? null,
      });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(manifest, null, JSON_INDENT_SPACES)),
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

  if (tool === `${prefix}run`) {
    const parsed = siegelenseRunInputContract.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify(
                { success: false, error: parsed.error.message },
                null,
                JSON_INDENT_SPACES,
              ),
            ),
          },
        ],
        isError: true,
      };
    }

    const { instanceId, steps, stopOn } = parsed.data;
    const registry = await registryReadBroker();
    const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
    if (!isKnownInstance) {
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify(
                {
                  success: false,
                  error: `siegelense-run: no instance by the id "${instanceId}" — unknown, never existed. Check the id siegelense-start returned.`,
                },
                null,
                JSON_INDENT_SPACES,
              ),
            ),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await instanceRunBroker({ instanceId, steps, stopOn });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
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

  if (tool === `${prefix}kill`) {
    const parsed = siegelenseKillInputContract.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify(
                { success: false, error: parsed.error.message },
                null,
                JSON_INDENT_SPACES,
              ),
            ),
          },
        ],
        isError: true,
      };
    }

    const { instanceId } = parsed.data;
    const registry = await registryReadBroker();
    const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
    if (!isKnownInstance) {
      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(
              JSON.stringify(
                {
                  success: false,
                  error: `siegelense-kill: no instance by the id "${instanceId}" — unknown, never existed. Check the id siegelense-start returned.`,
                },
                null,
                JSON_INDENT_SPACES,
              ),
            ),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await instanceKillBroker({ instanceId });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
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

  throw new Error(`Unknown siegelense tool: ${String(tool)}`);
};
