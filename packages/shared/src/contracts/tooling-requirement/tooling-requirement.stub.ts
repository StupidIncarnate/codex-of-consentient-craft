import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolingRequirementContract } from './tooling-requirement-contract';
import type { ToolingRequirement } from './tooling-requirement-contract';

export const ToolingRequirementStub = ({
  ...props
}: StubArgument<ToolingRequirement> = {}): ToolingRequirement =>
  toolingRequirementContract.parse({
    id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
    name: 'Test Tool',
    packageName: 'test-package',
    reason: 'Test reason for tooling requirement',
    requiredByObservables: [],
    ...props,
  });
