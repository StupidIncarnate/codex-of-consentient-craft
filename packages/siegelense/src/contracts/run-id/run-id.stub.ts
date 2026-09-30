import type { SiegeRun } from '@dungeonmaster/shared/contracts';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';

export const RunIdStub = ({ value }: { value: string } = { value: 'run_1' }): SiegeRun['id'] =>
  siegeRunContract.shape.id.parse(value);
