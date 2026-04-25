/**
 * PURPOSE: Renders a grouped list of chat entries with tool-group, subagent-chain, thinking, and streaming-indicator layout — shared between chat and execution views
 *
 * USAGE:
 * <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers showEndStreamingIndicator />
 * // Chat variant: renders with context dividers and a streaming indicator at the tail
 *
 * <ChatEntryListWidget entries={entries} isStreaming={true} roleLabel={role} swapTrailingEmptyThinkingForIndicator />
 * // Execution variant: renders the full transcript; swaps a trailing empty-content thinking entry for a streaming indicator
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { mergedChatItemContract } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { collectSubagentChainsTransformer } from '../../transformers/collect-subagent-chains/collect-subagent-chains-transformer';
import { computeGroupContextDeltasTransformer } from '../../transformers/compute-group-context-deltas/compute-group-context-deltas-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { StreamingIndicatorWidget } from '../streaming-indicator/streaming-indicator-widget';
import { SubagentChainWidget } from '../subagent-chain/subagent-chain-widget';
import { ToolGroupWidget } from '../tool-group/tool-group-widget';

export interface ChatEntryListWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  roleLabel?: ExecutionRole;
  showContextDividers?: boolean;
  showEndStreamingIndicator?: boolean;
  swapTrailingEmptyThinkingForIndicator?: boolean;
}

export const ChatEntryListWidget = ({
  entries,
  isStreaming,
  roleLabel,
  showContextDividers = false,
  showEndStreamingIndicator = false,
  swapTrailingEmptyThinkingForIndicator = false,
}: ChatEntryListWidgetProps): React.JSX.Element => {
  const groupedEntries = collectSubagentChainsTransformer({ entries });

  const singleItems = groupedEntries
    .filter((g) => g.kind === 'single')
    .map((g) => mergedChatItemContract.parse({ kind: 'entry', entry: g.entry }));
  const singleAnnotations = computeTokenAnnotationsTransformer({ items: singleItems });
  const groupDeltas = computeGroupContextDeltasTransformer({ groups: groupedEntries });

  let trailingEmptyThinkingIndex = -1;
  if (swapTrailingEmptyThinkingForIndicator) {
    const lastGroup = groupedEntries.at(-1);
    if (
      lastGroup !== undefined &&
      lastGroup.kind === 'single' &&
      lastGroup.entry.role === 'assistant' &&
      'type' in lastGroup.entry &&
      lastGroup.entry.type === 'thinking' &&
      lastGroup.entry.content.length === 0
    ) {
      trailingEmptyThinkingIndex = groupedEntries.length - 1;
    }
  }

  let singleIndex = 0;
  const elements: React.JSX.Element[] = [];

  for (let i = 0; i < groupedEntries.length; i++) {
    const group = groupedEntries[i];
    if (group === undefined) continue;

    if (group.kind === 'tool-group') {
      const deltaContextTokens = groupDeltas[i] ?? null;
      elements.push(
        <ToolGroupWidget
          key={`group-${String(i)}`}
          group={group}
          isLastGroup={i === groupedEntries.length - 1}
          isStreaming={isStreaming}
          deltaContextTokens={deltaContextTokens}
        />,
      );
      continue;
    }

    if (group.kind === 'subagent-chain') {
      elements.push(<SubagentChainWidget key={`chain-${String(i)}`} group={group} />);
      continue;
    }

    const { entry } = group;
    const annotation = singleAnnotations[singleIndex];
    singleIndex += 1;

    if (i === trailingEmptyThinkingIndex) {
      const isSubagent = 'source' in entry && entry.source === 'subagent';
      elements.push(
        <StreamingIndicatorWidget key={`thinking-${String(i)}`} isSubagent={isSubagent} />,
      );
      continue;
    }

    elements.push(
      <ChatMessageWidget
        key={`single-${String(i)}`}
        entry={entry}
        {...(roleLabel === undefined ? {} : { roleLabel })}
        {...(annotation?.tokenBadgeLabel === undefined || annotation.tokenBadgeLabel === null
          ? {}
          : { tokenBadgeLabel: annotation.tokenBadgeLabel })}
      />,
    );

    if (
      showContextDividers &&
      annotation?.cumulativeContext !== null &&
      annotation?.cumulativeContext !== undefined
    ) {
      elements.push(
        <ContextDividerWidget
          key={`divider-${String(i)}`}
          contextTokens={annotation.cumulativeContext}
          delta={annotation.contextDelta}
          source={annotation.source}
        />,
      );
    }
  }

  if (showEndStreamingIndicator && isStreaming) {
    const lastEntry = entries.at(-1);
    const isSubagentStreaming =
      lastEntry !== undefined && 'source' in lastEntry && lastEntry.source === 'subagent';
    elements.push(
      <StreamingIndicatorWidget key="streaming-indicator" isSubagent={isSubagentStreaming} />,
    );
  }

  return <>{elements}</>;
};
