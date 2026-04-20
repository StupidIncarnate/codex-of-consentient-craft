/**
 * PURPOSE: Renders a grouped ChatEntry[] (single messages, tool groups, sub-agent chains) with optional context dividers and a trailing streaming indicator
 *
 * USAGE:
 * <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />
 * // Renders ChatMessage / ToolGroup / SubagentChain rows plus StreamingIndicator when streaming
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { mergedChatItemContract } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { collectSubagentChainsTransformer } from '../../transformers/collect-subagent-chains/collect-subagent-chains-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { StreamingIndicatorWidget } from '../streaming-indicator/streaming-indicator-widget';
import { SubagentChainWidget } from '../subagent-chain/subagent-chain-widget';
import { ToolGroupWidget } from '../tool-group/tool-group-widget';

export interface ChatEntryListWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  showContextDividers: boolean;
  roleLabel?: ExecutionRole;
}

export const ChatEntryListWidget = ({
  entries,
  isStreaming,
  showContextDividers,
  roleLabel,
}: ChatEntryListWidgetProps): React.JSX.Element => {
  const groupedEntries = collectSubagentChainsTransformer({ entries });

  const singleItems = groupedEntries
    .filter((g) => g.kind === 'single')
    .map((g) => mergedChatItemContract.parse({ kind: 'entry', entry: g.entry }));
  const singleAnnotations = computeTokenAnnotationsTransformer({ items: singleItems });

  let singleIndex = 0;
  const elements: React.JSX.Element[] = [];

  for (let i = 0; i < groupedEntries.length; i++) {
    const group = groupedEntries[i];
    if (group === undefined) continue;

    if (group.kind === 'tool-group') {
      elements.push(
        <ToolGroupWidget
          key={`group-${String(i)}`}
          group={group}
          isLastGroup={i === groupedEntries.length - 1}
          isStreaming={isStreaming}
        />,
      );
    } else if (group.kind === 'subagent-chain') {
      elements.push(<SubagentChainWidget key={`chain-${String(i)}`} group={group} />);
    } else {
      const { entry } = group;
      const annotation = singleAnnotations[singleIndex];
      singleIndex += 1;

      const tokenBadgeProp =
        annotation?.tokenBadgeLabel === undefined || annotation.tokenBadgeLabel === null
          ? {}
          : { tokenBadgeLabel: annotation.tokenBadgeLabel };
      const roleLabelProp = roleLabel === undefined ? {} : { roleLabel };

      elements.push(
        <ChatMessageWidget
          key={`single-${String(i)}`}
          entry={entry}
          {...tokenBadgeProp}
          {...roleLabelProp}
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
  }

  if (isStreaming) {
    const lastEntry = entries.at(-1);
    const isSubagentStreaming =
      lastEntry !== undefined && 'source' in lastEntry && lastEntry.source === 'subagent';

    elements.push(
      <StreamingIndicatorWidget key="streaming-indicator" isSubagent={isSubagentStreaming} />,
    );
  }

  return <>{elements}</>;
};
