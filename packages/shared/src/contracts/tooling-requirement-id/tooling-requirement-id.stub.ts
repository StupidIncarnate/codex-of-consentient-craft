import type { ToolingRequirement } from '../tooling-requirement/tooling-requirement-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';

const toolingRequirementIdContract = toolingRequirementContract.shape.id;

export const ToolingRequirementIdStub = (
  { value }: { value: string } = { value: 'pg-driver' },
): ToolingRequirement['id'] => toolingRequirementIdContract.parse(value);
