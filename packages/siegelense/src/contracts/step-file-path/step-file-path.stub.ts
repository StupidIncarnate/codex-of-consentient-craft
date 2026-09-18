import { stepFilePathContract } from './step-file-path-contract';
import type { StepFilePath } from './step-file-path-contract';

export const StepFilePathStub = (
  { value }: { value: string } = { value: 'guilds/g1/quests/q1/quest.json' },
): StepFilePath => stepFilePathContract.parse(value);
