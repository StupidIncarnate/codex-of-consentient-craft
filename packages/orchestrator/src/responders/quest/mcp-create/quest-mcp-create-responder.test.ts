import { AddQuestInputStub } from '@dungeonmaster/shared/contracts/add-quest-input/add-quest-input.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { QuestMcpCreateResponderProxy } from './quest-mcp-create-responder.proxy';

const { userRequest } = AddQuestInputStub();

describe('QuestMcpCreateResponder', () => {
  it('VALID: {covering guild exists} => returns { questId, guildSlug }', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const guild = GuildListItemStub({
      id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
      name: 'My Guild',
      path: '/home/dev/my-guild',
      urlSlug: 'my-guild',
      valid: true,
    });

    proxy.setupResolvedRepoRoot({ cwd: '/home/dev/my-guild', repoRoot: '/home/dev/my-guild' });
    proxy.setupGuilds({ guilds: [guild] });
    proxy.setupSuccessfulAdd({ questId });

    const result = await proxy.callResponder({ userRequest });

    expect(result).toStrictEqual({ questId, guildSlug: 'my-guild' });
  });

  it('VALID: {questType: "bug-hunt"} => returns { questId, guildSlug }', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const guild = GuildListItemStub({
      id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
      name: 'My Guild',
      path: '/home/dev/my-guild',
      urlSlug: 'my-guild',
      valid: true,
    });

    proxy.setupResolvedRepoRoot({ cwd: '/home/dev/my-guild', repoRoot: '/home/dev/my-guild' });
    proxy.setupGuilds({ guilds: [guild] });
    proxy.setupSuccessfulAdd({ questId });

    const result = await proxy.callResponder({ userRequest, questType: 'bug-hunt' });

    expect(result).toStrictEqual({ questId, guildSlug: 'my-guild' });
  });

  it('VALID: {no covering guild} => auto-creates a guild and returns its slug', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const createdGuild = GuildStub({
      id: GuildIdStub({ value: 'cccccccc-cccc-4ccc-9ccc-cccccccccccc' }),
      name: 'Codex of Consentient Craft',
      path: '/home/dev/codex-of-consentient-craft',
      urlSlug: 'codex-of-consentient-craft',
    });

    proxy.setupResolvedRepoRoot({
      cwd: '/home/dev/codex-of-consentient-craft',
      repoRoot: '/home/dev/codex-of-consentient-craft',
    });
    proxy.setupGuilds({ guilds: [] });
    proxy.setupAutoCreatedGuild({ guild: createdGuild });
    proxy.setupSuccessfulAdd({ questId });

    const result = await proxy.callResponder({ userRequest });

    expect(result).toStrictEqual({ questId, guildSlug: 'codex-of-consentient-craft' });
  });
});
