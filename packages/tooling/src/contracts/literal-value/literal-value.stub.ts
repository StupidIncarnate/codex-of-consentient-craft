import { literalValueContract } from './literal-value-contract';
import type { LiteralValue } from './literal-value-contract';

export const LiteralValueStub = (
  { value }: { value: string } = { value: 'example-string' },
): LiteralValue => literalValueContract.parse(value);
