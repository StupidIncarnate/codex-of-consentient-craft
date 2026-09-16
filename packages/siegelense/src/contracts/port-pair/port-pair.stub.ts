import type { StubArgument } from '@dungeonmaster/shared/@types';

import { portPairContract } from './port-pair-contract';
import type { PortPair } from './port-pair-contract';

export const PortPairStub = ({ ...props }: StubArgument<PortPair> = {}): PortPair =>
  portPairContract.parse({
    api: 34_172,
    web: 34_173,
    ...props,
  });
