/**
 * PURPOSE: Renders the quest workspace for `/:guildSlug/quest` (no questId — placeholder pointing at `/dumpster-create`) and `/:guildSlug/quest/:questId` (live workspace with chat + spec/execution panels).
 *
 * USAGE:
 * <QuestChatContentLayerWidget questId={questId} guildId={guildId} guildSlug={guildSlug} />
 * // questId === null → placeholder banner instructing the user to run `/dumpster-create` in their Claude session. Quest creation happens via the ChaosWhisperer slash command, not the web UI.
 * // questId set → live workspace. The binding subscribes, layout transitions to ChatPanel+SpecPanel (spec phase) or full-width ExecutionPanel (execution phase). Execution view shows a `/dumpster-launch` banner.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Box, Stack, Text } from '@mantine/core';

import type {
  ChatEntry,
  GuildId,
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
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { sortChatEntriesByTimestampTransformer } from '../../transformers/sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterCommandBannerWidget } from '../dumpster-command-banner/dumpster-command-banner-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';
import { QuestApprovedModalWidget } from '../quest-approved-modal/quest-approved-modal-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

const NO_QUEST_BANNER_MESSAGE = displayLabelContract.parse(
  'Quests are created in your Claude session. Run this slash command to start a spec conversation:',
);
const DUMPSTER_CREATE_COMMAND = displayLabelContract.parse('/dumpster-create');

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
  guildSlug,
}: QuestChatContentLayerWidgetProps): React.JSX.Element => {
  // `?chat=hidden` suppresses the ChatPanel sub-tree while leaving the chat
  // binding subscribed (it's called below at this layer, above the panel).
  // Only the exact string `hidden` triggers — any other value renders normally.
  // Used by /dumpster-create so the user's terminal session owns the chat
  // surface while the web UI continues to render spec/execution panels.
  const location = useLocation();
  const chatHidden = new URLSearchParams(location.search).get('chat') === 'hidden';

  // Calls below are unconditional so the hooks rule stays satisfied even when
  // questId is null. The binding tolerates a null questId by returning an
  // inert state (empty entries, no streaming, no subscription).
  const {
    quest,
    entriesBySession,
    isStreaming,
    pendingClarification,
    sendMessage,
    submitClarifyAnswers,
    stopChat,
  } = useQuestChatBinding({ questId });

  const flattenedEntries = useMemo<ChatEntry[]>(() => {
    const all: ChatEntry[] = [];
    for (const list of entriesBySession.values()) {
      all.push(...list);
    }
    return sortChatEntriesByTimestampTransformer({ entries: all });
  }, [entriesBySession]);

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

  const { colors } = emberDepthsThemeStatics;

  // No questId in the URL — render the placeholder banner pointing at
  // `/dumpster-create`. Quest creation is owned by the user's Claude
  // session via the ChaosWhisperer slash command, not the web UI.
  if (questId === null) {
    return (
      <Box
        data-testid="QUEST_CHAT"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          padding: 16,
        }}
      >
        <Stack gap="md" data-testid="QUEST_CHAT_NO_QUEST_PLACEHOLDER">
          <DumpsterCommandBannerWidget
            message={NO_QUEST_BANNER_MESSAGE}
            command={DUMPSTER_CREATE_COMMAND}
          />
          <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
            The spec conversation runs in your Claude session. Once the quest is created, this page
            will open to its spec view automatically.
          </Text>
        </Stack>
      </Box>
    );
  }

  // questId is set but replay hasn't delivered the quest object yet —
  // render an awaiting surface with the chat panel still mounted so live
  // chat-output entries appear as they arrive.
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
        {chatHidden ? null : (
          <>
            <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ChatPanelWidget
                entries={flattenedEntries}
                isStreaming={isStreaming}
                onSendMessage={({ message }): void => {
                  sendMessage({ message });
                }}
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
          </>
        )}
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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DumpsterRaccoonWidget />
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
      {chatHidden ? null : (
        <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatPanelWidget
            entries={flattenedEntries}
            isStreaming={isStreaming}
            onSendMessage={({ message }): void => {
              sendMessage({ message });
            }}
            onStopChat={stopChat}
          />
        </Box>
      )}
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {specPanel}
      </Box>
      {beginQuestModal}
    </Box>
  );
};
