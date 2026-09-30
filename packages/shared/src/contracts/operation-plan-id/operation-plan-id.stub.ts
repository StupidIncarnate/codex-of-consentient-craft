import type { OperationPlan } from '../operation-plan/operation-plan-contract';
import { operationPlanContract } from '../operation-plan/operation-plan-contract';

export const OperationPlanIdStub = (
  { value }: { value: string } = { value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' },
): OperationPlan['id'] => {
  const idContract = operationPlanContract.shape.id;
  return idContract.parse(value);
};
