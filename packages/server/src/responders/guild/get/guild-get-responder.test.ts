import { GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { GuildGetResponderProxy } from './guild-get-responder.proxy';

describe('GuildGetResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {valid guildId} => returns 200 with guild', async () => {
      const proxy = GuildGetResponderProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId });
      proxy.setupGetGuild({ guild });

      const result = await proxy.callResponder({ params: { guildId } });

      expect(result).toStrictEqual({
        status: 200,
        data: guild,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = GuildGetResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', async () => {
      const proxy = GuildGetResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      const proxy = GuildGetResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {guildId is number} => returns 400 with error', async () => {
      const proxy = GuildGetResponderProxy();

      const result = await proxy.callResponder({ params: { guildId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = GuildGetResponderProxy();
      proxy.setupGetGuildError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
