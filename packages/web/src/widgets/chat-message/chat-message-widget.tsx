/**
 * PURPOSE: Renders a single chat entry with role-based styling for user, assistant, tool use, and tool result messages
 *
 * USAGE:
 * <ChatMessageWidget entry={chatEntry} />
 * // Renders styled chat bubble with role label and content
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { shouldTruncateContentGuard } from '../../guards/should-truncate-content/should-truncate-content-guard';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';
import { truncateContentTransformer } from '../../transformers/truncate-content/truncate-content-transformer';
import { InjectedPromptLayerWidget } from './injected-prompt-layer-widget';
import { ThinkingLayerWidget } from './thinking-layer-widget';
import { ToolUseLayerWidget } from './tool-use-layer-widget';

export interface ChatMessageWidgetProps {
  entry: ChatEntry;
  isLoading?: boolean;
  tokenBadgeLabel?: FormattedTokenLabel;
}

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export const ChatMessageWidget = ({
  entry,
  isLoading,
  tokenBadgeLabel,
}: ChatMessageWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = 'source' in entry && entry.source === 'subagent';
  const [expanded, setExpanded] = useState(false);

  const tokenBadgeElement =
    tokenBadgeLabel === undefined ? null : (
      <Text
        ff="monospace"
        data-testid="TOKEN_BADGE"
        style={{ color: colors['text-dim'], fontSize: 10 }}
      >
        {tokenBadgeLabel}
      </Text>
    );

  // Task notification - MUST come BEFORE system error check
  if (entry.role === 'system' && entry.type === 'task_notification') {
    const formattedTokens =
      entry.totalTokens === undefined
        ? null
        : formatContextTokensTransformer({
            count: contextTokenCountContract.parse(Number(entry.totalTokens)),
          });

    const needsTruncation = entry.result
      ? shouldTruncateContentGuard({ content: entry.result })
      : false;

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors['loot-rare']}`,
          borderRight: `${BORDER_WIDTH} ${colors['loot-rare']}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors['loot-rare'] }}
        >
          TASK REPORT
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.status}: {entry.summary ?? entry.taskId}
        </Text>
        {(() => {
          const stats = [
            ...(entry.toolUses === undefined ? [] : [`${entry.toolUses} tool calls`]),
            ...(formattedTokens ? [`${formattedTokens} tokens`] : []),
            ...(entry.durationMs === undefined
              ? []
              : [
                  `${(Number(entry.durationMs) / contentTruncationConfigStatics.msDivisor).toFixed(1)}s`,
                ]),
          ];

          return stats.length > 0 ? (
            <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
              {stats.join(' | ')}
            </Text>
          ) : null;
        })()}
        {entry.result ? (
          <Box mt={4}>
            <Text
              ff="monospace"
              size="xs"
              style={{
                color: colors['text-dim'],
                whiteSpace: 'pre-wrap',
                ...(needsTruncation && !expanded
                  ? {
                      maskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
                      WebkitMaskImage: `linear-gradient(to bottom, black calc(100% - 30px), transparent)`,
                    }
                  : {}),
                ...(expanded ? { maxHeight: 300, overflowY: 'auto' as const } : {}),
              }}
            >
              {needsTruncation && !expanded
                ? truncateContentTransformer({ content: entry.result })
                : entry.result}
            </Text>
            {needsTruncation ? (
              <Text
                ff="monospace"
                size="xs"
                style={{ color: colors.primary, cursor: 'pointer' }}
                onClick={() => {
                  setExpanded(!expanded);
                }}
              >
                {expanded ? 'Collapse' : 'Show full result'}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>
    );
  }

  if (entry.role === 'system') {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors.danger}`,
          borderRight: `${BORDER_WIDTH} ${colors.danger}`,
          textAlign: 'center',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors.danger }}
        >
          ERROR
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.danger }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.role === 'user') {
    const userBorderColor = isSubagent ? colors['loot-rare'] : colors['loot-gold'];
    const userLabel = isSubagent ? 'SUB-AGENT PROMPT' : 'YOU';
    const isInjected = 'isInjectedPrompt' in entry && entry.isInjectedPrompt === true;

    if (isInjected) {
      return (
        <InjectedPromptLayerWidget entry={entry} borderColor={userBorderColor} label={userLabel} />
      );
    }

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: colors['bg-raised'],
          borderLeft: `${BORDER_WIDTH} ${userBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${userBorderColor}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: userBorderColor }}
        >
          {userLabel}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.type === 'thinking') {
    return <ThinkingLayerWidget entry={entry} />;
  }

  if (entry.type === 'text') {
    const textBorderColor = isSubagent ? colors['loot-rare'] : colors.primary;
    const textLabel = isSubagent ? 'SUB-AGENT' : 'CHAOSWHISPERER';

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${textBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${textBorderColor}`,
          textAlign: 'left',
          paddingLeft: '15%',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: textBorderColor }}
        >
          {textLabel}
          {'model' in entry && entry.model ? (
            <Text component="span" style={{ color: colors['text-dim'] }}>
              {' '}
              {entry.model}
            </Text>
          ) : null}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>
        {tokenBadgeElement}
      </Box>
    );
  }

  if (entry.type === 'tool_use') {
    return (
      <ToolUseLayerWidget
        entry={entry}
        {...(isLoading === undefined ? {} : { isLoading })}
        tokenBadgeElement={tokenBadgeElement}
        isSubagent={isSubagent}
      />
    );
  }

  // tool_result branch - detection priority order
  const isSkipped = entry.content.includes('Sibling tool call errored');
  const isHookBlocked =
    entry.isError === true &&
    (entry.content.startsWith('PreToolUse:') || entry.content.startsWith('PostToolUse:'));
  const isToolError = entry.isError === true;

  // Sibling tool call errored - full visual rendering (Improvement 9)
  if (isSkipped) {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors.warning}`,
          borderRight: `${BORDER_WIDTH} ${colors.warning}`,
          textAlign: 'left',
          paddingLeft: '15%',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors.warning }}
        >
          SKIPPED
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.warning }}>
          This tool call was skipped because another tool call in the same batch failed.
        </Text>
      </Box>
    );
  }

  const toolResultLabel = isHookBlocked
    ? 'HOOK BLOCKED'
    : isToolError
      ? 'TOOL ERROR'
      : 'TOOL RESULT';
  const toolResultColor = isHookBlocked || isToolError ? colors.danger : colors['text-dim'];

  // Tool result truncation (Improvement 6)
  const contentString = `${entry.toolName}: ${entry.content}`;
  const needsToolResultTruncation = shouldTruncateContentGuard({ content: contentString });

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${toolResultColor}`,
        borderRight: `${BORDER_WIDTH} ${toolResultColor}`,
        textAlign: 'left',
        paddingLeft: '15%',
      }}
    >
      <Text
        ff="monospace"
        size="xs"
        fw={LABEL_FONT_WEIGHT}
        mb={2}
        style={{ color: toolResultColor }}
      >
        {toolResultLabel}
      </Text>
      {tokenBadgeElement}
      {needsToolResultTruncation && !expanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: toolResultColor,
              whiteSpace: 'pre-wrap',
              maskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
              WebkitMaskImage: `linear-gradient(to bottom, ${toolResultColor} calc(100% - 30px), transparent)`,
            }}
          >
            {truncateContentTransformer({ content: contentString })}
          </Text>
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setExpanded(true);
            }}
          >
            Show full result
          </Text>
        </Box>
      ) : needsToolResultTruncation && expanded ? (
        <Box>
          <Text
            ff="monospace"
            size="xs"
            style={{
              color: toolResultColor,
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {contentString}
          </Text>
          <Text
            ff="monospace"
            size="xs"
            style={{ color: colors.primary, cursor: 'pointer' }}
            onClick={() => {
              setExpanded(false);
            }}
          >
            Collapse
          </Text>
        </Box>
      ) : (
        <Text ff="monospace" size="xs" style={{ color: toolResultColor, whiteSpace: 'pre-wrap' }}>
          {entry.toolName}: {entry.content}
        </Text>
      )}
    </Box>
  );
};
