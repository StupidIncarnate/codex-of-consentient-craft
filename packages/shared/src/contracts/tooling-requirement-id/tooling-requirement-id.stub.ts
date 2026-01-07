import { toolingRequirementIdContract } from './tooling-requirement-id-contract';
import type { ToolingRequirementId } from './tooling-requirement-id-contract';

export const ToolingRequirementIdStub = (
  { value }: { value: string } = { value: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a' },
): ToolingRequirementId => toolingRequirementIdContract.parse(value);
