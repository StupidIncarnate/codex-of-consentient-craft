import { globPatternContract } from './glob-pattern-contract';
import type { GlobPattern } from './glob-pattern-contract';

export const GlobPatternStub = ({ value }: { value: string } = { value: '**/*.ts' }): GlobPattern =>
  globPatternContract.parse(value);
