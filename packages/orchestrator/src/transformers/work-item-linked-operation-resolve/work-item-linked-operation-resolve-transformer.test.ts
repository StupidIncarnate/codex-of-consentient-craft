import { OperationItemStub, QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemLinkedOperationResolveTransformer } from './work-item-linked-operation-resolve-transformer';

describe('workItemLinkedOperationResolveTransformer', () => {
  it("VALID: {work item linked via 'operations/<id>'} => resolves the matching operation item", () => {
    const operationItem = OperationItemStub({
      id: '00000000-0000-4000-8000-000000000001',
      role: 'siegemaster',
    });
    const workItem = WorkItemStub({
      relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
    });
    const quest = QuestStub({ operations: [operationItem] });

    const result = workItemLinkedOperationResolveTransformer({ quest, workItem });

    expect(result).toStrictEqual(operationItem);
  });

  it('EMPTY: {work item with no operations/ ref} => resolves undefined', () => {
    const workItem = WorkItemStub({ relatedDataItems: [] });
    const quest = QuestStub({ operations: [] });

    const result = workItemLinkedOperationResolveTransformer({ quest, workItem });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {ref names an operation item absent from the quest} => resolves undefined', () => {
    const workItem = WorkItemStub({
      relatedDataItems: ['operations/00000000-0000-4000-8000-000000000009'],
    });
    const quest = QuestStub({ operations: [] });

    const result = workItemLinkedOperationResolveTransformer({ quest, workItem });

    expect(result).toBe(undefined);
  });
});
