import { workPlanValidationCheckContract } from './work-plan-validation-check-contract';
import type { WorkPlanValidationCheck } from './work-plan-validation-check-contract';

export const WorkPlanValidationCheckStub = (
  { value }: { value: number } = { value: 1 },
): WorkPlanValidationCheck => workPlanValidationCheckContract.parse(value);
