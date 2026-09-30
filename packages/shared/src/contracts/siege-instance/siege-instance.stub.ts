import type { StubArgument } from '../../@types/stub-argument.type';

import { siegeInstanceContract } from './siege-instance-contract';
import type { SiegeInstance } from './siege-instance-contract';

export const SiegeInstanceStub = ({ ...props }: StubArgument<SiegeInstance> = {}): SiegeInstance =>
  siegeInstanceContract.parse({
    id: 'inst_7f3a9c21',
    ...props,
  });
