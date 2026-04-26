import { normalizedLineContract } from './normalized-line-contract';
import type { NormalizedLine } from './normalized-line-contract';

export const NormalizedLineStub = (
  { value }: { value: unknown } = { value: { type: 'assistant' } },
): NormalizedLine => normalizedLineContract.parse(value);
