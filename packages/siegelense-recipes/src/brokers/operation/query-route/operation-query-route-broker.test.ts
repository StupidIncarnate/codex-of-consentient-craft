import { operationQueryRouteBroker } from './operation-query-route-broker';
import { operationQueryRouteBrokerProxy } from './operation-query-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { OperationItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

describe('operationQueryRouteBroker', () => {
  describe('a where clause narrowing by role', () => {
    it('VALID: {where: {questId, role}} => returns only the matching operation', async () => {
      const proxy = operationQueryRouteBrokerProxy();
      const target = DmTargetStub({});
      const riftcarverItem = OperationItemStub({ role: 'riftcarver' });
      const codeweaverItem = OperationItemStub({ role: 'codeweaver' });
      const quest = QuestStub({ id: 'add-auth', operations: [riftcarverItem, codeweaverItem] });
      proxy.succeeds({ quest });

      const result = await operationQueryRouteBroker({
        target,
        where: { questId: 'add-auth', role: 'riftcarver' },
      });

      expect(result).toStrictEqual([riftcarverItem]);
    });
  });
});
