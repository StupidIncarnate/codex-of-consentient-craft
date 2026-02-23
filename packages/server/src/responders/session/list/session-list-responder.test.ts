import { GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { SessionListResponderProxy } from './session-list-responder.proxy';

describe('SessionListResponder', () => {
  describe('successful listing', () => {
    it('VALID: {valid guildId} => returns 200 with sessions', async () => {
      const proxy = SessionListResponderProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId, path: '/test/project' as never });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/testuser' });
      proxy.setupGlobFiles({ files: [] });
      proxy.setupQuests({ quests: [] });

      const result = await proxy.callResponder({ params: { guildId } });

      expect(result).toStrictEqual({
        status: 200,
        data: [],
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = SessionListResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', async () => {
      const proxy = SessionListResponderProxy();

      const result = await proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      const proxy = SessionListResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {guildId is number} => returns 400 with error', async () => {
      const proxy = SessionListResponderProxy();

      const result = await proxy.callResponder({ params: { guildId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });
  });

  describe('empty results', () => {
    it('EMPTY: {guild with no sessions} => returns 200 with empty array', async () => {
      const proxy = SessionListResponderProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId, path: '/home/user/my-guild' as never });
      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({ files: [] });
      proxy.setupQuests({ quests: [] });

      const result = await proxy.callResponder({
        params: { guildId },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: [],
      });
    });
  });
});
