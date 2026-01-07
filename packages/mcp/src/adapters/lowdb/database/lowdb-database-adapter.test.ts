import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { QuestDatabaseStub } from '../../../contracts/quest-database/quest-database.stub';

import { lowdbDatabaseAdapter } from './lowdb-database-adapter';
import { lowdbDatabaseAdapterProxy } from './lowdb-database-adapter.proxy';

describe('lowdbDatabaseAdapter', () => {
  describe('read', () => {
    it('VALID: {dbPath} => returns database data after read', async () => {
      const proxy = lowdbDatabaseAdapterProxy();
      const dbPath = FilePathStub({ value: '/path/to/.dungeonmaster-quests/db.json' });
      const expectedDatabase = QuestDatabaseStub();

      proxy.readsDatabase({ dbPath, database: expectedDatabase });

      const adapter = lowdbDatabaseAdapter({ dbPath });
      const result = await adapter.read();

      expect(result).toStrictEqual(expectedDatabase);
    });

    it('EMPTY: {dbPath} with no existing file => returns default empty database', async () => {
      const proxy = lowdbDatabaseAdapterProxy();
      const dbPath = FilePathStub({ value: '/path/to/.dungeonmaster-quests/db.json' });
      const expectedDatabase = QuestDatabaseStub({ quests: [] });

      proxy.readsEmptyDatabase({ dbPath });

      const adapter = lowdbDatabaseAdapter({ dbPath });
      const result = await adapter.read();

      expect(result).toStrictEqual(expectedDatabase);
    });
  });

  describe('write', () => {
    it('VALID: {dbPath, database} => writes database to file', async () => {
      const proxy = lowdbDatabaseAdapterProxy();
      const dbPath = FilePathStub({ value: '/path/to/.dungeonmaster-quests/db.json' });
      const database = QuestDatabaseStub();

      proxy.writesDatabase({ dbPath });

      const adapter = lowdbDatabaseAdapter({ dbPath });
      await adapter.write({ database });

      expect(proxy.getCapturedDatabase()).toStrictEqual(database);
    });
  });

  describe('getData', () => {
    it('VALID: {dbPath} after read => returns current data reference', async () => {
      const proxy = lowdbDatabaseAdapterProxy();
      const dbPath = FilePathStub({ value: '/path/to/.dungeonmaster-quests/db.json' });
      const expectedDatabase = QuestDatabaseStub();

      proxy.readsDatabase({ dbPath, database: expectedDatabase });

      const adapter = lowdbDatabaseAdapter({ dbPath });
      await adapter.read();
      const result = adapter.getData();

      expect(result).toStrictEqual(expectedDatabase);
    });
  });
});
