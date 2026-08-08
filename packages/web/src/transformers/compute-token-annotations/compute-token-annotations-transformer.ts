/**
 * PURPOSE: Decides which items in a transcript are worth putting a token number on, and what
 * that number is measured against. The session and sub-agent streams are counted separately,
 * and a run of back-to-back tool calls collapses onto a single cumulative at the end of the
 * run, so the reader sees what the run cost rather than a rule between every call.
 *
 * USAGE:
 * computeTokenAnnotationsTransformer({items: mergedChatItems});
 * // Returns TokenAnnotation[] with one annotation per item
 */

import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { contextTokenDeltaContract } from '../../contracts/context-token-delta/context-token-delta-contract';
import { formattedTokenLabelContract } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import type { MergedChatItem } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import { tokenAnnotationContract } from '../../contracts/token-annotation/token-annotation-contract';
import type { TokenAnnotation } from '../../contracts/token-annotation/token-annotation-contract';
import { computeEntryContextTransformer } from '../compute-entry-context/compute-entry-context-transformer';
import { estimateContentTokensTransformer } from '../estimate-content-tokens/estimate-content-tokens-transformer';
import { formatContextTokensTransformer } from '../format-context-tokens/format-context-tokens-transformer';

export const computeTokenAnnotationsTransformer = ({
  items,
}: {
  items: MergedChatItem[];
}): TokenAnnotation[] => {
  let prevSessionContext: ContextTokenCount | null = null;
  let prevSubagentContext: ContextTokenCount | null = null;

  return items.map((item, index): TokenAnnotation => {
    if (item.kind === 'tool-pair') {
      const { toolUse, toolResult } = item;
      const source: 'session' | 'subagent' =
        'source' in toolUse && toolUse.source === 'subagent' ? 'subagent' : 'session';
      const totalContext = computeEntryContextTransformer({ entry: toolUse });

      // A run of back-to-back tool calls carries ONE cumulative, on the call that ends the
      // run — a rule between every call in a ten-call run is noise, and what the reader wants
      // is the cost of the run before the model speaks again. The calls that give theirs up
      // leave `prev` where it was, so the surviving delta spans the whole run instead of the
      // last hop; advancing it here would silently drop the run's earlier consumption.
      const nextItem = items[index + 1];
      const nextToolUse =
        nextItem !== undefined && nextItem.kind === 'tool-pair' ? nextItem.toolUse : null;
      const nextSource: 'session' | 'subagent' =
        nextToolUse !== null && 'source' in nextToolUse && nextToolUse.source === 'subagent'
          ? 'subagent'
          : 'session';
      const isMidToolRun = nextToolUse !== null && nextSource === source;

      let cumulativeContext: ContextTokenCount | null = null;
      let contextDelta: TokenAnnotation['contextDelta'] = null;

      if (totalContext !== null && !isMidToolRun) {
        const prevContext = source === 'subagent' ? prevSubagentContext : prevSessionContext;
        cumulativeContext = totalContext;
        contextDelta =
          prevContext === null
            ? null
            : contextTokenDeltaContract.parse(Number(totalContext) - Number(prevContext));

        if (source === 'subagent') {
          prevSubagentContext = totalContext;
        } else {
          prevSessionContext = totalContext;
        }
      }

      let resultTokenBadgeLabel: FormattedTokenLabel | null = null;

      if (
        toolResult !== null &&
        'content' in toolResult &&
        typeof toolResult.content === 'string' &&
        toolResult.content.length > 0
      ) {
        const estimated = estimateContentTokensTransformer({ content: toolResult.content });
        resultTokenBadgeLabel =
          Number(estimated) === 0
            ? null
            : formattedTokenLabelContract.parse(
                `~${formatContextTokensTransformer({ count: estimated })} est`,
              );
      }

      return tokenAnnotationContract.parse({
        tokenBadgeLabel: null,
        resultTokenBadgeLabel,
        cumulativeContext,
        contextDelta,
        source,
      });
    }

    // kind: 'entry'
    const { entry } = item;
    const source: 'session' | 'subagent' =
      'source' in entry && entry.source === 'subagent' ? 'subagent' : 'session';

    // Entry with usage (assistant text or tool_use)
    const totalContext = computeEntryContextTransformer({ entry });

    if (totalContext !== null) {
      const prevContext = source === 'subagent' ? prevSubagentContext : prevSessionContext;
      const contextDelta =
        prevContext === null
          ? null
          : contextTokenDeltaContract.parse(Number(totalContext) - Number(prevContext));

      const tokenBadgeLabel =
        contextDelta === null || Number(contextDelta) <= 0
          ? null
          : formattedTokenLabelContract.parse(
              `+${formatContextTokensTransformer({ count: contextTokenCountContract.parse(Number(contextDelta)) })} context`,
            );

      if (source === 'subagent') {
        prevSubagentContext = totalContext;
      } else {
        prevSessionContext = totalContext;
      }

      return tokenAnnotationContract.parse({
        tokenBadgeLabel,
        resultTokenBadgeLabel: null,
        cumulativeContext: totalContext,
        contextDelta,
        source,
      });
    }

    // tool_result entry without usage — estimate content tokens
    if (
      'type' in entry &&
      entry.type === 'tool_result' &&
      'content' in entry &&
      typeof entry.content === 'string' &&
      entry.content.length > 0
    ) {
      const estimated = estimateContentTokensTransformer({ content: entry.content });
      const tokenBadgeLabel =
        Number(estimated) === 0
          ? null
          : formattedTokenLabelContract.parse(
              `~${formatContextTokensTransformer({ count: estimated })} est`,
            );

      return tokenAnnotationContract.parse({
        tokenBadgeLabel,
        resultTokenBadgeLabel: null,
        cumulativeContext: null,
        contextDelta: null,
        source,
      });
    }

    // Everything else — all nulls
    return tokenAnnotationContract.parse({
      tokenBadgeLabel: null,
      resultTokenBadgeLabel: null,
      cumulativeContext: null,
      contextDelta: null,
      source,
    });
  });
};
