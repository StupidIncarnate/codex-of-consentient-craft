/**
 * PURPOSE: Creates test data for SearchPattern contract
 *
 * USAGE:
 * const pattern = SearchPatternStub(); // Returns 'test-pattern'
 * const custom = SearchPatternStub({ value: 'DangerFun' });
 */
import { searchPatternContract } from './search-pattern-contract';
import type { SearchPattern } from './search-pattern-contract';

export const SearchPatternStub = (
  { value }: { value: string } = { value: 'test-pattern' },
): SearchPattern => searchPatternContract.parse(value);
