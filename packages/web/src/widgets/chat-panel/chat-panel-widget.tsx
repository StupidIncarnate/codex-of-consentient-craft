/**
 * PURPOSE: Renders the full chat panel with scrollable message area, raccoon sprite, divider, and input area for sending messages
 *
 * USAGE:
 * <ChatPanelWidget entries={entries} isStreaming={isStreaming} onSendMessage={handleSend} />
 * // Renders chat message list with input textarea and send button
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { bounceOffsetPxContract } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { BounceOffsetPx } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { raccoonWizardPixelsStatics } from '../../statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { groupChatEntriesTransformer } from '../../transformers/group-chat-entries/group-chat-entries-transformer';
import { raccoonAnimationIntervalTransformer } from '../../transformers/raccoon-animation-interval/raccoon-animation-interval-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';
import { ToolGroupWidget } from '../tool-group/tool-group-widget';

import type { UserInput } from '@dungeonmaster/shared/contracts';

export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
  onStopChat: () => void;
}

const SEND_BUTTON_SIZE = 44;
const RACCOON_SCALE = 8;
const BOUNCE_UP = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceOffsetPx);
const BOUNCE_REST = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceRestPx);

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

export const ChatPanelWidget = ({
  entries,
  isStreaming,
  onSendMessage,
  onStopChat,
}: ChatPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [inputValue, setInputValue] = useState('');
  const [raccoonFlip, setRaccoonFlip] = useState(false);
  const bounceOffsetRef = useRef<BounceOffsetPx>(BOUNCE_REST);
  const [bounceOffset, setBounceOffset] = useState<BounceOffsetPx>(BOUNCE_REST);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const interval = raccoonAnimationIntervalTransformer({ isStreaming, entries });
  const shouldBounce = isStreaming && entries.length > 0 && entries.at(-1)?.role === 'user';

  useEffect(() => {
    const timer = setInterval(() => {
      setRaccoonFlip((prev) => !prev);

      if (shouldBounce) {
        bounceOffsetRef.current = bounceOffsetRef.current === BOUNCE_REST ? BOUNCE_UP : BOUNCE_REST;
        setBounceOffset(bounceOffsetRef.current);
      } else {
        bounceOffsetRef.current = BOUNCE_REST;
        setBounceOffset(BOUNCE_REST);
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval, shouldBounce]);

  useEffect(() => {
    if (!userScrolledUp.current && messagesEndRef.current?.scrollIntoView !== undefined) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length]);

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
        data-testid="RACCOON_SPRITE"
        style={{
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          padding: 16,
          flexShrink: 0,
          transform: `translateY(${String(bounceOffset)}px)`,
          transition: 'transform 0.15s ease',
        }}
      >
        <PixelSpriteWidget
          pixels={raccoonPixels}
          scale={RACCOON_SCALE as PixelDimension}
          width={raccoonWizardPixelsStatics.dimensions.width as PixelDimension}
          height={raccoonWizardPixelsStatics.dimensions.height as PixelDimension}
          flip={raccoonFlip}
        />
      </Box>

      <Box
        ref={scrollContainerRef}
        data-testid="CHAT_MESSAGES_AREA"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        onScroll={(event) => {
          const target = event.currentTarget;
          const { scrollThresholdPx } = raccoonAnimationConfigStatics;
          userScrolledUp.current =
            target.scrollTop + target.clientHeight < target.scrollHeight - scrollThresholdPx;
        }}
      >
        {(() => {
          const groupedEntries = groupChatEntriesTransformer({ entries });
          let prevSessionContext: ContextTokenCount | null = null;
          let prevSubagentContext: ContextTokenCount | null = null;
          const elements: React.JSX.Element[] = [];

          for (let i = 0; i < groupedEntries.length; i++) {
            const group = groupedEntries[i];
            if (group === undefined) continue;

            if (group.kind === 'tool-group') {
              elements.push(
                <ToolGroupWidget
                  key={`group-${String(i)}`}
                  group={group}
                  isLastGroup={i === groupedEntries.length - 1}
                  isStreaming={isStreaming}
                />,
              );
            } else {
              const { entry } = group;

              elements.push(
                <ChatMessageWidget
                  key={`single-${String(i)}`}
                  entry={entry}
                  isStreaming={isStreaming}
                />,
              );

              if (
                entry.role === 'assistant' &&
                'type' in entry &&
                entry.type === 'text' &&
                'usage' in entry &&
                entry.usage !== undefined &&
                !isStreaming
              ) {
                const entrySource =
                  'source' in entry && entry.source === 'subagent' ? 'subagent' : 'session';
                const totalContext = contextTokenCountContract.parse(
                  Number(entry.usage.inputTokens) +
                    Number(entry.usage.cacheCreationInputTokens) +
                    Number(entry.usage.cacheReadInputTokens),
                );

                const prevContext =
                  entrySource === 'subagent' ? prevSubagentContext : prevSessionContext;
                const delta =
                  prevContext === null
                    ? null
                    : contextTokenCountContract.parse(Number(totalContext) - Number(prevContext));

                elements.push(
                  <ContextDividerWidget
                    key={`divider-${String(i)}`}
                    contextTokens={totalContext}
                    delta={delta}
                    source={entrySource}
                  />,
                );

                if (entrySource === 'subagent') {
                  prevSubagentContext = totalContext;
                } else {
                  prevSessionContext = totalContext;
                }
              }
            }
          }

          return elements;
        })()}

        <div ref={messagesEndRef} />
      </Box>

      <Box style={{ height: 1, backgroundColor: colors.border, flexShrink: 0 }} />

      <Box style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <textarea
            data-testid="CHAT_INPUT"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.currentTarget.value);
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
    </Box>
  );
};
