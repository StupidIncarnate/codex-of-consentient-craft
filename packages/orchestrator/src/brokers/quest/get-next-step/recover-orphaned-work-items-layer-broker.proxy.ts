import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questSplicePathseekerReplanBrokerProxy } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const recoverOrphanedWorkItemsLayerBrokerProxy = (): {
  setupModifyForQuest: (params: { quest: Quest }) => void;
  setupEscalation: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getReplanCalls: () => readonly (readonly unknown[])[];
  getLastPersistedQuest: () => Quest;
} => {
  const modifyProxy = questModifyBrokerProxy();
  // A budget-exhausted orphan escalates to questSplicePathseekerReplanBroker — stubbed here so the
  // reset path never triggers a real replan; setupEscalation lets a test assert the escalation.
  const replanProxy = questSplicePathseekerReplanBrokerProxy();

  return {
    setupModifyForQuest: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      replanProxy.setupReplanned();
    },
    setupEscalation: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      replanProxy.setupReplanned();
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
    getReplanCalls: (): readonly (readonly unknown[])[] => replanProxy.getCalls(),
    getLastPersistedQuest: (): Quest => {
      const persisted = modifyProxy.getAllPersistedContents();
      const last = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(last)));
    },
  };
};
