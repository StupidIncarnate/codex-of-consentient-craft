import { workItemForUpsertContract } from './work-item-for-upsert-contract';
import { WorkItemForUpsertStub } from './work-item-for-upsert.stub';
import { QuestWorkItemIdStub } from '../quest-work-item-id/quest-work-item-id.stub';

describe('workItemForUpsertContract', () => {
  it('VALID: {id only} => parses successfully', () => {
    const id = QuestWorkItemIdStub();
    const result = workItemForUpsertContract.parse({ id });

    expect(result).toStrictEqual({
      id,
      assignedUnitIds: [],
      attempt: 0,
      dependsOn: [],
      maxAttempts: 1,
      observations: [],
      relatedDataItems: [],
      retryCount: 0,
    });
  });

  it('VALID: {via stub} => parses successfully', () => {
    const id = QuestWorkItemIdStub();
    const result = WorkItemForUpsertStub({ id });

    expect(result).toStrictEqual({
      id,
      assignedUnitIds: [],
      attempt: 0,
      dependsOn: [],
      maxAttempts: 1,
      observations: [],
      relatedDataItems: [],
      retryCount: 0,
    });
  });
});
