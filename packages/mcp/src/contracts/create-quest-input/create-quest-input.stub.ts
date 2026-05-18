import type { StubArgument } from '@dungeonmaster/shared/@types';

import { createQuestInputContract } from './create-quest-input-contract';
import type { CreateQuestInput } from './create-quest-input-contract';

export const CreateQuestInputStub = ({
  ...props
}: StubArgument<CreateQuestInput> = {}): CreateQuestInput =>
  createQuestInputContract.parse({
    ...props,
  });
