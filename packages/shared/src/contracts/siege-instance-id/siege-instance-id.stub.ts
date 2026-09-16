import { siegeInstanceIdContract } from './siege-instance-id-contract';
import type { SiegeInstanceId } from './siege-instance-id-contract';

export const SiegeInstanceIdStub = (
  { value }: { value: string } = { value: 'inst_7f3a9c21' },
): SiegeInstanceId => siegeInstanceIdContract.parse(value);
