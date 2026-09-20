import { siegeRunIdContract } from './siege-run-id-contract';
import type { SiegeRunId } from './siege-run-id-contract';

export const SiegeRunIdStub = ({ value }: { value: string } = { value: 'run_2' }): SiegeRunId =>
  siegeRunIdContract.parse(value);
