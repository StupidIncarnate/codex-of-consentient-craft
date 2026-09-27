import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { QuestFindByWorkItemIdResponderProxy } from './quest-find-by-work-item-id-responder.proxy';

describe('QuestFindByWorkItemIdResponder', () => {
  it('VALID: {broker returns questId} => responder returns same questId', async () => {
    const proxy = QuestFindByWorkItemIdResponderProxy();
    const questId = QuestIdStub({ value: 'q-resp-1' });
    const workItemId = QuestWorkItemIdStub({ value: '4676fce3-3415-6a05-a0e2-b1e5e763a573' });

    proxy.setupBrokerReturns({ questId });

    const result = await proxy.callResponder({ workItemId });

    expect(result).toBe(questId);
  });

  it('EMPTY: {broker returns null} => responder returns null', async () => {
    const proxy = QuestFindByWorkItemIdResponderProxy();
    const workItemId = QuestWorkItemIdStub({ value: '82c6d752-3d5e-281d-9029-ddbc278cbb27' });

    proxy.setupBrokerReturns({ questId: null });

    const result = await proxy.callResponder({ workItemId });

    expect(result).toBe(null);
  });
});
