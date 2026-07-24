import { questListBroker } from './quest-list-broker';
import { questListBrokerProxy } from './quest-list-broker.proxy';
import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '@dungeonmaster/shared/contracts';

describe('questListBroker', () => {
  describe('listing quests', () => {
    it('VALID: {guildId} => returns array of all quests from folders', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [
          FileNameStub({ value: '001-quest-1' }),
          FileNameStub({ value: '002-quest-2' }),
          FileNameStub({ value: 'README.md' }), // Should be filtered out
          FileNameStub({ value: 'closed' }), // Should be filtered out
        ],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-quest-1/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'quest-1',
          folder: '001-quest-1',
          title: 'Quest 1',
          status: 'in_progress',
          createdAt: '2024-01-01T00:00:00Z',
          userRequest: 'First quest request',
          steps: [],
          toolingRequirements: [],
        }),
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-quest-2/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'quest-2',
          folder: '002-quest-2',
          title: 'Quest 2',
          status: 'complete',
          createdAt: '2024-01-02T00:00:00Z',
          completedAt: '2024-01-03T00:00:00Z',
          userRequest: 'Second quest request',
          steps: [],
          toolingRequirements: [],
        }),
      });

      const result = await questListBroker({ guildId });

      expect(result.map((q) => q.id)).toStrictEqual(['quest-1', 'quest-2']);
    });

    it('VALID: {guildId} => returns empty array when no quest folders exist', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [
          FileNameStub({ value: 'README.md' }),
          FileNameStub({ value: 'closed' }), // Reserved folder, not a quest
        ],
      });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {guildId} => returns empty array when quests folder is empty', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unloadable quest files', () => {
    it('EDGE: {one quest file rejected by questContract} => returns the loadable quests and skips it', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-legacy' }), FileNameStub({ value: '002-good' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-legacy/quest.json' }),
      });
      // Written by an older schema: `pathseeker` is no longer in workItemRoleContract.
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
              relatedDataItems: [],
              dependsOn: [],
            },
          ],
          toolingRequirements: [],
        }),
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-good/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'good-quest',
          folder: '002-good',
          title: 'Good Quest',
          status: 'in_progress',
          createdAt: '2024-01-02T00:00:00Z',
          userRequest: 'Good request',
          steps: [],
          toolingRequirements: [],
        }),
      });

      const result = await questListBroker({ guildId });

      expect(result.map((q) => q.id)).toStrictEqual(['good-quest']);
    });

    it('EDGE: {one quest file rejected by questContract} => names the file and the rejected field on stderr', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-legacy' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-legacy/quest.json' }),
      });
      proxy.setupQuestFile({ questJson: '{ not valid json' });

      await questListBroker({ guildId });

      expect(process.stderr.write).toHaveBeenCalledWith(
        '[quest-list] skipping unloadable quest — Failed to parse quest file at /project/.dungeonmaster-quests/001-legacy/quest.json: file contents are not valid JSON\n',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {projectId with hidden files} => handles hidden files in quest folder', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-hidden-quest' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-hidden-quest/quest.json',
        }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'hidden-quest',
          folder: '001-hidden-quest',
          title: 'Hidden Quest',
          status: 'in_progress',
          createdAt: '2024-01-01T00:00:00Z',
          userRequest: 'A hidden quest',
          steps: [],
          toolingRequirements: [],
        }),
      });

      const result = await questListBroker({ guildId });

      expect(result.map((q) => q.id)).toStrictEqual(['hidden-quest']);
    });
  });
});
