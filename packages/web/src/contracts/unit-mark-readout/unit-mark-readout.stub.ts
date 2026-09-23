import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitMarkReadoutContract } from './unit-mark-readout-contract';
import type { UnitMarkReadout } from './unit-mark-readout-contract';

export const UnitMarkReadoutStub = ({
  ...props
}: StubArgument<UnitMarkReadout> = {}): UnitMarkReadout =>
  unitMarkReadoutContract.parse({
    unitId: 'send-flow:observable:check-badge-count-text',
    mark: 'unmarked',
    ...props,
  });
