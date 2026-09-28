import { registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';

// Explicit factory: a bare `registerMock({ fn: StartOrchestrator.<method> })` inside the adapter
// proxies below hoists into a factory-less `jest.mock('@dungeonmaster/orchestrator')` that
// automocks the whole barrel, and every class it exports comes back as a stub whose `instanceof`
// no longer holds. No spread from jest.requireActual either — this responder's whole dependent
// tree (its adapters, its contract, its guard) only ever imports StartOrchestrator off this
// module, so StartOrchestrator is the only export the factory needs to supply.
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    StartOrchestrator: {
      getQuest: jest.fn(),
      startQuest: jest.fn(),
      playDispatch: jest.fn(),
    },
  }),
});

import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
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
  setupDispatchError: (params: { message: string }) => void;
  getDispatchPlayCalls: () => RecordedCalls;
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

    // The Node dispatcher starts — the ordinary case.
    setupDispatchPlays: (): void => {
      playProxy.returns({ state: DispatchStateStub({ mode: 'node-playing' }) });
    },
    setupDispatchError: ({ message }: { message: string }): void => {
      playProxy.throws({ error: new Error(message) });
    },
    getDispatchPlayCalls: (): RecordedCalls => playProxy.getCalls(),

    callResponder: QuestStartResponder,
  };
};
