import { contractCountContract } from './contract-count-contract';
import type { ContractCount } from './contract-count-contract';

export const ContractCountStub = ({ value }: { value?: number } = {}): ContractCount =>
  contractCountContract.parse(value ?? 0);
