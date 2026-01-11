/**
 * PURPOSE: Creates test data for quest folder find results
 *
 * USAGE:
 * const result = QuestFolderFindResultFoundStub();
 * // Returns QuestFolderFindResult with quest data
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts';

import { FilePathStub } from '../file-path/file-path.stub';
import { questFolderFindResultContract } from './quest-folder-find-result-contract';
import type { QuestFolderFindResult } from './quest-folder-find-result-contract';

type QuestFolderFindResultFound = Extract<QuestFolderFindResult, { found: true }>;

export const QuestFolderFindResultFoundStub = ({
  ...props
}: StubArgument<QuestFolderFindResultFound> = {}): QuestFolderFindResult =>
  questFolderFindResultContract.parse({
    found: true,
    folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
    quest: QuestStub({ id: 'add-auth', folder: '001-add-auth' }),
    ...props,
  });

export const QuestFolderFindResultNotFoundStub = (): QuestFolderFindResult =>
  questFolderFindResultContract.parse({
    found: false,
    folderPath: undefined,
    quest: undefined,
  });
