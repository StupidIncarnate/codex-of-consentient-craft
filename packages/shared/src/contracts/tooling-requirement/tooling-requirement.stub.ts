import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolingRequirementContract } from './tooling-requirement-contract';
import type { ToolingRequirement } from './tooling-requirement-contract';

export const ToolingRequirementStub = ({
  ...props
}: StubArgument<ToolingRequirement> = {}): ToolingRequirement =>
  toolingRequirementContract.parse({
    id: 'pg-driver',
    name: 'Test Tool',
    packageName: 'test-package',
    reason: 'Test reason for tooling requirement',
    requiredByObservables: [],
    ...props,
  });
