/**
 * PURPOSE: Builds a valid TsconfigDiscoverPatterns for tests
 *
 * USAGE:
 * TsconfigDiscoverPatternsStub();
 * // Returns a valid TsconfigDiscoverPatterns
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { tsconfigDiscoverPatternsContract } from './tsconfig-discover-patterns-contract';
import type { TsconfigDiscoverPatterns } from './tsconfig-discover-patterns-contract';

export const TsconfigDiscoverPatternsStub = ({
  ...props
}: StubArgument<TsconfigDiscoverPatterns> = {}): TsconfigDiscoverPatterns =>
  tsconfigDiscoverPatternsContract.parse({ patterns: [], exclude: [], ...props });
