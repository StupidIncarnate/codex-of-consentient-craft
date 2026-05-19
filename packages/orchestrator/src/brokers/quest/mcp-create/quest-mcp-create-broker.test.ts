import {
  AddQuestInputStub,
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from './quest-mcp-create-broker';
import { questMcpCreateBrokerProxy } from './quest-mcp-create-broker.proxy';

const { userRequest } = AddQuestInputStub();

describe('questMcpCreateBroker', () => {
  describe('cwd matches a registered guild', () => {
    it('VALID: {cwd matches one guild with urlSlug} => returns { questId, guildSlug }', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'My Guild' as never,
        path: '/home/dev/my-guild' as never,
        urlSlug: 'my-guild' as never,
        valid: true,
      });
      proxy.setupMatchingGuild({ cwd: '/home/dev/my-guild', guild, questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'my-guild',
      });
    });

    it('VALID: {cwd has trailing slash, guild.path does not} => still matches', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'My Guild' as never,
        path: '/home/dev/my-guild' as never,
        urlSlug: 'my-guild' as never,
        valid: true,
      });
      proxy.setupMatchingGuild({ cwd: '/home/dev/my-guild/', guild, questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'my-guild',
      });
    });

    it('VALID: {cwd matches one guild among many} => returns matching guild slug, not first', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const firstGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' }),
        name: 'First Guild' as never,
        path: '/home/dev/first-guild' as never,
        urlSlug: 'first-guild' as never,
        valid: true,
      });
      const targetGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'dddddddd-4444-4555-9666-777777777777' }),
        name: 'Target Guild' as never,
        path: '/home/dev/target-guild' as never,
        urlSlug: 'target-guild' as never,
        valid: true,
      });
      const lastGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'eeeeeeee-5555-4666-9777-888888888888' }),
        name: 'Last Guild' as never,
        path: '/home/dev/last-guild' as never,
        urlSlug: 'last-guild' as never,
        valid: true,
      });
      proxy.setupGuildsWithMatch({
        cwd: '/home/dev/target-guild',
        guilds: [firstGuild, targetGuild, lastGuild],
        questId,
      });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'target-guild',
      });
    });

    it('VALID: {matching guild has no urlSlug} => derives slug from guild name', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'ffffffff-6666-4777-9888-999999999999' }),
        name: 'Another Guild' as never,
        path: '/home/dev/another-guild' as never,
        urlSlug: undefined,
        valid: true,
      });
      proxy.setupMatchingGuild({ cwd: '/home/dev/another-guild', guild, questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'another-guild',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {cwd matches no guild} => throws clear error mentioning the cwd', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const other = GuildListItemStub({
        id: GuildIdStub({ value: '11111111-1111-4111-9111-111111111111' }),
        name: 'Other Guild' as never,
        path: '/home/dev/other-guild' as never,
        urlSlug: 'other-guild' as never,
        valid: true,
      });
      proxy.setupNoMatchingGuild({
        cwd: '/home/dev/unregistered-repo',
        guilds: [other],
      });

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(
        /No guild registered for current directory: \/home\/dev\/unregistered-repo\. Run `dungeonmaster init` in this repo first\./u,
      );
    });

    it('ERROR: {zero guilds registered} => throws clear error mentioning the cwd', async () => {
      const proxy = questMcpCreateBrokerProxy();
      proxy.setupEmptyGuildList({ cwd: '/home/dev/some-repo' });

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(
        /No guild registered for current directory: \/home\/dev\/some-repo\. Run `dungeonmaster init` in this repo first\./u,
      );
    });

    it('ERROR: {user-add returns failure} => throws with the underlying error message', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: '22222222-2222-4222-9222-222222222222' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupAddFailure({ cwd: '/home/dev/guild', guild, error: 'persist failed' });

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(/persist failed/u);
    });
  });
});
