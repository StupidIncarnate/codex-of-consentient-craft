import {
  QuestIdStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';
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
