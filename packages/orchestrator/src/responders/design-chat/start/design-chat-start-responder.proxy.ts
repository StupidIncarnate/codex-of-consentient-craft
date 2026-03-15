import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';
import type { ExitCodeStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { chatSpawnBrokerProxy } from '../../../brokers/chat/spawn/chat-spawn-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { DesignChatStartResponder } from './design-chat-start-responder';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStub>;

const EVENT_TYPES: readonly OrchestrationEventType[] = [
  'chat-output',
  'chat-patch',
  'chat-complete',
  'quest-session-linked',
] as const;

export const DesignChatStartResponderProxy = (): {
  callResponder: typeof DesignChatStartResponder;
  setupDesignSession: (params: {
    exitCode: ExitCode;
    quest: Quest;
    stdoutLines?: readonly string[];
  }) => void;
  setupQuestNotFound: () => void;
  setupInvalidStatus: (params: { quest: Quest }) => void;
  setupProcessEmpty: ReturnType<typeof orchestrationProcessesStateProxy>['setupEmpty'];
  setupEventCapture: () => {
    getEmittedEvents: () => readonly {
      type: OrchestrationEventType;
      processId: ProcessId;
      payload: Record<PropertyKey, unknown>;
    }[];
  };
} => {
  const spawnProxy = chatSpawnBrokerProxy();
  questModifyBrokerProxy();
  const processStateProxy = orchestrationProcessesStateProxy();
  orchestrationEventsStateProxy();

  return {
    callResponder: DesignChatStartResponder,

    setupDesignSession: ({ exitCode, quest, stdoutLines }): void => {
      spawnProxy.setupGlyphsmithSession({
        exitCode,
        quest,
        ...(stdoutLines && { stdoutLines }),
      });
    },

    setupQuestNotFound: (): void => {
      spawnProxy.setupQuestNotFound();
    },

    setupInvalidStatus: ({ quest }): void => {
      spawnProxy.setupInvalidStatus({ quest });
    },

    setupProcessEmpty: processStateProxy.setupEmpty,

    setupEventCapture: () => {
      const emittedEvents: {
        type: OrchestrationEventType;
        processId: ProcessId;
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
