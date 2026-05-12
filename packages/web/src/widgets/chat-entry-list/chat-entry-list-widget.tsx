/**
 * PURPOSE: Renders a flat list of chat entries with tool rows, sub-agent chains, thinking, and streaming-indicator layout — shared between chat and execution views
 *
 * USAGE:
 * <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers showEndStreamingIndicator />
 * // Chat variant: renders with cumulative-context dividers and a streaming indicator at the tail
 *
 * <ChatEntryListWidget entries={entries} isStreaming={true} roleLabel={role} swapTrailingEmptyThinkingForIndicator collapseToTail />
 * // Execution variant: renders the full transcript; swaps a trailing empty-content thinking entry for a streaming indicator. With collapseToTail, hides everything before the most recent message anchor (text/user/system entry or sub-agent chain) behind a "Show N earlier entries" toggle.
 */

import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { tailStartIndexContract } from '../../contracts/tail-start-index/tail-start-index-contract';
import { toggleTestIdContract } from '../../contracts/toggle-test-id/toggle-test-id-contract';
import { isMessageAnchorEntryGuard } from '../../guards/is-message-anchor-entry/is-message-anchor-entry-guard';
import { tailWindowConfigStatics } from '../../statics/tail-window-config/tail-window-config-statics';
import { collectPairTailEntriesTransformer } from '../../transformers/collect-pair-tail-entries/collect-pair-tail-entries-transformer';
import { collectSubagentChainsTransformer } from '../../transformers/collect-subagent-chains/collect-subagent-chains-transformer';
import { computeTailVisibleIndicesTransformer } from '../../transformers/compute-tail-visible-indices/compute-tail-visible-indices-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { findTrailingEmptyThinkingIndexTransformer } from '../../transformers/find-trailing-empty-thinking-index/find-trailing-empty-thinking-index-transformer';
import { mergeToolEntriesTransformer } from '../../transformers/merge-tool-entries/merge-tool-entries-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { ShowEarlierToggleWidget } from '../show-earlier-toggle/show-earlier-toggle-widget';
import { StreamingIndicatorWidget } from '../streaming-indicator/streaming-indicator-widget';
import { SubagentChainWidget } from '../subagent-chain/subagent-chain-widget';
import { ToolRowWidget } from '../tool-row/tool-row-widget';

type ToolUseEntry = Extract<ChatEntry, { type: 'tool_use' }>;
type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

interface RenderUnit {
  element: React.JSX.Element;
  isAnchor: boolean;
  isSubagentChain: boolean;
}

export interface ChatEntryListWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  roleLabel?: ExecutionRole;
  showContextDividers?: boolean;
  showEndStreamingIndicator?: boolean;
  swapTrailingEmptyThinkingForIndicator?: boolean;
  collapseToTail?: boolean;
}

export const ChatEntryListWidget = ({
  entries,
  isStreaming,
  roleLabel,
  showContextDividers = false,
  showEndStreamingIndicator = false,
  swapTrailingEmptyThinkingForIndicator = false,
  collapseToTail = false,
}: ChatEntryListWidgetProps): React.JSX.Element => {
  const [showAllEarlier, setShowAllEarlier] = useState(false);
  const groupedEntries = collectSubagentChainsTransformer({ entries });

  // Flatten singles into a chat entry list (preserving order), then merge tool_use+tool_result
  // into pairs so we can render flat ToolRowWidget rows instead of a collapsible tool group.
  // Sub-agent chains stay as their own group — that grouping is a meaningful unit (the Task
  // tool_use lifecycle), not a per-turn collapse.
  const singleEntries = groupedEntries.filter((g) => g.kind === 'single').map((g) => g.entry);
  const mergedSingles = mergeToolEntriesTransformer({ entries: singleEntries });
  const singleAnnotations = computeTokenAnnotationsTransformer({ items: mergedSingles });

  const trailingEmptyThinkingIndex = swapTrailingEmptyThinkingForIndicator
    ? Number(findTrailingEmptyThinkingIndexTransformer({ groups: groupedEntries }))
    : -1;

  const pairTails = collectPairTailEntriesTransformer({ entries: singleEntries });

  const lastEntryInList = entries.at(-1);
  const renderUnits: RenderUnit[] = [];
  let mergedCursor = 0;
  let runningSubagentTotal = 0;

  for (let i = 0; i < groupedEntries.length; i++) {
    const group = groupedEntries[i];
    if (group === undefined) continue;

    if (group.kind === 'subagent-chain') {
      renderUnits.push({
        element: <SubagentChainWidget key={`chain-${String(i)}`} group={group} />,
        isAnchor: true,
        isSubagentChain: true,
      });
      if (group.contextTokens !== null) {
        runningSubagentTotal += Number(group.contextTokens);
      }
      continue;
    }

    const { entry } = group;

    if (i === trailingEmptyThinkingIndex) {
      const isSubagent = 'source' in entry && entry.source === 'subagent';
      renderUnits.push({
        element: <StreamingIndicatorWidget key={`thinking-${String(i)}`} isSubagent={isSubagent} />,
        isAnchor: false,
        isSubagentChain: false,
      });
      continue;
    }

    if (pairTails.has(entry)) continue;

    const mergedItem = mergedSingles[mergedCursor];
    if (mergedItem === undefined) continue;

    const annotation = singleAnnotations[mergedCursor];
    mergedCursor += 1;

    if (mergedItem.kind === 'tool-pair') {
      const isLastUnpaired =
        isStreaming && mergedItem.toolResult === null && entry === lastEntryInList;

      renderUnits.push({
        element: (
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
          />
        ),
        isAnchor: false,
        isSubagentChain: false,
      });
    } else {
      renderUnits.push({
        element: (
          <ChatMessageWidget
            key={`single-${String(i)}`}
            entry={entry}
            {...(roleLabel === undefined ? {} : { roleLabel })}
            {...(annotation?.tokenBadgeLabel === undefined || annotation.tokenBadgeLabel === null
              ? {}
              : { tokenBadgeLabel: annotation.tokenBadgeLabel })}
          />
        ),
        isAnchor: isMessageAnchorEntryGuard({ entry }),
        isSubagentChain: false,
      });
    }

    const cumulativeForDivider = annotation?.cumulativeContext;
    if (
      showContextDividers &&
      cumulativeForDivider !== null &&
      cumulativeForDivider !== undefined &&
      annotation !== undefined
    ) {
      const subagentTotalProp =
        runningSubagentTotal > 0
          ? { subagentTotalTokens: contextTokenCountContract.parse(runningSubagentTotal) }
          : {};
      renderUnits.push({
        element: (
          <ContextDividerWidget
            key={`divider-${String(i)}`}
            contextTokens={cumulativeForDivider}
            delta={annotation.contextDelta}
            source={annotation.source}
            {...subagentTotalProp}
          />
        ),
        isAnchor: false,
        isSubagentChain: false,
      });
    }
  }

  // Tail window: keep the most recent MESSAGE anchor (text/user/system, not a sub-agent
  // chain), every sub-agent chain that follows it (each chain is its own collapsible unit
  // with its own toggle), and the very last unit. Intermediate tool pairs collapse out so
  // long streaming tool runs don't blow past a single screen height while parallel
  // sub-agent chains remain visible.
  const collapsedIndices = collapseToTail
    ? computeTailVisibleIndicesTransformer({
        isAnchorFlags: renderUnits.map((u) => u.isAnchor),
        isSubagentChainFlags: renderUnits.map((u) => u.isSubagentChain),
      })
    : [];
  const collapsedUnits = collapsedIndices
    .map((idx) => renderUnits[Number(idx)])
    .filter((u): u is RenderUnit => u !== undefined);

  // Collapsed minimum-visible bound — at least 1 unit visible when no message anchor, at
  // least 2 (anchor + last) when there is one — applied so the toggle's hidden-count never
  // drops below what the user can actually un-hide.
  const hasMessageAnchor = renderUnits.some((u) => u.isAnchor && !u.isSubagentChain);
  const collapsedMinVisible = hasMessageAnchor
    ? tailWindowConfigStatics.maxVisibleWhenCollapsed
    : tailWindowConfigStatics.minVisibleWhenCollapsed;
  const collapsedVisibleCount =
    renderUnits.length === 0 ? 0 : Math.max(collapsedUnits.length, collapsedMinVisible);
  const wouldHideCount = collapseToTail
    ? Math.max(0, renderUnits.length - collapsedVisibleCount)
    : 0;

  const visibleUnits: RenderUnit[] =
    collapseToTail && !showAllEarlier && renderUnits.length > 0 ? collapsedUnits : renderUnits;

  const trailingElements: React.JSX.Element[] = [];
  if (showEndStreamingIndicator && isStreaming) {
    const isSubagentStreaming =
      lastEntryInList !== undefined &&
      'source' in lastEntryInList &&
      lastEntryInList.source === 'subagent';
    trailingElements.push(
      <StreamingIndicatorWidget key="streaming-indicator" isSubagent={isSubagentStreaming} />,
    );
  }

  // Toggle persists once a chain has anything hidden by the tail window — even after
  // the user expands, so they can collapse back.
  const showEarlierToggle =
    wouldHideCount > 0 ? (
      <ShowEarlierToggleWidget
        key="show-earlier-toggle"
        hiddenCount={tailStartIndexContract.parse(wouldHideCount)}
        expanded={showAllEarlier}
        onToggle={(): void => {
          setShowAllEarlier((prev) => !prev);
        }}
        testId={toggleTestIdContract.parse('CHAT_LIST_SHOW_EARLIER_TOGGLE')}
      />
    ) : null;

  return (
    <>
      {showEarlierToggle}
      {visibleUnits.map((unit) => unit.element)}
      {trailingElements}
    </>
  );
};
