/**
 * PURPOSE: Renders the quest workspace for `/:guildSlug/quest` (no questId — placeholder pointing at `/dumpster-create`) and `/:guildSlug/quest/:questId` (live workspace with chat + spec/execution panels).
 *
 * USAGE:
 * <QuestChatContentLayerWidget questId={questId} guildId={guildId} guildSlug={guildSlug} />
 * // questId === null → placeholder banner instructing the user to run `/dumpster-create` in their Claude session. Quest creation happens via the ChaosWhisperer slash command, not the web UI.
 * // questId set → live workspace. The binding subscribes, layout transitions to ChatPanel+SpecPanel (spec phase) or full-width ExecutionPanel (execution phase). Execution view shows a `/dumpster-launch` banner.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Stack, Text } from '@mantine/core';

import type {
  ChatEntry,
  GuildId,
  QuestId,
  QuestStatus,
  QuestType,
  UrlSlug,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import {
  isAbandonableQuestStatusGuard,
  isQuestResumableQuestStatusGuard,
  isUserPausedQuestStatusGuard,
  shouldRenderExecutionPanelQuestStatusGuard,
  shouldShowBeginQuestModalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { previousReviewQuestStatusTransformer } from '@dungeonmaster/shared/transformers';

import { useCommentQueueSweepBinding } from '../../bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding';
import { useOrchestrationModeBinding } from '../../bindings/use-orchestration-mode/use-orchestration-mode-binding';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { questAbandonBroker } from '../../brokers/quest/abandon/quest-abandon-broker';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { questNewBroker } from '../../brokers/quest/new/quest-new-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import { dropdownOptionContract } from '../../contracts/dropdown-option/dropdown-option-contract';
import type { DropdownOption } from '../../contracts/dropdown-option/dropdown-option-contract';
import { hasEquivalentChatEntryGuard } from '../../guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { questTypeOptionsStatics } from '../../statics/quest-type-options/quest-type-options-statics';
import { sortChatEntriesByTimestampTransformer } from '../../transformers/sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterCommandBannerWidget } from '../dumpster-command-banner/dumpster-command-banner-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';
import { FormDropdownWidget } from '../form-dropdown/form-dropdown-widget';
import { QuestApprovedModalWidget } from '../quest-approved-modal/quest-approved-modal-widget';
import { QuestLoadErrorWidget } from '../quest-load-error/quest-load-error-widget';
import { QuestSpecPanelWidget } from '../quest-spec-panel/quest-spec-panel-widget';

const NO_QUEST_BANNER_MESSAGE = displayLabelContract.parse(
  'Quests are created in your Claude session. Run this slash command to start a spec conversation:',
);
const DUMPSTER_CREATE_COMMAND = displayLabelContract.parse('/dumpster-create');

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
  // orchestrationMode gates the create-quest surface: `node` = web-driven (chat + dumpster loader,
  // first message creates the quest and launches ChaosWhisperer); `claude` = terminal-driven via
  // /dumpster-create (placeholder banner + ?chat=hidden honored).
  const { mode, isLoading: modeLoading } = useOrchestrationModeBinding();
  const isNodeMode = mode === 'node';

  // Quest-route mount purge. Called unconditionally above every early return so it runs on every
  // mount of this route, and it sweeps EVERY quest's comment-queue key — not just this one's — so
  // abandoned reviews on quests the user never reopens cannot pile up in localStorage forever.
  useCommentQueueSweepBinding();

  // `?chat=hidden` suppresses the ChatPanel sub-tree while leaving the chat binding subscribed (it's
  // called below at this layer, above the panel). Honored by default so the /dumpster-create flow's
  // terminal session owns the chat surface; only ignored in `node` mode where the web owns it.
  const location = useLocation();
  const chatHidden = !isNodeMode && new URLSearchParams(location.search).get('chat') === 'hidden';

  const navigate = useNavigate();

  // Calls below are unconditional so the hooks rule stays satisfied even when
  // questId is null. The binding tolerates a null questId by returning an
  // inert state (empty entries, no streaming, no subscription).
  const {
    quest,
    loadError,
    entriesBySession,
    entriesByWorkItem,
    isStreaming,
    armStreaming,
    disarmStreaming,
    pendingClarification,
    sendMessage,
    sendCommentBatch,
    submitClarifyAnswers,
    stopChat,
  } = useQuestChatBinding({ questId });

  // Node-mode first-message flow: the user's first message lives in localEntries until the binding's
  // replay catches up (the binding boots fresh entries on each questId change, so without this the
  // message would vanish during the questId param transition after quest creation).
  const [localEntries, setLocalEntries] = useState<ChatEntry[]>([]);

  // Which pipeline the first message creates. Only read on the no-questId create path; once the
  // quest exists its type is settled on disk and the dropdown is gone.
  const [questTypeLabel, setQuestTypeLabel] = useState<DropdownOption>(
    dropdownOptionContract.parse(questTypeOptionsStatics.defaultLabel),
  );
  const selectedQuestType: QuestType =
    questTypeOptionsStatics.options.find((option) => option.label === String(questTypeLabel))
      ?.questType ?? 'feature';

  const flattenedEntries = useMemo<ChatEntry[]>(() => {
    const all: ChatEntry[] = [];
    for (const list of entriesBySession.values()) {
      all.push(...list);
    }
    const localFiltered = localEntries.filter(
      (entry) => !hasEquivalentChatEntryGuard({ entry, among: all }),
    );
    return sortChatEntriesByTimestampTransformer({ entries: [...localFiltered, ...all] });
  }, [entriesBySession, localEntries]);

  const handleStop = useCallback((): void => {
    // Disarm locally as well as pausing: a STOP that fires before the agent ever emitted has no
    // turn end coming, so waiting for the wire would leave the input showing STOP forever.
    disarmStreaming();
    stopChat();
  }, [disarmStreaming, stopChat]);

  const handleSend = useCallback(
    ({ message }: { message: UserInput }): void => {
      if (questId !== null) {
        // Normal path — binding handles user message, resume-if-paused, POST.
        sendMessage({ message });
        return;
      }
      // First-message path — create the quest, then replace-navigate so the SAME component instance
      // keeps rendering with questId set; localEntries keeps the message visible until replay catches up.
      if (isStreaming) return;
      const userEntry = chatEntryContract.parse({
        role: 'user',
        content: message,
        uuid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      setLocalEntries((prev) => [...prev, userEntry]);
      // The binding cannot arm this turn itself — there is no questId to POST to until the quest
      // exists — so the caller that owns the round-trip arms it. The wire disarms it like any other.
      armStreaming();
      questNewBroker({ guildId, message, questType: selectedQuestType })
        .then(({ questId: newQuestId }) => {
          const result = navigate(`/${guildSlug}/quest/${newQuestId}`, { replace: true });
          if (result instanceof Promise) {
            result.catch((navError: unknown) => {
              globalThis.console.error('[quest-chat] new-chat navigate failed', navError);
            });
          }
        })
        .catch((err: unknown) => {
          disarmStreaming();
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
            uuid: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          });
          setLocalEntries((prev) => [...prev, errorEntry]);
        });
    },
    [
      questId,
      sendMessage,
      isStreaming,
      armStreaming,
      disarmStreaming,
      guildId,
      guildSlug,
      navigate,
      selectedQuestType,
    ],
  );

  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const prevQuestStatusRef = useRef<QuestStatus | null>(null);

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

  // No quest object yet. Three cases, gated by orchestrationMode:
  //  - mode still loading → full-panel dumpster loader (avoids flashing the wrong create surface).
  //  - claude mode + no questId → the /dumpster-create placeholder banner (terminal owns creation).
  //  - otherwise (node mode either questId case; claude mode with questId set but quest not replayed)
  //    → the dual-panel chat surface. In node mode the first message creates the quest (handleSend)
  //    and the right panel is the dumpster loader; in claude mode it's the "Awaiting..." box.
  // A load that definitively FAILED, ahead of every no-quest-yet branch below: those all read as
  // "still loading", and a quest.json the contract rejects will never arrive, so leaving the reader
  // on a loading surface hides the failure completely. questId is non-null whenever loadError is
  // set — the binding only subscribes, and only matches this event, for a quest it was given.
  if (quest === null && loadError !== null && questId !== null) {
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
        <QuestLoadErrorWidget questId={questId} reason={loadError} />
      </Box>
    );
  }

  if (quest === null) {
    if (modeLoading) {
      return (
        <Box
          data-testid="QUEST_CHAT"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          <DumpsterRaccoonWidget />
        </Box>
      );
    }

    if (!isNodeMode && questId === null) {
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
              The spec conversation runs in your Claude session. Once the quest is created, this
              page will open to its spec view automatically.
            </Text>
          </Stack>
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
          <>
            <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Only on the create surface: once questId is set the quest's type is settled on
                  disk, and offering a control that cannot change it would be a lie. */}
              {questId === null ? (
                <Box
                  data-testid="QUEST_TYPE_PICKER"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
                    QUEST TYPE
                  </Text>
                  <FormDropdownWidget
                    value={questTypeLabel}
                    options={questTypeOptionsStatics.options.map((option) =>
                      dropdownOptionContract.parse(option.label),
                    )}
                    onChange={setQuestTypeLabel}
                  />
                </Box>
              ) : null}
              <ChatPanelWidget
                entries={flattenedEntries}
                isStreaming={isStreaming}
                onSendMessage={handleSend}
                onStopChat={handleStop}
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
          {isNodeMode ? (
            <DumpsterRaccoonWidget />
          ) : (
            <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], padding: 16 }}>
              Awaiting quest activity...
            </Text>
          )}
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
      onSendComments={sendCommentBatch}
      onModify={({ modifications, nextStatus }): void => {
        questModifyBroker({ questId: quest.id, modifications })
          .then(() => {
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
            workItemEntries={entriesByWorkItem}
            guildSlug={guildSlug}
            onStatusChange={({ status }): void => {
              // Both halts — a user pause and a `blocked` quest — go through the resume endpoint,
              // never a bare status PATCH. Resume is what rearms the work items a block left as
              // wreckage (failed-at-budget, drained-to-skipped) and starts the dispatcher; a PATCH
              // would flip the status back and let the next scan re-block on the same item.
              if (isQuestResumableQuestStatusGuard({ status: quest.status })) {
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
            onSendMessage={handleSend}
            onStopChat={handleStop}
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
