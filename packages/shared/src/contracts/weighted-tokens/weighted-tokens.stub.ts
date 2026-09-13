import { weightedTokensContract } from './weighted-tokens-contract';
import type { WeightedTokens } from './weighted-tokens-contract';

export const WeightedTokensStub = (
  { value }: { value: number } = { value: 2_751_372_486 },
): WeightedTokens => weightedTokensContract.parse(value);
