import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitChurnContract } from './unit-churn-contract';
import type { UnitChurn } from './unit-churn-contract';

export const UnitChurnStub = ({ ...props }: StubArgument<UnitChurn> = {}): UnitChurn =>
  unitChurnContract.parse({
    unitId: 'send-flow:observable:scan-finds-every-path',
    marks: [
      { mark: 'unmet', workItemLabel: 'work' },
      { mark: 'met', workItemLabel: 'work' },
    ],
    ...props,
  });
