import type { SiegeRun } from '../siege-run/siege-run-contract';
import { siegeRunContract } from '../siege-run/siege-run-contract';

export const SiegeRunIdStub = ({ value }: { value: string } = { value: 'run_2' }): SiegeRun['id'] =>
  siegeRunContract.shape.id.parse(value);
