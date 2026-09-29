import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { RiftcarverResultStub } from '@dungeonmaster/shared/contracts/riftcarver-result/riftcarver-result.stub';

import { RiftcarverDetailStub } from '../../../contracts/riftcarver-detail/riftcarver-detail.stub';

import { questRiftcarverDetailBroker } from './quest-riftcarver-detail-broker';
import { questRiftcarverDetailBrokerProxy } from './quest-riftcarver-detail-broker.proxy';

describe('questRiftcarverDetailBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId, riftcarverResultId} => returns parsed riftcarver detail', async () => {
      const proxy = questRiftcarverDetailBrokerProxy();
      const detail = RiftcarverDetailStub();
      proxy.setupDetail({ detail });

      const result = await questRiftcarverDetailBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        riftcarverResultId: RiftcarverResultStub().id,
      });

      expect(result).toStrictEqual(detail);
    });
  });
});
