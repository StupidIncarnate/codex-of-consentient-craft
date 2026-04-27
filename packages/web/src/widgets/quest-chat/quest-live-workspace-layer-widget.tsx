/**
 * PURPOSE: Renders the live questId-keyed quest workspace as a side-by-side split. Execution-phase: ExecutionPanelWidget on left + flat activity stream on right. Non-execution: ChatPanelWidget on left + QuestSpecPanelWidget on right (with external-update banner + clarify panel + abandon). Owns the QuestApprovedModalWidget toggle so the modal opens once on the approved transition and is dismissable.
 *
 * USAGE:
 * <QuestLiveWorkspaceLayerWidget questId={questId} guildSlug={guildSlug} />
 * // Returns the workspace view; mounts useQuestChatBinding internally so the binding only runs on the live route.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mantine/core';

import type {
  ChatEntry,
  Quest,
  QuestId,
  QuestStatus,
  UrlSlug,
  UserInput,
} from '@dungeonmaster/shared/contracts';
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
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
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

export interface QuestLiveWorkspaceLayerWidgetProps {
  questId: QuestId;
  guildSlug?: UrlSlug;
}

export const QuestLiveWorkspaceLayerWidget = ({
  questId,
  guildSlug,
}: QuestLiveWorkspaceLayerWidgetProps): React.JSX.Element => {
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
  } = useQuestChatBinding({
    questId,
  });

  const flattenedEntries = useMemo<ChatEntry[]>(() => {
    const all: ChatEntry[] = [];
    for (const list of entriesBySession.values()) {
      all.push(...list);
    }
    return all;
  }, [entriesBySession]);

  const [externalUpdatePending, setExternalUpdatePending] = useState(false);
  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const prevQuestRef = useRef<Quest | null>(null);
  const prevQuestStatusRef = useRef<QuestStatus | null>(null);

  // Detect agent-side quest mutations after the user has loaded the editor —
  // the QuestSpecPanelWidget surfaces this via an EXTERNAL_UPDATE_BANNER so the
  // user can RELOAD or KEEP EDITING.
  useEffect(() => {
    if (quest !== prevQuestRef.current && prevQuestRef.current !== null) {
      setExternalUpdatePending(true);
    }
    prevQuestRef.current = quest;
  }, [quest]);

  // Open the Begin-Quest modal only on the rising edge into 'approved' so it's
  // dismissable; once status changes the modal can re-arm.
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

  if (quest === null) {
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

  const { colors } = emberDepthsThemeStatics;

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
        if (guildSlug === undefined) return;
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
            // Other gate-approved statuses (approved, design_approved): deliberately
            // no follow-up message — the agent's response could call modify-quest and
            // revert the status before the user clicks Begin Quest, which would race
            // with the start POST and silently fail. The user-driven Begin Quest
            // button is the intended trigger for the next phase.
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
            {...(guildSlug ? { guildSlug } : {})}
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
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
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
