/**
 * PURPOSE: Renders a collapsible group of tool call entries with a summary header
 *
 * USAGE:
 * <ToolGroupWidget group={toolGroup} isLastGroup={false} isStreaming={false} />
 * // Renders collapsed tool group with header showing tool count and per-turn context delta
 *
 * Header context badge represents the cross-API-call DELTA (tokens this assistant turn
 * added to context vs. the previous API call's input). The first group in a conversation
 * has no prev to diff against, so the badge is omitted. See packages/web/CLAUDE.md ->
 * "Per-tool context numbers" for why per-tool deltas are NOT meaningful when multiple
 * tools fire per turn - only result-content estimates (~est) are per-tool accurate.
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenDelta } from '../../contracts/context-token-delta/context-token-delta-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { mergeToolEntriesTransformer } from '../../transformers/merge-tool-entries/merge-tool-entries-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ToolRowWidget } from '../tool-row/tool-row-widget';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export interface ToolGroupWidgetProps {
  group: ChatEntryGroup;
  isLastGroup: boolean;
  isStreaming: boolean;
  deltaContextTokens?: ContextTokenDelta | null;
}

export const ToolGroupWidget = ({
  group,
  isLastGroup,
  isStreaming,
  deltaContextTokens,
}: ToolGroupWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);

  if (group.kind !== 'tool-group') return null;

  const isActiveStreaming = isStreaming && isLastGroup;
  const chevron = expanded ? '▾' : '▸';

  // Header shows per-turn DELTA: tokens this assistant turn's API call grew the input
  // by vs. the previous API call. Per-tool delta attribution is NOT possible when a
  // turn fires multiple tools - usage is reported per assistant message, not per tool.
  // First group has no prev to diff against, so the badge is omitted.
  // See packages/web/CLAUDE.md - "Per-tool context numbers".
  const hasDelta =
    deltaContextTokens !== undefined &&
    deltaContextTokens !== null &&
    Number(deltaContextTokens) !== 0;

  const formattedDelta = hasDelta
    ? formatContextTokensTransformer({
        count: contextTokenCountContract.parse(Math.abs(Number(deltaContextTokens))),
      })
    : null;

  const deltaSign = hasDelta && Number(deltaContextTokens) < 0 ? '-' : '+';

  const headerText =
    formattedDelta === null
      ? `${chevron} ${String(group.toolCount)} Tools`
      : `${chevron} ${String(group.toolCount)} Tools (${deltaSign}${formattedDelta} context)`;

  const pairs = mergeToolEntriesTransformer({ entries: group.entries });
  const lastPair = pairs.at(-1);

  return (
    <Box>
      <Box
        data-testid="TOOL_GROUP_HEADER"
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
        }}
      >
        {group.source === 'subagent' ? (
          <Text
            ff="monospace"
            size="xs"
            fw={600}
            style={{
              color: colors['loot-rare'],
              padding: '1px 4px',
              borderRadius: 2,
            }}
          >
            SUB-AGENT
          </Text>
        ) : null}
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          {headerText}
        </Text>
      </Box>

      {isActiveStreaming && !expanded && lastPair !== undefined && lastPair.kind === 'tool-pair' ? (
        <Box style={{ paddingLeft: 12 }}>
          <ToolRowWidget
            toolUse={lastPair.toolUse as Extract<typeof lastPair.toolUse, { type: 'tool_use' }>}
            isLoading={lastPair.toolResult === null}
            {...(lastPair.toolResult === null
              ? {}
              : { toolResult: lastPair.toolResult as ToolResultEntry })}
            defaultExpanded={true}
          />
        </Box>
      ) : null}

      {expanded ? (
        <Box style={{ paddingLeft: 12 }}>
          {(() => {
            const annotations = computeTokenAnnotationsTransformer({ items: pairs });

            return pairs.map((item, index) => {
              const annotation = annotations[index];

              if (item.kind === 'tool-pair') {
                const toolUseEntry = item.toolUse;

                return (
                  <ToolRowWidget
                    key={index}
                    toolUse={toolUseEntry as Extract<typeof toolUseEntry, { type: 'tool_use' }>}
                    {...(item.toolResult === null
                      ? {}
                      : { toolResult: item.toolResult as ToolResultEntry })}
                    {...(annotation?.resultTokenBadgeLabel === undefined ||
                    annotation.resultTokenBadgeLabel === null
                      ? {}
                      : { resultTokenBadgeLabel: annotation.resultTokenBadgeLabel })}
                  />
                );
              }

              // Regular entry (orphan tool_result or non-tool entry)
              return <ChatMessageWidget key={index} entry={item.entry} />;
            });
          })()}
        </Box>
      ) : null}
    </Box>
  );
};
