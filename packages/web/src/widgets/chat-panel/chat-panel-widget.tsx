/**
 * PURPOSE: Renders the full chat panel with scrollable message area, raccoon sprite, divider, and input area for sending messages
 *
 * USAGE:
 * <ChatPanelWidget entries={entries} isStreaming={isStreaming} onSendMessage={handleSend} />
 * // Renders chat message list with input textarea and send button
 */

import { clearInterval } from '#gateway/browser/clearInterval';
import { setInterval } from '#gateway/browser/setInterval';
import { Box } from '#gateway/npm/mantine__core';
import { useEffect, useRef, useState } from '#gateway/npm/react';

import type { ChatEntry, PastedImageUpload } from '@dungeonmaster/shared/contracts';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { raccoonWizardPixelsStatics } from '../../statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics';
import { raccoonAnimationIntervalTransformer } from '../../transformers/raccoon-animation-interval/raccoon-animation-interval-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';
import { ChatInputWidget } from '../chat-input/chat-input-widget';
import type { ComposerSurface } from '../../transformers/composer-scope-key/composer-scope-key-transformer';


export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: {
    message: string;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  onStopChat: () => void;
  readOnly?: boolean;
  // Overrides the assistant role label ChatMessageWidget defaults to ('chaoswhisperer'). Callers
  // mounting this panel for a different agent's own conversation — the FOLLOW-UP tab's
  // tavernkeeper thread — pass their role so the transcript names who is actually replying.
  roleLabel?: ExecutionRole;
  // Passed straight through to ChatInputWidget — which composer's draft this is. Omitted (the
  // widget's own 'main' default) by every call site except ExecutionPanelWidget's follow-up tab.
  // See composerScopeKeyTransformer for why: that composer and this quest's spec-phase composer
  // mount at the SAME URL and must not share a draft.
  surface?: ComposerSurface;
}

const RACCOON_SCALE = 8;
const BOUNCE_UP = raccoonAnimationConfigStatics.bounceOffsetPx;
const BOUNCE_REST = raccoonAnimationConfigStatics.bounceRestPx;

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

const CHAT_MESSAGES_AREA_TEST_ID = 'CHAT_MESSAGES_AREA';
const CHAT_INSET = 16;

export const ChatPanelWidget = ({
  entries,
  isStreaming,
  onSendMessage,
  onStopChat,
  readOnly = false,
  roleLabel,
  surface,
}: ChatPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [raccoonFlip, setRaccoonFlip] = useState(false);
  const bounceOffsetRef = useRef<number>(BOUNCE_REST);
  const [bounceOffset, setBounceOffset] = useState<number>(BOUNCE_REST);

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
          scale={RACCOON_SCALE as number}
          width={raccoonWizardPixelsStatics.dimensions.width as number}
          height={raccoonWizardPixelsStatics.dimensions.height as number}
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
            {...(surface === undefined ? {} : { surface })}
          />
        </>
      )}
    </Box>
  );
};
