import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { guildCreateBroker } from './guild-create-broker';
import { guildCreateBrokerProxy } from './guild-create-broker.proxy';

describe('guildCreateBroker', () => {
  describe('successful creation', () => {
    it('VALID: {name, path} => returns guild id', async () => {
      const proxy = guildCreateBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupCreate({ id: guildId });

      const result = await guildCreateBroker({
        name: 'My Guild',
        path: '/home/user/my-guild',
      });

      expect(result).toStrictEqual({ id: guildId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildCreateBrokerProxy();

      proxy.setupError();

      await expect(
        guildCreateBroker({
          name: 'My Guild',
          path: '/home/user/my-guild',
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = guildCreateBrokerProxy();

      proxy.setupInvalidResponse({ data: { id: '' } });

      await expect(
        guildCreateBroker({
          name: 'My Guild',
          path: '/home/user/my-guild',
        }),
      ).rejects.toThrow(/invalid_string/u);
    });
  });
});
