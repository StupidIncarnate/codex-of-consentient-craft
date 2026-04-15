import type { StubArgument } from '@dungeonmaster/shared/@types';

import { modifyQuestInputContract } from './modify-quest-input-contract';
import type { ModifyQuestInput } from './modify-quest-input-contract';

export const ModifyQuestInputStub = ({
  ...props
}: StubArgument<ModifyQuestInput> = {}): ModifyQuestInput =>
  modifyQuestInputContract.parse({
    questId: 'test-quest',
    ...props,
  });
