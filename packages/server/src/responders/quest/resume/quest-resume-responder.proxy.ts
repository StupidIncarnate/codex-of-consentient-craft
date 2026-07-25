import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorPlayDispatchAdapterProxy } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.proxy';
import { orchestratorResumeQuestAdapterProxy } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.proxy';
import { QuestResumeResponder } from './quest-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestResumeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupResumeQuest: (params: { resumed: boolean; restoredStatus: QuestStatus }) => void;
  setupResumeQuestError: (params: { message: string }) => void;
  setupDispatchPlays: () => void;
  setupDispatchRefused: (params: { reason: string }) => void;
  setupDispatchError: (params: { message: string }) => void;
  getDispatchPlayCalls: () => readonly unknown[];
  callResponder: typeof QuestResumeResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorResumeQuestAdapterProxy();
  const playProxy = orchestratorPlayDispatchAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupResumeQuest: ({
      resumed,
      restoredStatus,
    }: {
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      adapterProxy.returns({ resumed, restoredStatus });
    },
    setupResumeQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
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

    callResponder: QuestResumeResponder,
  };
};
