import type { StubArgument } from '@dungeonmaster/shared/@types';

import { elementDeltaContract } from './element-delta-contract';
import type { ElementDelta } from './element-delta-contract';

export const ElementDeltaStub = ({ ...props }: StubArgument<ElementDelta> = {}): ElementDelta =>
  elementDeltaContract.parse({
    appeared: [],
    disappeared: [],
    changed: [],
    ...props,
  });
