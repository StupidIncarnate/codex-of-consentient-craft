import { parameterNameContract } from './parameter-name-contract';
import type { ParameterName } from './parameter-name-contract';

export const ParameterNameStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'destructured object',
  },
): ParameterName => parameterNameContract.parse(value);
