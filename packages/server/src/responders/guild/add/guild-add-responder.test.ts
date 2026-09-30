import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildAddResponderProxy } from './guild-add-responder.proxy';

describe('GuildAddResponder', () => {
  describe('successful creation', () => {
    it('VALID: {name, path} => returns 201 with guild', async () => {
      const proxy = GuildAddResponderProxy();
      const name = 'Test Guild';
      const path = '/tmp/test';
      const guild = GuildStub({ name, path });
      proxy.setupAddGuild({ name, path, guild });

      const result = await proxy.callResponder({ body: { name: 'Test Guild', path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 201,
        data: guild,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null body} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {non-object body} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {missing name and path} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'name and path are required strings' },
      });
    });

    it('INVALID: {name is number} => returns 400 with error', async () => {
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
      const name = 'Test';
      const path = '/tmp/test';
      proxy.setupAddGuildError({ name, path, message: 'Disk unavailable' });

      const result = await proxy.callResponder({ body: { name: 'Test', path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Disk unavailable' },
      });
    });

    it('ERROR: {path already registered to another guild} => returns 409 with error message', async () => {
      const proxy = GuildAddResponderProxy();
      const name = 'Test';
      const path = '/tmp/test';
      proxy.setupAddGuildError({
        name,
        path,
        message: 'A guild with path /tmp/test already exists',
      });

      const result = await proxy.callResponder({ body: { name: 'Test', path: '/tmp/test' } });

      expect(result).toStrictEqual({
        status: 409,
        data: { error: 'A guild with path /tmp/test already exists' },
      });
    });
  });
});
