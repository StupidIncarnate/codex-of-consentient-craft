/**
 * PURPOSE: Builds a ChatUsage object from a normalized (camelCase) usage record, defaulting any missing field to 0
 *
 * USAGE:
 * mapUsageToChatUsageTransformer({usage: {inputTokens: 100, outputTokens: 50, cacheCreationInputTokens: 10, cacheReadInputTokens: 5}});
 * // Returns {inputTokens: 100, outputTokens: 50, cacheCreationInputTokens: 10, cacheReadInputTokens: 5}
 */
import type { ChatUsage } from '@dungeonmaster/shared/contracts';

export const mapUsageToChatUsageTransformer = ({
  usage,
}: {
  usage: Record<string, unknown>;
}): ChatUsage =>
  ({
    inputTokens: Number(usage.inputTokens ?? 0),
    outputTokens: Number(usage.outputTokens ?? 0),
    cacheCreationInputTokens: Number(usage.cacheCreationInputTokens ?? 0),
    cacheReadInputTokens: Number(usage.cacheReadInputTokens ?? 0),
  }) as ChatUsage;
