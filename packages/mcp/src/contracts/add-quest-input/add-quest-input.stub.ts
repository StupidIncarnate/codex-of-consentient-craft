import { addQuestInputContract } from './add-quest-input-contract';
import type { AddQuestInput } from './add-quest-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AddQuestInputStub = ({ ...props }: StubArgument<AddQuestInput> = {}): AddQuestInput =>
  addQuestInputContract.parse({
    title: 'Test Quest',
    userRequest: 'User wants to test the quest system',
    tasks: [],
    ...props,
  });
