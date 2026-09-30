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
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      proxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: guildId,
            questsDirPath,
            questFolders: [
              {
                folderName: quest.folder,
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
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
