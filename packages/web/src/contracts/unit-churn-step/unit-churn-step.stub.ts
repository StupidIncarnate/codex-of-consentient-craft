import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitChurnStepContract } from './unit-churn-step-contract';
import type { UnitChurnStep } from './unit-churn-step-contract';

export const UnitChurnStepStub = ({ ...props }: StubArgument<UnitChurnStep> = {}): UnitChurnStep =>
  unitChurnStepContract.parse({
    mark: 'unmet',
    workItemLabel: 'work',
    ...props,
  });
