import { QuestIdStub, WardResultStub } from '@dungeonmaster/shared/contracts';

import { WardDetailStub } from '../../../contracts/ward-detail/ward-detail.stub';

import { questWardDetailBroker } from './quest-ward-detail-broker';
import { questWardDetailBrokerProxy } from './quest-ward-detail-broker.proxy';

describe('questWardDetailBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId, wardResultId} => returns parsed ward detail', async () => {
      const proxy = questWardDetailBrokerProxy();
      const detail = WardDetailStub();
      proxy.setupDetail({ detail });

      const result = await questWardDetailBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        wardResultId: WardResultStub().id,
      });

      expect(result).toStrictEqual(detail);
    });
  });
});
