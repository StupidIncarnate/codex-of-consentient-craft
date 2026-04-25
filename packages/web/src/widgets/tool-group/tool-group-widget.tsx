/**
 * PURPOSE: Renders a collapsible group of tool call entries with a summary header
 *
 * USAGE:
 * <ToolGroupWidget group={toolGroup} isLastGroup={false} isStreaming={false} />
 * // Renders collapsed tool group with header showing tool count and context tokens
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
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
}

export const ToolGroupWidget = ({
  group,
  isLastGroup,
  isStreaming,
}: ToolGroupWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(true);

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
            const lastIndex = pairs.length - 1;

            return pairs.map((item, index) => {
              const annotation = annotations[index];

              if (item.kind === 'tool-pair') {
                const toolUseEntry = item.toolUse;
                const isStreamingLast = isActiveStreaming && index === lastIndex;

                return (
                  <ToolRowWidget
                    key={index}
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
                    {...(isStreamingLast
                      ? {
                          defaultExpanded: true,
                          ...(item.toolResult === null ? { isLoading: true } : {}),
                        }
                      : {})}
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
