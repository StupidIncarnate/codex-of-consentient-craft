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
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { findAnchorUnitTailIndexTransformer } from '../../transformers/find-anchor-unit-tail-index/find-anchor-unit-tail-index-transformer';
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
      });
    }
  }

  const tailUnitIndex = collapseToTail
    ? Number(findAnchorUnitTailIndexTransformer({ flags: renderUnits.map((u) => u.isAnchor) }))
    : 0;

  // Tail window: keep just the most recent message anchor + the most recent unit overall.
  // Everything between them collapses out so multiple parallel chains don't blow past
  // a single screen height as new tool calls stream in.
  const lastUnitIndex = renderUnits.length - 1;
  const collapsedVisibleCount =
    renderUnits.length === 0
      ? 0
      : tailUnitIndex >= lastUnitIndex
        ? tailWindowConfigStatics.minVisibleWhenCollapsed
        : tailWindowConfigStatics.maxVisibleWhenCollapsed;
  const wouldHideCount = collapseToTail ? renderUnits.length - collapsedVisibleCount : 0;

  let visibleUnits: RenderUnit[] = renderUnits;
  if (collapseToTail && !showAllEarlier && renderUnits.length > 0) {
    const anchorUnit = renderUnits[tailUnitIndex];
    const lastUnit = renderUnits[lastUnitIndex];
    if (anchorUnit !== undefined && lastUnit !== undefined) {
      visibleUnits = tailUnitIndex >= lastUnitIndex ? [lastUnit] : [anchorUnit, lastUnit];
    }
  }

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
