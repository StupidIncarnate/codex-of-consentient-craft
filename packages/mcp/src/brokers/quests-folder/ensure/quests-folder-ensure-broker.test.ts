/**
 * PURPOSE: Tests for questsFolderEnsureBroker
 */

import { questsFolderEnsureBroker } from './quests-folder-ensure-broker';
import { questsFolderEnsureBrokerProxy } from './quests-folder-ensure-broker.proxy';

describe('questsFolderEnsureBroker', () => {
  describe('folder and database creation', () => {
    it('VALID: {folder and db exist} => returns paths without creating', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      proxy.setupFolderAndDbExist();

      const result = await questsFolderEnsureBroker();

      expect(result.questsBasePath).toMatch(/\.dungeonmaster-quests$/u);
      expect(result.dbPath).toMatch(/db\.json$/u);
    });

    it('VALID: {folder exists, db does not} => creates db.json with empty quests', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      proxy.setupFolderExistsDbDoesNot();

      const result = await questsFolderEnsureBroker();

      expect(result.questsBasePath).toMatch(/\.dungeonmaster-quests$/u);
      expect(result.dbPath).toMatch(/db\.json$/u);
    });

    it('VALID: {nothing exists} => creates folder and db.json', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      proxy.setupFolderExistsDbDoesNot();

      const result = await questsFolderEnsureBroker();

      expect(result.questsBasePath).toBeDefined();
      expect(result.dbPath).toBeDefined();
    });
  });
});
