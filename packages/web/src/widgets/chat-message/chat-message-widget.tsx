/**
 * PURPOSE: Renders a single chat entry with role-based styling for user, assistant, tool use, and tool result messages
 *
 * USAGE:
 * <ChatMessageWidget entry={chatEntry} />
 * // Renders styled chat bubble with role label and content
 */

import { Box, Text } from '@mantine/core';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { formatContextTokensTransformer } from '../../transformers/format-context-tokens/format-context-tokens-transformer';

export interface ChatMessageWidgetProps {
  entry: ChatEntry;
  isLoading?: boolean;
  isStreaming?: boolean;
}

const BORDER_WIDTH = '2px solid';
const LABEL_FONT_WEIGHT = 600;

export const ChatMessageWidget = ({
  entry,
  isLoading,
  isStreaming,
}: ChatMessageWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSubagent = 'source' in entry && entry.source === 'subagent';

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
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: colors['bg-raised'],
          borderLeft: `${BORDER_WIDTH} ${colors['loot-gold']}`,
          borderRight: `${BORDER_WIDTH} ${colors['loot-gold']}`,
          textAlign: 'left',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: colors['loot-gold'] }}
        >
          YOU
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>
      </Box>
    );
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
          textAlign: 'right',
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
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.content}
        </Text>
        {entry.usage && !isStreaming ? (
          <Text
            ff="monospace"
            data-testid="TOKEN_BADGE"
            style={{ color: colors['text-dim'], fontSize: 10 }}
          >
            {formatContextTokensTransformer({
              count: contextTokenCountContract.parse(
                Number(entry.usage.inputTokens) +
                  Number(entry.usage.cacheCreationInputTokens) +
                  Number(entry.usage.cacheReadInputTokens),
              ),
            })}{' '}
            context ({entry.usage.outputTokens} out)
          </Text>
        ) : null}
      </Box>
    );
  }

  if (entry.type === 'tool_use') {
    const toolUseBorderColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];
    const toolUseLabel = isSubagent ? 'SUB-AGENT TOOL' : 'TOOL CALL';
    const toolUseLabelColor = isSubagent ? `${colors['loot-rare']}80` : colors['text-dim'];

    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${toolUseBorderColor}`,
          borderRight: `${BORDER_WIDTH} ${toolUseBorderColor}`,
          textAlign: 'right',
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          fw={LABEL_FONT_WEIGHT}
          mb={2}
          style={{ color: toolUseLabelColor }}
        >
          {toolUseLabel}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], fontStyle: 'italic' }}>
          {entry.toolName}: {entry.toolInput}
        </Text>
        {isLoading ? (
          <Text
            ff="monospace"
            size="xs"
            mt={4}
            data-testid="TOOL_LOADING"
            style={{ color: colors.primary, animation: 'pulse 1.5s infinite' }}
          >
            Running...
          </Text>
        ) : null}
      </Box>
    );
  }

  // tool_result branch - detection priority order
  const isSkipped = entry.content.includes('Sibling tool call errored');
  const isHookBlocked =
    entry.isError === true &&
    (entry.content.startsWith('PreToolUse:') || entry.content.startsWith('PostToolUse:'));
  const isToolError = entry.isError === true;

  const toolResultLabel = isSkipped
    ? 'SKIPPED'
    : isHookBlocked
      ? 'HOOK BLOCKED'
      : isToolError
        ? 'TOOL ERROR'
        : 'TOOL RESULT';
  const toolResultColor = isSkipped
    ? colors.warning
    : isHookBlocked || isToolError
      ? colors.danger
      : colors['text-dim'];

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${toolResultColor}`,
        borderRight: `${BORDER_WIDTH} ${toolResultColor}`,
        textAlign: 'right',
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
      <Text ff="monospace" size="xs" style={{ color: toolResultColor, whiteSpace: 'pre-wrap' }}>
        {entry.toolName}: {entry.content}
      </Text>
    </Box>
  );
};
