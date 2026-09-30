import { randomUUID } from '#gateway/node/crypto';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { chatHistoryReplayBrokerProxy } from '../../../brokers/chat/history-replay/chat-history-replay-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { ChatReplayResponder } from './chat-replay-responder';

const EVENT_TYPES: readonly OrchestrationEventType[] = [
  'chat-output',
  'quest-session-linked',
  'chat-history-complete',
] as const;

export const ChatReplayResponderProxy = (): {
  callResponder: typeof ChatReplayResponder;
  setupGuild: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupGuild'];
  setupMainSession: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupMainSession'];
  setupSubagentDir: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupSubagentDir'];
  setupSubagentFile: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupSubagentFile'];
  setupSubagentDirMissing: ReturnType<
    typeof chatHistoryReplayBrokerProxy
  >['setupSubagentDirMissing'];
  setupQuestsPath: ReturnType<typeof questListBrokerProxy>['setupQuestsPath'];
  setupQuestDirectories: ReturnType<typeof questListBrokerProxy>['setupQuestDirectories'];
  setupQuestDirectoriesFailure: ReturnType<
    typeof questListBrokerProxy
  >['setupQuestDirectoriesFailure'];
  setupQuestFilePath: ReturnType<typeof questListBrokerProxy>['setupQuestFilePath'];
  setupQuestFile: ReturnType<typeof questListBrokerProxy>['setupQuestFile'];
  setupQuestSession: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupQuestSession'];
  setupQuestWorktree: ReturnType<typeof chatHistoryReplayBrokerProxy>['setupQuestWorktree'];
  setupQuestWorktreeMissing: ReturnType<
    typeof chatHistoryReplayBrokerProxy
  >['setupQuestWorktreeMissing'];
  setPort: ReturnType<typeof chatHistoryReplayBrokerProxy>['setPort'];
  setupEventCapture: () => {
    getEmittedEvents: () => readonly {
      type: OrchestrationEventType;
      processId: string;
      payload: Record<PropertyKey, unknown>;
    }[];
  };
} => {
  isFsErrorProxy();
  const historyProxy = chatHistoryReplayBrokerProxy();
  const questListProxy = questListBrokerProxy();
  orchestrationEventsStateProxy();

  registerMock({ fn: randomUUID }).calledWith([]).returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: ChatReplayResponder,
    setupGuild: historyProxy.setupGuild,
    setupMainSession: historyProxy.setupMainSession,
    setupSubagentDir: historyProxy.setupSubagentDir,
    setupSubagentFile: historyProxy.setupSubagentFile,
    setupSubagentDirMissing: historyProxy.setupSubagentDirMissing,
    setupQuestsPath: questListProxy.setupQuestsPath,
    setupQuestDirectories: questListProxy.setupQuestDirectories,
    setupQuestDirectoriesFailure: questListProxy.setupQuestDirectoriesFailure,
    setupQuestFilePath: questListProxy.setupQuestFilePath,
    setupQuestFile: questListProxy.setupQuestFile,
    setupQuestSession: historyProxy.setupQuestSession,
    setupQuestWorktree: historyProxy.setupQuestWorktree,
    setupQuestWorktreeMissing: historyProxy.setupQuestWorktreeMissing,
    setPort: historyProxy.setPort,
    setupEventCapture: () => {
      const emittedEvents: {
        type: OrchestrationEventType;
        processId: string;
        payload: Record<PropertyKey, unknown>;
      }[] = [];

      for (const eventType of EVENT_TYPES) {
        orchestrationEventsState.on({
          type: eventType,
          handler: ({ processId, payload }) => {
            emittedEvents.push({ type: eventType, processId, payload });
          },
        });
      }

      return { getEmittedEvents: () => emittedEvents };
    },
  };
};
