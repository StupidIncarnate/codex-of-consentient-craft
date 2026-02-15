/**
 * PURPOSE: Quest chat content with split panels for chat and activity, rendered inside the shared app layout
 *
 * USAGE:
 * <QuestChatWidget />
 * // Renders split panel chat interface, reads questId from URL params
 */

import { Box, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const { colors } = emberDepthsThemeStatics;
  const { entries, isStreaming, sendMessage, stopChat } = useQuestChatBinding({
    questId: params.questId as QuestId,
  });

  return (
    <Box
      data-testid="QUEST_CHAT"
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
          onStopChat={stopChat}
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
        }}
      >
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          Awaiting quest activity...
        </Text>
      </Box>
    </Box>
  );
};
