import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { LoadQuestLayerResponder } from './load-quest-layer-responder';
import { LoadQuestLayerResponderProxy } from './load-quest-layer-responder.proxy';

describe('LoadQuestLayerResponder', () => {
  it('VALID: {export shape} => is a function', () => {
    LoadQuestLayerResponderProxy();

    expect(LoadQuestLayerResponder).toStrictEqual(expect.any(Function));
  });

  it('ERROR: {quest not on disk} => rejects via underlying broker error', async () => {
    const proxy = LoadQuestLayerResponderProxy();
    proxy.setupPassthrough();
    const questId = QuestIdStub({ value: 'nonexistent-load-quest-layer-smoke' });

    await expect(LoadQuestLayerResponder({ questId })).rejects.toThrow(/.+/u);
  });

  describe('quest file resolution', () => {
    it('VALID: {questId} => resolves the quest file via the exact [questPath, quest.json] join tuple', async () => {
      const proxy = LoadQuestLayerResponderProxy();
      proxy.setupPassthrough();

      const quest = QuestStub();
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      proxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });
      proxy.setupQuestFileJoin({ questPath: questFolderPath, questFilePath });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await LoadQuestLayerResponder({ questId: quest.id });

      expect(result.id).toBe(quest.id);
      // Pins the exact tuple this responder's OWN join call is addressed by — see the
      // "passthrough join composed from far away" trap this proxy's header names.
      expect(proxy.getQuestFileJoinArgs({ questPath: questFolderPath })).toStrictEqual([
        [questFolderPath, 'quest.json'],
      ]);
    });
  });
});
