import { siegeRunContract } from '@dungeonmaster/shared/contracts';

type RunId = ReturnType<typeof siegeRunContract.shape.id.parse>;

const runIdContract = siegeRunContract.shape.id;

export const RunIdStub = ({ value }: { value: string } = { value: 'run_1' }): RunId =>
  runIdContract.parse(value);
