import { untilConsolePatternContract } from './until-console-pattern-contract';
import type { UntilConsolePattern } from './until-console-pattern-contract';

export const UntilConsolePatternStub = (
  { value }: { value: string } = { value: 'hydrated' },
): UntilConsolePattern => untilConsolePatternContract.parse(value);
