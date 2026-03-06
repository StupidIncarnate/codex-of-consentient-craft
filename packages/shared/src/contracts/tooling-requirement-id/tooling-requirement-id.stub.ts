import { toolingRequirementIdContract } from './tooling-requirement-id-contract';
import type { ToolingRequirementId } from './tooling-requirement-id-contract';

export const ToolingRequirementIdStub = (
  { value }: { value: string } = { value: 'pg-driver' },
): ToolingRequirementId => toolingRequirementIdContract.parse(value);
