import { GuildStub } from '@dungeonmaster/shared/contracts';
import { GuildAddResponderProxy } from './guild-add-responder.proxy';

describe('GuildAddResponder', () => {
  describe('successful creation', () => {
    it('VALID: {name, path} => returns 201 with guild', async () => {
      const proxy = GuildAddResponderProxy();
      const guild = GuildStub({ name: 'Test Guild' as never, path: '/tmp/test' as never });
      proxy.setupAddGuild({ guild });

      const result = await proxy.callResponder({ body: { name: 'Test Guild', path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 201,
        data: guild,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {non-object body} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {missing name and path} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'name and path are required strings' },
      });
    });

    it('INVALID_MULTIPLE: {name is number} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: { name: 123, path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'name and path are required strings' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = GuildAddResponderProxy();
      proxy.setupAddGuildError({ message: 'Duplicate guild' });

      const result = await proxy.callResponder({ body: { name: 'Test', path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Duplicate guild' },
      });
    });
  });
});
