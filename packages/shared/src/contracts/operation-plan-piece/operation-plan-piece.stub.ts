import type { StubArgument } from '@dungeonmaster/shared/@types';

import { operationPlanPieceContract } from './operation-plan-piece-contract';
import type { OperationPlanPiece } from './operation-plan-piece-contract';

export const OperationPlanPieceStub = ({
  ...props
}: StubArgument<OperationPlanPiece> = {}): OperationPlanPiece =>
  operationPlanPieceContract.parse({
    id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
    title: 'Branded id contract',
    intent:
      'operationPlanPieceIdContract exists, is branded uuid, and round-trips through its stub',
    files: [],
    folderTypes: [],
    unitIds: [],
    dependsOn: [],
    status: 'pending',
    ...props,
  });
