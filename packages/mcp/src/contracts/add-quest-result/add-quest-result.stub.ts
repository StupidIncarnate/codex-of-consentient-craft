import { addQuestResultContract } from './add-quest-result-contract';
import type { AddQuestResult } from './add-quest-result-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AddQuestResultStub = ({
  ...props
}: StubArgument<AddQuestResult> = {}): AddQuestResult =>
  addQuestResultContract.parse({
    success: true,
    questId: 'test-quest',
    questFolder: '001-test-quest',
    filePath: '/path/to/quest.json',
    ...props,
  });
