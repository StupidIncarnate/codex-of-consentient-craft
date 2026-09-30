import type { ToolingRequirement } from '../tooling-requirement/tooling-requirement-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';

export const ToolingRequirementIdStub = (
  { value }: { value: string } = { value: 'pg-driver' },
): ToolingRequirement['id'] => toolingRequirementContract.shape.id.parse(value);
