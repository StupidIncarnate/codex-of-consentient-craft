/**
 * PURPOSE: Renders the unified quest chat surface for both `/:guildSlug/quest` (no questId — new-chat) and `/:guildSlug/quest/:questId` (live workspace). Owns the URL replace-navigate after first-message quest creation so the same component instance survives the param transition and local first-message state is preserved.
 *
 * USAGE:
 * <QuestChatContentLayerWidget questId={questId} guildId={guildId} guildSlug={guildSlug} />
 * // questId === null → new-chat surface (ChatPanel + "Awaiting…"). Once first message creates the quest, the widget replace-navigates to the live URL; same instance keeps rendering with the new questId, binding subscribes, layout transitions to ChatPanel+SpecPanel (or ExecutionPanel+Activity in execution phase).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type {
  ChatEntry,
  GuildId,
  Quest,
  QuestId,
  QuestStatus,
  UrlSlug,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import {
  isAbandonableQuestStatusGuard,
  isUserPausedQuestStatusGuard,
  shouldRenderExecutionPanelQuestStatusGuard,
  shouldShowBeginQuestModalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { previousReviewQuestStatusTransformer } from '@dungeonmaster/shared/transformers';

import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { questAbandonBroker } from '../../brokers/quest/abandon/quest-abandon-broker';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { questNewBroker } from '../../brokers/quest/new/quest-new-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
import { hasEquivalentChatEntryGuard } from '../../guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { AutoScrollContainerWidget } from '../auto-scroll-container/auto-scroll-container-widget';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';
import { QuestApprovedModalWidget } from '../quest-approved-modal/quest-approved-modal-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

const SUBMIT_FOLLOWUP_MESSAGE =
  "I've modified the quest spec. Please review my changes." as UserInput;
const FLOWS_APPROVED_FOLLOWUP_MESSAGE =
  'Flows approved. Proceed to observables and contracts.' as UserInput;

export interface QuestChatContentLayerWidgetProps {
  questId: QuestId | null;
  guildId: GuildId;
  guildSlug: UrlSlug;
}

export const QuestChatContentLayerWidget = ({
  questId,
  guildId,
  guildSlug,
}: QuestChatContentLayerWidgetProps): React.JSX.Element => {
  const navigate = useNavigate();
  const {
    quest,
    entriesBySession,
    slotEntries,
    isStreaming,
    pendingClarification,
    sendMessage,
    submitClarifyAnswers,
    stopChat,
  } = useQuestChatBinding({ questId });

  // Local state for the first-message flow: the user's first message lives
  // here until the binding's replay catches up. Without this, the message
  // would vanish during the questId param transition because the binding
  // boots fresh entries on each questId change. Subsequent messages go
  // through binding.sendMessage and live entirely in binding state.
  const [localEntries, setLocalEntries] = useState<ChatEntry[]>([]);
  // `submitting` covers the period from "user clicks send on the new-chat
  // surface" until the binding shows any activity for this quest. The
  // orchestrator emits chat-history-complete on subscription before live
  // chat-output, which would otherwise leave the input button reading "play"
  // between quest-modified and the first streaming entry. Hand-off happens
  // when the binding either reports streaming OR has accumulated any entries
  // — either signals the binding has taken ownership. We can't key solely on
  // the rising edge of `isStreaming` because chat-output and chat-history-
  // complete can land in the same React commit (mocked Claude in e2e), which
  // would collapse the rising edge to false→false and leave submitting stuck.
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submitting && (isStreaming || entriesBySession.size > 0)) {
      setSubmitting(false);
    }
  }, [submitting, isStreaming, entriesBySession]);

  const flattenedEntries = useMemo<ChatEntry[]>(() => {
    const all: ChatEntry[] = [];
    for (const list of entriesBySession.values()) {
      all.push(...list);
    }
    const localFiltered = localEntries.filter(
      (entry) => !hasEquivalentChatEntryGuard({ entry, among: all }),
    );
    return [...localFiltered, ...all];
  }, [entriesBySession, localEntries]);

  const [externalUpdatePending, setExternalUpdatePending] = useState(false);
  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const prevQuestRef = useRef<Quest | null>(null);
  const prevQuestStatusRef = useRef<QuestStatus | null>(null);

  // Detect agent-side quest mutations after the user has loaded the editor —
  // QuestSpecPanelWidget surfaces this via an EXTERNAL_UPDATE_BANNER so the
  // user can RELOAD or KEEP EDITING.
  useEffect(() => {
    if (quest !== prevQuestRef.current && prevQuestRef.current !== null) {
      setExternalUpdatePending(true);
    }
    prevQuestRef.current = quest;
  }, [quest]);

  // Open the Begin-Quest modal only on the rising edge into 'approved' so
  // it's dismissable; once status changes the modal can re-arm.
  useEffect(() => {
    const currentStatus = quest?.status ?? null;
    const shouldShow =
      currentStatus !== null &&
      shouldShowBeginQuestModalQuestStatusGuard({ status: currentStatus });
    const prevStatus = prevQuestStatusRef.current;
    const wasShowing =
      prevStatus !== null && shouldShowBeginQuestModalQuestStatusGuard({ status: prevStatus });
    if (shouldShow && !wasShowing) {
      setApprovedModalOpen(true);
    }
    prevQuestStatusRef.current = currentStatus;
  }, [quest?.status]);

  const handleSend = useCallback(
    ({ message }: { message: UserInput }): void => {
      if (questId !== null) {
        // Normal path — binding handles user message, resume-if-paused, POST.
        sendMessage({ message });
        return;
      }
      // First-message path — create the quest, then replace-navigate so the
      // SAME component instance keeps rendering with questId set. The binding
      // resubscribes via its useEffect on questId; localEntries keeps the
      // user message visible during the gap until replay catches up.
      if (submitting) return;
      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setLocalEntries((prev) => [...prev, userEntry]);
      setSubmitting(true);
      questNewBroker({ guildId, message })
        .then(({ questId: newQuestId }) => {
          const result = navigate(`/${guildSlug}/quest/${newQuestId}`, { replace: true });
          if (result instanceof Promise) {
            result.catch((navError: unknown) => {
              globalThis.console.error('[quest-chat] new-chat navigate failed', navError);
            });
          }
        })
        .catch((err: unknown) => {
          setSubmitting(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
          });
          setLocalEntries((prev) => [...prev, errorEntry]);
        });
    },
    [questId, sendMessage, submitting, guildId, guildSlug, navigate],
  );

  const { colors } = emberDepthsThemeStatics;

  // No quest yet — either we're on the new-chat URL (questId null) or the
  // questId is set but replay hasn't delivered the quest object. Render the
  // dual-panel chat surface; the chat panel shows localEntries + any binding
  // entries that have already arrived; the right side shows "Awaiting…".
  if (quest === null) {
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
            entries={flattenedEntries}
            isStreaming={submitting || isStreaming}
            onSendMessage={handleSend}
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
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], padding: 16 }}>
            Awaiting quest activity...
          </Text>
        </Box>
      </Box>
    );
  }

  const displayStatus: QuestStatus =
    isUserPausedQuestStatusGuard({ status: quest.status }) &&
    quest.pausedAtStatus !== undefined &&
    quest.pausedAtStatus !== null
      ? quest.pausedAtStatus
      : quest.status;
  const isExecutionPhase = shouldRenderExecutionPanelQuestStatusGuard({ status: displayStatus });

  const onAbandon = isAbandonableQuestStatusGuard({ status: quest.status })
    ? (): void => {
        questAbandonBroker({ questId: quest.id }).catch((abandonError: unknown) => {
          globalThis.console.error('[quest-chat] abandon failed', abandonError);
        });
      }
    : undefined;

  const approvedReviewStatus: QuestStatus | null = previousReviewQuestStatusTransformer({
    status: quest.status,
  });

  const beginQuestModal = (
    <QuestApprovedModalWidget
      opened={
        approvedModalOpen && shouldShowBeginQuestModalQuestStatusGuard({ status: quest.status })
      }
      onBeginQuest={(): void => {
        setApprovedModalOpen(false);
        questStartBroker({ questId: quest.id }).catch((startError: unknown) => {
          globalThis.console.error('[quest-chat] begin quest failed', startError);
        });
      }}
      onKeepChatting={(): void => {
        setApprovedModalOpen(false);
        if (approvedReviewStatus === null) return;
        questModifyBroker({
          questId: quest.id,
          modifications: { status: approvedReviewStatus },
        }).catch((modifyError: unknown) => {
          globalThis.console.error('[quest-chat] keep chatting failed', modifyError);
        });
      }}
      onNewQuest={(): void => {
        setApprovedModalOpen(false);
        const result = navigate(`/${guildSlug}/quest`);
        if (result instanceof Promise) {
          result.catch((navError: unknown) => {
            globalThis.console.error('[quest-chat] new quest navigate failed', navError);
          });
        }
      }}
    />
  );

  const specPanel = (
    <QuestSpecPanelWidget
      quest={quest}
      onModify={({ modifications, action, nextStatus }): void => {
        questModifyBroker({ questId: quest.id, modifications })
          .then(() => {
            setExternalUpdatePending(false);
            if (action === 'submit') {
              sendMessage({ message: SUBMIT_FOLLOWUP_MESSAGE });
              return;
            }
            if (nextStatus === 'flows_approved') {
              sendMessage({ message: FLOWS_APPROVED_FOLLOWUP_MESSAGE });
            }
            // Other gate-approved statuses (approved, design_approved):
            // deliberately no follow-up message — the agent's response could
            // call modify-quest and revert the status before the user clicks
            // Begin Quest, which would race with the start POST and silently
            // fail. The user-driven Begin Quest button is the intended
            // trigger for the next phase.
          })
          .catch((modifyError: unknown) => {
            globalThis.console.error('[quest-chat] modify failed', modifyError);
          });
      }}
      externalUpdatePending={externalUpdatePending}
      onDismissUpdate={(): void => {
        setExternalUpdatePending(false);
      }}
      pendingQuestion={pendingClarification}
      onSubmitAnswers={({ answers }): void => {
        const questions = pendingClarification?.questions ?? [];
        submitClarifyAnswers({
          answers: answers.map((a) => ({ header: a.header, label: a.label })),
          questions,
        });
      }}
      {...(onAbandon ? { onAbandon } : {})}
    />
  );

  if (isExecutionPhase) {
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
          <ExecutionPanelWidget
            quest={quest}
            slotEntries={slotEntries}
            sessionEntries={entriesBySession}
            guildSlug={guildSlug}
            onStatusChange={({ status }): void => {
              if (isUserPausedQuestStatusGuard({ status: quest.status })) {
                questResumeBroker({ questId: quest.id }).catch((resumeError: unknown) => {
                  globalThis.console.error('[quest-chat] resume failed', resumeError);
                });
                return;
              }
              questModifyBroker({
                questId: quest.id,
                modifications: { status },
              }).catch((modifyError: unknown) => {
                globalThis.console.error('[quest-chat] status change failed', modifyError);
              });
            }}
            onPause={(): void => {
              questPauseBroker({ questId: quest.id }).catch((pauseError: unknown) => {
                globalThis.console.error('[quest-chat] pause failed', pauseError);
              });
            }}
            {...(onAbandon ? { onAbandon } : {})}
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
          {flattenedEntries.length === 0 ? (
            <DumpsterRaccoonWidget />
          ) : (
            <AutoScrollContainerWidget
              style={{ flex: 1, padding: 16 }}
              contentStyle={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <ChatEntryListWidget
                entries={flattenedEntries}
                isStreaming={isStreaming}
                showContextDividers
                showEndStreamingIndicator
              />
            </AutoScrollContainerWidget>
          )}
        </Box>
        {beginQuestModal}
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
          entries={flattenedEntries}
          isStreaming={submitting || isStreaming}
          onSendMessage={handleSend}
          onStopChat={stopChat}
        />
      </Box>
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {specPanel}
      </Box>
      {beginQuestModal}
    </Box>
  );
};
