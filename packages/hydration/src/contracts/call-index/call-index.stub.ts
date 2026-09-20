import { callIndexContract } from './call-index-contract';
import type { CallIndex } from './call-index-contract';

export const CallIndexStub = ({ value }: { value: number } = { value: 0 }): CallIndex =>
  callIndexContract.parse(value);
