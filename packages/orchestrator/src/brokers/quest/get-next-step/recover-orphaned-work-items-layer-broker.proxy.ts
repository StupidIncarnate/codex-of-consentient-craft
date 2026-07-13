import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const recoverOrphanedWorkItemsLayerBrokerProxy = (): {
  setupModifyForQuest: (params: { quest: Quest }) => void;
  setupEscalation: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getBlockCalls: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
} => {
  const modifyProxy = questModifyBrokerProxy();
  // A budget-exhausted orphan escalates to questBlockOnFailureBroker — stubbed here (the block
  // proxy's default resolves { blocked: true }) so the reset path never runs a real block;
  // getBlockCalls lets a test assert the escalation.
  questBlockOnFailureBrokerProxy();
  const blockMock = questBlockOnFailureBroker as jest.MockedFunction<
    typeof questBlockOnFailureBroker
  >;

  return {
    setupModifyForQuest: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    setupEscalation: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
    getBlockCalls: (): readonly unknown[] => blockMock.mock.calls.map((call) => call[0]),
    getLastPersistedQuest: (): Quest => {
      const persisted = modifyProxy.getAllPersistedContents();
      const last = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(last)));
    },
  };
};
