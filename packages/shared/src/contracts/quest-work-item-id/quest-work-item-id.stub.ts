import { questWorkItemIdContract } from './quest-work-item-id-contract';

type QuestWorkItemId = ReturnType<typeof questWorkItemIdContract.parse>;

export const QuestWorkItemIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): QuestWorkItemId => questWorkItemIdContract.parse(value);
