import { literalTypeContract } from './literal-type-contract';
import type { LiteralType } from './literal-type-contract';

export const LiteralTypeStub = (
  { value }: { value: 'string' | 'regex' } = { value: 'string' },
): LiteralType => literalTypeContract.parse(value);
