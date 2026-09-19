import { guildRemoveRouteBroker } from './guild-remove-route-broker';
import { guildRemoveRouteBrokerProxy } from './guild-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts';

describe('guildRemoveRouteBroker', () => {
  describe('an existing guild', () => {
    it('VALID: {record: a guild} => removes it by id and returns success', async () => {
      const proxy = guildRemoveRouteBrokerProxy();
      const target = DmTargetStub({});
      const guild = GuildStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.succeeds({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = await guildRemoveRouteBroker({ target, record: guild });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
