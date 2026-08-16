import { operationPlanPieceIdContract } from './operation-plan-piece-id-contract';
import type { OperationPlanPieceId } from './operation-plan-piece-id-contract';

export const OperationPlanPieceIdStub = (
  { value }: { value: string } = { value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' },
): OperationPlanPieceId => operationPlanPieceIdContract.parse(value);
