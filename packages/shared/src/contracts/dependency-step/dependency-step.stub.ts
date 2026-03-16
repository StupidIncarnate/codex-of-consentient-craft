import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dependencyStepContract } from './dependency-step-contract';
import type { DependencyStep } from './dependency-step-contract';

export const DependencyStepStub = ({
  ...props
}: StubArgument<DependencyStep> = {}): DependencyStep =>
  dependencyStepContract.parse({
    id: 'create-login-api',
    name: 'Test Step',
    description: 'A test dependency step',
    observablesSatisfied: [],
    dependsOn: [],
    filesToCreate: [],
    filesToModify: [],
    inputContracts: [],
    outputContracts: [],
    ...props,
  });
