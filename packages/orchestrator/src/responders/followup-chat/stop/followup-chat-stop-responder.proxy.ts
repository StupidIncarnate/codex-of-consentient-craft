import type { ProcessIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { FollowupChatStopResponder } from './followup-chat-stop-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

export const FollowupChatStopResponderProxy = (): {
  callResponder: typeof FollowupChatStopResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupRunningProcessFor: (params: {
    quest: Quest;
    processId: ProcessId;
    questId: QuestId;
    workItemIndex: number;
  }) => jest.Mock;
  setupNoRunningProcess: () => void;
} => {
  const getProxy = questGetBrokerProxy();
  const processStateProxy = orchestrationProcessesStateProxy();
  processStateProxy.setupEmpty();

  return {
    callResponder: FollowupChatStopResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    // Registers a process against the work item at `workItemIndex` on `quest`, the way
    // chatSpawnBroker's own registerProcess callback does. The returned jest.Mock IS the kill the
    // responder must invoke — a test asserting the return flag alone passes on a responder that
    // deregistered the process without killing the child.
    setupRunningProcessFor: ({
      quest,
      processId,
      questId,
      workItemIndex,
    }: {
      quest: Quest;
      processId: ProcessId;
      questId: QuestId;
      workItemIndex: number;
    }): jest.Mock => {
      const workItem = quest.workItems[workItemIndex];
      if (workItem === undefined) {
        throw new Error(
          `FollowupChatStopResponderProxy.setupRunningProcessFor: no work item at index ${String(workItemIndex)}`,
        );
      }
      const kill = jest.fn();
      processStateProxy.setupWithProcessAndKill({
        processId,
        questId,
        questWorkItemId: workItem.id,
        kill,
      });
      return kill;
    },

    setupNoRunningProcess: (): void => {
      processStateProxy.setupEmpty();
    },
  };
};
