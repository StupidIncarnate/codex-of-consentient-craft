/**
 * PURPOSE: Handles the seven registered siegelense MCP tool calls. `siegelense-start`,
 * `siegelense-run` and `siegelense-kill` need a live instance, so each parses its own `.strict()`
 * contract via `safeParse` and delegates straight to `@dungeonmaster/siegelense/brokers`' instance
 * brokers; `run` and `kill` read the registry FIRST and answer "unknown instance" on a miss, rather
 * than calling the broker: both brokers fall back to a deterministic socket path for an id the
 * registry never held, so without this check a typo answers as `DriverUnreachableError` — a driver
 * problem — instead of what it actually is (siegelense-tooling.md line 2207: "no instance by that
 * id, ever. A mistyped or misremembered id, not a walk that found nothing"). The four read tools —
 * `siegelense-results`, `siegelense-status`, `siegelense-compare`, `siegelense-cleanup` — live in a
 * `layerResponders` lookup rather than four more inline branches, the same `<tool>-layer-responder.ts`
 * remedy `QuestHandleResponder` uses: this function's cyclomatic complexity sits near its ceiling,
 * and a map entry costs nothing where an inline branch costs one.
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
import { toolNameContract } from '../../../contracts/tool-name/tool-name-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import { SiegelenseReadLayerResponder } from './siegelense-read-layer-responder';

const JSON_INDENT_SPACES = 2;
const { prefix } = siegelenseToolsStatics.tools;

const resultsToolName = toolNameContract.parse(`${prefix}results`);
const statusToolName = toolNameContract.parse(`${prefix}status`);
const compareToolName = toolNameContract.parse(`${prefix}compare`);
const cleanupToolName = toolNameContract.parse(`${prefix}cleanup`);

// The four read tools all resolve to the SAME layer file, so each entry closes over its own
// literal tool name rather than sharing one — a map entry costs nothing here, where each of these
// four as its own inline branch would cost this function one complexity point apiece.
const layerResponders = new Map<
  ToolName,
  (params: { args: Record<string, unknown> }) => Promise<ToolResponse>
>([
  [
    resultsToolName,
    async ({ args }) => SiegelenseReadLayerResponder({ tool: resultsToolName, args }),
  ],
  [
    statusToolName,
    async ({ args }) => SiegelenseReadLayerResponder({ tool: statusToolName, args }),
  ],
  [
    compareToolName,
    async ({ args }) => SiegelenseReadLayerResponder({ tool: compareToolName, args }),
  ],
  [
    cleanupToolName,
    async ({ args }) => SiegelenseReadLayerResponder({ tool: cleanupToolName, args }),
  ],
]);

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

  const layerResponder = layerResponders.get(tool);
  if (layerResponder !== undefined) {
    return layerResponder({ args });
  }

  throw new Error(`Unknown siegelense tool: ${String(tool)}`);
};
