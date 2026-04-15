import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questModifyLocksLayerBroker } from './quest-modify-locks-layer-broker';
import { questModifyLocksLayerBrokerProxy } from './quest-modify-locks-layer-broker.proxy';

describe('questModifyLocksLayerBroker', () => {
  describe('map behavior', () => {
    it('VALID: {set then get} => returns stored promise for questId', () => {
      const proxy = questModifyLocksLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-1' });
      const promise = Promise.resolve();

      questModifyLocksLayerBroker.set(questId, promise);

      expect(questModifyLocksLayerBroker.get(questId)).toBe(promise);
    });

    it('EMPTY: {get unknown questId} => returns undefined', () => {
      const proxy = questModifyLocksLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'unknown-quest' });

      expect(questModifyLocksLayerBroker.get(questId)).toBe(undefined);
    });

    it('VALID: {clear after set} => map has no entries', () => {
      const proxy = questModifyLocksLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-clear' });

      questModifyLocksLayerBroker.set(questId, Promise.resolve());
      questModifyLocksLayerBroker.clear();

      expect(questModifyLocksLayerBroker.get(questId)).toBe(undefined);
    });
  });
});
