/**
 * PURPOSE: Renders the full chat panel with scrollable message area, divider, and input area for sending messages
 *
 * USAGE:
 * <ChatPanelWidget entries={entries} isStreaming={isStreaming} onSendMessage={handleSend} />
 * // Renders chat message list with input textarea and send button
 */

import { ActionIcon, Box, Group, Text, Textarea } from '@mantine/core';
import { useState } from 'react';

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';

import type { UserInput } from '@dungeonmaster/shared/contracts';

export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
}

const SEND_BUTTON_SIZE = 44;

export const ChatPanelWidget = ({
  entries,
  isStreaming,
  onSendMessage,
}: ChatPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [inputValue, setInputValue] = useState('');

  return (
    <Box
      data-testid="CHAT_PANEL"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        data-testid="CHAT_MESSAGES_AREA"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {entries.map((entry, index) => (
          <ChatMessageWidget key={index} entry={entry} />
        ))}
      </Box>

      <Box style={{ height: 1, backgroundColor: colors.border, flexShrink: 0 }} />

      <Box style={{ padding: 12 }}>
        <Group gap={12} align="center" wrap="nowrap">
          <Textarea
            data-testid="CHAT_INPUT"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const trimmed = inputValue.trim();
                if (trimmed.length === 0) {
                  return;
                }
                onSendMessage({ message: trimmed as UserInput });
                setInputValue('');
              }
            }}
            placeholder="Describe your quest..."
            rows={3}
            disabled={isStreaming}
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: 12,
                color: colors.text,
                backgroundColor: colors['bg-deep'],
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                resize: 'none',
              },
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon
            data-testid="SEND_BUTTON"
            onClick={() => {
              const trimmed = inputValue.trim();
              if (trimmed.length === 0) {
                return;
              }
              onSendMessage({ message: trimmed as UserInput });
              setInputValue('');
            }}
            disabled={isStreaming}
            style={{
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              flexShrink: 0,
              backgroundColor: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              color: colors['bg-deep'],
              fontFamily: 'monospace',
              fontSize: 18,
            }}
          >
            {'\u25B6'}
          </ActionIcon>
        </Group>
        {isStreaming ? (
          <Text
            ff="monospace"
            size="xs"
            mt={4}
            data-testid="STREAMING_INDICATOR"
            style={{ color: colors['text-dim'] }}
          >
            Thinking...
          </Text>
        ) : null}
      </Box>
    </Box>
  );
};
