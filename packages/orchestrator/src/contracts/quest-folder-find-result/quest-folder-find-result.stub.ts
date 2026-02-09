import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questFolderFindResultContract } from './quest-folder-find-result-contract';
import type { QuestFolderFindResult } from './quest-folder-find-result-contract';

type FoundResult = Extract<QuestFolderFindResult, { found: true }>;

export const QuestFolderFindResultFoundStub = ({
  ...props
}: StubArgument<FoundResult> = {}): QuestFolderFindResult =>
  questFolderFindResultContract.parse({
    found: true,
    folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-test-quest' }),
    quest: QuestStub(),
    ...props,
  });

export const QuestFolderFindResultNotFoundStub = (): QuestFolderFindResult =>
  questFolderFindResultContract.parse({
    found: false,
    folderPath: undefined,
    quest: undefined,
  });
