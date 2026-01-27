import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dependencyStepContract } from './dependency-step-contract';
import type { DependencyStep } from './dependency-step-contract';

export const DependencyStepStub = ({
  ...props
}: StubArgument<DependencyStep> = {}): DependencyStep =>
  dependencyStepContract.parse({
    id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
    name: 'Test Step',
    description: 'A test dependency step',
    observablesSatisfied: [],
    dependsOn: [],
    filesToCreate: [],
    filesToModify: [],
    status: 'pending',
    ...props,
  });
