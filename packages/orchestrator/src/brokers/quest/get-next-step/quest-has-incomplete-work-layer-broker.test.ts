import { QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { questHasIncompleteWorkLayerBroker } from './quest-has-incomplete-work-layer-broker';
import { questHasIncompleteWorkLayerBrokerProxy } from './quest-has-incomplete-work-layer-broker.proxy';

describe('questHasIncompleteWorkLayerBroker', () => {
  it('EMPTY: {workItems: []} => returns false', () => {
    questHasIncompleteWorkLayerBrokerProxy();
    const quest = QuestStub({ workItems: [] });

    const result = questHasIncompleteWorkLayerBroker({ quest });

    expect(result).toBe(false);
  });

  it('VALID: {all workItems terminal (complete)} => returns false', () => {
    questHasIncompleteWorkLayerBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ status: 'complete' }), WorkItemStub({ status: 'failed' })],
    });

    const result = questHasIncompleteWorkLayerBroker({ quest });

    expect(result).toBe(false);
  });

  it('VALID: {one pending workItem} => returns true', () => {
    questHasIncompleteWorkLayerBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ status: 'complete' }), WorkItemStub({ status: 'pending' })],
    });

    const result = questHasIncompleteWorkLayerBroker({ quest });

    expect(result).toBe(true);
  });

  it('VALID: {one in_progress workItem} => returns true', () => {
    questHasIncompleteWorkLayerBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ status: 'in_progress' })],
    });

    const result = questHasIncompleteWorkLayerBroker({ quest });

    expect(result).toBe(true);
  });
});
