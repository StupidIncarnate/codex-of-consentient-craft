/**
 * PURPOSE: Settles the token counts an assistant record's `message.usage` reports into this port's
 * stable `TokenUsage` shape. Claude Code adds keys to that field over time and reports it snake_case,
 * so `transcriptRecordContract` leaves it loosely typed — this is the one place that defaults every
 * count Claude Code did not report (including the whole `usage` object, on a non-assistant record) to
 * 0, rather than letting every digest transformer that sums `TokenUsage` re-derive that default itself.
 *
 * USAGE:
 * recordToTokenUsageTransformer({
 *   record: transcriptRecordContract.parse({
 *     type: 'assistant',
 *     message: { content: 'hi', usage: { input_tokens: 2, output_tokens: 239 } },
 *   }),
 * });
 * // Returns { inputTokens: 2, outputTokens: 239, cacheReadTokens: 0, cacheCreationTokens: 0, thinkingTokens: 0 }
 */
import {
  tokenUsageContract,
  type TokenUsage,
} from '../../contracts/token-usage/token-usage-contract';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';

export const recordToTokenUsageTransformer = ({
  record,
}: {
  record: TranscriptRecord;
}): TokenUsage => {
  const usage = record.message?.usage;
  const details = usage?.output_tokens_details;
  const thinkingTokens =
    typeof details === 'object' && details !== null && 'thinking_tokens' in details
      ? details.thinking_tokens
      : undefined;

  return tokenUsageContract.parse({
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
    thinkingTokens: thinkingTokens ?? 0,
  });
};
