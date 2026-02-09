import { contractNameContract, type ContractName } from './contract-name-contract';

export const ContractNameStub = (
  { value }: { value: string } = { value: 'LoginCredentials' },
): ContractName => contractNameContract.parse(value);
