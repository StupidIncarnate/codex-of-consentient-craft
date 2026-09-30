/**
 * PURPOSE: Builds a valid DependencyGraphTopologicalOrder for tests
 *
 * USAGE:
 * DependencyGraphTopologicalOrderStub();
 * // Returns a valid DependencyGraphTopologicalOrder
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dependencyGraphTopologicalOrderContract } from './dependency-graph-topological-order-contract';
import type { DependencyGraphTopologicalOrder } from './dependency-graph-topological-order-contract';

export const DependencyGraphTopologicalOrderStub = ({
  ...props
}: StubArgument<DependencyGraphTopologicalOrder> = {}): DependencyGraphTopologicalOrder =>
  dependencyGraphTopologicalOrderContract.parse({ order: [], cycle: [], ...props });
