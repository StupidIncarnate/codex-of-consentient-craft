import { operationPlanIdContract } from './operation-plan-id-contract';
import type { OperationPlanId } from './operation-plan-id-contract';

export const OperationPlanIdStub = (
  { value }: { value: string } = { value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' },
): OperationPlanId => operationPlanIdContract.parse(value);
