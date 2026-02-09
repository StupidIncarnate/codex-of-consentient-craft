import { maxIterationsContract } from './max-iterations-contract';

type MaxIterations = ReturnType<typeof maxIterationsContract.parse>;

export const MaxIterationsStub = ({ value }: { value?: number } = {}): MaxIterations =>
  maxIterationsContract.parse(value ?? 5);
