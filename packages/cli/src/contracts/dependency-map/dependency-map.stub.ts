/**
 * PURPOSE: Create stub DependencyMap instances for testing
 *
 * USAGE:
 * const deps = DependencyMapStub({typescript: '^5.8.3'});
 * // Returns valid DependencyMap instance
 */

import { dependencyMapContract, type DependencyMap } from './dependency-map-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const DependencyMapStub = ({ ...props }: StubArgument<DependencyMap> = {}): DependencyMap =>
  dependencyMapContract.parse({
    typescript: '^5.8.3',
    jest: '^30.0.4',
    ...props,
  });
