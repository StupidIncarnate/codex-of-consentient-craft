import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import type { WorkItemStatusStub } from '@dungeonmaster/shared/contracts/work-item-status/work-item-status.stub';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import type { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { questGetBroker } from '../get/quest-get-broker';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questSessionWallRecordBroker } from '../session-wall-record/quest-session-wall-record-broker';
import { questSessionWallRecordBrokerProxy } from '../session-wall-record/quest-session-wall-record-broker.proxy';

// Both have their own suites — the quest read's fs walk and the wall record's locked write. Here the
// read supplies one status and the record's ARGUMENTS are what is under test, so both are mocked at
// the module boundary.
registerModuleMock({ module: '../get/quest-get-broker' });
registerModuleMock({ module: '../session-wall-record/quest-session-wall-record-broker' });

type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
type SpawnInstruction = ReturnType<typeof SpawnInstructionStub>;
type WorkItemStatus = ReturnType<typeof WorkItemStatusStub>;

export const sessionEndLayerBrokerProxy = (): {
  setupWorkItemStatus: (params: {
    questId: SpawnInstruction['questId'];
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => void;
  setupWorkItemAbsent: (params: { questId: SpawnInstruction['questId'] }) => void;
  setupWallRecordSucceeds: (params: {
    questId: SpawnInstruction['questId'];
    workItemId: QuestWorkItemId;
  }) => void;
  getWallRecordInputs: () => readonly unknown[];
  getStderrLines: () => readonly unknown[];
} => {
  questGetBrokerProxy();
  questSessionWallRecordBrokerProxy();
  const stderrChild = stderrProxy();
  const getMock = registerMock({ fn: questGetBroker });
  const wallMock = registerMock({ fn: questSessionWallRecordBroker });

  return {
    setupWorkItemStatus: ({
      questId,
      workItemId,
      status,
    }: {
      questId: SpawnInstruction['questId'];
      workItemId: QuestWorkItemId;
      status: WorkItemStatus;
    }): void => {
      getMock.calledWith([{ input: { questId } }]).resolves(
        GetQuestResultStub({
          success: true,
          quest: QuestStub({ workItems: [WorkItemStub({ id: workItemId, status })] }),
        }),
      );
      wallMock.calledWith([{ questId, workItemId }]).resolves(null);
    },

    setupWorkItemAbsent: ({ questId }: { questId: SpawnInstruction['questId'] }): void => {
      getMock
        .calledWith([{ input: { questId } }])
        .resolves(GetQuestResultStub({ success: true, quest: QuestStub({ workItems: [] }) }));
    },

    setupWallRecordSucceeds: ({
      questId,
      workItemId,
    }: {
      questId: SpawnInstruction['questId'];
      workItemId: QuestWorkItemId;
    }): void => {
      wallMock.calledWith([{ questId, workItemId }]).resolves(null);
    },

    getWallRecordInputs: (): readonly unknown[] =>
      wallMock.callsMatching([]).map((call) => call[0]),

    getStderrLines: (): readonly unknown[] => stderrChild.getWrites().map((chunk) => String(chunk)),
  };
};
