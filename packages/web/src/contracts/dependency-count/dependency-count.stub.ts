import { dependencyCountContract } from './dependency-count-contract';
import type { DependencyCount } from './dependency-count-contract';

export const DependencyCountStub = (
  { value }: { value?: number } = { value: 0 },
): DependencyCount => dependencyCountContract.parse(value ?? 0);
