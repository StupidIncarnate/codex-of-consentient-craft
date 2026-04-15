import type { StubArgument } from '@dungeonmaster/shared/@types';

import { addQuestResultContract } from './add-quest-result-contract';
import type { AddQuestResult } from './add-quest-result-contract';

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
