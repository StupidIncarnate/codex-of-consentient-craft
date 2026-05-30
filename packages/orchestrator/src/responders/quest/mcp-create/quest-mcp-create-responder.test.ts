import {
  AddQuestInputStub,
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { QuestMcpCreateResponderProxy } from './quest-mcp-create-responder.proxy';

const { userRequest } = AddQuestInputStub();

describe('QuestMcpCreateResponder', () => {
  it('VALID: {cwd matches one guild} => returns { questId, guildSlug }', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const guild = GuildListItemStub({
      id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
      name: 'My Guild' as never,
      path: '/home/dev/my-guild' as never,
      urlSlug: 'my-guild' as never,
      valid: true,
    });

    proxy.setupMatchingGuild({ cwd: '/home/dev/my-guild', guild, questId });

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

    proxy.setupMatchingGuild({ cwd: '/home/dev/my-guild', guild, questId });

    const result = await proxy.callResponder({ userRequest, questType: 'bug-hunt' });

    expect(result).toStrictEqual({ questId, guildSlug: 'my-guild' });
  });

  it('ERROR: {cwd matches no guild} => throws clear error mentioning the cwd', async () => {
    const proxy = QuestMcpCreateResponderProxy();
    proxy.setupEmptyGuildList({ cwd: '/home/dev/some-repo' });

    await expect(proxy.callResponder({ userRequest })).rejects.toThrow(
      /No guild registered for current directory: \/home\/dev\/some-repo/u,
    );
  });
});
