/**
 * PURPOSE: Full-page quest chat layout with chat panel on the left and activity panel on the right
 *
 * USAGE:
 * <QuestChatWidget questId={questId} onBack={handleBack} />
 * // Renders full-page chat interface with logo, map frame, and split panels
 */

import { Box, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { QuestId } from '@dungeonmaster/shared/contracts';
import { cssPixelsContract } from '@dungeonmaster/shared/contracts';

import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { mapFrameStatics } from '../../statics/map-frame/map-frame-statics';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';

export interface QuestChatWidgetProps {
  questId: QuestId;
  onBack: () => void;
}

const zeroPadding = cssPixelsContract.parse(0);
const unrestrictedMaxWidth = cssPixelsContract.parse(mapFrameStatics.unrestrictedMaxWidth);

const collapsedMaxWidth = mapFrameStatics.defaultMaxWidth;

export const QuestChatWidget = ({ questId }: QuestChatWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { entries, isStreaming, sendMessage } = useQuestChatBinding({ questId });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box
      data-testid="QUEST_CHAT"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        paddingTop: 40,
      }}
    >
      <Box py="sm">
        <LogoWidget />
      </Box>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          margin: '0 16px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: mounted ? undefined : collapsedMaxWidth,
          alignSelf: mounted ? undefined : 'center',
          width: '100%',
          transition: 'max-width 0.4s ease-out',
        }}
      >
        <MapFrameWidget
          padding={zeroPadding}
          maxWidth={unrestrictedMaxWidth}
          minHeight={zeroPadding}
        >
          <Box
            data-testid="QUEST_CHAT_SPLIT"
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              minHeight: 0,
            }}
          >
            <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ChatPanelWidget
                entries={entries}
                isStreaming={isStreaming}
                onSendMessage={sendMessage}
              />
            </Box>

            <div
              data-testid="QUEST_CHAT_DIVIDER"
              style={{
                width: 1,
                backgroundColor: colors.border,
                alignSelf: 'stretch',
              }}
            />

            <Box
              data-testid="QUEST_CHAT_ACTIVITY"
              style={{
                flex: 1,
                padding: 16,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
              }}
            >
              <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
                Awaiting quest activity...
              </Text>
            </Box>
          </Box>
        </MapFrameWidget>
      </Box>
    </Box>
  );
};
