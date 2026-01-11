/**
 * PURPOSE: Tests for questsFolderEnsureBroker
 */

import { questsFolderEnsureBroker } from './quests-folder-ensure-broker';
import { questsFolderEnsureBrokerProxy } from './quests-folder-ensure-broker.proxy';

describe('questsFolderEnsureBroker', () => {
  describe('folder creation', () => {
    it('VALID: {folder exists} => returns path', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      proxy.setupFolderExists();

      const result = await questsFolderEnsureBroker();

      expect(result.questsBasePath).toMatch(/\.dungeonmaster-quests$/u);
    });

    it('VALID: {folder does not exist} => creates folder and returns path', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      proxy.setupFolderExists();

      const result = await questsFolderEnsureBroker();

      expect(result.questsBasePath).toMatch(/\.dungeonmaster-quests$/u);
    });
  });
});
