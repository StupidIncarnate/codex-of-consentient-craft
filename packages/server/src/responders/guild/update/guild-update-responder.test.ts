import { GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { GuildUpdateResponderProxy } from './guild-update-responder.proxy';

describe('GuildUpdateResponder', () => {
  describe('successful update', () => {
    it('VALID: {guildId, name, path} => returns 200 with updated guild', async () => {
      const proxy = GuildUpdateResponderProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId, name: 'Updated' as never });
      proxy.setupUpdateGuild({ guild });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { name: 'Updated', path: '/tmp/new' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: guild,
      });
    });

    it('VALID: {guildId, name only} => returns 200 with updated guild', async () => {
      const proxy = GuildUpdateResponderProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId, name: 'Updated' as never });
      proxy.setupUpdateGuild({ guild });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { name: 'Updated' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: guild,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = GuildUpdateResponderProxy();

      const result = await proxy.callResponder({ params: null, body: { name: 'Test' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      const proxy = GuildUpdateResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: { name: 'Test' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {guildId is number} => returns 400 with error', async () => {
      const proxy = GuildUpdateResponderProxy();

      const result = await proxy.callResponder({
        params: { guildId: 123 },
        body: { name: 'Test' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      const proxy = GuildUpdateResponderProxy();
      const guildId = GuildIdStub();

      const result = await proxy.callResponder({ params: { guildId }, body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = GuildUpdateResponderProxy();
      proxy.setupUpdateGuildError({ message: 'Update failed' });

      const result = await proxy.callResponder({
        params: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
        body: { name: 'Test' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Update failed' },
      });
    });
  });
});
