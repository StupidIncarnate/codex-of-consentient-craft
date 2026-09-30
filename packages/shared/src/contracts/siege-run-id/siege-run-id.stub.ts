import type { SiegeRun } from '../siege-run/siege-run-contract';
import { siegeRunContract } from '../siege-run/siege-run-contract';

const siegeRunIdContract = siegeRunContract.shape.id;

export const SiegeRunIdStub = ({ value }: { value: string } = { value: 'run_2' }): SiegeRun['id'] =>
  siegeRunIdContract.parse(value);
