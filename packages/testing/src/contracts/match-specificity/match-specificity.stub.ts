import { matchSpecificityContract } from './match-specificity-contract';
import type { MatchSpecificity } from './match-specificity-contract';

export const MatchSpecificityStub = (
  { value }: { value: number } = { value: 1 },
): MatchSpecificity => matchSpecificityContract.parse(value);
