import { typeNameContract } from './type-name-contract';
import type { TypeName } from './type-name-contract';

export const TypeNameStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'string',
  },
): TypeName => typeNameContract.parse(value);
