/**
 * PURPOSE: Transforms raw API usage object with snake_case keys into ChatUsage with camelCase keys
 *
 * USAGE:
 * mapUsageToChatUsageTransformer({usage: {input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 10, cache_read_input_tokens: 5}});
 * // Returns {inputTokens: 100, outputTokens: 50, cacheCreationInputTokens: 10, cacheReadInputTokens: 5}
 */
import type { ChatUsage } from '../../contracts/chat-entry/chat-entry-contract';

export const mapUsageToChatUsageTransformer = ({
  usage,
}: {
  usage: Record<string, unknown>;
}): ChatUsage =>
  ({
    inputTokens: Number(usage.input_tokens ?? 0),
    outputTokens: Number(usage.output_tokens ?? 0),
    cacheCreationInputTokens: Number(usage.cache_creation_input_tokens ?? 0),
    cacheReadInputTokens: Number(usage.cache_read_input_tokens ?? 0),
  }) as ChatUsage;
