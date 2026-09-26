/**
 * PURPOSE: Create stub TsconfigPathsMap instances for testing
 *
 * USAGE:
 * const paths = TsconfigPathsMapStub({'#gateway/npm/*': ['./packages/@gateway/npm/src/DOMAIN/index.ts']});
 * // Returns valid TsconfigPathsMap instance
 */

import { tsconfigPathsMapContract, type TsconfigPathsMap } from './tsconfig-paths-map-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TsconfigPathsMapStub = ({
  ...props
}: StubArgument<TsconfigPathsMap> = {}): TsconfigPathsMap =>
  tsconfigPathsMapContract.parse({
    '#gateway/npm/*': ['./packages/@gateway/npm/src/*/index.ts', './packages/@gateway/npm/src/*'],
    ...props,
  });
