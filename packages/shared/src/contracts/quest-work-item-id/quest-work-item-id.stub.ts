import { workItemContract } from '../work-item/work-item-contract';

type QuestWorkItemId = ReturnType<typeof workItemContract.shape.id.parse>;

const questWorkItemIdContract = workItemContract.shape.id;

export const QuestWorkItemIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): QuestWorkItemId => questWorkItemIdContract.parse(value);
