import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { DatabaseSync } from 'node:sqlite';
import { openSqliteDatabase } from './open-sqlite-database';

export const openSqliteDatabaseProxy = (): {
  returns: (params: { filePath: string; database: DatabaseSync }) => void;
  throws: (params: { filePath: string; error: Error }) => void;
  getCallsFor: (params: { filePath: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: openSqliteDatabase });

  return {
    returns: ({ filePath, database }: { filePath: string; database: DatabaseSync }): void => {
      handle.calledWith([{ filePath }]).implement(() => database);
    },
    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      handle.calledWith([{ filePath }]).implement((): never => {
        throw error;
      });
    },
    getCallsFor: ({ filePath }: { filePath: string }): readonly unknown[][] =>
      handle.callsMatching([{ filePath }]),
  };
};
