import { refContract } from './ref-contract';
import type { Ref } from './ref-contract';

export const RefStub = ({ value }: { value: number } = { value: 23 }): Ref =>
  refContract.parse(value);
