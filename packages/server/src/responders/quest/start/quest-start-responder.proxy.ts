import { registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';

// Explicit factory so the rest of the orchestrator barrel stays REAL: a bare
// `registerMock({ fn: StartOrchestrator.<method> })` inside the adapter proxies below hoists into a
// factory-less `jest.mock('@dungeonmaster/orchestrator')` that automocks the whole barrel, and every
// class it exports comes back as a stub whose `instanceof` no longer holds.
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/orchestrator'),
    StartOrchestrator: {
      getQuest: jest.fn(),
      startQuest: jest.fn(),
      playDispatch: jest.fn(),
    },
  }),
});

import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorPlayDispatchAdapterProxy } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const QuestStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupStartQuest: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestError: (params: { questId: QuestId; message: string }) => void;
  setupDispatchPlays: () => void;
  setupDispatchRefused: (params: { reason: string }) => void;
  setupDispatchError: (params: { message: string }) => void;
  getDispatchPlayCalls: () => readonly unknown[];
  callResponder: typeof QuestStartResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartQuestAdapterProxy();
  const playProxy = orchestratorPlayDispatchAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupStartQuest: ({ questId, processId }: { questId: QuestId; processId: ProcessId }): void => {
      adapterProxy.returns({ questId, processId });
    },
    setupStartQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },

    // The Node dispatcher accepts the play — the ordinary case, where nothing else owns the queue.
    setupDispatchPlays: (): void => {
      playProxy.returns({ response: DispatchPlayResponseStub({ allowed: true }) });
    },
    // The exclusivity gate refuses: a live /dumpster-launch loop still owns the queue.
    setupDispatchRefused: ({ reason }: { reason: string }): void => {
      playProxy.returns({
        response: DispatchPlayResponseStub({ allowed: false, reason: reason as never }),
      });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      playProxy.throws({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): readonly unknown[] => playProxy.getCalls(),

    callResponder: QuestStartResponder,
  };
};
