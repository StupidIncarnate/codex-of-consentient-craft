import {
  AddQuestInputStub,
  GuildIdStub,
  GuildListItemStub,
  GuildStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { QuestMcpCreateResponderProxy } from './quest-mcp-create-responder.proxy';

const { userRequest } = AddQuestInputStub();

describe('QuestMcpCreateResponder', () => {
  it('VALID: {covering guild exists} => returns { questId, guildSlug }', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const guild = GuildListItemStub({
      id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
      name: 'My Guild' as never,
      path: '/home/dev/my-guild' as never,
      urlSlug: 'my-guild' as never,
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
      name: 'My Guild' as never,
      path: '/home/dev/my-guild' as never,
      urlSlug: 'my-guild' as never,
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
      name: 'Codex of Consentient Craft' as never,
      path: '/home/dev/codex-of-consentient-craft' as never,
      urlSlug: 'codex-of-consentient-craft' as never,
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
