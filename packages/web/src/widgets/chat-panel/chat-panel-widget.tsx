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
import { raccoonAnimationIntervalTransformer } from '../../transformers/raccoon-animation-interval/raccoon-animation-interval-transformer';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';

import type { UserInput } from '@dungeonmaster/shared/contracts';

export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
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
        <Box
          data-testid="RACCOON_SPRITE"
          style={{
            display: 'flex',
            justifyContent: 'center',
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

        {entries.map((entry, index) => {
          const nextEntry = entries[index + 1];
          const isToolLoading =
            entry.role === 'assistant' &&
            entry.type === 'tool_use' &&
            (index === entries.length - 1 ||
              (nextEntry !== undefined &&
                nextEntry.role === 'assistant' &&
                nextEntry.type !== 'tool_result'));

          return <ChatMessageWidget key={index} entry={entry} isLoading={isToolLoading} />;
        })}

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
          <UnstyledButton
            data-testid="SEND_BUTTON"
            onClick={() => {
              const trimmed = inputValue.trim();
              if (trimmed.length === 0) return;
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
