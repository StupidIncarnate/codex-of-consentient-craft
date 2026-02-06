import type { StubArgument } from '@dungeonmaster/shared/@types';

import { requirementContract } from './requirement-contract';
import type { Requirement } from './requirement-contract';

export const RequirementStub = ({ ...props }: StubArgument<Requirement> = {}): Requirement =>
  requirementContract.parse({
    id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'CLI Interactive Mode',
    description: 'Support interactive CLI prompts for user input',
    scope: 'packages/cli',
    ...props,
  });
