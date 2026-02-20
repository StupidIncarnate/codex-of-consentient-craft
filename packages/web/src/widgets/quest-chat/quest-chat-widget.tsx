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

import type { ChatSession, QuestId, UserInput } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { useGuildDetailBinding } from '../../bindings/use-guild-detail/use-guild-detail-binding';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { hasPendingQuestionGuard } from '../../guards/has-pending-question/has-pending-question-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { extractAskUserQuestionTransformer } from '../../transformers/extract-ask-user-question/extract-ask-user-question-transformer';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { QuestClarifyPanelWidget } from '../quest-clarify-panel/quest-clarify-panel-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

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

  const pendingQuestion = hasPendingQuestionGuard({ entries })
    ? extractAskUserQuestionTransformer({ entries })
    : null;

  const questWithContent =
    questData !== null &&
    (questData.requirements.length > 0 ||
      questData.observables.length > 0 ||
      questData.flows.length > 0)
      ? questData
      : null;

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
          overflow: 'auto',
        }}
      >
        {pendingQuestion ? (
          <QuestClarifyPanelWidget
            questions={pendingQuestion.questions}
            questTitle={
              (questData?.title ??
                '') as unknown as (typeof pendingQuestion.questions)[0]['question']
            }
            onSubmitAnswers={({ answers }): void => {
              const message = answers
                .map((a) => `${String(a.header)}: ${String(a.label)}`)
                .join('\n');
              sendMessage({ message: message as UserInput });
            }}
          />
        ) : questWithContent === null ? (
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], padding: 16 }}>
            Awaiting quest activity...
          </Text>
        ) : (
          <QuestSpecPanelWidget
            quest={questWithContent}
            onModify={({ modifications }): void => {
              questModifyBroker({ questId: questWithContent.id, modifications })
                .then(async () => refreshQuest())
                .catch(() => undefined);
            }}
            onRefresh={(): void => {
              refreshQuest().catch(() => undefined);
            }}
          />
        )}
      </Box>
    </Box>
  );
};
