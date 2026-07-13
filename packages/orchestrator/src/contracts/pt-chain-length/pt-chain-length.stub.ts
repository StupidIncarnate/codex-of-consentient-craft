import { ptChainLengthContract } from './pt-chain-length-contract';
import type { PtChainLength } from './pt-chain-length-contract';

export const PtChainLengthStub = ({ value }: { value: number } = { value: 1 }): PtChainLength =>
  ptChainLengthContract.parse(value);
