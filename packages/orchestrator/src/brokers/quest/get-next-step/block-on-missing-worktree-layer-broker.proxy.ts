import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const blockOnMissingWorktreeLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getBlockCalls: () => readonly unknown[];
  getCallInputs: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();
  // The failure-routing path is stubbed here (the block proxy's default resolves
  // { blocked: true }) so a call-args assertion never depends on questBlockOnFailureBroker's own
  // internals — those are covered by its own test suite. getBlockCalls reaches around the
  // proxy's semantic surface (it exposes no call-inspection method of its own) the same way
  // recoverOrphanedWorkItemsLayerBrokerProxy does.
  questBlockOnFailureBrokerProxy();
  const blockMock = questBlockOnFailureBroker as jest.MockedFunction<
    typeof questBlockOnFailureBroker
  >;

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getBlockCalls: (): readonly unknown[] => blockMock.mock.calls.map((call) => call[0]),
    getCallInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),
  };
};
