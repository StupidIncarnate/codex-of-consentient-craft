import { OperationItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { workItemFamilyResolveTransformer } from './work-item-family-resolve-transformer';

describe('workItemFamilyResolveTransformer', () => {
  it("VALID: {operationItem.role: 'siegemaster'} => resolves family 'siegemaster'", () => {
    const quest = QuestStub({ questType: 'feature' });
    const operationItem = OperationItemStub({ role: 'siegemaster' });

    const result = workItemFamilyResolveTransformer({ quest, operationItem });

    expect(result).toBe('siegemaster');
  });

  it("VALID: {operationItem.role: 'ward'} => resolves family 'wardFull', not 'ward'", () => {
    const quest = QuestStub({ questType: 'feature' });
    const operationItem = OperationItemStub({ role: 'ward' });

    const result = workItemFamilyResolveTransformer({ quest, operationItem });

    expect(result).toBe('wardFull');
  });

  it("VALID: {questType: 'bug-hunt', operationItem.role: 'codeweaver'} => resolves family 'codeweaver'", () => {
    const quest = QuestStub({ questType: 'bug-hunt' });
    const operationItem = OperationItemStub({ role: 'codeweaver' });

    const result = workItemFamilyResolveTransformer({ quest, operationItem });

    expect(result).toBe('codeweaver');
  });

  it("EMPTY: {operationItem.role: 'spiritmender'} => resolves undefined, no family owns that role", () => {
    const quest = QuestStub({ questType: 'feature' });
    const operationItem = OperationItemStub({ role: 'spiritmender' });

    const result = workItemFamilyResolveTransformer({ quest, operationItem });

    expect(result).toBe(undefined);
  });
});
