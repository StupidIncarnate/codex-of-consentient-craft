/**
 * PURPOSE: Full-page quest chat layout with chat panel on the left and activity panel on the right
 *
 * USAGE:
 * <QuestChatWidget questId={questId} onBack={handleBack} />
 * // Renders full-page chat interface with logo, map frame, and split panels
 */

import { Box } from '@mantine/core';

import type { QuestId } from '@dungeonmaster/shared/contracts';
import { cssPixelsContract } from '@dungeonmaster/shared/contracts';

import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';

export interface QuestChatWidgetProps {
  questId: QuestId;
  onBack: () => void;
}

const zeroPadding = cssPixelsContract.parse(0);

export const QuestChatWidget = ({ questId }: QuestChatWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { entries, isStreaming, sendMessage } = useQuestChatBinding({ questId });

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

      <Box style={{ flex: 1, margin: '0 16px 16px 16px' }}>
        <MapFrameWidget padding={zeroPadding}>
          <Box
            data-testid="QUEST_CHAT_SPLIT"
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
            }}
          >
            <Box style={{ flex: 1 }}>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                color: colors['text-dim'],
              }}
            >
              Awaiting quest activity...
            </Box>
          </Box>
        </MapFrameWidget>
      </Box>
    </Box>
  );
};
