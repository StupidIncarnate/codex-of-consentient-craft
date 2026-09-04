/**
 * PURPOSE: Folds a whole session's parsed records into one TranscriptSummary. That summary answers
 * two questions: what did this session cost, and what did it spend that cost on. A post-mortem can
 * read the summary instead of re-walking hundreds of megabytes of JSONL. Reach for this transformer
 * over `recordsToBucketsTransformer` when you want the whole-session total, not where in the
 * session it landed. `apiResponseCount`, not `recordCount`, is the honest count of API responses.
 * One API response is split across several transcript records — a text block, a thinking block,
 * each tool_use. Every one of those records repeats that response's `usage`. So `recordCount`
 * overcounts calls to the model by exactly that fan-out. Readers misread this number more than any
 * other in the package.
 *
 * USAGE:
 * recordsToSummaryTransformer({ records: [TranscriptRecordStub()], subagentCount: 2 });
 * // Returns a TranscriptSummary with record, model, and tool-call histograms, summed TokenUsage,
 * // wall clock bounds, and the passed-through subagentCount. Wall clock bounds are omitted when no
 * // record carries a timestamp.
 */
import { tokenUsageContract } from '../../contracts/token-usage/token-usage-contract';
import {
  transcriptSummaryContract,
  type TranscriptSummary,
} from '../../contracts/transcript-summary/transcript-summary-contract';
import { recordToTokenUsageTransformer } from '../record-to-token-usage/record-to-token-usage-transformer';
import { recordToContentBlocksTransformer } from '../record-to-content-blocks/record-to-content-blocks-transformer';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';
import type { TranscriptRecordContentBlock } from '../../contracts/transcript-record-content-block/transcript-record-content-block-contract';

type ModelName = NonNullable<NonNullable<TranscriptRecord['message']>['model']>;
type ToolName = NonNullable<TranscriptRecordContentBlock['name']>;

const MILLISECONDS_PER_SECOND = 1000;

export const recordsToSummaryTransformer = ({
  records,
  subagentCount = 0,
}: {
  records: readonly TranscriptRecord[];
  subagentCount?: number;
}): TranscriptSummary => {
  const recordsByType = new Map<TranscriptRecord['type'], TranscriptRecord[]>();
  const recordsByModel = new Map<ModelName, TranscriptRecord[]>();
  const blocksByToolName = new Map<ToolName, TranscriptRecordContentBlock[]>();

  let apiResponseCount = 0;
  let toolResultBytes = 0;
  let earliestMs = Number.POSITIVE_INFINITY;
  let latestMs = Number.NEGATIVE_INFINITY;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let thinkingTokens = 0;

  for (const record of records) {
    const sameType = recordsByType.get(record.type);
    if (sameType === undefined) {
      recordsByType.set(record.type, [record]);
    } else {
      sameType.push(record);
    }

    if (record.timestamp !== undefined) {
      const timestampMs = new Date(record.timestamp).getTime();

      if (timestampMs < earliestMs) {
        earliestMs = timestampMs;
      }

      if (timestampMs > latestMs) {
        latestMs = timestampMs;
      }
    }

    if (record.type === 'assistant') {
      apiResponseCount += 1;

      const model = record.message?.model;
      if (model !== undefined) {
        const sameModel = recordsByModel.get(model);
        if (sameModel === undefined) {
          recordsByModel.set(model, [record]);
        } else {
          sameModel.push(record);
        }
      }

      for (const block of recordToContentBlocksTransformer({ record })) {
        if (block.type === 'tool_use' && block.name !== undefined) {
          const sameTool = blocksByToolName.get(block.name);
          if (sameTool === undefined) {
            blocksByToolName.set(block.name, [block]);
          } else {
            sameTool.push(block);
          }
        }
      }
    }

    if (record.toolUseResult !== undefined) {
      toolResultBytes += JSON.stringify(record.toolUseResult).length;
    }

    const recordUsage = recordToTokenUsageTransformer({ record });
    inputTokens += recordUsage.inputTokens;
    outputTokens += recordUsage.outputTokens;
    cacheReadTokens += recordUsage.cacheReadTokens;
    cacheCreationTokens += recordUsage.cacheCreationTokens;
    thinkingTokens += recordUsage.thinkingTokens;
  }

  const hasTimestamps = earliestMs !== Number.POSITIVE_INFINITY;

  return transcriptSummaryContract.parse({
    recordCount: records.length,
    apiResponseCount,
    ...(hasTimestamps
      ? {
          startedAt: new Date(earliestMs).toISOString(),
          endedAt: new Date(latestMs).toISOString(),
          wallClockSeconds: (latestMs - earliestMs) / MILLISECONDS_PER_SECOND,
        }
      : {}),
    models: Object.fromEntries(
      [...recordsByModel].map(([model, matches]) => [model, matches.length] as const),
    ),
    recordTypeCounts: Object.fromEntries(
      [...recordsByType].map(([type, matches]) => [type, matches.length] as const),
    ),
    toolCallCounts: Object.fromEntries(
      [...blocksByToolName].map(([name, matches]) => [name, matches.length] as const),
    ),
    toolResultBytes,
    subagentCount,
    usage: tokenUsageContract.parse({
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      thinkingTokens,
    }),
  });
};
