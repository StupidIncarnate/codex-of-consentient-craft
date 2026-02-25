/**
 * PURPOSE: Quest chat content with split panels for chat and activity, rendered inside the shared app layout
 *
 * USAGE:
 * <QuestChatWidget />
 * // Renders split panel chat interface, reads guildSlug and optional sessionId from URL params
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { QuestId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { useGuildDetailBinding } from '../../bindings/use-guild-detail/use-guild-detail-binding';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestEventsBinding } from '../../bindings/use-quest-events/use-quest-events-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { useSessionChatBinding } from '../../bindings/use-session-chat/use-session-chat-binding';
import { useSessionListBinding } from '../../bindings/use-session-list/use-session-list-binding';
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
  const location = useLocation();
  const { guildSlug } = params;
  const sessionId = (params.sessionId as SessionId | undefined) ?? null;
  const routeQuestId = (location.state as { questId?: QuestId } | null)?.questId ?? null;
  const { colors } = emberDepthsThemeStatics;
  const prevIsStreamingRef = useRef(false);

  const { guilds } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const resolvedGuildId = matchedGuild?.id ?? null;

  const { refresh: refreshGuild } = useGuildDetailBinding({
    guildId: resolvedGuildId,
  });

  const { data: sessionList } = useSessionListBinding({
    guildId: resolvedGuildId,
  });

  const sessionQuestId =
    routeQuestId ??
    (sessionId === null
      ? null
      : (sessionList.find((s) => s.sessionId === sessionId)?.questId ?? null));

  const { data: questData, refresh: refreshQuest } = useQuestDetailBinding({
    questId: sessionQuestId,
  });

  const [externalUpdatePending, setExternalUpdatePending] = useState(false);

  useQuestEventsBinding({
    questId: sessionQuestId,
    onQuestModified: () => {
      refreshQuest().catch(() => undefined);
      setExternalUpdatePending(true);
    },
  });

  const { entries, isStreaming, currentSessionId, pendingClarification, sendMessage, stopChat } =
    useSessionChatBinding({
      guildId: resolvedGuildId,
      sessionId,
    });

  useEffect(() => {
    if (isStreaming) return;
    if (!currentSessionId || sessionId) return;
    if (!guildSlug) return;

    const result = navigate(`/${guildSlug}/session/${currentSessionId}`, { replace: true });
    if (result instanceof Promise) {
      result.catch(() => undefined);
    }
  }, [currentSessionId, sessionId, guildSlug, navigate, isStreaming]);

  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      refreshGuild().catch(() => undefined);
      if (sessionQuestId) {
        refreshQuest().catch(() => undefined);
      }
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, refreshGuild, refreshQuest, sessionQuestId]);

  const entryBasedQuestion = hasPendingQuestionGuard({ entries })
    ? extractAskUserQuestionTransformer({ entries })
    : null;

  const pendingQuestion = pendingClarification ?? entryBasedQuestion;

  const questWithContent =
    questData !== null &&
    (questData.requirements.length > 0 ||
      questData.observables.length > 0 ||
      questData.flows.length > 0)
      ? questData
      : null;

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
                .then(() => {
                  setExternalUpdatePending(false);
                })
                .catch(() => undefined);
            }}
            onRefresh={(): void => {
              refreshQuest().catch(() => undefined);
            }}
            externalUpdatePending={externalUpdatePending}
            onDismissUpdate={() => {
              setExternalUpdatePending(false);
            }}
          />
        )}
      </Box>
    </Box>
  );
};
