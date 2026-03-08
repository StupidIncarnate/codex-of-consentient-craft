import { dependencyLabelContract } from './dependency-label-contract';
import type { DependencyLabel } from './dependency-label-contract';

export const DependencyLabelStub = ({ value }: { value?: string } = {}): DependencyLabel =>
  dependencyLabelContract.parse(value ?? 'step-1');
