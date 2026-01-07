import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import type { QuestDatabase } from '../../../contracts/quest-database/quest-database-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('lowdb', () => ({
  Low: jest.fn(),
}));

jest.mock('lowdb/node', () => ({
  JSONFile: jest.fn(),
}));

export const lowdbDatabaseAdapterProxy = (): {
  readsDatabase: (params: { dbPath: FilePath; database: QuestDatabase }) => void;
  readsEmptyDatabase: (params: { dbPath: FilePath }) => void;
  writesDatabase: (params: { dbPath: FilePath }) => void;
  getCapturedDatabase: () => QuestDatabase | undefined;
} => {
  const mockJSONFile = jest.mocked(JSONFile);
  const mockLow = jest.mocked(Low);

  const capturedState = { data: undefined as QuestDatabase | undefined };

  const mockDbInstance = {
    data: { quests: [] } as QuestDatabase,
    read: jest.fn(),
    write: jest.fn(),
  };

  mockJSONFile.mockImplementation(() => ({}) as never);
  mockLow.mockImplementation((_adapter, defaultData) => {
    mockDbInstance.data = defaultData as QuestDatabase;
    return mockDbInstance as never;
  });

  const setDataAndResolve = async (database: QuestDatabase): Promise<void> => {
    mockDbInstance.data = database;
    await Promise.resolve();
  };

  const captureDataAndResolve = async (): Promise<void> => {
    capturedState.data = mockDbInstance.data;
    await Promise.resolve();
  };

  return {
    readsDatabase: ({ database }: { dbPath: FilePath; database: QuestDatabase }): void => {
      mockDbInstance.read.mockImplementation(async () => {
        await setDataAndResolve(database);
      });
    },
    readsEmptyDatabase: (): void => {
      mockDbInstance.read.mockImplementation(async () => {
        await setDataAndResolve({ quests: [] } as QuestDatabase);
      });
    },
    writesDatabase: (): void => {
      mockDbInstance.write.mockImplementation(async () => {
        await captureDataAndResolve();
      });
    },
    getCapturedDatabase: (): QuestDatabase | undefined => capturedState.data,
  };
};
