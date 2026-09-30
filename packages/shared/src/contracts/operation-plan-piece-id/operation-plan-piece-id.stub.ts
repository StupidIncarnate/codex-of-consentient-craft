import type { OperationPlanPiece } from '../operation-plan-piece/operation-plan-piece-contract';
import { operationPlanPieceContract } from '../operation-plan-piece/operation-plan-piece-contract';

export const OperationPlanPieceIdStub = (
  { value }: { value: string } = { value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' },
): OperationPlanPiece['id'] => operationPlanPieceContract.shape.id.parse(value);
