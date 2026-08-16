import type { StubArgument } from '@dungeonmaster/shared/@types';

import { operationPlanContract } from './operation-plan-contract';
import type { OperationPlan } from './operation-plan-contract';

export const OperationPlanStub = ({ ...props }: StubArgument<OperationPlan> = {}): OperationPlan =>
  operationPlanContract.parse({
    id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
    operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
    workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    round: 1,
    discipline: 'implementation',
    summary: 'The operation-plan-piece-id contract mirrors operation-item-id; no blockers found.',
    pieces: [],
    at: '2024-01-15T10:00:00.000Z',
    ...props,
  });
