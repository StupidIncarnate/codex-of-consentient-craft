import { requirementIdContract } from './requirement-id-contract';
import type { RequirementId } from './requirement-id-contract';

export const RequirementIdStub = (
  { value }: { value: string } = { value: 'b12ac10b-58cc-4372-a567-0e02b2c3d479' },
): RequirementId => requirementIdContract.parse(value);
