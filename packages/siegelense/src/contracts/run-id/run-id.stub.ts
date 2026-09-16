import { runIdContract, type RunId } from './run-id-contract';

export const RunIdStub = ({ value }: { value: string } = { value: 'run_1' }): RunId =>
  runIdContract.parse(value);
