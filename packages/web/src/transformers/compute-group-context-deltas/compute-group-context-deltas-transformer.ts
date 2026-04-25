/**
 * PURPOSE: Computes the cross-API-call cumulative-context delta for each chat entry group
 *
 * USAGE:
 * computeGroupContextDeltasTransformer({groups: chatEntryGroups});
 * // Returns (ContextTokenDelta | null)[] — one entry per group; null when no prev cumulative exists
 *
 * WHY THIS LIVES OUTSIDE OF computeTokenAnnotationsTransformer:
 *   - computeTokenAnnotationsTransformer runs against MergedChatItem[] (intra-group).
 *   - This runs against ChatEntryGroup[] (inter-group) so it can carry the cumulative
 *     context across groups and produce one accurate "this turn added X tokens" number
 *     per group header.
 *   - See packages/web/CLAUDE.md → "Per-tool context numbers" for why we attribute
 *     deltas at the GROUP level (turn boundary) and result-content estimates at the
 *     TOOL row level.
 */

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenDelta } from '../../contracts/context-token-delta/context-token-delta-contract';
import { contextTokenDeltaContract } from '../../contracts/context-token-delta/context-token-delta-contract';
import { computeEntryContextTransformer } from '../compute-entry-context/compute-entry-context-transformer';

export const computeGroupContextDeltasTransformer = ({
  groups,
}: {
  groups: ChatEntryGroup[];
}): (ContextTokenDelta | null)[] => {
  let prevSession: ContextTokenCount | null = null;
  let prevSubagent: ContextTokenCount | null = null;

  return groups.map((group): ContextTokenDelta | null => {
    let value: ContextTokenCount | null = null;
    let source: 'session' | 'subagent' = 'session';

    if (group.kind === 'tool-group') {
      value = group.contextTokens;
      source = group.source;
    } else if (group.kind === 'subagent-chain') {
      value = group.contextTokens;
      source = 'subagent';
    } else {
      const { entry } = group;
      source = 'source' in entry && entry.source === 'subagent' ? 'subagent' : 'session';
      value = computeEntryContextTransformer({ entry });
    }

    if (value === null) {
      return null;
    }
    const prev = source === 'subagent' ? prevSubagent : prevSession;
    const delta =
      prev === null ? null : contextTokenDeltaContract.parse(Number(value) - Number(prev));
    if (source === 'subagent') {
      prevSubagent = value;
    } else {
      prevSession = value;
    }
    return delta;
  });
};
