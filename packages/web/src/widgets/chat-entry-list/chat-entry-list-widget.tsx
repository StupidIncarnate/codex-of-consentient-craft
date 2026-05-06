/**
 * PURPOSE: Renders a flat list of chat entries with tool rows, sub-agent chains, thinking, and streaming-indicator layout — shared between chat and execution views
 *
 * USAGE:
 * <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers showEndStreamingIndicator />
 * // Chat variant: renders with cumulative-context dividers and a streaming indicator at the tail
 *
 * <ChatEntryListWidget entries={entries} isStreaming={true} roleLabel={role} swapTrailingEmptyThinkingForIndicator />
 * // Execution variant: renders the full transcript; swaps a trailing empty-content thinking entry for a streaming indicator
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { toolNameContract } from '../../contracts/tool-name/tool-name-contract';
import type { ToolName } from '../../contracts/tool-name/tool-name-contract';
import { collectSubagentChainsTransformer } from '../../transformers/collect-subagent-chains/collect-subagent-chains-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { mergeToolEntriesTransformer } from '../../transformers/merge-tool-entries/merge-tool-entries-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { StreamingIndicatorWidget } from '../streaming-indicator/streaming-indicator-widget';
import { SubagentChainWidget } from '../subagent-chain/subagent-chain-widget';
import { ToolRowWidget } from '../tool-row/tool-row-widget';

type ToolUseEntry = Extract<ChatEntry, { type: 'tool_use' }>;
type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

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

  // Flatten singles into a chat entry list (preserving order), then merge tool_use+tool_result
  // into pairs so we can render flat ToolRowWidget rows instead of a collapsible tool group.
  // Sub-agent chains stay as their own group — that grouping is a meaningful unit (the Task
  // tool_use lifecycle), not a per-turn collapse.
  const singleEntries = groupedEntries.filter((g) => g.kind === 'single').map((g) => g.entry);
  const mergedSingles = mergeToolEntriesTransformer({ entries: singleEntries });
  const singleAnnotations = computeTokenAnnotationsTransformer({ items: mergedSingles });

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

  // tool_result entries that were paired with a tool_use are already rendered as
  // part of the tool-pair on the tool_use's iteration. Skip them when we encounter
  // them again as standalone singles in groupedEntries. Build the set from the
  // ORIGINAL entry references in singleEntries (not from mergedSingles, which
  // re-parses through Zod and breaks object identity needed for Set lookups).
  const pairTails = new Set<ChatEntry>();
  const resultByUseId = new Map<ToolName, ChatEntry>();
  for (const e of singleEntries) {
    if ('type' in e && e.type === 'tool_result') {
      resultByUseId.set(e.toolName, e);
    }
  }
  for (const e of singleEntries) {
    if ('type' in e && e.type === 'tool_use' && 'toolUseId' in e && e.toolUseId !== undefined) {
      const lookupKey = toolNameContract.parse(e.toolUseId);
      const result = resultByUseId.get(lookupKey);
      if (result !== undefined) {
        pairTails.add(result);
      }
    }
  }

  const lastEntryInList = entries.at(-1);
  const elements: React.JSX.Element[] = [];
  let mergedCursor = 0;
  let runningSubagentTotal = 0;

  for (let i = 0; i < groupedEntries.length; i++) {
    const group = groupedEntries[i];
    if (group === undefined) continue;

    if (group.kind === 'subagent-chain') {
      elements.push(<SubagentChainWidget key={`chain-${String(i)}`} group={group} />);
      if (group.contextTokens !== null) {
        runningSubagentTotal += Number(group.contextTokens);
      }
      continue;
    }

    const { entry } = group;

    if (i === trailingEmptyThinkingIndex) {
      const isSubagent = 'source' in entry && entry.source === 'subagent';
      elements.push(
        <StreamingIndicatorWidget key={`thinking-${String(i)}`} isSubagent={isSubagent} />,
      );
      continue;
    }

    if (pairTails.has(entry)) {
      // Already rendered as the tail of a previous tool-pair. Don't advance
      // mergedCursor — the cursor advanced when we rendered the tool_use head.
      continue;
    }

    const mergedItem = mergedSingles[mergedCursor];
    if (mergedItem === undefined) continue;

    const annotation = singleAnnotations[mergedCursor];
    mergedCursor += 1;

    if (mergedItem.kind === 'tool-pair') {
      const isLastUnpaired =
        isStreaming && mergedItem.toolResult === null && entry === lastEntryInList;

      elements.push(
        <ToolRowWidget
          key={`tool-${String(i)}`}
          toolUse={mergedItem.toolUse as ToolUseEntry}
          {...(mergedItem.toolResult === null
            ? {}
            : { toolResult: mergedItem.toolResult as ToolResultEntry })}
          {...(annotation?.resultTokenBadgeLabel === undefined ||
          annotation.resultTokenBadgeLabel === null
            ? {}
            : { resultTokenBadgeLabel: annotation.resultTokenBadgeLabel })}
          {...(isLastUnpaired ? { isLoading: true, defaultExpanded: true } : {})}
        />,
      );
    } else {
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
    }

    if (
      showContextDividers &&
      annotation?.cumulativeContext !== null &&
      annotation?.cumulativeContext !== undefined
    ) {
      const subagentTotalProp =
        runningSubagentTotal > 0
          ? { subagentTotalTokens: contextTokenCountContract.parse(runningSubagentTotal) }
          : {};
      elements.push(
        <ContextDividerWidget
          key={`divider-${String(i)}`}
          contextTokens={annotation.cumulativeContext}
          delta={annotation.contextDelta}
          source={annotation.source}
          {...subagentTotalProp}
        />,
      );
    }
  }

  if (showEndStreamingIndicator && isStreaming) {
    const isSubagentStreaming =
      lastEntryInList !== undefined &&
      'source' in lastEntryInList &&
      lastEntryInList.source === 'subagent';
    elements.push(
      <StreamingIndicatorWidget key="streaming-indicator" isSubagent={isSubagentStreaming} />,
    );
  }

  return <>{elements}</>;
};
