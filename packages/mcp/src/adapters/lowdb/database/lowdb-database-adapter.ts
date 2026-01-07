/**
 * PURPOSE: Provides read/write access to quest database using LowDB
 *
 * USAGE:
 * const adapter = lowdbDatabaseAdapter({ dbPath: FilePathStub({ value: '/path/to/db.json' }) });
 * await adapter.read();
 * const data = adapter.getData();
 * await adapter.write({ database: data });
 */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { questDatabaseContract } from '../../../contracts/quest-database/quest-database-contract';
import type { QuestDatabase } from '../../../contracts/quest-database/quest-database-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

interface LowdbDatabaseAdapter {
  read: () => Promise<QuestDatabase>;
  write: (params: { database: QuestDatabase }) => Promise<void>;
  getData: () => QuestDatabase;
}

export const lowdbDatabaseAdapter = ({ dbPath }: { dbPath: FilePath }): LowdbDatabaseAdapter => {
  const defaultData: QuestDatabase = questDatabaseContract.parse({ quests: [] });
  const adapter = new JSONFile<QuestDatabase>(dbPath);
  const db = new Low<QuestDatabase>(adapter, defaultData);

  return {
    read: async (): Promise<QuestDatabase> => {
      await db.read();
      return db.data;
    },
    write: async ({ database }: { database: QuestDatabase }): Promise<void> => {
      db.data = database;
      await db.write();
    },
    getData: (): QuestDatabase => db.data,
  };
};
