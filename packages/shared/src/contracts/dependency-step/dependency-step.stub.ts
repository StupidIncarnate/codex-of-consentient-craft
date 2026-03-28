import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dependencyStepContract } from './dependency-step-contract';
import type { DependencyStep } from './dependency-step-contract';

export const DependencyStepStub = ({
  ...props
}: StubArgument<DependencyStep> = {}): DependencyStep =>
  dependencyStepContract.parse({
    id: 'create-login-api',
    name: 'Test Step',
    assertions: [
      {
        prefix: 'VALID',
        input: '{valid input}',
        expected: 'returns expected result',
      },
    ],
    observablesSatisfied: [],
    dependsOn: [],
    focusFile: {
      path: 'src/brokers/login/create/login-create-broker.ts',
      action: 'create',
    },
    accompanyingFiles: [
      {
        path: 'src/brokers/login/create/login-create-broker.test.ts',
        action: 'create',
      },
      {
        path: 'src/brokers/login/create/login-create-broker.proxy.ts',
        action: 'create',
      },
    ],
    inputContracts: ['Void'],
    outputContracts: ['Void'],
    uses: [],
    ...props,
  });
