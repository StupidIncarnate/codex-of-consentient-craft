import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { QuestFindByWorkItemIdResponderProxy } from './quest-find-by-work-item-id-responder.proxy';

describe('QuestFindByWorkItemIdResponder', () => {
  it('VALID: {broker returns questId} => responder returns same questId', async () => {
    const proxy = QuestFindByWorkItemIdResponderProxy();
    const questId = QuestIdStub({ value: 'q-resp-1' });
    const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-100000000001' });

    proxy.setupBrokerReturns({ questId });

    const result = await proxy.callResponder({ workItemId });

    expect(result).toBe(questId);
  });

  it('EMPTY: {broker returns null} => responder returns null', async () => {
    const proxy = QuestFindByWorkItemIdResponderProxy();
    const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-100000000002' });

    proxy.setupBrokerReturns({ questId: null });

    const result = await proxy.callResponder({ workItemId });

    expect(result).toBe(null);
  });
});
