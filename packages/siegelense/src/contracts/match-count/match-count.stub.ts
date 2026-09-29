import { matchCountContract } from './match-count-contract';
import type { MatchCount } from './match-count-contract';

export const MatchCountStub = ({ value }: { value: number } = { value: 0 }): MatchCount =>
  matchCountContract.parse(value);
