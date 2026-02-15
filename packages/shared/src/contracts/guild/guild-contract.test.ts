import { ChatSessionStub } from '../chat-session/chat-session.stub';
import { guildContract } from './guild-contract';
import { GuildStub } from './guild.stub';

describe('guildContract', () => {
  describe('valid guilds', () => {
    it('VALID: full guild => parses successfully', () => {
      const guild = GuildStub();

      const result = guildContract.parse(guild);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });

    it('VALID: guild with chatSessions => parses successfully', () => {
      const chatSession = ChatSessionStub();
      const guild = GuildStub({
        chatSessions: [chatSession],
      });

      const result = guildContract.parse(guild);

      expect(result.chatSessions).toStrictEqual([chatSession]);
    });

    it('VALID: guild without chatSessions field => backward compat defaults to empty array', () => {
      const result = guildContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result.chatSessions).toStrictEqual([]);
    });

    it('VALID: guild with custom name => parses successfully', () => {
      const guild = GuildStub({ name: 'Custom Guild' });

      const result = guildContract.parse(guild);

      expect(result.name).toBe('Custom Guild');
    });

    it('VALID: guild with custom path => parses successfully', () => {
      const guild = GuildStub({ path: '/tmp/other-guild' });

      const result = guildContract.parse(guild);

      expect(result.path).toBe('/tmp/other-guild');
    });
  });

  describe('invalid guilds', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        guildContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid id => throws validation error', () => {
      const baseGuild = GuildStub();

      expect(() => {
        guildContract.parse({
          ...baseGuild,
          id: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: invalid createdAt => throws validation error', () => {
      const baseGuild = GuildStub();

      expect(() => {
        guildContract.parse({
          ...baseGuild,
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
