import type { StubArgument } from '../../@types/stub-argument.type';

import { QuestWorkItemIdStub } from '../quest-work-item-id/quest-work-item-id.stub';
import { workItemForUpsertContract } from './work-item-for-upsert-contract';
import type { WorkItemForUpsert } from './work-item-for-upsert-contract';

export const WorkItemForUpsertStub = ({
  ...props
}: StubArgument<WorkItemForUpsert> = {}): WorkItemForUpsert =>
  workItemForUpsertContract.parse({
    id: QuestWorkItemIdStub(),
    ...props,
  });
