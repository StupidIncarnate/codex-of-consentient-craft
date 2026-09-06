import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from './quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from './quest-find-quest-path-broker.proxy';

describe('questFindQuestPathBroker', () => {
  describe('quest found', () => {
    it('VALID: {questId in single guild} => returns quest path and guild id', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
        guildId,
      });
    });

    it('VALID: {questId in second guild} => returns correct guild', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest1 = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const quest2 = QuestStub({ id: 'fix-bug', folder: '001-fix-bug' });
      const guildId1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const guildId2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId1 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest1) }),
              },
            ],
          },
          {
            dirName: FileNameStub({ value: guildId2 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-fix-bug' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest2) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug`,
        guildId: guildId2,
      });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {no guilds exist} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupNoGuilds({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any guild/u,
      );
    });

    it('ERROR: {questId not in any guild} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestNotFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any guild/u,
      );
    });
  });

  describe('quest file that fails questContract', () => {
    it('VALID: {quest.json carries the id but has an invalid comment timestamp} => returns its path so the loader can name the bad field', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      // A hand-edited month-13 createdAt rejects the WHOLE file under questContract. Written as
      // raw JSON because no stub can mint an invalid comment. Matching a candidate by id must not
      // depend on the rest of the file being valid — otherwise the one quest that needs
      // diagnosing reports as "not found in any guild" and its bad field is never named.
      const unloadableQuestJson = JSON.stringify(
        QuestStub({ id: 'add-auth', folder: '001-add-auth' }),
      ).replace(
        '"comments":[]',
        '"comments":[{"id":"c0e3e17a-58cc-4372-a567-0e02b2c3d479","flowId":"login-flow","nodeId":"start","text":"hand-edited","createdAt":"2026-13-01T00:00:00.000Z"}]',
      );

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: unloadableQuestJson }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
        guildId,
      });
    });

    it('ERROR: {unloadable quest.json belongs to a different id} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const unloadableQuestJson = JSON.stringify(
        QuestStub({ id: 'add-auth', folder: '001-add-auth' }),
      ).replace(
        '"comments":[]',
        '"comments":[{"id":"c0e3e17a-58cc-4372-a567-0e02b2c3d479","flowId":"login-flow","nodeId":"start","text":"hand-edited","createdAt":"2026-13-01T00:00:00.000Z"}]',
      );

      proxy.setupQuestNotFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: unloadableQuestJson }),
              },
            ],
          },
        ],
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any guild/u,
      );
    });

    it('ERROR: {quest.json is not valid JSON} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestNotFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: '{ not json }' }),
              },
            ],
          },
        ],
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "add-auth" not found in any guild/u,
      );
    });
  });

  describe('the canonical-path probe', () => {
    it('VALID: {folder named with the questId} => answers from the probe without scanning any quest file', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questsDirPath = `/home/user/.dungeonmaster/guilds/${guildId}/quests`;

      // `questFolders: []` is the assertion doing the real work: the scan has NOTHING to find,
      // so this can only pass if the probe answered. A probe that silently stopped working
      // fails here with "not found in any guild" rather than passing on the scan's back.
      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({ value: questsDirPath }),
            probe: {
              questFolderPath: FilePathStub({ value: `${questsDirPath}/${String(questId)}` }),
              questFilePath: FilePathStub({
                value: `${questsDirPath}/${String(questId)}/quest.json`,
              }),
              exists: true,
              contents: FileContentsStub({
                value: JSON.stringify(QuestStub({ id: String(questId), folder: String(questId) })),
              }),
            },
            questFolders: [],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `${questsDirPath}/${String(questId)}`,
        guildId,
      });
    });

    it('VALID: {first guild has no such folder, second does} => returns the second guild', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: '22222222-2222-4222-8222-222222222222' });
      const guildId1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const guildId2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const questsDir1 = `/home/user/.dungeonmaster/guilds/${guildId1}/quests`;
      const questsDir2 = `/home/user/.dungeonmaster/guilds/${guildId2}/quests`;

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId1 }),
            questsDirPath: FilePathStub({ value: questsDir1 }),
            probe: {
              questFolderPath: FilePathStub({ value: `${questsDir1}/${String(questId)}` }),
              questFilePath: FilePathStub({ value: `${questsDir1}/${String(questId)}/quest.json` }),
              exists: false,
            },
            questFolders: [],
          },
          {
            dirName: FileNameStub({ value: guildId2 }),
            questsDirPath: FilePathStub({ value: questsDir2 }),
            probe: {
              questFolderPath: FilePathStub({ value: `${questsDir2}/${String(questId)}` }),
              questFilePath: FilePathStub({ value: `${questsDir2}/${String(questId)}/quest.json` }),
              exists: true,
              contents: FileContentsStub({
                value: JSON.stringify(QuestStub({ id: String(questId), folder: String(questId) })),
              }),
            },
            questFolders: [],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `${questsDir2}/${String(questId)}`,
        guildId: guildId2,
      });
    });

    it('VALID: {folder named with the questId holds a file recording a DIFFERENT id} => falls through to the scan', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questsDirPath = `/home/user/.dungeonmaster/guilds/${guildId}/quests`;

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({ value: questsDirPath }),
            // A folder whose NAME is the id we want, holding a file that records another one.
            // The probe must not trust the name.
            probe: {
              questFolderPath: FilePathStub({ value: `${questsDirPath}/add-auth` }),
              questFilePath: FilePathStub({ value: `${questsDirPath}/add-auth/quest.json` }),
              exists: true,
              contents: FileContentsStub({
                value: JSON.stringify(QuestStub({ id: 'someone-else', folder: 'add-auth' })),
              }),
            },
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `${questsDirPath}/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({ value: `${questsDirPath}/001-add-auth` }),
                contents: FileContentsStub({
                  value: JSON.stringify(QuestStub({ id: 'add-auth', folder: '001-add-auth' })),
                }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `${questsDirPath}/001-add-auth`,
        guildId,
      });
    });

    it('VALID: {questId that is not one directory name} => builds no probe path and answers from the scan', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: '../../etc/passwd' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questsDirPath = `/home/user/.dungeonmaster/guilds/${guildId}/quests`;

      // stageProbe: false mirrors the broker skipping the probe entirely for this id — nothing
      // is joined, so nothing may be staged. An id like this must never reach a path join.
      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        stageProbe: false,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({ value: questsDirPath }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-odd' }),
                questFilePath: FilePathStub({ value: `${questsDirPath}/001-odd/quest.json` }),
                questFolderPath: FilePathStub({ value: `${questsDirPath}/001-odd` }),
                contents: FileContentsStub({
                  value: JSON.stringify(QuestStub({ id: '../../etc/passwd', folder: '001-odd' })),
                }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result).toStrictEqual({
        questPath: `${questsDirPath}/001-odd`,
        guildId,
      });
    });
  });

  describe('error handling', () => {
    it('VALID: {guild with inaccessible quests dir} => skips guild and throws not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestsReadError({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guildDirName: FileNameStub({ value: guildId }),
        questsDirPath: FilePathStub({
          value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "add-auth" not found in any guild/u,
      );
    });
  });
});
