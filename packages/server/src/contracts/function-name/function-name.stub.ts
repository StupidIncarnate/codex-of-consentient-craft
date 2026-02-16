import { functionNameContract } from './function-name-contract';
import type { FunctionName } from './function-name-contract';

export const FunctionNameStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'exampleFunction',
  },
): FunctionName => functionNameContract.parse(value);
