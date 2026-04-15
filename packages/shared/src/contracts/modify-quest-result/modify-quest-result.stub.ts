import type { StubArgument } from '@dungeonmaster/shared/@types';

import { modifyQuestResultContract } from './modify-quest-result-contract';
import type { ModifyQuestResult } from './modify-quest-result-contract';

export const ModifyQuestResultStub = ({
  ...props
}: StubArgument<ModifyQuestResult> = {}): ModifyQuestResult =>
  modifyQuestResultContract.parse({
    success: true,
    ...props,
  });
