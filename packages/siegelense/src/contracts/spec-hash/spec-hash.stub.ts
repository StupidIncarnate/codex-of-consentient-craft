import { specHashContract } from './spec-hash-contract';
import type { SpecHash } from './spec-hash-contract';

export const SpecHashStub = ({ value }: { value: string } = { value: 'a3f9c2e1' }): SpecHash =>
  specHashContract.parse(value);
