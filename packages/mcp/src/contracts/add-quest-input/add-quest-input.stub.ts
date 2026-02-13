import { addQuestInputContract } from './add-quest-input-contract';
import type { AddQuestInput } from './add-quest-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AddQuestInputStub = ({ ...props }: StubArgument<AddQuestInput> = {}): AddQuestInput =>
  addQuestInputContract.parse({
    title: 'Test Quest',
    userRequest: 'User wants to test the quest system',
    projectId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
