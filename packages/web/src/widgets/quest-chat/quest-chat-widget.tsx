/**
 * PURPOSE: Quest chat content with split panels for chat and activity, rendered inside the shared app layout
 *
 * USAGE:
 * <QuestChatWidget />
 * // Renders split panel chat interface, reads guildSlug and optional sessionId from URL params
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { QuestStatus, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { useGuildDetailBinding } from '../../bindings/use-guild-detail/use-guild-detail-binding';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestEventsBinding } from '../../bindings/use-quest-events/use-quest-events-binding';
import { useSessionChatBinding } from '../../bindings/use-session-chat/use-session-chat-binding';
import { useSessionListBinding } from '../../bindings/use-session-list/use-session-list-binding';
import { designSessionBroker } from '../../brokers/design/session/design-session-broker';
import { designStartBroker } from '../../brokers/design/start/design-start-broker';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
import { hasPendingQuestionGuard } from '../../guards/has-pending-question/has-pending-question-guard';
import { isDesignStartVisibleGuard } from '../../guards/is-design-start-visible/is-design-start-visible-guard';
import { isDesignTabVisibleGuard } from '../../guards/is-design-tab-visible/is-design-tab-visible-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { extractAskUserQuestionTransformer } from '../../transformers/extract-ask-user-question/extract-ask-user-question-transformer';
import { isExecutionPhaseGuard } from '../../guards/is-execution-phase/is-execution-phase-guard';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DesignPanelWidget } from '../design-panel/design-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';
import { QuestClarifyPanelWidget } from '../quest-clarify-panel/quest-clarify-panel-widget';
import { QuestApprovedModalWidget } from '../quest-approved-modal/quest-approved-modal-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const navigate = useNavigate();
  const { guildSlug } = params;
  const sessionId = (params.sessionId as SessionId | undefined) ?? null;
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

  const { refresh: refreshSessionList } = useSessionListBinding({
    guildId: resolvedGuildId,
  });

  const { entries, isStreaming, currentSessionId, pendingClarification, sendMessage, stopChat } =
    useSessionChatBinding({
      guildId: resolvedGuildId,
      sessionId,
    });

  const { questData, requestRefresh } = useQuestEventsBinding({
    sessionId: currentSessionId ?? sessionId,
    guildId: resolvedGuildId,
  });

  const [activeTab, setActiveTab] = useState<'spec' | 'design'>('spec');
  const [externalUpdatePending, setExternalUpdatePending] = useState(false);
  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const prevQuestDataRef = useRef(questData);
  const prevQuestStatusRef = useRef<QuestStatus | null>(null);

  useEffect(() => {
    if (questData !== prevQuestDataRef.current && prevQuestDataRef.current !== null) {
      setExternalUpdatePending(true);
    }
    prevQuestDataRef.current = questData;
  }, [questData]);

  useEffect(() => {
    const currentStatus = questData?.status ?? null;
    const isApprovedPhase = currentStatus === 'approved' || currentStatus === 'design_approved';
    const wasApprovedPhase =
      prevQuestStatusRef.current === 'approved' || prevQuestStatusRef.current === 'design_approved';

    if (isApprovedPhase && !wasApprovedPhase) {
      setApprovedModalOpen(true);
    }
    prevQuestStatusRef.current = currentStatus;
  }, [questData?.status]);

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
      refreshSessionList().catch(() => undefined);
      requestRefresh();
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, refreshGuild, refreshSessionList, requestRefresh]);

  const entryBasedQuestion = hasPendingQuestionGuard({ entries })
    ? extractAskUserQuestionTransformer({ entries })
    : null;

  const pendingQuestion = pendingClarification ?? entryBasedQuestion;

  const questWithContent = questData;

  const approvedReviewStatus: QuestStatus | null =
    questData?.status === 'approved'
      ? ('review_observables' as QuestStatus)
      : questData?.status === 'design_approved'
        ? ('review_design' as QuestStatus)
        : null;

  if (questData && isExecutionPhaseGuard({ status: questData.status })) {
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
          {questWithContent ? <ExecutionPanelWidget quest={questWithContent} /> : null}
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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DumpsterRaccoonWidget />
        </Box>
      </Box>
    );
  }

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {pendingQuestion && (
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
        )}

        {questWithContent === null ? (
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], padding: 16 }}>
            Awaiting quest activity...
          </Text>
        ) : (
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {isDesignTabVisibleGuard({ status: questWithContent.status }) && (
              <Box
                data-testid="DESIGN_TAB_BAR"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Box
                  data-testid="TAB_SPEC"
                  onClick={() => {
                    setActiveTab('spec');
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderBottom:
                      activeTab === 'spec'
                        ? `2px solid ${colors.primary}`
                        : '2px solid transparent',
                    color: activeTab === 'spec' ? colors.primary : colors['text-dim'],
                  }}
                >
                  <Text ff="monospace" size="xs">
                    SPEC
                  </Text>
                </Box>
                <Box
                  data-testid="TAB_DESIGN"
                  onClick={() => {
                    setActiveTab('design');
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderBottom:
                      activeTab === 'design'
                        ? `2px solid ${colors.primary}`
                        : '2px solid transparent',
                    color: activeTab === 'design' ? colors.primary : colors['text-dim'],
                  }}
                >
                  <Text ff="monospace" size="xs">
                    DESIGN
                  </Text>
                </Box>
              </Box>
            )}

            {isDesignStartVisibleGuard({ quest: questWithContent }) && (
              <Box
                data-testid="DESIGN_START_ACTION"
                style={{
                  padding: '8px 16px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Box
                  data-testid="DESIGN_START_BUTTON"
                  onClick={() => {
                    designStartBroker({ questId: questWithContent.id })
                      .then(async ({ port }) => {
                        if (resolvedGuildId && port) {
                          return designSessionBroker({
                            questId: questWithContent.id,
                            guildId: resolvedGuildId,
                            message: 'Begin design prototyping' as UserInput,
                          });
                        }
                        return undefined;
                      })
                      .catch(() => undefined);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.primary,
                    color: colors['bg-deep'],
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <Text ff="monospace" size="xs">
                    START DESIGN
                  </Text>
                </Box>
              </Box>
            )}

            {activeTab === 'design' &&
            isDesignTabVisibleGuard({ status: questWithContent.status }) ? (
              <DesignPanelWidget designPort={questWithContent.designPort} />
            ) : (
              <QuestSpecPanelWidget
                quest={questWithContent}
                onModify={({ modifications, action, nextStatus }): void => {
                  questModifyBroker({ questId: questWithContent.id, modifications })
                    .then(() => {
                      setExternalUpdatePending(false);
                      if (action === 'submit') {
                        sendMessage({
                          message:
                            "I've modified the quest spec. Please review my changes." as UserInput,
                        });
                      } else if (nextStatus === 'flows_approved') {
                        sendMessage({
                          message:
                            'Flows approved. Proceed to observables and contracts.' as UserInput,
                        });
                      } else if (nextStatus === 'approved') {
                        sendMessage({
                          message:
                            'Observables and contracts approved. Spec is fully approved.' as UserInput,
                        });
                      } else if (nextStatus === 'design_approved') {
                        sendMessage({
                          message: 'Design approved. Proceed to implementation.' as UserInput,
                        });
                      }
                    })
                    .catch(() => undefined);
                }}
                externalUpdatePending={externalUpdatePending}
                onDismissUpdate={() => {
                  setExternalUpdatePending(false);
                }}
              />
            )}
          </Box>
        )}
      </Box>
      {questWithContent ? (
        <QuestApprovedModalWidget
          opened={approvedModalOpen}
          onKeepChatting={() => {
            setApprovedModalOpen(false);
            if (approvedReviewStatus) {
              questModifyBroker({
                questId: questWithContent.id,
                modifications: { status: approvedReviewStatus },
              }).catch(() => undefined);
            }
          }}
          onNewQuest={() => {
            setApprovedModalOpen(false);
            if (guildSlug) {
              const navResult = navigate(`/${guildSlug}/session`);
              if (navResult instanceof Promise) {
                navResult.catch(() => undefined);
              }
            }
          }}
          onBeginQuest={() => {
            setApprovedModalOpen(false);
            questStartBroker({ questId: questWithContent.id }).catch(() => undefined);
          }}
        />
      ) : null}
    </Box>
  );
};
