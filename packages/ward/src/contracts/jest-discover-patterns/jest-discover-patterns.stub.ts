/**
 * PURPOSE: Builds a valid JestDiscoverPatterns for tests
 *
 * USAGE:
 * JestDiscoverPatternsStub();
 * // Returns a valid JestDiscoverPatterns
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { jestDiscoverPatternsContract } from './jest-discover-patterns-contract';
import type { JestDiscoverPatterns } from './jest-discover-patterns-contract';

export const JestDiscoverPatternsStub = ({
  ...props
}: StubArgument<JestDiscoverPatterns> = {}): JestDiscoverPatterns =>
  jestDiscoverPatternsContract.parse({ patterns: [], excludePatterns: [], ...props });
