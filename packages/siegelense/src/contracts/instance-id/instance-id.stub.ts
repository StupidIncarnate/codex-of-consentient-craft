import type { SiegeInstance } from '@dungeonmaster/shared/contracts';
import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';

export const InstanceIdStub = (
  { value }: { value: string } = { value: 'inst_7f3a9c21' },
): SiegeInstance['id'] => siegeInstanceContract.shape.id.parse(value);
