/**
 * PURPOSE: Renders the full chat panel with scrollable message area, raccoon sprite, divider, and input area for sending messages
 *
 * USAGE:
 * <ChatPanelWidget entries={entries} isStreaming={isStreaming} onSendMessage={handleSend} />
 * // Renders chat message list with input textarea and send button
 */

import { Box } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { bounceOffsetPxContract } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { BounceOffsetPx } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { raccoonWizardPixelsStatics } from '../../statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics';
import { raccoonAnimationIntervalTransformer } from '../../transformers/raccoon-animation-interval/raccoon-animation-interval-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';
import { ChatInputWidget } from '../chat-input/chat-input-widget';

import type { UserInput } from '@dungeonmaster/shared/contracts';

export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
  onStopChat: () => void;
  readOnly?: boolean;
  // Overrides the assistant role label ChatMessageWidget defaults to ('chaoswhisperer'). Callers
  // mounting this panel for a different agent's own conversation — the FOLLOW-UP tab's
  // tavernkeeper thread — pass their role so the transcript names who is actually replying.
  roleLabel?: ExecutionRole;
}

const RACCOON_SCALE = 8;
const BOUNCE_UP = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceOffsetPx);
const BOUNCE_REST = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceRestPx);

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

const CHAT_MESSAGES_AREA_TEST_ID = testIdContract.parse('CHAT_MESSAGES_AREA');
const CHAT_INSET = 16;

export const ChatPanelWidget = ({
  entries,
  isStreaming,
  onSendMessage,
  onStopChat,
  readOnly = false,
  roleLabel,
}: ChatPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [raccoonFlip, setRaccoonFlip] = useState(false);
  const bounceOffsetRef = useRef<BounceOffsetPx>(BOUNCE_REST);
  const [bounceOffset, setBounceOffset] = useState<BounceOffsetPx>(BOUNCE_REST);

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

      {/* The top inset rides on the CONTENT, not on the scrollport. Sticky children — a sub-agent
          chain's header, a tool row's — pin to the scrollport's content edge, so a `padding-top`
          here would hold every pinned header that far down while the transcript kept scrolling
          through the strip above it. On the content it scrolls away with the first message
          instead, which is what the reader expects it to do. */}
      <AutoScrollContainerWidget
        testId={CHAT_MESSAGES_AREA_TEST_ID}
        style={{ flex: 1, padding: `0 ${String(CHAT_INSET)}px ${String(CHAT_INSET)}px` }}
        contentStyle={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingTop: CHAT_INSET,
        }}
      >
        <ChatEntryListWidget
          entries={entries}
          isStreaming={isStreaming}
          showContextDividers={true}
          showEndStreamingIndicator={true}
          {...(roleLabel === undefined ? {} : { roleLabel })}
        />
      </AutoScrollContainerWidget>

      {readOnly ? null : (
        <>
          <Box style={{ height: 1, backgroundColor: colors.border, flexShrink: 0 }} />

          <ChatInputWidget
            isStreaming={isStreaming}
            onSendMessage={onSendMessage}
            onStopChat={onStopChat}
          />
        </>
      )}
    </Box>
  );
};
