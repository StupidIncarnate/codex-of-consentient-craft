import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemRoleStub } from '@dungeonmaster/shared/contracts/work-item-role/work-item-role.stub';
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { linkedQuestInfoContract } from './linked-quest-info-contract';
import type { LinkedQuestInfo } from './linked-quest-info-contract';

export const LinkedQuestInfoStub = ({
  ...props
}: StubArgument<LinkedQuestInfo> = {}): LinkedQuestInfo =>
  linkedQuestInfoContract.parse({
    questId: QuestIdStub(),
    workItemId: QuestWorkItemIdStub(),
    role: WorkItemRoleStub(),
    ...props,
  });
