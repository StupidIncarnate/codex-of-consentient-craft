/**
 * PURPOSE: Settles the token counts an assistant record's `message.usage` reports into this
 * package's stable `TokenUsage` shape. Claude Code reports the counts in snake_case and leaves any
 * of them out, so `transcriptRecordUsageContract` makes every key optional. This transformer is
 * the one place that defaults every count Claude Code did not report to 0, including the whole
 * `usage` object on a non-assistant record. Without it, every digest transformer that sums
 * `TokenUsage` would have to re-derive that default itself.
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
  const thinkingTokens = usage?.output_tokens_details?.thinking_tokens;

  return tokenUsageContract.parse({
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
    thinkingTokens: thinkingTokens ?? 0,
  });
};
