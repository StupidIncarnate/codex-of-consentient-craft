import type { StubArgument } from '../../@types/stub-argument.type';

import { siegeRunContract } from './siege-run-contract';
import type { SiegeRun } from './siege-run-contract';

export const SiegeRunStub = ({ ...props }: StubArgument<SiegeRun> = {}): SiegeRun =>
  siegeRunContract.parse({
    id: 'run_1',
    ...props,
  });
