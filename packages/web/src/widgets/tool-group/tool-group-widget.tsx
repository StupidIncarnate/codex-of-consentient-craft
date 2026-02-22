/**
 * PURPOSE: Renders a collapsible group of tool call entries with a summary header
 *
 * USAGE:
 * <ToolGroupWidget group={toolGroup} isLastGroup={false} isStreaming={false} />
 * // Renders collapsed tool group with header showing tool count and context tokens
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';

export interface ToolGroupWidgetProps {
  group: ChatEntryGroup;
  isLastGroup: boolean;
  isStreaming: boolean;
}

export const ToolGroupWidget = ({
  group,
  isLastGroup,
  isStreaming,
}: ToolGroupWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);

  if (group.kind !== 'tool-group') return null;

  const isActiveStreaming = isStreaming && isLastGroup;
  const chevron = expanded ? '\u25BE' : '\u25B8';

  const formattedTokens =
    group.contextTokens === null
      ? null
      : formatContextTokensTransformer({
          count: contextTokenCountContract.parse(group.contextTokens),
        });

  const headerText =
    formattedTokens === null
      ? `${chevron} ${String(group.toolCount)} Tools`
      : `${chevron} ${String(group.toolCount)} Tools (${formattedTokens} context)`;

  const lastEntry = group.entries.at(-1);

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

      {isActiveStreaming && !expanded && lastEntry !== undefined ? (
        <Box style={{ paddingLeft: 12 }}>
          <ChatMessageWidget entry={lastEntry} isLoading={true} isStreaming={isStreaming} />
        </Box>
      ) : null}

      {expanded ? (
        <Box style={{ paddingLeft: 12 }}>
          {group.entries.map((entry, index) => {
            const outputCount =
              'usage' in entry && entry.usage !== undefined ? Number(entry.usage.outputTokens) : 0;

            if (outputCount === 0) {
              return <ChatMessageWidget key={index} entry={entry} isStreaming={isStreaming} />;
            }

            const tokenBadgeLabel = formatContextTokensTransformer({
              count: contextTokenCountContract.parse(outputCount),
            });

            return (
              <ChatMessageWidget
                key={index}
                entry={entry}
                isStreaming={isStreaming}
                tokenBadgeLabel={tokenBadgeLabel}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};
