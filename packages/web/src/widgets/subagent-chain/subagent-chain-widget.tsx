/**
 * PURPOSE: Renders a collapsible sub-agent chain with header showing description and entry count
 *
 * USAGE:
 * <SubagentChainWidget group={subagentChainGroup} isStreaming={false} />
 * // Renders collapsed chain header, expands to show inner tool groups and messages
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { formattedTokenLabelContract } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { estimateContentTokensTransformer } from '../../transformers/estimate-content-tokens/estimate-content-tokens-transformer';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';

export interface SubagentChainWidgetProps {
  group: ChatEntryGroup;
  isStreaming: boolean;
}

export const SubagentChainWidget = ({
  group,
  isStreaming,
}: SubagentChainWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [expanded, setExpanded] = useState(false);

  if (group.kind !== 'subagent-chain') return null;

  const chevron = expanded ? '\u25BE' : '\u25B8';

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
    <Box>
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
          }}
        >
          {chevron} SUB-AGENT
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          &quot;{group.description}&quot; ({entrySuffix})
        </Text>
      </Box>

      {expanded ? (
        <Box style={{ paddingLeft: 12 }}>
          {(() => {
            let prevContext: ContextTokenCount | null = null;

            return group.innerGroups.map((innerGroup, index) => {
              if (innerGroup.kind !== 'single') return null;

              const { entry } = innerGroup;

              if ('usage' in entry && entry.usage !== undefined) {
                const totalContext = contextTokenCountContract.parse(
                  Number(entry.usage.inputTokens) +
                    Number(entry.usage.cacheCreationInputTokens) +
                    Number(entry.usage.cacheReadInputTokens),
                );
                const delta =
                  prevContext === null
                    ? totalContext
                    : contextTokenCountContract.parse(
                        Math.max(0, Number(totalContext) - Number(prevContext)),
                      );
                prevContext = totalContext;

                if (Number(delta) === 0) {
                  return (
                    <ChatMessageWidget
                      key={`inner-${String(index)}`}
                      entry={entry}
                      isStreaming={isStreaming}
                    />
                  );
                }

                const tokenBadgeLabel = formattedTokenLabelContract.parse(
                  `${formatContextTokensTransformer({ count: delta })} context`,
                );

                return (
                  <ChatMessageWidget
                    key={`inner-${String(index)}`}
                    entry={entry}
                    isStreaming={isStreaming}
                    tokenBadgeLabel={tokenBadgeLabel}
                  />
                );
              }

              if (
                'type' in entry &&
                entry.type === 'tool_result' &&
                'content' in entry &&
                typeof entry.content === 'string' &&
                entry.content.length > 0
              ) {
                const estimated = estimateContentTokensTransformer({ content: entry.content });
                if (Number(estimated) > 0) {
                  const tokenBadgeLabel = formattedTokenLabelContract.parse(
                    `~${formatContextTokensTransformer({ count: estimated })} est`,
                  );

                  return (
                    <ChatMessageWidget
                      key={`inner-${String(index)}`}
                      entry={entry}
                      isStreaming={isStreaming}
                      tokenBadgeLabel={tokenBadgeLabel}
                    />
                  );
                }
              }

              return (
                <ChatMessageWidget
                  key={`inner-${String(index)}`}
                  entry={entry}
                  isStreaming={isStreaming}
                />
              );
            });
          })()}
          {group.taskNotification === null ? null : (
            <ChatMessageWidget entry={group.taskNotification} isStreaming={isStreaming} />
          )}
        </Box>
      ) : null}
    </Box>
  );
};
