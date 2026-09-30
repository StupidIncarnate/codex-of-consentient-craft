import type { SiegeInstance } from '../siege-instance/siege-instance-contract';
import { siegeInstanceContract } from '../siege-instance/siege-instance-contract';

export const SiegeInstanceIdStub = (
  { value }: { value: string } = { value: 'inst_7f3a9c21' },
): SiegeInstance['id'] => siegeInstanceContract.shape.id.parse(value);
