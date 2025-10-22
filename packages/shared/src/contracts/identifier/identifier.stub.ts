import { identifierContract } from './identifier-contract';
import type { Identifier } from './identifier-contract';

export const IdentifierStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'variableName',
  },
): Identifier => identifierContract.parse(value);
