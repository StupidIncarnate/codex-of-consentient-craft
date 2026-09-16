import type { StubArgument } from '@dungeonmaster/shared/@types';
import { seedStepContract } from './seed-step-contract';
import type { SeedStepData } from './seed-step-contract';

export const SeedStepStub = ({ ...props }: StubArgument<SeedStepData> = {}): SeedStepData =>
  seedStepContract.parse({
    step: 'seed',
    recipe: 'guild-mid-execution',
    ...props,
  });
