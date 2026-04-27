/**
 * PURPOSE: Renders the live questId-keyed quest workspace — execution panel for execution phase, chat input panel otherwise. Pulls all live state from useQuestChatBinding via props.
 *
 * USAGE:
 * <QuestLiveWorkspaceLayerWidget questId={questId} guildSlug={guildSlug} />
 * // Returns the workspace view; mounts useQuestChatBinding internally so the binding only runs on the live route.
 */

import { useMemo } from 'react';

import { Box } from '@mantine/core';

import type { ChatEntry, QuestId, QuestStatus, UrlSlug } from '@dungeonmaster/shared/contracts';
import {
  isAbandonableQuestStatusGuard,
  isUserPausedQuestStatusGuard,
  shouldRenderExecutionPanelQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { questAbandonBroker } from '../../brokers/quest/abandon/quest-abandon-broker';
import { questModifyBroker } from '../../brokers/quest/modify/quest-modify-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { ExecutionPanelWidget } from '../execution-panel/execution-panel-widget';

export interface QuestLiveWorkspaceLayerWidgetProps {
  questId: QuestId;
  guildSlug?: UrlSlug;
}

export const QuestLiveWorkspaceLayerWidget = ({
  questId,
  guildSlug,
}: QuestLiveWorkspaceLayerWidgetProps): React.JSX.Element => {
  const { quest, entriesBySession, isStreaming, sendMessage, stopChat } = useQuestChatBinding({
    questId,
  });

  const flattenedEntries = useMemo<ChatEntry[]>(() => {
    const all: ChatEntry[] = [];
    for (const list of entriesBySession.values()) {
      all.push(...list);
    }
    return all;
  }, [entriesBySession]);

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

  const displayStatus: QuestStatus =
    isUserPausedQuestStatusGuard({ status: quest.status }) &&
    quest.pausedAtStatus !== undefined &&
    quest.pausedAtStatus !== null
      ? quest.pausedAtStatus
      : quest.status;
  const isExecutionPhase = shouldRenderExecutionPanelQuestStatusGuard({ status: displayStatus });

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
            {...(isAbandonableQuestStatusGuard({ status: quest.status })
              ? {
                  onAbandon: (): void => {
                    questAbandonBroker({ questId: quest.id }).catch((abandonError: unknown) => {
                      globalThis.console.error('[quest-chat] abandon failed', abandonError);
                    });
                  },
                }
              : {})}
          />
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
          entries={flattenedEntries}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
          onStopChat={stopChat}
        />
      </Box>
    </Box>
  );
};
