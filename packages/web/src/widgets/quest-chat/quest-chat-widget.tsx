/**
 * PURPOSE: Quest chat content with split panels for chat and activity, rendered inside the shared app layout
 *
 * USAGE:
 * <QuestChatWidget />
 * // Renders split panel chat interface, reads guildSlug and optional questSlug from URL params
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { ChatSession, QuestId } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { useGuildDetailBinding } from '../../bindings/use-guild-detail/use-guild-detail-binding';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const navigate = useNavigate();
  const { guildSlug } = params;
  const questSlug = params.questSlug as QuestId | undefined;
  const { colors } = emberDepthsThemeStatics;
  const prevIsStreamingRef = useRef(false);

  const { guilds } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const resolvedGuildId = matchedGuild?.id ?? null;

  const { data: questData, refresh: refreshQuest } = useQuestDetailBinding({
    questId: questSlug ?? null,
  });

  const { data: guildData, refresh: refreshGuild } = useGuildDetailBinding({
    guildId: questSlug ? null : resolvedGuildId,
  });

  const chatSessions: ChatSession[] = questSlug
    ? (questData?.chatSessions ?? [])
    : (guildData?.chatSessions ?? []);

  const { entries, isStreaming, sendMessage, stopChat } = useQuestChatBinding({
    ...(questSlug ? { questId: questSlug } : {}),
    ...(resolvedGuildId && !questSlug ? { guildId: resolvedGuildId } : {}),
    chatSessions,
  });

  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      if (questSlug) {
        refreshQuest().catch(() => undefined);
      } else {
        refreshGuild().catch(() => undefined);
      }
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, questSlug, refreshQuest, refreshGuild]);

  useEffect(() => {
    if (!resolvedGuildId) return undefined;

    const ws = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;

        if (parsed.data.type === 'quest-created') {
          const { payload } = parsed.data;
          const eventGuildId: unknown = Reflect.get(payload, 'guildId');
          const eventQuestSlug: unknown = Reflect.get(payload, 'questSlug');

          if (eventGuildId === resolvedGuildId && typeof eventQuestSlug === 'string') {
            const result = navigate(`/${guildSlug}/quest/${eventQuestSlug}`, { replace: true });
            if (result instanceof Promise) {
              result.catch(() => undefined);
            }
          }
        }
      },
    });

    return (): void => {
      ws.close();
    };
  }, [resolvedGuildId, guildSlug, navigate]);

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
