/**
 * PURPOSE: Chat textarea with send/stop buttons, persists draft text to localStorage across tab close/reopen
 *
 * USAGE:
 * <ChatInputWidget isStreaming={isStreaming} onSendMessage={handleSend} onStopChat={handleStop} />
 * // Renders textarea with send or stop button, restores draft on mount
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';

import type { UserInput } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const SEND_BUTTON_SIZE = 44;
const DRAFT_STORAGE_KEY = 'dungeonmaster-chat-draft';

export interface ChatInputWidgetProps {
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
  onStopChat: () => void;
}

export const ChatInputWidget = ({
  isStreaming,
  onSendMessage,
  onStopChat,
}: ChatInputWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [inputValue, setInputValue] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  return (
    <Box style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <textarea
          data-testid="CHAT_INPUT"
          value={inputValue}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setInputValue(value);
            try {
              if (value.length > 0) {
                localStorage.setItem(DRAFT_STORAGE_KEY, value);
              } else {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
              }
            } catch {
              // localStorage unavailable
            }
          }}
          onInput={(event) => {
            const target = event.currentTarget;
            target.style.height = 'auto';
            target.style.height = `${String(target.scrollHeight)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              const trimmed = inputValue.trim();
              if (trimmed.length === 0) return;
              onSendMessage({ message: trimmed as UserInput });
              setInputValue('');
              try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
              } catch {
                // localStorage unavailable
              }
            }
          }}
          placeholder="Describe your quest..."
          rows={3}
          disabled={isStreaming}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 12,
            color: colors.text,
            backgroundColor: colors['bg-deep'],
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
            padding: 8,
            resize: 'none',
            overflow: 'hidden',
            lineHeight: 1.4,
            outline: 'none',
          }}
        />
        {isStreaming ? (
          <UnstyledButton
            data-testid="STOP_BUTTON"
            onClick={() => {
              onStopChat();
            }}
            style={{
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              flexShrink: 0,
              backgroundColor: colors.danger,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text,
              fontFamily: 'monospace',
              fontSize: 16,
            }}
          >
            {'\u25A0'}
          </UnstyledButton>
        ) : (
          <UnstyledButton
            data-testid="SEND_BUTTON"
            onClick={() => {
              const trimmed = inputValue.trim();
              if (trimmed.length === 0) return;
              onSendMessage({ message: trimmed as UserInput });
              setInputValue('');
              try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
              } catch {
                // localStorage unavailable
              }
            }}
            style={{
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              flexShrink: 0,
              backgroundColor: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors['bg-deep'],
              fontFamily: 'monospace',
              fontSize: 18,
            }}
          >
            {'\u25B6'}
          </UnstyledButton>
        )}
      </div>
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
  );
};
