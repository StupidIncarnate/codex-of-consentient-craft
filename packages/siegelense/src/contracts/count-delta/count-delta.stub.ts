import { countDeltaContract } from './count-delta-contract';
import type { CountDelta } from './count-delta-contract';

export const CountDeltaStub = ({ value }: { value: string } = { value: '+2' }): CountDelta =>
  countDeltaContract.parse(value);
