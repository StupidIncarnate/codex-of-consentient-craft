import type { StubArgument } from '@dungeonmaster/shared/@types';

import { WorkPlanPieceStub } from '../work-plan-piece/work-plan-piece.stub';

import { workPlanBatchContract } from './work-plan-batch-contract';
import type { WorkPlanBatch } from './work-plan-batch-contract';

export const WorkPlanBatchStub = ({ ...props }: StubArgument<WorkPlanBatch> = {}): WorkPlanBatch =>
  workPlanBatchContract.parse({
    mode: 'parallel',
    pieces: [WorkPlanPieceStub()],
    ...props,
  });
