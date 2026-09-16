import { questRemoveRouteBroker } from './quest-remove-route-broker';
import { questRemoveRouteBrokerProxy } from './quest-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questRemoveRouteBroker', () => {
  describe('an existing quest', () => {
    it('VALID: {record: a quest} => resolves its guild then deletes it', async () => {
      const proxy = questRemoveRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth' });
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quest: record });

      const result = await questRemoveRouteBroker({ target, record });

      expect(result).toStrictEqual({ deleted: true });
    });
  });
});
