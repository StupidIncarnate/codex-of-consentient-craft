import type { SiegeInstance } from '../siege-instance/siege-instance-contract';
import { siegeInstanceContract } from '../siege-instance/siege-instance-contract';

const siegeInstanceIdContract = siegeInstanceContract.shape.id;

export const SiegeInstanceIdStub = (
  { value }: { value: string } = { value: 'inst_7f3a9c21' },
): SiegeInstance['id'] => siegeInstanceIdContract.parse(value);
