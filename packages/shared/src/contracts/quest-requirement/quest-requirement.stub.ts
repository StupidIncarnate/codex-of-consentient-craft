import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questRequirementContract } from './quest-requirement-contract';
import type { QuestRequirement } from './quest-requirement-contract';

export const QuestRequirementStub = ({
  ...props
}: StubArgument<QuestRequirement> = {}): QuestRequirement =>
  questRequirementContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Create service',
    type: 'implementation',
    status: 'pending',
    observableIds: [],
    ...props,
  });
