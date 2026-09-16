/**
 * PURPOSE: Handles the four siegelense MCP tools that read evidence off disk, the registry or the
 * machine — `siegelense-results`, `siegelense-status`, `siegelense-compare` and `siegelense-cleanup`
 * — parsing each call's raw args through its own `.strict()` contract via `safeParse` and delegating
 * straight to `@dungeonmaster/siegelense/brokers`'s read brokers. None of the four carries the
 * registry-miss check `siegelense-run`/`siegelense-kill` add in `SiegelenseHandleResponder`:
 * `resultsReadBroker` and `statusReadBroker` already resolve an unrecognised instance id to a real
 * `'unknown'` answer (`rows: []` / `instances: []`) rather than throwing, `cleanupRunBroker` takes no
 * instance at all, and `compareReadBroker` reads two named runs straight off disk. Split out of
 * `SiegelenseHandleResponder` as a layer, mirroring `quest-summary-layer-responder` and siblings:
 * that responder is one long tool switch and adding these four branches inline pushed it past the
 * complexity ceiling.
 *
 * USAGE:
 * const response = await SiegelenseReadLayerResponder({ tool: 'siegelense-results' as ToolName, args: { instanceId: 'inst_7f3a9c21' } });
 * // Returns a ToolResponse carrying the answer JSON, or the {success:false, error} shape with isError
 */

import {
  cleanupRunBroker,
  compareReadBroker,
  resultsReadBroker,
  statusReadBroker,
} from '@dungeonmaster/siegelense/brokers';
import { compareQueryContract, resultsQueryContract } from '@dungeonmaster/siegelense/contracts';
import { siegelenseToolsStatics } from '@dungeonmaster/siegelense/statics';

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { siegelenseCleanupInputContract } from '../../../contracts/siegelense-cleanup-input/siegelense-cleanup-input-contract';
import { siegelenseCompareInputContract } from '../../../contracts/siegelense-compare-input/siegelense-compare-input-contract';
import { siegelenseResultsInputContract } from '../../../contracts/siegelense-results-input/siegelense-results-input-contract';
import { siegelenseStatusInputContract } from '../../../contracts/siegelense-status-input/siegelense-status-input-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';

const JSON_INDENT_SPACES = 2;
const { prefix } = siegelenseToolsStatics.tools;

export const SiegelenseReadLayerResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === `${prefix}results`) {
    const parsed = siegelenseResultsInputContract.safeParse(args);
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

    const { instanceId, runId, step, kind, where, fields, since } = parsed.data;

    try {
      const answer = await resultsReadBroker({
        query: resultsQueryContract.parse({
          instanceId,
          runId: runId ?? null,
          step: step ?? null,
          kind: kind ?? null,
          where: where ?? null,
          fields: fields ?? null,
          since: since ?? null,
        }),
      });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(answer, null, JSON_INDENT_SPACES)),
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

  if (tool === `${prefix}status`) {
    const parsed = siegelenseStatusInputContract.safeParse(args);
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

    try {
      const answer = await statusReadBroker({ instanceId: instanceId ?? null });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(answer, null, JSON_INDENT_SPACES)),
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

  if (tool === `${prefix}compare`) {
    const parsed = siegelenseCompareInputContract.safeParse(args);
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

    const { instanceId, runA, runB } = parsed.data;

    try {
      const answer = await compareReadBroker({
        query: compareQueryContract.parse({ instanceId, runA, runB }),
      });

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(answer, null, JSON_INDENT_SPACES)),
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

  if (tool === `${prefix}cleanup`) {
    const parsed = siegelenseCleanupInputContract.safeParse(args);
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

    try {
      const answer = await cleanupRunBroker();

      return {
        content: [
          {
            type: 'text',
            text: contentTextContract.parse(JSON.stringify(answer, null, JSON_INDENT_SPACES)),
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

  throw new Error(`Unknown siegelense read tool: ${String(tool)}`);
};
