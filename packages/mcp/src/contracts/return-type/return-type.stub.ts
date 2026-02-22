import { returnTypeContract } from './return-type-contract';
import type { ReturnType } from './return-type-contract';

export const ReturnTypeStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'string',
  },
): ReturnType => returnTypeContract.parse(value);
