/**
 * PURPOSE: Renders the full chat panel with scrollable message area, raccoon sprite, divider, and input area for sending messages
 *
 * USAGE:
 * <ChatPanelWidget entries={entries} isStreaming={isStreaming} onSendMessage={handleSend} />
 * // Renders chat message list with input textarea and send button
 */

import { Box, Group } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { bounceOffsetPxContract } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { BounceOffsetPx } from '../../contracts/bounce-offset-px/bounce-offset-px-contract';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { raccoonWizardPixelsStatics } from '../../statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics';
import { mergedChatItemContract } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import { collectSubagentChainsTransformer } from '../../transformers/collect-subagent-chains/collect-subagent-chains-transformer';
import { computeTokenAnnotationsTransformer } from '../../transformers/compute-token-annotations/compute-token-annotations-transformer';
import { raccoonAnimationIntervalTransformer } from '../../transformers/raccoon-animation-interval/raccoon-animation-interval-transformer';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { ChatMessageWidget } from '../chat-message/chat-message-widget';
import { ContextDividerWidget } from '../context-divider/context-divider-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';
import { ChatInputWidget } from '../chat-input/chat-input-widget';
import { SubagentChainWidget } from '../subagent-chain/subagent-chain-widget';
import { ToolGroupWidget } from '../tool-group/tool-group-widget';

import type { UserInput } from '@dungeonmaster/shared/contracts';

export interface ChatPanelWidgetProps {
  entries: ChatEntry[];
  isStreaming: boolean;
  onSendMessage: (params: { message: UserInput }) => void;
  onStopChat: () => void;
  onAbandon?: () => void;
}

const RACCOON_SCALE = 8;
const BOUNCE_UP = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceOffsetPx);
const BOUNCE_REST = bounceOffsetPxContract.parse(raccoonAnimationConfigStatics.bounceRestPx);
const ABANDON_LABEL = 'ABANDON QUEST' as ButtonLabel;
const CONFIRM_ABANDON_LABEL = 'CONFIRM ABANDON' as ButtonLabel;
const CANCEL_LABEL = 'CANCEL' as ButtonLabel;
const DANGER_VARIANT = 'danger' as ButtonVariant;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const ABANDON_BAR_PADDING = 12;

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

const CHAT_MESSAGES_AREA_TEST_ID = testIdContract.parse('CHAT_MESSAGES_AREA');

export const ChatPanelWidget = ({
  entries,
  isStreaming,
  onSendMessage,
  onStopChat,
  onAbandon,
}: ChatPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [raccoonFlip, setRaccoonFlip] = useState(false);
  const bounceOffsetRef = useRef<BounceOffsetPx>(BOUNCE_REST);
  const [bounceOffset, setBounceOffset] = useState<BounceOffsetPx>(BOUNCE_REST);
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);

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

      <AutoScrollContainerWidget
        testId={CHAT_MESSAGES_AREA_TEST_ID}
        style={{ flex: 1, padding: 16 }}
        contentStyle={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {(() => {
          const groupedEntries = collectSubagentChainsTransformer({ entries });

          const singleItems = groupedEntries
            .filter((g) => g.kind === 'single')
            .map((g) => mergedChatItemContract.parse({ kind: 'entry', entry: g.entry }));
          const singleAnnotations = computeTokenAnnotationsTransformer({ items: singleItems });

          let singleIndex = 0;
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
            } else if (group.kind === 'subagent-chain') {
              elements.push(<SubagentChainWidget key={`chain-${String(i)}`} group={group} />);
            } else {
              const { entry } = group;
              const annotation = singleAnnotations[singleIndex];
              singleIndex += 1;

              if (
                annotation?.cumulativeContext !== null &&
                annotation?.cumulativeContext !== undefined
              ) {
                elements.push(
                  <ChatMessageWidget
                    key={`single-${String(i)}`}
                    entry={entry}
                    {...(annotation.tokenBadgeLabel === null
                      ? {}
                      : { tokenBadgeLabel: annotation.tokenBadgeLabel })}
                  />,
                );

                elements.push(
                  <ContextDividerWidget
                    key={`divider-${String(i)}`}
                    contextTokens={annotation.cumulativeContext}
                    delta={annotation.contextDelta}
                    source={annotation.source}
                  />,
                );
              } else {
                elements.push(<ChatMessageWidget key={`single-${String(i)}`} entry={entry} />);
              }
            }
          }

          return elements;
        })()}
      </AutoScrollContainerWidget>

      <Box style={{ height: 1, backgroundColor: colors.border, flexShrink: 0 }} />

      {onAbandon && (
        <Box
          data-testid="chat-panel-action-bar"
          style={{
            padding: ABANDON_BAR_PADDING,
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <Group gap="xs">
            {confirmingAbandon ? (
              <>
                <PixelBtnWidget
                  label={CONFIRM_ABANDON_LABEL}
                  variant={DANGER_VARIANT}
                  onClick={() => {
                    setConfirmingAbandon(false);
                    onAbandon();
                  }}
                />
                <PixelBtnWidget
                  label={CANCEL_LABEL}
                  variant={GHOST_VARIANT}
                  onClick={() => {
                    setConfirmingAbandon(false);
                  }}
                />
              </>
            ) : (
              <PixelBtnWidget
                label={ABANDON_LABEL}
                variant={GHOST_VARIANT}
                onClick={() => {
                  setConfirmingAbandon(true);
                }}
              />
            )}
          </Group>
        </Box>
      )}

      <ChatInputWidget
        isStreaming={isStreaming}
        onSendMessage={onSendMessage}
        onStopChat={onStopChat}
      />
    </Box>
  );
};
