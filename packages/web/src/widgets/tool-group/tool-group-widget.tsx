/**
 * PURPOSE: Renders a collapsible group of tool call entries with a summary header
 *
 * USAGE:
 * <ToolGroupWidget group={toolGroup} isLastGroup={false} isStreaming={false} />
 * // Renders collapsed tool group with header showing tool count and context tokens
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { formattedTokenLabelContract } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { estimateContentTokensTransformer } from '../../transformers/estimate-content-tokens/estimate-content-tokens-transformer';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { mergeToolEntriesTransformer } from '../../transformers/merge-tool-entries/merge-tool-entries-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';

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
          <ChatMessageWidget
            entry={lastPair.toolUse}
            isLoading={lastPair.toolResult === null}
            {...(lastPair.toolResult === null
              ? {}
              : { toolResult: lastPair.toolResult as ToolResultEntry })}
          />
        </Box>
      ) : null}

      {expanded ? (
        <Box style={{ paddingLeft: 12 }}>
          {(() => {
            let prevContext: ContextTokenCount | null = null;

            return pairs.map((item, index) => {
              if (item.kind === 'tool-pair') {
                const toolUseEntry = item.toolUse;

                // Compute context token delta for tool_use with usage
                const contextDelta = (() => {
                  if (!('usage' in toolUseEntry) || toolUseEntry.usage === undefined) return null;
                  const totalContext = contextTokenCountContract.parse(
                    Number(toolUseEntry.usage.inputTokens) +
                      Number(toolUseEntry.usage.cacheCreationInputTokens) +
                      Number(toolUseEntry.usage.cacheReadInputTokens),
                  );
                  const delta =
                    prevContext === null
                      ? totalContext
                      : contextTokenCountContract.parse(
                          Math.max(0, Number(totalContext) - Number(prevContext)),
                        );
                  prevContext = totalContext;
                  return Number(delta) > 0 ? delta : null;
                })();

                const tokenBadgeLabel =
                  contextDelta === null
                    ? undefined
                    : formattedTokenLabelContract.parse(
                        `${formatContextTokensTransformer({ count: contextDelta })} context`,
                      );

                // Compute estimated tokens for tool_result content
                const estimatedTokens = (() => {
                  if (item.toolResult === null) return null;
                  if (!('content' in item.toolResult)) return null;
                  if (typeof item.toolResult.content !== 'string') return null;
                  if (item.toolResult.content.length === 0) return null;
                  const estimated = estimateContentTokensTransformer({
                    content: item.toolResult.content,
                  });
                  return Number(estimated) > 0 ? estimated : null;
                })();

                const resultTokenBadgeLabel =
                  estimatedTokens === null
                    ? undefined
                    : formattedTokenLabelContract.parse(
                        `~${formatContextTokensTransformer({ count: estimatedTokens })} est`,
                      );

                return (
                  <ChatMessageWidget
                    key={index}
                    entry={toolUseEntry}
                    {...(item.toolResult === null
                      ? {}
                      : { toolResult: item.toolResult as ToolResultEntry })}
                    {...(tokenBadgeLabel === undefined ? {} : { tokenBadgeLabel })}
                    {...(resultTokenBadgeLabel === undefined ? {} : { resultTokenBadgeLabel })}
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
