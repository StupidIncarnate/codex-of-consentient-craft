/**
 * PURPOSE: Quest chat content with split panels for chat and activity, rendered inside the shared app layout
 *
 * USAGE:
 * <QuestChatWidget />
 * // Renders split panel chat interface, reads guildSlug and optional sessionId from URL params
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { QuestStatus, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { chatEntryContract, type ChatEntry } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { slotIndexContract } from '../../contracts/slot-index/slot-index-contract';

import { useAgentOutputBinding } from '../../bindings/use-agent-output/use-agent-output-binding';
import { useGuildDetailBinding } from '../../bindings/use-guild-detail/use-guild-detail-binding';
import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useQuestEventsBinding } from '../../bindings/use-quest-events/use-quest-events-binding';
import { useSessionChatBinding } from '../../bindings/use-session-chat/use-session-chat-binding';
import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { designSessionBroker } from '../../brokers/design/session/design-session-broker';
import { designStartBroker } from '../../brokers/design/start/design-start-broker';
import { questAbandonBroker } from '../../brokers/quest/abandon/quest-abandon-broker';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
import { hasPendingQuestionGuard } from '../../guards/has-pending-question/has-pending-question-guard';
import { isDesignStartVisibleGuard } from '../../guards/is-design-start-visible/is-design-start-visible-guard';
import { isDesignTabVisibleGuard } from '../../guards/is-design-tab-visible/is-design-tab-visible-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { extractAskUserQuestionTransformer } from '../../transformers/extract-ask-user-question/extract-ask-user-question-transformer';
import {
  isAbandonableQuestStatusGuard,
  isGateApprovedQuestStatusGuard,
  shouldRenderExecutionPanelQuestStatusGuard,
  shouldShowBeginQuestModalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { previousReviewQuestStatusTransformer } from '@dungeonmaster/shared/transformers';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DesignPanelWidget } from '../design-panel/design-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';
import { QuestApprovedModalWidget } from '../quest-approved-modal/quest-approved-modal-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const navigate = useNavigate();
  const { guildSlug } = params;
  const sessionId = (params.sessionId as SessionId | undefined) ?? null;
  const { colors } = emberDepthsThemeStatics;
  const prevIsStreamingRef = useRef(false);

  const { guilds, loading: guildsLoading } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const resolvedGuildId = matchedGuild?.id ?? null;

  const { refresh: refreshGuild } = useGuildDetailBinding({
    guildId: resolvedGuildId,
  });

  const {
    entries,
    isStreaming,
    currentSessionId,
    pendingClarification,
    sessionNotFound,
    sendMessage,
    submitClarifyAnswers,
    stopChat,
  } = useSessionChatBinding({
    guildId: resolvedGuildId,
    sessionId,
  });

  const { questData, requestRefresh } = useQuestEventsBinding({
    sessionId: currentSessionId ?? sessionId,
    guildId: resolvedGuildId,
  });

  const { slotEntries, handleAgentOutput } = useAgentOutputBinding();

  const isGuildNotFound = !guildsLoading && !matchedGuild && Boolean(guildSlug);
  const isNotFound = isGuildNotFound || (sessionNotFound && !questData);

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
    const shouldShowModal =
      currentStatus !== null &&
      shouldShowBeginQuestModalQuestStatusGuard({ status: currentStatus });
    const prevStatus = prevQuestStatusRef.current;
    const wasShowingModal =
      prevStatus !== null && shouldShowBeginQuestModalQuestStatusGuard({ status: prevStatus });

    if (shouldShowModal && !wasShowingModal) {
      setApprovedModalOpen(true);
    }
    prevQuestStatusRef.current = currentStatus;
  }, [questData?.status]);

  useEffect(() => {
    if (!currentSessionId || sessionId) return;
    if (!guildSlug) return;

    const result = navigate(`/${guildSlug}/session/${currentSessionId}`, { replace: true });
    if (result instanceof Promise) {
      result.catch((navError: unknown) => {
        globalThis.console.error('[quest-chat] navigation failed', navError);
      });
    }
  }, [currentSessionId, sessionId, guildSlug, navigate]);

  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      refreshGuild().catch((refreshError: unknown) => {
        globalThis.console.error('[quest-chat] refresh failed', refreshError);
      });
      requestRefresh();
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, refreshGuild, requestRefresh]);

  // Note: no auto-start effect. Starting a quest is always user-driven:
  // - Spec/design approval: user clicks "Begin Quest" in QuestApprovedModalWidget.
  // - Server restart recovery: handled by the orchestrator startup-recovery responder.
  // The widget subscribes to the WS stream for execution-phase quests; it never POSTs /start.

  const [workItemSessionEntries, setWorkItemSessionEntries] = useState<Map<SessionId, ChatEntry[]>>(
    new Map(),
  );

  const replayedSessionsRef = useRef<Set<SessionId>>(new Set());
  const executionWsRef = useRef<ReturnType<typeof websocketConnectAdapter> | null>(null);
  const executionWsOpenRef = useRef(false);
  const isExecutionPhase =
    questData !== null && shouldRenderExecutionPanelQuestStatusGuard({ status: questData.status });

  const questDataRef = useRef(questData);
  const resolvedGuildIdRef = useRef(resolvedGuildId);
  questDataRef.current = questData;
  resolvedGuildIdRef.current = resolvedGuildId;

  const flushPendingReplays = useCallback((): void => {
    const connection = executionWsRef.current;
    const currentQuestData = questDataRef.current;
    const currentGuildId = resolvedGuildIdRef.current;
    if (!connection || !currentQuestData || !currentGuildId || !executionWsOpenRef.current) return;

    const WARD_SESSION_PREFIX = 'ward-';

    for (const wi of currentQuestData.workItems) {
      if (!wi.sessionId) continue;
      if (wi.sessionId.startsWith(WARD_SESSION_PREFIX)) continue;
      if (replayedSessionsRef.current.has(wi.sessionId)) continue;
      replayedSessionsRef.current.add(wi.sessionId);
      connection.send({
        type: 'replay-history',
        sessionId: wi.sessionId,
        guildId: currentGuildId,
        chatProcessId: `exec-replay-${wi.sessionId}`,
      });
    }
  }, []);

  // Stable WS connection for execution-phase chat-output streaming.
  // Created once when execution phase begins, never torn down on questData updates.
  // This prevents dropped messages during WS reconnection gaps caused by rapid quest-modified events.
  useEffect(() => {
    if (!isExecutionPhase) return undefined;

    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onOpen: (): void => {
        executionWsOpenRef.current = true;
        flushPendingReplays();
      },
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;
        if (parsed.data.type !== 'chat-output') return;

        const rawSlotIndex: unknown = Reflect.get(parsed.data.payload, 'slotIndex');
        const slotIndexParsed = slotIndexContract.safeParse(rawSlotIndex);
        if (slotIndexParsed.success) {
          const rawEntries: unknown = Reflect.get(parsed.data.payload, 'entries');
          if (!Array.isArray(rawEntries)) return;

          const validEntries: ChatEntry[] = [];
          for (const candidate of rawEntries) {
            const parseResult = chatEntryContract.safeParse(candidate);
            if (parseResult.success) {
              validEntries.push(parseResult.data);
            }
          }
          if (validEntries.length === 0) return;

          handleAgentOutput({ slotIndex: slotIndexParsed.data, entries: validEntries });

          const rawSessionId: unknown = Reflect.get(parsed.data.payload, 'sessionId');
          if (typeof rawSessionId === 'string' && rawSessionId.length > 0) {
            const liveSessionId = rawSessionId as SessionId;
            setWorkItemSessionEntries((prev) => {
              const updated = new Map(prev);
              const existing = updated.get(liveSessionId) ?? [];
              updated.set(liveSessionId, [...existing, ...validEntries]);
              return updated;
            });
          }
          return;
        }

        const rawChatProcessId: unknown = Reflect.get(parsed.data.payload, 'chatProcessId');
        if (typeof rawChatProcessId !== 'string') return;

        // Only process replay messages initiated by this component's flushPendingReplays,
        // identified by the 'exec-replay-' prefix. The server broadcasts replay output to
        // ALL WS clients, so replays triggered by useSessionChatBinding (prefix 'replay-')
        // or external callers would otherwise duplicate entries in the DOM.
        const EXEC_REPLAY_PREFIX = 'exec-replay-';
        if (!rawChatProcessId.startsWith(EXEC_REPLAY_PREFIX)) return;

        const replaySessionId = rawChatProcessId.slice(EXEC_REPLAY_PREFIX.length) as SessionId;

        const rawEntries: unknown = Reflect.get(parsed.data.payload, 'entries');
        if (!Array.isArray(rawEntries)) return;

        const validEntries: ChatEntry[] = [];
        for (const candidate of rawEntries) {
          const parseResult = chatEntryContract.safeParse(candidate);
          if (parseResult.success) {
            validEntries.push(parseResult.data);
          }
        }
        if (validEntries.length === 0) return;

        setWorkItemSessionEntries((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(replaySessionId) ?? [];
          updated.set(replaySessionId, [...existing, ...validEntries]);
          return updated;
        });
      },
    });

    executionWsRef.current = connection;

    return (): void => {
      executionWsRef.current = null;
      executionWsOpenRef.current = false;
      connection.close();
    };
  }, [isExecutionPhase, handleAgentOutput, flushPendingReplays]);

  // Replay historical sessions for work items as they appear in quest data.
  // Runs separately from WS creation so quest data updates don't tear down the connection.
  // If the WS is already open, flushes immediately. If not, onOpen will flush when ready.
  useEffect(() => {
    if (!questData) return;
    if (!resolvedGuildId) return;

    flushPendingReplays();
  }, [questData, resolvedGuildId, flushPendingReplays]);

  const entryBasedQuestion = hasPendingQuestionGuard({ entries })
    ? extractAskUserQuestionTransformer({ entries })
    : null;

  const pendingQuestion = pendingClarification ?? entryBasedQuestion;

  const questWithContent = questData;

  const approvedReviewStatus: QuestStatus | null =
    questData === null ? null : previousReviewQuestStatusTransformer({ status: questData.status });

  const sessionEntriesMap = useMemo(() => {
    const map = new Map<SessionId, ChatEntry[]>(workItemSessionEntries);
    if (currentSessionId && entries.length > 0) {
      map.set(currentSessionId, entries);
    }
    return map;
  }, [currentSessionId, entries, workItemSessionEntries]);

  if (isNotFound) {
    return (
      <Box
        data-testid="NOT_FOUND"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 8,
        }}
      >
        <Text ff="monospace" size="lg" style={{ color: colors.danger }}>
          NOT FOUND
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          The guild or session you are looking for does not exist.
        </Text>
      </Box>
    );
  }

  if (sessionId && !questData && entries.length === 0) {
    return (
      <Box
        data-testid="QUEST_CHAT_LOADING"
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        <DumpsterRaccoonWidget />
      </Box>
    );
  }

  if (questData && shouldRenderExecutionPanelQuestStatusGuard({ status: questData.status })) {
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
          {questWithContent ? (
            <ExecutionPanelWidget
              quest={questWithContent}
              slotEntries={slotEntries}
              sessionEntries={sessionEntriesMap}
              onStatusChange={({ status }): void => {
                questModifyBroker({
                  questId: questWithContent.id,
                  modifications: { status },
                }).catch((modifyError: unknown) => {
                  globalThis.console.error('[quest-chat] status change failed', modifyError);
                });
              }}
              onPause={(): void => {
                questPauseBroker({ questId: questWithContent.id }).catch((pauseError: unknown) => {
                  globalThis.console.error('[quest-chat] pause failed', pauseError);
                });
              }}
              {...(isAbandonableQuestStatusGuard({ status: questWithContent.status })
                ? {
                    onAbandon: (): void => {
                      questAbandonBroker({ questId: questWithContent.id }).catch(
                        (abandonError: unknown) => {
                          globalThis.console.error('[quest-chat] abandon failed', abandonError);
                        },
                      );
                    },
                  }
                : {})}
            />
          ) : null}
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
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {questWithContent === null ? (
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], padding: 16 }}>
            Awaiting quest activity...
          </Text>
        ) : (
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                      .catch((designError: unknown) => {
                        globalThis.console.error('[quest-chat] design start failed', designError);
                      });
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
                      } else if (
                        nextStatus !== undefined &&
                        isGateApprovedQuestStatusGuard({ status: nextStatus as QuestStatus })
                      ) {
                        // Other gate-approved statuses (approved, design_approved):
                        // Do NOT send a chat message. The ChaosWhisperer's response can call
                        // modify-quest MCP and revert the status before the user clicks Begin
                        // Quest — causing a silent race condition where the start POST fails.
                      }
                    })
                    .catch((error: unknown) => {
                      globalThis.console.error('[quest-modify]', error);
                    });
                }}
                externalUpdatePending={externalUpdatePending}
                onDismissUpdate={() => {
                  setExternalUpdatePending(false);
                }}
                pendingQuestion={pendingQuestion}
                onSubmitAnswers={({ answers }): void => {
                  if (!questData?.id) return;
                  submitClarifyAnswers({
                    questId: questData.id,
                    answers: answers.map((a) => ({
                      header: a.header,
                      label: a.label,
                    })),
                    questions: pendingQuestion?.questions ?? [],
                  });
                }}
                {...(isAbandonableQuestStatusGuard({ status: questWithContent.status })
                  ? {
                      onAbandon: (): void => {
                        questAbandonBroker({ questId: questWithContent.id }).catch(
                          (abandonError: unknown) => {
                            globalThis.console.error('[quest-chat] abandon failed', abandonError);
                          },
                        );
                      },
                    }
                  : {})}
              />
            )}
          </Box>
        )}
      </Box>
      {questWithContent ? (
        <QuestApprovedModalWidget
          opened={
            approvedModalOpen &&
            shouldShowBeginQuestModalQuestStatusGuard({ status: questWithContent.status })
          }
          onKeepChatting={() => {
            setApprovedModalOpen(false);
            if (approvedReviewStatus) {
              questModifyBroker({
                questId: questWithContent.id,
                modifications: { status: approvedReviewStatus },
              }).catch((error: unknown) => {
                globalThis.console.error('[keep-chatting]', error);
              });
            }
          }}
          onNewQuest={() => {
            setApprovedModalOpen(false);
            if (guildSlug) {
              const navResult = navigate(`/${guildSlug}/session`);
              if (navResult instanceof Promise) {
                navResult.catch((navError: unknown) => {
                  globalThis.console.error('[quest-chat] navigation failed', navError);
                });
              }
            }
          }}
          onBeginQuest={() => {
            setApprovedModalOpen(false);
            questStartBroker({ questId: questWithContent.id }).catch((error: unknown) => {
              globalThis.console.error('[begin-quest]', error);
            });
          }}
        />
      ) : null}
    </Box>
  );
};
