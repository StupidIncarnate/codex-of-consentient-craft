import { buildSequenceContract } from './build-sequence-contract';
import type { BuildSequence } from './build-sequence-contract';

export const BuildSequenceStub = ({ value }: { value: number } = { value: 0 }): BuildSequence =>
  buildSequenceContract.parse(value);
