import { runIdContract } from './run-id-contract';
import type { RunId } from './run-id-contract';

export const RunIdStub = ({ value }: { value: string } = { value: '1739625600000-a3f1' }): RunId =>
  runIdContract.parse(value);
