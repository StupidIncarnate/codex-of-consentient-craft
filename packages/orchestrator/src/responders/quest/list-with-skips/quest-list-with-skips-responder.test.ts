import { FilePathStub, GuildIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '@dungeonmaster/shared/contracts';

import { QuestListWithSkipsResponderProxy } from './quest-list-with-skips-responder.proxy';

describe('QuestListWithSkipsResponder', () => {
  describe('successful list', () => {
    it('VALID: {guild with only loadable quests} => returns the list items and an empty skip list', async () => {
      const guildId = GuildIdStub();
      const quest = QuestStub();
      const proxy = QuestListWithSkipsResponderProxy();
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
        }),
      });
      proxy.setupQuestDirectories({ files: [FileNameStub({ value: '001-add-auth' })] });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/001-add-auth/quest.json',
        }),
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await proxy.callResponder({ guildId });

      expect(result.quests.map((item) => item.id)).toStrictEqual([quest.id]);
      expect(result.skipped).toStrictEqual([]);
    });
  });

  describe('skipped quest files', () => {
    it('VALID: {one quest.json is not valid JSON} => returns the loadable quest AND names the skipped folder, path, and reason', async () => {
      const guildId = GuildIdStub();
      const quest = QuestStub();
      const proxy = QuestListWithSkipsResponderProxy();
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
        }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-broken' }), FileNameStub({ value: '002-good' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/001-broken/quest.json',
        }),
      });
      proxy.setupQuestFile({ questJson: '{ not valid json' });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/002-good/quest.json',
        }),
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await proxy.callResponder({ guildId });

      expect(result.quests.map((item) => item.id)).toStrictEqual([quest.id]);
      expect(result.skipped).toStrictEqual([
        {
          questFolder: '001-broken',
          questFilePath:
            '/home/testuser/.dungeonmaster/guilds/guild-1/quests/001-broken/quest.json',
          reason: 'file contents are not valid JSON',
        },
      ]);
    });

    it('VALID: {quest.json written by an older schema} => the reason names every field questContract rejected', async () => {
      const guildId = GuildIdStub();
      const proxy = QuestListWithSkipsResponderProxy();
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
        }),
      });
      proxy.setupQuestDirectories({ files: [FileNameStub({ value: '001-legacy' })] });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/001-legacy/quest.json',
        }),
      });
      // `pathseeker` is no longer in workItemRoleContract, and relatedDataItems is a bare uuid
      // instead of the `{collection}/{id}` shape — the exact drift a long-lived home dir carries.
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'legacy-quest',
          folder: '001-legacy',
          title: 'Legacy Quest',
          status: 'complete',
          createdAt: '2024-01-01T00:00:00Z',
          userRequest: 'Legacy request',
          workItems: [
            {
              id: 'e2e00000-0000-4000-8000-0000000000ff',
              role: 'pathseeker',
              status: 'complete',
              spawnerType: 'agent',
              createdAt: '2024-01-01T00:00:00Z',
              relatedDataItems: ['e2e00000-0000-4000-8000-0000000000fe'],
              dependsOn: [],
            },
          ],
          toolingRequirements: [],
        }),
      });

      const result = await proxy.callResponder({ guildId });

      expect(result.quests).toStrictEqual([]);
      expect(result.skipped.map((skip) => skip.questFolder)).toStrictEqual(['001-legacy']);
      expect(
        String(result.skipped[0]?.reason)
          .split('; ')
          .map((issue) => issue.split(':')[0]),
      ).toStrictEqual(['workItems.0.role', 'workItems.0.relatedDataItems.0']);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {guild with no quest folders} => returns empty quests and empty skips', async () => {
      const guildId = GuildIdStub();
      const proxy = QuestListWithSkipsResponderProxy();
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const result = await proxy.callResponder({ guildId });

      expect(result).toStrictEqual({ quests: [], skipped: [] });
    });
  });
});
