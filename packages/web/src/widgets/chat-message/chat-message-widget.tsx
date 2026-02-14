/**
 * PURPOSE: Renders a single chat entry with role-based styling for user, assistant, tool use, and tool result messages
 *
 * USAGE:
 * <ChatMessageWidget entry={chatEntry} />
 * // Renders styled chat bubble with role label and content
 */

import { Box, Group, Text } from '@mantine/core';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ChatMessageWidgetProps {
  entry: ChatEntry;
}

const BORDER_WIDTH = '2px solid';

export const ChatMessageWidget = ({ entry }: ChatMessageWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

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
        }}
      >
        <Text ff="monospace" size="xs" fw={600} mb={2} style={{ color: colors['loot-gold'] }}>
          YOU
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.type === 'text') {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors.primary}`,
          borderRight: `${BORDER_WIDTH} ${colors.primary}`,
        }}
      >
        <Group gap={8}>
          <Text ff="monospace" size="xs" fw={600} mb={2} style={{ color: colors.primary }}>
            CHAOSWHISPERER
          </Text>
          {entry.usage ? (
            <Text
              ff="monospace"
              size="xs"
              data-testid="TOKEN_BADGE"
              style={{ color: colors['text-dim'] }}
            >
              {entry.usage.inputTokens}/{entry.usage.outputTokens} tokens
            </Text>
          ) : null}
        </Group>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {entry.content}
        </Text>
      </Box>
    );
  }

  if (entry.type === 'tool_use') {
    return (
      <Box
        data-testid="CHAT_MESSAGE"
        style={{
          padding: '6px 10px',
          borderRadius: 2,
          backgroundColor: 'transparent',
          borderLeft: `${BORDER_WIDTH} ${colors['text-dim']}`,
          borderRight: `${BORDER_WIDTH} ${colors['text-dim']}`,
        }}
      >
        <Text ff="monospace" size="xs" fw={600} mb={2} style={{ color: colors['text-dim'] }}>
          TOOL CALL
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], fontStyle: 'italic' }}>
          {entry.toolName}: {entry.toolInput}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      data-testid="CHAT_MESSAGE"
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: 'transparent',
        borderLeft: `${BORDER_WIDTH} ${colors['text-dim']}`,
        borderRight: `${BORDER_WIDTH} ${colors['text-dim']}`,
      }}
    >
      <Text ff="monospace" size="xs" fw={600} mb={2} style={{ color: colors['text-dim'] }}>
        TOOL RESULT
      </Text>
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
        {entry.toolName}: {entry.content}
      </Text>
    </Box>
  );
};
