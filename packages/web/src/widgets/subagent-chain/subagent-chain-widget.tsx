/**
 * PURPOSE: Renders a collapsible sub-agent chain with header showing description and entry count
 *
 * USAGE:
 * <SubagentChainWidget group={subagentChainGroup} />
 * // Renders collapsed chain header, expands to show inner tool groups and messages
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry, CssPixels } from '@dungeonmaster/shared/contracts';
import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import type {
  ChatEntryGroup,
  SingleGroup,
  SubagentChainGroup,
} from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { tailStartIndexContract } from '../../contracts/tail-start-index/tail-start-index-contract';
import { toggleTestIdContract } from '../../contracts/toggle-test-id/toggle-test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';
import { tailWindowConfigStatics } from '../../statics/tail-window-config/tail-window-config-statics';
import { computeMergedItemTailIndexTransformer } from '../../transformers/compute-merged-item-tail-index/compute-merged-item-tail-index-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { mergeToolEntriesTransformer } from '../../transformers/merge-tool-entries/merge-tool-entries-transformer';
import { stickyHeaderZIndexTransformer } from '../../transformers/sticky-header-z-index/sticky-header-z-index-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ShowEarlierToggleWidget } from '../show-earlier-toggle/show-earlier-toggle-widget';
import { ToolRowWidget } from '../tool-row/tool-row-widget';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export interface SubagentChainWidgetProps {
  group: ChatEntryGroup;
  // Where this chain's header pins once it is open — the combined height of every expandable header
  // it is nested inside. Chains rendered straight into a scroll panel take the default and pin flush
  // to its top.
  stickyTop?: CssPixels;
}

const STICKY_TOP_ROOT = cssPixelsContract.parse(0);

export const SubagentChainWidget = ({
  group,
  stickyTop = STICKY_TOP_ROOT,
}: SubagentChainWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(true);
  const [showAllEarlier, setShowAllEarlier] = useState(false);

  if (group.kind !== 'subagent-chain') return null;

  const chevron = expanded ? '▾' : '▸';

  // Everything inside this chain pins below this chain's own header. Passing the running total down
  // rather than a depth count is what lets a level stack correctly without knowing what it is nested
  // in — a tool row adds nothing of its own, a nested chain adds another header's worth.
  const innerStickyTop = cssPixelsContract.parse(
    Number(stickyTop) + stickyHeaderStatics.heights.subagentChain,
  );

  const formattedTokens =
    group.contextTokens === null
      ? null
      : formatContextTokensTransformer({
          count: contextTokenCountContract.parse(group.contextTokens),
        });

  const entrySuffix =
    formattedTokens === null
      ? `${String(group.entryCount)} entries`
      : `${String(group.entryCount)} entries, ${formattedTokens} context`;

  return (
    <Box data-testid="SUBAGENT_CHAIN">
      <Box
        data-testid="SUBAGENT_CHAIN_HEADER"
        onClick={() => {
          setExpanded((prev) => !prev);
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          userSelect: 'none',
          // Pinned only while open, so a collapsed chain — already one line — keeps the layout it
          // had. The fill is load-bearing: this header is transparent by default, and the entries
          // scrolling beneath it would otherwise read straight through the pinned bar. `bg-surface`
          // is an exact match inside an expanded execution row and a raised band in the chat panel,
          // where the surface behind is `bg-deep`.
          ...(expanded
            ? {
                position: 'sticky' as const,
                top: Number(stickyTop),
                zIndex: Number(stickyHeaderZIndexTransformer({ stickyTop })),
                height: stickyHeaderStatics.heights.subagentChain,
                boxSizing: 'border-box' as const,
                backgroundColor: colors['bg-surface'],
              }
            : {}),
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={600}
          style={{
            color: colors['loot-rare'],
            padding: '1px 4px',
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          {chevron} SUB-AGENT
        </Text>
        {/* Held to one line so the header's height is the constant the offsets below it are built
            on. A description long enough to wrap would push a pinned bar to two lines and every
            header nested under it would pin into the gap. */}
        <Text
          ff="monospace"
          size="xs"
          style={{
            color: colors['text-dim'],
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          &quot;{group.description}&quot; ({entrySuffix})
        </Text>
      </Box>

      {expanded ? (
        <Box style={{ paddingLeft: 12 }}>
          {(() => {
            const singleEntries = group.innerGroups
              .filter((ig): ig is SingleGroup => ig.kind === 'single')
              .map((ig) => ig.entry);
            const mergedItems = mergeToolEntriesTransformer({ entries: singleEntries });
            const annotations = computeTokenAnnotationsTransformer({ items: mergedItems });
            const tailStartIndex = Number(
              computeMergedItemTailIndexTransformer({ items: mergedItems }),
            );

            // Tail window: keep the most recent message anchor + the most recent item overall.
            // Everything between collapses out so chains don't blow past a single screen
            // height as new tool calls stream in.
            const lastIndex = mergedItems.length - 1;
            const allIndices = mergedItems.map((_, i) => i);
            const tailIndices =
              mergedItems.length === 0
                ? []
                : tailStartIndex >= lastIndex
                  ? [lastIndex]
                  : [tailStartIndex, lastIndex];
            const visibleIndices = showAllEarlier ? allIndices : tailIndices;
            const collapsedVisibleCount =
              mergedItems.length === 0
                ? 0
                : tailStartIndex >= lastIndex
                  ? tailWindowConfigStatics.minVisibleWhenCollapsed
                  : tailWindowConfigStatics.maxVisibleWhenCollapsed;
            const wouldHideCount = mergedItems.length - collapsedVisibleCount;

            // Toggle persists once a chain has anything hidden by the tail window — even after
            // the user expands, so they can collapse back.
            const toggleRow =
              wouldHideCount > 0 ? (
                <ShowEarlierToggleWidget
                  key="show-earlier-toggle"
                  hiddenCount={tailStartIndexContract.parse(wouldHideCount)}
                  expanded={showAllEarlier}
                  onToggle={(): void => {
                    setShowAllEarlier((prev) => !prev);
                  }}
                  testId={toggleTestIdContract.parse('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE')}
                />
              ) : null;

            const renderedItems = visibleIndices.map((index) => {
              const item = mergedItems[index];
              const annotation = annotations[index];
              if (item === undefined) return null;

              if (item.kind === 'tool-pair') {
                const toolUseEntry = item.toolUse;

                return (
                  <ToolRowWidget
                    key={`inner-${String(index)}`}
                    stickyTop={innerStickyTop}
                    toolUse={toolUseEntry as Extract<typeof toolUseEntry, { type: 'tool_use' }>}
                    {...(item.toolResult === null
                      ? {}
                      : { toolResult: item.toolResult as ToolResultEntry })}
                    {...(annotation?.tokenBadgeLabel === undefined ||
                    annotation.tokenBadgeLabel === null
                      ? {}
                      : { tokenBadgeLabel: annotation.tokenBadgeLabel })}
                    {...(annotation?.resultTokenBadgeLabel === undefined ||
                    annotation.resultTokenBadgeLabel === null
                      ? {}
                      : { resultTokenBadgeLabel: annotation.resultTokenBadgeLabel })}
                  />
                );
              }

              return (
                <ChatMessageWidget
                  key={`inner-${String(index)}`}
                  entry={item.entry}
                  {...(annotation?.tokenBadgeLabel === undefined ||
                  annotation.tokenBadgeLabel === null
                    ? {}
                    : { tokenBadgeLabel: annotation.tokenBadgeLabel })}
                />
              );
            });

            return (
              <>
                {toggleRow}
                {renderedItems}
              </>
            );
          })()}
          {group.innerGroups
            .filter((ig): ig is SubagentChainGroup => ig.kind === 'subagent-chain')
            .map((nested, index) => (
              <SubagentChainWidget
                key={`nested-chain-${String(index)}`}
                group={nested}
                stickyTop={innerStickyTop}
              />
            ))}
          {group.taskNotification === null ? null : (
            <ChatMessageWidget entry={group.taskNotification} />
          )}
        </Box>
      ) : null}
    </Box>
  );
};
