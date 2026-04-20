import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';
import type { ExitCodeStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

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
  'chat-complete',
  'chat-session-started',
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
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
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
  const modifyProxy = questModifyBrokerProxy();
  const processStateProxy = orchestrationProcessesStateProxy();
  orchestrationEventsStateProxy();
  const stderrSpy: { current: SpyOnHandle | null } = { current: null };

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

    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): void => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      stderrSpy.current = handle;
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrSpy.current?.mock.calls.map((call: readonly unknown[]) => call[0]) ?? [],

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
